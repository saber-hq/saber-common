import type { Token } from "@saberhq/token-utils";
import { Fraction, ONE, TokenAmount, ZERO } from "@saberhq/token-utils";

import type { IExchangeInfo } from "../entities/exchange.js";
import type { Fees } from "../state/fees.js";
import { computeD, computeY } from "./curve.js";

/**
 * Calculates the current virtual price of the exchange.
 * @param exchange
 * @returns
 */
export const calculateVirtualPrice = (
  exchange: IExchangeInfo,
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
    ),
    amount.raw,
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
  fromAmount: TokenAmount,
): {
  [K in
    | "outputAmountBeforeFees"
    | "outputAmount"
    | "fee"
    | "lpFee"
    | "adminFee"]: TokenAmount;
} => {
  const [fromReserves, toReserves] = fromAmount.token.equals(
    exchange.reserves[0].amount.token,
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

  const amountBeforeFees =
    toReserves.amount.raw -
    computeY(
      amp,
      fromReserves.amount.raw + fromAmount.raw,
      computeD(amp, fromReserves.amount.raw, toReserves.amount.raw),
    );

  const outputAmountBeforeFees = new TokenAmount(
    toReserves.amount.token,
    amountBeforeFees,
  );

  const fee = new TokenAmount(
    toReserves.amount.token,
    exchange.fees.trade.asFraction.multiply(amountBeforeFees).toFixed(0),
  );

  const adminFee = new TokenAmount(
    toReserves.amount.token,
    exchange.fees.adminTrade.asFraction.multiply(fee.raw).toFixed(0),
  );
  const lpFee = fee.subtract(adminFee);

  const outputAmount = new TokenAmount(
    toReserves.amount.token,
    amountBeforeFees - fee.raw,
  );

  return {
    outputAmountBeforeFees,
    outputAmount,
    fee: fee,
    lpFee,
    adminFee,
  };
};

const N_COINS = 2n;

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
    const zeroQuantity = new TokenAmount(withdrawToken, ZERO);
    return {
      withdrawAmount: zeroQuantity,
      withdrawAmountBeforeFees: zeroQuantity,
      swapFee: zeroQuantity,
      withdrawFee: zeroQuantity,
      lpSwapFee: zeroQuantity,
      lpWithdrawFee: zeroQuantity,
      adminSwapFee: zeroQuantity,
      adminWithdrawFee: zeroQuantity,
    };
  }

  const { ampFactor, fees } = exchange;

  const [baseReserves, quoteReserves] = [
    exchange.reserves.find((r) => r.amount.token.equals(withdrawToken))?.amount
      .raw ?? ZERO,
    exchange.reserves.find((r) => !r.amount.token.equals(withdrawToken))?.amount
      .raw ?? ZERO,
  ];

  const d_0 = computeD(ampFactor, baseReserves, quoteReserves);
  const d_1 = d_0 - (poolTokenAmount.raw * d_0) / exchange.lpTotalSupply.raw;

  const new_y = computeY(ampFactor, quoteReserves, d_1);

  // expected_base_amount = swap_base_amount * d_1 / d_0 - new_y;
  const expected_base_amount = (baseReserves * d_1) / d_0 - new_y;
  // expected_quote_amount = swap_quote_amount - swap_quote_amount * d_1 / d_0;
  const expected_quote_amount = quoteReserves - (quoteReserves * d_1) / d_0;
  // new_base_amount = swap_base_amount - expected_base_amount * fee / fee_denominator;
  const new_base_amount = new Fraction(baseReserves.toString(), 1).subtract(
    normalizedTradeFee(fees, N_COINS, expected_base_amount),
  );
  // new_quote_amount = swap_quote_amount - expected_quote_amount * fee / fee_denominator;
  const new_quote_amount = new Fraction(quoteReserves.toString(), 1).subtract(
    normalizedTradeFee(fees, N_COINS, expected_quote_amount),
  );
  const dy = new_base_amount.subtract(
    computeY(ampFactor, BigInt(new_quote_amount.toFixed(0)), d_1).toString(),
  );
  const dy_0 = baseReserves - new_y;

  // lp fees
  const swapFee = new Fraction(dy_0.toString(), 1).subtract(dy);
  const withdrawFee = dy.multiply(fees.withdraw.asFraction);

  // admin fees
  const adminSwapFee = swapFee.multiply(fees.adminTrade.asFraction);
  const adminWithdrawFee = withdrawFee.multiply(fees.adminWithdraw.asFraction);

  // final LP fees
  const lpSwapFee = swapFee.subtract(adminSwapFee);
  const lpWithdrawFee = withdrawFee.subtract(adminWithdrawFee);

  // final withdraw amount
  const withdrawAmount = dy.subtract(withdrawFee).subtract(swapFee);

  // final quantities
  return {
    withdrawAmount: new TokenAmount(withdrawToken, withdrawAmount.toFixed(0)),
    withdrawAmountBeforeFees: new TokenAmount(withdrawToken, dy.toFixed(0)),
    swapFee: new TokenAmount(withdrawToken, swapFee.toFixed(0)),
    withdrawFee: new TokenAmount(withdrawToken, withdrawFee.toFixed(0)),
    lpSwapFee: new TokenAmount(withdrawToken, lpSwapFee.toFixed(0)),
    lpWithdrawFee: new TokenAmount(withdrawToken, lpWithdrawFee.toFixed(0)),
    adminSwapFee: new TokenAmount(withdrawToken, adminSwapFee.toFixed(0)),
    adminWithdrawFee: new TokenAmount(
      withdrawToken,
      adminWithdrawFee.toFixed(0),
    ),
  };
};

