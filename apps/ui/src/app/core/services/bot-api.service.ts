import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environments";

export interface PortfolioItem {
  asset: string;
  value: number;
  pricePresision: number;
  quantityPrecision: number;
  threshold: number;
  valueInBaseCurrency?: number;
}

export interface PortfolioStats {
  totalTargetValue: number;
  totalCurrentValue: number;
  itemCount: number;
  assets: {
    asset: string;
    targetValue: number;
    currentValue: number;
    deviation: number;
    threshold: number;
    targetPercentage: number;
    currentPercentage: number;
  }[];
  lastUpdated: string;
}

export interface TradingDecision {
  decision: string;
  currentPrice: number;
  targetPrice?: number;
  executionTimeMs: number;
  timestamp: string;
  asset: string;
  pair: string;
}

export interface ROIData {
  assetValue: number;
  baseCurrencyValue: number;
  portfolioValue: number;
  totalValue: number;
  roi: number;
  pnl: number;
  initialBalance: number;
  timestamp: string;
}

export interface TradingStats {
  currentROI: number;
  currentPNL: number;
  totalValue: number;
  tradingDecisions: {
    total: number;
    buy: number;
    sell: number;
    buyPercentage: number;
  };
  rebalanceOperations: {
    total: number;
    SUCCESS?: number;
    ERROR?: number;
    SKIPPED?: number;
  };
  lastUpdated: string;
}

export interface LogsResponse {
  logs: string[];
  count: number;
  timestamp: string;
}

@Injectable({
  providedIn: "root",
})
export class BotApiService {
  // Use environment API URL configuration
  public readonly apiUrl = environment.apiUrl.startsWith('http') 
    ? environment.apiUrl 
    : (typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin + environment.apiUrl
      : "http://localhost:3002/api";

  constructor(private http: HttpClient) {
    console.log('BotApiService initialized with API URL:', this.apiUrl);
  }

  // Portfolio endpoints
  getPortfolio(): Observable<PortfolioItem[]> {
    return this.http.get<PortfolioItem[]>(`${this.apiUrl}/portfolio`);
  }

  getPortfolioStats(): Observable<PortfolioStats> {
    return this.http.get<PortfolioStats>(`${this.apiUrl}/portfolio/stats`);
  }

  // Trading endpoints
  getTradingDecisions(limit: number = 10): Observable<TradingDecision[]> {
    return this.http.get<TradingDecision[]>(
      `${this.apiUrl}/trading/decisions?limit=${limit}`
    );
  }

  getLatestTradingDecision(): Observable<TradingDecision> {
    return this.http.get<TradingDecision>(
      `${this.apiUrl}/trading/decisions/latest`
    );
  }

  getROIHistory(limit: number = 10): Observable<ROIData[]> {
    return this.http.get<ROIData[]>(
      `${this.apiUrl}/trading/roi?limit=${limit}`
    );
  }

  getLatestROI(): Observable<ROIData> {
    return this.http.get<ROIData>(`${this.apiUrl}/trading/roi/latest`);
  }

  getTradingStats(): Observable<TradingStats> {
    return this.http.get<TradingStats>(`${this.apiUrl}/trading/stats`);
  }

  // Logs endpoints
  getLatestLogs(lines: number = 3): Observable<LogsResponse> {
    return this.http.get<LogsResponse>(
      `${this.apiUrl}/logs/latest?lines=${lines}`
    );
  }

  getAllLogs(): Observable<LogsResponse> {
    return this.http.get<LogsResponse>(`${this.apiUrl}/logs/all`);
  }

  getLogsHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/logs/health`);
  }

  // Health check
  getApiHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/trading/health`);
  }

  // Bot Control endpoints
  getBotStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/bot/status`);
  }

  updateBotConfig(config: { asset?: string; timeframe?: string; strategy?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/bot/config`, config);
  }

  getBotConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/bot/config`);
  }

  startBot(): Observable<any> {
    return this.http.post(`${this.apiUrl}/bot/start`, {});
  }

  stopBot(): Observable<any> {
    return this.http.post(`${this.apiUrl}/bot/stop`, {});
  }

  runBacktest(request: { asset: string; timeframe: string; strategy: string; startDate?: string; endDate?: string; targetROI?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/bot/backtest`, request);
  }

  getBacktestHistory(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bot/backtest?limit=${limit}`);
  }

  getPriceData(asset: string, timeframe: string = '1h', limit: number = 100): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bot/price-data/${asset}?timeframe=${timeframe}&limit=${limit}`);
  }
}
