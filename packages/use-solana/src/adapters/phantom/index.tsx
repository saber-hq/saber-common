import { PhantomWalletAdapter as SolanaPhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import type { PublicKey, Transaction } from "@solana/web3.js";

import type { WalletAdapter } from "../types";

export class PhantomWalletAdapter implements WalletAdapter {
  private readonly _phantom: SolanaPhantomWalletAdapter =
    new SolanaPhantomWalletAdapter();

  get connected(): boolean {
    return this._phantom.connected;
  }

  get autoApprove(): boolean {
    return this._phantom.ready;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this._phantom) {
      return transactions;
    }

    return this._phantom.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this._phantom.publicKey;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._phantom) {
      return transaction;
    }

    return this._phantom.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    await this._phantom.connect();
  };

  async disconnect(): Promise<void> {
    await this._phantom.disconnect();
  }

  on(event: "connect" | "disconnect", fn: () => void): void {
    this._phantom.on(event, fn);
  }
}
