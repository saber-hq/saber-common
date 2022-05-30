import type { TokenInfo } from "@saberhq/token-utils";
import {
  deserializeAccount,
  deserializeMint,
  parseBigintIsh,
  Token,
  TokenAmount,
} from "@saberhq/token-utils";
import type { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import type { default as JSBI } from "jsbi";
import { default as invariant } from "tiny-invariant";

import { SWAP_PROGRAM_ID } from "../constants.js";
import { StableSwap } from "../stable-swap.js";
import type { Fees } from "../state/fees.js";
import type { StableSwapState } from "../state/index.js";
import { loadProgramAccount } from "../util/account.js";

/**
 * Reserve information.
 */
export interface IReserve {
  /**
   * Swap account holding the reserve tokens
   */
  reserveAccount: PublicKey;
  /**
   * Destination account of admin fees of this reserve token
   */
  adminFeeAccount: PublicKey;
  /**
   * Amount of tokens in the reserve
   */
  amount: TokenAmount;
}

/**
 * Static definition of an exchange.
 */
export interface IExchange {
  programID: PublicKey;
  swapAccount: PublicKey;
  lpToken: Token;
  tokens: readonly [Token, Token];
}

/**
 * Info loaded from the exchange. This is used by the calculator.
 */
export interface IExchangeInfo {
  ampFactor: JSBI;
  fees: Fees;
  lpTotalSupply: TokenAmount;
  reserves: readonly [IReserve, IReserve];
}

/**
 * Calculates the amp factor of a swap.
 * @param state
 * @param now
 * @returns
 */
export const calculateAmpFactor = (
  state: Pick<
    StableSwapState,
    | "initialAmpFactor"
    | "targetAmpFactor"
    | "startRampTimestamp"
    | "stopRampTimestamp"
  >,
  now = Date.now() / 1_000
): JSBI => {
  const {
    initialAmpFactor,
    targetAmpFactor,
    startRampTimestamp,
    stopRampTimestamp,
  } = state;

  // The most common case is that there is no ramp in progress.
  if (now >= stopRampTimestamp) {
    return parseBigintIsh(targetAmpFactor);
  }

  // If the ramp is about to start, use the initial amp.
  if (now <= startRampTimestamp) {
    return parseBigintIsh(initialAmpFactor);
  }

  invariant(
    stopRampTimestamp >= startRampTimestamp,
    "stop must be after start"
  );
  // Calculate how far we are along the ramp curve.
  const percent =
    now >= stopRampTimestamp
      ? 1
      : now <= startRampTimestamp
      ? 0
      : (now - startRampTimestamp) / (stopRampTimestamp - startRampTimestamp);
  const diff = Math.floor(
    parseFloat(targetAmpFactor.sub(initialAmpFactor).toString()) * percent
  );
  return parseBigintIsh(initialAmpFactor.add(new BN(diff)));
};

/**
 * Creates an IExchangeInfo from parameters.
 * @returns
 */
export const makeExchangeInfo = ({
  exchange,
  swap,
  accounts,
}: {
  exchange: IExchange;
  swap: StableSwap;
  accounts: {
    reserveA: Buffer;
    reserveB: Buffer;
    poolMint?: Buffer;
  };
}): IExchangeInfo => {
  const swapAmountA = deserializeAccount(accounts.reserveA).amount;
  const swapAmountB = deserializeAccount(accounts.reserveB).amount;

  const poolMintSupply = accounts.poolMint
    ? deserializeMint(accounts.poolMint).supply
    : undefined;

  const ampFactor = calculateAmpFactor(swap.state);

  return {
    ampFactor,
    fees: swap.state.fees,
    lpTotalSupply: new TokenAmount(exchange.lpToken, poolMintSupply ?? 0),
    reserves: [
      {
        reserveAccount: swap.state.tokenA.reserve,
        adminFeeAccount: swap.state.tokenA.adminFeeAccount,
        amount: new TokenAmount(exchange.tokens[0], swapAmountA),
      },
      {
        reserveAccount: swap.state.tokenB.reserve,
        adminFeeAccount: swap.state.tokenB.adminFeeAccount,
        amount: new TokenAmount(exchange.tokens[1], swapAmountB),
      },
    ],
  };
};

/**
 * Loads exchange info.
 * @param exchange
 * @param swap
 * @returns
 */
export const loadExchangeInfo = async (
  connection: Connection,
  exchange: IExchange,
  swap: StableSwap
): Promise<IExchangeInfo> => {
  if (!exchange.programID.equals(swap.config.swapProgramID)) {
    throw new Error("Swap program id mismatch");
  }

  const reserveA = await loadProgramAccount(
    connection,
    swap.state.tokenA.reserve,
    swap.config.tokenProgramID
  );
  const reserveB = await loadProgramAccount(
    connection,
    swap.state.tokenB.reserve,
    swap.config.tokenProgramID
  );
  const poolMint = await loadProgramAccount(
    connection,
    swap.state.poolTokenMint,
    swap.config.tokenProgramID
  );
  return makeExchangeInfo({
    swap,
    exchange,
    accounts: {
      reserveA,
      reserveB,
      poolMint,
    },
  });
};

/**
 * Simplified representation of an IExchange. Useful for configuration.
 */
export interface ExchangeBasic {
  /**
   * Swap account.
   */
  swapAccount: PublicKey;
  /**
   * Mint of the LP token.
   */
  lpToken: PublicKey;
  /**
   * Info of token A.
   */
  tokenA: TokenInfo;
  /**
   * Info of token B.
   */
  tokenB: TokenInfo;
}

/**
 * Creates an IExchange from an ExchangeBasic.
 * @param tokenMap
 * @param param1
 * @returns
 */
export const makeExchange = ({
  swapAccount,
  lpToken,
  tokenA,
  tokenB,
}: ExchangeBasic): IExchange | null => {
  const exchange: IExchange = {
    swapAccount,
    programID: SWAP_PROGRAM_ID,
    lpToken: new Token({
      symbol: "SLP",
      name: `${tokenA.symbol}-${tokenB.symbol} Saber LP`,
      logoURI: "https://app.saber.so/tokens/slp.png",
      decimals: tokenA.decimals,
      address: lpToken.toString(),
      chainId: tokenA.chainId,
      tags: ["saber-stableswap-lp"],
    }),
    tokens: [new Token(tokenA), new Token(tokenB)],
  };
  return exchange;
};

/**
 * Get exchange info from just the swap account.
 * @param connection
 * @param swapAccount
 * @param tokenA
 * @param tokenB
 * @returns
 */
export const loadExchangeInfoFromSwapAccount = async (
  connection: Connection,
  swapAccount: PublicKey,
  tokenA: Token | undefined = undefined,
  tokenB: Token | undefined = undefined
): Promise<IExchangeInfo | null> => {
  const stableSwap = await StableSwap.load(connection, swapAccount);

  const theTokenA =
    tokenA ??
    (await Token.load(connection, stableSwap.state.tokenA.mint))?.info;
  if (!theTokenA) {
    throw new Error(
      `Token ${stableSwap.state.tokenA.mint.toString()} not found`
    );
  }

  const theTokenB =
    tokenB ??
    (await Token.load(connection, stableSwap.state.tokenB.mint))?.info;
  if (!theTokenB) {
    throw new Error(
      `Token ${stableSwap.state.tokenB.mint.toString()} not found`
    );
  }

  const exchange = makeExchange({
    swapAccount,
    lpToken: stableSwap.state.poolTokenMint,
    tokenA: theTokenA,
    tokenB: theTokenB,
  });

  if (exchange === null) {
    return null;
  }

  return await loadExchangeInfo(connection, exchange, stableSwap);
};
