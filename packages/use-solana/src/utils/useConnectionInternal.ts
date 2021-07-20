import {
  DEFAULT_NETWORK_CONFIG_MAP,
  Network,
  NetworkConfig,
  NetworkConfigMap,
} from "@saberhq/solana";
import { Commitment, Connection, Keypair } from "@solana/web3.js";
import { useEffect, useMemo } from "react";

import { useLocalStorageState } from "./useLocalStorageState";

export type PartialNetworkConfigMap = {
  [N in Network]?: Partial<NetworkConfig>;
};

export interface ConnectionContext {
  connection: Connection;
  sendConnection: Connection;
  network: Network;
  setNetwork: (val: Network) => void;
  endpoint: string;
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
}

/**
 * Handles the connection to the Solana nodes.
 * @returns
 */
export const useConnectionInternal = ({
  // default to mainnet-beta
  defaultNetwork = "mainnet-beta",
  networkConfigs = DEFAULT_NETWORK_CONFIG_MAP,
  commitment = "recent",
}: ConnectionArgs): ConnectionContext => {
  const [network, setNetwork] = useLocalStorageState<Network>(
    "use-solana/network",
    defaultNetwork
  );
  const configMap = makeNetworkConfigMap(networkConfigs);
  const config = configMap[network];
  const { endpoint, endpointWs } = config;

  const connection = useMemo(
    () =>
      new Connection(endpoint, {
        commitment,
        wsEndpoint: endpointWs,
      }),
    [commitment, endpoint, endpointWs]
  );
  const sendConnection = useMemo(
    () =>
      new Connection(endpoint, {
        commitment,
        wsEndpoint: endpointWs,
      }),
    [commitment, endpoint, endpointWs]
  );

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from every getting empty
  useEffect(() => {
    const id = connection.onAccountChange(Keypair.generate().publicKey, () => {
      // noop
    });
    return () => {
      void connection.removeAccountChangeListener(id);
    };
  }, [connection]);
  useEffect(() => {
    const id = sendConnection.onAccountChange(
      Keypair.generate().publicKey,
      () => {
        // noop
      }
    );
    return () => {
      void sendConnection.removeAccountChangeListener(id);
    };
  }, [sendConnection]);

  useEffect(() => {
    const id = connection.onSlotChange(() => null);
    return () => {
      void connection.removeSlotChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = sendConnection.onSlotChange(() => null);
    return () => {
      void sendConnection.removeSlotChangeListener(id);
    };
  }, [sendConnection]);

  return {
    connection,
    sendConnection,
    network,
    setNetwork,
    endpoint,
  };
};
