import * as dotenv from "dotenv";
import {
  ASSET,
  BASE_CURRENCY,
  INITIAL_BALANCE,
  PAIR,
  PORTFOLIO,
  TIME_FRAME,
} from "./constants";
import { delay } from "./core/utils";
import { Candle } from "./models/candle.model";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { BinanceApiService } from "./services/binance-api.service";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { TradeService } from "./services/trade.service";
import { RSIStrategy } from "./strategies/rsi/rsi-strategy";
import { StrategyManager } from "./strategies/strategy-manager";
dotenv.config();

const interval = new TickInterval(Interval[TIME_FRAME]);
const strategyManager = new StrategyManager(new RSIStrategy());

async function runTradingBot(candlestick: Candle[]) {
  const { label, tp } = strategyManager.executeStrategy(candlestick);

  await calculateRoi();
  await rebalancePorfolio();

  if (label === Operation.BUY && tp > candlestick.at(-1)!.close) {
    await TradeService.handleBuy(tp);
  } /*  else {
    LogService.log(
      `${new Date().toISOString() + ":" + label || "No Trade"} :${new Date(
        candlestick[candlestick.length - 1].closeTime
      ).toISOString()}`
    );
  } */
}

async function main() {
  let candlesticks = await MarketService.fetchCandlestickData(
    PAIR,
    interval.getInterval()
  );
  const serverTime = (await BinanceApiService.getServerTime()).serverTime;
  const timeToCloseCurrentCandle =
    new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
    serverTime;
  if (process?.env?.["MODE"] !== "DEBUG" && timeToCloseCurrentCandle > 0) {
    await calculateRoi();
    await rebalancePorfolio();
    LogService.log(
      "Waiting for next candle to open in " +
        (timeToCloseCurrentCandle / (1000 * 60)).toFixed(2) +
        " minutes"
    );
    await delay(timeToCloseCurrentCandle + 1000);
  }
  const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
  LogService.log("Starting Trading Bot @ " + ASSET, " Price:" + marketPrice);
  candlesticks = await MarketService.fetchCandlestickData(
    PAIR,
    interval.getInterval()
  );
  await runTradingBot(candlesticks.slice(0, -1));
  while (true) {
    const serverTime = (await BinanceApiService.getServerTime()).serverTime;
    const timeToCloseCurrentCandle =
      new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
      serverTime;
    await delay(timeToCloseCurrentCandle + 500);
    candlesticks = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval()
    );
    await runTradingBot(candlesticks.slice(0, -1));
  }
}

export async function calculateRoi() {
  const assetValue = await BinanceApiService.getAssetValue();
  const total = assetValue[0] + assetValue[1];
  const rio = ((total - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
  LogService.log(
    `${new Date().toISOString()} Asset value: ${total.toFixed(
      2
    )} RIO: ${rio.toFixed(2)}% PNL = ${(total - INITIAL_BALANCE).toFixed(2)}`
  );
  return rio;
}

async function rebalancePorfolio() {
  PORTFOLIO.forEach(async (item) => {
    await BinanceApiService.handleReabalance(item, BASE_CURRENCY);
  });
}
main();
