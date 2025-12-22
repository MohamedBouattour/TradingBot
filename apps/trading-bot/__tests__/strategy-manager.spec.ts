import { StrategyManager } from "../src/strategies/strategy-manager";
import { TradingStrategy } from "../src/models/trading-strategy.model";
import { Candle } from "../src/models/candle.model";
import { Operation } from "../src/models/operation.enum";

describe("StrategyManager", () => {
  let strategyManager: StrategyManager;
  let mockStrategy: jest.Mocked<TradingStrategy>;

  beforeEach(() => {
    mockStrategy = {
      execute: jest.fn(),
    } as any;

    strategyManager = new StrategyManager(mockStrategy);
  });

  describe("constructor", () => {
    it("should initialize with a strategy", () => {
      expect(strategyManager).toBeDefined();
    });
  });

  describe("setStrategy", () => {
    it("should change the current strategy", () => {
      const newMockStrategy: jest.Mocked<TradingStrategy> = {
        execute: jest.fn(),
      } as any;

      strategyManager.setStrategy(newMockStrategy);

      const candles: Candle[] = [];
      strategyManager.executeStrategy(candles);

      expect(newMockStrategy.execute).toHaveBeenCalledWith(candles);
      expect(mockStrategy.execute).not.toHaveBeenCalled();
    });
  });

  describe("executeStrategy", () => {
    it("should call execute on the current strategy", () => {
      const candles: Candle[] = [
        {
          close: 3500,
          high: 3550,
          low: 3450,
          open: 3480,
          volume: 1000,
          time: new Date().toISOString(),
          closeTime: new Date().toISOString(),
          assetVolume: 0,
          trades: 0,
          buyBaseVolume: 0,
          buyAssetVolume: 0,
          ignored: "",
        },
      ];

      const expectedResult = {
        label: Operation.BUY,
        tp: 3570,
        sl: 3465,
        roi: 1.02,
        riskRewardRatio: 2.0,
        risking: 0.01,
      };

      mockStrategy.execute.mockReturnValue(expectedResult);

      const result = strategyManager.executeStrategy(candles);

      expect(mockStrategy.execute).toHaveBeenCalledWith(candles);
      expect(result).toEqual(expectedResult);
    });

    it("should return the result from strategy execution", () => {
      const candles: Candle[] = [];
      const expectedResult = {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };

      mockStrategy.execute.mockReturnValue(expectedResult);

      const result = strategyManager.executeStrategy(candles);

      expect(result).toEqual(expectedResult);
    });

    it("should handle different strategy results", () => {
      const candles: Candle[] = [];
      
      // Test BUY signal
      mockStrategy.execute.mockReturnValueOnce({
        label: Operation.BUY,
        tp: 3600,
        sl: 3400,
        roi: 1.03,
        riskRewardRatio: 2.0,
        risking: 0.02,
      });

      let result = strategyManager.executeStrategy(candles);
      expect(result.label).toBe(Operation.BUY);
      expect(result.tp).toBe(3600);

      // Test no signal
      mockStrategy.execute.mockReturnValueOnce({
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      });

      result = strategyManager.executeStrategy(candles);
      expect(result.label).toBe("");
      expect(result.tp).toBe(0);
    });

    it("should pass candles array correctly to strategy", () => {
      const candles: Candle[] = Array.from({ length: 100 }, (_, i) => ({
        close: 3500 + i * 10,
        high: 3550 + i * 10,
        low: 3450 + i * 10,
        open: 3480 + i * 10,
        volume: 1000,
        time: new Date().toISOString(),
        closeTime: new Date().toISOString(),
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      }));

      strategyManager.executeStrategy(candles);

      expect(mockStrategy.execute).toHaveBeenCalledWith(candles);
      expect(mockStrategy.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("Strategy Switching", () => {
    it("should use new strategy after switching", () => {
      const firstStrategy: jest.Mocked<TradingStrategy> = {
        execute: jest.fn().mockReturnValue({
          label: Operation.BUY,
          tp: 3600,
          sl: 3400,
          roi: 1.03,
          riskRewardRatio: 2.0,
          risking: 0.02,
        }),
      } as any;

      const secondStrategy: jest.Mocked<TradingStrategy> = {
        execute: jest.fn().mockReturnValue({
          label: "",
          tp: 0,
          sl: 0,
          roi: 0,
          riskRewardRatio: 0,
          risking: 0,
        }),
      } as any;

      strategyManager.setStrategy(firstStrategy);
      const candles: Candle[] = [];
      strategyManager.executeStrategy(candles);

      expect(firstStrategy.execute).toHaveBeenCalled();

      strategyManager.setStrategy(secondStrategy);
      strategyManager.executeStrategy(candles);

      expect(secondStrategy.execute).toHaveBeenCalled();
      expect(firstStrategy.execute).toHaveBeenCalledTimes(1);
    });
  });
});







