import { supertrend } from "supertrend";
import { PAIR, TIME_FRAME } from "./constants";
import { delay } from "./core/utils";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { TradeService } from "./services/trade.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";
import { Candle } from "./models/candle.model";

const interval = new TickInterval(Interval[TIME_FRAME]);

const marketService = new MarketService(PAIR, interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

async function runTradingBot(candlestick: Candle[]) {
  const superTrends = supertrend({
    initialArray: candlestick,
    multiplier: 3,
    period: 10,
  });
  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  console.log(decision, candlestick[candlestick.length - 1]);
  if (decision.length) {
    //const splicedData = candlestick.slice(0, -5)
    LogService.log(
      `Latest Candle:${JSON.stringify(candlestick[candlestick.length - 1])}`
    );
    LogService.log(`Trade Decision: ${decision}`);
    if (decision === Operation.BUY) {
      TradeService.handleBuy();
    } else if (decision === Operation.SELL) {
      TradeService.handleSell();
    }
  }
}

async function main() {
  const candlestick = await marketService.fetchCandlestickData();
  const timeToCloseCurrentCandle =
    new Date(candlestick[candlestick.length - 1].closeTime).getTime() -
    Date.now();
  if (timeToCloseCurrentCandle > 0) {
    LogService.log(
      "Waiting for next candle to open in " +
        timeToCloseCurrentCandle / (1000 * 60) +
        " minutes"
    );
    await delay(timeToCloseCurrentCandle + 5000);
    runTradingBot(await marketService.fetchCandlestickData());
    setInterval(runTradingBot, interval.getTickIntervalInMs());
  }
}

main();
