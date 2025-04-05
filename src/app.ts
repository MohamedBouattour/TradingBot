import { supertrend } from "supertrend";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";

import * as fs from "fs";
import { Interval, TickInterval } from "./models/tick-interval.model";
const logStream = fs.createWriteStream("./output.log", { flags: "a" });

const interval = new TickInterval(Interval["5m"]);

const marketService = new MarketService("BTCUSDT", interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

function log(...messages: string[]) {
  logStream.write(`${new Date().toISOString()} - ${messages}\n`);
  process.stdout.write(`${messages}\n`);
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
  }
}

runTradingBot();
setInterval(runTradingBot, interval.getTickIntervalInMs()); // Runs every 5 minute
