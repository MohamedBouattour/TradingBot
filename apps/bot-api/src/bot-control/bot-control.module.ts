import { Module } from '@nestjs/common';
import { BotControlController } from './bot-control.controller';
import { BotControlService } from './bot-control.service';
import { MarketService } from '../services/market.service';
import { StrategyService } from '../services/strategy.service';

@Module({
  controllers: [BotControlController],
  providers: [BotControlService, MarketService, StrategyService],
  exports: [BotControlService],
})
export class BotControlModule {}

