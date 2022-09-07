/* eslint-disable @typescript-eslint/no-namespace */
import type { IDisposable, IObservableDisposable } from "./disposable.js"
import { ISignal, Signal } from "./signaling.js"
import { JSONExt, PromiseDelegate } from "./utils.js"

export interface IPoll<T, U, V extends string>
  extends AsyncIterable<IPoll.State<T, U, V>> {
  readonly disposed: ISignal<this, void>
  readonly frequency: IPoll.Frequency
  readonly isDisposed: boolean
  readonly name: string
  readonly state: IPoll.State<T, U, V>
  readonly tick: Promise<IPoll<T, U, V>>
  readonly ticked: ISignal<IPoll<T, U, V>, IPoll.State<T, U, V>>
}
export namespace IPoll {
  export type Frequency = {
    readonly backoff: boolean | number
    readonly interval: number
    readonly max: number
  }
  export type Phase<T extends string> =
    | T
    | "constructed"
    | "disposed"
    | "reconnected"
    | "refreshed"
    | "rejected"
    | "resolved"
    | "standby"
    | "started"
    | "stopped"
  export type State<T, U, V extends string> = {
    readonly interval: number
    readonly payload: T | U | null
    readonly phase: Phase<V>
    readonly timestamp: number
  }
}
export interface IRateLimiter<T = any, U = any, V extends any[] = any[]>
  extends IDisposable {
  readonly limit: number
  invoke(...args: V): Promise<T>
  stop(): Promise<void>
}
const defer =
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame
    : setImmediate
const cancel: (timeout: any) => void =
  typeof cancelAnimationFrame === "function"
    ? cancelAnimationFrame
    : clearImmediate
