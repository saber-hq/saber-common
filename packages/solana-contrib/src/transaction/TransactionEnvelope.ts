import type {
  Cluster,
  ConfirmOptions,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { default as invariant } from "tiny-invariant";

import type { BroadcastOptions } from "../broadcaster/index.js";
import {
  requestComputeUnitsInstruction,
  requestHeapFrameInstruction,
} from "../computeBudget/index.js";
import type { Provider } from "../interfaces.js";
import {
  createMemoInstruction,
  EstimatedTXTooBigError,
  printTXTable,
  suppressConsoleError,
  TXSizeEstimationError,
} from "../utils/index.js";
import type { PendingTransaction } from "./PendingTransaction.js";
import type { TransactionReceipt } from "./TransactionReceipt.js";
import { calculateTxSizeUnsafe } from "./txSizer.js";
import type { SerializableInstruction } from "./utils.js";
import {
  generateInspectLinkFromBase64,
  RECENT_BLOCKHASH_STUB,
} from "./utils.js";

export const PACKET_DATA_SIZE = 1280 - 40 - 8;

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

/**
 * Filters the required signers for a list of instructions.
 * @param ixs
 * @returns
 */
const filterRequiredSigners = (
  ixs: TransactionInstruction[],
  signers: Signer[],
): Signer[] => {
  // filter out the signers required for the transaction
  const requiredSigners = ixs.flatMap((ix) =>
    ix.keys.filter((k) => k.isSigner).map((k) => k.pubkey),
  );
  return signers.filter((s) =>
    requiredSigners.find((rs) => rs.equals(s.publicKey)),
  );
};

/**
 * Options for simulating a transaction.
 */
export interface TXEnvelopeSimulateOptions extends ConfirmOptions {
  /**
   * Verify that the signers of the TX enveloper are valid.
   */
  verifySigners?: boolean;
}

/**
 * Contains a Transaction that is being built.
 */
export class TransactionEnvelope {
  constructor(
    /**
     * Provider that will be sending the transaction as the fee payer.
     */
    readonly provider: Provider,
    /**
     * Instructions associated with the transaction.
     */
    readonly instructions: TransactionInstruction[],
    /**
     * Optional signers of the transaction.
     */
    readonly signers: Signer[] = [],
  ) {}

  /**
   * Prepends the given {@link TransactionInstruction}s to the {@link TransactionEnvelope}.
   * @param instructions The instructions to prepend.
   * @returns
   */
  prepend(
    ...instructions: (TransactionInstruction | null | undefined | boolean)[]
  ): TransactionEnvelope {
    this.instructions.unshift(
      ...instructions.filter((ix): ix is TransactionInstruction => !!ix),
    );
    return this;
  }

  /**
   * Appends the given {@link TransactionInstruction}s to the {@link TransactionEnvelope}.
   * @param instructions The instructions to append.
   * @returns
   */
  append(
    ...instructions: (TransactionInstruction | null | undefined | boolean)[]
  ): TransactionEnvelope {
    this.instructions.push(
      ...instructions.filter((ix): ix is TransactionInstruction => !!ix),
    );
    return this;
  }

  /**
   * A the given {@link TransactionInstruction}s to the {@link TransactionEnvelope}.
   * @param instructions The instructions to add.
   * @deprecated Use {@link #append} instead.
   * @returns
   */
  addInstructions(
    ...instructions: (TransactionInstruction | null | undefined | boolean)[]
  ): TransactionEnvelope {
    return this.append(...instructions);
  }

  /**
   * Adds the given {@link Signer}s to the {@link TransactionEnvelope}.
   * @param signers The signers to add.
   * @returns
   */
  addSigners(...signers: Signer[]): TransactionEnvelope {
    this.signers.push(...signers);
    return this;
  }

  /**
   * Builds a transaction from this envelope.
   * @param feePayer Optional override for the fee payer.
   */
  build(feePayer: PublicKey = this.provider.wallet.publicKey): Transaction {
    const tx = new Transaction().add(...this.instructions);
    tx.feePayer = feePayer;
    return tx;
  }

  /**
   * Builds a transaction and estimates the size in bytes.
   * Does not check to see if the transaction is too big.
   *
   * @returns Byte count
   */
  estimateSizeUnsafe(): number {
    const builtTx = this.build();
    // dummy blockhash that is required for building the transaction
    builtTx.recentBlockhash = "MaryHadALittLeLambZNdhAUTrsLE1ydg6rmtvFEpKT";

    return calculateTxSizeUnsafe(builtTx);
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
   */
  estimateSize():
    | { size: number }
    | {
        error: EstimatedTXTooBigError | TXSizeEstimationError;
      } {
    return suppressConsoleError(() => {
      try {
        const builtTx = this.build();
        // dummy blockhash that is required for building the transaction
        builtTx.recentBlockhash = "MaryHadALittLeLambZNdhAUTrsLE1ydg6rmtvFEpKT";

        const size = calculateTxSizeUnsafe(builtTx);
        if (size > PACKET_DATA_SIZE) {
          return { error: new EstimatedTXTooBigError(builtTx, size) };
        }
        return { size };
      } catch (e) {
        return { error: new TXSizeEstimationError(e) };
      }
    });
  }

  /**
   * Partition a large {@link TransactionEnvelope} into smaller, valid {@link Transaction}s.
   * This relies on this envelope already having the correct number of signers.
   *
   * @param feePayer Optional fee payer override.
   * @returns A list of {@link Transaction}s.
   */
  buildPartition(
    feePayer: PublicKey = this.provider.wallet.publicKey,
  ): Transaction[] {
    const partition = this.partition();
    return partition.map((env) => env.build(feePayer));
  }

  /**
   * Partition a large {@link TransactionEnvelope} into smaller, valid transaction envelopes which can be built.
   * This relies on this envelope already having the correct number of signers.
   *
   * @returns
   */
  partition(): TransactionEnvelope[] {
    const estimation = this.estimateSize();
    if ("size" in estimation) {
      return [this];
    }

    // empty partition should have no envelopes
    if (this.instructions.length === 0) {
      return [];
    }

    let lastTXEnv: TransactionEnvelope = new TransactionEnvelope(
      this.provider,
      this.instructions.slice(0, 1),
      this._filterRequiredSigners(this.instructions.slice(0, 1)),
    );
    let lastEstimation: number = lastTXEnv.estimateSizeUnsafe();
    const txs: TransactionEnvelope[] = [];
    this.instructions.slice(1).forEach((ix, i) => {
      if (lastEstimation > PACKET_DATA_SIZE) {
        throw new Error(
          `cannot construct a valid partition: instruction ${i} is too large (${lastEstimation} > ${PACKET_DATA_SIZE})`,
        );
      }
      const nextIXs = [...lastTXEnv.instructions, ix];
      const nextSigners = this._filterRequiredSigners(nextIXs);
      const nextTXEnv = new TransactionEnvelope(
        this.provider,
        nextIXs,
        nextSigners,
      );
      const nextEstimation = nextTXEnv.estimateSizeUnsafe();

      // move to next tx envelope if too big
      if (nextEstimation > PACKET_DATA_SIZE) {
        txs.push(lastTXEnv);
        const nextIXs = [ix];
        lastTXEnv = new TransactionEnvelope(
          this.provider,
          nextIXs,
          this._filterRequiredSigners(nextIXs),
        );
        lastEstimation = lastTXEnv.estimateSizeUnsafe();
      } else {
        lastTXEnv = nextTXEnv;
        lastEstimation = nextEstimation;
      }
    });
    txs.push(lastTXEnv);

    return txs;
  }

  /**
   * Filters the required signers for a list of instructions.
   * @param ixs
   * @returns
   */
  private _filterRequiredSigners(ixs: TransactionInstruction[]): Signer[] {
    return filterRequiredSigners(ixs, this.signers);
  }

  /**
   * Generates a link for inspecting the contents of this {@link TransactionEnvelope}.
   *
   * @returns URL
   */
  generateInspectLink(cluster: Cluster = "mainnet-beta"): string {
    const t = this.build();
    t.recentBlockhash = RECENT_BLOCKHASH_STUB;
    const str = t.serializeMessage().toString("base64");
    return generateInspectLinkFromBase64(cluster, str);
  }

  /**
   * Simulates the transaction.
   * @param opts
   * @returns
   */
  simulate(
    opts: TXEnvelopeSimulateOptions = {
      verifySigners: true,
    },
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(
      this.build(),
      opts.verifySigners ? this.signers : undefined,
      opts,
    );
  }

  /**
   * Simulates the transaction, without validating signers.
   *
   * @deprecated Use {@link TXEnvelope#simulate} instead.
   * @param opts
   * @returns
   */
  simulateUnchecked(
    opts: ConfirmOptions,
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.simulate({ ...opts, verifySigners: false });
  }

  /**
   * Simulates the transaction and prints a fancy table in the console.
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
   * @param opts
   * @returns
   */
  simulateTable(
    opts?: TXEnvelopeSimulateOptions,
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.simulate(opts).then((simulation) => {
      if (simulation?.value?.logs) {
        printTXTable(this, simulation.value.logs, "");
      }
      return simulation;
    });
  }

  /**
   * Sends the transaction without confirming it.
   * @param opts
   * @returns
   */
  async send(opts?: BroadcastOptions): Promise<PendingTransaction> {
    const signed = await this.provider.signer.sign(
      this.build(),
      this.signers,
      opts,
    );
    return this.provider.broadcaster.broadcast(signed, opts);
  }

  /**
   * Sends the transaction and waits for confirmation.
   * @param opts
   */
  async confirm(opts?: BroadcastOptions): Promise<TransactionReceipt> {
    return (await this.send(opts)).wait();
  }

  /**
   * Combines the instructions/signers of the other envelope to create one large transaction.
   */
  combine(other: TransactionEnvelope): TransactionEnvelope {
    return new TransactionEnvelope(
      this.provider,
      [...this.instructions, ...other.instructions],
      [...this.signers, ...other.signers],
    );
  }

  /**
   * Get a list of all writable accounts, deduped
   * All of these accounts likely need to be updated after the transaction is confirmed.
   */
  get writableKeys(): PublicKey[] {
    return [
      ...new Set([
        ...this.instructions
          .map((inst) =>
            inst.keys.filter((key) => key.isWritable).map((k) => k.pubkey),
          )
          .reduce((acc, el) => acc.concat(el)),
      ]).values(),
    ];
  }

  /**
   * Gets the instructions in a format that can be serialized easily to JSON.
   */
  get instructionsJSON(): SerializableInstruction[] {
    return this.instructions.map((instruction) => ({
      programId: instruction.programId.toString(),
      keys: instruction.keys.map((m) => ({
        isSigner: m.isSigner,
        isWritable: m.isWritable,
        publicKey: m.pubkey.toString(),
      })),
      data: instruction.data.toString("base64"),
    }));
  }

  /**
   * Returns a string representation of the {@link TransactionEnvelope}.
   */
  get debugStr(): string {
    return [
      "=> Instructions",
      this.instructions
        .map((ser, i) => {
          return [
            `Instruction ${i}: ${ser.programId.toString()}`,
            ...ser.keys.map(
              (k, i) =>
                `  [${i}] ${k.pubkey.toString()} ${
                  k.isWritable ? "(mut)" : ""
                } ${k.isSigner ? "(signer)" : ""}`,
            ),
            `  Data (base64): ${ser.data.toString("base64")}`,
          ].join("\n");
        })
        .join("\n"),
      "=> Signers",
      this.signers.map((sg) => sg.publicKey.toString()).join("\n"),
    ].join("\n");
  }

  /**
   * Creates a new {@link TransactionEnvelope}.
   * @param provider
   * @param instructions
   * @param signers
   * @returns
   */
  static create(
    provider: Provider,
    instructions: (TransactionInstruction | null | undefined | boolean)[],
    signers: Signer[] = [],
  ): TransactionEnvelope {
    const ixs = instructions.filter((ix): ix is TransactionInstruction => !!ix);
    return new TransactionEnvelope(provider, ixs, signers);
  }

  /**
   * Add a memo to each transaction envelope specified.
   */
  static addMemos(
    memo: string,
    ...txs: TransactionEnvelope[]
  ): TransactionEnvelope[] {
    return txs.map((tx) => tx.addMemo(memo));
  }

  /**
   * Combines multiple TransactionEnvelopes into one.
   */
  static combineAll(...txs: TransactionEnvelope[]): TransactionEnvelope {
    return txs.reduce((acc, tx) => acc.combine(tx));
  }

  /**
   * Takes a list of {@link TransactionEnvelope}s and combines them if they
   * are able to be combined under the maximum TX size limit.
   *
   * @param txs
   * @returns
   */
  static pack(...txs: readonly TransactionEnvelope[]): TransactionEnvelope[] {
    if (txs.length === 0) {
      return [];
    }
    const [first, ...rest] = txs;
    invariant(first);

    const { provider } = first;

    let lastTXEnv: TransactionEnvelope = first;
    let lastEstimation: number = lastTXEnv.estimateSizeUnsafe();
    const partition: TransactionEnvelope[] = [];

    rest.forEach((addedTX, i) => {
      if (lastEstimation > PACKET_DATA_SIZE) {
        throw new Error(
          `cannot construct a valid partition: instruction ${i} is too large (${lastEstimation} > ${PACKET_DATA_SIZE})`,
        );
      }
      const nextIXs = [...lastTXEnv.instructions, ...addedTX.instructions];
      const nextSigners = filterRequiredSigners(nextIXs, [
        ...lastTXEnv.signers,
        ...addedTX.signers,
      ]);
      const nextTXEnv = new TransactionEnvelope(provider, nextIXs, nextSigners);
      const nextEstimation = nextTXEnv.estimateSizeUnsafe();

      // move to next tx envelope if too big
      if (nextEstimation > PACKET_DATA_SIZE) {
        partition.push(lastTXEnv);
        lastTXEnv = addedTX;
        lastEstimation = lastTXEnv.estimateSizeUnsafe();
      } else {
        lastTXEnv = nextTXEnv;
        lastEstimation = nextEstimation;
      }
    });
    partition.push(lastTXEnv);

    return partition;
  }

  /**
   * Combines multiple async TransactionEnvelopes into one, serially.
   */
  static async combineAllAsync(
    firstTX: Promise<TransactionEnvelope>,
    ...txs: Promise<TransactionEnvelope>[]
  ): Promise<TransactionEnvelope> {
    let acc: TransactionEnvelope = await firstTX;
    for (const tx of txs) {
      acc = acc.combine(await tx);
    }
    return acc;
  }

  /**
   * Sends all of the envelopes.
   * @returns Pending transactions
   */
  static async sendAll(
    txs: TransactionEnvelope[],
    opts?: ConfirmOptions,
  ): Promise<PendingTransaction[]> {
    const firstTX = txs[0];
    if (!firstTX) {
      return [];
    }
    const provider = firstTX.provider;
    return await provider.sendAll(
      txs.map((tx) => ({ tx: tx.build(), signers: tx.signers })),
      opts,
    );
  }

  /**
   * Deduplicate ATA instructions inside the transaction envelope.
   */
  dedupeATAIXs(): TransactionEnvelope {
    if (this.instructions.length === 0) {
      return this;
    }

    const seenATAs = new Set<string>();
    const instructions = this.instructions
      .map((ix) => {
        const programId = ix.programId;
        if (programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
          const ataKey = ix.keys[1]?.pubkey.toString();
          if (!ataKey) {
            throw new Error("ATA key does not exist on ATA instruction");
          }
          if (seenATAs.has(ataKey)) {
            return null;
          }
          seenATAs.add(ataKey);
        }
        return ix;
      })
      .filter((ix): ix is TransactionInstruction => !!ix);
    return new TransactionEnvelope(this.provider, instructions, this.signers);
  }

  /**
   * Split out ATA instructions to a separate transaction envelope.
   */
  splitATAIXs(): {
    ataIXs: TransactionEnvelope;
    tx: TransactionEnvelope;
  } {
    const ataIXs = new TransactionEnvelope(this.provider, [], this.signers);
    const newTx = new TransactionEnvelope(this.provider, [], this.signers);

    for (const ix of this.instructions) {
      if (ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
        ataIXs.instructions.push(ix);
      } else {
        newTx.instructions.push(ix);
      }
    }

    return {
      ataIXs: ataIXs.dedupeATAIXs(),
      tx: newTx,
    };
  }

  /**
   * Get an instruction from the transaction envelope by index.
   */
  getInstruction(index: number): TransactionInstruction {
    const ix = this.instructions[index];
    if (!ix) {
      throw new Error(`No instruction found at index ${index}`);
    }
    return ix;
  }

  /**
   * Attach a memo instruction to this transaction.
   */
  addMemo(memo: string): TransactionEnvelope {
    this.instructions.push(createMemoInstruction(memo));
    return this;
  }

  /**
   * Request for additional compute units before processing this transaction.
   */
  addAdditionalComputeBudget(
    units: number,
    additionalFee: number,
  ): TransactionEnvelope {
    this.instructions.unshift(
      requestComputeUnitsInstruction(units, additionalFee),
    );
    return this;
  }

  /**
   * Request a specific transaction-wide program heap region size in bytes.
   */
  addAdditionalHeapFrame(bytes: number): TransactionEnvelope {
    this.instructions.unshift(requestHeapFrameInstruction(bytes));
    return this;
  }
}
