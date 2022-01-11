const noop = () => {
  // noop
};

/**
 * Hide the console.error because @solana/web3.js often emits noisy errors as a
 * side effect.
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

/**
 * Hide the console.error because @solana/web3.js often emits noisy errors as a
 * side effect.
 */
export const suppressConsoleError = <T>(fn: () => T): T => {
  const oldConsoleError = console.error;
  console.error = noop;
  try {
    const result = fn();
    console.error = oldConsoleError;
    return result;
  } catch (e) {
    console.error = oldConsoleError;
    throw e;
  }
};
