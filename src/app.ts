import { supertrend } from "supertrend";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";

const marketService = new MarketService("BTCUSDT", "15m", 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());
import * as fs from "fs";

// Create log file stream
const logStream = fs.createWriteStream("./output.log", { flags: "a" });

// Override console.log in production only
if (process.env.NODE_ENV === "production") {
  console.log = function (message: string) {
    logStream.write(`${new Date().toISOString()} - ${message}\n`); // Write to file
    process.stdout.write(`${message}\n`); // Optional: still print to the console
  };
}

async function runTradingBot() {
  const candlestick = await marketService.fetchCandlestickData();
  console.log("Latest Candle:", candlestick[candlestick.length - 1]);

  const superTrends = supertrend({
    initialArray: candlestick,
    multiplier: 3,
    period: 10,
  });

  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  console.log(`Trade Decision: ${decision}`);
}

runTradingBot();
setInterval(runTradingBot, 1000 * 60 * 5); // Runs every 5 minute
