import type { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { CloverWalletAdapter } from "@solana/wallet-adapter-clover";
import { Coin98WalletAdapter } from "@solana/wallet-adapter-coin98";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { HuobiWalletAdapter } from "@solana/wallet-adapter-huobi";
import { MathWalletAdapter } from "@solana/wallet-adapter-mathwallet";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SlopeWalletAdapter } from "@solana/wallet-adapter-slope";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import {
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-sollet";
import { SolongWalletAdapter } from "@solana/wallet-adapter-solong";

import { FixedExodusWalletAdapter } from "./adapters/exodus";
import { SolflareAdapter } from "./adapters/solflare";
import { WrappedAdapter } from "./wrappedAdapter";

export type WrappedAdapterBuilder = (
  providerUrl: string,
  endpoint: string
) => WrappedAdapter;

export type SupportedWallet =
  | "solflare"
  | "sollet"
  | "solletExtension"
  | "glow"
  | "coin98"
  | "solong"
  | "exodus"
  | "phantom"
  | "mathWallet"
  | "clover"
  | "solflareExtension"
  | "slope"
  | "huobi";

export const BUILDERS: { [K in SupportedWallet]: WrappedAdapterBuilder } = {
  solflare: (provider, network) =>
    new WrappedAdapter(
      new SolflareAdapter({
        provider,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        network: network as WalletAdapterNetwork,
      })
    ),
  sollet: (provider, network) =>
    new WrappedAdapter(
      new SolletWalletAdapter({
        provider,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        network: network as WalletAdapterNetwork,
      })
    ),
  solletExtension: (_provider: string, network: string) =>
    new WrappedAdapter(
      new SolletExtensionWalletAdapter({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        network: network as WalletAdapterNetwork,
      })
    ),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
  glow: () => new WrappedAdapter(new GlowWalletAdapter()),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
  coin98: () => new WrappedAdapter(new Coin98WalletAdapter()),
  solong: () => new WrappedAdapter(new SolongWalletAdapter()),
  exodus: () => new WrappedAdapter(new FixedExodusWalletAdapter()),
  phantom: () => new WrappedAdapter(new PhantomWalletAdapter()),
  mathWallet: () => new WrappedAdapter(new MathWalletAdapter()),
  clover: () => new WrappedAdapter(new CloverWalletAdapter()),
  solflareExtension: () => new WrappedAdapter(new SolflareWalletAdapter()),
  slope: () => new WrappedAdapter(new SlopeWalletAdapter()),
  huobi: () => new WrappedAdapter(new HuobiWalletAdapter()),
};
