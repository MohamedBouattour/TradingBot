import { IndicatorsSync } from "@ixjb94/indicators";
import { PRICE_PRECISION, TARGET_ROI } from "../../constants";
import { Candle } from "../../models/candle.model";
import { Operation } from "../../models/operation.enum";
import { TradingStrategy } from "../../models/trading-strategy.model";

const ta = new IndicatorsSync();

/**
 * Trendlines with Breaks Strategy - Based on LuxAlgo indicator
 * 
 * This strategy detects pivot highs and lows, draws trendlines with slopes,
 * and generates signals when price breaks these trendlines.
 * 
 * Features:
 * - Pivot high/low detection
 * - Dynamic trendline slope calculation (ATR, Stdev, or Linear Regression)
 * - Breakout detection (upward and downward)
 * - Buy signals on upward breakouts (price breaks above lower trendline)
 */
export class TrendlineBreakoutStrategy implements TradingStrategy {
  private length: number = 14; // Swing detection lookback
  private mult: number = 1.0; // Slope multiplier
  private calcMethod: 'atr' | 'stdev' | 'linreg' = 'atr'; // Slope calculation method

  constructor(length: number = 14, mult: number = 1.0, calcMethod: 'atr' | 'stdev' | 'linreg' = 'atr') {
    this.length = length;
    this.mult = mult;
    this.calcMethod = calcMethod;
  }

