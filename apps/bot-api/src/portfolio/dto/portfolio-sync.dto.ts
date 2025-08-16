export class PortfolioSyncDto {
  asset!: string;

  value!: number;

  threshold!: number;

  pricePresision!: number;

  quantityPrecision!: number;

  valueInBaseCurrency?: number;
}
