import type { WalletProviderInfo, WalletTypeEnum } from ".";

export enum ErrorLevel {
  WARN = "warn",
  ERROR = "error",
}

/**
 * Error thrown by the use-solana library.
 */
export abstract class UseSolanaError extends Error {
  abstract readonly level: ErrorLevel;

  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

/**
 * Error derived from another error.
 */
export abstract class UseSolanaDerivedError extends UseSolanaError {
  constructor(
    name: string,
    readonly description: string,
    readonly originalError: unknown
  ) {
    super(
      name,
      `${description}: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    if (originalError instanceof Error) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Thrown when the automatic connection to a wallet errors.
 */
export class WalletAutomaticConnectionError extends UseSolanaDerivedError {
  level = ErrorLevel.WARN;

  constructor(originalError: unknown, readonly info: WalletProviderInfo) {
    super(
      "WalletAutomaticConnectionError",
      `Error attempting to automatically connect to wallet ${info.name}`,
      originalError
    );
  }
}

/**
 * Thrown when a wallet disconnection errors.
 */
export class WalletDisconnectError extends UseSolanaDerivedError {
  level = ErrorLevel.WARN;

  constructor(originalError: unknown, readonly info?: WalletProviderInfo) {
    super(
      "WalletDisconnectError",
      `Error disconnecting wallet ${info?.name ?? "(unknown)"}`,
      originalError
    );
  }
}

/**
 * Thrown when a wallet activation errors.
 */
export class WalletActivateError<
  WalletType extends WalletTypeEnum<WalletType>
> extends UseSolanaDerivedError {
  level = ErrorLevel.ERROR;

  constructor(
    originalError: unknown,
    readonly walletType: WalletType[keyof WalletType],
    readonly walletArgs?: Record<string, unknown>
  ) {
    super(
      "WalletActivateError",
      `Error activating wallet ${walletType as unknown as string}`,
      originalError
    );
  }
}
