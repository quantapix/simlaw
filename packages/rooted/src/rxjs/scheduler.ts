import * as qu from "./utils.js"
import type * as qt from "./types.js"
import { Subscription } from "./subscription.js"

export const dateTimestampProvider: DateTimestampProvider = {
  now() {
    return (dateTimestampProvider.delegate || Date).now()
  },
  delegate: undefined,
}

export class Scheduler implements qt.Scheduler {
  public static now: () => number = dateTimestampProvider.now
  constructor(private ctor: typeof Action, now: () => number = Scheduler.now) {
    this.now = now
  }
  public now: () => number
  public schedule<T>(
    work: (this: qt.SchedulerAction<T>, x?: T) => void,
    delay = 0,
    state?: T
  ): Subscription {
    return new this.ctor<T>(this, work).schedule(state, delay)
  }
}

export class Action<T> extends Subscription {
  constructor(
    _: Scheduler,
    _work: (this: qt.SchedulerAction<T>, x?: T) => void
  ) {
    super()
  }
  public schedule(_?: T, _delay = 0): Subscription {
    return this
  }
}

export class AsyncAction<T> extends Action<T> {
  public id: any
  public state?: T | undefined
  public delay = 0
  protected pending = false
  constructor(
    protected sched: AsyncScheduler,
    protected work: (this: qt.SchedulerAction<T>, x?: T) => void
  ) {
    super(sched, work)
  }
  public override schedule(x?: T, delay = 0): Subscription {
    if (this.closed) return this
    this.state = x
    const id = this.id
    const scheduler = this.sched
    if (id != null) this.id = this.recycleAsyncId(scheduler, id, delay)
    this.pending = true
    this.delay = delay
    this.id = this.id || this.requestAsyncId(scheduler, this.id, delay)
    return this
  }
  protected requestAsyncId(x: AsyncScheduler, _id?: any, delay = 0): any {
    return intervalProvider.setInterval(x.flush.bind(x, this), delay)
  }
  protected recycleAsyncId(
    _x: AsyncScheduler,
    id: any,
    delay: number | null = 0
  ): any {
    if (delay != null && this.delay === delay && this.pending === false)
      return id
    intervalProvider.clearInterval(id)
    return undefined
  }
  public execute(x: T, delay: number): any {
    if (this.closed) return new Error("executing a cancelled action")
    this.pending = false
    const e = this._execute(x, delay)
    if (e) return e
    else if (this.pending === false && this.id != null) {
      this.id = this.recycleAsyncId(this.sched, this.id, null)
    }
  }
  protected _execute(x: T, _delay: number): any {
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
  override unsubscribe() {
    if (!this.closed) {
      const { id, sched } = this
      const { actions } = sched
      this.work = this.state = this.sched = null!
      this.pending = false
      qu.arrRemove(actions, this)
      if (id != null) this.id = this.recycleAsyncId(sched, id, null)
      this.delay = null!
      super.unsubscribe()
    }
  }
}

export class AsyncScheduler extends Scheduler {
  public actions: Array<AsyncAction<any>> = []
  public active = false
  public scheduled: any = undefined
  constructor(x: typeof Action, now: () => number = Scheduler.now) {
    super(x, now)
  }
  public flush(x: AsyncAction<any>): void {
    const { actions } = this
    if (this.active) {
      actions.push(x)
      return
    }
    let e: any
    this.active = true
    do {
      if ((e = x.execute(x.state, x.delay))) break
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

export class AnimationFrameAction<T> extends AsyncAction<T> {
  constructor(
    protected override sched: AnimationFrameScheduler,
    protected override work: (this: qt.SchedulerAction<T>, state?: T) => void
  ) {
    super(sched, work)
  }
  protected override requestAsyncId(
    x: AnimationFrameScheduler,
    id?: any,
    delay = 0
  ): any {
    if (delay !== null && delay > 0) return super.requestAsyncId(x, id, delay)
    x.actions.push(this)
    return (
      x.scheduled ||
      (x.scheduled = animationFrameProvider.requestAnimationFrame(() =>
        x.flush(undefined)
      ))
    )
  }
  protected override recycleAsyncId(
    x: AnimationFrameScheduler,
    id?: any,
    delay = 0
  ): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(x, id, delay)
    }
    if (!x.actions.some(action => action.id === id)) {
      animationFrameProvider.cancelAnimationFrame(id)
      x.scheduled = undefined
    }
    return undefined
  }
}

export class AnimationFrameScheduler extends AsyncScheduler {
  public override flush(x?: AsyncAction<any>): void {
    this.active = true
    const id = this.scheduled
    this.scheduled = undefined
    const { actions } = this
    let e: any
    x = x || actions.shift()!
    do {
      if ((e = x.execute(x.state, x.delay))) break
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
  protected override requestAsyncId(
    x: AsapScheduler,
    id?: any,
    delay = 0
  ): any {
    if (delay !== null && delay > 0) return super.requestAsyncId(x, id, delay)
    x.actions.push(this)
    return (
      x.scheduled ||
      (x.scheduled = immediateProvider.setImmediate(x.flush.bind(x, undefined)))
    )
  }
  protected override recycleAsyncId(
    x: AsapScheduler,
    id?: any,
    delay = 0
  ): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(x, id, delay)
    }
    if (!x.actions.some(action => action.id === id)) {
      immediateProvider.clearImmediate(id)
      x.scheduled = undefined
    }
    return undefined
  }
}

export class AsapScheduler extends AsyncScheduler {
  public override flush(x?: AsyncAction<any>): void {
    this.active = true
    const is = this.scheduled
    this.scheduled = undefined
    const { actions } = this
    let e: any
    x = x || actions.shift()!
    do {
      if ((e = x.execute(x.state, x.delay))) break
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
  public override schedule(x?: T, delay = 0): Subscription {
    if (delay > 0) return super.schedule(x, delay)

    this.delay = delay
    this.state = x
    this.sched.flush(this)
    return this
  }
  public override execute(x: T, delay: number): any {
    return delay > 0 || this.closed
      ? super.execute(x, delay)
      : this._execute(x, delay)
  }
  protected override requestAsyncId(
    x: QueueScheduler,
    id?: any,
    delay = 0
  ): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.requestAsyncId(x, id, delay)
    }
    return x.flush(this)
  }
}

export class QueueScheduler extends AsyncScheduler {}

export class VirtualTimeScheduler extends AsyncScheduler {
  static frameTimeFactor = 10
  public frame = 0
  public index = -1
  constructor(
    x: typeof AsyncAction = VirtualAction as any,
    public maxFrames: number = Infinity
  ) {
    super(x, () => this.frame)
  }
  public override flush(): void {
    const { actions, maxFrames } = this
    let e: any
    let x: AsyncAction<any> | undefined
    while ((x = actions[0]) && x.delay <= maxFrames) {
      actions.shift()
      this.frame = x.delay
      if ((e = x.execute(x.state, x.delay))) break
    }
    if (e) {
      while ((x = actions.shift())) {
        x.unsubscribe()
      }
      throw e
    }
  }
}

export class VirtualAction<T> extends AsyncAction<T> {
  protected active = true
  constructor(
    protected override sched: VirtualTimeScheduler,
    protected override work: (this: qt.SchedulerAction<T>, state?: T) => void,
    protected index: number = (sched.index += 1)
  ) {
    super(sched, work)
    this.index = sched.index = index
  }
  public override schedule(x?: T, delay = 0): Subscription {
    if (Number.isFinite(delay)) {
      if (!this.id) return super.schedule(x, delay)
      this.active = false
      const y = new VirtualAction(this.sched, this.work)
      this.add(y)
      return y.schedule(x, delay)
    }
    return Subscription.EMPTY
  }
  protected override requestAsyncId(
    x: VirtualTimeScheduler,
    _id?: any,
    delay = 0
  ): any {
    this.delay = x.frame + delay
    const { actions } = x
    actions.push(this)
    ;(actions as Array<VirtualAction<T>>).sort(VirtualAction.sortActions)
    return true
  }
  protected override recycleAsyncId(
    _x: VirtualTimeScheduler,
    _id?: any,
    _delay = 0
  ): any {
    return undefined
  }
  protected override _execute(x: T, delay: number): any {
    if (this.active === true) return super._execute(x, delay)
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

export const animationFrame = animationFrameScheduler

interface AnimationFrameProvider {
  schedule(callback: FrameRequestCallback): Subscription
  requestAnimationFrame: typeof requestAnimationFrame
  cancelAnimationFrame: typeof cancelAnimationFrame
  delegate:
    | {
        requestAnimationFrame: typeof requestAnimationFrame
        cancelAnimationFrame: typeof cancelAnimationFrame
      }
    | undefined
}

export const animationFrameProvider: AnimationFrameProvider = {
  schedule(callback) {
    let request = requestAnimationFrame
    let cancel: typeof cancelAnimationFrame | undefined = cancelAnimationFrame
    const { delegate } = animationFrameProvider
    if (delegate) {
      request = delegate.requestAnimationFrame
      cancel = delegate.cancelAnimationFrame
    }
    const handle = request(timestamp => {
      cancel = undefined
      callback(timestamp)
    })
    return new Subscription(() => cancel?.(handle))
  },
  requestAnimationFrame(...args) {
    const { delegate } = animationFrameProvider
    return (delegate?.requestAnimationFrame || requestAnimationFrame)(...args)
  },
  cancelAnimationFrame(...args) {
    const { delegate } = animationFrameProvider
    return (delegate?.cancelAnimationFrame || cancelAnimationFrame)(...args)
  },
  delegate: undefined,
}
interface DateTimestampProvider extends qt.TimestampProvider {
  delegate: qt.TimestampProvider | undefined
}

const { setImmediate, clearImmediate } = qu.Immediate
type SetImmediateFunction = (handler: () => void, ...xs: any[]) => TimerHandle
type ClearImmediateFunction = (x: TimerHandle) => void

interface ImmediateProvider {
  setImmediate: SetImmediateFunction
  clearImmediate: ClearImmediateFunction
  delegate:
    | {
        setImmediate: SetImmediateFunction
        clearImmediate: ClearImmediateFunction
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

type SetIntervalFunction = (
  handler: () => void,
  timeout?: number,
  ...args: any[]
) => TimerHandle

type ClearIntervalFunction = (x: TimerHandle) => void

interface IntervalProvider {
  setInterval: SetIntervalFunction
  clearInterval: ClearIntervalFunction
  delegate:
    | {
        setInterval: SetIntervalFunction
        clearInterval: ClearIntervalFunction
      }
    | undefined
}

export const intervalProvider: IntervalProvider = {
  setInterval(handler: () => void, timeout?: number, ...xs) {
    const { delegate } = intervalProvider
    if (delegate?.setInterval) {
      return delegate.setInterval(handler, timeout, ...xs)
    }
    return setInterval(handler, timeout, ...xs)
  },
  clearInterval(x) {
    const { delegate } = intervalProvider
    return (delegate?.clearInterval || clearInterval)(x as any)
  },
  delegate: undefined,
}

interface PerformanceTimestampProvider extends qt.TimestampProvider {
  delegate: qt.TimestampProvider | undefined
}

export const performanceTimestampProvider: PerformanceTimestampProvider = {
  now() {
    return (performanceTimestampProvider.delegate || performance).now()
  },
  delegate: undefined,
}
type SetTimeoutFunction = (
  handler: () => void,
  timeout?: number,
  ...args: any[]
) => TimerHandle
type ClearTimeoutFunction = (handle: TimerHandle) => void
interface TimeoutProvider {
  setTimeout: SetTimeoutFunction
  clearTimeout: ClearTimeoutFunction
  delegate:
    | {
        setTimeout: SetTimeoutFunction
        clearTimeout: ClearTimeoutFunction
      }
    | undefined
}

export const timeoutProvider: TimeoutProvider = {
  setTimeout(handler: () => void, timeout?: number, ...xs) {
    const { delegate } = timeoutProvider
    if (delegate?.setTimeout) {
      return delegate.setTimeout(handler, timeout, ...xs)
    }
    return setTimeout(handler, timeout, ...xs)
  },
  clearTimeout(handle) {
    const { delegate } = timeoutProvider
    return (delegate?.clearTimeout || clearTimeout)(handle as any)
  },
  delegate: undefined,
}

export type TimerHandle = number | NodeJS.Timeout
