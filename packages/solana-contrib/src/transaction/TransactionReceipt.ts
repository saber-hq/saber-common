import type {
  TransactionResponse,
  TransactionSignature,
} from "@solana/web3.js";
import invariant from "tiny-invariant";

import type { Event, EventParser } from "../interfaces";

/**
 * A transaction that has been processed by the cluster.
 */
export class TransactionReceipt {
  constructor(
    /**
     * Signature (id) of the transaction.
     */
    readonly signature: TransactionSignature,
    /**
     * Raw response from web3.js
     */
    readonly response: TransactionResponse
  ) {}

  /**
   * Gets the events associated with this transaction.
   */
  getEvents<E extends Event>(eventParser: EventParser<E>): readonly E[] {
    const logs = this.response.meta?.logMessages;
    if (logs && logs.length > 0) {
      return eventParser(logs);
    }
    return [];
  }

  /**
   * Prints the logs associated with this transaction.
   */
  printLogs(): void {
    console.log(this.response.meta?.logMessages?.join("\n"));
  }

  /**
   * Gets the compute units used by the transaction.
   * @returns
   */
  get computeUnits(): number {
    const logs = this.response.meta?.logMessages;
    invariant(logs, "no logs");
    const consumeLog = logs[logs.length - 2];
    invariant(consumeLog, "no consume log");
    const amtStr = consumeLog.split(" ")[3];
    invariant(amtStr, "no amount");
    return parseInt(amtStr);
  }
}
