import { expect } from "chai"
import * as sinon from "sinon"
import { animationFrameScheduler, Subscription, merge } from "rxjs"
import { delay } from "rxjs/operators"
import { TestScheduler } from "rxjs/testing"
import { observableMatcher } from "../helpers/observableMatcher"
import { animationFrameProvider } from "rxjs/internal/scheduler/animationFrameProvider"
import { intervalProvider } from "rxjs/internal/scheduler/intervalProvider"

const animationFrame = animationFrameScheduler

/** @test {Scheduler} */
describe("Scheduler.animationFrame", () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher)
  })

  it("should exist", () => {
    expect(animationFrame).exist
  })

  it("should act like the async scheduler if delay > 0", () => {
    testScheduler.run(({ animate, cold, expectObservable, time }) => {
      animate("         ----------x--")
      const a = cold("  a            ")
      const ta = time(" ----|        ")
      const b = cold("  b            ")
      const tb = time(" --------|    ")
      const expected = "----a---b----"

      const result = merge(
        a.pipe(delay(ta, animationFrame)),
        b.pipe(delay(tb, animationFrame))
      )
      expectObservable(result).toBe(expected)
    })
  })

  it("should cancel animationFrame actions when delay > 0", () => {
    testScheduler.run(({ animate, cold, expectObservable, flush, time }) => {
      const requestSpy = sinon.spy(
        animationFrameProvider,
        "requestAnimationFrame"
      )
      const setSpy = sinon.spy(intervalProvider, "setInterval")
      const clearSpy = sinon.spy(intervalProvider, "clearInterval")

      animate("         ----------x--")
      const a = cold("  a            ")
      const ta = time(" ----|        ")
      const subs = "    ^-!          "
      const expected = "-------------"

      const result = merge(a.pipe(delay(ta, animationFrame)))
      expectObservable(result, subs).toBe(expected)

      flush()
      expect(requestSpy).to.have.not.been.called
      expect(setSpy).to.have.been.calledOnce
      expect(clearSpy).to.have.been.calledOnce
      requestSpy.restore()
      setSpy.restore()
      clearSpy.restore()
    })
  })

  it("should schedule an action to happen later", done => {
    let actionHappened = false
    animationFrame.schedule(() => {
      actionHappened = true
      done()
    })
    if (actionHappened) {
      done(new Error("Scheduled action happened synchronously"))
    }
  })

  it("should execute recursively scheduled actions in separate asynchronous contexts", done => {
    let syncExec1 = true
    let syncExec2 = true
    animationFrame.schedule(
      function (index) {
        if (index === 0) {
          this.schedule(1)
          animationFrame.schedule(() => {
            syncExec1 = false
          })
        } else if (index === 1) {
          this.schedule(2)
          animationFrame.schedule(() => {
            syncExec2 = false
          })
        } else if (index === 2) {
          this.schedule(3)
        } else if (index === 3) {
          if (!syncExec1 && !syncExec2) {
            done()
          } else {
            done(new Error("Execution happened synchronously."))
          }
        }
      },
      0,
      0
    )
  })

  it("should cancel the animation frame if all scheduled actions unsubscribe before it executes", done => {
    let animationFrameExec1 = false
    let animationFrameExec2 = false
    const action1 = animationFrame.schedule(() => {
      animationFrameExec1 = true
    })
    const action2 = animationFrame.schedule(() => {
      animationFrameExec2 = true
    })
    expect(animationFrame._scheduled).to.exist
    expect(animationFrame.actions.length).to.equal(2)
    action1.unsubscribe()
    action2.unsubscribe()
    expect(animationFrame.actions.length).to.equal(0)
    expect(animationFrame._scheduled).to.equal(undefined)
    animationFrame.schedule(() => {
      expect(animationFrameExec1).to.equal(false)
      expect(animationFrameExec2).to.equal(false)
      done()
    })
  })

  it("should execute the rest of the scheduled actions if the first action is canceled", done => {
    let actionHappened = false
    let secondSubscription: Subscription | null = null

    const firstSubscription = animationFrame.schedule(() => {
      actionHappened = true
      if (secondSubscription) {
        secondSubscription.unsubscribe()
      }
      done(new Error("The first action should not have executed."))
    })

    secondSubscription = animationFrame.schedule(() => {
      if (!actionHappened) {
        done()
      }
    })

    if (actionHappened) {
      done(new Error("Scheduled action happened synchronously"))
    } else {
      firstSubscription.unsubscribe()
    }
  })

  it("should not execute rescheduled actions when flushing", done => {
    let flushCount = 0
    let scheduledIndices: number[] = []

    let originalFlush = animationFrame.flush
    animationFrame.flush = (...args) => {
      ++flushCount
      originalFlush.apply(animationFrame, args)
      if (flushCount === 2) {
        animationFrame.flush = originalFlush
        try {
          expect(scheduledIndices).to.deep.equal([0, 1])
          done()
        } catch (error) {
          done(error)
        }
      }
    }

    animationFrame.schedule(
      function (index) {
        if (flushCount < 2) {
          this.schedule(index! + 1)
          scheduledIndices.push(index! + 1)
        }
      },
      0,
      0
    )
    scheduledIndices.push(0)
  })

  it("should execute actions scheduled when flushing in a subsequent flush", done => {
    const sandbox = sinon.createSandbox()
    const stubFlush = sandbox
      .stub(animationFrameScheduler, "flush")
      .callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = animationFrameScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
      c = animationFrameScheduler.schedule(() => {
        expect(stubFlush).to.have.callCount(2)
        sandbox.restore()
        done()
      })
    })
    b = animationFrameScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
    })
  })

  it("should execute actions scheduled when flushing in a subsequent flush when some actions are unsubscribed", done => {
    const sandbox = sinon.createSandbox()
    const stubFlush = sandbox
      .stub(animationFrameScheduler, "flush")
      .callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = animationFrameScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
      c = animationFrameScheduler.schedule(() => {
        expect(stubFlush).to.have.callCount(2)
        sandbox.restore()
        done()
      })
      b.unsubscribe()
    })
    b = animationFrameScheduler.schedule(() => {
      done(new Error("Unexpected execution of b"))
    })
  })

  it("should properly cancel an unnecessary flush", done => {
    const sandbox = sinon.createSandbox()
    const cancelAnimationFrameStub = sandbox
      .stub(animationFrameProvider, "cancelAnimationFrame")
      .callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = animationFrameScheduler.schedule(() => {
      expect(animationFrameScheduler.actions).to.have.length(1)
      c = animationFrameScheduler.schedule(() => {
        done(new Error("Unexpected execution of c"))
      })
      expect(animationFrameScheduler.actions).to.have.length(2)
      // What we're testing here is that the unsubscription of action c effects
      // the cancellation of the animation frame in a scenario in which the
      // actions queue is not empty - it contains action b.
      c.unsubscribe()
      expect(animationFrameScheduler.actions).to.have.length(1)
      expect(cancelAnimationFrameStub).to.have.callCount(1)
    })
    b = animationFrameScheduler.schedule(() => {
      sandbox.restore()
      done()
    })
  })
})
import { expect } from "chai"
import * as sinon from "sinon"
import { asapScheduler, Subscription, SchedulerAction, merge } from "rxjs"
import { delay } from "rxjs/operators"
import { TestScheduler } from "rxjs/testing"
import { observableMatcher } from "../helpers/observableMatcher"
import { immediateProvider } from "rxjs/internal/scheduler/immediateProvider"
import { intervalProvider } from "rxjs/internal/scheduler/intervalProvider"

