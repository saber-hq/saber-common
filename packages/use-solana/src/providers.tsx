import type { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Coin98WalletAdapter } from "@solana/wallet-adapter-coin98";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SlopeWalletAdapter } from "@solana/wallet-adapter-slope";
import { SolletWalletAdapter } from "@solana/wallet-adapter-sollet";
import type React from "react";

import type { WalletAdapterBuilder } from "./adapters";
import {
  LedgerWalletAdapter,
  MathWalletAdapter,
  SolanaWalletAdapter,
  SolletExtensionAdapter,
  SolongWalletAdapter,
} from "./adapters";
import { SecretKeyAdapter } from "./adapters/secret-key";
import { SolflareAdapter } from "./adapters/solflare";
import { SolflareExtensionWalletAdapter } from "./adapters/solflare-extension";
import {
  COIN98,
  FILE,
  LEDGER,
  MATHWALLET,
  PHANTOM,
  SLOPE,
  SOLFLARE,
  SOLLET,
} from "./icons";

export enum WalletType {
  Coin98 = "Coin98",
  Ledger = "Ledger",
  MathWallet = "MathWallet",
  Phantom = "Phantom",
  Slope = "Slope",
  Sollet = "Sollet",
  SolletExtension = "SolletExtension",
  Solflare = "Solflare",
  SolflareExtension = "SolflareExtension",
  Solong = "Solong",
  SecretKey = "SecretKey",
}

export const WALLET_PROVIDERS: { [W in WalletType]: WalletProviderInfo } = {
  [WalletType.Sollet]: {
    name: "Sollet",
    url: "https://www.sollet.io",
    icon: SOLLET,
    makeAdapter: (provider: string, network: string) =>
      new SolanaWalletAdapter(
        new SolletWalletAdapter({
          provider,
          network: network as WalletAdapterNetwork,
        })
      ),
    isMobile: true,
  },
  [WalletType.SolletExtension]: {
    name: "Sollet Extension",
    url: "https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno",
    icon: SOLLET,
    makeAdapter: (name, endpoint) => new SolletExtensionAdapter(name, endpoint),

    isInstalled: () => window.sollet !== undefined,
  },
  [WalletType.Ledger]: {
    name: "Ledger",
    url: "https://www.ledger.com",
    icon: LEDGER,
    makeAdapter: () => new LedgerWalletAdapter(),
  },
  [WalletType.Solong]: {
    name: "Solong",
    url: "https://solongwallet.com/",
    icon: "https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/solong.png",
    makeAdapter: () => new SolongWalletAdapter(),

    isInstalled: () => window.solong !== undefined,
  },
  [WalletType.Phantom]: {
    name: "Phantom",
    url: "https://www.phantom.app",
    icon: PHANTOM,
    makeAdapter: () => new SolanaWalletAdapter(new PhantomWalletAdapter()),

    isInstalled: () => window.solana?.isPhantom === true,
  },
  [WalletType.MathWallet]: {
    name: "MathWallet",
    url: "https://www.mathwallet.org",
    icon: MATHWALLET,
    makeAdapter: () => new MathWalletAdapter(),
    isInstalled: () => window.solana?.isMathWallet === true,
    isMobile: true,
  },
  [WalletType.Coin98]: {
    name: "Coin98",
    url: "https://wallet.coin98.com/",
    icon: COIN98,
    makeAdapter: () => new SolanaWalletAdapter(new Coin98WalletAdapter()),
    isInstalled: () => window.coin98 !== undefined,
    isMobile: true,
  },
  [WalletType.SecretKey]: {
    name: "Secret Key",
    url: "https://solana.com/",
    icon: FILE,
    makeAdapter: () => new SecretKeyAdapter(),
  },
  [WalletType.Solflare]: {
    name: "Solflare",
    url: "https://solflare.com/provider",
    icon: SOLFLARE,
    makeAdapter: (provider, network) => new SolflareAdapter(provider, network),
  },
  [WalletType.SolflareExtension]: {
    name: "Solflare Extension",
    url: "https://solflare.com/",
    icon: SOLFLARE,
    makeAdapter: () => new SolflareExtensionWalletAdapter(),

    isInstalled: () => window.solflare?.isSolflare === true,
  },
  [WalletType.Slope]: {
    name: "Slope",
    url: "https://www.slope.finance/",
    icon: SLOPE,
    makeAdapter: () => new SolanaWalletAdapter(new SlopeWalletAdapter()),
    isInstalled: () => window.Slope !== undefined,
    isMobile: true,
  },
};

export interface WalletProviderInfo {
  /**
   * Name of the wallet provider.
   */
  readonly name: string;
  /**
   * URL of the wallet provider.
   */
  readonly url: string;
  icon: string | React.FC<React.SVGProps<SVGSVGElement>>;
  makeAdapter: WalletAdapterBuilder;
  isInstalled?: () => boolean;
  isMobile?: boolean;
}
