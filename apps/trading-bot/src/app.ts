import * as dotenv from "dotenv";
import { supertrend } from "supertrend";
import { INITIAL_BALANCE, PAIR, TARGET_ROI, TIME_FRAME } from "./constants";
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
import { Indicators } from "@ixjb94/indicators";
const ta = new Indicators();
dotenv.config();

const interval = new TickInterval(Interval[TIME_FRAME]);

const marketService = new MarketService(PAIR, interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

async function runTradingBot(candlestick: Candle[]) {
  const superTrends = supertrend({
    initialArray: candlestick,
    multiplier: 3,
    period: 10,
  });
  const ema50 = await ta.ema(
    candlestick.map((c) => c.close),
    50
  );

  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  LogService.log(
    `${decision || "No Trade"} :${new Date(
      candlestick[candlestick.length - 1].closeTime
    ).toISOString()}`
  );
  const assetValue = await BinanceApiService.getAssetValue();
  const total = assetValue[0] + assetValue[1];
  const rio = ((total - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

  /*   if (assetValue[0] > assetValue[1]) {
    if (rio >= TARGET_ROI) {
      TradeService.handleSell();
    } else if (rio > 0.5) {
      const currentEma50 = Math.min(
        ema50[ema50.length - 1],
        ema50[ema50.length - 2]
      );
      await TradeService.adjustStopLoss(parseFloat(currentEma50.toFixed(2)));
    }
  } */
  LogService.log(
    `${
      assetValue[0] > assetValue[1] && rio <= 0.5 ? "HODL" : ""
    } Asset value: ${total.toFixed(2)} RIO: ${rio.toFixed(2)}% PNL = ${(
      total - INITIAL_BALANCE
    ).toFixed(2)} $`
  );
  if (decision.length) {
    if (decision === Operation.BUY && candlestick[candlestick.length - 1].close > ema50[ema50.length - 1]) {
      await TradeService.handleBuy();
    } else if (decision === Operation.SELL && assetValue[0] < assetValue[1]) {
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
  LogService.log("Starting Trading Bot @ ");
  candlesticks = await marketService.fetchCandlestickData();
  runTradingBot(candlesticks.slice(0, -1));
  setInterval(async () => {
    candlesticks = await marketService.fetchCandlestickData();
    runTradingBot(candlesticks.slice(0, -1));
  }, interval.getValueInMs());
}

main();
