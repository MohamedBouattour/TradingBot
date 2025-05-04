import { Order } from "node-binance-api/dist/types";
import {
  ASSET,
  BALANCE_POSTIOTION_RATIO,
  BASE_CURRENCY,
  PAIR,
  TARGET_ROI,
  getPrecision,
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
  public static async handleBuy(): Promise<void | Order> {
    const balance =
      (await BinanceApiService.getBalance())[BASE_CURRENCY].available *
      BALANCE_POSTIOTION_RATIO;

    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const quantity = parseFloat(
      (balance / marketPrice).toFixed(getPrecision(marketPrice))
    );
    const tpPrice = parseFloat(
      (marketPrice * TARGET_ROI).toFixed(getPrecision(marketPrice))
    );
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} BuyPrice ${marketPrice}`
    );
    if (!balance || balance <= 10) {
      LogService.log(
        `Insiffficient balance to buy: ${PAIR} amount: ${balance} value`
      );
      return;
    }
    try {
      const order = await BinanceApiService.buyAndSetTakeProfit(
        PAIR,
        quantity,
        tpPrice
      );
      return order;
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
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
    LogService.log(`0`);
    try {
      LogService.log(`1`);
      await BinanceApiService.cancelAllOrders(PAIR);
      LogService.log(`2`);
    } catch (error: any) {
      LogService.log(`Error cancelAllOrders: ${error.message}`);
    } finally {
      LogService.log(`no open orders`);
    }
    LogService.log(`3`);
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    // sell all assets
    LogService.log(`4`);
    const quantity = parseFloat(
      (
        (await BinanceApiService.getBalance())[ASSET].available *
        BALANCE_POSTIOTION_RATIO
      ).toFixed(getPrecision(marketPrice))
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

  public static async adjustStopLoss(slPrice: number) {
    try {
      LogService.log(`1`);
      await BinanceApiService.cancelAllOrders(PAIR);
      LogService.log(`2`);
    } catch (error: any) {
      LogService.log(`Error cancelAllOrders: ${error.message}`);
    } finally {
      LogService.log(`no open orders`);
    }
    try {
      LogService.log(`Adjusting stop loss to: ${slPrice}`);
      return BinanceApiService.setStopLoss(PAIR, slPrice);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
    }
    return;
  }
}
