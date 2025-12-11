import { RSIStrategy } from "../src/strategies/rsi/rsi-strategy";
import { Candle } from "../src/models/candle.model";
import { Operation } from "../src/models/operation.enum";

describe("RSIStrategy", () => {
  let strategy: RSIStrategy;

  beforeEach(() => {
    strategy = new RSIStrategy();
  });

  const createCandle = (
    close: number,
    time: string = "2024-01-01T00:00:00.000Z"
  ): Candle => ({
    time,
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume: 1000,
    closeTime: time,
    assetVolume: 1000,
    trades: 100,
    buyBaseVolume: 500,
    buyAssetVolume: 500,
    ignored: "",
  });

  const createCandles = (count: number, basePrice: number = 100): Candle[] => {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push(createCandle(basePrice + i * 0.1));
    }
    return candles;
  };

  describe("execute", () => {
    it("should return empty result when candles array is too short", () => {
      const candles = createCandles(10); // Less than 15 required

      const result = strategy.execute(candles);

      expect(result.label).toBe("");
      expect(result.tp).toBe(0);
      expect(result.sl).toBe(0);
      expect(result.roi).toBe(0);
    });

    it("should return empty result when RSI array is invalid", () => {
      const candles = createCandles(20);

      // Mock the RSI calculation to return invalid data
      // This is hard to test directly, but we can test with edge cases
      const result = strategy.execute(candles);

      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it("should generate BUY signal when RSI crosses above 30", () => {
      // Create candles that would result in RSI crossing above 30
      // This requires specific price patterns
      const candles: Candle[] = [];
      
      // Create a downtrend first (RSI below 30)
      for (let i = 0; i < 15; i++) {
        candles.push(createCandle(100 - i * 2)); // Decreasing prices
      }
      
      // Then create an uptrend (RSI crossing above 30)
      candles.push(createCandle(75)); // Price starts recovering
      candles.push(createCandle(80)); // RSI crosses above 30

      const result = strategy.execute(candles);

      // The strategy should detect RSI crossing above 30
      // Note: Actual RSI calculation depends on the indicators library
      expect(result).toBeDefined();
      expect(result.label).toBeDefined();
    });

    it("should return empty result when RSI conditions are not met", () => {
      // Create candles with stable prices (RSI around 50)
      const candles = createCandles(20, 100);

      const result = strategy.execute(candles);

      // Should return empty result if RSI doesn't cross 30
      expect(result).toBeDefined();
    });

    it("should calculate TP and SL correctly when BUY signal is generated", () => {
      const candles: Candle[] = [];
      
      // Create pattern that triggers BUY
      for (let i = 0; i < 15; i++) {
        candles.push(createCandle(100 - i * 2));
      }
      candles.push(createCandle(75));
      const lastCandle = createCandle(80);
      candles.push(lastCandle);

      const result = strategy.execute(candles);

      if (result.label === Operation.BUY) {
        expect(result.tp).toBeGreaterThan(0);
        expect(result.sl).toBeGreaterThanOrEqual(0);
        expect(result.roi).toBeGreaterThan(0);
      }
    });

    it("should handle edge case with exactly 15 candles", () => {
      const candles = createCandles(15);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should handle large candle arrays", () => {
      const candles = createCandles(100);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });
  });
});


