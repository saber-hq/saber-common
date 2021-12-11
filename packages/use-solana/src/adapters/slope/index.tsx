import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import EventEmitter from "eventemitter3";

import type { WalletAdapter } from "../types";

export class SlopeWalletAdapter extends EventEmitter implements WalletAdapter {
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
    if (!window.Slope) {
      throw new Error("Slope not found");
    }

    const wallet = new window.Slope();
    const messages: string[] = [];
    transactions.map((transaction) => {
      messages.push(bs58.encode(transaction.serializeMessage()));
    });
    const { msg, data } = await wallet.signAllTransactions(messages);

    const length = transactions.length;
    if (!data.publicKey || data.signatures?.length !== length) {
      throw new Error(msg);
    }

    const publicKey = new PublicKey(data.publicKey);

    for (let i = 0; i < length; i++) {
      transactions[i]?.addSignature(
        publicKey,
        bs58.decode(data.signatures[i] || "")
      );
    }

    return transactions;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey ?? null;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!window.Slope) {
      throw new Error("Slope not found");
    }

    const wallet = new window.Slope();
    const message = bs58.encode(transaction.serializeMessage());

    const { msg, data } = await wallet.signTransaction(message);
    if (!data.publicKey || !data.signature) throw new Error(msg);

    const publicKey = new PublicKey(data.publicKey);
    const signature = bs58.decode(data.signature);

    transaction.addSignature(publicKey, signature);

    return transaction;
  }

  connect = async (): Promise<void> => {
    if (this._onProcess) {
      return;
    }

    if (window.Slope === undefined) {
      window.open(
        "https://www.slope.finance/",
        "_blank",
        "noopener noreferrer"
      );
      throw new Error("Slope not installed");
    }

    this._onProcess = true;
    const wallet = new window.Slope();

    await wallet
      .connect()
      .then(({ msg, data }) => {
        if (!data.publicKey) {
          throw new Error(msg);
        }
        this._publicKey = new PublicKey(data.publicKey);
        this._connected = true;
        this.emit("connect", this._publicKey);
      })
      .catch(async () => {
        await this.disconnect();
      })
      .finally(() => {
        this._onProcess = false;
      });
  };

  async disconnect(): Promise<void> {
    if (this._publicKey && window.Slope) {
      this._publicKey = undefined;
      this._connected = false;

      const wallet = new window.Slope();
      await wallet.disconnect();
      this.emit("disconnect");
    }
  }
}
