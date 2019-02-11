const Fatbtc = require("./fatbtc-client");
jest.mock("winston", () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.retryTimes(3);

let client;
const market1 = {
  id: "BTCFCNY",
  base: "BTC",
  quote: "FCNY",
};

const market2 = {
  id: "LTCFCNY",
  base: "LTC",
  quote: "FCNY",
};

beforeAll(() => {
  client = new Fatbtc();
});

test("it should support tickers", () => {
  expect(client.hasTickers).toBeTruthy();
});

test("it should support trades", () => {
  expect(client.hasTrades).toBeTruthy();
});

test("it should not support level2 snapshots", () => {
  expect(client.hasLevel2Snapshots).toBeFalsy();
});

test("it should support level2 updates", () => {
  expect(client.hasLevel2Updates).toBeTruthy();
});

test("it should not support level3 snapshots", () => {
  expect(client.hasLevel3Snapshots).toBeFalsy();
});

test("it should not support level3 updates", () => {
  expect(client.hasLevel3Updates).toBeFalsy();
});

test(
  "should subscribe and emit tickers for tickers, trades, and l2updates for the same market",
  done => {
    let receivedTickerUpdate = false,
      receivedTradeUpdate = false,
      receivedL2Update = false,
      receivedTickerUpdateAfterOtherUpdates = false,
      receivedTradeUpdateAfterOtherUpdates = false,
      receivedL2UpdateAfterOtherUpdates = false;

    client.subscribeTicker(market1);
    client.subscribeTrades(market1);
    client.subscribeLevel2Updates(market1);

    client.on("ticker", t => {
      expect(t.base + t.quote).toMatch(/BTCFCNY|LTCFCNY/);
      
      receivedTickerUpdate = true;
      if (receivedTradeUpdate && receivedL2Update) {
        receivedTickerUpdateAfterOtherUpdates = true;
      }
    });
    client.on("trade", t => {
      expect(t.base + t.quote).toMatch(/BTCFCNY|LTCFCNY/);
      receivedTradeUpdate = true;
      if (receivedTickerUpdate && receivedL2Update) {
        receivedTradeUpdateAfterOtherUpdates = true;
      }
    });
    client.on("l2update", t => {
      expect(t.base + t.quote).toMatch(/BTCFCNY|LTCFCNY/);
      receivedL2Update = true;
      if (receivedTickerUpdate && receivedTradeUpdate) {
        receivedL2UpdateAfterOtherUpdates = true;
      }
    });

    var checkInterval = setInterval(() => {
      if (
        receivedTickerUpdateAfterOtherUpdates &&
        receivedTradeUpdateAfterOtherUpdates &&
        receivedL2UpdateAfterOtherUpdates
      ) {
        clearInterval(checkInterval);
        done();
      }
    }, 500);
  },
  30000
);

test(
  "should subscribe and emit tickers for 2 markets",
  done => {
    let receivedMarket1Update = false,
      receivedMarket2Update = false;

    client.subscribeTicker(market1);
    client.subscribeTicker(market2);

    client.on("ticker", function tickerHandler(t) {
      expect(t.base + t.quote).toMatch(/BTCFCNY|LTCFCNY/);

      if (t.base + t.quote === market1.base + market1.quote) {
        receivedMarket1Update = true;
      } else if (t.base + t.quote === market2.base + market2.quote) {
        receivedMarket2Update = true;
      }

      if (receivedMarket1Update && receivedMarket2Update) {
        // Need to remove this listener, otherwise it is still running during subsequent tests
        client.removeListener("ticker", tickerHandler);
        client.unsubscribeTicker(market1);
        client.unsubscribeTicker(market2);
        done();
      }
    });
  },
  60000
);


test(
  "should subscribe and emit ticker events",
  done => {
    client.subscribeTicker(market1);
    client.on("ticker", function tickerHandler(ticker) {

      expect(ticker.fullId).toMatch("Fatbtc:"+market1.base+"/"+market1.quote);
      expect(ticker.timestamp).toBeGreaterThan(1531677480465);
      expect(typeof ticker.last).not.toBe("undefined");
      expect(typeof ticker.open).not.toBe("undefined");
      expect(typeof ticker.high).not.toBe("undefined");
      expect(typeof ticker.low).not.toBe("undefined");
      expect(typeof ticker.volume).toBe("undefined");
      expect(typeof ticker.quoteVolume).toBe("undefined");
      expect(typeof ticker.change).not.toBe("undefined");
      expect(typeof ticker.changePercent).not.toBe("string");
      expect(typeof ticker.bid).toBe("undefined");
      expect(typeof ticker.bidVolume).toBe("undefined");
      expect(typeof ticker.ask).toBe("undefined");
      expect(typeof ticker.askVolume).toBe("undefined");
      expect(parseFloat(ticker.last)).toBeGreaterThan(0);
      expect(parseFloat(ticker.open)).toBeGreaterThan(0);
      expect(parseFloat(ticker.high)).toBeGreaterThan(0);
      expect(parseFloat(ticker.low)).toBeGreaterThan(0);
      expect(parseFloat(ticker.volume)).toBe(NaN);
      expect(parseFloat(ticker.quoteVolume)).toBe(NaN);
      expect(isNaN(parseFloat(ticker.change))).toBeTruthy;
      expect(isNaN(parseFloat(ticker.changePercent))).toBeFalsy();
      expect(parseFloat(ticker.bid)).toBe(NaN);
      expect(parseFloat(ticker.bidVolume)).toBe(NaN);
      expect(parseFloat(ticker.ask)).toBe(NaN);
      expect(parseFloat(ticker.askVolume)).toBe(NaN);

      // Need to remove this listener, otherwise it is still running during subsequent tests
      client.removeListener("ticker", tickerHandler);
      client.unsubscribeTicker(market1);
      done();
    });
  },
  30000
);

test(
  "should subscribe and emit trade events",
  done => {
    client.subscribeTrades(market1);
    client.on("trade", function tradeHandler(trade) {

      expect(trade.fullId).toMatch("Fatbtc:"+market1.base+"/"+market1.quote);
      expect(trade.exchange).toMatch("Fatbtc");
      expect(trade.base).toMatch(market1.base);
      expect(trade.quote).toMatch(market1.quote);
      expect(trade.tradeId).toBe(undefined);
      expect(trade.unix).toBeGreaterThan(1522540800000);
      expect(trade.side).toMatch(/buy|sell/);
      expect(typeof trade.price).toBe("number");
      expect(typeof trade.amount).toBe("number");
      expect(parseFloat(trade.price)).toBeGreaterThan(0);
      
      if (trade.side === "buy") {
        //expect(parseFloat(trade.buyOrderId)).toBeGreaterThan(0);
        //expect(trade.sellOrderId).toBeNull();
      } else {
        //expect(trade.buyOrderId).toBeNull();
        //expect(parseFloat(trade.sellOrderId)).toBeGreaterThan(0);
      }

      // Need to remove this listener, otherwise it is still running during subsequent tests
      client.removeListener("trade", tradeHandler);
      client.unsubscribeTrades(market1);
      done();
    });
  },
  30000
);

test(
  "should subscribe and emit level2 updates",
  done => {
    client.subscribeLevel2Updates(market1);

    client.on("l2update", function level2UpdateHandler(update) {
      expect(update.fullId).toMatch("Fatbtc:"+market1.base+"/"+market1.quote);
      expect(update.exchange).toMatch("Fatbtc");
      expect(update.base).toMatch(market1.base);
      expect(update.quote).toMatch(market1.quote);
      expect(update.sequenceId).toBeUndefined();
      if (update.asks.length) {
        expect(parseFloat(update.asks[0].price)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(update.asks[0].size)).toBeGreaterThanOrEqual(0);
      }
      if (update.bids.length) {
        expect(parseFloat(update.bids[0].price)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(update.bids[0].size)).toBeGreaterThanOrEqual(0);
      }

      // Need to remove this listener, otherwise it is still running during subsequent tests
      client.removeListener("l2update", level2UpdateHandler);
      client.unsubscribeLevel2Updates(market1);
      done();
    });
  },
  30000
);




test("should close connections", done => {
  client.on("closed", done);
  client.close();
});
