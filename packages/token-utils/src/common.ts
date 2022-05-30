/**
 * This file is a port of serum-common, which was built for web3.js 0.x.
 */

import type { Provider } from "@saberhq/solana-contrib";
import type { MintInfo } from "@solana/spl-token";
import { Token as SPLToken, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type BN from "bn.js";

import {
  deserializeAccount,
  deserializeMint,
  MintLayout,
  Token,
} from "./index.js";
import type { TokenAccountData } from "./layout.js";

export * as token from "./token.js";
export type { ProgramAccount } from "@saberhq/solana-contrib";

/**
 * Default number of decimals of a token.
 */
export const DEFAULT_TOKEN_DECIMALS = 6;

export const SPL_SHARED_MEMORY_ID = new PublicKey(
  "shmem4EWT2sPdVGvTZCzXXRAURL9G5vpPxNwSeKhHUL"
);

export async function createMint(
  provider: Provider,
  authority?: PublicKey,
  decimals?: number
): Promise<PublicKey> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  const mint = Keypair.generate();
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey,
    decimals
  );

  const tx = new Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint]);

  return mint.publicKey;
}

/**
 * Creates a Token.
 *
 * @param provider
 * @param authority The mint authority.
 * @param decimals Number of decimals.
 * @returns
 */
export async function createToken(
  provider: Provider,
  authority?: PublicKey,
  decimals = 6
): Promise<Token> {
  return Token.fromMint(
    await createMint(provider, authority, decimals),
    decimals
  );
}

export async function createMintInstructions(
  provider: Provider,
  authority: PublicKey,
  mint: PublicKey,
  decimals = 6
): Promise<TransactionInstruction[]> {
  const instructions = [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: MintLayout.span,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      programId: TOKEN_PROGRAM_ID,
    }),
    SPLToken.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      decimals,
      authority,
      null
    ),
  ];
  return instructions;
}

export async function createMintAndVault(
  provider: Provider,
  amount: BN,
  owner?: PublicKey,
  decimals?: number
): Promise<[PublicKey, PublicKey]> {
  if (owner === undefined) {
    owner = provider.wallet.publicKey;
  }
  const mint = Keypair.generate();
  const vault = Keypair.generate();
  const tx = new Transaction();
  tx.add(
    ...(await createMintInstructions(
      provider,
      provider.wallet.publicKey,
      mint.publicKey,
      decimals
    )),
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: vault.publicKey,
      space: 165,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        165
      ),
      programId: TOKEN_PROGRAM_ID,
    }),
    SPLToken.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      vault.publicKey,
      owner
    ),
    SPLToken.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      vault.publicKey,
      provider.wallet.publicKey,
      [],
      amount
    )
  );
  await provider.send(tx, [mint, vault]);
  return [mint.publicKey, vault.publicKey];
}

export async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  lamports?: number
): Promise<TransactionInstruction[]> {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    SPLToken.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      newAccountPubkey,
      owner
    ),
  ];
}

export async function createAccountRentExempt(
  provider: Provider,
  programId: PublicKey,
  size: number
): Promise<Keypair> {
  const acc = Keypair.generate();
  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: acc.publicKey,
      space: size,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        size
      ),
      programId,
    })
  );
  await provider.send(tx, [acc]);
  return acc;
}

export async function getMintInfo(
  provider: Provider,
  addr: PublicKey
): Promise<MintInfo> {
  const depositorAccInfo = await provider.getAccountInfo(addr);
  if (depositorAccInfo === null) {
    throw new Error("Failed to find token mint account");
  }
  return deserializeMint(depositorAccInfo.accountInfo.data);
}

export async function getTokenAccount(
  provider: Provider,
  addr: PublicKey
): Promise<TokenAccountData> {
  const depositorAccInfo = await provider.getAccountInfo(addr);
  if (depositorAccInfo === null) {
    throw new Error("Failed to find token account");
  }
  return deserializeAccount(depositorAccInfo.accountInfo.data);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
