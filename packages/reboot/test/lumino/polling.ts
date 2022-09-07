import "./poll.spec"
import "./ratelimiter.spec"
import { IPoll, Poll } from "../../src/lumino/polling.js"
function sleep<T>(milliseconds: number = 0, value?: T): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value)
    }, milliseconds)
  })
}
describe("Poll", () => {
  let poll: Poll
  afterEach(() => {
    poll.dispose()
  })
  describe("#constructor()", () => {
    it("should create a poll", () => {
      poll = new Poll({
        auto: false,
        factory: () => Promise.resolve(),
        name: "../../src/lumino/polling:Poll#constructor()-1",
      })
      expect(poll).to.be.an.instanceof(Poll)
    })
    it("should start polling automatically", async () => {
      const expected = "started resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        name: "../../src/lumino/polling:Poll#constructor()-2",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.tick
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("should not poll if `auto` is set to false", async () => {
      const expected = ""
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        auto: false,
        name: "../../src/lumino/polling:Poll#constructor()-2",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await sleep(1000) // Sleep for longer than the interval.
      expect(ticker.join(" ")).toEqual(expected)
    })
    describe("#options.frequency", () => {
      it("should set frequency interval", () => {
        const interval = 9000
        poll = new Poll({
          factory: () => Promise.resolve(),
          frequency: { interval },
          name: "../../src/lumino/polling:Poll#frequency:interval-1",
        })
        expect(poll.frequency.interval).toEqual(interval)
      })
      it("should default frequency interval to `1000`", () => {
        poll = new Poll({
          factory: () => Promise.resolve(),
          frequency: {},
          name: "../../src/lumino/polling:Poll#frequency:interval-2",
        })
        expect(poll.frequency.interval).toEqual(1000)
      })
      it("should set backoff", () => {
        const backoff = false
        poll = new Poll({
          factory: () => Promise.resolve(),
          frequency: { backoff },
          name: "../../src/lumino/polling:Poll#frequency:backoff-1",
        })
        expect(poll.frequency.backoff).toEqual(backoff)
      })
      it("should default backoff to `true`", () => {
        poll = new Poll({
          factory: () => Promise.resolve(),
          name: "../../src/lumino/polling:Poll#frequency:backoff-2",
        })
        expect(poll.frequency.backoff).toEqual(true)
      })
      it("should set max value", () => {
        const max = 200000
        poll = new Poll({
          factory: () => Promise.resolve(),
          frequency: { max },
          name: "../../src/lumino/polling:Poll#max-1",
        })
        expect(poll.frequency.max).toEqual(200000)
      })
      it("should default max to 30s", () => {
        const interval = 500
        const max = 30 * 1000
        poll = new Poll({
          frequency: { interval },
          factory: () => Promise.resolve(),
          name: "../../src/lumino/polling:Poll#frequency:max-2",
        })
        expect(poll.frequency.max).toEqual(max)
      })
      it("should normalize max to be biggest of default, max, interval", () => {
        const interval = 25 * 1000
        const max = 20 * 1000
        poll = new Poll({
          frequency: { interval },
          factory: () => Promise.resolve(),
          name: "../../src/lumino/polling:Poll#frequency:max-3",
        })
        expect(poll.frequency.max).to.not.equal(max)
        expect(poll.frequency.max).toEqual(30 * 1000) // Poll default max
      })
      it("should normalize max to be biggest of default, max, interval", () => {
        const interval = 40 * 1000
        const max = 20 * 1000
        poll = new Poll({
          frequency: { interval },
          factory: () => Promise.resolve(),
          name: "../../src/lumino/polling:Poll#frequency:max-4",
        })
        expect(poll.frequency.max).to.not.equal(max)
        expect(poll.frequency.max).toEqual(interval)
      })
    })
  })
  describe("#name", () => {
    it("should be set to value passed in during instantation", () => {
      const factory = () => Promise.resolve()
      const name = "../../src/lumino/polling:Poll#name-1"
      poll = new Poll({ factory, name })
      expect(poll.name).toEqual(name)
    })
    it("should default to `unknown`", () => {
      poll = new Poll({ factory: () => Promise.resolve() })
      expect(poll.name).toEqual("unknown")
    })
  })
  describe("#disposed", () => {
    it("should emit when the poll is disposed", () => {
      poll = new Poll({
        factory: () => Promise.resolve(),
        name: "../../src/lumino/polling:Poll#disposed-1",
      })
      let disposed = false
      poll.disposed.connect(() => {
        disposed = true
      })
      poll.dispose()
      expect(disposed).toEqual(true)
    })
  })
  describe("#isDisposed", () => {
    it("should indicate whether the poll is disposed", () => {
      poll = new Poll({
        factory: () => Promise.resolve(),
        name: "../../src/lumino/polling:Poll#isDisposed-1",
      })
      expect(poll.isDisposed).toEqual(false)
      poll.dispose()
      expect(poll.isDisposed).toEqual(true)
    })
  })
  describe("#[Symbol.asyncIterator]", () => {
    it("should yield after each tick", async () => {
      const total = 15
      let i = 0
      poll = new Poll({
        auto: false,
        factory: () => (++i > total ? poll.stop() : Promise.resolve()),
        frequency: { interval: Poll.IMMEDIATE },
        name: "../../src/lumino/polling:Poll#[Symbol.asyncIterator]-1",
      })
      const expected = `started ${"resolved ".repeat(total)}stopped`
      const ticker: IPoll.Phase<any>[] = []
      void poll.start()
      for await (const state of poll) {
        ticker.push(state.phase)
        if (state.phase === "stopped") {
          break
        }
      }
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("should yield rejections", async () => {
      const total = 11
      let i = 0
      poll = new Poll({
        auto: false,
        factory: () => (++i > total ? poll.stop() : Promise.reject()),
        frequency: { interval: Poll.IMMEDIATE },
        name: "../../src/lumino/polling:Poll#[Symbol.asyncIterator]-2",
      })
      const expected = `started ${"rejected ".repeat(total)}stopped`
      const ticker: IPoll.Phase<any>[] = []
      void poll.start()
      for await (const state of poll) {
        ticker.push(state.phase)
        if (state.phase === "stopped") {
          break
        }
      }
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("should yield until disposed", async () => {
      const total = 7
      let i = 0
      poll = new Poll({
        auto: false,
        factory: () => Promise.resolve(++i > total ? poll.dispose() : void 0),
        frequency: { interval: Poll.IMMEDIATE },
        name: "../../src/lumino/polling:Poll#[Symbol.asyncIterator]-3",
      })
      const expected = `started${" resolved".repeat(total)}`
      const ticker: IPoll.Phase<any>[] = []
      void poll.start()
      for await (const state of poll) {
        ticker.push(state.phase)
        if (poll.isDisposed) {
          break
        }
      }
      expect(ticker.join(" ")).toEqual(expected)
    })
  })
  describe("#tick", () => {
    it("should resolve after a tick", async () => {
      poll = new Poll({
        auto: false,
        factory: () => Promise.resolve(),
        frequency: { interval: 100, backoff: false },
        name: "../../src/lumino/polling:Poll#tick-1",
      })
      const expected = "started resolved resolved"
      const ticker: IPoll.Phase<any>[] = []
      const tock = (poll: Poll) => {
        ticker.push(poll.state.phase)
        poll.tick.then(tock).catch(() => undefined)
      }
      void poll.tick.then(tock)
      void poll.start()
      await sleep(1000) // Sleep for longer than the interval.
      expect(ticker.join(" ").startsWith(expected)).toEqual(true)
    })
    it("should resolve after `ticked` emits in lock step", async () => {
      poll = new Poll({
        factory: () =>
          Math.random() > 0.5 ? Promise.resolve() : Promise.reject(),
        frequency: { interval: 0, backoff: false },
        name: "../../src/lumino/polling:Poll#tick-2",
      })
      const ticker: IPoll.Phase<any>[] = []
      const tocker: IPoll.Phase<any>[] = []
      poll.ticked.connect(async (_, state) => {
        ticker.push(state.phase)
        expect(ticker.length).toEqual(tocker.length + 1)
      })
      const tock = async (poll: Poll) => {
        tocker.push(poll.state.phase)
        expect(ticker.join(" ")).toEqual(tocker.join(" "))
        poll.tick.then(tock).catch(() => undefined)
      }
      void poll.tick.then(tock)
      await poll.stop()
      await poll.start()
      await poll.tick
      await poll.refresh()
      await poll.tick
      await poll.refresh()
      await poll.tick
      await poll.refresh()
      await poll.tick
      await poll.stop()
      await poll.start()
      await poll.tick
      await sleep(250)
      await poll.tick
      expect(ticker.join(" ")).toEqual(tocker.join(" "))
    })
  })
  describe("#ticked", () => {
    it("should emit a tick identical to the poll state", async () => {
      poll = new Poll<void, void>({
        factory: () => Promise.resolve(),
        frequency: { interval: 100, backoff: false },
        name: "../../src/lumino/polling:Poll#ticked-3",
      })
      poll.ticked.connect((_, tick) => {
        expect(tick).toEqual(poll.state)
      })
      await sleep(1000) // Sleep for longer than the interval.
    })
  })
  describe("#dispose()", () => {
    it("should dispose the poll and be safe to call repeatedly", async () => {
      let rejected = false
      let tick: Promise<Poll>
      poll = new Poll({
        name: "../../src/lumino/polling:Poll#dispose()-1",
        factory: () => Promise.resolve(),
      })
      tick = poll.tick
      expect(poll.isDisposed).toEqual(false)
      poll.dispose()
      expect(poll.isDisposed).toEqual(true)
      try {
        await tick
      } catch (error) {
        rejected = true
      }
      poll.dispose()
      expect(rejected).toEqual(true)
    })
  })
  describe("#refresh()", () => {
    it("should refresh the poll, superseding `started`", async () => {
      const expected = "refreshed resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        name: "../../src/lumino/polling:Poll#refresh()-1",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.refresh()
      expect(poll.state.phase).toEqual("refreshed")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("should be safe to call multiple times", async () => {
      const expected = "started resolved refreshed resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        name: "../../src/lumino/polling:Poll#refresh()-2",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.tick
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      await poll.refresh()
      expect(poll.state.phase).toEqual("refreshed")
      await poll.refresh()
      expect(poll.state.phase).toEqual("refreshed")
      await poll.refresh()
      expect(poll.state.phase).toEqual("refreshed")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
  })
  describe("#start()", () => {
    it("should start the poll if it is stopped", async () => {
      const expected = "stopped started resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        name: "../../src/lumino/polling:Poll#start()-1",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("be safe to call multiple times and no-op if unnecessary", async () => {
      const expected = "started resolved stopped started resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        auto: false,
        name: "../../src/lumino/polling:Poll#start()-2",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
  })
  describe("#stop()", () => {
    it("should stop the poll if it is active", async () => {
      const expected = "started stopped started resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        auto: false,
        name: "../../src/lumino/polling:Poll#stop()-1",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
    it("be safe to call multiple times", async () => {
      const expected = "started stopped started resolved"
      const ticker: IPoll.Phase<any>[] = []
      poll = new Poll({
        auto: false,
        name: "../../src/lumino/polling:Poll#stop()-2",
        frequency: { interval: 100 },
        factory: () => Promise.resolve(),
      })
      poll.ticked.connect((_, tick) => {
        ticker.push(tick.phase)
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.stop()
      expect(poll.state.phase).toEqual("stopped")
      await poll.start()
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      expect(ticker.join(" ")).toEqual(expected)
    })
  })
  describe("#schedule()", () => {
    it("should schedule the next poll state", async () => {
      poll = new Poll({
        factory: () => Promise.resolve(),
        frequency: { interval: 100 },
        name: "../../src/lumino/polling:Poll#schedule()-1",
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.tick
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      await poll.schedule({ phase: "refreshed" })
      expect(poll.state.phase).toEqual("refreshed")
      return
    })
    it("should default to standby state", async () => {
      poll = new Poll({
        factory: () => Promise.resolve(),
        frequency: { interval: 100 },
        name: "../../src/lumino/polling:Poll#schedule()-2",
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.tick
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      await poll.schedule()
      expect(poll.state.phase).toEqual("standby")
      return
    })
    it("should support phase transition cancellation", async () => {
      poll = new Poll({
        factory: () => Promise.resolve(),
        frequency: { interval: 100 },
        name: "../../src/lumino/polling:Poll#schedule()-3",
      })
      expect(poll.state.phase).toEqual("constructed")
      await poll.tick
      expect(poll.state.phase).toEqual("started")
      await poll.tick
      expect(poll.state.phase).toEqual("resolved")
      await poll.schedule()
      expect(poll.state.phase).toEqual("standby")
      await poll.schedule({
        cancel: last => last.phase === "standby",
        phase: "refreshed",
      })
      expect(poll.state.phase).toEqual("standby")
      return
    })
  })
})
import { expect } from "chai"
import { Debouncer, Poll, Throttler } from "../../src/lumino/polling"
describe("Debouncer", () => {
  const limit = Poll.IMMEDIATE
  let debouncer: Debouncer
  afterEach(() => {
    debouncer.dispose()
  })
  describe("#constructor()", () => {
    it("should create a debouncer", () => {
      debouncer = new Debouncer(async () => undefined, limit)
      expect(debouncer).to.be.an.instanceof(Debouncer)
    })
  })
  describe("#invoke()", () => {
    it("should invoke and debounce a function", async () => {
      let counter = 0
      debouncer = new Debouncer(() => counter++, limit)
      expect(counter).toEqual(0)
      await debouncer.invoke()
      expect(counter).toEqual(1)
      void debouncer.invoke()
      void debouncer.invoke()
      void debouncer.invoke()
      await debouncer.invoke()
      expect(counter).toEqual(2)
    })
    it("should debounce with arguments", async () => {
      let output = ""
      debouncer = new Debouncer((name?: string) => {
        output = `Hello, ${name || "world"}`
      }, limit)
      void debouncer.invoke("Huey")
      void debouncer.invoke("Dewey")
      await debouncer.invoke("Louie")
      expect(output).toEqual("Hello, Louie")
    })
  })
})
describe("Throttler", () => {
  const limit = Poll.IMMEDIATE
  let throttler: Throttler
  afterEach(() => {
    throttler.dispose()
  })
  describe("#constructor()", () => {
    it("should create a throttler", () => {
      throttler = new Throttler(async () => undefined, limit)
      expect(throttler).to.be.an.instanceof(Throttler)
    })
  })
  describe("#invoke()", () => {
    it("should invoke and throttle a function", async () => {
      let counter = 0
      throttler = new Throttler(() => counter++, limit)
      expect(counter).toEqual(0)
      await throttler.invoke()
      expect(counter).toEqual(1)
      void throttler.invoke()
      void throttler.invoke()
      void throttler.invoke()
      await throttler.invoke()
      expect(counter).toEqual(2)
    })
    it("should throttle with arguments", async () => {
      let output = ""
      throttler = new Throttler((name?: string) => {
        output = `Hello, ${name || "world"}`
      }, limit)
      void throttler.invoke()
      await throttler.invoke("Huey")
      expect(output).toEqual("Hello, world")
      void throttler.invoke("Dewey")
      await throttler.invoke("Louie")
      expect(output).toEqual("Hello, Dewey")
    })
    it("should collapse invocations into one promise per cycle", async () => {
      throttler = new Throttler(() => undefined, limit)
      const first = throttler.invoke()
      const second = throttler.invoke()
      const third = throttler.invoke()
      const fourth = throttler.invoke()
      const fifth = throttler.invoke()
      await fifth
      const sixth = throttler.invoke()
      const seventh = throttler.invoke()
      expect(first).toEqual(second, "first === second")
      expect(first).toEqual(third, "first === third")
      expect(first).toEqual(fourth, "first === fourth")
      expect(first).toEqual(fifth, "first === fifth")
      expect(fifth).not.toEqual(sixth, "fifth !== sixth")
      expect(sixth).toEqual(seventh, "sixth === seventh")
    })
    it("should default to the `leading` edge of cycle", async () => {
      throttler = new Throttler(invoked => {
        expect(invoked).toEqual(1)
      }, limit)
      void throttler.invoke(1)
      void throttler.invoke(2)
      void throttler.invoke(3)
      void throttler.invoke(4)
      await throttler.invoke(5)
    })
    it("should support the `leading` edge of cycle", async () => {
      const edge = "leading"
      throttler = new Throttler(
        invoked => {
          expect(invoked).toEqual(1)
        },
        { edge, limit }
      )
      void throttler.invoke(1)
      void throttler.invoke(2)
      void throttler.invoke(3)
      void throttler.invoke(4)
      await throttler.invoke(5)
    })
    it("should support the `trailing` edge of cycle", async () => {
      const edge = "trailing"
      throttler = new Throttler(
        invoked => {
          expect(invoked).toEqual(5)
        },
        { edge, limit }
      )
      void throttler.invoke(1)
      void throttler.invoke(2)
      void throttler.invoke(3)
      void throttler.invoke(4)
      await throttler.invoke(5)
    })
  })
})
