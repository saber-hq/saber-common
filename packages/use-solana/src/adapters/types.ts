import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

export interface WalletAdapter<Connected extends boolean = boolean> {
  publicKey: Connected extends true ? PublicKey : null;
  autoApprove: boolean;
  connected: Connected;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
  connect: (args?: unknown) => Promise<void>;
  disconnect: () => void | Promise<void>;
  on(event: string, fn: () => void): this;
}

export type ConnectedWallet = WalletAdapter<true>;

export type WalletAdapterConstructor = new (
  providerUrl: string,
  endpoint: string
) => WalletAdapter;

/**
 * Wallet adapter wrapper with caching of the PublicKey built-in.
 */
export class WrappedWalletAdapter<Connected extends boolean = boolean>
  implements WalletAdapter<Connected>
{
  constructor(public readonly adapter: WalletAdapter<Connected>) {}

  private _prevPubkey: PublicKey | null = null;
  private _publicKeyCached: PublicKey | null = null;

  get publicKey(): Connected extends true ? PublicKey : null {
    if (!this.connected) {
      return null as Connected extends true ? PublicKey : null;
    }
    if (this.adapter.publicKey) {
      if (this.adapter.publicKey === this._prevPubkey) {
        if (this._publicKeyCached) {
          return this._publicKeyCached as Connected extends true
            ? PublicKey
            : null;
        }
      }
      this._prevPubkey = this.adapter.publicKey;
      this._publicKeyCached = new PublicKey(this.adapter.publicKey.toString());
      return this._publicKeyCached as Connected extends true ? PublicKey : null;
    }
    return this.adapter.publicKey;
  }

  get autoApprove(): boolean {
    return this.adapter.autoApprove;
  }

  get connected(): Connected {
    return this.adapter.connected;
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    return this.adapter.signTransaction(transaction);
  }

  signAllTransactions(transaction: Transaction[]): Promise<Transaction[]> {
    return this.adapter.signAllTransactions(transaction);
  }

  connect(args?: unknown): Promise<void> {
    return this.adapter.connect(args);
  }

  disconnect(): void | Promise<void> {
    return this.adapter.disconnect();
  }

  on(event: string, fn: () => void): this {
    this.adapter.on(event, fn);
    return this;
  }
}
