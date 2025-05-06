export const TIME_FRAME = "5m";
export const ASSET = "SUI";
export const BALANCE_POSTIOTION_RATIO = 0.99;
export const TARGET_ROI = 1.01;
export const BASE_CURRENCY = "USDT";
export const PAIR = ASSET + BASE_CURRENCY;
export const INITIAL_BALANCE = 442;
export function getPrecision(marketPrice: number) {
  if (marketPrice > 10000) {
    return 5;
  } else if (marketPrice > 1000) {
    return 4;
  } else if (marketPrice > 100) {
    return 3;
  } else if (marketPrice > 10) {
    return 2;
  } else if (marketPrice > 1) {
    return 1;
  } else {
    return 0;
  }
}
export const ASSETS = [
  "BTC",
  "ETH",
  "XRP",
  "BNB",
  "SOL",
  "DOGE",
  "ADA",
  "TRX",
  "SUI",
  "LINK",
  "AVAX",
  "XLM",
  "TON",
  "LTC",
  "DOT",
];
//417
//442
