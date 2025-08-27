import { PortfolioItem } from "./models/portfolio-item.model";
// Portfolio configuration
export let PORTFOLIO: PortfolioItem[] = [
  {
    asset: "BTC",
    value: 170,
    threshold: 0.045,
    pricePresision: 2,
    quantityPrecision: 5,
    increaseOnBuy: true,
  },
  {
    asset: "ETH",
    value: 160,
    threshold: 0.045,
    pricePresision: 2,
    quantityPrecision: 4,
    increaseOnBuy: true,
  },
  {
    asset: "BNB",
    value: 160,
    threshold: 0.045,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
  {
    asset: "SOL",
    value: 160,
    threshold: 0.045,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
  {
    asset: "SUI",
    value: 45,
    threshold: 0.11,
    pricePresision: 4,
    quantityPrecision: 1,
  },
  {
    asset: "DOT",
    value: 45,
    threshold: 0.11,
    pricePresision: 3,
    quantityPrecision: 2,
  },
  {
    asset: "ARB",
    value: 45,
    threshold: 0.11,
    pricePresision: 4,
    quantityPrecision: 1,
  },
];
export const MULTIPLIER = 1.035;
// Core trading configuration
export const TIME_FRAME = "30m";
export const ASSET = "BTC";
export const BASE_CURRENCY = "USDT";
export const PAIR = ASSET + BASE_CURRENCY;

// Trading parameters
export const AMOUNT_PRECISION = 5;
export const PRICE_PRECISION = 0;
export const BALANCE_POSTIOTION_RATIO = 0.333;
export const TARGET_ROI = 1.02;
export const INITIAL_BALANCE = 730 + 93.3;

// Strategy-specific constants (only used by specific strategies)
export const SHORT_MA = 25;
export const LONG_MA = 100;
export const USE_TP = true;
export const PERIOD = 12 * 30 * 24 * 60 * 60 * 1000;
export const MIN_TARGET_ROI = TARGET_ROI;
export const MAX_TARGET_ROI = TARGET_ROI;
