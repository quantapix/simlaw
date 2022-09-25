import { innerFrom, Observable } from "./observable.js"
import { observeOn, subscribeOn } from "./operator.js"
import { Subscription } from "./subscription.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

interface StampProvider extends qt.TimestampProvider {
  delegate: qt.TimestampProvider | undefined
}

export const stamper: StampProvider = {
  now() {
    return (stamper.delegate || Date).now()
  },
  delegate: undefined,
}

export class Scheduler implements qt.Scheduler {
  static now: () => number = stamper.now
  static pop(xs: any[]): qt.Scheduler | undefined {
    return qu.isScheduler(qu.last(xs)) ? xs.pop() : undefined
  }
  constructor(private ctor: typeof Action, now: () => number = Scheduler.now) {
    this.now = now
  }

  now: () => number

  schedule<T>(work: (this: qt.SchedulerAction<T>, x?: T) => void, delay = 0, x?: T): Subscription {
    return new this.ctor<T>(this, work).schedule(x, delay)
  }

  dispatch<T>(x: qt.ObsInput<T>): Observable<T> {
    if (x != null) {
      if (qu.isInteropObservable(x)) return this.runObservable(x)
      if (qu.isArrayLike(x)) return this.runArray(x)
      if (qu.isPromise(x)) return this.runPromise(x)
      if (qu.isAsyncIterable(x)) return this.runAsync(x)
      if (qu.isIterable(x)) return this.runIterable(x)
      if (qu.isReadableStreamLike(x)) return this.runStream(x)
    }
    throw qu.createInvalidObservableTypeError(x)
  }

  run(s: Subscription, work: () => void, delay: number, more: true): void
  run(s: Subscription, work: () => void, delay?: number, more?: false): Subscription
  run(s: Subscription, work: () => void, delay = 0, more = false): Subscription | void {
    const y = this.schedule(function (this: qt.SchedulerAction<any>) {
      work()
      if (more) s.add(this.schedule(null, delay))
      else this.unsubscribe()
    }, delay)
    s.add(y)
    if (!more) return y as Subscription
  }

  runArray<T>(x: ArrayLike<T>) {
    return new Observable<T>(s => {
      let i = 0
      return this.schedule(function () {
        if (i === x.length) s.done()
        else {
          s.next(x[i++]!)
          if (!s.closed) this.schedule()
        }
      })
    })
  }
  runIterable<T>(x: Iterable<T>) {
    return new Observable<T>(s => {
      let i: Iterator<T, T>
      this.run(s, () => {
        i = (x as any)[Symbol.iterator]()
        this.run(
          s,
          () => {
            let value: T
            let done: boolean | undefined
            try {
              ;({ value, done } = i.next())
            } catch (e) {
              s.error(e)
              return
            }
            if (done) s.done()
            else s.next(value)
          },
          0,
          true
        )
      })
      return () => qu.isFunction(i?.return) && i.return()
    })
  }
  runAsync<T>(x: AsyncIterable<T>) {
    if (!x) throw new Error("Iterable cannot be null")
    return new Observable<T>(s => {
      this.run(s, () => {
        const i = x[Symbol.asyncIterator]()
        this.run(
          s,
          () => {
            i.next().then(res => {
              if (res.done) s.done()
              else s.next(res.value)
            })
          },
          0,
          true
        )
      })
    })
  }
  runObservable<T>(x: qt.Observable<T>) {
    return innerFrom(x).pipe(subscribeOn(this), observeOn(this))
  }
  runPromise<T>(x: PromiseLike<T>) {
    return innerFrom(x).pipe(subscribeOn(this), observeOn(this))
  }
  runStream<T>(x: qt.ReadableStreamLike<T>): Observable<T> {
    return this.runAsync(qu.readableStreamLikeToAsyncGenerator(x))
  }
}

export class Action<T> extends Subscription {
  constructor(_: Scheduler, _work: (this: qt.SchedulerAction<T>, x?: T) => void) {
    super()
  }
  schedule(_?: T, _delay = 0): Subscription {
    return this
  }
}

