import type { SendTransactionError } from "@solana/web3.js";

import type { InstructionLogs } from "./parseTransactionLogs";
import { formatLogEntry, parseTransactionLogs } from "./parseTransactionLogs";

/**
 * Prints instruction logs to the browser console.
 * @param logs
 */
export const printToBrowserConsole = (
  logs: readonly InstructionLogs[]
): void => {
  const logsRaw: (readonly [string, string])[] = logs.flatMap(
    (log, i): (readonly [string, string])[] => {
      return [
        ...([
          ["%c=> ", "color: blue; font-weight: bold"],
          [`%cInstruction #${i}: `, "color: black; font-weight: bold"],
          log.programAddress
            ? [
                `%c${`Program ${log.programAddress}`}`,
                "color: yellow; font-weight: normal",
              ]
            : ["%cSystem", "color: black; font-weight: normal"],
        ] as (readonly [string, string])[]),
        ["\n", "color: black; font-weight: normal"] as readonly [
          string,
          string
        ],
        ...log.logs.map((entry): readonly [string, string] => {
          const entryStr = formatLogEntry(entry, true);
          const color = (() => {
            switch (entry.type) {
              case "text":
                return "black";
              case "cpi":
                return "cyan";
              case "programError":
                return "red";
              case "runtimeError":
                return "red";
              case "system":
                return "black";
              case "success":
                return "green";
            }
          })();
          return [`%c${entryStr}\n`, `color: ${color}`];
        }),
      ];
    }
  );
  const outStr = logsRaw.map(([text]) => text).join("");
  console.log(outStr, ...logsRaw.map(([, style]) => style));
};

export const printSendTransactionError = (err: SendTransactionError) => {
  try {
    const parsed = parseTransactionLogs(err.logs ?? null, err);
    printToBrowserConsole(parsed);
  } catch (e) {
    console.error(`Could not parse transaction error`, e);
    console.error("SendTransactionError", err);
  }
};
