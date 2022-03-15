import { TOKEN_PROGRAM_ID } from "@saberhq/token-utils";
import type { Connection, TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { SWAP_PROGRAM_ID } from "./constants";
import type { IExchange } from "./entities/exchange";
import type { StableSwapConfig } from "./instructions";
import * as instructions from "./instructions";
import type { StableSwapState } from "./state";
import { decodeSwap } from "./state";
import { loadProgramAccount } from "./util/account";

export class StableSwap {
  /**
   * Constructor for new StableSwap client object
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
    return await connection.getMinimumBalanceForRentExemption(427);
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
    const [authority] = await findSwapAuthorityKey(swapAccount, programID);
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
    const adminDestination = args.poolDestination.equals(
      this.state.tokenA.reserve
    )
      ? this.state.tokenA.adminFeeAccount
      : this.state.tokenB.adminFeeAccount;
    return instructions.swapInstruction({
      config: this.config,
      ...args,
      adminDestination,
    });
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
    return instructions.depositInstruction({
      config: this.config,
      tokenAccountA: this.state.tokenA.reserve,
      tokenAccountB: this.state.tokenB.reserve,
      poolTokenMint: this.state.poolTokenMint,
      ...args,
    });
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
    return instructions.withdrawInstruction({
      config: this.config,
      poolMint: this.state.poolTokenMint,
      tokenAccountA: this.state.tokenA.reserve,
      tokenAccountB: this.state.tokenB.reserve,
      adminFeeAccountA: this.state.tokenA.adminFeeAccount,
      adminFeeAccountB: this.state.tokenB.adminFeeAccount,
      ...args,
    });
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
    const [quoteTokenAccount, adminDestinationAccount] =
      args.baseTokenAccount.equals(this.state.tokenA.reserve)
        ? [this.state.tokenB.reserve, this.state.tokenA.adminFeeAccount]
        : [this.state.tokenA.reserve, this.state.tokenB.adminFeeAccount];

    return instructions.withdrawOneInstruction({
      config: this.config,
      poolMint: this.state.poolTokenMint,
      quoteTokenAccount,
      adminDestinationAccount,
      ...args,
    });
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
