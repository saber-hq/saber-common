import type { Cluster } from "@solana/web3.js";

export enum ExplorerType {
  SOLANA_EXPLORER = "solana-explorer",
  SOLSCAN = "solscan",
}

export function generateTXLink(
  signature: string,
  cluster: Cluster = "mainnet-beta",
  explorerType: string = ExplorerType.SOLANA_EXPLORER
): string {
  switch (explorerType) {
    case ExplorerType.SOLANA_EXPLORER:
      return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
    case ExplorerType.SOLSCAN:
      return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
    default:
      throw new Error(`Explorer type ${explorerType} is not supported.`);
  }
}
