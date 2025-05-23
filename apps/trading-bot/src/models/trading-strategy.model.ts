import { Candle } from "./candle.model";

export interface TradingStrategy {
  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  };
}
