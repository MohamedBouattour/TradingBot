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
        <div class="header-content">
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
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- ROI & Performance Card -->
        <div class="card roi-card">
          <h2>Performance Overview</h2>
          <div class="roi-stats" *ngIf="latestROI">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="label">Total Value</span>
                <span class="value primary"
                  >\${{ latestROI.totalValue.toFixed(2) }}</span
                >
              </div>
              <div class="stat-item">
                <span class="label">ROI</span>
                <span
                  class="value"
                  [class.positive]="latestROI.roi >= 0"
                  [class.negative]="latestROI.roi < 0"
                >
                  {{ latestROI.roi.toFixed(2) }}%
                </span>
              </div>
              <div class="stat-item">
                <span class="label">P&L</span>
                <span
                  class="value"
                  [class.positive]="latestROI.pnl >= 0"
                  [class.negative]="latestROI.pnl < 0"
                >
                  \${{ latestROI.pnl.toFixed(2) }}
                </span>
              </div>
              <div class="stat-item">
                <span class="label">Asset Value</span>
                <span class="value"
                  >\${{ latestROI.assetValue.toFixed(2) }}</span
                >
              </div>
              <div class="stat-item">
                <span class="label">Base Currency</span>
                <span class="value"
                  >\${{ latestROI.baseCurrencyValue.toFixed(2) }}</span
                >
              </div>
              <div class="stat-item">
                <span class="label">Portfolio</span>
                <span class="value"
                  >\${{ latestROI.portfolioValue.toFixed(2) }}</span
                >
              </div>
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
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">Target Value</span>
                  <span class="value"
                    >\${{ portfolioStats.totalTargetValue.toFixed(2) }}</span
                  >
                </div>
                <div class="summary-item">
                  <span class="label">Current Value</span>
                  <span class="value"
                    >\${{ portfolioStats.totalCurrentValue.toFixed(2) }}</span
                  >
                </div>
                <div class="summary-item">
                  <span class="label">Assets</span>
                  <span class="value">{{ portfolioStats.itemCount }}</span>
                </div>
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
            <div class="trading-sections">
              <div class="decisions-stats">
                <h3>Trading Decisions</h3>
                <div class="stats-grid">
                  <div class="stat-row">
                    <span class="label">Total</span>
                    <span class="value">{{
                      tradingStats.tradingDecisions.total
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="label">Buy</span>
                    <span class="value buy">{{
                      tradingStats.tradingDecisions.buy
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="label">Sell</span>
                    <span class="value sell">{{
                      tradingStats.tradingDecisions.sell
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="label">Buy %</span>
                    <span class="value"
                      >{{
                        tradingStats.tradingDecisions.buyPercentage.toFixed(1)
                      }}%</span
                    >
                  </div>
                </div>
              </div>
              <div class="rebalance-stats">
                <h3>Rebalance Operations</h3>
                <div class="stats-grid">
                  <div class="stat-row">
                    <span class="label">Total</span>
                    <span class="value">{{
                      tradingStats.rebalanceOperations.total
                    }}</span>
                  </div>
                  <div
                    class="stat-row"
                    *ngIf="tradingStats.rebalanceOperations.SUCCESS"
                  >
                    <span class="label">Success</span>
                    <span class="value success">{{
                      tradingStats.rebalanceOperations.SUCCESS
                    }}</span>
                  </div>
                  <div
                    class="stat-row"
                    *ngIf="tradingStats.rebalanceOperations.ERROR"
                  >
                    <span class="label">Errors</span>
                    <span class="value error">{{
                      tradingStats.rebalanceOperations.ERROR
                    }}</span>
                  </div>
                  <div
                    class="stat-row"
                    *ngIf="tradingStats.rebalanceOperations.SKIPPED"
                  >
                    <span class="label">Skipped</span>
                    <span class="value skipped">{{
                      tradingStats.rebalanceOperations.SKIPPED
                    }}</span>
                  </div>
                </div>
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
              <div class="stats-grid">
                <div class="detail-item">
                  <span class="label">Pair</span>
                  <span class="value">{{ latestDecision.pair }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Current Price</span>
                  <span class="value"
                    >\${{ latestDecision.currentPrice.toFixed(4) }}</span
                  >
                </div>
                <div class="detail-item" *ngIf="latestDecision.targetPrice">
                  <span class="label">Target Price</span>
                  <span class="value"
                    >\${{ latestDecision.targetPrice.toFixed(4) }}</span
                  >
                </div>
                <div class="detail-item">
                  <span class="label">Execution Time</span>
                  <span class="value"
                    >{{ latestDecision.executionTimeMs }}ms</span
                  >
                </div>
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
        padding: 12px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .dashboard-header {
        margin-bottom: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .header-content {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .dashboard-header h1 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .status-indicators {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        min-height: 36px;
        white-space: nowrap;
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

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;
      }

      .card h2 {
        margin: 0 0 20px 0;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 12px;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .chart-card {
        min-height: 350px;
        display: flex;
        flex-direction: column;
      }

      /* Stats Grid Layout */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }

      .stat-item,
      .stat-row,
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid #dee2e6;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;
      }

      .label {
        font-size: 12px;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }

      .value.primary {
        font-size: 16px;
        color: #007bff;
      }

      .value.positive {
        color: #28a745;
      }

      .value.negative {
        color: #dc3545;
      }

      .value.buy,
      .value.success {
        color: #28a745;
      }

      .value.sell,
      .value.error {
        color: #dc3545;
      }

      .value.skipped {
        color: #ffc107;
      }

      /* Portfolio specific styles */
      .portfolio-summary {
        margin-bottom: 24px;
      }

      .assets-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .asset-item {
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #007bff;
      }

      .asset-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .asset-name {
        font-weight: 600;
        color: #333;
        font-size: 15px;
      }

      .asset-deviation {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
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

      /* Trading stats layout */
      .trading-sections {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .decisions-stats h3,
      .rebalance-stats h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      /* Decision card */
      .decision-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 8px;
      }

      .decision-type {
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
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
        font-weight: 500;
      }

      /* Logs card */
      .logs-card {
        grid-column: 1 / -1;
        background: #1a1a1a;
        color: #00ff00;
        font-family: "Monaco", "Menlo", monospace;
        border-radius: 12px;
        min-height: 280px;
        display: flex;
        flex-direction: column;
      }

      .logs-card h2 {
        color: #0f0;
        border-bottom: 1px solid #333;
        margin-bottom: 16px;
        font-size: 1.1rem;
      }

      .logs-monitor {
        flex: 1;
        overflow-y: auto;
        white-space: pre-wrap;
        font-size: 12px;
        line-height: 1.5;
        max-height: 200px;
      }

      .log-line {
        padding: 4px 8px;
        margin-bottom: 2px;
        border-radius: 4px;
        word-break: break-word;
      }

      .log-line.buy {
        color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
      }

      .log-line.sell {
        color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
      }

      .log-line.error {
        color: #ffae00;
        background: rgba(255, 174, 0, 0.1);
      }

      .logs-footer {
        margin-top: 12px;
        font-size: 11px;
        color: #888;
        text-align: right;
        padding-top: 12px;
        border-top: 1px solid #333;
      }

      .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 40px 20px;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 12px 0;
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .dashboard {
          padding: 8px;
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .card {
          padding: 16px;
        }

        .header-content {
          flex-direction: column;
          align-items: stretch;
          gap: 16px;
          padding: 16px;
        }

        .dashboard-header h1 {
          text-align: center;
          font-size: 1.3rem;
        }

        .status-indicators {
          justify-content: center;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .summary-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .decision-header {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }

        .trading-sections {
          gap: 20px;
        }

        .chart-card {
          min-height: 300px;
        }

        .logs-monitor {
          font-size: 11px;
          max-height: 180px;
        }

        .logs-card {
          min-height: 250px;
        }
      }

      @media (max-width: 480px) {
        .dashboard {
          padding: 4px;
        }

        .card {
          padding: 12px;
        }

        .header-content {
          padding: 12px;
        }

        .dashboard-header h1 {
          font-size: 1.2rem;
        }

        .status-item {
          font-size: 12px;
          padding: 6px 10px;
        }

        .status-text {
          display: none;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }

        .asset-item {
          padding: 12px;
        }

        .logs-monitor {
          font-size: 10px;
          max-height: 150px;
        }

        .chart-card {
          min-height: 250px;
        }
      }

      /* Touch improvements */
      @media (hover: none) and (pointer: coarse) {
        .status-item,
        .decision-type,
        .asset-item {
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .card {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
    const updateInterval = interval(60000);
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
