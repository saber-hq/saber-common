/// <reference types="chai" />

import "chai-bn";
import "chai-as-promised";

import type { Address } from "@project-serum/anchor";
import type { BigintIsh, TokenAmount } from "@saberhq/token-utils";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    export interface TokenAmountComparer {
      (value: TokenAmount | BigintIsh, message?: string): void;
    }

    export interface TokenAmountAssertion {
      equal: TokenAmountComparer;
      equals: TokenAmountComparer;
      eq: TokenAmountComparer;
      // above: TokenAmountComparer;
      // greaterThan: TokenAmountComparer;
      // gt: TokenAmountComparer;
      // gte: TokenAmountComparer;
      // below: TokenAmountComparer;
      // lessThan: TokenAmountComparer;
      // lt: TokenAmountComparer;
      // lte: TokenAmountComparer;
      // least: TokenAmountComparer;
      // most: TokenAmountComparer;
      // closeTo: BNCloseTo;
      // negative: BNBoolean;
      zero: () => void;
    }

    interface Assertion {
      eqAddress: (otherKey: Address, message?: string) => Assertion;
      eqAmount: (otherAmount: TokenAmount, message?: string) => Assertion;
      tokenAmount: TokenAmountAssertion;
    }
  }
}
