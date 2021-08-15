import type { ConnectedWallet } from "@saberhq/use-solana";
import { SolanaProvider } from "@saberhq/use-solana";
import React, { useContext, useState } from "react";

import { notify } from "../utils/notify";
import { WalletSelectorModal } from "./WalletSelectorModal";

export type ConnectWallet = () => void;

const WalletConnectorContext = React.createContext<ConnectWallet | null>(null);

const onConnect = (wallet: ConnectedWallet) => {
  const walletPublicKey = wallet.publicKey.toBase58();
  const keyToDisplay =
    walletPublicKey.length > 20
      ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
          walletPublicKey.length - 7,
          walletPublicKey.length
        )}`
      : walletPublicKey;

  notify({
    message: "Wallet update",
    description: "Connected to wallet " + keyToDisplay,
  });
};

const onDisconnect = () => {
  notify({
    message: "Wallet update",
    description: "Disconnected from wallet",
  });
};

interface Props {
  children: React.ReactNode;
}

export const WalletConnectorProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);
  const connect = () => setShowWalletSelector(true);

  return (
    <SolanaProvider onConnect={onConnect} onDisconnect={onDisconnect}>
      <WalletConnectorContext.Provider value={connect}>
        <WalletSelectorModal
          isOpen={showWalletSelector}
          onDismiss={() => setShowWalletSelector(false)}
        />
        {children}
      </WalletConnectorContext.Provider>
    </SolanaProvider>
  );
};

/**
 * Returns a function which shows the wallet selector modal.
 */
export const useConnectWallet = (): (() => void) => {
  const connect = useContext(WalletConnectorContext);
  if (!connect) {
    throw new Error("Not in WalletConnector context");
  }
  return connect;
};