export class Poll<T = any, U = any, V extends string = "standby">
  implements IObservableDisposable, IPoll<T, U, V>
{
  constructor(options: Poll.IOptions<T, U, V>) {
    this._factory = options.factory
    this._standby = options.standby || Private.DEFAULT_STANDBY
    this._state = { ...Private.DEFAULT_STATE, timestamp: new Date().getTime() }
    const frequency = options.frequency || {}
    const max = Math.max(
      frequency.interval || 0,
      frequency.max || 0,
      Private.DEFAULT_FREQUENCY.max
    )
    this.frequency = { ...Private.DEFAULT_FREQUENCY, ...frequency, ...{ max } }
    this.name = options.name || Private.DEFAULT_NAME
    if ("auto" in options ? options.auto : true) {
      defer(() => void this.start())
    }
  }
  readonly name: string
  get disposed(): ISignal<this, void> {
    return this._disposed
  }
  get frequency(): IPoll.Frequency {
    return this._frequency
  }
  set frequency(frequency: IPoll.Frequency) {
    if (this.isDisposed || JSONExt.deepEqual(frequency, this.frequency || {})) {
      return
    }
    let { backoff, interval, max } = frequency
    interval = Math.round(interval)
    max = Math.round(max)
    if (typeof backoff === "number" && backoff < 1) {
      throw new Error("Poll backoff growth factor must be at least 1")
    }
    if ((interval < 0 || interval > max) && interval !== Poll.NEVER) {
      throw new Error("Poll interval must be between 0 and max")
    }
    if (max > Poll.MAX_INTERVAL && max !== Poll.NEVER) {
      throw new Error(`Max interval must be less than ${Poll.MAX_INTERVAL}`)
    }
    this._frequency = { backoff, interval, max }
  }
  get isDisposed(): boolean {
    return this.state.phase === "disposed"
  }
  get standby(): Poll.Standby | (() => boolean | Poll.Standby) {
    return this._standby
  }
  set standby(standby: Poll.Standby | (() => boolean | Poll.Standby)) {
    if (this.isDisposed || this.standby === standby) {
      return
    }
    this._standby = standby
  }
  get state(): IPoll.State<T, U, V> {
    return this._state
  }
  get tick(): Promise<this> {
    return this._tick.promise
  }
  get ticked(): ISignal<this, IPoll.State<T, U, V>> {
    return this._ticked
  }
  async *[Symbol.asyncIterator](): AsyncIterableIterator<IPoll.State<T, U, V>> {
    while (!this.isDisposed) {
      yield this.state
      await this.tick.catch(() => undefined)
    }
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._state = {
      ...Private.DISPOSED_STATE,
      timestamp: new Date().getTime(),
    }
    this._tick.promise.catch(_ => undefined)
    this._tick.reject(new Error(`Poll (${this.name}) is disposed.`))
    this._disposed.emit(undefined)
    Signal.clearData(this)
  }
  refresh(): Promise<void> {
    return this.schedule({
      cancel: ({ phase }) => phase === "refreshed",
      interval: Poll.IMMEDIATE,
      phase: "refreshed",
    })
  }
  async schedule(
    next: Partial<
      IPoll.State<T, U, V> & { cancel: (last: IPoll.State<T, U, V>) => boolean }
    > = {}
  ): Promise<void> {
    if (this.isDisposed) {
      return
    }
    if (next.cancel && next.cancel(this.state)) {
      return
    }
    const last = this.state
    const pending = this._tick
    const scheduled = new PromiseDelegate<this>()
    const state = {
      interval: this.frequency.interval,
      payload: null,
      phase: "standby",
      timestamp: new Date().getTime(),
      ...next,
    } as IPoll.State<T, U, V>
    this._state = state
    this._tick = scheduled
    if (last.interval === Poll.IMMEDIATE) {
      cancel(this._timeout)
    } else {
      clearTimeout(this._timeout)
    }
    this._ticked.emit(this.state)
    pending.resolve(this)
    await pending.promise
    const execute = () => {
      if (this.isDisposed || this.tick !== scheduled.promise) {
        return
      }
      this._execute()
    }
    this._timeout =
      state.interval === Poll.IMMEDIATE
        ? defer(execute)
        : state.interval === Poll.NEVER
        ? -1
        : setTimeout(execute, state.interval)
  }
  start(): Promise<void> {
    return this.schedule({
      cancel: ({ phase }) =>
        phase !== "constructed" && phase !== "standby" && phase !== "stopped",
      interval: Poll.IMMEDIATE,
      phase: "started",
    })
  }
  stop(): Promise<void> {
    return this.schedule({
      cancel: ({ phase }) => phase === "stopped",
      interval: Poll.NEVER,
      phase: "stopped",
    })
  }
  private _execute(): void {
    let standby =
      typeof this.standby === "function" ? this.standby() : this.standby
    standby =
      standby === "never"
        ? false
        : standby === "when-hidden"
        ? !!(typeof document !== "undefined" && document && document.hidden)
        : standby
    if (standby) {
      void this.schedule()
      return
    }
    const pending = this.tick
    this._factory(this.state)
      .then((resolved: T) => {
        if (this.isDisposed || this.tick !== pending) {
          return
        }
        void this.schedule({
          payload: resolved,
          phase: this.state.phase === "rejected" ? "reconnected" : "resolved",
        })
      })
      .catch((rejected: U) => {
        if (this.isDisposed || this.tick !== pending) {
          return
        }
        void this.schedule({
          interval: Private.sleep(this.frequency, this.state),
          payload: rejected,
          phase: "rejected",
        })
      })
  }
  private _disposed = new Signal<this, void>(this)
  private _factory: Poll.Factory<T, U, V>
  private _frequency: IPoll.Frequency
  private _standby: Poll.Standby | (() => boolean | Poll.Standby)
  private _state: IPoll.State<T, U, V>
  private _tick = new PromiseDelegate<this>()
  private _ticked = new Signal<this, IPoll.State<T, U, V>>(this)
  private _timeout: any = -1
}
export namespace Poll {
  export type Factory<T, U, V extends string> = (
    state: IPoll.State<T, U, V>
  ) => Promise<T>
  export type Standby = "never" | "when-hidden"
  export interface IOptions<T, U, V extends string> {
    auto?: boolean
    factory: Factory<T, U, V>
    frequency?: Partial<IPoll.Frequency>
    name?: string
    standby?: Standby | (() => boolean | Standby)
  }
  export const IMMEDIATE = 0
  export const MAX_INTERVAL = 2147483647
  export const NEVER = Infinity
}
namespace Private {
  export const DEFAULT_BACKOFF = 3
  export const DEFAULT_FREQUENCY: IPoll.Frequency = {
    backoff: true,
    interval: 1000,
    max: 30 * 1000,
  }
  export const DEFAULT_NAME = "unknown"
  export const DEFAULT_STANDBY: Poll.Standby = "when-hidden"
  export const DEFAULT_STATE: IPoll.State<any, any, any> = {
    interval: Poll.NEVER,
    payload: null,
    phase: "constructed",
    timestamp: new Date(0).getTime(),
  }
  export const DISPOSED_STATE: IPoll.State<any, any, any> = {
    interval: Poll.NEVER,
    payload: null,
    phase: "disposed",
    timestamp: new Date(0).getTime(),
  }
  function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  export function sleep(
    frequency: IPoll.Frequency,
    last: IPoll.State<any, any, any>
  ): number {
    const { backoff, interval, max } = frequency
    if (interval === Poll.NEVER) {
      return interval
    }
    const growth =
      backoff === true ? DEFAULT_BACKOFF : backoff === false ? 1 : backoff
    const random = getRandomIntInclusive(interval, last.interval * growth)
    return Math.min(max, random)
  }
}
export abstract class RateLimiter<T, U, V extends any[]>
  implements IRateLimiter<T, U, V>
{
  constructor(fn: (...args: V) => T | Promise<T>, limit = 500) {
    this.limit = limit
    this.poll = new Poll({
      auto: false,
      factory: async () => {
        const { args } = this
        this.args = undefined
        return fn(...args!)
      },
      frequency: { backoff: false, interval: Poll.NEVER, max: Poll.NEVER },
      standby: "never",
    })
    this.payload = new PromiseDelegate()
    this.poll.ticked.connect((_, state) => {
      const { payload } = this
      if (state.phase === "resolved") {
        this.payload = new PromiseDelegate()
        payload!.resolve(state.payload as T)
        return
      }
      if (state.phase === "rejected" || state.phase === "stopped") {
        this.payload = new PromiseDelegate()
        payload!.promise.catch(_ => undefined)
        payload!.reject(state.payload as U)
        return
      }
    }, this)
  }
  get isDisposed(): boolean {
    return this.payload === null
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this.args = undefined
    this.payload = null
    this.poll.dispose()
  }
  readonly limit: number
  abstract invoke(...args: V): Promise<T>
  async stop(): Promise<void> {
    return this.poll.stop()
  }
  protected args: V | undefined = undefined
  protected payload: PromiseDelegate<T> | null = null
  protected poll: Poll<T, U, "invoked">
}
export class Debouncer<
  T = any,
  U = any,
  V extends any[] = any[]
> extends RateLimiter<T, U, V> {
  invoke(...args: V): Promise<T> {
    this.args = args
    void this.poll.schedule({ interval: this.limit, phase: "invoked" })
    return this.payload!.promise
  }
}
export class Throttler<
  T = any,
  U = any,
  V extends any[] = any[]
> extends RateLimiter<T, U, V> {
  constructor(
    fn: (...args: V) => T | Promise<T>,
    options?: Throttler.IOptions | number
  ) {
    super(fn, typeof options === "number" ? options : options && options.limit)
    if (typeof options !== "number" && options && options.edge === "trailing") {
      this._trailing = true
    }
    this._interval = this._trailing ? this.limit : Poll.IMMEDIATE
  }
  invoke(...args: V): Promise<T> {
    const idle = this.poll.state.phase !== "invoked"
    if (idle || this._trailing) {
      this.args = args
    }
    if (idle) {
      void this.poll.schedule({ interval: this._interval, phase: "invoked" })
    }
    return this.payload!.promise
  }
  private _interval: number
  private _trailing = false
}
export namespace Throttler {
  export interface IOptions {
    limit?: number
    edge?: "leading" | "trailing"
  }
}
