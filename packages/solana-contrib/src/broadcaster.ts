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

import { firstAggregateError } from "./error";
import type { Broadcaster } from "./interfaces";
import { DEFAULT_PROVIDER_OPTIONS } from "./provider";
import { PendingTransaction } from "./transaction";
import { sleep, suppressConsoleErrorAsync } from "./utils";
import { simulateTransactionWithCommitment } from "./utils/simulateTransactionWithCommitment";

/**
 * Sends and spams a raw transaction multiple times.
 * @param connection Connection to send the transaction to. We recommend using a public endpoint such as GenesysGo.
 * @param rawTx
 * @param opts
 */
const sendAndSpamRawTx = async (
  connection: Connection,
  rawTx: Buffer,
  {
    retryTimes = 10,
    ...opts
  }: SendOptions & Pick<BroadcastOptions, "retryTimes">
) => {
  const result = await connection.sendRawTransaction(rawTx);
  // if we could send the TX with preflight, let's spam it.
  void (async () => {
    // technique stolen from Mango.
    for (let i = 0; i < retryTimes; i++) {
      try {
        await connection.sendRawTransaction(rawTx, {
          ...opts,
          skipPreflight: true,
        });
        await sleep(300);
      } catch (e) {
        console.warn(`[Broadcaster] sendAndSpamRawTx error`, e);
      }
    }
  })();
  return result;
};

export interface BroadcastOptions extends ConfirmOptions {
  /**
   * Prints the transaction logs as emitted by @solana/web3.js. Defaults to true.
   */
  printLogs?: boolean;
  /**
   * Number of times to retry the transaction being sent.
   */
  retryTimes?: number;
}

/**
 * Broadcasts transactions to a single connection.
 */
export class SingleConnectionBroadcaster implements Broadcaster {
  constructor(
    readonly sendConnection: Connection,
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  /**
   * @inheritdoc
   */
  async getLatestBlockhash(
    commitment: Commitment = this.opts.commitment ?? "confirmed"
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return await this.sendConnection.getLatestBlockhash(commitment);
  }

  /**
   * @inheritdoc
   */
  async getRecentBlockhash(
    commitment: Commitment = this.opts.commitment ?? "confirmed"
  ): Promise<Blockhash> {
    const result = await this.sendConnection.getLatestBlockhash(commitment);
    return result.blockhash;
  }

  /**
   * @inheritdoc
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
        await sendAndSpamRawTx(this.sendConnection, rawTx, opts)
      );
    }

    return await suppressConsoleErrorAsync(async () => {
      // hide the logs of TX errors if printLogs = false
      return new PendingTransaction(
        this.sendConnection,
        await sendAndSpamRawTx(this.sendConnection, rawTx, opts)
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

/**
 * Broadcasts transactions to multiple connections simultaneously.
 */
export class MultipleConnectionBroadcaster implements Broadcaster {
  constructor(
    readonly connections: readonly Connection[],
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  async getLatestBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed"
  ): Promise<BlockhashWithExpiryBlockHeight> {
    try {
      const result = await Promise.any(
        this.connections.map((conn) => conn.getLatestBlockhash(commitment))
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
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed"
  ): Promise<Blockhash> {
    try {
      const result = await Promise.any(
        this.connections.map((conn) => conn.getLatestBlockhash(commitment))
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
    options?: SendOptions & Pick<BroadcastOptions, "retryTimes">
  ): Promise<PendingTransaction> {
    try {
      return await Promise.any(
        this.connections.map(async (connection) => {
          return new PendingTransaction(
            connection,
            await sendAndSpamRawTx(connection, encoded, options ?? {})
          );
        })
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
    { printLogs = true, ...opts }: BroadcastOptions = this.opts
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
    }
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
            commitment
          );
        })
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

/**
 * Broadcasts transactions to multiple connections simultaneously.
 */
export class TieredBroadcaster implements Broadcaster {
  readonly premiumBroadcaster: SingleConnectionBroadcaster;

  constructor(
    readonly premiumConnection: Connection,
    readonly freeConnections: readonly Connection[],
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {
    this.premiumBroadcaster = new SingleConnectionBroadcaster(
      premiumConnection,
      opts
    );
  }

  async getLatestBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed"
  ): Promise<BlockhashWithExpiryBlockHeight> {
    return await this.premiumBroadcaster.getLatestBlockhash(commitment);
  }

  async getRecentBlockhash(
    commitment: Commitment = this.opts.preflightCommitment ?? "confirmed"
  ): Promise<Blockhash> {
    return await this.premiumBroadcaster.getRecentBlockhash(commitment);
  }

  private async _sendRawTransaction(
    encoded: Buffer,
    options?: SendOptions & Pick<BroadcastOptions, "retryTimes">
  ): Promise<PendingTransaction> {
    const pending = new PendingTransaction(
      this.premiumConnection,
      await sendAndSpamRawTx(this.premiumConnection, encoded, options ?? {})
    );
    void (async () => {
      await Promise.all(
        this.freeConnections.map(async (fc) => {
          await sendAndSpamRawTx(fc, encoded, options ?? {});
        })
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
    { printLogs = true, ...opts }: BroadcastOptions = this.opts
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
    }
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
