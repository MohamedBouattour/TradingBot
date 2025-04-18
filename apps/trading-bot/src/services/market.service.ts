import { Candle } from "../models/candle.model";
import { convertStringToNumbers, delay } from "../core/utils";
import fetch from "node-fetch";
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
    let trying = 0;
    while (true || trying <= 3) {
      trying++;
      try {
        const response = await fetch(
          `https://api.binance.com/api/v1/klines?symbol=${
            this.market
          }&interval=${this.tickInterval}&limit=${this.limit + 1}`
        );
        const rawData = ((await response.json()) as string[][]);
        return convertStringToNumbers(rawData);
      } catch (error: any) {
        await delay(5000);
        continue;
      }
    }
  }
}
