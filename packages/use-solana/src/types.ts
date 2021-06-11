import { Cluster } from "@solana/web3.js";

export type ClusterConfig = Readonly<{
  name: string;
  endpoint: string;
}>;

export const DEFAULT_CLUSTER_CONFIG_MAP = {
  "mainnet-beta": {
    name: "Mainnet Beta",
    endpoint: "https://api.mainnet-beta.solana.com/",
  },
  devnet: {
    name: "Devnet",
    endpoint: "https://api.devnet.solana.com/",
  },
  testnet: {
    name: "Testnet",
    endpoint: "https://api.testnet.solana.com/",
  },
} as const;

export type ClusterConfigMap = { [C in Cluster]: ClusterConfig };

export type PartialClusterConfigMap = {
  [C in Cluster]?: Partial<ClusterConfig>;
};
