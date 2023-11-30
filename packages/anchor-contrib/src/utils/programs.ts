import type { Idl } from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import type {
  Provider as SaberProvider,
  ReadonlyProvider as ReadonlySaberProvider,
} from "@saberhq/solana-contrib";
import type { PublicKey } from "@solana/web3.js";
import mapValues from "lodash.mapvalues";

import { makeAnchorProvider } from "./provider.js";

/**
 * Builds a program from its IDL.
 *
 * @param idl
 * @param address
 * @param provider
 * @returns
 */
export const newProgram = <P>(
  idl: Idl,
  address: PublicKey,
  provider: SaberProvider | ReadonlySaberProvider,
) => {
  return new Program(
    idl,
    address.toString(),
    makeAnchorProvider(provider),
  ) as unknown as P;
};

/**
 * Builds a map of programs from their IDLs and addresses.
 *
 * @param provider
 * @param programs
 * @returns
 */
export const newProgramMap = <P>(
  provider: SaberProvider | ReadonlySaberProvider,
  idls: {
    [K in keyof P]: Idl;
  },
  addresses: {
    [K in keyof P]: PublicKey;
  },
): {
  [K in keyof P]: P[K];
} => {
  return mapValues(idls, (idl, k: keyof P) =>
    newProgram(idl, addresses[k], provider),
  ) as unknown as {
    [K in keyof P]: P[K];
  };
};
