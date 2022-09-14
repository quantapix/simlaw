import { animationFrameProvider } from "./scheduler/animationFrameProvider"
import { applyMixins } from "./util/applyMixins"
import { ColdObservable } from "./ColdObservable"
import { dateTimestampProvider } from "./scheduler/dateTimestampProvider"
import { HotObservable } from "./HotObservable"
import { immediateProvider } from "./scheduler/immediateProvider"
import { intervalProvider } from "./scheduler/intervalProvider"
import { Observable } from "./Observable"
import { ObservableNotification } from "./types.js"
import { observeNotification } from "./Notification"
import { performanceTimestampProvider } from "./scheduler/performanceTimestampProvider"
import { Scheduler } from "./Scheduler"
import { Subject } from "./Subject"
import { Subscriber } from "./Subscriber"
import { Subscription } from "./Subscription"
import { SubscriptionLog } from "./SubscriptionLog"
import { SubscriptionLoggable } from "./SubscriptionLoggable"
import { TestMessage } from "./TestMessage"
import { timeoutProvider } from "./scheduler/timeoutProvider"
import type { TimerHandle } from "./scheduler/timerHandle"
import {
  VirtualTimeScheduler,
  VirtualAction,
} from "./scheduler/VirtualTimeScheduler"
import {
  COMPLETE_NOTIFICATION,
  errorNotification,
  nextNotification,
} from "./NotificationFactories"

export class ColdObservable<T>
  extends Observable<T>
  implements SubscriptionLoggable
{
  public subscriptions: SubscriptionLog[] = []
  scheduler: Scheduler

  logSubscribedFrame: () => number

  logUnsubscribedFrame: (index: number) => void
  constructor(public messages: TestMessage[], scheduler: Scheduler) {
    super(function (this: Observable<T>, subscriber: Subscriber<any>) {
      const observable: ColdObservable<T> = this as any
      const index = observable.logSubscribedFrame()
      const subscription = new Subscription()
      subscription.add(
        new Subscription(() => {
          observable.logUnsubscribedFrame(index)
        })
      )
      observable.scheduleMessages(subscriber)
      return subscription
    })
    this.scheduler = scheduler
  }
  scheduleMessages(subscriber: Subscriber<any>) {
    const messagesLength = this.messages.length
    for (let i = 0; i < messagesLength; i++) {
      const message = this.messages[i]
      subscriber.add(
        this.scheduler.schedule(
          state => {
            const {
              message: { notification },
              subscriber: destination,
            } = state!
            observeNotification(notification, destination)
          },
          message.frame,
          { message, subscriber }
        )
      )
    }
  }
}
applyMixins(ColdObservable, [SubscriptionLoggable])
export class HotObservable<T>
  extends Subject<T>
  implements SubscriptionLoggable
{
  public subscriptions: SubscriptionLog[] = []
  scheduler: Scheduler

  logSubscribedFrame: () => number

  logUnsubscribedFrame: (index: number) => void
  constructor(public messages: TestMessage[], scheduler: Scheduler) {
    super()
    this.scheduler = scheduler
  }
  protected _subscribe(subscriber: Subscriber<any>): Subscription {
    const subject: HotObservable<T> = this
    const index = subject.logSubscribedFrame()
    const subscription = new Subscription()
    subscription.add(
      new Subscription(() => {
        subject.logUnsubscribedFrame(index)
      })
    )
    subscription.add(super._subscribe(subscriber))
    return subscription
  }
  setup() {
    const subject = this
    const messagesLength = subject.messages.length
    for (let i = 0; i < messagesLength; i++) {
      ;(() => {
        const { notification, frame } = subject.messages[i]
        subject.scheduler.schedule(() => {
          observeNotification(notification, subject)
        }, frame)
      })()
    }
  }
}
applyMixins(HotObservable, [SubscriptionLoggable])
export class SubscriptionLog {
  constructor(
    public subscribedFrame: number,
    public unsubscribedFrame: number = Infinity
  ) {}
}
export class SubscriptionLoggable {
  public subscriptions: SubscriptionLog[] = []

