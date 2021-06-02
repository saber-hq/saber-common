import { Cluster } from "@solana/web3.js";
import * as React from "react";
import { useContext, useEffect, useMemo, useState } from "react";

import { ConnectedWallet, WalletAdapter } from "./adapters";
import { WALLET_PROVIDERS, WalletProviderInfo, WalletType } from "./providers";
import { useLocalStorageState } from "./utils/useLocalStorageState";

export interface IWalletContext<T extends boolean = boolean> {
  wallet?: WalletAdapter<T>;
  connected: T;
  activate: (walletType: WalletType) => void;
}

const WalletContext = React.createContext<IWalletContext | null>(null);

interface Props {
  cluster: Cluster;
  endpoint: string;
  onConnect: (wallet: WalletAdapter<true>) => void;
  onDisconnect: (wallet: WalletAdapter<false>) => void;
  children: React.ReactNode;
}

export const WalletProvider: React.FC<Props> = ({
  children,
  onConnect,
  onDisconnect,
  cluster,
  endpoint,
}: Props) => {
  const [walletType, setWalletType] = useLocalStorageState<WalletType | null>(
    "use-solana/wallet-type",
    null
  );

  const provider: WalletProviderInfo | null = useMemo(
    () => (walletType ? WALLET_PROVIDERS[walletType] : null),
    [walletType]
  );

  const [connected, setConnected] = useState(false);

  const wallet = useMemo(() => {
    if (provider) {
      console.log("New wallet", provider.url, cluster);
      return new provider.makeAdapter(provider.url, endpoint);
    }
  }, [provider, cluster, endpoint]);

  useEffect(() => {
    if (wallet) {
      setTimeout(() => {
        void wallet.connect();
      }, 500);
      wallet.on("connect", () => {
        if (wallet?.publicKey) {
          setConnected(true);
          onConnect?.(wallet as WalletAdapter<true>);
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
        onDisconnect?.(wallet as WalletAdapter<false>);
      });
    }

    return () => {
      if (wallet && wallet.connected) {
        void wallet.disconnect();
      }
    };
  }, [onConnect, onDisconnect, wallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        activate: (nextWalletType) => {
          if (walletType === nextWalletType) {
            // reconnect
            void wallet?.connect().then(() => {
              setConnected(true);
            });
          }
          setWalletType(walletType);
        },
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): IWalletContext {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("wallet not loaded");
  }
  return context;
}

/**
 * Uses the wallet if it is connected.
 */
export const useConnectedWallet = (): ConnectedWallet | null => {
  const { wallet, connected } = useWallet();
  if (!wallet?.connected || !connected || !wallet.publicKey) {
    return null;
  }
  return wallet as ConnectedWallet;
};
