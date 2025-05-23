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
    const balance =
      (await BinanceApiService.getBalance())[BASE_CURRENCY].available *
      BALANCE_POSTIOTION_RATIO;
    const marketPrice = await BinanceApiService.getMarketPrice(PAIR);
    const quantity = parseFloat(
      (balance / marketPrice).toFixed(AMOUNT_PRECISION)
    );
    if (!balance || balance <= 10) {
      LogService.log(
        `Insiffficient balance to buy: ${PAIR} amount: ${balance} value`
      );
      return;
    }
    LogService.log(
      `Setting up trade for : ${PAIR} amount: ${quantity} BuyPrice ${marketPrice} tpPrice ${tpPrice} slPrice ${slPrice}`
    );
    try {
      const order = await BinanceApiService.buyAndSetTPSL(
        PAIR,
        quantity,
        tpPrice,
        slPrice
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

  public static async adjustStopLoss(slPrice: number) {
    try {
      await BinanceApiService.cancelAllOrders(PAIR);
    } catch (error: any) {
      LogService.log(error.message + `no open orders`);
    }
    try {
      LogService.log(`Adjusting stop loss to: ${slPrice}`);
      return BinanceApiService.setStopLoss(PAIR, slPrice);
    } catch (error: any) {
      LogService.log(`Error executing trade: ${error.message}`);
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
