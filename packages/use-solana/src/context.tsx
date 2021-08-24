import type { ReactNode } from "react";
import React from "react";
import { createContainer } from "unstated-next";

import type {
  ConnectionArgs,
  ConnectionContext,
} from "./utils/useConnectionInternal";
import { useConnectionInternal } from "./utils/useConnectionInternal";
import type { UseProvider } from "./utils/useProviderInternal";
import { useProviderInternal } from "./utils/useProviderInternal";
import type { UseWallet, UseWalletArgs } from "./utils/useWalletInternal";
import { useWalletInternal } from "./utils/useWalletInternal";

export interface UseSolana<T extends boolean = boolean>
  extends ConnectionContext,
    UseWallet<T>,
    UseProvider {}

export interface UseSolanaArgs
  extends ConnectionArgs,
    Pick<UseWalletArgs, "onConnect" | "onDisconnect"> {}

/**
 * Provides Solana.
 * @returns
 */
const useSolanaInternal = ({
  onConnect,
  onDisconnect,
  ...connectionArgs
}: UseSolanaArgs = {}): UseSolana => {
  const connectionCtx = useConnectionInternal(connectionArgs);
  const { network, endpoint } = connectionCtx;
  const walletCtx = useWalletInternal({
    onConnect,
    onDisconnect,
    network,
    endpoint,
  });
  const providerCtx = useProviderInternal({
    connection: connectionCtx.connection,
    wallet: walletCtx.wallet,
  });

  return {
    ...walletCtx,
    ...connectionCtx,
    ...providerCtx,
  };
};

const Solana = createContainer(useSolanaInternal);

type ProviderProps = UseSolanaArgs & { children: ReactNode };

/**
 * Provides a Solana SDK.
 * Note: ensure that `onConnect` and `onDisconnect` are wrapped in useCallback or are
 * statically defined, otherwise the wallet will keep re-rendering.
 * @returns
 */
export const SolanaProvider: React.FC<ProviderProps> = ({
  children,
  ...args
}: ProviderProps) => (
  <Solana.Provider initialState={args}>{children}</Solana.Provider>
);

/**
 * Fetches the loaded Solana SDK.
 */
export const useSolana = Solana.useContainer;
