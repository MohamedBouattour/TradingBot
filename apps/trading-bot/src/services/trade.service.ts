import { Order } from "node-binance-api/dist/types";
import {
  AMOUNT_PRECISION,
  ASSET,
  BALANCE_POSTIOTION_RATIO,
  BASE_CURRENCY,
  PAIR,
  PRICE_PRECISION,
  TARGET_ROI,
  USE_TP,
} from "../constants";
import { BinanceApiService } from "./binance-api.service";
import { LogService } from "./log.service";

/**
 * Service responsible for executing trading operations
 */
export class TradeService {
  /**
   * Places a buy order with take profit based on configured parameters
   * Uses BASE_CURRENCY balance and TARGET_ROI for calculations
   * @throws Error if the trade execution fails
   */
  public static async handleBuy(
    tpPrice?: number,
    slPrice?: number
  ): Promise<void | Order> {
    const timeStr = new Date().toLocaleTimeString();
    
    // Cancel any pending orders first to free up locked balance
    try {
      const openOrders = await BinanceApiService.getOpenOrders(PAIR);
      if (openOrders && openOrders.length > 0) {
        LogService.log(
          `[${timeStr}] 🔄 Cancelling ${openOrders.length} pending order(s) to free balance`
        );
        await BinanceApiService.cancelAllOrders(PAIR);
      }
    } catch (error: any) {
      // Ignore errors if no orders exist
    }
    
    // Get full balance info
    const fullBalance = await BinanceApiService.getBalance();
    const usdtBalance = fullBalance[BASE_CURRENCY];
    const availableUSDT = parseFloat(usdtBalance?.available || "0");
    const lockedUSDT = parseFloat(usdtBalance?.locked || "0");
    const totalUSDT = availableUSDT + lockedUSDT;
    
    // Use configured ratio of available balance (ensure we have enough)
    const tradeBalance = availableUSDT * BALANCE_POSTIOTION_RATIO;
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    
    // Calculate quantity with proper precision
    const quantity = parseFloat(
      (tradeBalance / marketPrice).toFixed(AMOUNT_PRECISION)
    );
    const tradeValue = quantity * marketPrice;
    
    // Ensure we have enough balance for the trade (add small buffer for fees)
    const requiredBalance = tradeValue * 1.001; // 0.1% buffer for fees
    
    // Log balance details
    LogService.log(
      `[${timeStr}] 💰 BALANCE CHECK | Available: $${availableUSDT.toFixed(2)} | Locked: $${lockedUSDT.toFixed(2)} | Total: $${totalUSDT.toFixed(2)} | Using: $${tradeBalance.toFixed(2)} (${(BALANCE_POSTIOTION_RATIO * 100).toFixed(1)}%)`
    );
    
    if (!availableUSDT || availableUSDT < 10) {
      LogService.log(
        `[${timeStr}] ❌ Insufficient balance: Available USDT = $${availableUSDT.toFixed(2)} (minimum $10 required)`
      );
      return;
    }
    
    if (availableUSDT < requiredBalance) {
      LogService.log(
        `[${timeStr}] ❌ Insufficient balance for trade: Available=$${availableUSDT.toFixed(2)} | Required=$${requiredBalance.toFixed(2)}`
      );
      return;
    }
    
    if (quantity <= 0 || tradeValue < 10) {
      LogService.log(
        `[${timeStr}] ❌ Trade value too small: Quantity=${quantity} | Value=$${tradeValue.toFixed(2)} (minimum $10 required)`
      );
      return;
    }
    
    LogService.log(
      `[${timeStr}] 📝 PLACING ORDER | Pair: ${PAIR} | Quantity: ${quantity} | Price: $${marketPrice.toFixed(2)} | Value: $${tradeValue.toFixed(2)} | TP: $${tpPrice?.toFixed(2) || 'N/A'} | SL: $${slPrice?.toFixed(2) || 'N/A'}`
    );
    
    try {
      const order = await BinanceApiService.buyAndSetTPSL(
        PAIR,
        quantity,
        tpPrice,
        slPrice
      );
      
      LogService.log(
        `[${timeStr}] ✅ ORDER FILLED | Order ID: ${order.orderId} | Status: ${order.status} | Executed: ${order.executedQty}`
      );
      
      return order;
    } catch (error: any) {
      LogService.logError(
        `[${timeStr}] ❌ ORDER FAILED | ${error.message || JSON.stringify(error)}`
      );
      return;
    }
  }

