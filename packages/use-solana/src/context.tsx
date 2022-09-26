import type { ReactNode } from "react";
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
  ConnectionArgs,
  ConnectionContext,
} from "./utils/useConnectionInternal";
import { useConnectionInternal } from "./utils/useConnectionInternal";
import type { UseProvider, UseProviderArgs } from "./utils/useProviderInternal";
import { useProviderInternal } from "./utils/useProviderInternal";
import type { UseWallet, UseWalletArgs } from "./utils/useWalletInternal";
import { useWalletInternal } from "./utils/useWalletInternal";

export interface UseSolana<
  WalletType extends WalletTypeEnum<WalletType> = typeof DefaultWalletType,
  Connected extends boolean = boolean
> extends ConnectionContext,
    UseWallet<WalletType, Connected>,
    UseProvider {}

export interface UseSolanaArgs<
  WalletType extends WalletTypeEnum<WalletType> = typeof DefaultWalletType
> extends Omit<ConnectionArgs, "storageAdapter">,
    Partial<
      Pick<
        UseWalletArgs<WalletType>,
        | "onConnect"
        | "onDisconnect"
        | "storageAdapter"
        | "walletProviders"
        | "walletOptions"
      >
    >,
    Pick<UseProviderArgs, "broadcastConnections" | "confirmOptions"> {
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
  walletOptions,

  // useProvider args
  broadcastConnections,
  confirmOptions,

  ...connectionArgs
}: UseSolanaArgs<WalletType> = {}): UseSolana<WalletType> => {
  const connectionCtx = useConnectionInternal({
    ...connectionArgs,
    storageAdapter,
  });
  const { network, endpoint } = connectionCtx;
  const walletCtx = useWalletInternal<WalletType>({
    onConnect,
    onDisconnect,
    network,
    endpoint,
    onError,
    storageAdapter,
    walletProviders,
    walletOptions,
  });
  const providerCtx = useProviderInternal({
    connection: connectionCtx.connection,
    wallet: walletCtx.wallet,
    sendConnection: connectionCtx.sendConnection,
    commitment: connectionArgs.commitment,

    broadcastConnections,
    confirmOptions,
  });

  return {
    ...walletCtx,
    ...connectionCtx,
    ...providerCtx,
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
  ...args
}: ProviderProps<WalletType>) => (
  <Solana.Provider initialState={args}>{children}</Solana.Provider>
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