export class AsyncAction<T> extends Action<T> {
  public id: any
  public state?: T | undefined
  public delay = 0
  protected pending = false
  constructor(protected sched: AsyncScheduler, protected work: (this: qt.SchedulerAction<T>, x?: T) => void) {
    super(sched, work)
  }

  override schedule(x?: T, delay = 0): Subscription {
    if (this.closed) return this
    this.state = x
    const id = this.id
    const s = this.sched
    if (id != null) this.id = this.recycleId(s, id, delay)
    this.pending = true
    this.delay = delay
    this.id = this.id || this.requestId(s, this.id, delay)
    return this
  }

  do(x: T, delay: number): any {
    if (this.closed) return new Error("executing a cancelled action")
    this.pending = false
    const e = this.doWork(x, delay)
    if (e) return e
    else if (this.pending === false && this.id != null) {
      this.id = this.recycleId(this.sched, this.id, null)
    }
  }

  override unsubscribe() {
    if (!this.closed) {
      const { id, sched } = this
      const { actions } = sched
      this.work = this.state = this.sched = null!
      this.pending = false
      qu.arrRemove(actions, this)
      if (id != null) this.id = this.recycleId(sched, id, null)
      this.delay = null!
      super.unsubscribe()
    }
  }

  protected requestId(x: AsyncScheduler, _id?: any, delay = 0): any {
    return intervalProvider.setInterval(x.flush.bind(x, this), delay)
  }
  protected recycleId(_x: AsyncScheduler, id: any, delay: number | null = 0): any {
    if (delay != null && this.delay === delay && this.pending === false) {
      return id
    }
    intervalProvider.clearInterval(id)
    return undefined
  }
  protected doWork(x: T, _delay: number): any {
    let err = false
    let val: any
    try {
      this.work(x)
    } catch (e) {
      err = true
      val = e ? e : new Error("Scheduled action threw falsy error")
    }
    if (err) {
      this.unsubscribe()
      return val
    }
  }
}

export class AsyncScheduler extends Scheduler {
  public actions: AsyncAction<any>[] = []
  public active = false
  public scheduled: any = undefined
  constructor(x: typeof Action, now: () => number = Scheduler.now) {
    super(x, now)
  }

  flush(x: AsyncAction<any>): void {
    const { actions } = this
    if (this.active) {
      actions.push(x)
      return
    }
    let e: any
    this.active = true
    do {
      if ((e = x.do(x.state, x.delay))) break
    } while ((x = actions.shift()!))
    this.active = false
    if (e) {
      while ((x = actions.shift()!)) {
        x.unsubscribe()
      }
      throw e
    }
  }
}

export const asyncSched = new AsyncScheduler(AsyncAction)

export class FrameAction<T> extends AsyncAction<T> {
  constructor(
    protected override sched: FrameScheduler,
    protected override work: (this: qt.SchedulerAction<T>, x?: T) => void
  ) {
    super(sched, work)
  }

  protected override requestId(x: FrameScheduler, id?: any, delay = 0): any {
    if (delay !== null && delay > 0) return super.requestId(x, id, delay)
    x.actions.push(this)
    return x.scheduled || (x.scheduled = frameProvider.requestAnimationFrame(() => x.flush(undefined)))
  }
  protected override recycleId(x: FrameScheduler, id?: any, delay = 0): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleId(x, id, delay)
    }
    if (!x.actions.some(action => action.id === id)) {
      frameProvider.cancelAnimationFrame(id)
      x.scheduled = undefined
    }
    return undefined
  }
}

export class FrameScheduler extends AsyncScheduler {
  override flush(x?: AsyncAction<any>): void {
    this.active = true
    const id = this.scheduled
    this.scheduled = undefined
    const { actions } = this
    let e: any
    x = x || actions.shift()!
    do {
      if ((e = x.do(x.state, x.delay))) break
    } while ((x = actions[0]) && x.id === id && actions.shift())
    this.active = false
    if (e) {
      while ((x = actions[0]) && x.id === id && actions.shift()) {
        x.unsubscribe()
      }
      throw e
    }
  }
}

export class AsapAction<T> extends AsyncAction<T> {
  constructor(
    protected override sched: AsapScheduler,
    protected override work: (this: qt.SchedulerAction<T>, x?: T) => void
  ) {
    super(sched, work)
  }

