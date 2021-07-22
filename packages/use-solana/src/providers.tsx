import Wallet from "@project-serum/sol-wallet-adapter";
import React from "react";

import {
  LedgerWalletAdapter,
  MathWalletAdapter,
  PhantomWalletAdapter,
  SolletExtensionAdapter,
  SolongWalletAdapter,
  WalletAdapterConstructor,
} from "./adapters";
import { Coin98Adapter } from "./adapters/coin98";
import { COIN98, FILE, LEDGER, MATHWALLET, PHANTOM, SOLLET } from "./icons";

export enum WalletType {
  Coin98 = "Coin98",
  Ledger = "Ledger",
  MathWallet = "MathWallet",
  Phantom = "Phantom",
  Sollet = "Sollet",
  SolletExtension = "SolletExtension",
  Solong = "Solong",
  SecretKey = "SecretKey",
}

export const WALLET_PROVIDERS: { [W in WalletType]: WalletProviderInfo } = {
  [WalletType.Sollet]: {
    name: "Sollet",
    url: "https://www.sollet.io",
    icon: SOLLET,
    makeAdapter: Wallet,
    isMobile: true,
  },
  [WalletType.SolletExtension]: {
    name: "Sollet Extension",
    url: "https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno",
    icon: SOLLET,
    makeAdapter: SolletExtensionAdapter,

    isInstalled: () => window.sollet !== undefined,
  },
  [WalletType.Ledger]: {
    name: "Ledger",
    url: "https://www.ledger.com",
    icon: LEDGER,
    makeAdapter: LedgerWalletAdapter,
  },
  [WalletType.Solong]: {
    name: "Solong",
    url: "https://solongwallet.com/",
    icon: "https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/solong.png",
    makeAdapter: SolongWalletAdapter,

    isInstalled: () => window.solong !== undefined,
  },
  [WalletType.Phantom]: {
    name: "Phantom",
    url: "https://www.phantom.app",
    icon: PHANTOM,
    makeAdapter: PhantomWalletAdapter,

    isInstalled: () => window.solana?.isPhantom === true,
  },
  [WalletType.MathWallet]: {
    name: "MathWallet",
    url: "https://www.mathwallet.org",
    icon: MATHWALLET,
    makeAdapter: MathWalletAdapter,
    isInstalled: () => window.solana?.isMathWallet === true,
    isMobile: true,
  },
  [WalletType.Coin98]: {
    name: "Coin98",
    url: "https://docs.coin98.com/products/coin98-wallet",
    icon: COIN98,
    makeAdapter: Coin98Adapter,
    isInstalled: () => window.coin98 !== undefined,
    isMobile: true,
  },
  [WalletType.SecretKey]: {
    name: "Secret Key",
    url: "https://solana.com/",
    icon: FILE,
    makeAdapter: LedgerWalletAdapter,
  },
};

export interface WalletProviderInfo {
  name: string;
  url: string;
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
  makeAdapter: WalletAdapterConstructor;
  isInstalled?: () => boolean;
  isMobile?: boolean;
}
