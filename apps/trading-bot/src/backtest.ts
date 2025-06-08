import {
  ASSET,
  MAX_TARGET_ROI,
  MIN_TARGET_ROI,
  PAIR,
  PERIOD,
  TIME_FRAME,
} from "./constants";
import { delay } from "./core/utils";
import { Candle } from "./models/candle.model";
import { Operation } from "./models/operation.enum";
import { Interval, TickInterval } from "./models/tick-interval.model";
import { LogService } from "./services/log.service";
import { MarketService } from "./services/market.service";
import { StrategyManager } from "./strategies/strategy-manager";

import { SuperTrendStrategy } from "./strategies/supertrend/supertrend-strategy";

const strategyManager = new StrategyManager(new SuperTrendStrategy());

let allData: Candle[] = [];
let positions: any[] = [];
let inPosition = false;
let TARGET_ROI: number = 1.0;
let stats: any[] = [];
const FEES = 0.36;
let period: number;

let minRoi = MIN_TARGET_ROI;
let maxRoi = MAX_TARGET_ROI;

let step = 0.01;

const interval = new TickInterval(Interval[TIME_FRAME]);
async function prepareData(): Promise<Candle[]> {
  const oneMonthMs = PERIOD;
  const now = Date.now();
  const oneMonthAgo = now - oneMonthMs;
  let lastTimestamp = now;
  period = (lastTimestamp - oneMonthAgo) / (1000 * 60 * 60 * 24);
  while (lastTimestamp > oneMonthAgo) {
    await delay(1000);
    console.log(
      (lastTimestamp - oneMonthAgo) / (1000 * 60 * 60 * 24) + "Days left"
    );
    const data = await MarketService.fetchCandlestickData(
      PAIR,
      interval.getInterval(),
      500,
      lastTimestamp
    );

    if (data.length === 0) break;

    allData = [...data, ...allData];
    lastTimestamp = new Date(data[0].time).getTime();
  }
  return allData;
}

async function mainWithFixedRoi() {
  allData = await prepareData();

  const rois = [];

  for (let roi = minRoi; roi <= maxRoi; roi += step) {
    rois.push(parseFloat(roi.toFixed(4)));
  }
  rois.forEach((roi) => {
    TARGET_ROI = roi;
    positions = [];
    inPosition = false;
    const shortEma = 25;
    const longEma = 200;
    allData.forEach((_, index) => {
      if (index > 500) {
        const testedData = allData.slice(index - 500, index);

        const { label, tp, sl, roi, riskRewardRatio } =
          strategyManager.executeStrategy(testedData);

        if (
          !inPosition &&
          label === Operation.BUY &&
          tp > 0 &&
          sl > 0 &&
          roi >= 1.0066 &&
          riskRewardRatio >= 1
        ) {
          console.log(testedData.at(-1)?.time, roi);
          positions.push({
            time: new Date(
              testedData[testedData.length - 1].closeTime
            ).toISOString(),
            price: testedData[testedData.length - 1].close,
            type: Operation.BUY,
            targetPrice: tp,
            sl,
            roi,
          });
          inPosition = true;
          return;
        }
        if (inPosition) {
          const position = positions[positions.length - 1];
          if (testedData[testedData.length - 1].high >= position.targetPrice) {
            position.pnl =
              ((position.targetPrice - position.price) / position.price) * 100;
            position.pnl = parseFloat((position.pnl - FEES).toFixed(4));
            position.status = "Closed with TP";
            position.closeTime = testedData[testedData.length - 1].time;
            position.period =
              (new Date(testedData[testedData.length - 1].time).getTime() -
                new Date(position.time).getTime()) /
              (1000 * 60 * 60);
            inPosition = false;
          }
          if (label === Operation.SELL) {
            position.pnl =
              ((testedData.at(-1)!.close - position.price) / position.price) *
              100;
            position.pnl = parseFloat((position.pnl - FEES).toFixed(4));
            position.status = "Closed with SL";
            position.closeTime = testedData[testedData.length - 1].time;
            position.period =
              (new Date(testedData[testedData.length - 1].time).getTime() -
                new Date(position.time).getTime()) /
              (1000 * 60 * 60);
            inPosition = false;
          }
        }
      }
    });
    const wins = positions.filter((position) => position.pnl > 0).length;
    const losses = positions.filter((position) => position.pnl < 0).length;
    const closedPositions = [
      ...positions.filter((position) => position.pnl > 0),
      ...positions.filter((position) => position.pnl < 0),
    ];
    closedPositions.forEach((position) => {
      LogService.log(
        position.time +
          " " +
          position.pnl +
          " " +
          position.status +
          " " +
          position.closeTime +
          " from " +
          position.price.toFixed(4) +
          " to " +
          position.targetPrice.toFixed(4) +
          " pnl " +
          position.pnl.toFixed(2) +
          " in " +
          position.period?.toFixed(2) +
          " Hours "
      );
    });
    stats.push({
      asset: ASSET,
      interval: interval.getInterval(),
      totalPnl: calculateTotalCompoundedPnL(closedPositions).toFixed(2),
      wins,
      losses,
      TARGET_ROI,
    });
  });
  LogService.log("----------------------------------");
  stats
    /*     .sort((a, b) => {
      const pnlDiff = b.totalPnl - a.totalPnl;
      const winrateDiff =
        (b.wins / (b.wins + b.losses)) * 100 -
        (a.wins / (a.wins + a.losses)) * 100;
      return pnlDiff || winrateDiff;
    }) */
    .forEach((stat) => {
      LogService.log(
        stat.asset +
          " risk/reward ratio: " +
          2 +
          " on " +
          interval.getInterval() +
          " on target " +
          stat.TARGET_ROI +
          " Total PNL: " +
          stat.totalPnl +
          " winrate " +
          ((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(2) +
          "% " +
          stat.wins +
          "/" +
          stat.losses +
          " in " +
          period +
          " days" +
          " \n"
      );
    });

  LogService.log(
    !positions?.at(-1)?.status
      ? positions?.at(-1)?.time + " at roi " + positions?.at(-1)?.roi
      : ""
  );
}

mainWithFixedRoi();

function calculateTotalCompoundedPnL(trades: any[]) {
  let total = 1;

  for (const trade of trades) {
    total *= 1 + trade.pnl / 100; // Convert percentage to multiplier
  }

  const totalPercentage = (total - 1) * 100;
  return totalPercentage;
}