const asap = asapScheduler

/** @test {Scheduler} */
describe("Scheduler.asap", () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher)
  })

  it("should exist", () => {
    expect(asap).exist
  })

  it("should act like the async scheduler if delay > 0", () => {
    testScheduler.run(({ cold, expectObservable, time }) => {
      const a = cold("  a            ")
      const ta = time(" ----|        ")
      const b = cold("  b            ")
      const tb = time(" --------|    ")
      const expected = "----a---b----"

      const result = merge(a.pipe(delay(ta, asap)), b.pipe(delay(tb, asap)))
      expectObservable(result).toBe(expected)
    })
  })

  it("should cancel asap actions when delay > 0", () => {
    testScheduler.run(({ cold, expectObservable, flush, time }) => {
      const sandbox = sinon.createSandbox()
      const setImmediateSpy = sandbox.spy(immediateProvider, "setImmediate")
      const setSpy = sandbox.spy(intervalProvider, "setInterval")
      const clearSpy = sandbox.spy(intervalProvider, "clearInterval")

      const a = cold("  a            ")
      const ta = time(" ----|        ")
      const subs = "    ^-!          "
      const expected = "-------------"

      const result = merge(a.pipe(delay(ta, asap)))
      expectObservable(result, subs).toBe(expected)

      flush()
      expect(setImmediateSpy).to.have.not.been.called
      expect(setSpy).to.have.been.calledOnce
      expect(clearSpy).to.have.been.calledOnce
      sandbox.restore()
    })
  })

  it("should reuse the interval for recursively scheduled actions with the same delay", () => {
    const sandbox = sinon.createSandbox()
    const fakeTimer = sandbox.useFakeTimers()
    // callThrough is missing from the declarations installed by the typings tool in stable
    const stubSetInterval = (<any>(
      sandbox.stub(global, "setInterval")
    )).callThrough()
    const period = 50
    const state = { index: 0, period }
    type State = typeof state
    function dispatch(this: SchedulerAction<State>, state: State): void {
      state.index += 1
      if (state.index < 3) {
        this.schedule(state, state.period)
      }
    }
    asap.schedule(dispatch as any, period, state)
    expect(state).to.have.property("index", 0)
    expect(stubSetInterval).to.have.property("callCount", 1)
    fakeTimer.tick(period)
    expect(state).to.have.property("index", 1)
    expect(stubSetInterval).to.have.property("callCount", 1)
    fakeTimer.tick(period)
    expect(state).to.have.property("index", 2)
    expect(stubSetInterval).to.have.property("callCount", 1)
    sandbox.restore()
  })

  it("should not reuse the interval for recursively scheduled actions with a different delay", () => {
    const sandbox = sinon.createSandbox()
    const fakeTimer = sandbox.useFakeTimers()
    // callThrough is missing from the declarations installed by the typings tool in stable
    const stubSetInterval = (<any>(
      sandbox.stub(global, "setInterval")
    )).callThrough()
    const period = 50
    const state = { index: 0, period }
    type State = typeof state
    function dispatch(this: SchedulerAction<State>, state: State): void {
      state.index += 1
      state.period -= 1
      if (state.index < 3) {
        this.schedule(state, state.period)
      }
    }
    asap.schedule(dispatch as any, period, state)
    expect(state).to.have.property("index", 0)
    expect(stubSetInterval).to.have.property("callCount", 1)
    fakeTimer.tick(period)
    expect(state).to.have.property("index", 1)
    expect(stubSetInterval).to.have.property("callCount", 2)
    fakeTimer.tick(period)
    expect(state).to.have.property("index", 2)
    expect(stubSetInterval).to.have.property("callCount", 3)
    sandbox.restore()
  })

  it("should schedule an action to happen later", done => {
    let actionHappened = false
    asap.schedule(() => {
      actionHappened = true
      done()
    })
    if (actionHappened) {
      done(new Error("Scheduled action happened synchronously"))
    }
  })

  it("should execute recursively scheduled actions in separate asynchronous contexts", done => {
    let syncExec1 = true
    let syncExec2 = true
    asap.schedule(
      function (index) {
        if (index === 0) {
          this.schedule(1)
          asap.schedule(() => {
            syncExec1 = false
          })
        } else if (index === 1) {
          this.schedule(2)
          asap.schedule(() => {
            syncExec2 = false
          })
        } else if (index === 2) {
          this.schedule(3)
        } else if (index === 3) {
          if (!syncExec1 && !syncExec2) {
            done()
          } else {
            done(new Error("Execution happened synchronously."))
          }
        }
      },
      0,
      0
    )
  })

  it("should cancel the setImmediate if all scheduled actions unsubscribe before it executes", done => {
    let asapExec1 = false
    let asapExec2 = false
    const action1 = asap.schedule(() => {
      asapExec1 = true
    })
    const action2 = asap.schedule(() => {
      asapExec2 = true
    })
    expect(asap._scheduled).to.exist
    expect(asap.actions.length).to.equal(2)
    action1.unsubscribe()
    action2.unsubscribe()
    expect(asap.actions.length).to.equal(0)
    expect(asap._scheduled).to.equal(undefined)
    asap.schedule(() => {
      expect(asapExec1).to.equal(false)
      expect(asapExec2).to.equal(false)
      done()
    })
  })

  it("should execute the rest of the scheduled actions if the first action is canceled", done => {
    let actionHappened = false
    let secondSubscription: Subscription | null = null

    const firstSubscription = asap.schedule(() => {
      actionHappened = true
      if (secondSubscription) {
        secondSubscription.unsubscribe()
      }
      done(new Error("The first action should not have executed."))
    })

    secondSubscription = asap.schedule(() => {
      if (!actionHappened) {
        done()
      }
    })

    if (actionHappened) {
      done(new Error("Scheduled action happened synchronously"))
    } else {
      firstSubscription.unsubscribe()
    }
  })

  it("should not execute rescheduled actions when flushing", done => {
    let flushCount = 0
    let scheduledIndices: number[] = []

    let originalFlush = asap.flush
    asap.flush = (...args) => {
      ++flushCount
      originalFlush.apply(asap, args)
      if (flushCount === 2) {
        asap.flush = originalFlush
        try {
          expect(scheduledIndices).to.deep.equal([0, 1])
          done()
        } catch (error) {
          done(error)
        }
      }
    }

    asap.schedule(
      function (index) {
        if (flushCount < 2) {
          this.schedule(index! + 1)
          scheduledIndices.push(index! + 1)
        }
      },
      0,
      0
    )
    scheduledIndices.push(0)
  })

  it("should execute actions scheduled when flushing in a subsequent flush", done => {
    const sandbox = sinon.createSandbox()
    const stubFlush = sandbox.stub(asapScheduler, "flush").callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = asapScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
      c = asapScheduler.schedule(() => {
        expect(stubFlush).to.have.callCount(2)
        sandbox.restore()
        done()
      })
    })
    b = asapScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
    })
  })

  it("should execute actions scheduled when flushing in a subsequent flush when some actions are unsubscribed", done => {
    const sandbox = sinon.createSandbox()
    const stubFlush = sandbox.stub(asapScheduler, "flush").callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = asapScheduler.schedule(() => {
      expect(stubFlush).to.have.callCount(1)
      c = asapScheduler.schedule(() => {
        expect(stubFlush).to.have.callCount(2)
        sandbox.restore()
        done()
      })
      b.unsubscribe()
    })
    b = asapScheduler.schedule(() => {
      done(new Error("Unexpected execution of b"))
    })
  })

  it("should properly cancel an unnecessary flush", done => {
    const sandbox = sinon.createSandbox()
    const clearImmediateStub = sandbox
      .stub(immediateProvider, "clearImmediate")
      .callThrough()

    let a: Subscription
    let b: Subscription
    let c: Subscription

    a = asapScheduler.schedule(() => {
      expect(asapScheduler.actions).to.have.length(1)
      c = asapScheduler.schedule(() => {
        done(new Error("Unexpected execution of c"))
      })
      expect(asapScheduler.actions).to.have.length(2)
      // What we're testing here is that the unsubscription of action c effects
      // the cancellation of the microtask in a scenario in which the actions
      // queue is not empty - it contains action b.
      c.unsubscribe()
      expect(asapScheduler.actions).to.have.length(1)
      expect(clearImmediateStub).to.have.callCount(1)
    })
    b = asapScheduler.schedule(() => {
      sandbox.restore()
      done()
    })
  })
})
import { expect } from "chai"
import * as sinon from "sinon"
import { queueScheduler, Subscription, merge } from "rxjs"
import { delay } from "rxjs/operators"
import { TestScheduler } from "rxjs/testing"
import { observableMatcher } from "../helpers/observableMatcher"

