import type { Network } from "@saberhq/solana-contrib";
import type { PublicKey } from "@solana/web3.js";
import stringify from "fast-json-stable-stringify";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ConnectedWallet, WalletAdapter } from "../adapters/types";
import type { UseSolanaError } from "../error";
import {
  WalletActivateError,
  WalletAutomaticConnectionError,
  WalletDisconnectError,
} from "../error";
import type { WalletProviderInfo, WalletType } from "../providers";
import { WALLET_PROVIDERS } from "../providers";
import type { StorageAdapter } from "../storage";
import { usePersistedKVStore } from "./usePersistedKVStore";

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
  walletProviderInfo?: WalletProviderInfo;
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
  onConnect: (
    wallet: WalletAdapter<true>,
    provider: WalletProviderInfo
  ) => void;
  onDisconnect: (
    wallet: WalletAdapter<false>,
    provider: WalletProviderInfo
  ) => void;
  onError: (err: UseSolanaError) => void;
  network: Network;
  endpoint: string;
  storageAdapter: StorageAdapter;
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
  onError,
  storageAdapter,
}: UseWalletArgs): UseWallet<boolean> => {
  const [walletConfigStr, setWalletConfigStr] = usePersistedKVStore<
    string | null
  >("use-solana/wallet-config", null, storageAdapter);

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

  const [walletProviderInfo, wallet]:
    | readonly [WalletProviderInfo, WalletAdapter]
    | readonly [undefined, undefined] = useMemo(() => {
    if (walletType) {
      const provider = WALLET_PROVIDERS[walletType];
      console.debug("New wallet", provider.url, network);
      return [provider, new provider.makeAdapter(provider.url, endpoint)];
    }
    return [undefined, undefined];
  }, [walletType, network, endpoint]);

  useEffect(() => {
    if (wallet && walletProviderInfo) {
      setTimeout(() => {
        void wallet.connect(walletArgs).catch((e) => {
          onError(new WalletAutomaticConnectionError(e, walletProviderInfo));
        });
      }, 500);
      wallet.on("connect", () => {
        if (wallet?.publicKey) {
          setConnected(true);
          onConnect(wallet as ConnectedWallet, walletProviderInfo);
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
        onDisconnect(wallet as WalletAdapter<false>, walletProviderInfo);
      });
    }

    return () => {
      if (wallet && wallet.connected) {
        const disconnect = wallet.disconnect();
        if (disconnect) {
          disconnect.catch((e) => {
            onError(new WalletDisconnectError(e, walletProviderInfo));
          });
        }
      }
    };
  }, [
    onConnect,
    onDisconnect,
    onError,
    wallet,
    walletArgs,
    walletProviderInfo,
  ]);

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
        try {
          await wallet?.connect(nextWalletArgs);
        } catch (e) {
          onError(new WalletActivateError(e, nextWalletType, nextWalletArgs));
        }
      }
      await setWalletConfigStr(nextWalletConfigStr);
    },
    [onError, setWalletConfigStr, wallet, walletConfigStr]
  );

  const disconnect = useCallback(async () => {
    wallet?.disconnect();
    await setWalletConfigStr(null);
  }, [setWalletConfigStr, wallet]);

  return {
    wallet,
    walletProviderInfo,
    connected,
    publicKey: wallet?.publicKey ?? undefined,
    activate,
    disconnect,
  };
};
