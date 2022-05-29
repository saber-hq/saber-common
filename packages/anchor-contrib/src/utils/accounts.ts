import type { AccountsCoder } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import type { IdlTypeDef } from "@project-serum/anchor/dist/esm/idl.js";
import type { ProgramAccountParser, PublicKey } from "@saberhq/solana-contrib";
import camelCase from "lodash.camelcase";

/**
 * Account information.
 */
export interface AnchorAccount<T> extends ProgramAccountParser<T> {
  /**
   * {@link IdlTypeDef}.
   */
  idl: IdlTypeDef;
  /**
   * Size of the account in bytes
   */
  size: number;
  /**
   * The discriminator.
   */
  discriminator: Buffer;
  /**
   * Encodes the value.
   */
  encode: (value: T) => Promise<Buffer>;
}

/**
 * {@link ProgramAccountParser}s associated with an IDL.
 */
export type AnchorAccountMap<M> = {
  [K in keyof M]: AnchorAccount<M[K]>;
};
/**
 * Generates the metadata of accounts.
 *
 * This is intended to be called once at initialization.
 */
export const generateAnchorAccounts = <M>(
  programID: PublicKey,
  accounts: IdlTypeDef[],
  coder: AccountsCoder
): AnchorAccountMap<M> => {
  const parsers: Partial<AnchorAccountMap<M>> = {};
  accounts.forEach((account) => {
    parsers[camelCase(account.name) as keyof M] = {
      programID,
      name: account.name,
      encode: (value) => coder.encode(account.name, value),
      parse: (data: Buffer) => coder.decode<M[keyof M]>(account.name, data),
      idl: account,
      size: coder.size(account),
      discriminator: BorshAccountsCoder.accountDiscriminator(account.name),
    };
  });
  return parsers as AnchorAccountMap<M>;
};
