import { PublicKey, Transaction } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as EventEmitter from "eventemitter3";

import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";

export class Coin98Adapter extends EventEmitter implements WalletAdapter {
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
    const result: Transaction[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (transaction) {
        const signed = await this.signTransaction(transaction);
        result.push(signed);
      }
    }
    return result;
  }

  get publicKey(): PublicKey {
    return this._publicKey || DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!window.coin98) {
      throw new Error("Coin98 not found");
    }
    const { publicKey, signature } = (await window.coin98.sol.request({
      method: "sol_sign",
      params: [transaction],
    })) as { publicKey: string; signature: string };
    transaction.addSignature(new PublicKey(publicKey), bs58.decode(signature));
    return transaction;
  }

  connect = async (): Promise<void> => {
    if (this._onProcess) {
      return;
    }

    if (window.coin98 === undefined) {
      throw new Error("Coin98 not installed");
    }

    this._onProcess = true;
    await window.coin98.sol
      .request({ method: "sol_accounts" })
      .then((rawAccounts) => {
        const accounts = rawAccounts as string[];
        if (!accounts[0]) {
          throw new Error("No accounts found.");
        }
        this._publicKey = new PublicKey(accounts[0]);
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
      window.coin98?.sol.disconnect();
      this.emit("disconnect");
    }
  }
}
