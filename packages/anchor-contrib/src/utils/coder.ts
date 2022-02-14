import type { Accounts, Idl } from "@project-serum/anchor";
import {
  BorshAccountsCoder,
  BorshCoder,
  EventParser,
  utils,
} from "@project-serum/anchor";
import type { InstructionDisplay } from "@project-serum/anchor/dist/cjs/coder/borsh/instruction";
import type { IdlAccountItem } from "@project-serum/anchor/dist/cjs/idl";
import InstructionNamespaceFactory from "@project-serum/anchor/dist/cjs/program/namespace/instruction";
import type { Provider as SaberProvider } from "@saberhq/solana-contrib";
import type { GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { TransactionInstruction } from "@solana/web3.js";
import mapValues from "lodash.mapvalues";

import type { ErrorMap } from "../errors";
import { generateErrorMap } from "../errors";
import type { AccountParsers } from "../generateAccountParsers";
import { generateAccountParsersFromCoder } from "../generateAccountParsers";
import { newProgram } from "./programs";

/**
 * Formatted instruction with its name.
 */
export type InstructionParsed = InstructionDisplay & {
  name: string;
};

type CoderAnchorTypes = {
  AccountMap: Record<string, object>;
  Events: Record<string, unknown>;
  IDL: Idl;
  Instructions: Record<
    string,
    {
      accounts: IdlAccountItem[];
      args: unknown[];
      namedArgs: Record<string, unknown>;
    }
  >;
  Program: unknown;
};

/**
 * Coder wrapper.
 *
 * Allows interacting with a program without a provider.
 */
export class SuperCoder<T extends CoderAnchorTypes> {
  /**
   * Underlying Coder.
   */
  readonly coder: BorshCoder;
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
  /**
   * Mapping of hex discriminator to the account name.
   */
  readonly discriminators: {
    [hexDiscriminator: string]: string;
  };
  /**
   * Mapping of hex discriminator to the account name.
   */
  readonly discriminatorsByAccount: {
    [K in NonNullable<T["IDL"]["accounts"]>[number]["name"]]: Buffer;
  };

  /**
   * Constructor.
   * @param address
   * @param idl
   */
  constructor(
    /**
     * Program address.
     */
    readonly address: PublicKey,
    /**
     * Program IDL.
     */
    readonly idl: T["IDL"]
  ) {
    this.coder = new BorshCoder(idl);
    this.eventParser = new EventParser(address, this.coder);
    this.accountParsers = generateAccountParsersFromCoder(
      idl.accounts?.map((acc) => acc.name),
      this.coder.accounts
    );
    this.errorMap = generateErrorMap<T["IDL"]>(idl);

    const discriminatorList =
      idl.accounts?.map((account) => ({
        name: account.name,
        discriminator: BorshAccountsCoder.accountDiscriminator(account.name),
      })) ?? [];
    this.discriminators = discriminatorList.reduce(
      (acc, el) => ({ ...acc, [el.discriminator.toString("hex")]: el.name }),
      {}
    );
    this.discriminatorsByAccount = discriminatorList.reduce(
      (acc, el) => ({ ...acc, [el.name]: el.discriminator }),
      {} as { [K in NonNullable<T["IDL"]["accounts"]>[number]["name"]]: Buffer }
    );
  }

  /**
   * Creates a {@link GetProgramAccountsFilter} for the given account.
   */
  makeGPAFilter(
    account: NonNullable<T["IDL"]["accounts"]>[number]["name"],
    ...filters: GetProgramAccountsFilter[]
  ): GetProgramAccountsFilter[] {
    return [
      {
        memcmp: {
          offset: 0,
          bytes: utils.bytes.bs58.encode(this.discriminatorsByAccount[account]),
        },
      },
      ...filters,
    ];
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
   * Encodes a {@link TransactionInstruction}.
   * @returns
   */
  encodeIX<
    K extends keyof T["Instructions"] & string = keyof T["Instructions"] &
      string,
    I extends T["Instructions"][K] = T["Instructions"][K]
  >(
    name: K,
    args: I["namedArgs"],
    accounts: Accounts<I["accounts"][number]>
  ): TransactionInstruction {
    const idlIx = this.idl.instructions.find((ix) => ix.name === name);
    if (!idlIx) {
      throw new Error(`could not find ix: ${name}`);
    }
    const encoded = this.coder.instruction.encode(name, args);
    const keys = InstructionNamespaceFactory.accountsArray(
      accounts,
      idlIx.accounts,
      name
    );
    return new TransactionInstruction({
      programId: this.address,
      keys,
      data: encoded,
    });
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
    [K in keyof P]: CoderAnchorTypes;
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
