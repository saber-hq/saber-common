import type {
  Broadcaster,
  SignAndBroadcastOptions,
} from "@saberhq/solana-contrib";
import {
  doSignAndBroadcastTransaction,
  PendingTransaction,
} from "@saberhq/solana-contrib";
import type { WrappedAdapter } from "@saberhq/solana-wallet-adapters";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";

import type { ConnectedWallet, WalletAdapter } from "./types.js";

export class SolanaAdapter implements WalletAdapter {
  constructor(readonly wrapped: WrappedAdapter) {}

  get publicKey(): PublicKey | null {
    return this.wrapped.publicKey;
  }

  get autoApprove(): boolean {
    return this.wrapped.autoApprove;
  }

  get connected(): boolean {
    return this.wrapped.connected;
  }

  connect(): Promise<void> {
    return this.wrapped.connect();
  }

  disconnect(): void | Promise<void> {
    return this.wrapped.disconnect();
  }

  on(event: "connect" | "disconnect", fn: () => void): void {
    return this.wrapped.on(event, fn);
  }

  async signAndBroadcastTransaction(
    transaction: Transaction,
    connection: Connection,
    broadcaster: Broadcaster,
    opts?: SignAndBroadcastOptions | undefined
  ): Promise<PendingTransaction> {
    const signature = await this.wrapped.signAndBroadcastTransaction(
      transaction,
      connection,
      broadcaster.getLatestBlockhash.bind(broadcaster),
      opts
    );
    if (signature) {
      return new PendingTransaction(connection, signature);
    }
    return await doSignAndBroadcastTransaction(
      this as ConnectedWallet,
      transaction,
      broadcaster,
      opts
    );
  }

  signTransaction(tx: Transaction): Promise<Transaction> {
    return this.wrapped.signTransaction(tx);
  }

  signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return this.wrapped.signAllTransactions(txs);
  }
}
