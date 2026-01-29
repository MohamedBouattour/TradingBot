import {
  ASSET,
  PAIR,
  PERIOD,
  TIME_FRAME,
} from "./constants";
import { delay } from "./core/utils";
import { Candle } from "./models/candle.model";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";
import { TrendlineBreakoutStrategy } from "./strategies/trendline-breakout/trendline-breakout-strategy";

// Configuration
const strategyManager = new StrategyManager(new TrendlineBreakoutStrategy());
const FEES = 0.36; // Fees in percent per trade (round trip or single side? Code implied total deduction)
const INITIAL_CAPITAL = 850;
const POSITION_SIZE_PERCENT = 1 / 3; // 33.33%

let allData: Candle[] = [];
let period: number;
const interval = new TickInterval(Interval[TIME_FRAME]);

async function prepareData(): Promise<Candle[]> {
  const oneMonthMs = PERIOD;
  const now = Date.now();
  const oneMonthAgo = now - oneMonthMs;
  let lastTimestamp = now;
  period = (lastTimestamp - oneMonthAgo) / (1000 * 60 * 60 * 24);
  while (lastTimestamp > oneMonthAgo) {
    await delay(1000);
    console.log(
      (lastTimestamp - oneMonthAgo) / (1000 * 60 * 60 * 24) + "Days left"
    );
    const data = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval(),
      500,
      lastTimestamp
    );

    if (data.length === 0) break;

    allData = [...data, ...allData];
    lastTimestamp = new Date(data[0].time).getTime();
  }
  return allData;
}

interface Position {
  time: string;
  entryPrice: number;
  targetPrice: number;
  investment: number;
  amount: number;
}

interface TradeRecord {
  entryTime: string;
  exitTime: string;
  status: string;
  pnl: number;
  entryPrice: number;
  exitPrice: number;
  duration: number;
}

async function main() {
  allData = await prepareData();

  console.log(`Starting Backtest with Capital: $${INITIAL_CAPITAL}`);
  console.log(`Position Size: ${(POSITION_SIZE_PERCENT * 100).toFixed(2)}% of Equity`);

  let balance = INITIAL_CAPITAL;
  let activePositions: Position[] = [];
  let closedTrades: TradeRecord[] = [];

  // Iterate through data
  // We need at least 500 candles for history as per original code
  for (let index = 500; index < allData.length; index++) {
    const testedData = allData.slice(index - 500, index);
    const lastCandle = testedData[testedData.length - 1];

    // Safety check
    if (!lastCandle) continue;

    const currentPrice = lastCandle.close;
    const currentTime = lastCandle.time;

    // 1. Check Exits for active positions
    // We iterate backwards to safely remove items
    for (let i = activePositions.length - 1; i >= 0; i--) {
      const pos = activePositions[i];
      let shouldClose = false;
      let closeReason = "";
      let exitPrice = currentPrice;

      // Calculate Unrealized PnL % (excluding fees for "positive" check)
      const rawPnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      const netPnlPercent_Current = rawPnlPercent - FEES;

      // Condition 1: Take Profit (Limit Order)
      // Check High price (assuming limit filled if price touched)
      if (lastCandle.high >= pos.targetPrice) {
        shouldClose = true;
        closeReason = "TP (Limit)";
        exitPrice = pos.targetPrice;
      }

      // Removed "Strategy Sell Signal" as user requested FIXED limit exit only.

      if (shouldClose) {
        // Execute Close
        const finalRawPnl = ((exitPrice - pos.entryPrice) / pos.entryPrice);
        const finalNetPnlPercent = (finalRawPnl * 100) - FEES;

        // Calculate returned capital
        // Revenue = Investment * (1 + PnL_Flow) ? 
        // Simple: Investment + Profit
        // Profit = Investment * finalNetPnlPercent / 100
        const profitValue = pos.investment * (finalNetPnlPercent / 100);
        const returnAmount = pos.investment + profitValue;

        balance += returnAmount;

        const durationHours = (new Date(currentTime).getTime() - new Date(pos.time).getTime()) / (1000 * 60 * 60);

        closedTrades.push({
          entryTime: pos.time,
          exitTime: currentTime,
          status: closeReason,
          pnl: finalNetPnlPercent,
          entryPrice: pos.entryPrice,
          exitPrice: exitPrice,
          duration: durationHours
        });

        activePositions.splice(i, 1);

        const logMsg = `[CLOSE] ${closeReason} 
        Start: ${pos.time} 
        End:   ${currentTime} 
        Dur:   ${durationHours.toFixed(2)}h 
        PnL:   ${finalNetPnlPercent.toFixed(2)}% (Exit: ${exitPrice}) 
        Bal:   $${balance.toFixed(2)}`;
        console.log(logMsg);
        LogService.log(logMsg);
      }
    }

    // 2. Check Entries
    const { label, tp } = strategyManager.executeStrategy(testedData);

    if (label === Operation.BUY) {
      // Sizing: 33.33% of Total Equity?
      // Equity = Balance + Value of Positions
      // Value of Positions ~ Investment (simplification, or Mark to Market?)
      // Standard conservative: Equity = Balance + Sum(Investments)
      const currentEquity = balance + activePositions.reduce((sum, p) => sum + p.investment, 0);
      const targetPositionSize = currentEquity * POSITION_SIZE_PERCENT;

      if (balance >= targetPositionSize) {
        // Enter
        activePositions.push({
          time: currentTime,
          entryPrice: currentPrice,
          targetPrice: tp,
          investment: targetPositionSize,
          amount: targetPositionSize / currentPrice
        });

        balance -= targetPositionSize;

        const logMsg = `[BUY] Price: ${currentPrice} | TP: ${tp} | Invest: $${targetPositionSize.toFixed(2)}`;
        console.log(logMsg);
        LogService.log(logMsg);
      }
    }
  }

  // Summary
  console.log("\n----------------------------------");
  console.log("BACKTEST COMPLETE");
  console.log("----------------------------------");

  const wins = closedTrades.filter(t => t.pnl > 0).length;
  const losses = closedTrades.filter(t => t.pnl <= 0).length;
  const totalTrades = closedTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Final Equity (mark to market open positions?)
  // Let's just sum Balance + Invested (ignoring unrealized PnL of open positions for safety, or simpler)
  const finalEquity = balance + activePositions.reduce((sum, p) => sum + p.investment, 0); // Simplified
  const totalReturn = ((finalEquity - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;

  const summary = `
  Capital: $${INITIAL_CAPITAL}
  Final Equity: $${finalEquity.toFixed(2)}
  Total Return: ${totalReturn.toFixed(2)}%
  Trades: ${totalTrades} (Wins: ${wins}, Losses: ${losses})
  Win Rate: ${winRate.toFixed(2)}%
  Open Positions: ${activePositions.length}
  `;

  console.log(summary);
  LogService.log(summary);

  if (activePositions.length > 0) {
    console.log("Open Positions Details:");
    activePositions.forEach(p => console.log(`[${p.time}] Entry: ${p.entryPrice}, TP: ${p.targetPrice}, Invest: ${p.investment.toFixed(2)}`));
  }
}

main();
