import type { Finality, TransactionSignature } from "@solana/web3.js";
import promiseRetry from "promise-retry";

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
  public async wait(
    commitment: Finality = "confirmed"
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
          retry(new Error("error"));
          return;
        }
        return new TransactionReceipt(this.provider, this.signature, result);
      },
      { retries: 5 }
    );
    if (!receipt) {
      throw new Error("transaction could not be confirmed");
    }
    return receipt;
  }
}
