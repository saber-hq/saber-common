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
  TransactionSignature,
} from "@solana/web3.js";
import { sendAndConfirmRawTransaction } from "@solana/web3.js";

import type { Provider, SendTxRequest, Wallet } from "./interfaces";
import { sendAll } from "./utils";

export const DEFAULT_PROVIDER_OPTIONS: ConfirmOptions = {
  preflightCommitment: "recent",
  commitment: "recent",
};

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This implementation was taken from Anchor.
 */
export class SolanaProvider implements Provider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param sendConnection The connection where transactions are sent to.
   * @param wallet     The wallet used to pay for and sign all transactions.
   * @param opts       Transaction confirmation options to use by default.
   */
  constructor(
    public readonly connection: Connection,
    public readonly sendConnection: Connection,
    public readonly wallet: Wallet,
    public readonly opts: ConfirmOptions = DEFAULT_PROVIDER_OPTIONS
  ) {}

  /**
   * Gets
   * @param accountId
   * @returns
   */
  async getAccountInfo(accountId: PublicKey): Promise<KeyedAccountInfo | null> {
    const accountInfo = await this.connection.getAccountInfo(accountId);
    if (!accountInfo) {
      return null;
    }
    return {
      accountId,
      accountInfo,
    };
  }

  static defaultOptions(): ConfirmOptions {
    return DEFAULT_PROVIDER_OPTIONS;
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
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ): Promise<TransactionSignature> {
    if (signers === undefined) {
      signers = [];
    }
    if (opts === undefined) {
      opts = this.opts;
    }

    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (
      await this.sendConnection.getRecentBlockhash(opts.preflightCommitment)
    ).blockhash;

    await this.wallet.signTransaction(tx);
    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    const rawTx = tx.serialize();

    const txId = await sendAndConfirmRawTransaction(
      this.sendConnection,
      rawTx,
      opts
    );

    return txId;
  }

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  async sendAll(
    reqs: SendTxRequest[],
    opts?: ConfirmOptions
  ): Promise<TransactionSignature[]> {
    return await sendAll({
      provider: this,
      reqs,
      opts: opts ?? this.opts,
      confirm: true,
    });
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
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (signers === undefined) {
      signers = [];
    }
    if (opts === undefined) {
      opts = this.opts;
    }

    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (
      await this.connection.getRecentBlockhash(
        opts.preflightCommitment ?? this.opts.preflightCommitment
      )
    ).blockhash;

    await this.wallet.signTransaction(tx);
    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    return await simulateTransaction(
      this.connection,
      tx,
      opts.commitment ?? this.opts.commitment ?? "recent"
    );
  }
}

// Copy of Connection.simulateTransaction that takes a commitment parameter.
export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const connectionInner = connection as Connection & {
    _disableBlockhashCaching: boolean;
    _recentBlockhash: (disableBlockhashCaching: boolean) => Promise<string>;
    _rpcRequest: (
      rpc: "simulateTransaction",
      args: [
        string,
        {
          encoding: string;
          commitment: Commitment;
        }
      ]
    ) => Promise<{
      error: Error;
      result: RpcResponseAndContext<SimulatedTransactionResponse>;
    }>;
  };
  const transactionTyped = transaction as Transaction & {
    _serialize: (buffer: Buffer) => Buffer;
  };

  transaction.recentBlockhash = await connectionInner._recentBlockhash(
    connectionInner._disableBlockhashCaching
  );

  const signData = transaction.serializeMessage();

  const wireTransaction = transactionTyped._serialize(signData);
  const encodedTransaction = wireTransaction.toString("base64");
  const config = { encoding: "base64", commitment };

  const res = await connectionInner._rpcRequest("simulateTransaction", [
    encodedTransaction,
    config,
  ]);
  if (res.error) {
    throw new Error("failed to simulate transaction: " + res.error.message);
  }
  return res.result;
}
