import * as dotenv from "dotenv";
import Binance from "node-binance-api";
import {
  CancelOrder,
  Order,
  OrderSide,
  OrderType,
} from "node-binance-api/dist/types";
import {
  ASSET,
  BALANCE_POSTIOTION_RATIO,
  BASE_CURRENCY,
  PAIR,
} from "../constants";
import { LogService } from "./log.service";
dotenv.config();

export class BinanceApiService {
  private static binance = new Binance().options({
    APIKEY:
      process?.env?.["APIKEY"] ||
      (() => {
        throw new Error("APIKEY not found");
      })(),
    APISECRET:
      process?.env?.["APISECRET"] ||
      (() => {
        throw new Error("APISECRET not found");
      })(),
    family: 4,
    useServerTime: true,
    recvWindow: 10000,
  });
  /**
   * Get account balance for all assets
   * @returns Promise containing account balances
   */
  public static async getBalance(): Promise<any> {
    return await BinanceApiService.binance.balance();
  }

  /**
   * Get asset value in usd
   * @returns Promise containing asset value in usd
   */
  public static async getAssetValue(): Promise<Array<number>> {
    const account = await BinanceApiService.binance.account();
    const assetPrice = await BinanceApiService.getMarketPrice(PAIR);
    const assetBalance = account.balances.find(
      (asset) => asset.asset === ASSET
    );
    const assetValue =
      (parseFloat(assetBalance!.free) + parseFloat(assetBalance!.locked)) *
      assetPrice;

    const baseCurrencyBalance = account.balances.find(
      (asset) => asset.asset === BASE_CURRENCY
    );
    const baseCurrencyValue =
      parseFloat(baseCurrencyBalance!.free) +
      parseFloat(baseCurrencyBalance!.locked);
    return [assetValue, baseCurrencyValue];
  }

  /**
   * Place a buy order for an asset
   * @param asset The trading pair symbol (e.g. 'BTCUSDT')
   * @param quantity The amount to buy
   * @param price Optional limit price, if not provided a market order will be placed
   * @returns Promise containing the order details
   */
  public static buy(
    symbol: string,
    quantity: number,
    price?: number
  ): Promise<Order> {
    if (price) {
      return BinanceApiService.binance.buy(symbol, quantity, price);
    }
    return BinanceApiService.binance.marketBuy(symbol, quantity);
  }
  /**
   * Place a sell order for an asset
   * @param asset The trading pair symbol (e.g. 'BTCUSDT')
   * @param quantity The amount to sell
   * @param price Optional limit price, if not provided a market order will be placed
   * @returns Promise containing the order details
   */
  public static sell(
    symbol: string,
    quantity: number,
    price?: number
  ): Promise<Order> {
    if (price) {
      return BinanceApiService.binance.sell(symbol, quantity, price);
    }
    return BinanceApiService.binance.marketSell(symbol, quantity);
  }
  /**
   * Get current market price for an asset
   * @param asset The trading pair symbol (e.g. 'BTCUSDT')
   * @returns Promise containing the current price as a string
   */
  public static async getMarketPrice(symbol: string): Promise<number> {
    return (await BinanceApiService.binance.prices())[symbol];
  }

  public static async getOpenOrders(symbol?: string): Promise<Order[]> {
    return BinanceApiService.binance.openOrders(symbol);
  }

  public static async cancelAllOrders(symbol: string): Promise<CancelOrder> {
    const res = await BinanceApiService.binance.cancelAllOrders(symbol);
    LogService.log(res);
    return res;
  }

  /**
   * Places a buy order and optionally sets a take profit order
   * @param asset - The trading pair symbol
   * @param quantity - The amount to buy
   * @param tpPrice - The take profit price
   * @returns Promise<Order> - The executed buy order
   * @throws Error if the order is not filled
   */
  public static async buyAndSetTakeProfit(
    asset: string,
    quantity: number,
    tpPrice?: number
  ): Promise<Order> {
    const order: Order = await BinanceApiService.buy(asset, quantity);
    if (order.status === "FILLED" && tpPrice) {
      await BinanceApiService.sell(asset, quantity, tpPrice);
    } else {
      throw new Error("Order not filled");
    }
    return order;
  }

  /**
   * Get the current server time from Binance
   * @returns Promise containing the server time in milliseconds
   */
  public static async getServerTime(): Promise<{ serverTime: number }> {
    return BinanceApiService.binance.time();
  }

  public static async setStopLoss(
    symbol: string,
    stopPrice: number
  ): Promise<Order> {
    const quantity = parseFloat(
      (
        (await BinanceApiService.getBalance())[ASSET].available *
        BALANCE_POSTIOTION_RATIO
      ).toFixed(5)
    );
    return BinanceApiService.binance.order(
      "STOP_LOSS" as OrderType,
      "SELL" as OrderSide,
      symbol,
      quantity,
      stopPrice,
      {
        stopPrice,
      }
    );
  }
}
