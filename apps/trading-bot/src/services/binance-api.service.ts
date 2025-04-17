import * as dotenv from "dotenv";
import Binance from "node-binance-api";
import { CancelOrder, Order } from "node-binance-api/dist/types";
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

  public static async cancelOrder(
    symbol: string,
    orderId: string | number
  ): Promise<CancelOrder> {
    return BinanceApiService.binance.cancel(symbol, orderId);
  }

  /**
   * Places a buy order and optionally sets a take profit order
   * @param asset - The trading pair symbol
   * @param quantity - The amount to buy
   * @param tpPrice - The take profit price
   * @param withTp - Whether to place a take profit order
   * @returns Promise<Order> - The executed buy order
   * @throws Error if the order is not filled
   */
  public static async buyAndSetTakeProfit(
    asset: string,
    quantity: number,
    tpPrice: number
  ): Promise<Order> {
    const order: Order = await BinanceApiService.buy(asset, quantity);
    if (order.status === "FILLED") {
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
}
