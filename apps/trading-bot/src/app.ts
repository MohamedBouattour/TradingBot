import { config } from "dotenv";
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
import { ApiClientService } from "./services/api-client.service";
import { RSIStrategy } from "./strategies/rsi/rsi-strategy";
import { StrategyManager } from "./strategies/strategy-manager";
import { MemoryMonitor } from "./utils/memory-monitor";

config();

// Global state management
let retryCount = 0;
const RETRY_DELAY = 30000; // 30 seconds

const interval = new TickInterval(Interval[TIME_FRAME]);
const strategyManager = new StrategyManager(new RSIStrategy());
const memoryMonitor = MemoryMonitor.getInstance();

async function runTradingBot(candlestick: Candle[]) {
  try {
    const startTime = Date.now();

    // Limit candlestick array size to prevent memory growth - reduced from 200 to 100
    const limitedCandlesticks = candlestick.slice(-100);
    const currentPrice =
      limitedCandlesticks[limitedCandlesticks.length - 1].close;

    const { tp } = strategyManager.executeStrategy(limitedCandlesticks);
    //disable strategy
    const label = "";
    const strategyExecutionTime = Date.now() - startTime;

    // Log trading decision with detailed information
    const decisionData = {
      decision: label,
      currentPrice: currentPrice,
      targetPrice: tp,
      executionTimeMs: strategyExecutionTime,
      timestamp: new Date().toISOString(),
      asset: ASSET,
      pair: PAIR,
    };

    if (label.length) {
      LogService.logTradingDecision(
        `Strategy decision: ${label}`,
        decisionData
      );

      // Send trading decision to API
      await ApiClientService.sendTradingDecision(decisionData);
    }

    await rebalancePorfolio();
    await calculateRoi();

    if (label === Operation.BUY && tp > currentPrice) {
      const buySignalData = {
        signal: "BUY",
        currentPrice: currentPrice,
        targetPrice: tp,
        priceGap: tp - currentPrice,
        priceGapPercent:
          (((tp - currentPrice) / currentPrice) * 100).toFixed(2) + "%",
        timestamp: new Date().toISOString(),
      };

      LogService.logTradingDecision("BUY signal detected", buySignalData);
      await TradeService.handleBuy(tp);
    }
  } catch (error: any) {
    LogService.logError(`Error in runTradingBot: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error; // Re-throw to be handled by main loop
  }
}

async function main() {
  const startupData = {
    asset: ASSET,
    pair: PAIR,
    timeFrame: TIME_FRAME,
    initialBalance: INITIAL_BALANCE,
    portfolioItems: PORTFOLIO.length,
    mode: process?.env?.["MODE"] || "PRODUCTION",
    timestamp: new Date().toISOString(),
  };

  LogService.logStructured(
    "INFO",
    "SYSTEM",
    "Trading Bot starting up...",
    startupData
  );

  // Start memory monitoring
  memoryMonitor.startMonitoring();

  try {
    // 🔥 ADD THIS: Sync portfolio with database on startup
    await syncPortfolioWithDatabase();
    
    // Initial setup
    let candlesticks = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval()
    );

    const serverTime = (await BinanceApiService.getServerTime()).serverTime;
    const timeToCloseCurrentCandle =
      new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
      serverTime;

    if (process?.env?.["MODE"] !== "DEBUG" && timeToCloseCurrentCandle > 0) {
      await rebalancePorfolio();
      await calculateRoi();
      LogService.logStructured(
        "INFO",
        "SYSTEM",
        "Waiting for next candle to open " +
          (timeToCloseCurrentCandle / (1000 * 60)).toFixed(2) +
          " munites to open"
      );
      await delay(timeToCloseCurrentCandle + 1000);
    }

    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const startupCompleteData = {
      asset: ASSET,
      pair: PAIR,
      currentPrice: marketPrice,
      timestamp: new Date().toISOString(),
    };

    LogService.logStructured(
      "INFO",
      "SYSTEM",
      "Trading Bot started successfully",
      startupCompleteData
    );

    // Main trading loop with proper error handling
    while (true) {
      try {
        // Fetch fresh candlestick data
        candlesticks = await MarketService.fetchCandlestickData(
          PAIR,
          interval.getInterval()
        );

        // Run trading strategy
        await runTradingBot(candlesticks.slice(0, -1));

        // Calculate timing for next candle
        const currentServerTime = (await BinanceApiService.getServerTime())
          .serverTime;
        const nextCandleTime =
          new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
          currentServerTime;

        // Wait for next candle with minimum delay
        const waitTime = Math.max(nextCandleTime + 500, 1000);
        await delay(waitTime);

        // Reset retry count on successful iteration
        retryCount = 0;

        // Periodic memory cleanup - reduced frequency and added memory threshold
        if (global.gc && Math.random() < 0.005) {
          // 0.5% chance
          const memUsage = process.memoryUsage();
          if (memUsage.heapUsed > 200 * 1024 * 1024) {
            // Only GC if heap > 200MB
            global.gc();
          }
        }
      } catch (error: any) {
        retryCount++;
        const backoffDelay = Math.min(
          RETRY_DELAY * Math.pow(2, Math.min(retryCount - 1, 5)),
          300000
        ); // Max 5 minutes

        const errorData = {
          attempt: retryCount,
          error: error.message,
          backoffDelayMs: backoffDelay,
          backoffDelaySec: backoffDelay / 1000,
          maxRetries: 10,
          timestamp: new Date().toISOString(),
          stack: error.stack,
        };

        LogService.logError(
          `Trading loop error (attempt ${retryCount})`,
          errorData
        );
        LogService.logStructured(
          "WARN",
          "SYSTEM",
          `Retrying in ${backoffDelay / 1000} seconds...`,
          { retryCount, backoffDelay }
        );

        await delay(backoffDelay);

        // Reset retry count after successful recovery period
        if (retryCount > 10) {
          retryCount = 0; // Reset to prevent infinite growth
        }
      }
    }
  } catch (error: any) {
    LogService.logError(`Fatal error in main: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error; // Re-throw the error for external handling
  }
}

export async function calculateRoi() {
  const assetValue = await BinanceApiService.getAssetValue();

  // Use stored portfolio values in USD (calculated during rebalance)
  const portfolioValueInUSD = PORTFOLIO.reduce((total, item) => {
    return total + (item.valueInBaseCurrency || 0);
  }, 0);

  // Debug log for total portfolio value
  console.log(`Total portfolio value: $${portfolioValueInUSD.toFixed(2)}`);

  // Total = USDT value + portfolio items value
  const total = assetValue[1] + portfolioValueInUSD;
  const roi = ((total - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
  const pnl = total - INITIAL_BALANCE;

  // Create ROI data for API
  const roiData = {
    assetValue: assetValue[0],
    baseCurrencyValue: assetValue[1],
    portfolioValue: portfolioValueInUSD,
    totalValue: total,
    roi: roi,
    pnl: pnl,
    initialBalance: INITIAL_BALANCE,
    timestamp: new Date().toISOString(),
  };

  // Send ROI data to API
  await ApiClientService.sendROIData(roiData);

  // Create structured log message with portfolio breakdown
  const portfolioInfo = `${ASSET}: $${assetValue[0].toFixed(
    2
  )} | ${BASE_CURRENCY}: $${assetValue[1].toFixed(
    2
  )} | Portfolio: $${portfolioValueInUSD.toFixed(2)} | Total: $${total.toFixed(
    2
  )} | ROI: ${roi.toFixed(2)}% | PNL: $${pnl.toFixed(2)} (${
    pnl >= 0 ? "PROFIT" : "LOSS"
  })`;

  const structuredMessage = `
#####################################################################################
# ${portfolioInfo.padEnd(79)} #
#####################################################################################`;

  LogService.logAssetValue(structuredMessage);
  return roi;
}

async function rebalancePorfolio() {
  try {
    LogService.logRebalance(
      `Starting portfolio rebalancing ${PORTFOLIO.reduce(
        (result, current) => (result += current.value),
        0
      )} $`
    );

    // Use Promise.all to properly await all rebalancing operations
    const rebalanceResults = await Promise.all(
      PORTFOLIO.map(async (item) => {
        try {
          const result = await BinanceApiService.handleReabalance(
            item,
            BASE_CURRENCY
          );
          return { asset: item.asset, status: "SUCCESS", result };
        } catch (error: any) {
          LogService.logError(
            `Error rebalancing ${item.asset}: ${error.message}`,
            {
              asset: item.asset,
              error: error.message,
              timestamp: new Date().toISOString(),
            }
          );
          return { asset: item.asset, status: "ERROR", error: error.message };
        }
      })
    );
    LogService.logRebalance(
      "----------Portfolio rebalancing completed----------"
    );
  } catch (error: any) {
    LogService.logError(`Error in portfolio rebalancing: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

async function syncPortfolioWithDatabase(): Promise<void> {
  try {
    LogService.logStructured(
      "INFO",
      "SYSTEM",
      "Synchronizing portfolio with database...",
      { portfolioItems: PORTFOLIO.length }
    );

    const syncResults = await Promise.allSettled(
      PORTFOLIO.map(async (item) => {
        try {
          const success = await ApiClientService.syncPortfolioItem(item);
          if (success) {
            LogService.logStructured(
              "INFO",
              "SYSTEM",
              `Portfolio item synchronized: ${item.asset}`,
              {
                asset: item.asset,
                value: item.value,
                threshold: item.threshold,
              }
            );
            return { asset: item.asset, status: "SUCCESS" };
          } else {
            throw new Error("API call failed");
          }
        } catch (error: any) {
          LogService.logError(`Failed to sync portfolio item: ${item.asset}`, {
            asset: item.asset,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          return { asset: item.asset, status: "ERROR", error: error.message };
        }
      })
    );

    // Log summary
    const successful = syncResults.filter(
      (r) => r.status === "fulfilled" && r.value.status === "SUCCESS"
    ).length;
    const failed = syncResults.length - successful;

    LogService.logStructured(
      "INFO",
      "SYSTEM",
      "Portfolio synchronization completed",
      {
        total: PORTFOLIO.length,
        successful,
        failed,
      }
    );
  } catch (error: any) {
    LogService.logError(
      `Error in portfolio synchronization: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

main();
