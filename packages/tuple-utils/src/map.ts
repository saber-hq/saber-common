import type { Maybe } from "@saberhq/option-utils";
import { mapN } from "@saberhq/option-utils";

import type { Tuple } from "./tuple.js";

/**
 * Applies `mapFn` to the inner value of the tuple.
 */
export const tupleMapInner = <T, U, N extends number>(
  mapFn: (v: T) => U,
  tuple: Tuple<Maybe<T>, N>
): Tuple<Maybe<U>, N> => {
  return tuple.map((v) => mapN(mapFn, v)) as Tuple<Maybe<U>, N>;
};
