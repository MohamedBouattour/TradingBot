import { Injectable } from '@nestjs/common';

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: string;
  assetVolume: number;
  trades: number;
  buyBaseVolume: number;
  buyAssetVolume: number;
  ignored: string;
}

@Injectable()
export class MarketService {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 1500;
  private static readonly REQUEST_TIMEOUT = 8000;

  /**
   * Convert Binance klines response to Candle array
   */
  private convertStringToNumbers(candles: string[][]): Candle[] {
    return candles.map((candle: string[]) => {
      const [
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
      ] = candle;

      return {
        time: new Date(Number(time)).toISOString(),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
        closeTime: new Date(Number(closeTime)).toISOString(),
        assetVolume: Number(assetVolume),
        trades: Number(trades),
        buyBaseVolume: Number(buyBaseVolume),
        buyAssetVolume: Number(buyAssetVolume),
        ignored,
      } as Candle;
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch candlestick data from Binance API
   */
  async fetchCandlestickData(
    market: string,
    tickInterval: string,
    limit: number = 100,
    endTime?: number,
  ): Promise<Candle[]> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < MarketService.MAX_RETRIES) {
      try {
        const url = `https://api.binance.com/api/v1/klines?symbol=${market}&interval=${tickInterval}&limit=${
          limit + 1
        }${endTime ? '&endTime=' + endTime : ''}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MarketService.REQUEST_TIMEOUT);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            console.warn(`Rate limited, waiting ${waitTime}ms`);
            await this.delay(waitTime);
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = (await response.json()) as string[][];
        const candleData = this.convertStringToNumbers(rawData);

        return candleData;
      } catch (error: any) {
        lastError = error;
        attempt++;

        if (attempt >= MarketService.MAX_RETRIES) {
          console.error(
            `Failed to fetch candlestick data after ${MarketService.MAX_RETRIES} retries: ${error.message}`,
          );
          break;
        }

        const backoffDelay =
          MarketService.BASE_RETRY_DELAY * Math.pow(1.5, attempt - 1);
        const jitter = Math.random() * 500;
        const totalDelay = Math.min(backoffDelay + jitter, 15000); // Max 15 seconds

        console.warn(
          `Attempt ${attempt} failed: ${error.message}. Retrying in ${totalDelay}ms`,
        );
        await this.delay(totalDelay);
      }
    }

    throw new Error(
      `Failed to fetch candlestick data: ${lastError?.message}`,
    );
  }

  /**
   * Fetch historical candlestick data for a date range
   * Fetches data in batches to get all historical data
   */
  async fetchHistoricalData(
    market: string,
    tickInterval: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Candle[]> {
    const allData: Candle[] = [];
    let lastTimestamp = endDate.getTime();
    const batchSize = 1000; // Binance max limit
    const intervalMs = this.getIntervalMs(tickInterval);
    const maxDataPoints = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / intervalMs,
    );

    console.log(
      `Fetching historical data for ${market} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );
    console.log(`Estimated data points: ${maxDataPoints}`);

    // Start from endDate and work backwards to startDate
    // This ensures we get the most recent data first
    while (lastTimestamp > startDate.getTime() && allData.length < maxDataPoints * 1.1) {
      try {
        const data = await this.fetchCandlestickData(
          market,
          tickInterval,
          batchSize,
          lastTimestamp,
        );

        if (data.length === 0) break;

        // Add to beginning of array (oldest first)
        allData.unshift(...data);

        // Get the timestamp of the oldest candle
        const oldestCandle = data[0];
        const oldestTimestamp = new Date(oldestCandle.time).getTime();

        if (oldestTimestamp >= lastTimestamp) {
          // No more data available
          break;
        }

        lastTimestamp = oldestTimestamp;

        // Rate limiting - be nice to Binance API
        await this.delay(1000);
      } catch (error: any) {
        console.error(`Error fetching historical data: ${error.message}`);
        throw error;
      }
    }
    
    // Ensure we have recent data - verify last candle is recent
    if (allData.length > 0) {
      const now = new Date();
      const lastCandle = allData[allData.length - 1];
      const lastCandleDate = new Date(lastCandle.time);
      const daysSinceLastCandle = (now.getTime() - lastCandleDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastCandle > 7) {
        console.warn(`Warning: Last candle is ${daysSinceLastCandle.toFixed(1)} days old. Data may be stale.`);
      }
    }

    // Filter to only include data within the date range
    let filteredData = allData.filter((candle) => {
      const candleTime = new Date(candle.time).getTime();
      return candleTime >= startDate.getTime() && candleTime <= endDate.getTime();
    });

    // Sort by time (oldest first)
    filteredData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // If we don't have enough recent data, try to fetch the latest candles
    if (filteredData.length > 0) {
      const lastCandle = filteredData[filteredData.length - 1];
      const lastCandleTime = new Date(lastCandle.time).getTime();
      const now = Date.now();
      const hoursSinceLastCandle = (now - lastCandleTime) / (1000 * 60 * 60);
      
      // If last candle is more than 2 hours old, try to get the latest data
      if (hoursSinceLastCandle > 2 && filteredData.length < maxDataPoints) {
        try {
          const latestData = await this.fetchCandlestickData(
            market,
            tickInterval,
            100, // Get last 100 candles
            undefined, // No endTime - get latest
          );
          
          // Merge with existing data, avoiding duplicates
          const existingTimes = new Set(filteredData.map(c => c.time));
          const newCandles = latestData.filter(c => 
            !existingTimes.has(c.time) && 
            new Date(c.time).getTime() >= startDate.getTime() &&
            new Date(c.time).getTime() <= endDate.getTime()
          );
          
          if (newCandles.length > 0) {
            filteredData = [...filteredData, ...newCandles];
            filteredData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            console.log(`Added ${newCandles.length} additional recent candles`);
          }
        } catch (error: any) {
          console.warn(`Could not fetch additional recent data: ${error.message}`);
        }
      }
    }

    console.log(`Fetched ${filteredData.length} candles for backtest`);
    if (filteredData.length > 0) {
      const lastCandle = filteredData[filteredData.length - 1];
      console.log(`Last candle price: $${lastCandle.close.toFixed(2)} at ${lastCandle.time}`);
    }
    return filteredData;
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: string): number {
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;

    switch (interval) {
      case '1m':
        return minute;
      case '5m':
        return 5 * minute;
      case '15m':
        return 15 * minute;
      case '30m':
        return 30 * minute;
      case '1h':
        return hour;
      case '2h':
        return 2 * hour;
      case '4h':
        return 4 * hour;
      case '6h':
        return 6 * hour;
      case '8h':
        return 8 * hour;
      case '12h':
        return 12 * hour;
      case '1d':
        return day;
      case '3d':
        return 3 * day;
      case '1w':
        return week;
      case '1M':
        return month;
      default:
        return hour; // Default to 1h
    }
  }

  /**
   * Convert asset symbol to Binance pair format (e.g., BTC -> BTCUSDT)
   */
  getPair(asset: string): string {
    return `${asset}USDT`;
  }
}

