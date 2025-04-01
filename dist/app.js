"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/technicalindicators/dist/index.js
var require_dist = __commonJS({
  "node_modules/technicalindicators/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Item = class {
      constructor(data, prev, next) {
        this.next = next;
        if (next)
          next.prev = this;
        this.prev = prev;
        if (prev)
          prev.next = this;
        this.data = data;
      }
    };
    var LinkedList = class {
      constructor() {
        this._length = 0;
      }
      get head() {
        return this._head && this._head.data;
      }
      get tail() {
        return this._tail && this._tail.data;
      }
      get current() {
        return this._current && this._current.data;
      }
      get length() {
        return this._length;
      }
      push(data) {
        this._tail = new Item(data, this._tail);
        if (this._length === 0) {
          this._head = this._tail;
          this._current = this._head;
          this._next = this._head;
        }
        this._length++;
      }
      pop() {
        var tail = this._tail;
        if (this._length === 0) {
          return;
        }
        this._length--;
        if (this._length === 0) {
          this._head = this._tail = this._current = this._next = void 0;
          return tail.data;
        }
        this._tail = tail.prev;
        this._tail.next = void 0;
        if (this._current === tail) {
          this._current = this._tail;
          this._next = void 0;
        }
        return tail.data;
      }
      shift() {
        var head = this._head;
        if (this._length === 0) {
          return;
        }
        this._length--;
        if (this._length === 0) {
          this._head = this._tail = this._current = this._next = void 0;
          return head.data;
        }
        this._head = this._head.next;
        if (this._current === head) {
          this._current = this._head;
          this._next = this._current.next;
        }
        return head.data;
      }
      unshift(data) {
        this._head = new Item(data, void 0, this._head);
        if (this._length === 0) {
          this._tail = this._head;
          this._next = this._head;
        }
        this._length++;
      }
      unshiftCurrent() {
        var current = this._current;
        if (current === this._head || this._length < 2) {
          return current && current.data;
        }
        if (current === this._tail) {
          this._tail = current.prev;
          this._tail.next = void 0;
          this._current = this._tail;
        } else {
          current.next.prev = current.prev;
          current.prev.next = current.next;
          this._current = current.prev;
        }
        this._next = this._current.next;
        current.next = this._head;
        current.prev = void 0;
        this._head.prev = current;
        this._head = current;
        return current.data;
      }
      removeCurrent() {
        var current = this._current;
        if (this._length === 0) {
          return;
        }
        this._length--;
        if (this._length === 0) {
          this._head = this._tail = this._current = this._next = void 0;
          return current.data;
        }
        if (current === this._tail) {
          this._tail = current.prev;
          this._tail.next = void 0;
          this._current = this._tail;
        } else if (current === this._head) {
          this._head = current.next;
          this._head.prev = void 0;
          this._current = this._head;
        } else {
          current.next.prev = current.prev;
          current.prev.next = current.next;
          this._current = current.prev;
        }
        this._next = this._current.next;
        return current.data;
      }
      resetCursor() {
        this._current = this._next = this._head;
        return this;
      }
      next() {
        var next = this._next;
        if (next !== void 0) {
          this._next = next.next;
          this._current = next;
          return next.data;
        }
      }
    };
    var FixedSizeLinkedList = class extends LinkedList {
      constructor(size, maintainHigh, maintainLow, maintainSum) {
        super();
        this.size = size;
        this.maintainHigh = maintainHigh;
        this.maintainLow = maintainLow;
        this.maintainSum = maintainSum;
        this.totalPushed = 0;
        this.periodHigh = 0;
        this.periodLow = Infinity;
        this.periodSum = 0;
        if (!size || typeof size !== "number") {
          throw "Size required and should be a number.";
        }
        this._push = this.push;
        this.push = function(data) {
          this.add(data);
          this.totalPushed++;
        };
      }
      add(data) {
        if (this.length === this.size) {
          this.lastShift = this.shift();
          this._push(data);
          if (this.maintainHigh) {
            if (this.lastShift == this.periodHigh)
              this.calculatePeriodHigh();
          }
          if (this.maintainLow) {
            if (this.lastShift == this.periodLow)
              this.calculatePeriodLow();
          }
          if (this.maintainSum) {
            this.periodSum = this.periodSum - this.lastShift;
          }
        } else {
          this._push(data);
        }
        if (this.maintainHigh) {
          if (this.periodHigh <= data)
            this.periodHigh = data;
        }
        if (this.maintainLow) {
          if (this.periodLow >= data)
            this.periodLow = data;
        }
        if (this.maintainSum) {
          this.periodSum = this.periodSum + data;
        }
      }
      *iterator() {
        this.resetCursor();
        while (this.next()) {
          yield this.current;
        }
      }
      calculatePeriodHigh() {
        this.resetCursor();
        if (this.next())
          this.periodHigh = this.current;
        while (this.next()) {
          if (this.periodHigh <= this.current) {
            this.periodHigh = this.current;
          }
        }
      }
      calculatePeriodLow() {
        this.resetCursor();
        if (this.next())
          this.periodLow = this.current;
        while (this.next()) {
          if (this.periodLow >= this.current) {
            this.periodLow = this.current;
          }
        }
      }
    };
    var CandleData = class {
    };
    var CandleList = class {
      constructor() {
        this.open = [];
        this.high = [];
        this.low = [];
        this.close = [];
        this.volume = [];
        this.timestamp = [];
      }
    };
    var config = {};
    function setConfig(key, value) {
      config[key] = value;
    }
    function getConfig(key) {
      return config[key];
    }
    function format(v) {
      let precision = getConfig("precision");
      if (precision) {
        return parseFloat(v.toPrecision(precision));
      }
      return v;
    }
    var IndicatorInput = class {
    };
    var Indicator = class {
      constructor(input) {
        this.format = input.format || format;
      }
      static reverseInputs(input) {
        if (input.reversedInput) {
          input.values ? input.values.reverse() : void 0;
          input.open ? input.open.reverse() : void 0;
          input.high ? input.high.reverse() : void 0;
          input.low ? input.low.reverse() : void 0;
          input.close ? input.close.reverse() : void 0;
          input.volume ? input.volume.reverse() : void 0;
          input.timestamp ? input.timestamp.reverse() : void 0;
        }
      }
      getResult() {
        return this.result;
      }
    };
    var SMA = class extends Indicator {
      constructor(input) {
        super(input);
        this.period = input.period;
        this.price = input.values;
        var genFn = function* (period) {
          var list = new LinkedList();
          var sum2 = 0;
          var counter = 1;
          var current = yield;
          var result;
          list.push(0);
          while (true) {
            if (counter < period) {
              counter++;
              list.push(current);
              sum2 = sum2 + current;
            } else {
              sum2 = sum2 - list.shift() + current;
              result = sum2 / period;
              list.push(current);
            }
            current = yield result;
          }
        };
        this.generator = genFn(this.period);
        this.generator.next();
        this.result = [];
        this.price.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        if (result != void 0)
          return this.format(result);
      }
    };
    SMA.calculate = sma;
    function sma(input) {
      Indicator.reverseInputs(input);
      var result = new SMA(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var EMA = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        var exponent = 2 / (period + 1);
        var sma$$1;
        this.result = [];
        sma$$1 = new SMA({ period, values: [] });
        var genFn = function* () {
          var tick = yield;
          var prevEma;
          while (true) {
            if (prevEma !== void 0 && tick !== void 0) {
              prevEma = (tick - prevEma) * exponent + prevEma;
              tick = yield prevEma;
            } else {
              tick = yield;
              prevEma = sma$$1.nextValue(tick);
              if (prevEma)
                tick = yield prevEma;
            }
          }
        };
        this.generator = genFn();
        this.generator.next();
        this.generator.next();
        priceArray.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        if (result != void 0)
          return this.format(result);
      }
    };
    EMA.calculate = ema;
    function ema(input) {
      Indicator.reverseInputs(input);
      var result = new EMA(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var WMA = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        this.result = [];
        this.generator = function* () {
          let data = new LinkedList();
          let denominator = period * (period + 1) / 2;
          while (true) {
            if (data.length < period) {
              data.push(yield);
            } else {
              data.resetCursor();
              let result = 0;
              for (let i2 = 1; i2 <= period; i2++) {
                result = result + data.next() * i2 / denominator;
              }
              var next = yield result;
              data.shift();
              data.push(next);
            }
          }
        }();
        this.generator.next();
        priceArray.forEach((tick, index) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      //STEP 5. REMOVE GET RESULT FUNCTION
      nextValue(price) {
        var result = this.generator.next(price).value;
        if (result != void 0)
          return this.format(result);
      }
    };
    WMA.calculate = wma;
    function wma(input) {
      Indicator.reverseInputs(input);
      var result = new WMA(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var WEMA = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        var exponent = 1 / period;
        var sma$$1;
        this.result = [];
        sma$$1 = new SMA({ period, values: [] });
        var genFn = function* () {
          var tick = yield;
          var prevEma;
          while (true) {
            if (prevEma !== void 0 && tick !== void 0) {
              prevEma = (tick - prevEma) * exponent + prevEma;
              tick = yield prevEma;
            } else {
              tick = yield;
              prevEma = sma$$1.nextValue(tick);
              if (prevEma !== void 0)
                tick = yield prevEma;
            }
          }
        };
        this.generator = genFn();
        this.generator.next();
        this.generator.next();
        priceArray.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        if (result != void 0)
          return this.format(result);
      }
    };
    WEMA.calculate = wema;
    function wema(input) {
      Indicator.reverseInputs(input);
      var result = new WEMA(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var MACD = class extends Indicator {
      constructor(input) {
        super(input);
        var oscillatorMAtype = input.SimpleMAOscillator ? SMA : EMA;
        var signalMAtype = input.SimpleMASignal ? SMA : EMA;
        var fastMAProducer = new oscillatorMAtype({ period: input.fastPeriod, values: [], format: (v) => {
          return v;
        } });
        var slowMAProducer = new oscillatorMAtype({ period: input.slowPeriod, values: [], format: (v) => {
          return v;
        } });
        var signalMAProducer = new signalMAtype({ period: input.signalPeriod, values: [], format: (v) => {
          return v;
        } });
        var format2 = this.format;
        this.result = [];
        this.generator = function* () {
          var index = 0;
          var tick;
          var MACD2, signal, histogram, fast, slow;
          while (true) {
            if (index < input.slowPeriod) {
              tick = yield;
              fast = fastMAProducer.nextValue(tick);
              slow = slowMAProducer.nextValue(tick);
              index++;
              continue;
            }
            if (fast && slow) {
              MACD2 = fast - slow;
              signal = signalMAProducer.nextValue(MACD2);
            }
            histogram = MACD2 - signal;
            tick = yield {
              //fast : fast,
              //slow : slow,
              MACD: format2(MACD2),
              signal: signal ? format2(signal) : void 0,
              histogram: isNaN(histogram) ? void 0 : format2(histogram)
            };
            fast = fastMAProducer.nextValue(tick);
            slow = slowMAProducer.nextValue(tick);
          }
        }();
        this.generator.next();
        input.values.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        return result;
      }
    };
    MACD.calculate = macd;
    function macd(input) {
      Indicator.reverseInputs(input);
      var result = new MACD(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var AverageGain = class extends Indicator {
      constructor(input) {
        super(input);
        let values = input.values;
        let period = input.period;
        let format2 = this.format;
        this.generator = function* (period2) {
          var currentValue = yield;
          var counter = 1;
          var gainSum = 0;
          var avgGain;
          var gain;
          var lastValue = currentValue;
          currentValue = yield;
          while (true) {
            gain = currentValue - lastValue;
            gain = gain > 0 ? gain : 0;
            if (gain > 0) {
              gainSum = gainSum + gain;
            }
            if (counter < period2) {
              counter++;
            } else if (avgGain === void 0) {
              avgGain = gainSum / period2;
            } else {
              avgGain = (avgGain * (period2 - 1) + gain) / period2;
            }
            lastValue = currentValue;
            avgGain = avgGain !== void 0 ? format2(avgGain) : void 0;
            currentValue = yield avgGain;
          }
        }(period);
        this.generator.next();
        this.result = [];
        values.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    AverageGain.calculate = averagegain;
    function averagegain(input) {
      Indicator.reverseInputs(input);
      var result = new AverageGain(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var AverageLoss = class extends Indicator {
      constructor(input) {
        super(input);
        let values = input.values;
        let period = input.period;
        let format2 = this.format;
        this.generator = function* (period2) {
          var currentValue = yield;
          var counter = 1;
          var lossSum = 0;
          var avgLoss;
          var loss;
          var lastValue = currentValue;
          currentValue = yield;
          while (true) {
            loss = lastValue - currentValue;
            loss = loss > 0 ? loss : 0;
            if (loss > 0) {
              lossSum = lossSum + loss;
            }
            if (counter < period2) {
              counter++;
            } else if (avgLoss === void 0) {
              avgLoss = lossSum / period2;
            } else {
              avgLoss = (avgLoss * (period2 - 1) + loss) / period2;
            }
            lastValue = currentValue;
            avgLoss = avgLoss !== void 0 ? format2(avgLoss) : void 0;
            currentValue = yield avgLoss;
          }
        }(period);
        this.generator.next();
        this.result = [];
        values.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    AverageLoss.calculate = averageloss;
    function averageloss(input) {
      Indicator.reverseInputs(input);
      var result = new AverageLoss(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var RSI = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var values = input.values;
        var GainProvider = new AverageGain({ period, values: [] });
        var LossProvider = new AverageLoss({ period, values: [] });
        let count = 1;
        this.generator = function* (period2) {
          var current = yield;
          var lastAvgGain, lastAvgLoss, RS, currentRSI;
          while (true) {
            lastAvgGain = GainProvider.nextValue(current);
            lastAvgLoss = LossProvider.nextValue(current);
            if (lastAvgGain !== void 0 && lastAvgLoss !== void 0) {
              if (lastAvgLoss === 0) {
                currentRSI = 100;
              } else if (lastAvgGain === 0) {
                currentRSI = 0;
              } else {
                RS = lastAvgGain / lastAvgLoss;
                RS = isNaN(RS) ? 0 : RS;
                currentRSI = parseFloat((100 - 100 / (1 + RS)).toFixed(2));
              }
            }
            count++;
            current = yield currentRSI;
          }
        }(period);
        this.generator.next();
        this.result = [];
        values.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    RSI.calculate = rsi;
    function rsi(input) {
      Indicator.reverseInputs(input);
      var result = new RSI(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var SD = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        var sma$$1 = new SMA({ period, values: [], format: (v) => {
          return v;
        } });
        this.result = [];
        this.generator = function* () {
          var tick;
          var mean;
          var currentSet = new FixedSizeLinkedList(period);
          tick = yield;
          var sd2;
          while (true) {
            currentSet.push(tick);
            mean = sma$$1.nextValue(tick);
            if (mean) {
              let sum2 = 0;
              for (let x2 of currentSet.iterator()) {
                sum2 = sum2 + Math.pow(x2 - mean, 2);
              }
              sd2 = Math.sqrt(sum2 / period);
            }
            tick = yield sd2;
          }
        }();
        this.generator.next();
        priceArray.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var nextResult = this.generator.next(price);
        if (nextResult.value != void 0)
          return this.format(nextResult.value);
      }
    };
    SD.calculate = sd;
    function sd(input) {
      Indicator.reverseInputs(input);
      var result = new SD(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var BollingerBands = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        var stdDev = input.stdDev;
        var format2 = this.format;
        var sma$$1, sd$$1;
        this.result = [];
        sma$$1 = new SMA({ period, values: [], format: (v) => {
          return v;
        } });
        sd$$1 = new SD({ period, values: [], format: (v) => {
          return v;
        } });
        this.generator = function* () {
          var result;
          var tick;
          var calcSMA;
          var calcsd;
          tick = yield;
          while (true) {
            calcSMA = sma$$1.nextValue(tick);
            calcsd = sd$$1.nextValue(tick);
            if (calcSMA) {
              let middle = format2(calcSMA);
              let upper = format2(calcSMA + calcsd * stdDev);
              let lower2 = format2(calcSMA - calcsd * stdDev);
              let pb = format2((tick - lower2) / (upper - lower2));
              result = {
                middle,
                upper,
                lower: lower2,
                pb
              };
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        priceArray.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    BollingerBands.calculate = bollingerbands;
    function bollingerbands(input) {
      Indicator.reverseInputs(input);
      var result = new BollingerBands(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var WilderSmoothing = class extends Indicator {
      constructor(input) {
        super(input);
        this.period = input.period;
        this.price = input.values;
        var genFn = function* (period) {
          var list = new LinkedList();
          var sum2 = 0;
          var counter = 1;
          var current = yield;
          var result = 0;
          while (true) {
            if (counter < period) {
              counter++;
              sum2 = sum2 + current;
              result = void 0;
            } else if (counter == period) {
              counter++;
              sum2 = sum2 + current;
              result = sum2;
            } else {
              result = result - result / period + current;
            }
            current = yield result;
          }
        };
        this.generator = genFn(this.period);
        this.generator.next();
        this.result = [];
        this.price.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        if (result != void 0)
          return this.format(result);
      }
    };
    WilderSmoothing.calculate = wildersmoothing;
    function wildersmoothing(input) {
      Indicator.reverseInputs(input);
      var result = new WilderSmoothing(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var MDM = class _MDM extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var format2 = this.format;
        if (lows.length != highs.length) {
          throw "Inputs(low,high) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var minusDm;
          var current = yield;
          var last;
          while (true) {
            if (last) {
              let upMove = current.high - last.high;
              let downMove = last.low - current.low;
              minusDm = format2(downMove > upMove && downMove > 0 ? downMove : 0);
            }
            last = current;
            current = yield minusDm;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index]
          });
          if (result.value !== void 0)
            this.result.push(result.value);
        });
      }
      static calculate(input) {
        Indicator.reverseInputs(input);
        var result = new _MDM(input).result;
        if (input.reversedInput) {
          result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    var PDM = class _PDM extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var format2 = this.format;
        if (lows.length != highs.length) {
          throw "Inputs(low,high) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var plusDm;
          var current = yield;
          var last;
          while (true) {
            if (last) {
              let upMove = current.high - last.high;
              let downMove = last.low - current.low;
              plusDm = format2(upMove > downMove && upMove > 0 ? upMove : 0);
            }
            last = current;
            current = yield plusDm;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index]
          });
          if (result.value !== void 0)
            this.result.push(result.value);
        });
      }
      static calculate(input) {
        Indicator.reverseInputs(input);
        var result = new _PDM(input).result;
        if (input.reversedInput) {
          result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    var TrueRange = class extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var closes = input.close;
        var format2 = this.format;
        if (lows.length != highs.length) {
          throw "Inputs(low,high) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var current = yield;
          var previousClose, result;
          while (true) {
            if (previousClose === void 0) {
              previousClose = current.close;
              current = yield result;
            }
            result = Math.max(current.high - current.low, isNaN(Math.abs(current.high - previousClose)) ? 0 : Math.abs(current.high - previousClose), isNaN(Math.abs(current.low - previousClose)) ? 0 : Math.abs(current.low - previousClose));
            previousClose = current.close;
            if (result != void 0) {
              result = format2(result);
            }
            current = yield result;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    TrueRange.calculate = truerange;
    function truerange(input) {
      Indicator.reverseInputs(input);
      var result = new TrueRange(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ADXOutput = class extends IndicatorInput {
    };
    var ADX = class extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var closes = input.close;
        var period = input.period;
        var format2 = this.format;
        var plusDM = new PDM({
          high: [],
          low: []
        });
        var minusDM = new MDM({
          high: [],
          low: []
        });
        var emaPDM = new WilderSmoothing({ period, values: [], format: (v) => {
          return v;
        } });
        var emaMDM = new WilderSmoothing({ period, values: [], format: (v) => {
          return v;
        } });
        var emaTR = new WilderSmoothing({ period, values: [], format: (v) => {
          return v;
        } });
        var emaDX = new WEMA({ period, values: [], format: (v) => {
          return v;
        } });
        var tr = new TrueRange({
          low: [],
          high: [],
          close: []
        });
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        this.result = [];
        ADXOutput;
        this.generator = function* () {
          var tick = yield;
          var index = 0;
          var lastATR, lastAPDM, lastAMDM, lastPDI, lastMDI, lastDX, smoothedDX;
          lastATR = 0;
          lastAPDM = 0;
          lastAMDM = 0;
          while (true) {
            let calcTr = tr.nextValue(tick);
            let calcPDM = plusDM.nextValue(tick);
            let calcMDM = minusDM.nextValue(tick);
            if (calcTr === void 0) {
              tick = yield;
              continue;
            }
            let lastATR2 = emaTR.nextValue(calcTr);
            let lastAPDM2 = emaPDM.nextValue(calcPDM);
            let lastAMDM2 = emaMDM.nextValue(calcMDM);
            if (lastATR2 != void 0 && lastAPDM2 != void 0 && lastAMDM2 != void 0) {
              lastPDI = lastAPDM2 * 100 / lastATR2;
              lastMDI = lastAMDM2 * 100 / lastATR2;
              let diDiff = Math.abs(lastPDI - lastMDI);
              let diSum = lastPDI + lastMDI;
              lastDX = diDiff / diSum * 100;
              smoothedDX = emaDX.nextValue(lastDX);
            }
            tick = yield { adx: smoothedDX, pdi: lastPDI, mdi: lastMDI };
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value != void 0 && result.value.adx != void 0) {
            this.result.push({ adx: format2(result.value.adx), pdi: format2(result.value.pdi), mdi: format2(result.value.mdi) });
          }
        });
      }
      nextValue(price) {
        let result = this.generator.next(price).value;
        if (result != void 0 && result.adx != void 0) {
          return { adx: this.format(result.adx), pdi: this.format(result.pdi), mdi: this.format(result.mdi) };
        }
      }
    };
    ADX.calculate = adx;
    function adx(input) {
      Indicator.reverseInputs(input);
      var result = new ADX(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ATR = class extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var closes = input.close;
        var period = input.period;
        var format2 = this.format;
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        var trueRange = new TrueRange({
          low: [],
          high: [],
          close: []
        });
        var wema$$1 = new WEMA({ period, values: [], format: (v) => {
          return v;
        } });
        this.result = [];
        this.generator = function* () {
          var tick = yield;
          var avgTrueRange, trange;
          while (true) {
            trange = trueRange.nextValue({
              low: tick.low,
              high: tick.high,
              close: tick.close
            });
            if (trange === void 0) {
              avgTrueRange = void 0;
            } else {
              avgTrueRange = wema$$1.nextValue(trange);
            }
            tick = yield avgTrueRange;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value !== void 0) {
            this.result.push(format2(result.value));
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    ATR.calculate = atr;
    function atr(input) {
      Indicator.reverseInputs(input);
      var result = new ATR(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ROC = class extends Indicator {
      constructor(input) {
        super(input);
        var period = input.period;
        var priceArray = input.values;
        this.result = [];
        this.generator = function* () {
          let index = 1;
          var pastPeriods = new FixedSizeLinkedList(period);
          var tick = yield;
          var roc2;
          while (true) {
            pastPeriods.push(tick);
            if (index < period) {
              index++;
            } else {
              roc2 = (tick - pastPeriods.lastShift) / pastPeriods.lastShift * 100;
            }
            tick = yield roc2;
          }
        }();
        this.generator.next();
        priceArray.forEach((tick) => {
          var result = this.generator.next(tick);
          if (result.value != void 0 && !isNaN(result.value)) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var nextResult = this.generator.next(price);
        if (nextResult.value != void 0 && !isNaN(nextResult.value)) {
          return this.format(nextResult.value);
        }
      }
    };
    ROC.calculate = roc;
    function roc(input) {
      Indicator.reverseInputs(input);
      var result = new ROC(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var KST = class extends Indicator {
      constructor(input) {
        super(input);
        let priceArray = input.values;
        let rocPer1 = input.ROCPer1;
        let rocPer2 = input.ROCPer2;
        let rocPer3 = input.ROCPer3;
        let rocPer4 = input.ROCPer4;
        let smaPer1 = input.SMAROCPer1;
        let smaPer2 = input.SMAROCPer2;
        let smaPer3 = input.SMAROCPer3;
        let smaPer4 = input.SMAROCPer4;
        let signalPeriod = input.signalPeriod;
        let roc1 = new ROC({ period: rocPer1, values: [] });
        let roc2 = new ROC({ period: rocPer2, values: [] });
        let roc3 = new ROC({ period: rocPer3, values: [] });
        let roc4 = new ROC({ period: rocPer4, values: [] });
        let sma1 = new SMA({ period: smaPer1, values: [], format: (v) => {
          return v;
        } });
        let sma2 = new SMA({ period: smaPer2, values: [], format: (v) => {
          return v;
        } });
        let sma3 = new SMA({ period: smaPer3, values: [], format: (v) => {
          return v;
        } });
        let sma4 = new SMA({ period: smaPer4, values: [], format: (v) => {
          return v;
        } });
        let signalSMA = new SMA({ period: signalPeriod, values: [], format: (v) => {
          return v;
        } });
        var format2 = this.format;
        this.result = [];
        let firstResult = Math.max(rocPer1 + smaPer1, rocPer2 + smaPer2, rocPer3 + smaPer3, rocPer4 + smaPer4);
        this.generator = function* () {
          let index = 1;
          let tick = yield;
          let kst2;
          let RCMA1, RCMA2, RCMA3, RCMA4, signal, result;
          while (true) {
            let roc1Result = roc1.nextValue(tick);
            let roc2Result = roc2.nextValue(tick);
            let roc3Result = roc3.nextValue(tick);
            let roc4Result = roc4.nextValue(tick);
            RCMA1 = roc1Result !== void 0 ? sma1.nextValue(roc1Result) : void 0;
            RCMA2 = roc2Result !== void 0 ? sma2.nextValue(roc2Result) : void 0;
            RCMA3 = roc3Result !== void 0 ? sma3.nextValue(roc3Result) : void 0;
            RCMA4 = roc4Result !== void 0 ? sma4.nextValue(roc4Result) : void 0;
            if (index < firstResult) {
              index++;
            } else {
              kst2 = RCMA1 * 1 + RCMA2 * 2 + RCMA3 * 3 + RCMA4 * 4;
            }
            signal = kst2 !== void 0 ? signalSMA.nextValue(kst2) : void 0;
            result = kst2 !== void 0 ? {
              kst: format2(kst2),
              signal: signal ? format2(signal) : void 0
            } : void 0;
            tick = yield result;
          }
        }();
        this.generator.next();
        priceArray.forEach((tick) => {
          let result = this.generator.next(tick);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        let nextResult = this.generator.next(price);
        if (nextResult.value != void 0)
          return nextResult.value;
      }
    };
    KST.calculate = kst;
    function kst(input) {
      Indicator.reverseInputs(input);
      var result = new KST(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var PSAR = class extends Indicator {
      constructor(input) {
        super(input);
        let highs = input.high || [];
        let lows = input.low || [];
        var genFn = function* (step, max) {
          let curr, extreme, sar, furthest;
          let up = true;
          let accel = step;
          let prev = yield;
          while (true) {
            if (curr) {
              sar = sar + accel * (extreme - sar);
              if (up) {
                sar = Math.min(sar, furthest.low, prev.low);
                if (curr.high > extreme) {
                  extreme = curr.high;
                  accel = Math.min(accel + step, max);
                }
              } else {
                sar = Math.max(sar, furthest.high, prev.high);
                if (curr.low < extreme) {
                  extreme = curr.low;
                  accel = Math.min(accel + step, max);
                }
              }
              if (up && curr.low < sar || !up && curr.high > sar) {
                accel = step;
                sar = extreme;
                up = !up;
                extreme = !up ? curr.low : curr.high;
              }
            } else {
              sar = prev.low;
              extreme = prev.high;
            }
            furthest = prev;
            if (curr)
              prev = curr;
            curr = yield sar;
          }
        };
        this.result = [];
        this.generator = genFn(input.step, input.max);
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index]
          });
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(input) {
        let nextResult = this.generator.next(input);
        if (nextResult.value !== void 0)
          return nextResult.value;
      }
    };
    PSAR.calculate = psar;
    function psar(input) {
      Indicator.reverseInputs(input);
      var result = new PSAR(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var Stochastic = class extends Indicator {
      constructor(input) {
        super(input);
        let lows = input.low;
        let highs = input.high;
        let closes = input.close;
        let period = input.period;
        let signalPeriod = input.signalPeriod;
        let format2 = this.format;
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          let index = 1;
          let pastHighPeriods = new FixedSizeLinkedList(period, true, false);
          let pastLowPeriods = new FixedSizeLinkedList(period, false, true);
          let dSma = new SMA({
            period: signalPeriod,
            values: [],
            format: (v) => {
              return v;
            }
          });
          let k, d;
          var tick = yield;
          while (true) {
            pastHighPeriods.push(tick.high);
            pastLowPeriods.push(tick.low);
            if (index < period) {
              index++;
              tick = yield;
              continue;
            }
            let periodLow = pastLowPeriods.periodLow;
            k = (tick.close - periodLow) / (pastHighPeriods.periodHigh - periodLow) * 100;
            k = isNaN(k) ? 0 : k;
            d = dSma.nextValue(k);
            tick = yield {
              k: format2(k),
              d: d !== void 0 ? format2(d) : void 0
            };
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(input) {
        let nextResult = this.generator.next(input);
        if (nextResult.value !== void 0)
          return nextResult.value;
      }
    };
    Stochastic.calculate = stochastic;
    function stochastic(input) {
      Indicator.reverseInputs(input);
      var result = new Stochastic(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var WilliamsR = class extends Indicator {
      constructor(input) {
        super(input);
        let lows = input.low;
        let highs = input.high;
        let closes = input.close;
        let period = input.period;
        let format2 = this.format;
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          let index = 1;
          let pastHighPeriods = new FixedSizeLinkedList(period, true, false);
          let pastLowPeriods = new FixedSizeLinkedList(period, false, true);
          let periodLow;
          let periodHigh;
          var tick = yield;
          let williamsR;
          while (true) {
            pastHighPeriods.push(tick.high);
            pastLowPeriods.push(tick.low);
            if (index < period) {
              index++;
              tick = yield;
              continue;
            }
            periodLow = pastLowPeriods.periodLow;
            periodHigh = pastHighPeriods.periodHigh;
            williamsR = format2((periodHigh - tick.close) / (periodHigh - periodLow) * -100);
            tick = yield williamsR;
          }
        }();
        this.generator.next();
        lows.forEach((low, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var nextResult = this.generator.next(price);
        if (nextResult.value != void 0)
          return this.format(nextResult.value);
      }
    };
    WilliamsR.calculate = williamsr;
    function williamsr(input) {
      Indicator.reverseInputs(input);
      var result = new WilliamsR(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ADL = class extends Indicator {
      constructor(input) {
        super(input);
        var highs = input.high;
        var lows = input.low;
        var closes = input.close;
        var volumes = input.volume;
        if (!(lows.length === highs.length && highs.length === closes.length && highs.length === volumes.length)) {
          throw "Inputs(low,high, close, volumes) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var result = 0;
          var tick;
          tick = yield;
          while (true) {
            let moneyFlowMultiplier = (tick.close - tick.low - (tick.high - tick.close)) / (tick.high - tick.low);
            moneyFlowMultiplier = isNaN(moneyFlowMultiplier) ? 1 : moneyFlowMultiplier;
            let moneyFlowVolume = moneyFlowMultiplier * tick.volume;
            result = result + moneyFlowVolume;
            tick = yield Math.round(result);
          }
        }();
        this.generator.next();
        highs.forEach((tickHigh, index) => {
          var tickInput = {
            high: tickHigh,
            low: lows[index],
            close: closes[index],
            volume: volumes[index]
          };
          var result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    ADL.calculate = adl;
    function adl(input) {
      Indicator.reverseInputs(input);
      var result = new ADL(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var OBV = class extends Indicator {
      constructor(input) {
        super(input);
        var closes = input.close;
        var volumes = input.volume;
        this.result = [];
        this.generator = function* () {
          var result = 0;
          var tick;
          var lastClose;
          tick = yield;
          if (tick.close && typeof tick.close === "number") {
            lastClose = tick.close;
            tick = yield;
          }
          while (true) {
            if (lastClose < tick.close) {
              result = result + tick.volume;
            } else if (tick.close < lastClose) {
              result = result - tick.volume;
            }
            lastClose = tick.close;
            tick = yield result;
          }
        }();
        this.generator.next();
        closes.forEach((close, index) => {
          let tickInput = {
            close: closes[index],
            volume: volumes[index]
          };
          let result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    OBV.calculate = obv;
    function obv(input) {
      Indicator.reverseInputs(input);
      var result = new OBV(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var TRIX = class extends Indicator {
      constructor(input) {
        super(input);
        let priceArray = input.values;
        let period = input.period;
        let format2 = this.format;
        let ema$$1 = new EMA({ period, values: [], format: (v) => {
          return v;
        } });
        let emaOfema = new EMA({ period, values: [], format: (v) => {
          return v;
        } });
        let emaOfemaOfema = new EMA({ period, values: [], format: (v) => {
          return v;
        } });
        let trixROC = new ROC({ period: 1, values: [], format: (v) => {
          return v;
        } });
        this.result = [];
        this.generator = function* () {
          let tick = yield;
          while (true) {
            let initialema = ema$$1.nextValue(tick);
            let smoothedResult = initialema ? emaOfema.nextValue(initialema) : void 0;
            let doubleSmoothedResult = smoothedResult ? emaOfemaOfema.nextValue(smoothedResult) : void 0;
            let result = doubleSmoothedResult ? trixROC.nextValue(doubleSmoothedResult) : void 0;
            tick = yield result ? format2(result) : void 0;
          }
        }();
        this.generator.next();
        priceArray.forEach((tick) => {
          let result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        let nextResult = this.generator.next(price);
        if (nextResult.value !== void 0)
          return nextResult.value;
      }
    };
    TRIX.calculate = trix;
    function trix(input) {
      Indicator.reverseInputs(input);
      var result = new TRIX(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ForceIndex = class extends Indicator {
      constructor(input) {
        super(input);
        var closes = input.close;
        var volumes = input.volume;
        var period = input.period || 1;
        if (!(volumes.length === closes.length)) {
          throw "Inputs(volume, close) not of equal size";
        }
        let emaForceIndex = new EMA({ values: [], period });
        this.result = [];
        this.generator = function* () {
          var previousTick = yield;
          var tick = yield;
          let forceIndex;
          while (true) {
            forceIndex = (tick.close - previousTick.close) * tick.volume;
            previousTick = tick;
            tick = yield emaForceIndex.nextValue(forceIndex);
          }
        }();
        this.generator.next();
        volumes.forEach((tick, index) => {
          var result = this.generator.next({
            close: closes[index],
            volume: volumes[index]
          });
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        let result = this.generator.next(price).value;
        if (result != void 0) {
          return result;
        }
      }
    };
    ForceIndex.calculate = forceindex;
    function forceindex(input) {
      Indicator.reverseInputs(input);
      var result = new ForceIndex(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var CCI = class extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var closes = input.close;
        var period = input.period;
        var format2 = this.format;
        let constant = 0.015;
        var currentTpSet = new FixedSizeLinkedList(period);
        var tpSMACalculator = new SMA({ period, values: [], format: (v) => {
          return v;
        } });
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var tick = yield;
          while (true) {
            let tp = (tick.high + tick.low + tick.close) / 3;
            currentTpSet.push(tp);
            let smaTp = tpSMACalculator.nextValue(tp);
            let meanDeviation = null;
            let cci2;
            let sum2 = 0;
            if (smaTp != void 0) {
              for (let x2 of currentTpSet.iterator()) {
                sum2 = sum2 + Math.abs(x2 - smaTp);
              }
              meanDeviation = sum2 / period;
              cci2 = (tp - smaTp) / (constant * meanDeviation);
            }
            tick = yield cci2;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index]
          });
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        let result = this.generator.next(price).value;
        if (result != void 0) {
          return result;
        }
      }
    };
    CCI.calculate = cci;
    function cci(input) {
      Indicator.reverseInputs(input);
      var result = new CCI(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var AwesomeOscillator = class extends Indicator {
      constructor(input) {
        super(input);
        var highs = input.high;
        var lows = input.low;
        var fastPeriod = input.fastPeriod;
        var slowPeriod = input.slowPeriod;
        var slowSMA = new SMA({ values: [], period: slowPeriod });
        var fastSMA = new SMA({ values: [], period: fastPeriod });
        this.result = [];
        this.generator = function* () {
          var result;
          var tick;
          var medianPrice;
          var slowSmaValue;
          var fastSmaValue;
          tick = yield;
          while (true) {
            medianPrice = (tick.high + tick.low) / 2;
            slowSmaValue = slowSMA.nextValue(medianPrice);
            fastSmaValue = fastSMA.nextValue(medianPrice);
            if (slowSmaValue !== void 0 && fastSmaValue !== void 0) {
              result = fastSmaValue - slowSmaValue;
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        highs.forEach((tickHigh, index) => {
          var tickInput = {
            high: tickHigh,
            low: lows[index]
          };
          var result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(this.format(result.value));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return this.format(result.value);
        }
      }
    };
    AwesomeOscillator.calculate = awesomeoscillator;
    function awesomeoscillator(input) {
      Indicator.reverseInputs(input);
      var result = new AwesomeOscillator(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var VWAP = class extends Indicator {
      constructor(input) {
        super(input);
        var lows = input.low;
        var highs = input.high;
        var closes = input.close;
        var volumes = input.volume;
        var format2 = this.format;
        if (!(lows.length === highs.length && highs.length === closes.length)) {
          throw "Inputs(low,high, close) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var tick = yield;
          let cumulativeTotal = 0;
          let cumulativeVolume = 0;
          while (true) {
            let typicalPrice = (tick.high + tick.low + tick.close) / 3;
            let total = tick.volume * typicalPrice;
            cumulativeTotal = cumulativeTotal + total;
            cumulativeVolume = cumulativeVolume + tick.volume;
            tick = yield cumulativeTotal / cumulativeVolume;
          }
        }();
        this.generator.next();
        lows.forEach((tick, index) => {
          var result = this.generator.next({
            high: highs[index],
            low: lows[index],
            close: closes[index],
            volume: volumes[index]
          });
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        let result = this.generator.next(price).value;
        if (result != void 0) {
          return result;
        }
      }
    };
    VWAP.calculate = vwap;
    function vwap(input) {
      Indicator.reverseInputs(input);
      var result = new VWAP(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    function priceFallsBetweenBarRange(low, high, low1, high1) {
      return low <= low1 && high >= low1 || low1 <= low && high1 >= low;
    }
    var VolumeProfile = class extends Indicator {
      constructor(input) {
        super(input);
        var highs = input.high;
        var lows = input.low;
        var closes = input.close;
        var opens = input.open;
        var volumes = input.volume;
        var bars = input.noOfBars;
        if (!(lows.length === highs.length && highs.length === closes.length && highs.length === volumes.length)) {
          throw "Inputs(low,high, close, volumes) not of equal size";
        }
        this.result = [];
        var max = Math.max(...highs, ...lows, ...closes, ...opens);
        var min = Math.min(...highs, ...lows, ...closes, ...opens);
        var barRange = (max - min) / bars;
        var lastEnd = min;
        for (let i2 = 0; i2 < bars; i2++) {
          let rangeStart = lastEnd;
          let rangeEnd = rangeStart + barRange;
          lastEnd = rangeEnd;
          let bullishVolume = 0;
          let bearishVolume = 0;
          let totalVolume = 0;
          for (let priceBar = 0; priceBar < highs.length; priceBar++) {
            let priceBarStart = lows[priceBar];
            let priceBarEnd = highs[priceBar];
            let priceBarOpen = opens[priceBar];
            let priceBarClose = closes[priceBar];
            let priceBarVolume = volumes[priceBar];
            if (priceFallsBetweenBarRange(rangeStart, rangeEnd, priceBarStart, priceBarEnd)) {
              totalVolume = totalVolume + priceBarVolume;
              if (priceBarOpen > priceBarClose) {
                bearishVolume = bearishVolume + priceBarVolume;
              } else {
                bullishVolume = bullishVolume + priceBarVolume;
              }
            }
          }
          this.result.push({
            rangeStart,
            rangeEnd,
            bullishVolume,
            bearishVolume,
            totalVolume
          });
        }
      }
      nextValue(price) {
        throw "Next value not supported for volume profile";
      }
    };
    VolumeProfile.calculate = volumeprofile;
    function volumeprofile(input) {
      Indicator.reverseInputs(input);
      var result = new VolumeProfile(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var TypicalPrice = class extends Indicator {
      constructor(input) {
        super(input);
        this.result = [];
        this.generator = function* () {
          let priceInput = yield;
          while (true) {
            priceInput = yield (priceInput.high + priceInput.low + priceInput.close) / 3;
          }
        }();
        this.generator.next();
        input.low.forEach((tick, index) => {
          var result = this.generator.next({
            high: input.high[index],
            low: input.low[index],
            close: input.close[index]
          });
          this.result.push(result.value);
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        return result;
      }
    };
    TypicalPrice.calculate = typicalprice;
    function typicalprice(input) {
      Indicator.reverseInputs(input);
      var result = new TypicalPrice(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var MFI = class extends Indicator {
      constructor(input) {
        super(input);
        var highs = input.high;
        var lows = input.low;
        var closes = input.close;
        var volumes = input.volume;
        var period = input.period;
        var typicalPrice = new TypicalPrice({ low: [], high: [], close: [] });
        var positiveFlow = new FixedSizeLinkedList(period, false, false, true);
        var negativeFlow = new FixedSizeLinkedList(period, false, false, true);
        if (!(lows.length === highs.length && highs.length === closes.length && highs.length === volumes.length)) {
          throw "Inputs(low,high, close, volumes) not of equal size";
        }
        this.result = [];
        this.generator = function* () {
          var result;
          var tick;
          var lastClose;
          var positiveFlowForPeriod;
          var rawMoneyFlow = 0;
          var moneyFlowRatio;
          var negativeFlowForPeriod;
          let typicalPriceValue = null;
          let prevousTypicalPrice = null;
          tick = yield;
          lastClose = tick.close;
          tick = yield;
          while (true) {
            var { high, low, close, volume } = tick;
            var positionMoney = 0;
            var negativeMoney = 0;
            typicalPriceValue = typicalPrice.nextValue({ high, low, close });
            rawMoneyFlow = typicalPriceValue * volume;
            if (typicalPriceValue != null && prevousTypicalPrice != null) {
              typicalPriceValue > prevousTypicalPrice ? positionMoney = rawMoneyFlow : negativeMoney = rawMoneyFlow;
              positiveFlow.push(positionMoney);
              negativeFlow.push(negativeMoney);
              positiveFlowForPeriod = positiveFlow.periodSum;
              negativeFlowForPeriod = negativeFlow.periodSum;
              if (positiveFlow.totalPushed >= period && positiveFlow.totalPushed >= period) {
                moneyFlowRatio = positiveFlowForPeriod / negativeFlowForPeriod;
                result = 100 - 100 / (1 + moneyFlowRatio);
              }
            }
            prevousTypicalPrice = typicalPriceValue;
            tick = yield result;
          }
        }();
        this.generator.next();
        highs.forEach((tickHigh, index) => {
          var tickInput = {
            high: tickHigh,
            low: lows[index],
            close: closes[index],
            volume: volumes[index]
          };
          var result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(parseFloat(result.value.toFixed(2)));
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return parseFloat(result.value.toFixed(2));
        }
      }
    };
    MFI.calculate = mfi;
    function mfi(input) {
      Indicator.reverseInputs(input);
      var result = new MFI(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var StochasticRSI = class extends Indicator {
      constructor(input) {
        super(input);
        let closes = input.values;
        let rsiPeriod = input.rsiPeriod;
        let stochasticPeriod = input.stochasticPeriod;
        let kPeriod = input.kPeriod;
        let dPeriod = input.dPeriod;
        let format2 = this.format;
        this.result = [];
        this.generator = function* () {
          let index = 1;
          let rsi$$1 = new RSI({ period: rsiPeriod, values: [] });
          let stochastic$$1 = new Stochastic({ period: stochasticPeriod, high: [], low: [], close: [], signalPeriod: kPeriod });
          let dSma = new SMA({
            period: dPeriod,
            values: [],
            format: (v) => {
              return v;
            }
          });
          let lastRSI, stochasticRSI, d, result;
          var tick = yield;
          while (true) {
            lastRSI = rsi$$1.nextValue(tick);
            if (lastRSI !== void 0) {
              var stochasticInput = { high: lastRSI, low: lastRSI, close: lastRSI };
              stochasticRSI = stochastic$$1.nextValue(stochasticInput);
              if (stochasticRSI !== void 0 && stochasticRSI.d !== void 0) {
                d = dSma.nextValue(stochasticRSI.d);
                if (d !== void 0)
                  result = {
                    stochRSI: stochasticRSI.k,
                    k: stochasticRSI.d,
                    d
                  };
              }
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        closes.forEach((tick, index) => {
          var result = this.generator.next(tick);
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(input) {
        let nextResult = this.generator.next(input);
        if (nextResult.value !== void 0)
          return nextResult.value;
      }
    };
    StochasticRSI.calculate = stochasticrsi;
    function stochasticrsi(input) {
      Indicator.reverseInputs(input);
      var result = new StochasticRSI(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var Highest = class extends Indicator {
      constructor(input) {
        super(input);
        var values = input.values;
        var period = input.period;
        this.result = [];
        var periodList = new FixedSizeLinkedList(period, true, false, false);
        this.generator = function* () {
          var result;
          var tick;
          var high;
          tick = yield;
          while (true) {
            periodList.push(tick);
            if (periodList.totalPushed >= period) {
              high = periodList.periodHigh;
            }
            tick = yield high;
          }
        }();
        this.generator.next();
        values.forEach((value, index) => {
          var result = this.generator.next(value);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return result.value;
        }
      }
    };
    Highest.calculate = highest;
    function highest(input) {
      Indicator.reverseInputs(input);
      var result = new Highest(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var Lowest = class extends Indicator {
      constructor(input) {
        super(input);
        var values = input.values;
        var period = input.period;
        this.result = [];
        var periodList = new FixedSizeLinkedList(period, false, true, false);
        this.generator = function* () {
          var result;
          var tick;
          var high;
          tick = yield;
          while (true) {
            periodList.push(tick);
            if (periodList.totalPushed >= period) {
              high = periodList.periodLow;
            }
            tick = yield high;
          }
        }();
        this.generator.next();
        values.forEach((value, index) => {
          var result = this.generator.next(value);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return result.value;
        }
      }
    };
    Lowest.calculate = lowest;
    function lowest(input) {
      Indicator.reverseInputs(input);
      var result = new Lowest(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var Sum = class extends Indicator {
      constructor(input) {
        super(input);
        var values = input.values;
        var period = input.period;
        this.result = [];
        var periodList = new FixedSizeLinkedList(period, false, false, true);
        this.generator = function* () {
          var result;
          var tick;
          var high;
          tick = yield;
          while (true) {
            periodList.push(tick);
            if (periodList.totalPushed >= period) {
              high = periodList.periodSum;
            }
            tick = yield high;
          }
        }();
        this.generator.next();
        values.forEach((value, index) => {
          var result = this.generator.next(value);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return result.value;
        }
      }
    };
    Sum.calculate = sum;
    function sum(input) {
      Indicator.reverseInputs(input);
      var result = new Sum(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var Renko = class extends Indicator {
      constructor(input) {
        super(input);
        var format2 = this.format;
        let useATR = input.useATR;
        let brickSize = input.brickSize || 0;
        if (useATR) {
          let atrResult = atr(Object.assign({}, input));
          brickSize = atrResult[atrResult.length - 1];
        }
        this.result = new CandleList();
        if (brickSize === 0) {
          console.error("Not enough data to calculate brickSize for renko when using ATR");
          return;
        }
        let lastOpen = 0;
        let lastHigh = 0;
        let lastLow = Infinity;
        let lastClose = 0;
        let lastVolume = 0;
        let lastTimestamp = 0;
        this.generator = function* () {
          let candleData = yield;
          while (true) {
            if (lastOpen === 0) {
              lastOpen = candleData.close;
              lastHigh = candleData.high;
              lastLow = candleData.low;
              lastClose = candleData.close;
              lastVolume = candleData.volume;
              lastTimestamp = candleData.timestamp;
              candleData = yield;
              continue;
            }
            let absoluteMovementFromClose = Math.abs(candleData.close - lastClose);
            let absoluteMovementFromOpen = Math.abs(candleData.close - lastOpen);
            if (absoluteMovementFromClose >= brickSize && absoluteMovementFromOpen >= brickSize) {
              let reference = absoluteMovementFromClose > absoluteMovementFromOpen ? lastOpen : lastClose;
              let calculated = {
                open: reference,
                high: lastHigh > candleData.high ? lastHigh : candleData.high,
                low: lastLow < candleData.Low ? lastLow : candleData.low,
                close: reference > candleData.close ? reference - brickSize : reference + brickSize,
                volume: lastVolume + candleData.volume,
                timestamp: candleData.timestamp
              };
              lastOpen = calculated.open;
              lastHigh = calculated.close;
              lastLow = calculated.close;
              lastClose = calculated.close;
              lastVolume = 0;
              candleData = yield calculated;
            } else {
              lastHigh = lastHigh > candleData.high ? lastHigh : candleData.high;
              lastLow = lastLow < candleData.Low ? lastLow : candleData.low;
              lastVolume = lastVolume + candleData.volume;
              lastTimestamp = candleData.timestamp;
              candleData = yield;
            }
          }
        }();
        this.generator.next();
        input.low.forEach((tick, index) => {
          var result = this.generator.next({
            open: input.open[index],
            high: input.high[index],
            low: input.low[index],
            close: input.close[index],
            volume: input.volume[index],
            timestamp: input.timestamp[index]
          });
          if (result.value) {
            this.result.open.push(result.value.open);
            this.result.high.push(result.value.high);
            this.result.low.push(result.value.low);
            this.result.close.push(result.value.close);
            this.result.volume.push(result.value.volume);
            this.result.timestamp.push(result.value.timestamp);
          }
        });
      }
      nextValue(price) {
        console.error("Cannot calculate next value on Renko, Every value has to be recomputed for every change, use calcualte method");
        return null;
      }
    };
    Renko.calculate = renko;
    function renko(input) {
      Indicator.reverseInputs(input);
      var result = new Renko(input).result;
      if (input.reversedInput) {
        result.open.reverse();
        result.high.reverse();
        result.low.reverse();
        result.close.reverse();
        result.volume.reverse();
        result.timestamp.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var HeikinAshi = class extends Indicator {
      constructor(input) {
        super(input);
        var format2 = this.format;
        this.result = new CandleList();
        let lastOpen = null;
        let lastHigh = 0;
        let lastLow = Infinity;
        let lastClose = 0;
        let lastVolume = 0;
        let lastTimestamp = 0;
        this.generator = function* () {
          let candleData = yield;
          let calculated = null;
          while (true) {
            if (lastOpen === null) {
              lastOpen = (candleData.close + candleData.open) / 2;
              lastHigh = candleData.high;
              lastLow = candleData.low;
              lastClose = (candleData.close + candleData.open + candleData.high + candleData.low) / 4;
              lastVolume = candleData.volume || 0;
              lastTimestamp = candleData.timestamp || 0;
              calculated = {
                open: lastOpen,
                high: lastHigh,
                low: lastLow,
                close: lastClose,
                volume: candleData.volume || 0,
                timestamp: candleData.timestamp || 0
              };
            } else {
              let newClose = (candleData.close + candleData.open + candleData.high + candleData.low) / 4;
              let newOpen = (lastOpen + lastClose) / 2;
              let newHigh = Math.max(newOpen, newClose, candleData.high);
              let newLow = Math.min(candleData.low, newOpen, newClose);
              calculated = {
                close: newClose,
                open: newOpen,
                high: newHigh,
                low: newLow,
                volume: candleData.volume || 0,
                timestamp: candleData.timestamp || 0
              };
              lastClose = newClose;
              lastOpen = newOpen;
              lastHigh = newHigh;
              lastLow = newLow;
            }
            candleData = yield calculated;
          }
        }();
        this.generator.next();
        input.low.forEach((tick, index) => {
          var result = this.generator.next({
            open: input.open[index],
            high: input.high[index],
            low: input.low[index],
            close: input.close[index],
            volume: input.volume ? input.volume[index] : input.volume,
            timestamp: input.timestamp ? input.timestamp[index] : input.timestamp
          });
          if (result.value) {
            this.result.open.push(result.value.open);
            this.result.high.push(result.value.high);
            this.result.low.push(result.value.low);
            this.result.close.push(result.value.close);
            this.result.volume.push(result.value.volume);
            this.result.timestamp.push(result.value.timestamp);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price).value;
        return result;
      }
    };
    HeikinAshi.calculate = heikinashi;
    function heikinashi(input) {
      Indicator.reverseInputs(input);
      var result = new HeikinAshi(input).result;
      if (input.reversedInput) {
        result.open.reverse();
        result.high.reverse();
        result.low.reverse();
        result.close.reverse();
        result.volume.reverse();
        result.timestamp.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var CandlestickFinder = class {
      constructor() {
      }
      approximateEqual(a, b) {
        let left = parseFloat(Math.abs(a - b).toPrecision(4)) * 1;
        let right = parseFloat((a * 1e-3).toPrecision(4)) * 1;
        return left <= right;
      }
      logic(data) {
        throw "this has to be implemented";
      }
      getAllPatternIndex(data) {
        if (data.close.length < this.requiredCount) {
          console.warn("Data count less than data required for the strategy ", this.name);
          return [];
        }
        if (data.reversedInput) {
          data.open.reverse();
          data.high.reverse();
          data.low.reverse();
          data.close.reverse();
        }
        let strategyFn = this.logic;
        return this._generateDataForCandleStick(data).map((current, index) => {
          return strategyFn.call(this, current) ? index : void 0;
        }).filter((hasIndex) => {
          return hasIndex;
        });
      }
      hasPattern(data) {
        if (data.close.length < this.requiredCount) {
          console.warn("Data count less than data required for the strategy ", this.name);
          return false;
        }
        if (data.reversedInput) {
          data.open.reverse();
          data.high.reverse();
          data.low.reverse();
          data.close.reverse();
        }
        let strategyFn = this.logic;
        return strategyFn.call(this, this._getLastDataForCandleStick(data));
      }
      _getLastDataForCandleStick(data) {
        let requiredCount = this.requiredCount;
        if (data.close.length === requiredCount) {
          return data;
        } else {
          let returnVal = {
            open: [],
            high: [],
            low: [],
            close: []
          };
          let i2 = 0;
          let index = data.close.length - requiredCount;
          while (i2 < requiredCount) {
            returnVal.open.push(data.open[index + i2]);
            returnVal.high.push(data.high[index + i2]);
            returnVal.low.push(data.low[index + i2]);
            returnVal.close.push(data.close[index + i2]);
            i2++;
          }
          return returnVal;
        }
      }
      _generateDataForCandleStick(data) {
        let requiredCount = this.requiredCount;
        let generatedData = data.close.map(function(currentData, index) {
          let i2 = 0;
          let returnVal = {
            open: [],
            high: [],
            low: [],
            close: []
          };
          while (i2 < requiredCount) {
            returnVal.open.push(data.open[index + i2]);
            returnVal.high.push(data.high[index + i2]);
            returnVal.low.push(data.low[index + i2]);
            returnVal.close.push(data.close[index + i2]);
            i2++;
          }
          return returnVal;
        }).filter((val, index) => {
          return index <= data.close.length - requiredCount;
        });
        return generatedData;
      }
    };
    var MorningStar = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "MorningStar";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
        let isFirstBearish = firstdaysClose < firstdaysOpen;
        let isSmallBodyExists = firstdaysLow > seconddaysLow && firstdaysLow > seconddaysHigh;
        let isThirdBullish = thirddaysOpen < thirddaysClose;
        let gapExists = seconddaysHigh < firstdaysLow && seconddaysLow < firstdaysLow && thirddaysOpen > seconddaysHigh && seconddaysClose < thirddaysOpen;
        let doesCloseAboveFirstMidpoint = thirddaysClose > firstdaysMidpoint;
        return isFirstBearish && isSmallBodyExists && gapExists && isThirdBullish && doesCloseAboveFirstMidpoint;
      }
    };
    function morningstar(data) {
      return new MorningStar().hasPattern(data);
    }
    var BullishEngulfingPattern = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BullishEngulfingPattern";
        this.requiredCount = 2;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBullishEngulfing = firstdaysClose < firstdaysOpen && firstdaysOpen > seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysOpen < seconddaysClose;
        return isBullishEngulfing;
      }
    };
    function bullishengulfingpattern(data) {
      return new BullishEngulfingPattern().hasPattern(data);
    }
    var BullishHarami = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 2;
        this.name = "BullishHarami";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBullishHaramiPattern = firstdaysOpen > seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysClose < seconddaysClose && firstdaysOpen > seconddaysLow && firstdaysHigh > seconddaysHigh;
        return isBullishHaramiPattern;
      }
    };
    function bullishharami(data) {
      return new BullishHarami().hasPattern(data);
    }
    var BullishHaramiCross = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 2;
        this.name = "BullishHaramiCross";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBullishHaramiCrossPattern = firstdaysOpen > seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysClose < seconddaysClose && firstdaysOpen > seconddaysLow && firstdaysHigh > seconddaysHigh;
        let isSecondDayDoji = this.approximateEqual(seconddaysOpen, seconddaysClose);
        return isBullishHaramiCrossPattern && isSecondDayDoji;
      }
    };
    function bullishharamicross(data) {
      return new BullishHaramiCross().hasPattern(data);
    }
    var Doji = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "Doji";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isOpenEqualsClose = this.approximateEqual(daysOpen, daysClose);
        let isHighEqualsOpen = isOpenEqualsClose && this.approximateEqual(daysOpen, daysHigh);
        let isLowEqualsClose = isOpenEqualsClose && this.approximateEqual(daysClose, daysLow);
        return isOpenEqualsClose && isHighEqualsOpen == isLowEqualsClose;
      }
    };
    function doji(data) {
      return new Doji().hasPattern(data);
    }
    var MorningDojiStar = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "MorningDojiStar";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
        let isFirstBearish = firstdaysClose < firstdaysOpen;
        let dojiExists = new Doji().hasPattern({
          "open": [seconddaysOpen],
          "close": [seconddaysClose],
          "high": [seconddaysHigh],
          "low": [seconddaysLow]
        });
        let isThirdBullish = thirddaysOpen < thirddaysClose;
        let gapExists = seconddaysHigh < firstdaysLow && seconddaysLow < firstdaysLow && thirddaysOpen > seconddaysHigh && seconddaysClose < thirddaysOpen;
        let doesCloseAboveFirstMidpoint = thirddaysClose > firstdaysMidpoint;
        return isFirstBearish && dojiExists && isThirdBullish && gapExists && doesCloseAboveFirstMidpoint;
      }
    };
    function morningdojistar(data) {
      return new MorningDojiStar().hasPattern(data);
    }
    var DownsideTasukiGap = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 3;
        this.name = "DownsideTasukiGap";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let isFirstBearish = firstdaysClose < firstdaysOpen;
        let isSecondBearish = seconddaysClose < seconddaysOpen;
        let isThirdBullish = thirddaysClose > thirddaysOpen;
        let isFirstGapExists = seconddaysHigh < firstdaysLow;
        let isDownsideTasukiGap = seconddaysOpen > thirddaysOpen && seconddaysClose < thirddaysOpen && thirddaysClose > seconddaysOpen && thirddaysClose < firstdaysClose;
        return isFirstBearish && isSecondBearish && isThirdBullish && isFirstGapExists && isDownsideTasukiGap;
      }
    };
    function downsidetasukigap(data) {
      return new DownsideTasukiGap().hasPattern(data);
    }
    var BullishMarubozu = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BullishMarubozu";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBullishMarbozu = this.approximateEqual(daysClose, daysHigh) && this.approximateEqual(daysLow, daysOpen) && daysOpen < daysClose && daysOpen < daysHigh;
        return isBullishMarbozu;
      }
    };
    function bullishmarubozu(data) {
      return new BullishMarubozu().hasPattern(data);
    }
    var PiercingLine = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 2;
        this.name = "PiercingLine";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
        let isDowntrend = seconddaysLow < firstdaysLow;
        let isFirstBearish = firstdaysClose < firstdaysOpen;
        let isSecondBullish = seconddaysClose > seconddaysOpen;
        let isPiercingLinePattern = firstdaysLow > seconddaysOpen && seconddaysClose > firstdaysMidpoint;
        return isDowntrend && isFirstBearish && isPiercingLinePattern && isSecondBullish;
      }
    };
    function piercingline(data) {
      return new PiercingLine().hasPattern(data);
    }
    var ThreeWhiteSoldiers = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "ThreeWhiteSoldiers";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let isUpTrend = seconddaysHigh > firstdaysHigh && thirddaysHigh > seconddaysHigh;
        let isAllBullish = firstdaysOpen < firstdaysClose && seconddaysOpen < seconddaysClose && thirddaysOpen < thirddaysClose;
        let doesOpenWithinPreviousBody = firstdaysClose > seconddaysOpen && seconddaysOpen < firstdaysHigh && seconddaysHigh > thirddaysOpen && thirddaysOpen < seconddaysClose;
        return isUpTrend && isAllBullish && doesOpenWithinPreviousBody;
      }
    };
    function threewhitesoldiers(data) {
      return new ThreeWhiteSoldiers().hasPattern(data);
    }
    var BullishHammerStick = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BullishHammerStick";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBullishHammer = daysClose > daysOpen;
        isBullishHammer = isBullishHammer && this.approximateEqual(daysClose, daysHigh);
        isBullishHammer = isBullishHammer && daysClose - daysOpen <= 2 * (daysOpen - daysLow);
        return isBullishHammer;
      }
    };
    function bullishhammerstick(data) {
      return new BullishHammerStick().hasPattern(data);
    }
    var BullishInvertedHammerStick = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BullishInvertedHammerStick";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBullishInvertedHammer = daysClose > daysOpen;
        isBullishInvertedHammer = isBullishInvertedHammer && this.approximateEqual(daysOpen, daysLow);
        isBullishInvertedHammer = isBullishInvertedHammer && daysClose - daysOpen <= 2 * (daysHigh - daysClose);
        return isBullishInvertedHammer;
      }
    };
    function bullishinvertedhammerstick(data) {
      return new BullishInvertedHammerStick().hasPattern(data);
    }
    var BearishHammerStick = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BearishHammerStick";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBearishHammer = daysOpen > daysClose;
        isBearishHammer = isBearishHammer && this.approximateEqual(daysOpen, daysHigh);
        isBearishHammer = isBearishHammer && daysOpen - daysClose <= 2 * (daysClose - daysLow);
        return isBearishHammer;
      }
    };
    function bearishhammerstick(data) {
      return new BearishHammerStick().hasPattern(data);
    }
    var BearishInvertedHammerStick = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BearishInvertedHammerStick";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBearishInvertedHammer = daysOpen > daysClose;
        isBearishInvertedHammer = isBearishInvertedHammer && this.approximateEqual(daysClose, daysLow);
        isBearishInvertedHammer = isBearishInvertedHammer && daysOpen - daysClose <= 2 * (daysHigh - daysOpen);
        return isBearishInvertedHammer;
      }
    };
    function bearishinvertedhammerstick(data) {
      return new BearishInvertedHammerStick().hasPattern(data);
    }
    var HammerPattern = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "HammerPattern";
        this.requiredCount = 5;
      }
      logic(data) {
        let isPattern = this.downwardTrend(data);
        isPattern = isPattern && this.includesHammer(data);
        isPattern = isPattern && this.hasConfirmation(data);
        return isPattern;
      }
      downwardTrend(data, confirm = true) {
        let end = confirm ? 3 : 4;
        let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
        let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
        return losses > gains;
      }
      includesHammer(data, confirm = true) {
        let start = confirm ? 3 : 4;
        let end = confirm ? 4 : void 0;
        let possibleHammerData = {
          open: data.open.slice(start, end),
          close: data.close.slice(start, end),
          low: data.low.slice(start, end),
          high: data.high.slice(start, end)
        };
        let isPattern = bearishhammerstick(possibleHammerData);
        isPattern = isPattern || bearishinvertedhammerstick(possibleHammerData);
        isPattern = isPattern || bullishhammerstick(possibleHammerData);
        isPattern = isPattern || bullishinvertedhammerstick(possibleHammerData);
        return isPattern;
      }
      hasConfirmation(data) {
        let possibleHammer = {
          open: data.open[3],
          close: data.close[3],
          low: data.low[3],
          high: data.high[3]
        };
        let possibleConfirmation = {
          open: data.open[4],
          close: data.close[4],
          low: data.low[4],
          high: data.high[4]
        };
        let isPattern = possibleConfirmation.open < possibleConfirmation.close;
        return isPattern && possibleHammer.close < possibleConfirmation.close;
      }
    };
    function hammerpattern(data) {
      return new HammerPattern().hasPattern(data);
    }
    var HammerPatternUnconfirmed = class extends HammerPattern {
      constructor() {
        super();
        this.name = "HammerPatternUnconfirmed";
      }
      logic(data) {
        let isPattern = this.downwardTrend(data, false);
        isPattern = isPattern && this.includesHammer(data, false);
        return isPattern;
      }
    };
    function hammerpatternunconfirmed(data) {
      return new HammerPatternUnconfirmed().hasPattern(data);
    }
    var TweezerBottom = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "TweezerBottom";
        this.requiredCount = 5;
      }
      logic(data) {
        return this.downwardTrend(data) && data.low[3] == data.low[4];
      }
      downwardTrend(data) {
        let gains = averagegain({ values: data.close.slice(0, 3), period: 2 });
        let losses = averageloss({ values: data.close.slice(0, 3), period: 2 });
        return losses > gains;
      }
    };
    function tweezerbottom(data) {
      return new TweezerBottom().hasPattern(data);
    }
    var bullishPatterns = [
      new BullishEngulfingPattern(),
      new DownsideTasukiGap(),
      new BullishHarami(),
      new BullishHaramiCross(),
      new MorningDojiStar(),
      new MorningStar(),
      new BullishMarubozu(),
      new PiercingLine(),
      new ThreeWhiteSoldiers(),
      new BullishHammerStick(),
      new BullishInvertedHammerStick(),
      new HammerPattern(),
      new HammerPatternUnconfirmed(),
      new TweezerBottom()
    ];
    var BullishPatterns = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "Bullish Candlesticks";
      }
      hasPattern(data) {
        return bullishPatterns.reduce(function(state, pattern) {
          let result = pattern.hasPattern(data);
          return state || result;
        }, false);
      }
    };
    function bullish(data) {
      return new BullishPatterns().hasPattern(data);
    }
    var BearishEngulfingPattern = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BearishEngulfingPattern";
        this.requiredCount = 2;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBearishEngulfing = firstdaysClose > firstdaysOpen && firstdaysOpen < seconddaysOpen && firstdaysClose < seconddaysOpen && firstdaysOpen > seconddaysClose;
        return isBearishEngulfing;
      }
    };
    function bearishengulfingpattern(data) {
      return new BearishEngulfingPattern().hasPattern(data);
    }
    var BearishHarami = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 2;
        this.name = "BearishHarami";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBearishHaramiPattern = firstdaysOpen < seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysClose > seconddaysClose && firstdaysOpen < seconddaysLow && firstdaysHigh > seconddaysHigh;
        return isBearishHaramiPattern;
      }
    };
    function bearishharami(data) {
      return new BearishHarami().hasPattern(data);
    }
    var BearishHaramiCross = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 2;
        this.name = "BearishHaramiCross";
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let isBearishHaramiCrossPattern = firstdaysOpen < seconddaysOpen && firstdaysClose > seconddaysOpen && firstdaysClose > seconddaysClose && firstdaysOpen < seconddaysLow && firstdaysHigh > seconddaysHigh;
        let isSecondDayDoji = this.approximateEqual(seconddaysOpen, seconddaysClose);
        return isBearishHaramiCrossPattern && isSecondDayDoji;
      }
    };
    function bearishharamicross(data) {
      return new BearishHaramiCross().hasPattern(data);
    }
    var EveningDojiStar = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "EveningDojiStar";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
        let isFirstBullish = firstdaysClose > firstdaysOpen;
        let dojiExists = new Doji().hasPattern({
          "open": [seconddaysOpen],
          "close": [seconddaysClose],
          "high": [seconddaysHigh],
          "low": [seconddaysLow]
        });
        let isThirdBearish = thirddaysOpen > thirddaysClose;
        let gapExists = seconddaysHigh > firstdaysHigh && seconddaysLow > firstdaysHigh && thirddaysOpen < seconddaysLow && seconddaysClose > thirddaysOpen;
        let doesCloseBelowFirstMidpoint = thirddaysClose < firstdaysMidpoint;
        return isFirstBullish && dojiExists && gapExists && isThirdBearish && doesCloseBelowFirstMidpoint;
      }
    };
    function eveningdojistar(data) {
      return new EveningDojiStar().hasPattern(data);
    }
    var EveningStar = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "EveningStar";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let firstdaysMidpoint = (firstdaysOpen + firstdaysClose) / 2;
        let isFirstBullish = firstdaysClose > firstdaysOpen;
        let isSmallBodyExists = firstdaysHigh < seconddaysLow && firstdaysHigh < seconddaysHigh;
        let isThirdBearish = thirddaysOpen > thirddaysClose;
        let gapExists = seconddaysHigh > firstdaysHigh && seconddaysLow > firstdaysHigh && thirddaysOpen < seconddaysLow && seconddaysClose > thirddaysOpen;
        let doesCloseBelowFirstMidpoint = thirddaysClose < firstdaysMidpoint;
        return isFirstBullish && isSmallBodyExists && gapExists && isThirdBearish && doesCloseBelowFirstMidpoint;
      }
    };
    function eveningstar(data) {
      return new EveningStar().hasPattern(data);
    }
    var BearishMarubozu = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BearishMarubozu";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isBearishMarbozu = this.approximateEqual(daysOpen, daysHigh) && this.approximateEqual(daysLow, daysClose) && daysOpen > daysClose && daysOpen > daysLow;
        return isBearishMarbozu;
      }
    };
    function bearishmarubozu(data) {
      return new BearishMarubozu().hasPattern(data);
    }
    var ThreeBlackCrows = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "ThreeBlackCrows";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let isDownTrend = firstdaysLow > seconddaysLow && seconddaysLow > thirddaysLow;
        let isAllBearish = firstdaysOpen > firstdaysClose && seconddaysOpen > seconddaysClose && thirddaysOpen > thirddaysClose;
        let doesOpenWithinPreviousBody = firstdaysOpen > seconddaysOpen && seconddaysOpen > firstdaysClose && seconddaysOpen > thirddaysOpen && thirddaysOpen > seconddaysClose;
        return isDownTrend && isAllBearish && doesOpenWithinPreviousBody;
      }
    };
    function threeblackcrows(data) {
      return new ThreeBlackCrows().hasPattern(data);
    }
    var HangingMan = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "HangingMan";
        this.requiredCount = 5;
      }
      logic(data) {
        let isPattern = this.upwardTrend(data);
        isPattern = isPattern && this.includesHammer(data);
        isPattern = isPattern && this.hasConfirmation(data);
        return isPattern;
      }
      upwardTrend(data, confirm = true) {
        let end = confirm ? 3 : 4;
        let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
        let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
        return gains > losses;
      }
      includesHammer(data, confirm = true) {
        let start = confirm ? 3 : 4;
        let end = confirm ? 4 : void 0;
        let possibleHammerData = {
          open: data.open.slice(start, end),
          close: data.close.slice(start, end),
          low: data.low.slice(start, end),
          high: data.high.slice(start, end)
        };
        let isPattern = bearishhammerstick(possibleHammerData);
        isPattern = isPattern || bullishhammerstick(possibleHammerData);
        return isPattern;
      }
      hasConfirmation(data) {
        let possibleHammer = {
          open: data.open[3],
          close: data.close[3],
          low: data.low[3],
          high: data.high[3]
        };
        let possibleConfirmation = {
          open: data.open[4],
          close: data.close[4],
          low: data.low[4],
          high: data.high[4]
        };
        let isPattern = possibleConfirmation.open > possibleConfirmation.close;
        return isPattern && possibleHammer.close > possibleConfirmation.close;
      }
    };
    function hangingman(data) {
      return new HangingMan().hasPattern(data);
    }
    var HangingManUnconfirmed = class extends HangingMan {
      constructor() {
        super();
        this.name = "HangingManUnconfirmed";
      }
      logic(data) {
        let isPattern = this.upwardTrend(data, false);
        isPattern = isPattern && this.includesHammer(data, false);
        return isPattern;
      }
    };
    function hangingmanunconfirmed(data) {
      return new HangingManUnconfirmed().hasPattern(data);
    }
    var ShootingStar = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "ShootingStar";
        this.requiredCount = 5;
      }
      logic(data) {
        let isPattern = this.upwardTrend(data);
        isPattern = isPattern && this.includesHammer(data);
        isPattern = isPattern && this.hasConfirmation(data);
        return isPattern;
      }
      upwardTrend(data, confirm = true) {
        let end = confirm ? 3 : 4;
        let gains = averagegain({ values: data.close.slice(0, end), period: end - 1 });
        let losses = averageloss({ values: data.close.slice(0, end), period: end - 1 });
        return gains > losses;
      }
      includesHammer(data, confirm = true) {
        let start = confirm ? 3 : 4;
        let end = confirm ? 4 : void 0;
        let possibleHammerData = {
          open: data.open.slice(start, end),
          close: data.close.slice(start, end),
          low: data.low.slice(start, end),
          high: data.high.slice(start, end)
        };
        let isPattern = bearishinvertedhammerstick(possibleHammerData);
        isPattern = isPattern || bullishinvertedhammerstick(possibleHammerData);
        return isPattern;
      }
      hasConfirmation(data) {
        let possibleHammer = {
          open: data.open[3],
          close: data.close[3],
          low: data.low[3],
          high: data.high[3]
        };
        let possibleConfirmation = {
          open: data.open[4],
          close: data.close[4],
          low: data.low[4],
          high: data.high[4]
        };
        let isPattern = possibleConfirmation.open > possibleConfirmation.close;
        return isPattern && possibleHammer.close > possibleConfirmation.close;
      }
    };
    function shootingstar(data) {
      return new ShootingStar().hasPattern(data);
    }
    var ShootingStarUnconfirmed = class extends ShootingStar {
      constructor() {
        super();
        this.name = "ShootingStarUnconfirmed";
      }
      logic(data) {
        let isPattern = this.upwardTrend(data, false);
        isPattern = isPattern && this.includesHammer(data, false);
        return isPattern;
      }
    };
    function shootingstarunconfirmed(data) {
      return new ShootingStarUnconfirmed().hasPattern(data);
    }
    var TweezerTop = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "TweezerTop";
        this.requiredCount = 5;
      }
      logic(data) {
        return this.upwardTrend(data) && data.high[3] == data.high[4];
      }
      upwardTrend(data) {
        let gains = averagegain({ values: data.close.slice(0, 3), period: 2 });
        let losses = averageloss({ values: data.close.slice(0, 3), period: 2 });
        return gains > losses;
      }
    };
    function tweezertop(data) {
      return new TweezerTop().hasPattern(data);
    }
    var bearishPatterns = [
      new BearishEngulfingPattern(),
      new BearishHarami(),
      new BearishHaramiCross(),
      new EveningDojiStar(),
      new EveningStar(),
      new BearishMarubozu(),
      new ThreeBlackCrows(),
      new BearishHammerStick(),
      new BearishInvertedHammerStick(),
      new HangingMan(),
      new HangingManUnconfirmed(),
      new ShootingStar(),
      new ShootingStarUnconfirmed(),
      new TweezerTop()
    ];
    var BearishPatterns = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "Bearish Candlesticks";
      }
      hasPattern(data) {
        return bearishPatterns.reduce(function(state, pattern) {
          return state || pattern.hasPattern(data);
        }, false);
      }
    };
    function bearish(data) {
      return new BearishPatterns().hasPattern(data);
    }
    var AbandonedBaby = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "AbandonedBaby";
        this.requiredCount = 3;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let thirddaysOpen = data.open[2];
        let thirddaysClose = data.close[2];
        let thirddaysHigh = data.high[2];
        let thirddaysLow = data.low[2];
        let isFirstBearish = firstdaysClose < firstdaysOpen;
        let dojiExists = new Doji().hasPattern({
          "open": [seconddaysOpen],
          "close": [seconddaysClose],
          "high": [seconddaysHigh],
          "low": [seconddaysLow]
        });
        let gapExists = seconddaysHigh < firstdaysLow && thirddaysLow > seconddaysHigh && thirddaysClose > thirddaysOpen;
        let isThirdBullish = thirddaysHigh < firstdaysOpen;
        return isFirstBearish && dojiExists && gapExists && isThirdBullish;
      }
    };
    function abandonedbaby(data) {
      return new AbandonedBaby().hasPattern(data);
    }
    var DarkCloudCover = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "DarkCloudCover";
        this.requiredCount = 2;
      }
      logic(data) {
        let firstdaysOpen = data.open[0];
        let firstdaysClose = data.close[0];
        let firstdaysHigh = data.high[0];
        let firstdaysLow = data.low[0];
        let seconddaysOpen = data.open[1];
        let seconddaysClose = data.close[1];
        let seconddaysHigh = data.high[1];
        let seconddaysLow = data.low[1];
        let firstdayMidpoint = (firstdaysClose + firstdaysOpen) / 2;
        let isFirstBullish = firstdaysClose > firstdaysOpen;
        let isSecondBearish = seconddaysClose < seconddaysOpen;
        let isDarkCloudPattern = seconddaysOpen > firstdaysHigh && seconddaysClose < firstdayMidpoint && seconddaysClose > firstdaysOpen;
        return isFirstBullish && isSecondBearish && isDarkCloudPattern;
      }
    };
    function darkcloudcover(data) {
      return new DarkCloudCover().hasPattern(data);
    }
    var DragonFlyDoji = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 1;
        this.name = "DragonFlyDoji";
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isOpenEqualsClose = this.approximateEqual(daysOpen, daysClose);
        let isHighEqualsOpen = isOpenEqualsClose && this.approximateEqual(daysOpen, daysHigh);
        let isLowEqualsClose = isOpenEqualsClose && this.approximateEqual(daysClose, daysLow);
        return isOpenEqualsClose && isHighEqualsOpen && !isLowEqualsClose;
      }
    };
    function dragonflydoji(data) {
      return new DragonFlyDoji().hasPattern(data);
    }
    var GraveStoneDoji = class extends CandlestickFinder {
      constructor() {
        super();
        this.requiredCount = 1;
        this.name = "GraveStoneDoji";
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let isOpenEqualsClose = this.approximateEqual(daysOpen, daysClose);
        let isHighEqualsOpen = isOpenEqualsClose && this.approximateEqual(daysOpen, daysHigh);
        let isLowEqualsClose = isOpenEqualsClose && this.approximateEqual(daysClose, daysLow);
        return isOpenEqualsClose && isLowEqualsClose && !isHighEqualsOpen;
      }
    };
    function gravestonedoji(data) {
      return new GraveStoneDoji().hasPattern(data);
    }
    var BullishSpinningTop = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BullishSpinningTop";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let bodyLength = Math.abs(daysClose - daysOpen);
        let upperShadowLength = Math.abs(daysHigh - daysClose);
        let lowerShadowLength = Math.abs(daysOpen - daysLow);
        let isBullishSpinningTop = bodyLength < upperShadowLength && bodyLength < lowerShadowLength;
        return isBullishSpinningTop;
      }
    };
    function bullishspinningtop(data) {
      return new BullishSpinningTop().hasPattern(data);
    }
    var BearishSpinningTop = class extends CandlestickFinder {
      constructor() {
        super();
        this.name = "BearishSpinningTop";
        this.requiredCount = 1;
      }
      logic(data) {
        let daysOpen = data.open[0];
        let daysClose = data.close[0];
        let daysHigh = data.high[0];
        let daysLow = data.low[0];
        let bodyLength = Math.abs(daysClose - daysOpen);
        let upperShadowLength = Math.abs(daysHigh - daysOpen);
        let lowerShadowLength = Math.abs(daysHigh - daysLow);
        let isBearishSpinningTop = bodyLength < upperShadowLength && bodyLength < lowerShadowLength;
        return isBearishSpinningTop;
      }
    };
    function bearishspinningtop(data) {
      return new BearishSpinningTop().hasPattern(data);
    }
    function fibonacciretracement(start, end) {
      let levels = [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 127.2, 161.8, 261.8, 423.6];
      let retracements;
      if (start < end) {
        retracements = levels.map(function(level) {
          let calculated = end - Math.abs(start - end) * level / 100;
          return calculated > 0 ? calculated : 0;
        });
      } else {
        retracements = levels.map(function(level) {
          let calculated = end + Math.abs(start - end) * level / 100;
          return calculated > 0 ? calculated : 0;
        });
      }
      return retracements;
    }
    var IchimokuCloud = class extends Indicator {
      constructor(input) {
        super(input);
        this.result = [];
        var defaults = {
          conversionPeriod: 9,
          basePeriod: 26,
          spanPeriod: 52,
          displacement: 26
        };
        var params = Object.assign({}, defaults, input);
        var currentConversionData = new FixedSizeLinkedList(params.conversionPeriod * 2, true, true, false);
        var currentBaseData = new FixedSizeLinkedList(params.basePeriod * 2, true, true, false);
        var currenSpanData = new FixedSizeLinkedList(params.spanPeriod * 2, true, true, false);
        this.generator = function* () {
          let result;
          let tick;
          let period = Math.max(params.conversionPeriod, params.basePeriod, params.spanPeriod, params.displacement);
          let periodCounter = 1;
          tick = yield;
          while (true) {
            currentConversionData.push(tick.high);
            currentConversionData.push(tick.low);
            currentBaseData.push(tick.high);
            currentBaseData.push(tick.low);
            currenSpanData.push(tick.high);
            currenSpanData.push(tick.low);
            if (periodCounter < period) {
              periodCounter++;
            } else {
              let conversionLine = (currentConversionData.periodHigh + currentConversionData.periodLow) / 2;
              let baseLine = (currentBaseData.periodHigh + currentBaseData.periodLow) / 2;
              let spanA = (conversionLine + baseLine) / 2;
              let spanB = (currenSpanData.periodHigh + currenSpanData.periodLow) / 2;
              result = {
                conversion: conversionLine,
                base: baseLine,
                spanA,
                spanB
              };
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        input.low.forEach((tick, index) => {
          var result = this.generator.next({
            high: input.high[index],
            low: input.low[index]
          });
          if (result.value) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        return this.generator.next(price).value;
      }
    };
    IchimokuCloud.calculate = ichimokucloud;
    function ichimokucloud(input) {
      Indicator.reverseInputs(input);
      var result = new IchimokuCloud(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var KeltnerChannelsInput = class extends IndicatorInput {
      constructor() {
        super(...arguments);
        this.maPeriod = 20;
        this.atrPeriod = 10;
        this.useSMA = false;
        this.multiplier = 1;
      }
    };
    var KeltnerChannelsOutput = class extends IndicatorInput {
    };
    var KeltnerChannels = class extends Indicator {
      constructor(input) {
        super(input);
        var maType = input.useSMA ? SMA : EMA;
        var maProducer = new maType({ period: input.maPeriod, values: [], format: (v) => {
          return v;
        } });
        var atrProducer = new ATR({ period: input.atrPeriod, high: [], low: [], close: [], format: (v) => {
          return v;
        } });
        var tick;
        this.result = [];
        this.generator = function* () {
          var KeltnerChannelsOutput2;
          var result;
          tick = yield;
          while (true) {
            var { close } = tick;
            var ma = maProducer.nextValue(close);
            var atr$$1 = atrProducer.nextValue(tick);
            if (ma != void 0 && atr$$1 != void 0) {
              result = {
                middle: ma,
                upper: ma + input.multiplier * atr$$1,
                lower: ma - input.multiplier * atr$$1
              };
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        var highs = input.high;
        highs.forEach((tickHigh, index) => {
          var tickInput = {
            high: tickHigh,
            low: input.low[index],
            close: input.close[index]
          };
          var result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return result.value;
        }
      }
    };
    KeltnerChannels.calculate = keltnerchannels;
    function keltnerchannels(input) {
      Indicator.reverseInputs(input);
      var result = new KeltnerChannels(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var ChandelierExitInput = class extends IndicatorInput {
      constructor() {
        super(...arguments);
        this.period = 22;
        this.multiplier = 3;
      }
    };
    var ChandelierExitOutput = class extends IndicatorInput {
    };
    var ChandelierExit = class extends Indicator {
      constructor(input) {
        super(input);
        var highs = input.high;
        var lows = input.low;
        var closes = input.close;
        this.result = [];
        var atrProducer = new ATR({ period: input.period, high: [], low: [], close: [], format: (v) => {
          return v;
        } });
        var dataCollector = new FixedSizeLinkedList(input.period * 2, true, true, false);
        this.generator = function* () {
          var result;
          var tick = yield;
          var atr$$1;
          while (true) {
            var { high, low } = tick;
            dataCollector.push(high);
            dataCollector.push(low);
            atr$$1 = atrProducer.nextValue(tick);
            if (dataCollector.totalPushed >= 2 * input.period && atr$$1 != void 0) {
              result = {
                exitLong: dataCollector.periodHigh - atr$$1 * input.multiplier,
                exitShort: dataCollector.periodLow + atr$$1 * input.multiplier
              };
            }
            tick = yield result;
          }
        }();
        this.generator.next();
        highs.forEach((tickHigh, index) => {
          var tickInput = {
            high: tickHigh,
            low: lows[index],
            close: closes[index]
          };
          var result = this.generator.next(tickInput);
          if (result.value != void 0) {
            this.result.push(result.value);
          }
        });
      }
      nextValue(price) {
        var result = this.generator.next(price);
        if (result.value != void 0) {
          return result.value;
        }
      }
    };
    ChandelierExit.calculate = chandelierexit;
    function chandelierexit(input) {
      Indicator.reverseInputs(input);
      var result = new ChandelierExit(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var CrossUp = class extends Indicator {
      constructor(input) {
        super(input);
        this.lineA = input.lineA;
        this.lineB = input.lineB;
        var currentLineA = [];
        var currentLineB = [];
        const genFn = function* () {
          var current = yield;
          var result = false;
          while (true) {
            currentLineA.unshift(current.valueA);
            currentLineB.unshift(current.valueB);
            result = current.valueA > current.valueB;
            var pointer = 1;
            while (result === true && currentLineA[pointer] >= currentLineB[pointer]) {
              if (currentLineA[pointer] > currentLineB[pointer]) {
                result = false;
              } else if (currentLineA[pointer] < currentLineB[pointer]) {
                result = true;
              } else if (currentLineA[pointer] === currentLineB[pointer]) {
                pointer += 1;
              }
            }
            if (result === true) {
              currentLineA = [current.valueA];
              currentLineB = [current.valueB];
            }
            current = yield result;
          }
        };
        this.generator = genFn();
        this.generator.next();
        this.result = [];
        this.lineA.forEach((value, index) => {
          var result = this.generator.next({
            valueA: this.lineA[index],
            valueB: this.lineB[index]
          });
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      static reverseInputs(input) {
        if (input.reversedInput) {
          input.lineA ? input.lineA.reverse() : void 0;
          input.lineB ? input.lineB.reverse() : void 0;
        }
      }
      nextValue(valueA, valueB) {
        return this.generator.next({
          valueA,
          valueB
        }).value;
      }
    };
    CrossUp.calculate = crossUp;
    function crossUp(input) {
      Indicator.reverseInputs(input);
      var result = new CrossUp(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    var CrossDown = class extends Indicator {
      constructor(input) {
        super(input);
        this.lineA = input.lineA;
        this.lineB = input.lineB;
        var currentLineA = [];
        var currentLineB = [];
        const genFn = function* () {
          var current = yield;
          var result = false;
          while (true) {
            currentLineA.unshift(current.valueA);
            currentLineB.unshift(current.valueB);
            result = current.valueA < current.valueB;
            var pointer = 1;
            while (result === true && currentLineA[pointer] <= currentLineB[pointer]) {
              if (currentLineA[pointer] < currentLineB[pointer]) {
                result = false;
              } else if (currentLineA[pointer] > currentLineB[pointer]) {
                result = true;
              } else if (currentLineA[pointer] === currentLineB[pointer]) {
                pointer += 1;
              }
            }
            if (result === true) {
              currentLineA = [current.valueA];
              currentLineB = [current.valueB];
            }
            current = yield result;
          }
        };
        this.generator = genFn();
        this.generator.next();
        this.result = [];
        this.lineA.forEach((value, index) => {
          var result = this.generator.next({
            valueA: this.lineA[index],
            valueB: this.lineB[index]
          });
          if (result.value !== void 0) {
            this.result.push(result.value);
          }
        });
      }
      static reverseInputs(input) {
        if (input.reversedInput) {
          input.lineA ? input.lineA.reverse() : void 0;
          input.lineB ? input.lineB.reverse() : void 0;
        }
      }
      nextValue(valueA, valueB) {
        return this.generator.next({
          valueA,
          valueB
        }).value;
      }
    };
    CrossDown.calculate = crossDown;
    function crossDown(input) {
      Indicator.reverseInputs(input);
      var result = new CrossDown(input).result;
      if (input.reversedInput) {
        result.reverse();
      }
      Indicator.reverseInputs(input);
      return result;
    }
    function getAvailableIndicators() {
      let AvailableIndicators2 = [];
      AvailableIndicators2.push("sma");
      AvailableIndicators2.push("ema");
      AvailableIndicators2.push("wma");
      AvailableIndicators2.push("wema");
      AvailableIndicators2.push("macd");
      AvailableIndicators2.push("rsi");
      AvailableIndicators2.push("bollingerbands");
      AvailableIndicators2.push("adx");
      AvailableIndicators2.push("atr");
      AvailableIndicators2.push("truerange");
      AvailableIndicators2.push("roc");
      AvailableIndicators2.push("kst");
      AvailableIndicators2.push("psar");
      AvailableIndicators2.push("stochastic");
      AvailableIndicators2.push("williamsr");
      AvailableIndicators2.push("adl");
      AvailableIndicators2.push("obv");
      AvailableIndicators2.push("trix");
      AvailableIndicators2.push("cci");
      AvailableIndicators2.push("awesomeoscillator");
      AvailableIndicators2.push("forceindex");
      AvailableIndicators2.push("vwap");
      AvailableIndicators2.push("volumeprofile");
      AvailableIndicators2.push("renko");
      AvailableIndicators2.push("heikinashi");
      AvailableIndicators2.push("stochasticrsi");
      AvailableIndicators2.push("mfi");
      AvailableIndicators2.push("averagegain");
      AvailableIndicators2.push("averageloss");
      AvailableIndicators2.push("highest");
      AvailableIndicators2.push("lowest");
      AvailableIndicators2.push("sum");
      AvailableIndicators2.push("FixedSizeLinkedList");
      AvailableIndicators2.push("sd");
      AvailableIndicators2.push("bullish");
      AvailableIndicators2.push("bearish");
      AvailableIndicators2.push("abandonedbaby");
      AvailableIndicators2.push("doji");
      AvailableIndicators2.push("bearishengulfingpattern");
      AvailableIndicators2.push("bullishengulfingpattern");
      AvailableIndicators2.push("darkcloudcover");
      AvailableIndicators2.push("downsidetasukigap");
      AvailableIndicators2.push("dragonflydoji");
      AvailableIndicators2.push("gravestonedoji");
      AvailableIndicators2.push("bullishharami");
      AvailableIndicators2.push("bearishharami");
      AvailableIndicators2.push("bullishharamicross");
      AvailableIndicators2.push("bearishharamicross");
      AvailableIndicators2.push("eveningdojistar");
      AvailableIndicators2.push("eveningstar");
      AvailableIndicators2.push("morningdojistar");
      AvailableIndicators2.push("morningstar");
      AvailableIndicators2.push("bullishmarubozu");
      AvailableIndicators2.push("bearishmarubozu");
      AvailableIndicators2.push("piercingline");
      AvailableIndicators2.push("bullishspinningtop");
      AvailableIndicators2.push("bearishspinningtop");
      AvailableIndicators2.push("threeblackcrows");
      AvailableIndicators2.push("threewhitesoldiers");
      AvailableIndicators2.push("bullishhammerstick");
      AvailableIndicators2.push("bearishhammerstick");
      AvailableIndicators2.push("bullishinvertedhammerstick");
      AvailableIndicators2.push("bearishinvertedhammerstick");
      AvailableIndicators2.push("hammerpattern");
      AvailableIndicators2.push("hammerpatternunconfirmed");
      AvailableIndicators2.push("hangingman");
      AvailableIndicators2.push("hangingmanunconfirmed");
      AvailableIndicators2.push("shootingstar");
      AvailableIndicators2.push("shootingstarunconfirmed");
      AvailableIndicators2.push("tweezertop");
      AvailableIndicators2.push("tweezerbottom");
      AvailableIndicators2.push("ichimokucloud");
      AvailableIndicators2.push("keltnerchannels");
      AvailableIndicators2.push("chandelierexit");
      AvailableIndicators2.push("crossup");
      AvailableIndicators2.push("crossdown");
      AvailableIndicators2.push("crossover");
      return AvailableIndicators2;
    }
    var AvailableIndicators = getAvailableIndicators();
    exports2.getAvailableIndicators = getAvailableIndicators;
    exports2.AvailableIndicators = AvailableIndicators;
    exports2.FixedSizeLinkedList = FixedSizeLinkedList;
    exports2.CandleData = CandleData;
    exports2.CandleList = CandleList;
    exports2.sma = sma;
    exports2.SMA = SMA;
    exports2.ema = ema;
    exports2.EMA = EMA;
    exports2.wma = wma;
    exports2.WMA = WMA;
    exports2.wema = wema;
    exports2.WEMA = WEMA;
    exports2.macd = macd;
    exports2.MACD = MACD;
    exports2.rsi = rsi;
    exports2.RSI = RSI;
    exports2.bollingerbands = bollingerbands;
    exports2.BollingerBands = BollingerBands;
    exports2.adx = adx;
    exports2.ADX = ADX;
    exports2.atr = atr;
    exports2.ATR = ATR;
    exports2.truerange = truerange;
    exports2.TrueRange = TrueRange;
    exports2.roc = roc;
    exports2.ROC = ROC;
    exports2.kst = kst;
    exports2.KST = KST;
    exports2.psar = psar;
    exports2.PSAR = PSAR;
    exports2.stochastic = stochastic;
    exports2.Stochastic = Stochastic;
    exports2.williamsr = williamsr;
    exports2.WilliamsR = WilliamsR;
    exports2.adl = adl;
    exports2.ADL = ADL;
    exports2.obv = obv;
    exports2.OBV = OBV;
    exports2.trix = trix;
    exports2.TRIX = TRIX;
    exports2.forceindex = forceindex;
    exports2.ForceIndex = ForceIndex;
    exports2.cci = cci;
    exports2.CCI = CCI;
    exports2.awesomeoscillator = awesomeoscillator;
    exports2.AwesomeOscillator = AwesomeOscillator;
    exports2.vwap = vwap;
    exports2.VWAP = VWAP;
    exports2.volumeprofile = volumeprofile;
    exports2.VolumeProfile = VolumeProfile;
    exports2.mfi = mfi;
    exports2.MFI = MFI;
    exports2.stochasticrsi = stochasticrsi;
    exports2.StochasticRSI = StochasticRSI;
    exports2.averagegain = averagegain;
    exports2.AverageGain = AverageGain;
    exports2.averageloss = averageloss;
    exports2.AverageLoss = AverageLoss;
    exports2.sd = sd;
    exports2.SD = SD;
    exports2.highest = highest;
    exports2.Highest = Highest;
    exports2.lowest = lowest;
    exports2.Lowest = Lowest;
    exports2.sum = sum;
    exports2.Sum = Sum;
    exports2.renko = renko;
    exports2.HeikinAshi = HeikinAshi;
    exports2.heikinashi = heikinashi;
    exports2.bullish = bullish;
    exports2.bearish = bearish;
    exports2.abandonedbaby = abandonedbaby;
    exports2.doji = doji;
    exports2.bearishengulfingpattern = bearishengulfingpattern;
    exports2.bullishengulfingpattern = bullishengulfingpattern;
    exports2.darkcloudcover = darkcloudcover;
    exports2.downsidetasukigap = downsidetasukigap;
    exports2.dragonflydoji = dragonflydoji;
    exports2.gravestonedoji = gravestonedoji;
    exports2.bullishharami = bullishharami;
    exports2.bearishharami = bearishharami;
    exports2.bullishharamicross = bullishharamicross;
    exports2.bearishharamicross = bearishharamicross;
    exports2.eveningdojistar = eveningdojistar;
    exports2.eveningstar = eveningstar;
    exports2.morningdojistar = morningdojistar;
    exports2.morningstar = morningstar;
    exports2.bullishmarubozu = bullishmarubozu;
    exports2.bearishmarubozu = bearishmarubozu;
    exports2.piercingline = piercingline;
    exports2.bullishspinningtop = bullishspinningtop;
    exports2.bearishspinningtop = bearishspinningtop;
    exports2.threeblackcrows = threeblackcrows;
    exports2.threewhitesoldiers = threewhitesoldiers;
    exports2.bullishhammerstick = bullishhammerstick;
    exports2.bearishhammerstick = bearishhammerstick;
    exports2.bullishinvertedhammerstick = bullishinvertedhammerstick;
    exports2.bearishinvertedhammerstick = bearishinvertedhammerstick;
    exports2.hammerpattern = hammerpattern;
    exports2.hammerpatternunconfirmed = hammerpatternunconfirmed;
    exports2.hangingman = hangingman;
    exports2.hangingmanunconfirmed = hangingmanunconfirmed;
    exports2.shootingstar = shootingstar;
    exports2.shootingstarunconfirmed = shootingstarunconfirmed;
    exports2.tweezertop = tweezertop;
    exports2.tweezerbottom = tweezerbottom;
    exports2.fibonacciretracement = fibonacciretracement;
    exports2.ichimokucloud = ichimokucloud;
    exports2.IchimokuCloud = IchimokuCloud;
    exports2.keltnerchannels = keltnerchannels;
    exports2.KeltnerChannels = KeltnerChannels;
    exports2.KeltnerChannelsInput = KeltnerChannelsInput;
    exports2.KeltnerChannelsOutput = KeltnerChannelsOutput;
    exports2.chandelierexit = chandelierexit;
    exports2.ChandelierExit = ChandelierExit;
    exports2.ChandelierExitInput = ChandelierExitInput;
    exports2.ChandelierExitOutput = ChandelierExitOutput;
    exports2.crossUp = crossUp;
    exports2.CrossUp = CrossUp;
    exports2.crossDown = crossDown;
    exports2.CrossDown = CrossDown;
    exports2.setConfig = setConfig;
    exports2.getConfig = getConfig;
  }
});

// node_modules/supertrend/build/supertrend.js
var require_supertrend = __commonJS({
  "node_modules/supertrend/build/supertrend.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.supertrend = void 0;
    var technicalindicators_1 = require_dist();
    function supertrend2({ initialArray, period = 10, multiplier = 3 }) {
      const v = {
        high: [],
        low: [],
        close: [],
        period
      };
      for (let i2 = 0; i2 < initialArray.length; i2++) {
        v.high.push(initialArray[i2].high);
        v.low.push(initialArray[i2].low);
        v.close.push(initialArray[i2].close);
      }
      const atr = technicalindicators_1.ATR.calculate(v);
      const r2 = [...initialArray];
      for (let i2 = 0; i2 < period; i2++) {
        r2.shift();
      }
      const basicUpperBand = [];
      const basicLowerBand = [];
      for (let i2 = 0; i2 < r2.length; i2++) {
        basicUpperBand.push((r2[i2].high + r2[i2].low) / 2 + multiplier * atr[i2]);
        basicLowerBand.push((r2[i2].high + r2[i2].low) / 2 - multiplier * atr[i2]);
      }
      const finalUpperBand = [];
      const finalLowerBand = [];
      let previousFinalUpperBand = 0;
      let previousFinalLowerBand = 0;
      for (let i2 = 0; i2 < r2.length; i2++) {
        if (basicUpperBand[i2] < previousFinalUpperBand || r2[i2 - 1] && r2[i2 - 1].close > previousFinalUpperBand) {
          finalUpperBand.push(basicUpperBand[i2]);
        } else {
          finalUpperBand.push(previousFinalUpperBand);
        }
        if (basicLowerBand[i2] > previousFinalLowerBand || r2[i2 - 1] && r2[i2 - 1].close < previousFinalLowerBand) {
          finalLowerBand.push(basicLowerBand[i2]);
        } else {
          finalLowerBand.push(previousFinalLowerBand);
        }
        previousFinalUpperBand = finalUpperBand[i2];
        previousFinalLowerBand = finalLowerBand[i2];
      }
      const superTrend = [];
      let previousSuperTrend = 0;
      for (let i2 = 0; i2 < r2.length; i2++) {
        let nowSuperTrend = 0;
        if (previousSuperTrend == finalUpperBand[i2 - 1] && r2[i2].close <= finalUpperBand[i2]) {
          nowSuperTrend = finalUpperBand[i2];
        } else if (previousSuperTrend == finalUpperBand[i2 - 1] && r2[i2].close > finalUpperBand[i2]) {
          nowSuperTrend = finalLowerBand[i2];
        } else if (previousSuperTrend == finalLowerBand[i2 - 1] && r2[i2].close >= finalLowerBand[i2]) {
          nowSuperTrend = finalLowerBand[i2];
        } else if (previousSuperTrend == finalLowerBand[i2 - 1] && r2[i2].close < finalLowerBand[i2]) {
          nowSuperTrend = finalUpperBand[i2];
        }
        superTrend.push(nowSuperTrend);
        previousSuperTrend = superTrend[i2];
      }
      return superTrend;
    }
    exports2.supertrend = supertrend2;
  }
});

// node_modules/supertrend/build/index.js
var require_build = __commonJS({
  "node_modules/supertrend/build/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m2[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m2, exports3) {
      for (var p in m2) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m2, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_supertrend(), exports2);
  }
});

// node_modules/web-streams-polyfill/dist/ponyfill.es2018.js
var require_ponyfill_es2018 = __commonJS({
  "node_modules/web-streams-polyfill/dist/ponyfill.es2018.js"(exports2, module2) {
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.WebStreamsPolyfill = {}));
    })(exports2, function(exports3) {
      "use strict";
      function noop2() {
        return void 0;
      }
      function typeIsObject(x2) {
        return typeof x2 === "object" && x2 !== null || typeof x2 === "function";
      }
      const rethrowAssertionErrorRejection = noop2;
      function setFunctionName(fn, name) {
        try {
          Object.defineProperty(fn, "name", {
            value: name,
            configurable: true
          });
        } catch (_a2) {
        }
      }
      const originalPromise = Promise;
      const originalPromiseThen = Promise.prototype.then;
      const originalPromiseReject = Promise.reject.bind(originalPromise);
      function newPromise(executor) {
        return new originalPromise(executor);
      }
      function promiseResolvedWith(value) {
        return newPromise((resolve) => resolve(value));
      }
      function promiseRejectedWith(reason) {
        return originalPromiseReject(reason);
      }
      function PerformPromiseThen(promise, onFulfilled, onRejected) {
        return originalPromiseThen.call(promise, onFulfilled, onRejected);
      }
      function uponPromise(promise, onFulfilled, onRejected) {
        PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
      }
      function uponFulfillment(promise, onFulfilled) {
        uponPromise(promise, onFulfilled);
      }
      function uponRejection(promise, onRejected) {
        uponPromise(promise, void 0, onRejected);
      }
      function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
        return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
      }
      function setPromiseIsHandledToTrue(promise) {
        PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
      }
      let _queueMicrotask = (callback) => {
        if (typeof queueMicrotask === "function") {
          _queueMicrotask = queueMicrotask;
        } else {
          const resolvedPromise = promiseResolvedWith(void 0);
          _queueMicrotask = (cb) => PerformPromiseThen(resolvedPromise, cb);
        }
        return _queueMicrotask(callback);
      };
      function reflectCall(F2, V, args) {
        if (typeof F2 !== "function") {
          throw new TypeError("Argument is not a function");
        }
        return Function.prototype.apply.call(F2, V, args);
      }
      function promiseCall(F2, V, args) {
        try {
          return promiseResolvedWith(reflectCall(F2, V, args));
        } catch (value) {
          return promiseRejectedWith(value);
        }
      }
      const QUEUE_MAX_ARRAY_SIZE = 16384;
      class SimpleQueue {
        constructor() {
          this._cursor = 0;
          this._size = 0;
          this._front = {
            _elements: [],
            _next: void 0
          };
          this._back = this._front;
          this._cursor = 0;
          this._size = 0;
        }
        get length() {
          return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(element) {
          const oldBack = this._back;
          let newBack = oldBack;
          if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
            newBack = {
              _elements: [],
              _next: void 0
            };
          }
          oldBack._elements.push(element);
          if (newBack !== oldBack) {
            this._back = newBack;
            oldBack._next = newBack;
          }
          ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() {
          const oldFront = this._front;
          let newFront = oldFront;
          const oldCursor = this._cursor;
          let newCursor = oldCursor + 1;
          const elements = oldFront._elements;
          const element = elements[oldCursor];
          if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
            newFront = oldFront._next;
            newCursor = 0;
          }
          --this._size;
          this._cursor = newCursor;
          if (oldFront !== newFront) {
            this._front = newFront;
          }
          elements[oldCursor] = void 0;
          return element;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(callback) {
          let i2 = this._cursor;
          let node = this._front;
          let elements = node._elements;
          while (i2 !== elements.length || node._next !== void 0) {
            if (i2 === elements.length) {
              node = node._next;
              elements = node._elements;
              i2 = 0;
              if (elements.length === 0) {
                break;
              }
            }
            callback(elements[i2]);
            ++i2;
          }
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() {
          const front = this._front;
          const cursor = this._cursor;
          return front._elements[cursor];
        }
      }
      const AbortSteps = Symbol("[[AbortSteps]]");
      const ErrorSteps = Symbol("[[ErrorSteps]]");
      const CancelSteps = Symbol("[[CancelSteps]]");
      const PullSteps = Symbol("[[PullSteps]]");
      const ReleaseSteps = Symbol("[[ReleaseSteps]]");
      function ReadableStreamReaderGenericInitialize(reader, stream) {
        reader._ownerReadableStream = stream;
        stream._reader = reader;
        if (stream._state === "readable") {
          defaultReaderClosedPromiseInitialize(reader);
        } else if (stream._state === "closed") {
          defaultReaderClosedPromiseInitializeAsResolved(reader);
        } else {
          defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
        }
      }
      function ReadableStreamReaderGenericCancel(reader, reason) {
        const stream = reader._ownerReadableStream;
        return ReadableStreamCancel(stream, reason);
      }
      function ReadableStreamReaderGenericRelease(reader) {
        const stream = reader._ownerReadableStream;
        if (stream._state === "readable") {
          defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        } else {
          defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        }
        stream._readableStreamController[ReleaseSteps]();
        stream._reader = void 0;
        reader._ownerReadableStream = void 0;
      }
      function readerLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released reader");
      }
      function defaultReaderClosedPromiseInitialize(reader) {
        reader._closedPromise = newPromise((resolve, reject) => {
          reader._closedPromise_resolve = resolve;
          reader._closedPromise_reject = reject;
        });
      }
      function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseReject(reader, reason);
      }
      function defaultReaderClosedPromiseInitializeAsResolved(reader) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseResolve(reader);
      }
      function defaultReaderClosedPromiseReject(reader, reason) {
        if (reader._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(reader._closedPromise);
        reader._closedPromise_reject(reason);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      function defaultReaderClosedPromiseResetToRejected(reader, reason) {
        defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
      }
      function defaultReaderClosedPromiseResolve(reader) {
        if (reader._closedPromise_resolve === void 0) {
          return;
        }
        reader._closedPromise_resolve(void 0);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      const NumberIsFinite = Number.isFinite || function(x2) {
        return typeof x2 === "number" && isFinite(x2);
      };
      const MathTrunc = Math.trunc || function(v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
      };
      function isDictionary(x2) {
        return typeof x2 === "object" || typeof x2 === "function";
      }
      function assertDictionary(obj, context) {
        if (obj !== void 0 && !isDictionary(obj)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertFunction(x2, context) {
        if (typeof x2 !== "function") {
          throw new TypeError(`${context} is not a function.`);
        }
      }
      function isObject(x2) {
        return typeof x2 === "object" && x2 !== null || typeof x2 === "function";
      }
      function assertObject(x2, context) {
        if (!isObject(x2)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertRequiredArgument(x2, position, context) {
        if (x2 === void 0) {
          throw new TypeError(`Parameter ${position} is required in '${context}'.`);
        }
      }
      function assertRequiredField(x2, field, context) {
        if (x2 === void 0) {
          throw new TypeError(`${field} is required in '${context}'.`);
        }
      }
      function convertUnrestrictedDouble(value) {
        return Number(value);
      }
      function censorNegativeZero(x2) {
        return x2 === 0 ? 0 : x2;
      }
      function integerPart(x2) {
        return censorNegativeZero(MathTrunc(x2));
      }
      function convertUnsignedLongLongWithEnforceRange(value, context) {
        const lowerBound = 0;
        const upperBound = Number.MAX_SAFE_INTEGER;
        let x2 = Number(value);
        x2 = censorNegativeZero(x2);
        if (!NumberIsFinite(x2)) {
          throw new TypeError(`${context} is not a finite number`);
        }
        x2 = integerPart(x2);
        if (x2 < lowerBound || x2 > upperBound) {
          throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
        }
        if (!NumberIsFinite(x2) || x2 === 0) {
          return 0;
        }
        return x2;
      }
      function assertReadableStream(x2, context) {
        if (!IsReadableStream(x2)) {
          throw new TypeError(`${context} is not a ReadableStream.`);
        }
      }
      function AcquireReadableStreamDefaultReader(stream) {
        return new ReadableStreamDefaultReader(stream);
      }
      function ReadableStreamAddReadRequest(stream, readRequest) {
        stream._reader._readRequests.push(readRequest);
      }
      function ReadableStreamFulfillReadRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readRequest = reader._readRequests.shift();
        if (done) {
          readRequest._closeSteps();
        } else {
          readRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadRequests(stream) {
        return stream._reader._readRequests.length;
      }
      function ReadableStreamHasDefaultReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamDefaultReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamDefaultReader {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("read"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: () => resolvePromise({ value: void 0, done: true }),
            _errorSteps: (e2) => rejectPromise(e2)
          };
          ReadableStreamDefaultReaderRead(this, readRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamDefaultReader(this)) {
            throw defaultReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          ReadableStreamDefaultReaderRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamDefaultReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      setFunctionName(ReadableStreamDefaultReader.prototype.cancel, "cancel");
      setFunctionName(ReadableStreamDefaultReader.prototype.read, "read");
      setFunctionName(ReadableStreamDefaultReader.prototype.releaseLock, "releaseLock");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultReader.prototype, Symbol.toStringTag, {
          value: "ReadableStreamDefaultReader",
          configurable: true
        });
      }
      function IsReadableStreamDefaultReader(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readRequests")) {
          return false;
        }
        return x2 instanceof ReadableStreamDefaultReader;
      }
      function ReadableStreamDefaultReaderRead(reader, readRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "closed") {
          readRequest._closeSteps();
        } else if (stream._state === "errored") {
          readRequest._errorSteps(stream._storedError);
        } else {
          stream._readableStreamController[PullSteps](readRequest);
        }
      }
      function ReadableStreamDefaultReaderRelease(reader) {
        ReadableStreamReaderGenericRelease(reader);
        const e2 = new TypeError("Reader was released");
        ReadableStreamDefaultReaderErrorReadRequests(reader, e2);
      }
      function ReadableStreamDefaultReaderErrorReadRequests(reader, e2) {
        const readRequests = reader._readRequests;
        reader._readRequests = new SimpleQueue();
        readRequests.forEach((readRequest) => {
          readRequest._errorSteps(e2);
        });
      }
      function defaultReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
      }
      const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype);
      class ReadableStreamAsyncIteratorImpl {
        constructor(reader, preventCancel) {
          this._ongoingPromise = void 0;
          this._isFinished = false;
          this._reader = reader;
          this._preventCancel = preventCancel;
        }
        next() {
          const nextSteps = () => this._nextSteps();
          this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
          return this._ongoingPromise;
        }
        return(value) {
          const returnSteps = () => this._returnSteps(value);
          return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
        }
        _nextSteps() {
          if (this._isFinished) {
            return Promise.resolve({ value: void 0, done: true });
          }
          const reader = this._reader;
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => {
              this._ongoingPromise = void 0;
              _queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
            },
            _closeSteps: () => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              resolvePromise({ value: void 0, done: true });
            },
            _errorSteps: (reason) => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              rejectPromise(reason);
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promise;
        }
        _returnSteps(value) {
          if (this._isFinished) {
            return Promise.resolve({ value, done: true });
          }
          this._isFinished = true;
          const reader = this._reader;
          if (!this._preventCancel) {
            const result = ReadableStreamReaderGenericCancel(reader, value);
            ReadableStreamReaderGenericRelease(reader);
            return transformPromiseWith(result, () => ({ value, done: true }));
          }
          ReadableStreamReaderGenericRelease(reader);
          return promiseResolvedWith({ value, done: true });
        }
      }
      const ReadableStreamAsyncIteratorPrototype = {
        next() {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
          }
          return this._asyncIteratorImpl.next();
        },
        return(value) {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
          }
          return this._asyncIteratorImpl.return(value);
        }
      };
      Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
      function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
        const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
        iterator._asyncIteratorImpl = impl;
        return iterator;
      }
      function IsReadableStreamAsyncIterator(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_asyncIteratorImpl")) {
          return false;
        }
        try {
          return x2._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
        } catch (_a2) {
          return false;
        }
      }
      function streamAsyncIteratorBrandCheckException(name) {
        return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
      }
      const NumberIsNaN = Number.isNaN || function(x2) {
        return x2 !== x2;
      };
      var _a, _b, _c;
      function CreateArrayFromList(elements) {
        return elements.slice();
      }
      function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
        new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset);
      }
      let TransferArrayBuffer = (O) => {
        if (typeof O.transfer === "function") {
          TransferArrayBuffer = (buffer) => buffer.transfer();
        } else if (typeof structuredClone === "function") {
          TransferArrayBuffer = (buffer) => structuredClone(buffer, { transfer: [buffer] });
        } else {
          TransferArrayBuffer = (buffer) => buffer;
        }
        return TransferArrayBuffer(O);
      };
      let IsDetachedBuffer = (O) => {
        if (typeof O.detached === "boolean") {
          IsDetachedBuffer = (buffer) => buffer.detached;
        } else {
          IsDetachedBuffer = (buffer) => buffer.byteLength === 0;
        }
        return IsDetachedBuffer(O);
      };
      function ArrayBufferSlice(buffer, begin, end) {
        if (buffer.slice) {
          return buffer.slice(begin, end);
        }
        const length = end - begin;
        const slice = new ArrayBuffer(length);
        CopyDataBlockBytes(slice, 0, buffer, begin, length);
        return slice;
      }
      function GetMethod(receiver, prop) {
        const func = receiver[prop];
        if (func === void 0 || func === null) {
          return void 0;
        }
        if (typeof func !== "function") {
          throw new TypeError(`${String(prop)} is not a function`);
        }
        return func;
      }
      function CreateAsyncFromSyncIterator(syncIteratorRecord) {
        const syncIterable = {
          [Symbol.iterator]: () => syncIteratorRecord.iterator
        };
        const asyncIterator = async function* () {
          return yield* syncIterable;
        }();
        const nextMethod = asyncIterator.next;
        return { iterator: asyncIterator, nextMethod, done: false };
      }
      const SymbolAsyncIterator = (_c = (_a = Symbol.asyncIterator) !== null && _a !== void 0 ? _a : (_b = Symbol.for) === null || _b === void 0 ? void 0 : _b.call(Symbol, "Symbol.asyncIterator")) !== null && _c !== void 0 ? _c : "@@asyncIterator";
      function GetIterator(obj, hint = "sync", method) {
        if (method === void 0) {
          if (hint === "async") {
            method = GetMethod(obj, SymbolAsyncIterator);
            if (method === void 0) {
              const syncMethod = GetMethod(obj, Symbol.iterator);
              const syncIteratorRecord = GetIterator(obj, "sync", syncMethod);
              return CreateAsyncFromSyncIterator(syncIteratorRecord);
            }
          } else {
            method = GetMethod(obj, Symbol.iterator);
          }
        }
        if (method === void 0) {
          throw new TypeError("The object is not iterable");
        }
        const iterator = reflectCall(method, obj, []);
        if (!typeIsObject(iterator)) {
          throw new TypeError("The iterator method must return an object");
        }
        const nextMethod = iterator.next;
        return { iterator, nextMethod, done: false };
      }
      function IteratorNext(iteratorRecord) {
        const result = reflectCall(iteratorRecord.nextMethod, iteratorRecord.iterator, []);
        if (!typeIsObject(result)) {
          throw new TypeError("The iterator.next() method must return an object");
        }
        return result;
      }
      function IteratorComplete(iterResult) {
        return Boolean(iterResult.done);
      }
      function IteratorValue(iterResult) {
        return iterResult.value;
      }
      function IsNonNegativeNumber(v) {
        if (typeof v !== "number") {
          return false;
        }
        if (NumberIsNaN(v)) {
          return false;
        }
        if (v < 0) {
          return false;
        }
        return true;
      }
      function CloneAsUint8Array(O) {
        const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
        return new Uint8Array(buffer);
      }
      function DequeueValue(container) {
        const pair = container._queue.shift();
        container._queueTotalSize -= pair.size;
        if (container._queueTotalSize < 0) {
          container._queueTotalSize = 0;
        }
        return pair.value;
      }
      function EnqueueValueWithSize(container, value, size) {
        if (!IsNonNegativeNumber(size) || size === Infinity) {
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        }
        container._queue.push({ value, size });
        container._queueTotalSize += size;
      }
      function PeekQueueValue(container) {
        const pair = container._queue.peek();
        return pair.value;
      }
      function ResetQueue(container) {
        container._queue = new SimpleQueue();
        container._queueTotalSize = 0;
      }
      function isDataViewConstructor(ctor) {
        return ctor === DataView;
      }
      function isDataView(view) {
        return isDataViewConstructor(view.constructor);
      }
      function arrayBufferViewElementSize(ctor) {
        if (isDataViewConstructor(ctor)) {
          return 1;
        }
        return ctor.BYTES_PER_ELEMENT;
      }
      class ReadableStreamBYOBRequest {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("view");
          }
          return this._view;
        }
        respond(bytesWritten) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respond");
          }
          assertRequiredArgument(bytesWritten, 1, "respond");
          bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(this._view.buffer)) {
            throw new TypeError(`The BYOB request's buffer has been detached and so cannot be used as a response`);
          }
          ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
        }
        respondWithNewView(view) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respondWithNewView");
          }
          assertRequiredArgument(view, 1, "respondWithNewView");
          if (!ArrayBuffer.isView(view)) {
            throw new TypeError("You can only respond with array buffer views");
          }
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(view.buffer)) {
            throw new TypeError("The given view's buffer has been detached and so cannot be used as a response");
          }
          ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
        }
      }
      Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
        respond: { enumerable: true },
        respondWithNewView: { enumerable: true },
        view: { enumerable: true }
      });
      setFunctionName(ReadableStreamBYOBRequest.prototype.respond, "respond");
      setFunctionName(ReadableStreamBYOBRequest.prototype.respondWithNewView, "respondWithNewView");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBRequest.prototype, Symbol.toStringTag, {
          value: "ReadableStreamBYOBRequest",
          configurable: true
        });
      }
      class ReadableByteStreamController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("byobRequest");
          }
          return ReadableByteStreamControllerGetBYOBRequest(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("desiredSize");
          }
          return ReadableByteStreamControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("close");
          }
          if (this._closeRequested) {
            throw new TypeError("The stream has already been closed; do not close it again!");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
          }
          ReadableByteStreamControllerClose(this);
        }
        enqueue(chunk) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("enqueue");
          }
          assertRequiredArgument(chunk, 1, "enqueue");
          if (!ArrayBuffer.isView(chunk)) {
            throw new TypeError("chunk must be an array buffer view");
          }
          if (chunk.byteLength === 0) {
            throw new TypeError("chunk must have non-zero byteLength");
          }
          if (chunk.buffer.byteLength === 0) {
            throw new TypeError(`chunk's buffer must have non-zero byteLength`);
          }
          if (this._closeRequested) {
            throw new TypeError("stream is closed or draining");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
          }
          ReadableByteStreamControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e2 = void 0) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("error");
          }
          ReadableByteStreamControllerError(this, e2);
        }
        /** @internal */
        [CancelSteps](reason) {
          ReadableByteStreamControllerClearPendingPullIntos(this);
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableByteStreamControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            ReadableByteStreamControllerFillReadRequestFromQueue(this, readRequest);
            return;
          }
          const autoAllocateChunkSize = this._autoAllocateChunkSize;
          if (autoAllocateChunkSize !== void 0) {
            let buffer;
            try {
              buffer = new ArrayBuffer(autoAllocateChunkSize);
            } catch (bufferE) {
              readRequest._errorSteps(bufferE);
              return;
            }
            const pullIntoDescriptor = {
              buffer,
              bufferByteLength: autoAllocateChunkSize,
              byteOffset: 0,
              byteLength: autoAllocateChunkSize,
              bytesFilled: 0,
              minimumFill: 1,
              elementSize: 1,
              viewConstructor: Uint8Array,
              readerType: "default"
            };
            this._pendingPullIntos.push(pullIntoDescriptor);
          }
          ReadableStreamAddReadRequest(stream, readRequest);
          ReadableByteStreamControllerCallPullIfNeeded(this);
        }
        /** @internal */
        [ReleaseSteps]() {
          if (this._pendingPullIntos.length > 0) {
            const firstPullInto = this._pendingPullIntos.peek();
            firstPullInto.readerType = "none";
            this._pendingPullIntos = new SimpleQueue();
            this._pendingPullIntos.push(firstPullInto);
          }
        }
      }
      Object.defineProperties(ReadableByteStreamController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        byobRequest: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      setFunctionName(ReadableByteStreamController.prototype.close, "close");
      setFunctionName(ReadableByteStreamController.prototype.enqueue, "enqueue");
      setFunctionName(ReadableByteStreamController.prototype.error, "error");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableByteStreamController.prototype, Symbol.toStringTag, {
          value: "ReadableByteStreamController",
          configurable: true
        });
      }
      function IsReadableByteStreamController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledReadableByteStream")) {
          return false;
        }
        return x2 instanceof ReadableByteStreamController;
      }
      function IsReadableStreamBYOBRequest(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_associatedReadableByteStreamController")) {
          return false;
        }
        return x2 instanceof ReadableStreamBYOBRequest;
      }
      function ReadableByteStreamControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
          return null;
        }, (e2) => {
          ReadableByteStreamControllerError(controller, e2);
          return null;
        });
      }
      function ReadableByteStreamControllerClearPendingPullIntos(controller) {
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        controller._pendingPullIntos = new SimpleQueue();
      }
      function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
        let done = false;
        if (stream._state === "closed") {
          done = true;
        }
        const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
        if (pullIntoDescriptor.readerType === "default") {
          ReadableStreamFulfillReadRequest(stream, filledView, done);
        } else {
          ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
        }
      }
      function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
        const bytesFilled = pullIntoDescriptor.bytesFilled;
        const elementSize = pullIntoDescriptor.elementSize;
        return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
      }
      function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
        controller._queue.push({ buffer, byteOffset, byteLength });
        controller._queueTotalSize += byteLength;
      }
      function ReadableByteStreamControllerEnqueueClonedChunkToQueue(controller, buffer, byteOffset, byteLength) {
        let clonedChunk;
        try {
          clonedChunk = ArrayBufferSlice(buffer, byteOffset, byteOffset + byteLength);
        } catch (cloneE) {
          ReadableByteStreamControllerError(controller, cloneE);
          throw cloneE;
        }
        ReadableByteStreamControllerEnqueueChunkToQueue(controller, clonedChunk, 0, byteLength);
      }
      function ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(controller, firstDescriptor) {
        if (firstDescriptor.bytesFilled > 0) {
          ReadableByteStreamControllerEnqueueClonedChunkToQueue(controller, firstDescriptor.buffer, firstDescriptor.byteOffset, firstDescriptor.bytesFilled);
        }
        ReadableByteStreamControllerShiftPendingPullInto(controller);
      }
      function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
        const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
        const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
        let totalBytesToCopyRemaining = maxBytesToCopy;
        let ready = false;
        const remainderBytes = maxBytesFilled % pullIntoDescriptor.elementSize;
        const maxAlignedBytes = maxBytesFilled - remainderBytes;
        if (maxAlignedBytes >= pullIntoDescriptor.minimumFill) {
          totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
          ready = true;
        }
        const queue = controller._queue;
        while (totalBytesToCopyRemaining > 0) {
          const headOfQueue = queue.peek();
          const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
          const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
          if (headOfQueue.byteLength === bytesToCopy) {
            queue.shift();
          } else {
            headOfQueue.byteOffset += bytesToCopy;
            headOfQueue.byteLength -= bytesToCopy;
          }
          controller._queueTotalSize -= bytesToCopy;
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
          totalBytesToCopyRemaining -= bytesToCopy;
        }
        return ready;
      }
      function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
        pullIntoDescriptor.bytesFilled += size;
      }
      function ReadableByteStreamControllerHandleQueueDrain(controller) {
        if (controller._queueTotalSize === 0 && controller._closeRequested) {
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(controller._controlledReadableByteStream);
        } else {
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
      }
      function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
        if (controller._byobRequest === null) {
          return;
        }
        controller._byobRequest._associatedReadableByteStreamController = void 0;
        controller._byobRequest._view = null;
        controller._byobRequest = null;
      }
      function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
        while (controller._pendingPullIntos.length > 0) {
          if (controller._queueTotalSize === 0) {
            return;
          }
          const pullIntoDescriptor = controller._pendingPullIntos.peek();
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerProcessReadRequestsUsingQueue(controller) {
        const reader = controller._controlledReadableByteStream._reader;
        while (reader._readRequests.length > 0) {
          if (controller._queueTotalSize === 0) {
            return;
          }
          const readRequest = reader._readRequests.shift();
          ReadableByteStreamControllerFillReadRequestFromQueue(controller, readRequest);
        }
      }
      function ReadableByteStreamControllerPullInto(controller, view, min, readIntoRequest) {
        const stream = controller._controlledReadableByteStream;
        const ctor = view.constructor;
        const elementSize = arrayBufferViewElementSize(ctor);
        const { byteOffset, byteLength } = view;
        const minimumFill = min * elementSize;
        let buffer;
        try {
          buffer = TransferArrayBuffer(view.buffer);
        } catch (e2) {
          readIntoRequest._errorSteps(e2);
          return;
        }
        const pullIntoDescriptor = {
          buffer,
          bufferByteLength: buffer.byteLength,
          byteOffset,
          byteLength,
          bytesFilled: 0,
          minimumFill,
          elementSize,
          viewConstructor: ctor,
          readerType: "byob"
        };
        if (controller._pendingPullIntos.length > 0) {
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          return;
        }
        if (stream._state === "closed") {
          const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
          readIntoRequest._closeSteps(emptyView);
          return;
        }
        if (controller._queueTotalSize > 0) {
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
            ReadableByteStreamControllerHandleQueueDrain(controller);
            readIntoRequest._chunkSteps(filledView);
            return;
          }
          if (controller._closeRequested) {
            const e2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e2);
            readIntoRequest._errorSteps(e2);
            return;
          }
        }
        controller._pendingPullIntos.push(pullIntoDescriptor);
        ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
        if (firstDescriptor.readerType === "none") {
          ReadableByteStreamControllerShiftPendingPullInto(controller);
        }
        const stream = controller._controlledReadableByteStream;
        if (ReadableStreamHasBYOBReader(stream)) {
          while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
        ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
        if (pullIntoDescriptor.readerType === "none") {
          ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(controller, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          return;
        }
        if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.minimumFill) {
          return;
        }
        ReadableByteStreamControllerShiftPendingPullInto(controller);
        const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
        if (remainderSize > 0) {
          const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          ReadableByteStreamControllerEnqueueClonedChunkToQueue(controller, pullIntoDescriptor.buffer, end - remainderSize, remainderSize);
        }
        pullIntoDescriptor.bytesFilled -= remainderSize;
        ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
      }
      function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor);
        } else {
          ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerShiftPendingPullInto(controller) {
        const descriptor = controller._pendingPullIntos.shift();
        return descriptor;
      }
      function ReadableByteStreamControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return false;
        }
        if (controller._closeRequested) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableByteStreamControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
      }
      function ReadableByteStreamControllerClose(controller) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        if (controller._queueTotalSize > 0) {
          controller._closeRequested = true;
          return;
        }
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (firstPendingPullInto.bytesFilled % firstPendingPullInto.elementSize !== 0) {
            const e2 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e2);
            throw e2;
          }
        }
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamClose(stream);
      }
      function ReadableByteStreamControllerEnqueue(controller, chunk) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        const { buffer, byteOffset, byteLength } = chunk;
        if (IsDetachedBuffer(buffer)) {
          throw new TypeError("chunk's buffer is detached and so cannot be enqueued");
        }
        const transferredBuffer = TransferArrayBuffer(buffer);
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (IsDetachedBuffer(firstPendingPullInto.buffer)) {
            throw new TypeError("The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk");
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          if (firstPendingPullInto.readerType === "none") {
            ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(controller, firstPendingPullInto);
          }
        }
        if (ReadableStreamHasDefaultReader(stream)) {
          ReadableByteStreamControllerProcessReadRequestsUsingQueue(controller);
          if (ReadableStreamGetNumReadRequests(stream) === 0) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          } else {
            if (controller._pendingPullIntos.length > 0) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
            }
            const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
            ReadableStreamFulfillReadRequest(stream, transferredView, false);
          }
        } else if (ReadableStreamHasBYOBReader(stream)) {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        } else {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerError(controller, e2) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return;
        }
        ReadableByteStreamControllerClearPendingPullIntos(controller);
        ResetQueue(controller);
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e2);
      }
      function ReadableByteStreamControllerFillReadRequestFromQueue(controller, readRequest) {
        const entry = controller._queue.shift();
        controller._queueTotalSize -= entry.byteLength;
        ReadableByteStreamControllerHandleQueueDrain(controller);
        const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
        readRequest._chunkSteps(view);
      }
      function ReadableByteStreamControllerGetBYOBRequest(controller) {
        if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
          const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
          SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
          controller._byobRequest = byobRequest;
        }
        return controller._byobRequest;
      }
      function ReadableByteStreamControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableByteStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableByteStreamControllerRespond(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (bytesWritten !== 0) {
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
          }
        } else {
          if (bytesWritten === 0) {
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          }
          if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
            throw new RangeError("bytesWritten out of range");
          }
        }
        firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
        ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
      }
      function ReadableByteStreamControllerRespondWithNewView(controller, view) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (view.byteLength !== 0) {
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
          }
        } else {
          if (view.byteLength === 0) {
            throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
          }
        }
        if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
          throw new RangeError("The region specified by view does not match byobRequest");
        }
        if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        }
        if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
          throw new RangeError("The region specified by view is larger than byobRequest");
        }
        const viewByteLength = view.byteLength;
        firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
        ReadableByteStreamControllerRespondInternal(controller, viewByteLength);
      }
      function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
        controller._controlledReadableByteStream = stream;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._byobRequest = null;
        controller._queue = controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._closeRequested = false;
        controller._started = false;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        controller._autoAllocateChunkSize = autoAllocateChunkSize;
        controller._pendingPullIntos = new SimpleQueue();
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableByteStreamControllerCallPullIfNeeded(controller);
          return null;
        }, (r2) => {
          ReadableByteStreamControllerError(controller, r2);
          return null;
        });
      }
      function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
        const controller = Object.create(ReadableByteStreamController.prototype);
        let startAlgorithm;
        let pullAlgorithm;
        let cancelAlgorithm;
        if (underlyingByteSource.start !== void 0) {
          startAlgorithm = () => underlyingByteSource.start(controller);
        } else {
          startAlgorithm = () => void 0;
        }
        if (underlyingByteSource.pull !== void 0) {
          pullAlgorithm = () => underlyingByteSource.pull(controller);
        } else {
          pullAlgorithm = () => promiseResolvedWith(void 0);
        }
        if (underlyingByteSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
        } else {
          cancelAlgorithm = () => promiseResolvedWith(void 0);
        }
        const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
        if (autoAllocateChunkSize === 0) {
          throw new TypeError("autoAllocateChunkSize must be greater than 0");
        }
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
      }
      function SetUpReadableStreamBYOBRequest(request, controller, view) {
        request._associatedReadableByteStreamController = controller;
        request._view = view;
      }
      function byobRequestBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
      }
      function byteStreamControllerBrandCheckException(name) {
        return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
      }
      function convertReaderOptions(options, context) {
        assertDictionary(options, context);
        const mode = options === null || options === void 0 ? void 0 : options.mode;
        return {
          mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
        };
      }
      function convertReadableStreamReaderMode(mode, context) {
        mode = `${mode}`;
        if (mode !== "byob") {
          throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
        }
        return mode;
      }
      function convertByobReadOptions(options, context) {
        var _a2;
        assertDictionary(options, context);
        const min = (_a2 = options === null || options === void 0 ? void 0 : options.min) !== null && _a2 !== void 0 ? _a2 : 1;
        return {
          min: convertUnsignedLongLongWithEnforceRange(min, `${context} has member 'min' that`)
        };
      }
      function AcquireReadableStreamBYOBReader(stream) {
        return new ReadableStreamBYOBReader(stream);
      }
      function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
        stream._reader._readIntoRequests.push(readIntoRequest);
      }
      function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readIntoRequest = reader._readIntoRequests.shift();
        if (done) {
          readIntoRequest._closeSteps(chunk);
        } else {
          readIntoRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadIntoRequests(stream) {
        return stream._reader._readIntoRequests.length;
      }
      function ReadableStreamHasBYOBReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamBYOBReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamBYOBReader {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          if (!IsReadableByteStreamController(stream._readableStreamController)) {
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readIntoRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        read(view, rawOptions = {}) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("read"));
          }
          if (!ArrayBuffer.isView(view)) {
            return promiseRejectedWith(new TypeError("view must be an array buffer view"));
          }
          if (view.byteLength === 0) {
            return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
          }
          if (view.buffer.byteLength === 0) {
            return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
          }
          if (IsDetachedBuffer(view.buffer)) {
            return promiseRejectedWith(new TypeError("view's buffer has been detached"));
          }
          let options;
          try {
            options = convertByobReadOptions(rawOptions, "options");
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          const min = options.min;
          if (min === 0) {
            return promiseRejectedWith(new TypeError("options.min must be greater than 0"));
          }
          if (!isDataView(view)) {
            if (min > view.length) {
              return promiseRejectedWith(new RangeError("options.min must be less than or equal to view's length"));
            }
          } else if (min > view.byteLength) {
            return promiseRejectedWith(new RangeError("options.min must be less than or equal to view's byteLength"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          const readIntoRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
            _errorSteps: (e2) => rejectPromise(e2)
          };
          ReadableStreamBYOBReaderRead(this, view, min, readIntoRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamBYOBReader(this)) {
            throw byobReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          ReadableStreamBYOBReaderRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamBYOBReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      setFunctionName(ReadableStreamBYOBReader.prototype.cancel, "cancel");
      setFunctionName(ReadableStreamBYOBReader.prototype.read, "read");
      setFunctionName(ReadableStreamBYOBReader.prototype.releaseLock, "releaseLock");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBReader.prototype, Symbol.toStringTag, {
          value: "ReadableStreamBYOBReader",
          configurable: true
        });
      }
      function IsReadableStreamBYOBReader(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readIntoRequests")) {
          return false;
        }
        return x2 instanceof ReadableStreamBYOBReader;
      }
      function ReadableStreamBYOBReaderRead(reader, view, min, readIntoRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "errored") {
          readIntoRequest._errorSteps(stream._storedError);
        } else {
          ReadableByteStreamControllerPullInto(stream._readableStreamController, view, min, readIntoRequest);
        }
      }
      function ReadableStreamBYOBReaderRelease(reader) {
        ReadableStreamReaderGenericRelease(reader);
        const e2 = new TypeError("Reader was released");
        ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e2);
      }
      function ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e2) {
        const readIntoRequests = reader._readIntoRequests;
        reader._readIntoRequests = new SimpleQueue();
        readIntoRequests.forEach((readIntoRequest) => {
          readIntoRequest._errorSteps(e2);
        });
      }
      function byobReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
      }
      function ExtractHighWaterMark(strategy, defaultHWM) {
        const { highWaterMark } = strategy;
        if (highWaterMark === void 0) {
          return defaultHWM;
        }
        if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
          throw new RangeError("Invalid highWaterMark");
        }
        return highWaterMark;
      }
      function ExtractSizeAlgorithm(strategy) {
        const { size } = strategy;
        if (!size) {
          return () => 1;
        }
        return size;
      }
      function convertQueuingStrategy(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        const size = init === null || init === void 0 ? void 0 : init.size;
        return {
          highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
          size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
        };
      }
      function convertQueuingStrategySize(fn, context) {
        assertFunction(fn, context);
        return (chunk) => convertUnrestrictedDouble(fn(chunk));
      }
      function convertUnderlyingSink(original, context) {
        assertDictionary(original, context);
        const abort = original === null || original === void 0 ? void 0 : original.abort;
        const close = original === null || original === void 0 ? void 0 : original.close;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        const write = original === null || original === void 0 ? void 0 : original.write;
        return {
          abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
          close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
          write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
          type
        };
      }
      function convertUnderlyingSinkAbortCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSinkCloseCallback(fn, original, context) {
        assertFunction(fn, context);
        return () => promiseCall(fn, original, []);
      }
      function convertUnderlyingSinkStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertUnderlyingSinkWriteCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      function assertWritableStream(x2, context) {
        if (!IsWritableStream(x2)) {
          throw new TypeError(`${context} is not a WritableStream.`);
        }
      }
      function isAbortSignal2(value) {
        if (typeof value !== "object" || value === null) {
          return false;
        }
        try {
          return typeof value.aborted === "boolean";
        } catch (_a2) {
          return false;
        }
      }
      const supportsAbortController = typeof AbortController === "function";
      function createAbortController() {
        if (supportsAbortController) {
          return new AbortController();
        }
        return void 0;
      }
      class WritableStream {
        constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
          if (rawUnderlyingSink === void 0) {
            rawUnderlyingSink = null;
          } else {
            assertObject(rawUnderlyingSink, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
          InitializeWritableStream(this);
          const type = underlyingSink.type;
          if (type !== void 0) {
            throw new RangeError("Invalid type is specified");
          }
          const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
          const highWaterMark = ExtractHighWaterMark(strategy, 1);
          SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("locked");
          }
          return IsWritableStreamLocked(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(reason = void 0) {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("abort"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
          }
          return WritableStreamAbort(this, reason);
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("close"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
          }
          if (WritableStreamCloseQueuedOrInFlight(this)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamClose(this);
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("getWriter");
          }
          return AcquireWritableStreamDefaultWriter(this);
        }
      }
      Object.defineProperties(WritableStream.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        getWriter: { enumerable: true },
        locked: { enumerable: true }
      });
      setFunctionName(WritableStream.prototype.abort, "abort");
      setFunctionName(WritableStream.prototype.close, "close");
      setFunctionName(WritableStream.prototype.getWriter, "getWriter");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(WritableStream.prototype, Symbol.toStringTag, {
          value: "WritableStream",
          configurable: true
        });
      }
      function AcquireWritableStreamDefaultWriter(stream) {
        return new WritableStreamDefaultWriter(stream);
      }
      function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(WritableStream.prototype);
        InitializeWritableStream(stream);
        const controller = Object.create(WritableStreamDefaultController.prototype);
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function InitializeWritableStream(stream) {
        stream._state = "writable";
        stream._storedError = void 0;
        stream._writer = void 0;
        stream._writableStreamController = void 0;
        stream._writeRequests = new SimpleQueue();
        stream._inFlightWriteRequest = void 0;
        stream._closeRequest = void 0;
        stream._inFlightCloseRequest = void 0;
        stream._pendingAbortRequest = void 0;
        stream._backpressure = false;
      }
      function IsWritableStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_writableStreamController")) {
          return false;
        }
        return x2 instanceof WritableStream;
      }
      function IsWritableStreamLocked(stream) {
        if (stream._writer === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamAbort(stream, reason) {
        var _a2;
        if (stream._state === "closed" || stream._state === "errored") {
          return promiseResolvedWith(void 0);
        }
        stream._writableStreamController._abortReason = reason;
        (_a2 = stream._writableStreamController._abortController) === null || _a2 === void 0 ? void 0 : _a2.abort(reason);
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseResolvedWith(void 0);
        }
        if (stream._pendingAbortRequest !== void 0) {
          return stream._pendingAbortRequest._promise;
        }
        let wasAlreadyErroring = false;
        if (state === "erroring") {
          wasAlreadyErroring = true;
          reason = void 0;
        }
        const promise = newPromise((resolve, reject) => {
          stream._pendingAbortRequest = {
            _promise: void 0,
            _resolve: resolve,
            _reject: reject,
            _reason: reason,
            _wasAlreadyErroring: wasAlreadyErroring
          };
        });
        stream._pendingAbortRequest._promise = promise;
        if (!wasAlreadyErroring) {
          WritableStreamStartErroring(stream, reason);
        }
        return promise;
      }
      function WritableStreamClose(stream) {
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
        }
        const promise = newPromise((resolve, reject) => {
          const closeRequest = {
            _resolve: resolve,
            _reject: reject
          };
          stream._closeRequest = closeRequest;
        });
        const writer = stream._writer;
        if (writer !== void 0 && stream._backpressure && state === "writable") {
          defaultWriterReadyPromiseResolve(writer);
        }
        WritableStreamDefaultControllerClose(stream._writableStreamController);
        return promise;
      }
      function WritableStreamAddWriteRequest(stream) {
        const promise = newPromise((resolve, reject) => {
          const writeRequest = {
            _resolve: resolve,
            _reject: reject
          };
          stream._writeRequests.push(writeRequest);
        });
        return promise;
      }
      function WritableStreamDealWithRejection(stream, error) {
        const state = stream._state;
        if (state === "writable") {
          WritableStreamStartErroring(stream, error);
          return;
        }
        WritableStreamFinishErroring(stream);
      }
      function WritableStreamStartErroring(stream, reason) {
        const controller = stream._writableStreamController;
        stream._state = "erroring";
        stream._storedError = reason;
        const writer = stream._writer;
        if (writer !== void 0) {
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
        }
        if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
          WritableStreamFinishErroring(stream);
        }
      }
      function WritableStreamFinishErroring(stream) {
        stream._state = "errored";
        stream._writableStreamController[ErrorSteps]();
        const storedError = stream._storedError;
        stream._writeRequests.forEach((writeRequest) => {
          writeRequest._reject(storedError);
        });
        stream._writeRequests = new SimpleQueue();
        if (stream._pendingAbortRequest === void 0) {
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const abortRequest = stream._pendingAbortRequest;
        stream._pendingAbortRequest = void 0;
        if (abortRequest._wasAlreadyErroring) {
          abortRequest._reject(storedError);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
        uponPromise(promise, () => {
          abortRequest._resolve();
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return null;
        }, (reason) => {
          abortRequest._reject(reason);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return null;
        });
      }
      function WritableStreamFinishInFlightWrite(stream) {
        stream._inFlightWriteRequest._resolve(void 0);
        stream._inFlightWriteRequest = void 0;
      }
      function WritableStreamFinishInFlightWriteWithError(stream, error) {
        stream._inFlightWriteRequest._reject(error);
        stream._inFlightWriteRequest = void 0;
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamFinishInFlightClose(stream) {
        stream._inFlightCloseRequest._resolve(void 0);
        stream._inFlightCloseRequest = void 0;
        const state = stream._state;
        if (state === "erroring") {
          stream._storedError = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._resolve();
            stream._pendingAbortRequest = void 0;
          }
        }
        stream._state = "closed";
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseResolve(writer);
        }
      }
      function WritableStreamFinishInFlightCloseWithError(stream, error) {
        stream._inFlightCloseRequest._reject(error);
        stream._inFlightCloseRequest = void 0;
        if (stream._pendingAbortRequest !== void 0) {
          stream._pendingAbortRequest._reject(error);
          stream._pendingAbortRequest = void 0;
        }
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamCloseQueuedOrInFlight(stream) {
        if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamHasOperationMarkedInFlight(stream) {
        if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamMarkCloseRequestInFlight(stream) {
        stream._inFlightCloseRequest = stream._closeRequest;
        stream._closeRequest = void 0;
      }
      function WritableStreamMarkFirstWriteRequestInFlight(stream) {
        stream._inFlightWriteRequest = stream._writeRequests.shift();
      }
      function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
        if (stream._closeRequest !== void 0) {
          stream._closeRequest._reject(stream._storedError);
          stream._closeRequest = void 0;
        }
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseReject(writer, stream._storedError);
        }
      }
      function WritableStreamUpdateBackpressure(stream, backpressure) {
        const writer = stream._writer;
        if (writer !== void 0 && backpressure !== stream._backpressure) {
          if (backpressure) {
            defaultWriterReadyPromiseReset(writer);
          } else {
            defaultWriterReadyPromiseResolve(writer);
          }
        }
        stream._backpressure = backpressure;
      }
      class WritableStreamDefaultWriter {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
          assertWritableStream(stream, "First parameter");
          if (IsWritableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          }
          this._ownerWritableStream = stream;
          stream._writer = this;
          const state = stream._state;
          if (state === "writable") {
            if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
              defaultWriterReadyPromiseInitialize(this);
            } else {
              defaultWriterReadyPromiseInitializeAsResolved(this);
            }
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "erroring") {
            defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "closed") {
            defaultWriterReadyPromiseInitializeAsResolved(this);
            defaultWriterClosedPromiseInitializeAsResolved(this);
          } else {
            const storedError = stream._storedError;
            defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
            defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
          }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer’s lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer’s lock is released.
         */
        get desiredSize() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("desiredSize");
          }
          if (this._ownerWritableStream === void 0) {
            throw defaultWriterLockException("desiredSize");
          }
          return WritableStreamDefaultWriterGetDesiredSize(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
          }
          return this._readyPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(reason = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("abort"));
          }
          return WritableStreamDefaultWriterAbort(this, reason);
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("close"));
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("close"));
          }
          if (WritableStreamCloseQueuedOrInFlight(stream)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamDefaultWriterClose(this);
        }
        /**
         * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("releaseLock");
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return;
          }
          WritableStreamDefaultWriterRelease(this);
        }
        write(chunk = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("write"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          return WritableStreamDefaultWriterWrite(this, chunk);
        }
      }
      Object.defineProperties(WritableStreamDefaultWriter.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        releaseLock: { enumerable: true },
        write: { enumerable: true },
        closed: { enumerable: true },
        desiredSize: { enumerable: true },
        ready: { enumerable: true }
      });
      setFunctionName(WritableStreamDefaultWriter.prototype.abort, "abort");
      setFunctionName(WritableStreamDefaultWriter.prototype.close, "close");
      setFunctionName(WritableStreamDefaultWriter.prototype.releaseLock, "releaseLock");
      setFunctionName(WritableStreamDefaultWriter.prototype.write, "write");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultWriter.prototype, Symbol.toStringTag, {
          value: "WritableStreamDefaultWriter",
          configurable: true
        });
      }
      function IsWritableStreamDefaultWriter(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_ownerWritableStream")) {
          return false;
        }
        return x2 instanceof WritableStreamDefaultWriter;
      }
      function WritableStreamDefaultWriterAbort(writer, reason) {
        const stream = writer._ownerWritableStream;
        return WritableStreamAbort(stream, reason);
      }
      function WritableStreamDefaultWriterClose(writer) {
        const stream = writer._ownerWritableStream;
        return WritableStreamClose(stream);
      }
      function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        return WritableStreamDefaultWriterClose(writer);
      }
      function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
        if (writer._closedPromiseState === "pending") {
          defaultWriterClosedPromiseReject(writer, error);
        } else {
          defaultWriterClosedPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
        if (writer._readyPromiseState === "pending") {
          defaultWriterReadyPromiseReject(writer, error);
        } else {
          defaultWriterReadyPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterGetDesiredSize(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (state === "errored" || state === "erroring") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
      }
      function WritableStreamDefaultWriterRelease(writer) {
        const stream = writer._ownerWritableStream;
        const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
        WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
        WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
        stream._writer = void 0;
        writer._ownerWritableStream = void 0;
      }
      function WritableStreamDefaultWriterWrite(writer, chunk) {
        const stream = writer._ownerWritableStream;
        const controller = stream._writableStreamController;
        const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
        if (stream !== writer._ownerWritableStream) {
          return promiseRejectedWith(defaultWriterLockException("write to"));
        }
        const state = stream._state;
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
        }
        if (state === "erroring") {
          return promiseRejectedWith(stream._storedError);
        }
        const promise = WritableStreamAddWriteRequest(stream);
        WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
        return promise;
      }
      const closeSentinel = {};
      class WritableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("abortReason");
          }
          return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("signal");
          }
          if (this._abortController === void 0) {
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          }
          return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(e2 = void 0) {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("error");
          }
          const state = this._controlledWritableStream._state;
          if (state !== "writable") {
            return;
          }
          WritableStreamDefaultControllerError(this, e2);
        }
        /** @internal */
        [AbortSteps](reason) {
          const result = this._abortAlgorithm(reason);
          WritableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [ErrorSteps]() {
          ResetQueue(this);
        }
      }
      Object.defineProperties(WritableStreamDefaultController.prototype, {
        abortReason: { enumerable: true },
        signal: { enumerable: true },
        error: { enumerable: true }
      });
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultController.prototype, Symbol.toStringTag, {
          value: "WritableStreamDefaultController",
          configurable: true
        });
      }
      function IsWritableStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledWritableStream")) {
          return false;
        }
        return x2 instanceof WritableStreamDefaultController;
      }
      function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledWritableStream = stream;
        stream._writableStreamController = controller;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._abortReason = void 0;
        controller._abortController = createAbortController();
        controller._started = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._writeAlgorithm = writeAlgorithm;
        controller._closeAlgorithm = closeAlgorithm;
        controller._abortAlgorithm = abortAlgorithm;
        const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
        WritableStreamUpdateBackpressure(stream, backpressure);
        const startResult = startAlgorithm();
        const startPromise = promiseResolvedWith(startResult);
        uponPromise(startPromise, () => {
          controller._started = true;
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          return null;
        }, (r2) => {
          controller._started = true;
          WritableStreamDealWithRejection(stream, r2);
          return null;
        });
      }
      function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(WritableStreamDefaultController.prototype);
        let startAlgorithm;
        let writeAlgorithm;
        let closeAlgorithm;
        let abortAlgorithm;
        if (underlyingSink.start !== void 0) {
          startAlgorithm = () => underlyingSink.start(controller);
        } else {
          startAlgorithm = () => void 0;
        }
        if (underlyingSink.write !== void 0) {
          writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
        } else {
          writeAlgorithm = () => promiseResolvedWith(void 0);
        }
        if (underlyingSink.close !== void 0) {
          closeAlgorithm = () => underlyingSink.close();
        } else {
          closeAlgorithm = () => promiseResolvedWith(void 0);
        }
        if (underlyingSink.abort !== void 0) {
          abortAlgorithm = (reason) => underlyingSink.abort(reason);
        } else {
          abortAlgorithm = () => promiseResolvedWith(void 0);
        }
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function WritableStreamDefaultControllerClearAlgorithms(controller) {
        controller._writeAlgorithm = void 0;
        controller._closeAlgorithm = void 0;
        controller._abortAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function WritableStreamDefaultControllerClose(controller) {
        EnqueueValueWithSize(controller, closeSentinel, 0);
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
        try {
          return controller._strategySizeAlgorithm(chunk);
        } catch (chunkSizeE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
          return 1;
        }
      }
      function WritableStreamDefaultControllerGetDesiredSize(controller) {
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
        try {
          EnqueueValueWithSize(controller, chunk, chunkSize);
        } catch (enqueueE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
          return;
        }
        const stream = controller._controlledWritableStream;
        if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
        }
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
        const stream = controller._controlledWritableStream;
        if (!controller._started) {
          return;
        }
        if (stream._inFlightWriteRequest !== void 0) {
          return;
        }
        const state = stream._state;
        if (state === "erroring") {
          WritableStreamFinishErroring(stream);
          return;
        }
        if (controller._queue.length === 0) {
          return;
        }
        const value = PeekQueueValue(controller);
        if (value === closeSentinel) {
          WritableStreamDefaultControllerProcessClose(controller);
        } else {
          WritableStreamDefaultControllerProcessWrite(controller, value);
        }
      }
      function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
        if (controller._controlledWritableStream._state === "writable") {
          WritableStreamDefaultControllerError(controller, error);
        }
      }
      function WritableStreamDefaultControllerProcessClose(controller) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkCloseRequestInFlight(stream);
        DequeueValue(controller);
        const sinkClosePromise = controller._closeAlgorithm();
        WritableStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(sinkClosePromise, () => {
          WritableStreamFinishInFlightClose(stream);
          return null;
        }, (reason) => {
          WritableStreamFinishInFlightCloseWithError(stream, reason);
          return null;
        });
      }
      function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkFirstWriteRequestInFlight(stream);
        const sinkWritePromise = controller._writeAlgorithm(chunk);
        uponPromise(sinkWritePromise, () => {
          WritableStreamFinishInFlightWrite(stream);
          const state = stream._state;
          DequeueValue(controller);
          if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          return null;
        }, (reason) => {
          if (stream._state === "writable") {
            WritableStreamDefaultControllerClearAlgorithms(controller);
          }
          WritableStreamFinishInFlightWriteWithError(stream, reason);
          return null;
        });
      }
      function WritableStreamDefaultControllerGetBackpressure(controller) {
        const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
        return desiredSize <= 0;
      }
      function WritableStreamDefaultControllerError(controller, error) {
        const stream = controller._controlledWritableStream;
        WritableStreamDefaultControllerClearAlgorithms(controller);
        WritableStreamStartErroring(stream, error);
      }
      function streamBrandCheckException$2(name) {
        return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
      }
      function defaultControllerBrandCheckException$2(name) {
        return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
      }
      function defaultWriterBrandCheckException(name) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
      }
      function defaultWriterLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released writer");
      }
      function defaultWriterClosedPromiseInitialize(writer) {
        writer._closedPromise = newPromise((resolve, reject) => {
          writer._closedPromise_resolve = resolve;
          writer._closedPromise_reject = reject;
          writer._closedPromiseState = "pending";
        });
      }
      function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseReject(writer, reason);
      }
      function defaultWriterClosedPromiseInitializeAsResolved(writer) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseResolve(writer);
      }
      function defaultWriterClosedPromiseReject(writer, reason) {
        if (writer._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._closedPromise);
        writer._closedPromise_reject(reason);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "rejected";
      }
      function defaultWriterClosedPromiseResetToRejected(writer, reason) {
        defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterClosedPromiseResolve(writer) {
        if (writer._closedPromise_resolve === void 0) {
          return;
        }
        writer._closedPromise_resolve(void 0);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "resolved";
      }
      function defaultWriterReadyPromiseInitialize(writer) {
        writer._readyPromise = newPromise((resolve, reject) => {
          writer._readyPromise_resolve = resolve;
          writer._readyPromise_reject = reject;
        });
        writer._readyPromiseState = "pending";
      }
      function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseReject(writer, reason);
      }
      function defaultWriterReadyPromiseInitializeAsResolved(writer) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseResolve(writer);
      }
      function defaultWriterReadyPromiseReject(writer, reason) {
        if (writer._readyPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._readyPromise);
        writer._readyPromise_reject(reason);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "rejected";
      }
      function defaultWriterReadyPromiseReset(writer) {
        defaultWriterReadyPromiseInitialize(writer);
      }
      function defaultWriterReadyPromiseResetToRejected(writer, reason) {
        defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterReadyPromiseResolve(writer) {
        if (writer._readyPromise_resolve === void 0) {
          return;
        }
        writer._readyPromise_resolve(void 0);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "fulfilled";
      }
      function getGlobals() {
        if (typeof globalThis !== "undefined") {
          return globalThis;
        } else if (typeof self !== "undefined") {
          return self;
        } else if (typeof global !== "undefined") {
          return global;
        }
        return void 0;
      }
      const globals = getGlobals();
      function isDOMExceptionConstructor(ctor) {
        if (!(typeof ctor === "function" || typeof ctor === "object")) {
          return false;
        }
        if (ctor.name !== "DOMException") {
          return false;
        }
        try {
          new ctor();
          return true;
        } catch (_a2) {
          return false;
        }
      }
      function getFromGlobal() {
        const ctor = globals === null || globals === void 0 ? void 0 : globals.DOMException;
        return isDOMExceptionConstructor(ctor) ? ctor : void 0;
      }
      function createPolyfill() {
        const ctor = function DOMException3(message, name) {
          this.message = message || "";
          this.name = name || "Error";
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
        };
        setFunctionName(ctor, "DOMException");
        ctor.prototype = Object.create(Error.prototype);
        Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
        return ctor;
      }
      const DOMException2 = getFromGlobal() || createPolyfill();
      function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
        const reader = AcquireReadableStreamDefaultReader(source);
        const writer = AcquireWritableStreamDefaultWriter(dest);
        source._disturbed = true;
        let shuttingDown = false;
        let currentWrite = promiseResolvedWith(void 0);
        return newPromise((resolve, reject) => {
          let abortAlgorithm;
          if (signal !== void 0) {
            abortAlgorithm = () => {
              const error = signal.reason !== void 0 ? signal.reason : new DOMException2("Aborted", "AbortError");
              const actions = [];
              if (!preventAbort) {
                actions.push(() => {
                  if (dest._state === "writable") {
                    return WritableStreamAbort(dest, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              if (!preventCancel) {
                actions.push(() => {
                  if (source._state === "readable") {
                    return ReadableStreamCancel(source, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error);
            };
            if (signal.aborted) {
              abortAlgorithm();
              return;
            }
            signal.addEventListener("abort", abortAlgorithm);
          }
          function pipeLoop() {
            return newPromise((resolveLoop, rejectLoop) => {
              function next(done) {
                if (done) {
                  resolveLoop();
                } else {
                  PerformPromiseThen(pipeStep(), next, rejectLoop);
                }
              }
              next(false);
            });
          }
          function pipeStep() {
            if (shuttingDown) {
              return promiseResolvedWith(true);
            }
            return PerformPromiseThen(writer._readyPromise, () => {
              return newPromise((resolveRead, rejectRead) => {
                ReadableStreamDefaultReaderRead(reader, {
                  _chunkSteps: (chunk) => {
                    currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                    resolveRead(false);
                  },
                  _closeSteps: () => resolveRead(true),
                  _errorSteps: rejectRead
                });
              });
            });
          }
          isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
            if (!preventAbort) {
              shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
            return null;
          });
          isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
            return null;
          });
          isOrBecomesClosed(source, reader._closedPromise, () => {
            if (!preventClose) {
              shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
            } else {
              shutdown();
            }
            return null;
          });
          if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
            const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
            } else {
              shutdown(true, destClosed);
            }
          }
          setPromiseIsHandledToTrue(pipeLoop());
          function waitForWritesToFinish() {
            const oldCurrentWrite = currentWrite;
            return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
          }
          function isOrBecomesErrored(stream, promise, action) {
            if (stream._state === "errored") {
              action(stream._storedError);
            } else {
              uponRejection(promise, action);
            }
          }
          function isOrBecomesClosed(stream, promise, action) {
            if (stream._state === "closed") {
              action();
            } else {
              uponFulfillment(promise, action);
            }
          }
          function shutdownWithAction(action, originalIsError, originalError) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), doTheRest);
            } else {
              doTheRest();
            }
            function doTheRest() {
              uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              return null;
            }
          }
          function shutdown(isError, error) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error));
            } else {
              finalize(isError, error);
            }
          }
          function finalize(isError, error) {
            WritableStreamDefaultWriterRelease(writer);
            ReadableStreamReaderGenericRelease(reader);
            if (signal !== void 0) {
              signal.removeEventListener("abort", abortAlgorithm);
            }
            if (isError) {
              reject(error);
            } else {
              resolve(void 0);
            }
            return null;
          }
        });
      }
      class ReadableStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("desiredSize");
          }
          return ReadableStreamDefaultControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("close");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits close");
          }
          ReadableStreamDefaultControllerClose(this);
        }
        enqueue(chunk = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("enqueue");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits enqueue");
          }
          return ReadableStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e2 = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("error");
          }
          ReadableStreamDefaultControllerError(this, e2);
        }
        /** @internal */
        [CancelSteps](reason) {
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const chunk = DequeueValue(this);
            if (this._closeRequested && this._queue.length === 0) {
              ReadableStreamDefaultControllerClearAlgorithms(this);
              ReadableStreamClose(stream);
            } else {
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
            readRequest._chunkSteps(chunk);
          } else {
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableStreamDefaultControllerCallPullIfNeeded(this);
          }
        }
        /** @internal */
        [ReleaseSteps]() {
        }
      }
      Object.defineProperties(ReadableStreamDefaultController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      setFunctionName(ReadableStreamDefaultController.prototype.close, "close");
      setFunctionName(ReadableStreamDefaultController.prototype.enqueue, "enqueue");
      setFunctionName(ReadableStreamDefaultController.prototype.error, "error");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultController.prototype, Symbol.toStringTag, {
          value: "ReadableStreamDefaultController",
          configurable: true
        });
      }
      function IsReadableStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledReadableStream")) {
          return false;
        }
        return x2 instanceof ReadableStreamDefaultController;
      }
      function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }
          return null;
        }, (e2) => {
          ReadableStreamDefaultControllerError(controller, e2);
          return null;
        });
      }
      function ReadableStreamDefaultControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableStream;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableStreamDefaultControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function ReadableStreamDefaultControllerClose(controller) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        controller._closeRequested = true;
        if (controller._queue.length === 0) {
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
      }
      function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          ReadableStreamFulfillReadRequest(stream, chunk, false);
        } else {
          let chunkSize;
          try {
            chunkSize = controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            ReadableStreamDefaultControllerError(controller, chunkSizeE);
            throw chunkSizeE;
          }
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            ReadableStreamDefaultControllerError(controller, enqueueE);
            throw enqueueE;
          }
        }
        ReadableStreamDefaultControllerCallPullIfNeeded(controller);
      }
      function ReadableStreamDefaultControllerError(controller, e2) {
        const stream = controller._controlledReadableStream;
        if (stream._state !== "readable") {
          return;
        }
        ResetQueue(controller);
        ReadableStreamDefaultControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e2);
      }
      function ReadableStreamDefaultControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableStreamDefaultControllerHasBackpressure(controller) {
        if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
          return false;
        }
        return true;
      }
      function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
        const state = controller._controlledReadableStream._state;
        if (!controller._closeRequested && state === "readable") {
          return true;
        }
        return false;
      }
      function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledReadableStream = stream;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._started = false;
        controller._closeRequested = false;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          return null;
        }, (r2) => {
          ReadableStreamDefaultControllerError(controller, r2);
          return null;
        });
      }
      function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        let startAlgorithm;
        let pullAlgorithm;
        let cancelAlgorithm;
        if (underlyingSource.start !== void 0) {
          startAlgorithm = () => underlyingSource.start(controller);
        } else {
          startAlgorithm = () => void 0;
        }
        if (underlyingSource.pull !== void 0) {
          pullAlgorithm = () => underlyingSource.pull(controller);
        } else {
          pullAlgorithm = () => promiseResolvedWith(void 0);
        }
        if (underlyingSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
        } else {
          cancelAlgorithm = () => promiseResolvedWith(void 0);
        }
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function defaultControllerBrandCheckException$1(name) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
      }
      function ReadableStreamTee(stream, cloneForBranch2) {
        if (IsReadableByteStreamController(stream._readableStreamController)) {
          return ReadableByteStreamTee(stream);
        }
        return ReadableStreamDefaultTee(stream);
      }
      function ReadableStreamDefaultTee(stream, cloneForBranch2) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgain = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve) => {
          resolveCancelPromise = resolve;
        });
        function pullAlgorithm() {
          if (reading) {
            readAgain = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const readRequest = {
            _chunkSteps: (chunk) => {
              _queueMicrotask(() => {
                readAgain = false;
                const chunk1 = chunk;
                const chunk2 = chunk;
                if (!canceled1) {
                  ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgain) {
                  pullAlgorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableStreamDefaultControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableStreamDefaultControllerClose(branch2._readableStreamController);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
        }
        branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
        branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
        uponRejection(reader._closedPromise, (r2) => {
          ReadableStreamDefaultControllerError(branch1._readableStreamController, r2);
          ReadableStreamDefaultControllerError(branch2._readableStreamController, r2);
          if (!canceled1 || !canceled2) {
            resolveCancelPromise(void 0);
          }
          return null;
        });
        return [branch1, branch2];
      }
      function ReadableByteStreamTee(stream) {
        let reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgainForBranch1 = false;
        let readAgainForBranch2 = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve) => {
          resolveCancelPromise = resolve;
        });
        function forwardReaderError(thisReader) {
          uponRejection(thisReader._closedPromise, (r2) => {
            if (thisReader !== reader) {
              return null;
            }
            ReadableByteStreamControllerError(branch1._readableStreamController, r2);
            ReadableByteStreamControllerError(branch2._readableStreamController, r2);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
            return null;
          });
        }
        function pullWithDefaultReader() {
          if (IsReadableStreamBYOBReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamDefaultReader(stream);
            forwardReaderError(reader);
          }
          const readRequest = {
            _chunkSteps: (chunk) => {
              _queueMicrotask(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const chunk1 = chunk;
                let chunk2 = chunk;
                if (!canceled1 && !canceled2) {
                  try {
                    chunk2 = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                }
                if (!canceled1) {
                  ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableByteStreamControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableByteStreamControllerClose(branch2._readableStreamController);
              }
              if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
              }
              if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
        }
        function pullWithBYOBReader(view, forBranch2) {
          if (IsReadableStreamDefaultReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamBYOBReader(stream);
            forwardReaderError(reader);
          }
          const byobBranch = forBranch2 ? branch2 : branch1;
          const otherBranch = forBranch2 ? branch1 : branch2;
          const readIntoRequest = {
            _chunkSteps: (chunk) => {
              _queueMicrotask(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!otherCanceled) {
                  let clonedChunk;
                  try {
                    clonedChunk = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                } else if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: (chunk) => {
              reading = false;
              const byobCanceled = forBranch2 ? canceled2 : canceled1;
              const otherCanceled = forBranch2 ? canceled1 : canceled2;
              if (!byobCanceled) {
                ReadableByteStreamControllerClose(byobBranch._readableStreamController);
              }
              if (!otherCanceled) {
                ReadableByteStreamControllerClose(otherBranch._readableStreamController);
              }
              if (chunk !== void 0) {
                if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                }
              }
              if (!byobCanceled || !otherCanceled) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamBYOBReaderRead(reader, view, 1, readIntoRequest);
        }
        function pull1Algorithm() {
          if (reading) {
            readAgainForBranch1 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, false);
          }
          return promiseResolvedWith(void 0);
        }
        function pull2Algorithm() {
          if (reading) {
            readAgainForBranch2 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, true);
          }
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
          return;
        }
        branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
        branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
        forwardReaderError(reader);
        return [branch1, branch2];
      }
      function isReadableStreamLike(stream) {
        return typeIsObject(stream) && typeof stream.getReader !== "undefined";
      }
      function ReadableStreamFrom(source) {
        if (isReadableStreamLike(source)) {
          return ReadableStreamFromDefaultReader(source.getReader());
        }
        return ReadableStreamFromIterable(source);
      }
      function ReadableStreamFromIterable(asyncIterable) {
        let stream;
        const iteratorRecord = GetIterator(asyncIterable, "async");
        const startAlgorithm = noop2;
        function pullAlgorithm() {
          let nextResult;
          try {
            nextResult = IteratorNext(iteratorRecord);
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          const nextPromise = promiseResolvedWith(nextResult);
          return transformPromiseWith(nextPromise, (iterResult) => {
            if (!typeIsObject(iterResult)) {
              throw new TypeError("The promise returned by the iterator.next() method must fulfill with an object");
            }
            const done = IteratorComplete(iterResult);
            if (done) {
              ReadableStreamDefaultControllerClose(stream._readableStreamController);
            } else {
              const value = IteratorValue(iterResult);
              ReadableStreamDefaultControllerEnqueue(stream._readableStreamController, value);
            }
          });
        }
        function cancelAlgorithm(reason) {
          const iterator = iteratorRecord.iterator;
          let returnMethod;
          try {
            returnMethod = GetMethod(iterator, "return");
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          if (returnMethod === void 0) {
            return promiseResolvedWith(void 0);
          }
          let returnResult;
          try {
            returnResult = reflectCall(returnMethod, iterator, [reason]);
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          const returnPromise = promiseResolvedWith(returnResult);
          return transformPromiseWith(returnPromise, (iterResult) => {
            if (!typeIsObject(iterResult)) {
              throw new TypeError("The promise returned by the iterator.return() method must fulfill with an object");
            }
            return void 0;
          });
        }
        stream = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, 0);
        return stream;
      }
      function ReadableStreamFromDefaultReader(reader) {
        let stream;
        const startAlgorithm = noop2;
        function pullAlgorithm() {
          let readPromise;
          try {
            readPromise = reader.read();
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          return transformPromiseWith(readPromise, (readResult) => {
            if (!typeIsObject(readResult)) {
              throw new TypeError("The promise returned by the reader.read() method must fulfill with an object");
            }
            if (readResult.done) {
              ReadableStreamDefaultControllerClose(stream._readableStreamController);
            } else {
              const value = readResult.value;
              ReadableStreamDefaultControllerEnqueue(stream._readableStreamController, value);
            }
          });
        }
        function cancelAlgorithm(reason) {
          try {
            return promiseResolvedWith(reader.cancel(reason));
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
        }
        stream = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, 0);
        return stream;
      }
      function convertUnderlyingDefaultOrByteSource(source, context) {
        assertDictionary(source, context);
        const original = source;
        const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
        const cancel = original === null || original === void 0 ? void 0 : original.cancel;
        const pull = original === null || original === void 0 ? void 0 : original.pull;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        return {
          autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
          cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
          pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
          type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
        };
      }
      function convertUnderlyingSourceCancelCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSourcePullCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertUnderlyingSourceStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertReadableStreamType(type, context) {
        type = `${type}`;
        if (type !== "bytes") {
          throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
        }
        return type;
      }
      function convertIteratorOptions(options, context) {
        assertDictionary(options, context);
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        return { preventCancel: Boolean(preventCancel) };
      }
      function convertPipeOptions(options, context) {
        assertDictionary(options, context);
        const preventAbort = options === null || options === void 0 ? void 0 : options.preventAbort;
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        const preventClose = options === null || options === void 0 ? void 0 : options.preventClose;
        const signal = options === null || options === void 0 ? void 0 : options.signal;
        if (signal !== void 0) {
          assertAbortSignal(signal, `${context} has member 'signal' that`);
        }
        return {
          preventAbort: Boolean(preventAbort),
          preventCancel: Boolean(preventCancel),
          preventClose: Boolean(preventClose),
          signal
        };
      }
      function assertAbortSignal(signal, context) {
        if (!isAbortSignal2(signal)) {
          throw new TypeError(`${context} is not an AbortSignal.`);
        }
      }
      function convertReadableWritablePair(pair, context) {
        assertDictionary(pair, context);
        const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
        assertRequiredField(readable, "readable", "ReadableWritablePair");
        assertReadableStream(readable, `${context} has member 'readable' that`);
        const writable = pair === null || pair === void 0 ? void 0 : pair.writable;
        assertRequiredField(writable, "writable", "ReadableWritablePair");
        assertWritableStream(writable, `${context} has member 'writable' that`);
        return { readable, writable };
      }
      class ReadableStream2 {
        constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
          if (rawUnderlyingSource === void 0) {
            rawUnderlyingSource = null;
          } else {
            assertObject(rawUnderlyingSource, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
          InitializeReadableStream(this);
          if (underlyingSource.type === "bytes") {
            if (strategy.size !== void 0) {
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            }
            const highWaterMark = ExtractHighWaterMark(strategy, 0);
            SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
          } else {
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
          }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("locked");
          }
          return IsReadableStreamLocked(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(reason = void 0) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("cancel"));
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
          }
          return ReadableStreamCancel(this, reason);
        }
        getReader(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("getReader");
          }
          const options = convertReaderOptions(rawOptions, "First parameter");
          if (options.mode === void 0) {
            return AcquireReadableStreamDefaultReader(this);
          }
          return AcquireReadableStreamBYOBReader(this);
        }
        pipeThrough(rawTransform, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("pipeThrough");
          }
          assertRequiredArgument(rawTransform, 1, "pipeThrough");
          const transform = convertReadableWritablePair(rawTransform, "First parameter");
          const options = convertPipeOptions(rawOptions, "Second parameter");
          if (IsReadableStreamLocked(this)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          }
          if (IsWritableStreamLocked(transform.writable)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          }
          const promise = ReadableStreamPipeTo(this, transform.writable, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
          setPromiseIsHandledToTrue(promise);
          return transform.readable;
        }
        pipeTo(destination, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
          }
          if (destination === void 0) {
            return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
          }
          if (!IsWritableStream(destination)) {
            return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
          }
          let options;
          try {
            options = convertPipeOptions(rawOptions, "Second parameter");
          } catch (e2) {
            return promiseRejectedWith(e2);
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
          }
          if (IsWritableStreamLocked(destination)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
          }
          return ReadableStreamPipeTo(this, destination, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("tee");
          }
          const branches = ReadableStreamTee(this);
          return CreateArrayFromList(branches);
        }
        values(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("values");
          }
          const options = convertIteratorOptions(rawOptions, "First parameter");
          return AcquireReadableStreamAsyncIterator(this, options.preventCancel);
        }
        [SymbolAsyncIterator](options) {
          return this.values(options);
        }
        /**
         * Creates a new ReadableStream wrapping the provided iterable or async iterable.
         *
         * This can be used to adapt various kinds of objects into a readable stream,
         * such as an array, an async generator, or a Node.js readable stream.
         */
        static from(asyncIterable) {
          return ReadableStreamFrom(asyncIterable);
        }
      }
      Object.defineProperties(ReadableStream2, {
        from: { enumerable: true }
      });
      Object.defineProperties(ReadableStream2.prototype, {
        cancel: { enumerable: true },
        getReader: { enumerable: true },
        pipeThrough: { enumerable: true },
        pipeTo: { enumerable: true },
        tee: { enumerable: true },
        values: { enumerable: true },
        locked: { enumerable: true }
      });
      setFunctionName(ReadableStream2.from, "from");
      setFunctionName(ReadableStream2.prototype.cancel, "cancel");
      setFunctionName(ReadableStream2.prototype.getReader, "getReader");
      setFunctionName(ReadableStream2.prototype.pipeThrough, "pipeThrough");
      setFunctionName(ReadableStream2.prototype.pipeTo, "pipeTo");
      setFunctionName(ReadableStream2.prototype.tee, "tee");
      setFunctionName(ReadableStream2.prototype.values, "values");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ReadableStream2.prototype, Symbol.toStringTag, {
          value: "ReadableStream",
          configurable: true
        });
      }
      Object.defineProperty(ReadableStream2.prototype, SymbolAsyncIterator, {
        value: ReadableStream2.prototype.values,
        writable: true,
        configurable: true
      });
      function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(ReadableStream2.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
        const stream = Object.create(ReadableStream2.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableByteStreamController.prototype);
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
        return stream;
      }
      function InitializeReadableStream(stream) {
        stream._state = "readable";
        stream._reader = void 0;
        stream._storedError = void 0;
        stream._disturbed = false;
      }
      function IsReadableStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_readableStreamController")) {
          return false;
        }
        return x2 instanceof ReadableStream2;
      }
      function IsReadableStreamLocked(stream) {
        if (stream._reader === void 0) {
          return false;
        }
        return true;
      }
      function ReadableStreamCancel(stream, reason) {
        stream._disturbed = true;
        if (stream._state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (stream._state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        ReadableStreamClose(stream);
        const reader = stream._reader;
        if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
          const readIntoRequests = reader._readIntoRequests;
          reader._readIntoRequests = new SimpleQueue();
          readIntoRequests.forEach((readIntoRequest) => {
            readIntoRequest._closeSteps(void 0);
          });
        }
        const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
        return transformPromiseWith(sourceCancelPromise, noop2);
      }
      function ReadableStreamClose(stream) {
        stream._state = "closed";
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseResolve(reader);
        if (IsReadableStreamDefaultReader(reader)) {
          const readRequests = reader._readRequests;
          reader._readRequests = new SimpleQueue();
          readRequests.forEach((readRequest) => {
            readRequest._closeSteps();
          });
        }
      }
      function ReadableStreamError(stream, e2) {
        stream._state = "errored";
        stream._storedError = e2;
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseReject(reader, e2);
        if (IsReadableStreamDefaultReader(reader)) {
          ReadableStreamDefaultReaderErrorReadRequests(reader, e2);
        } else {
          ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e2);
        }
      }
      function streamBrandCheckException$1(name) {
        return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
      }
      function convertQueuingStrategyInit(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
        return {
          highWaterMark: convertUnrestrictedDouble(highWaterMark)
        };
      }
      const byteLengthSizeFunction = (chunk) => {
        return chunk.byteLength;
      };
      setFunctionName(byteLengthSizeFunction, "size");
      class ByteLengthQueuingStrategy {
        constructor(options) {
          assertRequiredArgument(options, 1, "ByteLengthQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("highWaterMark");
          }
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("size");
          }
          return byteLengthSizeFunction;
        }
      }
      Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(ByteLengthQueuingStrategy.prototype, Symbol.toStringTag, {
          value: "ByteLengthQueuingStrategy",
          configurable: true
        });
      }
      function byteLengthBrandCheckException(name) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
      }
      function IsByteLengthQueuingStrategy(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_byteLengthQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x2 instanceof ByteLengthQueuingStrategy;
      }
      const countSizeFunction = () => {
        return 1;
      };
      setFunctionName(countSizeFunction, "size");
      class CountQueuingStrategy {
        constructor(options) {
          assertRequiredArgument(options, 1, "CountQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._countQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("highWaterMark");
          }
          return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("size");
          }
          return countSizeFunction;
        }
      }
      Object.defineProperties(CountQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(CountQueuingStrategy.prototype, Symbol.toStringTag, {
          value: "CountQueuingStrategy",
          configurable: true
        });
      }
      function countBrandCheckException(name) {
        return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
      }
      function IsCountQueuingStrategy(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_countQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x2 instanceof CountQueuingStrategy;
      }
      function convertTransformer(original, context) {
        assertDictionary(original, context);
        const cancel = original === null || original === void 0 ? void 0 : original.cancel;
        const flush = original === null || original === void 0 ? void 0 : original.flush;
        const readableType = original === null || original === void 0 ? void 0 : original.readableType;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const transform = original === null || original === void 0 ? void 0 : original.transform;
        const writableType = original === null || original === void 0 ? void 0 : original.writableType;
        return {
          cancel: cancel === void 0 ? void 0 : convertTransformerCancelCallback(cancel, original, `${context} has member 'cancel' that`),
          flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
          readableType,
          start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
          transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
          writableType
        };
      }
      function convertTransformerFlushCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertTransformerStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertTransformerTransformCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      function convertTransformerCancelCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      class TransformStream {
        constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
          if (rawTransformer === void 0) {
            rawTransformer = null;
          }
          const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
          const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
          const transformer = convertTransformer(rawTransformer, "First parameter");
          if (transformer.readableType !== void 0) {
            throw new RangeError("Invalid readableType specified");
          }
          if (transformer.writableType !== void 0) {
            throw new RangeError("Invalid writableType specified");
          }
          const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
          const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
          const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
          const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
          let startPromise_resolve;
          const startPromise = newPromise((resolve) => {
            startPromise_resolve = resolve;
          });
          InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
          if (transformer.start !== void 0) {
            startPromise_resolve(transformer.start(this._transformStreamController));
          } else {
            startPromise_resolve(void 0);
          }
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("readable");
          }
          return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("writable");
          }
          return this._writable;
        }
      }
      Object.defineProperties(TransformStream.prototype, {
        readable: { enumerable: true },
        writable: { enumerable: true }
      });
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(TransformStream.prototype, Symbol.toStringTag, {
          value: "TransformStream",
          configurable: true
        });
      }
      function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
        function startAlgorithm() {
          return startPromise;
        }
        function writeAlgorithm(chunk) {
          return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
        }
        function abortAlgorithm(reason) {
          return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
        }
        function closeAlgorithm() {
          return TransformStreamDefaultSinkCloseAlgorithm(stream);
        }
        stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
        function pullAlgorithm() {
          return TransformStreamDefaultSourcePullAlgorithm(stream);
        }
        function cancelAlgorithm(reason) {
          return TransformStreamDefaultSourceCancelAlgorithm(stream, reason);
        }
        stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
        stream._backpressure = void 0;
        stream._backpressureChangePromise = void 0;
        stream._backpressureChangePromise_resolve = void 0;
        TransformStreamSetBackpressure(stream, true);
        stream._transformStreamController = void 0;
      }
      function IsTransformStream(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_transformStreamController")) {
          return false;
        }
        return x2 instanceof TransformStream;
      }
      function TransformStreamError(stream, e2) {
        ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e2);
        TransformStreamErrorWritableAndUnblockWrite(stream, e2);
      }
      function TransformStreamErrorWritableAndUnblockWrite(stream, e2) {
        TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
        WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e2);
        TransformStreamUnblockWrite(stream);
      }
      function TransformStreamUnblockWrite(stream) {
        if (stream._backpressure) {
          TransformStreamSetBackpressure(stream, false);
        }
      }
      function TransformStreamSetBackpressure(stream, backpressure) {
        if (stream._backpressureChangePromise !== void 0) {
          stream._backpressureChangePromise_resolve();
        }
        stream._backpressureChangePromise = newPromise((resolve) => {
          stream._backpressureChangePromise_resolve = resolve;
        });
        stream._backpressure = backpressure;
      }
      class TransformStreamDefaultController {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("desiredSize");
          }
          const readableController = this._controlledTransformStream._readable._readableStreamController;
          return ReadableStreamDefaultControllerGetDesiredSize(readableController);
        }
        enqueue(chunk = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("enqueue");
          }
          TransformStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(reason = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("error");
          }
          TransformStreamDefaultControllerError(this, reason);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("terminate");
          }
          TransformStreamDefaultControllerTerminate(this);
        }
      }
      Object.defineProperties(TransformStreamDefaultController.prototype, {
        enqueue: { enumerable: true },
        error: { enumerable: true },
        terminate: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      setFunctionName(TransformStreamDefaultController.prototype.enqueue, "enqueue");
      setFunctionName(TransformStreamDefaultController.prototype.error, "error");
      setFunctionName(TransformStreamDefaultController.prototype.terminate, "terminate");
      if (typeof Symbol.toStringTag === "symbol") {
        Object.defineProperty(TransformStreamDefaultController.prototype, Symbol.toStringTag, {
          value: "TransformStreamDefaultController",
          configurable: true
        });
      }
      function IsTransformStreamDefaultController(x2) {
        if (!typeIsObject(x2)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x2, "_controlledTransformStream")) {
          return false;
        }
        return x2 instanceof TransformStreamDefaultController;
      }
      function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm, cancelAlgorithm) {
        controller._controlledTransformStream = stream;
        stream._transformStreamController = controller;
        controller._transformAlgorithm = transformAlgorithm;
        controller._flushAlgorithm = flushAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        controller._finishPromise = void 0;
        controller._finishPromise_resolve = void 0;
        controller._finishPromise_reject = void 0;
      }
      function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
        const controller = Object.create(TransformStreamDefaultController.prototype);
        let transformAlgorithm;
        let flushAlgorithm;
        let cancelAlgorithm;
        if (transformer.transform !== void 0) {
          transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
        } else {
          transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
        }
        if (transformer.flush !== void 0) {
          flushAlgorithm = () => transformer.flush(controller);
        } else {
          flushAlgorithm = () => promiseResolvedWith(void 0);
        }
        if (transformer.cancel !== void 0) {
          cancelAlgorithm = (reason) => transformer.cancel(reason);
        } else {
          cancelAlgorithm = () => promiseResolvedWith(void 0);
        }
        SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm, cancelAlgorithm);
      }
      function TransformStreamDefaultControllerClearAlgorithms(controller) {
        controller._transformAlgorithm = void 0;
        controller._flushAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
      }
      function TransformStreamDefaultControllerEnqueue(controller, chunk) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
          throw new TypeError("Readable side is not in a state that permits enqueue");
        }
        try {
          ReadableStreamDefaultControllerEnqueue(readableController, chunk);
        } catch (e2) {
          TransformStreamErrorWritableAndUnblockWrite(stream, e2);
          throw stream._readable._storedError;
        }
        const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
        if (backpressure !== stream._backpressure) {
          TransformStreamSetBackpressure(stream, true);
        }
      }
      function TransformStreamDefaultControllerError(controller, e2) {
        TransformStreamError(controller._controlledTransformStream, e2);
      }
      function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
        const transformPromise = controller._transformAlgorithm(chunk);
        return transformPromiseWith(transformPromise, void 0, (r2) => {
          TransformStreamError(controller._controlledTransformStream, r2);
          throw r2;
        });
      }
      function TransformStreamDefaultControllerTerminate(controller) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        ReadableStreamDefaultControllerClose(readableController);
        const error = new TypeError("TransformStream terminated");
        TransformStreamErrorWritableAndUnblockWrite(stream, error);
      }
      function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
        const controller = stream._transformStreamController;
        if (stream._backpressure) {
          const backpressureChangePromise = stream._backpressureChangePromise;
          return transformPromiseWith(backpressureChangePromise, () => {
            const writable = stream._writable;
            const state = writable._state;
            if (state === "erroring") {
              throw writable._storedError;
            }
            return TransformStreamDefaultControllerPerformTransform(controller, chunk);
          });
        }
        return TransformStreamDefaultControllerPerformTransform(controller, chunk);
      }
      function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
        const controller = stream._transformStreamController;
        if (controller._finishPromise !== void 0) {
          return controller._finishPromise;
        }
        const readable = stream._readable;
        controller._finishPromise = newPromise((resolve, reject) => {
          controller._finishPromise_resolve = resolve;
          controller._finishPromise_reject = reject;
        });
        const cancelPromise = controller._cancelAlgorithm(reason);
        TransformStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(cancelPromise, () => {
          if (readable._state === "errored") {
            defaultControllerFinishPromiseReject(controller, readable._storedError);
          } else {
            ReadableStreamDefaultControllerError(readable._readableStreamController, reason);
            defaultControllerFinishPromiseResolve(controller);
          }
          return null;
        }, (r2) => {
          ReadableStreamDefaultControllerError(readable._readableStreamController, r2);
          defaultControllerFinishPromiseReject(controller, r2);
          return null;
        });
        return controller._finishPromise;
      }
      function TransformStreamDefaultSinkCloseAlgorithm(stream) {
        const controller = stream._transformStreamController;
        if (controller._finishPromise !== void 0) {
          return controller._finishPromise;
        }
        const readable = stream._readable;
        controller._finishPromise = newPromise((resolve, reject) => {
          controller._finishPromise_resolve = resolve;
          controller._finishPromise_reject = reject;
        });
        const flushPromise = controller._flushAlgorithm();
        TransformStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(flushPromise, () => {
          if (readable._state === "errored") {
            defaultControllerFinishPromiseReject(controller, readable._storedError);
          } else {
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
            defaultControllerFinishPromiseResolve(controller);
          }
          return null;
        }, (r2) => {
          ReadableStreamDefaultControllerError(readable._readableStreamController, r2);
          defaultControllerFinishPromiseReject(controller, r2);
          return null;
        });
        return controller._finishPromise;
      }
      function TransformStreamDefaultSourcePullAlgorithm(stream) {
        TransformStreamSetBackpressure(stream, false);
        return stream._backpressureChangePromise;
      }
      function TransformStreamDefaultSourceCancelAlgorithm(stream, reason) {
        const controller = stream._transformStreamController;
        if (controller._finishPromise !== void 0) {
          return controller._finishPromise;
        }
        const writable = stream._writable;
        controller._finishPromise = newPromise((resolve, reject) => {
          controller._finishPromise_resolve = resolve;
          controller._finishPromise_reject = reject;
        });
        const cancelPromise = controller._cancelAlgorithm(reason);
        TransformStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(cancelPromise, () => {
          if (writable._state === "errored") {
            defaultControllerFinishPromiseReject(controller, writable._storedError);
          } else {
            WritableStreamDefaultControllerErrorIfNeeded(writable._writableStreamController, reason);
            TransformStreamUnblockWrite(stream);
            defaultControllerFinishPromiseResolve(controller);
          }
          return null;
        }, (r2) => {
          WritableStreamDefaultControllerErrorIfNeeded(writable._writableStreamController, r2);
          TransformStreamUnblockWrite(stream);
          defaultControllerFinishPromiseReject(controller, r2);
          return null;
        });
        return controller._finishPromise;
      }
      function defaultControllerBrandCheckException(name) {
        return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
      }
      function defaultControllerFinishPromiseResolve(controller) {
        if (controller._finishPromise_resolve === void 0) {
          return;
        }
        controller._finishPromise_resolve();
        controller._finishPromise_resolve = void 0;
        controller._finishPromise_reject = void 0;
      }
      function defaultControllerFinishPromiseReject(controller, reason) {
        if (controller._finishPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(controller._finishPromise);
        controller._finishPromise_reject(reason);
        controller._finishPromise_resolve = void 0;
        controller._finishPromise_reject = void 0;
      }
      function streamBrandCheckException(name) {
        return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
      }
      exports3.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
      exports3.CountQueuingStrategy = CountQueuingStrategy;
      exports3.ReadableByteStreamController = ReadableByteStreamController;
      exports3.ReadableStream = ReadableStream2;
      exports3.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
      exports3.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
      exports3.ReadableStreamDefaultController = ReadableStreamDefaultController;
      exports3.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
      exports3.TransformStream = TransformStream;
      exports3.TransformStreamDefaultController = TransformStreamDefaultController;
      exports3.WritableStream = WritableStream;
      exports3.WritableStreamDefaultController = WritableStreamDefaultController;
      exports3.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
    });
  }
});

