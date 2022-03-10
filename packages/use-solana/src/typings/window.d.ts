import type { PublicKey, Transaction } from "@solana/web3.js";

type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

export interface PhantomProvider {
  publicKey?: PublicKey;
  isConnected?: boolean;
  autoApprove?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: (args?: { onlyIfTrusted: true }) => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: unknown) => void) => void;
  request: (method: PhantomRequestMethod, params: unknown) => Promise<unknown>;
  listeners: (event: PhantomEvent) => (() => void)[];

  isPhantom: true;
  isMathWallet: undefined;
}

export interface MathWalletProvider {
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  getAccount: () => Promise<string>;

  isMathWallet: true;
  isPhantom: undefined;
}
declare global {
  interface Window {
    solana?:
      | MathWalletProvider
      | PhantomProvider
      | { isPhantom?: false; isMathWallet?: false };
    solflare?: PhantomProvider & {
      isSolflare?: boolean;
    };
    sollet?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    glow?: any;
    solong?: {
      signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
      selectAccount: () => Promise<string>;
    };
    coin98?: {
      sol: {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
        disconnect: () => void;
      };
    };
    clover_solana?: {
      signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
      getAccount: () => Promise<string>;
    };
    Slope?: {
      new (): {
        connect(): Promise<{
          msg: string;
          data: {
            publicKey?: string;
          };
        }>;
        disconnect(): Promise<{ msg: string }>;
        signTransaction(message: string): Promise<{
          msg: string;
          data: {
            publicKey?: string;
            signature?: string;
          };
        }>;
        signAllTransactions(messages: string[]): Promise<{
          msg: string;
          data: {
            publicKey?: string;
            signatures?: string[];
          };
        }>;
      };
    };
    huobiWallet?: {
      isHuobiWallet?: boolean;
    };
  }
}
