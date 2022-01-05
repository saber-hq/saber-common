const noop = () => {
  // noop
};

/**
 * Hide the console.error because @solana/web3.js often emits noisy errors as a
 * side effect. There are use cases of estimateTransactionSize where we
 * frequently build transactions that are likely too big.
 */
export const suppressConsoleErrorAsync = async <T>(
  fn: () => Promise<T>
): Promise<T> => {
  const oldConsoleError = console.error;
  console.error = noop;
  try {
    const result = await fn();
    console.error = oldConsoleError;
    return result;
  } catch (e) {
    console.error = oldConsoleError;
    throw e;
  }
};
