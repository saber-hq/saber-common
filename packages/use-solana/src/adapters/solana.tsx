import type {
  EventEmitter,
  SignerWalletAdapter,
  WalletAdapterEvents,
} from "@solana/wallet-adapter-base";
import type { PublicKey, Transaction } from "@solana/web3.js";

import type { WalletAdapter } from "./types";

export class SolanaWalletAdapter implements WalletAdapter {
  constructor(
    readonly adapter: Omit<
      SignerWalletAdapter,
      "sendTransaction" | keyof EventEmitter
    > &
      EventEmitter<WalletAdapterEvents>
  ) {}

  get connected(): boolean {
    return this.adapter.connected;
  }

  get autoApprove(): boolean {
    return false;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return this.adapter.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this.adapter.publicKey;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.adapter) {
      return transaction;
    }

    return this.adapter.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    await this.adapter.connect();
  };

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
  }

  on(event: "connect" | "disconnect", fn: () => void): void {
    this.adapter.on(event, fn);
  }
}