  protected override requestId(x: AsapScheduler, id?: any, delay = 0): any {
    if (delay !== null && delay > 0) return super.requestId(x, id, delay)
    x.actions.push(this)
    return x.scheduled || (x.scheduled = immediateProvider.setImmediate(x.flush.bind(x, undefined)))
  }
  protected override recycleId(x: AsapScheduler, id?: any, delay = 0): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleId(x, id, delay)
    }
    if (!x.actions.some(action => action.id === id)) {
      immediateProvider.clearImmediate(id)
      x.scheduled = undefined
    }
    return undefined
  }
}

export class AsapScheduler extends AsyncScheduler {
  override flush(x?: AsyncAction<any>): void {
    this.active = true
    const is = this.scheduled
    this.scheduled = undefined
    const { actions } = this
    let e: any
    x = x || actions.shift()!
    do {
      if ((e = x.do(x.state, x.delay))) break
    } while ((x = actions[0]) && x.id === is && actions.shift())
    this.active = false
    if (e) {
      while ((x = actions[0]) && x.id === is && actions.shift()) {
        x.unsubscribe()
      }
      throw e
    }
  }
}

export class QueueAction<T> extends AsyncAction<T> {
  constructor(
    protected override sched: QueueScheduler,
    protected override work: (this: qt.SchedulerAction<T>, x?: T) => void
  ) {
    super(sched, work)
  }

  override schedule(x?: T, delay = 0): Subscription {
    if (delay > 0) return super.schedule(x, delay)
    this.delay = delay
    this.state = x
    this.sched.flush(this)
    return this
  }

  override do(x: T, delay: number): any {
    return delay > 0 || this.closed ? super.do(x, delay) : this.doWork(x, delay)
  }

  protected override requestId(x: QueueScheduler, id?: any, delay = 0): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.requestId(x, id, delay)
    }
    return x.flush(this)
  }
}

export class QueueScheduler extends AsyncScheduler {}

export class VirtualAction<T> extends AsyncAction<T> {
  protected active = true
  constructor(
    protected override sched: VirtualScheduler,
    protected override work: (this: qt.SchedulerAction<T>, x?: T) => void,
    protected index: number = (sched.index += 1)
  ) {
    super(sched, work)
    this.index = sched.index = index
  }

  override schedule(x?: T, delay = 0): Subscription {
    if (Number.isFinite(delay)) {
      if (!this.id) return super.schedule(x, delay)
      this.active = false
      const y = new VirtualAction(this.sched, this.work)
      this.add(y)
      return y.schedule(x, delay)
    }
    return Subscription.EMPTY
  }

  protected override requestId(x: VirtualScheduler, _id?: any, delay = 0): any {
    this.delay = x.frame + delay
    const { actions } = x
    actions.push(this)
    ;(actions as VirtualAction<T>[]).sort(VirtualAction.sortActions)
    return true
  }
  protected override recycleId(_x: VirtualScheduler, _id?: any, _delay = 0): any {
    return undefined
  }
  protected override doWork(x: T, delay: number): any {
    if (this.active === true) return super.doWork(x, delay)
  }
  private static sortActions<T>(a: VirtualAction<T>, b: VirtualAction<T>) {
    if (a.delay === b.delay) {
      if (a.index === b.index) return 0
      else if (a.index > b.index) return 1
      else return -1
    } else if (a.delay > b.delay) return 1
    else return -1
  }
}

export class VirtualScheduler extends AsyncScheduler {
  static frameTimeFactor = 10
  public frame = 0
  public index = -1
  constructor(x: typeof AsyncAction = VirtualAction as any, public maxFrames: number = Infinity) {
    super(x, () => this.frame)
  }

  override flush(): void {
    const { actions, maxFrames } = this
    let e: any
    let x: AsyncAction<any> | undefined
    while ((x = actions[0]) && x.delay <= maxFrames) {
      actions.shift()
      this.frame = x.delay
      if ((e = x.do(x.state, x.delay))) break
    }
    if (e) {
      while ((x = actions.shift())) {
        x.unsubscribe()
      }
      throw e
    }
  }
}

