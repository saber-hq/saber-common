import type { InstructionLogs } from "@saberhq/solana-contrib";
import { formatLogEntry, parseTransactionLogs } from "@saberhq/solana-contrib";
import type { SendTransactionError } from "@solana/web3.js";
import colors from "colors/safe";

/**
 * Formats instruction logs to be printed to the console.
 * @param logs
 */
export const formatInstructionLogs = (
  logs: readonly InstructionLogs[]
): string =>
  logs
    .map((log, i) => {
      return [
        [
          colors.bold(colors.blue("=> ")),
          colors.bold(colors.white(`Instruction #${i}: `)),
          log.programAddress
            ? colors.yellow(`Program ${log.programAddress}`)
            : "System",
        ].join(""),
        ...log.logs.map((entry) => {
          const entryStr = formatLogEntry(entry, true);
          switch (entry.type) {
            case "text":
              return colors.white(entryStr);
            case "cpi":
              return colors.cyan(entryStr);
            case "programError":
              return colors.red(entryStr);
            case "runtimeError":
              return colors.red(entryStr);
            case "system":
              return colors.white(entryStr);
            case "success":
              return colors.green(entryStr);
          }
        }),
      ].join("\n");
    })
    .join("\n");

export const printSendTransactionError = (err: SendTransactionError) => {
  try {
    const parsed = parseTransactionLogs(err.logs ?? null, err);
    console.error(formatInstructionLogs(parsed));
  } catch (e) {
    console.error(`Could not parse transaction error`, e);
    console.error("SendTransactionError", err);
  }
};
