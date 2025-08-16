export class TradingDecisionDto {
  decision: string = '';
  currentPrice: number = 0;
  targetPrice?: number;
  executionTimeMs: number = 0;
  timestamp: string = new Date().toISOString();
  asset: string = '';
  pair: string = '';
}

export class ROIDataDto {
  assetValue: number = 0;
  baseCurrencyValue: number = 0;
  portfolioValue: number = 0;
  totalValue: number = 0;
  roi: number = 0;
  pnl: number = 0;
  initialBalance: number = 0;
  timestamp: string = new Date().toISOString();
}

export class RebalanceResultDto {
  asset: string = '';
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED' = 'SUCCESS';
  action?: 'BUY' | 'SELL' | 'BALANCED';
  quantity?: number;
  price?: number;
  value?: number;
  currentValue: number = 0;
  targetValue: number = 0;
  deviation: number = 0;
  timestamp: string = new Date().toISOString();
  error?: string;
}

export class PortfolioStatsDto {
  totalValue: number = 0;
  roi: number = 0;
  pnl: number = 0;
  assets: {
    asset: string;
    currentValue: number;
    targetValue: number;
    deviation: number;
    percentage: number;
  }[] = [];
  lastUpdated: string = new Date().toISOString();
}