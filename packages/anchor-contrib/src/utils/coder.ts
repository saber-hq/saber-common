import type { Idl } from "@project-serum/anchor";
import { Coder, EventParser } from "@project-serum/anchor";
import type { InstructionDisplay } from "@project-serum/anchor/dist/cjs/coder/instruction";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";

import type { ErrorMap } from "..";
import type { AccountParsers } from "../generateAccountParsers";
import { generateAccountParsersFromCoder } from "../generateAccountParsers";
import { generateErrorMap } from "../generateErrorMap";

/**
 * Formatted instruction with its name.
 */
export type InstructionParsed = InstructionDisplay & {
  name: string;
};

/**
 * Coder wrapper.
 */
export class SaberCoder<
  T extends {
    AccountMap: Record<string, never>;
    Events: Record<string, unknown>;
    IDL: Idl;
  }
> {
  /**
   * Underlying Coder.
   */
  readonly coder: Coder;
  /**
   * Parses events.
   */
  readonly eventParser: EventParser;
  /**
   * Parses accounts.
   */
  readonly accountParsers: AccountParsers<T["AccountMap"]>;
  /**
   * Mapping of error name to error details.
   */
  readonly errorMap: ErrorMap<T["IDL"]>;

  constructor(
    /**
     * Program address.
     */
    public readonly address: PublicKey,
    /**
     * Program IDL.
     */
    public readonly idl: T["IDL"]
  ) {
    this.coder = new Coder(idl);
    this.eventParser = new EventParser(address, this.coder);
    this.accountParsers = generateAccountParsersFromCoder(
      idl.accounts?.map((acc) => acc.name),
      this.coder.accounts
    );
    this.errorMap = generateErrorMap<T["IDL"]>(idl);
  }

  /**
   * Parses events in the program log.
   * @param logs
   * @returns
   */
  parseProgramLogEvents<
    E extends T["Events"][keyof T["Events"]] = T["Events"][keyof T["Events"]]
  >(logs?: string[]): readonly E[] {
    if (!logs) {
      return [];
    }
    const events: E[] = [];
    this.eventParser.parseLogs(logs ?? [], (event) =>
      events.push(event as unknown as E)
    );
    return events;
  }

  /**
   * Parses a {@link TransactionInstruction}.
   * @returns
   */
  parseInstruction(txInstruction: TransactionInstruction): InstructionParsed {
    const decoded = this.coder.instruction.decode(txInstruction.data);
    if (!decoded) {
      throw new Error("could not decode ix data");
    }
    const fmt = this.coder.instruction.format(decoded, txInstruction.keys);
    if (!fmt) {
      throw new Error("invalid instruction");
    }
    return { ...fmt, name: decoded.name };
  }
}
