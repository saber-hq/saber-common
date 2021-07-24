declare module "buffer-layout" {
  const blob: (amt: number, property: string) => Layout;
  const u8: (property: string) => Layout;
  const ns64: (property: string) => Layout;

  type Layout<T = unknown> = {
    span: number;
    decode: (data: Buffer) => T;
    encode: (data: T, out: Buffer) => number;
  };

  function struct<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layouts: Layout<any>[],
    property?: string
  ): Layout<T>;
}
