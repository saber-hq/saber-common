import { Fraction, NumberFormat, Rounding } from "@ubeswap/token-math";
import invariant from "tiny-invariant";

import { Token, tokensEqual } from "./token";
import { TokenAmount } from "./tokenAmount";
import { BigintIsh, makeDecimalMultiplier, parseBigintIsh } from "./utils";

export class Price extends Fraction {
  public readonly baseCurrency: Token; // input i.e. denominator
  public readonly quoteCurrency: Token; // output i.e. numerator
  public readonly scalar: Fraction; // used to adjust the raw fraction w/r/t the decimals of the {base,quote}Token

  // denominator and numerator _must_ be raw, i.e. in the native representation
  public constructor(
    baseCurrency: Token,
    quoteCurrency: Token,
    denominator: BigintIsh,
    numerator: BigintIsh
  ) {
    super(parseBigintIsh(numerator), parseBigintIsh(denominator));

    this.baseCurrency = baseCurrency;
    this.quoteCurrency = quoteCurrency;
    this.scalar = new Fraction(
      makeDecimalMultiplier(baseCurrency.decimals),
      makeDecimalMultiplier(quoteCurrency.decimals)
    );
  }

  public get raw(): Fraction {
    return new Fraction(this.numerator, this.denominator);
  }

  public get adjusted(): Fraction {
    return super.multiply(this.scalar);
  }

  public invert(): Price {
    return new Price(
      this.quoteCurrency,
      this.baseCurrency,
      this.numerator,
      this.denominator
    );
  }

  public multiply(other: Price): Price {
    invariant(tokensEqual(this.quoteCurrency, other.baseCurrency), "TOKEN");
    const fraction = super.multiply(other);
    return new Price(
      this.baseCurrency,
      other.quoteCurrency,
      fraction.denominator,
      fraction.numerator
    );
  }

  // performs floor division on overflow
  public quote(tokenAmount: TokenAmount): TokenAmount {
    invariant(tokensEqual(tokenAmount.token, this.baseCurrency), "TOKEN");
    return new TokenAmount(
      this.quoteCurrency,
      super.multiply(tokenAmount.raw).quotient
    );
  }

  public toSignificant(
    significantDigits = 6,
    format?: NumberFormat,
    rounding?: Rounding
  ): string {
    return this.adjusted.toSignificant(significantDigits, format, rounding);
  }

  public toFixed(
    decimalPlaces = 4,
    format?: NumberFormat,
    rounding?: Rounding
  ): string {
    return this.adjusted.toFixed(decimalPlaces, format, rounding);
  }
}
