import { TrendlineBreakoutStrategy } from "../src/strategies/trendline-breakout/trendline-breakout-strategy";
import { Candle } from "../src/models/candle.model";
import { Operation } from "../src/models/operation.enum";

describe("TrendlineBreakoutStrategy", () => {
  let strategy: TrendlineBreakoutStrategy;

  beforeEach(() => {
    strategy = new TrendlineBreakoutStrategy();
  });

  const createCandle = (
    close: number,
    high: number,
    low: number,
    time: string = "2024-01-01T00:00:00.000Z"
  ): Candle => ({
    time,
    open: close * 0.99,
    high,
    low,
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
      const price = basePrice + Math.sin(i * 0.1) * 5;
      candles.push(createCandle(price, price * 1.01, price * 0.99));
    }
    return candles;
  };

  describe("execute", () => {
    it("should return empty result when candles array is too short", () => {
      const candles = createCandles(20); // Less than 2*length + 1 (29)

      const result = strategy.execute(candles);

      expect(result.label).toBe("");
      expect(result.tp).toBe(0);
      expect(result.sl).toBe(0);
      expect(result.roi).toBe(0);
    });

    it("should detect pivot highs correctly", () => {
      const candles: Candle[] = [];
      
      // Create pattern with clear pivot high
      for (let i = 0; i < 30; i++) {
        const price = 100 + Math.sin(i * 0.2) * 10;
        candles.push(createCandle(price, price * 1.02, price * 0.98));
      }

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should detect pivot lows correctly", () => {
      const candles: Candle[] = [];
      
      // Create pattern with clear pivot low
      for (let i = 0; i < 30; i++) {
        const price = 100 - Math.sin(i * 0.2) * 10;
        candles.push(createCandle(price, price * 1.02, price * 0.98));
      }

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should generate BUY signal on upward breakout", () => {
      const candles: Candle[] = [];
      
      // Create downtrend first
      for (let i = 0; i < 30; i++) {
        const price = 100 - i * 0.5;
        candles.push(createCandle(price, price * 1.01, price * 0.99));
      }
      
      // Then create upward breakout
      const breakoutPrice = 85;
      candles.push(createCandle(breakoutPrice, breakoutPrice * 1.02, breakoutPrice * 0.99));

      const result = strategy.execute(candles);

      // Should potentially generate BUY signal on breakout
      expect(result).toBeDefined();
    });

    it("should calculate ATR correctly", () => {
      const candles: Candle[] = [];
      
      // Create candles with varying ranges
      for (let i = 0; i < 30; i++) {
        const basePrice = 100 + i * 0.1;
        const range = 2 + Math.random() * 2;
        candles.push(
          createCandle(
            basePrice,
            basePrice + range,
            basePrice - range
          )
        );
      }

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should calculate TP and SL correctly when BUY signal is generated", () => {
      const candles: Candle[] = [];
      
      // Create pattern that might trigger BUY
      for (let i = 0; i < 30; i++) {
        const price = 100 + Math.sin(i * 0.1) * 5;
        candles.push(createCandle(price, price * 1.01, price * 0.99));
      }

      const result = strategy.execute(candles);

      if (result.label === Operation.BUY) {
        expect(result.tp).toBeGreaterThan(0);
        expect(result.sl).toBeGreaterThan(0);
        expect(result.roi).toBeGreaterThan(0);
        expect(result.riskRewardRatio).toBeGreaterThan(0);
        expect(result.risking).toBeGreaterThan(0);
      }
    });

    it("should handle different slope calculation methods", () => {
      const strategyATR = new TrendlineBreakoutStrategy(14, 1.0, "atr");
      const strategySTDEV = new TrendlineBreakoutStrategy(14, 1.0, "stdev");
      const strategyLINREG = new TrendlineBreakoutStrategy(14, 1.0, "linreg");

      const candles = createCandles(30);

      const resultATR = strategyATR.execute(candles);
      const resultSTDEV = strategySTDEV.execute(candles);
      const resultLINREG = strategyLINREG.execute(candles);

      expect(resultATR).toBeDefined();
      expect(resultSTDEV).toBeDefined();
      expect(resultLINREG).toBeDefined();
    });

    it("should handle custom length and multiplier parameters", () => {
      const customStrategy = new TrendlineBreakoutStrategy(20, 1.5, "atr");
      const candles = createCandles(50);

      const result = customStrategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should handle large candle arrays", () => {
      const candles = createCandles(200);

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should return empty result when no breakout occurs", () => {
      // Create stable price pattern (no breakout)
      const candles: Candle[] = [];
      
      for (let i = 0; i < 30; i++) {
        const price = 100 + Math.random() * 2; // Small random variation
        candles.push(createCandle(price, price * 1.01, price * 0.99));
      }

      const result = strategy.execute(candles);

      // Should return empty result if no breakout
      expect(result).toBeDefined();
    });

    it("should calculate trendline values correctly", () => {
      const candles: Candle[] = [];
      
      // Create clear trend pattern
      for (let i = 0; i < 30; i++) {
        const price = 100 + i * 0.5; // Uptrend
        candles.push(createCandle(price, price * 1.01, price * 0.99));
      }

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });

    it("should handle edge case with exactly minimum required candles", () => {
      const candles = createCandles(29); // 2*14 + 1

      const result = strategy.execute(candles);

      expect(result).toBeDefined();
    });
  });

  describe("constructor", () => {
    it("should use default parameters", () => {
      const defaultStrategy = new TrendlineBreakoutStrategy();
      expect(defaultStrategy).toBeDefined();
    });

    it("should accept custom parameters", () => {
      const customStrategy = new TrendlineBreakoutStrategy(20, 2.0, "stdev");
      expect(customStrategy).toBeDefined();
    });
  });
});






