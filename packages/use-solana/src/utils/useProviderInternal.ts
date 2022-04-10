import type {
  AugmentedProvider,
  ReadonlyProvider,
} from "@saberhq/solana-contrib";
import {
  DEFAULT_PROVIDER_OPTIONS,
  SolanaAugmentedProvider,
  SolanaProvider,
  SolanaReadonlyProvider,
} from "@saberhq/solana-contrib";
import type { Commitment, ConfirmOptions, Connection } from "@solana/web3.js";
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
  providerMut: AugmentedProvider | null;
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
   * Confirm options for the mutable provider.
   */
  confirmOptions?: ConfirmOptions;
}

export const useProviderInternal = ({
  connection,
  sendConnection = connection,
  wallet,
  commitment = "confirmed",
  confirmOptions = DEFAULT_PROVIDER_OPTIONS,
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
        ? new SolanaAugmentedProvider(
            SolanaProvider.load({
              connection,
              sendConnection,
              wallet: wallet as ConnectedWallet,
              opts: confirmOptions,
            })
          )
        : null,
    [wallet, connected, publicKey, connection, sendConnection, confirmOptions]
  );

  return {
    provider,
    providerMut,
  };
};
