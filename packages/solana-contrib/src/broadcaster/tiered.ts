import type {
  Blockhash,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  ConfirmOptions,
  Connection,
  RpcResponseAndContext,
  SendOptions,
  SimulatedTransactionResponse,
  Transaction,
} from "@solana/web3.js";

import type { Broadcaster } from "../interfaces.js";
import { DEFAULT_PROVIDER_OPTIONS } from "../provider.js";
import { PendingTransaction } from "../transaction/index.js";
import { suppressConsoleErrorAsync } from "../utils/index.js";
import type { BroadcastOptions } from "./index.js";
import {
  DEFAULT_FALLBACK_RETRY_OPTIONS,
  DEFAULT_RETRY_OPTIONS,
  SingleConnectionBroadcaster,
} from "./index.js";
import { sendAndSpamRawTx } from "./sendAndSpamRawTx.js";

/**
 * Broadcasts transactions to multiple connections simultaneously.
 */
export class TieredBroadcaster implements Broadcaster {
  readonly premiumBroadcaster: SingleConnectionBroadcaster;

  constructor(
    readonly primaryConnection: Connection,
    /**
     * Connections to send to in addition to the primary.
     */
    readonly fallbackConnections: readonly Connection[],
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
  ) {
    this.premiumBroadcaster = new SingleConnectionBroadcaster(
      primaryConnection,
      opts,
    );
  }

  async getLatestBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed",
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return await this.premiumBroadcaster.getLatestBlockhash(commitment);
  }

  async getRecentBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed",
  ): Promise<Blockhash> {
    return await this.premiumBroadcaster.getRecentBlockhash(commitment);
  }

  private async _sendRawTransaction(
    encoded: Buffer,
    options?: SendOptions & Omit<BroadcastOptions, "printLogs">,
  ): Promise<PendingTransaction> {
    const pending = new PendingTransaction(
      this.primaryConnection,
      await sendAndSpamRawTx(
        this.primaryConnection,
        encoded,
        options ?? this.opts,
        options ?? DEFAULT_RETRY_OPTIONS,
      ),
    );
    void (async () => {
      await Promise.all(
        this.fallbackConnections.map(async (fc) => {
          try {
            await sendAndSpamRawTx(
              fc,
              encoded,
              options ?? this.opts,
              options?.fallbackRetryOptions ?? DEFAULT_FALLBACK_RETRY_OPTIONS,
            );
          } catch (e) {
            console.warn(`[Broadcaster] _sendRawTransaction error`, e);
          }
        }),
      );
    })();
    return pending;
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
    { printLogs = true, ...opts }: BroadcastOptions = this.opts,
  ): Promise<PendingTransaction> {
    if (tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before broadcasting.");
    }
    const rawTx = tx.serialize();

    if (printLogs) {
      return await this._sendRawTransaction(rawTx, opts);
    }

    return await suppressConsoleErrorAsync(async () => {
      // hide the logs of TX errors if printLogs = false
      return await this._sendRawTransaction(rawTx, opts);
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
      commitment = this.opts.preflightCommitment ?? "confirmed",
      verifySigners = true,
    }: {
      commitment?: Commitment;
      verifySigners?: boolean;
    } = {
      commitment: this.opts.preflightCommitment ?? "confirmed",
      verifySigners: true,
    },
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (verifySigners && tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before simulating.");
    }
    return this.premiumBroadcaster.simulate(tx, {
      commitment,
      verifySigners,
    });
  }
}
