import Binance from "node-binance-api";
import * as dotenv from "dotenv";
import { Order } from "node-binance-api/dist/types";
dotenv.config();

export class TradeService {
  private static binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET,
    family: 4,
  });

  public static async getBalance(): Promise<any> {
    return await TradeService.binance.balance();
  }

  public static async buyAndSetTp(
    asset: string,
    quantity: number,
    tpPrice: number,
    withTp = false
  ): Promise<Order> {
    const order: Order = await TradeService.binance.marketBuy(asset, quantity);
    if (withTp && order.status === "FILLED") {
      await TradeService.binance.sell(asset, quantity, tpPrice);
    } else {
      throw new Error("Order not filled");
    }
    return order;
  }

  public static sell(asset: string, quantity: number) {
    return TradeService.binance.marketSell(asset, quantity);
  }

  public static async getMarketPrice(asset: string) {
    return (await TradeService.binance.prices())[asset];
  }
}
