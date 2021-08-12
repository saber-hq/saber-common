import type { TransactionSignature } from "@solana/web3.js";
import promiseRetry from "promise-retry";
import invariant from "tiny-invariant";

import type { Provider } from "../interfaces";
import { TransactionReceipt } from "../transaction";

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
