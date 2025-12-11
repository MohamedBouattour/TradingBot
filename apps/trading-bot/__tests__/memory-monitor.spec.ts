import { MemoryMonitor } from "../src/utils/memory-monitor";
import { LogService } from "../src/services/log.service";

// Mock LogService
jest.mock("../src/services/log.service");

const mockLogService = LogService as jest.Mocked<typeof LogService>;

describe("MemoryMonitor", () => {
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset singleton instance
    (MemoryMonitor as any).instance = undefined;
    memoryMonitor = MemoryMonitor.getInstance();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
    jest.useRealTimers();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton)", () => {
      const instance1 = MemoryMonitor.getInstance();
      const instance2 = MemoryMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("startMonitoring", () => {
    it("should start memory monitoring", () => {
      memoryMonitor.startMonitoring();
      expect(mockLogService.log).toHaveBeenCalledWith("Memory monitoring started");
    });

    it("should not start multiple monitoring intervals", () => {
      memoryMonitor.startMonitoring();
      memoryMonitor.startMonitoring();
      memoryMonitor.startMonitoring();

      // Should only log once
      expect(mockLogService.log).toHaveBeenCalledTimes(1);
    });

    it("should check memory usage periodically", () => {
      memoryMonitor.startMonitoring();

      // Advance timer by monitoring interval (60 minutes = 3600000ms)
      jest.advanceTimersByTime(3600000);

      expect(mockLogService.log).toHaveBeenCalledWith(
        expect.stringContaining("Memory Usage")
      );
    });
  });

  describe("stopMonitoring", () => {
    it("should stop memory monitoring", () => {
      memoryMonitor.startMonitoring();
      memoryMonitor.stopMonitoring();

      expect(mockLogService.log).toHaveBeenCalledWith("Memory monitoring stopped");
    });

    it("should not throw if monitoring is not started", () => {
      expect(() => memoryMonitor.stopMonitoring()).not.toThrow();
    });
  });

  describe("checkMemoryUsage", () => {
    it("should log memory usage", () => {
      memoryMonitor.startMonitoring();
      jest.advanceTimersByTime(3600000);

      expect(mockLogService.log).toHaveBeenCalledWith(
        expect.stringContaining("Memory Usage")
      );
    });

    it("should log warning when memory exceeds threshold", () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 500 * 1024 * 1024,
        heapUsed: 450 * 1024 * 1024, // 450MB > 400MB threshold
        external: 0,
        arrayBuffers: 0,
      })) as any;

      memoryMonitor.startMonitoring();
      jest.advanceTimersByTime(3600000);

      expect(mockLogService.log).toHaveBeenCalledWith(
        expect.stringContaining("WARNING: Memory usage is high")
      );

      process.memoryUsage = originalMemoryUsage;
    });

    it("should log critical warning when memory exceeds critical threshold", () => {
      // Mock critical memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 600 * 1024 * 1024,
        heapUsed: 550 * 1024 * 1024, // 550MB > 500MB critical threshold
        external: 0,
        arrayBuffers: 0,
      })) as any;

      memoryMonitor.startMonitoring();
      jest.advanceTimersByTime(3600000);

      expect(mockLogService.log).toHaveBeenCalledWith(
        expect.stringContaining("CRITICAL: Memory usage is very high")
      );

      process.memoryUsage = originalMemoryUsage;
    });

    it("should trigger garbage collection if available", () => {
      // Mock global.gc
      const mockGc = jest.fn();
      (global as any).gc = mockGc;

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        rss: 100 * 1024 * 1024,
        heapTotal: 500 * 1024 * 1024,
        heapUsed: 450 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      })) as any;

      memoryMonitor.startMonitoring();
      jest.advanceTimersByTime(3600000);

      expect(mockGc).toHaveBeenCalled();

      process.memoryUsage = originalMemoryUsage;
      delete (global as any).gc;
    });
  });

  describe("getMemoryStats", () => {
    it("should return memory statistics", () => {
      const stats = memoryMonitor.getMemoryStats();

      expect(stats).toHaveProperty("rss");
      expect(stats).toHaveProperty("heapTotal");
      expect(stats).toHaveProperty("heapUsed");
      expect(stats).toHaveProperty("external");
      expect(stats).toHaveProperty("arrayBuffers");

      expect(typeof stats.rss).toBe("number");
      expect(typeof stats.heapTotal).toBe("number");
      expect(typeof stats.heapUsed).toBe("number");
      expect(typeof stats.external).toBe("number");
      expect(typeof stats.arrayBuffers).toBe("number");
    });

    it("should return memory stats in MB", () => {
      const stats = memoryMonitor.getMemoryStats();

      // Values should be reasonable (not in bytes)
      expect(stats.rss).toBeGreaterThan(0);
      expect(stats.heapTotal).toBeGreaterThan(0);
      expect(stats.heapUsed).toBeGreaterThan(0);
    });
  });
});


