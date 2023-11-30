import { TransactionInstruction } from "@solana/web3.js";

import { COMPUTE_BUDGET_PROGRAM } from "./index.js";
import { RequestHeapFrameLayout, RequestUnitsLayout } from "./layouts.js";

/**
 * Request a specific maximum number of compute units the transaction is
 * allowed to consume and an additional fee to pay.
 */
export const requestComputeUnitsInstruction = (
  units: number,
  additionalFee: number,
): TransactionInstruction => {
  const data = Buffer.alloc(RequestUnitsLayout.span);
  RequestUnitsLayout.encode({ instruction: 0, units, additionalFee }, data);
  return new TransactionInstruction({
    data,
    keys: [],
    programId: COMPUTE_BUDGET_PROGRAM,
  });
};

/**
 * Request a specific transaction-wide program heap region size in bytes.
 * The value requested must be a multiple of 1024. This new heap region
 * size applies to each program executed, including all calls to CPIs.
 */
export const requestHeapFrameInstruction = (
  bytes: number,
): TransactionInstruction => {
  const data = Buffer.alloc(RequestHeapFrameLayout.span);
  RequestHeapFrameLayout.encode({ instruction: 1, bytes }, data);
  return new TransactionInstruction({
    data,
    keys: [],
    programId: COMPUTE_BUDGET_PROGRAM,
  });
};
