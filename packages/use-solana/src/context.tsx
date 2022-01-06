import { useConnection } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import type { ReactNode } from "react";
import React from "react";
import type { Container } from "unstated-next";
import { createContainer, useContainer } from "unstated-next";

import type {
  DefaultWalletType,
  WalletAdapter,
  WalletProviderInfo,
  WalletTypeEnum,
} from ".";
import type { UseSolanaError } from "./error";
import { ErrorLevel } from "./error";
import type { UnknownWalletType, WalletProviderMap } from "./providers";
import { DEFAULT_WALLET_PROVIDERS } from "./providers";
import { LOCAL_STORAGE_ADAPTER } from "./storage";
import type {
  ConnectionConfigArgs,
  ConnectionConfigContext,
} from "./utils/SolanaConnectionProvider";
import {
  SolanaConnectionConfigContainer,
  SolanaConnectionProvider,
} from "./utils/SolanaConnectionProvider";
import type { UseProvider } from "./utils/useProviderInternal";
import { useProviderInternal } from "./utils/useProviderInternal";
import type { UseWallet, UseWalletArgs } from "./utils/useWalletInternal";
import { useWalletInternal } from "./utils/useWalletInternal";

export interface UseSolana<
  WalletType extends WalletTypeEnum<WalletType> = typeof DefaultWalletType,
  Connected extends boolean = boolean
> extends ConnectionConfigContext,
    UseWallet<WalletType, Connected>,
    UseProvider {
  connection: Connection;
  sendConnection: Connection;
}

export interface UseSolanaArgs<
  WalletType extends WalletTypeEnum<WalletType> = typeof DefaultWalletType
> extends Omit<ConnectionConfigArgs, "storageAdapter">,
    Partial<
      Pick<
        UseWalletArgs<WalletType>,
        "onConnect" | "onDisconnect" | "storageAdapter" | "walletProviders"
      >
    > {
  /**
   * Called when an error is thrown.
   */
  onError?: (err: UseSolanaError) => void;
}

const defaultOnConnect = (
  wallet: WalletAdapter<true>,
  provider: WalletProviderInfo
) => {
  console.log(
    `Connected to ${provider.name} wallet: ${wallet.publicKey.toString()}`
  );
};

const defaultOnDisconnect = (
  _wallet: WalletAdapter<false>,
  provider: WalletProviderInfo
) => {
  console.log(`Disconnected from ${provider.name} wallet`);
};

const defaultOnError = (err: UseSolanaError) => {
  if (err.level === ErrorLevel.WARN) {
    console.warn(err);
  } else {
    console.error(err);
  }
};

/**
 * Provides Solana.
 * @returns
 */
const useSolanaInternal = <WalletType extends WalletTypeEnum<WalletType>>({
  onConnect = defaultOnConnect,
  onDisconnect = defaultOnDisconnect,
  onError = defaultOnError,
  storageAdapter = LOCAL_STORAGE_ADAPTER,
  walletProviders = DEFAULT_WALLET_PROVIDERS as unknown as WalletProviderMap<WalletType>,
}: UseSolanaArgs<WalletType> = {}): UseSolana<WalletType> => {
  const { connection } = useConnection();
  const connectionConfigCtx = SolanaConnectionConfigContainer.useContainer();
  const { network, endpoint } = connectionConfigCtx;
  const walletCtx = useWalletInternal<WalletType>({
    onConnect,
    onDisconnect,
    network,
    endpoint,
    onError,
    storageAdapter,
    walletProviders,
  });
  const providerCtx = useProviderInternal({
    connection,
    wallet: walletCtx.wallet,
  });

  return {
    ...walletCtx,
    ...connectionConfigCtx,
    ...providerCtx,
    connection,
    sendConnection: connection,
  };
};

const Solana = createContainer<
  UseSolana<UnknownWalletType>,
  UseSolanaArgs<UnknownWalletType>
>(useSolanaInternal);

type ProviderProps<WalletType extends WalletTypeEnum<WalletType>> =
  UseSolanaArgs<WalletType> & { children: ReactNode };

/**
 * Provides a Solana SDK.
 *
 * Note: ensure that `onConnect` and `onDisconnect` are wrapped in useCallback or are
 * statically defined, otherwise the wallet will keep re-rendering.
 * @returns
 */
export const SolanaProvider = <
  WalletType extends WalletTypeEnum<WalletType> = typeof DefaultWalletType
>({
  children,
  storageAdapter = LOCAL_STORAGE_ADAPTER,
  ...args
}: ProviderProps<WalletType>) => (
  <SolanaConnectionProvider storageAdapter={storageAdapter} {...args}>
    <Solana.Provider initialState={args}>{children}</Solana.Provider>
  </SolanaConnectionProvider>
);

/**
 * Fetches the loaded Solana SDK.
 */
export const useSolana = <WalletType extends WalletTypeEnum<WalletType>>() =>
  useContainer(
    Solana as unknown as Container<
      UseSolana<WalletType>,
      UseSolanaArgs<WalletType>
    >
  );
