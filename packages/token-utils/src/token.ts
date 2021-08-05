import type { Network } from "@saberhq/solana-contrib";
import { NATIVE_MINT } from "@solana/spl-token";
import type { TokenInfo } from "@solana/spl-token-registry";
import { PublicKey } from "@solana/web3.js";
import type { Token as UToken } from "@ubeswap/token-math";

/**
 * Token information.
 */
export class Token implements UToken<Token> {
  public readonly mintAccount: PublicKey;
  public readonly network: Network;

  constructor(public readonly info: TokenInfo) {
    this.mintAccount = new PublicKey(info.address);
    this.network = chainIdToNetwork(info.chainId) ?? "localnet";
  }

  public get chainId(): number {
    return this.info.chainId;
  }

  public get decimals(): number {
    return this.info.decimals;
  }

  public get name(): string {
    return this.info.name;
  }

  public get symbol(): string {
    return this.info.symbol;
  }

  public get address(): string {
    return this.mintAccount.toString();
  }

  public get icon(): string | undefined {
    return this.info.logoURI;
  }

  equals(other: Token): boolean {
    return tokensEqual(this, other);
  }

  toString(): string {
    return `Token[mint=${this.mintAccount.toString()}, decimals=${
      this.decimals
    }, network=${this.network}]`;
  }

  toJSON(): unknown {
    return this.info;
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
      symbol: opts.symbol ?? "TOK",
      chainId: opts.chainId ?? ChainId.Localnet,
    });
}

export const tokensEqual = (
  a: Token | undefined,
  b: Token | undefined
): boolean =>
  a !== undefined &&
  b !== undefined &&
  a.mintAccount.equals(b.mintAccount) &&
  a.network === b.network;

/**
 * Map of network to Token
 */
export type TokenMap = { [c in Network]: Token };

const sol = {
  address: NATIVE_MINT.toString(),
  name: "Solana",
  symbol: "SOL",
  decimals: 9,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
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
 * Solana native token.
 */
export const SOL: TokenMap = makeTokenForAllNetworks(sol);
