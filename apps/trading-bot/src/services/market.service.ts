import { convertStringToNumbers, delay } from "../core/utils";
import { Candle } from "../models/candle.model";

export class MarketService {
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_RETRY_DELAY = 2000; // 2 seconds
  private static candleCache = new Map<string, { data: Candle[], timestamp: number }>();
  private static readonly CACHE_TTL = 30000; // 30 seconds cache
  private static readonly MAX_CACHE_SIZE = 10; // Limit cache size to prevent memory growth

  private static async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TradingBot/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  public static async fetchCandlestickData(
    market: string,
    tickInterval: string,
    limit: number = 100,
    endTime?: number
  ): Promise<Candle[]> {
    // Create cache key
    const cacheKey = `${market}-${tickInterval}-${limit}-${endTime || 'latest'}`;
    const cached = this.candleCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    // Clean cache if it's getting too large
    if (this.candleCache.size >= this.MAX_CACHE_SIZE) {
      this.cleanCache();
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRIES) {
      try {
        const url = `https://api.binance.com/api/v1/klines?symbol=${market}&interval=${tickInterval}&limit=${
          limit + 1
        }${endTime ? "&endTime=" + endTime : ""}`;

        const response = await this.rateLimitedFetch(url);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit hit, wait longer
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            console.warn(`Rate limited, waiting ${waitTime}ms`);
            await delay(waitTime);
            continue;
          }
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const rawData = (await response.json()) as string[][];
        const candleData = convertStringToNumbers(rawData);
        
        // Cache the result with size limit check
        if (this.candleCache.size < this.MAX_CACHE_SIZE) {
          this.candleCache.set(cacheKey, {
            data: candleData,
            timestamp: Date.now()
          });
        }
        
        // Clean old cache entries periodically (reduced frequency)
        if (Math.random() < 0.05) { // 5% chance instead of 10%
          this.cleanCache();
        }
        
        return candleData;
        
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        if (attempt >= this.MAX_RETRIES) {
          throw new Error(`Failed to fetch candlestick data after ${this.MAX_RETRIES} retries. Last error: ${error.message}`);
        }
        
        // Exponential backoff with jitter
        const backoffDelay = this.BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Add up to 1 second jitter
        const totalDelay = Math.min(backoffDelay + jitter, 30000); // Max 30 seconds
        
        console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${totalDelay}ms`);
        await delay(totalDelay);
      }
    }

    throw new Error(`Unexpected error in fetchCandlestickData loop. Last error: ${lastError?.message}`);
  }

  private static cleanCache() {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    // Collect expired entries
    for (const [key, value] of this.candleCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL * 2) { // Remove entries older than 2x TTL
        entriesToDelete.push(key);
      }
    }
    
    // Delete expired entries
    entriesToDelete.forEach(key => this.candleCache.delete(key));
    
    // If cache is still too large, remove oldest entries
    if (this.candleCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.candleCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.candleCache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.candleCache.delete(key));
    }
  }

  public static clearCache() {
    this.candleCache.clear();
  }
}
