import Wallet from "@project-serum/sol-wallet-adapter";
import * as React from "react";

import {
  LedgerWalletAdapter,
  MathWalletAdapter,
  PhantomWalletAdapter,
  SolletExtensionAdapter,
  SolongWalletAdapter,
  WalletAdapterConstructor,
} from "./adapters";
import LedgerIcon from "./icons/ledger.svg";
import MathWalletIcon from "./icons/mathwallet.svg";
import PhantomIcon from "./icons/phantom.svg";
import SolletIcon from "./icons/sollet.svg";
import SolongIcon from "./icons/solong.png";

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
    icon: <SolletIcon />,
    makeAdapter: Wallet,
    isMobile: true,
  },
  [WalletType.SolletExtension]: {
    name: "Sollet Extension",
    url: "https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno",
    icon: <SolletIcon />,
    makeAdapter: SolletExtensionAdapter,

    isInstalled: () => window.sollet !== undefined,
  },
  [WalletType.Ledger]: {
    name: "Ledger",
    url: "https://www.ledger.com",
    icon: <LedgerIcon />,
    makeAdapter: LedgerWalletAdapter,
  },
  [WalletType.Solong]: {
    name: "Solong",
    url: "https://solongwallet.com/",
    icon: SolongIcon,
    makeAdapter: SolongWalletAdapter,

    isInstalled: () => window.solong !== undefined,
  },
  [WalletType.Phantom]: {
    name: "Phantom",
    url: "https://www.phantom.app",
    icon: <PhantomIcon />,
    makeAdapter: PhantomWalletAdapter,

    isInstalled: () => window.solana?.isPhantom === true,
  },
  [WalletType.MathWallet]: {
    name: "MathWallet",
    url: "https://www.mathwallet.org",
    icon: <MathWalletIcon />,
    makeAdapter: MathWalletAdapter,
    isInstalled: () => window.solana?.isMathWallet === true,
    isMobile: true,
  },
};

export interface WalletProviderInfo {
  name: string;
  url: string;
  icon: string | React.ReactNode;
  makeAdapter: WalletAdapterConstructor;
  isInstalled?: () => boolean;
  isMobile?: boolean;
}
