import type { PublicKeyData, PublicKeyInitData } from "@solana/web3.js";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";

/**
 * Returns true if the given value is a {@link PublicKey}.
 * @param pk
 * @returns
 */
export const isPublicKey = (pk: unknown): pk is PublicKey => {
  if (pk instanceof PublicKey) {
    return true;
  }

  if (typeof pk !== "object" || Array.isArray(pk)) {
    return false;
  }

  try {
    new PublicKey(pk as PublicKeyData);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * PublicKey with caching of the string representation built-in.
 */
export class PublicKey extends SolanaPublicKey {
  constructor(value: PublicKeyInitData) {
    super(value);
  }

  private _base58: string | null = null;

  /**
   * Return the base-58 representation of the public key
   */
  override toBase58(): string {
    if (this._base58) {
      return this._base58;
    }
    return (this._base58 = super.toBase58());
  }

  /**
   * Return the base-58 representation of the public key
   */
  override toString(): string {
    return this.toBase58();
  }

  /**
   * Derive a public key from another key, a seed, and a program ID.
   * The program ID will also serve as the owner of the public key, giving
   * it permission to write data to the account.
   */
  static override async createWithSeed(
    fromPublicKey: SolanaPublicKey,
    seed: string,
    programId: SolanaPublicKey
  ): Promise<PublicKey> {
    return new PublicKey(
      await SolanaPublicKey.createWithSeed(fromPublicKey, seed, programId)
    );
  }
  /**
   * Derive a program address from seeds and a program ID.
   */
  static override async createProgramAddress(
    seeds: Array<Buffer | Uint8Array>,
    programId: PublicKey
  ): Promise<PublicKey> {
    return new PublicKey(
      await SolanaPublicKey.createProgramAddress(seeds, programId)
    );
  }
  /**
   * Find a valid program address
   *
   * Valid program addresses must fall off the ed25519 curve.  This function
   * iterates a nonce until it finds one that when combined with the seeds
   * results in a valid program address.
   */
  static override async findProgramAddress(
    seeds: Array<Buffer | Uint8Array>,
    programId: PublicKey
  ): Promise<[PublicKey, number]> {
    const [result, bump] = await SolanaPublicKey.findProgramAddress(
      seeds,
      programId
    );
    return [new PublicKey(result), bump];
  }

  /**
   * Check that a pubkey is on the ed25519 curve.
   */
  static override isOnCurve(pubkey: Uint8Array): boolean {
    return SolanaPublicKey.isOnCurve(pubkey);
  }
}
