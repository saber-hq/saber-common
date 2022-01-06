import type {
  Network,
  NetworkConfig,
  NetworkConfigMap,
} from "@saberhq/solana-contrib";
import { DEFAULT_NETWORK_CONFIG_MAP } from "@saberhq/solana-contrib";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import type { Commitment, ConnectionConfig } from "@solana/web3.js";
import { useMemo } from "react";
import * as React from "react";
import { createContainer } from "unstated-next";

import { LOCAL_STORAGE_ADAPTER } from "..";
import type { StorageAdapter } from "../storage";
import { usePersistedKVStore } from "./usePersistedKVStore";

export type PartialNetworkConfigMap = {
  [N in Network]?: Partial<NetworkConfig>;
};

export interface ConnectionConfigContext {
  network: Network;
  setNetwork: (val: Network) => void;
  endpoint: string;
  setEndpoints: (endpoints: Omit<NetworkConfig, "name">) => void;
  /**
   * Connection configuration.
   */
  config: ConnectionConfig;
}

const makeNetworkConfigMap = (
  partial: PartialNetworkConfigMap
): NetworkConfigMap =>
  Object.entries(DEFAULT_NETWORK_CONFIG_MAP).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k as Network]: {
        ...v,
        ...partial[k as Network],
      },
    }),
    DEFAULT_NETWORK_CONFIG_MAP
  );

export interface ConnectionConfigArgs {
  defaultNetwork?: Network;
  networkConfigs?: PartialNetworkConfigMap;
  commitment?: Commitment;
  storageAdapter: StorageAdapter;
}

/**
 * Handles the configuration of the connection to the Solana nodes.
 * @returns
 */
export const useConnectionConfigInternal = (
  {
    // default to mainnet-beta
    defaultNetwork = "mainnet-beta",
    networkConfigs = DEFAULT_NETWORK_CONFIG_MAP,
    commitment = "recent",
    storageAdapter = LOCAL_STORAGE_ADAPTER,
  }: ConnectionConfigArgs = {
    // default to mainnet-beta
    defaultNetwork: "mainnet-beta",
    networkConfigs: DEFAULT_NETWORK_CONFIG_MAP,
    commitment: "recent",
    storageAdapter: LOCAL_STORAGE_ADAPTER,
  }
): ConnectionConfigContext => {
  const [network, setNetwork] = usePersistedKVStore<Network>(
    "use-solana/network",
    defaultNetwork,
    storageAdapter
  );
  const configMap = makeNetworkConfigMap(networkConfigs);
  const config = configMap[network];
  const [{ endpoint, ...connectionConfigArgs }, setEndpoints] =
    usePersistedKVStore<Omit<NetworkConfig, "name">>(
      `use-solana/rpc-endpoint/${network}`,
      config,
      storageAdapter
    );

  const connectionConfig: ConnectionConfig = useMemo(() => {
    return {
      ...connectionConfigArgs,
      commitment,
      wsEndpoint: connectionConfigArgs.endpointWs,
    };
  }, [commitment, connectionConfigArgs]);

  return {
    network,
    setNetwork,
    endpoint,
    setEndpoints,
    config: connectionConfig,
  };
};

export const SolanaConnectionConfigContainer = createContainer<
  ConnectionConfigContext,
  ConnectionConfigArgs
>(useConnectionConfigInternal);

interface Props extends ConnectionConfigArgs {
  children: React.ReactNode;
}

/**
 * Compatibility layer to support the official Solana wallet-adapter library.
 * @returns
 */
const SolanaWalletAdapterConnectionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { endpoint, config: connectionConfig } =
    SolanaConnectionConfigContainer.useContainer();
  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      {children}
    </ConnectionProvider>
  );
};

/**
 * Provides a Solana connection.
 * @returns
 */
export const SolanaConnectionProvider: React.FC<Props> = ({
  children,
  ...args
}: Props) => {
  return (
    <SolanaConnectionConfigContainer.Provider initialState={args}>
      <SolanaWalletAdapterConnectionProvider>
        {children}
      </SolanaWalletAdapterConnectionProvider>
    </SolanaConnectionConfigContainer.Provider>
  );
};