// node_modules/fetch-blob/streams.cjs
var require_streams = __commonJS({
  "node_modules/fetch-blob/streams.cjs"() {
    var POOL_SIZE2 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error) {
          process2.emitWarning = emitWarning;
          throw error;
        }
      } catch (error) {
        Object.assign(globalThis, require_ponyfill_es2018());
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE2));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error) {
    }
  }
});

// node_modules/fetch-blob/index.js
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* (
        /** @type {AsyncIterableIterator<Uint8Array>} */
        part.stream()
      );
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0, b = (
        /** @type {Blob} */
        part
      );
      while (position !== b.size) {
        const chunk = b.slice(position, Math.min(b.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
var import_streams, POOL_SIZE, _Blob, Blob2, fetch_blob_default;
var init_fetch_blob = __esm({
  "node_modules/fetch-blob/index.js"() {
    import_streams = __toESM(require_streams(), 1);
    POOL_SIZE = 65536;
    _Blob = class Blob {
      /** @type {Array.<(Blob|Uint8Array)>} */
      #parts = [];
      #type = "";
      #size = 0;
      #endings = "transparent";
      /**
       * The Blob() constructor returns a new Blob object. The content
       * of the blob consists of the concatenation of the values given
       * in the parameter array.
       *
       * @param {*} blobParts
       * @param {{ type?: string, endings?: string }} [options]
       */
      constructor(blobParts = [], options = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options !== "object" && typeof options !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options === null) options = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(`${element}`);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        this.#endings = `${options.endings === void 0 ? "transparent" : options.endings}`;
        const type = options.type === void 0 ? "" : String(options.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      /**
       * The Blob interface's size property returns the
       * size of the Blob in bytes.
       */
      get size() {
        return this.#size;
      }
      /**
       * The type property of a Blob object returns the MIME type of the file.
       */
      get type() {
        return this.#type;
      }
      /**
       * The text() method in the Blob interface returns a Promise
       * that resolves with a string containing the contents of
       * the blob, interpreted as UTF-8.
       *
       * @return {Promise<string>}
       */
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      /**
       * The arrayBuffer() method in the Blob interface returns a
       * Promise that resolves with the contents of the blob as
       * binary data contained in an ArrayBuffer.
       *
       * @return {Promise<ArrayBuffer>}
       */
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          // @ts-ignore
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      /**
       * The Blob interface's slice() method creates and returns a
       * new Blob object which contains data from a subset of the
       * blob on which it's called.
       *
       * @param {number} [start]
       * @param {number} [end]
       * @param {string} [type]
       */
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    fetch_blob_default = Blob2;
  }
});

// node_modules/fetch-blob/file.js
var _File, File2, file_default;
var init_file = __esm({
  "node_modules/fetch-blob/file.js"() {
    init_fetch_blob();
    _File = class File extends fetch_blob_default {
      #lastModified = 0;
      #name = "";
      /**
       * @param {*[]} fileBits
       * @param {string} fileName
       * @param {{lastModified?: number, type?: string}} options
       */
      // @ts-ignore
      constructor(fileBits, fileName, options = {}) {
        if (arguments.length < 2) {
          throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
        }
        super(fileBits, options);
        if (options === null) options = {};
        const lastModified = options.lastModified === void 0 ? Date.now() : Number(options.lastModified);
        if (!Number.isNaN(lastModified)) {
          this.#lastModified = lastModified;
        }
        this.#name = String(fileName);
      }
      get name() {
        return this.#name;
      }
      get lastModified() {
        return this.#lastModified;
      }
      get [Symbol.toStringTag]() {
        return "File";
      }
      static [Symbol.hasInstance](object) {
        return !!object && object instanceof fetch_blob_default && /^(File)$/.test(object[Symbol.toStringTag]);
      }
    };
    File2 = _File;
    file_default = File2;
  }
});

// node_modules/formdata-polyfill/esm.min.js
function formDataToBlob(F2, B = fetch_blob_default) {
  var b = `${r()}${r()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), c = [], p = `--${b}\r
Content-Disposition: form-data; name="`;
  F2.forEach((v, n) => typeof v == "string" ? c.push(p + e(n) + `"\r
\r
${v.replace(/\r(?!\n)|(?<!\r)\n/g, "\r\n")}\r
`) : c.push(p + e(n) + `"; filename="${e(v.name, 1)}"\r
Content-Type: ${v.type || "application/octet-stream"}\r
\r
`, v, "\r\n"));
  c.push(`--${b}--`);
  return new B(c, { type: "multipart/form-data; boundary=" + b });
}
var t, i, h, r, m, f, e, x, FormData;
var init_esm_min = __esm({
  "node_modules/formdata-polyfill/esm.min.js"() {
    init_fetch_blob();
    init_file();
    ({ toStringTag: t, iterator: i, hasInstance: h } = Symbol);
    r = Math.random;
    m = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(",");
    f = (a, b, c) => (a += "", /^(Blob|File)$/.test(b && b[t]) ? [(c = c !== void 0 ? c + "" : b[t] == "File" ? b.name : "blob", a), b.name !== c || b[t] == "blob" ? new file_default([b], c, b) : b] : [a, b + ""]);
    e = (c, f3) => (f3 ? c : c.replace(/\r?\n|\r/g, "\r\n")).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22");
    x = (n, a, e2) => {
      if (a.length < e2) {
        throw new TypeError(`Failed to execute '${n}' on 'FormData': ${e2} arguments required, but only ${a.length} present.`);
      }
    };
    FormData = class FormData2 {
      #d = [];
      constructor(...a) {
        if (a.length) throw new TypeError(`Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`);
      }
      get [t]() {
        return "FormData";
      }
      [i]() {
        return this.entries();
      }
      static [h](o) {
        return o && typeof o === "object" && o[t] === "FormData" && !m.some((m2) => typeof o[m2] != "function");
      }
      append(...a) {
        x("append", arguments, 2);
        this.#d.push(f(...a));
      }
      delete(a) {
        x("delete", arguments, 1);
        a += "";
        this.#d = this.#d.filter(([b]) => b !== a);
      }
      get(a) {
        x("get", arguments, 1);
        a += "";
        for (var b = this.#d, l = b.length, c = 0; c < l; c++) if (b[c][0] === a) return b[c][1];
        return null;
      }
      getAll(a, b) {
        x("getAll", arguments, 1);
        b = [];
        a += "";
        this.#d.forEach((c) => c[0] === a && b.push(c[1]));
        return b;
      }
      has(a) {
        x("has", arguments, 1);
        a += "";
        return this.#d.some((b) => b[0] === a);
      }
      forEach(a, b) {
        x("forEach", arguments, 1);
        for (var [c, d] of this) a.call(b, d, c, this);
      }
      set(...a) {
        x("set", arguments, 2);
        var b = [], c = true;
        a = f(...a);
        this.#d.forEach((d) => {
          d[0] === a[0] ? c && (c = !b.push(a)) : b.push(d);
        });
        c && b.push(a);
        this.#d = b;
      }
      *entries() {
        yield* this.#d;
      }
      *keys() {
        for (var [a] of this) yield a;
      }
      *values() {
        for (var [, a] of this) yield a;
      }
    };
  }
});

// node_modules/node-domexception/index.js
var require_node_domexception = __commonJS({
  "node_modules/node-domexception/index.js"(exports2, module2) {
    if (!globalThis.DOMException) {
      try {
        const { MessageChannel } = require("worker_threads"), port = new MessageChannel().port1, ab = new ArrayBuffer();
        port.postMessage(ab, [ab, ab]);
      } catch (err) {
        err.constructor.name === "DOMException" && (globalThis.DOMException = err.constructor);
      }
    }
    module2.exports = globalThis.DOMException;
  }
});

// node_modules/fetch-blob/from.js
var import_node_fs, import_node_domexception, stat;
var init_from = __esm({
  "node_modules/fetch-blob/from.js"() {
    import_node_fs = require("node:fs");
    import_node_domexception = __toESM(require_node_domexception(), 1);
    init_file();
    init_fetch_blob();
    ({ stat } = import_node_fs.promises);
  }
});

// node_modules/node-fetch/src/utils/multipart-parser.js
var multipart_parser_exports = {};
__export(multipart_parser_exports, {
  toFormData: () => toFormData
});
function _fileName(headerValue) {
  const m2 = headerValue.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i);
  if (!m2) {
    return;
  }
  const match = m2[2] || m2[3] || "";
  let filename = match.slice(match.lastIndexOf("\\") + 1);
  filename = filename.replace(/%22/g, '"');
  filename = filename.replace(/&#(\d{4});/g, (m3, code) => {
    return String.fromCharCode(code);
  });
  return filename;
}
async function toFormData(Body2, ct) {
  if (!/multipart/i.test(ct)) {
    throw new TypeError("Failed to fetch");
  }
  const m2 = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m2) {
    throw new TypeError("no or bad content-type header, no multipart boundary");
  }
  const parser = new MultipartParser(m2[1] || m2[2]);
  let headerField;
  let headerValue;
  let entryValue;
  let entryName;
  let contentType;
  let filename;
  const entryChunks = [];
  const formData = new FormData();
  const onPartData = (ui8a) => {
    entryValue += decoder.decode(ui8a, { stream: true });
  };
  const appendToFile = (ui8a) => {
    entryChunks.push(ui8a);
  };
  const appendFileToFormData = () => {
    const file = new file_default(entryChunks, filename, { type: contentType });
    formData.append(entryName, file);
  };
  const appendEntryToFormData = () => {
    formData.append(entryName, entryValue);
  };
  const decoder = new TextDecoder("utf-8");
  decoder.decode();
  parser.onPartBegin = function() {
    parser.onPartData = onPartData;
    parser.onPartEnd = appendEntryToFormData;
    headerField = "";
    headerValue = "";
    entryValue = "";
    entryName = "";
    contentType = "";
    filename = null;
    entryChunks.length = 0;
  };
  parser.onHeaderField = function(ui8a) {
    headerField += decoder.decode(ui8a, { stream: true });
  };
  parser.onHeaderValue = function(ui8a) {
    headerValue += decoder.decode(ui8a, { stream: true });
  };
  parser.onHeaderEnd = function() {
    headerValue += decoder.decode();
    headerField = headerField.toLowerCase();
    if (headerField === "content-disposition") {
      const m3 = headerValue.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i);
      if (m3) {
        entryName = m3[2] || m3[3] || "";
      }
      filename = _fileName(headerValue);
      if (filename) {
        parser.onPartData = appendToFile;
        parser.onPartEnd = appendFileToFormData;
      }
    } else if (headerField === "content-type") {
      contentType = headerValue;
    }
    headerValue = "";
    headerField = "";
  };
  for await (const chunk of Body2) {
    parser.write(chunk);
  }
  parser.end();
  return formData;
}
var s, S, f2, F, LF, CR, SPACE, HYPHEN, COLON, A, Z, lower, noop, MultipartParser;
var init_multipart_parser = __esm({
  "node_modules/node-fetch/src/utils/multipart-parser.js"() {
    init_from();
    init_esm_min();
    s = 0;
    S = {
      START_BOUNDARY: s++,
      HEADER_FIELD_START: s++,
      HEADER_FIELD: s++,
      HEADER_VALUE_START: s++,
      HEADER_VALUE: s++,
      HEADER_VALUE_ALMOST_DONE: s++,
      HEADERS_ALMOST_DONE: s++,
      PART_DATA_START: s++,
      PART_DATA: s++,
      END: s++
    };
    f2 = 1;
    F = {
      PART_BOUNDARY: f2,
      LAST_BOUNDARY: f2 *= 2
    };
    LF = 10;
    CR = 13;
    SPACE = 32;
    HYPHEN = 45;
    COLON = 58;
    A = 97;
    Z = 122;
    lower = (c) => c | 32;
    noop = () => {
    };
    MultipartParser = class {
      /**
       * @param {string} boundary
       */
      constructor(boundary) {
        this.index = 0;
        this.flags = 0;
        this.onHeaderEnd = noop;
        this.onHeaderField = noop;
        this.onHeadersEnd = noop;
        this.onHeaderValue = noop;
        this.onPartBegin = noop;
        this.onPartData = noop;
        this.onPartEnd = noop;
        this.boundaryChars = {};
        boundary = "\r\n--" + boundary;
        const ui8a = new Uint8Array(boundary.length);
        for (let i2 = 0; i2 < boundary.length; i2++) {
          ui8a[i2] = boundary.charCodeAt(i2);
          this.boundaryChars[ui8a[i2]] = true;
        }
        this.boundary = ui8a;
        this.lookbehind = new Uint8Array(this.boundary.length + 8);
        this.state = S.START_BOUNDARY;
      }
      /**
       * @param {Uint8Array} data
       */
      write(data) {
        let i2 = 0;
        const length_ = data.length;
        let previousIndex = this.index;
        let { lookbehind, boundary, boundaryChars, index, state, flags } = this;
        const boundaryLength = this.boundary.length;
        const boundaryEnd = boundaryLength - 1;
        const bufferLength = data.length;
        let c;
        let cl;
        const mark = (name) => {
          this[name + "Mark"] = i2;
        };
        const clear = (name) => {
          delete this[name + "Mark"];
        };
        const callback = (callbackSymbol, start, end, ui8a) => {
          if (start === void 0 || start !== end) {
            this[callbackSymbol](ui8a && ui8a.subarray(start, end));
          }
        };
        const dataCallback = (name, clear2) => {
          const markSymbol = name + "Mark";
          if (!(markSymbol in this)) {
            return;
          }
          if (clear2) {
            callback(name, this[markSymbol], i2, data);
            delete this[markSymbol];
          } else {
            callback(name, this[markSymbol], data.length, data);
            this[markSymbol] = 0;
          }
        };
        for (i2 = 0; i2 < length_; i2++) {
          c = data[i2];
          switch (state) {
            case S.START_BOUNDARY:
              if (index === boundary.length - 2) {
                if (c === HYPHEN) {
                  flags |= F.LAST_BOUNDARY;
                } else if (c !== CR) {
                  return;
                }
                index++;
                break;
              } else if (index - 1 === boundary.length - 2) {
                if (flags & F.LAST_BOUNDARY && c === HYPHEN) {
                  state = S.END;
                  flags = 0;
                } else if (!(flags & F.LAST_BOUNDARY) && c === LF) {
                  index = 0;
                  callback("onPartBegin");
                  state = S.HEADER_FIELD_START;
                } else {
                  return;
                }
                break;
              }
              if (c !== boundary[index + 2]) {
                index = -2;
              }
              if (c === boundary[index + 2]) {
                index++;
              }
              break;
            case S.HEADER_FIELD_START:
              state = S.HEADER_FIELD;
              mark("onHeaderField");
              index = 0;
            // falls through
            case S.HEADER_FIELD:
              if (c === CR) {
                clear("onHeaderField");
                state = S.HEADERS_ALMOST_DONE;
                break;
              }
              index++;
              if (c === HYPHEN) {
                break;
              }
              if (c === COLON) {
                if (index === 1) {
                  return;
                }
                dataCallback("onHeaderField", true);
                state = S.HEADER_VALUE_START;
                break;
              }
              cl = lower(c);
              if (cl < A || cl > Z) {
                return;
              }
              break;
            case S.HEADER_VALUE_START:
              if (c === SPACE) {
                break;
              }
              mark("onHeaderValue");
              state = S.HEADER_VALUE;
            // falls through
            case S.HEADER_VALUE:
              if (c === CR) {
                dataCallback("onHeaderValue", true);
                callback("onHeaderEnd");
                state = S.HEADER_VALUE_ALMOST_DONE;
              }
              break;
            case S.HEADER_VALUE_ALMOST_DONE:
              if (c !== LF) {
                return;
              }
              state = S.HEADER_FIELD_START;
              break;
            case S.HEADERS_ALMOST_DONE:
              if (c !== LF) {
                return;
              }
              callback("onHeadersEnd");
              state = S.PART_DATA_START;
              break;
            case S.PART_DATA_START:
              state = S.PART_DATA;
              mark("onPartData");
            // falls through
            case S.PART_DATA:
              previousIndex = index;
              if (index === 0) {
                i2 += boundaryEnd;
                while (i2 < bufferLength && !(data[i2] in boundaryChars)) {
                  i2 += boundaryLength;
                }
                i2 -= boundaryEnd;
                c = data[i2];
              }
              if (index < boundary.length) {
                if (boundary[index] === c) {
                  if (index === 0) {
                    dataCallback("onPartData", true);
                  }
                  index++;
                } else {
                  index = 0;
                }
              } else if (index === boundary.length) {
                index++;
                if (c === CR) {
                  flags |= F.PART_BOUNDARY;
                } else if (c === HYPHEN) {
                  flags |= F.LAST_BOUNDARY;
                } else {
                  index = 0;
                }
              } else if (index - 1 === boundary.length) {
                if (flags & F.PART_BOUNDARY) {
                  index = 0;
                  if (c === LF) {
                    flags &= ~F.PART_BOUNDARY;
                    callback("onPartEnd");
                    callback("onPartBegin");
                    state = S.HEADER_FIELD_START;
                    break;
                  }
                } else if (flags & F.LAST_BOUNDARY) {
                  if (c === HYPHEN) {
                    callback("onPartEnd");
                    state = S.END;
                    flags = 0;
                  } else {
                    index = 0;
                  }
                } else {
                  index = 0;
                }
              }
              if (index > 0) {
                lookbehind[index - 1] = c;
              } else if (previousIndex > 0) {
                const _lookbehind = new Uint8Array(lookbehind.buffer, lookbehind.byteOffset, lookbehind.byteLength);
                callback("onPartData", 0, previousIndex, _lookbehind);
                previousIndex = 0;
                mark("onPartData");
                i2--;
              }
              break;
            case S.END:
              break;
            default:
              throw new Error(`Unexpected state entered: ${state}`);
          }
        }
        dataCallback("onHeaderField");
        dataCallback("onHeaderValue");
        dataCallback("onPartData");
        this.index = index;
        this.state = state;
        this.flags = flags;
      }
      end() {
        if (this.state === S.HEADER_FIELD_START && this.index === 0 || this.state === S.PART_DATA && this.index === this.boundary.length) {
          this.onPartEnd();
        } else if (this.state !== S.END) {
          throw new Error("MultipartParser.end(): stream ended unexpectedly");
        }
      }
    };
  }
});

