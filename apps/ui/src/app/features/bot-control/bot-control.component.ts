import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, catchError, of } from 'rxjs';
import { BotApiService } from '../../core/services/bot-api.service';
import { LogSocketService } from '../../core/services/log-socket.service';

@Component({
  selector: 'app-bot-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bot-control">
      <div class="control-header">
        <h2>Bot Control</h2>
        <div class="status-badge" [class.running]="isRunning" [class.stopped]="!isRunning">
          <span class="status-dot"></span>
          <span>{{ isRunning ? 'Running' : 'Stopped' }}</span>
        </div>
      </div>

      <div class="control-actions">
        <button 
          class="btn btn-start" 
          [disabled]="isRunning || isLoading"
          (click)="startBot()"
        >
          ▶ Start Bot
        </button>
        <button 
          class="btn btn-stop" 
          [disabled]="!isRunning || isLoading"
          (click)="stopBot()"
        >
          ⏹ Stop Bot
        </button>
      </div>

      <div class="logs-container" *ngIf="isRunning || logs.length > 0">
        <div class="logs-header">
          <h3>Live Logs</h3>
          <button class="btn-clear" (click)="clearLogs()">Clear</button>
        </div>
        <div class="logs-content" #logsContainer>
          <div 
            class="log-line" 
            *ngFor="let log of logs"
            [class.buy]="log.includes('BUY')"
            [class.sell]="log.includes('SELL')"
            [class.error]="log.includes('ERROR') || log.includes('Error')"
          >
            {{ log }}
          </div>
          <div class="no-logs" *ngIf="logs.length === 0">
            No logs yet. Start the bot to see live logs.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bot-control {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .control-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #eee;
    }

    .control-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .status-badge.running {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.stopped {
      background: #f8d7da;
      color: #721c24;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .control-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-start {
      background: #28a745;
      color: white;
    }

    .btn-start:hover:not(:disabled) {
      background: #218838;
    }

    .btn-stop {
      background: #dc3545;
      color: white;
    }

    .btn-stop:hover:not(:disabled) {
      background: #c82333;
    }

    .logs-container {
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .logs-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .btn-clear {
      padding: 6px 12px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-clear:hover {
      background: #5a6268;
    }

    .logs-content {
      background: #1a1a1a;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      padding: 16px;
      border-radius: 6px;
      max-height: 400px;
      overflow-y: auto;
      font-size: 13px;
      line-height: 1.6;
    }

    .log-line {
      padding: 4px 0;
      word-break: break-word;
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

    .no-logs {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
    }
  `]
})
export class BotControlComponent implements OnInit, OnDestroy {
  private botApiService = inject(BotApiService);
  private logSocketService = inject(LogSocketService);
  private subscriptions: Subscription[] = [];

  isRunning = false;
  isLoading = false;
  logs: string[] = [];

  ngOnInit() {
    this.loadBotStatus();
    this.startLogMonitoring();
    this.startStatusPolling();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadBotStatus() {
    this.subscriptions.push(
      this.botApiService.getBotStatus()
        .pipe(catchError(() => of(null)))
        .subscribe(status => {
          if (status) {
            this.isRunning = status.isRunning;
          }
        })
    );
  }

  private startStatusPolling() {
    const statusInterval = interval(5000);
    this.subscriptions.push(
      statusInterval.subscribe(() => {
        if (!this.isLoading) {
          this.loadBotStatus();
        }
      })
    );
  }

  private startLogMonitoring() {
    // Subscribe to log socket service if available
    // For now, we'll poll the logs API
    const logInterval = interval(2000);
    this.subscriptions.push(
      logInterval.subscribe(() => {
        if (this.isRunning) {
          this.botApiService.getLatestLogs(20)
            .pipe(catchError(() => of(null)))
            .subscribe(response => {
              if (response && response.logs) {
                this.logs = response.logs.slice().reverse();
                this.scrollToBottom();
              }
            });
        }
      })
    );
  }

  startBot() {
    this.isLoading = true;
    this.botApiService.startBot()
      .pipe(catchError(err => {
        console.error('Failed to start bot:', err);
        return of({ success: false, message: 'Failed to start bot' });
      }))
      .subscribe(result => {
        this.isLoading = false;
        if (result.success) {
          this.isRunning = true;
          this.logs = [];
        }
      });
  }

  stopBot() {
    this.isLoading = true;
    this.botApiService.stopBot()
      .pipe(catchError(err => {
        console.error('Failed to stop bot:', err);
        return of({ success: false, message: 'Failed to stop bot' });
      }))
      .subscribe(result => {
        this.isLoading = false;
        if (result.success) {
          this.isRunning = false;
        }
      });
  }

  clearLogs() {
    this.logs = [];
  }

  private scrollToBottom() {
    // Auto-scroll to bottom of logs
    setTimeout(() => {
      const container = document.querySelector('.logs-content');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}







