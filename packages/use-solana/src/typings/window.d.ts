import type {
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";

type ConnectOptions = {
  onlyIfTrusted?: boolean;
};

export interface CoinbaseWalletProvider {
  publicKey?: PublicKey;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signAndSendTransaction(
    transaction: Transaction,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

type ExodusEvent = "accountChanged" | "connect" | "disconnect";
type ExodusRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signAndSendTransaction"
  | "signMessage"
  | "postMessage";

export interface ExodusProvider {
  publicKey: PublicKey | null;
  isConnected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: (options?: ConnectOptions) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => void;
  on: (event: ExodusEvent, handler: (args: unknown) => void) => void;
  request: (method: ExodusRequestMethod, params: unknown[]) => Promise<unknown>;

  isExodus: true;
  isMathWallet: undefined;
  isPhantom: undefined;
}

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

  signAndSendTransaction(
    transaction: Transaction,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;

  connect: (args?: { onlyIfTrusted: true }) => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: unknown) => void) => void;
  request: (method: PhantomRequestMethod, params: unknown) => Promise<unknown>;
  listeners: (event: PhantomEvent) => (() => void)[];

  isExodus: undefined;
  isMathWallet: undefined;
  isPhantom: true;
}

export interface MathWalletProvider {
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  getAccount: () => Promise<string>;

  isExodus: undefined;
  isMathWallet: true;
  isPhantom: undefined;
}

export interface NightlyProvider {
  publicKey: PublicKey;
  connect(onDisconnect?: () => void): Promise<PublicKey>;
  disconnect(): Promise<void>;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

declare global {
  interface Window {
    solana?:
      | ExodusProvider
      | MathWalletProvider
      | PhantomProvider
      | { isExodus?: false; isMathWallet?: false; isPhantom?: false };
    exodus?: {
      solana: ExodusProvider;
    };
    solflare?: PhantomProvider & {
      isSolflare?: boolean;
    };
    sollet?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    glowSolana?: {
      signAndSendTransaction(
        transaction: {
          serialize(): {
            toString(encoding: "base64"): string;
          };
        },
        network?: "devnet" | "mainnet"
      ): Promise<{ signature: TransactionSignature }>;
    };
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
    coinbaseSolana?: CoinbaseWalletProvider;
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
    nightly?: {
      solana?: NightlyProvider;
    };
    braveSolana?: {
      isBraveWallet?: boolean;
    };
  }
}
