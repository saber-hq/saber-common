import { Connection } from "@solana/web3.js";

import { ConnectedWallet } from "./adapters/types";
import { UseSolana, useSolana } from "./context";
import { ConnectionContext } from "./utils/useConnectionInternal";

/**
 * Gets the current Solana wallet.
 */
export function useWallet(): UseSolana {
  const context = useSolana();
  if (!context) {
    throw new Error("wallet not loaded");
  }
  return context;
}

/**
 * Gets the current Solana wallet, returning null if it is not connected.
 */
export const useConnectedWallet = (): ConnectedWallet | null => {
  const { wallet, connected } = useWallet();
  if (!wallet?.connected || !connected || !wallet.publicKey) {
    return null;
  }
  return wallet as ConnectedWallet;
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
export async function useConnection(): Promise<Connection> {
  const ctx = useConnectionContext();
  return selectConnection(ctx.connection, ctx.fallbackConnection);
}

/**
 * Gets the send connection
 * @returns
 */
export async function useSendConnection(): Promise<Connection> {
  const ctx = useConnectionContext();
  return selectConnection(ctx.sendConnection, ctx.fallbackConnection);
}

const selectConnection = async (
  primary: Connection,
  fallback: Connection | null
): Promise<Connection> => {
  if (fallback) {
    try {
      await primary.getSlot();
    } catch (e) {
      console.log("Failed to get slot from primary connection");
      return fallback;
    }
  }

  return primary;
};
