import { ASSETS } from "../../trading-bot/src/constants";
import { delay } from "../../trading-bot/src/core/utils";
import {
  Interval,
  TickInterval,
} from "../../trading-bot/src/models/tick-interval.model";
import { LogService } from "../../trading-bot/src/services/log.service";
import { MarketService } from "../../trading-bot/src/services/market.service";
import { Indicators } from "@ixjb94/indicators";
const ta = new Indicators();

function main() {
  ASSETS.forEach(async (asset) => {
    await delay(1000);
    LogService.log(asset, new TickInterval(Interval["4h"]));
    const candlesticks = await MarketService.fetchCandlestickData(
      asset,
      new TickInterval(Interval["4h"]).getInterval()
    );
    const ema50 = await ta.ema(
      candlesticks.map((c) => c.close),
      50
    );
    if (ema50[ema50.length - 1] > candlesticks[candlesticks.length - 1].close) {
      console.log(
        `${asset} - EMA50: ${ema50[ema50.length - 1]} - Last Candle: ${
          candlesticks[candlesticks.length - 1].close
        }`
      );
    }
    await delay(1000);
  });
}
main();
