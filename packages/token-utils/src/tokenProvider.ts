import type {
  AugmentedProvider,
  Provider,
  PublicKey,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import { SolanaAugmentedProvider } from "@saberhq/solana-contrib";
import type { MintInfo } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Signer } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

import { getATAAddress, getATAAddresses } from "./ata.js";
import { createMintInstructions, DEFAULT_TOKEN_DECIMALS } from "./common.js";
import type { TokenAmount, TokenInfo } from "./index.js";
import { SPLToken } from "./index.js";
import { getOrCreateATA, getOrCreateATAs } from "./instructions/ata.js";
import type { TokenAccountData } from "./layout.js";
import { deserializeAccount, deserializeMint } from "./layout.js";
import { Token } from "./token.js";

/**
 * Augmented provider with token utilities.
 */
export class TokenAugmentedProvider
  extends SolanaAugmentedProvider
  implements AugmentedProvider
{
  constructor(provider: Provider) {
    super(provider);
  }

  /**
   * Creates a transaction to create a {@link Token}.
   */
  async createTokenTX({
    mintKP = Keypair.generate(),
    authority = this.walletKey,
    decimals = DEFAULT_TOKEN_DECIMALS,
  }: {
    mintKP?: Signer;
    authority?: PublicKey;
    decimals?: number;
  } = {}): Promise<{ token: Token; tx: TransactionEnvelope }> {
    const instructions = await createMintInstructions(
      this.provider,
      authority,
      mintKP.publicKey,
      decimals
    );
    return {
      token: Token.fromMint(mintKP.publicKey, decimals),
      tx: this.newTX(instructions, [mintKP]),
    };
  }

  /**
   * Transfers tokens from the provider's ATA to a `TokenAccount`.
   */
  async transferTo({
    amount,
    source,
    destination,
  }: {
    amount: TokenAmount;
    source?: PublicKey;
    destination: PublicKey;
  }): Promise<TransactionEnvelope> {
    const txEnv = this.newTX();
    if (!source) {
      const sourceATA = await this.getOrCreateATA({
        mint: amount.token.mintAccount,
      });
      txEnv.append(sourceATA.instruction);
      source = sourceATA.address;
    }
    txEnv.append(
      SPLToken.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        source,
        destination,
        this.walletKey,
        [],
        amount.toU64()
      )
    );
    return txEnv;
  }

  /**
   * Transfers tokens to a recipient's ATA.
   */
  async transfer({
    amount,
    source,
    to,
  }: {
    amount: TokenAmount;
    source?: PublicKey;
    /**
     * Recipient of the tokens. This should not be a token account.
     */
    to: PublicKey;
  }): Promise<TransactionEnvelope> {
    const toATA = await this.getOrCreateATA({
      mint: amount.token.mintAccount,
      owner: to,
    });
    const txEnv = await this.transferTo({
      amount,
      source,
      destination: toATA.address,
    });
    txEnv.prepend(toATA.instruction);
    return txEnv;
  }

  /**
   * Creates a {@link Token}.
   */
  async createToken({
    mintKP = Keypair.generate(),
    authority = this.walletKey,
    decimals = DEFAULT_TOKEN_DECIMALS,
  }: {
    mintKP?: Signer;
    authority?: PublicKey;
    decimals?: number;
  } = {}): Promise<Token> {
    const { token, tx } = await this.createTokenTX({
      mintKP,
      authority,
      decimals,
    });
    await tx.confirm();
    return token;
  }

  /**
   * Gets an ATA address.
   * @returns
   */
  async getATAAddress({
    mint,
    owner = this.walletKey,
  }: {
    mint: PublicKey;
    owner?: PublicKey;
  }) {
    return await getATAAddress({ mint, owner });
  }

  /**
   * Gets an ATA address.
   * @returns
   */
  async getATAAddresses<K extends string>({
    mints,
    owner = this.walletKey,
  }: {
    mints: {
      [mint in K]: PublicKey;
    };
    owner?: PublicKey;
  }) {
    return await getATAAddresses({ mints, owner });
  }

  /**
   * Gets an ATA, creating it if it doesn't exist.
   * @returns
   */
  async getOrCreateATA({
    mint,
    owner = this.walletKey,
  }: {
    mint: PublicKey;
    owner?: PublicKey;
  }) {
    return await getOrCreateATA({ provider: this.provider, mint, owner });
  }

  /**
   * Get or create multiple ATAs.
   * @returns
   */
  async getOrCreateATAs<K extends string>({
    mints,
    owner = this.walletKey,
  }: {
    mints: {
      [mint in K]: PublicKey;
    };
    owner?: PublicKey;
  }) {
    return await getOrCreateATAs({ provider: this.provider, mints, owner });
  }

  /**
   * Loads a token from the blockchain, only if the decimals are not provided.
   * @param mint
   * @returns
   */
  async loadToken(
    mint: PublicKey,
    info: Partial<Omit<TokenInfo, "address">> = {}
  ): Promise<Token | null> {
    return Token.load(this.provider.connection, mint, info);
  }

  /**
   * Mints tokens to a token account.
   * @param mint
   * @returns
   */
  mintToAccount({
    amount,
    destination,
  }: {
    amount: TokenAmount;
    destination: PublicKey;
  }): TransactionEnvelope {
    return this.newTX([
      SPLToken.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        amount.token.mintAccount,
        destination,
        this.walletKey,
        [],
        amount.toU64()
      ),
    ]);
  }

  /**
   * Mints tokens to the ATA of the `to` account.
   * @param amount The amount of tokens to mint.
   * @param to The owner of the ATA that may be created.
   * @returns
   */
  async mintTo({
    amount,
    to = this.walletKey,
  }: {
    amount: TokenAmount;
    to?: PublicKey;
  }): Promise<TransactionEnvelope> {
    const toATA = await this.getOrCreateATA({
      mint: amount.token.mintAccount,
      owner: to,
    });
    const txEnv = this.mintToAccount({
      amount,
      destination: toATA.address,
    });
    txEnv.prepend(toATA.instruction);
    return txEnv;
  }

  /**
   * Fetches a mint.
   * @param address
   * @returns
   */
  async fetchMint(address: PublicKey): Promise<MintInfo | null> {
    const accountInfo = await this.getAccountInfo(address);
    if (accountInfo === null) {
      return null;
    }
    return deserializeMint(accountInfo.accountInfo.data);
  }

  /**
   * Fetches a token account.
   * @param address
   * @returns
   */
  async fetchTokenAccount(
    address: PublicKey
  ): Promise<TokenAccountData | null> {
    const tokenAccountInfo = await this.getAccountInfo(address);
    if (tokenAccountInfo === null) {
      return null;
    }
    return deserializeAccount(tokenAccountInfo.accountInfo.data);
  }

  /**
   * Fetches an ATA.
   * @param mint
   * @param owner
   * @returns
   */
  async fetchATA(
    mint: PublicKey,
    owner: PublicKey = this.walletKey
  ): Promise<TokenAccountData | null> {
    const taAddress = await getATAAddress({ mint, owner });
    return await this.fetchTokenAccount(taAddress);
  }
}
