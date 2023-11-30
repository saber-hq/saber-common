import type { Connection, SendOptions } from "@solana/web3.js";

import { sleep } from "../utils/index.js";
import type { TransactionRetryOptions } from "./index.js";
import { DEFAULT_RETRY_OPTIONS } from "./index.js";

/**
 * Sends and spams a raw transaction multiple times.
 * @param connection Connection to send the transaction to. We recommend using a public endpoint such as GenesysGo.
 * @param rawTx
 * @param opts
 */
export const sendAndSpamRawTx = async (
  connection: Connection,
  rawTx: Buffer,
  sendOptions: SendOptions,
  {
    retryTimes = DEFAULT_RETRY_OPTIONS.retryTimes,
    retryInterval = DEFAULT_RETRY_OPTIONS.retryInterval,
  }: TransactionRetryOptions = DEFAULT_RETRY_OPTIONS,
) => {
  const result = await connection.sendRawTransaction(rawTx, sendOptions);
  // if we could send the TX with preflight, let's spam it.
  void (async () => {
    // technique stolen from Mango.
    for (let i = 0; i < retryTimes; i++) {
      try {
        await sleep(retryInterval);
        await connection.sendRawTransaction(rawTx, {
          ...sendOptions,
          skipPreflight: true,
        });
      } catch (e) {
        console.warn(`[Broadcaster] sendAndSpamRawTx error`, e);
      }
    }
  })();
  return result;
};
