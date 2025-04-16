import { TradingStrategy } from "../models/trading-strategy.model";

export class StrategyManager {
  private strategy: TradingStrategy;

  constructor(strategy: TradingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: TradingStrategy) {
    this.strategy = strategy;
  }

  executeStrategy(candles: any[], superTrends: number[]): string {
    return this.strategy.execute(candles, superTrends);
  }
}
