import type {
  SPLTokenExtensions,
  SPLTokenInfo,
  SPLTokenList,
} from "./splTokenRegistry.js";
import { Token } from "./token.js";

/**
 * Known origin chains.
 */
export const ORIGIN_CHAINS = [
  "bitcoin",
  "ethereum",
  "terra",
  "avalanche",
  "binance",
  "celo",
  "polygon",
  "fantom",
  "polygon",
  "heco",
] as const;

/**
 * Known origin chains.
 */
export type OriginChain = typeof ORIGIN_CHAINS[number];

/**
 * Token extensions with additional information.
 */
export type TokenExtensions = SPLTokenExtensions & {
  /**
   * Mints of the underlying tokens that make up this token.
   * E.g. a Saber USDC-USDT LP token would use the USDC and USDT mints.
   */
  readonly underlyingTokens?: string[];
  /**
   * The protocol that this token comes from.
   * E.g. `wormhole-v1`, `wormhole-v2`, `allbridge`, `sollet`, `saber`.
   */
  readonly source?: string;

  /*
   ** Link to the source's website where you can acquire this token
   */
  readonly sourceUrl?: string;
  /**
   * The currency code of what this token represents, e.g. BTC, ETH, USD.
   */
  readonly currency?: string;
  /**
   * If this token is a bridged token, this is the chain that the asset originates from.
   */
  readonly originChain?: OriginChain;
};

/**
 * Token info.
 */
export type TokenInfo = Omit<SPLTokenInfo, "extensions"> & {
  readonly extensions?: TokenExtensions;
};

/**
 * A list of tokens, based off of the Uniswap standard.
 */
export type TokenList = Omit<SPLTokenList, "tokens"> & {
  readonly tokens: TokenInfo[];
};

/**
 * Creates a token map from a TokenList.
 * @param tokens
 * @returns
 */
export const makeTokenMap = (tokenList: TokenList): Record<string, Token> => {
  const ret: Record<string, Token> = {};
  tokenList.tokens.forEach((item) => {
    ret[item.address] = new Token(item);
  });
  return ret;
};

/**
 * Dedupes a list of tokens, picking the first instance of the token in a list.
 * @param tokens
 * @returns
 */
export const dedupeTokens = (tokens: TokenInfo[]): TokenInfo[] => {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    const tokenID = `${token.address}_${token.chainId}`;
    if (seen.has(tokenID)) {
      return false;
    } else {
      seen.add(tokenID);
      return true;
    }
  });
};
