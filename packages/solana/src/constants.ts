import { Cluster } from "@solana/web3.js";

export type Network = Cluster | "localnet";

export type NetworkConfig = Readonly<{
  name: string;
  /**
   * HTTP endpoint to connect to for this network.
   */
  endpoint: string;
  /**
   * Backup HTTP endpoints.
   */
  fallbackEndpoints?: string[];
}>;

export type NetworkConfigMap = { [N in Network]: NetworkConfig };

/**
 * Default configuration for all networks.
 */
export const DEFAULT_NETWORK_CONFIG_MAP: NetworkConfigMap = {
  "mainnet-beta": {
    name: "Mainnet Beta",
    endpoint: "https://solana-api.projectserum.com/",
    fallbackEndpoints: ["https://api.mainnet-beta.solana.com"] as string[],
  },
  devnet: {
    name: "Devnet",
    endpoint: "https://api.devnet.solana.com/",
  },
  testnet: {
    name: "Testnet",
    endpoint: "https://api.testnet.solana.com/",
  },
  localnet: {
    name: "Localnet",
    endpoint: "http://127.0.0.1:8899",
  },
};

// comes from @solana/spl-token-registry
export enum ENV {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export const envToNetwork = (env: ENV): Network => {
  switch (env) {
    case ENV.MainnetBeta:
      return "mainnet-beta";
    case ENV.Devnet:
      return "devnet";
    case ENV.Testnet:
      return "testnet";
  }
};
