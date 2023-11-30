import type {
  AnchorProvider as AnchorProviderImpl,
  Provider as IAnchorProvider,
} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import type {
  Provider as SaberProvider,
  ReadonlyProvider as ReadonlySaberProvider,
  Wallet,
} from "@saberhq/solana-contrib";
import {
  SolanaProvider,
  SolanaReadonlyProvider,
} from "@saberhq/solana-contrib";
import type { ConfirmOptions, Connection } from "@solana/web3.js";

/**
 * Interface of an AnchorProvider.
 */
export interface AnchorProvider extends IAnchorProvider {
  wallet: Wallet;
  opts: ConfirmOptions;
}

const anchorModule = anchor;

/**
 * Class used to create new {@link AnchorProvider}s.
 */
export const AnchorProviderClass: AnchorProviderCtor &
  typeof AnchorProviderImpl =
  "AnchorProvider" in anchorModule
    ? anchorModule.AnchorProvider
    : (
        anchorModule as unknown as {
          Provider: AnchorProviderCtor & typeof AnchorProviderImpl;
        }
      ).Provider;

/**
 * Constructor for an Anchor provider.
 */
export type AnchorProviderCtor = new (
  connection: Connection,
  wallet: Wallet,
  opts: ConfirmOptions,
) => AnchorProvider;

/**
 * Create a new Anchor provider.
 *
 * @param connection
 * @param wallet
 * @param opts
 * @returns
 */
export const buildAnchorProvider = (
  connection: Connection,
  wallet: Wallet,
  opts: ConfirmOptions,
) => {
  return new AnchorProviderClass(connection, wallet, opts);
};

/**
 * Creates a readonly Saber Provider from an Anchor provider.
 * @param anchorProvider The Anchor provider.
 * @returns
 */
export const makeReadonlySaberProvider = (
  anchorProvider: IAnchorProvider,
): ReadonlySaberProvider => {
  return new SolanaReadonlyProvider(anchorProvider.connection);
};

/**
 * Creates a Saber Provider from an Anchor provider.
 * @param anchorProvider The Anchor provider.
 * @returns
 */
export const makeSaberProvider = (
  anchorProvider: AnchorProvider,
): SaberProvider => {
  return SolanaProvider.init({
    connection: anchorProvider.connection,
    wallet: anchorProvider.wallet,
    opts: anchorProvider.opts,
  });
};

/**
 * Creates an Anchor Provider from a Saber provider.
 * @param saberProvider
 * @returns
 */
export const makeAnchorProvider = (
  saberProvider: ReadonlySaberProvider,
): AnchorProvider => {
  return buildAnchorProvider(
    saberProvider.connection,
    saberProvider.wallet,
    saberProvider.opts,
  );
};
