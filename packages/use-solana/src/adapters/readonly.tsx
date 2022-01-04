import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { WalletAdapter } from "./types";

export class ReadonlyAdapter implements WalletAdapter {
  get connected(): boolean {
    return true;
  }

  get autoApprove(): boolean {
    return false;
  }

  signAllTransactions(_transactions: Transaction[]): Promise<Transaction[]> {
    throw new Error("readonly adapter cannot sign transactions");
  }

  get publicKey(): PublicKey | null {
    if (!process.env.LOCAL_PUBKEY) {
      console.warn("LOCAL_PUBKEY not set");
      return null;
    }
    return new PublicKey(process.env.LOCAL_PUBKEY);
  }

  signTransaction(_transaction: Transaction): Promise<Transaction> {
    throw new Error("readonly adapter cannot sign transactions");
  }

  connect = (): Promise<void> => {
    return this._noop();
  };

  disconnect(): Promise<void> {
    return this._noop();
  }

  on(_event: "connect" | "disconnect", _fn: () => void): void {
    console.warn("no-op for readonly adapter");
  }

  private async _noop(): Promise<void> {
    console.warn("no-op for readonly adapter");
    return Promise.resolve();
  }
}
