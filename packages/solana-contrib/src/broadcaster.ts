import type {
  Blockhash,
  Commitment,
  ConfirmOptions,
  Connection,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
} from "@solana/web3.js";

import type { Broadcaster } from ".";
import {
  DEFAULT_PROVIDER_OPTIONS,
  PendingTransaction,
  suppressConsoleErrorAsync,
} from ".";
import { simulateTransactionWithCommitment } from "./utils/simulateTransactionWithCommitment";

export interface BroadcastOptions extends ConfirmOptions {
  /**
   * Prints the transaction logs as emitted by @solana/web3.js. Defaults to true.
   */
  printLogs?: boolean;
}

/**
 * Broadcasts transactions to a single connection.
 */
export class SingleConnectionBroadcaster implements Broadcaster {
  constructor(
    readonly sendConnection: Connection,
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  async getRecentBlockhash(
    commitment: Commitment = "processed"
  ): Promise<Blockhash> {
    const result = await this.sendConnection.getRecentBlockhash(commitment);
    return result.blockhash;
  }

  /**
   * Broadcasts a signed transaction.
   *
   * @param tx
   * @param confirm
   * @param opts
   * @returns
   */
  async broadcast(
    tx: Transaction,
    { printLogs = true, ...opts }: BroadcastOptions = this.opts
  ): Promise<PendingTransaction> {
    if (tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before broadcasting.");
    }
    const rawTx = tx.serialize();

    if (printLogs) {
      return new PendingTransaction(
        this.sendConnection,
        await this.sendConnection.sendRawTransaction(rawTx, opts)
      );
    }

    return await suppressConsoleErrorAsync(async () => {
      // hide the logs of TX errors if printLogs = false
      return new PendingTransaction(
        this.sendConnection,
        await this.sendConnection.sendRawTransaction(rawTx, opts)
      );
    });
  }

  /**
   * Simulates a transaction with a commitment.
   * @param tx
   * @param commitment
   * @returns
   */
  async simulate(
    tx: Transaction,
    {
      commitment = "processed",
      verifySigners = true,
    }: {
      commitment?: Commitment;
      verifySigners?: boolean;
    } = {
      commitment: "processed",
      verifySigners: true,
    }
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (verifySigners && tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before simulating.");
    }
    return await simulateTransactionWithCommitment(
      this.sendConnection,
      tx,
      commitment
    );
  }
}
