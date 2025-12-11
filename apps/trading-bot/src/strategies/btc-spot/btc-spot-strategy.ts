import { IndicatorsSync } from "@ixjb94/indicators";
import { PRICE_PRECISION, TARGET_ROI } from "../../constants";
import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";
import { getMACDHistogramColorLabels } from "../../core/utils";

const ta = new IndicatorsSync();

/**
 * BTC Spot Strategy - Optimized for Bitcoin spot trading
 * 
 * This strategy combines multiple technical indicators for high-probability entries:
 * - EMA Crossovers (9/21 for fast signals, 50/200 for trend confirmation)
 * - RSI for momentum and oversold conditions
 * - MACD for trend confirmation
 * - Volume analysis for entry validation
 * - Support/Resistance levels for risk management
 * - ATR-based dynamic target prices
 */
export class BtcSpotStrategy implements TradingStrategy {
  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    // Need at least 50 candles for basic indicators (EMA50 is the longest we'll use)
    if (candles.length < 50) {
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
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    // Calculate EMAs - use shorter periods for more signals
    const ema9 = ta.ema(closes, 9);
    const ema21 = ta.ema(closes, 21);
    const ema50 = ta.ema(closes, 50);
    // EMA200 is optional - only use if we have enough data
    const ema200 = candles.length >= 200 ? ta.ema(closes, 200) : null;

    // Validate required EMA arrays
    if (!ema9 || !ema21 || !ema50 || 
        ema9.length < 2 || ema21.length < 2 || ema50.length < 2) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    // Calculate RSI
    const rsi = ta.rsi(closes, 14);
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

    // Calculate MACD
    const [macd, signal, hist] = ta.macd(closes, 12, 26, 9);
    if (!macd || !signal || !hist || macd.length < 2 || signal.length < 2 || hist.length < 2) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    // Calculate ATR for dynamic stop loss and target
    const atr = this.calculateATR(candles, 14);
    if (!atr || atr.length === 0) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    // Get current indicator values
    const currentEma9 = ema9.at(-1)!;
    const currentEma21 = ema21.at(-1)!;
    const currentEma50 = ema50.at(-1)!;
    const currentEma200 = ema200 && ema200.length >= 2 ? ema200.at(-1)! : null;
    const prevEma9 = ema9.at(-2)!;
    const prevEma21 = ema21.at(-2)!;
    const currentRsi = rsi.at(-1)!;
    const prevRsi = rsi.at(-2)!;
    const currentMacd = macd.at(-1)!;
    const currentSignal = signal.at(-1)!;
    const prevMacd = macd.at(-2)!;
    const prevSignal = signal.at(-2)!;
    const currentHist = hist.at(-1)!;
    const prevHist = hist.at(-2)!;
    const currentATR = atr.at(-1)!;

    // Volume analysis - compare current volume to average
    const avgVolume20 = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
    const volumeRatio = lastCandle.volume / avgVolume20;

    // Support and Resistance levels
    const supportLevel = this.findSupportLevel(candles);
    const resistanceLevel = this.findResistanceLevel(candles);

    // Scoring system: Need at least 4 out of 6 conditions for BUY signal
    let score = 0;
    const maxScore = 6;

    // 1. EMA Crossover: Fast EMA crosses above slow EMA (bullish) - REQUIRED
    const emaBullishCrossover = prevEma9 <= prevEma21 && currentEma9 > currentEma21;
    if (emaBullishCrossover) score++;
    
    // 2. Trend confirmation: Price above key EMAs (uptrend)
    const isUptrend = currentEma200 
      ? (lastCandle.close > currentEma50 && currentEma50 > currentEma200)
      : (lastCandle.close > currentEma50 && currentEma9 > currentEma21); // Fallback if no EMA200
    if (isUptrend) score++;
    
    // 3. RSI: Oversold recovery or bullish momentum (more lenient)
    const rsiBullish = (prevRsi < 45 && currentRsi > 45) || // Oversold recovery
                       (currentRsi > 45 && currentRsi < 75); // Bullish but not overbought
    if (rsiBullish) score++;
    
    // 4. MACD: Bullish crossover or positive momentum
    const macdBullish = (prevMacd <= prevSignal && currentMacd > currentSignal) || // Crossover
                        (currentMacd > 0 && currentHist > prevHist) || // Positive momentum
                        (currentMacd > currentSignal && currentHist > 0); // Above signal line
    if (macdBullish) score++;
    
    // 5. Volume confirmation: Above average volume (more lenient)
    const volumeConfirmation = volumeRatio > 0.9; // Reduced from 1.1 to 0.9
    if (volumeConfirmation) score++;
    
    // 6. Price action: Not too close to resistance (more lenient)
    const distanceToResistance = resistanceLevel > 0 
      ? ((resistanceLevel - lastCandle.close) / lastCandle.close) * 100 
      : 5; // Default 5% if no resistance found
    const notNearResistance = distanceToResistance > 1; // Reduced from 2% to 1%
    if (notNearResistance) score++;

    // Need at least 4 out of 6 conditions (66% score) AND EMA crossover must be true
    // This makes the strategy more flexible while still requiring the key signal
    if (score >= 4 && emaBullishCrossover) {
      
      // Dynamic target price based on ATR and resistance
      const atrMultiplier = 2.0; // Use 2.0x ATR for target (more conservative)
      const atrTarget = lastCandle.close + (currentATR * atrMultiplier);
      
      // Use resistance level if it's closer than ATR target
      let targetPrice = resistanceLevel > 0 && resistanceLevel < atrTarget 
        ? resistanceLevel * 0.985 // 1.5% below resistance
        : atrTarget;
      
      // Ensure minimum ROI (use TARGET_ROI from constants)
      const minROI = TARGET_ROI;
      const minTarget = lastCandle.close * minROI;
      if (targetPrice < minTarget) {
        targetPrice = minTarget;
      }
      
      // Cap maximum target to avoid unrealistic targets (max 5% above entry)
      const maxTarget = lastCandle.close * 1.05;
      if (targetPrice > maxTarget) {
        targetPrice = maxTarget;
      }

      // Dynamic stop loss based on support or ATR
      let stopLoss = supportLevel > 0 && supportLevel < lastCandle.close
        ? supportLevel * 0.995 // 0.5% below support
        : lastCandle.close - (currentATR * 1.2); // 1.2x ATR below entry
      
      // Ensure stop loss is reasonable (not more than 3% below entry for spot trading)
      const maxRisk = lastCandle.close * 0.97;
      if (stopLoss < maxRisk) {
        stopLoss = maxRisk;
      }
      
      // Ensure stop loss is below entry price
      if (stopLoss >= lastCandle.close) {
        stopLoss = lastCandle.close * 0.98; // Default 2% below entry
      }

      const risking = ((lastCandle.close - stopLoss) / lastCandle.close) * 100;
      const reward = ((targetPrice - lastCandle.close) / lastCandle.close) * 100;
      const riskRewardRatio = reward > 0 && risking > 0 ? reward / risking : 2;
      const roi = targetPrice / lastCandle.close;

      return {
        label: Operation.BUY,
        tp: parseFloat(targetPrice.toFixed(PRICE_PRECISION)),
        sl: parseFloat(stopLoss.toFixed(PRICE_PRECISION)),
        roi,
        riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
        risking: parseFloat(risking.toFixed(2)),
      };
    }

    // SELL signal conditions (for spot, we typically just exit on TP, but can add exit signals)
    // For now, we'll keep it simple and only generate BUY signals
    // Exit is handled by TP hit in the backtest

    return {
      label: "",
      tp: 0,
      sl: 0,
      roi: 0,
      riskRewardRatio: 0,
      risking: 0,
    };
  }

