import { u64 } from "@solana/spl-token";
import {
  BigintIsh,
  Percent,
  TokenAmount as UTokenAmount,
  validateU64,
} from "@ubeswap/token-math";

import { Token } from "./token";

export interface IFormatUint {
  /**
   * If specified, format this according to `toLocaleString`
   */
  numberFormatOptions?: Intl.NumberFormatOptions;
  /**
   * Locale of the number
   */
  locale?: string;
}

export class TokenAmount extends UTokenAmount<Token> {
  // amount _must_ be raw, i.e. in the native representation
  public constructor(token: Token, amount: BigintIsh) {
    super(token, amount);
    validateU64(this.raw);
  }

  /**
   * Parses a token amount from a decimal representation.
   * @param token
   * @param uiAmount
   * @returns
   */
  public static parse(token: Token, uiAmount: string): TokenAmount {
    const prev = UTokenAmount.parseFromString(token, uiAmount);
    return new TokenAmount(token, prev.raw);
  }

  add(other: TokenAmount): TokenAmount {
    const result = super.add(other);
    return new TokenAmount(this.token, result.raw);
  }
  subtract(other: TokenAmount): TokenAmount {
    const result = super.subtract(other);
    return new TokenAmount(this.token, result.raw);
  }
  multiplyBy(percent: Percent): TokenAmount {
    const result = super.multiplyBy(percent);
    return new TokenAmount(this.token, result.raw);
  }
  reduceBy(percent: Percent): TokenAmount {
    const result = super.reduceBy(percent);
    return new TokenAmount(this.token, result.raw);
  }

  /**
   * Converts this to the raw u64 used by the SPL library
   * @returns
   */
  public toU64(): u64 {
    return new u64(this.raw.toString());
  }
}
