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

// Enhanced memory logging function with structured format
function logMemoryUsage() {
  const stats = memoryMonitor.getMemoryStats();
  const memoryData = {
    rss: `${stats.rss}MB`,
    heap: {
      used: `${stats.heapUsed}MB`,
      total: `${stats.heapTotal}MB`,
      utilization: `${((stats.heapUsed / stats.heapTotal) * 100).toFixed(1)}%`,
    },
    external: `${stats.external}MB`,
    arrayBuffers: `${stats.arrayBuffers}MB`,
    timestamp: new Date().toISOString(),
  };

  LogService.logMemoryStats("Current memory usage", memoryData);
}

async function runTradingBot(candlestick: Candle[]) {
  try {
    const startTime = Date.now();

    // Limit candlestick array size to prevent memory growth - reduced from 200 to 100
    const limitedCandlesticks = candlestick.slice(-100);
    const currentPrice =
      limitedCandlesticks[limitedCandlesticks.length - 1].close;

    // Log current market data
    LogService.logAssetValue("Current market data", {
      asset: ASSET,
      price: currentPrice,
      timestamp: new Date().toISOString(),
      candlesticksCount: limitedCandlesticks.length,
    });

    const { label, tp } = strategyManager.executeStrategy(limitedCandlesticks);
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

    LogService.logTradingDecision(`Strategy decision: ${label}`, decisionData);

    await calculateRoi();
    await rebalancePorfolio();

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

    // Log memory usage periodically (further reduced frequency)
    if (Math.random() < 0.002) {
      // 0.2% chance
      logMemoryUsage();
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
      await calculateRoi();
      await rebalancePorfolio();
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
  const total = assetValue[0] + assetValue[1];
  const rio = ((total - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
  const pnl = total - INITIAL_BALANCE;

  const roiData = {
    assetValue: {
      [ASSET]: assetValue[0].toFixed(2),
      [BASE_CURRENCY]: assetValue[1].toFixed(2),
      total: total.toFixed(2),
    },
    performance: {
      initialBalance: INITIAL_BALANCE.toFixed(2),
      currentValue: total.toFixed(2),
      roi: rio.toFixed(2) + "%",
      pnl: pnl.toFixed(2),
      pnlStatus: pnl >= 0 ? "PROFIT" : "LOSS",
    },
    timestamp: new Date().toISOString(),
  };

  LogService.logAssetValue("Portfolio ROI calculation", roiData);
  return rio;
}

async function rebalancePorfolio() {
  try {
    const rebalanceStartTime = Date.now();
    LogService.logRebalance("Starting portfolio rebalancing", {
      portfolioItems: PORTFOLIO.length,
      baseCurrency: BASE_CURRENCY,
      timestamp: new Date().toISOString(),
    });

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

    const rebalanceEndTime = Date.now();
    const successCount = rebalanceResults.filter(
      (r) => r.status === "SUCCESS"
    ).length;
    const errorCount = rebalanceResults.filter(
      (r) => r.status === "ERROR"
    ).length;

    LogService.logRebalance("Portfolio rebalancing completed");
    /* LogService.logRebalance('Portfolio rebalancing completed', {
      duration: `${rebalanceEndTime - rebalanceStartTime}ms`,
      results: {
        total: rebalanceResults.length,
        successful: successCount,
        errors: errorCount
      },
      details: rebalanceResults,
      timestamp: new Date().toISOString()
    }); */
  } catch (error: any) {
    LogService.logError(`Error in portfolio rebalancing: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
main();