  execute(candles: Candle[]): {
    label: string;
    tp: number;
    sl: number;
    roi: number;
    riskRewardRatio: number;
    risking: number;
  } {
    // Need at least 2*length candles for pivot detection
    if (candles.length < this.length * 2 + 1) {
      return {
        label: "",
        tp: 0,
        sl: 0,
        roi: 0,
        riskRewardRatio: 0,
        risking: 0,
      };
    }

    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const lastCandle = candles.at(-1)!;

    // Detect pivot highs and lows
    const pivotHighs = this.detectPivotHighs(highs, this.length);
    const pivotLows = this.detectPivotLows(lows, this.length);

    // Calculate trendlines with slopes stored at each bar
    const { upperTrendline, lowerTrendline, slopePhHistory, slopePlHistory } =
      this.calculateTrendlines(candles, pivotHighs, pivotLows, this.length, this.mult, this.calcMethod);

    // Track upos/dnos state across ALL bars (matching Pine Script := operator behavior)
    // Pine Script := preserves state from previous bar unless explicitly changed
    const uposHistory: number[] = new Array(candles.length).fill(0);
    const dnosHistory: number[] = new Array(candles.length).fill(0);

    for (let i = 0; i < candles.length; i++) {
      const ph = pivotHighs[i];
      const pl = pivotLows[i];
      const closePrice = closes[i];

      // Get the current slope values (stored when pivot was found)
      const slopePh = slopePhHistory[i];
      const slopePl = slopePlHistory[i];

      // Calculate trendline values at this bar
      // Pine Script: upper - slope_ph * length (for comparison, not display)
      const upperTrendlineValue = upperTrendline[i] - (slopePh * this.length);
      const lowerTrendlineValue = lowerTrendline[i] + (slopePl * this.length);

      // Get previous state (for := operator behavior)
      const prevUpos = i > 0 ? uposHistory[i - 1] : 0;
      const prevDnos = i > 0 ? dnosHistory[i - 1] : 0;

      // Pine Script logic for upos:
      // upos := ph ? 0 : close > upper - slope_ph * length ? 1 : upos
      if (ph > 0) {
        uposHistory[i] = 0; // Reset on pivot high
      } else if (closePrice > upperTrendlineValue) {
        uposHistory[i] = 1; // Set to 1 when breakout
      } else {
        uposHistory[i] = prevUpos; // Maintain previous state
      }

      // Pine Script logic for dnos:
      // dnos := pl ? 0 : close < lower + slope_pl * length ? 1 : dnos
      if (pl > 0) {
        dnosHistory[i] = 0; // Reset on pivot low
      } else if (closePrice < lowerTrendlineValue) {
        dnosHistory[i] = 1; // Set to 1 when breakout
      } else {
        dnosHistory[i] = prevDnos; // Maintain previous state
      }
    }

    // Get final upos/dnos values for signal detection
    const lastIdx = candles.length - 1;
    const upos = uposHistory[lastIdx];
    const prevUpos = lastIdx > 0 ? uposHistory[lastIdx - 1] : 0;
    const dnos = dnosHistory[lastIdx];
    const prevDnos = lastIdx > 0 ? dnosHistory[lastIdx - 1] : 0;

    // Breakout detection (matching Pine Script plotshape conditions)
    // "Upper Break" (B label up): upos > upos[1] - price breaks ABOVE the UPPER (descending) trendline = BULLISH
    // "Lower Break" (B label down): dnos > dnos[1] - price breaks BELOW the LOWER (ascending) trendline = BEARISH
    const upwardBreakout = upos > prevUpos; // Price breaks above upper trendline = BUY signal
    const downwardBreakout = dnos > prevDnos; // Price breaks below lower trendline = potential exit

    // Calculate RSI for filters
    const rsi = ta.rsi(closes, 14);
    const currentRsi = rsi && rsi.length > 0 ? rsi[rsi.length - 1] : 50;

    // 1. Trend Confirmation: EMA 200
    const ema200 = ta.ema(closes, 200);
    const currentEma200 = ema200 && ema200.length > 0 ? ema200[ema200.length - 1] : 0;
    const isUptrend = lastCandle.close > currentEma200;

    // 2. Volume Confirmation: Volume > SMA 20
    const volumes = candles.map(c => c.volume);
    const volSma = ta.sma(volumes, 20);
    const currentVolSma = volSma && volSma.length > 0 ? volSma[volSma.length - 1] : 0;
    const isHighVolume = lastCandle.volume > currentVolSma;

    // 3. Resistance Confirmation: Breakout above recent Pivot High
    // Find the last non-zero pivot high (excluding the current bar potentially)
    // We look back from the previous bar to find a confirmed pivot
    let lastPivotHigh = 0;
    for (let i = pivotHighs.length - 2; i >= 0; i--) {
      if (pivotHighs[i] > 0) {
        lastPivotHigh = pivotHighs[i];
        break;
      }
    }

    // Trigger: Close > Pivot High AND Prev Close <= Pivot High (Horizontal Cross)
    const prevClose = closes[closes.length - 2];
    const horizontalBreakoutTrigger = lastPivotHigh > 0 ? (lastCandle.close > lastPivotHigh && prevClose <= lastPivotHigh) : false;

    // Diagonal State: Are we above the trendline?
    const isAboveTrendline = upos === 1;

    // Generate BUY signal on Horizontal Breakout confirmed by Trendline, Trend, and Volume
    // Removed RSI < 70 to allow heavy momentum
    if (horizontalBreakoutTrigger && isAboveTrendline && isUptrend && isHighVolume) {
      // Calculate target price based on ATR or fixed ROI
      const atr = this.calculateATR(candles, 14);
      const currentATR = atr.length > 0 ? atr[atr.length - 1] : 0;

      // Use ATR-based target or minimum ROI
      const atrTarget = lastCandle.close + (currentATR * 2.0);
      const minTarget = lastCandle.close * TARGET_ROI;
      const targetPrice = Math.max(atrTarget, minTarget);

      // Stop loss below the lower trendline or recent low
      const recentLow = Math.min(...lows.slice(-this.length));
      const currentLowerValue = lowerTrendline[lowerTrendline.length - 1];
      const stopLoss = Math.min(currentLowerValue * 0.995, recentLow * 0.99);

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

    // Generate SELL signal on downward breakout (red B signal) or RSI overbought
    // Calculate RSI for overbought detection
    const prevRsi = rsi && rsi.length > 1 ? rsi[rsi.length - 2] : 50;

    // RSI overbought condition: RSI crosses above 70 or is above 70
    const rsiOverbought = currentRsi > 70;

    // SELL signal conditions:
    // 1. Downward breakout (red B signal) - dnos > dnos[1]
    // 2. RSI > 70 (overbought)
    if (downwardBreakout || rsiOverbought) {
      return {
        label: Operation.SELL,
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

  /**
   * Detect pivot highs
   */
  private detectPivotHighs(highs: number[], length: number): number[] {
    const pivots: number[] = [];

    for (let i = length; i < highs.length - length; i++) {
      let isPivot = true;
      const currentHigh = highs[i];

      // Check if it's higher than previous and next 'length' bars
      for (let j = 1; j <= length; j++) {
        if (highs[i - j] >= currentHigh || highs[i + j] >= currentHigh) {
          isPivot = false;
          break;
        }
      }

      pivots.push(isPivot ? currentHigh : 0);
    }

    // Pad with zeros to match original array length
    return new Array(length).fill(0).concat(pivots).concat(new Array(length).fill(0));
  }

  /**
   * Detect pivot lows
   */
  private detectPivotLows(lows: number[], length: number): number[] {
    const pivots: number[] = [];

    for (let i = length; i < lows.length - length; i++) {
      let isPivot = true;
      const currentLow = lows[i];

      // Check if it's lower than previous and next 'length' bars
      for (let j = 1; j <= length; j++) {
        if (lows[i - j] <= currentLow || lows[i + j] <= currentLow) {
          isPivot = false;
          break;
        }
      }

      pivots.push(isPivot ? currentLow : 0);
    }

    // Pad with zeros to match original array length
    return new Array(length).fill(0).concat(pivots).concat(new Array(length).fill(0));
  }

  /**
   * Calculate slope based on selected method
   */
  private calculateSlope(
    candles: Candle[],
    length: number,
    mult: number,
    method: 'atr' | 'stdev' | 'linreg'
  ): number {
    const closes = candles.map((c) => c.close);

    switch (method) {
      case 'atr':
        const atr = this.calculateATR(candles, length);
        const currentATR = atr.length > 0 ? atr[atr.length - 1] : 0;
        return (currentATR / length) * mult;

      case 'stdev':
        // Calculate standard deviation manually
        const recentCloses = closes.slice(-length);
        const mean = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
        const variance = recentCloses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentCloses.length;
        const stdev = Math.sqrt(variance);
        return (stdev / length) * mult;

      case 'linreg':
        // Linear regression slope calculation
        const n = candles.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = closes;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return Math.abs(slope) * mult;

      default:
        return 0;
    }
  }

  /**
   * Calculate trendlines from pivot points
   * Returns slope history arrays to match Pine Script's bar-by-bar slope storage
   */
  private calculateTrendlines(
    candles: Candle[],
    pivotHighs: number[],
    pivotLows: number[],
    length: number,
    mult: number,
    calcMethod: 'atr' | 'stdev' | 'linreg'
  ): {
    upperTrendline: number[];
    lowerTrendline: number[];
    slopePhHistory: number[];
    slopePlHistory: number[];
  } {
    const upperTrendline: number[] = [];
    const lowerTrendline: number[] = [];
    const slopePhHistory: number[] = []; // slope_ph at each bar
    const slopePlHistory: number[] = []; // slope_pl at each bar
    let currentSlopePh = 0;
    let currentSlopePl = 0;
    let currentUpper = 0;
    let currentLower = 0;

    for (let i = 0; i < candles.length; i++) {
      const ph = pivotHighs[i];
      const pl = pivotLows[i];

      // Calculate current slope (recalculate each bar for accuracy)
      // Pine Script: slope = ta.atr(length) / length * mult
      const currentSlope = this.calculateSlope(
        candles.slice(0, i + 1),
        length,
        mult,
        calcMethod
      );

      // Update upper trendline and slope_ph
      // Pine Script: slope_ph := ph ? slope : slope_ph
      if (ph > 0) {
        // New pivot high found, reset trendline and store slope
        currentUpper = ph;
        currentSlopePh = currentSlope; // Store slope when pivot found
        upperTrendline.push(ph);
      } else {
        // Extend trendline with stored slope
        // Pine Script: upper := ph ? ph : upper - slope_ph
        if (currentUpper > 0) {
          currentUpper = currentUpper - currentSlopePh;
          upperTrendline.push(currentUpper);
        } else {
          // No trendline yet, use current high
          currentUpper = candles[i].high;
          upperTrendline.push(currentUpper);
        }
      }
      slopePhHistory.push(currentSlopePh);

      // Update lower trendline and slope_pl
      // Pine Script: slope_pl := pl ? slope : slope_pl
      if (pl > 0) {
        // New pivot low found, reset trendline and store slope
        currentLower = pl;
        currentSlopePl = currentSlope; // Store slope when pivot found
        lowerTrendline.push(pl);
      } else {
        // Extend trendline with stored slope
        // Pine Script: lower := pl ? pl : lower + slope_pl
        if (currentLower > 0) {
          currentLower = currentLower + currentSlopePl;
          lowerTrendline.push(currentLower);
        } else {
          // No trendline yet, use current low
          currentLower = candles[i].low;
          lowerTrendline.push(currentLower);
        }
      }
      slopePlHistory.push(currentSlopePl);
    }

    return { upperTrendline, lowerTrendline, slopePhHistory, slopePlHistory };
  }

  /**
   * Calculate Average True Range (ATR)
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
}

