import {
  PublicKeyLayout,
  structLayout,
  Uint64Layout,
} from "@saberhq/token-utils";
import * as BufferLayout from "@solana/buffer-layout";

/**
 * Raw representation of fees.
 */
export interface RawFees {
  adminTradeFeeNumerator: Buffer;
  adminTradeFeeDenominator: Buffer;
  adminWithdrawFeeNumerator: Buffer;
  adminWithdrawFeeDenominator: Buffer;
  tradeFeeNumerator: Buffer;
  tradeFeeDenominator: Buffer;
  withdrawFeeNumerator: Buffer;
  withdrawFeeDenominator: Buffer;
}

/**
 * Layout for StableSwap fees
 */
export const FeesLayout = structLayout<RawFees>(
  [
    Uint64Layout("adminTradeFeeNumerator"),
    Uint64Layout("adminTradeFeeDenominator"),
    Uint64Layout("adminWithdrawFeeNumerator"),
    Uint64Layout("adminWithdrawFeeDenominator"),
    Uint64Layout("tradeFeeNumerator"),
    Uint64Layout("tradeFeeDenominator"),
    Uint64Layout("withdrawFeeNumerator"),
    Uint64Layout("withdrawFeeDenominator"),
  ],
  "fees"
);

/**
 * Layout for stable swap state
 */
export const StableSwapLayout = structLayout<{
  adminAccount: string;
  adminFeeAccountA: string;
  adminFeeAccountB: string;
  fees: RawFees;
  initialAmpFactor: Buffer;
  isInitialized: boolean;
  isPaused: 0 | 1;
  mintA: string;
  mintB: string;
  startRampTs: number;
  stopRampTs: number;
  targetAmpFactor: Buffer;
  tokenAccountA: string;
  tokenAccountB: string;
  tokenPool: string;
}>([
  BufferLayout.u8("isInitialized"),
  BufferLayout.u8("isPaused"),
  BufferLayout.u8("nonce"),
  Uint64Layout("initialAmpFactor"),
  Uint64Layout("targetAmpFactor"),
  BufferLayout.ns64("startRampTs"),
  BufferLayout.ns64("stopRampTs"),
  BufferLayout.ns64("futureAdminDeadline"),
  PublicKeyLayout("futureAdminAccount"),
  PublicKeyLayout("adminAccount"),
  PublicKeyLayout("tokenAccountA"),
  PublicKeyLayout("tokenAccountB"),
  PublicKeyLayout("tokenPool"),
  PublicKeyLayout("mintA"),
  PublicKeyLayout("mintB"),
  PublicKeyLayout("adminFeeAccountA"),
  PublicKeyLayout("adminFeeAccountB"),
  FeesLayout,
]);
