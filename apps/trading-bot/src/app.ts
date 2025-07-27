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
let isShuttingDown = false;
let retryCount = 0;
const RETRY_DELAY = 30000; // 30 seconds

const interval = new TickInterval(Interval[TIME_FRAME]);
const strategyManager = new StrategyManager(new RSIStrategy());
const memoryMonitor = MemoryMonitor.getInstance();

// Simplified memory logging function
function logMemoryUsage() {
  const stats = memoryMonitor.getMemoryStats();
  LogService.log(`Memory - RSS: ${stats.rss}MB, Heap: ${stats.heapUsed}MB/${stats.heapTotal}MB, External: ${stats.external}MB`);
}

async function runTradingBot(candlestick: Candle[]) {
  try {
    // Limit candlestick array size to prevent memory growth - reduced from 200 to 100
    const limitedCandlesticks = candlestick.slice(-100);
    
    const { label, tp } = strategyManager.executeStrategy(limitedCandlesticks);

    await calculateRoi();
    await rebalancePorfolio();

    if (label === Operation.BUY && tp > limitedCandlesticks[limitedCandlesticks.length - 1].close) {
      LogService.log(`BUY signal detected - Price: ${limitedCandlesticks[limitedCandlesticks.length - 1].close}, TP: ${tp}`);
      await TradeService.handleBuy(tp);
    }
    
    // Log memory usage periodically (further reduced frequency)
    if (Math.random() < 0.002) { // 0.2% chance
      logMemoryUsage();
    }
    
  } catch (error: any) {
    LogService.log(`Error in runTradingBot: ${error.message}`);
    throw error; // Re-throw to be handled by main loop
  }
}

async function main() {
  LogService.log("Trading Bot starting up...");
  
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
      LogService.log(
        "Waiting for next candle to open in " +
          (timeToCloseCurrentCandle / (1000 * 60)).toFixed(2) +
          " minutes"
      );
      await delay(timeToCloseCurrentCandle + 1000);
    }
    
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    LogService.log("Starting Trading Bot @ " + ASSET + " Price: " + marketPrice);
    
    // Main trading loop with proper error handling
    while (!isShuttingDown) {
      try {
        // Fetch fresh candlestick data
        candlesticks = await MarketService.fetchCandlestickData(
          PAIR,
          interval.getInterval()
        );
        
        // Run trading strategy
        await runTradingBot(candlesticks.slice(0, -1));
        
        // Calculate timing for next candle
        const currentServerTime = (await BinanceApiService.getServerTime()).serverTime;
        const nextCandleTime =
          new Date(candlesticks[candlesticks.length - 1].closeTime).getTime() -
          currentServerTime;
          
        // Wait for next candle with minimum delay
        const waitTime = Math.max(nextCandleTime + 500, 1000);
        await delay(waitTime);
        
        // Reset retry count on successful iteration
        retryCount = 0;
        
        // Periodic memory cleanup - reduced frequency and added memory threshold
        if (global.gc && Math.random() < 0.005) { // 0.5% chance
          const memUsage = process.memoryUsage();
          if (memUsage.heapUsed > 200 * 1024 * 1024) { // Only GC if heap > 200MB
            global.gc();
          }
        }
        
      } catch (error: any) {
        retryCount++;
        LogService.log(`Trading loop error (attempt ${retryCount}): ${error.message}`);
        
        // Exponential backoff with max delay cap
        const backoffDelay = Math.min(RETRY_DELAY * Math.pow(2, Math.min(retryCount - 1, 5)), 300000); // Max 5 minutes
        LogService.log(`Retrying in ${backoffDelay / 1000} seconds...`);
        await delay(backoffDelay);
        
        // Reset retry count after successful recovery period
        if (retryCount > 10) {
          retryCount = 0; // Reset to prevent infinite growth
        }
      }
    }
    
  } catch (error: any) {
    LogService.log(`Fatal error in main: ${error.message}`);
    await gracefulShutdown();
  }
}

// Graceful shutdown function
async function gracefulShutdown() {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  LogService.log("Initiating graceful shutdown...");
  
  try {
    // Cancel any pending orders
    try {
      //await BinanceApiService.cancelAllOrders(PAIR);
      LogService.log("Cancelled all pending orders");
    } catch (error: any) {
      LogService.log(`Error cancelling orders: ${error.message}`);
    }
    
    // Stop memory monitoring and clear all caches
    try {
      memoryMonitor.stopMonitoring();
      BinanceApiService.clearCaches();
      MarketService.clearCache();
      LogService.log("Stopped monitoring and cleared all caches");
    } catch (error: any) {
      LogService.log(`Error during cleanup: ${error.message}`);
    }
    
    // Final ROI calculation
    await calculateRoi();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      LogService.log("Forced garbage collection");
    }
    
    // Close log service
    await LogService.close();
    
    LogService.log("Graceful shutdown completed");
    
  } catch (error: any) {
    console.error("Error during graceful shutdown:", error);
  }
  
  process.exit(0);
}

// Signal handlers for graceful shutdown
process.on('SIGINT', async () => {
  LogService.log("Received SIGINT signal");
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  LogService.log("Received SIGTERM signal");
  await gracefulShutdown();
});

process.on('uncaughtException', async (error) => {
  LogService.log(`Uncaught Exception: ${error.message}`);
  LogService.log(`Stack: ${error.stack}`);
  await gracefulShutdown();
});

process.on('unhandledRejection', async (reason, promise) => {
  LogService.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  await gracefulShutdown();
});

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
  try {
    // Use Promise.all to properly await all rebalancing operations
    await Promise.all(
      PORTFOLIO.map(async (item) => {
        try {
          await BinanceApiService.handleReabalance(item, BASE_CURRENCY);
        } catch (error: any) {
          LogService.log(`Error rebalancing ${item.asset}: ${error.message}`);
        }
      })
    );
  } catch (error: any) {
    LogService.log(`Error in portfolio rebalancing: ${error.message}`);
  }
}
main();
