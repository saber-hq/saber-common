import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { ExodusWalletAdapter } from "@solana/wallet-adapter-exodus";

export class FixedExodusWalletAdapter
  extends ExodusWalletAdapter
  implements SignerWalletAdapter {}
