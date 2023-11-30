import type { PublicKeyInitData } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

const pubkeyCache: Record<string, PublicKey> = {};

/**
 * PublicKey with a cached base58 value.
 */
export class CachedPublicKey extends PublicKey {
  private readonly _base58: string;

  constructor(value: PublicKeyInitData) {
    super(value);
    this._base58 = super.toBase58();
  }

  override equals(other: PublicKey): boolean {
    if (other instanceof CachedPublicKey) {
      return other._base58 === this._base58;
    }
    return super.equals(other);
  }

  override toString() {
    return this._base58;
  }

  override toBase58(): string {
    return this._base58;
  }
}

const getOrCreatePublicKey = (pk: string): PublicKey => {
  const cached = pubkeyCache[pk];
  if (!cached) {
    return (pubkeyCache[pk] = new CachedPublicKey(pk));
  }
  return cached;
};

/**
 * Gets or parses a PublicKey.
 * @param pk
 * @returns
 */
export const getPublicKey = (
  pk: string | PublicKey | PublicKeyInitData,
): PublicKey => {
  if (typeof pk === "string") {
    return getOrCreatePublicKey(pk);
  } else if (pk instanceof PublicKey) {
    return getOrCreatePublicKey(pk.toString());
  } else {
    return getOrCreatePublicKey(new PublicKey(pk).toString());
  }
};

const gpaCache: Record<string, PublicKey> = {};

/**
 * Concatenates seeds to generate a unique number array.
 * @param seeds
 * @returns
 */
const concatSeeds = (seeds: Array<Buffer | Uint8Array>): Uint8Array => {
  return Uint8Array.from(
    seeds.reduce((acc: number[], seed) => [...acc, ...seed], []),
  );
};

/**
 * Gets a cached program address for the given seeds.
 * @param seeds
 * @param programId
 * @returns
 */
export const getProgramAddress = (
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey,
) => {
  const normalizedSeeds = concatSeeds(seeds);
  const cacheKey = `${normalizedSeeds.toString()}_${programId.toString()}`;
  const cached = gpaCache[cacheKey];
  if (cached) {
    return cached;
  }
  const [key] = PublicKey.findProgramAddressSync(seeds, programId);
  return (gpaCache[cacheKey] = getPublicKey(key));
};
