import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TradingDecisionDto, ROIDataDto, RebalanceResultDto } from './dto/trading-data.dto';
import { TradingDecisionEntity } from '../entities/trading-decision.entity';
import { ROIDataEntity } from '../entities/roi-data.entity';
import { RebalanceResultEntity } from '../entities/rebalance-result.entity';

@Injectable()
export class TradingService {
  constructor(
    @InjectRepository(TradingDecisionEntity)
    private tradingDecisionRepository: Repository<TradingDecisionEntity>,
    @InjectRepository(ROIDataEntity)
    private roiDataRepository: Repository<ROIDataEntity>,
    @InjectRepository(RebalanceResultEntity)
    private rebalanceResultRepository: Repository<RebalanceResultEntity>,
  ) {}

  // Trading Decisions
  async addTradingDecision(decision: TradingDecisionDto): Promise<TradingDecisionDto> {
    const entity = this.tradingDecisionRepository.create({
      decision: decision.decision,
      currentPrice: decision.currentPrice,
      targetPrice: decision.targetPrice,
      executionTimeMs: decision.executionTimeMs,
      asset: decision.asset,
      pair: decision.pair,
    });
    
    const savedEntity = await this.tradingDecisionRepository.save(entity);
    return this.tradingDecisionEntityToDto(savedEntity);
  }

  async getTradingDecisions(limit: number = 100): Promise<TradingDecisionDto[]> {
    const entities = await this.tradingDecisionRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(this.tradingDecisionEntityToDto);
  }

