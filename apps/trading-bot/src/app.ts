import { config } from "dotenv";
import {
  AMOUNT_PRECISION,
  ASSET,
  PAIR,
  TIME_FRAME
} from "./constants";
import { Candle } from "./models/candle.model";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { ApiClientService } from "./services/api-client.service";
import { BinanceApiService } from "./services/binance-api.service";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { TradeService } from "./services/trade.service";
import { BtcSpotStrategy } from "./strategies/btc-spot/btc-spot-strategy";
import { StrategyManager } from "./strategies/strategy-manager";

config();

const interval = new TickInterval(Interval[TIME_FRAME]);
const strategyManager = new StrategyManager(new BtcSpotStrategy());

// Position tracking
interface Position {
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  quantity: number;
  entryTime: Date;
}

let currentPosition: Position | null = null;

const STOP_LOSS_THRESHOLD = 0.01; // 1% threshold

/**
 * Execute strategy on 1h candles and buy on signal
 * @param candlesticks - Array of candlestick data
 * @param allowBuy - Whether to execute buy orders (false if position exists)
 */
async function runTradingBot(candlesticks: Candle[], allowBuy: boolean = true) {
  try {
    const startTime = Date.now();
    const limitedCandlesticks = candlesticks.slice(-200); // Need enough for strategy
    const currentPrice = limitedCandlesticks[limitedCandlesticks.length - 1].close;

    // Execute strategy
    const strategyResult = strategyManager.executeStrategy(limitedCandlesticks);
    const { label, tp, sl } = strategyResult;
    const strategyExecutionTime = Date.now() - startTime;

    const decisionData = {
      decision: label,
      currentPrice: currentPrice,
      targetPrice: tp,
      stopLoss: sl,
      executionTimeMs: strategyExecutionTime,
      timestamp: new Date().toISOString(),
      asset: ASSET,
      pair: PAIR,
    };

    // Log strategy execution
    const timeStr = new Date().toLocaleTimeString();
    if (label.length) {
      const positionStatus = currentPosition ? ` (Position exists - signal logged only)` : '';
      LogService.log(
        `[${timeStr}] 📊 STRATEGY: ${label} | Price: $${currentPrice.toFixed(2)} | TP: $${tp.toFixed(2)} | SL: $${sl.toFixed(2)} | Execution: ${strategyExecutionTime}ms${positionStatus}`
      );

      if (startupData.withApi) {
        try {
          await ApiClientService.sendTradingDecision(decisionData);
        } catch (error: any) {
          LogService.logError(`❌ API call failed: ${error.message}`);
        }
      }
    } else {
      LogService.log(
        `[${timeStr}] 📊 STRATEGY: No signal | Price: $${currentPrice.toFixed(2)} | Execution: ${strategyExecutionTime}ms`
      );
    }

    // Buy on signal if allowed and not in position
    if (label === Operation.BUY && tp > 0) {
      const priceGap = tp - currentPrice;
      const priceGapPercent = ((priceGap / currentPrice) * 100).toFixed(2);

      if (allowBuy && !currentPosition) {
        LogService.log(
          `[${timeStr}] 🟢 BUY SIGNAL DETECTED | Entry: $${currentPrice.toFixed(2)} | TP: $${tp.toFixed(2)} (+${priceGapPercent}%) | SL: $${sl > 0 ? sl.toFixed(2) : (currentPrice * 0.99).toFixed(2)}`
        );

        try {
          // Execute buy order
          const order = await TradeService.handleBuy(tp, sl);
          
          if (order && order.status === "FILLED") {
            // Get actual executed quantity from order
            let executedQty = 0;
            if (order.executedQty) {
              executedQty = typeof order.executedQty === 'string' 
                ? parseFloat(order.executedQty) 
                : order.executedQty;
            }
            
            // If order doesn't have executedQty, get from balance
            if (!executedQty || isNaN(executedQty)) {
              const balance = await BinanceApiService.getBalance();
              const assetBalance = balance[ASSET];
              executedQty = parseFloat(assetBalance.available || "0") + parseFloat(assetBalance.locked || "0");
            }
            
            // Get executed price from fills array (for market orders) or price field
            let executedPrice = currentPrice;
            if (order.fills && order.fills.length > 0) {
              executedPrice = parseFloat(order.fills[0].price || currentPrice.toString());
            } else if (order.price) {
              executedPrice = parseFloat(order.price);
            }
            
            // Store position info
            currentPosition = {
              entryPrice: executedPrice,
              stopLoss: sl > 0 ? sl : currentPrice * 0.99, // Default 1% SL if not provided
              targetPrice: tp,
              quantity: executedQty,
              entryTime: new Date(),
            };

            const entryTimeStr = currentPosition.entryTime.toLocaleTimeString();
            LogService.log(
              `[${entryTimeStr}] ✅ POSITION OPENED | Entry: $${currentPosition.entryPrice.toFixed(2)} | Quantity: ${currentPosition.quantity.toFixed(6)} | SL: $${currentPosition.stopLoss.toFixed(2)} | TP: $${currentPosition.targetPrice.toFixed(2)}`
            );

            // Stop loss will be checked on next run (every 30 min)
          }
        } catch (error: any) {
          LogService.logError(`❌ Error executing buy order: ${error.message}`);
        }
      } else if (!allowBuy || currentPosition) {
        // Signal detected but not executed due to existing position
        const reason = !allowBuy ? "position check disabled" : "existing position";
        LogService.log(
          `[${timeStr}] ⚠️  BUY SIGNAL DETECTED BUT NOT EXECUTED | Reason: ${reason} | Entry: $${currentPrice.toFixed(2)} | TP: $${tp.toFixed(2)} (+${priceGapPercent}%) | SL: $${sl > 0 ? sl.toFixed(2) : (currentPrice * 0.99).toFixed(2)}`
        );
      }
    }
  } catch (error: any) {
    LogService.logError(`❌ Error in runTradingBot: ${error.message}`);
    throw error;
  }
}

