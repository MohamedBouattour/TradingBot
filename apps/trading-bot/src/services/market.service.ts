import { Candle } from "../models/candle.model";
import { convertStringToNumbers, delay } from "../core/utils";
import { TickInterval } from "../models/tick-interval.model";

export class MarketService {
  private market: string;
  private tickInterval: string;
  private limit: number;

  constructor(market: string, tickInterval: TickInterval, limit: number) {
    this.market = market;
    this.tickInterval = tickInterval.getInterval();
    this.limit = limit;
  }

  async fetchCandlestickData(): Promise<Candle[]> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v1/klines?symbol=${
            this.market
          }&interval=${this.tickInterval}&limit=${this.limit + 1}`
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
