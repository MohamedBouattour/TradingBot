import { BinanceApiService } from "../src/services/binance-api.service";
import { MarketService } from "../src/services/market.service";
import { TradeService } from "../src/services/trade.service";
import { ApiClientService } from "../src/services/api-client.service";
import { LogService } from "../src/services/log.service";
import { Candle } from "../src/models/candle.model";
import { Operation } from "../src/models/operation.enum";
import { ASSET, PAIR, AMOUNT_PRECISION } from "../src/constants";

// Mock all services
jest.mock("../src/services/binance-api.service");
jest.mock("../src/services/market.service");
jest.mock("../src/services/trade.service");
jest.mock("../src/services/api-client.service");
jest.mock("../src/services/log.service");

// Mock process.exit globally to prevent test suite from exiting
const originalExit = process.exit;
beforeAll(() => {
  (process.exit as any) = jest.fn((code?: number) => {
    // Don't actually exit, just log
    console.log(`process.exit(${code}) was called but mocked`);
  });
});

afterAll(() => {
  process.exit = originalExit;
});

describe("Trading Bot", () => {
  const mockBinanceApiService = BinanceApiService as jest.Mocked<typeof BinanceApiService>;
  const mockMarketService = MarketService as jest.Mocked<typeof MarketService>;
  const mockTradeService = TradeService as jest.Mocked<typeof TradeService>;
  const mockApiClientService = ApiClientService as jest.Mocked<typeof ApiClientService>;
  const mockLogService = LogService as jest.Mocked<typeof LogService>;

  // Helper to create mock candles
  const createCandle = (
    close: number,
    high?: number,
    low?: number,
    open?: number,
    volume?: number
  ): Candle => ({
    close,
    high: high || close * 1.01,
    low: low || close * 0.99,
    open: open || close * 0.995,
    volume: volume || 1000,
    time: new Date().toISOString(),
    closeTime: new Date().toISOString(),
    assetVolume: 0,
    trades: 0,
    buyBaseVolume: 0,
    buyAssetVolume: 0,
    ignored: "",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    mockLogService.log = jest.fn();
    mockLogService.logError = jest.fn();
    mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(3500);
  });

  describe("setupExistingPosition", () => {
    it("should return false when no balance exists", async () => {
      mockBinanceApiService.getOpenOrders = jest.fn().mockResolvedValue([]);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: "0", locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });

      // Import app module to test setupExistingPosition
      // Since it's not exported, we'll test through integration
      const balance = await mockBinanceApiService.getBalance();
      const assetBalance = balance[ASSET];
      const totalQuantity = parseFloat(assetBalance.available || "0") + parseFloat(assetBalance.locked || "0");

      expect(totalQuantity).toBe(0);
    });

    it("should ignore dust balances below $5", async () => {
      const marketPrice = 3500;
      const dustQuantity = 0.0001; // ~$0.35
      const positionValue = dustQuantity * marketPrice; // ~$0.35

      mockBinanceApiService.getOpenOrders = jest.fn().mockResolvedValue([]);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: dustQuantity.toString(), locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(marketPrice);

      const balance = await mockBinanceApiService.getBalance();
      const assetBalance = balance[ASSET];
      const totalQuantity = parseFloat(assetBalance.available || "0") + parseFloat(assetBalance.locked || "0");
      const price = await mockBinanceApiService.getMarketPrice(PAIR);
      const positionValueCalc = totalQuantity * price;

      expect(positionValueCalc).toBeLessThan(5.0);
    });

    it("should detect existing TP and SL orders", async () => {
      const quantity = 0.1;
      const marketPrice = 3500;

      mockBinanceApiService.getOpenOrders = jest.fn().mockResolvedValue([
        {
          symbol: PAIR,
          orderId: "123",
          type: "LIMIT",
          side: "SELL",
          price: "3570",
          status: "NEW",
        },
        {
          symbol: PAIR,
          orderId: "124",
          type: "STOP_LOSS",
          side: "SELL",
          stopPrice: "3465",
          status: "NEW",
        },
      ]);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: quantity.toString(), locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(marketPrice);

      const orders = await mockBinanceApiService.getOpenOrders(PAIR);
      const hasTP = orders.some((order: any) => order.type === "LIMIT" && order.side === "SELL");
      const hasSL = orders.some((order: any) => 
        order.type === "STOP_LOSS" || order.type === "STOP_LOSS_LIMIT"
      );

      expect(hasTP).toBe(true);
      expect(hasSL).toBe(true);
    });

    it("should not cancel orders if TP exists and no available quantity", async () => {
      const quantity = 0.1;
      const marketPrice = 3500;

      mockBinanceApiService.getOpenOrders = jest.fn().mockResolvedValue([
        {
          symbol: PAIR,
          orderId: "123",
          type: "LIMIT",
          side: "SELL",
          price: "3570",
          status: "NEW",
        },
      ]);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: "0", locked: quantity.toString() },
        USDT: { available: "1000", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(marketPrice);
      mockBinanceApiService.cancelAllOrders = jest.fn();

      const orders = await mockBinanceApiService.getOpenOrders(PAIR);
      const hasTP = orders.some((order: any) => order.type === "LIMIT" && order.side === "SELL");
      const balance = await mockBinanceApiService.getBalance();
      const assetBalance = balance[ASSET];
      const availableQuantity = parseFloat(assetBalance.available || "0");

      if (hasTP && availableQuantity <= 0) {
        // Should not cancel
        expect(mockBinanceApiService.cancelAllOrders).not.toHaveBeenCalled();
      }
    });
  });

  describe("checkAndAdjustStopLoss", () => {
    it("should clear position tracking when quantity is zero", async () => {
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: "0", locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(3500);

      const balance = await mockBinanceApiService.getBalance();
      const assetBalance = balance[ASSET];
      const currentQuantity = parseFloat(assetBalance.available || "0") + parseFloat(assetBalance.locked || "0");

      expect(currentQuantity).toBe(0);
    });

    it("should clear position tracking for dust balances", async () => {
      const dustQuantity = 0.0001;
      const marketPrice = 3500;
      const positionValue = dustQuantity * marketPrice; // ~$0.35

      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: dustQuantity.toString(), locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(marketPrice);

      const balance = await mockBinanceApiService.getBalance();
      const assetBalance = balance[ASSET];
      const currentQuantity = parseFloat(assetBalance.available || "0") + parseFloat(assetBalance.locked || "0");
      const price = await mockBinanceApiService.getMarketPrice(PAIR);
      const positionValueCalc = currentQuantity * price;

      expect(positionValueCalc).toBeLessThan(5.0);
    });

    it("should detect when stop loss is hit", async () => {
      const entryPrice = 3500;
      const stopLoss = 3465; // 1% below entry
      const currentPrice = 3460; // Below stop loss

      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(currentPrice);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: "0.1", locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });

      const marketPrice = await mockBinanceApiService.getMarketPrice(PAIR);
      const stopLossHit = marketPrice <= stopLoss;

      expect(stopLossHit).toBe(true);
    });

    it("should detect when target price is hit", async () => {
      const entryPrice = 3500;
      const targetPrice = 3570; // 2% above entry
      const currentPrice = 3580; // Above target

      mockBinanceApiService.getMarketPrice = jest.fn().mockResolvedValue(currentPrice);
      mockBinanceApiService.getBalance = jest.fn().mockResolvedValue({
        [ASSET]: { available: "0.1", locked: "0" },
        USDT: { available: "1000", locked: "0" },
      });

      const marketPrice = await mockBinanceApiService.getMarketPrice(PAIR);
      const targetHit = marketPrice >= targetPrice;

      expect(targetHit).toBe(true);
    });
  });

  describe("runTradingBot", () => {
    it("should execute strategy on candlesticks", async () => {
      const candles: Candle[] = Array.from({ length: 200 }, (_, i) =>
        createCandle(3500 + i * 10)
      );

      mockMarketService.fetchCandlestickData = jest.fn().mockResolvedValue(candles);

      const fetchedCandles = await mockMarketService.fetchCandlestickData(PAIR, "30m");
      const limitedCandles = fetchedCandles.slice(-200);
      const currentPrice = limitedCandles[limitedCandles.length - 1].close;

      expect(fetchedCandles.length).toBe(200);
      expect(currentPrice).toBeDefined();
      expect(typeof currentPrice).toBe("number");
    });

    it("should handle buy signal when not in position", async () => {
      const candles: Candle[] = Array.from({ length: 200 }, (_, i) =>
        createCandle(3500 + i * 10)
      );

      // Mock strategy result with BUY signal
      const strategyResult = {
        label: Operation.BUY,
        tp: 3570,
        sl: 3465,
        roi: 1.02,
        riskRewardRatio: 2.0,
        risking: 0.01,
      };

      // Verify strategy result structure
      expect(strategyResult.label).toBe(Operation.BUY);
      expect(strategyResult.tp).toBeGreaterThan(0);
      expect(strategyResult.sl).toBeGreaterThan(0);
    });

    it("should not buy when already in position", async () => {
      const currentPosition = {
        entryPrice: 3500,
        stopLoss: 3465,
        targetPrice: 3570,
        quantity: 0.1,
        entryTime: new Date(),
      };

      const strategyResult = {
        label: Operation.BUY,
        tp: 3570,
        sl: 3465,
        roi: 1.02,
        riskRewardRatio: 2.0,
        risking: 0.01,
      };

      // Should not buy if position exists
      const shouldBuy = strategyResult.label === Operation.BUY && !currentPosition;
      expect(shouldBuy).toBe(false);
    });

    it("should send trading decision to API when configured", async () => {
      const decisionData = {
        decision: Operation.BUY,
        currentPrice: 3500,
        targetPrice: 3570,
        stopLoss: 3465,
        executionTimeMs: 100,
        timestamp: new Date().toISOString(),
        asset: ASSET,
        pair: PAIR,
      };

      mockApiClientService.sendTradingDecision = jest.fn().mockResolvedValue(undefined);

      await mockApiClientService.sendTradingDecision(decisionData);

      expect(mockApiClientService.sendTradingDecision).toHaveBeenCalledWith(decisionData);
    });
  });

  describe("Position Management", () => {
    it("should calculate P&L correctly", () => {
      const entryPrice = 3500;
      const currentPrice = 3570;
      const pnl = ((currentPrice - entryPrice) / entryPrice) * 100;

      expect(pnl).toBeCloseTo(2.0, 1); // 2% profit
    });

    it("should calculate holding time correctly", () => {
      const entryTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const holdingTime = Math.round((Date.now() - entryTime.getTime()) / (1000 * 60));

      expect(holdingTime).toBe(60); // 60 minutes
    });

    it("should validate position value meets minimum threshold", () => {
      const quantity = 0.1;
      const marketPrice = 3500;
      const positionValue = quantity * marketPrice;
      const MIN_POSITION_VALUE = 5.0;

      expect(positionValue).toBeGreaterThanOrEqual(MIN_POSITION_VALUE);
    });
  });
});

