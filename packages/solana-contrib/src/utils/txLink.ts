import { Cluster } from "@solana/web3.js";

import { PendingTransaction } from "../transaction/PendingTransaction";
import { TransactionReceipt } from "../transaction/TransactionReceipt";

export enum ExplorerType {
  SOLANA_EXPLORER = "solana-explorer",
  SOLSCAN = "solscan",
}

export function generateSolanaExplorerLink(
  tx: PendingTransaction | TransactionReceipt,
  cluster: Cluster = "mainnet-beta"
): string {
  return generateTXLink(tx.signature, cluster);
}

export function generateTXLink(
  tx: PendingTransaction | TransactionReceipt,
  cluster: Cluster = "mainnet-beta",
  explorerType: string = ExplorerType.SOLANA_EXPLORER
): string {
  switch (explorerType) {
    case ExplorerType.SOLANA_EXPLORER:
      return `https://explorer.solana.com/tx/${tx.signature}?cluster=${cluster}`;
    case ExplorerType.SOLSCAN:
      return `https://solscan.io/tx/${tx.signature}?cluster=${cluster}`;
    default:
      throw new Error(`Explorer type ${explorerType} is not supported.`);
  }
}
