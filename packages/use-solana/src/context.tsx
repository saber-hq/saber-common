import type {
  WalletAdapter,
  WalletAdapterNetwork,
  WalletError,
} from "@solana/wallet-adapter-base";
import {
  ConnectionContext as SolanaConnectionContext,
  useWallet,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import type { Wallet } from "@solana/wallet-adapter-wallets";
import {
  getLedgerWallet,
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
} from "@solana/wallet-adapter-wallets";
import type { ConnectionConfig } from "@solana/web3.js";
import type { ReactNode } from "react";
import React, { useEffect, useMemo } from "react";
import { createContainer } from "unstated-next";

import type { WalletProvider } from "./providers";
import type {
  ConnectionArgs,
  ConnectionContext,
} from "./utils/useConnectionInternal";
import { useConnectionInternal } from "./utils/useConnectionInternal";
import { usePrevious } from "./utils/usePrevious";
import type { UseProvider } from "./utils/useProviderInternal";
import { useProviderInternal } from "./utils/useProviderInternal";

export interface UseSolana<T extends boolean = boolean>
  extends ConnectionContext,
    UseProvider {
  config: ConnectionConfig;
}

export interface UseSolanaArgs extends ConnectionArgs {
  /**
   * Called when an error is thrown.
   */

  /**
   * @deprecated
   */
  onConnect?: (adapter: WalletAdapter, wallet: Wallet) => void;

  /**
   * @deprecated
   *
   */
  onDisconnect?: (adapter: WalletAdapter, wallet: Wallet) => void;

  onError?: (err: WalletError) => void;
}

const defaultOnConnect = (adapter: WalletAdapter, wallet: Wallet) => {
  console.log(
    `Connected to ${wallet.name} wallet: ${adapter.publicKey?.toString() ?? ""}`
  );
};

const defaultOnDisconnect = (adapter: WalletAdapter, wallet: Wallet) => {
  console.log(`Disconnected from ${wallet.name} wallet`);
};

const defaultOnError = (err: WalletError) => {
  console.error(err);
};

/**
 * Provides Solana.
 * @returns
 */
const useSolanaInternal = ({
  onConnect = defaultOnConnect,
  onDisconnect = defaultOnDisconnect,
  connection,
  sendConnection,
}: UseSolanaArgs = {}): UseSolana => {
  const { wallet, adapter, connected, disconnecting, connecting } = useWallet();
  const providerCtx = useProviderInternal({
    connection,
    wallet,
  });

  // TODO: until merged into wallet-adapter
  const previousConnected = usePrevious(connected);
  const previousWallet = usePrevious(wallet);
  const previousAdapter = usePrevious(adapter);

  useEffect(() => {
    if (!previousConnected && connected) {
      if (adapter && wallet) {
        onConnect(adapter, wallet);
      }
    }

    if (previousConnected && !connected) {
      if (previousAdapter && previousWallet) {
        onDisconnect(previousAdapter, previousWallet);
      }
    }
  }, [
    wallet,
    onConnect,
    onDisconnect,
    connected,
    disconnecting,
    adapter,
    previousWallet,
    previousAdapter,
    previousConnected,
  ]);

  return {
    ...providerCtx,
  };
};

const Solana = createContainer(useSolanaInternal);

type ProviderProps = UseSolanaArgs & {
  children: ReactNode;
  wallets: WalletProvider[];
};

/**
 * Provides a Solana SDK.
 *
 * Note: ensure that `onConnect` and `onDisconnect` are wrapped in useCallback or are
 * statically defined, otherwise the wallet will keep re-rendering.
 * @returns
 */
export const SolanaProvider: React.FC<ProviderProps> = ({
  children,
  networkConfigs,
  defaultNetwork,
  storageAdapter,
  commitment,
  wallets,
  onError = defaultOnError,
  ...args
}: ProviderProps) => {
  const connectionCtx = useConnectionInternal({
    networkConfigs,
    defaultNetwork,
    commitment,
    storageAdapter,
  });
  const { connection } = connectionCtx;

  const { network } = connectionCtx;

  const defaultedWallets = useMemo(() => {
    if (wallets) return wallets;

    return [
      getSolletWallet({ network: network as WalletAdapterNetwork }),
      getPhantomWallet(),
      getLedgerWallet(),
      getMathWallet(),
      getSolflareWallet(),
      // getBitKeepWallet(),
      // getBitpieWallet(),
    ];
  }, [network, wallets]);

  return (
    <SolanaConnectionContext.Provider value={{ connection }}>
      <SolanaWalletProvider
        wallets={defaultedWallets}
        autoConnect
        onError={onError}
      >
        <Solana.Provider initialState={{ ...connectionCtx }}>
          {children}
        </Solana.Provider>
      </SolanaWalletProvider>
    </SolanaConnectionContext.Provider>
  );
};

/**
 * Fetches the loaded Solana SDK.
 */
export const useSolana = Solana.useContainer;
