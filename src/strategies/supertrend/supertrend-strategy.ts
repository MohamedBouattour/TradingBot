import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";

export class SuperTrendStrategy implements TradingStrategy {
  execute(candles: Candle[], superTrends: number[]): string {
    const lastCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];

    const lastSuperTrend = superTrends[superTrends.length - 1];
    const previousSuperTrend = superTrends[superTrends.length - 2];

    if (
      previousCandle.close < previousSuperTrend &&
      lastCandle.close > lastSuperTrend
    ) {
      return Operation.BUY;
    } else if (
      previousCandle.close > previousSuperTrend &&
      lastCandle.close < lastSuperTrend
    ) {
      return Operation.SELL;
    }
    return "";
  }
}
