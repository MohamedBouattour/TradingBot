import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('roi_data')
export class ROIDataEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  assetValue!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  baseCurrencyValue!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  portfolioValue!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  totalValue!: number;

  @Column('decimal', { precision: 10, scale: 4 })
  roi!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  pnl!: number;

  @Column('decimal', { precision: 15, scale: 8 })
  initialBalance!: number;

  @CreateDateColumn()
  timestamp!: Date;
}