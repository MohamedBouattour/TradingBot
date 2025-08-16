import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingDecisionDto, ROIDataDto, RebalanceResultDto } from './dto/trading-data.dto';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  // Trading Decisions Endpoints
  @Post('decisions')
  async addTradingDecision(@Body() decision: TradingDecisionDto): Promise<TradingDecisionDto> {
    return await this.tradingService.addTradingDecision(decision);
  }

  @Get('decisions')
  async getTradingDecisions(@Query('limit') limit?: string): Promise<TradingDecisionDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.tradingService.getTradingDecisions(limitNum);
  }

  @Get('decisions/latest')
  async getLatestTradingDecision(): Promise<TradingDecisionDto | null> {
    return await this.tradingService.getLatestTradingDecision();
  }

  // ROI Data Endpoints
  @Post('roi')
  async addROIData(@Body() roiData: ROIDataDto): Promise<ROIDataDto> {
    return await this.tradingService.addROIData(roiData);
  }

  @Get('roi')
  async getROIHistory(@Query('limit') limit?: string): Promise<ROIDataDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.tradingService.getROIHistory(limitNum);
  }

  @Get('roi/latest')
  async getLatestROI(): Promise<ROIDataDto | null> {
    return await this.tradingService.getLatestROI();
  }

  // Rebalance Results Endpoints
  @Post('rebalance')
  async addRebalanceResult(@Body() result: RebalanceResultDto): Promise<RebalanceResultDto> {
    return await this.tradingService.addRebalanceResult(result);
  }

  @Get('rebalance')
  async getRebalanceHistory(@Query('limit') limit?: string): Promise<RebalanceResultDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.tradingService.getRebalanceHistory(limitNum);
  }

  @Get('rebalance/:asset')
  async getRebalanceHistoryByAsset(
    @Param('asset') asset: string,
    @Query('limit') limit?: string,
  ): Promise<RebalanceResultDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.tradingService.getRebalanceHistoryByAsset(asset, limitNum);
  }

  // Statistics Endpoint
  @Get('stats')
  async getTradingStats() {
    return await this.tradingService.getTradingStats();
  }

  // Maintenance Endpoint
  @Post('cleanup')
  async clearOldData(@Body('daysToKeep') daysToKeep?: number) {
    return await this.tradingService.clearOldData(daysToKeep || 30);
  }

  // Health Check
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'trading-api',
    };
  }
}