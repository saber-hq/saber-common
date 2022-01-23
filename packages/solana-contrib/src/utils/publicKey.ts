import type { PublicKeyData } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export { PublicKey } from "@solana/web3.js";

/**
 * Returns true if the given value is a {@link PublicKey}.
 * @param pk
 * @returns
 */
export const isPublicKey = (pk: unknown): pk is PublicKey => {
  if (!pk) {
    return false;
  }

  if (pk instanceof PublicKey) {
    return true;
  }

  if (
    typeof pk !== "object" ||
    Array.isArray(pk) ||
    ("constructor" in pk && BN.isBN(pk))
  ) {
    return false;
  }

  try {
    new PublicKey(pk as PublicKeyData);
    return true;
  } catch (e) {
    return false;
  }
};