  /**
   * Places a sell order based on configured parameters
   * Uses ASSET balance for quantity calculation
   * @throws Error if the trade execution fails
   */
  public static async handleSell(): Promise<void | Order> {
    // cancel all pendig orders
    try {
      await BinanceApiService.cancelAllOrders(PAIR);
    } catch (error: any) {
      LogService.log(error.message + `no open orders`);
    }
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    // sell all assets
    const quantity = parseFloat(
      (
        (await BinanceApiService.getBalance())[ASSET].available *
        BALANCE_POSTIOTION_RATIO
      ).toFixed(AMOUNT_PRECISION)
    );
    LogService.log(
      `Sell: ${PAIR} quantity: ${quantity} value ${
        quantity * marketPrice
      } Price: ${marketPrice}`
    );
    if (!quantity || !marketPrice || quantity * marketPrice <= 10) {
      LogService.log(
        `Insiffficient balance to sell: ${PAIR} quantity: ${quantity} value ${
          quantity * marketPrice
        }}`
      );
      return;
    }
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} SellPrice ${marketPrice}`
    );
    try {
      return await BinanceApiService.sell(PAIR, quantity);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
      return;
    }
  }

  public static async adjustStopLoss(slPrice: number, quantity?: number, tpPrice?: number) {
    try {
      const timeStr = new Date().toLocaleTimeString();
      
      // Round stop loss price to 2 decimal places (Binance requirement for BTC)
      const roundedSlPrice = Math.round(slPrice * 100) / 100;
      
      // Get existing orders - if we have SL orders, we need to cancel and recreate
      const openOrders = await BinanceApiService.getOpenOrders(PAIR);
      const hasSlOrders = openOrders.some((order: any) => 
        order.type === "STOP_LOSS" || order.type === "STOP_LOSS_LIMIT"
      );
      
      if (hasSlOrders) {
        LogService.log(
          `[${timeStr}] 🔄 Cancelling existing orders to update stop loss`
        );
        // Cancel all orders (including TP), then recreate both
        await BinanceApiService.cancelAllOrders(PAIR);
        
        // Recreate TP order if provided
        if (tpPrice && quantity) {
          try {
            await BinanceApiService.setTakeProfit(PAIR, tpPrice, quantity);
            LogService.log(
              `[${timeStr}] ✅ TP order recreated at $${tpPrice.toFixed(2)}`
            );
          } catch (error: any) {
            LogService.logWarning(
              `[${timeStr}] ⚠️  Failed to recreate TP order: ${error.message}`
            );
          }
        }
      }
      
      LogService.log(
        `[${timeStr}] 🔧 Setting stop loss to: $${roundedSlPrice.toFixed(2)}`
      );
      
      // Use provided quantity or get from balance
      if (quantity) {
        return await BinanceApiService.setStopLossWithQuantity(PAIR, roundedSlPrice, quantity);
      } else {
        return BinanceApiService.setStopLoss(PAIR, roundedSlPrice);
      }
    } catch (error: any) {
      const timeStr = new Date().toLocaleTimeString();
      LogService.logError(
        `[${timeStr}] ❌ Error adjusting stop loss: ${error.message || JSON.stringify(error)}`
      );
    }
    return;
  }

  public static async testOrders(pair: string) {
    try {
      await BinanceApiService.buyAndSetTPSL(pair, 2, 3.66, 3.82);
      LogService.log("Test order executed");
      LogService.log("Test order succcess");
    } catch (error: any) {
      LogService.log(error.message);
    }
  }
}
