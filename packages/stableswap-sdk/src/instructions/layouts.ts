import { Uint64Layout } from "@saberhq/token-utils";
import * as BufferLayout from "@solana/buffer-layout";

import type { RawFees } from "../state/layout.js";
import { FeesLayout } from "../state/layout.js";
import type { AdminInstruction } from "./admin.js";
import type { StableSwapInstruction } from "./swap.js";

export const InitializeSwapIXLayout = BufferLayout.struct<{
  instruction: StableSwapInstruction.INITIALIZE;
  nonce: number;
  ampFactor: Uint8Array;
  fees: RawFees;
}>([
  BufferLayout.u8("instruction"),
  BufferLayout.u8("nonce"),
  Uint64Layout("ampFactor"),
  FeesLayout,
]);

export const SwapIXLayout = BufferLayout.struct<{
  instruction: StableSwapInstruction.SWAP;
  amountIn: Uint8Array;
  minimumAmountOut: Uint8Array;
}>([
  BufferLayout.u8("instruction"),
  Uint64Layout("amountIn"),
  Uint64Layout("minimumAmountOut"),
]);

export const DepositIXLayout = BufferLayout.struct<{
  instruction: StableSwapInstruction.DEPOSIT;
  tokenAmountA: Uint8Array;
  tokenAmountB: Uint8Array;
  minimumPoolTokenAmount: Uint8Array;
}>([
  BufferLayout.u8("instruction"),
  Uint64Layout("tokenAmountA"),
  Uint64Layout("tokenAmountB"),
  Uint64Layout("minimumPoolTokenAmount"),
]);

export const WithdrawIXLayout = BufferLayout.struct<{
  instruction: StableSwapInstruction.WITHDRAW;
  poolTokenAmount: Uint8Array;
  minimumTokenA: Uint8Array;
  minimumTokenB: Uint8Array;
}>([
  BufferLayout.u8("instruction"),
  Uint64Layout("poolTokenAmount"),
  Uint64Layout("minimumTokenA"),
  Uint64Layout("minimumTokenB"),
]);

export const WithdrawOneIXLayout = BufferLayout.struct<{
  instruction: StableSwapInstruction.WITHDRAW_ONE;
  poolTokenAmount: Uint8Array;
  minimumTokenAmount: Uint8Array;
}>([
  BufferLayout.u8("instruction"),
  Uint64Layout("poolTokenAmount"),
  Uint64Layout("minimumTokenAmount"),
]);

export const RampAIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.RAMP_A;
  targetAmp: Uint8Array;
  stopRampTS: number;
}>([
  BufferLayout.u8("instruction"),
  Uint64Layout("targetAmp"),
  BufferLayout.ns64("stopRampTS"),
]);

export const StopRampAIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.STOP_RAMP_A;
}>([BufferLayout.u8("instruction")]);

export const PauseIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.PAUSE;
}>([BufferLayout.u8("instruction")]);

export const UnpauseIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.UNPAUSE;
}>([BufferLayout.u8("instruction")]);

export const SetFeeAccountIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.SET_FEE_ACCOUNT;
}>([BufferLayout.u8("instruction")]);

export const ApplyNewAdminIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.APPLY_NEW_ADMIN;
}>([BufferLayout.u8("instruction")]);

export const CommitNewAdminIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.COMMIT_NEW_ADMIN;
}>([BufferLayout.u8("instruction")]);

export const SetNewFeesIXLayout = BufferLayout.struct<{
  instruction: AdminInstruction.SET_NEW_FEES;
  fees: RawFees;
}>([BufferLayout.u8("instruction"), FeesLayout]);
