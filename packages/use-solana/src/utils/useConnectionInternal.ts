import { Cluster, Connection, Keypair } from "@solana/web3.js";
import { useEffect, useMemo } from "react";

import {
  ClusterConfigMap,
  DEFAULT_CLUSTER_CONFIG_MAP,
  PartialClusterConfigMap,
} from "../types";
import { useLocalStorageState } from "./useLocalStorageState";

export interface ConnectionContext {
  connection: Connection;
  sendConnection: Connection;
  cluster: Cluster;
  setCluster: (val: Cluster) => void;
  endpoint: string;
}

const makeClusterConfigMap = (
  partial: PartialClusterConfigMap
): ClusterConfigMap =>
  Object.entries(DEFAULT_CLUSTER_CONFIG_MAP).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k as Cluster]: {
        ...partial[k as Cluster],
        ...v,
      },
    }),
    DEFAULT_CLUSTER_CONFIG_MAP
  );

export interface ConnectionArgs {
  defaultCluster?: Cluster;
  clusterConfigs?: PartialClusterConfigMap;
}

/**
 * Handles the connection to the Solana nodes.
 * @returns
 */
export const useConnectionInternal = ({
  // default to mainnet-beta
  defaultCluster = "mainnet-beta",
  clusterConfigs = DEFAULT_CLUSTER_CONFIG_MAP,
}: ConnectionArgs): ConnectionContext => {
  const [cluster, setCluster] = useLocalStorageState<Cluster>(
    "use-solana/cluster",
    defaultCluster
  );
  const configMap = makeClusterConfigMap(clusterConfigs);
  const { endpoint } = configMap[cluster];

  const connection = useMemo(
    () => new Connection(endpoint, "recent"),
    [endpoint]
  );
  const sendConnection = useMemo(
    () => new Connection(endpoint, "recent"),
    [endpoint]
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
    cluster,
    setCluster,
    endpoint,
  };
};
