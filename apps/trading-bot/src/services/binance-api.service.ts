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
} from "../constants";
import { LogService } from "./log.service";
import { ApiClientService } from "./api-client.service";
import { PortfolioItem } from "../models/portfolio-item.model";
import { startupData } from "../app";
import { delay } from "../core/utils";
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

  // Cache for market prices to reduce API calls
  private static priceCache = new Map<
    string,
    { price: number; timestamp: number }
  >();
  private static readonly PRICE_CACHE_TTL = 5000; // 5 seconds cache for prices

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
    // Check cache first
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_TTL) {
      return cached.price;
    }

    try {
      const prices = await BinanceApiService.binance.prices();
      const price = prices[symbol];
      if (!price) {
        throw new Error(`Price not found for symbol: ${symbol}`);
      }

      const numericPrice =
        typeof price === "string" ? parseFloat(price) : price;

      // Cache the price
      this.priceCache.set(symbol, {
        price: numericPrice,
        timestamp: Date.now(),
      });

      // Clean cache periodically
      if (Math.random() < 0.1) {
        // 10% chance
        this.cleanPriceCache();
      }

      return numericPrice;
    } catch (error: any) {
      throw new Error(
        `Failed to get market price for ${symbol}: ${error.message}`
      );
    }
  }

  private static cleanPriceCache() {
    const now = Date.now();
    for (const [symbol, data] of this.priceCache.entries()) {
      if (now - data.timestamp > this.PRICE_CACHE_TTL * 2) {
        this.priceCache.delete(symbol);
      }
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
    if (order.status === "FILLED" && tpPrice) {
      await BinanceApiService.binance.order(
        "LIMIT" as OrderType,
        "SELL" as OrderSide,
        asset,
        quantity,
        tpPrice
      );
      /* await BinanceApiService.binance.order(
        "TAKE_PROFIT_LIMIT" as OrderType,
        "SELL" as OrderSide,
        asset,
        quantity,
        tpPrice,
        {
          stopPrice: slPrice,
        }
      ); */
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

  public static async handleReabalance(
    protfolioItem: PortfolioItem,
    baseCurrency: string
  ): Promise<Order | void> {
    const timestamp = new Date().toISOString();
    let rebalanceResult: any = {
      asset: protfolioItem.asset,
      status: "SUCCESS" as const,
      currentValue: 0,
      targetValue: protfolioItem.value,
      deviation: 0,
      timestamp,
    };

    try {
      const account = await BinanceApiService.binance.account();
      await delay(1000);

      const symbol = protfolioItem.asset + baseCurrency;
      const assetPrice = await BinanceApiService.getMarketPrice(symbol);
      await delay(1000);

      const assetBalance = account.balances.find(
        (item: any) => item.asset === protfolioItem.asset
      );

      if (!assetBalance) {
        LogService.logRebalance(
          `${protfolioItem.asset}: ERROR - Asset not found in account balances`
        );
        // Set to 0 if asset not found
        protfolioItem.valueInBaseCurrency = 0;
        rebalanceResult.status = "ERROR";
        rebalanceResult.error = "Asset not found in account balances";
        startupData.withApi &&
          (await ApiClientService.sendRebalanceResult(rebalanceResult));
        return;
      }

      const freeBalance = parseFloat(assetBalance.free || "0");
      const lockedBalance = parseFloat(assetBalance.locked || "0");
      const totalBalance = freeBalance + lockedBalance;
      const assetValue = totalBalance * assetPrice;

      // Store the current USD value in the portfolio item
      protfolioItem.valueInBaseCurrency = assetValue;

      // Update portfolio value in API
      startupData.withApi &&
        (await ApiClientService.updatePortfolioValue(
          protfolioItem.asset,
          assetValue
        ));

      // Update rebalance result with current values
      rebalanceResult.currentValue = assetValue;
      rebalanceResult.deviation =
        ((assetValue - protfolioItem.value) / protfolioItem.value) * 100;

      // Log current asset status in readable format
      LogService.logRebalance(
        `${protfolioItem.asset}: $${assetValue.toFixed(
          2
        )} / $${protfolioItem.value.toFixed(2)} (${(
          ((assetValue - protfolioItem.value) / protfolioItem.value) *
          100
        ).toFixed(1)}%)`
      );

      // Skip rebalancing if balance is too small
      if (freeBalance < 0.001) {
        LogService.logRebalance(
          `${protfolioItem.asset}: SKIP - Balance too small (${freeBalance})`
        );
        rebalanceResult.status = "SKIPPED";
        rebalanceResult.action = "BALANCED";
        startupData.withApi &&
          (await ApiClientService.sendRebalanceResult(rebalanceResult));
        return;
      }

      const amount = parseFloat(
        (freeBalance * protfolioItem.threshold).toFixed(
          protfolioItem.quantityPrecision
        )
      );

      // Sell if overweight (current value > target * 1.05)
      if (assetValue > protfolioItem.value * (1 + protfolioItem.threshold)) {
        if (amount > 0 && amount * assetPrice >= 5) {
          LogService.logRebalance(
            `${protfolioItem.asset}: SELL ${amount} (~$${(
              amount * assetPrice
            ).toFixed(2)}) - OVERWEIGHT`
          );

          const order = await BinanceApiService.sell(symbol, amount);
          await delay(1000);

          LogService.logRebalance(
            `${protfolioItem.asset}: SELL completed - ${order.status} (${order.executedQty})`
          );

          rebalanceResult.action = "SELL";
          rebalanceResult.quantity = amount;
          rebalanceResult.price = assetPrice;
          rebalanceResult.value = amount * assetPrice;
          startupData.withApi &&
            (await ApiClientService.sendRebalanceResult(rebalanceResult));

          return order;
        } else {
          LogService.logRebalance(
            `${protfolioItem.asset}: SELL skipped - Value too low ($${(
              amount * assetPrice
            ).toFixed(2)})`
          );
          rebalanceResult.status = "SKIPPED";
          rebalanceResult.action = "SELL";
          startupData.withApi &&
            (await ApiClientService.sendRebalanceResult(rebalanceResult));
        }
      }
      // Buy if underweight (current value < threshold)
      else if (
        assetValue <
        protfolioItem.value * (1 - protfolioItem.threshold)
      ) {
        const buyinQuantity = parseFloat(
          (
            (protfolioItem.value / assetPrice) *
            (protfolioItem.threshold + 0.02) *
            (protfolioItem.increaseOnBuy ? MULTIPLIER : 1)
          ).toFixed(protfolioItem.quantityPrecision)
        );

        if (buyinQuantity > 0) {
          LogService.logRebalance(
            `${protfolioItem.asset}: BUY ${buyinQuantity} (~$${(
              buyinQuantity * assetPrice
            ).toFixed(2)}) - UNDERWEIGHT`
          );

          if (buyinQuantity * assetPrice > 5.02) {
            const order = await BinanceApiService.buy(symbol, buyinQuantity);
            await delay(1000);
            protfolioItem.value =
              protfolioItem.value * (1 + protfolioItem.threshold);
            LogService.logRebalance(
              `${protfolioItem.asset}: BUY completed - ${order.status} (${order.executedQty})`
            );

            rebalanceResult.action = "BUY";
            rebalanceResult.quantity = buyinQuantity;
            rebalanceResult.price = assetPrice;
            rebalanceResult.value = buyinQuantity * assetPrice;
            startupData.withApi &&
              (await ApiClientService.sendRebalanceResult(rebalanceResult));
            protfolioItem.value = protfolioItem.value * MULTIPLIER;
            return order;
          } else {
            rebalanceResult.status = "SKIPPED";
            rebalanceResult.action = "BUY";
            startupData.withApi &&
              (await ApiClientService.sendRebalanceResult(rebalanceResult));
          }
        } else {
          LogService.logRebalance(
            `${protfolioItem.asset}: BUY skipped - Zero quantity calculated`
          );
          rebalanceResult.status = "SKIPPED";
          rebalanceResult.action = "BUY";
          startupData.withApi &&
            (await ApiClientService.sendRebalanceResult(rebalanceResult));
        }
      } else {
        rebalanceResult.action = "BALANCED";
        startupData.withApi &&
          (await ApiClientService.sendRebalanceResult(rebalanceResult));
        /* LogService.logRebalance(
          `${protfolioItem.asset}: BALANCED - No action needed`
        ); */
      }
    } catch (error: any) {
      LogService.logError(
        `Error rebalancing ${protfolioItem.asset}: ${error.message}`,
        {
          asset: protfolioItem.asset,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        }
      );

      rebalanceResult.status = "ERROR";
      rebalanceResult.error = error.message;
      startupData.withApi &&
        (await ApiClientService.sendRebalanceResult(rebalanceResult));

      throw error;
    }
  }

  // Method to clear caches for cleanup
  public static clearCaches() {
    this.priceCache.clear();
  }
}
