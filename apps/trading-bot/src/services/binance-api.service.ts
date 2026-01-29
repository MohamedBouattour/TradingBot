import { config } from "dotenv";
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
  MULTIPLIER,
  PAIR,
  REBALANCE,
} from "../constants";
import { LogService } from "./log.service";
import { ApiClientService } from "./api-client.service";
import { PortfolioItem } from "../models/portfolio-item.model";
import { startupData } from "../app";
config();

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
    reconnect: true,
    keepAlive: true,
  });



  /**
   * Get account balance for all assets
   * @returns Promise containing account balances
   */
  public static async getBalance(): Promise<any> {
    try {
      return await BinanceApiService.binance.balance();
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get asset value in usd
   * @returns Promise containing asset value in usd
   */
  public static async getAssetValue(): Promise<Array<number>> {
    try {
      const account = await BinanceApiService.binance.account();

      const assetPrice = await BinanceApiService.getMarketPrice(PAIR);

      const assetBalance = account.balances.find(
        (asset) => asset.asset === ASSET
      );

      if (!assetBalance) {
        throw new Error(`Asset ${ASSET} not found in account balances`);
      }

      const assetValue =
        (parseFloat(assetBalance.free) + parseFloat(assetBalance.locked)) *
        assetPrice;

      const baseCurrencyBalance = account.balances.find(
        (asset) => asset.asset === BASE_CURRENCY
      );

      if (!baseCurrencyBalance) {
        throw new Error(
          `Base currency ${BASE_CURRENCY} not found in account balances`
        );
      }

      const baseCurrencyValue =
        parseFloat(baseCurrencyBalance.free) +
        parseFloat(baseCurrencyBalance.locked);

      return [assetValue, baseCurrencyValue];
    } catch (error: any) {
      throw new Error(`Failed to get asset value: ${error.message}`);
    }
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
    // Use marketBuy for market orders (quantity in base asset)
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
  /**
   * Get current market price for an asset
   * @param asset The trading pair symbol (e.g. 'BTCUSDT')
   * @returns Promise containing the current price as a string
   */
  public static async getMarketPrice(symbol: string): Promise<number> {
    try {
      const prices = await BinanceApiService.binance.prices();
      const price = prices[symbol];
      if (!price) {
        throw new Error(`Price not found for symbol: ${symbol}`);
      }

      const numericPrice =
        typeof price === "string" ? parseFloat(price) : price;

      return numericPrice;
    } catch (error: any) {
      throw new Error(
        `Failed to get market price for ${symbol}: ${error.message}`
      );
    }
  }

  public static async getOpenOrders(symbol?: string): Promise<Order[]> {
    try {
      return await BinanceApiService.binance.openOrders(symbol);
    } catch (error: any) {
      throw new Error(`Failed to get open orders: ${error.message}`);
    }
  }

  public static async cancelAllOrders(symbol: string): Promise<CancelOrder> {
    try {
      return await BinanceApiService.binance.cancelAllOrders(symbol);
    } catch (error: any) {
      throw new Error(
        `Failed to cancel orders for ${symbol}: ${error.message}`
      );
    }
  }

  public static async getPricePrecision(price: number): Promise<number> {
    return await BinanceApiService.binance.getPrecision(price);
  }

  /**
   * Places a buy order and optionally sets a take profit order
   * @param asset - The trading pair symbol
   * @param quantity - The amount to buy
   * @param tpPrice - The take profit price
   * @returns Promise<Order> - The executed buy order
   * @throws Error if the order is not filled
   */
  public static async buyAndSetTPSL(
    asset: string,
    quantity: number,
    tpPrice?: number,
    slPrice?: number
  ): Promise<Order> {
    const order: Order = await BinanceApiService.buy(asset, quantity);
    if (order.status === "FILLED") {
      // Set Take Profit order (LIMIT SELL)
      if (tpPrice) {
        await BinanceApiService.binance.order(
          "LIMIT" as OrderType,
          "SELL" as OrderSide,
          asset,
          quantity,
          tpPrice
        );
      }

      // Set Stop Loss order (STOP_LOSS SELL)
      if (slPrice) {
        const roundedSlPrice = Math.round(slPrice * 100) / 100; // Round to 2 decimals
        await BinanceApiService.setStopLossWithQuantity(asset, roundedSlPrice, quantity);
      }
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
    try {
      return await BinanceApiService.binance.time();
    } catch (error: any) {
      throw new Error(`Failed to get server time: ${error.message}`);
    }
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

  public static async setStopLossWithQuantity(
    symbol: string,
    stopPrice: number,
    quantity: number
  ): Promise<Order> {
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

  public static async setTakeProfit(
    symbol: string,
    tpPrice: number,
    quantity: number
  ): Promise<Order> {
    return BinanceApiService.binance.order(
      "LIMIT" as OrderType,
      "SELL" as OrderSide,
      symbol,
      quantity,
      tpPrice
    );
  }

  public static async getRecentTrades(
    symbol: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      return await BinanceApiService.binance.trades(symbol, { limit });
    } catch (error: any) {
      throw new Error(`Failed to get recent trades: ${error.message}`);
    }
  }

  public static async handleRebalance(
    portfolioItem: PortfolioItem,
    baseCurrency: string
  ): Promise<Order | void> {
    const result: RebalanceResult = {
      asset: portfolioItem.asset,
      status: "SUCCESS",
      currentValue: 0,
      targetValue: portfolioItem.value,
      deviation: 0,
      timestamp: new Date().toISOString(),
    };

    const sendResult = async () => {
      if (startupData.withApi) {
        await ApiClientService.sendRebalanceResult(result);
      }
    };

    try {
      // Fetch account and price data
      const account = await BinanceApiService.binance.account();
      const symbol = `${portfolioItem.asset}${baseCurrency}`;
      const assetPrice = await BinanceApiService.getMarketPrice(symbol);

      const assetBalance = account.balances.find(
        (b: any) => b.asset === portfolioItem.asset
      );
      const baseCurrencyBalance = parseFloat(
        account.balances.find((b: any) => b.asset === baseCurrency)?.free || "0"
      );

      // Handle missing asset
      if (!assetBalance) {
        LogService.logRebalance(
          `${portfolioItem.asset}: ERROR - Asset not found`
        );
        portfolioItem.valueInBaseCurrency = 0;
        result.status = "ERROR";
        result.error = "Asset not found in account balances";
        await sendResult();
        return;
      }

      // Calculate balances
      const freeBalance = parseFloat(assetBalance.free || "0");
      const totalBalance = freeBalance + parseFloat(assetBalance.locked || "0");
      const assetValue = totalBalance * assetPrice;

      // Update portfolio value
      portfolioItem.valueInBaseCurrency = assetValue;
      if (startupData.withApi) {
        await ApiClientService.updatePortfolioValue(
          portfolioItem.asset,
          assetValue
        );
      }

      // Update result and log status
      result.currentValue = assetValue;
      result.deviation =
        ((assetValue - portfolioItem.value) / portfolioItem.value) * 100;

      LogService.logRebalance(
        `${portfolioItem.asset}: $${assetValue.toFixed(2)} / $${portfolioItem.value.toFixed(2)} ` +
        `(${result.deviation.toFixed(1)}%) ~= ${(assetValue - portfolioItem.value).toFixed(2)}$`
      );

      // Skip if balance too small
      if (freeBalance < REBALANCE.MIN_BALANCE) {
        LogService.logRebalance(
          `${portfolioItem.asset}: SKIP - Balance too small (${freeBalance})`
        );
        result.status = "SKIPPED";
        result.action = "BALANCED";
        await sendResult();
        return;
      }

      const valueDiff = assetValue - portfolioItem.value;

      // SELL: Overweight position
      if (valueDiff > REBALANCE.MIN_TRADE_VALUE) {
        const quantity = parseFloat(
          (freeBalance * (valueDiff / portfolioItem.value)).toFixed(
            portfolioItem.quantityPrecision
          )
        );
        const tradeValue = quantity * assetPrice;

        if (quantity > 0 && tradeValue >= REBALANCE.MIN_TRADE_VALUE) {
          LogService.logRebalance(
            `${portfolioItem.asset}: SELL ${quantity} (~$${tradeValue.toFixed(2)}) - OVERWEIGHT`
          );

          const order = await BinanceApiService.sell(symbol, quantity);

          LogService.logRebalance(
            `${portfolioItem.asset}: SELL completed - ${order.status} (${order.executedQty})`
          );

          result.action = "SELL";
          result.quantity = quantity;
          result.price = assetPrice;
          result.value = tradeValue;
          await sendResult();

          return order;
        } else {
          LogService.logRebalance(
            `${portfolioItem.asset}: SELL skipped - Value too low ($${tradeValue.toFixed(2)})`
          );
          result.status = "SKIPPED";
          result.action = "SELL";
          await sendResult();
        }
      }
      // BUY: Underweight position
      else if (
        assetValue <
        portfolioItem.value * (1 - portfolioItem.threshold)
      ) {
        const quantity = parseFloat(
          (
            (portfolioItem.value / assetPrice) *
            (portfolioItem.threshold + REBALANCE.BUY_ADJUSTMENT) *
            (portfolioItem.increaseOnBuy ? MULTIPLIER : 1)
          ).toFixed(portfolioItem.quantityPrecision)
        );
        const tradeValue = quantity * assetPrice;

        if (
          quantity > 0 &&
          baseCurrencyBalance > tradeValue &&
          tradeValue > REBALANCE.MIN_TRADE_VALUE
        ) {
          LogService.logRebalance(
            `${portfolioItem.asset}: BUY ${quantity} (~$${tradeValue.toFixed(2)}) - UNDERWEIGHT`
          );

          const order = await BinanceApiService.buy(symbol, quantity);

          portfolioItem.value *= (1 + portfolioItem.threshold) * MULTIPLIER;

          LogService.logRebalance(
            `${portfolioItem.asset}: BUY completed - ${order.status} (${order.executedQty})`
          );

          result.action = "BUY";
          result.quantity = quantity;
          result.price = assetPrice;
          result.value = tradeValue;
          await sendResult();

          return order;
        } else {
          LogService.logRebalance(
            `${portfolioItem.asset}: BUY skipped - Zero quantity calculated`
          );
          result.status = "SKIPPED";
          result.action = "BUY";
          await sendResult();
        }
      }
      // BALANCED: No action needed
      else {
        result.action = "BALANCED";
        await sendResult();
      }
    } catch (error: any) {
      LogService.logError(
        `Error rebalancing ${portfolioItem.asset}: ${error.message}`,
        {
          asset: portfolioItem.asset,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        }
      );

      result.status = "ERROR";
      result.error = error.message;
      await sendResult();

      throw error;
    }
  }
}
