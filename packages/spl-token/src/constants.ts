import { Cluster } from "@solana/web3.js";
import JSBI from "jsbi";

export const MAX_U64 = JSBI.BigInt("0xffffffffffffffff");
export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TEN = JSBI.BigInt(10);

/**
 * Represents either a Solana cluster or a local network.
 */
export type Network = Cluster | "localnet";
