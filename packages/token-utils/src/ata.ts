import { Provider } from "@saberhq/solana";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

type Result = {
  /**
   * ATA key
   */
  address: PublicKey;
  /**
   * Instruction to create the account if it doesn't exist.
   */
  instruction: TransactionInstruction | null;
};

type Results<K extends string> = {
  /**
   * All accounts
   */
  accounts: { [mint in K]: PublicKey };
  /**
   * Instructions to create accounts that don't exist.
   */
  instructions: readonly TransactionInstruction[];
  /**
   * Instructions, keyed.
   */
  createAccountInstructions: { [mint in K]: TransactionInstruction | null };
};

/**
 * Gets an associated token account address.
 */
export const getAssociatedTokenAddress = async ({
  mint,
  owner,
}: {
  mint: PublicKey;
  owner: PublicKey;
}): Promise<PublicKey> => {
  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
};

export const getOrCreateAssociatedTokenAccount = async ({
  provider,
  mint,
  user = provider.wallet.publicKey,
  payer = provider.wallet.publicKey,
}: {
  provider: Provider;
  mint: PublicKey;
  user?: PublicKey;
  payer?: PublicKey;
}): Promise<Result> => {
  const address = await getAssociatedTokenAddress({ mint, owner: user });
  if (await provider.connection.getAccountInfo(address)) {
    return { address, instruction: null };
  } else {
    return {
      address,
      instruction: Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        address,
        user,
        payer
      ),
    };
  }
};

export const getOrCreateAssociatedTokenAccounts = async <K extends string>({
  provider,
  mints,
  user = provider.wallet.publicKey,
}: {
  provider: Provider;
  mints: {
    [mint in K]: PublicKey;
  };
  user?: PublicKey;
}): Promise<Results<K>> => {
  const result = await Promise.all(
    Object.entries(mints).map(
      async ([name, mint]): Promise<{
        address: PublicKey;
        name: string;
        mintKey: PublicKey;
        instruction: TransactionInstruction | null;
      }> => {
        const mintKey = new PublicKey(mint as PublicKey);
        const address = await getAssociatedTokenAddress({
          mint: mintKey,
          owner: user,
        });
        if (await provider.connection.getAccountInfo(address)) {
          return { address, name, mintKey, instruction: null };
        } else {
          return {
            address,
            name,
            mintKey,
            instruction: Token.createAssociatedTokenAccountInstruction(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              mintKey,
              address,
              user,
              user
            ),
          };
        }
      }
    )
  );

  const deduped = result.reduce(
    (acc, { address, name, instruction }) => {
      return {
        accounts: {
          ...acc.accounts,
          [name]: address,
        },
        createAccountInstructions: {
          ...acc.createAccountInstructions,
          [name]: instruction,
        },
        instructions: instruction
          ? {
              ...acc.instructions,
              [address.toString()]: instruction,
            }
          : acc.instructions,
      };
    },
    { accounts: {}, instructions: {}, createAccountInstructions: {} } as {
      accounts: { [key in K]?: PublicKey };
      createAccountInstructions: { [key in K]?: TransactionInstruction | null };
      instructions: { [address: string]: TransactionInstruction };
    }
  );
  return {
    accounts: deduped.accounts,
    createAccountInstructions: deduped.createAccountInstructions,
    instructions: Object.values(deduped.instructions),
  } as Results<K>;
};
