import type {
  ConfirmOptions,
  Connection,
  KeyedAccountInfo,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";

/**
 * Wallet interface for objects that can be used to sign provider transactions.
 *
 * This interface comes from Anchor.
 */
export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
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

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This interface is based on Anchor, but includes more features.
 */
export interface Provider extends AccountInfoFetcher {
  /**
   * Connection for reading data.
   */
  connection: Connection;

  /**
   * Connection in which transactions are sent.
   */
  sendConnection: Connection;

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
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ) => Promise<TransactionSignature>;

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  sendAll: (
    reqs: Array<SendTxRequest>,
    opts?: ConfirmOptions
  ) => Promise<Array<TransactionSignature>>;

  /**
   * Simulates the given transaction, returning emitted logs from execution.
   *
   * @param tx      The transaction to send.
   * @param signers The set of signers in addition to the provdier wallet that
   *                will sign the transaction.
   * @param opts    Transaction confirmation options.
   */
  simulate: (
    tx: Transaction,
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ) => Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
}

/**
 * An event emitted by a program.
 */
export type Event = {
  name: string;
  data: Record<string, unknown>;
};

/**
 * Parses the events from logs.
 */
export type EventParser<E extends Event> = (logs: string[]) => E[];
