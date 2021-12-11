import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { WalletAdapter } from "../types";

export class SolongWalletAdapter extends EventEmitter implements WalletAdapter {
  _publicKey?: PublicKey;
  _onProcess: boolean;
  _connected: boolean;

  constructor() {
    super();
    this._onProcess = false;
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  get autoApprove(): boolean {
    return false;
  }

  public async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const solong = window.solong;
    if (!solong) {
      throw new Error("Solong not found");
    }
    if (solong.signAllTransactions) {
      return solong.signAllTransactions(transactions);
    } else {
      const result: Transaction[] = [];
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        if (transaction) {
          const signed = await solong.signTransaction(transaction);
          result.push(signed);
        }
      }

      return result;
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey ?? null;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!window.solong) {
      throw new Error("Solong not found");
    }
    return window.solong.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    if (this._onProcess) {
      return;
    }

    if (window.solong === undefined) {
      throw new Error("Solong not installed");
    }

    this._onProcess = true;
    await window.solong
      .selectAccount()
      .then((account) => {
        this._publicKey = new PublicKey(account);
        this._connected = true;
        this.emit("connect", this._publicKey);
      })
      .catch(() => {
        this.disconnect();
      })
      .finally(() => {
        this._onProcess = false;
      });
  };

  disconnect(): void {
    if (this._publicKey) {
      this._publicKey = undefined;
      this._connected = false;
      this.emit("disconnect");
    }
  }
}
