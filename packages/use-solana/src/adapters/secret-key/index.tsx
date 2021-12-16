import { SignerWallet } from "@saberhq/solana-contrib";
import type { PublicKey, Transaction } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { WalletAdapter } from "../types";

export class SecretKeyAdapter extends EventEmitter implements WalletAdapter {
  _wallet?: SignerWallet;
  _publicKey?: PublicKey;

  _connected: boolean;

  constructor() {
    super();
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  get autoApprove(): boolean {
    return false;
  }

  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transactions);
    }
    return wallet.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this._publicKey ?? null;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transaction);
    }
    return wallet.signTransaction(transaction);
  }

  connect = (args?: unknown): Promise<void> => {
    const argsTyped = args as
      | {
          secretKey?: number[];
        }
      | undefined;
    const secretKey = argsTyped?.secretKey;
    if (!secretKey || !Array.isArray(secretKey)) {
      throw new Error("Secret key missing.");
    }
    this._wallet = new SignerWallet(
      Keypair.fromSecretKey(Uint8Array.from(secretKey))
    );
    this._publicKey = this._wallet.publicKey;
    this._connected = true;
    this.emit("connect", this.publicKey);
    return Promise.resolve();
  };

  disconnect(): void {
    if (this._wallet) {
      this._wallet = undefined;
      this._publicKey = undefined;
      this._publicKey = undefined;
      this._connected = false;
      this.emit("disconnect");
    }
  }
}
