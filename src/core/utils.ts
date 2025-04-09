import { Candle } from "../models/candle.model";

export function convertStringToNumbers(candles: string[][]): Candle[] {
  return candles.reduce((result: Candle[], candle: string[]) => {
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

    const newObj: Candle = {
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
    };
    return [...result, newObj];
  }, []);
}
