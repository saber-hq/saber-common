import type { Provider, ReadonlyProvider } from "@saberhq/solana-contrib";
import {
  SolanaProvider,
  SolanaReadonlyProvider,
} from "@saberhq/solana-contrib";
import type { Commitment, Connection } from "@solana/web3.js";
import { useMemo } from "react";

import type { ConnectedWallet, WalletAdapter } from "../adapters/types";

/**
 * Wallet-related information.
 */
export interface UseProvider {
  /**
   * Read-only provider.
   */
  provider: ReadonlyProvider;
  /**
   * {@link Provider} of the currently connected wallet.
   */
  providerMut: Provider | null;
}

export interface UseProviderArgs {
  /**
   * Connection.
   */
  connection: Connection;
  /**
   * Send connection.
   */
  sendConnection?: Connection;
  /**
   * Wallet.
   */
  wallet?: WalletAdapter<boolean>;
  /**
   * Commitment for the read-only provider.
   */
  commitment?: Commitment;
  /**
   * Commitment for the mutable provider.
   */
  commitmentMut?: Commitment;
}

export const useProviderInternal = ({
  connection,
  sendConnection = connection,
  wallet,
  commitment = "recent",
  commitmentMut = "recent",
}: UseProviderArgs): UseProvider => {
  const provider = useMemo(
    () =>
      new SolanaReadonlyProvider(connection, {
        commitment,
      }),
    [commitment, connection]
  );

  const connected = wallet?.connected;
  const publicKey = wallet?.publicKey;
  const providerMut = useMemo(
    () =>
      wallet && connected && publicKey
        ? new SolanaProvider(
            connection,
            sendConnection,
            wallet as ConnectedWallet,
            {
              commitment: commitmentMut,
            }
          )
        : null,
    [wallet, connected, publicKey, connection, sendConnection, commitmentMut]
  );

  return {
    provider,
    providerMut,
  };
};
