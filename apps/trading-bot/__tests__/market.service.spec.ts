import { MarketService } from "../src/services/market.service";
import { convertStringToNumbers } from "../src/core/utils";
import { Candle } from "../src/models/candle.model";

// Mock fetch
global.fetch = jest.fn();

// Mock delay
jest.mock("../src/core/utils", () => ({
  ...jest.requireActual("../src/core/utils"),
  delay: jest.fn().mockResolvedValue(undefined),
}));

describe("MarketService", () => {
  const mockCandleData: string[][] = [
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
    [
      "1678972800000",
      "20300",
      "20800",
      "20100",
      "20600",
      "12",
      "1679059199999",
      "120",
      "60",
      "6",
      "60",
      "ignored",
    ],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    MarketService.clearCache();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    MarketService.cleanup();
  });

  describe("fetchCandlestickData", () => {
    it("should fetch candlestick data successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandleData,
      });

      const result = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(result.length).toBe(2);
      expect(result[0].close).toBe(20300);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should cache results and return cached data", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandleData,
      });

      const result1 = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
      const result2 = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it("should handle rate limiting with retry", async () => {
      const { delay } = require("../src/core/utils");
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: jest.fn().mockReturnValue("5"),
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCandleData,
        });

      const result = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(delay).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    it("should retry on failure with exponential backoff", async () => {
      const { delay } = require("../src/core/utils");
      
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCandleData,
        });

      const result = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(delay).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    it("should throw error after max retries", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      try {
        await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      try {
        await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should use endTime parameter when provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandleData,
      });

      await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100, 1678886400000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("endTime=1678886400000");
    });

    it("should deduplicate concurrent requests", async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockCandleData,
              }),
            100
          )
        )
      );

      const promises = [
        MarketService.fetchCandlestickData("BTCUSDT", "1h", 100),
        MarketService.fetchCandlestickData("BTCUSDT", "1h", 100),
        MarketService.fetchCandlestickData("BTCUSDT", "1h", 100),
      ];

      const results = await Promise.all(promises);

      // Should only make one actual request
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });

  describe("cache management", () => {
    it("should clear cache", () => {
      MarketService.clearCache();
      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBe(0);
    });

    it("should get cache statistics", () => {
      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBeDefined();
      expect(stats.activeRequests).toBeDefined();
      expect(stats.queuedRequests).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
    });

    it("should clean cache when it exceeds max size", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCandleData,
      });

      // Fill cache beyond max size
      for (let i = 0; i < 10; i++) {
        await MarketService.fetchCandlestickData(`BTCUSDT${i}`, "1h", 100);
      }

      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(5); // MAX_CACHE_SIZE
    });
  });

  describe("initialization and cleanup", () => {
    it("should initialize memory monitoring", () => {
      MarketService.initialize();
      MarketService.cleanup();
      // Should not throw
      expect(true).toBe(true);
    });

    it("should cleanup resources", () => {
      MarketService.initialize();
      MarketService.cleanup();
      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBe(0);
      expect(stats.queuedRequests).toBe(0);
    });
  });

  describe("cache management", () => {
    it("should clean expired cache entries", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCandleData,
      });

      // Fill cache
      await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
      
      // Manually expire cache entries by manipulating timestamps
      const cache = (MarketService as any).candleCache;
      if (cache && cache.size > 0) {
        const firstEntry = Array.from(cache.entries())[0] as [string, any];
        if (firstEntry && firstEntry[1]) {
          firstEntry[1].timestamp = Date.now() - 50000; // Expired
        }
      }

      // Trigger cache clean
      await MarketService.fetchCandlestickData("ETHUSDT", "1h", 100);

      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(5);
    });

    it("should perform aggressive cache clean on high memory", () => {
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        heapUsed: 200 * 1024 * 1024, // 200MB > 150MB threshold
        heapTotal: 300 * 1024 * 1024,
        rss: 400 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      })) as any;

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      MarketService.initialize();
      
      // Manually trigger memory check instead of waiting for interval
      (MarketService as any).performMemoryCheck();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("High memory usage detected")
      );
      
      consoleWarnSpy.mockRestore();
      process.memoryUsage = originalMemoryUsage;
      MarketService.cleanup();
    });

    it("should clean request queue of old requests", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCandleData,
      });

      // Create a request that will be old
      const promise = MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
      
      // Manually age the request queue
      const requestQueue = (MarketService as any).requestQueue;
      if (requestQueue && requestQueue.size > 0) {
        const firstEntry = Array.from(requestQueue.entries())[0] as [string, any];
        if (firstEntry && firstEntry[1]) {
          firstEntry[1].timestamp = Date.now() - 40000; // Old request
        }
      }

      await promise;
      
      // Trigger clean
      await MarketService.fetchCandlestickData("ETHUSDT", "1h", 100);

      const stats = MarketService.getCacheStats();
      expect(stats.queuedRequests).toBeLessThanOrEqual(3);
    });

    it("should handle existing request that fails", async () => {
      // Mock fetch to reject multiple times so both requests fail
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Request failed"))
        .mockRejectedValueOnce(new Error("Request failed"));

      const promise1 = MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
      
      // Second request should use existing request queue initially, but if it fails,
      // it will create a new request which will also fail
      const promise2 = MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      // Both should fail
      try {
        await promise1;
        fail("promise1 should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
      try {
        await promise2;
        fail("promise2 should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle cache hit with access count update", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandleData,
      });

      // First call
      await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);
      
      // Second call should hit cache
      const result = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.length).toBe(2);
    });

    it("should handle empty data response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await MarketService.fetchCandlestickData("BTCUSDT", "1h", 100);

      expect(result.length).toBe(0);
      // Should not cache empty data
      const stats = MarketService.getCacheStats();
      expect(stats.cacheSize).toBe(0);
    });
  });
});

