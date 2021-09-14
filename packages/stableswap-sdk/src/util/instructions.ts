import type { Provider } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type {
  ConfirmOptions,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";

export interface TransactionInstructions {
  /**
   * Transaction instructions
   */
  instructions: readonly TransactionInstruction[];
  /**
   * Additional transaction signers if applicable
   */
  signers: readonly Signer[];
}

export interface MutableTransactionInstructions {
  /**
   * Transaction instructions
   */
  instructions: TransactionInstruction[];
  /**
   * Additional transaction signers if applicable
   */
  signers: Signer[];
}

export const createMutableTransactionInstructions =
  (): MutableTransactionInstructions => ({
    instructions: [],
    signers: [],
  });

/**
 * Executes a TransactionInstructions
 * @param title
 * @param param1
 * @param param2
 * @returns Transaction signature
 */
export const executeTxInstructions = async (
  title: string,
  { instructions, signers }: TransactionInstructions,
  {
    provider,
    payerSigner,
    options,
  }: {
    provider: Provider;
    payerSigner: Signer;
    options?: ConfirmOptions;
  }
): Promise<string> => {
  console.log(`Running tx ${title}`);
  const txEnv = new TransactionEnvelope(provider, instructions.slice(), [
    // payer of the tx
    payerSigner,
    // initialize the swap
    ...signers,
  ]);

  const sig = await txEnv.confirm(options);
  console.log(`${title} done at tx: ${sig.signature}`);
  return sig.signature;
};

export const mergeInstructions = (
  mut: MutableTransactionInstructions,
  inst: TransactionInstructions
): void => {
  mut.instructions.push(...inst.instructions);
  mut.signers.push(...inst.signers);
};
