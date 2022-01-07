import type { WalletName } from "@solana/wallet-adapter-base";
import {
  BaseSignerWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

export const ReadonlyWalletName = "ReadOnly" as WalletName;

export class ReadonlyAdapter extends BaseSignerWalletAdapter {
  name = ReadonlyWalletName;
  url = "https://docs.solana.com/wallet-guide/paper-wallet";
  icon = "data:image/svg+xml;base64,<bas64 svg icon>"; // TODO(michael): Get base64 svg icon

  private _publicKey: PublicKey | null = null;

  constructor() {
    super();
    const localPubkey =
      process.env.REACT_APP_LOCAL_PUBKEY ?? process.env.LOCAL_PUBKEY;
    if (!localPubkey) {
      console.warn("LOCAL_PUBKEY not set for readonly provider");
    } else {
      this._publicKey = new PublicKey(localPubkey);
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get readyState(): WalletReadyState {
    return WalletReadyState.Loadable;
  }

  get connecting(): boolean {
    return !!this._publicKey;
  }

  signTransaction(_transaction: Transaction): Promise<Transaction> {
    throw new Error("ReadonlyAdapter cannot sign transactions.");
  }
  signAllTransactions(_transaction: Transaction[]): Promise<Transaction[]> {
    throw new Error("ReadonlyAdapter cannot sign transactions.");
  }

  connect(pubkey?: string): Promise<void> {
    if (pubkey) {
      this._publicKey = new PublicKey(pubkey);
    }
    if (!this._publicKey) {
      throw new Error("No pubkey was set");
    }
    this.emit("connect", this._publicKey);
    return Promise.resolve();
  }
  disconnect(): Promise<void> {
    this.emit("disconnect");
    return Promise.resolve();
  }
}
