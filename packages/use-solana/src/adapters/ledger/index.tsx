import type Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import type { PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { WalletAdapter } from "../types";
import { getPublicKey, getSolanaDerivationPath, signTransaction } from "./core";

const DEFAULT_DERIVATION_PATH = getSolanaDerivationPath();

export interface LedgerHDWalletPath {
  account?: number;
  change?: number;
}

/**
 * An account associated with the connected Ledger device.
 */
export interface LedgerHDWalletAccount extends LedgerHDWalletPath {
  key: PublicKey;
}

export class LedgerWalletAdapter extends EventEmitter implements WalletAdapter {
  private _connecting = false;
  private _publicKey: PublicKey | null = null;
  private _transport: Transport | null = null;
  private _derivationPath: Buffer = DEFAULT_DERIVATION_PATH;

  constructor() {
    super();
  }

  get publicKey(): PublicKey | null {
    return this._publicKey ?? null;
  }

  get connected(): boolean {
    return this._publicKey !== null;
  }

  get autoApprove(): boolean {
    return false;
  }

  async signAllTransactions(
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

    const signature = await signTransaction(
      this._transport,
      transaction,
      this._derivationPath
    );

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
      if (args) {
        const { account, change } = args as {
          account?: number;
          change?: number;
        };
        this._derivationPath = getSolanaDerivationPath(account, change);
        this._publicKey = await getPublicKey(
          this._transport,
          this._derivationPath
        );
      } else {
        this._publicKey = await getPublicKey(this._transport);
      }
      this.emit("connect", this._publicKey);
    } catch (error) {
      await this.disconnect();
      throw new LedgerError(error as Error);
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

  /**
   * Ledger transport.
   */
  get transport(): Transport | null {
    return this._transport;
  }

  /**
   * Fetches accounts associated with the given derivation paths.
   *
   * @param paths
   * @returns
   */
  static async fetchAccountsForPaths(
    paths: LedgerHDWalletPath[]
  ): Promise<LedgerHDWalletAccount[]> {
    let transport: Transport | null = null;
    try {
      transport = await TransportWebUSB.create();
      const ret = [];
      for (const path of paths) {
        const derivationPath = getSolanaDerivationPath(
          path.account,
          path.change
        );
        ret.push({
          ...path,
          key: await getPublicKey(transport, derivationPath),
        });
      }
      return ret;
    } catch (error) {
      throw new LedgerError(error as Error);
    } finally {
      await transport?.close();
    }
  }
}

export class LedgerError extends Error {
  constructor(error: Error) {
    super(`Ledger Error: ${error.message}`);
    this.name = "LedgerError";
  }
}
