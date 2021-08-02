import type { Network } from "@saberhq/solana-contrib";
import { NATIVE_MINT } from "@solana/spl-token";
import type { TokenInfo } from "@solana/spl-token-registry";
import { ENV } from "@solana/spl-token-registry";
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
    this.network =
      info.chainId === ENV.MainnetBeta
        ? "mainnet-beta"
        : info.chainId === ENV.Devnet
        ? "devnet"
        : info.chainId === ENV.Testnet
        ? "testnet"
        : "localnet";
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
  "mainnet-beta": new Token({ ...token, chainId: ENV.MainnetBeta }),
  devnet: new Token({ ...token, chainId: ENV.Devnet }),
  testnet: new Token({ ...token, chainId: ENV.Testnet }),
  localnet: new Token({ ...token, chainId: 99999 }),
});

/**
 * Solana native token.
 */
export const SOL: TokenMap = makeTokenForAllNetworks(sol);
