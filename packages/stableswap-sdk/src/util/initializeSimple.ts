import type { Provider } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type { TokenAmount } from "@saberhq/token-utils";
import {
  buildCreateTokenAccountTX,
  createATAInstruction,
  createInitMintTX,
  getATAAddressSync,
  SPLToken,
  TOKEN_PROGRAM_ID,
} from "@saberhq/token-utils";
import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

import type { InitializeSwapInstruction } from "../index";
import { findSwapAuthorityKeySync, SWAP_PROGRAM_ID } from "../index";
import type { SwapTokenInfo } from "../instructions/swap.js";
import type { InitializeNewStableSwapArgs } from "./initialize";
import { createInitializeStableSwapInstructionsRaw } from "./initialize";

const initializeSwapTokenInfoSync = ({
  provider,
  mint,
  authority,
  admin,
  rentExemptTokenAccountBalance,
}: {
  rentExemptTokenAccountBalance: number;
  provider: Provider;
  mint: PublicKey;
  authority: PublicKey;
  admin: PublicKey;
}): {
  info: SwapTokenInfo;
  instructions: TransactionEnvelope;
} => {
  // Create Swap Token Account
  const { key: tokenAccount, tx: createSwapTokenAccountInstructions } =
    buildCreateTokenAccountTX({
      provider,
      mint,
      owner: authority,
      payer: provider.wallet.publicKey,
      rentExemptAccountBalance: rentExemptTokenAccountBalance,
    });

  // Create Admin Fee Account
  const { key: adminFeeAccount, tx: createAdminFeeAccountInstructions } =
    buildCreateTokenAccountTX({
      provider,
      mint,
      owner: admin,
      payer: provider.wallet.publicKey,
      rentExemptAccountBalance: rentExemptTokenAccountBalance,
    });

  return {
    info: {
      mint,
      reserve: tokenAccount,
      adminFeeAccount: adminFeeAccount,
    },
    instructions: createSwapTokenAccountInstructions.combine(
      createAdminFeeAccountInstructions
    ),
  };
};

export type InitializeNewStableSwapSimpleArgs = Omit<
  InitializeNewStableSwapArgs,
  | "swapProgramID"
  | "tokenAMint"
  | "tokenBMint"
  | "useAssociatedAccountForInitialLP"
> & {
  reservesA: TokenAmount;
  reservesB: TokenAmount;
};

/**
 * Creates a set of instructions to create a new StableSwap instance.
 *
 * After calling this, you must sign this transaction with the accounts:
 * - payer -- Account that holds the SOL to seed the account.
 * - args.config.stableSwapAccount -- This account is used once then its key is no longer relevant
 * - all returned signers
 */
export const createInitializeStableSwapInstructionsSimple = async ({
  provider,
  adminAccount,
  ampFactor,
  fees,

  reservesA,
  reservesB,
  initialLiquidityProvider = adminAccount,
  swapAccountSigner = Keypair.generate(),
  poolTokenMintSigner = Keypair.generate(),
  seedPoolAccounts,
}: InitializeNewStableSwapSimpleArgs): Promise<{
  initializeArgs: InitializeSwapInstruction;
  /**
   * Lamports needed to be rent exempt.
   */
  balanceNeeded: number;

  instructions: {
    /**
     * Create accounts for the LP token
     */
    createLPTokenMint: TransactionEnvelope;
    /**
     * Create LP token account for the initial LP
     */
    createInitialLPTokenAccount: TransactionEnvelope;
    /**
     * Create accounts for swap token A
     */
    createSwapTokenAAccounts: TransactionEnvelope;
    /**
     * Create accounts for swap token B
     */
    createSwapTokenBAccounts: TransactionEnvelope;
    /**
     * Seed the accounts for the pool
     */
    seedPoolAccounts: TransactionEnvelope;
    /**
     * Initialize the swap
     */
    initializeSwap: TransactionEnvelope;
  };
}> => {
  const rentExemptTokenAccountBalance =
    await SPLToken.getMinBalanceRentForExemptAccount(provider.connection);
  const rentExemptMintBalance = await SPLToken.getMinBalanceRentForExemptMint(
    provider.connection
  );

  // Create swap account if not specified
  const swapAccount = swapAccountSigner.publicKey;

  // Create authority and nonce
  const [authority, nonce] = findSwapAuthorityKeySync(swapAccount);

  // Create LP token mint
  const { decimals } = reservesA.token;
  if (reservesA.token.decimals !== reservesB.token.decimals) {
    throw new Error("decimals mismatch");
  }
  const createLPTokenMint = createInitMintTX({
    provider,
    mintKP: poolTokenMintSigner,
    mintAuthority: authority,
    decimals,
    rentExemptMintBalance,
  });
  const poolTokenMint = poolTokenMintSigner.publicKey;

  // Create initial LP token account
  const initialLPAccount = getATAAddressSync({
    mint: poolTokenMint,
    owner: initialLiquidityProvider,
  });
  const createInitialLPTokenAccount = new TransactionEnvelope(provider, [
    createATAInstruction({
      address: getATAAddressSync({
        mint: poolTokenMint,
        owner: initialLiquidityProvider,
      }),
      mint: poolTokenMint,
      owner: initialLiquidityProvider,
      payer: provider.wallet.publicKey,
    }),
  ]);

  // Create Swap Token A account
  const { info: tokenA, instructions: createSwapTokenAAccounts } =
    initializeSwapTokenInfoSync({
      provider,
      mint: reservesA.token.mintAccount,
      authority,
      admin: adminAccount,
      rentExemptTokenAccountBalance,
    });

  // Create Swap Token B account
  const { info: tokenB, instructions: createSwapTokenBAccounts } =
    initializeSwapTokenInfoSync({
      provider,
      mint: reservesB.token.mintAccount,
      authority,
      admin: adminAccount,
      rentExemptTokenAccountBalance,
    });

  // Seed the swap's Token A and token B accounts with tokens
  // On testnet, this is usually a mint.
  // On mainnet, this is usually a token transfer.
  const seedPoolAccountsResult = seedPoolAccounts({
    tokenAAccount: tokenA.reserve,
    tokenBAccount: tokenB.reserve,
  });
  const seedPoolAccountsTX = new TransactionEnvelope(
    provider,
    [...seedPoolAccountsResult.instructions],
    [...seedPoolAccountsResult.signers]
  );

  const initializeSwapInstruction: InitializeSwapInstruction = {
    config: {
      swapAccount: swapAccount,
      authority,
      swapProgramID: SWAP_PROGRAM_ID,
      tokenProgramID: TOKEN_PROGRAM_ID,
    },

    adminAccount,
    tokenA,
    tokenB,

    poolTokenMint,
    destinationPoolTokenAccount: initialLPAccount,
    nonce,
    ampFactor,
    fees,
  };
  const {
    balanceNeeded: swapBalanceNeeded,
    instructions: initializeStableSwapInstructions,
  } = await createInitializeStableSwapInstructionsRaw({
    provider,
    initializeSwapInstruction,
  });
  const initializeSwap = new TransactionEnvelope(
    provider,
    [...initializeStableSwapInstructions],
    [swapAccountSigner]
  );

  const instructions = {
    createLPTokenMint,
    createInitialLPTokenAccount,
    createSwapTokenAAccounts,
    createSwapTokenBAccounts,
    seedPoolAccounts: seedPoolAccountsTX,
    initializeSwap,
  };

  return {
    initializeArgs: initializeSwapInstruction,
    balanceNeeded:
      rentExemptMintBalance +
      swapBalanceNeeded +
      rentExemptTokenAccountBalance * 2,
    instructions,
  };
};
