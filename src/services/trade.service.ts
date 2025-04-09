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
      (await BinanceApiService.getBalance()).balances.find(
        (balance: { asset: string }) => balance.asset === BASE_CURRENCY
      ) * BALANCE_IN_POSTIOTION;
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const quantity = balance / marketPrice;
    const tpPrice = marketPrice * TARGET_ROI;
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
    const quantity =
      (await BinanceApiService.getBalance()).balances.find(
        (balance: { asset: string }) => balance.asset === ASSET
      ) * BALANCE_IN_POSTIOTION;
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
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