const queue = queueScheduler

/** @test {Scheduler} */
describe("Scheduler.queue", () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher)
  })

  it("should act like the async scheduler if delay > 0", () => {
    testScheduler.run(({ cold, expectObservable, time }) => {
      const a = cold("  a            ")
      const ta = time(" ----|        ")
      const b = cold("  b            ")
      const tb = time(" --------|    ")
      const expected = "----a---b----"

      const result = merge(a.pipe(delay(ta, queue)), b.pipe(delay(tb, queue)))
      expectObservable(result).toBe(expected)
    })
  })

  it("should switch from synchronous to asynchronous at will", () => {
    const sandbox = sinon.createSandbox()
    const fakeTimer = sandbox.useFakeTimers()

    let asyncExec = false
    let state: Array<number> = []

    queue.schedule(
      function (index) {
        state.push(index!)
        if (index === 0) {
          this.schedule(1, 100)
        } else if (index === 1) {
          asyncExec = true
          this.schedule(2, 0)
        }
      },
      0,
      0
    )

    expect(asyncExec).to.be.false
    expect(state).to.be.deep.equal([0])

    fakeTimer.tick(100)

    expect(asyncExec).to.be.true
    expect(state).to.be.deep.equal([0, 1, 2])

    sandbox.restore()
  })

  it("should unsubscribe the rest of the scheduled actions if an action throws an error", () => {
    const actions: Subscription[] = []
    let action2Exec = false
    let action3Exec = false
    let errorValue: any = undefined
    try {
      queue.schedule(() => {
        actions.push(
          queue.schedule(() => {
            throw new Error("oops")
          }),
          queue.schedule(() => {
            action2Exec = true
          }),
          queue.schedule(() => {
            action3Exec = true
          })
        )
      })
    } catch (e) {
      errorValue = e
    }
    expect(actions.every(action => action.closed)).to.be.true
    expect(action2Exec).to.be.false
    expect(action3Exec).to.be.false
    expect(errorValue).exist
    expect(errorValue.message).to.equal("oops")
  })
})
import { expect } from "chai"
import {
  hot,
  cold,
  expectObservable,
  expectSubscriptions,
  time,
} from "../helpers/marble-testing"
import { TestScheduler } from "rxjs/testing"
import {
  Observable,
  NEVER,
  EMPTY,
  Subject,
  of,
  merge,
  animationFrameScheduler,
  asapScheduler,
  asyncScheduler,
  interval,
} from "rxjs"
import {
  delay,
  debounceTime,
  concatMap,
  mergeMap,
  mapTo,
  take,
} from "rxjs/operators"
import {
  nextNotification,
  COMPLETE_NOTIFICATION,
  errorNotification,
} from "rxjs/internal/NotificationFactories"
import { animationFrameProvider } from "rxjs/internal/scheduler/animationFrameProvider"
import { immediateProvider } from "rxjs/internal/scheduler/immediateProvider"
import { intervalProvider } from "rxjs/internal/scheduler/intervalProvider"
import { timeoutProvider } from "rxjs/internal/scheduler/timeoutProvider"

