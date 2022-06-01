import { Price, TokenAmount } from "@saberhq/token-utils";
import BN from "bn.js";

import type { IExchangeInfo } from "../index.js";
import { calculateEstimatedSwapOutputAmount } from "../index.js";

/**
 * Gets the price of the second token in the swap, i.e. "Token 1", with respect to "Token 0".
 *
 * To get the price of "Token 0", use `.invert()` on the result of this function.
 * @returns
 */
export const calculateSwapPrice = (exchangeInfo: IExchangeInfo): Price => {
  const reserve0 = exchangeInfo.reserves[0].amount;
  const reserve1 = exchangeInfo.reserves[1].amount;

  // We try to get at least 4 decimal points of precision here
  // Otherwise, we attempt to swap 1% of total supply of the pool
  // or at most, $1
  const inputAmountNum = Math.max(
    10_000,
    Math.min(
      10 ** reserve0.token.decimals,
      Math.floor(parseInt(reserve0.toU64().div(new BN(100)).toString()))
    )
  );

  const inputAmount = new TokenAmount(reserve0.token, inputAmountNum);
  const outputAmount = calculateEstimatedSwapOutputAmount(
    exchangeInfo,
    inputAmount
  );

  const frac = outputAmount.outputAmountBeforeFees.asFraction.divide(
    inputAmount.asFraction
  );

  return new Price(
    reserve0.token,
    reserve1.token,
    frac.denominator,
    frac.numerator
  );
};
