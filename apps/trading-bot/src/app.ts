import { supertrend } from "supertrend";
import { INITIAL_BALANCE, PAIR, TIME_FRAME } from "./constants";
import { delay } from "./core/utils";
import { Candle } from "./models/candle.model";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { BinanceApiService } from "./services/binance-api.service";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { TradeService } from "./services/trade.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";
import * as dotenv from "dotenv";
dotenv.config();

const interval = new TickInterval(Interval[TIME_FRAME]);

const marketService = new MarketService(PAIR, interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

async function runTradingBot(candlestick: Candle[]) {
  //candlestick = candlestick.slice(0, -1);
  const superTrends = supertrend({
    initialArray: candlestick,
    multiplier: 3,
    period: 10,
  });
  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  LogService.log(
    `${new Date(
      (await BinanceApiService.getServerTime()).serverTime
    ).toISOString()} ${decision || "No Trade"} :${new Date(
      candlestick[candlestick.length - 1].closeTime
    ).toISOString()}`
  );
  const assetValue = await BinanceApiService.getAssetValue();
  LogService.log(
    `Asset value: ${assetValue} RIO: ${(
      ((assetValue - INITIAL_BALANCE) / INITIAL_BALANCE) *
      100
    ).toFixed(2)}%`
  );
  if (decision.length) {
    if (decision === Operation.BUY) {
      await TradeService.handleBuy();
    } else if (decision === Operation.SELL) {
      TradeService.handleSell();
    }
  }
}

async function main() {
  let candlesticks = await marketService.fetchCandlestickData();
  const serverTime = (await BinanceApiService.getServerTime()).serverTime;
  const timeToCloseCurrentCandle =
    new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
    serverTime;
  if (process?.env?.["MODE"] !== "DEBUG" && timeToCloseCurrentCandle > 0) {
    LogService.log(
      "Waiting for next candle to open in " +
        (timeToCloseCurrentCandle / (1000 * 60)).toFixed(2) +
        " minutes"
    );
    await delay(timeToCloseCurrentCandle + 1000);
  }
  LogService.log("Starting Trading Bot @ " + new Date().toLocaleDateString());
  candlesticks = await marketService.fetchCandlestickData();
  runTradingBot(candlesticks.slice(0, -1));
  setInterval(async () => {
    candlesticks = await marketService.fetchCandlestickData();
    runTradingBot(candlesticks.slice(0, -1));
  }, interval.getValueInMs());
}

main();
