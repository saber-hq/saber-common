import { NATIVE_MINT } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { Network } from "./constants";

/**
 * Token information.
 */
export interface Token {
  tokenSymbol: string;
  tokenName: string;
  icon?: string;
  mintAccount: PublicKey;
  decimals: number;
  network: Network;
}

export const tokensEqual = (
  a: Token | undefined,
  b: Token | undefined
): boolean =>
  a !== undefined &&
  b !== undefined &&
  a.mintAccount.equals(b.mintAccount) &&
  a.network === b.network;

/**
 * Map of network to Token
 */
export type TokenMap = { [c in Network]: Token };

const sol = {
  tokenSymbol: "SOL",
  tokenName: "Solana",
  icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  mintAccount: NATIVE_MINT,
  decimals: Math.log10(LAMPORTS_PER_SOL),
};

/**
 * Creates a Token for all networks.
 */
export const makeTokenForAllNetworks = (
  token: Omit<Token, "network">
): TokenMap => ({
  "mainnet-beta": { ...token, network: "mainnet-beta" },
  devnet: { ...token, network: "devnet" },
  testnet: { ...token, network: "testnet" },
  localnet: { ...token, network: "localnet" },
});

/**
 * Solana native token.
 */
export const SOL: TokenMap = makeTokenForAllNetworks(sol);
