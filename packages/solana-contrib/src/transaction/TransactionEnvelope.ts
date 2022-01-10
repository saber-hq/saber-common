import type {
  Cluster,
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { BroadcastOptions } from "..";
import { printTXTable } from "..";
import type { Provider } from "../interfaces";
import type { PendingTransaction } from "./PendingTransaction";
import type { TransactionReceipt } from "./TransactionReceipt";
import type { SerializableInstruction } from "./utils";
import { generateInspectLinkFromBase64, RECENT_BLOCKHASH_STUB } from "./utils";

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
    readonly signers: Signer[] = []
  ) {}

  /**
   * Adds the given {@link TransactionInstruction}s to the {@link TransactionEnvelope}.
   * @param instructions The instructions to add.
   * @returns
   */
  addInstructions(
    ...instructions: (TransactionInstruction | null | undefined | boolean)[]
  ): TransactionEnvelope {
    this.instructions.push(
      ...instructions.filter((ix): ix is TransactionInstruction => !!ix)
    );
    return this;
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
    }
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(
      this.build(),
      opts.verifySigners ? this.signers : undefined,
      opts
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
    opts: ConfirmOptions
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
    opts?: TXEnvelopeSimulateOptions
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
      opts
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
      [...this.signers, ...other.signers]
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
            inst.keys.filter((key) => key.isWritable).map((k) => k.pubkey)
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
                } ${k.isSigner ? "(signer)" : ""}`
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
    signers: Signer[] = []
  ): TransactionEnvelope {
    const ixs = instructions.filter((ix): ix is TransactionInstruction => !!ix);
    return new TransactionEnvelope(provider, ixs, signers);
  }

  /**
   * Combines multiple TransactionEnvelopes into one.
   */
  static combineAll(...txs: TransactionEnvelope[]): TransactionEnvelope {
    return txs.reduce((acc, tx) => acc.combine(tx));
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
    opts?: ConfirmOptions
  ): Promise<PendingTransaction[]> {
    const firstTX = txs[0];
    if (!firstTX) {
      return [];
    }
    const provider = firstTX.provider;
    return await provider.sendAll(
      txs.map((tx) => ({ tx: tx.build(), signers: tx.signers })),
      opts
    );
  }
}
