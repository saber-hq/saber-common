/**
 * These types all come from the @solana/spl-token-registry package.
 *
 * We re-export them here so we do not have to have a hard dependency on
 * that package, which is massive.
 */

/**
 * Chain ID.
 */
export enum ENV {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

/**
 * A token list.
 */
export interface SPLTokenList {
  readonly name: string;
  readonly logoURI: string;
  readonly tags: { [tag: string]: TagDetails };
  readonly timestamp: string;
  readonly tokens: SPLTokenInfo[];
}

/**
 * Tag details.
 */
export interface TagDetails {
  readonly name: string;
  readonly description: string;
}

/**
 * TokenExtensions.
 */
export interface SPLTokenExtensions {
  readonly website?: string;
  readonly bridgeContract?: string;
  readonly assetContract?: string;
  readonly address?: string;
  readonly explorer?: string;
  readonly twitter?: string;
  readonly github?: string;
  readonly medium?: string;
  readonly tgann?: string;
  readonly tggroup?: string;
  readonly discord?: string;
  readonly serumV3Usdt?: string;
  readonly serumV3Usdc?: string;
  readonly coingeckoId?: string;
  readonly imageUrl?: string;
  readonly description?: string;
}

/**
 * TokenInfo.
 */
export interface SPLTokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: SPLTokenExtensions;
}