  scheduler: Scheduler
  logSubscribedFrame(): number {
    this.subscriptions.push(new SubscriptionLog(this.scheduler.now()))
    return this.subscriptions.length - 1
  }
  logUnsubscribedFrame(index: number) {
    const subscriptionLogs = this.subscriptions
    const oldSubscriptionLog = subscriptionLogs[index]
    subscriptionLogs[index] = new SubscriptionLog(
      oldSubscriptionLog.subscribedFrame,
      this.scheduler.now()
    )
  }
}
export interface TestMessage {
  frame: number
  notification: ObservableNotification<any>
  isGhost?: boolean
}
const defaultMaxFrame: number = 750
export interface RunHelpers {
  cold: typeof TestScheduler.prototype.createColdObservable
  hot: typeof TestScheduler.prototype.createHotObservable
  flush: typeof TestScheduler.prototype.flush
  time: typeof TestScheduler.prototype.createTime
  expectObservable: typeof TestScheduler.prototype.expectObservable
  expectSubscriptions: typeof TestScheduler.prototype.expectSubscriptions
  animate: (marbles: string) => void
}
interface FlushableTest {
  ready: boolean
  actual?: any[]
  expected?: any[]
}
export type observableToBeFn = (
  marbles: string,
  values?: any,
  errorValue?: any
) => void
export type subscriptionLogsToBeFn = (marbles: string | string[]) => void
export class TestScheduler extends VirtualTimeScheduler {
  static frameTimeFactor = 10
  public readonly hotObservables: HotObservable<any>[] = []
  public readonly coldObservables: ColdObservable<any>[] = []
  private flushTests: FlushableTest[] = []
  private runMode = false
  constructor(
    public assertDeepEqual: (actual: any, expected: any) => boolean | void
  ) {
    super(VirtualAction, defaultMaxFrame)
  }
  createTime(marbles: string): number {
    const indexOf = this.runMode
      ? marbles.trim().indexOf("|")
      : marbles.indexOf("|")
    if (indexOf === -1) {
      throw new Error(
        'marble diagram for time should have a completion marker "|"'
      )
    }
    return indexOf * TestScheduler.frameTimeFactor
  }
  createColdObservable<T = string>(
    marbles: string,
    values?: { [marble: string]: T },
    error?: any
  ): ColdObservable<T> {
    if (marbles.indexOf("^") !== -1) {
      throw new Error('cold observable cannot have subscription offset "^"')
    }
    if (marbles.indexOf("!") !== -1) {
      throw new Error('cold observable cannot have unsubscription marker "!"')
    }
    const messages = TestScheduler.parseMarbles(
      marbles,
      values,
      error,
      undefined,
      this.runMode
    )
    const cold = new ColdObservable<T>(messages, this)
    this.coldObservables.push(cold)
    return cold
  }
  createHotObservable<T = string>(
    marbles: string,
    values?: { [marble: string]: T },
    error?: any
  ): HotObservable<T> {
    if (marbles.indexOf("!") !== -1) {
      throw new Error('hot observable cannot have unsubscription marker "!"')
    }
    const messages = TestScheduler.parseMarbles(
      marbles,
      values,
      error,
      undefined,
      this.runMode
    )
    const subject = new HotObservable<T>(messages, this)
    this.hotObservables.push(subject)
    return subject
  }
  private materializeInnerObservable(
    observable: Observable<any>,
    outerFrame: number
  ): TestMessage[] {
    const messages: TestMessage[] = []
    observable.subscribe({
      next: value => {
        messages.push({
          frame: this.frame - outerFrame,
          notification: nextNotification(value),
        })
      },
      error: error => {
        messages.push({
          frame: this.frame - outerFrame,
          notification: errorNotification(error),
        })
      },
      complete: () => {
        messages.push({
          frame: this.frame - outerFrame,
          notification: COMPLETE_NOTIFICATION,
        })
      },
    })
    return messages
  }
  expectObservable<T>(
    observable: Observable<T>,
    subscriptionMarbles: string | null = null
  ) {
    const actual: TestMessage[] = []
    const flushTest: FlushableTest = { actual, ready: false }
    const subscriptionParsed = TestScheduler.parseMarblesAsSubscriptions(
      subscriptionMarbles,
      this.runMode
    )
    const subscriptionFrame =
      subscriptionParsed.subscribedFrame === Infinity
        ? 0
        : subscriptionParsed.subscribedFrame
    const unsubscriptionFrame = subscriptionParsed.unsubscribedFrame
    let subscription: Subscription
    this.schedule(() => {
      subscription = observable.subscribe({
        next: x => {
          const value =
            x instanceof Observable
              ? this.materializeInnerObservable(x, this.frame)
              : x
          actual.push({
            frame: this.frame,
            notification: nextNotification(value),
          })
        },
        error: error => {
          actual.push({
            frame: this.frame,
            notification: errorNotification(error),
          })
        },
        complete: () => {
          actual.push({
            frame: this.frame,
            notification: COMPLETE_NOTIFICATION,
          })
        },
      })
    }, subscriptionFrame)
    if (unsubscriptionFrame !== Infinity) {
      this.schedule(() => subscription.unsubscribe(), unsubscriptionFrame)
    }
    this.flushTests.push(flushTest)
    const { runMode } = this
    return {
      toBe(marbles: string, values?: any, errorValue?: any) {
        flushTest.ready = true
        flushTest.expected = TestScheduler.parseMarbles(
          marbles,
          values,
          errorValue,
          true,
          runMode
        )
      },
      toEqual: (other: Observable<T>) => {
        flushTest.ready = true
        flushTest.expected = []
        this.schedule(() => {
          subscription = other.subscribe({
            next: x => {
              const value =
                x instanceof Observable
                  ? this.materializeInnerObservable(x, this.frame)
                  : x
              flushTest.expected!.push({
                frame: this.frame,
                notification: nextNotification(value),
              })
            },
            error: error => {
              flushTest.expected!.push({
                frame: this.frame,
                notification: errorNotification(error),
              })
            },
            complete: () => {
              flushTest.expected!.push({
                frame: this.frame,
                notification: COMPLETE_NOTIFICATION,
              })
            },
          })
        }, subscriptionFrame)
      },
    }
  }
  expectSubscriptions(actualSubscriptionLogs: SubscriptionLog[]): {
    toBe: subscriptionLogsToBeFn
  } {
    const flushTest: FlushableTest = {
      actual: actualSubscriptionLogs,
      ready: false,
    }
    this.flushTests.push(flushTest)
    const { runMode } = this
    return {
      toBe(marblesOrMarblesArray: string | string[]) {
        const marblesArray: string[] =
          typeof marblesOrMarblesArray === "string"
            ? [marblesOrMarblesArray]
            : marblesOrMarblesArray
        flushTest.ready = true
        flushTest.expected = marblesArray
          .map(marbles =>
            TestScheduler.parseMarblesAsSubscriptions(marbles, runMode)
          )
          .filter(marbles => marbles.subscribedFrame !== Infinity)
      },
    }
  }
  flush() {
    const hotObservables = this.hotObservables
    while (hotObservables.length > 0) {
      hotObservables.shift()!.setup()
    }
    super.flush()
    this.flushTests = this.flushTests.filter(test => {
      if (test.ready) {
        this.assertDeepEqual(test.actual, test.expected)
        return false
      }
      return true
    })
  }
  static parseMarblesAsSubscriptions(
    marbles: string | null,
    runMode = false
  ): SubscriptionLog {
    if (typeof marbles !== "string") {
      return new SubscriptionLog(Infinity)
    }

    const characters = [...marbles]
    const len = characters.length
    let groupStart = -1
    let subscriptionFrame = Infinity
    let unsubscriptionFrame = Infinity
    let frame = 0
    for (let i = 0; i < len; i++) {
      let nextFrame = frame
      const advanceFrameBy = (count: number) => {
        nextFrame += count * this.frameTimeFactor
      }
      const c = characters[i]
      switch (c) {
        case " ":
          if (!runMode) {
            advanceFrameBy(1)
          }
          break
        case "-":
          advanceFrameBy(1)
          break
        case "(":
          groupStart = frame
          advanceFrameBy(1)
          break
        case ")":
          groupStart = -1
          advanceFrameBy(1)
          break
        case "^":
          if (subscriptionFrame !== Infinity) {
            throw new Error(
              "found a second subscription point '^' in a " +
                "subscription marble diagram. There can only be one."
            )
          }
          subscriptionFrame = groupStart > -1 ? groupStart : frame
          advanceFrameBy(1)
          break
        case "!":
          if (unsubscriptionFrame !== Infinity) {
            throw new Error(
              "found a second unsubscription point '!' in a " +
                "subscription marble diagram. There can only be one."
            )
          }
          unsubscriptionFrame = groupStart > -1 ? groupStart : frame
          break
        default:
          if (runMode && c.match(/^[0-9]$/)) {
            if (i === 0 || characters[i - 1] === " ") {
              const buffer = characters.slice(i).join("")
              const match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /)
              if (match) {
                i += match[0].length - 1
                const duration = parseFloat(match[1])
                const unit = match[2]
                let durationInMs: number
                switch (unit) {
                  case "ms":
                    durationInMs = duration
                    break
                  case "s":
                    durationInMs = duration * 1000
                    break
                  case "m":
                    durationInMs = duration * 1000 * 60
                    break
                  default:
                    break
                }
                advanceFrameBy(durationInMs! / this.frameTimeFactor)
                break
              }
            }
          }
          throw new Error(
            "there can only be '^' and '!' markers in a " +
              "subscription marble diagram. Found instead '" +
              c +
              "'."
          )
      }
      frame = nextFrame
    }
    if (unsubscriptionFrame < 0) {
      return new SubscriptionLog(subscriptionFrame)
    } else {
      return new SubscriptionLog(subscriptionFrame, unsubscriptionFrame)
    }
  }
  static parseMarbles(
    marbles: string,
    values?: any,
    errorValue?: any,
    materializeInnerObservables: boolean = false,
    runMode = false
  ): TestMessage[] {
    if (marbles.indexOf("!") !== -1) {
      throw new Error(
        "conventional marble diagrams cannot have the " +
          'unsubscription marker "!"'
      )
    }

    const characters = [...marbles]
    const len = characters.length
    const testMessages: TestMessage[] = []
    const subIndex = runMode
      ? marbles.replace(/^[ ]+/, "").indexOf("^")
      : marbles.indexOf("^")
    let frame = subIndex === -1 ? 0 : subIndex * -this.frameTimeFactor
    const getValue =
      typeof values !== "object"
        ? (x: any) => x
        : (x: any) => {
            if (
              materializeInnerObservables &&
              values[x] instanceof ColdObservable
            ) {
              return values[x].messages
            }
            return values[x]
          }
    let groupStart = -1
    for (let i = 0; i < len; i++) {
      let nextFrame = frame
      const advanceFrameBy = (count: number) => {
        nextFrame += count * this.frameTimeFactor
      }
      let notification: ObservableNotification<any> | undefined
      const c = characters[i]
      switch (c) {
        case " ":
          if (!runMode) {
            advanceFrameBy(1)
          }
          break
        case "-":
          advanceFrameBy(1)
          break
        case "(":
          groupStart = frame
          advanceFrameBy(1)
          break
        case ")":
          groupStart = -1
          advanceFrameBy(1)
          break
        case "|":
          notification = COMPLETE_NOTIFICATION
          advanceFrameBy(1)
          break
        case "^":
          advanceFrameBy(1)
          break
        case "#":
          notification = errorNotification(errorValue || "error")
          advanceFrameBy(1)
          break
        default:
          if (runMode && c.match(/^[0-9]$/)) {
            if (i === 0 || characters[i - 1] === " ") {
              const buffer = characters.slice(i).join("")
              const match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /)
              if (match) {
                i += match[0].length - 1
                const duration = parseFloat(match[1])
                const unit = match[2]
                let durationInMs: number
                switch (unit) {
                  case "ms":
                    durationInMs = duration
                    break
                  case "s":
                    durationInMs = duration * 1000
                    break
                  case "m":
                    durationInMs = duration * 1000 * 60
                    break
                  default:
                    break
                }
                advanceFrameBy(durationInMs! / this.frameTimeFactor)
                break
              }
            }
          }
          notification = nextNotification(getValue(c))
          advanceFrameBy(1)
          break
      }
      if (notification) {
        testMessages.push({
          frame: groupStart > -1 ? groupStart : frame,
          notification,
        })
      }
      frame = nextFrame
    }
    return testMessages
  }
  private createAnimator() {
    if (!this.runMode) {
      throw new Error("animate() must only be used in run mode")
    }

    let lastHandle = 0
    let map: Map<number, FrameRequestCallback> | undefined
    const delegate = {
      requestAnimationFrame(callback: FrameRequestCallback) {
        if (!map) {
          throw new Error("animate() was not called within run()")
        }
        const handle = ++lastHandle
        map.set(handle, callback)
        return handle
      },
      cancelAnimationFrame(handle: number) {
        if (!map) {
          throw new Error("animate() was not called within run()")
        }
        map.delete(handle)
      },
    }
    const animate = (marbles: string) => {
      if (map) {
        throw new Error(
          "animate() must not be called more than once within run()"
        )
      }
      if (/[|#]/.test(marbles)) {
        throw new Error("animate() must not complete or error")
      }
      map = new Map<number, FrameRequestCallback>()
      const messages = TestScheduler.parseMarbles(
        marbles,
        undefined,
        undefined,
        undefined,
        true
      )
      for (const message of messages) {
        this.schedule(() => {
          const now = this.now()

          const callbacks = Array.from(map!.values())
          map!.clear()
          for (const callback of callbacks) {
            callback(now)
          }
        }, message.frame)
      }
    }
    return { animate, delegate }
  }
  private createDelegates() {
    let lastHandle = 0
    const scheduleLookup = new Map<
      TimerHandle,
      {
        due: number
        duration: number
        handle: TimerHandle
        handler: () => void
        subscription: Subscription
        type: "immediate" | "interval" | "timeout"
      }
    >()
    const run = () => {
      const now = this.now()
      const scheduledRecords = Array.from(scheduleLookup.values())
      const scheduledRecordsDue = scheduledRecords.filter(
        ({ due }) => due <= now
      )
      const dueImmediates = scheduledRecordsDue.filter(
        ({ type }) => type === "immediate"
      )
      if (dueImmediates.length > 0) {
        const { handle, handler } = dueImmediates[0]
        scheduleLookup.delete(handle)
        handler()
        return
      }
      const dueIntervals = scheduledRecordsDue.filter(
        ({ type }) => type === "interval"
      )
      if (dueIntervals.length > 0) {
        const firstDueInterval = dueIntervals[0]
        const { duration, handler } = firstDueInterval
        firstDueInterval.due = now + duration

        firstDueInterval.subscription = this.schedule(run, duration)
        handler()
        return
      }
      const dueTimeouts = scheduledRecordsDue.filter(
        ({ type }) => type === "timeout"
      )
      if (dueTimeouts.length > 0) {
        const { handle, handler } = dueTimeouts[0]
        scheduleLookup.delete(handle)
        handler()
        return
      }
      throw new Error("Expected a due immediate or interval")
    }

    const immediate = {
      setImmediate: (handler: () => void) => {
        const handle = ++lastHandle
        scheduleLookup.set(handle, {
          due: this.now(),
          duration: 0,
          handle,
          handler,
          subscription: this.schedule(run, 0),
          type: "immediate",
        })
        return handle
      },
      clearImmediate: (handle: TimerHandle) => {
        const value = scheduleLookup.get(handle)
        if (value) {
          value.subscription.unsubscribe()
          scheduleLookup.delete(handle)
        }
      },
    }
    const interval = {
      setInterval: (handler: () => void, duration = 0) => {
        const handle = ++lastHandle
        scheduleLookup.set(handle, {
          due: this.now() + duration,
          duration,
          handle,
          handler,
          subscription: this.schedule(run, duration),
          type: "interval",
        })
        return handle
      },
      clearInterval: (handle: TimerHandle) => {
        const value = scheduleLookup.get(handle)
        if (value) {
          value.subscription.unsubscribe()
          scheduleLookup.delete(handle)
        }
      },
    }
    const timeout = {
      setTimeout: (handler: () => void, duration = 0) => {
        const handle = ++lastHandle
        scheduleLookup.set(handle, {
          due: this.now() + duration,
          duration,
          handle,
          handler,
          subscription: this.schedule(run, duration),
          type: "timeout",
        })
        return handle
      },
      clearTimeout: (handle: TimerHandle) => {
        const value = scheduleLookup.get(handle)
        if (value) {
          value.subscription.unsubscribe()
          scheduleLookup.delete(handle)
        }
      },
    }
    return { immediate, interval, timeout }
  }
  run<T>(callback: (helpers: RunHelpers) => T): T {
    const prevFrameTimeFactor = TestScheduler.frameTimeFactor
    const prevMaxFrames = this.maxFrames
    TestScheduler.frameTimeFactor = 1
    this.maxFrames = Infinity
    this.runMode = true
    const animator = this.createAnimator()
    const delegates = this.createDelegates()
    animationFrameProvider.delegate = animator.delegate
    dateTimestampProvider.delegate = this
    immediateProvider.delegate = delegates.immediate
    intervalProvider.delegate = delegates.interval
    timeoutProvider.delegate = delegates.timeout
    performanceTimestampProvider.delegate = this
    const helpers: RunHelpers = {
      cold: this.createColdObservable.bind(this),
      hot: this.createHotObservable.bind(this),
      flush: this.flush.bind(this),
      time: this.createTime.bind(this),
      expectObservable: this.expectObservable.bind(this),
      expectSubscriptions: this.expectSubscriptions.bind(this),
      animate: animator.animate,
    }
    try {
      const ret = callback(helpers)
      this.flush()
      return ret
    } finally {
      TestScheduler.frameTimeFactor = prevFrameTimeFactor
      this.maxFrames = prevMaxFrames
      this.runMode = false
      animationFrameProvider.delegate = undefined
      dateTimestampProvider.delegate = undefined
      immediateProvider.delegate = undefined
      intervalProvider.delegate = undefined
      timeoutProvider.delegate = undefined
      performanceTimestampProvider.delegate = undefined
    }
  }
}
