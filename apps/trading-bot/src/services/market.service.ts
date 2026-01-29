import { convertStringToNumbers, delay } from "../core/utils";
import { Candle } from "../models/candle.model";

export class MarketService {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 1500;

  public static async fetchCandlestickData(
    market: string,
    tickInterval: string,
    limit: number = 100,
    endTime?: number
  ): Promise<Candle[]> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRIES) {
      try {
        const url = `https://api.binance.com/api/v1/klines?symbol=${market}&interval=${tickInterval}&limit=${limit + 1}${endTime ? "&endTime=" + endTime : ""}`;

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
}