// src/app.ts
var import_supertrend = __toESM(require_build());

// src/core/utils.ts
function convertStringToNumbers(candles) {
  return candles.reduce((result, candle) => {
    const [
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored
    ] = candle;
    const newObj = {
      time: new Date(Number(time)).toISOString(),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      closeTime: Number(closeTime),
      assetVolume: Number(assetVolume),
      trades: Number(trades),
      buyBaseVolume: Number(buyBaseVolume),
      buyAssetVolume: Number(buyAssetVolume),
      ignored
    };
    return [...result, newObj];
  }, []);
}

// node_modules/node-fetch/src/index.js
var import_node_http2 = __toESM(require("node:http"), 1);
var import_node_https = __toESM(require("node:https"), 1);
var import_node_zlib = __toESM(require("node:zlib"), 1);
var import_node_stream2 = __toESM(require("node:stream"), 1);
var import_node_buffer2 = require("node:buffer");

// node_modules/data-uri-to-buffer/dist/index.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i2 = 1; i2 < meta.length; i2++) {
    if (meta[i2] === "base64") {
      base64 = true;
    } else if (meta[i2]) {
      typeFull += `;${meta[i2]}`;
      if (meta[i2].indexOf("charset=") === 0) {
        charset = meta[i2].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var dist_default = dataUriToBuffer;

// node_modules/node-fetch/src/body.js
var import_node_stream = __toESM(require("node:stream"), 1);
var import_node_util = require("node:util");
var import_node_buffer = require("node:buffer");
init_fetch_blob();
init_esm_min();

// node_modules/node-fetch/src/errors/base.js
var FetchBaseError = class extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
};

// node_modules/node-fetch/src/errors/fetch-error.js
var FetchError = class extends FetchBaseError {
  /**
   * @param  {string} message -      Error message for human
   * @param  {string} [type] -        Error type for machine
   * @param  {SystemError} [systemError] - For Node.js system error
   */
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
};

// node_modules/node-fetch/src/utils/is.js
var NAME = Symbol.toStringTag;
var isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
var isBlob = (object) => {
  return object && typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
var isAbortSignal = (object) => {
  return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
};
var isDomainOrSubdomain = (destination, original) => {
  const orig = new URL(original).hostname;
  const dest = new URL(destination).hostname;
  return orig === dest || orig.endsWith(`.${dest}`);
};
var isSameProtocol = (destination, original) => {
  const orig = new URL(original).protocol;
  const dest = new URL(destination).protocol;
  return orig === dest;
};

// node_modules/node-fetch/src/body.js
var pipeline = (0, import_node_util.promisify)(import_node_stream.default.pipeline);
var INTERNALS = Symbol("Body internals");
var Body = class {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = import_node_buffer.Buffer.from(body.toString());
    } else if (isBlob(body)) {
    } else if (import_node_buffer.Buffer.isBuffer(body)) {
    } else if (import_node_util.types.isAnyArrayBuffer(body)) {
      body = import_node_buffer.Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = import_node_buffer.Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof import_node_stream.default) {
    } else if (body instanceof FormData) {
      body = formDataToBlob(body);
      boundary = body.type.split("=")[1];
    } else {
      body = import_node_buffer.Buffer.from(String(body));
    }
    let stream = body;
    if (import_node_buffer.Buffer.isBuffer(body)) {
      stream = import_node_stream.default.Readable.from(body);
    } else if (isBlob(body)) {
      stream = import_node_stream.default.Readable.from(body.stream());
    }
    this[INTERNALS] = {
      body,
      stream,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof import_node_stream.default) {
      body.on("error", (error_) => {
        const error = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
        this[INTERNALS].error = error;
      });
    }
  }
  get body() {
    return this[INTERNALS].stream;
  }
  get bodyUsed() {
    return this[INTERNALS].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  async arrayBuffer() {
    const { buffer, byteOffset, byteLength } = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async formData() {
    const ct = this.headers.get("content-type");
    if (ct.startsWith("application/x-www-form-urlencoded")) {
      const formData = new FormData();
      const parameters = new URLSearchParams(await this.text());
      for (const [name, value] of parameters) {
        formData.append(name, value);
      }
      return formData;
    }
    const { toFormData: toFormData2 } = await Promise.resolve().then(() => (init_multipart_parser(), multipart_parser_exports));
    return toFormData2(this.body, ct);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS].body && this[INTERNALS].body.type || "";
    const buf = await this.arrayBuffer();
    return new fetch_blob_default([buf], {
      type: ct
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */
  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */
  async text() {
    const buffer = await consumeBody(this);
    return new TextDecoder().decode(buffer);
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return consumeBody(this);
  }
};
Body.prototype.buffer = (0, import_node_util.deprecate)(Body.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer");
Object.defineProperties(Body.prototype, {
  body: { enumerable: true },
  bodyUsed: { enumerable: true },
  arrayBuffer: { enumerable: true },
  blob: { enumerable: true },
  json: { enumerable: true },
  text: { enumerable: true },
  data: { get: (0, import_node_util.deprecate)(
    () => {
    },
    "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
    "https://github.com/node-fetch/node-fetch/issues/1000 (response)"
  ) }
});
async function consumeBody(data) {
  if (data[INTERNALS].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS].disturbed = true;
  if (data[INTERNALS].error) {
    throw data[INTERNALS].error;
  }
  const { body } = data;
  if (body === null) {
    return import_node_buffer.Buffer.alloc(0);
  }
  if (!(body instanceof import_node_stream.default)) {
    return import_node_buffer.Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error);
        throw error;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error) {
    const error_ = error instanceof FetchBaseError ? error : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error.message}`, "system", error);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return import_node_buffer.Buffer.from(accum.join(""));
      }
      return import_node_buffer.Buffer.concat(accum, accumBytes);
    } catch (error) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error.message}`, "system", error);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
var clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let { body } = instance[INTERNALS];
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof import_node_stream.default && typeof body.getBoundary !== "function") {
    p1 = new import_node_stream.PassThrough({ highWaterMark });
    p2 = new import_node_stream.PassThrough({ highWaterMark });
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS].stream = p1;
    body = p2;
  }
  return body;
};
var getNonSpecFormDataBoundary = (0, import_node_util.deprecate)(
  (body) => body.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  "https://github.com/node-fetch/node-fetch/issues/1167"
);
var extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (import_node_buffer.Buffer.isBuffer(body) || import_node_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body instanceof FormData) {
    return `multipart/form-data; boundary=${request[INTERNALS].boundary}`;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`;
  }
  if (body instanceof import_node_stream.default) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
var getTotalBytes = (request) => {
  const { body } = request[INTERNALS];
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (import_node_buffer.Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  return null;
};
var writeToStream = async (dest, { body }) => {
  if (body === null) {
    dest.end();
  } else {
    await pipeline(body, dest);
  }
};

// node_modules/node-fetch/src/headers.js
var import_node_util2 = require("node:util");
var import_node_http = __toESM(require("node:http"), 1);
var validateHeaderName = typeof import_node_http.default.validateHeaderName === "function" ? import_node_http.default.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const error = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw error;
  }
};
var validateHeaderValue = typeof import_node_http.default.validateHeaderValue === "function" ? import_node_http.default.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const error = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_CHAR" });
    throw error;
  }
};
var Headers = class _Headers extends URLSearchParams {
  /**
   * Headers class
   *
   * @constructor
   * @param {HeadersInit} [init] - Response headers
   */
  constructor(init) {
    let result = [];
    if (init instanceof _Headers) {
      const raw = init.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init == null) {
    } else if (typeof init === "object" && !import_node_util2.types.isBoxedPrimitive(init)) {
      const method = init[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init].map((pair) => {
          if (typeof pair !== "object" || import_node_util2.types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(
                target,
                String(name).toLowerCase(),
                String(value)
              );
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(
                target,
                String(name).toLowerCase()
              );
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback, thisArg = void 0) {
    for (const name of this.keys()) {
      Reflect.apply(callback, thisArg, [this.get(name), name, this]);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  /**
   * @type {() => IterableIterator<[string, string]>}
   */
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
};
Object.defineProperties(
  Headers.prototype,
  ["get", "entries", "forEach", "values"].reduce((result, property) => {
    result[property] = { enumerable: true };
    return result;
  }, {})
);
function fromRawHeaders(headers = []) {
  return new Headers(
    headers.reduce((result, value, index, array) => {
      if (index % 2 === 0) {
        result.push(array.slice(index, index + 2));
      }
      return result;
    }, []).filter(([name, value]) => {
      try {
        validateHeaderName(name);
        validateHeaderValue(name, String(value));
        return true;
      } catch {
        return false;
      }
    })
  );
}

// node_modules/node-fetch/src/utils/is-redirect.js
var redirectStatus = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
var isRedirect = (code) => {
  return redirectStatus.has(code);
};

// node_modules/node-fetch/src/response.js
var INTERNALS2 = Symbol("Response internals");
var Response = class _Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status != null ? options.status : 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS2] = {
      type: "default",
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get type() {
    return this[INTERNALS2].type;
  }
  get url() {
    return this[INTERNALS2].url || "";
  }
  get status() {
    return this[INTERNALS2].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */
  get ok() {
    return this[INTERNALS2].status >= 200 && this[INTERNALS2].status < 300;
  }
  get redirected() {
    return this[INTERNALS2].counter > 0;
  }
  get statusText() {
    return this[INTERNALS2].statusText;
  }
  get headers() {
    return this[INTERNALS2].headers;
  }
  get highWaterMark() {
    return this[INTERNALS2].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */
  clone() {
    return new _Response(clone(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new _Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  static error() {
    const response = new _Response(null, { status: 0, statusText: "" });
    response[INTERNALS2].type = "error";
    return response;
  }
  static json(data = void 0, init = {}) {
    const body = JSON.stringify(data);
    if (body === void 0) {
      throw new TypeError("data is not JSON serializable");
    }
    const headers = new Headers(init && init.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new _Response(body, {
      ...init,
      headers
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
};
Object.defineProperties(Response.prototype, {
  type: { enumerable: true },
  url: { enumerable: true },
  status: { enumerable: true },
  ok: { enumerable: true },
  redirected: { enumerable: true },
  statusText: { enumerable: true },
  headers: { enumerable: true },
  clone: { enumerable: true }
});

// node_modules/node-fetch/src/request.js
var import_node_url = require("node:url");
var import_node_util3 = require("node:util");

// node_modules/node-fetch/src/utils/get-search.js
var getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};

// node_modules/node-fetch/src/utils/referrer.js
var import_node_net = require("node:net");
function stripURLForUseAsAReferrer(url, originOnly = false) {
  if (url == null) {
    return "no-referrer";
  }
  url = new URL(url);
  if (/^(about|blob|data):$/.test(url.protocol)) {
    return "no-referrer";
  }
  url.username = "";
  url.password = "";
  url.hash = "";
  if (originOnly) {
    url.pathname = "";
    url.search = "";
  }
  return url;
}
var ReferrerPolicy = /* @__PURE__ */ new Set([
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
]);
var DEFAULT_REFERRER_POLICY = "strict-origin-when-cross-origin";
function validateReferrerPolicy(referrerPolicy) {
  if (!ReferrerPolicy.has(referrerPolicy)) {
    throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`);
  }
  return referrerPolicy;
}
function isOriginPotentiallyTrustworthy(url) {
  if (/^(http|ws)s:$/.test(url.protocol)) {
    return true;
  }
  const hostIp = url.host.replace(/(^\[)|(]$)/g, "");
  const hostIPVersion = (0, import_node_net.isIP)(hostIp);
  if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
    return true;
  }
  if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
    return true;
  }
  if (url.host === "localhost" || url.host.endsWith(".localhost")) {
    return false;
  }
  if (url.protocol === "file:") {
    return true;
  }
  return false;
}
function isUrlPotentiallyTrustworthy(url) {
  if (/^about:(blank|srcdoc)$/.test(url)) {
    return true;
  }
  if (url.protocol === "data:") {
    return true;
  }
  if (/^(blob|filesystem):$/.test(url.protocol)) {
    return true;
  }
  return isOriginPotentiallyTrustworthy(url);
}
function determineRequestsReferrer(request, { referrerURLCallback, referrerOriginCallback } = {}) {
  if (request.referrer === "no-referrer" || request.referrerPolicy === "") {
    return null;
  }
  const policy = request.referrerPolicy;
  if (request.referrer === "about:client") {
    return "no-referrer";
  }
  const referrerSource = request.referrer;
  let referrerURL = stripURLForUseAsAReferrer(referrerSource);
  let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true);
  if (referrerURL.toString().length > 4096) {
    referrerURL = referrerOrigin;
  }
  if (referrerURLCallback) {
    referrerURL = referrerURLCallback(referrerURL);
  }
  if (referrerOriginCallback) {
    referrerOrigin = referrerOriginCallback(referrerOrigin);
  }
  const currentURL = new URL(request.url);
  switch (policy) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return referrerOrigin;
    case "unsafe-url":
      return referrerURL;
    case "strict-origin":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin.toString();
    case "strict-origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin;
    case "same-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return "no-referrer";
    case "origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return referrerOrigin;
    case "no-referrer-when-downgrade":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerURL;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${policy}`);
  }
}
function parseReferrerPolicyFromHeader(headers) {
  const policyTokens = (headers.get("referrer-policy") || "").split(/[,\s]+/);
  let policy = "";
  for (const token of policyTokens) {
    if (token && ReferrerPolicy.has(token)) {
      policy = token;
    }
  }
  return policy;
}

// node_modules/node-fetch/src/request.js
var INTERNALS3 = Symbol("Request internals");
var isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS3] === "object";
};
var doBadDataWarn = (0, import_node_util3.deprecate)(
  () => {
  },
  ".data is not a valid RequestInit property, use .body instead",
  "https://github.com/node-fetch/node-fetch/issues/1000 (request)"
);
var Request = class _Request extends Body {
  constructor(input, init = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    if (parsedURL.username !== "" || parsedURL.password !== "") {
      throw new TypeError(`${parsedURL} is an url with embedded credentials.`);
    }
    let method = init.method || input.method || "GET";
    if (/^(delete|get|head|options|post|put)$/i.test(method)) {
      method = method.toUpperCase();
    }
    if (!isRequest(init) && "data" in init) {
      doBadDataWarn();
    }
    if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init.body ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init.size || input.size || 0
    });
    const headers = new Headers(init.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init) {
      signal = init.signal;
    }
    if (signal != null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
    }
    let referrer = init.referrer == null ? input.referrer : init.referrer;
    if (referrer === "") {
      referrer = "no-referrer";
    } else if (referrer) {
      const parsedReferrer = new URL(referrer);
      referrer = /^about:(\/\/)?client$/.test(parsedReferrer) ? "client" : parsedReferrer;
    } else {
      referrer = void 0;
    }
    this[INTERNALS3] = {
      method,
      redirect: init.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal,
      referrer
    };
    this.follow = init.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init.follow;
    this.compress = init.compress === void 0 ? input.compress === void 0 ? true : input.compress : init.compress;
    this.counter = init.counter || input.counter || 0;
    this.agent = init.agent || input.agent;
    this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init.insecureHTTPParser || input.insecureHTTPParser || false;
    this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || "";
  }
  /** @returns {string} */
  get method() {
    return this[INTERNALS3].method;
  }
  /** @returns {string} */
  get url() {
    return (0, import_node_url.format)(this[INTERNALS3].parsedURL);
  }
  /** @returns {Headers} */
  get headers() {
    return this[INTERNALS3].headers;
  }
  get redirect() {
    return this[INTERNALS3].redirect;
  }
  /** @returns {AbortSignal} */
  get signal() {
    return this[INTERNALS3].signal;
  }
  // https://fetch.spec.whatwg.org/#dom-request-referrer
  get referrer() {
    if (this[INTERNALS3].referrer === "no-referrer") {
      return "";
    }
    if (this[INTERNALS3].referrer === "client") {
      return "about:client";
    }
    if (this[INTERNALS3].referrer) {
      return this[INTERNALS3].referrer.toString();
    }
    return void 0;
  }
  get referrerPolicy() {
    return this[INTERNALS3].referrerPolicy;
  }
  set referrerPolicy(referrerPolicy) {
    this[INTERNALS3].referrerPolicy = validateReferrerPolicy(referrerPolicy);
  }
  /**
   * Clone this request
   *
   * @return  Request
   */
  clone() {
    return new _Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
};
Object.defineProperties(Request.prototype, {
  method: { enumerable: true },
  url: { enumerable: true },
  headers: { enumerable: true },
  redirect: { enumerable: true },
  clone: { enumerable: true },
  signal: { enumerable: true },
  referrer: { enumerable: true },
  referrerPolicy: { enumerable: true }
});
var getNodeRequestOptions = (request) => {
  const { parsedURL } = request[INTERNALS3];
  const headers = new Headers(request[INTERNALS3].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (request.referrerPolicy === "") {
    request.referrerPolicy = DEFAULT_REFERRER_POLICY;
  }
  if (request.referrer && request.referrer !== "no-referrer") {
    request[INTERNALS3].referrer = determineRequestsReferrer(request);
  } else {
    request[INTERNALS3].referrer = "no-referrer";
  }
  if (request[INTERNALS3].referrer instanceof URL) {
    headers.set("Referer", request.referrer);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip, deflate, br");
  }
  let { agent } = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  const search = getSearch(parsedURL);
  const options = {
    // Overwrite search to retain trailing ? (issue #776)
    path: parsedURL.pathname + search,
    // The following options are not expressed in the URL
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return {
    /** @type {URL} */
    parsedURL,
    options
  };
};

// node_modules/node-fetch/src/errors/abort-error.js
var AbortError = class extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
};

// node_modules/node-fetch/src/index.js
init_esm_min();
init_from();
var supportedSchemas = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve, reject) => {
    const request = new Request(url, options_);
    const { parsedURL, options } = getNodeRequestOptions(request);
    if (!supportedSchemas.has(parsedURL.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (parsedURL.protocol === "data:") {
      const data = dist_default(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve(response2);
      return;
    }
    const send = (parsedURL.protocol === "https:" ? import_node_https.default : import_node_http2.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error = new AbortError("The operation was aborted.");
      reject(error);
      if (request.body && request.body instanceof import_node_stream2.default.Readable) {
        request.body.destroy(error);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(parsedURL.toString(), options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error.message}`, "system", error));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error) => {
      if (response && response.body) {
        response.body.destroy(error);
      }
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error = new Error("Premature close");
            error.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        let locationURL = null;
        try {
          locationURL = location === null ? null : new URL(location, request.url);
        } catch {
          if (request.redirect !== "manual") {
            reject(new FetchError(`uri requested responds with an invalid redirect URL: ${location}`, "invalid-redirect"));
            finalize();
            return;
          }
        }
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: clone(request),
              signal: request.signal,
              size: request.size,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy
            };
            if (!isDomainOrSubdomain(request.url, locationURL) || !isSameProtocol(request.url, locationURL)) {
              for (const name of ["authorization", "www-authenticate", "cookie", "cookie2"]) {
                requestOptions.headers.delete(name);
              }
            }
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_node_stream2.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            const responseReferrerPolicy = parseReferrerPolicyFromHeader(headers);
            if (responseReferrerPolicy) {
              requestOptions.referrerPolicy = responseReferrerPolicy;
            }
            resolve(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_node_stream2.pipeline)(response_, new import_node_stream2.PassThrough(), (error) => {
        if (error) {
          reject(error);
        }
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      const zlibOptions = {
        flush: import_node_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_node_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createGunzip(zlibOptions), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_node_stream2.pipeline)(response_, new import_node_stream2.PassThrough(), (error) => {
          if (error) {
            reject(error);
          }
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createInflate(), (error) => {
              if (error) {
                reject(error);
              }
            });
          } else {
            body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createInflateRaw(), (error) => {
              if (error) {
                reject(error);
              }
            });
          }
          response = new Response(body, responseOptions);
          resolve(response);
        });
        raw.once("end", () => {
          if (!response) {
            response = new Response(body, responseOptions);
            resolve(response);
          }
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createBrotliDecompress(), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve(response);
    });
    writeToStream(request_, request).catch(reject);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = import_node_buffer2.Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error = new Error("Premature close");
        error.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error);
      }
    };
    const onData = (buf) => {
      properLastChunkReceived = import_node_buffer2.Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = import_node_buffer2.Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && import_node_buffer2.Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    };
    socket.prependListener("close", onSocketClose);
    socket.on("data", onData);
    request.on("close", () => {
      socket.removeListener("close", onSocketClose);
      socket.removeListener("data", onData);
    });
  });
}

