import type { IdlType } from "@project-serum/anchor/dist/esm/idl.js";

/**
 * Formats an IDL type as a string. This comes straight from the Anchor source.
 * @param idlType
 * @returns
 */
export const formatIdlType = (idlType: IdlType): string => {
  if (typeof idlType === "string") {
    return idlType;
  }

  if ("vec" in idlType) {
    return `Vec<${formatIdlType(idlType.vec)}>`;
  }
  if ("option" in idlType) {
    return `Option<${formatIdlType(idlType.option)}>`;
  }
  if ("defined" in idlType) {
    return idlType.defined;
  }
  if ("array" in idlType) {
    return `Array<${formatIdlType(idlType.array[0])}; ${idlType.array[1]}>`;
  }
  throw new Error(`Unknown IDL type: ${JSON.stringify(idlType)}`);
};
