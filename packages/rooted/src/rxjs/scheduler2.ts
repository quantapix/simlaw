import { Scheduler } from '../Scheduler';
import { Subscription } from '../Subscription';
import { SchedulerAction } from '../types';

/**
 * A unit of work to be executed in a `scheduler`. An action is typically
 * created from within a {@link SchedulerLike} and an RxJS user does not need to concern
 * themselves about creating and manipulating an Action.
 *
 * ```ts
 * class Action<T> extends Subscription {
 *   new (scheduler: Scheduler, work: (state?: T) => void);
 *   schedule(state?: T, delay: number = 0): Subscription;
 * }
 * ```
 *
 * @class Action<T>
 */
export class Action<T> extends Subscription {
  constructor(scheduler: Scheduler, work: (this: SchedulerAction<T>, state?: T) => void) {
    super();
  }
  /**
   * Schedules this action on its parent {@link SchedulerLike} for execution. May be passed
   * some context object, `state`. May happen at some point in the future,
   * according to the `delay` parameter, if specified.
   * @param {T} [state] Some contextual data that the `work` function uses when
   * called by the Scheduler.
   * @param {number} [delay] Time to wait before executing the work, where the
   * time unit is implicit and defined by the Scheduler.
   * @return {void}
   */
  public schedule(state?: T, delay: number = 0): Subscription {
    return this;
  }
}
import { AsyncAction } from './AsyncAction';
import { AnimationFrameScheduler } from './AnimationFrameScheduler';
import { SchedulerAction } from '../types';
import { animationFrameProvider } from './animationFrameProvider';

export class AnimationFrameAction<T> extends AsyncAction<T> {
  constructor(protected scheduler: AnimationFrameScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  protected requestAsyncId(scheduler: AnimationFrameScheduler, id?: any, delay: number = 0): any {
    // If delay is greater than 0, request as an async action.
    if (delay !== null && delay > 0) {
      return super.requestAsyncId(scheduler, id, delay);
    }
    // Push the action to the end of the scheduler queue.
    scheduler.actions.push(this);
    // If an animation frame has already been requested, don't request another
    // one. If an animation frame hasn't been requested yet, request one. Return
    // the current animation frame request id.
    return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider.requestAnimationFrame(() => scheduler.flush(undefined)));
  }
  protected recycleAsyncId(scheduler: AnimationFrameScheduler, id?: any, delay: number = 0): any {
    // If delay exists and is greater than 0, or if the delay is null (the
    // action wasn't rescheduled) but was originally scheduled as an async
    // action, then recycle as an async action.
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(scheduler, id, delay);
    }
    // If the scheduler queue has no remaining actions with the same async id,
    // cancel the requested animation frame and set the scheduled flag to
    // undefined so the next AnimationFrameAction will request its own.
    if (!scheduler.actions.some((action) => action.id === id)) {
      animationFrameProvider.cancelAnimationFrame(id);
      scheduler._scheduled = undefined;
    }
    // Return undefined so the action knows to request a new async id if it's rescheduled.
    return undefined;
  }
}
import { AsyncAction } from './AsyncAction';
import { AsyncScheduler } from './AsyncScheduler';

export class AnimationFrameScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {
    this._active = true;
    // The async id that effects a call to flush is stored in _scheduled.
    // Before executing an action, it's necessary to check the action's async
    // id to determine whether it's supposed to be executed in the current
    // flush.
    // Previous implementations of this method used a count to determine this,
    // but that was unsound, as actions that are unsubscribed - i.e. cancelled -
    // are removed from the actions array and that can shift actions that are
    // scheduled to be executed in a subsequent flush into positions at which
    // they are executed within the current flush.
    const flushId = this._scheduled;
    this._scheduled = undefined;

    const { actions } = this;
    let error: any;
    action = action || actions.shift()!;

