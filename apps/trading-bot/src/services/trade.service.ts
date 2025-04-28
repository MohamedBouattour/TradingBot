import { Order } from "node-binance-api/dist/types";
import {
  ASSET,
  BALANCE_POSTIOTION_RATIO,
  BASE_CURRENCY,
  PAIR,
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
    if (!balance || balance <= 10) {
      LogService.log(
        `Insiffficient balance to buy: ${PAIR} amount: ${balance} value @${new Date().toISOString()}`
      );
      return;
    }
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const quantity = parseFloat((balance / marketPrice).toFixed(5));
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} BuyPrice ${marketPrice}`
    );
    try {
      const order = await BinanceApiService.buyAndSetTakeProfit(PAIR, quantity);
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
    await BinanceApiService.cancelAllOrders(PAIR);

    // sell all assets
    const quantity = parseFloat(
      (
        (await BinanceApiService.getBalance())[ASSET].available *
        BALANCE_POSTIOTION_RATIO
      ).toFixed(5)
    );
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    if (!quantity || !marketPrice || quantity * marketPrice <= 10) {
      LogService.log(
        `Insiffficient balance to sell: ${PAIR} quantity: ${quantity} value ${
          quantity * marketPrice
        } @${new Date().toISOString()}`
      );
      return;
    }
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} SellPrice ${marketPrice} @${new Date().toISOString()}`
    );
    try {
      return await BinanceApiService.sell(PAIR, quantity);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
      return;
    }
  }

  public static async adjustStopLoss(slPrice: number) {
    await BinanceApiService.cancelAllOrders(PAIR);
    try {
      LogService.log(`Adjusting stop loss to: ${slPrice}`);
      return BinanceApiService.setStopLoss(PAIR, slPrice);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
      return;
    }
  }
}
