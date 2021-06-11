import {
  Big,
  BigintIsh,
  Fraction,
  NumberFormat,
  Percent,
  Rounding,
} from "@ubeswap/token-math";
import JSBI from "jsbi";
import invariant from "tiny-invariant";

import { Token, tokensEqual } from "./token";
import { parseBigintIsh } from "./utils";

export const MAX_U64 = JSBI.BigInt("0xffffffffffffffff");
export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TEN = JSBI.BigInt(10);

export function validateU64(value: JSBI): void {
  invariant(
    JSBI.greaterThanOrEqual(value, ZERO),
    `${value.toString()} must be greater than zero`
  );
  invariant(
    JSBI.lessThanOrEqual(value, MAX_U64),
    `${value.toString()} overflows u64`
  );
}

export class TokenAmount extends Fraction {
  public readonly token: Token;

  // amount _must_ be raw, i.e. in the native representation
  public constructor(token: Token, amount: BigintIsh) {
    const parsedAmount = parseBigintIsh(amount);
    validateU64(parsedAmount);

    super(parsedAmount, JSBI.exponentiate(TEN, JSBI.BigInt(token.decimals)));
    this.token = token;
  }

  public get raw(): JSBI {
    return this.numerator;
  }

  public toSignificant(
    significantDigits = 6,
    format?: NumberFormat,
    rounding: Rounding = Rounding.ROUND_DOWN
  ): string {
    return super.toSignificant(significantDigits, format, rounding);
  }

  public toFixed(
    decimalPlaces: number = this.token.decimals,
    format?: NumberFormat,
    rounding: Rounding = Rounding.ROUND_DOWN
  ): string {
    invariant(decimalPlaces <= this.token.decimals, "DECIMALS");
    return super.toFixed(decimalPlaces, format, rounding);
  }

  public toExact(format: NumberFormat = { groupSeparator: "" }): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Big.DP = this.token.decimals;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    return new Big(this.numerator)
      .div(this.denominator.toString())
      .toFormat(format);
  }

  public add(other: TokenAmount): TokenAmount {
    invariant(tokensEqual(this.token, other.token), "TOKEN");
    return new TokenAmount(this.token, JSBI.add(this.raw, other.raw));
  }

  public subtract(other: TokenAmount): TokenAmount {
    invariant(tokensEqual(this.token, other.token), "TOKEN");
    return new TokenAmount(this.token, JSBI.subtract(this.raw, other.raw));
  }

  /**
   * Gets this TokenAmount as a percentage of the other TokenAmount.
   * @param other
   * @returns
   */
  public divideByAmount(other: TokenAmount): Percent {
    invariant(tokensEqual(this.token, other.token), "TOKEN");
    const frac = this.divide(other);
    return new Percent(frac.numerator, frac.denominator);
  }

  /**
   * Gets this TokenAmount as a percentage of the other TokenAmount.
   * @param other
   * @returns
   */
  public divideBy(other: Fraction): Percent {
    const frac = this.divide(other);
    return new Percent(frac.numerator, frac.denominator);
  }

  /**
   * Gets this token amount as a fraction divided by the given decimal places.
   */
  public asDecimalFraction(): Fraction {
    return new Fraction(this.raw, 10 ** this.token.decimals);
  }
}
