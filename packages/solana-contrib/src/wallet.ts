import type {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

import type { Provider, Wallet } from "./interfaces.js";
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
    transactions: T[],
  ): Promise<T[]> {
    return Promise.resolve(
      transactions.map((tx) => {
        if ("version" in tx) {
          tx.sign([this.signer]);
        } else {
          tx.partialSign(this.signer);
        }
        return tx;
      }),
    );
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if ("version" in tx) {
      tx.sign([this.signer]);
    } else {
      tx.partialSign(this.signer);
    }
    return Promise.resolve(tx);
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
