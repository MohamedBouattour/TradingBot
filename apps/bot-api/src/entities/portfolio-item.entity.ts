import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("portfolio_items")
export class PortfolioItemEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  asset!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  value!: number;

  @Column("int")
  pricePresision!: number;

  @Column("int")
  quantityPrecision!: number;

  @Column("decimal", { precision: 5, scale: 4 })
  threshold!: number;

  @Column("decimal", { precision: 15, scale: 8, nullable: true })
  valueInBaseCurrency?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
