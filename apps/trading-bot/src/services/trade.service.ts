import { Order } from "node-binance-api/dist/types";
import {
  ASSET,
  BALANCE_IN_POSTIOTION,
  BASE_CURRENCY,
  PAIR,
  TARGET_ROI,
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
  public static async handleBuy() {
    const balance =
      (await BinanceApiService.getBalance())[BASE_CURRENCY].available *
      BALANCE_IN_POSTIOTION;
    if (!balance || balance <= 10) {
      LogService.log(
        `Insiffficient balance to buy: ${PAIR} amount: ${balance} value @${new Date().toISOString()}`
      );
      return;
    }
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const quantity = parseFloat((balance / marketPrice).toFixed(5));
    const tpPrice = parseFloat((marketPrice * TARGET_ROI).toFixed(2));
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} BuyPrice ${marketPrice} SellPrice ${tpPrice} roi:${
        tpPrice / marketPrice
      } @${new Date().toISOString()}`
    );
    try {
      const order = await BinanceApiService.buyAndSetTakeProfit(
        PAIR,
        quantity,
        tpPrice
      );
      LogService.log(`Order placed: ${JSON.stringify(order)}`);
      LogService.log(`Take profit set at: ${tpPrice}`);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
    }
  }

  /**
   * Places a sell order based on configured parameters
   * Uses ASSET balance for quantity calculation
   * @throws Error if the trade execution fails
   */
  public static async handleSell() {
    // cancel all pendig orders
    const openOrders = await BinanceApiService.getOpenOrders(PAIR);
    openOrders.forEach(async (order: Order) => {
      await BinanceApiService.cancelOrder(PAIR, order.orderId);
    });

    // sell all assets
    const quantity = parseFloat(
      (
        (await BinanceApiService.getBalance())[ASSET].available *
        BALANCE_IN_POSTIOTION
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
      const order = await BinanceApiService.sell(PAIR, quantity);
      LogService.log(`Order placed: ${JSON.stringify(order)}`);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
    }
  }
}
