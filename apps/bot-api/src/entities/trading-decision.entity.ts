import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("trading_decisions")
export class TradingDecisionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  decision!: string;

  @Column("decimal", { precision: 15, scale: 8 })
  currentPrice!: number;

  @Column("decimal", { precision: 15, scale: 8, nullable: true })
  targetPrice?: number; // optional since it can be null

  @Column("int")
  executionTimeMs!: number;

  @Column({ type: "varchar" })
  asset!: string;

  @Column({ type: "varchar" })
  pair!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
