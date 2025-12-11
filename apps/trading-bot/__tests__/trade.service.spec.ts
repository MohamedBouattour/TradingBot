import { TradeService } from "../src/services/trade.service";
import { BinanceApiService } from "../src/services/binance-api.service";
import { LogService } from "../src/services/log.service";

// Mock dependencies
jest.mock("../src/services/binance-api.service");
jest.mock("../src/services/log.service");

const mockBinanceApiService = BinanceApiService as jest.Mocked<typeof BinanceApiService>;
const mockLogService = LogService as jest.Mocked<typeof LogService>;

describe("TradeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBinanceApiService.getBalance.mockResolvedValue({
      USDT: { available: "1000", locked: "0" },
      ETH: { available: "0", locked: "0" },
    });
    mockBinanceApiService.getMarketPrice.mockResolvedValue(3000);
    mockBinanceApiService.getOpenOrders.mockResolvedValue([]);
    mockBinanceApiService.cancelAllOrders.mockResolvedValue(undefined);
    mockBinanceApiService.buyAndSetTPSL.mockResolvedValue({
      orderId: "123",
      status: "FILLED",
      executedQty: "0.1",
    } as any);
  });

  describe("handleBuy", () => {
    it("should place a buy order successfully", async () => {
      const result = await TradeService.handleBuy(3100, 2900);

      expect(mockBinanceApiService.getBalance).toHaveBeenCalled();
      expect(mockBinanceApiService.getMarketPrice).toHaveBeenCalled();
      expect(mockBinanceApiService.buyAndSetTPSL).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should cancel pending orders before buying", async () => {
      mockBinanceApiService.getOpenOrders.mockResolvedValue([
        { orderId: "456", status: "NEW" } as any,
      ]);

      await TradeService.handleBuy(3100, 2900);

      expect(mockBinanceApiService.cancelAllOrders).toHaveBeenCalled();
    });

    it("should return undefined if insufficient balance", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "5", locked: "0" },
        ETH: { available: "0", locked: "0" },
      });

      const result = await TradeService.handleBuy(3100, 2900);

      expect(result).toBeUndefined();
      expect(mockBinanceApiService.buyAndSetTPSL).not.toHaveBeenCalled();
      const logCalls = (mockLogService.log as jest.Mock).mock.calls;
      const hasBalanceLog = logCalls.some((call: any[]) => 
        call[0] && call[0].includes("Insufficient balance")
      );
      expect(hasBalanceLog).toBe(true);
    });

    it("should return undefined if trade value is too small", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "10", locked: "0" },
        ETH: { available: "0", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice.mockResolvedValue(100000);

      const result = await TradeService.handleBuy(3100, 2900);

      expect(result).toBeUndefined();
      expect(mockBinanceApiService.buyAndSetTPSL).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockBinanceApiService.buyAndSetTPSL.mockRejectedValue(
        new Error("Order failed")
      );

      const result = await TradeService.handleBuy(3100, 2900);

      expect(result).toBeUndefined();
      expect(mockLogService.logError).toHaveBeenCalled();
    });

    it("should calculate quantity correctly", async () => {
      await TradeService.handleBuy(3100, 2900);

      const buyCall = mockBinanceApiService.buyAndSetTPSL.mock.calls[0];
      expect(buyCall[1]).toBeGreaterThan(0); // quantity
      expect(buyCall[2]).toBe(3100); // tpPrice
      expect(buyCall[3]).toBe(2900); // slPrice
    });

    it("should handle locked balance", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "500", locked: "500" },
        ETH: { available: "0", locked: "0" },
      });

      const result = await TradeService.handleBuy(3100, 2900);

      expect(result).toBeDefined();
      expect(mockBinanceApiService.buyAndSetTPSL).toHaveBeenCalled();
    });
  });

  describe("handleSell", () => {
    it("should place a sell order successfully", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "0", locked: "0" },
        ETH: { available: "1", locked: "0" },
      });
      mockBinanceApiService.sell.mockResolvedValue({
        orderId: "789",
        status: "FILLED",
      } as any);

      const result = await TradeService.handleSell();

      expect(mockBinanceApiService.cancelAllOrders).toHaveBeenCalled();
      expect(mockBinanceApiService.getMarketPrice).toHaveBeenCalled();
      expect(mockBinanceApiService.sell).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should return undefined if insufficient balance", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "0", locked: "0" },
        ETH: { available: "0.0001", locked: "0" },
      });
      mockBinanceApiService.getMarketPrice.mockResolvedValue(3000);

      const result = await TradeService.handleSell();

      expect(result).toBeUndefined();
      expect(mockBinanceApiService.sell).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "0", locked: "0" },
        ETH: { available: "1", locked: "0" },
      });
      mockBinanceApiService.sell.mockRejectedValue(new Error("Sell failed"));

      const result = await TradeService.handleSell();

      expect(result).toBeUndefined();
      const logCalls = (mockLogService.log as jest.Mock).mock.calls;
      const hasErrorLog = logCalls.some((call: any[]) => 
        call[0] && call[0].includes("Error executing trade")
      );
      expect(hasErrorLog).toBe(true);
    });

    it("should handle cancel orders error gracefully", async () => {
      mockBinanceApiService.cancelAllOrders.mockRejectedValue(
        new Error("No orders")
      );
      mockBinanceApiService.getBalance.mockResolvedValue({
        USDT: { available: "0", locked: "0" },
        ETH: { available: "1", locked: "0" },
      });
      mockBinanceApiService.sell.mockResolvedValue({
        orderId: "789",
        status: "FILLED",
      } as any);

      const result = await TradeService.handleSell();

      expect(result).toBeDefined();
      expect(mockLogService.log).toHaveBeenCalled();
    });
  });

  describe("adjustStopLoss", () => {
    it("should adjust stop loss successfully", async () => {
      mockBinanceApiService.getOpenOrders.mockResolvedValue([]);
      mockBinanceApiService.setStopLoss.mockResolvedValue({
        orderId: "999",
        status: "NEW",
      } as any);

      const result = await TradeService.adjustStopLoss(2900);

      expect(mockBinanceApiService.setStopLoss).toHaveBeenCalledWith(
        "ETHUSDT",
        2900
      );
      expect(result).toBeDefined();
    });

    it("should cancel existing SL orders and recreate", async () => {
      mockBinanceApiService.getOpenOrders.mockResolvedValue([
        { type: "STOP_LOSS", orderId: "111" } as any,
      ]);
      mockBinanceApiService.setStopLossWithQuantity.mockResolvedValue({
        orderId: "999",
        status: "NEW",
      } as any);
      mockBinanceApiService.setTakeProfit.mockResolvedValue({
        orderId: "888",
        status: "NEW",
      } as any);

      const result = await TradeService.adjustStopLoss(2900, 0.1, 3100);

      expect(mockBinanceApiService.cancelAllOrders).toHaveBeenCalled();
      expect(mockBinanceApiService.setTakeProfit).toHaveBeenCalled();
      expect(mockBinanceApiService.setStopLossWithQuantity).toHaveBeenCalledWith(
        "ETHUSDT",
        2900,
        0.1
      );
      expect(result).toBeDefined();
    });

    it("should round stop loss price to 2 decimal places", async () => {
      mockBinanceApiService.getOpenOrders.mockResolvedValue([]);
      mockBinanceApiService.setStopLoss.mockResolvedValue({
        orderId: "999",
        status: "NEW",
      } as any);

      await TradeService.adjustStopLoss(2900.123456);

      expect(mockBinanceApiService.setStopLoss).toHaveBeenCalledWith(
        "ETHUSDT",
        2900.12
      );
    });

    it("should handle errors gracefully", async () => {
      mockBinanceApiService.getOpenOrders.mockResolvedValue([]);
      mockBinanceApiService.setStopLoss.mockRejectedValue(
        new Error("SL failed")
      );

      // Ensure logError is properly mocked
      mockLogService.logError = jest.fn();
      
      // Suppress console.error from the error handler
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await TradeService.adjustStopLoss(2900);

      expect(result).toBeUndefined();
      expect(mockLogService.logError).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe("testOrders", () => {
    it("should execute test orders", async () => {
      mockBinanceApiService.buyAndSetTPSL.mockResolvedValue({
        orderId: "test",
        status: "FILLED",
      } as any);

      await TradeService.testOrders("BTCUSDT");

      expect(mockBinanceApiService.buyAndSetTPSL).toHaveBeenCalledWith(
        "BTCUSDT",
        2,
        3.66,
        3.82
      );
      expect(mockLogService.log).toHaveBeenCalledWith("Test order executed");
    });

    it("should handle test order errors", async () => {
      mockBinanceApiService.buyAndSetTPSL.mockRejectedValue(
        new Error("Test failed")
      );

      await TradeService.testOrders("BTCUSDT");

      const logCalls = (mockLogService.log as jest.Mock).mock.calls;
      const hasTestFailedLog = logCalls.some((call: any[]) => 
        call[0] && call[0].includes("Test failed")
      );
      expect(hasTestFailedLog).toBe(true);
    });
  });
});

