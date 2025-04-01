"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStringToNumbers = convertStringToNumbers;
function convertStringToNumbers(candles) {
    return candles.reduce((result, candle) => {
        const [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored,] = candle;
        const newObj = {
            time: new Date(Number(time)).toISOString(),
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume),
            closeTime: Number(closeTime),
            assetVolume: Number(assetVolume),
            trades: Number(trades),
            buyBaseVolume: Number(buyBaseVolume),
            buyAssetVolume: Number(buyAssetVolume),
            ignored,
        };
        return [...result, newObj];
    }, []);
}
