import type {
  Signer,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Keypair, SystemProgram } from "@solana/web3.js";

import type { Provider } from "../index.js";
import { TransactionEnvelope } from "../index.js";

/**
 * Takes in a simulation result of a transaction and prints it in a cool table.
 * ```
 *    ┌─────┬───┬───┬───┬───────────┬──────┬─────┬──────┬───┐
 *    │index│iso│mar│cum│ programId │quota │used │ left │CPI│
 *    ├─────┼───┼───┼───┼───────────┼──────┼─────┼──────┼───┤
 *    │  0  │298│281│464│'ATokenG..'│200000│24270│175730│ 1 │
 *    │  1  │298│ 74│538│'ATokenG..'│178730│21270│157460│ 1 │
 *    │  2  │298│ 74│612│'ATokenG..'│157460│27277│130183│ 1 │
 *    │  3  │298│ 42│686│'ATokenG..'│130183│21270│108913│ 1 │
 *    │  4  │338│265│951│'qExampL..'│108913│76289│ 32624│ 3 │
 *    └─────┴───┴───┴───┴───────────┴──────┴─────┴──────┴───┘
 * ```
 *
 * - **index**: the array index of the instruction within the transaction
 * - **iso**: the isolated size of the instruction (marginal cost of only the instruction)
 * - **mar**: the marginal size cost of the instruction (when added to previous)
 * - **cum**: the cumulative size of the instructions up until that instruction
 * - **quota/used/left**: [BPF instruction compute unit info](https://docs.solana.com/developing/programming-model/runtime)
 * - **CPI**: [the maximum depth of CPI](https://docs.solana.com/developing/programming-model/calling-between-programs) (current limit in Solana is 4)
 *
 * Safe for browser usage. Can be conveniently run with txEnvelope.simulateTable()
 */
export const printTXTable = (
  tx: TransactionEnvelope,
  transactionLogs: string[],
  message: string,
) => {
  if (message && message !== "") {
    console.log(estimateTransactionSize(tx), message);
  } else {
    console.log("Transaction size:", estimateTransactionSize(tx));
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
        instruction,
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

export class TXSizeEstimationError extends Error {
  constructor(readonly underlyingError: unknown) {
    super(`could not estimate transaction size`);
    this.name = "TXSizeEstimationError";
  }
}

export class EstimatedTXTooBigError extends Error {
  constructor(
    readonly tx: Transaction,
    readonly size: number,
  ) {
    super(`Transaction too large`);
    this.name = "EstimatedTXTooBigError";
  }
}

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
  txEnvelope: TransactionEnvelope,
): number => {
  const result = txEnvelope.estimateSize();
  if ("size" in result) {
    return result.size;
  }
  if (result.error instanceof TXSizeEstimationError) {
    console.error(
      "Unknown error estimating transaction size",
      result.error.underlyingError,
    );
    return 9999;
  }
  return 8888;
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
  instruction: TransactionInstruction,
): number => {
  return marginalInstructionSize(
    randomProvider,
    [simpleInstruction()],
    instruction,
  );
};
const marginalInstructionSize = (
  randomProvider: Provider,
  previousInstructions: TransactionInstruction[],
  instruction: TransactionInstruction,
): number => {
  const previousTxSize = instructionsSize(
    randomProvider,
    previousInstructions.length ? previousInstructions : [simpleInstruction()],
  );

  const biggerTxSize = instructionsSize(randomProvider, [
    ...previousInstructions,
    instruction,
  ]);

  return biggerTxSize - previousTxSize;
};
const instructionsSize = (
  randomProvider: Provider,
  instructions: TransactionInstruction[],
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
