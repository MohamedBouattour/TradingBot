import { PortfolioItem } from "./models/portfolio-item.model";
// Portfolio configuration

//Asset	Current Threshold	New Threshold	Risk Level
//BTC	$200	$260 (+30%)	Lowest Risk
//ETH	$200	$235 (+17%)	Low Risk
//BNB	$200	$200 (keep)	Medium Risk
//SOL	$200	$200 (keep)	Medium Risk
//DOT	$50	$68 (+36%)	Higher Risk
//ARB	$50	$62 (+24%)	Higher Risk
//SUI	$50	$52 (+4%)	Highest Risk

export let PORTFOLIO: PortfolioItem[] = [
  {
    asset: "BTC",
    value: 201,
    threshold: 0.035,
    pricePresision: 2,
    quantityPrecision: 5,
    increaseOnBuy: true,
  },
  {
    asset: "ETH",
    value: 200,
    threshold: 0.04,
    pricePresision: 2,
    quantityPrecision: 4,
    increaseOnBuy: true,
  },
  {
    asset: "BNB",
    value: 200,
    threshold: 0.045,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
  {
    asset: "SOL",
    value: 200,
    threshold: 0.05,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
  {
    asset: "DOT",
    value: 50,
    threshold: 0.12,
    pricePresision: 3,
    quantityPrecision: 2,
  },
  {
    asset: "ARB",
    value: 50,
    threshold: 0.13,
    pricePresision: 4,
    quantityPrecision: 1,
  },
  {
    asset: "SUI",
    value: 50,
    threshold: 0.15,
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
export const INITIAL_BALANCE = 730 + 93.3 + 100;

// Strategy-specific constants (only used by specific strategies)
export const SHORT_MA = 25;
export const LONG_MA = 100;
export const USE_TP = true;
export const PERIOD = 12 * 30 * 24 * 60 * 60 * 1000;
export const MIN_TARGET_ROI = TARGET_ROI;
export const MAX_TARGET_ROI = TARGET_ROI;
