import { Candle } from "./candle.model";

export interface TradingStrategy {
  execute(candles: Candle[], superTrends: number[]): string;
}
