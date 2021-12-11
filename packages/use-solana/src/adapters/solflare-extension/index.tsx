import type { PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { PhantomProvider } from "../../typings/window";
import type { WalletAdapter } from "../types";

/**
 * Docs: https://rentry.co/solflareX_connect
 */
export class SolflareExtensionWalletAdapter
  extends EventEmitter
  implements WalletAdapter
{
  constructor() {
    super();
  }

  private get _provider(): PhantomProvider | undefined {
    if (window?.solflare?.isSolflare) {
      return window.solflare;
    }
    return undefined;
  }

  private _handleConnect = (...args: unknown[]) => {
    this.emit("connect", ...args);
  };

  private _handleDisconnect = (...args: unknown[]) => {
    this.emit("disconnect", ...args);
  };

  get connected(): boolean {
    return this._provider?.isConnected || false;
  }

  get autoApprove(): boolean {
    return this._provider?.autoApprove || false;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions;
    }

    return this._provider.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this._provider?.publicKey ?? null;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    if (!this._provider) {
      window.open("https://solflare.com/", "_blank", "noopener");
      throw new Error("Solflare Extension not installed");
    }
    this._provider?.on("connect", this._handleConnect);
    this._provider?.on("disconnect", this._handleDisconnect);
    await this._provider?.connect();
  };

  async disconnect(): Promise<void> {
    if (this._provider) {
      await this._provider.disconnect();
    }
  }
}
