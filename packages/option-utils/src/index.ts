/**
 * [[include:option-utils/README.md]]
 * @module
 */

/**
 * Optional type.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Applies a function to a list of null/undefined values, unwrapping the null/undefined value or passing it through.
 */
export const mapN = <T extends unknown[], U>(
  fn: (
    ...a: {
      [K in keyof T]: NonNullable<T[K]>;
    }
  ) => U,
  ...args: T
): U | null | undefined => {
  if (!args.every((arg) => arg !== undefined)) {
    return undefined;
  }
  if (!args.every((arg) => arg !== null)) {
    return null;
  }
  return fn(
    ...(args as {
      [K in keyof T]: NonNullable<T[K]>;
    }),
  );
};

/**
 * Applies a function to a null/undefined inner value if it is null or undefined,
 * otherwise returns null/undefined.
 *
 * For consistency reasons, we recommend just using {@link mapN} in all cases.
 *
 * @deprecated use {@link mapN}
 * @param obj
 * @param fn
 * @returns
 */
export const mapSome = <T, U>(
  obj: NonNullable<T> | null | undefined,
  fn: (obj: NonNullable<T>) => U,
): U | null | undefined => (exists(obj) ? fn(obj) : obj);

/**
 * Checks to see if the provided value is not null.
 *
 * Useful for preserving types in filtering out non-null values.
 *
 * @param value
 * @returns
 */
export const isNotNull = <TValue>(value: TValue | null): value is TValue => {
  return value !== null;
};

/**
 * Checks to see if the provided value is not undefined.
 *
 * @param value
 * @returns
 */
export const isNotUndefined = <TValue>(
  value: TValue | undefined,
): value is TValue => {
  return value !== undefined;
};

/**
 * Checks to see if the provided value is not null or undefined.
 *
 * @param value
 * @returns
 */
export const exists = <TValue>(
  value: TValue | null | undefined,
): value is TValue => {
  return value !== null && value !== undefined;
};
