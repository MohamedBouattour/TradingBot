import { Candle } from "../models/candle.model";

export function convertStringToNumbers(candles: string[][]): Candle[] {
  // Use map instead of reduce with spread operator for better memory efficiency
  return candles.map((candle: string[]) => {
    const [
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored,
    ] = candle;

    // Create object directly without intermediate variables
    return {
      time: new Date(Number(time)).toISOString(),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      closeTime: new Date(Number(closeTime)).toISOString(),
      assetVolume: Number(assetVolume),
      trades: Number(trades),
      buyBaseVolume: Number(buyBaseVolume),
      buyAssetVolume: Number(buyAssetVolume),
      ignored,
    } as Candle;
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMACDHistogramColorLabels(hist: number[]): string[] {
  // Validate input - need at least 2 elements
  if (!hist || hist.length < 2) {
    return [];
  }
  
  // Pre-allocate array with known size for better memory efficiency
  const labels: string[] = new Array(hist.length - 1);

  for (let i = 1; i < hist.length; i++) {
    const prev = hist[i - 1];
    const curr = hist[i];

    labels[i - 1] = curr >= 0
      ? (curr > prev ? "dark-green" : "light-green")
      : (curr > prev ? "light-red" : "dark-red");
  }

  return labels;
}
