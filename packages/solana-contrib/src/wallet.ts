import type {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import type { Provider, Wallet } from "./interfaces";
import { SolanaProvider } from "./provider";

/**
 * Wallet based on a Keypair.
 */
export class SignerWallet implements Wallet {
  private _publicKey: PublicKey;

  constructor(public keypair: Keypair) {
    this._publicKey = keypair.publicKey;
  }

  public signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return Promise.resolve(
      transactions.map((tx) => {
        tx.partialSign(this.keypair);
        return tx;
      })
    );
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    transaction.partialSign(this.keypair);
    return Promise.resolve(transaction);
  }

  createProvider(connection: Connection): Provider {
    return new SolanaProvider(connection, this);
  }
}
