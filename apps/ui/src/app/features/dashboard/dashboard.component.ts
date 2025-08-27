import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
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

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, PieChartComponent],
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
            API: {{ apiStatus ? "Online" : "Offline" }}
          </div>
          <div
            class="status-item"
            [class.online]="logsStatus"
            [class.offline]="!logsStatus"
          >
            <span class="status-dot"></span>
            Logs: {{ logsStatus ? "Active" : "Inactive" }}
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
                  <span class="asset-name">{{ asset.asset }}</span>
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

        <!-- 🔥 NEW: Target Allocation Pie Chart -->
        <div class="card chart-card">
          <app-pie-chart
            title="Target Portfolio Allocation"
            [data]="getTargetPieData()"
          >
          </app-pie-chart>
        </div>

        <!-- 🔥 NEW: Current Allocation Pie Chart -->
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
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        padding: 20px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dashboard-header h1 {
        margin: 0;
        color: #333;
      }

      .status-indicators {
        display: flex;
        gap: 20px;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
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
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .card h2 {
        margin: 0 0 20px 0;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
      }

      /* 🔥 NEW: Chart card styling */
      .chart-card {
        height: 400px;
        display: flex;
        flex-direction: column;
      }

      .roi-stats,
      .portfolio-stats,
      .trading-stats {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .stat-item,
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }

      .label {
        font-weight: 500;
        color: #666;
      }

      .value {
        font-weight: 600;
        color: #333;
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
        padding-bottom: 15px;
        margin-bottom: 15px;
      }

      .assets-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .asset-item {
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .asset-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }

      .asset-name {
        font-weight: 600;
        color: #333;
      }

      .asset-deviation {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 3px;
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
        font-size: 14px;
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
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #555;
      }

      .decision-info {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .decision-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .decision-type {
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
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
      }

      .decision-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
      }

      .logs-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .log-item {
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        border-left: 3px solid #dee2e6;
      }

      .log-item.buy {
        border-left-color: #28a745;
        background: #d4edda;
      }

      .log-item.sell {
        border-left-color: #dc3545;
        background: #f8d7da;
      }

      .log-item.error {
        border-left-color: #dc3545;
        background: #f8d7da;
        color: #721c24;
      }

      .logs-footer {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        text-align: right;
      }

      .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
      }

      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-header {
          flex-direction: column;
          gap: 15px;
          text-align: center;
        }
      }

      .logs-card {
        grid-column: 1 / -1; /* full width */
        background: black;
        color: #00ff00;
        font-family: monospace;
        padding: 15px;
        border-radius: 8px;
        height: 300px; /* or more */
        display: flex;
        flex-direction: column;
      }

      .logs-card h2 {
        color: #0f0;
        border-bottom: 1px solid #333;
        margin-bottom: 10px;
      }

      .logs-monitor {
        flex: 1;
        overflow-y: auto;
        white-space: pre-wrap;
      }

      .log-line {
        padding: 2px 4px;
        line-height: 1.4;
      }

      .log-line.buy {
        color: #00ff00; /* green text for BUY */
      }

      .log-line.sell {
        color: #ff4444; /* red text for SELL */
      }

      .log-line.error {
        color: #ffae00; /* yellow/orange for errors */
      }

      .logs-footer {
        margin-top: 10px;
        font-size: 12px;
        color: #888;
        text-align: right;
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
    // Load all data initially
    this.loadPortfolioStats();
    this.loadTradingStats();
    this.loadLatestROI();
    this.loadLatestDecision();
    this.loadRecentLogs();
    this.checkApiStatus();
  }

  private startPeriodicUpdates() {
    // Update data every 30 seconds
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
