import { Address, BN, Idl } from "@project-serum/anchor";
import {
  PendingTransaction,
  TransactionEnvelope,
  TransactionReceipt,
} from "@saberhq/solana";
import { BigintIsh, TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiBN from "chai-bn";

chai.use(chaiBN(BN));
chai.use(chaiAsPromised);
chai.config.includeStack = true;

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

chai.use((chai) => {
  chai.Assertion.addProperty(
    "tokenAmount",
    function (): Chai.TokenAmountAssertion {
      const assert = this.assert.bind(this);
      const obj = this._obj as unknown;
      const equal: Chai.TokenAmountAssertion["equal"] = function (
        value,
        message
      ) {
        const amount = value instanceof TokenAmount ? value.toU64() : value;
        const msgPrefix = message ? `${message}: ` : "";

        const myAmount = obj as TokenAmount;
        if (value instanceof TokenAmount) {
          assert(
            myAmount.token.equals(value.token),
            `${msgPrefix}token mismatch: #{this} to equal #{exp} but got #{act}`,
            `${msgPrefix}token mismatch: expected #{this} to not equal #{act}`,
            {
              address: value.token.address,
              decimals: value.token.decimals,
              network: value.token.network,
            },
            {
              address: myAmount.token.address,
              decimals: myAmount.token.decimals,
              network: myAmount.token.network,
            }
          );
        }

        const otherAmt = new TokenAmount(myAmount.token, amount.toString());
        assert(
          myAmount.equalTo(otherAmt),
          `${msgPrefix}expected #{this} to equal #{exp} but got #{act}`,
          `${msgPrefix}expected #{this} to not equal #{exp} but got #{act}`,
          otherAmt.format(),
          myAmount.format()
        );
      };
      return {
        equal,
        equals: equal,
        eq: equal,
        zero: () => {
          equal(0);
        },
      };
    }
  );

  chai.Assertion.addMethod(
    "eqAddress",
    function (otherKey: Address, message?: string) {
      const obj = this._obj as unknown;

      this.assert(
        (obj as Record<string, unknown>)?._bn ||
          obj instanceof PublicKey ||
          typeof obj === "string",
        "expected #{this} to be a PublicKey or address string",
        "expected #{this} to not be a PublicKey or address string",
        true,
        obj
      );
      const key = obj as Address;

      const myKey = typeof key === "string" ? new PublicKey(key) : key;
      const theirKey =
        typeof otherKey === "string" ? new PublicKey(otherKey) : otherKey;

      const msgPrefix = message ? `${message}: ` : "";

      this.assert(
        myKey.equals(theirKey),
        `${msgPrefix}expected #{this} to equal #{exp} but got #{act}`,
        `${msgPrefix}expected #{this} to not equal #{act}`,
        otherKey.toString(),
        myKey.toString()
      );
    }
  );

  chai.Assertion.addMethod(
    "eqAmount",
    function (other: TokenAmount, message?: string) {
      const obj = this._obj as unknown;
      const myAmount = obj as TokenAmount;
      const msgPrefix = message ? `${message}: ` : "";

      this.assert(
        myAmount.token.equals(other.token),
        `${msgPrefix}token mismatch: #{this} to equal #{exp} but got #{act}`,
        `${msgPrefix}token mismatch: expected #{this} to not equal #{act}`,
        myAmount.token,
        other.token
      );

      this.assert(
        myAmount.raw.toString() === other.raw.toString(),
        `${msgPrefix}expected #{this} to equal #{exp} but got #{act}`,
        `${msgPrefix}expected #{this} to not equal #{act}`,
        myAmount.toString(),
        other.toString()
      );
    }
  );
});

export const expectTX = (
  tx:
    | TransactionEnvelope
    | null
    | Promise<TransactionEnvelope | null>
    | PendingTransaction
    | Promise<PendingTransaction>,
  msg?: string,
  cb?: (receipt: TransactionReceipt) => Promise<void>
): Chai.PromisedAssertion => {
  const handleReceipt = async (receipt: TransactionReceipt) => {
    await cb?.(receipt);
    return receipt;
  };

  if (tx && "then" in tx) {
    return expect(
      tx
        .then((tx) => {
          if (tx instanceof PendingTransaction) {
            return tx.wait();
          } else if (tx) {
            return tx.confirm();
          } else {
            throw new Error("tx is null");
          }
        })
        .then(handleReceipt),
      msg
    ).eventually;
  }
  if (tx instanceof PendingTransaction) {
    return expect(tx.wait().then(handleReceipt), msg).eventually;
  } else {
    return expect(
      tx
        ?.send()
        .then((res) => res.wait())
        .then(handleReceipt),
      msg
    ).eventually;
  }
};

export type IDLError = NonNullable<Idl["errors"]>[number];

export const assertError = (error: IDLError, other: IDLError): void => {
  assert.strictEqual(error.code, other.code);
  assert.strictEqual(error.msg, other.msg);
};
