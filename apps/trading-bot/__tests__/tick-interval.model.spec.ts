import { TickInterval, Interval, convertIntervalToMS } from "../src/models/tick-interval.model";

describe("TickInterval", () => {
  describe("constructor", () => {
    it("should create TickInterval with given interval", () => {
      const tickInterval = new TickInterval(Interval["30m"]);
      expect(tickInterval.interval).toBe(Interval["30m"]);
    });
  });

  describe("getInterval", () => {
    it("should return interval as string", () => {
      const tickInterval = new TickInterval(Interval["1h"]);
      expect(tickInterval.getInterval()).toBe("1h");
    });

    it("should return correct interval for different values", () => {
      const intervals = [
        Interval["1m"],
        Interval["5m"],
        Interval["15m"],
        Interval["30m"],
        Interval["1h"],
        Interval["1d"],
      ];

      intervals.forEach((interval) => {
        const tickInterval = new TickInterval(interval);
        expect(tickInterval.getInterval()).toBe(interval.toString());
      });
    });
  });

  describe("getValueInMs", () => {
    it("should return correct milliseconds for 1m", () => {
      const tickInterval = new TickInterval(Interval["1m"]);
      expect(tickInterval.getValueInMs()).toBe(60 * 1000);
    });

    it("should return correct milliseconds for 30m", () => {
      const tickInterval = new TickInterval(Interval["30m"]);
      expect(tickInterval.getValueInMs()).toBe(30 * 60 * 1000);
    });

    it("should return correct milliseconds for 1h", () => {
      const tickInterval = new TickInterval(Interval["1h"]);
      expect(tickInterval.getValueInMs()).toBe(60 * 60 * 1000);
    });

    it("should return correct milliseconds for 1d", () => {
      const tickInterval = new TickInterval(Interval["1d"]);
      expect(tickInterval.getValueInMs()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("getNextTickInterval", () => {
    it("should return next interval in sequence", () => {
      const tickInterval = new TickInterval(Interval["1m"]);
      const next = tickInterval.getNextTickInterval();
      expect(next.interval).toBe(Interval["5m"]);
    });

    it("should return next interval for 5m", () => {
      const tickInterval = new TickInterval(Interval["5m"]);
      const next = tickInterval.getNextTickInterval();
      expect(next.interval).toBe(Interval["15m"]);
    });

    it("should return next interval for 30m", () => {
      const tickInterval = new TickInterval(Interval["30m"]);
      const next = tickInterval.getNextTickInterval();
      expect(next.interval).toBe(Interval["1h"]);
    });

    it("should handle last interval (1M)", () => {
      const tickInterval = new TickInterval(Interval["1M"]);
      const next = tickInterval.getNextTickInterval();
      // Should return undefined or last interval
      expect(next).toBeDefined();
    });
  });
});

describe("convertIntervalToMS", () => {
  it("should convert 1m to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["1m"])).toBe(60 * 1000);
  });

  it("should convert 5m to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["5m"])).toBe(5 * 60 * 1000);
  });

  it("should convert 15m to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["15m"])).toBe(15 * 60 * 1000);
  });

  it("should convert 30m to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["30m"])).toBe(30 * 60 * 1000);
  });

  it("should convert 1h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["1h"])).toBe(60 * 60 * 1000);
  });

  it("should convert 2h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["2h"])).toBe(2 * 60 * 60 * 1000);
  });

  it("should convert 4h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["4h"])).toBe(4 * 60 * 60 * 1000);
  });

  it("should convert 6h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["6h"])).toBe(6 * 60 * 60 * 1000);
  });

  it("should convert 8h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["8h"])).toBe(8 * 60 * 60 * 1000);
  });

  it("should convert 12h to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["12h"])).toBe(12 * 60 * 60 * 1000);
  });

  it("should convert 1d to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["1d"])).toBe(24 * 60 * 60 * 1000);
  });

  it("should convert 3d to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["3d"])).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it("should convert 1w to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["1w"])).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("should convert 1M to correct milliseconds", () => {
    expect(convertIntervalToMS(Interval["1M"])).toBe(30 * 24 * 60 * 60 * 1000);
  });
});







