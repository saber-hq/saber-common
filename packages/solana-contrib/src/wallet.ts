import type {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
} from "@solana/web3.js";

import {
  ALL_TRANSACTION_VERSIONS,
  isVersionedTransaction,
  type Provider,
  type SupportedTransactionVersions,
  type TransactionOrVersionedTransaction,
  type Wallet,
} from "./interfaces.js";
import { SolanaProvider } from "./provider.js";

/**
 * Wallet based on a Signer.
 */
export class SignerWallet implements Wallet<SupportedTransactionVersions> {
  constructor(readonly signer: Signer) {}

  get publicKey(): PublicKey {
    return this.signer.publicKey;
  }

  readonly supportedTransactionVersions = ALL_TRANSACTION_VERSIONS;

  signAllTransactions<
    T extends TransactionOrVersionedTransaction<SupportedTransactionVersions>,
  >(txs: T[]): Promise<T[]> {
    return Promise.resolve(
      txs.map((tx) => {
        if (isVersionedTransaction(tx)) {
          tx.sign([this.signer]);
        } else {
          tx.partialSign(this.signer);
        }
        return tx;
      }),
    );
  }

  signTransaction<
    T extends TransactionOrVersionedTransaction<SupportedTransactionVersions>,
  >(transaction: T): Promise<T> {
    if (isVersionedTransaction(transaction)) {
      transaction.sign([this.signer]);
    } else {
      transaction.partialSign(this.signer);
    }
    return Promise.resolve(transaction);
  }

  /**
   * Creates a Provider from this Wallet by adding a Connection.
   * @param connection
   * @returns
   */
  createProvider(
    connection: Connection,
    sendConnection?: Connection,
    opts?: ConfirmOptions,
  ): Provider {
    return SolanaProvider.load({
      connection,
      sendConnection,
      wallet: this,
      opts,
    });
  }
}
