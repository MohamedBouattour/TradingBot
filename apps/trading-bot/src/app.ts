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

// Simple timeout protection
let timeoutId: any;

async function runTradingBot(candlestick: Candle[]) {
  try {
    const startTime = Date.now();

    const limitedCandlesticks = candlestick.slice(-100);
    const currentPrice =
      limitedCandlesticks[limitedCandlesticks.length - 1].close;

    const { tp } = strategyManager.executeStrategy(limitedCandlesticks);
    const label = "";
    const strategyExecutionTime = Date.now() - startTime;

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
  } catch (error: any) {
    LogService.logError(`Error in runTradingBot: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

async function main() {
  // 5-minute timeout protection
  timeoutId = setTimeout(() => {
    console.log("Force exit after 5 minutes");
    process.exit(1);
  }, 300000);

  LogService.logStructured(
    "INFO",
    "SYSTEM",
    "Trading Bot cron job started",
    startupData
  );

  try {
    memoryMonitor.startMonitoring();

    if (startupData.withApi === true) {
      await syncPortfolioWithDatabase();
    }

    const candlesticks = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval()
    );
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
    process.exit(1);
  } finally {
    // Cleanup
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (memoryMonitor && typeof memoryMonitor.stopMonitoring === "function") {
      memoryMonitor.stopMonitoring();
    }
    // Force exit
    setTimeout(() => process.exit(0), 100);
  }
}

export async function calculateRoi() {
  try {
    const assetValue = await BinanceApiService.getAssetValue();
    const portfolioValueInUSD = PORTFOLIO.reduce((total, item) => {
      return total + (item.valueInBaseCurrency || 0);
    }, 0);

    console.log(`Total portfolio value: $${portfolioValueInUSD.toFixed(2)}`);

    const total = assetValue[1] + portfolioValueInUSD;
    const roi = ((total - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
    const pnl = total - INITIAL_BALANCE;

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

    if (startupData.withApi) {
      try {
        await ApiClientService.sendROIData(roiData);
      } catch (error: any) {
        LogService.logError(`Failed to send ROI data: ${error.message}`);
      }
    }

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
      `Starting portfolio rebalancing ${PORTFOLIO.reduce((result, current) => (result += current.value), 0)} $`
    );

    const rebalanceResults = await Promise.allSettled(
      PORTFOLIO.map(async (item) => {
        try {
          const result = await BinanceApiService.handleRebalance(
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
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const isHealthy = await ApiClientService.checkHealth();

      if (isHealthy) {
        LogService.logStructured(
          "INFO",
          "SYSTEM",
          "API is available and ready"
        );
        return;
      }

      if (attempts < maxAttempts) {
        await delay(2000);
      }
    } catch (error: any) {
      if (attempts < maxAttempts) {
        await delay(2000);
      }
    }
  }

  LogService.logError("API not available after maximum attempts");
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