  async getLatestTradingDecision(): Promise<TradingDecisionDto | null> {
    const entities = await this.tradingDecisionRepository.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });
  
    const entity = entities[0];
    return entity ? this.tradingDecisionEntityToDto(entity) : null;
  }
  

  // ROI Data
  async addROIData(roiData: ROIDataDto): Promise<ROIDataDto> {
    const entity = this.roiDataRepository.create({
      assetValue: roiData.assetValue,
      baseCurrencyValue: roiData.baseCurrencyValue,
      portfolioValue: roiData.portfolioValue,
      totalValue: roiData.totalValue,
      roi: roiData.roi,
      pnl: roiData.pnl,
      initialBalance: roiData.initialBalance,
    });
    
    const savedEntity = await this.roiDataRepository.save(entity);
    return this.roiDataEntityToDto(savedEntity);
  }

  async getROIHistory(limit: number = 100): Promise<ROIDataDto[]> {
    const entities = await this.roiDataRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(this.roiDataEntityToDto);
  }

  async getLatestROI(): Promise<ROIDataDto | null> {
    const entities = await this.roiDataRepository.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });
  
    const entity = entities[0];
    return entity ? this.roiDataEntityToDto(entity) : null;
  }
  

  // Rebalance Results
  async addRebalanceResult(result: RebalanceResultDto): Promise<RebalanceResultDto> {
    const entity = this.rebalanceResultRepository.create({
      asset: result.asset,
      status: result.status,
      action: result.action,
      quantity: result.quantity,
      price: result.price,
      value: result.value,
      currentValue: result.currentValue,
      targetValue: result.targetValue,
      deviation: result.deviation,
      error: result.error,
    });
    
    const savedEntity = await this.rebalanceResultRepository.save(entity);
    return this.rebalanceResultEntityToDto(savedEntity);
  }

  async getRebalanceHistory(limit: number = 100): Promise<RebalanceResultDto[]> {
    const entities = await this.rebalanceResultRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(this.rebalanceResultEntityToDto);
  }

  async getRebalanceHistoryByAsset(asset: string, limit: number = 50): Promise<RebalanceResultDto[]> {
    const entities = await this.rebalanceResultRepository.find({
      where: { asset },
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return entities.map(this.rebalanceResultEntityToDto);
  }

  // Statistics
  async getTradingStats() {
    const latestROI = await this.getLatestROI();
    
    const buyDecisions = await this.tradingDecisionRepository.count({
      where: { decision: 'BUY' },
    });
    
    const sellDecisions = await this.tradingDecisionRepository.count({
      where: { decision: 'SELL' },
    });
    
    const totalDecisions = await this.tradingDecisionRepository.count();

    const rebalanceStats = await this.rebalanceResultRepository
      .createQueryBuilder('rebalance')
      .select('rebalance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('rebalance.status')
      .getRawMany();

    const rebalanceStatsObj = rebalanceStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    const totalRebalanceOps = await this.rebalanceResultRepository.count();

    return {
      currentROI: latestROI?.roi || 0,
      currentPNL: latestROI?.pnl || 0,
      totalValue: latestROI?.totalValue || 0,
      tradingDecisions: {
        total: totalDecisions,
        buy: buyDecisions,
        sell: sellDecisions,
        buyPercentage: totalDecisions > 0 ? (buyDecisions / totalDecisions * 100) : 0,
      },
      rebalanceOperations: {
        total: totalRebalanceOps,
        ...rebalanceStatsObj,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // Clear old data (for maintenance)
  async clearOldData(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const tradingDecisionsDeleted = await this.tradingDecisionRepository.delete({
      timestamp: MoreThan(cutoffDate),
    });

    const roiHistoryDeleted = await this.roiDataRepository.delete({
      timestamp: MoreThan(cutoffDate),
    });

    const rebalanceHistoryDeleted = await this.rebalanceResultRepository.delete({
      timestamp: MoreThan(cutoffDate),
    });

    const tradingDecisionsRemaining = await this.tradingDecisionRepository.count();
    const roiHistoryRemaining = await this.roiDataRepository.count();
    const rebalanceHistoryRemaining = await this.rebalanceResultRepository.count();

    return {
      tradingDecisionsRemaining,
      roiHistoryRemaining,
      rebalanceHistoryRemaining,
      deleted: {
        tradingDecisions: tradingDecisionsDeleted.affected || 0,
        roiHistory: roiHistoryDeleted.affected || 0,
        rebalanceHistory: rebalanceHistoryDeleted.affected || 0,
      },
    };
  }

  // Entity to DTO converters
  private tradingDecisionEntityToDto(entity: TradingDecisionEntity): TradingDecisionDto {
    return {
      decision: entity.decision,
      currentPrice: Number(entity.currentPrice),
      targetPrice: entity.targetPrice ? Number(entity.targetPrice) : undefined,
      executionTimeMs: entity.executionTimeMs,
      timestamp: entity.timestamp.toISOString(),
      asset: entity.asset,
      pair: entity.pair,
    };
  }

  private roiDataEntityToDto(entity: ROIDataEntity): ROIDataDto {
    return {
      assetValue: Number(entity.assetValue),
      baseCurrencyValue: Number(entity.baseCurrencyValue),
      portfolioValue: Number(entity.portfolioValue),
      totalValue: Number(entity.totalValue),
      roi: Number(entity.roi),
      pnl: Number(entity.pnl),
      initialBalance: Number(entity.initialBalance),
      timestamp: entity.timestamp.toISOString(),
    };
  }

  private rebalanceResultEntityToDto(entity: RebalanceResultEntity): RebalanceResultDto {
    return {
      asset: entity.asset,
      status: entity.status as 'SUCCESS' | 'ERROR' | 'SKIPPED',
      action: entity.action as 'BUY' | 'SELL' | 'BALANCED' | undefined,
      quantity: entity.quantity ? Number(entity.quantity) : undefined,
      price: entity.price ? Number(entity.price) : undefined,
      value: entity.value ? Number(entity.value) : undefined,
      currentValue: Number(entity.currentValue),
      targetValue: Number(entity.targetValue),
      deviation: Number(entity.deviation),
      timestamp: entity.timestamp.toISOString(),
      error: entity.error,
    };
  }
}