import { BinanceApiService } from "../src/services/binance-api.service";

describe("BinanceApiService", () => {
  beforeAll(() => {
    jest.mock("node-binance-api", () =>
      require("../__mocks__/node-binance-api")
    );
  });

  describe("getBalance", () => {
    it("should return account balances", async () => {
      const balances = await BinanceApiService.getBalance();
      expect(balances).toBeDefined();
      expect(balances.BTC).toBeDefined();
    });
  });

  describe("buy", () => {
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
  });

  describe("sell", () => {
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
  });

  describe("getMarketPrice", () => {
    it("should return current price for asset", async () => {
      const price = await BinanceApiService.getMarketPrice("BTCUSDT");
      expect(price).toBeDefined();
      expect(typeof price).toBe("number");
    });
  });

  describe("getOpenOrders", () => {
    it("should return open orders for a symbol", async () => {
      const orders = await BinanceApiService.getOpenOrders("BTCUSDT");
      expect(Array.isArray(orders)).toBe(true);
      expect(orders[0].symbol).toBe("BTCUSDT");
    });
  });

  describe("cancelOrder", () => {
    it("should cancel an order by symbol and orderId", async () => {
      const cancelResult = await BinanceApiService.cancelOrder(
        "BTCUSDT",
        "123"
      );
      expect(cancelResult.status).toBe("CANCELED");
      expect(cancelResult.symbol).toBe("BTCUSDT");
    });
  });

  describe("buyAndSetTakeProfit", () => {
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

    it("should throw error when order is not filled", async () => {
      // Override the buy method temporarily to simulate unfilled order
      const originalBuy = BinanceApiService.buy;
      BinanceApiService.buy = jest.fn().mockResolvedValueOnce({
        side: "BUY",
        type: "MARKET",
        status: "NEW",
      });

      await expect(
        BinanceApiService.buyAndSetTakeProfit("BTCUSDT", 0.001, 25000)
      ).rejects.toThrow("Order not filled");

      BinanceApiService.buy = originalBuy;
    });
  });
});
