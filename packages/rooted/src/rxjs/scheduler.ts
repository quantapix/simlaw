import { Action } from "./Action"
import { Action } from "./scheduler/Action"
import { AnimationFrameAction } from "./AnimationFrameAction"
import { animationFrameProvider } from "./animationFrameProvider"
import { AnimationFrameScheduler } from "./AnimationFrameScheduler"
import { arrRemove } from "./util/arrRemove"
import { AsapAction } from "./AsapAction"
import { AsapScheduler } from "./AsapScheduler"
import { AsyncAction } from "./AsyncAction"
import { AsyncScheduler } from "./AsyncScheduler"
import { dateTimestampProvider } from "./scheduler/dateTimestampProvider"
import { Immediate } from "./util/Immediate"
import { immediateProvider } from "./immediateProvider"
import { intervalProvider } from "./intervalProvider"
import { QueueAction } from "./QueueAction"
import { QueueScheduler } from "./QueueScheduler"
import { SchedulerAction } from "./types"
import type * as qt from "./types.js"
import { Subscription } from "./subscription.js"
import { TimestampProvider } from "./types"
import type { TimerHandle } from "./timerHandle"

export class Scheduler implements qt.Scheduler {
  public static now: () => number = dateTimestampProvider.now

  constructor(
    private schedulerActionCtor: typeof Action,
    now: () => number = Scheduler.now
  ) {
    this.now = now
  }

  public now: () => number

  public schedule<T>(
    work: (this: SchedulerAction<T>, state?: T) => void,
    delay: number = 0,
    state?: T
  ): Subscription {
    return new this.schedulerActionCtor<T>(this, work).schedule(state, delay)
  }
}

export class Action<T> extends Subscription {
  constructor(
    scheduler: Scheduler,
    work: (this: SchedulerAction<T>, state?: T) => void
  ) {
    super()
  }
  public schedule(state?: T, delay: number = 0): Subscription {
    return this
  }
}
export class AnimationFrameAction<T> extends AsyncAction<T> {
  constructor(
    protected scheduler: AnimationFrameScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void
  ) {
    super(scheduler, work)
  }
  protected requestAsyncId(
    scheduler: AnimationFrameScheduler,
    id?: any,
    delay: number = 0
  ): any {
    if (delay !== null && delay > 0) {
      return super.requestAsyncId(scheduler, id, delay)
    }

    scheduler.actions.push(this)

    return (
      scheduler._scheduled ||
      (scheduler._scheduled = animationFrameProvider.requestAnimationFrame(() =>
        scheduler.flush(undefined)
      ))
    )
  }
  protected recycleAsyncId(
    scheduler: AnimationFrameScheduler,
    id?: any,
    delay: number = 0
  ): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(scheduler, id, delay)
    }

    if (!scheduler.actions.some(action => action.id === id)) {
      animationFrameProvider.cancelAnimationFrame(id)
      scheduler._scheduled = undefined
    }

    return undefined
  }
}
export class AnimationFrameScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {
    this._active = true

    const flushId = this._scheduled
    this._scheduled = undefined
    const { actions } = this
    let error: any
    action = action || actions.shift()!
    do {
      if ((error = action.execute(action.state, action.delay))) {
        break
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift())
    this._active = false
    if (error) {
      while (
        (action = actions[0]) &&
        action.id === flushId &&
        actions.shift()
      ) {
        action.unsubscribe()
      }
      throw error
    }
  }
}
export class AsapAction<T> extends AsyncAction<T> {
  constructor(
    protected scheduler: AsapScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void
  ) {
    super(scheduler, work)
  }
  protected requestAsyncId(
    scheduler: AsapScheduler,
    id?: any,
    delay: number = 0
  ): any {
    if (delay !== null && delay > 0) {
      return super.requestAsyncId(scheduler, id, delay)
    }

    scheduler.actions.push(this)

    return (
      scheduler._scheduled ||
      (scheduler._scheduled = immediateProvider.setImmediate(
        scheduler.flush.bind(scheduler, undefined)
      ))
    )
  }
  protected recycleAsyncId(
    scheduler: AsapScheduler,
    id?: any,
    delay: number = 0
  ): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(scheduler, id, delay)
    }

    if (!scheduler.actions.some(action => action.id === id)) {
      immediateProvider.clearImmediate(id)
      scheduler._scheduled = undefined
    }

    return undefined
  }
}
export class AsapScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {
    this._active = true

