import type {
  Broadcaster,
  PendingTransaction,
  SignAndBroadcastOptions,
  Wallet,
} from "@saberhq/solana-contrib";
import { PublicKey } from "@saberhq/solana-contrib";
import type { WalletConnectWalletAdapterConfig } from "@solana/wallet-adapter-walletconnect";
import type {
  Connection,
  PublicKey as SolanaPublicKey,
  Transaction,
} from "@solana/web3.js";

export interface WalletAdapter<Connected extends boolean = boolean>
  extends Omit<Wallet, "publicKey"> {
  publicKey: Connected extends true ? SolanaPublicKey : null;
  autoApprove: boolean;
  connected: Connected;

  connect: (args?: unknown) => Promise<void>;
  disconnect: () => void | Promise<void>;
  on(event: "connect" | "disconnect", fn: () => void): void;

  /**
   * Signs and broadcasts a transaction.
   *
   * @param transaction
   * @param broadcaster
   * @param options
   */
  signAndBroadcastTransaction(
    transaction: Transaction,
    connection: Connection,
    broadcaster: Broadcaster,
    opts?: SignAndBroadcastOptions
  ): Promise<PendingTransaction>;
}

export type ConnectedWallet = WalletAdapter<true> & Wallet;

export type WalletOptions = WalletConnectWalletAdapterConfig;

export type WalletAdapterBuilder = (
  providerUrl: string,
  endpoint: string,
  options?: WalletOptions
) => WalletAdapter;

/**
 * Wallet adapter wrapper with caching of the PublicKey built-in.
 */
export class WrappedWalletAdapter<Connected extends boolean = boolean>
  implements Omit<WalletAdapter<Connected>, "publicKey">
{
  constructor(readonly adapter: WalletAdapter<Connected>) {}

  private _prevPubkey: SolanaPublicKey | null = null;
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
    throw new Error("Invalid wallet connection state");
  }

  get autoApprove(): boolean {
    return this.adapter.autoApprove;
  }

  get connected(): Connected {
    return (
      this.adapter.connected &&
      // need this branch b/c Solflare adapter does not respect the connected state properly
      (!!this.adapter.publicKey as Connected)
    );
  }

  signAndBroadcastTransaction(
    transaction: Transaction,
    connection: Connection,
    broadcaster: Broadcaster,
    opts?: SignAndBroadcastOptions
  ): Promise<PendingTransaction> {
    return this.adapter.signAndBroadcastTransaction(
      transaction,
      connection,
      broadcaster,
      opts
    );
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

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
    this._prevPubkey = null;
    this._publicKeyCached = null;
  }

  on(event: "connect" | "disconnect", fn: () => void): void {
    this.adapter.on(event, fn);
  }
}
