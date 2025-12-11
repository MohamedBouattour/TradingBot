import { Component, OnInit, OnDestroy, inject, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BotApiService } from '../../core/services/bot-api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="price-chart">
      <div class="chart-header">
        <h2>Price Chart - {{ asset }}</h2>
        <div class="chart-controls">
          <select [(ngModel)]="selectedTimeframe" (change)="loadChartData()" class="timeframe-select" name="timeframe">
            <option *ngFor="let tf of timeframes" [value]="tf">{{ tf }}</option>
          </select>
        </div>
      </div>
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
      <div class="chart-loading" *ngIf="isLoading">
        Loading chart data...
      </div>
      <div class="chart-error" *ngIf="error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .price-chart {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #eee;
    }

    .chart-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .timeframe-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }

    .chart-loading, .chart-error {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .chart-error {
      color: #dc3545;
    }
  `]
})
export class PriceChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private botApiService = inject(BotApiService);

  @Input() asset: string = 'BTC';
  @Input() timeframe: string = '1h';
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  selectedTimeframe: string = '1h';
  timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  
  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  chartData: any[] = [];

  ngOnInit() {
    this.selectedTimeframe = this.timeframe;
  }

  ngAfterViewInit() {
    this.loadChartData();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadChartData() {
    this.isLoading = true;
    this.error = null;

    this.botApiService.getPriceData(this.asset, this.selectedTimeframe, 100)
      .pipe(catchError(err => {
        console.error('Failed to load chart data:', err);
        this.error = 'Failed to load chart data';
        return of([]);
      }))
      .subscribe(data => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.chartData = data;
          this.renderChart(data);
        } else {
          // Generate mock data for demonstration
          this.chartData = this.generateMockData();
          this.renderChart(this.chartData);
        }
      });
  }

  private generateMockData() {
    const data = [];
    const basePrice = 50000;
    const now = Date.now();
    
    for (let i = 99; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      const variation = (Math.random() - 0.5) * 1000;
      const open = basePrice + variation;
      const close = open + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000
      });
    }
    
    return data;
  }

  private renderChart(data: any[]) {
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) return;
    const canvas = this.chartCanvas.nativeElement;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Price',
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: 'Volume',
            data: volumes,
            type: 'bar' as ChartType,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        }
      }
    };

    this.chart = new Chart(canvas, config);
  }
}

