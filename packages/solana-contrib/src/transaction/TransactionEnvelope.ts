import type {
  ConfirmOptions,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  TransactionInstruction,
} from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { Provider } from "../interfaces";
import { PendingTransaction } from "./PendingTransaction";
import type { TransactionReceipt } from "./TransactionReceipt";

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
}
