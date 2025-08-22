import { convertStringToNumbers, delay, getMACDHistogramColorLabels } from "../src/core/utils";

describe("utils", () => {
  describe("convertStringToNumbers", () => {
    it("should convert string arrays to Candle objects", () => {
      const stringCandles = [
        [
          "1678886400000",
          "20000",
          "20500",
          "19800",
          "20300",
          "10",
          "1678972799999",
          "100",
          "50",
          "5",
          "50",
          "ignored",
        ],
      ];
      const candles = convertStringToNumbers(stringCandles);

      expect(candles.length).toBe(1);
      expect(candles[0].time).toBe(new Date(1678886400000).toISOString());
      expect(candles[0].open).toBe(20000);
      expect(candles[0].high).toBe(20500);
      expect(candles[0].low).toBe(19800);
      expect(candles[0].close).toBe(20300);
      expect(candles[0].volume).toBe(10);
      expect(candles[0].closeTime).toBe(new Date(1678972799999).toISOString());
      expect(candles[0].assetVolume).toBe(100);
      expect(candles[0].trades).toBe(50);
      expect(candles[0].buyBaseVolume).toBe(5);
      expect(candles[0].buyAssetVolume).toBe(50);
      expect(candles[0].ignored).toBe("ignored");
    });
  });

  describe("delay", () => {
    it("should delay for the specified amount of time", async () => {
      const startTime = Date.now();
      await delay(100);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe("getMACDHistogramColorLabels", () => {
    it("should return correct labels for positive histogram values", () => {
      const hist = [0, 1, 2, 1, 0.5];
      const labels = getMACDHistogramColorLabels(hist);
      expect(labels).toEqual(["dark-green", "dark-green", "light-green", "light-green"]);
    });

    it("should return correct labels for negative histogram values", () => {
      const hist = [0, -1, -2, -1, -0.5];
      const labels = getMACDHistogramColorLabels(hist);
      expect(labels).toEqual(["dark-red", "dark-red", "light-red", "light-red"]);
    });

    it("should return correct labels for mixed histogram values", () => {
      const hist = [0, 1, -1, 2, -2];
      const labels = getMACDHistogramColorLabels(hist);
      expect(labels).toEqual(["dark-green", "dark-red", "dark-green", "dark-red"]);
    });

    it("should handle empty histogram array", () => {
      const hist: number[] = [];
      const labels = getMACDHistogramColorLabels(hist);
      expect(labels).toEqual([]);
    });

    it("should handle single element histogram array", () => {
      const hist = [10];
      const labels = getMACDHistogramColorLabels(hist);
      expect(labels).toEqual([]);
    });
  });
});