  /**
   * Calculate Average True Range (ATR) for volatility-based stops and targets
   */
  private calculateATR(candles: Candle[], period: number): number[] {
    if (candles.length < period + 1) {
      return [];
    }

    const trueRanges: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trueRanges.push(tr);
    }

    // Calculate ATR as SMA of true ranges
    const atr: number[] = [];
    for (let i = period - 1; i < trueRanges.length; i++) {
      const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    }

    return atr;
  }

  /**
   * Find support level (local minimums)
   */
  private findSupportLevel(candles: Candle[], lookback: number = 20): number {
    if (candles.length < lookback) {
      return 0;
    }

    const recentCandles = candles.slice(-lookback);
    const lows = recentCandles.map(c => c.low);
    
    // Find the lowest low in recent period
    const support = Math.min(...lows);
    
    // Validate it's a meaningful support (within reasonable range - not too far below)
    const currentPrice = candles.at(-1)!.close;
    // Support should be below current price but not more than 15% below (too far = not relevant)
    if (support < currentPrice && support > currentPrice * 0.85) {
      return support;
    }
    
    return 0;
  }

  /**
   * Find resistance level (local maximums)
   */
  private findResistanceLevel(candles: Candle[], lookback: number = 20): number {
    if (candles.length < lookback) {
      return 0;
    }

    const recentCandles = candles.slice(-lookback);
    const highs = recentCandles.map(c => c.high);
    
    // Find the highest high in recent period
    const resistance = Math.max(...highs);
    
    // Validate it's a meaningful resistance (above current price, reasonable for target - up to 8% above)
    const currentPrice = candles.at(-1)!.close;
    if (resistance > currentPrice && resistance <= currentPrice * 1.08) {
      return resistance;
    }
    
    return 0;
  }
}

