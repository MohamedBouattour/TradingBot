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
    const prevCandle = candles.at(-2)!;

    // Detect pivot highs and lows
    const pivotHighs = this.detectPivotHighs(highs, this.length);
    const pivotLows = this.detectPivotLows(lows, this.length);

    // Calculate trendlines (slope is calculated dynamically within)
    const { upperTrendline, lowerTrendline, upperSlope, lowerSlope } = 
      this.calculateTrendlines(candles, pivotHighs, pivotLows, this.length, this.mult, this.calcMethod);

    // Get trendline base values and stored slopes
    const currentUpper = upperTrendline[upperTrendline.length - 1];
    const currentLower = lowerTrendline[lowerTrendline.length - 1];
    const prevUpper = upperTrendline[upperTrendline.length - 2] || currentUpper;
    const prevLower = lowerTrendline[lowerTrendline.length - 2] || currentLower;
    
    // Get pivot states for previous and current candles
    const prevPivotHigh = pivotHighs[pivotHighs.length - 2] || 0;
    const currentPivotHigh = pivotHighs[pivotHighs.length - 1] || 0;
    const prevPivotLow = pivotLows[pivotLows.length - 2] || 0;
    const currentPivotLow = pivotLows[pivotLows.length - 1] || 0;
    
    // Calculate trendline values with offset (matching Pine Script exactly)
    // Pine Script: plot(upper - slope_ph * length) and plot(lower + slope_pl * length)
    // upos := ph ? 0 : close > upper - slope_ph * length ? 1 : upos
    // dnos := pl ? 0 : close < lower + slope_pl * length ? 1 : dnos
    // Use the stored slopes from when pivots were found
    const upperTrendlineValue = currentUpper - (upperSlope * this.length);
    const lowerTrendlineValue = currentLower + (lowerSlope * this.length);
    const prevUpperTrendlineValue = prevUpper - (upperSlope * this.length);
    const prevLowerTrendlineValue = prevLower + (lowerSlope * this.length);

    // Track breakout state (matching Pine Script upos/dnos logic exactly)
    // upos: tracks if price is above upper trendline offset (upward breakout potential)
    // dnos: tracks if price is below lower trendline offset (downward breakout potential)
    let prevUpos = 0;
    let prevDnos = 0;
    let upos = 0;
    let dnos = 0;
    
    // Previous candle state (upos)
    if (prevPivotHigh > 0) {
      prevUpos = 0; // Reset on pivot high (ph)
    } else {
      // upos := close > upper - slope_ph * length ? 1 : upos
      prevUpos = prevCandle.close > prevUpperTrendlineValue ? 1 : 0;
    }
    
    // Previous candle state (dnos)
    if (prevPivotLow > 0) {
      prevDnos = 0; // Reset on pivot low (pl)
    } else {
      // dnos := close < lower + slope_pl * length ? 1 : dnos
      prevDnos = prevCandle.close < prevLowerTrendlineValue ? 1 : 0;
    }
    
    // Current candle state (upos)
    if (currentPivotHigh > 0) {
      upos = 0; // Reset on pivot high (ph)
    } else {
      upos = lastCandle.close > upperTrendlineValue ? 1 : 0;
    }
    
    // Current candle state (dnos)
    if (currentPivotLow > 0) {
      dnos = 0; // Reset on pivot low (pl)
    } else {
      dnos = lastCandle.close < lowerTrendlineValue ? 1 : 0;
    }

    // Breakout detection (matching Pine Script plotshape conditions)
    // "Upper Break" (B label up): upos > upos[1] - price breaks above upper trendline (BULLISH)
    // "Lower Break" (B label down): dnos > dnos[1] - price breaks below lower trendline (BEARISH)
    const upwardBreakout = upos > prevUpos; // Price breaks above upper trendline = BUY signal
    const downwardBreakout = dnos > prevDnos; // Price breaks below lower trendline = potential exit

    // Generate BUY signal on upward breakout
    if (upwardBreakout) {
      // Calculate target price based on ATR or fixed ROI
      const atr = this.calculateATR(candles, 14);
      const currentATR = atr.length > 0 ? atr[atr.length - 1] : 0;
      
      // Use ATR-based target or minimum ROI
      const atrTarget = lastCandle.close + (currentATR * 2.0);
      const minTarget = lastCandle.close * TARGET_ROI;
      const targetPrice = Math.max(atrTarget, minTarget);

      // Stop loss below the lower trendline or recent low
      const recentLow = Math.min(...lows.slice(-this.length));
      const stopLoss = Math.min(currentLower * 0.995, recentLow * 0.99);

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

    // For spot trading, we typically don't sell on downward breakouts
    // But we could use it as an exit signal if in position
    // For now, we'll only generate BUY signals

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
    upperSlope: number;
    lowerSlope: number;
  } {
    const upperTrendline: number[] = [];
    const lowerTrendline: number[] = [];
    let upperSlope = 0;
    let lowerSlope = 0;
    let currentUpper = 0;
    let currentLower = 0;

    for (let i = 0; i < candles.length; i++) {
      const ph = pivotHighs[i];
      const pl = pivotLows[i];

      // Calculate current slope (recalculate each bar for accuracy)
      const currentSlope = this.calculateSlope(
        candles.slice(0, i + 1),
        length,
        mult,
        calcMethod
      );

      // Update upper trendline
      if (ph > 0) {
        // New pivot high found, reset trendline and store slope
        currentUpper = ph;
        upperSlope = currentSlope;
        upperTrendline.push(ph);
      } else {
        // Extend trendline with stored slope
        if (currentUpper > 0) {
          currentUpper = currentUpper - upperSlope;
          upperTrendline.push(currentUpper);
        } else {
          // No trendline yet, use current high
          currentUpper = candles[i].high;
          upperTrendline.push(currentUpper);
        }
      }

      // Update lower trendline
      if (pl > 0) {
        // New pivot low found, reset trendline and store slope
        currentLower = pl;
        lowerSlope = currentSlope;
        lowerTrendline.push(pl);
      } else {
        // Extend trendline with stored slope
        if (currentLower > 0) {
          currentLower = currentLower + lowerSlope;
          lowerTrendline.push(currentLower);
        } else {
          // No trendline yet, use current low
          currentLower = candles[i].low;
          lowerTrendline.push(currentLower);
        }
      }
    }

    return { upperTrendline, lowerTrendline, upperSlope, lowerSlope };
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

