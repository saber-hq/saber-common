import React, { ReactNode } from "react";
import { createContainer } from "unstated-next";

import {
  ConnectionArgs,
  ConnectionContext,
  useConnectionInternal,
} from "./utils/useConnectionInternal";
import {
  UseWallet,
  UseWalletArgs,
  useWalletInternal,
} from "./utils/useWalletInternal";

export interface UseSolana<T extends boolean = boolean>
  extends ConnectionContext,
    UseWallet<T> {}

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

  return {
    ...walletCtx,
    ...connectionCtx,
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
