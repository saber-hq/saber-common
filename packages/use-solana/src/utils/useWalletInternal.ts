import { Network } from "@saberhq/solana";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConnectedWallet, WalletAdapter } from "../adapters/types";
import { WALLET_PROVIDERS, WalletProviderInfo, WalletType } from "../providers";
import { useLocalStorageState } from "./useLocalStorageState";

export interface UseWallet<T extends boolean = boolean> {
  wallet?: WalletAdapter<T>;
  publicKey?: PublicKey;
  provider?: WalletProviderInfo;
  connected: T;
  activate: (
    walletType: WalletType,
    walletArgs?: Record<string, unknown>
  ) => void;
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
  network: Network;
  endpoint: string;
}

interface WalletConfig {
  walletType: WalletType;
  walletArgs?: Record<string, unknown>;
}

export const useWalletInternal = ({
  onConnect,
  onDisconnect,
  network,
  endpoint,
}: UseWalletArgs): UseWallet<boolean> => {
  const [walletConfigStr, setWalletConfigStr] = useLocalStorageState<
    string | null
  >("use-solana/wallet-config", null);

  let walletConfig: WalletConfig | null = null;
  try {
    walletConfig = walletConfigStr
      ? (JSON.parse(walletConfigStr) as WalletConfig)
      : null;
  } catch (e) {
    console.warn("Error parsing wallet config", e);
  }
  const { walletType, walletArgs } = walletConfig ?? {
    walletType: null,
    walletArgs: null,
  };

  const [connected, setConnected] = useState(false);

  const [provider, wallet]:
    | readonly [WalletProviderInfo, WalletAdapter]
    | readonly [undefined, undefined] = useMemo(() => {
    if (walletType) {
      const provider = WALLET_PROVIDERS[walletType];
      console.log("New wallet", provider.url, network);
      return [provider, new provider.makeAdapter(provider.url, endpoint)];
    }
    return [undefined, undefined];
  }, [walletType, network, endpoint]);

  useEffect(() => {
    if (wallet && provider) {
      setTimeout(() => {
        void wallet.connect(walletArgs).catch((e) => {
          console.warn(
            `Error attempting to automatically connect to ${provider.name}`,
            e
          );
        });
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
  }, [onConnect, onDisconnect, provider, wallet, walletArgs]);

  const activate = useCallback(
    async (
      nextWalletType: WalletType,
      nextWalletArgs?: Record<string, unknown>
    ): Promise<void> => {
      if (walletType === nextWalletType) {
        // reconnect
        await wallet?.connect(nextWalletArgs);
      }
      setWalletConfigStr(
        JSON.stringify({
          walletType: nextWalletType,
          walletArgs: nextWalletArgs,
        })
      );
    },
    [setWalletConfigStr, wallet, walletType]
  );

  return {
    wallet,
    provider,
    connected,
    publicKey: wallet?.publicKey ?? undefined,
    activate,
  };
};
