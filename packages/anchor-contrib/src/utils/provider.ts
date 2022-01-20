import { Provider as AnchorProvider } from "@project-serum/anchor";
import type {
  Provider as SaberProvider,
  ReadonlyProvider as ReadonlySaberProvider,
} from "@saberhq/solana-contrib";
import { SolanaProvider } from "@saberhq/solana-contrib";

/**
 * Creates a readonly Saber Provider from an Anchor provider.
 * @param anchorProvider The Anchor provider.
 * @returns
 */
export const makeReadonlySaberProvider = (
  anchorProvider: AnchorProvider
): ReadonlySaberProvider => {
  return SolanaProvider.load({
    connection: anchorProvider.connection,
    wallet: anchorProvider.wallet,
    opts: anchorProvider.opts,
  });
};

/**
 * Creates a Saber Provider from an Anchor provider.
 * @param anchorProvider The Anchor provider.
 * @returns
 */
export const makeSaberProvider = (
  anchorProvider: AnchorProvider
): SaberProvider => {
  return SolanaProvider.load({
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
  saberProvider: SaberProvider | ReadonlySaberProvider
): AnchorProvider => {
  return new AnchorProvider(
    saberProvider.connection,
    saberProvider.wallet,
    saberProvider.opts
  );
};
