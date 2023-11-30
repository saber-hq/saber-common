import type { InstructionLogs } from "@saberhq/solana-contrib";
import { formatLogEntry, parseTransactionLogs } from "@saberhq/solana-contrib";
import type { SendTransactionError } from "@solana/web3.js";
import { default as colors } from "colors/safe.js";

/**
 * Formats instruction logs to be printed to the console.
 * @param logs
 */
export const formatInstructionLogsForConsole = (
  logs: readonly InstructionLogs[],
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
    console.log(formatInstructionLogsForConsole(parsed));
  } catch (e) {
    console.warn(
      colors.yellow("Could not print logs due to error. Printing raw logs"),
      e,
    );
    console.log(err.logs?.join("\n"));
  }
};