    const flushId = this._scheduled
    this._scheduled = undefined
    const { actions } = this
    let error: any
    action = action || actions.shift()!
    do {
      if ((error = action.execute(action.state, action.delay))) {
        break
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift())
    this._active = false
    if (error) {
      while (
        (action = actions[0]) &&
        action.id === flushId &&
        actions.shift()
      ) {
        action.unsubscribe()
      }
      throw error
    }
  }
}
export class AsyncAction<T> extends Action<T> {
  public id: any
  public state?: T

  public delay: number
  protected pending: boolean = false
  constructor(
    protected scheduler: AsyncScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void
  ) {
    super(scheduler, work)
  }
  public schedule(state?: T, delay: number = 0): Subscription {
    if (this.closed) {
      return this
    }
    this.state = state
    const id = this.id
    const scheduler = this.scheduler
    if (id != null) {
      this.id = this.recycleAsyncId(scheduler, id, delay)
    }

    this.pending = true
    this.delay = delay

    this.id = this.id || this.requestAsyncId(scheduler, this.id, delay)
    return this
  }
  protected requestAsyncId(
    scheduler: AsyncScheduler,
    _id?: any,
    delay: number = 0
  ): any {
    return intervalProvider.setInterval(
      scheduler.flush.bind(scheduler, this),
      delay
    )
  }
  protected recycleAsyncId(
    _scheduler: AsyncScheduler,
    id: any,
    delay: number | null = 0
  ): any {
    if (delay != null && this.delay === delay && this.pending === false) {
      return id
    }

    intervalProvider.clearInterval(id)
    return undefined
  }
  public execute(state: T, delay: number): any {
    if (this.closed) {
      return new Error("executing a cancelled action")
    }
    this.pending = false
    const error = this._execute(state, delay)
    if (error) {
      return error
    } else if (this.pending === false && this.id != null) {
      this.id = this.recycleAsyncId(this.scheduler, this.id, null)
    }
  }
  protected _execute(state: T, _delay: number): any {
    let errored: boolean = false
    let errorValue: any
    try {
      this.work(state)
    } catch (e) {
      errored = true

      errorValue = e ? e : new Error("Scheduled action threw falsy error")
    }
    if (errored) {
      this.unsubscribe()
      return errorValue
    }
  }
  unsubscribe() {
    if (!this.closed) {
      const { id, scheduler } = this
      const { actions } = scheduler
      this.work = this.state = this.scheduler = null!
      this.pending = false
      arrRemove(actions, this)
      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, null)
      }
      this.delay = null!
      super.unsubscribe()
    }
  }
}
export class AsyncScheduler extends Scheduler {
  public actions: Array<AsyncAction<any>> = []
  public _active: boolean = false
  public _scheduled: any = undefined
  constructor(
    SchedulerAction: typeof Action,
    now: () => number = Scheduler.now
  ) {
    super(SchedulerAction, now)
  }
  public flush(action: AsyncAction<any>): void {
    const { actions } = this
    if (this._active) {
      actions.push(action)
      return
    }
    let error: any
    this._active = true
    do {
      if ((error = action.execute(action.state, action.delay))) {
        break
      }
    } while ((action = actions.shift()!))
    this._active = false
    if (error) {
      while ((action = actions.shift()!)) {
        action.unsubscribe()
      }
      throw error
    }
  }
}

/*
export class QueueAction<T> extends AsyncAction<T> {
  constructor(    protected scheduler: QueueScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void
  ) {
    super(scheduler, work)
  }  
  public schedule(state?: T, delay: number = 0): Subscription {
    if (delay > 0) {
      return super.schedule(state, delay)
    }
    this.delay = delay
    this.state = state
    this.scheduler.flush(this)
    return this
  }  
  public execute(state: T, delay: number): any {
    return delay > 0 || this.closed
      ? super.execute(state, delay)
      : this._execute(state, delay)
  } 
   protected requestAsyncId(
    scheduler: QueueScheduler,
    id?: any,
    delay: number = 0
  ): any {



      return super.requestAsyncId(scheduler, id, delay)
    }
    return scheduler.flush(this)
  }
}
*/
export class QueueScheduler extends AsyncScheduler {}