declare const rxTestScheduler: TestScheduler

/** @test {TestScheduler} */
describe("TestScheduler", () => {
  it("should exist", () => {
    expect(TestScheduler).exist
    expect(TestScheduler).to.be.a("function")
  })

  it("should have frameTimeFactor set initially", () => {
    expect(TestScheduler.frameTimeFactor).to.equal(10)
  })

  describe("parseMarbles()", () => {
    it("should parse a marble string into a series of notifications and types", () => {
      const result = TestScheduler.parseMarbles("-------a---b---|", {
        a: "A",
        b: "B",
      })
      expect(result).deep.equal([
        { frame: 70, notification: nextNotification("A") },
        { frame: 110, notification: nextNotification("B") },
        { frame: 150, notification: COMPLETE_NOTIFICATION },
      ])
    })

    it("should parse a marble string, allowing spaces too", () => {
      const result = TestScheduler.parseMarbles("--a--b--|   ", {
        a: "A",
        b: "B",
      })
      expect(result).deep.equal([
        { frame: 20, notification: nextNotification("A") },
        { frame: 50, notification: nextNotification("B") },
        { frame: 80, notification: COMPLETE_NOTIFICATION },
      ])
    })

    it("should parse a marble string with a subscription point", () => {
      const result = TestScheduler.parseMarbles("---^---a---b---|", {
        a: "A",
        b: "B",
      })
      expect(result).deep.equal([
        { frame: 40, notification: nextNotification("A") },
        { frame: 80, notification: nextNotification("B") },
        { frame: 120, notification: COMPLETE_NOTIFICATION },
      ])
    })

    it("should parse a marble string with an error", () => {
      const result = TestScheduler.parseMarbles(
        "-------a---b---#",
        { a: "A", b: "B" },
        "omg error!"
      )
      expect(result).deep.equal([
        { frame: 70, notification: nextNotification("A") },
        { frame: 110, notification: nextNotification("B") },
        { frame: 150, notification: errorNotification("omg error!") },
      ])
    })

    it("should default in the letter for the value if no value hash was passed", () => {
      const result = TestScheduler.parseMarbles("--a--b--c--")
      expect(result).deep.equal([
        { frame: 20, notification: nextNotification("a") },
        { frame: 50, notification: nextNotification("b") },
        { frame: 80, notification: nextNotification("c") },
      ])
    })

    it("should handle grouped values", () => {
      const result = TestScheduler.parseMarbles("---(abc)---")
      expect(result).deep.equal([
        { frame: 30, notification: nextNotification("a") },
        { frame: 30, notification: nextNotification("b") },
        { frame: 30, notification: nextNotification("c") },
      ])
    })

    it("should ignore whitespace when runMode=true", () => {
      const runMode = true
      const result = TestScheduler.parseMarbles(
        "  -a - b -    c |       ",
        { a: "A", b: "B", c: "C" },
        undefined,
        undefined,
        runMode
      )
      expect(result).deep.equal([
        { frame: 10, notification: nextNotification("A") },
        { frame: 30, notification: nextNotification("B") },
        { frame: 50, notification: nextNotification("C") },
        { frame: 60, notification: COMPLETE_NOTIFICATION },
      ])
    })

    it("should support time progression syntax when runMode=true", () => {
      const runMode = true
      const result = TestScheduler.parseMarbles(
        "10.2ms a 1.2s b 1m c|",
        { a: "A", b: "B", c: "C" },
        undefined,
        undefined,
        runMode
      )
      expect(result).deep.equal([
        { frame: 10.2, notification: nextNotification("A") },
        { frame: 10.2 + 10 + 1.2 * 1000, notification: nextNotification("B") },
        {
          frame: 10.2 + 10 + 1.2 * 1000 + 10 + 1000 * 60,
          notification: nextNotification("C"),
        },
        {
          frame: 10.2 + 10 + 1.2 * 1000 + 10 + 1000 * 60 + 10,
          notification: COMPLETE_NOTIFICATION,
        },
      ])
    })

    it("should support emoji characters", () => {
      const result = TestScheduler.parseMarbles("--🙈--🙉--🙊--|")
      expect(result).deep.equal([
        { frame: 20, notification: nextNotification("🙈") },
        { frame: 50, notification: nextNotification("🙉") },
        { frame: 80, notification: nextNotification("🙊") },
        { frame: 110, notification: COMPLETE_NOTIFICATION },
      ])
    })
  })

  describe("parseMarblesAsSubscriptions()", () => {
    it("should parse a subscription marble string into a subscriptionLog", () => {
      const result = TestScheduler.parseMarblesAsSubscriptions("---^---!-")
      expect(result.subscribedFrame).to.equal(30)
      expect(result.unsubscribedFrame).to.equal(70)
    })

    it("should parse a subscription marble string with an unsubscription", () => {
      const result = TestScheduler.parseMarblesAsSubscriptions("---^-")
      expect(result.subscribedFrame).to.equal(30)
      expect(result.unsubscribedFrame).to.equal(Infinity)
    })

    it("should parse a subscription marble string with a synchronous unsubscription", () => {
      const result = TestScheduler.parseMarblesAsSubscriptions("---(^!)-")
      expect(result.subscribedFrame).to.equal(30)
      expect(result.unsubscribedFrame).to.equal(30)
    })

    it("should ignore whitespace when runMode=true", () => {
      const runMode = true
      const result = TestScheduler.parseMarblesAsSubscriptions(
        "  - -  - -  ^ -   - !  -- -      ",
        runMode
      )
      expect(result.subscribedFrame).to.equal(40)
      expect(result.unsubscribedFrame).to.equal(70)
    })

    it("should support time progression syntax when runMode=true", () => {
      const runMode = true
      const result = TestScheduler.parseMarblesAsSubscriptions(
        "10.2ms ^ 1.2s - 1m !",
        runMode
      )
      expect(result.subscribedFrame).to.equal(10.2)
      expect(result.unsubscribedFrame).to.equal(
        10.2 + 10 + 1.2 * 1000 + 10 + 1000 * 60
      )
    })

    it("should throw if found more than one subscription point", () => {
      expect(() =>
        TestScheduler.parseMarblesAsSubscriptions("---^-^-!-")
      ).to.throw()
    })

    it("should throw if found more than one unsubscription point", () => {
      expect(() =>
        TestScheduler.parseMarblesAsSubscriptions("---^---!-!")
      ).to.throw()
    })
  })

  describe("createTime()", () => {
    it("should parse a simple time marble string to a number", () => {
      const scheduler = new TestScheduler(null!)
      const time = scheduler.createTime("-----|")
      expect(time).to.equal(50)
    })

    it("should progress time with whitespace", () => {
      const scheduler = new TestScheduler(null!)
      const time = scheduler.createTime("     |")
      //                                 -----|
      expect(time).to.equal(50)
    })

    it("should progress time with mix of whitespace and dashes", () => {
      const scheduler = new TestScheduler(null!)
      const time = scheduler.createTime("  --|")
      expect(time).to.equal(40)
    })

    it("should throw if not given good marble input", () => {
      const scheduler = new TestScheduler(null!)
      expect(() => {
        scheduler.createTime("-a-b-#")
      }).to.throw()
    })
  })

  describe("createColdObservable()", () => {
    it("should create a cold observable", () => {
      const expected = ["A", "B"]
      const scheduler = new TestScheduler(null!)
      const source = scheduler.createColdObservable("--a---b--|", {
        a: "A",
        b: "B",
      })
      expect(source).to.be.an.instanceOf(Observable)
      source.subscribe(x => {
        expect(x).to.equal(expected.shift())
      })
      scheduler.flush()
      expect(expected.length).to.equal(0)
    })
  })

  describe("createHotObservable()", () => {
    it("should create a hot observable", () => {
      const expected = ["A", "B"]
      const scheduler = new TestScheduler(null!)
      const source = scheduler.createHotObservable("--a---b--|", {
        a: "A",
        b: "B",
      })
      expect(source).to.be.an.instanceof(Subject)
      source.subscribe(x => {
        expect(x).to.equal(expected.shift())
      })
      scheduler.flush()
      expect(expected.length).to.equal(0)
    })
  })

  describe("jasmine helpers", () => {
    describe("rxTestScheduler", () => {
      it("should exist", () => {
        expect(rxTestScheduler).to.be.an.instanceof(TestScheduler)
      })
    })

    describe("cold()", () => {
      it("should exist", () => {
        expect(cold).to.exist
        expect(cold).to.be.a("function")
      })

      it("should create a cold observable", () => {
        const expected = [1, 2]
        const source = cold("-a-b-|", { a: 1, b: 2 })
        source.subscribe({
          next: (x: number) => {
            expect(x).to.equal(expected.shift())
          },
          complete: () => {
            expect(expected.length).to.equal(0)
          },
        })
        expectObservable(source).toBe("-a-b-|", { a: 1, b: 2 })
      })
    })

    describe("hot()", () => {
      it("should exist", () => {
        expect(hot).to.exist
        expect(hot).to.be.a("function")
      })

      it("should create a hot observable", () => {
        const source = hot("---^-a-b-|", { a: 1, b: 2 })
        expect(source).to.be.an.instanceOf(Subject)
        expectObservable(source).toBe("--a-b-|", { a: 1, b: 2 })
      })
    })

    describe("time()", () => {
      it("should exist", () => {
        expect(time).to.exist
        expect(time).to.be.a("function")
      })

      it("should parse a simple time marble string to a number", () => {
        expect(time("-----|")).to.equal(50)
      })
    })

    describe("expectObservable()", () => {
      it("should exist", () => {
        expect(expectObservable).to.exist
        expect(expectObservable).to.be.a("function")
      })

      it("should return an object with a toBe function", () => {
        expect(expectObservable(of(1)).toBe).to.be.a("function")
      })

      it("should append to flushTests array", () => {
        expectObservable(EMPTY)
        expect((<any>rxTestScheduler).flushTests.length).to.equal(1)
      })

      it("should handle empty", () => {
        expectObservable(EMPTY).toBe("|", {})
      })

      it("should handle never", () => {
        expectObservable(NEVER).toBe("-", {})
        expectObservable(NEVER).toBe("---", {})
      })

      it("should accept an unsubscription marble diagram", () => {
        const source = hot("---^-a-b-|")
        const unsubscribe = "---!"
        const expected = "--a"
        expectObservable(source, unsubscribe).toBe(expected)
      })

      it("should accept a subscription marble diagram", () => {
        const source = hot("-a-b-c|")
        const subscribe = "---^"
        const expected = "---b-c|"
        expectObservable(source, subscribe).toBe(expected)
      })
    })

    describe("expectSubscriptions()", () => {
      it("should exist", () => {
        expect(expectSubscriptions).to.exist
        expect(expectSubscriptions).to.be.a("function")
      })

      it("should return an object with a toBe function", () => {
        expect(expectSubscriptions([]).toBe).to.be.a("function")
      })

      it("should append to flushTests array", () => {
        expectSubscriptions([])
        expect((<any>rxTestScheduler).flushTests.length).to.equal(1)
      })

      it("should assert subscriptions of a cold observable", () => {
        const source = cold("---a---b-|")
        const subs = "^--------!"
        expectSubscriptions(source.subscriptions).toBe(subs)
        source.subscribe()
      })

      it("should support empty subscription marbles", () => {
        const source = cold("---a---b-|")
        const subs = "----------"
        expectSubscriptions(source.subscriptions).toBe(subs)
      })

      it("should support empty subscription marbles within arrays", () => {
        const source = cold("---a---b-|")
        const subs = ["----------"]
        expectSubscriptions(source.subscriptions).toBe(subs)
      })
    })

    describe("end-to-end helper tests", () => {
      it("should be awesome", () => {
        const values = { a: 1, b: 2 }
        const myObservable = cold("---a---b--|", values)
        const subs = "^---------!"
        expectObservable(myObservable).toBe("---a---b--|", values)
        expectSubscriptions(myObservable.subscriptions).toBe(subs)
      })

      it("should support testing metastreams", () => {
        const x = cold("-a-b|")
        const y = cold("-c-d|")
        const myObservable = hot("---x---y----|", { x: x, y: y })
        const expected = "---x---y----|"
        const expectedx = cold("-a-b|")
        const expectedy = cold("-c-d|")
        expectObservable(myObservable).toBe(expected, {
          x: expectedx,
          y: expectedy,
        })
      })
    })
  })

  describe("TestScheduler.run()", () => {
    const assertDeepEquals = (actual: any, expected: any) => {
      expect(actual).deep.equal(expected)
    }

    describe("marble diagrams", () => {
      it("should ignore whitespace", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)

        testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
          const input = cold("  -a - b -    c |       ")
          const output = input.pipe(concatMap(d => of(d).pipe(delay(10))))
          const expected = "     -- 9ms a 9ms b 9ms (c|) "

          expectObservable(output).toBe(expected)
          expectSubscriptions(input.subscriptions).toBe("  ^- - - - - !")
        })
      })

      it("should support time progression syntax", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)

        testScheduler.run(
          ({ cold, hot, flush, expectObservable, expectSubscriptions }) => {
            const output = cold("10.2ms a 1.2s b 1m c|")
            const expected = "   10.2ms a 1.2s b 1m c|"

            expectObservable(output).toBe(expected)
          }
        )
      })
    })

    it("should provide the correct helpers", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler.run(
        ({ cold, hot, flush, expectObservable, expectSubscriptions }) => {
          expect(cold).to.be.a("function")
          expect(hot).to.be.a("function")
          expect(flush).to.be.a("function")
          expect(expectObservable).to.be.a("function")
          expect(expectSubscriptions).to.be.a("function")

          const obs1 = cold("-a-c-e|")
          const obs2 = hot(" ^-b-d-f|")
          const output = merge(obs1, obs2)
          const expected = " -abcdef|"

          expectObservable(output).toBe(expected)
          expectObservable(output).toEqual(cold(expected))
          // There are two subscriptions to each of these, because we merged
          // them together, then we subscribed to the merged result once
          // to check `toBe` and another time to check `toEqual`.
          expectSubscriptions(obs1.subscriptions).toBe(["^-----!", "^-----!"])
          expectSubscriptions(obs2.subscriptions).toBe(["^------!", "^------!"])
        }
      )
    })

    it("should have each frame represent a single virtual millisecond", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler.run(({ cold, expectObservable }) => {
        const output = cold("-a-b-c--------|").pipe(debounceTime(5))
        const expected = "   ------ 4ms c---|"
        expectObservable(output).toBe(expected)
      })
    })

    it("should have no maximum frame count", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler.run(({ cold, expectObservable }) => {
        const output = cold("-a|").pipe(delay(1000 * 10))
        const expected = "   - 10s (a|)"
        expectObservable(output).toBe(expected)
      })
    })

    it("should make operators that use AsyncScheduler automatically use TestScheduler for actual scheduling", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler.run(({ cold, expectObservable }) => {
        const output = cold("-a-b-c--------|").pipe(debounceTime(5))
        const expected = "   ----------c---|"
        expectObservable(output).toBe(expected)
      })
    })

    it("should flush automatically", () => {
      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).deep.equal(expected)
      })
      testScheduler.run(({ cold, expectObservable }) => {
        const output = cold("-a-b-c|").pipe(
          concatMap(d => of(d).pipe(delay(10)))
        )
        const expected = "   -- 9ms a 9ms b 9ms (c|)"
        expectObservable(output).toBe(expected)

        expect(testScheduler["flushTests"].length).to.equal(1)
        expect(testScheduler["actions"].length).to.equal(1)
      })

      expect(testScheduler["flushTests"].length).to.equal(0)
      expect(testScheduler["actions"].length).to.equal(0)
    })

    it("should support explicit flushing", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler.run(({ cold, expectObservable, flush }) => {
        const output = cold("-a-b-c|").pipe(
          concatMap(d => of(d).pipe(delay(10)))
        )
        const expected = "   -- 9ms a 9ms b 9ms (c|)"
        expectObservable(output).toBe(expected)

        expect(testScheduler["flushTests"].length).to.equal(1)
        expect(testScheduler["actions"].length).to.equal(1)

        flush()

        expect(testScheduler["flushTests"].length).to.equal(0)
        expect(testScheduler["actions"].length).to.equal(0)
      })

      expect(testScheduler["flushTests"].length).to.equal(0)
      expect(testScheduler["actions"].length).to.equal(0)
    })

    it("should pass-through return values, e.g. Promises", done => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      testScheduler
        .run(() => {
          return Promise.resolve("foo")
        })
        .then(value => {
          expect(value).to.equal("foo")
          done()
        })
    })

    it("should restore changes upon thrown errors", () => {
      const testScheduler = new TestScheduler(assertDeepEquals)

      const frameTimeFactor = TestScheduler["frameTimeFactor"]
      const maxFrames = testScheduler.maxFrames
      const runMode = testScheduler["runMode"]

      try {
        testScheduler.run(() => {
          throw new Error("kaboom!")
        })
      } catch {
        /* empty */
      }

      expect(TestScheduler["frameTimeFactor"]).to.equal(frameTimeFactor)
      expect(testScheduler.maxFrames).to.equal(maxFrames)
      expect(testScheduler["runMode"]).to.equal(runMode)
    })

    it("should flush expectations correctly", () => {
      expect(() => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ cold, expectObservable, flush }) => {
          expectObservable(cold("-x")).toBe("-x")
          expectObservable(cold("-y")).toBe("-y")
          const expectation = expectObservable(cold("-z"))
          flush()
          expectation.toBe("-q")
        })
      }).to.throw()
    })

    describe("animate", () => {
      it("should throw if animate() is not called when needed", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        expect(() =>
          testScheduler.run(() => {
            animationFrameProvider.schedule(() => {
              /* pointless lint rule */
            })
          })
        ).to.throw()
      })

      it("should throw if animate() is called more than once", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        expect(() =>
          testScheduler.run(({ animate }) => {
            animate("--x")
            animate("--x")
          })
        ).to.throw()
      })

      it("should throw if animate() completes", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        expect(() =>
          testScheduler.run(({ animate }) => {
            animate("--|")
          })
        ).to.throw()
      })

      it("should throw if animate() errors", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        expect(() =>
          testScheduler.run(({ animate }) => {
            animate("--#")
          })
        ).to.throw()
      })

      it("should schedule async requests within animate()", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ animate }) => {
          animate("--x")

          const values: string[] = []
          const { schedule } = animationFrameProvider

          testScheduler.schedule(() => {
            schedule(t => values.push(`a@${t}`))
            expect(values).to.deep.equal([])
          }, 0)
          testScheduler.schedule(() => {
            schedule(t => values.push(`b@${t}`))
            expect(values).to.deep.equal([])
          }, 1)
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@2", "b@2"])
          }, 2)
        })
      })

      it("should schedule sync requests within animate()", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ animate }) => {
          animate("--x")

          const values: string[] = []
          const { schedule } = animationFrameProvider

          testScheduler.schedule(() => {
            schedule(t => values.push(`a@${t}`))
            schedule(t => values.push(`b@${t}`))
            expect(values).to.deep.equal([])
          }, 1)
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@2", "b@2"])
          }, 2)
        })
      })

      it("should support request cancellation within animate()", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ animate }) => {
          animate("--x")

          const values: string[] = []
          const { schedule } = animationFrameProvider

          testScheduler.schedule(() => {
            const subscription = schedule(t => values.push(`a@${t}`))
            schedule(t => values.push(`b@${t}`))
            subscription.unsubscribe()
            expect(values).to.deep.equal([])
          }, 1)
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["b@2"])
          }, 2)
        })
      })
    })

    describe("immediate and interval", () => {
      it("should schedule immediates", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setImmediate } = immediateProvider
          setImmediate(() => {
            values.push(`a@${testScheduler.now()}`)
          })
          expect(values).to.deep.equal([])
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@0"])
          }, 10)
        })
      })

      it("should support clearing immediates", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setImmediate, clearImmediate } = immediateProvider
          const handle = setImmediate(() => {
            values.push(`a@${testScheduler.now()}`)
          })
          expect(values).to.deep.equal([])
          clearImmediate(handle)
          testScheduler.schedule(() => {
            expect(values).to.deep.equal([])
          }, 10)
        })
      })

      it("should schedule intervals", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setInterval, clearInterval } = intervalProvider
          const handle = setInterval(() => {
            values.push(`a@${testScheduler.now()}`)
            clearInterval(handle)
          }, 1)
          expect(values).to.deep.equal([])
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@1"])
          }, 10)
        })
      })

      it("should reschedule intervals until cleared", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setInterval, clearInterval } = intervalProvider
          const handle = setInterval(() => {
            if (testScheduler.now() <= 3) {
              values.push(`a@${testScheduler.now()}`)
            } else {
              clearInterval(handle)
            }
          }, 1)
          expect(values).to.deep.equal([])
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@1", "a@2", "a@3"])
          }, 10)
        })
      })

      it("should schedule timeouts", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setTimeout } = timeoutProvider
          setTimeout(() => {
            values.push(`a@${testScheduler.now()}`)
          }, 1)
          expect(values).to.deep.equal([])
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["a@1"])
          }, 10)
        })
      })

      it("should schedule immediates before intervals and timeouts", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(() => {
          const values: string[] = []
          const { setImmediate } = immediateProvider
          const { setInterval, clearInterval } = intervalProvider
          const { setTimeout } = timeoutProvider
          const handle = setInterval(() => {
            values.push(`a@${testScheduler.now()}`)
            clearInterval(handle)
          }, 0)
          setTimeout(() => {
            values.push(`b@${testScheduler.now()}`)
          }, 0)
          setImmediate(() => {
            values.push(`c@${testScheduler.now()}`)
          })
          expect(values).to.deep.equal([])
          testScheduler.schedule(() => {
            expect(values).to.deep.equal(["c@0", "a@0", "b@0"])
          }, 10)
        })
      })
    })

    describe("schedulers", () => {
      it("should support animationFrame, async and asap schedulers", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ animate, cold, expectObservable, time }) => {
          animate("            ---------x")
          const mapped = cold("--m-------")
          const tb = time("      -----|  ")
          const expected = "   --(dc)-b-a"
          const result = mapped.pipe(
            mergeMap(() =>
              merge(
                of("a").pipe(delay(0, animationFrameScheduler)),
                of("b").pipe(delay(tb, asyncScheduler)),
                of("c").pipe(delay(0, asyncScheduler)),
                of("d").pipe(delay(0, asapScheduler))
              )
            )
          )
          expectObservable(result).toBe(expected)
        })
      })

      it("should emit asap notifications before async notifications", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ cold, expectObservable }) => {
          const mapped = cold("--ab------")
          const expected = "   ---(ba)---"
          const result = mapped.pipe(
            mergeMap(value =>
              value === "a"
                ? of(value).pipe(delay(1, asyncScheduler))
                : of(value).pipe(delay(0, asapScheduler))
            )
          )
          expectObservable(result).toBe(expected)
        })
      })

      it("should support intervals with zero duration", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)
        testScheduler.run(({ cold, expectObservable }) => {
          const mapped = cold("--m-------")
          const expected = "   --(bbbaaa)"
          const result = mapped.pipe(
            mergeMap(() =>
              merge(
                interval(0, asyncScheduler).pipe(mapTo("a"), take(3)),
                interval(0, asapScheduler).pipe(mapTo("b"), take(3))
              )
            )
          )
          expectObservable(result).toBe(expected)
        })
      })
    })

    describe("time", () => {
      it("should parse a simple time marble string to a number", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)

        testScheduler.run(({ time }) => {
          const t = time("--|")
          expect(t).to.equal(2)
        })
      })

      it("should ignore whitespace", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)

        testScheduler.run(({ time }) => {
          const t = time("  --|")
          expect(t).to.equal(2)
        })
      })

      it("should throw if not given good marble input", () => {
        const testScheduler = new TestScheduler(assertDeepEquals)

        testScheduler.run(({ time }) => {
          expect(() => {
            time("-a-b-#")
          }).to.throw()
        })
      })
    })
  })
})
import { expect } from "chai"
import { SchedulerAction, VirtualAction, VirtualTimeScheduler } from "rxjs"

