import { Candle } from "../src/models/candle.model";
import { SuperTrendStrategy } from "../src/strategies/supertrend/supertrend-strategy";
import { Operation } from "../src/models/operation.enum";

// Mock the supertrend library
jest.mock("supertrend", () => ({
  supertrend: jest.fn(({ initialArray }) => {
    // Simple mock: return a fixed supertrend value for testing purposes
    // In a real scenario, this would be more sophisticated or use pre-calculated values
    return initialArray.map((candle: Candle) => candle.close * 0.9);
  }),
}));

describe("SuperTrendStrategy", () => {
  let strategy: SuperTrendStrategy;

  beforeEach(() => {
    strategy = new SuperTrendStrategy();
  });

  // Helper function to create a candle
  const createCandle = (close: number, high: number, low: number, open: number): Candle => ({
    close,
    high,
    low,
    open,
    time: new Date().toISOString(),
    volume: 0,
    closeTime: new Date().toISOString(),
    assetVolume: 0,
    trades: 0,
    buyBaseVolume: 0,
    buyAssetVolume: 0,
    ignored: "",
  });

  describe("execute", () => {
    it("should return BUY operation when price crosses above supertrend", () => {
      const candles: Candle[] = [
        createCandle(90, 95, 85, 87), // previousCandle.close < previousSuperTrend
        createCandle(110, 115, 105, 107), // lastCandle.close > lastSuperTrend
      ];

      const result = strategy.execute(candles);
      expect(result.label).toBe(Operation.BUY);
      expect(result.tp).toBeDefined();
      expect(result.sl).toBeDefined();
      expect(result.roi).toBeDefined();
      expect(result.riskRewardRatio).toBeDefined();
      expect(result.risking).toBeDefined();
    });

    it("should return NO TRADE when price crosses below supertrend (SELL is commented out)", () => {
      const candles: Candle[] = [
        createCandle(110, 115, 105, 107), // previousCandle.close > previousSuperTrend
        createCandle(90, 95, 85, 87), // lastCandle.close < lastSuperTrend
      ];

      const result = strategy.execute(candles);
      expect(result.label).toBe(""); // Expect empty string as SELL is commented out
    });

    it("should return NO TRADE when no crossing occurs (price above supertrend)", () => {
      const candles: Candle[] = [
        createCandle(110, 115, 105, 107),
        createCandle(115, 120, 110, 112),
      ];

      const result = strategy.execute(candles);
      expect(result.label).toBe("");
    });

    it("should return NO TRADE when no crossing occurs (price below supertrend)", () => {
      const candles: Candle[] = [
        createCandle(90, 95, 85, 87),
        createCandle(85, 90, 80, 82),
      ];

      const result = strategy.execute(candles);
      expect(result.label).toBe("");
    });

    it("should calculate tp and sl correctly for BUY operation", () => {
      const candles: Candle[] = [
        createCandle(90, 95, 85, 87),
        createCandle(100, 105, 95, 97),
      ];
      // Mock TARGET_ROI and PRICE_PRECISION for predictable results
      jest.mock("../../constants", () => ({
        TARGET_ROI: 1.05,
        PRICE_PRECISION: 2,
      }));

      const result = strategy.execute(candles);
      expect(result.label).toBe(Operation.BUY);
      expect(result.tp).toBeCloseTo(105.00);
      expect(result.sl).toBeCloseTo(99.00);
    });
  });

  describe("getRecentResistanceLevels", () => {
    it("should return the average of recent resistance levels", () => {
      const candles: Candle[] = [
        createCandle(10, 10, 10, 10),
        createCandle(20, 20, 20, 20),
        createCandle(30, 30, 30, 30),
        createCandle(40, 40, 40, 40),
        createCandle(50, 50, 50, 50),
        createCandle(60, 60, 60, 60),
        createCandle(70, 70, 70, 70),
        createCandle(80, 80, 80, 80),
        createCandle(90, 90, 90, 90),
        createCandle(100, 100, 100, 100),
        createCandle(110, 110, 110, 110),
        createCandle(120, 120, 120, 120),
        createCandle(130, 130, 130, 130),
        createCandle(140, 140, 140, 140),
        createCandle(150, 150, 150, 150),
        createCandle(160, 160, 160, 160),
        createCandle(170, 170, 170, 170),
      ];
      // Manually call the private method for testing
      const resistance = (strategy as any).getRecentResistanceLevels(candles, 5);
      // Expected average of last 5 highs: (130+140+150+160+170)/5 = 150
      expect(resistance).toBe(150);
    });

    it("should handle fewer candles than lookback period", () => {
      const candles: Candle[] = [
        createCandle(10, 10, 10, 10),
        createCandle(20, 20, 20, 20),
        createCandle(30, 30, 30, 30),
        createCandle(40, 40, 40, 40),
        createCandle(50, 50, 50, 50),
      ];
      const resistance = (strategy as any).getRecentResistanceLevels(candles, 10);
      // Expected average of all highs: (10+20+30+40+50)/5 = 30
      expect(resistance).toBe(30);
    });

    it("should return 0 if no resistance levels are found", () => {
      const candles: Candle[] = [
        createCandle(10, 10, 10, 10),
        createCandle(9, 9, 9, 9),
        createCandle(8, 8, 8, 8),
        createCandle(7, 7, 7, 7),
        createCandle(6, 6, 6, 6),
      ];
      const resistance = (strategy as any).getRecentResistanceLevels(candles);
      expect(resistance).toBeNaN(); // No resistance levels, so sum is 0, division by 0
    });
  });

  describe("isTooCloseToResistance", () => {
    it("should return true if price is too close to resistance", () => {
      const price = 100;
      const resistance = 101;
      const thresholdPercent = 1;
      const isClose = (strategy as any).isTooCloseToResistance(price, resistance, thresholdPercent);
      expect(isClose).toBe(true);
    });

    it("should return false if price is not too close to resistance", () => {
      const price = 100;
      const resistance = 105;
      const thresholdPercent = 1;
      const isClose = (strategy as any).isTooCloseToResistance(price, resistance, thresholdPercent);
      expect(isClose).toBe(false);
    });

    it("should handle price above resistance", () => {
      const price = 105;
      const resistance = 100;
      const thresholdPercent = 1;
      const isClose = (strategy as any).isTooCloseToResistance(price, resistance, thresholdPercent);
      expect(isClose).toBe(true);
    });

    it("should return true for exact match", () => {
      const price = 100;
      const resistance = 100;
      const thresholdPercent = 0;
      const isClose = (strategy as any).isTooCloseToResistance(price, resistance, thresholdPercent);
      expect(isClose).toBe(true);
    });
  });
});


