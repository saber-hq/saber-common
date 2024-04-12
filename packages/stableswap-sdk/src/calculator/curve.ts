import { ONE, ZERO } from "@saberhq/token-utils";

const N_COINS = BigInt(2); // n

const abs = (a: bigint): bigint => {
  if (a > ZERO) {
    return a;
  }
  return -a;
};

// maximum iterations of newton's method approximation
const MAX_ITERS = 20;

/**
 * Compute the StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * @param amountA Swap balance of token A
 * @param amountB Swap balance of token B
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
 */
export const computeD = (
  ampFactor: bigint,
  amountA: bigint,
  amountB: bigint,
): bigint => {
  const Ann = ampFactor * N_COINS; // A*n^n
  const S = amountA + amountB; // sum(x_i), a.k.a S
  if (S === ZERO) {
    return ZERO;
  }

  let dPrev = ZERO;
  let d = S;

  for (let i = 0; abs(d - dPrev) > ONE && i < MAX_ITERS; i++) {
    dPrev = d;
    let dP = d;
    dP = (dP * d) / (amountA * N_COINS);
    dP = (dP * d) / (amountB * N_COINS);

    const dNumerator = d * (Ann * S + dP * N_COINS);
    const dDenominator = d * (Ann - ONE) + dP * (N_COINS + ONE);
    d = dNumerator / dDenominator;
  }

  return d;
};

/**
 * Compute Y amount in respect to X on the StableSwap curve
 * @param ampFactor Amplification coefficient (A)
 * @param x The quantity of underlying asset
 * @param d StableSwap invariant
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L55
 */
export const computeY = (ampFactor: bigint, x: bigint, d: bigint): bigint => {
  const Ann = ampFactor * N_COINS; // A*n^n
  // sum' = prod' = x
  const b = x + d / Ann - d; // b = sum' - (A*n**n - 1) * D / (A * n**n)
  // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
  const c = (d * d * d) / (N_COINS * (N_COINS * (x * Ann)));

  let yPrev = ZERO;
  let y = d;
  for (let i = 0; i < MAX_ITERS && abs(y - yPrev) > ONE; i++) {
    yPrev = y;
    y = (y * y + c) / (N_COINS * y + b);
  }

  return y;
};
