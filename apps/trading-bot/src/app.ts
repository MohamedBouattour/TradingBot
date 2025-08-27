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

const interval = new TickInterval(Interval[TIME_FRAME]);
const strategyManager = new StrategyManager(new RSIStrategy());
const memoryMonitor = MemoryMonitor.getInstance();

async function runTradingBot(candlestick: Candle[]) {
  try {
    const startTime = Date.now();

    // Limit candlestick array size to prevent memory growth
    const limitedCandlesticks = candlestick.slice(-100);
    const currentPrice =
      limitedCandlesticks[limitedCandlesticks.length - 1].close;

    const { tp } = strategyManager.executeStrategy(limitedCandlesticks);
    // disable strategy
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

      // Send trading decision to API (simple, no retry)
      if (startupData.withApi) {
        try {
          await ApiClientService.sendTradingDecision(decisionData);
        } catch (error: any) {
          LogService.logError(`API call failed: ${error.message}`);
        }
      }
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
    await syncPortfolioWithDatabase();
  } catch (error: any) {
    LogService.logError(`Error in runTradingBot: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

async function main() {
  LogService.logStructured(
    "INFO",
    "SYSTEM",
    "Trading Bot cron job started",
    startupData
  );

  try {
    // Sync portfolio with database on startup
    if (startupData.withApi === true) {
      try {
        await syncPortfolioWithDatabase();
      } catch (error: any) {
        LogService.logError(`Portfolio sync failed: ${error.message}`);
      }
    }

    // Fetch current candlestick data
    const candlesticks = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval()
    );

    // Run trading strategy once
    await runTradingBot(candlesticks.slice(0, -1));

    LogService.logStructured(
      "INFO",
      "SYSTEM",
      "Trading Bot cron job completed successfully"
    );
  } catch (error: any) {
    LogService.logError(`Error in cron job execution: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // 🔥 FORCE EXIT on error
    setTimeout(() => process.exit(1), 100);
    return;
  }

  // 🔥 FORCE EXIT after success - simple and guaranteed
  setTimeout(() => process.exit(0), 100);
}

export async function calculateRoi() {
  try {
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
    if (startupData.withApi) {
      try {
        await ApiClientService.sendROIData(roiData);
      } catch (error: any) {
        LogService.logError(`Failed to send ROI data: ${error.message}`);
      }
    }

    // Create structured log message with portfolio breakdown
    const portfolioInfo = `${ASSET}: $${assetValue[0].toFixed(2)} | ${BASE_CURRENCY}: $${assetValue[1].toFixed(2)} | Portfolio: $${portfolioValueInUSD.toFixed(2)} | Total: $${total.toFixed(2)} | ROI: ${roi.toFixed(2)}% | PNL: $${pnl.toFixed(2)} (${pnl >= 0 ? "PROFIT" : "LOSS"})`;

    const structuredMessage = `
#####################################################################################################
# ${portfolioInfo.padEnd(79)} #
#####################################################################################################`;

    LogService.logAssetValue(structuredMessage);
    return roi;
  } catch (error: any) {
    LogService.logError(`Error calculating ROI: ${error.message}`);
    return 0;
  }
}

async function rebalancePorfolio() {
  try {
    LogService.logRebalance(
      `Starting portfolio rebalancing ${PORTFOLIO.reduce(
        (result, current) => (result += current.value),
        0
      )} $`
    );

    // Use Promise.allSettled to handle individual failures
    const rebalanceResults = await Promise.allSettled(
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

    LogService.logRebalance("Portfolio rebalancing completed");
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

    if (startupData.withApi) {
      await waitForApiAvailability();
    }

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

async function waitForApiAvailability(): Promise<void> {
  try {
    const isHealthy = await ApiClientService.checkHealth();
    if (isHealthy) {
      LogService.logStructured("INFO", "SYSTEM", "API is available and ready");
      return;
    }
  } catch (error: any) {
    LogService.logError(`API health check failed: ${error.message}`);
  }
}

export const startupData = {
  asset: ASSET,
  pair: PAIR,
  timeFrame: TIME_FRAME,
  initialBalance: INITIAL_BALANCE,
  portfolioItems: PORTFOLIO.length,
  mode: process?.env?.["MODE"] || "PRODUCTION",
  withApi: JSON.parse(process?.env?.["WITH_API"] || "false") as boolean,
  timestamp: new Date().toISOString(),
};

main();
