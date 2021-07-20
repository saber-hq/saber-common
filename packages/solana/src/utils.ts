import { PublicKey, PublicKeyData } from "@solana/web3.js";

/**
 * Returns true if the given value is a {@link PublicKey}.
 * @param pk
 * @returns
 */
export const isPublicKey = (pk: unknown): pk is PublicKey => {
  if (pk instanceof PublicKey) {
    return true;
  }

  try {
    new PublicKey(pk as PublicKeyData);
    return true;
  } catch (e) {
    return false;
  }
};