/** @test {VirtualTimeScheduler} */
describe("VirtualTimeScheduler", () => {
  it("should exist", () => {
    expect(VirtualTimeScheduler).exist
    expect(VirtualTimeScheduler).to.be.a("function")
  })

  it("should schedule things in order when flushed if each this is scheduled synchrously", () => {
    const v = new VirtualTimeScheduler()
    const invoked: number[] = []
    const invoke: any = (state: number) => {
      invoked.push(state)
    }
    v.schedule(invoke, 0, 1)
    v.schedule(invoke, 0, 2)
    v.schedule(invoke, 0, 3)
    v.schedule(invoke, 0, 4)
    v.schedule(invoke, 0, 5)

    v.flush()

    expect(invoked).to.deep.equal([1, 2, 3, 4, 5])
  })

  it("should schedule things in order when flushed if each this is scheduled at random", () => {
    const v = new VirtualTimeScheduler()
    const invoked: number[] = []
    const invoke: any = (state: number) => {
      invoked.push(state)
    }
    v.schedule(invoke, 0, 1)
    v.schedule(invoke, 100, 2)
    v.schedule(invoke, 0, 3)
    v.schedule(invoke, 500, 4)
    v.schedule(invoke, 0, 5)
    v.schedule(invoke, 100, 6)

    v.flush()

    expect(invoked).to.deep.equal([1, 3, 5, 2, 6, 4])
  })

  it("should schedule things in order when there are negative delays", () => {
    const v = new VirtualTimeScheduler()
    const invoked: number[] = []
    const invoke: any = (state: number) => {
      invoked.push(state)
    }
    v.schedule(invoke, 0, 1)
    v.schedule(invoke, 100, 2)
    v.schedule(invoke, 0, 3)
    v.schedule(invoke, -2, 4)
    v.schedule(invoke, 0, 5)
    v.schedule(invoke, -10, 6)

    v.flush()

    expect(invoked).to.deep.equal([6, 4, 1, 3, 5, 2])
  })

  it("should support recursive scheduling", () => {
    const v = new VirtualTimeScheduler()
    let count = 0
    const expected = [100, 200, 300]

    v.schedule<string>(
      function (this: SchedulerAction<string>, state?: string) {
        if (++count === 3) {
          return
        }
        const virtualAction = this as VirtualAction<string>
        expect(virtualAction.delay).to.equal(expected.shift())
        this.schedule(state, virtualAction.delay)
      },
      100,
      "test"
    )

    v.flush()
    expect(count).to.equal(3)
  })

  it("should not execute virtual actions that have been rescheduled before flush", () => {
    const v = new VirtualTimeScheduler()
    const messages: string[] = []

    const action: VirtualAction<string> = <VirtualAction<string>>(
      v.schedule(state => messages.push(state!), 10, "first message")
    )

    action.schedule("second message", 10)
    v.flush()

    expect(messages).to.deep.equal(["second message"])
  })

  it("should execute only those virtual actions that fall into the maxFrames timespan", function () {
    const MAX_FRAMES = 50
    const v = new VirtualTimeScheduler(VirtualAction, MAX_FRAMES)
    const messages: string[] = [
      "first message",
      "second message",
      "third message",
    ]

    const actualMessages: string[] = []

    messages.forEach((message, index) => {
      v.schedule(
        state => actualMessages.push(state!),
        index * MAX_FRAMES,
        message
      )
    })

    v.flush()

    expect(actualMessages).to.deep.equal(["first message", "second message"])
    expect(v.actions.map(a => a.state)).to.deep.equal(["third message"])
  })

  it("should pick up actions execution where it left off after reaching previous maxFrames limit", function () {
    const MAX_FRAMES = 50
    const v = new VirtualTimeScheduler(VirtualAction, MAX_FRAMES)
    const messages: string[] = [
      "first message",
      "second message",
      "third message",
    ]

    const actualMessages: string[] = []

    messages.forEach((message, index) => {
      v.schedule(
        state => actualMessages.push(state!),
        index * MAX_FRAMES,
        message
      )
    })

    v.flush()
    v.maxFrames = 2 * MAX_FRAMES
    v.flush()

    expect(actualMessages).to.deep.equal(messages)
  })
})
/** @prettier */
import { expect } from "chai"
import { animationFrameProvider } from "rxjs/internal/scheduler/animationFrameProvider"

