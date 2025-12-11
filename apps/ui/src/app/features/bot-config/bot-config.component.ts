import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BotApiService } from '../../core/services/bot-api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-bot-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bot-config">
      <h2>Bot Configuration</h2>
      
      <form (ngSubmit)="saveConfig()" class="config-form">
        <div class="form-group">
          <label for="asset">Asset</label>
          <select id="asset" [(ngModel)]="config.asset" name="asset" class="form-control">
            <option *ngFor="let asset of availableAssets" [value]="asset">{{ asset }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="timeframe">Timeframe</label>
          <select id="timeframe" [(ngModel)]="config.timeframe" name="timeframe" class="form-control">
            <option *ngFor="let tf of availableTimeframes" [value]="tf">{{ tf }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="strategy">Strategy</label>
          <select id="strategy" [(ngModel)]="config.strategy" name="strategy" class="form-control">
            <option *ngFor="let strategy of availableStrategies" [value]="strategy">{{ strategy }}</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-save" [disabled]="isSaving">
            {{ isSaving ? 'Saving...' : '💾 Save Configuration' }}
          </button>
          <button type="button" class="btn btn-reset" (click)="loadConfig()" [disabled]="isSaving">
            Reset
          </button>
        </div>

        <div class="save-message" *ngIf="saveMessage" [class.success]="saveSuccess" [class.error]="!saveSuccess">
          {{ saveMessage }}
        </div>
      </form>

      <div class="current-config" *ngIf="currentConfig">
        <h3>Current Configuration</h3>
        <div class="config-display">
          <div class="config-item">
            <span class="label">Asset:</span>
            <span class="value">{{ currentConfig.asset }}</span>
          </div>
          <div class="config-item">
            <span class="label">Timeframe:</span>
            <span class="value">{{ currentConfig.timeframe }}</span>
          </div>
          <div class="config-item">
            <span class="label">Strategy:</span>
            <span class="value">{{ currentConfig.strategy }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bot-config {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .bot-config h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.5rem;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }

    .config-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-save {
      background: #007bff;
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-reset {
      background: #6c757d;
      color: white;
    }

    .btn-reset:hover:not(:disabled) {
      background: #5a6268;
    }

    .save-message {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .save-message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .save-message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .current-config {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .current-config h3 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .config-display {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .config-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .config-item .label {
      font-weight: 500;
      color: #666;
    }

    .config-item .value {
      font-weight: 600;
      color: #333;
    }
  `]
})
export class BotConfigComponent implements OnInit {
  private botApiService = inject(BotApiService);

  availableAssets = ['BTC', 'ETH', 'BNB', 'SOL', 'DOT', 'ARB', 'SUI', 'XRP'];
  availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  availableStrategies = ['rsi', 'supertrend', 'macdSMA', 'emaCrossoverRsi', 'meanReversion', 'multiLevelConfirmation', 'rsiMacd', 'trendlineBreakout'];

  config = {
    asset: 'BTC',
    timeframe: '1h',
    strategy: 'rsi'
  };

  currentConfig: any = null;
  isSaving = false;
  saveMessage = '';
  saveSuccess = false;

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.botApiService.getBotConfig()
      .pipe(catchError(() => of(null)))
      .subscribe(status => {
        if (status && status.currentConfig) {
          this.currentConfig = status.currentConfig;
          this.config = { ...status.currentConfig };
        }
      });
  }

  saveConfig() {
    this.isSaving = true;
    this.saveMessage = '';

    this.botApiService.updateBotConfig(this.config)
      .pipe(catchError(err => {
        console.error('Failed to save config:', err);
        return of({ success: false, message: 'Failed to save configuration' });
      }))
      .subscribe(result => {
        this.isSaving = false;
        if (result && result.currentConfig) {
          this.currentConfig = result.currentConfig;
          this.saveMessage = 'Configuration saved successfully!';
          this.saveSuccess = true;
          setTimeout(() => {
            this.saveMessage = '';
          }, 3000);
        } else {
          this.saveMessage = 'Failed to save configuration';
          this.saveSuccess = false;
        }
      });
  }
}



