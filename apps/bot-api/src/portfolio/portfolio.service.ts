import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioItemDto, CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto/portfolio-item.dto';
import { PortfolioItemEntity } from '../entities/portfolio-item.entity';

@Injectable()
export class PortfolioService implements OnModuleInit {
  constructor(
    @InjectRepository(PortfolioItemEntity)
    private portfolioRepository: Repository<PortfolioItemEntity>,
  ) {}

  async onModuleInit() {
    // Initialize default portfolio items if database is empty
    const count = await this.portfolioRepository.count();
    if (count === 0) {
      const defaultItems = [
        {
          asset: "ETH",
          value: 150,
          threshold: 0.045,
          pricePresision: 2,
          quantityPrecision: 4,
        },
        {
          asset: "BNB",
          value: 150,
          threshold: 0.045,
          pricePresision: 2,
          quantityPrecision: 3,
        },
        {
          asset: "SOL",
          value: 150,
          threshold: 0.045,
          pricePresision: 2,
          quantityPrecision: 3,
        },
        {
          asset: "SUI",
          value: 45,
          threshold: 0.11,
          pricePresision: 4,
          quantityPrecision: 1,
        },
        {
          asset: "DOT",
          value: 45,
          threshold: 0.11,
          pricePresision: 3,
          quantityPrecision: 2,
        },
        {
          asset: "ARB",
          value: 45,
          threshold: 0.11,
          pricePresision: 4,
          quantityPrecision: 1,
        },
      ];

      await this.portfolioRepository.save(defaultItems);
    }
  }

  async findAll(): Promise<PortfolioItemDto[]> {
    const entities = await this.portfolioRepository.find();
    return entities.map(this.entityToDto);
  }

  async findOne(asset: string): Promise<PortfolioItemDto | null> {
    const entity = await this.portfolioRepository.findOne({ where: { asset } });
    return entity ? this.entityToDto(entity) : null;
  }

  async create(createPortfolioItemDto: CreatePortfolioItemDto): Promise<PortfolioItemDto> {
    const entity = this.portfolioRepository.create(createPortfolioItemDto);
    const savedEntity = await this.portfolioRepository.save(entity);
    return this.entityToDto(savedEntity);
  }

  async update(asset: string, updatePortfolioItemDto: UpdatePortfolioItemDto): Promise<PortfolioItemDto | null> {
    const entity = await this.portfolioRepository.findOne({ where: { asset } });
    if (!entity) {
      return null;
    }

    Object.assign(entity, updatePortfolioItemDto);
    const savedEntity = await this.portfolioRepository.save(entity);
    return this.entityToDto(savedEntity);
  }

  async updateValueInBaseCurrency(asset: string, valueInBaseCurrency: number): Promise<PortfolioItemDto | null> {
    const entity = await this.portfolioRepository.findOne({ where: { asset } });
    if (!entity) {
      return null;
    }

    entity.valueInBaseCurrency = valueInBaseCurrency;
    const savedEntity = await this.portfolioRepository.save(entity);
    return this.entityToDto(savedEntity);
  }

  async remove(asset: string): Promise<boolean> {
    const result = await this.portfolioRepository.delete({ asset });
    return result.affected! > 0;
  }

  async getTotalValue(): Promise<number> {
    const entities = await this.portfolioRepository.find();
    return entities.reduce((total, item) => total + Number(item.value), 0);
  }

  async getTotalValueInBaseCurrency(): Promise<number> {
    const entities = await this.portfolioRepository.find();
    return entities.reduce((total, item) => total + Number(item.valueInBaseCurrency || 0), 0);
  }

  private entityToDto(entity: PortfolioItemEntity): PortfolioItemDto {
    return {
      asset: entity.asset,
      value: Number(entity.value),
      pricePresision: entity.pricePresision,
      quantityPrecision: entity.quantityPrecision,
      threshold: Number(entity.threshold),
      valueInBaseCurrency: entity.valueInBaseCurrency ? Number(entity.valueInBaseCurrency) : undefined,
    };
  }
}