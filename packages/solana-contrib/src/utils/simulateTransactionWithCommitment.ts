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
  commitment: Commitment = "confirmed",
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const connectionInner = connection as Connection & {
    _rpcRequest: (
      rpc: "simulateTransaction",
      args: [
        string,
        {
          encoding: string;
          commitment: Commitment;
        },
      ],
    ) => Promise<{
      error: Error;
      result: RpcResponseAndContext<SimulatedTransactionResponse>;
    }>;
  };

  // only populate recent blockhash if it isn't on the tx
  if (!transaction.recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash(commitment);
    transaction.recentBlockhash = blockhash;
  }

  const wireTransaction = transaction.serialize({
    requireAllSignatures: false,
  });
  const encodedTransaction = wireTransaction.toString("base64");
  const config = { encoding: "base64", commitment };

  const res = await connectionInner._rpcRequest("simulateTransaction", [
    encodedTransaction,
    config,
  ]);
  if (res.error) {
    throw new SendTransactionError(
      "failed to simulate transaction: " + res.error.message,
      res.result.value.logs ?? undefined,
    );
  }
  return res.result;
}
