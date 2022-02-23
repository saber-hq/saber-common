import BN from "bn.js";

/**
 * Converts a {@link Date} to a {@link BN} timestamp.
 * @param date
 * @returns
 */
export const dateToTs = (date: Date): BN =>
  new BN(Math.floor(date.getTime() / 1_000));

/**
 * Converts a {@link BN} timestamp to a {@link Date}.
 * @param ts
 * @returns
 */
export const tsToDate = (ts: BN): Date => new Date(ts.toNumber() * 1_000);
