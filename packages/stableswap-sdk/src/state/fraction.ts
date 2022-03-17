import { u64 } from "@saberhq/token-utils";

import type { RawFraction } from "./layout";

export type Fraction = {
  numerator: u64;
  denominator: u64;
};

export const FRACTION_UNDEFINED: Fraction = {
  numerator: new u64(0),
  denominator: new u64(0),
};

export const FRACTION_ONE: Fraction = {
  numerator: new u64(0),
  denominator: new u64(0),
};

export const isUndefined = (fraction: Fraction) => {
  return fraction.numerator.isZero() && fraction.denominator.isZero();
};

export const encodeFraction = (fraction: Fraction): RawFraction => ({
  numerator: fraction.numerator.toBuffer(),
  denominator: fraction.denominator.toBuffer(),
});

export const decodeFraction = (raw: RawFraction): Fraction => ({
  numerator: u64.fromBuffer(Buffer.from(raw.numerator)),
  denominator: u64.fromBuffer(Buffer.from(raw.denominator)),
});
