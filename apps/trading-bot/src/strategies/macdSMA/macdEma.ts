import {
  LONG_MA,
  PRICE_PRECISION,
  SHORT_MA,
  TARGET_ROI,
} from "../../constants";
import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";
import { IndicatorsSync } from "@ixjb94/indicators";
import { getMACDHistogramColorLabels } from "../../core/utils";
const ta = new IndicatorsSync();

export class MacdSMA implements TradingStrategy {
  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    const currentCandle = candles.at(-1)!;
    const [macd, signal, hist] = ta.macd(
      candles.map((candle) => candle.close),
      12,
      26,
      9
    );

    const emas = ta.ema(
      candles.map((candle) => candle.close),
      LONG_MA
    );
    const histColors = getMACDHistogramColorLabels(hist);
    const swingLow = Math.min(...candles.map((candle) => candle.low).slice(-5));
    const rsis = ta.rsi(
      candles.map((candle) => candle.close),
      14
    );

    const volumes = candles.map((c) => c.volume);
    const averageVolume =
      volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
    if (
      macd.at(-1)! < 0 &&
      signal.at(-1)! < 0 &&
      macd.at(-1)! > signal.at(-1)! &&
      macd.at(-2)! < signal.at(-2)! &&
      histColors.at(-1)?.includes("dark-green") &&
      currentCandle.volume > averageVolume &&
      currentCandle.close < emas.at(-1)!
    ) {
      const riskRewardRatio = 2;
      const risking = Math.min(
        ((swingLow - candles!.at(-1)!.close) / candles!.at(-1)!.close) * 100
      );
      let sl = swingLow;
      const roi = Math.max(TARGET_ROI, (risking * -riskRewardRatio) / 100 + 1);
      const tp = candles!.at(-1)!.close * roi;
      return {
        label: Operation.BUY,
        tp: parseFloat(tp.toFixed(PRICE_PRECISION)),
        sl: parseFloat(sl.toFixed(PRICE_PRECISION)),
        roi,
        riskRewardRatio,
        risking,
      };
    }
    if (
      (rsis.at(-2)! > 70 && rsis.at(-1)! <= 70) ||
      (macd.at(-1)! > 0 &&
        signal.at(-1)! > 0 &&
        macd.at(-1)! < signal.at(-1)! &&
        macd.at(-2)! > signal.at(-2)!) ||
      currentCandle.close < emas.at(-1)!
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
}
