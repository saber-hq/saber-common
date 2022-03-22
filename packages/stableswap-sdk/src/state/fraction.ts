import { Fraction, u64 } from "@saberhq/token-utils";

import type { RawFraction } from "./layout";

export const FRACTION_UNDEFINED: Fraction = new Fraction(0, 0);

export const isUndefined = (fraction: Fraction) => {
  return fraction.equalTo(FRACTION_UNDEFINED);
};

export const encodeFraction = (fraction: Fraction): RawFraction => ({
  numerator: new u64(fraction.numerator.toString()).toBuffer(),
  denominator: new u64(fraction.denominator.toString()).toBuffer(),
});

export const decodeFraction = (raw: RawFraction): Fraction => {
  return new Fraction(
    u64.fromBuffer(Buffer.from(raw.numerator)).toString(),
    u64.fromBuffer(Buffer.from(raw.denominator)).toString()
  );
};
