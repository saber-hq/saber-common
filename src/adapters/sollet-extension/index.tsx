import Wallet from "@project-serum/sol-wallet-adapter";

declare global {
  interface Window {
    sollet?: string;
  }
}

export class SolletExtensionAdapter extends Wallet {
  constructor(_providerURL: string, network: string) {
    super(
      (() => {
        const sollet = window.sollet;
        if (!sollet) {
          throw new Error("Sollet extension not found");
        }
        return sollet;
      })(),
      network
    );
  }
}
