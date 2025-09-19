import { PortfolioItem } from "./models/portfolio-item.model";
// Portfolio configuration

//Asset	Current Threshold	New Threshold	Risk Level
//BTC	$260 (+30%)	Lowest Risk
//ETH	$235 (+17%)	Low Risk
//BNB	$200 (keep)	Medium Risk
//SOL	$200 (keep)	Medium Risk
//DOT	$68 (+36%)	Higher Risk
//ARB	$62 (+24%)	Higher Risk
//SUI	$52 (+4%)	Highest Risk

//mdi BTC=530 ETH=35 xrp=30

export let PORTFOLIO: PortfolioItem[] = [
  {
    asset: "BTC",
    value: 230,
    threshold: 0.05,
    pricePresision: 2,
    quantityPrecision: 5,
    increaseOnBuy: true,
  },
  {
    asset: "ETH",
    value: 210,
    threshold: 0.07,
    pricePresision: 2,
    quantityPrecision: 4,
    increaseOnBuy: true,
  },
  {
    asset: "BNB",
    value: 180,
    threshold: 0.1,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
  {
    asset: "SOL",
    value: 180,
    threshold: 0.1,
    pricePresision: 2,
    quantityPrecision: 3,
    increaseOnBuy: true,
  },
];
export const MULTIPLIER = 1.035;
// Core trading configuration
export const TIME_FRAME = "1h";
export const ASSET = "BTC";
export const BASE_CURRENCY = "USDT";
export const PAIR = ASSET + BASE_CURRENCY;

// Trading parameters
export const AMOUNT_PRECISION = 5;
export const PRICE_PRECISION = 0;
export const BALANCE_POSTIOTION_RATIO = 0.333;
export const TARGET_ROI = 1.02;
export const INITIAL_BALANCE = 1053.86 + 254.63;

// Strategy-specific constants (only used by specific strategies)
export const SHORT_MA = 25;
export const LONG_MA = 100;
export const USE_TP = true;
export const PERIOD = 12 * 30 * 24 * 60 * 60 * 1000;
export const MIN_TARGET_ROI = TARGET_ROI;
export const MAX_TARGET_ROI = TARGET_ROI;
