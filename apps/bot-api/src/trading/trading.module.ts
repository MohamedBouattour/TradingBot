import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { TradingDecisionEntity } from '../entities/trading-decision.entity';
import { ROIDataEntity } from '../entities/roi-data.entity';
import { RebalanceResultEntity } from '../entities/rebalance-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingDecisionEntity,
      ROIDataEntity,
      RebalanceResultEntity,
    ])
  ],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}