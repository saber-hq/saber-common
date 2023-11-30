// import { Provider as AnchorProvider } from "@project-serum/anchor";
import type { AccountInfo, Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

/**
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
 * await printAccountOwners(connection, depositAccounts);
 * // using void is recommend in dapps to avoid slowing down the user experience
 * void printAccountOwners(connection, depositAccounts);
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
 * intended for debugging purposes only. But it should be safe to use in production.
 */
export async function printAccountOwners(
  connection: Connection,
  plainObj: object,
): Promise<void> {
  try {
    if (typeof plainObj !== "object") {
      throw new Error("printAccountOwners only works on objects");
    } else {
      let relativePath: string | undefined;
      const callStack = new Error().stack?.split("\n");
      if (callStack) {
        let expectIndex = callStack.findIndex((l) =>
          l.includes(`at ${printAccountOwners.name}`),
        );

        // debugAccountOwners in chai-solana wraps printAccountOwners
        // We need to get the caller of debugAccountOwners instead
        const debugAccountOwnersIndex = callStack.findIndex((l) =>
          l.includes(`at debugAccountOwners`),
        );
        if (debugAccountOwnersIndex > expectIndex) {
          expectIndex = debugAccountOwnersIndex;
        }

        // Only log the line number in Node.js
        if (
          expectIndex > 0 &&
          typeof process !== "undefined" &&
          process.versions !== undefined &&
          process.versions.node !== undefined
        ) {
          const maybeProcess: MaybeProcess = process;
          const targetLine = callStack[expectIndex + 1];
          if (targetLine) {
            const cwd = maybeProcess.cwd?.() || "/";
            // get the part of targetLine after cwd
            const targetLineAfterCwd = targetLine.substring(
              targetLine.indexOf(cwd) + cwd.length,
            );
            if (targetLineAfterCwd.length > 0) {
              relativePath = targetLineAfterCwd.substring(1).replace(/\)$/, "");
            }
          }
        }
      }

      if (!connection) {
        return;
      }

      if (relativePath) {
        console.log(
          relativePath,
          await _transformAccountOwners(plainObj, connection),
        );
      } else {
        console.log(await _transformAccountOwners(plainObj, connection));
      }
    }
  } catch (e) {
    console.error("Error in printAccountOwners:", e);
  }
}

/**
 * Just in case some browser compilation doesn't polyfill a fake process
 */
type MaybeProcess = {
  cwd?: () => string;
};

/**
 * This is a patched version of web3's getMultipleAccountsInfo.
 *
 * When it reaches an account that doesn't exist, it will just continue instead
 * of giving up.
 *
 * WARNING: This may break silently if web3 changes its api. This is only
 * intended for debugging purposes only.
 */
async function gracefulGetMultipleAccountsInfo(
  connection: Connection,
  publicKeys: PublicKey[],
): ReturnType<Connection["getMultipleAccountsInfo"]> {
  try {
    // To be honest, the web3 internals aren't going to change that much. And if
    // they do, it'll be rare.
    const unknownConection = connection as ConnectionWithGetMultipleAccounts;
    const rpcRequest = unknownConection._rpcRequest;
    if (typeof rpcRequest !== "function") {
      console.error("_rpcRequest is not a function. Maybe web3 changed?");
      return [];
    }

    const unsafeRes = await rpcRequest("getMultipleAccounts", [
      publicKeys.map((key) => key.toBase58()),
      { encoding: "base64", commitment: "confirmed" },
    ]);

    const value = unsafeRes?.result?.value;
    if (value) {
      return value;
    }
    return [];
  } catch (e) {
    console.error("Error in gracefulGetMultipleAccountsInfo:", e);
    return [];
  }
}

type PublicKeyBase58 = string;
type GetMultipleAccountsArgs = [
  PublicKeyBase58[],
  { encoding: "base64"; commitment: "confirmed" },
];

interface ConnectionWithGetMultipleAccounts {
  _rpcRequest?: (
    method: "getMultipleAccounts",
    args: GetMultipleAccountsArgs,
  ) => Promise<
    | undefined
    | {
        result?: {
          value: (AccountInfo<Buffer> | null)[];
        };
      }
  >;
}

/**
 * Lots of complexity in this function. But using getMultipleAccountsInfo is
 * very important. Even locally, it reduces the time from 300ms to 40ms. On a
 * remote RPC server, it would probably save much more time.
 */
const _transformAccountOwners = async (
  plainObjWithAddressesAndBignums: object,
  connection: Connection,
): Promise<unknown> => {
  /* eslint-disable */
  const result: any = {};
  if (
    !plainObjWithAddressesAndBignums ||
    typeof plainObjWithAddressesAndBignums !== "object"
  ) {
    return plainObjWithAddressesAndBignums;
  }

  const base58ToResultKey: Record<string, string> = {};
  const base58ToLookup: PublicKey[] = [];

  const asyncKeys: string[] = [];
  const asyncPromises: Promise<unknown>[] = [];
  for (const [key, value] of Object.entries(plainObjWithAddressesAndBignums)) {
    if (value && value.toBase58 && typeof value.toBase58 === "function") {
      const base58: string = value.toBase58();
      base58ToResultKey[base58] = key;
      const pubKey = new PublicKey(base58);
      if (!base58ToLookup.includes(pubKey)) {
        base58ToLookup.push(pubKey);
      }
    } else if (
      value &&
      value.toNumber &&
      typeof value.toNumber === "function"
    ) {
      result[key] = value.toNumber();
    } else if (isPlainObject(value) && value) {
      asyncKeys.push(key);
      asyncPromises.push(_transformAccountOwners(value, connection));
    } else {
      result[key] = value;
    }
  }

  if (Object.keys(base58ToResultKey).length > 0) {
    const accountInfos = await gracefulGetMultipleAccountsInfo(
      connection,
      base58ToLookup
    );

    for (const [base58, resultKey] of Object.entries(base58ToResultKey)) {
      const lookupIndex = base58ToLookup.findIndex(
        (p) => p.toBase58() === base58
      );
      if (lookupIndex >= 0) {
        const accountInfo = accountInfos[lookupIndex];
        const owner = accountInfo?.owner;
        if (owner) {
          result[resultKey] = `${base58} (${owner})`;

          // Uncomment to verify that this implementation is correct
          // const accountInfo =
          //   await connection.getAccountInfo(
          //     new PublicKey(base58)
          //   );
          // const correctOwner = accountInfo?.owner; // we know for sure this works
          // if (!correctOwner) {
          //   throw new Error("Unable to load correct owner");
          // }
          // if (!new PublicKey(owner).equals(correctOwner)) {
          //   console.log("OWNER MISMATCH", base58, owner, accountInfo?.owner);
          //   throw new Error("OWNER MISMATCH");
          // }
        } else {
          result[resultKey] = `${base58}`;
        }
      } else {
        result[resultKey] = `${base58}`;
      }
    }
  }

  const asyncValues = await Promise.all(asyncPromises);

  for (let i = 0; i < asyncKeys.length; i++) {
    result[asyncKeys[i]!!] = asyncValues[i];
  }
  return result;
};

function isPlainObject(obj: any) {
  /* eslint-disable */
  return (
    typeof obj === "object" && // separate from primitives
    obj !== null && // is obvious
    obj.constructor === Object && // separate instances (Array, DOM, ...)
    Object.prototype.toString.call(obj) === "[object Object]"
  ); // separate build-in like Math
}
