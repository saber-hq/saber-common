import { NATIVE_MINT } from "@solana/spl-token";
import { Cluster, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

/**
 * Token information.
 */
export interface Token {
  tokenSymbol: string;
  tokenName: string;
  icon?: string;
  mintAccount: PublicKey;
  decimals: number;
  cluster: Cluster;
}

export const tokensEqual = (
  a: Token | undefined,
  b: Token | undefined
): boolean =>
  a !== undefined &&
  b !== undefined &&
  a.mintAccount.equals(b.mintAccount) &&
  a.cluster === b.cluster;

export type TokenMap = { [c in Cluster]: Token };

const sol = {
  tokenSymbol: "SOL",
  tokenName: "Solana",
  icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  mintAccount: NATIVE_MINT,
  decimals: Math.log10(LAMPORTS_PER_SOL),
};

/**
 * Solana native token.
 */
export const SOL: TokenMap = {
  "mainnet-beta": { ...sol, cluster: "mainnet-beta" },
  devnet: { ...sol, cluster: "devnet" },
  testnet: { ...sol, cluster: "testnet" },
};
