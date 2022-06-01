import type { BigintIsh } from "@ubeswap/token-math";
import { Price as UPrice } from "@ubeswap/token-math";

import type { Token } from "./token.js";

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
  constructor(
    baseCurrency: Token,
    quoteCurrency: Token,
    denominator: BigintIsh,
    numerator: BigintIsh
  ) {
    super(baseCurrency, quoteCurrency, denominator, numerator);
  }

  new(
    baseCurrency: Token,
    quoteCurrency: Token,
    denominator: BigintIsh,
    numerator: BigintIsh
  ): this {
    return new Price(
      baseCurrency,
      quoteCurrency,
      denominator,
      numerator
    ) as this;
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
