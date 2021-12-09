// import Wallet from "@project-serum/sol-wallet-adapter";
import type { Wallet } from "@solana/wallet-adapter-wallets";
import type { WalletName } from "@solana/wallet-adapter-wallets";

import { SecretKeyAdapter } from "./adapters/secret-key";

export interface CustomWallet extends Wallet {
  // name: string;
  // url: string;
  // icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
  // makeAdapter: WalletAdapterConstructor;
  // isInstalled?: () => boolean;
  isMobile?: boolean;
}

enum CustomWalletName {
  SecretKey = "SecretKey",
}

export type WalletType = WalletName | CustomWalletName;

export const getSecretKeyWallet = () => ({
  name: "Secret Key",
  url: "https://solana.com/",
  // icon: FILE,
  adapter: () => new SecretKeyAdapter(),
});

export type WalletProvider = Wallet & {
  name: WalletType;
};

// export enum WalletType {
//   Coin98 = "Coin98",
//   Ledger = "Ledger",
//   MathWallet = "MathWallet",
//   Phantom = "Phantom",
//   Slope = "Slope",
//   Sollet = "Sollet",
//   SolletExtension = "SolletExtension",
//   Solflare = "Solflare",
//   SolflareExtension = "SolflareExtension",
//   Solong = "Solong",
//   SecretKey = "SecretKey",
// }

// export const WALLET_PROVIDERS: { [W in WalletType]: WalletProvider } = {
//   [WalletName.SecretKey]: {
//     name: "Secret Key",
//     url: "https://solana.com/",
//     icon: FILE,
//     makeAdapter: SecretKeyAdapter,
//   },
// };

// export interface WalletProviderInfo extends Wallet {
//   name: string;
//   url: string;
//   icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
//   makeAdapter: WalletAdapterConstructor;
//   isInstalled?: () => boolean;
//   isMobile?: boolean;
// }
