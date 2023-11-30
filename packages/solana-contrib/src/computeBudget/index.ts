import { PublicKey } from "@solana/web3.js";

/**
 * The compute budget program.
 * Source: https://github.com/solana-labs/solana/blob/master/program-runtime/src/compute_budget.rs#L101
 */
export const COMPUTE_BUDGET_PROGRAM = new PublicKey(
  "ComputeBudget111111111111111111111111111111",
);

export * from "./instructions.js";
