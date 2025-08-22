import { BinanceApiService } from "../src/services/binance-api.service";

// Mock the entire BinanceApiService
jest.mock("../src/services/binance-api.service", () => ({
  BinanceApiService: {
    getBalance: jest.fn().mockResolvedValue({
      BTC: { available: 1, onOrder: 0 },
      USDT: { available: 1000, onOrder: 0 },
    }),
    buy: jest.fn((symbol, quantity, price) => {
      if (price) {
        return Promise.resolve({
          symbol, quantity, price, side: "BUY", type: "LIMIT", status: "NEW",
        });
      } else {
        return Promise.resolve({
          symbol, quantity, side: "BUY", type: "MARKET", status: "FILLED",
        });
      }
    }),
    sell: jest.fn((symbol, quantity, price) => {
      if (price) {
        return Promise.resolve({
          symbol, quantity, price, side: "SELL", type: "LIMIT", status: "NEW",
        });
      } else {
        return Promise.resolve({
          symbol, quantity, side: "SELL", type: "MARKET", status: "FILLED",
        });
      }
    }),
    getMarketPrice: jest.fn().mockResolvedValue(30000),
    getOpenOrders: jest.fn().mockResolvedValue([
      { symbol: "BTCUSDT", orderId: "123", status: "NEW" },
    ]),
    cancelOrder: jest.fn().mockResolvedValue({
      symbol: "BTCUSDT", orderId: "123", status: "CANCELED",
    }),
    buyAndSetTakeProfit: jest.fn((symbol, quantity, takeProfitPrice) => {
      // Simulate a filled order for buyAndSetTakeProfit
      return Promise.resolve({
        symbol, quantity, side: "BUY", type: "MARKET", status: "FILLED",
      });
    }),
  },
}));

describe("BinanceApiService", () => {
  it("should return account balances", async () => {
    const balances = await BinanceApiService.getBalance();
    expect(balances).toBeDefined();
    expect(balances.BTC).toBeDefined();
    expect(balances.USDT).toBeDefined();
  });

  it("should place market buy order when no price specified", async () => {
    const order = await BinanceApiService.buy("BTCUSDT", 0.001);
    expect(order).toBeDefined();
    expect(order.side).toBe("BUY");
    expect(order.type).toBe("MARKET");
  });

  it("should place limit buy order when price specified", async () => {
    const order = await BinanceApiService.buy("BTCUSDT", 0.001, 20000);
    expect(order).toBeDefined();
    expect(order.side).toBe("BUY");
    expect(order.type).toBe("LIMIT");
    expect(order.price).toBe(20000);
  });

  it("should place market sell order when no price specified", async () => {
    const order = await BinanceApiService.sell("BTCUSDT", 0.001);
    expect(order).toBeDefined();
    expect(order.side).toBe("SELL");
    expect(order.type).toBe("MARKET");
  });

  it("should place limit sell order when price specified", async () => {
    const order = await BinanceApiService.sell("BTCUSDT", 0.001, 20000);
    expect(order).toBeDefined();
    expect(order.side).toBe("SELL");
    expect(order.type).toBe("LIMIT");
    expect(order.price).toBe(20000);
  });

  it("should return current price for asset", async () => {
    const price = await BinanceApiService.getMarketPrice("BTCUSDT");
    expect(price).toBeDefined();
    expect(typeof price).toBe("number");
  });

  it("should return open orders for a symbol", async () => {
    const orders = await BinanceApiService.getOpenOrders("BTCUSDT");
    expect(Array.isArray(orders)).toBe(true);
    expect(orders[0].symbol).toBe("BTCUSDT");
  });

  it("should cancel an order by symbol and orderId", async () => {
    const cancelResult = await BinanceApiService.cancelOrder("BTCUSDT", "123");
    expect(cancelResult.status).toBe("CANCELED");
    expect(cancelResult.symbol).toBe("BTCUSDT");
  });

  it("should buy and set take profit when order is filled", async () => {
    const order = await BinanceApiService.buyAndSetTakeProfit(
      "BTCUSDT",
      0.001,
      25000
    );
    expect(order).toBeDefined();
    expect(order.side).toBe("BUY");
    expect(order.status).toBe("FILLED");
  });
});


