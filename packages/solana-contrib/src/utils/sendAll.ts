import type { ConfirmOptions, TransactionSignature } from "@solana/web3.js";
import { sendAndConfirmRawTransaction } from "@solana/web3.js";

import type { Provider, SendTxRequest } from "../interfaces";

/**
 * Similar to `send`, but for an array of transactions and signers.
 */
export const sendAll = async ({
  provider,
  reqs,
  opts,
  confirm = true,
}: {
  provider: Provider;
  reqs: SendTxRequest[];
  opts: ConfirmOptions;
  confirm?: boolean;
}): Promise<TransactionSignature[]> => {
  const signedTxs = await provider.signAll(reqs, opts);
  const sigs: TransactionSignature[] = [];
  await Promise.all(
    signedTxs.map(async (_, i) => {
      const tx = signedTxs[i];
      if (!tx) {
        throw new Error(`tx ${i} missing in signed txs response from provider`);
      }
      const rawTx = tx.serialize();
      if (confirm) {
        sigs.push(
          await sendAndConfirmRawTransaction(
            provider.sendConnection,
            rawTx,
            opts
          )
        );
      } else {
        sigs.push(
          await provider.sendConnection.sendRawTransaction(rawTx, opts)
        );
      }
    })
  );

  return sigs;
};
