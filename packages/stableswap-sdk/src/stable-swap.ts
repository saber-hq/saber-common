import { getProgramAddress } from "@saberhq/solana-contrib";
import type { ProgramAccount } from "@saberhq/token-utils";
import { TOKEN_PROGRAM_ID } from "@saberhq/token-utils";
import type { Connection, TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { SWAP_PROGRAM_ID } from "./constants.js";
import type { IExchange } from "./entities/exchange.js";
import type { StableSwapConfig } from "./instructions/index.js";
import * as instructions from "./instructions/index.js";
import type { StableSwapState } from "./state/index.js";
import { decodeSwap } from "./state/index.js";
import { StableSwapLayout } from "./state/layout.js";
import { loadProgramAccount } from "./util/account.js";

export interface StableSwapInfo {
  config: StableSwapConfig;
  state: StableSwapState;
}

/**
 * Swap token A for token B
 * @param userSource
 * @param poolSource
 * @param poolDestination
 * @param userDestination
 * @param amountIn
 * @param minimumAmountOut
 */
export function createSaberSwapInstruction(
  { config, state }: StableSwapInfo,
  args: Pick<
    instructions.SwapInstruction,
    | "userAuthority"
    | "userSource"
    | "userDestination"
    | "poolSource"
    | "poolDestination"
    | "amountIn"
    | "minimumAmountOut"
  >
): TransactionInstruction {
  const adminDestination = args.poolDestination.equals(state.tokenA.reserve)
    ? state.tokenA.adminFeeAccount
    : state.tokenB.adminFeeAccount;
  return instructions.swapInstruction({
    config: config,
    ...args,
    adminDestination,
  });
}

/**
 * Deposit tokens into the pool.
 */
export function createSaberDepositInstruction(
  { config, state }: StableSwapInfo,
  args: Pick<
    instructions.DepositInstruction,
    | "userAuthority"
    | "sourceA"
    | "sourceB"
    | "poolTokenAccount"
    | "tokenAmountA"
    | "tokenAmountB"
    | "minimumPoolTokenAmount"
  >
): TransactionInstruction {
  return instructions.depositInstruction({
    config: config,
    tokenAccountA: state.tokenA.reserve,
    tokenAccountB: state.tokenB.reserve,
    poolTokenMint: state.poolTokenMint,
    ...args,
  });
}

/**
 * Withdraw tokens from the pool
 */
export function createSaberWithdrawInstruction(
  { config, state }: StableSwapInfo,
  args: Pick<
    instructions.WithdrawInstruction,
    | "userAuthority"
    | "userAccountA"
    | "userAccountB"
    | "sourceAccount"
    | "poolTokenAmount"
    | "minimumTokenA"
    | "minimumTokenB"
  >
): TransactionInstruction {
  return instructions.withdrawInstruction({
    config: config,
    poolMint: state.poolTokenMint,
    tokenAccountA: state.tokenA.reserve,
    tokenAccountB: state.tokenB.reserve,
    adminFeeAccountA: state.tokenA.adminFeeAccount,
    adminFeeAccountB: state.tokenB.adminFeeAccount,
    ...args,
  });
}

/**
 * Withdraw tokens from the pool
 */
export function createSaberWithdrawOneInstruction(
  { config, state }: StableSwapInfo,
  args: Pick<
    instructions.WithdrawOneInstruction,
    | "userAuthority"
    | "baseTokenAccount"
    | "destinationAccount"
    | "sourceAccount"
    | "poolTokenAmount"
    | "minimumTokenAmount"
  >
): TransactionInstruction {
  const [quoteTokenAccount, adminDestinationAccount] =
    args.baseTokenAccount.equals(state.tokenA.reserve)
      ? [state.tokenB.reserve, state.tokenA.adminFeeAccount]
      : [state.tokenA.reserve, state.tokenB.adminFeeAccount];

  return instructions.withdrawOneInstruction({
    config: config,
    poolMint: state.poolTokenMint,
    quoteTokenAccount,
    adminDestinationAccount,
    ...args,
  });
}

export class StableSwap implements StableSwapInfo {
  /**
   * Constructor for new StableSwap client object.
   * @param config
   * @param state
   */
  constructor(
    readonly config: StableSwapConfig,
    readonly state: StableSwapState
  ) {}

  /**
   * Get the minimum balance for the token swap account to be rent exempt
   *
   * @return Number of lamports required
   */
  static async getMinBalanceRentForExemptStableSwap(
    connection: Connection
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      StableSwapLayout.span
    );
  }

  /**
   * Load an onchain StableSwap program.
   *
   * @param connection A {@link Connection} to use.
   * @param swapAccount The {@link PublicKey} of the swap account to load. You can obtain this pubkey by visiting [app.saber.so](https://app.saber.so/], navigating to the pool you want to load, and getting the "swap account" key.
   * @param programID Address of the onchain StableSwap program.
   */
  static async load(
    connection: Connection,
    swapAccount: PublicKey,
    programID: PublicKey = SWAP_PROGRAM_ID
  ): Promise<StableSwap> {
    const data = await loadProgramAccount(connection, swapAccount, programID);
    const authority = getSwapAuthorityKey(swapAccount, programID);
    return StableSwap.loadWithData(swapAccount, data, authority, programID);
  }

  /**
   * Loads an onchain StableSwap program from an {@link IExchange}.
   *
   * @param connection
   * @param exchange
   * @returns
   */
  static async loadFromExchange(
    connection: Connection,
    exchange: IExchange
  ): Promise<StableSwap> {
    return StableSwap.load(
      connection,
      exchange.swapAccount,
      exchange.programID
    );
  }

  /**
   * Loads the swap object from a program account.
   * @param data
   * @returns
   */
  static async fromProgramAccount(
    data: ProgramAccount<StableSwapState>
  ): Promise<StableSwap> {
    const [authority] = await findSwapAuthorityKey(data.publicKey);
    return StableSwap.fromProgramAccountWithAuthority(data, authority);
  }

  /**
   * Loads the swap object from a program account.
   * @param data
   * @returns
   */
  static fromData(data: ProgramAccount<StableSwapState>): StableSwap {
    const authority = getSwapAuthorityKey(data.publicKey);
    return StableSwap.fromProgramAccountWithAuthority(data, authority);
  }

  /**
   * Loads the swap object from a program account, with the swap authority loaded.
   * @param data
   * @returns
   */
  static fromProgramAccountWithAuthority(
    data: ProgramAccount<StableSwapState>,
    authority: PublicKey
  ): StableSwap {
    return new StableSwap(
      {
        swapAccount: data.publicKey,
        swapProgramID: SWAP_PROGRAM_ID,
        tokenProgramID: TOKEN_PROGRAM_ID,
        authority,
      },
      data.account
    );
  }

  /**
   * Loads a StableSwap instance with data.
   *
   * @param programID The program ID.
   * @param swapAccount The address of the swap.
   * @param swapAccountData The data of the swapAccount.
   * @param authority The swap's authority.
   * @returns
   */
  static loadWithData(
    swapAccount: PublicKey,
    swapAccountData: Buffer,
    authority: PublicKey,
    programID: PublicKey = SWAP_PROGRAM_ID
  ): StableSwap {
    try {
      const state = decodeSwap(swapAccountData);
      if (!state.isInitialized) {
        throw new Error(`Invalid token swap state`);
      }
      return new StableSwap(
        {
          swapAccount: swapAccount,
          swapProgramID: programID,
          tokenProgramID: TOKEN_PROGRAM_ID,
          authority,
        },
        state
      );
    } catch (e) {
      throw Error(e as string);
    }
  }

  /**
   * Swap token A for token B
   * @param userSource
   * @param poolSource
   * @param poolDestination
   * @param userDestination
   * @param amountIn
   * @param minimumAmountOut
   */
  swap(
    args: Pick<
      instructions.SwapInstruction,
      | "userAuthority"
      | "userSource"
      | "userDestination"
      | "poolSource"
      | "poolDestination"
      | "amountIn"
      | "minimumAmountOut"
    >
  ): TransactionInstruction {
    return createSaberSwapInstruction(this, args);
  }

  /**
   * Deposit tokens into the pool.
   */
  deposit(
    args: Pick<
      instructions.DepositInstruction,
      | "userAuthority"
      | "sourceA"
      | "sourceB"
      | "poolTokenAccount"
      | "tokenAmountA"
      | "tokenAmountB"
      | "minimumPoolTokenAmount"
    >
  ): TransactionInstruction {
    return createSaberDepositInstruction(this, args);
  }

  /**
   * Withdraw tokens from the pool
   */
  withdraw(
    args: Pick<
      instructions.WithdrawInstruction,
      | "userAuthority"
      | "userAccountA"
      | "userAccountB"
      | "sourceAccount"
      | "poolTokenAmount"
      | "minimumTokenA"
      | "minimumTokenB"
    >
  ): TransactionInstruction {
    return createSaberWithdrawInstruction(this, args);
  }

  /**
   * Withdraw tokens from the pool
   */
  withdrawOne(
    args: Pick<
      instructions.WithdrawOneInstruction,
      | "userAuthority"
      | "baseTokenAccount"
      | "destinationAccount"
      | "sourceAccount"
      | "poolTokenAmount"
      | "minimumTokenAmount"
    >
  ): TransactionInstruction {
    return createSaberWithdrawOneInstruction(this, args);
  }
}

