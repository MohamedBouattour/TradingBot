import { IndicatorsSync } from "@ixjb94/indicators";
import { PRICE_PRECISION, TARGET_ROI } from "../../constants";
import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";

const ta = new IndicatorsSync();

export class RSIStrategy implements TradingStrategy {
  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    // Validate we have enough candles for RSI (need at least 15)
    if (candles.length < 15) {
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
    const rsi = ta.rsi(
      candles.map((c) => c.close),
      14
    );

    // Validate RSI array has enough values
    if (!rsi || rsi.length < 2) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    if (rsi.at(-1)! > 30 && rsi.at(-2)! < 30) {
      return {
        label: Operation.BUY,
        tp: parseFloat(
          (lastCandle.close * TARGET_ROI).toFixed(PRICE_PRECISION)
        ),
        sl: parseFloat((lastCandle.close * (1 - 0)).toFixed(PRICE_PRECISION)),
        roi: TARGET_ROI,
        risking: 0,
        riskRewardRatio: 0,
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
