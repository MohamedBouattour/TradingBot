import { Injectable } from '@nestjs/common';
import { BotConfigDto, BotStatusDto, BacktestRequestDto, BacktestResultDto, PriceDataDto, TradeDetailDto } from './dto/bot-config.dto';
import { MarketService, Candle } from '../services/market.service';
import { StrategyService } from '../services/strategy.service';

@Injectable()
export class BotControlService {
  constructor(
    private readonly marketService: MarketService,
    private readonly strategyService: StrategyService,
  ) {}
  private botStatus: BotStatusDto = {
    isRunning: false,
    currentConfig: {
      asset: 'BTC',
      timeframe: '1h',
      strategy: 'rsi',
    },
  };

  private backtestHistory: BacktestResultDto[] = [];

  async getBotStatus(): Promise<BotStatusDto> {
    return this.botStatus;
  }

  async updateConfig(config: BotConfigDto): Promise<BotStatusDto> {
    if (config.asset) this.botStatus.currentConfig.asset = config.asset;
    if (config.timeframe) this.botStatus.currentConfig.timeframe = config.timeframe;
    if (config.strategy) this.botStatus.currentConfig.strategy = config.strategy;
    this.botStatus.lastUpdate = new Date().toISOString();
    return this.botStatus;
  }

  async startBot(): Promise<{ success: boolean; message: string }> {
    if (this.botStatus.isRunning) {
      return { success: false, message: 'Bot is already running' };
    }
    
    try {
      // In a real implementation, this would communicate with the trading-bot process
      // For now, we'll just update the status
      this.botStatus.isRunning = true;
      this.botStatus.lastUpdate = new Date().toISOString();
      return { success: true, message: 'Bot started successfully' };
    } catch (error) {
      return { success: false, message: `Failed to start bot: ${error.message}` };
    }
  }

  async stopBot(): Promise<{ success: boolean; message: string }> {
    if (!this.botStatus.isRunning) {
      return { success: false, message: 'Bot is not running' };
    }
    
    try {
      this.botStatus.isRunning = false;
      this.botStatus.lastUpdate = new Date().toISOString();
      return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
      return { success: false, message: `Failed to stop bot: ${error.message}` };
    }
  }

