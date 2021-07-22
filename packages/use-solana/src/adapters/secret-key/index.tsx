import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";

export class SecretKeyAdapter extends EventEmitter implements WalletAdapter {
  _keypair?: Keypair;
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

  public signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const kp = this._keypair;
    if (!kp) {
      return Promise.resolve(transactions);
    }
    return Promise.resolve(
      transactions.map((tx) => {
        tx.partialSign(kp);
        return tx;
      })
    );
  }

  get publicKey(): PublicKey {
    return this._keypair?.publicKey ?? DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const kp = this._keypair;
    if (!kp) {
      return Promise.resolve(transaction);
    }
    transaction.partialSign(kp);
    return transaction;
  }

  connect = (args?: unknown): Promise<void> => {
    const argsTyped = args as
      | {
          secretKey?: Uint8Array;
        }
      | undefined;
    const secretKey = argsTyped?.secretKey;
    if (!secretKey || !Array.isArray(secretKey)) {
      throw new Error("Secret key missing.");
    }
    this._keypair = Keypair.fromSecretKey(secretKey);
    this._connected = true;
    this.emit("connect", this.publicKey);
    return Promise.resolve();
  };

  disconnect(): void {
    if (this._keypair) {
      this._keypair = undefined;
      this._connected = false;
      this.emit("disconnect");
    }
  }
}
