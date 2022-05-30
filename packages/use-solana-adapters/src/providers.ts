import { BUILDERS } from "@saberhq/solana-wallet-adapters";
import type { WrappedAdapterBuilder } from "@saberhq/solana-wallet-adapters/dist/cjs/builders.js";
import {
  CLOVER,
  COIN98,
  EXODUS,
  FILE,
  GLOW,
  HUOBI,
  LEDGER,
  MAGNIFYING_GLASS,
  MATHWALLET,
  PHANTOM,
  SLOPE,
  SOLFLARE,
  SOLLET,
} from "@saberhq/wallet-adapter-icons";
import type React from "react";

import type { WalletAdapterBuilder } from "./index.js";
import { LedgerWalletAdapter } from "./ledger/index.js";
import { ReadonlyAdapter } from "./readonly/index.js";
import { SecretKeyAdapter } from "./secret-key/index.js";
import { SolanaAdapter } from "./solana.js";

export enum DefaultWalletType {
  Clover = "Clover",
  Coin98 = "Coin98",
  Exodus = "Exodus",
  Glow = "Glow",
  Huobi = "Huobi",
  Ledger = "Ledger",
  MathWallet = "MathWallet",
  Phantom = "Phantom",
  ReadOnly = "ReadOnly",
  SecretKey = "SecretKey",
  Slope = "Slope",
  Solflare = "Solflare",
  SolflareExtension = "SolflareExtension",
  Sollet = "Sollet",
  SolletExtension = "SolletExtension",
  Solong = "Solong",
}

export type WalletTypeEnum<T> = { [name: string]: T[keyof T] | string };
export type UnknownWalletType = WalletTypeEnum<Record<string, unknown>>;

export type WalletProviderMap<WalletType extends WalletTypeEnum<WalletType>> = {
  [W in keyof WalletType]: WalletProviderInfo;
};

export const makeAdapterFromBuilder =
  (builder: WrappedAdapterBuilder): WalletAdapterBuilder =>
  (providerUrl, endpoint) =>
    new SolanaAdapter(builder(providerUrl, endpoint));

export const DEFAULT_WALLET_PROVIDERS: WalletProviderMap<
  typeof DefaultWalletType
> = {
  [DefaultWalletType.Sollet]: {
    name: "Sollet",
    url: "https://www.sollet.io",
    icon: SOLLET,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.sollet),
    isMobile: true,
  },
  [DefaultWalletType.SolletExtension]: {
    name: "Sollet (Extension)",
    url: "https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno",
    icon: SOLLET,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.solletExtension),

    isInstalled: () => window.sollet !== undefined,
  },
  [DefaultWalletType.Ledger]: {
    name: "Ledger",
    url: "https://www.ledger.com",
    icon: LEDGER,
    makeAdapter: () => new LedgerWalletAdapter(),
  },
  [DefaultWalletType.Solong]: {
    name: "Solong",
    url: "https://solongwallet.com/",
    icon: "https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/solong.png",
    makeAdapter: makeAdapterFromBuilder(BUILDERS.solong),

    isInstalled: () => window.solong !== undefined,
  },
  [DefaultWalletType.Exodus]: {
    name: "Exodus",
    url: "https://www.exodus.com/browser-extension",
    icon: EXODUS,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.exodus),
    isInstalled: () => window.exodus?.solana !== undefined,
    isMobile: true,
  },
  [DefaultWalletType.Glow]: {
    name: "Glow",
    url: "https://www.glow.app",
    icon: GLOW,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.glow),

    isInstalled: () => Boolean(window.glowSolana),
    isMobile: true,
  },
  [DefaultWalletType.Phantom]: {
    name: "Phantom",
    url: "https://www.phantom.app",
    icon: PHANTOM,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.phantom),

    isInstalled: () => window.solana?.isPhantom === true,
    isMobile: true,
  },
  [DefaultWalletType.MathWallet]: {
    name: "MathWallet",
    url: "https://www.mathwallet.org",
    icon: MATHWALLET,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.mathWallet),
    isInstalled: () => window.solana?.isMathWallet === true,
    isMobile: true,
  },
  [DefaultWalletType.Coin98]: {
    name: "Coin98",
    url: "https://wallet.coin98.com/",
    icon: COIN98,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.coin98),
    isInstalled: () => window.coin98 !== undefined,
    isMobile: true,
  },
  [DefaultWalletType.Clover]: {
    name: "Clover",
    url: "https://clover.finance",
    icon: CLOVER,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.clover),
    isInstalled: () => window.clover_solana !== undefined,
  },
  [DefaultWalletType.SecretKey]: {
    name: "Secret Key",
    url: "https://solana.com/",
    icon: FILE,
    makeAdapter: () => new SecretKeyAdapter(),
  },
  [DefaultWalletType.Solflare]: {
    name: "Solflare (Web)",
    url: "https://solflare.com/provider",
    icon: SOLFLARE,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.solflare),
  },
  [DefaultWalletType.SolflareExtension]: {
    name: "Solflare (Extension)",
    url: "https://solflare.com/",
    icon: SOLFLARE,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.solflareExtension),

    isInstalled: () => window.solflare?.isSolflare === true,
    isMobile: true,
  },
  [DefaultWalletType.Slope]: {
    name: "Slope",
    url: "https://www.slope.finance/",
    icon: SLOPE,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.slope),
    isInstalled: () => window.Slope !== undefined,
    isMobile: true,
  },
  [DefaultWalletType.Huobi]: {
    name: "HuobiWallet",
    url: "https://www.huobiwallet.io",
    icon: HUOBI,
    makeAdapter: makeAdapterFromBuilder(BUILDERS.huobi),
    isInstalled: () => window.huobiWallet?.isHuobiWallet === true,
    isMobile: true,
  },
  [DefaultWalletType.ReadOnly]: {
    name: "Debug",
    url: "https://github.com/saber-hq/saber-common",
    icon: MAGNIFYING_GLASS,
    makeAdapter: () => new ReadonlyAdapter(),
    isInstalled: () =>
      !!process.env.LOCAL_PUBKEY || !!process.env.REACT_APP_LOCAL_PUBKEY,
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
