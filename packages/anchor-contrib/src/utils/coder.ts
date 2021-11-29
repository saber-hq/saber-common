import type { Idl } from "@project-serum/anchor";
import { Coder, EventParser } from "@project-serum/anchor";
import type { InstructionDisplay } from "@project-serum/anchor/dist/cjs/coder/instruction";
import type { Provider as SaberProvider } from "@saberhq/solana-contrib";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import mapValues from "lodash.mapvalues";

import type { AccountParsers } from "../generateAccountParsers";
import { generateAccountParsersFromCoder } from "../generateAccountParsers";
import type { ErrorMap } from "../generateErrorMap";
import { generateErrorMap } from "../generateErrorMap";
import { newProgram } from "./programs";

/**
 * Formatted instruction with its name.
 */
export type InstructionParsed = InstructionDisplay & {
  name: string;
};

/**
 * Coder wrapper.
 *
 * Allows interacting with a program without a provider.
 */
export class SuperCoder<
  T extends {
    AccountMap: Record<string, object>;
    Events: Record<string, unknown>;
    IDL: Idl;
    Program: unknown;
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

  /**
   * Gets a {@link Program} from a provider.
   * @param provider
   * @returns
   */
  getProgram(provider: SaberProvider): T["Program"] {
    return newProgram(this.idl, this.address, provider);
  }
}

/**
 * Builds a map of coders from their IDLs and addresses.
 *
 * @param provider
 * @param programs
 * @returns
 */
export const buildCoderMap = <
  P extends {
    [K in keyof P]: {
      AccountMap: Record<string, object>;
      Events: Record<string, unknown>;
      IDL: Idl;
      Program: unknown;
    };
  }
>(
  idls: {
    [K in keyof P]: Idl;
  },
  addresses: {
    [K in keyof P]: PublicKey;
  }
): {
  [K in keyof P]: SuperCoder<P[K]>;
} => {
  return mapValues(
    idls,
    <K extends keyof P>(idl: P[K]["IDL"], k: K) =>
      new SuperCoder<P[K]>(addresses[k], idl)
  ) as unknown as {
    [K in keyof P]: SuperCoder<P[K]>;
  };
};
