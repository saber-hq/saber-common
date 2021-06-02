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
import { LEDGER, MATHWALLET, PHANTOM, SOLLET } from "./icons";

export enum WalletType {
  Sollet = "Sollet",
  SolletExtension = "SolletExtension",
  Ledger = "Ledger",
  Solong = "Solong",
  Phantom = "Phantom",
  MathWallet = "MathWallet",
}
export const WALLET_PROVIDERS: { [W in WalletType]: WalletProviderInfo } = {
  [WalletType.Sollet]: {
    name: "Sollet",
    url: "https://www.sollet.io",
    icon: LEDGER,
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
    icon: SOLLET,
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
};

export interface WalletProviderInfo {
  name: string;
  url: string;
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
  makeAdapter: WalletAdapterConstructor;
  isInstalled?: () => boolean;
  isMobile?: boolean;
}
