import { supertrend } from "supertrend";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";

import * as fs from "fs";
import {
  ASSET,
  BALANCE_IN_POSTIOTION,
  BASE_CURRENCY,
  PAIR,
  TARGET_ROI,
  TIME_FRAME,
} from "./constants";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { TradeService } from "./services/trade.service";
const logStream = fs.createWriteStream("./output.log", { flags: "a" });

const interval = new TickInterval(Interval[TIME_FRAME]);

const marketService = new MarketService(ASSET, interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

function log(...messages: string[]) {
  logStream.write(`${new Date().toISOString()} - ${messages}\n`);
  process.stdout.write(`${messages}\n`);
}

async function placeBuyOrder() {
  const balance =
    (await TradeService.getBalance()).balances.find(
      (balance: { asset: string }) => balance.asset === BASE_CURRENCY
    ) * BALANCE_IN_POSTIOTION;
  const marketPrice = await TradeService.getMarketPrice(PAIR);
  const quantity = balance / marketPrice;
  const tpPrice = marketPrice * TARGET_ROI;
  log(
    `Setting up trade for : ${PAIR} amount: ${quantity} BuyPrice ${marketPrice} SellPrice ${tpPrice} roi:${
      tpPrice / marketPrice
    } @${new Date().toISOString()}`
  );
  try {
    const order = await TradeService.buyAndSetTp(PAIR, quantity, tpPrice);
    log(`Order placed: ${JSON.stringify(order)}`);
    log(`Take profit set at: ${tpPrice}`);
  } catch (error: any) {
    log(`Error executing trade: ${error.message}`);
  }
}
async function placeSellOrder() {
  const quantity =
    (await TradeService.getBalance()).balances.find(
      (balance: { asset: string }) => balance.asset === ASSET
    ) * BALANCE_IN_POSTIOTION;
  const marketPrice = await TradeService.getMarketPrice(PAIR);
  log(
    `Setting up trade for : ${PAIR} amount: ${quantity} SellPrice ${marketPrice} @${new Date().toISOString()}`
  );
  try {
    const order = await TradeService.sell(PAIR, quantity);
    log(`Order placed: ${JSON.stringify(order)}`);
  } catch (error: any) {
    log(`Error executing trade: ${error.message}`);
  }
}
async function runTradingBot() {
  const candlestick = await marketService.fetchCandlestickData();

  const superTrends = supertrend({
    initialArray: candlestick,
    multiplier: 3,
    period: 10,
  });

  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  if (decision.length) {
    //const splicedData = candlestick.slice(0, -5)
    log(`Latest Candle:${JSON.stringify(candlestick[candlestick.length - 1])}`);
    log(`Trade Decision: ${decision}`);
    if (decision === Operation.BUY) {
      placeBuyOrder();
    } else if (decision === Operation.SELL) {
      placeSellOrder();
    }
  }
}

runTradingBot();
setInterval(runTradingBot, interval.getTickIntervalInMs()); // Runs every 5 minute
