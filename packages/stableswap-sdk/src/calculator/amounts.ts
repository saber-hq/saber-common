import type { Token } from "@saberhq/token-utils";
import { Fraction, ONE, TokenAmount, ZERO } from "@saberhq/token-utils";
import JSBI from "jsbi";
import mapValues from "lodash.mapvalues";

import type { IExchangeInfo } from "../entities/exchange";
import type { Fees } from "../state/fees";
import { divFraction, mulFraction } from "../util";
import { computeD, computeY } from "./curve";

/**
 * Calculates the current virtual price of the exchange.
 * @param exchange
 * @returns
 */
export const calculateVirtualPrice = (
  exchange: IExchangeInfo
): Fraction | null => {
  const amount = exchange.lpTotalSupply;
  if (amount === undefined || amount.equalTo(0)) {
    // pool has no tokens
    return null;
  }
  const price = new Fraction(
    computeD(
      exchange.ampFactor,
      exchange.reserves[0].amount.raw,
      exchange.reserves[1].amount.raw,
      exchange.exchangeRateA,
      exchange.exchangeRateB
    ),
    amount.raw
  );
  return price;
};

/**
 * Calculates the estimated output amount of a swap.
 * @param exchange
 * @param fromAmount
 * @returns
 */
export const calculateEstimatedSwapOutputAmount = (
  exchange: IExchangeInfo,
  fromAmount: TokenAmount
): {
  [K in
    | "outputAmountBeforeFees"
    | "outputAmount"
    | "fee"
    | "lpFee"
    | "adminFee"]: TokenAmount;
} => {
  const [fromReserves, toReserves] = fromAmount.token.equals(
    exchange.reserves[0].amount.token
  )
    ? [exchange.reserves[0], exchange.reserves[1]]
    : [exchange.reserves[1], exchange.reserves[0]];

  if (fromAmount.equalTo(0)) {
    const zero = new TokenAmount(toReserves.amount.token, ZERO);
    return {
      outputAmountBeforeFees: zero,
      outputAmount: zero,
      fee: zero,
      lpFee: zero,
      adminFee: zero,
    };
  }

  const amp = exchange.ampFactor;

  const [fromExchangeRate, toExchangeRate] = fromAmount.token.equals(
    exchange.reserves[0].amount.token
  )
    ? [exchange.exchangeRateA, exchange.exchangeRateB]
    : [exchange.exchangeRateB, exchange.exchangeRateA];

  const amountBeforeFees = JSBI.subtract(
    mulFraction(toReserves.amount.raw, toExchangeRate),
    computeY(
      amp,
      mulFraction(
        JSBI.add(fromReserves.amount.raw, fromAmount.raw),
        fromExchangeRate
      ),
      computeD(
        amp,
        fromReserves.amount.raw,
        toReserves.amount.raw,
        fromExchangeRate,
        toExchangeRate
      )
    )
  );

  const outputAmountBeforeFees = new TokenAmount(
    toReserves.amount.token,
    divFraction(amountBeforeFees, toExchangeRate)
  );

  const fee = JSBI.BigInt(
    exchange.fees.trade.asFraction.multiply(amountBeforeFees).toFixed(0)
  );
  const adminFee = JSBI.BigInt(
    exchange.fees.adminTrade.asFraction.multiply(fee).toFixed(0)
  );

  const feeAmount = new TokenAmount(
    toReserves.amount.token,
    divFraction(fee, toExchangeRate)
  );

  const adminFeeAmount = new TokenAmount(
    toReserves.amount.token,
    divFraction(adminFee, toExchangeRate)
  );
  const lpFee = feeAmount.subtract(adminFeeAmount);

  const outputAmount = new TokenAmount(
    toReserves.amount.token,
    JSBI.subtract(amountBeforeFees, feeAmount.raw)
  );

  return {
    outputAmountBeforeFees,
    outputAmount,
    fee: feeAmount,
    lpFee,
    adminFee: adminFeeAmount,
  };
};

const N_COINS = JSBI.BigInt(2);

export interface IWithdrawOneResult {
  withdrawAmount: TokenAmount;
  withdrawAmountBeforeFees: TokenAmount;
  swapFee: TokenAmount;
  withdrawFee: TokenAmount;
  lpSwapFee: TokenAmount;
  lpWithdrawFee: TokenAmount;
  adminSwapFee: TokenAmount;
  adminWithdrawFee: TokenAmount;
}

/**
 * Calculates the amount of tokens withdrawn if only withdrawing one token.
 * @returns
 */
