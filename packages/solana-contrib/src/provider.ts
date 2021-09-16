import type {
  ConfirmOptions,
  Connection,
  KeyedAccountInfo,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
} from "@solana/web3.js";

import type { Broadcaster, PendingTransaction, ReadonlyProvider } from ".";
import { SingleConnectionBroadcaster } from "./broadcaster";
import type { Provider, SendTxRequest, Wallet } from "./interfaces";

export const DEFAULT_PROVIDER_OPTIONS: ConfirmOptions = {
  preflightCommitment: "recent",
  commitment: "recent",
};

/**
 * Provider that can only read.
 */
export class SolanaReadonlyProvider implements ReadonlyProvider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param sendConnection The connection where transactions are sent to.
   * @param wallet     The wallet used to pay for and sign all transactions.
   * @param opts       Transaction confirmation options to use by default.
   */
  constructor(
    public readonly connection: Connection,
    public readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  /**
   * Gets
   * @param accountId
   * @returns
   */
  async getAccountInfo(accountId: PublicKey): Promise<KeyedAccountInfo | null> {
    const accountInfo = await this.connection.getAccountInfo(
      accountId,
      this.opts.commitment
    );
    if (!accountInfo) {
      return null;
    }
    return {
      accountId,
      accountInfo,
    };
  }
}

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This implementation was taken from Anchor.
 */
export class SolanaProvider extends SolanaReadonlyProvider implements Provider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param sendConnection The connection where transactions are sent to.
   * @param wallet     The wallet used to pay for and sign all transactions.
   * @param opts       Transaction confirmation options to use by default.
   */
  constructor(
    public readonly connection: Connection,
    public readonly broadcaster: Broadcaster,
    public readonly wallet: Wallet,
    public readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {
    super(connection, opts);
  }

  /**
   * Creates a new SolanaProvider.
   */
  static load({
    connection,
    sendConnection = connection,
    wallet,
    opts,
  }: {
    /**
     * Connection used for general reads
     */
    connection: Connection;
    /**
     * Connection used for sending transactions
     */
    sendConnection?: Connection;
    /**
     * Wallet used for signing transactions
     */
    wallet: Wallet;
    /**
     * Confirmation options
     */
    opts?: ConfirmOptions;
  }): SolanaProvider {
    return new SolanaProvider(
      connection,
      new SingleConnectionBroadcaster(sendConnection, opts),
      wallet,
      opts
    );
  }

  /**
   * Sends the given transaction, paid for and signed by the provider's wallet.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  async sign(
    tx: Transaction,
    signers: readonly (Signer | undefined)[] = [],
    opts: ConfirmOptions = this.opts
  ): Promise<Transaction> {
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = await this.broadcaster.getRecentBlockhash(
      opts.preflightCommitment
    );

    await this.wallet.signTransaction(tx);
    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    return tx;
  }

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  async signAll(
    reqs: readonly SendTxRequest[],
    opts: ConfirmOptions = this.opts
  ): Promise<Transaction[]> {
    const blockhash = await this.broadcaster.getRecentBlockhash(
      opts.preflightCommitment
    );

    const txs = reqs.map((r) => {
      const tx = r.tx;
      let signers = r.signers;

      if (signers === undefined) {
        signers = [];
      }

      tx.feePayer = this.wallet.publicKey;
      tx.recentBlockhash = blockhash;

      signers
        .filter((s): s is Signer => s !== undefined)
        .forEach((kp) => {
          tx.partialSign(kp);
        });

      return tx;
    });

    const signedTxs = await this.wallet.signAllTransactions(txs);
    return signedTxs;
  }

  /**
   * Sends the given transaction, paid for and signed by the provider's wallet.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  async send(
    tx: Transaction,
    signers: (Signer | undefined)[] = [],
    opts: ConfirmOptions = this.opts
  ): Promise<PendingTransaction> {
    const theTx = await this.sign(tx, signers, opts);
    const pending = await this.broadcaster.broadcast(theTx, opts);
    await pending.wait();
    return pending;
  }

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  async sendAll(
    reqs: readonly SendTxRequest[],
    opts: ConfirmOptions = this.opts
  ): Promise<PendingTransaction[]> {
    const txs = await this.signAll(reqs, opts);
    return await Promise.all(
      txs.map(async (tx) => {
        const pending = await this.broadcaster.broadcast(tx, opts);
        await pending.wait();
        return pending;
      })
    );
  }

  /**
   * Simulates the given transaction, returning emitted logs from execution.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  async simulate(
    tx: Transaction,
    signers: (Signer | undefined)[] = [],
    opts: ConfirmOptions = this.opts
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    const signedTx = await this.sign(tx, signers, opts);
    return await this.broadcaster.simulate(signedTx, opts.commitment);
  }
}
