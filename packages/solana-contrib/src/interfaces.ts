import type {
  Blockhash,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  ConfirmOptions,
  Connection,
  KeyedAccountInfo,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
} from "@solana/web3.js";

import type { BroadcastOptions, PendingTransaction } from "./index.js";

/**
 * Wallet interface for objects that can be used to sign provider transactions.
 *
 * This interface comes from Anchor.
 */
export interface Wallet {
  /**
   * Signs a transaction with the wallet.
   * @param tx
   */
  signTransaction(tx: Transaction): Promise<Transaction>;

  /**
   * Signs all transactions with the wallet.
   * @param txs
   */
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;

  /**
   * The PublicKey of the wallet.
   */
  publicKey: PublicKey;
}

/**
 * Request to send a transaction.
 */
export interface SendTxRequest {
  tx: Transaction;
  signers: Array<Signer | undefined>;
}

/**
 * An entity that can fetch {@link KeyedAccountInfo}.
 */
export interface AccountInfoFetcher {
  /**
   * Fetches the {@link KeyedAccountInfo} associated with a
   * {@link PublicKey}, if it exists.
   *
   * @param accountId The account
   */
  getAccountInfo(accountId: PublicKey): Promise<KeyedAccountInfo | null>;
}

export interface ReadonlyProvider extends AccountInfoFetcher {
  /**
   * Connection for reading data.
   */
  connection: Connection;

  /**
   * Read-only wallet for use with Anchor programs.
   */
  wallet: Wallet;

  /**
   * Transaction confirmation options to use by default.
   */
  opts: ConfirmOptions;
}

/**
 * A Broadcaster broadcasts signed transactions to a node or set of nodes,
 * returning the transaction signatures.
 */
export interface Broadcaster {
  /**
   * Fetch a recent blockhash from the cluster
   * @param commitment
   */
  getLatestBlockhash(
    commitment?: Commitment,
  ): Promise<BlockhashWithExpiryBlockHeight>;

  /**
   * Fetch a recent blockhash from the cluster
   * @param commitment
   */
  getRecentBlockhash(commitment?: Commitment): Promise<Blockhash>;

  /**
   * Broadcasts a signed transaction to the connected Solana cluster.
   *
   * @param tx      The transaction to send.
   * @param opts    Transaction confirmation options.
   */
  broadcast: (
    tx: Transaction,
    opts?: BroadcastOptions,
  ) => Promise<PendingTransaction>;

  /**
   * Simulates the given transaction, returning emitted logs from execution.
   *
   * @param tx      The transaction to simulate.
   * @param opts    Transaction confirmation options.
   */
  simulate(
    tx: Transaction,
    opts: {
      commitment?: Commitment;
      verifySigners?: boolean;
    },
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
}

/**
 * Sign and broadcast options.
 */
export type SignAndBroadcastOptions = BroadcastOptions & {
  /**
   * Additional signers
   */
  signers?: Signer[];
};

/**
 * An interface that can sign transactions.
 */
export interface TransactionSigner {
  publicKey: PublicKey;

  /**
   * Signs and broadcasts a transaction.
   *
   * @param transaction
   * @param broadcaster
   * @param options
   */
  signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction>;

  /**
   * Signs the given transaction, paid for and signed by the provider's wallet.
   *
   * @param tx      The transaction to sign.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  sign: (
    tx: Transaction,
    signers?: readonly (Signer | undefined)[],
    opts?: ConfirmOptions,
  ) => Promise<Transaction>;

  /**
   * Similar to `sign`, but for an array of transactions and signers.
   */
  signAll: (
    reqs: readonly SendTxRequest[],
    opts?: ConfirmOptions,
  ) => Promise<Transaction[]>;
}

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This interface is based on Anchor, but includes more features.
 */
export interface Provider extends ReadonlyProvider {
  /**
   * Connection for reading data.
   */
  connection: Connection;

  /**
   * Signs transactions.
   */
  signer: TransactionSigner;

  /**
   * Broadcasts transactions.
   */
  broadcaster: Broadcaster;

  /**
   * Transaction confirmation options to use by default.
   */
  opts: ConfirmOptions;

  /**
   * The wallet used to pay for and sign all transactions.
   */
  wallet: Wallet;

  /**
   * Sends the given transaction, paid for and signed by the provider's wallet.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  send: (
    tx: Transaction,
    signers?: (Signer | undefined)[],
    opts?: ConfirmOptions,
  ) => Promise<PendingTransaction>;

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  sendAll: (
    reqs: readonly SendTxRequest[],
    opts?: ConfirmOptions,
  ) => Promise<PendingTransaction[]>;

  /**
   * Signs and broadcasts a transaction.
   *
   * @param transaction
   * @param broadcaster
   * @param options
   */
  signAndBroadcastTransaction(
    transaction: Transaction,
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction>;

  /**
   * Simulates the given transaction, returning emitted logs from execution.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provider wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  simulate: (
    tx: Transaction,
    signers?: (Signer | undefined)[],
    opts?: ConfirmOptions,
  ) => Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
}

/**
 * An event emitted by a program.
 */
export interface Event {
  name: string;
  data: Record<string, unknown>;
}

/**
 * Parses the events from logs.
 */
export type EventParser<E extends Event> = (logs: string[]) => E[];

/**
 * A parser for program-owned accounts.
 *
 * This is used downstream by Sail.
 */
export interface ProgramAccountParser<T> {
  /**
   * ID of the program.
   */
  programID: PublicKey;
  /**
   * Name of the account.
   */
  name: string;
  /**
   * Function which parses the account.
   */
  parse: (data: Buffer) => T;
}

/**
 * A parsed program-owned account.
 */
export type ProgramAccount<T> = {
  /**
   * {@link PublicKey} of the account.
   */
  publicKey: PublicKey;
  /**
   * The parsed account data.
   */
  account: T;
};
