import type * as tokenRegistry from "@solana/spl-token-registry";

import { Token } from "./token";

/**
 * Token extensions with additional information.
 */
export type TokenExtensions = tokenRegistry.TokenExtensions & {
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
};

/**
 * Token info.
 */
export type TokenInfo = Omit<tokenRegistry.TokenInfo, "extensions"> & {
  readonly extensions?: TokenExtensions;
};

/**
 * A list of tokens, based off of the Uniswap standard.
 */
export type TokenList = Omit<tokenRegistry.TokenList, "tokens"> & {
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