export const calculateEstimatedWithdrawOneAmount = ({
  exchange,
  poolTokenAmount,
  withdrawToken,
}: {
  exchange: IExchangeInfo;
  poolTokenAmount: TokenAmount;
  withdrawToken: Token;
}): IWithdrawOneResult => {
  if (poolTokenAmount.equalTo(0)) {
    // final quantities
    const quantities = {
      withdrawAmount: ZERO,
      withdrawAmountBeforeFees: ZERO,
      swapFee: ZERO,
      withdrawFee: ZERO,
      lpSwapFee: ZERO,
      lpWithdrawFee: ZERO,
      adminSwapFee: ZERO,
      adminWithdrawFee: ZERO,
    };
    return mapValues(quantities, (q) => new TokenAmount(withdrawToken, q));
  }

  const { ampFactor, fees } = exchange;

  const [baseReserves, quoteReserves] = [
    exchange.reserves.find((r) => r.amount.token.equals(withdrawToken))?.amount
      .raw ?? ZERO,
    exchange.reserves.find((r) => !r.amount.token.equals(withdrawToken))?.amount
      .raw ?? ZERO,
  ];

  const [baseExchangeRate, quoteExchangeRate] = withdrawToken.equals(
    exchange.reserves[0].amount.token
  )
    ? [
        exchange.exchangeRateA ?? new Fraction(1),
        exchange.exchangeRateB ?? new Fraction(1),
      ]
    : [
        exchange.exchangeRateB ?? new Fraction(1),
        exchange.exchangeRateA ?? new Fraction(1),
      ];

  const d_0 = computeD(
    ampFactor,
    baseReserves,
    quoteReserves,
    baseExchangeRate,
    quoteExchangeRate
  );
  const baseReservesXp = mulFraction(baseReserves, baseExchangeRate);
  const quoteReservesXp = mulFraction(quoteReserves, quoteExchangeRate);
  const d_1 = JSBI.subtract(
    d_0,
    JSBI.divide(
      JSBI.multiply(poolTokenAmount.raw, d_0),
      exchange.lpTotalSupply.raw
    )
  );

  const new_y = computeY(ampFactor, quoteReservesXp, d_1);

  // expected_base_amount = swap_base_amount_xp * d_1 / d_0 - new_y;
  const expected_base_amount = JSBI.subtract(
    JSBI.divide(JSBI.multiply(baseReservesXp, d_1), d_0),
    new_y
  );
  // expected_quote_amount = swap_quote_amount_xp - swap_quote_amount_xp * d_1 / d_0;
  const expected_quote_amount = JSBI.subtract(
    quoteReservesXp,
    JSBI.divide(JSBI.multiply(quoteReservesXp, d_1), d_0)
  );
  // new_base_amount = swap_base_amount_xp - expected_base_amount * fee / fee_denominator;
  const new_base_amount = new Fraction(baseReservesXp.toString(), 1).subtract(
    normalizedTradeFee(fees, N_COINS, expected_base_amount)
  );
  // new_quote_amount = swap_quote_amount_xp - expected_quote_amount * fee / fee_denominator;
  const new_quote_amount = new Fraction(quoteReservesXp.toString(), 1).subtract(
    normalizedTradeFee(fees, N_COINS, expected_quote_amount)
  );
  const dy = new_base_amount.subtract(
    computeY(
      ampFactor,
      JSBI.BigInt(new_quote_amount.toFixed(0)),
      d_1
    ).toString()
  );
  const dy_0 = JSBI.subtract(baseReservesXp, new_y);

  // lp fees
  const swapFee = new Fraction(dy_0.toString(), 1)
    .subtract(dy)
    .divide(baseExchangeRate);
  const withdrawFee = dy
    .divide(baseExchangeRate)
    .multiply(fees.withdraw.asFraction);

  // admin fees
  const adminSwapFee = swapFee.multiply(fees.adminTrade.asFraction);
  const adminWithdrawFee = withdrawFee.multiply(fees.adminWithdraw.asFraction);

  // final LP fees
  const lpSwapFee = swapFee.subtract(adminSwapFee);
  const lpWithdrawFee = withdrawFee.subtract(adminWithdrawFee);

  // final withdraw amount
  const withdrawAmount = dy
    .divide(baseExchangeRate)
    .subtract(withdrawFee)
    .subtract(swapFee);

  // final quantities
  const quantities = {
    withdrawAmount,
    withdrawAmountBeforeFees: dy.divide(baseExchangeRate),
    swapFee,
    withdrawFee,
    lpSwapFee,
    lpWithdrawFee,
    adminSwapFee,
    adminWithdrawFee,
  };

  return mapValues(
    quantities,
    (q) => new TokenAmount(withdrawToken, q.toFixed(0))
  );
};

/**
 * Compute normalized fee for symmetric/asymmetric deposits/withdraws
 */
export const normalizedTradeFee = (
  { trade }: Fees,
  n_coins: JSBI,
  amount: JSBI
): Fraction => {
  const adjustedTradeFee = new Fraction(
    n_coins,
    JSBI.multiply(JSBI.subtract(n_coins, ONE), JSBI.BigInt(4))
  );
  return new Fraction(amount, 1).multiply(trade).multiply(adjustedTradeFee);
};

