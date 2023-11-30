import type {
  Broadcaster,
  PendingTransaction,
  SignAndBroadcastOptions,
} from "@saberhq/solana-contrib";
import {
  DEFAULT_PROVIDER_OPTIONS,
  SingleConnectionBroadcaster,
  SolanaProvider,
  SolanaTransactionSigner,
  TieredBroadcaster,
} from "@saberhq/solana-contrib";
import type {
  Commitment,
  ConfirmOptions,
  Connection,
  Transaction,
} from "@solana/web3.js";
import invariant from "tiny-invariant";

import type { ConnectedWallet } from "../adapters";

export class WalletAdapterTransactionSigner extends SolanaTransactionSigner {
  constructor(
    readonly connection: Connection,
    override readonly wallet: ConnectedWallet,
    broadcaster: Broadcaster,
    preflightCommitment: Commitment = "confirmed",
  ) {
    super(wallet, broadcaster, preflightCommitment);
  }

  override async signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction> {
    return await this.wallet.signAndBroadcastTransaction(
      transaction,
      this.connection,
      this.broadcaster,
      opts,
    );
  }
}

export class WalletAdapterProvider extends SolanaProvider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param sendConnection The connection where transactions are sent to.
   * @param wallet     The wallet used to pay for and sign all transactions.
   * @param opts       Transaction confirmation options to use by default.
   */
  constructor(
    connection: Connection,
    broadcaster: Broadcaster,
    override readonly wallet: ConnectedWallet,
    opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
  ) {
    super(
      connection,
      broadcaster,
      wallet,
      opts,
      new WalletAdapterTransactionSigner(
        connection,
        wallet,
        broadcaster,
        opts.preflightCommitment,
      ),
    );
  }

  /**
   * Initializes a new SolanaProvider.
   */
  static override init({
    connection,
    broadcastConnections = [connection],
    wallet,
    opts = DEFAULT_PROVIDER_OPTIONS,
  }: {
    /**
     * Connection used for general reads
     */
    readonly connection: Connection;
    /**
     * Connections used for broadcasting transactions. Defaults to the read connection.
     */
    readonly broadcastConnections?: readonly Connection[];
    /**
     * Wallet used for signing transactions
     */
    readonly wallet: ConnectedWallet;
    /**
     * Confirmation options
     */
    readonly opts?: ConfirmOptions;
  }): WalletAdapterProvider {
    const firstBroadcastConnection = broadcastConnections[0];
    invariant(
      firstBroadcastConnection,
      "must have at least one broadcast connection",
    );
    return new WalletAdapterProvider(
      connection,
      broadcastConnections.length > 1
        ? new TieredBroadcaster(connection, broadcastConnections, opts)
        : new SingleConnectionBroadcaster(firstBroadcastConnection, opts),
      wallet,
      opts,
    );
  }
}
