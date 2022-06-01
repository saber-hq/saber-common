/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type {
  Broadcaster,
  SignAndBroadcastOptions,
} from "@saberhq/solana-contrib";
import type {
  SignerWalletAdapter,
  WalletAdapterEvents,
} from "@solana/wallet-adapter-base";
import { BaseSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { GlowWalletName } from "@solana/wallet-adapter-glow";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import type {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import type EventEmitter from "eventemitter3";

export type WrappedAdapterInput = Omit<
  SignerWalletAdapter,
  "sendTransaction" | keyof EventEmitter
> &
  EventEmitter<WalletAdapterEvents>;

/**
 * Wrapper for Solana adapters.
 */
export class WrappedAdapter {
  constructor(
    readonly adapter: Omit<
      SignerWalletAdapter,
      "sendTransaction" | keyof EventEmitter
    > &
      EventEmitter<WalletAdapterEvents>
  ) {}

  async signAndBroadcastTransaction(
    transaction: Transaction,
    connection: Connection,
    getLatestBlockhash: Broadcaster["getLatestBlockhash"],
    opts?: SignAndBroadcastOptions
  ): Promise<TransactionSignature | null> {
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
          const latestBlockhash = await getLatestBlockhash();
          transaction.recentBlockhash = latestBlockhash.blockhash;
          transaction.lastValidBlockHeight =
            latestBlockhash.lastValidBlockHeight;
        }
        const { signature } = await window.solana.signAndSendTransaction(
          transaction,
          opts
        );
        return signature;
      }
    } else if (this.adapter.name === GlowWalletName) {
      if (window.glowSolana && window.glowSolana.signAndSendTransaction) {
        // HACK: Glow's `signAndSendTransaction` should always set these, but doesn't yet
        if (!transaction.recentBlockhash) {
          const latestBlockhash = await getLatestBlockhash();
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
        return result.signature;
      }
    } else if (this.adapter instanceof BaseSignerWalletAdapter) {
      // attempt to use the wallet's native transaction sending feature
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const signature = await this.adapter.sendTransaction(
        transaction,
        connection,
        opts
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return signature;
    }
    return null;
  }

  get connected(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.adapter.connected;
  }

  get autoApprove(): boolean {
    return false;
  }

  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return this.adapter.signAllTransactions(transactions);
  }

  get publicKey(): PublicKey | null {
    return this.adapter.publicKey;
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.adapter) {
      return Promise.resolve(transaction);
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
