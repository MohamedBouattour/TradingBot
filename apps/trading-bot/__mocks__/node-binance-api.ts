const mockBinanceInstance = {
  options: jest.fn().mockReturnThis(),

  balance: jest.fn().mockResolvedValue({
    BTC: { available: "1.234", onOrder: "0.001" },
    ETH: { available: "10.567", onOrder: "0.002" },
  }),

  buy: jest
    .fn()
    .mockImplementation((symbol: string, quantity: number, price?: number) =>
      Promise.resolve({
        symbol,
        quantity,
        side: "BUY",
        type: price ? "LIMIT" : "MARKET",
        price: price ?? null,
        status: "FILLED",
      })
    ),

  sell: jest
    .fn()
    .mockImplementation((symbol: string, quantity: number, price?: number) =>
      Promise.resolve({
        symbol,
        quantity,
        side: "SELL",
        type: price ? "LIMIT" : "MARKET",
        price: price ?? null,
        status: "FILLED",
      })
    ),

  marketBuy: jest.fn().mockImplementation((symbol: string, quantity: number) =>
    Promise.resolve({
      symbol,
      quantity,
      side: "BUY",
      type: "MARKET",
      status: "FILLED",
    })
  ),

  marketSell: jest.fn().mockImplementation((symbol: string, quantity: number) =>
    Promise.resolve({
      symbol,
      quantity,
      side: "SELL",
      type: "MARKET",
      status: "FILLED",
    })
  ),

  prices: jest.fn().mockResolvedValue({
    BTCUSDT: 43000.0,
    ETHUSDT: 3300.5,
  }),

  openOrders: jest.fn().mockResolvedValue([
    {
      orderId: "123",
      symbol: "BTCUSDT",
      side: "BUY",
      status: "NEW",
    },
  ]),

  cancel: jest
    .fn()
    .mockImplementation((symbol: string, orderId: string | number) =>
      Promise.resolve({
        symbol,
        orderId,
        status: "CANCELED",
      })
    ),
};

const Binance = jest.fn(() => mockBinanceInstance);

export default Binance;


