import type {
  ConfirmOptions,
  Signer,
  TransactionSignature,
} from "@solana/web3.js";
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
  const blockhash = await provider.sendConnection.getRecentBlockhash(
    opts.preflightCommitment
  );

  const txs = reqs.map((r) => {
    const tx = r.tx;
    let signers = r.signers;

    if (signers === undefined) {
      signers = [];
    }

    tx.feePayer = provider.wallet.publicKey;
    tx.recentBlockhash = blockhash.blockhash;

    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    return tx;
  });

  const signedTxs = await provider.wallet.signAllTransactions(txs);

  const sigs: TransactionSignature[] = [];
  await Promise.all(
    txs.map(async (_, i) => {
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
