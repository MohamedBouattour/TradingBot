import { Candle } from "../../src/models/candle.model";
import { SuperTrendStrategy } from "../../src/strategies/supertrend/supertrend-strategy";

describe("SuperTrendStrategy", () => {
  let strategy: SuperTrendStrategy;

  beforeEach(() => {
    strategy = new SuperTrendStrategy();
  });

  it("should return BUY when price crosses above supertrend", () => {
    const candles: Candle[] = [
      {
        close: 90,
        high: 95,
        low: 85,
        open: 87,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
      {
        close: 110,
        high: 115,
        low: 105,
        open: 107,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
    ];
    const superTrends = [100, 100];

    const result = strategy.execute(candles, superTrends);
    expect(result).toBe("BUY");
  });

  it("should return SELL when price crosses below supertrend", () => {
    const candles: Candle[] = [
      {
        close: 110,
        high: 115,
        low: 105,
        open: 107,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
      {
        close: 90,
        high: 95,
        low: 85,
        open: 87,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
    ];
    const superTrends = [100, 100];

    const result = strategy.execute(candles, superTrends);
    expect(result).toBe("SELL");
  });

  it("should return NO TRADE when no crossing occurs", () => {
    const candles: Candle[] = [
      {
        close: 110,
        high: 115,
        low: 105,
        open: 107,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
      {
        close: 115,
        high: 120,
        low: 110,
        open: 112,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
    ];
    const superTrends = [100, 100];

    const result = strategy.execute(candles, superTrends);
    expect(result).toBe("");
  });
  it("should return NO TRADE when no crossing occurs", () => {
    const candles: Candle[] = [
      {
        close: 90,
        high: 95,
        low: 105,
        open: 107,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
      {
        close: 95,
        high: 120,
        low: 110,
        open: 112,
        time: new Date().toISOString(),
        volume: 0,
        closeTime: 0,
        assetVolume: 0,
        trades: 0,
        buyBaseVolume: 0,
        buyAssetVolume: 0,
        ignored: "",
      },
    ];
    const superTrends = [100, 100];

    const result = strategy.execute(candles, superTrends);
    expect(result).toBe("");
  });
});
