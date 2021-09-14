import type { Finality, TransactionSignature } from "@solana/web3.js";
import promiseRetry from "promise-retry";
import type { OperationOptions } from "retry";

import type { ReadonlyProvider } from "../interfaces";
import { TransactionReceipt } from "../transaction";

/**
 * Transaction which may or may not be confirmed.
 */
export class PendingTransaction {
  private _receipt: TransactionReceipt | null = null;

  constructor(
    public readonly provider: ReadonlyProvider,
    public readonly signature: TransactionSignature
  ) {}

  get receipt(): TransactionReceipt | null {
    return this._receipt;
  }

  /**
   * Waits for the confirmation of the transaction, via polling.
   * @returns
   */
  public async wait(
    {
      commitment = "confirmed",
      ...retryOpts
    }: OperationOptions & {
      commitment: Finality;
    } = {
      commitment: "confirmed",
    }
  ): Promise<TransactionReceipt> {
    if (this._receipt) {
      return this._receipt;
    }
    const receipt = await promiseRetry(
      async (retry) => {
        const result = await this.provider.connection.getTransaction(
          this.signature,
          {
            commitment,
          }
        );
        if (!result) {
          retry(new Error("Error fetching transaction"));
          return;
        }
        return new TransactionReceipt(this.provider, this.signature, result);
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
}
