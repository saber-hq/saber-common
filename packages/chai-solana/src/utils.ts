import "chai-as-promised";

import type { Idl } from "@project-serum/anchor";
import type {
  TransactionEnvelope,
  TransactionReceipt,
} from "@saberhq/solana-contrib";
import { PendingTransaction } from "@saberhq/solana-contrib";
import type { SendTransactionError } from "@solana/web3.js";
import { assert, expect } from "chai";

import { printSendTransactionError } from "./printInstructionLogs";

const processTX = async (
  tx: TransactionEnvelope | PendingTransaction | null
): Promise<TransactionReceipt> => {
  if (tx instanceof PendingTransaction) {
    return await tx.wait();
  } else if (tx) {
    try {
      const pending = await tx.send({ printLogs: false });
      return await pending.wait();
    } catch (err) {
      if (err && err instanceof Error && "logs" in err) {
        printSendTransactionError(err as SendTransactionError);
      }
      throw err;
    }
  } else {
    throw new Error("tx is null");
  }
};

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
    return expect(tx.then(processTX).then(handleReceipt), msg).eventually;
  }
  if (tx instanceof PendingTransaction) {
    return expect(tx.wait().then(handleReceipt), msg).eventually;
  } else {
    return expect(processTX(tx).then(handleReceipt), msg).eventually;
  }
};

export type IDLError = NonNullable<Idl["errors"]>[number];

export const assertError = (error: IDLError, other: IDLError): void => {
  assert.strictEqual(error.code, other.code);
  assert.strictEqual(error.msg, other.msg);
};
