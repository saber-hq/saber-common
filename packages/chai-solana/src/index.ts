/**
 * [[include:chai-solana/README.md]]
 * @module
 */

import "./types.js";

import type { Address } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import { default as chaiAsPromised } from "chai-as-promised";
import { default as chaiBN } from "chai-bn";

export * from "./debugAccountOwners.js";
export * from "./expectTXTable.js";
export * from "./printInstructionLogs.js";
export * from "./utils.js";

export const chaiSolana: Chai.ChaiPlugin = (chai) => {
  chai.use(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chaiBN(BN) as Chai.ChaiPlugin,
  );
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;

  chai.use((chai) => {
    chai.Assertion.addProperty(
      "tokenAmount",
      function (): Chai.TokenAmountAssertion {
        const assert = this.assert.bind(this);
        const obj = this._obj as unknown;
        const equal: Chai.TokenAmountAssertion["equal"] = function (
          value,
          message,
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
              },
            );
          }

          const otherAmt = new TokenAmount(myAmount.token, amount.toString());
          assert(
            myAmount.equalTo(otherAmt),
            `${msgPrefix}expected #{this} to equal #{exp} but got #{act}`,
            `${msgPrefix}expected #{this} to not equal #{exp} but got #{act}`,
            otherAmt.format(),
            myAmount.format(),
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
      },
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
          obj,
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
          myKey.toString(),
        );
      },
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
          other.token,
        );

        this.assert(
          myAmount.raw.toString() === other.raw.toString(),
          `${msgPrefix}expected #{this} to equal #{exp} but got #{act}`,
          `${msgPrefix}expected #{this} to not equal #{act}`,
          myAmount.toString(),
          other.toString(),
        );
      },
    );
  });
};
