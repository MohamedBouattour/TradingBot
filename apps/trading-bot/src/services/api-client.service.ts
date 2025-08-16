import { LogService } from "./log.service";

interface TradingDecisionData {
  decision: string;
  currentPrice: number;
  targetPrice?: number;
  executionTimeMs: number;
  timestamp: string;
  asset: string;
  pair: string;
}

interface ROIData {
  assetValue: number;
  baseCurrencyValue: number;
  portfolioValue: number;
  totalValue: number;
  roi: number;
  pnl: number;
  initialBalance: number;
  timestamp: string;
}

interface RebalanceResult {
  asset: string;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  action?: "BUY" | "SELL" | "BALANCED";
  quantity?: number;
  price?: number;
  value?: number;
  currentValue: number;
  targetValue: number;
  deviation: number;
  timestamp: string;
  error?: string;
}

export class ApiClientService {
  private static readonly API_BASE_URL =
    process.env?.["BOT_API_URL"] || "http://localhost:3002/api";
  private static readonly TIMEOUT = 5000; // 5 seconds timeout

  private static async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" = "GET",
    data?: any
  ): Promise<T | null> {
    try {
      const url = `${this.API_BASE_URL}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      };

      if (data && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      LogService.logError(`API request failed: ${endpoint}`, {
        error: error.message,
        endpoint,
        method,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  // Trading Decision Methods
  static async sendTradingDecision(
    decisionData: TradingDecisionData
  ): Promise<boolean> {
    const result = await this.makeRequest(
      "/trading/decisions",
      "POST",
      decisionData
    );
    return result !== null;
  }

  // ROI Data Methods
  static async sendROIData(roiData: ROIData): Promise<boolean> {
    const result = await this.makeRequest("/trading/roi", "POST", roiData);
    return result !== null;
  }

  // Rebalance Result Methods
  static async sendRebalanceResult(
    rebalanceResult: RebalanceResult
  ): Promise<boolean> {
    const result = await this.makeRequest(
      "/trading/rebalance",
      "POST",
      rebalanceResult
    );
    return result !== null;
  }

  // Portfolio Methods
  static async updatePortfolioValue(
    asset: string,
    valueInBaseCurrency: number
  ): Promise<boolean> {
    const result = await this.makeRequest(`/portfolio/${asset}/value`, "PUT", {
      valueInBaseCurrency,
    });
    return result !== null;
  }

  static async getPortfolioStats(): Promise<any> {
    return await this.makeRequest("/portfolio/stats");
  }

  // Health Check
  static async checkHealth(): Promise<boolean> {
    const result = await this.makeRequest("/trading/health");
    return result !== null;
  }

  // Batch update portfolio values
  static async batchUpdatePortfolioValues(
    updates: { asset: string; valueInBaseCurrency: number }[]
  ): Promise<void> {
    const promises = updates.map((update) =>
      this.updatePortfolioValue(update.asset, update.valueInBaseCurrency)
    );

    try {
      await Promise.allSettled(promises);
    } catch (error: any) {
      LogService.logError("Batch portfolio update failed", {
        error: error.message,
        updatesCount: updates.length,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get trading statistics
  static async getTradingStats(): Promise<any> {
    return await this.makeRequest("/trading/stats");
  }
  static async syncPortfolioItem(
    portfolioItem: PortfolioSyncData
  ): Promise<boolean> {
    const result = await this.makeRequest("/portfolio/sync", "POST", {
      asset: portfolioItem.asset,
      value: portfolioItem.value,
      threshold: portfolioItem.threshold,
      pricePresision: portfolioItem.pricePresision,
      quantityPrecision: portfolioItem.quantityPrecision,
      valueInBaseCurrency: 0, // Will be updated during rebalancing
    });
    return result !== null;
  }
}
interface PortfolioSyncData {
  asset: string;
  value: number;
  threshold: number;
  pricePresision: number;
  quantityPrecision: number;
}
