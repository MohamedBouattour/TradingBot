import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("rebalance_results")
export class RebalanceResultEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  asset!: string;

  @Column({ type: "varchar" })
  status!: string; // 'SUCCESS' | 'ERROR' | 'SKIPPED'

  @Column({ nullable: true, type: "varchar" })
  action!: string; // 'BUY' | 'SELL' | 'BALANCED'

  @Column("decimal", { precision: 15, scale: 8, nullable: true })
  quantity!: number;

  @Column("decimal", { precision: 15, scale: 8, nullable: true })
  price!: number;

  @Column("decimal", { precision: 15, scale: 8, nullable: true })
  value!: number;

  @Column("decimal", { precision: 15, scale: 8 })
  currentValue!: number;

  @Column("decimal", { precision: 15, scale: 8 })
  targetValue!: number;

  @Column("decimal", { precision: 10, scale: 4 })
  deviation!: number;

  @Column("text", { nullable: true })
  error?: string;

  @CreateDateColumn()
  timestamp!: Date;
}
