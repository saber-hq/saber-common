import type {
  Commitment,
  Connection,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
} from "@solana/web3.js";
import { SendTransactionError } from "@solana/web3.js";

/**
 * Copy of Connection.simulateTransaction that takes a commitment parameter.
 */
export async function simulateTransactionWithCommitment(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment = "processed"
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const connectionInner = connection as Connection & {
    _disableBlockhashCaching: boolean;
    _recentBlockhash: (disableBlockhashCaching: boolean) => Promise<string>;
    _rpcRequest: (
      rpc: "simulateTransaction",
      args: [
        string,
        {
          encoding: string;
          commitment: Commitment;
        }
      ]
    ) => Promise<{
      error: Error;
      result: RpcResponseAndContext<SimulatedTransactionResponse>;
    }>;
  };
  const transactionTyped = transaction as Transaction & {
    _serialize: (buffer: Buffer) => Buffer;
  };

  transaction.recentBlockhash = await connectionInner._recentBlockhash(
    connectionInner._disableBlockhashCaching
  );

  const signData = transaction.serializeMessage();

  const wireTransaction = transactionTyped._serialize(signData);
  const encodedTransaction = wireTransaction.toString("base64");
  const config = { encoding: "base64", commitment };

  const res = await connectionInner._rpcRequest("simulateTransaction", [
    encodedTransaction,
    config,
  ]);
  if (res.error) {
    throw new SendTransactionError(
      "failed to simulate transaction: " + res.error.message,
      res.result.value.logs ?? undefined
    );
  }
  return res.result;
}
