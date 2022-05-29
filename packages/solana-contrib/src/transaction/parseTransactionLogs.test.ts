/// <reference types="jest" />

import { parseTransactionLogs } from "./parseTransactionLogs.js";

describe("parseTransactionLogs", () => {
  it("should parse the logs", () => {
    const logs = [
      `Program GAGEa8FYyJNgwULDNhCBEZzW6a8Zfhs6QRxTZ9XQy151 invoke [1]`,
      `Program log: Instruction: GaugeCommitVote`,
      `Program log: Custom program error: 0x66`,
      `Program GAGEa8FYyJNgwULDNhCBEZzW6a8Zfhs6QRxTZ9XQy151 consumed 2778 of 200000 compute units`,
      `Program GAGEa8FYyJNgwULDNhCBEZzW6a8Zfhs6QRxTZ9XQy151 failed: custom program error: 0x66`,
    ];

    const result = parseTransactionLogs(logs, null);

    expect(result).toEqual([
      {
        programAddress: "GAGEa8FYyJNgwULDNhCBEZzW6a8Zfhs6QRxTZ9XQy151",
        logs: [
          {
            type: "text",
            depth: 1,
            text: "Program log: Instruction: GaugeCommitVote",
          },
          {
            type: "text",
            depth: 1,
            text: "Program log: Custom program error: 0x66",
          },
          {
            type: "system",
            depth: 1,
            text: "Program GAGEa8FYyJNgwULDNhCBEZzW6a8Zfhs6QRxTZ9XQy151 consumed 2778 of 200000 compute units",
          },
          {
            type: "programError",
            depth: 1,
            text: "custom program error: 0x66",
          },
        ],
        failed: true,
      },
    ]);
  });
});