// src/services/market.service.ts
var MarketService = class {
  constructor(market, tickInterval, limit) {
    this.market = market;
    this.tickInterval = tickInterval;
    this.limit = limit;
  }
  async fetchCandlestickData() {
    const response = await fetch(
      `https://api.binance.com/api/v1/klines?symbol=${this.market}&interval=${this.tickInterval}&limit=${this.limit + 1}`
    );
    const rawData = await response.json();
    return convertStringToNumbers(rawData).filter(
      (candle) => candle.closeTime > Date.now() - 1e3 * 60 * 60 * 24 * 7
    );
  }
};

// src/strategies/strategy-manager.ts
var StrategyManager = class {
  constructor(strategy) {
    this.strategy = strategy;
  }
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  executeStrategy(candles, superTrends) {
    return this.strategy.execute(candles, superTrends);
  }
};

// src/strategies/supertrend/supertrend-strategy.ts
var SuperTrendStrategy = class {
  execute(candles, superTrends) {
    const lastCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];
    const lastSuperTrend = superTrends[superTrends.length - 1];
    const previousSuperTrend = superTrends[superTrends.length - 2];
    if (previousCandle.close < previousSuperTrend && lastCandle.close > lastSuperTrend) {
      return "BUY";
    } else if (previousCandle.close > previousSuperTrend && lastCandle.close < lastSuperTrend) {
      return "SELL";
    }
    return "NO TRADE";
  }
};

