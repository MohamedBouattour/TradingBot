import { describe, expect, it } from "@jest/globals";
import { convertStringToNumbers } from "../../src/core/utils";

describe("convertStringToNumbers", () => {
  it("should convert array of string arrays to Candle objects", () => {
    const input = [
      [
        "1619827200000",
        "2.30000000",
        "2.34000000",
        "2.29000000",
        "2.33000000",
        "1000.00000000",
        "1619827499999",
        "2300.00000000",
        "150",
        "500.00000000",
        "1150.00000000",
        "0",
      ],
    ];

    const expected = [
      {
        time: "2021-05-01T00:00:00.000Z",
        open: 2.3,
        high: 2.34,
        low: 2.29,
        close: 2.33,
        volume: 1000,
        closeTime: 1619827499999,
        assetVolume: 2300,
        trades: 150,
        buyBaseVolume: 500,
        buyAssetVolume: 1150,
        ignored: "0",
      },
    ];

    const result = convertStringToNumbers(input);
    expect(result).toEqual(expected);
  });

  it("should handle empty array", () => {
    const result = convertStringToNumbers([]);
    expect(result).toEqual([]);
  });
});
