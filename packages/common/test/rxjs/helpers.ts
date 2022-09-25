import { expect } from "chai"
import { Observable, of, Subscriber } from "rxjs"
import { observable as symbolObservable } from "rxjs/internal/symbol/observable"
import { asInteropObservable, asInteropSubscriber } from "./interop-helper"
describe("interop helper", () => {
  it("should simulate interop observables", () => {
    const observable: any = asInteropObservable(of(42))
    expect(observable).to.not.be.instanceOf(Observable)
    expect(observable[symbolObservable]).to.be.a("function")
  })
  it("should simulate interop subscribers", () => {
    const subscriber: any = asInteropSubscriber(new Subscriber())
    expect(subscriber).to.not.be.instanceOf(Subscriber)
  })
})
import { Observable, Operator, Subject, Subscriber, Subscription } from "rxjs"
/**
 * Returns an observable that will be deemed by this package's implementation
 * to be an observable that requires interop. The returned observable will fail
 * the `instanceof Observable` test and will deem any `Subscriber` passed to
 * its `subscribe` method to be untrusted.
 */
export function asInteropObservable<T>(observable: Observable<T>): Observable<T> {
  return new Proxy(observable, {
    get(target: Observable<T>, key: string | number | symbol) {
      if (key === "lift") {
        const { lift } = target as any
        return interopLift(lift)
      }
      if (key === "subscribe") {
        const { subscribe } = target
        return interopSubscribe(subscribe)
      }
      return Reflect.get(target, key)
    },
    getPrototypeOf(target: Observable<T>) {
      const { lift, subscribe, ...rest } = Object.getPrototypeOf(target)
      return {
        ...rest,
        lift: interopLift(lift),
        subscribe: interopSubscribe(subscribe),
      }
    },
  })
}
/**
 * Returns a subject that will be deemed by this package's implementation to
 * be untrusted. The returned subject will not include the symbol that
 * identifies trusted subjects.
 */
export function asInteropSubject<T>(subject: Subject<T>): Subject<T> {
  return asInteropSubscriber(subject as any) as any
}
/**
 * Returns a subscriber that will be deemed by this package's implementation to
 * be untrusted. The returned subscriber will fail the `instanceof Subscriber`
 * test and will not include the symbol that identifies trusted subscribers.
 */
export function asInteropSubscriber<T>(subscriber: Subscriber<T>): Subscriber<T> {
  return new Proxy(subscriber, {
    get(target: Subscriber<T>, key: string | number | symbol) {
      return Reflect.get(target, key)
    },
    getPrototypeOf(target: Subscriber<T>) {
      const { ...rest } = Object.getPrototypeOf(target)
      return rest
    },
  })
}
function interopLift<T, R>(lift: (operator: Operator<T, R>) => Observable<R>) {
  return function (this: Observable<T>, operator: Operator<T, R>): Observable<R> {
    const observable = lift.call(this, operator)
    const { call } = observable.operator!
    observable.operator!.call = function (this: Operator<T, R>, subscriber: Subscriber<R>, source: any) {
      return call.call(this, asInteropSubscriber(subscriber), source)
    }
    observable.source = asInteropObservable(observable.source!)
    return asInteropObservable(observable)
  }
}
function interopSubscribe<T>(subscribe: (...args: any[]) => Subscription) {
  return function (this: Observable<T>, ...args: any[]): Subscription {
    const [arg] = args
    if (arg instanceof Subscriber) {
      return subscribe.call(this, asInteropSubscriber(arg))
    }
    return subscribe.apply(this, args)
  }
}
import { Observable } from "rxjs"
import { SubscriptionLog } from "../../src/internal/testing/SubscriptionLog"
import { ColdObservable } from "../../src/internal/testing/ColdObservable"
import { HotObservable } from "../../src/internal/testing/HotObservable"
import { observableToBeFn, subscriptionLogsToBeFn } from "../../src/internal/testing/TestScheduler"
declare const global: any
export function hot(marbles: string, values?: void, error?: any): HotObservable<string>
export function hot<V>(marbles: string, values?: { [index: string]: V }, error?: any): HotObservable<V>
export function hot<V>(marbles: string, values?: { [index: string]: V } | void, error?: any): HotObservable<any> {
  if (!global.rxTestScheduler) {
    throw "tried to use hot() in async test"
  }
  return global.rxTestScheduler.createHotObservable.apply(global.rxTestScheduler, arguments)
}
export function cold(marbles: string, values?: void, error?: any): ColdObservable<string>
export function cold<V>(marbles: string, values?: { [index: string]: V }, error?: any): ColdObservable<V>
export function cold(marbles: string, values?: any, error?: any): ColdObservable<any> {
  if (!global.rxTestScheduler) {
    throw "tried to use cold() in async test"
  }
  return global.rxTestScheduler.createColdObservable.apply(global.rxTestScheduler, arguments)
}
export function expectObservable(
  observable: Observable<any>,
  unsubscriptionMarbles: string | null = null
): { toBe: observableToBeFn } {
  if (!global.rxTestScheduler) {
    throw "tried to use expectObservable() in async test"
  }
  return global.rxTestScheduler.expectObservable.apply(global.rxTestScheduler, arguments)
}
export function expectSubscriptions(actualSubscriptionLogs: SubscriptionLog[]): { toBe: subscriptionLogsToBeFn } {
  if (!global.rxTestScheduler) {
    throw "tried to use expectSubscriptions() in async test"
  }
  return global.rxTestScheduler.expectSubscriptions.apply(global.rxTestScheduler, arguments)
}
export function time(marbles: string): number {
  if (!global.rxTestScheduler) {
    throw "tried to use time() in async test"
  }
  return global.rxTestScheduler.createTime.apply(global.rxTestScheduler, arguments)
}
import * as _ from "lodash"
import * as chai from "chai"
function stringify(x: any): string {
  return JSON.stringify(x, function (key: string, value: any) {
    if (Array.isArray(value)) {
      return (
        "[" +
        value.map(function (i) {
          return "\n\t" + stringify(i)
        }) +
        "\n]"
      )
    }
    return value
  })
    .replace(/\\"/g, '"')
    .replace(/\\t/g, "\t")
    .replace(/\\n/g, "\n")
}
function deleteErrorNotificationStack(marble: any) {
  const { notification } = marble
  if (notification) {
    const { kind, error } = notification
    if (kind === "E" && error instanceof Error) {
      notification.error = { name: error.name, message: error.message }
    }
  }
  return marble
}
export function observableMatcher(actual: any, expected: any) {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    actual = actual.map(deleteErrorNotificationStack)
    expected = expected.map(deleteErrorNotificationStack)
    const passed = _.isEqual(actual, expected)
    if (passed) {
      return
    }
    let message = "\nExpected \n"
    actual.forEach((x: any) => (message += `\t${stringify(x)}\n`))
    message += "\t\nto deep equal \n"
    expected.forEach((x: any) => (message += `\t${stringify(x)}\n`))
    chai.assert(passed, message)
  } else {
    chai.assert.deepEqual(actual, expected)
  }
}
/**
 * Setup globals for the mocha unit tests such as injecting polyfills
 **/
