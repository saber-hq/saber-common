import type {
  AccountMeta,
  Cluster,
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { Provider } from "../interfaces";
import type { PendingTransaction } from "./PendingTransaction";
import type { TransactionReceipt } from "./TransactionReceipt";

export interface SerializableInstruction {
  programId: string;
  keys: (Omit<AccountMeta, "pubkey"> & { publicKey: string })[];
  data: string;
}

/**
 * Contains a Transaction that is being built.
 */
export class TransactionEnvelope {
  constructor(
    public readonly provider: Provider,
    public readonly instructions: TransactionInstruction[],
    public readonly signers: Signer[] = []
  ) {}

  public addSigners(...signers: Signer[]): TransactionEnvelope {
    this.signers.push(...signers);
    return this;
  }

  /**
   * Builds a transaction from this envelope.
   */
  public build(): Transaction {
    return new Transaction().add(...this.instructions);
  }

  /**
   * Generates a link for inspecting the contents of this {@link TransactionEnvelope}.
   *
   * @returns URL
   */
  public generateInspectLink(cluster: Cluster = "mainnet-beta"): string {
    const t = this.build();
    t.recentBlockhash = "EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k"; // Some stub
    t.feePayer = this.provider.wallet.publicKey;
    const str = t.serializeMessage().toString("base64");
    return `https://explorer.solana.com/tx/inspector?cluster=${cluster}&message=${encodeURIComponent(
      str
    )}`;
  }

  /**
   * Simulates the transaction.
   * @param opts
   * @returns
   */
  public simulate(
    opts?: ConfirmOptions
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(this.build(), this.signers, opts);
  }

  /**
   * Sends the transaction without confirming it.
   * @param opts
   * @returns
   */
  public async send(opts?: ConfirmOptions): Promise<PendingTransaction> {
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
  public async confirm(opts?: ConfirmOptions): Promise<TransactionReceipt> {
    return (await this.send(opts)).wait();
  }

  /**
   * Combines the instructions/signers of the other envelope to create one large transaction.
   */
  public combine(other: TransactionEnvelope): TransactionEnvelope {
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
