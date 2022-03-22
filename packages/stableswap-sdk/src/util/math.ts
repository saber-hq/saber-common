import { Fraction } from "@saberhq/token-utils";
import JSBI from "jsbi";

export const mulFraction = (num: JSBI, fraction = new Fraction(1)) => {
  return JSBI.divide(
    JSBI.multiply(num, fraction.numerator),
    fraction.denominator
  );
};

export const divFraction = (num: JSBI, fraction = new Fraction(1)) => {
  return JSBI.divide(
    JSBI.multiply(num, fraction.denominator),
    fraction.numerator
  );
};
