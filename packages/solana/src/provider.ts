import {
  Commitment,
  ConfirmOptions,
  Connection,
  RpcResponseAndContext,
  sendAndConfirmRawTransaction,
  Signer,
  SimulatedTransactionResponse,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import invariant from "tiny-invariant";

import { Provider, SendTxRequest, Wallet } from "./interfaces";

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 *
 * This implementation was taken from Anchor.
 */
export default class SolanaProvider implements Provider {
  /**
   * @param connection The cluster connection where the program is deployed.
   * @param wallet     The wallet used to pay for and sign all transactions.
   * @param opts       Transaction confirmation options to use by default.
   */
  constructor(
    readonly connection: Connection,
    readonly wallet: Wallet,
    readonly opts: ConfirmOptions
  ) {}

  static defaultOptions(): ConfirmOptions {
    return {
      preflightCommitment: "recent",
      commitment: "recent",
    };
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
      await this.connection.getRecentBlockhash(opts.preflightCommitment)
    ).blockhash;

    await this.wallet.signTransaction(tx);
    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    const rawTx = tx.serialize();

    const txId = await sendAndConfirmRawTransaction(
      this.connection,
      rawTx,
      opts
    );

    return txId;
  }

  /**
   * Similar to `send`, but for an array of transactions and signers.
   */
  async sendAll(
    reqs: Array<SendTxRequest>,
    opts?: ConfirmOptions
  ): Promise<Array<TransactionSignature>> {
    if (opts === undefined) {
      opts = this.opts;
    }
    const blockhash = await this.connection.getRecentBlockhash(
      opts.preflightCommitment
    );

    const txs = reqs.map((r) => {
      const tx = r.tx;
      let signers = r.signers;

      if (signers === undefined) {
        signers = [];
      }

      tx.feePayer = this.wallet.publicKey;
      tx.recentBlockhash = blockhash.blockhash;

      signers
        .filter((s): s is Signer => s !== undefined)
        .forEach((kp) => {
          tx.partialSign(kp);
        });

      return tx;
    });

    const signedTxs = await this.wallet.signAllTransactions(txs);

    const sigs = [];

    for (let k = 0; k < txs.length; k += 1) {
      const tx = signedTxs[k];
      invariant(tx, "tx missing");
      const rawTx = tx.serialize();
      sigs.push(
        await sendAndConfirmRawTransaction(this.connection, rawTx, opts)
      );
    }

    return sigs;
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
async function simulateTransaction(
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
