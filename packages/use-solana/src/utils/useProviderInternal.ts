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
  wallet,
}: UseProviderArgs): UseProvider => {
  const provider = useMemo(
    () =>
      new SolanaProvider(connection, new SignerWallet(Keypair.generate()), {
        commitment: "recent",
      }),
    [connection]
  );
  const providerMut = useMemo(
    () =>
      wallet && wallet.publicKey
        ? new SolanaProvider(connection, wallet as ConnectedWallet, {
            commitment: "recent",
          })
        : null,
    [connection, wallet]
  );

  return {
    provider,
    providerMut,
  };
};
