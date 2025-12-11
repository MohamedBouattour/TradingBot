export class BotConfigDto {
  asset?: string;
  timeframe?: string;
  strategy?: string;
}

export class BotStatusDto {
  isRunning: boolean;
  currentConfig: {
    asset: string;
    timeframe: string;
    strategy: string;
  };
  lastUpdate?: string;
}

export class BacktestRequestDto {
  asset: string;
  timeframe: string;
  strategy: string;
  startDate?: string;
  endDate?: string;
  targetROI?: number; // Target ROI as percentage (e.g., 1 for 1%, 2 for 2%)
}

export class TradeDetailDto {
  timestamp: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  targetPrice?: number;
  stopLoss?: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'Open' | 'Closed with TP' | 'Closed';
  closeTime?: string;
  holdingPeriodHours?: number;
  balance: number;
  roi: number;
}

export class BacktestResultDto {
  asset: string;
  timeframe: string;
  strategy: string;
  startDate: string;
  endDate: string;
  periodMonths: number;
  initialBalance: number;
  finalBalance: number;
  totalROI: number;
  totalPNL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  trades: TradeDetailDto[];
}

export class PriceDataDto {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