import * as chai from "chai"
import * as sinonChai from "sinon-chai"
if (typeof Symbol !== "function") {
  let id = 0
  const symbolFn: any = (description: string) => `Symbol_${id++} ${description} (RxJS Testing Polyfill)`
  Symbol = symbolFn
}
if (!(Symbol as any).observable) {
  ;(Symbol as any).observable = Symbol("Symbol.observable polyfill from RxJS Testing")
}
/** Polyfill requestAnimationFrame for testing animationFrame scheduler in Node */
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
;(function (this: any, window: any) {
  window = window || this
  let lastTime = 0
  const vendors = ["ms", "moz", "webkit", "o"]
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"]
    window.cancelAnimationFrame =
      window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"]
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: Function, element: any) => {
      const currTime = new Date().getTime()
      const timeToCall = Math.max(0, 16 - (currTime - lastTime))
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall)
      }, timeToCall)
      lastTime = currTime + timeToCall
      return id
    }
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id)
    }
  }
})(global)
//setup sinon-chai
chai.use(sinonChai)
/** @prettier */
import { Teardown } from "rxjs"
export function getRegisteredFinalizers(subscription: any): Exclude<Teardown, void>[] {
  if ("_finalizers" in subscription) {
    return subscription._finalizers ?? []
  } else {
    throw new TypeError("Invalid Subscription")
  }
}
import { of, asyncScheduler, Observable, scheduled, ObservableInput } from "rxjs"
import { observable } from "rxjs/internal/symbol/observable"
import { iterator } from "rxjs/internal/symbol/iterator"
if (process && process.on) {
  /**
   * With async/await functions in Node, mocha seems to allow
   * tests to pass, even they shouldn't there's something about how
   * it handles the rejected promise where it does not notice
   * that the test failed.
   */
  process.on("unhandledRejection", err => {
    console.error(err)
    process.exit(1)
  })
}
export function lowerCaseO<T>(...args: Array<any>): Observable<T> {
  const o: any = {
    subscribe(observer: any) {
      args.forEach(v => observer.next(v))
      observer.complete()
      return {
        unsubscribe() {
          /* do nothing */
        },
      }
    },
  }
  o[observable] = function (this: any) {
    return this
  }
  return <any>o
}
export const createObservableInputs = <T>(value: T) =>
  of(
    of(value),
    scheduled([value], asyncScheduler),
    [value],
    Promise.resolve(value),
    {
      [iterator]: () => {
        const iteratorResults = [{ value, done: false }, { done: true }]
        return {
          next: () => {
            return iteratorResults.shift()
          },
        }
      },
    } as any as Iterable<T>,
    {
      [observable]: () => of(value),
    } as any
  ) as Observable<ObservableInput<T>>
/**
 * Used to signify no subscriptions took place to `expectSubscriptions` assertions.
 */
