import type {
  Cluster,
  TransactionResponse,
  TransactionSignature,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { default as invariant } from "tiny-invariant";

import type { Event, EventParser } from "../interfaces.js";
import type { PromiseOrValue } from "../utils/misc.js";
import { valueAsPromise } from "../utils/misc.js";
import { generateTXLink } from "../utils/txLink.js";
import { PendingTransaction } from "./PendingTransaction.js";
import type { TransactionEnvelope } from "./TransactionEnvelope.js";

/**
 * A value that can be processed into a {@link TransactionReceipt}.
 */
export type TransactionLike =
  | TransactionEnvelope
  | PendingTransaction
  | TransactionReceipt;

/**
 * Confirms a transaction, returning its receipt.
 *
 * @param tx
 * @returns
 */
export const confirmTransactionLike = async (
  tx: PromiseOrValue<TransactionLike>,
): Promise<TransactionReceipt> => {
  const ish = await valueAsPromise(tx);
  if (ish instanceof TransactionReceipt) {
    return ish;
  }

  let pending: PendingTransaction;
  if (ish instanceof PendingTransaction) {
    pending = ish;
  } else {
    pending = await ish.send({
      printLogs: false,
    });
  }
  return await pending.wait();
};

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
    readonly response: TransactionResponse | VersionedTransactionResponse,
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

  /**
   * Generates a link to view this {@link TransactionReceipt} on the official Solana explorer.
   * @param network
   * @returns
   */
  generateSolanaExplorerLink(cluster: Cluster = "mainnet-beta"): string {
    return generateTXLink(this.signature, cluster);
  }
}
