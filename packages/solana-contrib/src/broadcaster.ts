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
import { DEFAULT_PROVIDER_OPTIONS, PendingTransaction } from ".";
import { simulateTransactionWithCommitment } from "./utils/simulateTransactionWithCommitment";

/**
 * Broadcasts transactions to a single connection.
 */
export class SingleConnectionBroadcaster implements Broadcaster {
  constructor(
    public readonly sendConnection: Connection,
    public readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  async getRecentBlockhash(
    commitment: Commitment = "recent"
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
    opts: ConfirmOptions = this.opts
  ): Promise<PendingTransaction> {
    if (tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before broadcasting.");
    }
    const rawTx = tx.serialize();
    return new PendingTransaction(
      this.sendConnection,
      await this.sendConnection.sendRawTransaction(rawTx, opts)
    );
  }

  /**
   * Simulates a transaction with a commitment.
   * @param tx
   * @param commitment
   * @returns
   */
  async simulate(
    tx: Transaction,
    commitment: Commitment = "recent"
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before simulating.");
    }
    return await simulateTransactionWithCommitment(
      this.sendConnection,
      tx,
      commitment
    );
  }
}
