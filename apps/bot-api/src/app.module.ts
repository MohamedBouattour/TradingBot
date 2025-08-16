import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { TradingModule } from "./trading/trading.module";
import { LogsModule } from "./logs/logs.module";
import { PortfolioItemEntity } from "./entities/portfolio-item.entity";
import { TradingDecisionEntity } from "./entities/trading-decision.entity";
import { ROIDataEntity } from "./entities/roi-data.entity";
import { RebalanceResultEntity } from "./entities/rebalance-result.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_HOST"),
        port: parseInt(configService.get("DB_PORT")!),
        username: configService.get("DB_USERNAME"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_DATABASE"),
        entities: [
          PortfolioItemEntity,
          TradingDecisionEntity,
          ROIDataEntity,
          RebalanceResultEntity,
        ],
        synchronize: configService.get("NODE_ENV") === "development",
        logging: configService.get("NODE_ENV") === "development",
      }),
      inject: [ConfigService],
    }),
    PortfolioModule,
    TradingModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
