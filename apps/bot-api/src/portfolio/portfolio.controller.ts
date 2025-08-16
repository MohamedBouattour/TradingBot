import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
} from "@nestjs/common";
import { PortfolioService } from "./portfolio.service";
import {
  PortfolioItemDto,
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
} from "./dto/portfolio-item.dto";

@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  async findAll(): Promise<PortfolioItemDto[]> {
    return await this.portfolioService.findAll();
  }

  @Get("stats")
  async getStats() {
    const portfolio = await this.portfolioService.findAll();
    const totalValue = await this.portfolioService.getTotalValue();
    const totalValueInBaseCurrency =
      await this.portfolioService.getTotalValueInBaseCurrency();
  
    return {
      totalTargetValue: totalValue,
      totalCurrentValue: totalValueInBaseCurrency,
      itemCount: portfolio.length,
      assets: portfolio
        .map((item) => ({
          asset: item.asset,
          targetValue: item.value,
          currentValue: item.valueInBaseCurrency || 0,
          deviation: item.valueInBaseCurrency
            ? ((item.valueInBaseCurrency - item.value) / item.value) * 100
            : 0,
          threshold: item.threshold,
          targetPercentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
          currentPercentage: totalValueInBaseCurrency > 0 
            ? ((item.valueInBaseCurrency || 0) / totalValueInBaseCurrency) * 100 
            : 0,
        }))
        .sort((a, b) => b.targetValue - a.targetValue),
      lastUpdated: new Date().toISOString(),
    };
  }
  

  @Get(":asset")
  async findOne(@Param("asset") asset: string): Promise<PortfolioItemDto> {
    const item = await this.portfolioService.findOne(asset);
    if (!item) {
      throw new NotFoundException(
        `Portfolio item with asset ${asset} not found`
      );
    }
    return item;
  }

  @Post()
  async create(
    @Body() createPortfolioItemDto: CreatePortfolioItemDto
  ): Promise<PortfolioItemDto> {
    return await this.portfolioService.create(createPortfolioItemDto);
  }

  @Put(":asset")
  async update(
    @Param("asset") asset: string,
    @Body() updatePortfolioItemDto: UpdatePortfolioItemDto
  ): Promise<PortfolioItemDto> {
    const updatedItem = await this.portfolioService.update(
      asset,
      updatePortfolioItemDto
    );
    if (!updatedItem) {
      throw new NotFoundException(
        `Portfolio item with asset ${asset} not found`
      );
    }
    return updatedItem;
  }

  @Put(":asset/value")
  async updateValue(
    @Param("asset") asset: string,
    @Body("valueInBaseCurrency") valueInBaseCurrency: number
  ): Promise<PortfolioItemDto> {
    const updatedItem = await this.portfolioService.updateValueInBaseCurrency(
      asset,
      valueInBaseCurrency
    );
    if (!updatedItem) {
      throw new NotFoundException(
        `Portfolio item with asset ${asset} not found`
      );
    }
    return updatedItem;
  }

  @Delete(":asset")
  async remove(@Param("asset") asset: string): Promise<{ message: string }> {
    const removed = await this.portfolioService.remove(asset);
    if (!removed) {
      throw new NotFoundException(
        `Portfolio item with asset ${asset} not found`
      );
    }
    return { message: `Portfolio item ${asset} removed successfully` };
  }

  @Post("sync")
  async syncPortfolioItem(
    @Body() syncData: CreatePortfolioItemDto
  ): Promise<PortfolioItemDto> {
    return await this.portfolioService.syncPortfolioItem(syncData);
  }
}
