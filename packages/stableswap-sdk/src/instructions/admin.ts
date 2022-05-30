import type { u64 } from "@saberhq/token-utils";
import * as BufferLayout from "@solana/buffer-layout";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";

import type { Fees } from "../state/fees.js";
import { encodeFees, ZERO_FEES } from "../state/fees.js";
import type { StableSwapState } from "../state/index.js";
import type { StableSwapConfig } from "./common.js";
import { buildInstruction } from "./common.js";
import {
  ApplyNewAdminIXLayout,
  PauseIXLayout,
  RampAIXLayout,
  SetFeeAccountIXLayout,
  SetNewFeesIXLayout,
  StopRampAIXLayout,
  UnpauseIXLayout,
} from "./layouts.js";

/**
 * Admin instruction.
 */
export enum AdminInstruction {
  RAMP_A = 100,
  STOP_RAMP_A = 101,
  PAUSE = 102,
  UNPAUSE = 103,
  SET_FEE_ACCOUNT = 104,
  APPLY_NEW_ADMIN = 105,
  COMMIT_NEW_ADMIN = 106,
  SET_NEW_FEES = 107,
}

/**
 * Creates a ramp A instruction.
 */
export const createAdminRampAInstruction = ({
  config,
  state: { adminAccount },
  targetAmp,
  stopRamp,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  targetAmp: u64;
  stopRamp: Date;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const data = Buffer.alloc(RampAIXLayout.span);
  RampAIXLayout.encode(
    {
      instruction: AdminInstruction.RAMP_A,
      targetAmp: targetAmp.toBuffer(),
      stopRampTS: Math.floor(stopRamp.getTime() / 1_000),
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a stop ramp A instruction.
 */
export const createAdminStopRampAInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  let data = Buffer.alloc(StopRampAIXLayout.span);
  const encodeLength = StopRampAIXLayout.encode(
    {
      instruction: AdminInstruction.STOP_RAMP_A,
    },
    data
  );
  data = data.slice(0, encodeLength);
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a pause instruction.
 */
export const createAdminPauseInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const data = Buffer.alloc(PauseIXLayout.span);
  PauseIXLayout.encode(
    {
      instruction: AdminInstruction.PAUSE,
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates an unpause instruction.
 */
export const createAdminUnpauseInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const data = Buffer.alloc(UnpauseIXLayout.span);
  UnpauseIXLayout.encode(
    {
      instruction: AdminInstruction.UNPAUSE,
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set fee account instruction.
 */
export const createAdminSetFeeAccountInstruction = ({
  config,
  state: { adminAccount },
  tokenAccount,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  tokenAccount: PublicKey;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: tokenAccount, isSigner: false, isWritable: false },
  ];
  const data = Buffer.alloc(SetFeeAccountIXLayout.span);
  SetFeeAccountIXLayout.encode(
    {
      instruction: AdminInstruction.SET_FEE_ACCOUNT,
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminApplyNewAdminInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const data = Buffer.alloc(ApplyNewAdminIXLayout.span);
  ApplyNewAdminIXLayout.encode(
    {
      instruction: AdminInstruction.APPLY_NEW_ADMIN,
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminCommitNewAdminInstruction = ({
  config,
  state: { adminAccount },
  newAdminAccount,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  newAdminAccount: PublicKey;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: newAdminAccount, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: AdminInstruction.COMMIT_NEW_ADMIN,
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminSetNewFeesInstruction = ({
  config,
  state: { adminAccount },
  fees = ZERO_FEES,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  fees: Fees;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const data = Buffer.alloc(SetNewFeesIXLayout.span);
  SetNewFeesIXLayout.encode(
    {
      instruction: AdminInstruction.SET_NEW_FEES, // InitializeSwap instruction
      fees: encodeFees(fees),
    },
    data
  );
  return buildInstruction({
    config,
    keys,
    data,
  });
};
