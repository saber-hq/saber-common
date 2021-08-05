import type { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { WalletAdapter } from "../types";
import { DEFAULT_PUBLIC_KEY } from "../types";

export class SecretKeyAdapter extends EventEmitter implements WalletAdapter {
  _keypair?: Keypair;
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
    return this._publicKey ?? DEFAULT_PUBLIC_KEY;
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
          keypair?: Keypair;
        }
      | undefined;
    const keypair = argsTyped?.keypair;
    if (!keypair) {
      throw new Error("Keypair missing.");
    }
    this._keypair = keypair;
    this._publicKey = this._keypair.publicKey;
    this._connected = true;
    this.emit("connect", this.publicKey);
    return Promise.resolve();
  };

  disconnect(): void {
    if (this._keypair) {
      this._keypair = undefined;
      this._publicKey = undefined;
      this._publicKey = undefined;
      this._connected = false;
      this.emit("disconnect");
    }
  }
}
