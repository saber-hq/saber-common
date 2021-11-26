import type { BigintIsh } from "@ubeswap/token-math";
import { Price as UPrice } from "@ubeswap/token-math";
import invariant from "tiny-invariant";

import type { Token } from "./token";
import { TokenAmount } from "./tokenAmount";

/**
 * A price of one token relative to another.
 */
export class Price extends UPrice<Token> {
  /**
   * Constructs a price.
   * @param baseCurrency
   * @param quoteCurrency
   * @param denominator
   * @param numerator
   */
  public constructor(
    baseCurrency: Token,
    quoteCurrency: Token,
    denominator: BigintIsh,
    numerator: BigintIsh
  ) {
    super(baseCurrency, quoteCurrency, denominator, numerator);
  }

  public override invert(): Price {
    return new Price(
      this.quoteCurrency,
      this.baseCurrency,
      this.numerator,
      this.denominator
    );
  }

  public override multiply(other: Price): Price {
    invariant(
      this.quoteCurrency.equals(other.baseCurrency),
      `multiply token mismatch: ${this.quoteCurrency.toString()} !== ${other.baseCurrency.toString()}`
    );
    const fraction = super.asFraction.multiply(other);
    return new Price(
      this.baseCurrency,
      other.quoteCurrency,
      fraction.denominator,
      fraction.numerator
    );
  }

  override quote(tokenAmount: TokenAmount): TokenAmount {
    const amt = super.quote(tokenAmount);
    return new TokenAmount(this.quoteCurrency, amt.raw);
  }

  static fromUPrice(price: UPrice<Token>): Price {
    return new Price(
      price.baseCurrency,
      price.quoteCurrency,
      price.denominator,
      price.numerator
    );
  }
}
