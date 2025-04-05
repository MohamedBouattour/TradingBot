import { supertrend } from "supertrend";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";

const marketService = new MarketService("BTCUSDT", "5m", 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

import * as fs from "fs";
const logStream = fs.createWriteStream("./output.log", { flags: "a" });

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
setInterval(runTradingBot, 1000 * 60 * 5); // Runs every 5 minute
