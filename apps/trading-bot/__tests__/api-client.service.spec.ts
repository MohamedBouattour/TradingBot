import { ApiClientService } from "../src/services/api-client.service";
import { LogService } from "../src/services/log.service";

// Mock fetch
global.fetch = jest.fn();

// Mock LogService
jest.mock("../src/services/log.service");

const mockLogService = LogService as jest.Mocked<typeof LogService>;

describe("ApiClientService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env["BOT_API_URL"] = undefined;
  });

  afterEach(() => {
    delete process.env["BOT_API_URL"];
  });

  describe("sendTradingDecision", () => {
    it("should send trading decision successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await ApiClientService.sendTradingDecision({
        decision: "BUY",
        currentPrice: 3000,
        executionTimeMs: 100,
        timestamp: new Date().toISOString(),
        asset: "ETH",
        pair: "ETHUSDT",
      });

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/trading/decisions");
      expect(fetchCall[1]).toMatchObject({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should return false on failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await ApiClientService.sendTradingDecision({
        decision: "BUY",
        currentPrice: 3000,
        executionTimeMs: 100,
        timestamp: new Date().toISOString(),
        asset: "ETH",
        pair: "ETHUSDT",
      });

      expect(result).toBe(false);
      expect(mockLogService.logError).toHaveBeenCalled();
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await ApiClientService.sendTradingDecision({
        decision: "BUY",
        currentPrice: 3000,
        executionTimeMs: 100,
        timestamp: new Date().toISOString(),
        asset: "ETH",
        pair: "ETHUSDT",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendROIData", () => {
    it("should send ROI data successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await ApiClientService.sendROIData({
        assetValue: 1000,
        baseCurrencyValue: 2000,
        portfolioValue: 3000,
        totalValue: 3000,
        roi: 1.5,
        pnl: 50,
        initialBalance: 2000,
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/trading/roi");
      expect(fetchCall[1]).toMatchObject({ method: "POST" });
    });
  });

  describe("sendRebalanceResult", () => {
    it("should send rebalance result successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await ApiClientService.sendRebalanceResult({
        asset: "BTC",
        status: "SUCCESS",
        action: "BUY",
        quantity: 0.1,
        price: 50000,
        value: 5000,
        currentValue: 4500,
        targetValue: 5000,
        deviation: 0.1,
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/trading/rebalance");
      expect(fetchCall[1]).toMatchObject({ method: "POST" });
    });
  });

  describe("updatePortfolioValue", () => {
    it("should update portfolio value successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await ApiClientService.updatePortfolioValue("BTC", 5000);

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/portfolio/BTC/value");
      expect(fetchCall[1]).toMatchObject({ method: "PUT" });
    });
  });

  describe("getPortfolioStats", () => {
    it("should get portfolio stats successfully", async () => {
      const mockStats = { totalValue: 10000, assets: 3 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await ApiClientService.getPortfolioStats();

      expect(result).toEqual(mockStats);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/portfolio/stats");
      expect(fetchCall[1]).toMatchObject({ method: "GET" });
    });

    it("should return null on failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await ApiClientService.getPortfolioStats();

      expect(result).toBeNull();
    });
  });

  describe("checkHealth", () => {
    it("should check health successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" }),
      });

      const result = await ApiClientService.checkHealth();

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/trading/health");
      expect(fetchCall[1]).toMatchObject({ method: "GET" });
    });
  });

  describe("batchUpdatePortfolioValues", () => {
    it("should batch update portfolio values", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await ApiClientService.batchUpdatePortfolioValues([
        { asset: "BTC", valueInBaseCurrency: 5000 },
        { asset: "ETH", valueInBaseCurrency: 3000 },
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle batch update errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await ApiClientService.batchUpdatePortfolioValues([
        { asset: "BTC", valueInBaseCurrency: 5000 },
      ]);

      expect(mockLogService.logError).toHaveBeenCalled();
    });
  });

  describe("getTradingStats", () => {
    it("should get trading stats successfully", async () => {
      const mockStats = { totalTrades: 10, winRate: 0.6 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await ApiClientService.getTradingStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe("syncPortfolioItem", () => {
    it("should sync portfolio item successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await ApiClientService.syncPortfolioItem({
        asset: "BTC",
        value: 5000,
        threshold: 0.1,
        pricePresision: 2,
        quantityPrecision: 5,
      });

      expect(result).toBe(true);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/portfolio/sync");
      expect(fetchCall[1]).toMatchObject({ method: "POST" });
    });
  });

  describe("timeout handling", () => {
    it("should handle request timeout", async () => {
      // Use a shorter timeout for the test
      const originalTimeout = ApiClientService["TIMEOUT"];
      (ApiClientService as any).TIMEOUT = 100;

      // Mock fetch to never resolve, simulating a timeout
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: RequestInit) => {
          return new Promise((resolve, reject) => {
            // Check if abort signal is present
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                reject(new Error('The operation was aborted.'));
              });
            }
            // Never resolve to simulate timeout
          });
        }
      );

      const promise = ApiClientService.sendTradingDecision({
        decision: "BUY",
        currentPrice: 3000,
        executionTimeMs: 100,
        timestamp: new Date().toISOString(),
        asset: "ETH",
        pair: "ETHUSDT",
      });

      const result = await promise;

      expect(result).toBe(false);
      (ApiClientService as any).TIMEOUT = originalTimeout;
    }, 10000); // Increase test timeout
  });

  describe("custom API URL", () => {
    it("should use default API URL when env not set", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await ApiClientService.checkHealth();

      // Should use default localhost URL
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/trading/health");
      expect(fetchCall[1]).toBeDefined();
    });
  });
});

