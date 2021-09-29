import { u64 } from "@solana/spl-token";
import type { BigintIsh, Fraction, Percent } from "@ubeswap/token-math";
import { TokenAmount as UTokenAmount, validateU64 } from "@ubeswap/token-math";

import type { Token } from "./token";

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
   * Divides this TokenAmount by a raw number.
   * @param other
   * @returns
   */
  divide(other: Fraction | BigintIsh): TokenAmount {
    const result = super.divide(other).multiply(this.denominator);
    return new TokenAmount(this.token, result.quotient);
  }

  /**
   * Formats the token amount with units and decimal adjustment, e.g. "100.42 SOL"
   * @returns
   */
  formatUnits(): string {
    return `${this.toExact()} ${this.token.symbol}`;
  }

  /**
   * String representation of this token amount.
   */
  toString(): string {
    return `TokenAmount[Token=(${this.token.toString()}), amount=${this.toExact()}`;
  }

  /**
   * JSON representation of the token amount.
   */
  toJSON(): {
    /**
     * Discriminator to show this is a token amount.
     */
    _isTA: true;
    /**
     * Mint of the token.
     */
    mint: string;
    /**
     * Amount of tokens in string representation.
     */
    uiAmount: string;
  } {
    return {
      _isTA: true,
      mint: this.token.mintAccount.toString(),
      uiAmount: this.toExact(),
    };
  }

  /**
   * Converts this to the raw u64 used by the SPL library
   * @returns
   */
  toU64(): u64 {
    return new u64(this.raw.toString());
  }
}