/**
 * Compute normalized fee for symmetric/asymmetric deposits/withdraws
 */
export const normalizedTradeFee = (
  { trade }: Fees,
  n_coins: bigint,
  amount: bigint,
): Fraction => {
  const adjustedTradeFee = new Fraction(n_coins, (n_coins - ONE) * 4n);
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
      TokenAmount,
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
        BigInt(baseAmount.subtract(fee).toFixed(0)),
      ),
      {
        beforeFees: BigInt(baseAmount.toFixed(0)),
        fee: BigInt(fee.toFixed(0)),
      },
    ];
  }) as [
    [TokenAmount, { beforeFees: bigint; fee: bigint }],
    [TokenAmount, { beforeFees: bigint; fee: bigint }],
  ];

  return {
    withdrawAmountsBeforeFees: withdrawAmounts.map(
      ([amt, { beforeFees }]) => new TokenAmount(amt.token, beforeFees),
    ) as [TokenAmount, TokenAmount],
    withdrawAmounts: [withdrawAmounts[0][0], withdrawAmounts[1][0]],
    fees: withdrawAmounts.map(
      ([amt, { fee }]) => new TokenAmount(amt.token, fee),
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
  depositAmountA: bigint,
  depositAmountB: bigint,
): {
  mintAmountBeforeFees: TokenAmount;
  mintAmount: TokenAmount;
  fees: TokenAmount;
} => {
  if (depositAmountA === ZERO && depositAmountB === ZERO) {
    const zero = new TokenAmount(exchange.lpTotalSupply.token, ZERO);
    return {
      mintAmountBeforeFees: zero,
      mintAmount: zero,
      fees: zero,
    };
  }

  const amp = exchange.ampFactor;
  const [reserveA, reserveB] = exchange.reserves;
  const d0 = computeD(amp, reserveA.amount.raw, reserveB.amount.raw);

  const d1 = computeD(
    amp,
    reserveA.amount.raw + depositAmountA,
    reserveB.amount.raw + depositAmountB,
  );
  if (d1 < d0) {
    throw new Error("New D cannot be less than previous D");
  }

  const oldBalances = exchange.reserves.map((r) => r.amount.raw) as [
    bigint,
    bigint,
  ];
  const newBalances = [
    reserveA.amount.raw + depositAmountA,
    reserveB.amount.raw + depositAmountB,
  ] as const;
  const adjustedBalances = newBalances.map((newBalance, i) => {
    const oldBalance = oldBalances[i] as bigint;
    const idealBalance = new Fraction(d1, d0).multiply(oldBalance);
    const difference = idealBalance.subtract(newBalance);
    const diffAbs = difference.greaterThan(0)
      ? difference
      : difference.multiply(-1);
    const fee = normalizedTradeFee(
      exchange.fees,
      N_COINS,
      BigInt(diffAbs.toFixed(0)),
    );
    return newBalance - BigInt(fee.toFixed(0));
  }) as [bigint, bigint];
  const d2 = computeD(amp, adjustedBalances[0], adjustedBalances[1]);

  const lpSupply = exchange.lpTotalSupply;
  const mintAmountRaw = (lpSupply.raw * (d2 - d0)) / d0;

  const mintAmount = new TokenAmount(
    exchange.lpTotalSupply.token,
    mintAmountRaw,
  );

  const mintAmountRawBeforeFees = (lpSupply.raw * (d1 - d0)) / d0;

  const fees = new TokenAmount(
    exchange.lpTotalSupply.token,
    mintAmountRawBeforeFees - mintAmountRaw,
  );
  const mintAmountBeforeFees = new TokenAmount(
    exchange.lpTotalSupply.token,
    mintAmountRawBeforeFees,
  );

  return {
    mintAmount,
    mintAmountBeforeFees,
    fees,
  };
};
