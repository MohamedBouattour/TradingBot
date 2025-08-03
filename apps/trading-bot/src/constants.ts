import { PortfolioItem } from "./models/portfolio-item.model";

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
export const INITIAL_BALANCE = 341;

// Strategy-specific constants (only used by specific strategies)
export const SHORT_MA = 25;
export const LONG_MA = 100;
export const USE_TP = true;
export const PERIOD = 12 * 30 * 24 * 60 * 60 * 1000;
export const MIN_TARGET_ROI = TARGET_ROI;
export const MAX_TARGET_ROI = TARGET_ROI;

// Portfolio configuration
export const PORTFOLIO: PortfolioItem[] = [
  { asset: "ETH", value: 100, pricePresision: 2, quantityPrecision: 4 },
  { asset: "BNB", value: 100, pricePresision: 2, quantityPrecision: 3 },
  { asset: "SOL", value: 100, pricePresision: 2, quantityPrecision: 3 },
  { asset: "SUI", value: 30, pricePresision: 4, quantityPrecision: 1 },
  { asset: "DOT", value: 30, pricePresision: 3, quantityPrecision: 2 },
  { asset: "ARB", value: 30, pricePresision: 4, quantityPrecision: 1 },
];

// Remove unused ASSETS array - not used in main app.ts
