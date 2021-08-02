import type { Provider } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import {
  MintLayout,
  Token as SPLToken,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { PublicKey, Signer } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

/**
 * Creates instructions for initializing a mint.
 * @param param0
 * @returns
 */
export const createInitMintInstructions = async ({
  provider,
  mintKP,
  decimals,
  mintAuthority = provider.wallet.publicKey,
  freezeAuthority = null,
}: {
  provider: Provider;
  mintKP: Signer;
  decimals: number;
  mintAuthority?: PublicKey;
  freezeAuthority?: PublicKey | null;
}): Promise<TransactionEnvelope> => {
  const from = provider.wallet.publicKey;
  return new TransactionEnvelope(
    provider,
    [
      SystemProgram.createAccount({
        fromPubkey: from,
        newAccountPubkey: mintKP.publicKey,
        space: MintLayout.span,
        lamports: await SPLToken.getMinBalanceRentForExemptMint(
          provider.connection
        ),
        programId: TOKEN_PROGRAM_ID,
      }),
      SPLToken.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mintKP.publicKey,
        decimals,
        mintAuthority,
        freezeAuthority
      ),
    ],
    [mintKP]
  );
};
