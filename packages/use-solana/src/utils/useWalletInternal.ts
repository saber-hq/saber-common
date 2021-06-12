import { Cluster } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { ConnectedWallet, WalletAdapter } from "../adapters/types";
import { WALLET_PROVIDERS, WalletProviderInfo, WalletType } from "../providers";
import { useLocalStorageState } from "./useLocalStorageState";

export interface UseWallet<T extends boolean = boolean> {
  wallet?: WalletAdapter<T>;
  connected: T;
  activate: (walletType: WalletType) => void;
}

export interface UseWalletArgs {
  onConnect?: (
    wallet: WalletAdapter<true>,
    provider: WalletProviderInfo
  ) => void;
  onDisconnect?: (
    wallet: WalletAdapter<false>,
    provider: WalletProviderInfo
  ) => void;
  cluster: Cluster;
  endpoint: string;
}

export const useWalletInternal = ({
  onConnect,
  onDisconnect,
  cluster,
  endpoint,
}: UseWalletArgs): UseWallet<boolean> => {
  const [walletTypeString, setWalletTypeString] = useLocalStorageState<
    string | null
  >("use-solana/wallet-type", null);
  const walletType =
    walletTypeString && walletTypeString in WalletType
      ? (walletTypeString as WalletType)
      : null;

  const [connected, setConnected] = useState(false);

  const [provider, wallet] = useMemo(() => {
    if (walletType) {
      const provider = WALLET_PROVIDERS[walletType];
      console.log("New wallet", provider.url, cluster);
      return [provider, new provider.makeAdapter(provider.url, endpoint)];
    }
    return [undefined, undefined] as const;
  }, [walletType, cluster, endpoint]);

  useEffect(() => {
    if (wallet && provider) {
      setTimeout(() => {
        void wallet.connect();
      }, 500);
      wallet.on("connect", () => {
        if (wallet?.publicKey) {
          setConnected(true);
          onConnect?.(wallet as ConnectedWallet, provider);
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
        onDisconnect?.(wallet as WalletAdapter<false>, provider);
      });
    }

    return () => {
      if (wallet && wallet.connected) {
        void wallet.disconnect();
      }
    };
  }, [onConnect, onDisconnect, provider, wallet]);

  return {
    wallet,
    connected,
    activate: (nextWalletType) => {
      if (walletType === nextWalletType) {
        // reconnect
        void wallet?.connect();
      }
      setWalletTypeString(nextWalletType);
    },
  };
};
