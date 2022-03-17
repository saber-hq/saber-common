import { u64 } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";

import type { SwapTokenInfo } from "../instructions/swap";
import type { Fees } from "./fees";
import { decodeFees } from "./fees";
import type { Fraction } from "./fraction";
import { decodeFraction } from "./fraction";
import type { StableSwapLayoutStruct } from "./layout";
import { LegacyStableSwapLayout, StableSwapLayout } from "./layout";

export * from "./fees";
export * from "./fraction";
export * from "./layout";

/**
 * State of a StableSwap, read from the swap account.
 */
export interface StableSwapState {
  /**
   * Whether or not the swap is initialized.
   */
  isInitialized: boolean;

  /**
   * Whether or not the swap is paused.
   */
  isPaused: boolean;

  /**
   * Nonce used to generate the swap authority.
   */
  nonce: number;

  /**
   * Mint account for pool token
   */
  poolTokenMint: PublicKey;

  /**
   * Admin account
   */
  adminAccount: PublicKey;

  tokenA: SwapTokenInfo;
  tokenB: SwapTokenInfo;

  /**
   * Initial amplification coefficient (A)
   */
  initialAmpFactor: u64;

  /**
   * Target amplification coefficient (A)
   */
  targetAmpFactor: u64;

  /**
   * Ramp A start timestamp
   */
  startRampTimestamp: number;

  /**
   * Ramp A start timestamp
   */
  stopRampTimestamp: number;

  /**
   * When the future admin can no longer become the admin, if applicable.
   */
  futureAdminDeadline: number;

  /**
   * The next admin.
   */
  futureAdminAccount: PublicKey;

  /**
   * Fee schedule
   */
  fees: Fees;

  /**
   * Exchange rate override for token A.
   * 0/0 means no override is set.
   */
  exchangeRateOverrideA: Fraction;

  /**
   * Exchange rate override for token B.
   * 0/0 means no override is set.
   */
  exchangeRateOverrideB: Fraction;
}

/**
 * Decodes the Swap account.
 * @param data
 * @returns
 */
export const decodeSwap = (data: Buffer): StableSwapState => {
  if (
    data.length !== StableSwapLayout.span &&
    data.length !== LegacyStableSwapLayout.span
  ) {
    throw new Error(`Invalid token swap state`);
  }
  const stableSwapData: StableSwapLayoutStruct =
    data.length !== StableSwapLayout.span
      ? StableSwapLayout.decode(data)
      : {
          ...LegacyStableSwapLayout.decode(data),
          exchangeRateOverrideA: {
            numerator: new Uint8Array(8),
            denominator: new Uint8Array(8),
          },
          exchangeRateOverrideB: {
            numerator: new Uint8Array(8),
            denominator: new Uint8Array(8),
          },
        };
  if (!stableSwapData.isInitialized) {
    throw new Error(`Invalid token swap state`);
  }
  const adminAccount = new PublicKey(stableSwapData.adminAccount);
  const adminFeeAccountA = new PublicKey(stableSwapData.adminFeeAccountA);
  const adminFeeAccountB = new PublicKey(stableSwapData.adminFeeAccountB);
  const tokenAccountA = new PublicKey(stableSwapData.tokenAccountA);
  const tokenAccountB = new PublicKey(stableSwapData.tokenAccountB);
  const poolTokenMint = new PublicKey(stableSwapData.tokenPool);
  const mintA = new PublicKey(stableSwapData.mintA);
  const mintB = new PublicKey(stableSwapData.mintB);
  const initialAmpFactor = u64.fromBuffer(
    Buffer.from(stableSwapData.initialAmpFactor)
  );
  const targetAmpFactor = u64.fromBuffer(
    Buffer.from(stableSwapData.targetAmpFactor)
  );
  const startRampTimestamp = stableSwapData.startRampTs;
  const stopRampTimestamp = stableSwapData.stopRampTs;
  const fees = decodeFees(stableSwapData.fees);
  const exchangeRateOverrideA = decodeFraction(
    stableSwapData.exchangeRateOverrideA
  );
  const exchangeRateOverrideB = decodeFraction(
    stableSwapData.exchangeRateOverrideB
  );
  return {
    isInitialized: !!stableSwapData.isInitialized,
    isPaused: !!stableSwapData.isPaused,
    nonce: stableSwapData.nonce,
    futureAdminDeadline: stableSwapData.futureAdminDeadline,
    futureAdminAccount: new PublicKey(stableSwapData.futureAdminAccount),
    adminAccount,
    tokenA: {
      adminFeeAccount: adminFeeAccountA,
      reserve: tokenAccountA,
      mint: mintA,
    },
    tokenB: {
      adminFeeAccount: adminFeeAccountB,
      reserve: tokenAccountB,
      mint: mintB,
    },
    poolTokenMint,
    initialAmpFactor,
    targetAmpFactor,
    startRampTimestamp,
    stopRampTimestamp,
    fees,
    exchangeRateOverrideA,
    exchangeRateOverrideB,
  };
};
