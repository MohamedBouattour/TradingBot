import { supertrend } from "supertrend";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";
import { ASSET, PAIR, TIME_FRAME } from "./constants";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { LogService } from "./services/log.service";
import { TradeService } from "./services/trade.service";

const interval = new TickInterval(Interval[TIME_FRAME]);

const marketService = new MarketService(PAIR, interval, 100);
const strategyManager = new StrategyManager(new SuperTrendStrategy());

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

runTradingBot();
setInterval(runTradingBot, interval.getTickIntervalInMs()); // Runs every 5 minute
