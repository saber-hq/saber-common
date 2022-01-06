import type { WalletProviderProps } from "@solana/wallet-adapter-react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import * as React from "react";

import { SolanaConnectionConfigContainer } from "./utils/SolanaConnectionProvider";

type Props = WalletProviderProps;

/**
 * Compatibility layer to support the official Solana wallet-adapter library.
 * @returns
 */
export const SolanaWalletAdapterProvider: React.FC<Props> = ({
  children,
  ...walletProps
}) => {
  const { endpoint, config: connectionConfig } =
    SolanaConnectionConfigContainer.useContainer();
  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider {...walletProps}>{children}</WalletProvider>
    </ConnectionProvider>
  );
};