describe("animationFrameProvider", () => {
  const originalRequest = global.requestAnimationFrame
  const originalCancel = global.cancelAnimationFrame

  afterEach(() => {
    global.requestAnimationFrame = originalRequest
    global.cancelAnimationFrame = originalCancel
  })

  it("should be monkey patchable", () => {
    let requestCalled = false
    let cancelCalled = false

    global.requestAnimationFrame = () => {
      requestCalled = true
      return 0
    }
    global.cancelAnimationFrame = () => {
      cancelCalled = true
    }

    const handle = animationFrameProvider.requestAnimationFrame(() => {
      /* noop */
    })
    animationFrameProvider.cancelAnimationFrame(handle)

    expect(requestCalled).to.be.true
    expect(cancelCalled).to.be.true
  })
})
/** @prettier */
import { expect } from "chai"
import { stampProvider } from "rxjs/internal/scheduler/stampProvider"

describe("stampProvider", () => {
  const originalDate = global.Date

  afterEach(() => {
    global.Date = originalDate
  })

  it("should be monkey patchable", () => {
    let nowCalled = false

    global.Date = {
      now() {
        nowCalled = true
        return 0
      },
    } as any

    stampProvider.now()

    expect(nowCalled).to.be.true
  })
})
/** @prettier */
import { expect } from "chai"
import { intervalProvider } from "rxjs/internal/scheduler/intervalProvider"

