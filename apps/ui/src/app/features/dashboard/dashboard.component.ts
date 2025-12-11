import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { interval, Subscription, catchError, of } from "rxjs";
import {
  BotApiService,
  PortfolioStats,
  TradingStats,
  ROIData,
  TradingDecision,
  LogsResponse,
} from "../../core/services/bot-api.service";
import { PieChartComponent } from "../../core/components/pie-chart/pie-chart.component";
import { BotControlComponent } from "../bot-control/bot-control.component";
import { BotConfigComponent } from "../bot-config/bot-config.component";
import { PriceChartComponent } from "../price-chart/price-chart.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, PieChartComponent, BotControlComponent, BotConfigComponent, PriceChartComponent, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Trading Bot Dashboard</h1>
        <div class="status-indicators">
          <div
            class="status-item"
            [class.online]="apiStatus"
            [class.offline]="!apiStatus"
          >
            <span class="status-dot"></span>
            <span class="status-text"
              >API: {{ apiStatus ? "Online" : "Offline" }}</span
            >
          </div>
          <div
            class="status-item"
            [class.online]="logsStatus"
            [class.offline]="!logsStatus"
          >
            <span class="status-dot"></span>
            <span class="status-text"
              >Logs: {{ logsStatus ? "Active" : "Inactive" }}</span
            >
          </div>
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- ROI & Performance Card -->
        <div class="card roi-card">
          <h2>Performance Overview</h2>
          <div class="roi-stats" *ngIf="latestROI">
            <div class="stat-item">
              <span class="label">Total Value:</span>
              <span class="value">\${{ latestROI.totalValue.toFixed(2) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">ROI:</span>
              <span
                class="value"
                [class.positive]="latestROI.roi >= 0"
                [class.negative]="latestROI.roi < 0"
              >
                {{ latestROI.roi.toFixed(2) }}%
              </span>
            </div>
            <div class="stat-item">
              <span class="label">P&L:</span>
              <span
                class="value"
                [class.positive]="latestROI.pnl >= 0"
                [class.negative]="latestROI.pnl < 0"
              >
                \${{ latestROI.pnl.toFixed(2) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="label">Asset Value:</span>
              <span class="value">\${{ latestROI.assetValue.toFixed(2) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Base Currency:</span>
              <span class="value"
                >\${{ latestROI.baseCurrencyValue.toFixed(2) }}</span
              >
            </div>
            <div class="stat-item">
              <span class="label">Portfolio:</span>
              <span class="value"
                >\${{ latestROI.portfolioValue.toFixed(2) }}</span
              >
            </div>
          </div>
          <div class="no-data" *ngIf="!latestROI">
            <p>No ROI data available</p>
          </div>
        </div>

        <!-- Portfolio Card -->
        <div class="card portfolio-card">
          <h2>Portfolio Status</h2>
          <div class="portfolio-stats" *ngIf="portfolioStats">
            <div class="portfolio-summary">
              <div class="summary-item">
                <span class="label">Target Value:</span>
                <span class="value"
                  >\${{ portfolioStats.totalTargetValue.toFixed(2) }}</span
                >
              </div>
              <div class="summary-item">
                <span class="label">Current Value:</span>
                <span class="value"
                  >\${{ portfolioStats.totalCurrentValue.toFixed(2) }}</span
                >
              </div>
              <div class="summary-item">
                <span class="label">Assets:</span>
                <span class="value">{{ portfolioStats.itemCount }}</span>
              </div>
            </div>
            <div class="assets-list">
              <div
                class="asset-item"
                *ngFor="let asset of portfolioStats.assets"
              >
                <div class="asset-header">
                  <div class="asset-info">
                    <span class="asset-name">{{ asset.asset }}</span>
                    <span class="asset-threshold"
                      >{{ asset.threshold * 100 | number: "2.1-1" }}%</span
                    >
                  </div>
                  <span
                    class="asset-deviation"
                    [class.positive]="asset.deviation >= 0"
                    [class.negative]="asset.deviation < 0"
                  >
                    {{ asset.deviation.toFixed(1) }}%
                  </span>
                </div>
                <div class="asset-values">
                  <span class="current"
                    >\${{ asset.currentValue.toFixed(2) }}</span
                  >
                  <span class="target"
                    >/ \${{ asset.targetValue.toFixed(2) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="no-data" *ngIf="!portfolioStats">
            <p>No portfolio data available</p>
          </div>
        </div>

        <!-- Target Allocation Pie Chart -->
        <div class="card chart-card">
          <app-pie-chart
            title="Target Portfolio Allocation"
            [data]="getTargetPieData()"
          >
          </app-pie-chart>
        </div>

        <!-- Current Allocation Pie Chart -->
        <div class="card chart-card">
          <app-pie-chart
            title="Current Portfolio Allocation"
            [data]="getCurrentPieData()"
          >
          </app-pie-chart>
        </div>

        <!-- Trading Stats Card -->
        <div class="card trading-card">
          <h2>Trading Statistics</h2>
          <div class="trading-stats" *ngIf="tradingStats">
            <div class="decisions-stats">
              <h3>Trading Decisions</h3>
              <div class="stat-row">
                <span class="label">Total:</span>
                <span class="value">{{
                  tradingStats.tradingDecisions.total
                }}</span>
              </div>
              <div class="stat-row">
                <span class="label">Buy:</span>
                <span class="value buy">{{
                  tradingStats.tradingDecisions.buy
                }}</span>
              </div>
              <div class="stat-row">
                <span class="label">Sell:</span>
                <span class="value sell">{{
                  tradingStats.tradingDecisions.sell
                }}</span>
              </div>
              <div class="stat-row">
                <span class="label">Buy %:</span>
                <span class="value"
                  >{{
                    tradingStats.tradingDecisions.buyPercentage.toFixed(1)
                  }}%</span
                >
              </div>
            </div>
            <div class="rebalance-stats">
              <h3>Rebalance Operations</h3>
              <div class="stat-row">
                <span class="label">Total:</span>
                <span class="value">{{
                  tradingStats.rebalanceOperations.total
                }}</span>
              </div>
              <div
                class="stat-row"
                *ngIf="tradingStats.rebalanceOperations.SUCCESS"
              >
                <span class="label">Success:</span>
                <span class="value success">{{
                  tradingStats.rebalanceOperations.SUCCESS
                }}</span>
              </div>
              <div
                class="stat-row"
                *ngIf="tradingStats.rebalanceOperations.ERROR"
              >
                <span class="label">Errors:</span>
                <span class="value error">{{
                  tradingStats.rebalanceOperations.ERROR
                }}</span>
              </div>
              <div
                class="stat-row"
                *ngIf="tradingStats.rebalanceOperations.SKIPPED"
              >
                <span class="label">Skipped:</span>
                <span class="value skipped">{{
                  tradingStats.rebalanceOperations.SKIPPED
                }}</span>
              </div>
            </div>
          </div>
          <div class="no-data" *ngIf="!tradingStats">
            <p>No trading statistics available</p>
          </div>
        </div>

        <!-- Latest Decision Card -->
        <div class="card decision-card">
          <h2>Latest Trading Decision</h2>
          <div class="decision-info" *ngIf="latestDecision">
            <div class="decision-header">
              <span
                class="decision-type"
                [class.buy]="latestDecision.decision === 'BUY'"
                [class.sell]="latestDecision.decision === 'SELL'"
              >
                {{ latestDecision.decision }}
              </span>
              <span class="decision-time">{{
                formatTime(latestDecision.timestamp)
              }}</span>
            </div>
            <div class="decision-details">
              <div class="detail-item">
                <span class="label">Pair:</span>
                <span class="value">{{ latestDecision.pair }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Current Price:</span>
                <span class="value"
                  >\${{ latestDecision.currentPrice.toFixed(4) }}</span
                >
              </div>
              <div class="detail-item" *ngIf="latestDecision.targetPrice">
                <span class="label">Target Price:</span>
                <span class="value"
                  >\${{ latestDecision.targetPrice.toFixed(4) }}</span
                >
              </div>
              <div class="detail-item">
                <span class="label">Execution Time:</span>
                <span class="value"
                  >{{ latestDecision.executionTimeMs }}ms</span
                >
              </div>
            </div>
          </div>
          <div class="no-data" *ngIf="!latestDecision">
            <p>No recent trading decisions</p>
          </div>
        </div>

        <!-- Logs Card -->
        <div class="logs-card">
          <h2>Recent Logs</h2>
          <div
            class="logs-monitor"
            *ngIf="recentLogs && recentLogs.logs.length > 0"
          >
            <div
              class="log-line"
              *ngFor="let log of recentLogs.logs"
              [class.buy]="log.includes('BUY')"
              [class.sell]="log.includes('SELL')"
              [class.error]="log.includes('ERROR') || log.includes('Error')"
            >
              {{ log }}
            </div>
            <div class="logs-footer">
              <small
                >Last updated: {{ formatTime(recentLogs.timestamp) }}</small
              >
            </div>
          </div>
          <div
            class="no-data"
            *ngIf="!recentLogs || recentLogs.logs.length === 0"
          >
            <p>No recent logs available</p>
          </div>
        </div>

        <!-- Bot Control Card -->
        <div class="card bot-control-card">
          <app-bot-control></app-bot-control>
        </div>

        <!-- Bot Configuration Card -->
        <div class="card bot-config-card">
          <app-bot-config></app-bot-config>
        </div>

        <!-- Price Chart Card -->
        <div class="card chart-card-full">
          <app-price-chart [asset]="'BTC'" [timeframe]="'1h'"></app-price-chart>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        padding: 16px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        background: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dashboard-header h1 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
      }

      .status-indicators {
        display: flex;
        gap: 12px;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        min-height: 36px;
      }

      .status-item.online {
        background: #d4edda;
        color: #155724;
      }

      .status-item.offline {
        background: #f8d7da;
        color: #721c24;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }

      .status-text {
        white-space: nowrap;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }

      .card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .card h2 {
        margin: 0 0 16px 0;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 8px;
        font-size: 1.2rem;
      }

      .chart-card {
        min-height: 300px;
        display: flex;
        flex-direction: column;
      }

      .roi-stats,
      .portfolio-stats,
      .trading-stats {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stat-item,
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        min-height: 32px;
      }

      .label {
        font-weight: 500;
        color: #666;
        font-size: 14px;
      }

      .value {
        font-weight: 600;
        color: #333;
        font-size: 14px;
        text-align: right;
      }

      .value.positive {
        color: #28a745;
      }

      .value.negative {
        color: #dc3545;
      }

      .value.buy {
        color: #28a745;
      }

      .value.sell {
        color: #dc3545;
      }

      .value.success {
        color: #28a745;
      }

      .value.error {
        color: #dc3545;
      }

      .value.skipped {
        color: #ffc107;
      }

      .portfolio-summary {
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }

      .assets-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .asset-item {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .asset-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        gap: 8px;
      }

      .asset-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .asset-name {
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }

      .asset-threshold {
        font-size: 12px;
        color: #666;
      }

      .asset-deviation {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .asset-deviation.positive {
        background: #d4edda;
        color: #155724;
      }

      .asset-deviation.negative {
        background: #f8d7da;
        color: #721c24;
      }

      .asset-values {
        font-size: 13px;
        color: #666;
      }

      .asset-values .current {
        font-weight: 600;
        color: #333;
      }

      .decisions-stats,
      .rebalance-stats {
        flex: 1;
      }

      .decisions-stats h3,
      .rebalance-stats h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #555;
      }

      .decision-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .decision-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .decision-type {
        padding: 8px 12px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }

      .decision-type.buy {
        background: #d4edda;
        color: #155724;
      }

      .decision-type.sell {
        background: #f8d7da;
        color: #721c24;
      }

      .decision-time {
        font-size: 12px;
        color: #666;
        text-align: right;
      }

      .decision-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        min-height: 28px;
      }

      .logs-card {
        grid-column: 1 / -1;
        background: #1a1a1a;
        color: #00ff00;
        font-family: "Courier New", monospace;
        padding: 16px;
        border-radius: 8px;
        min-height: 250px;
        display: flex;
        flex-direction: column;
      }

      .logs-card h2 {
        color: #00ff00;
        border-bottom: 1px solid #333;
        margin-bottom: 12px;
        font-size: 1.1rem;
      }

      .logs-monitor {
        flex: 1;
        overflow-y: auto;
        white-space: pre-wrap;
        font-size: 13px;
        line-height: 1.4;
      }

      .log-line {
        padding: 2px 4px;
        word-break: break-word;
        margin-bottom: 2px;
      }

      .log-line.buy {
        color: #00ff00;
      }

      .log-line.sell {
        color: #ff4444;
      }

      .log-line.error {
        color: #ffae00;
      }

      .logs-footer {
        margin-top: 8px;
        font-size: 11px;
        color: #888;
        text-align: right;
        border-top: 1px solid #333;
        padding-top: 8px;
      }

      .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
        font-size: 14px;
      }

      /* Mobile Optimizations */
      @media (max-width: 768px) {
        .dashboard {
          padding: 12px;
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .dashboard-header {
          flex-direction: column;
          gap: 12px;
          text-align: center;
          padding: 12px;
        }

        .dashboard-header h1 {
          font-size: 1.3rem;
        }

        .status-indicators {
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .status-item {
          font-size: 13px;
          padding: 6px 10px;
        }

        .card {
          padding: 12px;
        }

        .card h2 {
          font-size: 1.1rem;
          margin-bottom: 12px;
        }

        .chart-card {
          min-height: 250px;
        }

        .logs-card {
          min-height: 200px;
          padding: 12px;
        }

        .logs-monitor {
          font-size: 12px;
        }

        .asset-header {
          flex-wrap: wrap;
          gap: 6px;
        }

        .decision-header {
          flex-wrap: wrap;
          gap: 6px;
        }

        .decision-time {
          flex-basis: 100%;
          text-align: left;
          margin-top: 4px;
        }
      }

      /* Small Mobile Optimizations */
      @media (max-width: 480px) {
        .dashboard {
          padding: 8px;
        }

        .dashboard-header {
          padding: 8px;
        }

        .dashboard-header h1 {
          font-size: 1.2rem;
        }

        .status-indicators {
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
        }

        .status-item {
          justify-content: center;
        }

        .card {
          padding: 8px;
        }

        .chart-card {
          min-height: 200px;
        }

        .logs-card {
          min-height: 180px;
          padding: 8px;
        }

        .stat-item,
        .stat-row {
          font-size: 13px;
          gap: 8px;
        }

        .label,
        .value {
          font-size: 13px;
        }

        .asset-item {
          padding: 8px;
        }

        .asset-header {
          align-items: flex-start;
        }

        .asset-info {
          gap: 1px;
        }

        .asset-name {
          font-size: 13px;
        }

        .asset-threshold {
          font-size: 11px;
        }

        .asset-deviation {
          font-size: 11px;
          padding: 2px 6px;
        }

        .logs-monitor {
          font-size: 11px;
        }
      }

      /* Landscape Mobile Optimizations */
      @media (max-width: 768px) and (orientation: landscape) {
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .logs-card {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private botApiService = inject(BotApiService);
  private subscriptions: Subscription[] = [];

  // Component state
  apiStatus = false;
  logsStatus = false;

  // Data properties
  portfolioStats: PortfolioStats | null = null;
  tradingStats: TradingStats | null = null;
  latestROI: ROIData | null = null;
  latestDecision: TradingDecision | null = null;
  recentLogs: LogsResponse | null = null;

  ngOnInit() {
    this.loadInitialData();
    this.startPeriodicUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadInitialData() {
    this.loadPortfolioStats();
    this.loadTradingStats();
    this.loadLatestROI();
    this.loadLatestDecision();
    this.loadRecentLogs();
    this.checkApiStatus();
  }

  private startPeriodicUpdates() {
    const updateInterval = interval(30000);
    this.subscriptions.push(
      updateInterval.subscribe(() => {
        this.loadInitialData();
      })
    );
  }

  private loadPortfolioStats() {
    this.subscriptions.push(
      this.botApiService
        .getPortfolioStats()
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.portfolioStats = data;
        })
    );
  }

  private loadTradingStats() {
    this.subscriptions.push(
      this.botApiService
        .getTradingStats()
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.tradingStats = data;
        })
    );
  }

  private loadLatestROI() {
    this.subscriptions.push(
      this.botApiService
        .getLatestROI()
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.latestROI = data;
        })
    );
  }

  private loadLatestDecision() {
    this.subscriptions.push(
      this.botApiService
        .getLatestTradingDecision()
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.latestDecision = data;
        })
    );
  }

  private loadRecentLogs() {
    this.subscriptions.push(
      this.botApiService
        .getLatestLogs(5)
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.recentLogs = data;
          this.logsStatus = data !== null && data.logs.length > 0;
        })
    );
  }

  private checkApiStatus() {
    this.subscriptions.push(
      this.botApiService
        .getApiHealth()
        .pipe(catchError((err) => of(null)))
        .subscribe((data) => {
          this.apiStatus = data !== null;
        })
    );
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getTargetPieData() {
    if (!this.portfolioStats) return [];
    return this.portfolioStats.assets
      .filter((asset) => asset.targetValue > 0)
      .map((asset) => ({
        name: asset.asset,
        value: asset.targetPercentage,
        absoluteValue: asset.targetValue,
      }));
  }

  getCurrentPieData() {
    if (!this.portfolioStats) return [];
    return this.portfolioStats.assets
      .filter((asset) => asset.currentValue > 0)
      .map((asset) => ({
        name: asset.asset,
        value: asset.currentPercentage,
        absoluteValue: asset.currentValue,
      }));
  }
}
