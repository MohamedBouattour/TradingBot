export enum Interval {
  "1m" = "1m",
  "5m" = "5m",
  "15m" = "15m",
  "30m" = "30m",
  "1h" = "1h",
  "2h" = "2h",
  "4h" = "4h",
  "6h" = "6h",
  "8h" = "8h",
  "12h" = "12h",
  "1d" = "1d",
  "3d" = "3d",
  "1w" = "1w",
  "1M" = "1M",
}
export class TickInterval {
  interval: Interval;
  constructor(interval: Interval) {
    this.interval = interval;
  }
  getInterval(): string {
    return this.interval.toString();
  }
  getTickIntervalInMs(): number {
    return convertIntervalToMS(this.interval);
  }
}

export function convertIntervalToMS(interval: Interval): number {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  switch (interval) {
    case Interval["1m"]:
      return minute;
    case Interval["5m"]:
      return 5 * minute;
    case Interval["15m"]:
      return 15 * minute;
    case Interval["30m"]:
      return 30 * minute;
    case Interval["1h"]:
      return hour;
    case Interval["2h"]:
      return 2 * hour;
    case Interval["4h"]:
      return 4 * hour;
    case Interval["6h"]:
      return 6 * hour;
    case Interval["8h"]:
      return 8 * hour;
    case Interval["12h"]:
      return 12 * hour;
    case Interval["1d"]:
      return day;
    case Interval["3d"]:
      return 3 * day;
    case Interval["1w"]:
      return week;
    case Interval["1M"]:
      return month;
  }
}
