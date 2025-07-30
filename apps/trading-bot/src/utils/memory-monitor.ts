import { LogService } from "../services/log.service";

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly MEMORY_THRESHOLD_MB = 400; // Alert threshold
  private readonly CRITICAL_THRESHOLD_MB = 500; // Critical threshold
  private readonly MONITOR_INTERVAL_MS = 15 * 60000; // 1 minute

  private constructor() {}

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  public startMonitoring(): void {
    if (this.intervalId) {
      return; // Already monitoring
    }

    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.MONITOR_INTERVAL_MS);

    LogService.log("Memory monitoring started");
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      LogService.log("Memory monitoring stopped");
    }
  }

  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const rssMB = memUsage.rss / 1024 / 1024;

    // Log detailed memory info
    LogService.log(
      `Memory Usage - RSS: ${rssMB.toFixed(2)}MB, Heap: ${heapUsedMB.toFixed(
        2
      )}MB, External: ${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
    );

    // Check thresholds
    if (heapUsedMB > this.CRITICAL_THRESHOLD_MB) {
      LogService.log(
        `CRITICAL: Memory usage is very high (${heapUsedMB.toFixed(
          2
        )}MB)! Consider restarting.`
      );
      this.forceGarbageCollection();
    } else if (heapUsedMB > this.MEMORY_THRESHOLD_MB) {
      LogService.log(
        `WARNING: Memory usage is high (${heapUsedMB.toFixed(2)}MB)`
      );
      this.forceGarbageCollection();
    }
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      const beforeGC = process.memoryUsage().heapUsed / 1024 / 1024;
      global.gc();
      const afterGC = process.memoryUsage().heapUsed / 1024 / 1024;
      const freed = beforeGC - afterGC;
      LogService.log(
        `Garbage collection completed. Freed: ${freed.toFixed(2)}MB`
      );
    }
  }

  public getMemoryStats(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  } {
    const memUsage = process.memoryUsage();
    return {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
    };
  }
}
