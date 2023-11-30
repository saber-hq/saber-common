/**
 * Adapted from explorer.solana.com code written by @jstarry.
 */

import type { TransactionError } from "@solana/web3.js";
import { default as invariant } from "tiny-invariant";

import { getTransactionInstructionError } from "./programErr.js";

/**
 * A log entry.
 */
export type InstructionLogEntry = {
  /**
   * Stack depth.
   */
  depth: number;
} & (
  | {
      type: "text";
      text: string;
    }
  | {
      type: "system";
      text: string;
    }
  | {
      type: "cpi";
      programAddress: string | null;
    }
  | {
      type: "success";
    }
  | {
      type: "programError";
      text: string;
    }
  | {
      type: "runtimeError";
      text: string;
    }
);

/**
 * Logs of an individual instruction.
 */
export interface InstructionLogs {
  /**
   * The program invoked, if it exists in the logs.
   */
  programAddress?: string;
  /**
   * Logs of the instruction.
   */
  logs: InstructionLogEntry[];
  /**
   * Whether the instruction failed.
   */
  failed: boolean;
}

/**
 * Stack-aware program log parser.
 * @param logs
 * @param error
 * @returns
 */
export const parseTransactionLogs = (
  logs: string[] | null,
  error: TransactionError | null,
): InstructionLogs[] => {
  let depth = 0;
  const prettyLogs: InstructionLogs[] = [];

  let prettyError;
  if (!logs) {
    if (error) throw new Error(JSON.stringify(error));
    throw new Error("No logs detected");
  } else if (error) {
    prettyError = getTransactionInstructionError(error);
  }

  logs.forEach((log) => {
    if (log.startsWith("Program log:")) {
      prettyLogs[prettyLogs.length - 1]?.logs.push({
        type: "text",
        depth,
        text: log,
      });
    } else {
      const regex = /Program (\w*) invoke \[(\d)\]/g;
      const matches = [...log.matchAll(regex)];

      if (matches.length > 0) {
        const programAddress = matches[0]?.[1];
        invariant(programAddress, "program address");

        if (depth === 0) {
          prettyLogs.push({
            programAddress,
            logs: [],
            failed: false,
          });
        } else {
          prettyLogs[prettyLogs.length - 1]?.logs.push({
            type: "cpi",
            depth,
            programAddress: programAddress ?? null,
          });
        }

        depth++;
      } else if (log.includes("success")) {
        prettyLogs[prettyLogs.length - 1]?.logs.push({
          type: "success",
          depth,
        });
        depth--;
      } else if (log.includes("failed")) {
        const instructionLog = prettyLogs[prettyLogs.length - 1];
        if (instructionLog && !instructionLog.failed) {
          instructionLog.failed = true;
          instructionLog.logs.push({
            type: "programError",
            depth,
            text: log.slice(log.indexOf(": ") + 2),
          });
        }
        depth--;
      } else {
        if (depth === 0) {
          prettyLogs.push({
            logs: [],
            failed: false,
          });
          depth++;
        }
        // system transactions don't start with "Program log:"
        prettyLogs[prettyLogs.length - 1]?.logs.push({
          type: "system",
          depth,
          text: log,
        });
      }
    }
  });

  // If the instruction's simulation returned an error without any logs then add an empty log entry for Runtime error
  // For example BpfUpgradableLoader fails without returning any logs for Upgrade instruction with buffer that doesn't exist
  if (prettyError && prettyLogs.length === 0) {
    prettyLogs.push({
      logs: [],
      failed: true,
    });
  }

  if (prettyError && prettyError.index === prettyLogs.length - 1) {
    const failedIx = prettyLogs[prettyError.index];
    if (failedIx) {
      failedIx.failed = true;
      failedIx.logs.push({
        type: "runtimeError",
        depth: 1,
        text: prettyError.message,
      });
    }
  }

  return prettyLogs;
};

const buildPrefix = (depth: number) => {
  const prefix = new Array(depth - 1).fill("\u00A0\u00A0").join("");
  return prefix + "> ";
};

const formatLogEntryString = (entry: InstructionLogEntry) => {
  switch (entry.type) {
    case "success":
      return `Program returned success`;
    case "programError":
      return `Program returned error: ${entry.text}`;
    case "runtimeError":
      return `Runtime error: ${entry.text}`;
    case "system":
      return entry.text;
    case "text":
      return entry.text;
    case "cpi":
      return `Invoking Unknown ${
        entry.programAddress ? `(${entry.programAddress}) ` : ""
      }Program`;
  }
};

/**
 * Formats a log entry to be printed out.
 * @param entry
 * @param prefix
 * @returns
 */
export const formatLogEntry = (
  entry: InstructionLogEntry,
  prefix = false,
): string => {
  const prefixString = prefix ? buildPrefix(entry.depth) : "";
  return `${prefixString}${formatLogEntryString(entry)}`;
};

/**
 * Formats instruction logs.
 * @param logs
 */
export const formatInstructionLogs = (
  logs: readonly InstructionLogs[],
): string =>
  logs
    .map((log, i) => {
      return [
        `=> Instruction #${i}: ${
          log.programAddress ? `Program ${log.programAddress}` : "System"
        }`,
        ...log.logs.map((entry) => formatLogEntry(entry, true)),
      ].join("\n");
    })
    .join("\n");
