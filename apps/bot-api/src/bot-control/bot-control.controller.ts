import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { BotControlService } from './bot-control.service';
import { BotConfigDto, BotStatusDto, BacktestRequestDto, BacktestResultDto, PriceDataDto } from './dto/bot-config.dto';

@Controller('bot')
export class BotControlController {
  constructor(private readonly botControlService: BotControlService) {}

  @Get()
  getHealth() {
    return { status: 'ok', message: 'Bot control endpoint is working' };
  }

  @Get('status')
  async getBotStatus(): Promise<BotStatusDto> {
    return await this.botControlService.getBotStatus();
  }

  @Post('config')
  async updateConfig(@Body() config: BotConfigDto): Promise<BotStatusDto> {
    return await this.botControlService.updateConfig(config);
  }

  @Get('config')
  async getConfig(): Promise<BotStatusDto> {
    return await this.botControlService.getBotStatus();
  }

  @Post('start')
  async startBot(): Promise<{ success: boolean; message: string }> {
    return await this.botControlService.startBot();
  }

  @Post('stop')
  async stopBot(): Promise<{ success: boolean; message: string }> {
    return await this.botControlService.stopBot();
  }

  @Post('backtest')
  async runBacktest(@Body() request: BacktestRequestDto): Promise<BacktestResultDto> {
    console.log('Backtest request received:', request);
    try {
      const result = await this.botControlService.runBacktest(request);
      console.log('Backtest result:', result);
      return result;
    } catch (error) {
      console.error('Backtest error:', error);
      throw error;
    }
  }

  @Get('backtest')
  async getBacktestHistory(@Query('limit') limit?: string): Promise<BacktestResultDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.botControlService.getBacktestHistory(limitNum);
  }

  @Get('price-data/:asset')
  async getPriceData(
    @Param('asset') asset: string,
    @Query('timeframe') timeframe: string = '1h',
    @Query('limit') limit?: string,
  ): Promise<PriceDataDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.botControlService.getPriceData(asset, timeframe, limitNum);
  }
}

