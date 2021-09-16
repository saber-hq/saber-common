import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

export const DEFAULT_PUBLIC_KEY = new PublicKey(
  "11111111111111111111111111111111"
);

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
