import type { Idl } from "@project-serum/anchor";
import { AccountsCoder } from "@project-serum/anchor";

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
  const coder = new AccountsCoder<keyof M & string>(idl);
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
  accountNames: (keyof M)[] | undefined,
  coder: AccountsCoder<keyof M & string>
): AccountParsers<M> => {
  return (accountNames ?? []).reduce((parsers, account) => {
    parsers[account] = (data: Buffer) =>
      coder.decode<M[keyof M]>(account as keyof M & string, data);
    return parsers;
  }, {} as AccountParsers<M>);
};