describe("intervalProvider", () => {
  const originalSet = global.setInterval
  const originalClear = global.clearInterval

  afterEach(() => {
    global.setInterval = originalSet
    global.clearInterval = originalClear
  })

  it("should be monkey patchable", () => {
    let setCalled = false
    let clearCalled = false

    global.setInterval = (() => {
      setCalled = true
      return 0 as any
    }) as any // TypeScript complains about a __promisify__ property
    global.clearInterval = () => {
      clearCalled = true
    }

    const handle = intervalProvider.setInterval(() => {
      /* noop */
    })
    intervalProvider.clearInterval(handle)

    expect(setCalled).to.be.true
    expect(clearCalled).to.be.true
  })
})
/** @prettier */
import { expect } from "chai"
import { timeoutProvider } from "rxjs/internal/scheduler/timeoutProvider"

describe("timeoutProvider", () => {
  const originalSet = global.setTimeout
  const originalClear = global.clearTimeout

  afterEach(() => {
    global.setTimeout = originalSet
    global.clearTimeout = originalClear
  })

  it("should be monkey patchable", () => {
    let setCalled = false
    let clearCalled = false

    global.setTimeout = (() => {
      setCalled = true
      return 0 as any
    }) as any
    global.clearTimeout = () => {
      clearCalled = true
    }

    const handle = timeoutProvider.setTimeout(() => {
      /* noop */
    })
    timeoutProvider.clearTimeout(handle)

    expect(setCalled).to.be.true
    expect(clearCalled).to.be.true
  })
})
