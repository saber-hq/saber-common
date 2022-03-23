import * as BufferLayout from "@solana/buffer-layout";

export const RequestUnitsLayout = BufferLayout.struct<{
  instruction: number;
  units: number;
  additionalFee: number;
}>([
  BufferLayout.u8("instruction"),
  BufferLayout.u32("units"),
  BufferLayout.u32("additionalFee"),
]);

export const RequestHeapFrameLayout = BufferLayout.struct<{
  instruction: number;
  bytes: number;
}>([BufferLayout.u8("instruction"), BufferLayout.u32("bytes")]);
