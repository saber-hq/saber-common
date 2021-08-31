import type { Finality, TransactionSignature } from "@solana/web3.js";
import promiseRetry from "promise-retry";
import type { OperationOptions } from "retry";

import type { ReadonlyProvider } from "../interfaces";
import { TransactionReceipt } from "../transaction";

/**
 * Transaction which may or may not be confirmed.
 */
export class PendingTransaction {
  receipt: TransactionReceipt | null = null;

  constructor(
    public readonly provider: ReadonlyProvider,
    public readonly signature: TransactionSignature
  ) {}

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
    if (this.receipt) {
      return this.receipt;
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
    return receipt;
  }
}
