import type { Network } from "@saberhq/solana-contrib";
import { PublicKey } from "@saberhq/solana-contrib";
import { NATIVE_MINT } from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import type { Token as UToken } from "@ubeswap/token-math";

import { deserializeMint } from "./layout.js";
import type { TokenInfo } from "./tokenList.js";

/**
 * Magic value representing the raw, underlying Solana native asset.
 */
export const RAW_SOL_MINT = new PublicKey(
  "RawSo11111111111111111111111111111111111112"
);

/**
 * Token information.
 */
export class Token implements UToken<Token> {
  /**
   * The network that the Token is on.
   */
  readonly network: Network;
  private _mintAccount: PublicKey | null = null;

  constructor(readonly info: TokenInfo) {
    this.network = chainIdToNetwork(info.chainId) ?? "localnet";
  }

  /**
   * The mint PublicKey of the token.
   *
   * Avoid using this value to print it to a string, as base58
   * strings are relatively slow to create since they require the use
   * of hash functions.
   */
  get mintAccount(): PublicKey {
    if (this._mintAccount) {
      return this._mintAccount;
    }

    this._mintAccount = new PublicKey(this.info.address);
    return this._mintAccount;
  }

  /**
   * If true, this token represents unwrapped, native, "raw" SOL.
   */
  get isRawSOL(): boolean {
    return this.mintAccount.equals(RAW_SOL_MINT);
  }

  /**
   * The Base58 string representation of the mint address.
   */
  get address(): string {
    return this.info.address;
  }

  /**
   * The chain ID of the token.
   */
  get chainId(): number {
    return this.info.chainId;
  }

  /**
   * Number of decimals of the token.
   */
  get decimals(): number {
    return this.info.decimals;
  }

  /**
   * The name of the token.
   */
  get name(): string {
    return this.info.name;
  }

  /**
   * The symbol of the token.
   */
  get symbol(): string {
    return this.info.symbol;
  }

  /**
   * The token's icon to render.
   */
  get icon(): string | undefined {
    return this.info.logoURI;
  }

  equals(other: Token): boolean {
    return tokensEqual(this, other);
  }

  toString(): string {
    return `Token[mint=${this.address}, decimals=${this.decimals}, network=${this.network}]`;
  }

  toJSON(): unknown {
    return this.info;
  }

  /**
   * Returns true if the given tag is present.
   * @param tag The tag to check.
   * @returns
   */
  hasTag(tag: string): boolean {
    return !!this.info.tags?.includes(tag);
  }

  /**
   * Loads a token from a Mint.
   * @param mint
   * @param opts
   * @returns
   */
  static fromMint = (
    mint: PublicKey | string,
    decimals: number,
    opts: Partial<Omit<TokenInfo, "address" | "decimals">> = {}
  ): Token =>
    new Token({
      ...opts,

      // required
      address: mint.toString(),
      decimals,

      // optional
      name: opts.name ?? `Token ${mint.toString().slice(0, 4)}`,
      symbol: opts.symbol ?? mint.toString().slice(0, 5),
      chainId: opts.chainId ?? ChainId.Localnet,
    });

  /**
   * Loads a token from a Connection.
   *
   * @param connection
   * @param mint
   * @param info
   */
  static load = async (
    connection: Connection,
    mint: PublicKey,
    info: Partial<Omit<TokenInfo, "address">> = {}
  ): Promise<Token | null> => {
    if (typeof info.decimals === "number") {
      return Token.fromMint(mint, info.decimals, info);
    }
    const mintAccountInfo = await connection.getAccountInfo(mint);
    if (!mintAccountInfo) {
      return null;
    }
    const mintInfo = deserializeMint(mintAccountInfo.data);
    return Token.fromMint(mint, mintInfo.decimals, info);
  };
}

/**
 * Checks if two tokens are equal.
 * @param a
 * @param b
 * @returns
 */
export const tokensEqual = (
  a: Token | undefined,
  b: Token | undefined
): boolean =>
  a !== undefined &&
  b !== undefined &&
  a.address === b.address &&
  a.network === b.network;

/**
 * Map of network to Token
 */
export type TokenMap = { [c in Network]: Token };

const rawSol = {
  address: RAW_SOL_MINT.toString(),
  name: "Solana",
  symbol: "SOL",
  decimals: 9,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
};

const wrappedSol = {
  address: NATIVE_MINT.toString(),
  name: "Wrapped SOL",
  symbol: "SOL",
  decimals: 9,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
};

/**
 * Creates a Token for all networks.
 */
export const makeTokenForAllNetworks = (
  token: Omit<TokenInfo, "chainId">
): TokenMap => ({
  "mainnet-beta": new Token({ ...token, chainId: ChainId.MainnetBeta }),
  devnet: new Token({ ...token, chainId: ChainId.Devnet }),
  testnet: new Token({ ...token, chainId: ChainId.Testnet }),
  localnet: new Token({ ...token, chainId: ChainId.Localnet }),
});

// comes from @solana/spl-token-registry, except we've added localnet
export enum ChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export const NETWORK_TO_CHAIN_ID = {
  "mainnet-beta": ChainId.MainnetBeta,
  devnet: ChainId.Devnet,
  testnet: ChainId.Testnet,
  localnet: 104,
};

export const CHAIN_ID_TO_NETWORK: { [E in ChainId]: Network } = Object.entries(
  NETWORK_TO_CHAIN_ID
).reduce((acc, [network, env]) => ({ ...acc, [env]: network }), {}) as {
  [E in ChainId]: Network;
};

/**
 * Gets the chain id associated with a network.
 * @param network
 * @returns
 */
export const networkToChainId = (network: Network): ChainId =>
  NETWORK_TO_CHAIN_ID[network];

/**
 * Gets the Network associated with a chain id.
 * @param network
 * @returns
 */
export const chainIdToNetwork = (env: ChainId): Network =>
  CHAIN_ID_TO_NETWORK[env];

/**
 * Raw Solana token.
 *
 * This is a magic value. This is not a real token.
 */
export const RAW_SOL: TokenMap = makeTokenForAllNetworks(rawSol);

/**
 * Wrapped Solana token.
 */
export const WRAPPED_SOL: TokenMap = makeTokenForAllNetworks(wrappedSol);
