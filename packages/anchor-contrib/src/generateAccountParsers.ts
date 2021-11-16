import type { Idl } from "@project-serum/anchor";
import { AccountsCoder } from "@project-serum/anchor";

/**
 * Parsers associated with an IDL.
 */
export type Parsers<A extends string, M extends { [K in A]: unknown }> = {
  [K in A]: (data: Buffer) => M[K];
};

/**
 * Creates parsers for accounts.
 *
 * This is intended to be called once at initialization.
 *
 * @param idl The IDL.
 */
export const generateAccountParsers = <
  A extends string,
  M extends { [K in A]: unknown }
>(
  idl: Idl
): Parsers<A, M> => {
  const coder = new AccountsCoder<A>(idl);
  return (idl.accounts ?? []).reduce((parsers, account) => {
    parsers[account.name as A] = (data: Buffer) =>
      coder.decode<M[A]>(account.name as A, data);
    return parsers;
  }, {} as Parsers<A, M>);
};
