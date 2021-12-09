import { useWallet } from "@solana/wallet-adapter-react";
import type { Wallet } from "@solana/wallet-adapter-wallets";
import type { Connection } from "@solana/web3.js";

import { useSolana } from "./context";
import type { ConnectionContext } from "./utils/useConnectionInternal";

/**
 * Gets the current Solana wallet, returning null if it is not connected.
 */
export const useConnectedWallet = (): Wallet | null => {
  const { wallet, connected, publicKey } = useWallet();

  if (!wallet || !connected || !publicKey) {
    return null;
  }

  return wallet;
};

/**
 * Loads the connection context
 * @returns
 */
export function useConnectionContext(): ConnectionContext {
  const context = useSolana();
  if (!context) {
    throw new Error("Not in context");
  }
  return context;
}

/**
 * Gets the read connection
 * @returns
 */
export function useConnection(): Connection {
  return useConnectionContext().connection;
}

/**
 * Gets the send connection
 * @returns
 */
export function useSendConnection(): Connection {
  return useConnectionContext().sendConnection;
}
