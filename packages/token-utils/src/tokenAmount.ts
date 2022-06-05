import { u64 } from "@solana/spl-token";
import type { BigintIsh, FractionObject } from "@ubeswap/token-math";
import {
  parseAmountFromString,
  parseBigintIsh,
  TokenAmount as UTokenAmount,
  validateU64,
} from "@ubeswap/token-math";
import BN from "bn.js";

import type { Token } from "./token.js";

export type { IFormatUint } from "@ubeswap/token-math";

export interface TokenAmountObject extends FractionObject {
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
}

export class TokenAmount extends UTokenAmount<Token> {
  // amount _must_ be raw, i.e. in the native representation
  constructor(token: Token, amount: BigintIsh) {
    super(token, amount, validateU64);
  }

  new(token: Token, amount: BigintIsh): this {
    // unsafe but nobody will be extending this anyway probably
    return new TokenAmount(token, amount) as this;
  }

  /**
   * Parses a token amount from a decimal representation.
   * @param token
   * @param uiAmount
   * @returns
   */
  static parse(token: Token, uiAmount: string): TokenAmount {
    const prev = parseAmountFromString(token, uiAmount, ".", ",");
    return new TokenAmount(token, prev);
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
   * String representation of this token amount.
   */
  override toString(): string {
    return `TokenAmount[Token=(${this.token.toString()}), amount=${this.toExact()}`;
  }

  /**
   * JSON representation of the token amount.
   */
  override toJSON(): TokenAmountObject {
    return {
      ...super.toJSON(),
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
