import {
  ConfirmOptions,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionResponse,
  TransactionSignature,
} from "@solana/web3.js";
import promiseRetry from "promise-retry";
import invariant from "tiny-invariant";

import { Event, EventParser, Provider } from "./interfaces";

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
}

/**
 * Transaction which may or may not be confirmed.
 */
export class PendingTransaction {
  receipt: TransactionReceipt | null = null;

  constructor(
    public readonly provider: Provider,
    public readonly signature: TransactionSignature
  ) {}

  /**
   * Waits for the confirmation of the transaction.
   * @returns
   */
  public async wait(): Promise<TransactionReceipt> {
    if (this.receipt) {
      return this.receipt;
    }
    const receipt = await promiseRetry(
      async (retry) => {
        const result = await this.provider.connection.getTransaction(
          this.signature,
          {
            commitment: "confirmed",
          }
        );
        if (!result) {
          retry(new Error("error"));
          return;
        }
        return new TransactionReceipt(this.provider, this.signature, result);
      },
      { retries: 5 }
    );
    invariant(receipt, "transaction could not be confirmed");
    return receipt;
  }
}

/**
 * A transaction that has been processed by the cluster.
 */
export class TransactionReceipt {
  constructor(
    /**
     * Current provider.
     */
    public readonly provider: Provider,
    /**
     * Signature (id) of the transaction.
     */
    public readonly signature: string,
    /**
     * Raw response from web3.js
     */
    public readonly response: TransactionResponse
  ) {}

  /**
   * Gets the events associated with this transaction.
   */
  public getEvents<E extends Event>(eventParser: EventParser<E>): readonly E[] {
    const logs = this.response.meta?.logMessages;
    if (logs && logs.length > 0) {
      return eventParser(logs);
    }
    return [];
  }

  /**
   * Prints the logs associated with this transaction.
   */
  public printLogs(): void {
    console.log(this.response.meta?.logMessages?.join("\n"));
  }

  /**
   * Gets the compute units used by the transaction.
   * @returns
   */
  public get computeUnits(): number {
    const logs = this.response.meta?.logMessages;
    invariant(logs, "no logs");
    const consumeLog = logs[logs.length - 2];
    invariant(consumeLog, "no consume log");
    const amtStr = consumeLog.split(" ")[3];
    invariant(amtStr, "no amount");
    return parseInt(amtStr);
  }
}
