export class PortfolioItemDto {
  asset: string = '';
  value: number = 0;
  pricePresision: number = 0;
  quantityPrecision: number = 0;
  threshold: number = 0;
  valueInBaseCurrency?: number;
}

export class CreatePortfolioItemDto {
  asset: string = '';
  value: number = 0;
  pricePresision: number = 0;
  quantityPrecision: number = 0;
  threshold: number = 0;
}

export class UpdatePortfolioItemDto {
  value?: number;
  pricePresision?: number;
  quantityPrecision?: number;
  threshold?: number;
  valueInBaseCurrency?: number;
}
