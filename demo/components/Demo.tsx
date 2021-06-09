import React from "react";

import { useConnectWallet } from "./WalletConnectorProvider";

export const Demo: React.FC = () => {
  const connect = useConnectWallet();
  return <button onClick={connect}>Connect wallet</button>;
};
