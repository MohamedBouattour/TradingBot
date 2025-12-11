import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BotApiService } from '../../core/services/bot-api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-backtest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="backtest">
      <h2>Backtest Results</h2>

      <div class="backtest-form">
        <h3>Run New Backtest</h3>
        <form (ngSubmit)="runBacktest($event)" class="form">
          <div class="form-row">
            <div class="form-group">
              <label>Asset</label>
              <select [(ngModel)]="backtestRequest.asset" name="asset" class="form-control">
                <option *ngFor="let asset of availableAssets" [value]="asset">{{ asset }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Timeframe</label>
              <select [(ngModel)]="backtestRequest.timeframe" name="timeframe" class="form-control">
                <option *ngFor="let tf of availableTimeframes" [value]="tf">{{ tf }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Strategy</label>
              <select [(ngModel)]="backtestRequest.strategy" name="strategy" class="form-control">
                <option *ngFor="let strategy of availableStrategies" [value]="strategy">{{ strategy }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Target ROI</label>
              <select [(ngModel)]="backtestRequest.targetROI" name="targetROI" class="form-control">
                <option *ngFor="let roi of availableTargetROIs" [ngValue]="roi">{{ roi }}%</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-run" [disabled]="isRunning">
            {{ isRunning ? 'Running...' : '▶ Run Backtest' }}
          </button>
        </form>
        
        <div class="message success" *ngIf="successMessage">
          {{ successMessage }}
        </div>
        <div class="message error" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </div>

      <div class="backtest-results" *ngIf="currentResult">
        <h3>Latest Backtest Result</h3>
        <div class="result-card">
          <div class="result-header">
            <div class="result-title">
              <span class="asset">{{ currentResult?.asset || 'N/A' }}</span>
              <span class="timeframe">{{ currentResult?.timeframe || 'N/A' }}</span>
              <span class="strategy">{{ currentResult?.strategy || 'N/A' }}</span>
            </div>
            <div class="result-roi" [class.positive]="currentResult?.totalROI >= 0" [class.negative]="currentResult?.totalROI < 0">
              {{ formatROI(currentResult?.totalROI) }}
            </div>
          </div>

          <div class="result-stats">
            <div class="stat-item">
              <span class="label">Initial Balance:</span>
              <span class="value">\u0024{{ formatPrice(currentResult?.initialBalance) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Final Balance:</span>
              <span class="value">\u0024{{ formatPrice(currentResult?.finalBalance) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Total P&L:</span>
              <span class="value" [class.positive]="currentResult?.totalPNL >= 0" [class.negative]="currentResult?.totalPNL < 0">
                \u0024{{ formatPnl(currentResult?.totalPNL) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="label">Total Trades:</span>
              <span class="value">{{ currentResult?.totalTrades || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Win Rate:</span>
              <span class="value">{{ formatPercentage(currentResult?.winRate) }}%</span>
            </div>
            <div class="stat-item">
              <span class="label">Winning Trades:</span>
              <span class="value positive">{{ currentResult?.winningTrades || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Losing Trades:</span>
              <span class="value negative">{{ currentResult?.losingTrades || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Max Drawdown:</span>
              <span class="value negative">{{ formatPercentage(currentResult?.maxDrawdown) }}%</span>
            </div>
            <div class="stat-item" *ngIf="currentResult?.sharpeRatio">
              <span class="label">Sharpe Ratio:</span>
              <span class="value">{{ formatPrice(currentResult.sharpeRatio) }}</span>
            </div>
          </div>

          <div class="result-period" *ngIf="currentResult?.startDate && currentResult?.endDate">
            <small>
              Period: {{ formatDate(currentResult.startDate) }} - {{ formatDate(currentResult.endDate) }}
              <strong *ngIf="currentResult?.periodMonths"> ({{ currentResult.periodMonths }} months)</strong>
            </small>
          </div>
          
          <div class="trades-section" *ngIf="getTrades(currentResult) && getTrades(currentResult).length > 0">
            <h4>Trade Details ({{ getTrades(currentResult).length }} trades)</h4>
            <div class="trades-list">
              <div class="trade-item" *ngFor="let trade of getTrades(currentResult); let i = index" [class.win]="trade?.pnl && trade.pnl > 0" [class.loss]="trade?.pnl && trade.pnl <= 0">
                <div class="trade-header">
                  <span class="trade-number">#{{ i + 1 }}</span>
                  <span class="trade-action" [class.buy]="trade?.action === 'BUY'" [class.sell]="trade?.action === 'SELL'">
                    {{ trade?.action || 'N/A' }}
                  </span>
                  <span class="trade-status" [class.closed-tp]="trade?.status === 'Closed with TP'">
                    {{ trade?.status || 'Unknown' }}
                  </span>
                  <span class="trade-pnl" *ngIf="trade?.pnl !== undefined && trade?.pnl !== null" [class.positive]="trade.pnl > 0" [class.negative]="trade.pnl <= 0">
                    {{ formatPnl(trade?.pnl) }} ({{ formatPnlPercent(trade?.pnlPercent) }})
                  </span>
                </div>
                <div class="trade-details" *ngIf="trade">
                  <div class="trade-detail-item">
                    <span class="label">Entry Price:</span>
                    <span class="value">\u0024{{ formatPrice(trade?.price) }}</span>
                  </div>
                  <div class="trade-detail-item" *ngIf="trade?.targetPrice">
                    <span class="label">Target Price (TP):</span>
                    <span class="value">\u0024{{ formatPrice(trade.targetPrice) }}</span>
                  </div>
                  <div class="trade-detail-item" *ngIf="trade?.quantity">
                    <span class="label">Quantity:</span>
                    <span class="value">{{ formatQuantity(trade.quantity) }}</span>
                  </div>
                  <div class="trade-detail-item" *ngIf="trade?.holdingPeriodHours">
                    <span class="label">Holding Period:</span>
                    <span class="value">{{ formatHoldingPeriod(trade.holdingPeriodHours) }}</span>
                  </div>
                  <div class="trade-detail-item" *ngIf="trade?.timestamp">
                    <span class="label">Date:</span>
                    <span class="value">{{ formatDate(trade.timestamp) }}</span>
                  </div>
                  <div class="trade-detail-item" *ngIf="trade?.closeTime">
                    <span class="label">Close Date:</span>
                    <span class="value">{{ formatDate(trade.closeTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="backtest-history" *ngIf="history.length > 0">
        <h3>Backtest History</h3>
        <div class="history-list">
          <div class="history-item" *ngFor="let result of history" (click)="selectResult(result)">
            <div class="history-header">
              <span class="history-asset">{{ result?.asset || 'N/A' }}</span>
              <span class="history-roi" [class.positive]="result?.totalROI >= 0" [class.negative]="result?.totalROI < 0">
                {{ formatROI(result?.totalROI) }}
              </span>
            </div>
            <div class="history-details">
              <span>{{ result?.timeframe || 'N/A' }}</span>
              <span>{{ result?.strategy || 'N/A' }}</span>
              <span>{{ result?.totalTrades || 0 }} trades</span>
              <span *ngIf="result?.periodMonths">{{ result.periodMonths }} months</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backtest {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .backtest h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.5rem;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }

    .backtest-form {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .backtest-form h3 {
      margin: 0 0 16px 0;
      color: #555;
      font-size: 1.1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 6px;
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .btn-run {
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-run:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-run:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message {
      margin-top: 12px;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .result-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ddd;
    }

    .result-title {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .result-title .asset,
    .result-title .timeframe,
    .result-title .strategy {
      padding: 6px 12px;
      background: white;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
    }

    .result-title .asset {
      color: #007bff;
    }

    .result-roi {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .result-roi.positive {
      color: #28a745;
    }

    .result-roi.negative {
      color: #dc3545;
    }

    .result-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: white;
      border-radius: 4px;
    }

    .stat-item .label {
      font-weight: 500;
      color: #666;
    }

    .stat-item .value {
      font-weight: 600;
      color: #333;
    }

    .stat-item .value.positive {
      color: #28a745;
    }

    .stat-item .value.negative {
      color: #dc3545;
    }

    .result-period {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
    }

    .backtest-history h3 {
      margin: 20px 0 12px 0;
      color: #555;
      font-size: 1.1rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .history-item {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .history-item:hover {
      background: #e9ecef;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .history-asset {
      font-weight: 600;
      color: #333;
    }

    .history-roi {
      font-weight: 600;
    }

    .history-roi.positive {
      color: #28a745;
    }

    .history-roi.negative {
      color: #dc3545;
    }

    .history-details {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #666;
    }

    .trades-section {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
    }

    .trades-section h4 {
      margin: 0 0 16px 0;
      color: #555;
      font-size: 1rem;
      font-weight: 600;
    }

    .trades-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 500px;
      overflow-y: auto;
    }

    .trade-item {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 12px;
      border-left: 4px solid #ddd;
      transition: all 0.2s;
    }

    .trade-item.win {
      border-left-color: #28a745;
      background: #f0f9f4;
    }

    .trade-item.loss {
      border-left-color: #dc3545;
      background: #fef0f0;
    }

    .trade-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .trade-number {
      font-weight: 700;
      color: #666;
      font-size: 14px;
    }

    .trade-action {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }

    .trade-action.buy {
      background: #28a745;
      color: white;
    }

    .trade-action.sell {
      background: #dc3545;
      color: white;
    }

    .trade-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      background: #e9ecef;
      color: #495057;
    }

    .trade-status.closed-tp {
      background: #d4edda;
      color: #155724;
    }

    .trade-pnl {
      font-weight: 600;
      font-size: 13px;
      margin-left: auto;
    }

    .trade-pnl.positive {
      color: #28a745;
    }

    .trade-pnl.negative {
      color: #dc3545;
    }

    .trade-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      font-size: 12px;
    }

    .trade-detail-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }

    .trade-detail-item .label {
      color: #666;
      font-weight: 500;
    }

    .trade-detail-item .value {
      color: #333;
      font-weight: 600;
    }
  `]
})
export class BacktestComponent implements OnInit {
  private botApiService = inject(BotApiService);

  availableAssets = ['BTC', 'ETH', 'BNB', 'SOL', 'DOT', 'ARB', 'SUI', 'XRP'];
  availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  // Only include strategies that are actually implemented in the backend
  availableStrategies = ['rsi', 'supertrend', 'macdSMA', 'btc-spot', 'trendline-breakout'];
  availableTargetROIs = [1, 2, 5, 10];

  backtestRequest = {
    asset: 'BTC',
    timeframe: '1h',
    strategy: 'btc-spot',
    targetROI: 2
  };

  currentResult: any = null;
  history: any[] = [];
  isRunning = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit() {
    this.loadHistory();
  }

  runBacktest(event?: Event) {
    if (event) {
      event.preventDefault(); // Prevent default form submission
    }
    
    if (this.isRunning) {
      return; // Prevent multiple simultaneous requests
    }
    
    this.isRunning = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.currentResult = null; // Clear previous result
    
    // Ensure targetROI is a number
    const request = {
      ...this.backtestRequest,
      targetROI: this.backtestRequest.targetROI ? Number(this.backtestRequest.targetROI) : undefined
    };
    
    console.log('Running backtest with:', request);
    const fullUrl = `${this.botApiService.apiUrl}/bot/backtest`;
    console.log('Calling API endpoint:', fullUrl);
    console.log('Request payload:', request);
    
    this.botApiService.runBacktest(request)
      .pipe(catchError(err => {
        console.error('Failed to run backtest - Full error:', err);
        console.error('Error status:', err?.status);
        console.error('Error message:', err?.message);
        console.error('Error error:', err?.error);
        
        let errorMsg = 'Failed to run backtest. ';
        if (err?.status === 0) {
          errorMsg += 'Cannot connect to API. Make sure the API server is running on port 3002.';
        } else if (err?.status === 404) {
          errorMsg += `API endpoint not found at ${fullUrl}. Please ensure the API server is running and the BotControlModule is properly registered.`;
        } else if (err?.status === 500) {
          errorMsg += 'Server error occurred.';
        } else {
          errorMsg += err?.error?.message || err?.message || 'Unknown error occurred.';
        }
        
        this.errorMessage = errorMsg;
        this.isRunning = false;
        return of(null);
      }))
      .subscribe({
        next: (result) => {
          console.log('Backtest result received:', result);
          this.isRunning = false;
          if (result) {
            this.currentResult = result;
            this.successMessage = `Backtest completed! ROI: ${this.formatROI(result.totalROI)}`;
            this.loadHistory();
            // Clear success message after 5 seconds
            setTimeout(() => {
              this.successMessage = null;
            }, 5000);
          } else if (!this.errorMessage) {
            this.errorMessage = 'Backtest returned no results.';
          }
        },
        error: (err) => {
          console.error('Subscription error:', err);
          this.isRunning = false;
          if (!this.errorMessage) {
            this.errorMessage = 'An unexpected error occurred.';
          }
        }
      });
  }

  loadHistory() {
    this.botApiService.getBacktestHistory(10)
      .pipe(catchError(() => of([])))
      .subscribe(history => {
        this.history = history;
      });
  }

  selectResult(result: any) {
    this.currentResult = result;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  }

  formatPrice(price: number | undefined): string {
    return price ? price.toFixed(2) : '0.00';
  }

  formatQuantity(quantity: number | undefined): string {
    return quantity ? quantity.toFixed(6) : '0.000000';
  }

  formatPnl(pnl: number | undefined): string {
    if (pnl === undefined || pnl === null) return '0.00';
    return (pnl > 0 ? '+' : '') + pnl.toFixed(2);
  }

  formatPnlPercent(pnlPercent: number | undefined): string {
    if (pnlPercent === undefined || pnlPercent === null) return '0.00%';
    return (pnlPercent > 0 ? '+' : '') + pnlPercent.toFixed(2) + '%';
  }

  formatHoldingPeriod(hours: number | undefined): string {
    if (hours === undefined || hours === null) return '0 hours';
    const days = hours / 24;
    return hours.toFixed(1) + ' hours (' + days.toFixed(1) + ' days)';
  }

  formatROI(roi: number | undefined): string {
    if (roi === undefined || roi === null) return '0.00%';
    return (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%';
  }

  formatPercentage(value: number | undefined): string {
    if (value === undefined || value === null) return '0.0';
    return value.toFixed(1);
  }

  getTrades(result: any): any[] {
    if (!result) return [];
    // Handle both 'trades' and 'results' for backward compatibility
    if (result.trades && Array.isArray(result.trades)) {
      return result.trades;
    }
    if (result.results && Array.isArray(result.results)) {
      return result.results;
    }
    return [];
  }
}

