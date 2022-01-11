import type {
  Connection,
  Finality,
  TransactionSignature,
} from "@solana/web3.js";
import promiseRetry from "promise-retry";
import type { OperationOptions } from "retry";

import { TransactionReceipt } from "../transaction";

/**
 * Options for awaiting a transaction confirmation.
 */
export interface TransactionWaitOptions extends OperationOptions {
  /**
   * Commitment of the transaction. Defaults to `confirmed`.
   */
  readonly commitment?: Finality;
  /**
   * Whether or not to use websockets for awaiting confirmation. Defaults to `false`.
   */
  readonly useWebsocket?: boolean;
}

/**
 * Transaction which may or may not be confirmed.
 */
export class PendingTransaction {
  private _receipt: TransactionReceipt | null = null;

  constructor(
    readonly connection: Connection,
    readonly signature: TransactionSignature
  ) {}

  /**
   * Gets the transaction receipt, if it has already been fetched.
   *
   * You probably want the async version of this function, `wait`.
   */
  get receipt(): TransactionReceipt | null {
    return this._receipt;
  }

  /**
   * Waits for the confirmation of the transaction, via polling.
   * @returns
   */
  async wait({
    commitment = "confirmed",
    useWebsocket = false,
    ...retryOpts
  }: TransactionWaitOptions = {}): Promise<TransactionReceipt> {
    if (this._receipt) {
      return this._receipt;
    }
    if (useWebsocket) {
      await this.awaitSignatureConfirmation(commitment);
      return await this.pollForReceipt({ commitment });
    }
    return await this.pollForReceipt({ commitment, ...retryOpts });
  }

  /**
   * Fetches the TransactionReceipt via polling.
   * @returns
   */
  async pollForReceipt({
    commitment = "confirmed",
    ...retryOpts
  }: Omit<
    TransactionWaitOptions,
    "useWebsocket"
  > = {}): Promise<TransactionReceipt> {
    const receipt = await promiseRetry(
      async (retry) => {
        const result = await this.connection.getTransaction(this.signature, {
          commitment,
        });
        if (!result) {
          retry(new Error("Error fetching transaction"));
          return;
        }
        return new TransactionReceipt(this.signature, result);
      },
      {
        retries: 5,
        minTimeout: 500,
        ...retryOpts,
      }
    );
    if (!receipt) {
      throw new Error("transaction could not be confirmed");
    }
    this._receipt = receipt;
    return receipt;
  }

  /**
   * Awaits the confirmation of the transaction, via onSignature subscription.
   * @returns
   */
  async awaitSignatureConfirmation(
    commitment: Finality = "confirmed"
  ): Promise<TransactionSignature> {
    const { value } = await this.connection.confirmTransaction(
      this.signature,
      commitment
    );
    if (value.err) {
      throw value.err;
    }
    return this.signature;
  }
}
