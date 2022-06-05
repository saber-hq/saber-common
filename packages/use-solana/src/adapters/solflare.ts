import { SolletWalletAdapter } from "@solana/wallet-adapter-sollet";
import type { Transaction } from "@solana/web3.js";
import invariant from "tiny-invariant";

export class SolflareAdapter extends SolletWalletAdapter {
  override signAllTransactions = async (
    txs: Transaction[]
  ): Promise<Transaction[]> => {
    const ret = [];
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      invariant(tx, "tx");
      const signedTx = await this.signTransaction(tx);
      ret.push(signedTx);
    }
    return ret;
  };
}
