import { u64 } from "@solana/spl-token";
import type { BigintIsh, NumberFormat, Percent } from "@ubeswap/token-math";
import {
  parseBigintIsh,
  TokenAmount as UTokenAmount,
  validateU64,
} from "@ubeswap/token-math";
import BN from "bn.js";

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

  override add(other: TokenAmount): TokenAmount {
    const result = super.add(other);
    return new TokenAmount(this.token, result.raw);
  }
  override subtract(other: TokenAmount): TokenAmount {
    const result = super.subtract(other);
    return new TokenAmount(this.token, result.raw);
  }
  override multiplyBy(percent: Percent): TokenAmount {
    const result = super.multiplyBy(percent);
    return new TokenAmount(this.token, result.raw);
  }
  override reduceBy(percent: Percent): TokenAmount {
    const result = super.reduceBy(percent);
    return new TokenAmount(this.token, result.raw);
  }

  /**
   * Divides this TokenAmount by a raw integer.
   * @param other
   * @returns
   */
  divideByInteger(other: BigintIsh): TokenAmount {
    return new TokenAmount(
      this.token,
      this.toU64().div(new BN(parseBigintIsh(other).toString()))
    );
  }

  /**
   * Formats the token amount with units and decimal adjustment, e.g. "100.42 SOL"
   * @returns
   */
  formatUnits(format: NumberFormat = { groupSeparator: "," }): string {
    return `${this.toExact(format)} ${this.token.symbol}`;
  }

  /**
   * String representation of this token amount.
   */
  override toString(): string {
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
      mint: this.token.address,
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
