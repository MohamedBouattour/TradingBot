import { IndicatorsSync } from "@ixjb94/indicators";
import { supertrend } from "supertrend";
import { PRICE_PRECISION, SHORT_MA, TARGET_ROI } from "../../constants";
import { getMACDHistogramColorLabels } from "../../core/utils";
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
    const superTrends = supertrend({
      initialArray: candles,
      multiplier: 3,
      period: 10,
    });

    const [macd, signal, hist] = ta.macd(
      candles.map((candle) => candle.close),
      12,
      26,
      9
    );

    const histColors = getMACDHistogramColorLabels(hist);
    const previusColors = histColors.slice(
      histColors.length - 1,
      histColors.length - 4
    );

    const rsi = ta.rsi(
      candles.map((candle) => candle.close),
      14
    );

    const smas = ta.sma(
      candles.map((candle) => candle.close),
      SHORT_MA
    );

    const lastCandle = candles.at(-1)!;
    const previousCandle = candles.at(-2)!;

    const lastSuperTrend = superTrends.at(-1)!;
    const previousSuperTrend = superTrends.at(-2)!;
    const riskRewardRatio = 2;
    if (
      lastCandle.close > lastSuperTrend &&
      previousCandle.close < previousSuperTrend &&
      previusColors.every((item) => item?.includes("dark-green")) &&
      macd.at(-1)! > signal.at(-1)! &&
      macd.at(-2)! > signal.at(-2)! &&
      macd.at(-3)! > signal.at(-3)! &&
      signal.at(-1)! < 0 &&
      rsi.at(-1)! >= 55
    ) {
      const risking = Math.min(
        0.02,
        (lastCandle.close - lastSuperTrend) / lastSuperTrend
      );
      const roi = Math.min(TARGET_ROI, risking * riskRewardRatio + 1);
      return {
        label: Operation.BUY,
        tp: parseFloat((candles.at(-1)!.close * roi).toFixed(PRICE_PRECISION)),
        sl: parseFloat(
          (candles.at(-1)!.close * (1 - risking)).toFixed(PRICE_PRECISION)
        ),
        roi: roi,
        riskRewardRatio: riskRewardRatio,
        risking,
      };
    } else if (
      previousCandle.close > previousSuperTrend &&
      lastCandle.close < lastSuperTrend
    ) {
      return {
        label: Operation.SELL,
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }
    return { label: "", tp: 0, sl: 0, roi: 0, riskRewardRatio: 0, risking: 0 };
  }
}
