import type {
  ConfirmOptions,
  Connection,
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

export type SendTxRequest = {
  tx: Transaction;
  signers: Array<Signer | undefined>;
};

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This interface comes from Anchor.
 */
export interface Provider {
  /**
   * Connection for reading data.
   */
  connection: Connection;

  /**
   * Connection in which transactions are sent.
   */
  sendConnection: Connection;

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
