import type { Provider } from "@saberhq/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { getATAAddressSync } from "../ata.js";

type GetOrCreateATAResult = {
  /**
   * ATA key
   */
  address: PublicKey;
  /**
   * Instruction to create the account if it doesn't exist.
   */
  instruction: TransactionInstruction | null;
};

type GetOrCreateATAsResult<K extends string> = {
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
 * Gets an associated token account, returning a create instruction if it doesn't exist.
 * @param param0
 * @returns
 */
export const getOrCreateATA = async ({
  provider,
  mint,
  owner = provider.wallet.publicKey,
  payer = provider.wallet.publicKey,
}: {
  provider: Provider;
  mint: PublicKey;
  owner?: PublicKey;
  payer?: PublicKey;
}): Promise<GetOrCreateATAResult> => {
  const address = getATAAddressSync({ mint, owner });
  if (await provider.getAccountInfo(address)) {
    return { address, instruction: null };
  } else {
    return {
      address,
      instruction: createATAInstruction({
        mint,
        address,
        owner,
        payer,
      }),
    };
  }
};

/**
 * Gets ATAs and creates them if they don't exist.
 * @param param0
 * @returns
 */
export const getOrCreateATAs = async <K extends string>({
  provider,
  mints,
  owner = provider.wallet.publicKey,
}: {
  provider: Provider;
  mints: {
    [mint in K]: PublicKey;
  };
  owner?: PublicKey;
}): Promise<GetOrCreateATAsResult<K>> => {
  const result = await Promise.all(
    Object.entries(mints).map(
      async ([name, mint]): Promise<{
        address: PublicKey;
        name: string;
        mintKey: PublicKey;
        instruction: TransactionInstruction | null;
      }> => {
        const mintKey = new PublicKey(mint as PublicKey);
        const result = await getOrCreateATA({
          provider,
          mint: mintKey,
          owner: owner,
          payer: provider.wallet.publicKey,
        });
        return {
          address: result.address,
          instruction: result.instruction,
          name,
          mintKey,
        };
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
  } as GetOrCreateATAsResult<K>;
};

/**
 * Instruction for creating an ATA.
 * @returns
 */
export const createATAInstruction = ({
  address,
  mint,
  owner,
  payer,
}: {
  address: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  payer: PublicKey;
}): TransactionInstruction =>
  Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    address,
    owner,
    payer
  );
