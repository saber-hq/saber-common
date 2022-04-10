import type {
  Network,
  NetworkConfig,
  NetworkConfigMap,
} from "@saberhq/solana-contrib";
import { DEFAULT_NETWORK_CONFIG_MAP } from "@saberhq/solana-contrib";
import type { Commitment } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { useMemo } from "react";

import type { StorageAdapter } from "../storage";
import { usePersistedKVStore } from "./usePersistedKVStore";

export type PartialNetworkConfigMap = {
  [N in Network]?: Partial<NetworkConfig>;
};

export interface ConnectionContext {
  connection: Connection;
  sendConnection: Connection;
  network: Network;
  setNetwork: (val: Network) => void | Promise<void>;
  endpoint: string;
  setEndpoints: (
    endpoints: Omit<NetworkConfig, "name">
  ) => void | Promise<void>;
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

export interface ConnectionArgs {
  defaultNetwork?: Network;
  networkConfigs?: PartialNetworkConfigMap;
  commitment?: Commitment;
  storageAdapter: StorageAdapter;
}

/**
 * Handles the connection to the Solana nodes.
 * @returns
 */
export const useConnectionInternal = ({
  // default to mainnet-beta
  defaultNetwork = "mainnet-beta",
  networkConfigs = DEFAULT_NETWORK_CONFIG_MAP,
  commitment = "confirmed",
  storageAdapter,
}: ConnectionArgs): ConnectionContext => {
  const [network, setNetwork] = usePersistedKVStore<Network>(
    "use-solana/network",
    defaultNetwork,
    storageAdapter
  );
  const configMap = makeNetworkConfigMap(networkConfigs);
  const config = configMap[network];
  const [{ endpoint, endpointWs, ...connectionConfigArgs }, setEndpoints] =
    usePersistedKVStore<Omit<NetworkConfig, "name">>(
      `use-solana/rpc-endpoint/${network}`,
      config,
      storageAdapter
    );

  const connection = useMemo(
    () =>
      new Connection(endpoint, {
        ...connectionConfigArgs,
        commitment: connectionConfigArgs.commitment ?? commitment,
        wsEndpoint: endpointWs,
      }),
    [commitment, connectionConfigArgs, endpoint, endpointWs]
  );
  const sendConnection = useMemo(
    () =>
      new Connection(endpoint, {
        ...connectionConfigArgs,
        commitment: connectionConfigArgs.commitment ?? commitment,
        wsEndpoint: endpointWs,
      }),
    [commitment, connectionConfigArgs, endpoint, endpointWs]
  );

  return {
    connection,
    sendConnection,
    network,
    setNetwork,
    endpoint,
    setEndpoints,
  };
};
