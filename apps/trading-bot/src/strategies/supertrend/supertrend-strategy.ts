import { IndicatorsSync } from "@ixjb94/indicators";
import { supertrend } from "supertrend";
import { PRICE_PRECISION, TARGET_ROI } from "../../constants";
import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";

const ta = new IndicatorsSync();

export class SuperTrendStrategy implements TradingStrategy {
  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    // Validate we have enough candles (need at least 20 for SuperTrend)
    if (candles.length < 20) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    const superTrends = supertrend({
      initialArray: candles,
      multiplier: 3,
      period: 10,
    });

    // Validate supertrend array
    if (!superTrends || superTrends.length < 2) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    const lastCandle = candles.at(-1)!;
    const previousCandle = candles.at(-2)!;

    const lastSuperTrend = superTrends.at(-1)!;
    const previousSuperTrend = superTrends.at(-2)!;

    // Validate supertrend values are numbers
    if (typeof lastSuperTrend !== 'number' || typeof previousSuperTrend !== 'number' || 
        isNaN(lastSuperTrend) || isNaN(previousSuperTrend)) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    const resistanceLevels = this.getRecentResistanceLevels(candles);
    const isNearResistance = this.isTooCloseToResistance(
      lastCandle.close,
      resistanceLevels
    );

    const riskRewardRatio = 2;
    const risking = 0.01;
    const roi = TARGET_ROI;

    if (
      lastCandle.close > lastSuperTrend &&
      previousCandle.close < previousSuperTrend
    ) {
      return {
        label: Operation.BUY,
        tp: parseFloat((lastCandle.close * roi).toFixed(PRICE_PRECISION)),
        sl: parseFloat(
          (lastCandle.close * (1 - risking)).toFixed(PRICE_PRECISION)
        ),
        roi,
        riskRewardRatio,
        risking,
      };
    } else if (
      previousCandle.close > previousSuperTrend &&
      lastCandle.close < lastSuperTrend
    ) {
      return {
        //label: Operation.SELL,
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    return {
      label: "",
      tp: 0,
      sl: 0,
      roi: 0,
      riskRewardRatio: 0,
      risking: 0,
    };
  }
  private getRecentResistanceLevels(
    candles: Candle[],
    lookback: number = 15
  ): number {
    const resistanceLevels: number[] = [];
    for (let i = 2; i < candles.length - 2; i++) {
      const candle = candles[i];
      if (
        candle.high > candles[i - 1].high &&
        candle.high > candles[i - 2].high &&
        candle.high > candles[i + 1].high &&
        candle.high > candles[i + 2].high
      ) {
        resistanceLevels.push(candle.high);
      }
    }
    const recentLevels = resistanceLevels.slice(-lookback);
    if (recentLevels.length === 0) {
      return 0; // No resistance levels found
    }
    return (
      recentLevels.reduce((a, b) => a + b, 0) / recentLevels.length
    );
  }

  private isTooCloseToResistance(
    price: number,
    resistance: number,
    thresholdPercent = 1
  ): boolean {
    const distance = Math.abs((resistance - price) / price) * 100;
    return distance >= thresholdPercent;
  }
}
