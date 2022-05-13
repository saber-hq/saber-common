import type { PublicKey } from "@saberhq/solana-contrib";
import { getProgramAddress } from "@saberhq/solana-contrib";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Gets an associated token account address.
 *
 * @deprecated use {@link getATAAddressSync}
 */
export const getATAAddress = async ({
  mint,
  owner,
}: {
  mint: PublicKey;
  owner: PublicKey;
}): Promise<PublicKey> => {
  return Promise.resolve(getATAAddressSync({ mint, owner }));
};

/**
 * Gets an associated token account address synchronously.
 */
export const getATAAddressSync = ({
  mint,
  owner,
}: {
  mint: PublicKey;
  owner: PublicKey;
}): PublicKey => {
  return getProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
};

export type ATAMap<K extends string> = {
  [mint in K]: {
    address: PublicKey;
    mint: PublicKey;
  };
};

/**
 * Gets multiple associated token account addresses.
 *
 * @deprecated use {@link getATAAddressesSync}
 */
export const getATAAddresses = <K extends string>({
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
  return Promise.resolve(getATAAddressesSync({ mints, owner }));
};

/**
 * Gets multiple associated token account addresses.
 */
export const getATAAddressesSync = <K extends string>({
  mints,
  owner,
}: {
  mints: {
    [mint in K]: PublicKey;
  };
  owner: PublicKey;
}): {
  /**
   * All ATAs
   */
  accounts: ATAMap<K>;
} => {
  const result = Object.entries(mints).map(
    (
      args
    ): {
      address: PublicKey;
      name: string;
      mint: PublicKey;
    } => {
      const [name, mint] = args as [K, PublicKey];
      const result = getATAAddressSync({
        mint,
        owner: owner,
      });
      return {
        address: result,
        name,
        mint,
      };
    }
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
