import type {
  AccountMeta,
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { Provider } from "../interfaces";
import { PendingTransaction } from "./PendingTransaction";
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
   * Sends the transaction.
   * @param opts
   * @returns
   */
  public async send(opts?: ConfirmOptions): Promise<PendingTransaction> {
    const sig = await this.provider.send(this.build(), this.signers, opts);
    return new PendingTransaction(this.provider, sig);
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
   * Combines multiple TransactionEnvelopes into one.
   */
  static combineAll(...txs: TransactionEnvelope[]): TransactionEnvelope {
    return txs.reduce((acc, tx) => acc.combine(tx));
  }
}
