import type { Cluster, ConnectionConfig } from "@solana/web3.js";

/**
 * A network: a Solana cluster or localnet.
 */
export type Network = Cluster | "localnet";

/**
 * Formats the network as a string.
 * @param network
 * @returns
 */
export const formatNetwork = (network: Network): string => {
  if (network === "mainnet-beta") {
    return "mainnet";
  }
  return network;
};

export type NetworkConfig = Readonly<
  Omit<ConnectionConfig, "wsEndpoint"> & {
    name: string;
    /**
     * HTTP endpoint to connect to for this network.
     */
    endpoint: string;
    /**
     * Websocket endpoint to connect to for this network.
     */
    endpointWs?: string;
  }
>;

/**
 * Default configuration for all networks.
 */
export const DEFAULT_NETWORK_CONFIG_MAP = {
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
  localnet: {
    name: "Localnet",
    endpoint: "http://127.0.0.1:8899",
  },
} as const;

export type NetworkConfigMap = { [N in Network]: NetworkConfig };