export class VirtualTimeScheduler extends AsyncScheduler {
  static frameTimeFactor = 10
  public frame: number = 0
  public index: number = -1
  constructor(
    schedulerActionCtor: typeof AsyncAction = VirtualAction as any,
    public maxFrames: number = Infinity
  ) {
    super(schedulerActionCtor, () => this.frame)
  }
  public flush(): void {
    const { actions, maxFrames } = this
    let error: any
    let action: AsyncAction<any> | undefined
    while ((action = actions[0]) && action.delay <= maxFrames) {
      actions.shift()
      this.frame = action.delay
      if ((error = action.execute(action.state, action.delay))) {
        break
      }
    }
    if (error) {
      while ((action = actions.shift())) {
        action.unsubscribe()
      }
      throw error
    }
  }
}
export class VirtualAction<T> extends AsyncAction<T> {
  protected active: boolean = true
  constructor(
    protected scheduler: VirtualTimeScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void,
    protected index: number = (scheduler.index += 1)
  ) {
    super(scheduler, work)
    this.index = scheduler.index = index
  }
  public schedule(state?: T, delay: number = 0): Subscription {
    if (Number.isFinite(delay)) {
      if (!this.id) {
        return super.schedule(state, delay)
      }
      this.active = false

      const action = new VirtualAction(this.scheduler, this.work)
      this.add(action)
      return action.schedule(state, delay)
    } else {
      return Subscription.EMPTY
    }
  }
  protected requestAsyncId(
    scheduler: VirtualTimeScheduler,
    id?: any,
    delay: number = 0
  ): any {
    this.delay = scheduler.frame + delay
    const { actions } = scheduler
    actions.push(this)
    ;(actions as Array<VirtualAction<T>>).sort(VirtualAction.sortActions)
    return true
  }
  protected recycleAsyncId(
    scheduler: VirtualTimeScheduler,
    id?: any,
    delay: number = 0
  ): any {
    return undefined
  }
  protected _execute(state: T, delay: number): any {
    if (this.active === true) {
      return super._execute(state, delay)
    }
  }
  private static sortActions<T>(a: VirtualAction<T>, b: VirtualAction<T>) {
    if (a.delay === b.delay) {
      if (a.index === b.index) {
        return 0
      } else if (a.index > b.index) {
        return 1
      } else {
        return -1
      }
    } else if (a.delay > b.delay) {
      return 1
    } else {
      return -1
    }
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
interface DateTimestampProvider extends TimestampProvider {
  delegate: TimestampProvider | undefined
}
export const dateTimestampProvider: DateTimestampProvider = {
  now() {
    return (dateTimestampProvider.delegate || Date).now()
  },
  delegate: undefined,
}
const { setImmediate, clearImmediate } = Immediate
type SetImmediateFunction = (handler: () => void, ...args: any[]) => TimerHandle
type ClearImmediateFunction = (handle: TimerHandle) => void
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
  setImmediate(...args) {
    const { delegate } = immediateProvider
    return (delegate?.setImmediate || setImmediate)(...args)
  },
  clearImmediate(handle) {
    const { delegate } = immediateProvider
    return (delegate?.clearImmediate || clearImmediate)(handle as any)
  },
  delegate: undefined,
}
type SetIntervalFunction = (
  handler: () => void,
  timeout?: number,
  ...args: any[]
) => TimerHandle
type ClearIntervalFunction = (handle: TimerHandle) => void
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
  setInterval(handler: () => void, timeout?: number, ...args) {
    const { delegate } = intervalProvider
    if (delegate?.setInterval) {
      return delegate.setInterval(handler, timeout, ...args)
    }
    return setInterval(handler, timeout, ...args)
  },
  clearInterval(handle) {
    const { delegate } = intervalProvider
    return (delegate?.clearInterval || clearInterval)(handle as any)
  },
  delegate: undefined,
}
interface PerformanceTimestampProvider extends TimestampProvider {
  delegate: TimestampProvider | undefined
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
  setTimeout(handler: () => void, timeout?: number, ...args) {
    const { delegate } = timeoutProvider
    if (delegate?.setTimeout) {
      return delegate.setTimeout(handler, timeout, ...args)
    }
    return setTimeout(handler, timeout, ...args)
  },
  clearTimeout(handle) {
    const { delegate } = timeoutProvider
    return (delegate?.clearTimeout || clearTimeout)(handle as any)
  },
  delegate: undefined,
}
export type TimerHandle = number | NodeJS.Timeout
