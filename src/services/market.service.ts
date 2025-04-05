import { Candle } from "../models/candle.model";
import { convertStringToNumbers } from "../core/utils";
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
    const response = await fetch(
      `https://api.binance.com/api/v1/klines?symbol=${this.market}&interval=${
        this.tickInterval
      }&limit=${this.limit + 1}`
    );
    const rawData = (await response.json()) as string[][];
    return convertStringToNumbers(rawData).filter(
      (candle: Candle) =>
        candle.closeTime > Date.now() - 1000 * 60 * 60 * 24 * 7
    );
  }
}
