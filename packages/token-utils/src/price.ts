import { Price as UPrice } from "@ubeswap/token-math";

import type { Token } from "./token";
import { TokenAmount } from "./tokenAmount";

/**
 * A price of one token relative to another.
 */
export class Price extends UPrice<Token> {
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