  async runBacktest(request: BacktestRequestDto): Promise<BacktestResultDto> {
    const initialBalance = 1000;
    const FEES = 0.36; // Trading fees percentage
    
    // Calculate period - ensure dates are valid and not in the future
    // Default to last 30 days (1 month) to get full month of data
    const now = new Date();
    // Ensure endDate defaults to now (today) to get the most recent data
    let endDate = request.endDate ? new Date(request.endDate) : now;
    let startDate = request.startDate ? new Date(request.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format provided');
    }
    
    // Ensure endDate is not in the future - always use current time for most recent data
    if (endDate > now) {
      endDate = now;
    }
    
    // If no endDate was provided, ensure we use current time to get latest data
    if (!request.endDate) {
      endDate = now;
    }
    
    // Ensure startDate is before endDate
    if (startDate >= endDate) {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Ensure we don't go too far back (Binance has limits)
    const maxHistoryDays = 365 * 2; // 2 years max
    const minStartDate = new Date(now.getTime() - maxHistoryDays * 24 * 60 * 60 * 1000);
    if (startDate < minStartDate) {
      startDate = minStartDate;
    }
    
    const periodMs = endDate.getTime() - startDate.getTime();
    const periodMonths = parseFloat((periodMs / (1000 * 60 * 60 * 24 * 30)).toFixed(2));
    
    // Fetch real historical candle data from Binance
    const pair = this.marketService.getPair(request.asset);
    console.log(`Fetching real candle data for ${pair} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    let candles: Candle[];
    try {
      candles = await this.marketService.fetchHistoricalData(
        pair,
        request.timeframe,
        startDate,
        endDate,
      );
    } catch (error: any) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
    
    if (candles.length === 0) {
      throw new Error('No historical data available for the specified period');
    }
    
    // Validate that we got real data (check first and last candle dates and prices)
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    console.log(`Fetched ${candles.length} candles for backtest`);
    console.log(`First candle: ${firstCandle.time}, Price: $${firstCandle.close.toFixed(2)}`);
    console.log(`Last candle: ${lastCandle.time}, Price: $${lastCandle.close.toFixed(2)}`);
    
    // Verify dates are not in the future and data is recent
    // Reuse the 'now' variable declared at the beginning of the function
    const lastCandleDate = new Date(lastCandle.time);
    const daysSinceLastCandle = (now.getTime() - lastCandleDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (lastCandleDate > now) {
      console.warn(`Warning: Last candle date ${lastCandle.time} is in the future! Clamping to current date.`);
      // Filter out future candles
      candles = candles.filter(c => new Date(c.time) <= now);
      if (candles.length === 0) {
        throw new Error('No valid historical data after filtering future dates');
      }
    } else if (daysSinceLastCandle > 1) {
      console.warn(`Warning: Last candle is ${daysSinceLastCandle.toFixed(1)} days old. For current prices, ensure endDate is today.`);
    }
    
    // Log current price for verification
    console.log(`Current ${request.asset} price from last candle: $${lastCandle.close.toFixed(2)} (${daysSinceLastCandle.toFixed(1)} days ago)`);
    
    // Backtest with real data
    const trades: TradeDetailDto[] = [];
    let currentBalance = initialBalance;
    let inPosition = false;
    let currentPosition: TradeDetailDto | null = null;
    let maxDrawdown = 0;
    let peakBalance = initialBalance;
    
    // Minimum candles needed for strategy (dynamic based on strategy)
    // trendline-breakout needs at least 2*length+1 (default 29), btc-spot needs 50
    const minCandlesForStrategy = request.strategy === 'trendline-breakout' ? 29 : 50;
    
    // Iterate through candles and execute strategy
    for (let i = minCandlesForStrategy; i < candles.length; i++) {
      const currentCandle = candles[i];
      const candleTime = new Date(currentCandle.time);
      
      // Get historical candles for strategy (use up to 200 candles if available for better indicators)
      const lookbackCandles = Math.min(200, i + 1);
      const historicalCandles = candles.slice(Math.max(0, i - lookbackCandles + 1), i + 1);
      
      if (!inPosition) {
        // Execute strategy to check for BUY signal
        const strategyResult = this.strategyService.executeStrategy(
          request.strategy,
          historicalCandles,
        );
        
        if (strategyResult.label === 'BUY' && strategyResult.tp > 0) {
          const buyPrice = currentCandle.close;
          const quantity = currentBalance / buyPrice;
          
          // Use custom target ROI if provided, otherwise use strategy's target price
          let targetPrice = strategyResult.tp;
          if (request.targetROI && request.targetROI > 0) {
            // Convert percentage to multiplier (e.g., 2% = 1.02)
            const targetMultiplier = 1 + (request.targetROI / 100);
            const customTargetPrice = buyPrice * targetMultiplier;
            // Use the higher of strategy target or custom target (ensure we meet minimum)
            targetPrice = Math.max(targetPrice, customTargetPrice);
          }
          
          currentPosition = {
            timestamp: candleTime.toISOString(),
            action: 'BUY',
            price: parseFloat(buyPrice.toFixed(2)),
            quantity: parseFloat(quantity.toFixed(6)),
            targetPrice: parseFloat(targetPrice.toFixed(2)),
            status: 'Open',
            balance: currentBalance,
            roi: parseFloat(((targetPrice / buyPrice - 1) * 100).toFixed(2)),
          };
          trades.push(currentPosition);
          inPosition = true;
          // Store invested amount for P&L calculation
          (currentPosition as any).investedAmount = currentBalance;
        }
      } else if (currentPosition) {
        // Check if TP is hit using real candle high price
        const candleHigh = currentCandle.high;
        const candleLow = currentCandle.low;
        
        let closed = false;
        
        // Check if TP is hit (spot trading - hold until TP only, no stop loss)
        if (candleHigh >= currentPosition.targetPrice!) {
          // TP was hit during this candle
          const investedAmount = (currentPosition as any).investedAmount || currentPosition.balance;
          const priceChangePercent = ((currentPosition.targetPrice! - currentPosition.price) / currentPosition.price) * 100;
          const pnlPercent = priceChangePercent - FEES; // Subtract fees from the gain
          const pnl = (investedAmount * pnlPercent) / 100;
          currentBalance = investedAmount + pnl; // New balance = invested amount + profit
          
          const holdingHours = (candleTime.getTime() - new Date(currentPosition.timestamp).getTime()) / (1000 * 60 * 60);
          
          currentPosition.pnl = parseFloat(pnl.toFixed(2));
          currentPosition.pnlPercent = parseFloat(pnlPercent.toFixed(2));
          currentPosition.status = 'Closed with TP';
          currentPosition.closeTime = candleTime.toISOString();
          currentPosition.holdingPeriodHours = parseFloat(holdingHours.toFixed(2));
          currentPosition.balance = parseFloat(currentBalance.toFixed(2));
          
          closed = true;
        }
        
        // For trendline-breakout strategy, also check for downward breakout as exit signal
        if (!closed && request.strategy === 'trendline-breakout') {
          const strategyResult = this.strategyService.executeStrategy(
            request.strategy,
            historicalCandles,
          );
          
          // If strategy returns SELL signal (downward breakout), exit position
          // Note: Currently strategies only return BUY or empty, but we can check for exit conditions
          // For now, we'll rely on TP only for trendline-breakout
        }
        
        // Track drawdown based on current balance
        if (currentBalance > peakBalance) {
          peakBalance = currentBalance;
        }
        const drawdown = ((peakBalance - currentBalance) / peakBalance) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
        
        if (closed) {
          inPosition = false;
          currentPosition = null;
        }
      }
    }
    
    // Close any open position at the end
    if (inPosition && currentPosition) {
      const finalCandle = candles[candles.length - 1];
      const finalPrice = finalCandle.close;
      const investedAmount = (currentPosition as any).investedAmount || currentPosition.balance;
      const priceChangePercent = ((finalPrice - currentPosition.price) / currentPosition.price) * 100;
      const pnlPercent = priceChangePercent - FEES;
      const pnl = (investedAmount * pnlPercent) / 100;
      currentBalance = investedAmount + pnl;
      
      currentPosition.pnl = parseFloat(pnl.toFixed(2));
      currentPosition.pnlPercent = parseFloat(pnlPercent.toFixed(2));
      currentPosition.status = 'Closed';
      currentPosition.closeTime = endDate.toISOString();
      currentPosition.holdingPeriodHours = parseFloat(((endDate.getTime() - new Date(currentPosition.timestamp).getTime()) / (1000 * 60 * 60)).toFixed(2));
      currentPosition.balance = parseFloat(currentBalance.toFixed(2));
    }
    
    const finalBalance = parseFloat(currentBalance.toFixed(2));
    const totalPNL = finalBalance - initialBalance;
    const totalROI = ((finalBalance - initialBalance) / initialBalance) * 100;
    const closedTrades = trades.filter(t => t.status !== 'Open');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0).length;
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Calculate Sharpe Ratio (simplified)
    const returns = closedTrades.map(t => (t.pnlPercent || 0) / 100);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    
    const result: BacktestResultDto = {
      asset: request.asset,
      timeframe: request.timeframe,
      strategy: request.strategy,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periodMonths,
      initialBalance,
      finalBalance,
      totalROI: parseFloat(totalROI.toFixed(2)),
      totalPNL: parseFloat(totalPNL.toFixed(2)),
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: parseFloat(winRate.toFixed(1)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      trades,
    };
    
    await this.saveBacktestResult(result);
    return result;
  }

  async getBacktestHistory(limit: number = 10): Promise<BacktestResultDto[]> {
    return this.backtestHistory.slice(-limit);
  }

  async saveBacktestResult(result: BacktestResultDto): Promise<void> {
    this.backtestHistory.push(result);
    // Keep only last 50 results
    if (this.backtestHistory.length > 50) {
      this.backtestHistory.shift();
    }
  }

  async getPriceData(asset: string, timeframe: string, limit: number = 100): Promise<PriceDataDto[]> {
    // This would fetch from Binance API or trading-bot service
    // For now, return empty array - will be implemented when connecting to actual data source
    return [];
  }
}

