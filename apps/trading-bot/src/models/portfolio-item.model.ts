export interface PortfolioItem {
  asset: string;
  value: number;
  pricePresision: number;
  quantityPrecision: number;
  threshold: number;
  valueInBaseCurrency?: number; // Optional field to store value in USD
}
