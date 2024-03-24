import type {
  Commitment,
  ConfirmOptions,
  Connection,
  KeyedAccountInfo,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { default as invariant } from "tiny-invariant";

import { SingleConnectionBroadcaster } from "./broadcaster/index.js";
import type { Broadcaster, ReadonlyProvider } from "./index.js";
import {
  PendingTransaction,
  SignerWallet,
  TieredBroadcaster,
} from "./index.js";
import type {
  Provider,
  SendTxRequest,
  SignAndBroadcastOptions,
  TransactionSigner,
  Wallet,
} from "./interfaces.js";
import { TransactionEnvelope } from "./transaction/TransactionEnvelope.js";

export const DEFAULT_PROVIDER_OPTIONS: ConfirmOptions = {
  preflightCommitment: "confirmed",
  commitment: "confirmed",
};

export const DEFAULT_READONLY_PUBLIC_KEY: PublicKey = SystemProgram.programId;

/**
 * Provider that can only read.
 */
export class SolanaReadonlyProvider implements ReadonlyProvider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param opts       Transaction confirmation options to use by default.
   * @param publicKey  Optional public key of read-only wallet.
   */
  constructor(
    readonly connection: Connection,
    readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
    readonly publicKey: PublicKey = DEFAULT_READONLY_PUBLIC_KEY,
  ) {
    this.wallet = {
      ...this.wallet,
      publicKey,
    };
  }

  wallet: Wallet = {
    signTransaction: Promise.resolve.bind(Promise),
    signAllTransactions: Promise.resolve.bind(Promise),
    publicKey: DEFAULT_READONLY_PUBLIC_KEY,
  };

  /**
   * Gets
   * @param accountId
   * @returns
   */
  async getAccountInfo(accountId: PublicKey): Promise<KeyedAccountInfo | null> {
    const accountInfo = await this.connection.getAccountInfo(
      accountId,
      this.opts.commitment,
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

export const doSignAndBroadcastTransaction = async (
  wallet: Pick<Wallet, "signTransaction">,
  transaction: Transaction,
  broadcaster: Broadcaster,
  opts?: SignAndBroadcastOptions,
): Promise<PendingTransaction> => {
  const tx = await wallet.signTransaction(transaction);
  if (opts?.signers && opts.signers.length > 0) {
    tx.sign(...opts.signers);
  }
  return await broadcaster.broadcast(tx, opts);
};

/**
 * Signs Solana transactions.
 */
export class SolanaTransactionSigner implements TransactionSigner {
  constructor(
    readonly wallet: Wallet,
    readonly broadcaster: Broadcaster,
    readonly preflightCommitment: Commitment = "confirmed",
  ) {}

  get publicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  async signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions | undefined,
  ): Promise<PendingTransaction> {
    return await doSignAndBroadcastTransaction(
      this.wallet,
      transaction,
      this.broadcaster,
      opts,
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
    opts: ConfirmOptions = {
      preflightCommitment: this.preflightCommitment,
    },
  ): Promise<Transaction> {
    const { blockhash, lastValidBlockHeight } =
      await this.broadcaster.getLatestBlockhash(opts.preflightCommitment);
    tx.feePayer = this.wallet.publicKey;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.recentBlockhash = blockhash;

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
    opts: ConfirmOptions = {
      preflightCommitment: this.preflightCommitment,
    },
  ): Promise<Transaction[]> {
    const { blockhash, lastValidBlockHeight } =
      await this.broadcaster.getLatestBlockhash(opts.preflightCommitment);

    const txs = reqs.map(({ tx, signers = [] }) => {
      tx.feePayer = this.wallet.publicKey;
      tx.lastValidBlockHeight = lastValidBlockHeight;
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
    override readonly connection: Connection,
    readonly broadcaster: Broadcaster,
    override readonly wallet: Wallet,
    override readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS,
    readonly signer: TransactionSigner = new SolanaTransactionSigner(
      wallet,
      broadcaster,
      opts.preflightCommitment,
    ),
  ) {
    super(connection, opts);
  }

  async signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction> {
    return await this.signer.signAndBroadcastTransaction(transaction, opts);
  }

  /**
   * Creates a new SolanaProvider.
   * @deprecated use {@link SolanaProvider.init}
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
      opts,
    );
  }

  /**
   * Initializes a new SolanaProvider.
   */
  static init({
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
    readonly wallet: Wallet;
    /**
     * Confirmation options
     */
    readonly opts?: ConfirmOptions;
  }): SolanaProvider {
    const firstBroadcastConnection = broadcastConnections[0];
    invariant(
      firstBroadcastConnection,
      "must have at least one broadcast connection",
    );
    return new SolanaProvider(
      connection,
      broadcastConnections.length > 1
        ? new TieredBroadcaster(connection, broadcastConnections, opts)
        : new SingleConnectionBroadcaster(firstBroadcastConnection, opts),
      wallet,
      opts,
    );
  }

  /**
   * Sends the given transaction, paid for and signed by the provider's wallet.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provider wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  async send(
    tx: Transaction,
    signers: (Signer | undefined)[] = [],
    opts: ConfirmOptions = this.opts,
  ): Promise<PendingTransaction> {
    const theTx = await this.signer.sign(tx, signers, opts);
    const pending = await this.broadcaster.broadcast(theTx, opts);
    await pending.wait();
    return pending;
  }

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  async sendAll(
    reqs: readonly SendTxRequest[],
    opts: ConfirmOptions = this.opts,
  ): Promise<PendingTransaction[]> {
    const txs = await this.signer.signAll(reqs, opts);
    return await Promise.all(
      txs.map(async (tx) => {
        const pending = await this.broadcaster.broadcast(tx, opts);
        await pending.wait();
        return pending;
      }),
    );
  }

  /**
   * Simulates the given transaction, returning emitted logs from execution.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provider wallet that
   *                will sign the transaction. If specified, the provider will
   *                sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  async simulate(
    tx: Transaction,
    signers: (Signer | undefined)[] | undefined,
    opts: ConfirmOptions = this.opts,
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    let simTX = tx;
    if (signers !== undefined) {
      simTX = await this.signer.sign(tx, signers, opts);
    }
    return await this.broadcaster.simulate(simTX, {
      verifySigners: signers !== undefined,
      commitment: opts.commitment,
    });
  }
}

/**
 * Provider with utility functions.
 */
export interface AugmentedProvider extends Provider {
  /**
   * The {@link PublicKey} of the wallet.
   */
  readonly walletKey: PublicKey;

  /**
   * Creates a new transaction using this Provider.
   * @param instructions
   * @param signers
   * @returns
   */
  newTX: (
    instructions?: (TransactionInstruction | null | undefined | boolean)[],
    signers?: Signer[],
  ) => TransactionEnvelope;

  /**
   * Requests an airdrop of tokens.
   * @param lamports Number of lamports.
   * @returns
   */
  requestAirdrop: (lamports: number) => Promise<PendingTransaction>;

  /**
   * Returns this provider with a different signer.
   * @param signer
   * @returns
   */
  withSigner: (signer: Signer) => AugmentedProvider;
}

/**
 * Wrapper for a Provider containing utility functions.
 */
export class SolanaAugmentedProvider implements AugmentedProvider {
  constructor(readonly provider: Provider) {}

  get walletKey(): PublicKey {
    return this.provider.wallet.publicKey;
  }

  get connection(): Connection {
    return this.provider.connection;
  }

  get signer(): TransactionSigner {
    return this.provider.signer;
  }

  get broadcaster(): Broadcaster {
    return this.provider.broadcaster;
  }

  get opts(): ConfirmOptions {
    return this.provider.opts;
  }

  get wallet(): Wallet {
    return this.provider.wallet;
  }

  signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction> {
    return this.provider.signAndBroadcastTransaction(transaction, opts);
  }

  send(
    tx: Transaction,
    signers?: (Signer | undefined)[] | undefined,
    opts?: ConfirmOptions | undefined,
  ): Promise<PendingTransaction> {
    return this.provider.send(tx, signers, opts);
  }

  sendAll(
    reqs: readonly SendTxRequest[],
    opts?: ConfirmOptions | undefined,
  ): Promise<PendingTransaction[]> {
    return this.provider.sendAll(reqs, opts);
  }

  simulate(
    tx: Transaction,
    signers?: (Signer | undefined)[] | undefined,
    opts?: ConfirmOptions | undefined,
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return this.provider.simulate(tx, signers, opts);
  }

  getAccountInfo(accountId: PublicKey): Promise<KeyedAccountInfo | null> {
    return this.provider.getAccountInfo(accountId);
  }

  /**
   * Creates a new transaction using this Provider.
   * @param instructions
   * @param signers
   * @returns
   */
  newTX(
    instructions: (TransactionInstruction | null | undefined | boolean)[] = [],
    signers: Signer[] = [],
  ): TransactionEnvelope {
    return TransactionEnvelope.create(this, instructions, signers);
  }

  /**
   * Requests an airdrop of tokens.
   * @param amount
   * @returns
   */
  async requestAirdrop(
    lamports: number,
    to: PublicKey = this.wallet.publicKey,
  ): Promise<PendingTransaction> {
    return new PendingTransaction(
      this.connection,
      await this.connection.requestAirdrop(to, lamports),
    );
  }

  /**
   * Returns this provider with a different signer.
   * @param signer
   * @returns
   */
  withSigner(signer: Signer): SolanaAugmentedProvider {
    return new SolanaAugmentedProvider(
      new SolanaProvider(
        this.connection,
        this.broadcaster,
        new SignerWallet(signer),
        this.opts,
      ),
    );
  }
}
