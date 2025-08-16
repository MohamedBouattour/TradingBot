import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

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
  private readonly apiUrl = window.location.origin + "/api";

  constructor(private http: HttpClient) {}

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
}
