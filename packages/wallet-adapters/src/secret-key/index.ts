import { SignerWallet } from "@saberhq/solana-contrib";
import type { WalletName } from "@solana/wallet-adapter-base";
import {
  BaseSignerWalletAdapter,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import type { PublicKey, Transaction } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

export const SecretKeyWalletName = "SecretKey" as WalletName;

export class SecretKeyAdapter extends BaseSignerWalletAdapter {
  name = SecretKeyWalletName;
  url = "https://docs.solana.com/wallet-guide/paper-wallet";
  icon = "data:image/svg+xml;base64,<bas64 svg icon>"; // TODO(michael): Get base64 svg icon

  private _wallet?: SignerWallet;
  private _publicKey: PublicKey | null;
  private _connecting: boolean;
  private _readyState: WalletReadyState =
    typeof window === "undefined" || typeof document === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.Loadable;

  constructor() {
    super();
    this._connecting = false;
    this._publicKey = null;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get autoApprove(): boolean {
    return false;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transactions);
    }
    return wallet.signAllTransactions(transactions);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const wallet = this._wallet;
    if (!wallet) {
      return Promise.resolve(transaction);
    }
    return wallet.signTransaction(transaction);
  }

  connect = (args?: { secretKey: number[] }): Promise<void> => {
    if (!args?.secretKey || !Array.isArray(args?.secretKey)) {
      throw new Error("Secret key missing.");
    }
    this._connecting = true;
    const { secretKey } = args;
    this._wallet = new SignerWallet(
      Keypair.fromSecretKey(Uint8Array.from(secretKey))
    );
    this._publicKey = this._wallet.publicKey;
    this.emit("connect", this._publicKey);
    this._connecting = false;
    return Promise.resolve();
  };

  disconnect(): Promise<void> {
    if (this._wallet) {
      this._wallet = undefined;
      this._publicKey = null;
      this.emit("disconnect");
    }
    return Promise.resolve();
  }
}
