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

import { firstAggregateError } from "../error.js";
import type { Broadcaster } from "../interfaces.js";
import { DEFAULT_PROVIDER_OPTIONS } from "../provider.js";
import { PendingTransaction } from "../transaction/index.js";
import { suppressConsoleErrorAsync } from "../utils/index.js";
import { simulateTransactionWithCommitment } from "../utils/simulateTransactionWithCommitment.js";
import { sendAndSpamRawTx } from "./sendAndSpamRawTx.js";

export * from "./tiered.js";

/**
 * Options for retrying sending of transactions periodically.
 */
export interface TransactionRetryOptions {
  /**
   * Number of times to retry the transaction being sent.
   */
  retryTimes?: number;
  /**
   * Milliseconds elapsed between transaction retries.
   */
  retryInterval?: number;
}

/**
 * Default retry parameters.
 */
export const DEFAULT_RETRY_OPTIONS: Required<TransactionRetryOptions> = {
  retryTimes: 3,
  retryInterval: 1_000,
};

/**
 * Default retry parameters for fallbacks.
 */
export const DEFAULT_FALLBACK_RETRY_OPTIONS: Required<TransactionRetryOptions> =
  {
    retryTimes: 10,
    retryInterval: 300,
  };

export interface BroadcastOptions
  extends ConfirmOptions,
    TransactionRetryOptions {
  /**
   * Prints the transaction logs as emitted by @solana/web3.js. Defaults to true.
   */
  printLogs?: boolean;
  /**
   * Retry options to use for fallback send connections.
   */
  fallbackRetryOptions?: TransactionRetryOptions;
}

/**
 * Broadcasts transactions to a single connection.
 */
export class SingleConnectionBroadcaster implements Broadcaster {
  constructor(
    readonly sendConnection: Connection,
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
  ) {}

  /**
   * @inheritdoc
   */
  async getLatestBlockhash(
    commitment: Commitment = this.opts.commitment ?? "confirmed",
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return await this.sendConnection.getLatestBlockhash(commitment);
  }

  /**
   * @inheritdoc
   */
  async getRecentBlockhash(
    commitment: Commitment = this.opts.commitment ?? "confirmed",
  ): Promise<Blockhash> {
    const result = await this.sendConnection.getLatestBlockhash(commitment);
    return result.blockhash;
  }

  /**
   * @inheritdoc
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
      return new PendingTransaction(
        this.sendConnection,
        await sendAndSpamRawTx(this.sendConnection, rawTx, opts, opts),
      );
    }

    return await suppressConsoleErrorAsync(async () => {
      // hide the logs of TX errors if printLogs = false
      return new PendingTransaction(
        this.sendConnection,
        await sendAndSpamRawTx(this.sendConnection, rawTx, opts, opts),
      );
    });
  }

  /**
   * @inheritdoc
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
    return await simulateTransactionWithCommitment(
      this.sendConnection,
      tx,
      commitment,
    );
  }
}

/**
 * Broadcasts transactions to multiple connections simultaneously.
 */
export class MultipleConnectionBroadcaster implements Broadcaster {
  constructor(
    readonly connections: readonly Connection[],
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
  ) {}

  async getLatestBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed",
  ): Promise<BlockhashWithExpiryBlockHeight> {
    try {
      const result = await Promise.any(
        this.connections.map((conn) => conn.getLatestBlockhash(commitment)),
      );
      return result;
    } catch (e) {
      if (e instanceof AggregateError) {
        throw firstAggregateError(e);
      } else {
        throw e;
      }
    }
  }

  async getRecentBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed",
  ): Promise<Blockhash> {
    try {
      const result = await Promise.any(
        this.connections.map((conn) => conn.getLatestBlockhash(commitment)),
      );
      return result.blockhash;
    } catch (e) {
      if (e instanceof AggregateError) {
        throw firstAggregateError(e);
      } else {
        throw e;
      }
    }
  }

  private async _sendRawTransaction(
    encoded: Buffer,
    options?: SendOptions & Pick<BroadcastOptions, "retryTimes">,
  ): Promise<PendingTransaction> {
    try {
      return await Promise.any(
        this.connections.map(async (connection) => {
          return new PendingTransaction(
            connection,
            await sendAndSpamRawTx(connection, encoded, options ?? this.opts),
          );
        }),
      );
    } catch (e) {
      if (e instanceof AggregateError) {
        throw firstAggregateError(e);
      } else {
        throw e;
      }
    }
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
      commitment = this.opts.preflightCommitment ??
        this.opts.commitment ??
        "confirmed",
      verifySigners = true,
    }: {
      commitment?: Commitment;
      verifySigners?: boolean;
    } = {
      commitment:
        this.opts.preflightCommitment ?? this.opts.commitment ?? "confirmed",
      verifySigners: true,
    },
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (verifySigners && tx.signatures.length === 0) {
      throw new Error("Transaction must be signed before simulating.");
    }
    try {
      return await Promise.any(
        this.connections.map(async (connection) => {
          return await simulateTransactionWithCommitment(
            connection,
            tx,
            commitment,
          );
        }),
      );
    } catch (e) {
      if (e instanceof AggregateError) {
        throw firstAggregateError(e);
      } else {
        throw e;
      }
    }
  }
}
