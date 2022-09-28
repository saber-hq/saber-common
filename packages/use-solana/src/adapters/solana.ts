import type {
  Broadcaster,
  SignAndBroadcastOptions,
} from "@saberhq/solana-contrib";
import {
  doSignAndBroadcastTransaction,
  PendingTransaction,
} from "@saberhq/solana-contrib";
import type {
  EventEmitter,
  SignerWalletAdapter,
  WalletAdapterEvents,
} from "@solana/wallet-adapter-base";
import { BaseSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { GlowWalletName } from "@solana/wallet-adapter-glow";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";

import type { ConnectedWallet, WalletAdapter } from "./types";

export class SolanaWalletAdapter implements WalletAdapter {
  constructor(
    readonly adapter: Omit<
      SignerWalletAdapter,
      | "sendTransaction"
      | keyof EventEmitter
      | "signTransaction"
      | "signAllTransactions"
    > &
      EventEmitter<WalletAdapterEvents> & {
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (
          transactions: Transaction[]
        ) => Promise<Transaction[]>;
      }
  ) {}

  async signAndBroadcastTransaction(
    transaction: Transaction,
    connection: Connection,
    broadcaster: Broadcaster,
    opts?: SignAndBroadcastOptions
  ): Promise<PendingTransaction> {
    if (!transaction.feePayer) {
      transaction.feePayer = this.publicKey ?? undefined;
    }

    if (this.adapter.name === PhantomWalletName) {
      if (
        window.solana?.isPhantom &&
        // check to see if phantom version supports this
        "signAndSendTransaction" in window.solana &&
        // Phantom doesn't handle partial signers, so if they are provided, don't use `signAndSendTransaction`
        (!opts?.signers || opts.signers.length === 0)
      ) {
        // HACK: Phantom's `signAndSendTransaction` should always set these, but doesn't yet
        if (!transaction.recentBlockhash) {
          const latestBlockhash = await broadcaster.getLatestBlockhash();
          transaction.recentBlockhash = latestBlockhash.blockhash;
          transaction.lastValidBlockHeight =
            latestBlockhash.lastValidBlockHeight;
        }
        const { signature } = await window.solana.signAndSendTransaction(
          transaction,
          opts
        );
        return new PendingTransaction(connection, signature);
      }
    } else if (this.adapter.name === GlowWalletName) {
      if (window.glowSolana && window.glowSolana.signAndSendTransaction) {
        // HACK: Glow's `signAndSendTransaction` should always set these, but doesn't yet
        if (!transaction.recentBlockhash) {
          const latestBlockhash = await broadcaster.getLatestBlockhash();
          transaction.recentBlockhash = latestBlockhash.blockhash;
          transaction.lastValidBlockHeight =
            latestBlockhash.lastValidBlockHeight;
        }
        const result = await window.glowSolana.signAndSendTransaction({
          serialize() {
            return {
              toString(): string {
                return transaction
                  .serialize({
                    verifySignatures: false,
                  })
                  .toString("base64");
              },
            };
          },
        });

        return new PendingTransaction(connection, result.signature);
      }
    } else if (this.adapter instanceof BaseSignerWalletAdapter) {
      // attempt to use the wallet's native transaction sending feature
      const signature = await this.adapter.sendTransaction(
        transaction,
        connection,
        opts
      );
      return new PendingTransaction(connection, signature);
    }
    return await doSignAndBroadcastTransaction(
      this as ConnectedWallet,
      transaction,
      broadcaster,
      opts
    );
  }

  get connected(): boolean {
    return this.adapter.connected;
  }

  get autoApprove(): boolean {
    return false;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return this.adapter.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this.adapter.publicKey;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.adapter) {
      return transaction;
    }

    return this.adapter.signTransaction(transaction);
  }

  connect = async (): Promise<void> => {
    await this.adapter.connect();
  };

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
  }

  on(event: "connect" | "disconnect", fn: () => void): void {
    this.adapter.on(event, fn);
  }
}
