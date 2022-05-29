import type { Idl } from "@project-serum/anchor";
import type { IdlErrorCode } from "@project-serum/anchor/dist/esm/idl.js";

import type { AnchorError } from "./index.js";

export type ErrorMap<T extends Idl> = {
  [K in AnchorError<T>["name"]]: AnchorError<T> & { name: K };
};

/**
 * Generates the error mapping
 * @param idl
 * @returns
 */
export const generateErrorMap = <T extends Idl>(idl: T): ErrorMap<T> => {
  return (idl.errors?.reduce((acc, err) => {
    return {
      ...acc,
      [err.name]: err,
    };
  }, {}) ?? {}) as ErrorMap<T>;
};

/**
 * Returns a RegExp which matches the message of a program error.
 * @param err
 * @returns
 */
export const matchError = (err: IdlErrorCode): RegExp =>
  matchErrorCode(err.code);

/**
 * Returns a RegExp which matches the code of a custom program error.
 * @param err
 * @returns
 */
export const matchErrorCode = (code: number): RegExp =>
  new RegExp(`custom program error: 0x${code.toString(16)}`);
