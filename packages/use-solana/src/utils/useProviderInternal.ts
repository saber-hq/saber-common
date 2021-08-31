import type { Provider } from "@saberhq/solana-contrib";
import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import type { Commitment, Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { useMemo } from "react";

import type { ConnectedWallet, WalletAdapter } from "../adapters/types";

/**
 * Wallet-related information.
 */
export interface UseProvider {
  /**
   * Read-only {@link Provider}.
   */
  provider: Provider;
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
      new SolanaProvider(
        connection,
        sendConnection,
        new SignerWallet(Keypair.generate()),
        {
          commitment,
        }
      ),
    [commitment, connection, sendConnection]
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
