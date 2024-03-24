import type {
  Broadcaster,
  PendingTransaction,
  SignAndBroadcastOptions,
  Wallet,
} from "@saberhq/solana-contrib";
import { PublicKey } from "@saberhq/solana-contrib";
import type {
  SupportedTransactionVersions,
  TransactionOrVersionedTransaction,
} from "@solana/wallet-adapter-base";
import type { WalletConnectWalletAdapterConfig } from "@solana/wallet-adapter-walletconnect";
import type {
  Connection,
  PublicKey as SolanaPublicKey,
  Transaction,
} from "@solana/web3.js";

export interface WalletAdapter<
  Connected extends boolean = boolean,
  V extends SupportedTransactionVersions = SupportedTransactionVersions,
> extends Omit<Wallet<V>, "publicKey"> {
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
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction>;
}

export type ConnectedWallet = WalletAdapter<true> & Wallet;

export type WalletOptions = WalletConnectWalletAdapterConfig;

export type WalletAdapterBuilder = (
  providerUrl: string,
  endpoint: string,
  options?: WalletOptions,
) => WalletAdapter;

/**
 * Wallet adapter wrapper with caching of the PublicKey built-in.
 */
export class WrappedWalletAdapter<
  Connected extends boolean = boolean,
  V extends SupportedTransactionVersions = SupportedTransactionVersions,
> implements Omit<WalletAdapter<Connected, V>, "publicKey">
{
  readonly supportedTransactionVersions: V;

  constructor(readonly adapter: WalletAdapter<Connected, V>) {
    this.supportedTransactionVersions = adapter.supportedTransactionVersions;
  }

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
    opts?: SignAndBroadcastOptions,
  ): Promise<PendingTransaction> {
    return this.adapter.signAndBroadcastTransaction(
      transaction,
      connection,
      broadcaster,
      opts,
    );
  }

  signTransaction<T extends TransactionOrVersionedTransaction<V>>(
    tx: T,
  ): Promise<T> {
    return this.adapter.signTransaction(tx);
  }

  signAllTransactions<T extends TransactionOrVersionedTransaction<V>>(
    transaction: T[],
  ): Promise<T[]> {
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
