import { Network } from "@saberhq/spl-token";

export type NetworkConfig = Readonly<{
  name: string;
  /**
   * HTTP endpoint to connect to for this network.
   */
  endpoint: string;
}>;

export const DEFAULT_NETWORK_CONFIG_MAP = {
  "mainnet-beta": {
    name: "Mainnet Beta",
    endpoint: "https://solana-api.projectserum.com/",
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

export type PartialNetworkConfigMap = {
  [N in Network]?: Partial<NetworkConfig>;
};
