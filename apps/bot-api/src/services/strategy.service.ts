import { Injectable } from '@nestjs/common';
import { Candle } from './market.service';
// Import strategies from trading-bot
// Path: from apps/bot-api/src/services to apps/trading-bot/src
import { RSIStrategy } from '../../../trading-bot/src/strategies/rsi/rsi-strategy';
import { SuperTrendStrategy } from '../../../trading-bot/src/strategies/supertrend/supertrend-strategy';
import { MacdSMA } from '../../../trading-bot/src/strategies/macdSMA/macdEma';
import { BtcSpotStrategy } from '../../../trading-bot/src/strategies/btc-spot/btc-spot-strategy';
import { TrendlineBreakoutStrategy } from '../../../trading-bot/src/strategies/trendline-breakout/trendline-breakout-strategy';
import { TradingStrategy } from '../../../trading-bot/src/models/trading-strategy.model';

export interface StrategyResult {
  label: string;
  tp: number;
  roi: number;
}

@Injectable()
export class StrategyService {
  private strategyInstances: Map<string, TradingStrategy> = new Map();

  constructor() {
    // Initialize strategy instances
    this.strategyInstances.set('rsi', new RSIStrategy());
    this.strategyInstances.set('supertrend', new SuperTrendStrategy());
    this.strategyInstances.set('macdsma', new MacdSMA());
    this.strategyInstances.set('btc-spot', new BtcSpotStrategy());
    this.strategyInstances.set('trendline-breakout', new TrendlineBreakoutStrategy());
    // Note: Other strategies (emaCrossoverRsi, meanReversion, multiLevelConfirmation, rsiMacd) 
    // don't exist yet and will fall back to RSI with a warning
  }

  /**
   * Execute strategy based on strategy name
   * Uses the actual strategy implementations from trading-bot
   */
  executeStrategy(
    strategy: string,
    candles: Candle[],
  ): StrategyResult {
    const strategyName = strategy.toLowerCase();
    const strategyInstance = this.strategyInstances.get(strategyName);

    if (!strategyInstance) {
      // Warn if strategy doesn't exist - this is why all strategies give same results!
      console.warn(`Strategy '${strategyName}' not found. Available strategies: ${Array.from(this.strategyInstances.keys()).join(', ')}. Falling back to RSI.`);
      // Default to RSI if strategy not found
      const defaultStrategy = this.strategyInstances.get('rsi');
      if (defaultStrategy) {
        return this.convertResult(defaultStrategy.execute(candles));
      }
      return { label: '', tp: 0, roi: 0 };
    }

    try {
      // Execute the strategy - it returns the full TradingStrategy result
      const result = strategyInstance.execute(candles);
      // Convert to StrategyResult (for spot trading, we ignore SL)
      return this.convertResult(result);
    } catch (error: any) {
      console.error(`Strategy ${strategyName} error:`, error.message, error.stack);
      return { label: '', tp: 0, roi: 0 };
    }
  }

  /**
   * Convert TradingStrategy result to StrategyResult
   * For spot trading, we only care about TP, not SL
   */
  private convertResult(result: {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  }): StrategyResult {
    return {
      label: result.label || '',
      tp: result.tp || 0,
      roi: result.roi || 0,
    };
  }
}
