import { PublicKey, Transaction } from "@solana/web3.js";
import * as EventEmitter from "eventemitter3";

import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";

type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

export interface PhantomProvider {
  publicKey?: PublicKey;
  isConnected?: boolean;
  autoApprove?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: (args?: { onlyIfTrusted: true }) => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: unknown) => void) => void;
  request: (method: PhantomRequestMethod, params: unknown) => Promise<unknown>;
  listeners: (event: PhantomEvent) => (() => void)[];

  isPhantom: true;
  isMathWallet: undefined;
}

export class PhantomWalletAdapter
  extends EventEmitter
  implements WalletAdapter
{
  constructor() {
    super();
  }

  private get _provider(): PhantomProvider | undefined {
    if (window?.solana?.isPhantom) {
      return window.solana;
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

  get publicKey(): PublicKey {
    return this._provider?.publicKey || DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    if (!this._provider) {
      window.open("https://phantom.app/", "_blank", "noopener noreferrer");
      throw new Error("Phantom not installed");
    }
    if (!this._provider.listeners("connect").length) {
      this._provider?.on("connect", this._handleConnect);
    }
    if (!this._provider.listeners("disconnect").length) {
      this._provider?.on("disconnect", this._handleDisconnect);
    }
    await this._provider?.connect();
  };

  disconnect(): void {
    if (this._provider) {
      void this._provider.disconnect();
    }
  }
}