/**
 * Check stop loss status (called during each run instead of continuous monitoring)
 * This allows the bot to run as a scheduled job and exit after completion
 */

/**
 * Check and adjust stop loss if difference > 1%
 */
async function checkAndAdjustStopLoss() {
  if (!currentPosition) {
    return;
  }

  try {
    const timeStr = new Date().toLocaleTimeString();
    
    // Get current market price
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    
    // Check if we still have the position (verify balance)
    const balance = await BinanceApiService.getBalance();
    const assetBalance = balance[ASSET];
    const currentQuantity = parseFloat(assetBalance.available) + parseFloat(assetBalance.locked);
    
    // If no position, clear tracking
    if (currentQuantity <= 0) {
      LogService.log(
        `[${timeStr}] 🔄 Position closed - clearing tracking`
      );
      currentPosition = null;
      return;
    }

    // Check if position value is still meaningful (not dust)
    const positionValue = currentQuantity * marketPrice;
    const MIN_POSITION_VALUE = 5.0; // Minimum $5 position value
    if (positionValue < MIN_POSITION_VALUE) {
      LogService.log(
        `[${timeStr}] 💨 Position value too small (dust) | Value: $${positionValue.toFixed(2)} | Clearing tracking`
      );
      currentPosition = null;
      return;
    }

    // Calculate current P&L
    const currentPnL = ((marketPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
    const pnlSign = currentPnL >= 0 ? "+" : "";
    
    // Check if we have SL order
    const openOrders = await BinanceApiService.getOpenOrders(PAIR);
    const hasSL = openOrders.some((order: any) => 
      order.type === "STOP_LOSS" || order.type === "STOP_LOSS_LIMIT"
    );
    
    // Only set SL if P&L > 1% and no SL order exists
    if (currentPnL > 1.0 && !hasSL) {
      const slPrice = Math.round((marketPrice * 0.99) * 100) / 100; // 1% below current price
      try {
        await BinanceApiService.setStopLossWithQuantity(PAIR, slPrice, currentQuantity);
        LogService.log(
          `[${timeStr}] ✅ SL order created | Price: $${slPrice.toFixed(2)} | P&L: +${currentPnL.toFixed(2)}%`
        );
        currentPosition.stopLoss = slPrice;
      } catch (error: any) {
        LogService.logError(
          `[${timeStr}] ❌ Failed to create SL order: ${error.message || JSON.stringify(error)}`
        );
      }
    }
    
    // If SL exists and P&L > 1%, check if we need to adjust it (trailing stop)
    if (hasSL && currentPnL > 1.0) {
      const slDifference = Math.abs((marketPrice - currentPosition.stopLoss) / marketPrice);
      
      // If difference > 1%, adjust stop loss
      if (slDifference > STOP_LOSS_THRESHOLD) {
        const newStopLoss = marketPrice * (1 - STOP_LOSS_THRESHOLD);
        
        // Only adjust if new SL is higher than current SL (trailing stop)
        if (newStopLoss > currentPosition.stopLoss) {
          const slIncrease = ((newStopLoss - currentPosition.stopLoss) / currentPosition.stopLoss) * 100;
          
          LogService.log(
            `[${timeStr}] 📈 TRAILING SL ADJUST | Market: $${marketPrice.toFixed(2)} | Old SL: $${currentPosition.stopLoss.toFixed(2)} → New SL: $${newStopLoss.toFixed(2)} (+${slIncrease.toFixed(2)}%) | P&L: ${pnlSign}${currentPnL.toFixed(2)}%`
          );

          const roundedSl = Math.round(newStopLoss * 100) / 100;
          await TradeService.adjustStopLoss(roundedSl, currentQuantity, currentPosition.targetPrice);
          currentPosition.stopLoss = newStopLoss;
        }
      } else {
        // Log position status (every 15 min check)
        LogService.log(
          `[${timeStr}] 👁️  POSITION MONITOR | Price: $${marketPrice.toFixed(2)} | SL: $${currentPosition.stopLoss.toFixed(2)} | TP: $${currentPosition.targetPrice.toFixed(2)} | P&L: ${pnlSign}${currentPnL.toFixed(2)}%`
        );
      }
    } else if (!hasSL) {
      // Log position status without SL
      LogService.log(
        `[${timeStr}] 👁️  POSITION MONITOR | Price: $${marketPrice.toFixed(2)} | TP: $${currentPosition.targetPrice.toFixed(2)} | P&L: ${pnlSign}${currentPnL.toFixed(2)}% | SL: Not set (waiting for >1% profit)`
      );
    }

    // Check if stop loss was hit (market price <= stop loss)
    if (marketPrice <= currentPosition.stopLoss) {
      const finalPnL = ((marketPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
      const holdingTime = Math.round((Date.now() - currentPosition.entryTime.getTime()) / (1000 * 60));
      
      LogService.log(
        `[${timeStr}] 🔴 STOP LOSS HIT | Entry: $${currentPosition.entryPrice.toFixed(2)} | Exit: $${marketPrice.toFixed(2)} | SL: $${currentPosition.stopLoss.toFixed(2)} | P&L: ${finalPnL >= 0 ? "+" : ""}${finalPnL.toFixed(2)}% | Holding: ${holdingTime}min`
      );
      
      // Position will be closed by stop loss order, clear tracking
      currentPosition = null;
    }

    // Check if target price was hit
    if (currentPosition && marketPrice >= currentPosition.targetPrice) {
      const finalPnL = ((marketPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
      const holdingTime = Math.round((Date.now() - currentPosition.entryTime.getTime()) / (1000 * 60));
      
      LogService.log(
        `[${timeStr}] 🎯 TARGET PRICE HIT | Entry: $${currentPosition.entryPrice.toFixed(2)} | Exit: $${marketPrice.toFixed(2)} | TP: $${currentPosition.targetPrice.toFixed(2)} | P&L: +${finalPnL.toFixed(2)}% | Holding: ${holdingTime}min`
      );
      
      // Position will be closed by take profit order, clear tracking
      currentPosition = null;
    }
  } catch (error: any) {
    LogService.logError(`❌ Error checking stop loss: ${error.message}`);
  }
}

/**
 * Check for existing position and set TP/SL if needed
 */
async function setupExistingPosition() {
  try {
    const timeStr = new Date().toLocaleTimeString();
    
    // Check for existing orders first
    const openOrders = await BinanceApiService.getOpenOrders(PAIR);
    const hasTP = openOrders?.some((order: any) => order.type === "LIMIT" && order.side === "SELL");
    const hasSL = openOrders?.some((order: any) => 
      order.type === "STOP_LOSS" || order.type === "STOP_LOSS_LIMIT"
    );
    
    // Check if we have existing balance
    let balance = await BinanceApiService.getBalance();
    let assetBalance = balance[ASSET];
    let availableQuantity = parseFloat(assetBalance.available || "0");
    let lockedQuantity = parseFloat(assetBalance.locked || "0");
    let totalQuantity = availableQuantity + lockedQuantity;
    
    if (totalQuantity <= 0) {
      return false;
    }
    
    // Get market price to calculate position value
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const positionValue = totalQuantity * marketPrice;
    
    // Check minimum notional value (Binance requires at least $5-10 for trades)
    // Treat balances below $5 as dust and ignore them
    const MIN_POSITION_VALUE = 5.0; // Minimum $5 position value
    if (positionValue < MIN_POSITION_VALUE) {
      LogService.log(
        `[${timeStr}] 💨 Ignoring dust balance | Quantity: ${totalQuantity.toFixed(AMOUNT_PRECISION)} ${ASSET} | Value: $${positionValue.toFixed(2)} (below $${MIN_POSITION_VALUE} minimum)`
      );
      return false;
    }
    
    // Format quantity to match Binance LOT_SIZE requirements
    // Use 99% to account for trading fees (0.1% buy + 0.1% sell = 0.2%) and rounding
    const quantity = parseFloat((availableQuantity * 0.99).toFixed(AMOUNT_PRECISION));
    
    // Check minimum quantity
    if (quantity < 0.00001) {
      LogService.log(
        `[${timeStr}] ⚠️  Available balance too small: ${quantity.toFixed(AMOUNT_PRECISION)} ${ASSET} | Total: ${totalQuantity.toFixed(AMOUNT_PRECISION)} | Locked: ${lockedQuantity.toFixed(AMOUNT_PRECISION)}`
      );
      return false;
    }
    
    // Get entry price from trade history (needed for calculations)
    let entryPrice = marketPrice;
    try {
      const trades = await BinanceApiService.getRecentTrades(PAIR, 20);
      if (trades && trades.length > 0) {
        const buyTrades = trades.filter((t: any) => t.isBuyer).sort((a: any, b: any) => b.time - a.time);
        if (buyTrades.length > 0) {
          entryPrice = parseFloat(buyTrades[0].price);
        }
      }
    } catch (error: any) {
      // Use market price if can't get trade history
    }
    
    // If both TP and SL exist, just track the position (don't cancel/recreate)
    if (hasTP && hasSL) {
      LogService.log(
        `[${timeStr}] ✅ Existing position with TP/SL orders | Quantity: ${totalQuantity.toFixed(AMOUNT_PRECISION)}`
      );
      const slOrder = openOrders.find((order: any) => 
        order.type === "STOP_LOSS" || order.type === "STOP_LOSS_LIMIT"
      );
      const tpOrder = openOrders.find((order: any) => order.type === "LIMIT" && order.side === "SELL");
      
      currentPosition = {
        entryPrice: entryPrice,
        stopLoss: parseFloat(slOrder?.stopPrice || slOrder?.price || (marketPrice * 0.99).toString()),
        targetPrice: parseFloat(tpOrder?.price || (marketPrice * 1.02).toString()),
        quantity: totalQuantity,
        entryTime: new Date(),
      };
      
      // Check stop loss status during this run
      await checkAndAdjustStopLoss();
      return true;
    }
    
    // If TP exists but no available quantity, don't cancel/recreate
    if (hasTP && availableQuantity <= 0) {
      LogService.log(
        `[${timeStr}] ✅ TP order already exists | No available quantity to trade | Quantity: ${totalQuantity.toFixed(AMOUNT_PRECISION)} (all locked)`
      );
      const tpOrder = openOrders.find((order: any) => order.type === "LIMIT" && order.side === "SELL");
      
      currentPosition = {
        entryPrice: entryPrice,
        stopLoss: marketPrice * 0.99, // Default SL
        targetPrice: parseFloat(tpOrder?.price || (marketPrice * 1.02).toString()),
        quantity: totalQuantity,
        entryTime: new Date(),
      };
      
      // Check stop loss status during this run
      await checkAndAdjustStopLoss();
      return true;
    }
    
    // If position exists but orders are missing, create them
    // Only cancel orders if we need to create new ones and have available quantity
    if ((!hasTP || !hasSL) && availableQuantity > 0) {
      // Cancel existing orders only if we need to create new ones
      if (openOrders && openOrders.length > 0) {
        LogService.log(
          `[${timeStr}] 🔄 Cancelling ${openOrders.length} existing order(s) to free balance for new orders`
        );
        await BinanceApiService.cancelAllOrders(PAIR);
        // Wait for balance to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Re-check balance after cancellation
        balance = await BinanceApiService.getBalance();
        assetBalance = balance[ASSET];
        availableQuantity = parseFloat(assetBalance.available || "0");
        lockedQuantity = parseFloat(assetBalance.locked || "0");
        totalQuantity = availableQuantity + lockedQuantity;
      }
      
      LogService.log(
        `[${timeStr}] ⚠️  Position exists but orders missing | TP: ${hasTP ? '✅' : '❌'} | SL: ${hasSL ? '✅' : '❌'} | Creating missing orders...`
      );
    } else if ((!hasTP || !hasSL) && availableQuantity <= 0) {
      LogService.log(
        `[${timeStr}] ⚠️  Orders missing but no available quantity | TP: ${hasTP ? '✅' : '❌'} | SL: ${hasSL ? '✅' : '❌'} | Available: ${availableQuantity.toFixed(AMOUNT_PRECISION)} | Skipping order creation`
      );
      // Track position but don't create orders
      currentPosition = {
        entryPrice: entryPrice,
        stopLoss: marketPrice * 0.99,
        targetPrice: marketPrice * 1.02,
        quantity: totalQuantity,
        entryTime: new Date(),
      };
      await checkAndAdjustStopLoss();
      return true;
    }
    
    // Log balance details
    LogService.log(
      `[${timeStr}] 💰 Balance | Available: ${availableQuantity.toFixed(AMOUNT_PRECISION)} | Locked: ${lockedQuantity.toFixed(AMOUNT_PRECISION)} | Total: ${totalQuantity.toFixed(AMOUNT_PRECISION)}`
    );
    
    // Entry price already retrieved above, log it
    if (entryPrice !== marketPrice) {
      LogService.log(
        `[${timeStr}] 📍 Entry price from trade history: $${entryPrice.toFixed(2)}`
      );
    } else {
      LogService.log(
        `[${timeStr}] ⚠️  Using current price as entry: $${entryPrice.toFixed(2)}`
      );
    }
    
    // Calculate TP from entry price (2% above entry)
    const tpPrice = Math.round((entryPrice * 1.02) * 100) / 100;
    const currentPnL = ((marketPrice - entryPrice) / entryPrice) * 100;
    
    // Create TP/SL orders
    LogService.log(
      `[${timeStr}] 📍 Setting up orders | Entry: $${entryPrice.toFixed(2)} | Current: $${marketPrice.toFixed(2)} | P&L: ${currentPnL >= 0 ? "+" : ""}${currentPnL.toFixed(2)}%`
    );
    
    // Only create TP order if it doesn't exist and we have available quantity
    if (!hasTP && availableQuantity > 0) {
      // Re-check balance right before creating order to get most up-to-date amount
      const finalBalance = await BinanceApiService.getBalance();
      const finalAssetBalance = finalBalance[ASSET];
      const finalAvailable = parseFloat(finalAssetBalance.available || "0");
      
      // Use 98.5% of available to account for fees (0.1% buy + 0.1% sell) and rounding overflow
      const tpQuantity = parseFloat((finalAvailable * 0.985).toFixed(AMOUNT_PRECISION));
      
      LogService.log(
        `[${timeStr}] 🔧 Creating TP order | Price: $${tpPrice.toFixed(2)} | Available: ${finalAvailable.toFixed(AMOUNT_PRECISION)} | Using: ${tpQuantity.toFixed(AMOUNT_PRECISION)} (98.5% to account for fees)`
      );
      
      if (tpQuantity < 0.00001) {
        LogService.logError(
          `[${timeStr}] ❌ Quantity too small for TP order | Available: ${finalAvailable.toFixed(AMOUNT_PRECISION)} | Calculated: ${tpQuantity.toFixed(AMOUNT_PRECISION)}`
        );
      } else {
        try {
          await BinanceApiService.setTakeProfit(PAIR, tpPrice, tpQuantity);
          LogService.log(
            `[${timeStr}] ✅ TP order created | Price: $${tpPrice.toFixed(2)} | Quantity: ${tpQuantity.toFixed(AMOUNT_PRECISION)}`
          );
        } catch (error: any) {
          // Check if error is because order already exists or balance issue
          const errorMsg = error.message || JSON.stringify(error);
          if (errorMsg.includes('-2010') || errorMsg.includes('insufficient balance')) {
            // Try with even smaller quantity (98% of available)
            const fallbackQuantity = parseFloat((finalAvailable * 0.98).toFixed(AMOUNT_PRECISION));
            if (fallbackQuantity >= 0.00001 && fallbackQuantity < tpQuantity) {
              try {
                LogService.log(
                  `[${timeStr}] 🔄 Retrying TP order with smaller quantity: ${fallbackQuantity.toFixed(AMOUNT_PRECISION)}`
                );
                await BinanceApiService.setTakeProfit(PAIR, tpPrice, fallbackQuantity);
                LogService.log(
                  `[${timeStr}] ✅ TP order created (retry) | Price: $${tpPrice.toFixed(2)} | Quantity: ${fallbackQuantity.toFixed(AMOUNT_PRECISION)}`
                );
              } catch (retryError: any) {
                LogService.logError(
                  `[${timeStr}] ❌ TP order retry failed: ${retryError.message || JSON.stringify(retryError)}`
                );
              }
            } else {
              LogService.logError(
                `[${timeStr}] ❌ Failed to create TP order: ${errorMsg} | Available: ${finalAvailable.toFixed(AMOUNT_PRECISION)}`
              );
            }
          } else {
            // Other error (might be duplicate order, which is OK)
            LogService.log(
              `[${timeStr}] ⚠️  TP order may already exist or error: ${errorMsg}`
            );
          }
        }
      }
    } else if (hasTP) {
      LogService.log(
        `[${timeStr}] ✅ TP order already exists - skipping creation`
      );
    } else if (availableQuantity <= 0) {
      LogService.log(
        `[${timeStr}] ⚠️  No available quantity for TP order | Available: ${availableQuantity.toFixed(AMOUNT_PRECISION)}`
      );
    }
    
    // Only set SL if P&L > 1% (positive and profitable)
    if (currentPnL > 1.0) {
      const slPrice = Math.round((marketPrice * 0.99) * 100) / 100; // 1% below current price
      try {
        await BinanceApiService.setStopLossWithQuantity(PAIR, slPrice, quantity);
        LogService.log(
          `[${timeStr}] ✅ SL order created | Price: $${slPrice.toFixed(2)} | Quantity: ${quantity.toFixed(AMOUNT_PRECISION)}`
        );
      } catch (error: any) {
        LogService.logError(
          `[${timeStr}] ❌ Failed to create SL order: ${error.message || JSON.stringify(error)}`
        );
      }
      
      currentPosition = {
        entryPrice: entryPrice,
        stopLoss: slPrice,
        targetPrice: tpPrice,
        quantity: totalQuantity,
        entryTime: new Date(),
      };
    } else {
      LogService.log(
        `[${timeStr}] ⏸️  SL not set | P&L: ${currentPnL >= 0 ? "+" : ""}${currentPnL.toFixed(2)}% (waiting for >1% profit)`
      );
      
      // Track position without SL order (will be set when P&L > 1%)
      currentPosition = {
        entryPrice: entryPrice,
        stopLoss: entryPrice * 0.99, // Track but don't set order yet
        targetPrice: tpPrice,
        quantity: totalQuantity,
        entryTime: new Date(),
      };
    }
    
    // Check stop loss status during this run
    await checkAndAdjustStopLoss();
    return true;
  } catch (error: any) {
    LogService.logError(`❌ Error setting up existing position: ${error.message}`);
    return false;
  }
}

/**
 * Main function - executes strategy on 1h candles
 */
async function main() {
  const startTime = new Date();
  const startTimeStr = startTime.toLocaleString();
  const executionId = startTime.getTime().toString().slice(-6);
  
  // Execution border - START
  LogService.log(`\n${LogService.createBorder("", 80, "═")}`);
  LogService.log(LogService.createBorder(`🚀 EXECUTION #${executionId} - STARTED`, 80, "═"));
  LogService.log(`${LogService.createBorder("", 80, "═")}\n`);
  
  LogService.log(`📅 Date & Time: ${startTimeStr}`);
  LogService.log(`📋 Configuration:`);
  LogService.log(`   • Asset: ${ASSET}`);
  LogService.log(`   • Trading Pair: ${PAIR}`);
  LogService.log(`   • Timeframe: ${TIME_FRAME}`);
  LogService.log(`   • Stop Loss Threshold: 1%`);
  LogService.log(`   • Check Interval: 30 minutes`);
  LogService.log(`\n${LogService.createSeparator("─", 80)}\n`);

  try {
    // Check for existing position first
    const hasExistingPosition = await setupExistingPosition();
    
    if (hasExistingPosition) {
      LogService.log(`\n${LogService.createSeparator("─", 80)}`);
      LogService.log(`✅ Existing Position Detected`);
      LogService.log(`   • TP/SL orders are set and active`);
      LogService.log(`   • Position monitoring is enabled`);
      LogService.log(`${LogService.createSeparator("─", 80)}\n`);
    }
    
    // Fetch 1h candlestick data
    LogService.log(`📊 Fetching market data...`);
    const candlesticks = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval()
    );

    if (candlesticks.length === 0) {
      throw new Error("No candlestick data received");
    }

    LogService.log(`   • Fetched ${candlesticks.length} candles`);
    LogService.log(`   • Trading Pair: ${PAIR}`);
    LogService.log(`   • Timeframe: ${TIME_FRAME}`);
    LogService.log(``);

    // Always execute strategy to detect and log signals (even if we have a position)
    // This ensures we don't miss signals and can track market conditions
    await runTradingBot(candlesticks.slice(0, -1), !hasExistingPosition);
    
    // If we have an existing position, show position details and check stop loss
    if (hasExistingPosition && currentPosition) {
      try {
        // Check stop loss status during this run
        await checkAndAdjustStopLoss();
        
        const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
        const currentPnL = ((marketPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
        const pnlSign = currentPnL >= 0 ? "+" : "";
        const holdingTime = Math.round((Date.now() - currentPosition.entryTime.getTime()) / (1000 * 60));
        const positionValue = currentPosition.quantity * marketPrice;
        const entryValue = currentPosition.quantity * currentPosition.entryPrice;
        const unrealizedPnL = positionValue - entryValue;
        
        LogService.log(`\n${LogService.createSeparator("─", 80)}`);
        LogService.log(`📊 POSITION STATUS`);
        LogService.log(`${LogService.createSeparator("─", 80)}`);
        LogService.log(`   Entry Price:      $${currentPosition.entryPrice.toFixed(2)}`);
        LogService.log(`   Current Price:     $${marketPrice.toFixed(2)}`);
        LogService.log(`   Quantity:          ${currentPosition.quantity.toFixed(AMOUNT_PRECISION)} ${ASSET}`);
        LogService.log(`   Entry Value:       $${entryValue.toFixed(2)}`);
        LogService.log(`   Current Value:     $${positionValue.toFixed(2)}`);
        LogService.log(`   P&L:               ${pnlSign}${currentPnL.toFixed(2)}% (${pnlSign}$${unrealizedPnL.toFixed(2)})`);
        LogService.log(`   Stop Loss:         $${currentPosition.stopLoss.toFixed(2)}`);
        LogService.log(`   Take Profit:       $${currentPosition.targetPrice.toFixed(2)}`);
        LogService.log(`   Holding Time:      ${holdingTime} minutes`);
        LogService.log(`${LogService.createSeparator("─", 80)}\n`);
      } catch (error: any) {
        LogService.logError(`⚠️  Could not fetch position details: ${error.message}`);
      }
    }

    const endTime = new Date();
    const endTimeStr = endTime.toLocaleTimeString();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    const durationStr = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`;
    
    // Execution border - END
    LogService.log(`\n${LogService.createSeparator("─", 80)}\n`);
    LogService.log(`✅ Execution Summary:`);
    LogService.log(`   • Status: Completed successfully`);
    LogService.log(`   • End Time: ${endTimeStr}`);
    LogService.log(`   • Duration: ${durationStr}`);
    LogService.log(`\n${LogService.createBorder(`✅ EXECUTION #${executionId} - COMPLETED`, 80, "═")}`);
    LogService.log(`${LogService.createBorder("", 80, "═")}\n`);
    
    // Exit process after completion (bot runs as scheduled job)
    process.exit(0);
  } catch (error: any) {
    const errorTime = new Date();
    const errorTimeStr = errorTime.toLocaleTimeString();
    const duration = Math.round((errorTime.getTime() - startTime.getTime()) / 1000);
    const durationStr = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`;
    
    // Execution border - ERROR
    LogService.logError(`\n${LogService.createSeparator("─", 80)}\n`);
    LogService.logError(`❌ Execution Summary:`);
    LogService.logError(`   • Status: Failed`);
    LogService.logError(`   • End Time: ${errorTimeStr}`);
    LogService.logError(`   • Duration: ${durationStr}`);
    LogService.logError(`   • Error: ${error.message}`);
    LogService.logError(`\n${LogService.createBorder(`❌ EXECUTION #${executionId} - FAILED`, 80, "═")}`);
    LogService.logError(`${LogService.createBorder("", 80, "═")}\n`);
    process.exit(1);
  }
}

export const startupData = {
  asset: ASSET,
  pair: PAIR,
  timeFrame: TIME_FRAME,
  mode: process?.env?.["MODE"] || "PRODUCTION",
  withApi: JSON.parse(process?.env?.["WITH_API"] || "false") as boolean,
  timestamp: new Date().toISOString(),
};

// Cleanup on exit
process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

main();
