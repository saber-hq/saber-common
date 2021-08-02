import type { Network } from "@saberhq/solana";
import type { PublicKey } from "@solana/web3.js";
import stringify from "fast-json-stable-stringify";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ConnectedWallet, WalletAdapter } from "../adapters/types";
import type { WalletProviderInfo, WalletType } from "../providers";
import { WALLET_PROVIDERS } from "../providers";
import { useLocalStorageState } from "./useLocalStorageState";

/**
 * Wallet-related information.
 */
export interface UseWallet<T extends boolean = boolean> {
  /**
   * Wallet.
   */
  wallet?: WalletAdapter<T>;
  /**
   * Wallet public key.
   */
  publicKey: T extends true ? PublicKey : undefined;
  /**
   * Information about the wallet used.
   */
  provider?: WalletProviderInfo;
  /**
   * Whether or not the wallet is connected.
   */
  connected: T;
  /**
   * Activates a new wallet.
   */
  activate: (
    walletType: WalletType,
    walletArgs?: Record<string, unknown>
  ) => Promise<void>;
  /**
   * Disconnects the wallet and prevents auto-reconnect.
   */
  disconnect: () => void;
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
  walletArgs: Record<string, unknown> | null;
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

  const walletConfig: WalletConfig | null = useMemo(() => {
    try {
      return walletConfigStr
        ? (JSON.parse(walletConfigStr) as WalletConfig)
        : null;
    } catch (e) {
      console.warn("Error parsing wallet config", e);
      return null;
    }
  }, [walletConfigStr]);
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
      const nextWalletConfigStr = stringify({
        walletType: nextWalletType,
        walletArgs: nextWalletArgs ?? null,
      });
      if (walletConfigStr === nextWalletConfigStr) {
        // reconnect
        await wallet?.connect(nextWalletArgs);
      }
      setWalletConfigStr(nextWalletConfigStr);
    },
    [setWalletConfigStr, wallet, walletConfigStr]
  );

  const disconnect = useCallback(() => {
    wallet?.disconnect();
    setWalletConfigStr(null);
  }, [setWalletConfigStr, wallet]);

  return {
    wallet,
    provider,
    connected,
    publicKey: wallet?.publicKey ?? undefined,
    activate,
    disconnect,
  };
};
