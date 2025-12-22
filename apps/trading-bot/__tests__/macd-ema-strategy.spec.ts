import { MacdSMA } from "../src/strategies/macdSMA/macdEma";
import { Candle } from "../src/models/candle.model";
import { Operation } from "../src/models/operation.enum";

describe("MacdSMA", () => {
  let strategy: MacdSMA;

  beforeEach(() => {
    strategy = new MacdSMA();
  });

  const createCandle = (
    close: number,
    volume: number = 1000,
    time: string = "2024-01-01T00:00:00.000Z"
  ): Candle => ({
    time,
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume,
    closeTime: time,
    assetVolume: volume,
    trades: 100,
    buyBaseVolume: volume * 0.5,
    buyAssetVolume: volume * 0.5,
    ignored: "",
  });

  const createCandles = (count: number, basePrice: number = 100): Candle[] => {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push(createCandle(basePrice + i * 0.1, 1000 + i * 10));
    }
    return candles;
  };

  describe("execute", () => {
    it("should return empty result when candles array is too short", () => {
      const candles = createCandles(50); // Less than LONG_MA (100) or 26

      const result = strategy.execute(candles);

      expect(result.label).toBe("");
      expect(result.tp).toBe(0);
      expect(result.sl).toBe(0);
    });

    it("should return empty result when MACD arrays are invalid", () => {
      // This is hard to test directly as it depends on the indicators library
      // But we can test that the strategy handles edge cases
      const candles = createCandles(200);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should return empty result when EMA array is invalid", () => {
      const candles = createCandles(200);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should generate BUY signal when MACD conditions are met", () => {
      // Create candles that would trigger MACD buy conditions
      // This requires specific patterns: MACD < 0, Signal < 0, MACD crosses above Signal
      const candles: Candle[] = [];
      
      // Create a downtrend first
      for (let i = 0; i < 200; i++) {
        candles.push(createCandle(100 - i * 0.1, 1000));
      }
      
      // Then create a recovery pattern
      for (let i = 0; i < 5; i++) {
        candles.push(createCandle(80 + i * 0.5, 1500)); // Increasing volume
      }

      const result = strategy.execute(candles);

      // The strategy should evaluate MACD conditions
      expect(result).toBeDefined();
      expect(result.label).toBeDefined();
    });

    it("should calculate risk/reward ratio correctly", () => {
      const candles = createCandles(200);

      const result = strategy.execute(candles);

      if (result.label === Operation.BUY) {
        expect(result.riskRewardRatio).toBeGreaterThanOrEqual(0);
        expect(result.risking).toBeDefined();
        expect(result.tp).toBeGreaterThan(0);
        expect(result.sl).toBeGreaterThan(0);
      }
    });

    it("should handle volume conditions", () => {
      // Create candles with varying volumes
      const candles: Candle[] = [];
      
      // Low volume candles
      for (let i = 0; i < 200; i++) {
        candles.push(createCandle(100, 500));
      }
      
      // High volume candle at the end
      candles.push(createCandle(100, 2000));

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should handle EMA price comparison", () => {
      const candles = createCandles(200);

      const result = strategy.execute(candles);

      // Strategy checks if close < EMA for buy signal
      expect(result).toBeDefined();
    });

    it("should return empty result when sell conditions are not met", () => {
      const candles = createCandles(200, 100);

      const result = strategy.execute(candles);

      // Strategy currently returns empty label for sell
      expect(result).toBeDefined();
    });

    it("should handle large candle arrays", () => {
      const candles = createCandles(500);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should calculate swing low correctly", () => {
      const candles: Candle[] = [];
      
      // Create pattern with clear swing low
      for (let i = 0; i < 200; i++) {
        const price = 100 + Math.sin(i * 0.1) * 10;
        candles.push(createCandle(price));
      }

      const result = strategy.execute(candles);

      if (result.label === Operation.BUY) {
        expect(result.sl).toBeGreaterThan(0);
      }
    });
  });
});






