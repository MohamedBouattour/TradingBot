interface RebalanceResult {
  asset: string;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  currentValue: number;
  targetValue: number;
  deviation: number;
  timestamp: string;
  action?: "BUY" | "SELL" | "BALANCED";
  quantity?: number;
  price?: number;
  value?: number;
  error?: string;
}
