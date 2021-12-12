import { PublicKey } from "@saberhq/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Gets an associated token account address.
 */
export const getATAAddress = async ({
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

export type ATAMap<K extends string> = {
  [mint in K]: {
    address: PublicKey;
    mint: PublicKey;
  };
};

/**
 * Gets multiple associated token account addresses.
 */
export const getATAAddresses = async <K extends string>({
  mints,
  owner,
}: {
  mints: {
    [mint in K]: PublicKey;
  };
  owner: PublicKey;
}): Promise<{
  /**
   * All ATAs
   */
  accounts: ATAMap<K>;
}> => {
  const result = await Promise.all(
    Object.entries(mints).map(
      async (
        args
      ): Promise<{
        address: PublicKey;
        name: string;
        mint: PublicKey;
      }> => {
        const [name, mint] = args as [K, PublicKey];
        const result = await getATAAddress({
          mint,
          owner: owner,
        });
        return {
          address: result,
          name,
          mint,
        };
      }
    )
  );
  const deduped = result.reduce(
    (acc, { address, name, mint }) => {
      return {
        accounts: {
          ...acc.accounts,
          [name]: { address, mint },
        },
      };
    },
    { accounts: {} } as {
      accounts: ATAMap<K>;
    }
  );
  return {
    accounts: deduped.accounts,
  };
};