export const NO_SUBS: string[] = []
import * as _ from "lodash"
import * as chai from "chai"
import { TestScheduler } from "rxjs/testing"
//tslint:disable:no-var-requires no-require-imports
const commonInterface = require("mocha/lib/interfaces/common")
const escapeRe = require("escape-string-regexp")
//tslint:enable:no-var-requires no-require-imports
declare const module: any, global: any, Suite: any, Test: any
if (global && !(typeof window !== "undefined")) {
  global.mocha = require("mocha") // tslint:disable-line:no-require-imports no-var-requires
  global.Suite = global.mocha.Suite
  global.Test = global.mocha.Test
}
/**
 * mocha creates own global context per each test suite, simple patching to global won't deliver its context into test cases.
 * this custom interface is just mimic of existing one amending test scheduler behavior previously test-helper does via global patching.
 *
 * @deprecated This ui is no longer actively used. Will be removed after migrating remaining tests uses this.
 */
module.exports = function (suite: any) {
  const suites = [suite]
  suite.on("pre-require", function (context: any, file: any, mocha: any) {
    const common = (<any>commonInterface)(suites, context)
    context.before = common.before
    context.after = common.after
    context.beforeEach = common.beforeEach
    context.afterEach = common.afterEach
    context.run = mocha.options.delay && common.runWithSuite(suite)
    //setting up per-context test scheduler
    context.rxTestScheduler = null
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
    context.describe = context.context = function (title: any, fn: any) {
      const suite = (<any>Suite).create(suites[0], title)
      suite.file = file
      suites.unshift(suite)
      fn.call(suite)
      suites.shift()
      return suite
    }
    /**
     * Pending describe.
     */
    context.xdescribe =
      context.xcontext =
      context.describe.skip =
        function (title: any, fn: any) {
          const suite = (<any>Suite).create(suites[0], title)
          suite.pending = true
          suites.unshift(suite)
          fn.call(suite)
          suites.shift()
        }
    /**
     * Exclusive suite.
     */
    context.describe.only = function (title: any, fn: any) {
      const suite = context.describe(title, fn)
      mocha.grep(suite.fullTitle())
      return suite
    }
    function stringify(x: any): string {
      return JSON.stringify(x, function (key: string, value: any) {
        if (Array.isArray(value)) {
          return (
            "[" +
            value.map(function (i) {
              return "\n\t" + stringify(i)
            }) +
            "\n]"
          )
        }
        return value
      })
        .replace(/\\"/g, '"')
        .replace(/\\t/g, "\t")
        .replace(/\\n/g, "\n")
    }
    function deleteErrorNotificationStack(marble: any) {
      const { notification } = marble
      if (notification) {
        const { kind, error } = notification
        if (kind === "E" && error instanceof Error) {
          notification.error = { name: error.name, message: error.message }
        }
      }
      return marble
    }
    /**
     * custom assertion formatter for expectObservable test
     */
    function observableMatcher(actual: any, expected: any) {
      if (Array.isArray(actual) && Array.isArray(expected)) {
        actual = actual.map(deleteErrorNotificationStack)
        expected = expected.map(deleteErrorNotificationStack)
        const passed = _.isEqual(actual, expected)
        if (passed) {
          return
        }
        let message = "\nExpected \n"
        actual.forEach((x: any) => (message += `\t${stringify(x)}\n`))
        message += "\t\nto deep equal \n"
        expected.forEach((x: any) => (message += `\t${stringify(x)}\n`))
        chai.assert(passed, message)
      } else {
        chai.assert.deepEqual(actual, expected)
      }
    }
    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    const it =
      (context.it =
      context.specify =
        function (title: any, fn: any) {
          context.rxTestScheduler = null
          let modified = fn
          if (fn && fn.length === 0) {
            modified = function () {
              context.rxTestScheduler = new TestScheduler(observableMatcher)
              try {
                fn()
                context.rxTestScheduler.flush()
              } finally {
                context.rxTestScheduler = null
              }
            }
          }
          const suite = suites[0]
          if (suite.pending) {
            modified = null
          }
          const test = new (<any>Test)(title, modified)
          test.file = file
          suite.addTest(test)
          return test
        })
    /**
     * Exclusive test-case.
     */
    context.it.only = function (title: any, fn: any) {
      const test = it(title, fn)
      const reString = "^" + (<any>escapeRe)(test.fullTitle()) + "$"
      mocha.grep(new RegExp(reString))
      return test
    }
    /**
     * Pending test case.
     */
    context.xit =
      context.xspecify =
      context.it.skip =
        function (title: string) {
          context.it(title)
        }
    /**
     * Number of attempts to retry.
     */
    context.it.retries = function (n: number) {
      context.retries(n)
    }
  })
}
//register into global instnace if browser test page injects mocha globally
if (global.Mocha) {
  ;(<any>window).Mocha.interfaces["testschedulerui"] = module.exports
} else {
  ;(<any>mocha).interfaces["testschedulerui"] = module.exports
}
//overrides JSON.toStringfy to serialize error object
Object.defineProperty(Error.prototype, "toJSON", {
  value: function (this: any) {
    const alt: Record<string, any> = {}
    Object.getOwnPropertyNames(this).forEach(function (this: any, key: string) {
      if (key !== "stack") {
        alt[key] = this[key]
      }
    }, this)
    return alt
  },
  configurable: true,
})
