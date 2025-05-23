import { convertStringToNumbers, delay } from "../core/utils";
import { Candle } from "../models/candle.model";

export class MarketService {
  public static async fetchCandlestickData(
    market: string,
    tickInterval: string,
    limit: number = 100,
    endTime?: number
  ): Promise<Candle[]> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v1/klines?symbol=${market}&interval=${tickInterval}&limit=${
            limit + 1
          }${endTime ? "&endTime=" + endTime : ""}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const rawData = (await response.json()) as string[][];
        return convertStringToNumbers(rawData);
      } catch (error: any) {
        attempt++;
        console.warn(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt >= maxRetries) {
          throw new Error("Failed to fetch candlestick data after 3 retries.");
        }
        await delay(5000);
      }
    }

    throw new Error("Unexpected error in fetchCandlestickData loop.");
  }
}
