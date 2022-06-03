import type { Provider } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { Token as SPLToken, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { PublicKey, Signer } from "@solana/web3.js";
import { Keypair, SystemProgram } from "@solana/web3.js";

import { TokenAccountLayout } from "../layout.js";

export const createTokenAccount = async ({
  provider,
  mint,
  owner = provider.wallet.publicKey,
  payer = provider.wallet.publicKey,
  accountSigner = Keypair.generate(),
}: {
  provider: Provider;
  mint: PublicKey;
  owner?: PublicKey;
  payer?: PublicKey;
  /**
   * The keypair of the account to be created.
   */
  accountSigner?: Signer;
}): Promise<{
  key: PublicKey;
  tx: TransactionEnvelope;
}> => {
  // Allocate memory for the account
  const rentExemptAccountBalance =
    await SPLToken.getMinBalanceRentForExemptAccount(provider.connection);
  return buildCreateTokenAccountTX({
    provider,
    mint,
    rentExemptAccountBalance,
    owner,
    payer,
    accountSigner,
  });
};

export const buildCreateTokenAccountTX = ({
  provider,
  mint,
  rentExemptAccountBalance,
  owner = provider.wallet.publicKey,
  payer = provider.wallet.publicKey,
  accountSigner = Keypair.generate(),
}: {
  provider: Provider;
  mint: PublicKey;
  /**
   * SOL needed for a rent exempt token account.
   */
  rentExemptAccountBalance: number;
  owner?: PublicKey;
  payer?: PublicKey;
  /**
   * The keypair of the account to be created.
   */
  accountSigner?: Signer;
}): {
  key: PublicKey;
  tx: TransactionEnvelope;
} => {
  const tokenAccount = accountSigner.publicKey;
  return {
    key: tokenAccount,
    tx: new TransactionEnvelope(
      provider,
      [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: accountSigner.publicKey,
          lamports: rentExemptAccountBalance,
          space: TokenAccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        }),
        SPLToken.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          mint,
          tokenAccount,
          owner
        ),
      ],
      [accountSigner]
    ),
  };
};