export const calculateEstimatedWithdrawAmount = ({
  poolTokenAmount,
  reserves,
  fees,
  lpTotalSupply,
}: {
  /**
   * Amount of pool tokens to withdraw
   */
  poolTokenAmount: TokenAmount;
} & Pick<IExchangeInfo, "reserves" | "lpTotalSupply" | "fees">): {
  withdrawAmounts: readonly [TokenAmount, TokenAmount];
  withdrawAmountsBeforeFees: readonly [TokenAmount, TokenAmount];
  fees: readonly [TokenAmount, TokenAmount];
} => {
  if (lpTotalSupply.equalTo(0)) {
    const zero = reserves.map((r) => new TokenAmount(r.amount.token, ZERO)) as [
      TokenAmount,
      TokenAmount
    ];
    return {
      withdrawAmounts: zero,
      withdrawAmountsBeforeFees: zero,
      fees: zero,
    };
  }

  const share = poolTokenAmount.divide(lpTotalSupply);

  const withdrawAmounts = reserves.map(({ amount }) => {
    const baseAmount = share.multiply(amount.raw);
    const fee = baseAmount.multiply(fees.withdraw.asFraction);
    return [
      new TokenAmount(
        amount.token,
        JSBI.BigInt(baseAmount.subtract(fee).toFixed(0))
      ),
      {
        beforeFees: JSBI.BigInt(baseAmount.toFixed(0)),
        fee: JSBI.BigInt(fee.toFixed(0)),
      },
    ];
  }) as [
    [TokenAmount, { beforeFees: JSBI; fee: JSBI }],
    [TokenAmount, { beforeFees: JSBI; fee: JSBI }]
  ];

  return {
    withdrawAmountsBeforeFees: withdrawAmounts.map(
      ([amt, { beforeFees }]) => new TokenAmount(amt.token, beforeFees)
    ) as [TokenAmount, TokenAmount],
    withdrawAmounts: [withdrawAmounts[0][0], withdrawAmounts[1][0]],
    fees: withdrawAmounts.map(
      ([amt, { fee }]) => new TokenAmount(amt.token, fee)
    ) as [TokenAmount, TokenAmount],
  };
};

/**
 * Calculate the estimated amount of LP tokens minted after a deposit.
 * @param exchange
 * @param depositAmountA
 * @param depositAmountB
 * @returns
 */
export const calculateEstimatedMintAmount = (
  exchange: IExchangeInfo,
  depositAmountA: JSBI,
  depositAmountB: JSBI
): {
  mintAmountBeforeFees: TokenAmount;
  mintAmount: TokenAmount;
  fees: TokenAmount;
} => {
  if (JSBI.equal(depositAmountA, ZERO) && JSBI.equal(depositAmountB, ZERO)) {
    const zero = new TokenAmount(exchange.lpTotalSupply.token, ZERO);
    return {
      mintAmountBeforeFees: zero,
      mintAmount: zero,
      fees: zero,
    };
  }

  const amp = exchange.ampFactor;
  const [reserveA, reserveB] = exchange.reserves;
  const d0 = computeD(
    amp,
    reserveA.amount.raw,
    reserveB.amount.raw,
    exchange.exchangeRateA,
    exchange.exchangeRateB
  );

  const d1 = computeD(
    amp,
    JSBI.add(reserveA.amount.raw, depositAmountA),
    JSBI.add(reserveB.amount.raw, depositAmountB),
    exchange.exchangeRateA,
    exchange.exchangeRateB
  );
  if (JSBI.lessThan(d1, d0)) {
    throw new Error("New D cannot be less than previous D");
  }

  const oldBalances = exchange.reserves.map((r) => r.amount.raw) as [
    JSBI,
    JSBI
  ];
  const newBalances = [
    JSBI.add(reserveA.amount.raw, depositAmountA),
    JSBI.add(reserveB.amount.raw, depositAmountB),
  ] as const;
  const adjustedBalances = newBalances.map((newBalance, i) => {
    const oldBalance = oldBalances[i] as JSBI;
    const idealBalance = new Fraction(d1, d0).multiply(oldBalance);
    const difference = idealBalance.subtract(newBalance);
    const diffAbs = difference.greaterThan(0)
      ? difference
      : difference.multiply(-1);
    const fee = normalizedTradeFee(
      exchange.fees,
      N_COINS,
      JSBI.BigInt(diffAbs.toFixed(0))
    );
    return JSBI.subtract(newBalance, JSBI.BigInt(fee.toFixed(0)));
  }) as [JSBI, JSBI];
  const d2 = computeD(
    amp,
    adjustedBalances[0],
    adjustedBalances[1],
    exchange.exchangeRateA,
    exchange.exchangeRateB
  );

  const lpSupply = exchange.lpTotalSupply;
  const mintAmountRaw = JSBI.divide(
    JSBI.multiply(lpSupply.raw, JSBI.subtract(d2, d0)),
    d0
  );

  const mintAmount = new TokenAmount(
    exchange.lpTotalSupply.token,
    mintAmountRaw
  );

  const mintAmountRawBeforeFees = JSBI.divide(
    JSBI.multiply(lpSupply.raw, JSBI.subtract(d1, d0)),
    d0
  );

  const fees = new TokenAmount(
    exchange.lpTotalSupply.token,
    JSBI.subtract(mintAmountRawBeforeFees, mintAmountRaw)
  );
  const mintAmountBeforeFees = new TokenAmount(
    exchange.lpTotalSupply.token,
    mintAmountRawBeforeFees
  );

  return {
    mintAmount,
    mintAmountBeforeFees,
    fees,
  };
};