/**
 * Finds the swap authority address that is used to sign transactions on behalf of the swap.
 *
 * @param swapAccount
 * @param swapProgramID
 * @returns
 */
export const findSwapAuthorityKey = (
  swapAccount: PublicKey,
  swapProgramID: PublicKey = SWAP_PROGRAM_ID
): Promise<[PublicKey, number]> =>
  PublicKey.findProgramAddress([swapAccount.toBuffer()], swapProgramID);

/**
 * Finds the swap authority address that is used to sign transactions on behalf of the swap.
 *
 * @param swapAccount
 * @param swapProgramID
 * @returns
 */
export const findSwapAuthorityKeySync = (
  swapAccount: PublicKey,
  swapProgramID: PublicKey = SWAP_PROGRAM_ID
): [PublicKey, number] =>
  PublicKey.findProgramAddressSync([swapAccount.toBuffer()], swapProgramID);

/**
 * Finds the swap authority address that is used to sign transactions on behalf of the swap.
 *
 * @param swapAccount
 * @param swapProgramID
 * @returns
 */
export const getSwapAuthorityKey = (
  swapAccount: PublicKey,
  swapProgramID: PublicKey = SWAP_PROGRAM_ID
): PublicKey => getProgramAddress([swapAccount.toBuffer()], swapProgramID);
