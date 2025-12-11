import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BotControlComponent } from './features/bot-control/bot-control.component';
import { BotConfigComponent } from './features/bot-config/bot-config.component';
import { PriceChartComponent } from './features/price-chart/price-chart.component';
import { BacktestComponent } from './features/backtest/backtest.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'bot-control', component: BotControlComponent },
  { path: 'bot-config', component: BotConfigComponent },
  { path: 'chart', component: PriceChartComponent },
  { path: 'backtest', component: BacktestComponent },
  { path: '**', redirectTo: '/dashboard' }
];
