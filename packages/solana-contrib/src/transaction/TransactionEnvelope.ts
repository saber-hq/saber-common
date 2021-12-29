import type {
  AccountMeta,
  Cluster,
  ConfirmOptions,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { printTXTable } from "..";

import type { Provider } from "../interfaces";
import type { PendingTransaction } from "./PendingTransaction";
import type { TransactionReceipt } from "./TransactionReceipt";

/**
 * Instruction that can be serialized to JSON.
 */
export interface SerializableInstruction {
  programId: string;
  keys: (Omit<AccountMeta, "pubkey"> & { publicKey: string })[];
  data: string;
}

/**
 * Stub of a recent blockhash that can be used to simulate transactions.
 */
export const RECENT_BLOCKHASH_STUB =
  "GfVcyD4kkTrj4bKc7WA9sZCin9JDbdT4Zkd3EittNR1W";

/**
 * Builds a transaction with a fake `recentBlockhash` and `feePayer` for the purpose
 * of simulating a sequence of instructions.
 *
 * @param cluster
 * @param ixs
 * @returns
 */
export const buildStubbedTransaction = (
  cluster: Cluster,
  ixs: TransactionInstruction[]
): Transaction => {
  const tx = new Transaction();
  tx.recentBlockhash = RECENT_BLOCKHASH_STUB;

  // random keys that have money in them
  tx.feePayer =
    cluster === "devnet"
      ? new PublicKey("A2jaCHPzD6346348JoEym2KFGX9A7uRBw6AhCdX7gTWP")
      : new PublicKey("9u9iZBWqGsp5hXBxkVZtBTuLSGNAG9gEQLgpuVw39ASg");
  tx.instructions = ixs;
  return tx;
};

/**
 * Serializes a {@link Transaction} to base64 format without checking signatures.
 * @param tx
 * @returns
 */
export const serializeToBase64Unchecked = (tx: Transaction): string =>
  tx
    .serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    .toString("base64");

/**
 * Generates a link for inspecting the contents of a transaction.
 *
 * @returns URL
 */
export const generateInspectLinkFromBase64 = (
  cluster: Cluster,
  base64TX: string
): string => {
  return `https://explorer.solana.com/tx/inspector?cluster=${cluster}&message=${encodeURIComponent(
    base64TX
  )}`;
};

/**
 * Generates a link for inspecting the contents of a transaction, not checking for
 * or requiring valid signatures.
 *
 * @returns URL
 */
export const generateUncheckedInspectLink = (
  cluster: Cluster,
  tx: Transaction
): string => {
  return generateInspectLinkFromBase64(cluster, serializeToBase64Unchecked(tx));
};

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
    opts?: ConfirmOptions
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(this.build(), this.signers, opts);
  }

  /**
   * Simulates the transaction, without validating signers.
   * @param opts
   * @returns
   */
  simulateUnchecked(
    opts?: ConfirmOptions
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(this.build(), undefined, opts);
  }

  /**
   * Simulates the transaction and prints  a fancy table in the console
   * @param opts
   * @returns
   */
  simulateTable(
    opts?: ConfirmOptions
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
  async send(opts?: ConfirmOptions): Promise<PendingTransaction> {
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
  async confirm(opts?: ConfirmOptions): Promise<TransactionReceipt> {
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
