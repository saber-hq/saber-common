import { SignerWallet } from "@saberhq/solana-contrib";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { BaseWalletAdapter } from "@solana/wallet-adapter-base";
import type {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

import { DEFAULT_PUBLIC_KEY } from "../types";

export class SecretKeyAdapter extends BaseWalletAdapter {
  _connecting: boolean;
  _wallet: SignerWallet | null;
  _publicKey: PublicKey | null;

  _connected: boolean;

  constructor() {
    super();
    this._connecting = false;
    this._wallet = null;
    this._publicKey = null;
    this._connected = false;
  }

  get ready(): boolean {
    return true;
  }

  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get autoApprove(): boolean {
    return false;
  }

  public signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transactions);
    }
    return wallet.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey {
    return this._publicKey ?? DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transaction);
    }
    return wallet.signTransaction(transaction);
  }

  async sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ): Promise<TransactionSignature> {
    throw new Error("sendTransaction not implemented by SecretKeyAdapter");

    return Promise.resolve();
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
    this.emit("connect");
    return Promise.resolve();
  };

  disconnect(): Promise<void> {
    if (this._wallet) {
      this._wallet = null;
      this._publicKey = null;
      this._connected = false;
      this.emit("disconnect");
    }

    return Promise.resolve();
  }
}
