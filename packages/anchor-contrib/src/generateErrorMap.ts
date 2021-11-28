import type { Idl } from "@project-serum/anchor";

import type { AnchorError } from ".";

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
