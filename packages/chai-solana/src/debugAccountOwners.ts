import { AnchorProviderClass } from "@saberhq/anchor-contrib";
import { printAccountOwners } from "@saberhq/solana-contrib";

/**
 * A wrapper around `printAccountOwners` that loads the connection from env().
 * This is useful for people who are too lazy to pass in a connection.
 *
 * --------
 *
 * A useful tool for debugging account structs. It gives a quick glance at
 * addresses and owners. It also converts bignums into JS numbers.
 *
 * Types converted:
 * - **big numbers**: converted to native numbers
 * - **addresses**: format in base58, and prints the owner in parentheses if the account exists
 * - **plain objects**: recursively converts
 *
 * HINT: This function is mainly useful for the browser. If you are writing
 * Rust integration tests, use debugAccountOwners from chai-solana instead, so
 * that you don't have to pass in connection.
 *
 * Usage:
 * ```
 * await debugAccountOwners(depositAccounts); // using await is recommended, due to race conditions
 * void debugAccountOwners(depositAccounts); // don't do this in tests, there may be race conditions
 * ```
 *
 * Example output:
 * ```
 * tests/awesomeTest.spec.ts:583:29 {
 *   payer: 'CEGhKVeyXUrihUnNU9EchSuu6pMHEsB8MiKgvhJqYgd1 (11111111111111111111111111111111)',
 *   foo: '61tMNVhG66QZQ4UEAoHytqaUN4G1xpk1zsS5YU7Y2Qui (135QzSyjKTKaZ7ebhLpvNA2KUahEjykMjbqz3JV1V4k9)',
 *   bar: '9oPMxXVSm5msAecxi4zJpKDwbHS9c6Yos1ru739rVExc (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)',
 *   tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA (BPFLoader2111111111111111111111111111111111)'
 * }
 * ```
 *
 * WARNING: This may break silently if web3 changes its api. This is only
 * intended for debugging purposes only.
 */
export function debugAccountOwners(plainObj: object): Promise<void> {
  return printAccountOwners(AnchorProviderClass.env().connection, plainObj);
}
