import type {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

import {
  isVersionedTransaction,
  type Provider,
  type Wallet,
} from "./interfaces.js";
import { SolanaProvider } from "./provider.js";

/**
 * Wallet based on a Signer.
 */
export class SignerWallet implements Wallet {
  constructor(readonly signer: Signer) {}

  get publicKey(): PublicKey {
    return this.signer.publicKey;
  }

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
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

  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
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