// src/app.ts
var fs2 = __toESM(require("fs"));
var marketService = new MarketService("BTCUSDT", "15m", 100);
var strategyManager = new StrategyManager(new SuperTrendStrategy());
var logStream = fs2.createWriteStream("./output.log", { flags: "a" });
if (process.env.NODE_ENV === "production") {
  console.log = function(message) {
    logStream.write(`${(/* @__PURE__ */ new Date()).toISOString()} - ${message}
`);
    process.stdout.write(`${message}
`);
  };
}
async function runTradingBot() {
  const candlestick = await marketService.fetchCandlestickData();
  console.log("Latest Candle:", candlestick[candlestick.length - 1]);
  const superTrends = (0, import_supertrend.supertrend)({
    initialArray: candlestick,
    multiplier: 3,
    period: 10
  });
  const decision = strategyManager.executeStrategy(candlestick, superTrends);
  console.log(`Trade Decision: ${decision}`);
}
runTradingBot();
setInterval(runTradingBot, 1e3 * 60 * 5);
/*! Bundled license information:

web-streams-polyfill/dist/ponyfill.es2018.js:
  (**
   * @license
   * web-streams-polyfill v3.3.3
   * Copyright 2024 Mattias Buelens, Diwank Singh Tomer and other contributors.
   * This code is released under the MIT license.
   * SPDX-License-Identifier: MIT
   *)

fetch-blob/index.js:
  (*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

formdata-polyfill/esm.min.js:
  (*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

node-domexception/index.js:
  (*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)
*/
