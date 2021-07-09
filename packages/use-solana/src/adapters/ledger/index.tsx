import type Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";
import { getPublicKey, getSolanaDerivationPath, signTransaction } from "./core";

export class LedgerWalletAdapter extends EventEmitter implements WalletAdapter {
  _connecting: boolean;
  _publicKey: PublicKey | null;
  _transport: Transport | null;

  constructor() {
    super();
    this._connecting = false;
    this._publicKey = null;
    this._transport = null;
  }

  get publicKey(): PublicKey {
    return this._publicKey || DEFAULT_PUBLIC_KEY;
  }

  get connected(): boolean {
    return this._publicKey !== null;
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

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._transport || !this._publicKey) {
      throw new Error("Not connected to Ledger");
    }

    // @TODO: account selection (derivation path changes with account)
    const signature = await signTransaction(this._transport, transaction);

    transaction.addSignature(this._publicKey, signature);

    return transaction;
  }

  async connect(args?: unknown): Promise<void> {
    if (this._connecting) {
      return;
    }

    this._connecting = true;

    try {
      // @TODO: transport selection (WebUSB, WebHID, bluetooth, ...)
      this._transport = await TransportWebUSB.create();
      // @TODO: account selection
      if (args) {
        const { account, change } = args as {
          account?: number;
          change?: number;
        };
        this._publicKey = await getPublicKey(
          this._transport,
          getSolanaDerivationPath(account, change)
        );
      } else {
        this._publicKey = await getPublicKey(this._transport);
      }
      this.emit("connect", this._publicKey);
    } catch (error) {
      await this.disconnect();
      throw new LedgerError(error);
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    let emit = false;
    if (this._transport) {
      await this._transport.close();
      this._transport = null;
      emit = true;
    }

    this._connecting = false;
    this._publicKey = null;

    if (emit) {
      this.emit("disconnect");
    }
  }
}

export class LedgerError extends Error {
  constructor(error: Error) {
    super(`Ledger Error: ${error.message}`);
    this.name = "LedgerError";
  }
}