interface FrameProvider {
  schedule(x: FrameRequestCallback): Subscription
  requestAnimationFrame: typeof requestAnimationFrame
  cancelAnimationFrame: typeof cancelAnimationFrame
  delegate:
    | {
        requestAnimationFrame: typeof requestAnimationFrame
        cancelAnimationFrame: typeof cancelAnimationFrame
      }
    | undefined
}

export const frameProvider: FrameProvider = {
  schedule(x) {
    let request = requestAnimationFrame
    let cancel: typeof cancelAnimationFrame | undefined = cancelAnimationFrame
    const { delegate } = frameProvider
    if (delegate) {
      request = delegate.requestAnimationFrame
      cancel = delegate.cancelAnimationFrame
    }
    const handle = request(timestamp => {
      cancel = undefined
      x(timestamp)
    })
    return new Subscription(() => cancel?.(handle))
  },
  requestAnimationFrame(...xs) {
    const { delegate } = frameProvider
    return (delegate?.requestAnimationFrame || requestAnimationFrame)(...xs)
  },
  cancelAnimationFrame(...xs) {
    const { delegate } = frameProvider
    return (delegate?.cancelAnimationFrame || cancelAnimationFrame)(...xs)
  },
  delegate: undefined,
}

const { setImmediate, clearImmediate } = qu.Immediate
type SetImmediate = (handler: () => void, ...xs: any[]) => TimerHandle
type ClearImmediate = (x: TimerHandle) => void

interface ImmediateProvider {
  setImmediate: SetImmediate
  clearImmediate: ClearImmediate
  delegate:
    | {
        setImmediate: SetImmediate
        clearImmediate: ClearImmediate
      }
    | undefined
}

export const immediateProvider: ImmediateProvider = {
  setImmediate(...xs) {
    const { delegate } = immediateProvider
    return (delegate?.setImmediate || setImmediate)(...xs)
  },
  clearImmediate(x) {
    const { delegate } = immediateProvider
    return (delegate?.clearImmediate || clearImmediate)(x as any)
  },
  delegate: undefined,
}

type SetInterval = (x: () => void, timeout?: number, ...xs: any[]) => TimerHandle

type ClearInterval = (x: TimerHandle) => void

interface IntervalProvider {
  setInterval: SetInterval
  clearInterval: ClearInterval
  delegate:
    | {
        setInterval: SetInterval
        clearInterval: ClearInterval
      }
    | undefined
}

export const intervalProvider: IntervalProvider = {
  setInterval(x: () => void, timeout?: number, ...xs) {
    const { delegate } = intervalProvider
    if (delegate?.setInterval) return delegate.setInterval(x, timeout, ...xs)
    return setInterval(x, timeout, ...xs)
  },
  clearInterval(x) {
    const { delegate } = intervalProvider
    return (delegate?.clearInterval || clearInterval)(x as any)
  },
  delegate: undefined,
}

interface PerfProvider extends qt.TimestampProvider {
  delegate: qt.TimestampProvider | undefined
}

export const perfProvider: PerfProvider = {
  now() {
    return (perfProvider.delegate || performance).now()
  },
  delegate: undefined,
}

export type TimerHandle = number | NodeJS.Timeout

type SetTimeout = (x: () => void, timeout?: number, ...xs: any[]) => TimerHandle
type ClearTimeout = (x: TimerHandle) => void

interface TimeoutProvider {
  setTimeout: SetTimeout
  clearTimeout: ClearTimeout
  delegate:
    | {
        setTimeout: SetTimeout
        clearTimeout: ClearTimeout
      }
    | undefined
}

export const timeoutProvider: TimeoutProvider = {
  setTimeout(x: () => void, timeout?: number, ...xs) {
    const { delegate } = timeoutProvider
    if (delegate?.setTimeout) return delegate.setTimeout(x, timeout, ...xs)
    return setTimeout(x, timeout, ...xs)
  },
  clearTimeout(x) {
    const { delegate } = timeoutProvider
    return (delegate?.clearTimeout || clearTimeout)(x as any)
  },
  delegate: undefined,
}
