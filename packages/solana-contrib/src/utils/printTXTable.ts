import type { Signer, TransactionInstruction } from "@solana/web3.js";
import { Keypair, SystemProgram } from "@solana/web3.js";

import type { Provider } from "..";
import { TransactionEnvelope } from "..";

/**
 * Takes in a simulation result of a transaction and prints it in a cool table.
 *
 * For details about how the table works, see documentation for expectTXTable
 * in @saberhq/chai-solana.
 *
 * This can be safely used in a browser since it is only parsing logs.
 * For usage, see expectTXTable.
 */
export const printTXTable = (
  tx: TransactionEnvelope,
  transactionLogs: string[],
  message: string
) => {
  if (message) {
    console.log();
    console.log(estimateTransactionSize(tx), message);
  }

  const computeUnitLogStack: string[] = [];
  const cpiLogStack: number[] = [];
  let currentIndex = -1;

  transactionLogs.forEach((line) => {
    if (line.includes(" invoke [1]")) {
      currentIndex++;
      cpiLogStack[currentIndex] = 0;
    }
    const cpiMatch = line.match(/ invoke \[(\d)\]/);
    if (cpiMatch && cpiMatch[1]) {
      const cur = cpiLogStack[currentIndex];
      cpiLogStack[currentIndex] =
        cur === undefined
          ? Number(cpiMatch[1]) - 1
          : Math.max(Number(cpiMatch[1]) - 1, cur);
    }

    const computeMatch = line.match(/consumed \d* of \d* compute units/);
    if (computeMatch && computeMatch[0]) {
      computeUnitLogStack[currentIndex] = computeMatch[0];
    }
  });

  const instructionTable: {
    iso: number;
    mar: number;
    cum: number;
    programId: string;
    quota: number | undefined;
    used: number | undefined;
    left: number | undefined;
    CPI: number | undefined;
  }[] = [];

  tx.instructions.forEach((instruction, i) => {
    const computeUnitLog = computeUnitLogStack[i];

    const computeUnitMatch = computeUnitLog?.match(/consumed (\d*) of (\d*)/);
    const [consumed, quota] = computeUnitMatch
      ?.slice(1, 3)
      .map((num) => parseInt(num, 10)) || [undefined, undefined];

    instructionTable.push({
      iso: isolatedInstructionSize(tx.provider, instruction),
      mar: marginalInstructionSize(
        tx.provider,
        tx.instructions.slice(0, i),
        instruction
      ),
      cum: instructionsSize(tx.provider, tx.instructions.slice(0, i + 1)),
      programId: instruction.programId.toBase58(),
      quota: quota ? quota : i === 0 ? 200000 : undefined,
      used: consumed,
      left: quota && consumed ? quota - consumed : undefined,
      CPI: cpiLogStack[i],
    });
  });

  console.table(instructionTable);
};

/**
 * Builds a transaction and estimates the size in bytes. This number is primrily
 * to be used for checking to see if a transaction is too big and instructions
 * need to be split. It may not be 100% accurate.
 *
 * This is used in expectTXTable and is useful for increasing efficiency in
 * dapps that build large transactions.
 *
 * The max transaction size of a v1 Transaction in Solana is 1232 bytes.
 * For info about Transaction v2: https://docs.solana.com/proposals/transactions-v2
 *
 * Returns 8888 if the transaction was too big.
 * Returns 9999 if the transaction was unable to be built.
 */
export const estimateTransactionSize = (
  txEnvelope: TransactionEnvelope
): number => {
  // Hide the console.error because txEnvelope.build() emits noisy errors as a
  // side effect. There are use cases of estimateTransactionSize where we
  // frequently build transactions that are likely too big.
  const oldConsoleError = console.error;
  console.error = () => {
    return;
  };
  try {
    const builtTx = txEnvelope.build();
    // dummy blockhash that is required for building the transaction
    builtTx.recentBlockhash = "MaryHadALittLeLambZNdhAUTrsLE1ydg6rmtvFEpKT";

    const fs = getFakeSigner();
    builtTx.feePayer = fs.publicKey;
    builtTx.sign(fs);

    try {
      const result = builtTx.serialize({ verifySignatures: false });
      console.error = oldConsoleError;
      return result.length;
    } catch (e) {
      console.error = oldConsoleError;
      // console.error(e);
      return 8888;
    }
  } catch (e) {
    console.error = oldConsoleError;
    console.error(e);
    return 9999;
  }
};

/**
 * A dummy instruction that is probably tiny and has overlap with most instructions
 */
const simpleInstruction = () => {
  const fs = getFakeSigner();

  return SystemProgram.transfer({
    fromPubkey: fs.publicKey,
    toPubkey: fs.publicKey,
    lamports: 1,
  });
};

const isolatedInstructionSize = (
  randomProvider: Provider,
  instruction: TransactionInstruction
): number => {
  return marginalInstructionSize(
    randomProvider,
    [simpleInstruction()],
    instruction
  );
};
const marginalInstructionSize = (
  randomProvider: Provider,
  previousInstructions: TransactionInstruction[],
  instruction: TransactionInstruction
): number => {
  const previousTxSize = instructionsSize(
    randomProvider,
    previousInstructions.length ? previousInstructions : [simpleInstruction()]
  );

  const biggerTxSize = instructionsSize(randomProvider, [
    ...previousInstructions,
    instruction,
  ]);

  return biggerTxSize - previousTxSize;
};
const instructionsSize = (
  randomProvider: Provider,
  instructions: TransactionInstruction[]
): number => {
  const instructionedTx = new TransactionEnvelope(randomProvider, [
    ...instructions,
  ]);

  return estimateTransactionSize(instructionedTx);
};

let fakeSigner: Signer | undefined = undefined;
const getFakeSigner = (): Signer => {
  if (!fakeSigner) {
    fakeSigner = Keypair.generate();
  }
  return fakeSigner;
};
