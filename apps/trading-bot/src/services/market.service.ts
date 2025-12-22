import { convertStringToNumbers, delay } from "../core/utils";
import { Candle } from "../models/candle.model";

interface CacheEntry {
  data: Candle[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface RequestQueue {
  promise: Promise<any>;
  timestamp: number;
}

export class MarketService {
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 1000;
  private static readonly MAX_RETRIES = 3; // Reduced from 5
  private static readonly BASE_RETRY_DELAY = 1500; // Reduced from 2000
  private static candleCache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 25000; // Reduced from 30 seconds
  private static readonly MAX_CACHE_SIZE = 5; // Reduced from 10
  private static readonly REQUEST_TIMEOUT = 8000; // Reduced from 10 seconds
  private static requestQueue = new Map<string, RequestQueue>();
  private static readonly MAX_CONCURRENT_REQUESTS = 3;
  private static activeRequests = 0;
  private static memoryCheckInterval: NodeJS.Timeout | null = null;

  // Initialize memory monitoring
  public static initialize() {
    if (!this.memoryCheckInterval) {
      this.memoryCheckInterval = setInterval(() => {
        this.performMemoryCheck();
      }, 30000); // Check every 30 seconds
    }
  }

  // Clean up resources on shutdown
  public static cleanup() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.clearCache();
    this.requestQueue.clear();
  }

  private static performMemoryCheck() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    
    // If heap usage is over 150MB, aggressively clean cache
    if (heapUsedMB > 150) {
      console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB. Cleaning cache aggressively.`);
      this.aggressiveCleanCache();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    // Log memory stats periodically (every 5 minutes)
    if (Math.random() < 0.1) { // 10% chance
      console.log(`Memory usage: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB, Cache size: ${this.candleCache.size}`);
    }
  }

  public static async fetchCandlestickData(
    market: string,
    tickInterval: string,
    limit: number = 100,
    endTime?: number
  ): Promise<Candle[]> {
    const cacheKey = `${market}-${tickInterval}-${limit}-${endTime || 'latest'}`;
    
    // Check for existing request for the same data
    const existingRequest = this.requestQueue.get(cacheKey);
    if (existingRequest && (Date.now() - existingRequest.timestamp < 5000)) {
      console.log(`Using existing request for ${cacheKey}`);
      try {
        return await existingRequest.promise;
      } catch (error) {
        // If existing request fails, remove it and continue with new request
        this.requestQueue.delete(cacheKey);
      }
    }

    // Check cache
    const cached = this.candleCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      // Update access info for LRU
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      return [...cached.data]; // Return copy to prevent mutation
    }

    // Clean cache proactively
    this.cleanCache();

    const requestPromise = this.performFetch(market, tickInterval, limit, endTime, cacheKey);
    
    // Add to request queue with automatic cleanup
    this.requestQueue.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up request queue
      this.requestQueue.delete(cacheKey);
      this.cleanRequestQueue();
    }
  }

  private static async performFetch(
    market: string,
    tickInterval: string,
    limit: number,
    endTime: number | undefined,
    cacheKey: string
  ): Promise<Candle[]> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRIES) {
      try {
        const url = `https://api.binance.com/api/v1/klines?symbol=${market}&interval=${tickInterval}&limit=${
          limit + 1
        }${endTime ? "&endTime=" + endTime : ""}`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            console.warn(`Rate limited, waiting ${waitTime}ms`);
            await delay(waitTime);
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = (await response.json()) as string[][];
        const candleData = convertStringToNumbers(rawData);
        
        // Only cache if we have space and data is valid
        if (this.candleCache.size < this.MAX_CACHE_SIZE && candleData.length > 0) {
          this.candleCache.set(cacheKey, {
            data: candleData,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now()
          });
        }
        
        return candleData;
        
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        if (attempt >= this.MAX_RETRIES) {
          console.error(`Failed to fetch candlestick data after ${this.MAX_RETRIES} retries: ${error.message}`);
          break;
        }
        
        const backoffDelay = this.BASE_RETRY_DELAY * Math.pow(1.5, attempt - 1);
        const jitter = Math.random() * 500;
        const totalDelay = Math.min(backoffDelay + jitter, 15000); // Max 15 seconds
        
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${totalDelay}ms`);
        await delay(totalDelay);
      }
    }

    throw new Error(`Failed to fetch candlestick data: ${lastError?.message}`);
  }

  private static cleanCache() {
    const now = Date.now();
    
    // Remove expired entries first
    for (const [key, value] of this.candleCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL * 1.5) {
        this.candleCache.delete(key);
      }
    }
    
    // If still over limit, use LRU eviction
    if (this.candleCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.candleCache.entries())
        .sort((a, b) => {
          // Sort by last accessed time and access count
          const aScore = a[1].lastAccessed + (a[1].accessCount * 1000);
          const bScore = b[1].lastAccessed + (b[1].accessCount * 1000);
          return aScore - bScore;
        });
      
      const toRemove = Math.ceil((this.candleCache.size - this.MAX_CACHE_SIZE) * 1.5); // Remove extra
      entries.slice(0, toRemove).forEach(([key]) => {
        this.candleCache.delete(key);
      });
    }
  }

  private static aggressiveCleanCache() {
    // Keep only the most recently accessed entries
    const keepCount = Math.floor(this.MAX_CACHE_SIZE / 2);
    
    if (this.candleCache.size > keepCount) {
      const entries = Array.from(this.candleCache.entries())
        .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
      
      // Clear all and re-add only the most recent ones
      this.candleCache.clear();
      entries.slice(0, keepCount).forEach(([key, value]) => {
        this.candleCache.set(key, value);
      });
    }
  }

  private static cleanRequestQueue() {
    const now = Date.now();
    for (const [key, request] of this.requestQueue.entries()) {
      if (now - request.timestamp > 30000) { // 30 seconds old
        this.requestQueue.delete(key);
      }
    }
  }

  public static clearCache() {
    this.candleCache.clear();
    this.requestQueue.clear();
    // Suppress log during tests to reduce memory usage
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.log('MarketService cache cleared');
    }
  }

  // Get cache statistics for monitoring
  public static getCacheStats() {
    return {
      cacheSize: this.candleCache.size,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.size,
      memoryUsage: process.memoryUsage(),
    };
  }
}
