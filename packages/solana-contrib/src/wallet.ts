import type {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
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

  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return Promise.resolve(
      transactions.map((tx) => {
        tx.partialSign(this.signer);
        return tx;
      }),
    );
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    transaction.partialSign(this.signer);
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
