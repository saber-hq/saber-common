import type { TokenInfo } from "@saberhq/token-utils";
import {
  deserializeAccount,
  deserializeMint,
  makeToken,
  parseBigintIsh,
  Token,
  TokenAmount,
} from "@saberhq/token-utils";
import type { Connection, PublicKey } from "@solana/web3.js";
import type JSBI from "jsbi";

import { SWAP_PROGRAM_ID } from "../constants";
import { StableSwap } from "../stable-swap";
import type { Fees } from "../state/fees";
import { loadProgramAccount } from "../util/account";

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

  return {
    // TODO(igm): this should be calculated dynamically
    ampFactor: parseBigintIsh(swap.state.targetAmpFactor.toString()),
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
): Promise<IExchangeInfo> => {
  const stableSwap = await StableSwap.load(connection, swapAccount);

  const exchange = makeExchange({
    swapAccount,
    lpToken: stableSwap.state.poolTokenMint,
    tokenA: tokenA ? tokenA : await makeToken(stableSwap.state.tokenA.mint),
    tokenB: tokenB ? tokenB : await makeToken(stableSwap.state.tokenB.mint),
  });

  if (exchange === null) {
    throw new Error("Exchange could not be made.");
  }

  return await loadExchangeInfo(connection, exchange, stableSwap);
};
