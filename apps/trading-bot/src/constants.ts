
export const TIME_FRAME = "1h";
export const ASSET = "BTC";
export const BALANCE_POSTIOTION_RATIO = 0.99;
export const TARGET_ROI = 1.01;
export const BASE_CURRENCY = "USDT";
export const PAIR = ASSET + BASE_CURRENCY;
export const INITIAL_BALANCE = 442;
export function getPrecision(marketPrice: number) {
  return marketPrice.toString().split(".")[1].replaceAll("0", "").length;
}
//417
//442
