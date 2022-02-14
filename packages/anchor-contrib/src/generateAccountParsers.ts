import type { AccountsCoder, Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import camelCase from "lodash.camelcase";

/**
 * Parsers associated with an IDL.
 */
export type AccountParsers<M> = {
  [K in keyof M]: (data: Buffer) => M[K];
};

/**
 * Creates parsers for accounts.
 *
 * This is intended to be called once at initialization.
 *
 * @param idl The IDL.
 */
export const generateAccountParsers = <M extends Record<string, object>>(
  idl: Idl
): AccountParsers<M> => {
  const coder = new BorshAccountsCoder(idl);
  return generateAccountParsersFromCoder(
    idl.accounts?.map((a) => a.name),
    coder
  );
};

/**
 * Creates parsers for accounts.
 *
 * This is intended to be called once at initialization.
 *
 * @param idl The IDL.
 */
export const generateAccountParsersFromCoder = <M>(
  accountNames: string[] | undefined,
  coder: AccountsCoder
): AccountParsers<M> => {
  return (accountNames ?? []).reduce((parsers, account) => {
    parsers[camelCase(account) as keyof M] = (data: Buffer) =>
      coder.decode<M[keyof M]>(account, data);
    return parsers;
  }, {} as AccountParsers<M>);
};
