import { TradingStrategy } from "../models/trading-strategy.model";

export class StrategyManager {
  private strategy: TradingStrategy;

  constructor(strategy: TradingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: TradingStrategy) {
    this.strategy = strategy;
  }

  executeStrategy(candles: any[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    return this.strategy.execute(candles);
  }
}