    do {
      if ((error = action.execute(action.state, action.delay))) {
        break;
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift());

    this._active = false;

    if (error) {
      while ((action = actions[0]) && action.id === flushId && actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}
import { AsyncAction } from './AsyncAction';
import { AsapScheduler } from './AsapScheduler';
import { SchedulerAction } from '../types';
import { immediateProvider } from './immediateProvider';

export class AsapAction<T> extends AsyncAction<T> {
  constructor(protected scheduler: AsapScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  protected requestAsyncId(scheduler: AsapScheduler, id?: any, delay: number = 0): any {
    // If delay is greater than 0, request as an async action.
    if (delay !== null && delay > 0) {
      return super.requestAsyncId(scheduler, id, delay);
    }
    // Push the action to the end of the scheduler queue.
    scheduler.actions.push(this);
    // If a microtask has already been scheduled, don't schedule another
    // one. If a microtask hasn't been scheduled yet, schedule one now. Return
    // the current scheduled microtask id.
    return scheduler._scheduled || (scheduler._scheduled = immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
  }
  protected recycleAsyncId(scheduler: AsapScheduler, id?: any, delay: number = 0): any {
    // If delay exists and is greater than 0, or if the delay is null (the
    // action wasn't rescheduled) but was originally scheduled as an async
    // action, then recycle as an async action.
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.recycleAsyncId(scheduler, id, delay);
    }
    // If the scheduler queue has no remaining actions with the same async id,
    // cancel the requested microtask and set the scheduled flag to undefined
    // so the next AsapAction will request its own.
    if (!scheduler.actions.some((action) => action.id === id)) {
      immediateProvider.clearImmediate(id);
      scheduler._scheduled = undefined;
    }
    // Return undefined so the action knows to request a new async id if it's rescheduled.
    return undefined;
  }
}
import { AsyncAction } from './AsyncAction';
import { AsyncScheduler } from './AsyncScheduler';

export class AsapScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {
    this._active = true;
    // The async id that effects a call to flush is stored in _scheduled.
    // Before executing an action, it's necessary to check the action's async
    // id to determine whether it's supposed to be executed in the current
    // flush.
    // Previous implementations of this method used a count to determine this,
    // but that was unsound, as actions that are unsubscribed - i.e. cancelled -
    // are removed from the actions array and that can shift actions that are
    // scheduled to be executed in a subsequent flush into positions at which
    // they are executed within the current flush.
    const flushId = this._scheduled;
    this._scheduled = undefined;

    const { actions } = this;
    let error: any;
    action = action || actions.shift()!;

    do {
      if ((error = action.execute(action.state, action.delay))) {
        break;
      }
    } while ((action = actions[0]) && action.id === flushId && actions.shift());

    this._active = false;

    if (error) {
      while ((action = actions[0]) && action.id === flushId && actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}
import { Action } from './Action';
import { SchedulerAction } from '../types';
import { Subscription } from '../Subscription';
import { AsyncScheduler } from './AsyncScheduler';
import { intervalProvider } from './intervalProvider';
import { arrRemove } from '../util/arrRemove';

export class AsyncAction<T> extends Action<T> {
  public id: any;
  public state?: T;
  // @ts-ignore: Property has no initializer and is not definitely assigned
  public delay: number;
  protected pending: boolean = false;

  constructor(protected scheduler: AsyncScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  public schedule(state?: T, delay: number = 0): Subscription {
    if (this.closed) {
      return this;
    }

    // Always replace the current state with the new state.
    this.state = state;

    const id = this.id;
    const scheduler = this.scheduler;

    //
    // Important implementation note:
    //
    // Actions only execute once by default, unless rescheduled from within the
    // scheduled callback. This allows us to implement single and repeat
    // actions via the same code path, without adding API surface area, as well
    // as mimic traditional recursion but across asynchronous boundaries.
    //
    // However, JS runtimes and timers distinguish between intervals achieved by
    // serial `setTimeout` calls vs. a single `setInterval` call. An interval of
    // serial `setTimeout` calls can be individually delayed, which delays
    // scheduling the next `setTimeout`, and so on. `setInterval` attempts to
    // guarantee the interval callback will be invoked more precisely to the
    // interval period, regardless of load.
    //
    // Therefore, we use `setInterval` to schedule single and repeat actions.
    // If the action reschedules itself with the same delay, the interval is not
    // canceled. If the action doesn't reschedule, or reschedules with a
    // different delay, the interval will be canceled after scheduled callback
    // execution.
    //
    if (id != null) {
      this.id = this.recycleAsyncId(scheduler, id, delay);
    }

    // Set the pending flag indicating that this action has been scheduled, or
    // has recursively rescheduled itself.
    this.pending = true;

    this.delay = delay;
    // If this action has already an async Id, don't request a new one.
    this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);

    return this;
  }

  protected requestAsyncId(scheduler: AsyncScheduler, _id?: any, delay: number = 0): any {
    return intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
  }

  protected recycleAsyncId(_scheduler: AsyncScheduler, id: any, delay: number | null = 0): any {
    // If this action is rescheduled with the same delay time, don't clear the interval id.
    if (delay != null && this.delay === delay && this.pending === false) {
      return id;
    }
    // Otherwise, if the action's delay time is different from the current delay,
    // or the action has been rescheduled before it's executed, clear the interval id
    intervalProvider.clearInterval(id);
    return undefined;
  }

  /**
   * Immediately executes this action and the `work` it contains.
   * @return {any}
   */
  public execute(state: T, delay: number): any {
    if (this.closed) {
      return new Error('executing a cancelled action');
    }

    this.pending = false;
    const error = this._execute(state, delay);
    if (error) {
      return error;
    } else if (this.pending === false && this.id != null) {
      // Dequeue if the action didn't reschedule itself. Don't call
      // unsubscribe(), because the action could reschedule later.
      // For example:
      // ```
      // scheduler.schedule(function doWork(counter) {
      //   /* ... I'm a busy worker bee ... */
      //   var originalAction = this;
      //   /* wait 100ms before rescheduling the action */
      //   setTimeout(function () {
      //     originalAction.schedule(counter + 1);
      //   }, 100);
      // }, 1000);
      // ```
      this.id = this.recycleAsyncId(this.scheduler, this.id, null);
    }
  }

  protected _execute(state: T, _delay: number): any {
    let errored: boolean = false;
    let errorValue: any;
    try {
      this.work(state);
    } catch (e) {
      errored = true;
      // HACK: Since code elsewhere is relying on the "truthiness" of the
      // return here, we can't have it return "" or 0 or false.
      // TODO: Clean this up when we refactor schedulers mid-version-8 or so.
      errorValue = e ? e : new Error('Scheduled action threw falsy error');
    }
    if (errored) {
      this.unsubscribe();
      return errorValue;
    }
  }

  unsubscribe() {
    if (!this.closed) {
      const { id, scheduler } = this;
      const { actions } = scheduler;

      this.work = this.state = this.scheduler = null!;
      this.pending = false;

      arrRemove(actions, this);
      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, null);
      }

      this.delay = null!;
      super.unsubscribe();
    }
  }
}
import { Scheduler } from '../Scheduler';
import { Action } from './Action';
import { AsyncAction } from './AsyncAction';

export class AsyncScheduler extends Scheduler {
  public actions: Array<AsyncAction<any>> = [];
  /**
   * A flag to indicate whether the Scheduler is currently executing a batch of
   * queued actions.
   * @type {boolean}
   * @internal
   */
  public _active: boolean = false;
  /**
   * An internal ID used to track the latest asynchronous task such as those
   * coming from `setTimeout`, `setInterval`, `requestAnimationFrame`, and
   * others.
   * @type {any}
   * @internal
   */
  public _scheduled: any = undefined;

  constructor(SchedulerAction: typeof Action, now: () => number = Scheduler.now) {
    super(SchedulerAction, now);
  }

  public flush(action: AsyncAction<any>): void {
    const { actions } = this;

    if (this._active) {
      actions.push(action);
      return;
    }

    let error: any;
    this._active = true;

    do {
      if ((error = action.execute(action.state, action.delay))) {
        break;
      }
    } while ((action = actions.shift()!)); // exhaust the scheduler queue

    this._active = false;

    if (error) {
      while ((action = actions.shift()!)) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}
import { AsyncAction } from './AsyncAction';
import { Subscription } from '../Subscription';
import { QueueScheduler } from './QueueScheduler';
import { SchedulerAction } from '../types';

export class QueueAction<T> extends AsyncAction<T> {

  constructor(protected scheduler: QueueScheduler,
              protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  public schedule(state?: T, delay: number = 0): Subscription {
    if (delay > 0) {
      return super.schedule(state, delay);
    }
    this.delay = delay;
    this.state = state;
    this.scheduler.flush(this);
    return this;
  }

  public execute(state: T, delay: number): any {
    return (delay > 0 || this.closed) ?
      super.execute(state, delay) :
      this._execute(state, delay) ;
  }

  protected requestAsyncId(scheduler: QueueScheduler, id?: any, delay: number = 0): any {
    // If delay exists and is greater than 0, or if the delay is null (the
    // action wasn't rescheduled) but was originally scheduled as an async
    // action, then recycle as an async action.

    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.requestAsyncId(scheduler, id, delay);
    }
    // Otherwise flush the scheduler starting with this action.
    return scheduler.flush(this);
  }
}
import { AsyncScheduler } from './AsyncScheduler';

export class QueueScheduler extends AsyncScheduler {
}
import { AsyncAction } from './AsyncAction';
import { Subscription } from '../Subscription';
import { AsyncScheduler } from './AsyncScheduler';
import { SchedulerAction } from '../types';

export class VirtualTimeScheduler extends AsyncScheduler {
  /** @deprecated Not used in VirtualTimeScheduler directly. Will be removed in v8. */
  static frameTimeFactor = 10;

  /**
   * The current frame for the state of the virtual scheduler instance. The the difference
   * between two "frames" is synonymous with the passage of "virtual time units". So if
   * you record `scheduler.frame` to be `1`, then later, observe `scheduler.frame` to be at `11`,
   * that means `10` virtual time units have passed.
   */
  public frame: number = 0;

  /**
   * Used internally to examine the current virtual action index being processed.
   * @deprecated Internal implementation detail, do not use directly. Will be made internal in v8.
   */
  public index: number = -1;

  /**
   * This creates an instance of a `VirtualTimeScheduler`. Experts only. The signature of
   * this constructor is likely to change in the long run.
   *
   * @param schedulerActionCtor The type of Action to initialize when initializing actions during scheduling.
   * @param maxFrames The maximum number of frames to process before stopping. Used to prevent endless flush cycles.
   */
  constructor(schedulerActionCtor: typeof AsyncAction = VirtualAction as any, public maxFrames: number = Infinity) {
    super(schedulerActionCtor, () => this.frame);
  }

  /**
   * Prompt the Scheduler to execute all of its queued actions, therefore
   * clearing its queue.
   * @return {void}
   */
  public flush(): void {
    const { actions, maxFrames } = this;
    let error: any;
    let action: AsyncAction<any> | undefined;

    while ((action = actions[0]) && action.delay <= maxFrames) {
      actions.shift();
      this.frame = action.delay;

      if ((error = action.execute(action.state, action.delay))) {
        break;
      }
    }

    if (error) {
      while ((action = actions.shift())) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}

export class VirtualAction<T> extends AsyncAction<T> {
  protected active: boolean = true;

  constructor(
    protected scheduler: VirtualTimeScheduler,
    protected work: (this: SchedulerAction<T>, state?: T) => void,
    protected index: number = (scheduler.index += 1)
  ) {
    super(scheduler, work);
    this.index = scheduler.index = index;
  }

  public schedule(state?: T, delay: number = 0): Subscription {
    if (Number.isFinite(delay)) {
      if (!this.id) {
        return super.schedule(state, delay);
      }
      this.active = false;
      // If an action is rescheduled, we save allocations by mutating its state,
      // pushing it to the end of the scheduler queue, and recycling the action.
      // But since the VirtualTimeScheduler is used for testing, VirtualActions
      // must be immutable so they can be inspected later.
      const action = new VirtualAction(this.scheduler, this.work);
      this.add(action);
      return action.schedule(state, delay);
    } else {
      // If someone schedules something with Infinity, it'll never happen. So we
      // don't even schedule it.
      return Subscription.EMPTY;
    }
  }

  protected requestAsyncId(scheduler: VirtualTimeScheduler, id?: any, delay: number = 0): any {
    this.delay = scheduler.frame + delay;
    const { actions } = scheduler;
    actions.push(this);
    (actions as Array<VirtualAction<T>>).sort(VirtualAction.sortActions);
    return true;
  }

  protected recycleAsyncId(scheduler: VirtualTimeScheduler, id?: any, delay: number = 0): any {
    return undefined;
  }

  protected _execute(state: T, delay: number): any {
    if (this.active === true) {
      return super._execute(state, delay);
    }
  }

  private static sortActions<T>(a: VirtualAction<T>, b: VirtualAction<T>) {
    if (a.delay === b.delay) {
      if (a.index === b.index) {
        return 0;
      } else if (a.index > b.index) {
        return 1;
      } else {
        return -1;
      }
    } else if (a.delay > b.delay) {
      return 1;
    } else {
      return -1;
    }
  }
}
import { AnimationFrameAction } from './AnimationFrameAction';
import { AnimationFrameScheduler } from './AnimationFrameScheduler';

/**
 *
 * Animation Frame Scheduler
 *
 * <span class="informal">Perform task when `window.requestAnimationFrame` would fire</span>
 *
 * When `animationFrame` scheduler is used with delay, it will fall back to {@link asyncScheduler} scheduler
 * behaviour.
 *
 * Without delay, `animationFrame` scheduler can be used to create smooth browser animations.
 * It makes sure scheduled task will happen just before next browser content repaint,
 * thus performing animations as efficiently as possible.
 *
 * ## Example
 * Schedule div height animation
 * ```ts
 * // html: <div style="background: #0ff;"></div>
 * import { animationFrameScheduler } from 'rxjs';
 *
 * const div = document.querySelector('div');
 *
 * animationFrameScheduler.schedule(function(height) {
 *   div.style.height = height + "px";
 *
 *   this.schedule(height + 1);  // `this` references currently executing Action,
 *                               // which we reschedule with new state
 * }, 0, 0);
 *
 * // You will see a div element growing in height
 * ```
 */

export const animationFrameScheduler = new AnimationFrameScheduler(AnimationFrameAction);

/**
 * @deprecated Renamed to {@link animationFrameScheduler}. Will be removed in v8.
 */
export const animationFrame = animationFrameScheduler;
import { Subscription } from '../Subscription';

interface AnimationFrameProvider {
  schedule(callback: FrameRequestCallback): Subscription;
  requestAnimationFrame: typeof requestAnimationFrame;
  cancelAnimationFrame: typeof cancelAnimationFrame;
  delegate:
    | {
        requestAnimationFrame: typeof requestAnimationFrame;
        cancelAnimationFrame: typeof cancelAnimationFrame;
      }
    | undefined;
}

export const animationFrameProvider: AnimationFrameProvider = {
  // When accessing the delegate, use the variable rather than `this` so that
  // the functions can be called without being bound to the provider.
  schedule(callback) {
    let request = requestAnimationFrame;
    let cancel: typeof cancelAnimationFrame | undefined = cancelAnimationFrame;
    const { delegate } = animationFrameProvider;
    if (delegate) {
      request = delegate.requestAnimationFrame;
      cancel = delegate.cancelAnimationFrame;
    }
    const handle = request((timestamp) => {
      // Clear the cancel function. The request has been fulfilled, so
      // attempting to cancel the request upon unsubscription would be
      // pointless.
      cancel = undefined;
      callback(timestamp);
    });
    return new Subscription(() => cancel?.(handle));
  },
  requestAnimationFrame(...args) {
    const { delegate } = animationFrameProvider;
    return (delegate?.requestAnimationFrame || requestAnimationFrame)(...args);
  },
  cancelAnimationFrame(...args) {
    const { delegate } = animationFrameProvider;
    return (delegate?.cancelAnimationFrame || cancelAnimationFrame)(...args);
  },
  delegate: undefined,
};
import { AsapAction } from './AsapAction';
import { AsapScheduler } from './AsapScheduler';

/**
 *
 * Asap Scheduler
 *
 * <span class="informal">Perform task as fast as it can be performed asynchronously</span>
 *
 * `asap` scheduler behaves the same as {@link asyncScheduler} scheduler when you use it to delay task
 * in time. If however you set delay to `0`, `asap` will wait for current synchronously executing
 * code to end and then it will try to execute given task as fast as possible.
 *
 * `asap` scheduler will do its best to minimize time between end of currently executing code
 * and start of scheduled task. This makes it best candidate for performing so called "deferring".
 * Traditionally this was achieved by calling `setTimeout(deferredTask, 0)`, but that technique involves
 * some (although minimal) unwanted delay.
 *
 * Note that using `asap` scheduler does not necessarily mean that your task will be first to process
 * after currently executing code. In particular, if some task was also scheduled with `asap` before,
 * that task will execute first. That being said, if you need to schedule task asynchronously, but
 * as soon as possible, `asap` scheduler is your best bet.
 *
 * ## Example
 * Compare async and asap scheduler<
 * ```ts
 * import { asapScheduler, asyncScheduler } from 'rxjs';
 *
 * asyncScheduler.schedule(() => console.log('async')); // scheduling 'async' first...
 * asapScheduler.schedule(() => console.log('asap'));
 *
 * // Logs:
 * // "asap"
 * // "async"
 * // ... but 'asap' goes first!
 * ```
 */

export const asapScheduler = new AsapScheduler(AsapAction);

/**
 * @deprecated Renamed to {@link asapScheduler}. Will be removed in v8.
 */
export const asap = asapScheduler;
import { AsyncAction } from './AsyncAction';
import { AsyncScheduler } from './AsyncScheduler';

/**
 *
 * Async Scheduler
 *
 * <span class="informal">Schedule task as if you used setTimeout(task, duration)</span>
 *
 * `async` scheduler schedules tasks asynchronously, by putting them on the JavaScript
 * event loop queue. It is best used to delay tasks in time or to schedule tasks repeating
 * in intervals.
 *
 * If you just want to "defer" task, that is to perform it right after currently
 * executing synchronous code ends (commonly achieved by `setTimeout(deferredTask, 0)`),
 * better choice will be the {@link asapScheduler} scheduler.
 *
 * ## Examples
 * Use async scheduler to delay task
 * ```ts
 * import { asyncScheduler } from 'rxjs';
 *
 * const task = () => console.log('it works!');
 *
 * asyncScheduler.schedule(task, 2000);
 *
 * // After 2 seconds logs:
 * // "it works!"
 * ```
 *
 * Use async scheduler to repeat task in intervals
 * ```ts
 * import { asyncScheduler } from 'rxjs';
 *
 * function task(state) {
 *   console.log(state);
 *   this.schedule(state + 1, 1000); // `this` references currently executing Action,
 *                                   // which we reschedule with new state and delay
 * }
 *
 * asyncScheduler.schedule(task, 3000, 0);
 *
 * // Logs:
 * // 0 after 3s
 * // 1 after 4s
 * // 2 after 5s
 * // 3 after 6s
 * ```
 */

export const asyncScheduler = new AsyncScheduler(AsyncAction);

/**
 * @deprecated Renamed to {@link asyncScheduler}. Will be removed in v8.
 */
export const async = asyncScheduler;
import { TimestampProvider } from '../types';

interface DateTimestampProvider extends TimestampProvider {
  delegate: TimestampProvider | undefined;
}

export const dateTimestampProvider: DateTimestampProvider = {
  now() {
    // Use the variable rather than `this` so that the function can be called
    // without being bound to the provider.
    return (dateTimestampProvider.delegate || Date).now();
  },
  delegate: undefined,
};
import { Immediate } from '../util/Immediate';
import type { TimerHandle } from './timerHandle';
const { setImmediate, clearImmediate } = Immediate;

type SetImmediateFunction = (handler: () => void, ...args: any[]) => TimerHandle;
type ClearImmediateFunction = (handle: TimerHandle) => void;

interface ImmediateProvider {
  setImmediate: SetImmediateFunction;
  clearImmediate: ClearImmediateFunction;
  delegate:
    | {
        setImmediate: SetImmediateFunction;
        clearImmediate: ClearImmediateFunction;
      }
    | undefined;
}

export const immediateProvider: ImmediateProvider = {
  // When accessing the delegate, use the variable rather than `this` so that
  // the functions can be called without being bound to the provider.
  setImmediate(...args) {
    const { delegate } = immediateProvider;
    return (delegate?.setImmediate || setImmediate)(...args);
  },
  clearImmediate(handle) {
    const { delegate } = immediateProvider;
    return (delegate?.clearImmediate || clearImmediate)(handle as any);
  },
  delegate: undefined,
};
import type { TimerHandle } from './timerHandle';
type SetIntervalFunction = (handler: () => void, timeout?: number, ...args: any[]) => TimerHandle;
type ClearIntervalFunction = (handle: TimerHandle) => void;

interface IntervalProvider {
  setInterval: SetIntervalFunction;
  clearInterval: ClearIntervalFunction;
  delegate:
    | {
        setInterval: SetIntervalFunction;
        clearInterval: ClearIntervalFunction;
      }
    | undefined;
}

export const intervalProvider: IntervalProvider = {
  // When accessing the delegate, use the variable rather than `this` so that
  // the functions can be called without being bound to the provider.
  setInterval(handler: () => void, timeout?: number, ...args) {
    const { delegate } = intervalProvider;
    if (delegate?.setInterval) {
      return delegate.setInterval(handler, timeout, ...args);
    }
    return setInterval(handler, timeout, ...args);
  },
  clearInterval(handle) {
    const { delegate } = intervalProvider;
    return (delegate?.clearInterval || clearInterval)(handle as any);
  },
  delegate: undefined,
};
import { TimestampProvider } from '../types';

interface PerformanceTimestampProvider extends TimestampProvider {
  delegate: TimestampProvider | undefined;
}

export const performanceTimestampProvider: PerformanceTimestampProvider = {
  now() {
    // Use the variable rather than `this` so that the function can be called
    // without being bound to the provider.
    return (performanceTimestampProvider.delegate || performance).now();
  },
  delegate: undefined,
};
import { QueueAction } from './QueueAction';
import { QueueScheduler } from './QueueScheduler';

/**
 *
 * Queue Scheduler
 *
 * <span class="informal">Put every next task on a queue, instead of executing it immediately</span>
 *
 * `queue` scheduler, when used with delay, behaves the same as {@link asyncScheduler} scheduler.
 *
 * When used without delay, it schedules given task synchronously - executes it right when
 * it is scheduled. However when called recursively, that is when inside the scheduled task,
 * another task is scheduled with queue scheduler, instead of executing immediately as well,
 * that task will be put on a queue and wait for current one to finish.
 *
 * This means that when you execute task with `queue` scheduler, you are sure it will end
 * before any other task scheduled with that scheduler will start.
 *
 * ## Examples
 * Schedule recursively first, then do something
 * ```ts
 * import { queueScheduler } from 'rxjs';
 *
 * queueScheduler.schedule(() => {
 *   queueScheduler.schedule(() => console.log('second')); // will not happen now, but will be put on a queue
 *
 *   console.log('first');
 * });
 *
 * // Logs:
 * // "first"
 * // "second"
 * ```
 *
 * Reschedule itself recursively
 * ```ts
 * import { queueScheduler } from 'rxjs';
 *
 * queueScheduler.schedule(function(state) {
 *   if (state !== 0) {
 *     console.log('before', state);
 *     this.schedule(state - 1); // `this` references currently executing Action,
 *                               // which we reschedule with new state
 *     console.log('after', state);
 *   }
 * }, 0, 3);
 *
 * // In scheduler that runs recursively, you would expect:
 * // "before", 3
 * // "before", 2
 * // "before", 1
 * // "after", 1
 * // "after", 2
 * // "after", 3
 *
 * // But with queue it logs:
 * // "before", 3
 * // "after", 3
 * // "before", 2
 * // "after", 2
 * // "before", 1
 * // "after", 1
 * ```
 */

export const queueScheduler = new QueueScheduler(QueueAction);

/**
 * @deprecated Renamed to {@link queueScheduler}. Will be removed in v8.
 */
export const queue = queueScheduler;
import type { TimerHandle } from './timerHandle';
type SetTimeoutFunction = (handler: () => void, timeout?: number, ...args: any[]) => TimerHandle;
type ClearTimeoutFunction = (handle: TimerHandle) => void;

interface TimeoutProvider {
  setTimeout: SetTimeoutFunction;
  clearTimeout: ClearTimeoutFunction;
  delegate:
    | {
        setTimeout: SetTimeoutFunction;
        clearTimeout: ClearTimeoutFunction;
      }
    | undefined;
}

export const timeoutProvider: TimeoutProvider = {
  // When accessing the delegate, use the variable rather than `this` so that
  // the functions can be called without being bound to the provider.
  setTimeout(handler: () => void, timeout?: number, ...args) {
    const { delegate } = timeoutProvider;
    if (delegate?.setTimeout) {
      return delegate.setTimeout(handler, timeout, ...args);
    }
    return setTimeout(handler, timeout, ...args);
  },
  clearTimeout(handle) {
    const { delegate } = timeoutProvider;
    return (delegate?.clearTimeout || clearTimeout)(handle as any);
  },
  delegate: undefined,
};
export type TimerHandle = number | NodeJS.Timeout;
