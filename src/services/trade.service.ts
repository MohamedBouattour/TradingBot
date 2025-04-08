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
   * Places a buy order and optionally sets a take profit order
   * @param asset - The trading pair symbol
   * @param quantity - The amount to buy
   * @param tpPrice - The take profit price
   * @param withTp - Whether to place a take profit order
   * @returns Promise<Order> - The executed buy order
   * @throws Error if the order is not filled
   */
  private async buyAndSetTakeProfit(
    asset: string,
    quantity: number,
    tpPrice: number,
    withTp = false
  ): Promise<Order> {
    const order: Order = await BinanceApiService.buy(asset, quantity);
    if (withTp && order.status === "FILLED") {
      await BinanceApiService.sell(asset, quantity, tpPrice);
    } else {
      throw new Error("Order not filled");
    }
    return order;
  }

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
      const order = await buyAndSetTakeProfit(PAIR, quantity, tpPrice);
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
function buyAndSetTakeProfit(PAIR: string, quantity: number, tpPrice: number) {
  throw new Error("Function not implemented.");
}
