import { Subscription } from "./subscription.js"
import {
  Scheduler,
  AsyncScheduler,
  perfProvider,
  frameProvider,
} from "./scheduler.js"
import * as qu from "./utils.js"
import {
  Subject,
  AnonymousSubject,
  AsyncSubject,
  ReplaySubject,
} from "./subject.js"
import { SafeSubscriber, Subscriber, isSubscriber } from "./subscriber.js"
import type * as qt from "./types.js"
import {
  Operator,
  subscribeOn,
  concatAll,
  mergeAll,
  mergeMap,
  filter,
  OpSubscriber,
  observeOn,
  onErrorResumeNext as onErrorResumeNextWith,
} from "./operator.js"

export class Observable<T> implements qt.Observable<T>, qt.Subscribable<T> {
  src: Observable<any> | undefined
  op: Operator<any, T> | undefined
  constructor(
    subscribe?: (this: Observable<T>, x: Subscriber<T>) => qt.Teardown
  ) {
    if (subscribe) this._subscribe = subscribe
  }
  lift<R>(x?: Operator<T, R>): Observable<R> {
    const y = new Observable<R>()
    y.src = this
    y.op = x
    return y
  }
  subscribe(x?: Partial<qt.Observer<T>>): Subscription
  subscribe(next: (x: T) => void): Subscription
  subscribe(
    next?: Partial<qt.Observer<T>> | ((x: T) => void) | null,
    error?: ((x: any) => void) | null,
    done?: (() => void) | null
  ): Subscription {
    const y = isSubscriber(next) ? next : new SafeSubscriber(next, error, done)
    qu.errorContext(() => {
      const { op, src } = this
      y.add(op ? op.call(y, src) : src ? this._subscribe(y) : this._try(y))
    })
    return y
  }
  protected _try(x: Subscriber<T>): qt.Teardown {
    try {
      return this._subscribe(x)
    } catch (e) {
      x.error(e)
    }
  }
  forEach(next: (x: T) => void): Promise<void>
  forEach(next: (x: T) => void, p: PromiseConstructorLike): Promise<void>
  forEach(next: (x: T) => void, p?: PromiseConstructorLike): Promise<void> {
    p = qu.getPromiseCtor(p)
    return new p<void>((res, rej) => {
      const s = new SafeSubscriber<T>({
        next: x => {
          try {
            next(x)
          } catch (e) {
            rej(e)
            s.unsubscribe()
          }
        },
        error: rej,
        done: res,
      })
      this.subscribe(s)
    }) as Promise<void>
  }
  protected _subscribe(x: Subscriber<any>): qt.Teardown {
    return this.src?.subscribe(x)
  }
  [Symbol.observable]() {
    return this
  }
  pipe(): Observable<T>
  pipe<A>(op1: qt.OpFun<T, A>): Observable<A>
  pipe<A, B>(op1: qt.OpFun<T, A>, op2: qt.OpFun<A, B>): Observable<B>
  pipe<A, B, C>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>
  ): Observable<C>
  pipe<A, B, C, D>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>
  ): Observable<D>
  pipe<A, B, C, D, E>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>
  ): Observable<E>
  pipe<A, B, C, D, E, F>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>,
    op6: qt.OpFun<E, F>
  ): Observable<F>
  pipe<A, B, C, D, E, F, G>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>,
    op6: qt.OpFun<E, F>,
    op7: qt.OpFun<F, G>
  ): Observable<G>
  pipe<A, B, C, D, E, F, G, H>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>,
    op6: qt.OpFun<E, F>,
    op7: qt.OpFun<F, G>,
    op8: qt.OpFun<G, H>
  ): Observable<H>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>,
    op6: qt.OpFun<E, F>,
    op7: qt.OpFun<F, G>,
    op8: qt.OpFun<G, H>,
    op9: qt.OpFun<H, I>
  ): Observable<I>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: qt.OpFun<T, A>,
    op2: qt.OpFun<A, B>,
    op3: qt.OpFun<B, C>,
    op4: qt.OpFun<C, D>,
    op5: qt.OpFun<D, E>,
    op6: qt.OpFun<E, F>,
    op7: qt.OpFun<F, G>,
    op8: qt.OpFun<G, H>,
    op9: qt.OpFun<H, I>,
    ...xs: qt.OpFun<any, any>[]
  ): Observable<unknown>
  pipe(...xs: qt.OpFun<any, any>[]) {
    return qu.pipeFromArray(xs)(this)
  }
}

export function bindCallback(
  cb: (...xs: any[]) => void,
  res: (...xs: any[]) => any,
  sched?: qt.Scheduler
): (...xs: any[]) => Observable<any>
export function bindCallback<
  T extends readonly unknown[],
  R extends readonly unknown[]
>(
  cb: (...xs: [...T, (...rs: R) => void]) => void,
  sched?: qt.Scheduler
): (...arg: T) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindCallback(
  cb: (...xs: [...any[], (...rs: any) => void]) => void,
  res?: ((...xs: any[]) => any) | qt.Scheduler,
  sched?: qt.Scheduler
): (...xs: any[]) => Observable<unknown> {
  return _bindCallback(false, cb, res, sched)
}
function _bindCallback(
  nodeStyle: boolean,
  cb: any,
  res?: any,
  sched?: qt.Scheduler
): (...xs: any[]) => Observable<unknown> {
  if (res) {
    if (qu.isScheduler(res)) sched = res
    else {
      return function (this: any, ...xs: any[]) {
        return (_bindCallback(nodeStyle, cb, sched) as any)
          .apply(this, xs)
          .pipe(qu.mapOneOrManyArgs(res as any))
      }
    }
  }
  if (sched) {
    return function (this: any, ...xs: any[]) {
      return (_bindCallback(nodeStyle, cb) as any)
        .apply(this, xs)
        .pipe(subscribeOn(sched!), observeOn(sched!))
    }
  }
  return function (this: any, ...xs: any[]): Observable<any> {
    const s = new AsyncSubject<any>()
    let done = false
    return new Observable(x => {
      const y = s.subscribe(x)
      if (!done) {
        done = true
        let isAsync = false
        let isComplete = false
        cb.apply(this, [
          ...xs,
          (...rs: any[]) => {
            if (nodeStyle) {
              const e = rs.shift()
              if (e != null) {
                s.error(e)
                return
              }
            }
            s.next(1 < rs.length ? rs : rs[0])
            isComplete = true
            if (isAsync) s.done()
          },
        ])
        if (isComplete) s.done()
        isAsync = true
      }
      return y
    })
  }
}

export function bindNodeCallback(
  cb: (...xs: any[]) => void,
  res: (...xs: any[]) => any,
  sched?: qt.Scheduler
): (...xs: any[]) => Observable<any>
export function bindNodeCallback<
  T extends readonly unknown[],
  R extends readonly unknown[]
>(
  cb: (...xs: [...T, (err: any, ...rs: R) => void]) => void,
  sched?: qt.Scheduler
): (...x: T) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindNodeCallback(
  cb: (...xs: [...any[], (err: any, ...rs: any) => void]) => void,
  res?: ((...xs: any[]) => any) | qt.Scheduler,
  sched?: qt.Scheduler
): (...xs: any[]) => Observable<any> {
  return _bindCallback(true, cb, res, sched)
}

export function combineLatest<T extends qt.AnyCatcher>(
  x: T
): Observable<unknown>
export function combineLatest(xs: []): Observable<never>
export function combineLatest<T extends readonly unknown[]>(
  xs: readonly [...qt.InputTuple<T>]
): Observable<T>
export function combineLatest<T extends readonly unknown[], R>(
  xs: readonly [...qt.InputTuple<T>],
  sel: (...xs: T) => R
): Observable<R>
export function combineLatest(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function combineLatest<T extends Record<string, qt.ObsInput<any>>>(
  x: T
): Observable<{ [K in keyof T]: qt.ObsValueOf<T[K]> }>
export function combineLatest<T extends qt.ObsInput<any>, R>(
  ...xs: any[]
): Observable<R> | Observable<qt.ObsValueOf<T>[]> {
  const sched = Scheduler.pop(xs)
  const sel = qu.popSelector(xs)
  const { xs: os, ks: keys } = qu.argsArgArrayOrObject(xs)
  if (os.length === 0) return from([], sched as any)
  const y = new Observable<qt.ObsValueOf<T>[]>(
    _combineLatest(
      os as qt.ObsInput<qt.ObsValueOf<T>>[],
      sched,
      keys ? xs => qu.createObject(keys, xs) : qu.identity
    )
  )
  return sel ? (y.pipe(qu.mapOneOrManyArgs(sel)) as Observable<R>) : y
}

export function _combineLatest(
  xs: qt.ObsInput<any>[],
  sched?: qt.Scheduler,
  valueTransform: (xs: any[]) => any = qu.identity
) {
  return (s: Subscriber<any>) => {
    maybeSchedule(
      sched,
      () => {
        const { length } = xs
        const vs = new Array(length)
        let active = length
        let remaining = length
        for (let i = 0; i < length; i++) {
          maybeSchedule(
            sched,
            () => {
              let hasFirst = false
              const src = from(xs[i]!, sched as any)
              src.subscribe(
                new OpSubscriber(
                  s,
                  v => {
                    vs[i] = v
                    if (!hasFirst) {
                      hasFirst = true
                      remaining--
                    }
                    if (!remaining) s.next(valueTransform(vs.slice()))
                  },
                  () => {
                    if (!--active) s.done()
                  }
                )
              )
            },
            s
          )
        }
      },
      s
    )
  }
}

function maybeSchedule(
  sched: qt.Scheduler | undefined,
  f: () => void,
  s: Subscription
) {
  if (sched) sched.run(s, f)
  else f()
}

export function concat<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function concat<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>, qt.Scheduler]
): Observable<T[number]>
export function concat(...xs: any[]) {
  return concatAll()(from(xs, Scheduler.pop(xs)))
}

export interface ConnectableConfig<T> {
  connector: () => qt.SubjectLike<T>
  resetOnDisconnect?: boolean
}
const DEFAULT_CONFIG: ConnectableConfig<unknown> = {
  connector: () => new Subject<unknown>(),
  resetOnDisconnect: true,
}

export function connectable<T>(
  x: qt.ObsInput<T>,
  cfg: ConnectableConfig<T> = DEFAULT_CONFIG
): qt.Connectable<T> {
  let c: Subscription | undefined = undefined
  const { connector, resetOnDisconnect = true } = cfg
  let s = connector()
  const y: any = new Observable<T>(x => {
    return s.subscribe(x)
  })
  y.connect = () => {
    if (!c || c.closed) {
      c = defer(() => x).subscribe(s)
      if (resetOnDisconnect) c.add(() => (s = connector()))
    }
    return c
  }
  return y
}

export function defer<R extends qt.ObsInput<any>>(
  observableFactory: () => R
): Observable<qt.ObsValueOf<R>> {
  return new Observable<qt.ObsValueOf<R>>(subscriber => {
    innerFrom(observableFactory()).subscribe(subscriber)
  })
}

export function animationFrames(timestampProvider?: qt.TimestampProvider) {
  return timestampProvider
    ? animationFramesFactory(timestampProvider)
    : DEFAULT_ANIMATION_FRAMES
}
function animationFramesFactory(timestampProvider?: qt.TimestampProvider) {
  const { schedule } = frameProvider
  return new Observable<{ timestamp: number; elapsed: number }>(subscriber => {
    const subscription = new Subscription()
    const provider = timestampProvider || perfProvider
    const start = provider.now()
    const run = (timestamp: DOMHighResTimeStamp | number) => {
      const now = provider.now()
      subscriber.next({
        timestamp: timestampProvider ? now : timestamp,
        elapsed: now - start,
      })
      if (!subscriber.closed) {
        subscription.add(schedule(run))
      }
    }
    subscription.add(schedule(run))
    return subscription
  })
}
const DEFAULT_ANIMATION_FRAMES = animationFramesFactory()
export function fromFetch<T>(
  input: string | Request,
  init: RequestInit & {
    selector: (response: Response) => qt.ObsInput<T>
  }
): Observable<T>
export function fromFetch(
  input: string | Request,
  init?: RequestInit
): Observable<Response>
export function fromFetch<T>(
  input: string | Request,
  initWithSelector: RequestInit & {
    selector?: (response: Response) => qt.ObsInput<T>
  } = {}
): Observable<Response | T> {
  const { selector, ...init } = initWithSelector
  return new Observable<Response | T>(subscriber => {
    const controller = new AbortController()
    const { signal } = controller
    let abortable = true
    const { signal: outerSignal } = init
    if (outerSignal) {
      if (outerSignal.aborted) {
        controller.abort()
      } else {
        const outerSignalHandler = () => {
          if (!signal.aborted) {
            controller.abort()
          }
        }
        outerSignal.addEventListener("abort", outerSignalHandler)
        subscriber.add(() =>
          outerSignal.removeEventListener("abort", outerSignalHandler)
        )
      }
    }
    const perSubscriberInit: RequestInit = { ...init, signal }
    const handleError = (err: any) => {
      abortable = false
      subscriber.error(err)
    }
    fetch(input, perSubscriberInit)
      .then(response => {
        if (selector) {
          innerFrom(selector(response)).subscribe(
            new OpSubscriber(
              subscriber,
              undefined,
              () => {
                abortable = false
                subscriber.done()
              },
              handleError
            )
          )
        } else {
          abortable = false
          subscriber.next(response)
          subscriber.done()
        }
      })
      .catch(handleError)
    return () => {
      if (abortable) {
        controller.abort()
      }
    }
  })
}

export function webSocket<T>(
  urlConfigOrSource: string | WebSocketSubjectConfig<T>
): WebSocketSubject<T> {
  return new WebSocketSubject<T>(urlConfigOrSource)
}

export const EMPTY = new Observable<never>(x => x.done())

export function forkJoin<T extends qt.AnyCatcher>(arg: T): Observable<unknown>
export function forkJoin(_: null | undefined): Observable<never>
export function forkJoin(xs: readonly []): Observable<never>
export function forkJoin<T extends readonly unknown[]>(
  xs: readonly [...qt.InputTuple<T>]
): Observable<T>
export function forkJoin<T extends readonly unknown[], R>(
  xs: readonly [...qt.InputTuple<T>],
  sel: (...xs: T) => R
): Observable<R>
export function forkJoin(x: {
  [K in any]: never
}): Observable<never>
export function forkJoin<T extends Record<string, qt.ObsInput<any>>>(
  x: T
): Observable<{ [K in keyof T]: qt.ObsValueOf<T[K]> }>
export function forkJoin(...xs: any[]): Observable<any> {
  const sel = qu.popSelector(xs)
  const { xs: args, ks: keys } = qu.argsArgArrayOrObject(xs)
  const y = new Observable(s => {
    const { length } = args
    if (!length) {
      s.done()
      return
    }
    const vs = new Array(length)
    let completions = length
    let emissions = length
    for (let i = 0; i < length; i++) {
      let has = false
      innerFrom(args[i]).subscribe(
        new OpSubscriber(
          s,
          v => {
            if (!has) {
              has = true
              emissions--
            }
            vs[i] = v
          },
          () => completions--,
          undefined,
          () => {
            if (!completions || !has) {
              if (!emissions) s.next(keys ? qu.createObject(keys, vs) : vs)
              s.done()
            }
          }
        )
      )
    }
  })
  return sel ? y.pipe(qu.mapOneOrManyArgs(sel)) : y
}

export function from<T extends qt.ObsInput<any>>(
  x: T
): Observable<qt.ObsValueOf<T>>
export function from<T extends qt.ObsInput<any>>(
  x: T,
  sched?: qt.Scheduler
): Observable<qt.ObsValueOf<T>>
export function from<T>(
  x: qt.ObsInput<T>,
  sched?: qt.Scheduler
): Observable<T> {
  return sched ? (sched.dispatch(x) as Observable<T>) : innerFrom(x)
}

const nodeEventEmitterMethods = ["addListener", "removeListener"] as const
const eventTargetMethods = ["addEventListener", "removeEventListener"] as const
const jqueryMethods = ["on", "off"] as const
export interface NodeStyleEventEmitter {
  addListener(n: string | symbol, h: NodeEventHandler): this
  removeListener(n: string | symbol, h: NodeEventHandler): this
}
export type NodeEventHandler = (...xs: any[]) => void
export interface NodeCompatibleEventEmitter {
  addListener(n: string, h: NodeEventHandler): void | {}
  removeListener(n: string, h: NodeEventHandler): void | {}
}
export interface JQueryStyleEventEmitter<C, T> {
  on(n: string, h: (this: C, t: T, ...xs: any[]) => any): void
  off(n: string, h: (this: C, t: T, ...xs: any[]) => any): void
}
export interface EventListenerObject<T> {
  handleEvent(x: T): void
}
export interface HasEventTargetAddRemove<T> {
  addEventListener(
    type: string,
    listener: ((x: T) => void) | EventListenerObject<T> | null,
    opts?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: ((x: T) => void) | EventListenerObject<T> | null,
    opts?: EventListenerOptions | boolean
  ): void
}

export interface EventListenerOptions {
  capture?: boolean
  passive?: boolean
  once?: boolean
}
export interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean
  passive?: boolean
}

export function fromEvent<T>(
  x: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  n: string
): Observable<T>
export function fromEvent<T, R>(
  x: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  n: string,
  res: (x: T) => R
): Observable<R>
export function fromEvent<T>(
  x: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  n: string,
  opts: EventListenerOptions
): Observable<T>
export function fromEvent<T, R>(
  x: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  n: string,
  opts: EventListenerOptions,
  res: (x: T) => R
): Observable<R>
export function fromEvent(
  x: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  n: string
): Observable<unknown>
export function fromEvent<R>(
  x: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  n: string,
  res: (...xs: any[]) => R
): Observable<R>
export function fromEvent(
  x: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  n: string
): Observable<unknown>
export function fromEvent<R>(
  x: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  n: string,
  res: (...xs: any[]) => R
): Observable<R>
export function fromEvent<T>(
  x:
    | JQueryStyleEventEmitter<any, T>
    | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  n: string
): Observable<T>
export function fromEvent<T, R>(
  x:
    | JQueryStyleEventEmitter<any, T>
    | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  n: string,
  res: (x: T, ...xs: any[]) => R
): Observable<R>
export function fromEvent<T>(
  x: any,
  n: string,
  opts?: EventListenerOptions | ((...xs: any[]) => T),
  res?: (...xs: any[]) => T
): Observable<T> {
  if (qu.isFunction(opts)) {
    res = opts
    opts = undefined
  }
  if (res) {
    return fromEvent<T>(x, n, opts as EventListenerOptions).pipe(
      qu.mapOneOrManyArgs(res)
    )
  }
  const [add, remove] = isEventTarget(x)
    ? eventTargetMethods.map(
        m => (h: any) => x[m](n, h, opts as EventListenerOptions)
      )
    : isNodeStyleEventEmitter(x)
    ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(x, n))
    : isJQueryStyleEventEmitter(x)
    ? jqueryMethods.map(toCommonHandlerRegistry(x, n))
    : []
  if (!add) {
    if (qu.isArrayLike(x)) {
      return mergeMap((x2: any) =>
        fromEvent(x2, n, opts as EventListenerOptions)
      )(innerFrom(x)) as Observable<T>
    }
  }
  if (!add) throw new TypeError("Invalid event target")
  return new Observable<T>(s => {
    const h = (...xs: any[]) => s.next(1 < xs.length ? xs : xs[0])
    add(h)
    return () => remove!(h)
  })
}

function toCommonHandlerRegistry(x: any, n: string) {
  return (m: string) => (h: any) => x[m](n, h)
}
function isNodeStyleEventEmitter(x: any): x is NodeStyleEventEmitter {
  return qu.isFunction(x.addListener) && qu.isFunction(x.removeListener)
}
function isJQueryStyleEventEmitter(
  x: any
): x is JQueryStyleEventEmitter<any, any> {
  return qu.isFunction(x.on) && qu.isFunction(x.off)
}
function isEventTarget(x: any): x is HasEventTargetAddRemove<any> {
  return (
    qu.isFunction(x.addEventListener) && qu.isFunction(x.removeEventListener)
  )
}

export function fromEventPattern<T>(
  addHandler: (x: NodeEventHandler) => any,
  removeHandler?: (x: NodeEventHandler, signal?: any) => void
): Observable<T>
export function fromEventPattern<T>(
  addHandler: (x: NodeEventHandler) => any,
  removeHandler?: (x: NodeEventHandler, signal?: any) => void,
  res?: (...xs: any[]) => T
): Observable<T>
export function fromEventPattern<T>(
  addHandler: (x: NodeEventHandler) => any,
  removeHandler?: (x: NodeEventHandler, signal?: any) => void,
  res?: (...xs: any[]) => T
): Observable<T | T[]> {
  if (res) {
    return fromEventPattern<T>(addHandler, removeHandler).pipe(
      qu.mapOneOrManyArgs(res)
    )
  }
  return new Observable<T | T[]>(s => {
    const h = (...x: T[]) => s.next(x.length === 1 ? x[0] : x)
    const y = addHandler(h)
    return qu.isFunction(removeHandler) ? () => removeHandler(h, y) : undefined
  })
}

export function fromSubscribable<T>(x: qt.Subscribable<T>) {
  return new Observable((s: Subscriber<T>) => x.subscribe(s))
}

type ConditionFunc<T> = (x: T) => boolean
type IterateFunc<T> = (x: T) => T
type ResultFunc<T, R> = (x: T) => R
export interface GenerateBaseOptions<T> {
  x0: T
  cond?: ConditionFunc<T>
  iterate: IterateFunc<T>
  sched?: qt.Scheduler
}
export interface GenerateOptions<R, T> extends GenerateBaseOptions<T> {
  res: ResultFunc<T, R>
}
export function generate<T>(x: GenerateBaseOptions<T>): Observable<T>
export function generate<R, T>(x: GenerateOptions<R, T>): Observable<R>
export function generate<R, T>(
  x: T | GenerateOptions<R, T>,
  cond?: ConditionFunc<T>,
  iterate?: IterateFunc<T>,
  rs?: ResultFunc<T, R> | qt.Scheduler,
  sched?: qt.Scheduler
): Observable<R> {
  let res: ResultFunc<T, R>
  let x0: T
  if (arguments.length === 1) {
    ;({
      x0,
      cond,
      iterate,
      res = qu.identity as ResultFunc<T, R>,
      sched,
    } = x as GenerateOptions<R, T>)
  } else {
    x0 = x as T
    if (!rs || qu.isScheduler(rs)) {
      res = qu.identity as ResultFunc<T, R>
      sched = rs as qt.Scheduler
    } else res = rs as ResultFunc<T, R>
  }
  function* gen() {
    for (let x = x0; !cond || cond(x); x = iterate!(x)) {
      yield res(x)
    }
  }
  return defer(
    (sched ? () => sched?.runIterable(gen()) : gen) as () => qt.ObsInput<R>
  )
}

export function iif<T, F>(
  cond: () => boolean,
  t: qt.ObsInput<T>,
  f: qt.ObsInput<F>
): Observable<T | F> {
  return defer(() => (cond() ? t : f))
}

export function innerFrom<T extends qt.ObsInput<any>>(
  x: T
): Observable<qt.ObsValueOf<T>>
export function innerFrom<T>(x: qt.ObsInput<T>): Observable<T> {
  if (x instanceof Observable) return x
  if (x != null) {
    if (qu.isInteropObservable(x)) return fromInteropObservable(x)
    if (qu.isArrayLike(x)) return fromArrayLike(x)
    if (qu.isPromise(x)) return fromPromise(x)
    if (qu.isAsyncIterable(x)) return fromAsyncIterable(x)
    if (qu.isIterable(x)) return fromIterable(x)
    if (qu.isReadableStreamLike(x)) return fromReadableStreamLike(x)
  }
  throw qu.createInvalidObservableTypeError(x)
}

export function fromInteropObservable<T>(x: any) {
  return new Observable((s: Subscriber<T>) => {
    const y = x[Symbol.observable]()
    if (qu.isFunction(y.subscribe)) return y.subscribe(s)
    throw new TypeError(
      "Provided object does not correctly implement Symbol.observable"
    )
  })
}
export function fromArrayLike<T>(x: ArrayLike<T>) {
  return new Observable((s: Subscriber<T>) => {
    for (let i = 0; i < x.length && !s.closed; i++) {
      s.next(x[i])
    }
    s.done()
  })
}
export function fromPromise<T>(p: PromiseLike<T>) {
  return new Observable((s: Subscriber<T>) => {
    p.then(
      x => {
        if (!s.closed) {
          s.next(x)
          s.done()
        }
      },
      (e: any) => s.error(e)
    ).then(null, qu.reportUnhandledError)
  })
}
export function fromIterable<T>(i: Iterable<T>) {
  return new Observable((s: Subscriber<T>) => {
    for (const x of i) {
      s.next(x)
      if (s.closed) return
    }
    s.done()
  })
}
export function fromAsyncIterable<T>(x: AsyncIterable<T>) {
  return new Observable((s: Subscriber<T>) => {
    process(x, s).catch(e => s.error(e))
  })
}
export function fromReadableStreamLike<T>(x: qt.ReadableStreamLike<T>) {
  return fromAsyncIterable(qu.readableStreamLikeToAsyncGenerator(x))
}

async function process<T>(i: AsyncIterable<T>, s: Subscriber<T>) {
  for await (const x of i) {
    s.next(x)
    if (s.closed) return
  }
  s.done()
}
export function interval(
  period = 0,
  sched: qt.Scheduler = new AsyncScheduler()
): Observable<number> {
  if (period < 0) period = 0
  return timer(period, period, sched)
}

export function merge<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function merge<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>, number?]
): Observable<T[number]>
export function merge(...xs: (qt.ObsInput<unknown> | number | qt.Scheduler)[]) {
  const sched = Scheduler.pop(xs)
  const concurrent = qu.popNumber(xs, Infinity)
  const ys = xs as qt.ObsInput<unknown>[]
  return !ys.length
    ? EMPTY
    : ys.length === 1
    ? innerFrom(ys[0]!)
    : mergeAll(concurrent)(from(ys, sched))
}

export const NEVER = new Observable<never>(qu.noop)

export function of(x: null): Observable<null>
export function of(x: undefined): Observable<undefined>
export function of(): Observable<never>
export function of<T>(x: T): Observable<T>
export function of<T extends readonly unknown[]>(
  ...xs: T
): Observable<qt.ValueFromArray<T>>
export function of<T>(...xs: Array<T | qt.Scheduler>): Observable<T> {
  return from(xs as T[], Scheduler.pop(xs))
}

export function onErrorResumeNext<T extends readonly unknown[]>(
  xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function onErrorResumeNext<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function onErrorResumeNext<T extends readonly unknown[]>(
  ...xs: [[...qt.InputTuple<T>]] | [...qt.InputTuple<T>]
) {
  return onErrorResumeNextWith(qu.argsOrArgArray(xs))(EMPTY)
}

export function partition<T, U extends T>(
  x: qt.ObsInput<T>,
  pred: (x: T, i: number) => x is U
): [Observable<U>, Observable<Exclude<T, U>>]
export function partition<T>(
  x: qt.ObsInput<T>,
  pred: (x: T, i: number) => boolean
): [Observable<T>, Observable<T>]
export function partition<T>(
  x: qt.ObsInput<T>,
  pred: (this: any, x: T, i: number) => boolean,
  thisArg?: any
): [Observable<T>, Observable<T>] {
  return [
    filter(pred, thisArg)(innerFrom(x)),
    filter(qu.not(pred, thisArg))(innerFrom(x)),
  ] as [Observable<T>, Observable<T>]
}

export function race<T extends readonly unknown[]>(
  xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function race<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>]
): Observable<T[number]>
export function race<T>(
  ...xs: (qt.ObsInput<T> | qt.ObsInput<T>[])[]
): Observable<any> {
  xs = qu.argsOrArgArray(xs)
  return xs.length === 1
    ? innerFrom(xs[0] as qt.ObsInput<T>)
    : new Observable<T>(raceInit(xs as qt.ObsInput<T>[]))
}

export function raceInit<T>(xs: qt.ObsInput<T>[]) {
  return (s: Subscriber<T>) => {
    let ss: Subscription[] = []
    for (let i = 0; ss && !s.closed && i < xs.length; i++) {
      ss.push(
        innerFrom(xs[i] as qt.ObsInput<T>).subscribe(
          new OpSubscriber(s, x => {
            if (ss) {
              for (let s = 0; s < ss.length; s++) {
                s !== i && ss[s]?.unsubscribe()
              }
              ss = null!
            }
            s.next(x)
          })
        )
      )
    }
  }
}

export function range(start: number, count?: number): Observable<number>
export function range(
  start: number,
  count?: number,
  sched?: qt.Scheduler
): Observable<number> {
  if (count == null) {
    count = start
    start = 0
  }
  if (count <= 0) return EMPTY
  const end = count + start
  return new Observable(
    sched
      ? s => {
          let n = start
          return sched.schedule(function () {
            if (n < end) {
              s.next(n++)
              this.schedule()
            } else s.done()
          })
        }
      : subscriber => {
          let n = start
          while (n < end && !subscriber.closed) {
            subscriber.next(n++)
          }
          subscriber.done()
        }
  )
}

export function throwError(x: () => any): Observable<never>
export function throwError(x: any, sched?: qt.Scheduler): Observable<never> {
  const f = qu.isFunction(x) ? x : () => x
  const init = (s: Subscriber<never>) => s.error(f())
  return new Observable(sched ? s => sched.schedule(init as any, 0, s) : init)
}

export function timer(x: number | Date, sched?: qt.Scheduler): Observable<0>
export function timer(
  x: number | Date,
  dur: number,
  sched?: qt.Scheduler
): Observable<number>
export function timer(
  x: number | Date = 0,
  ds?: number | qt.Scheduler,
  sched: qt.Scheduler = new AsyncScheduler()
): Observable<number> {
  let dur = -1
  if (ds != null) {
    if (qu.isScheduler(ds)) sched = ds
    else dur = ds
  }
  return new Observable(s => {
    let due = qu.isValidDate(x) ? +x - sched!.now() : x
    if (due < 0) due = 0
    let n = 0
    return sched.schedule(function () {
      if (!s.closed) {
        s.next(n++)
        if (0 <= dur) this.schedule(undefined, dur)
        else s.done()
      }
    }, due)
  })
}

export function using<T extends qt.ObsInput<any>>(
  res: () => qt.Unsubscribable | void,
  obs: (x: qt.Unsubscribable | void) => T | void
): Observable<qt.ObsValueOf<T>> {
  return new Observable<qt.ObsValueOf<T>>(s => {
    const resource = res()
    const y = obs(resource)
    const src = y ? innerFrom(y) : EMPTY
    src.subscribe(s)
    return () => {
      if (resource) resource.unsubscribe()
    }
  })
}

export function zip<T extends readonly unknown[]>(
  xs: [...qt.InputTuple<T>]
): Observable<T>
export function zip<T extends readonly unknown[], R>(
  xs: [...qt.InputTuple<T>],
  sel: (...xs: T) => R
): Observable<R>
export function zip<T extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<T>]
): Observable<T>
export function zip<A extends readonly unknown[], R>(
  ...xs: [...qt.InputTuple<A>, (...xs2: A) => R]
): Observable<R>
export function zip(...xs: unknown[]): Observable<unknown> {
  const sel = qu.popSelector(xs)
  const ss = qu.argsOrArgArray(xs) as Observable<unknown>[]
  return ss.length
    ? new Observable<unknown[]>(s => {
        let buffs: unknown[][] = ss.map(() => [])
        let done = ss.map(() => false)
        s.add(() => {
          buffs = done = null!
        })
        for (let i = 0; !s.closed && i < ss.length; i++) {
          innerFrom(ss[i]!).subscribe(
            new OpSubscriber(
              s,
              x => {
                buffs[i]?.push(x)
                if (buffs.every(b => b.length)) {
                  const y: any = buffs.map(b => b.shift()!)
                  s.next(sel ? sel(...y) : y)
                  if (buffs.some((b, i) => !b.length && done[i])) {
                    s.done()
                  }
                }
              },
              () => {
                done[i] = true
                !buffs[i]?.length && s.done()
              }
            )
          )
        }
        return () => {
          buffs = done = null!
        }
      })
    : EMPTY
}

export interface WebSocketSubjectConfig<T> {
  url: string
  protocol?: string | Array<string>
  resultSelector?: (e: MessageEvent) => T
  serializer?: (value: T) => WebSocketMessage
  deserializer?: (e: MessageEvent) => T
  openObserver?: qt.NextObserver<Event>
  closeObserver?: qt.NextObserver<CloseEvent>
  closingObserver?: qt.NextObserver<void>
  WebSocketCtor?: {
    new (url: string, protocols?: string | string[]): WebSocket
  }
  binaryType?: "blob" | "arraybuffer"
}
const DEFAULT_WEBSOCKET_CONFIG: WebSocketSubjectConfig<any> = {
  url: "",
  deserializer: (e: MessageEvent) => JSON.parse(e.data),
  serializer: (value: any) => JSON.stringify(value),
}
const WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT =
  "WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }"
export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView
export class WebSocketSubject<T> extends AnonymousSubject<T> {
  private _config: WebSocketSubjectConfig<T>
  _output: Subject<T>
  private _socket: WebSocket | null = null
  constructor(
    urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>,
    destination?: qt.Observer<T>
  ) {
    super()
    if (urlConfigOrSource instanceof Observable) {
      this.dest = destination
      this.src = urlConfigOrSource as Observable<T>
    } else {
      const config = (this._config = { ...DEFAULT_WEBSOCKET_CONFIG })
      this._output = new Subject<T>()
      if (typeof urlConfigOrSource === "string") {
        config.url = urlConfigOrSource
      } else {
        for (const key in urlConfigOrSource) {
          if (urlConfigOrSource.hasOwnProperty(key)) {
            ;(config as any)[key] = (urlConfigOrSource as any)[key]
          }
        }
      }
      if (!config.WebSocketCtor && WebSocket) {
        config.WebSocketCtor = WebSocket
      } else if (!config.WebSocketCtor) {
        throw new Error("no WebSocket constructor can be found")
      }
      this.dest = new ReplaySubject()
    }
  }
  override lift<R>(operator: Operator<T, R>): WebSocketSubject<R> {
    const sock = new WebSocketSubject<R>(
      this._config as WebSocketSubjectConfig<any>,
      this.dest as any
    )
    sock.op = operator
    sock.src = this
    return sock
  }
  private _resetState() {
    this._socket = null
    if (!this.src) {
      this.dest = new ReplaySubject()
    }
    this._output = new Subject<T>()
  }
  multiplex(
    subMsg: () => any,
    unsubMsg: () => any,
    messageFilter: (value: T) => boolean
  ) {
    const self = this
    return new Observable((observer: qt.Observer<T>) => {
      try {
        self.next(subMsg())
      } catch (err) {
        observer.error(err)
      }
      const subscription = self.subscribe({
        next: x => {
          try {
            if (messageFilter(x)) {
              observer.next(x)
            }
          } catch (err) {
            observer.error(err)
          }
        },
        error: err => observer.error(err),
        done: () => observer.done(),
      })
      return () => {
        try {
          self.next(unsubMsg())
        } catch (err) {
          observer.error(err)
        }
        subscription.unsubscribe()
      }
    })
  }
  private _connectSocket() {
    const { WebSocketCtor, protocol, url, binaryType } = this._config
    const observer = this._output
    let socket: WebSocket | null = null
    try {
      socket = protocol
        ? new WebSocketCtor!(url, protocol)
        : new WebSocketCtor!(url)
      this._socket = socket
      if (binaryType) {
        this._socket.binaryType = binaryType
      }
    } catch (e) {
      observer.error(e)
      return
    }
    const subscription = new Subscription(() => {
      this._socket = null
      if (socket && socket.readyState === 1) {
        socket.close()
      }
    })
    socket.onopen = (evt: Event) => {
      const { _socket } = this
      if (!_socket) {
        socket!.close()
        this._resetState()
        return
      }
      const { openObserver } = this._config
      if (openObserver) {
        openObserver.next(evt)
      }
      const queue = this.dest
      this.dest = Subscriber.create<T>(
        x => {
          if (socket!.readyState === 1) {
            try {
              const { serializer } = this._config
              socket!.send(serializer!(x!))
            } catch (e) {
              this.dest!.error(e)
            }
          }
        },
        err => {
          const { closingObserver } = this._config
          if (closingObserver) {
            closingObserver.next(undefined)
          }
          if (err && err.code) {
            socket!.close(err.code, err.reason)
          } else {
            observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT))
          }
          this._resetState()
        },
        () => {
          const { closingObserver } = this._config
          if (closingObserver) {
            closingObserver.next(undefined)
          }
          socket!.close()
          this._resetState()
        }
      ) as Subscriber<any>
      if (queue && queue instanceof ReplaySubject) {
        subscription.add((queue as ReplaySubject<T>).subscribe(this.dest))
      }
    }
    socket.onerror = (e: Event) => {
      this._resetState()
      observer.error(e)
    }
    socket.onclose = (e: CloseEvent) => {
      if (socket === this._socket) {
        this._resetState()
      }
      const { closeObserver } = this._config
      if (closeObserver) {
        closeObserver.next(e)
      }
      if (e.wasClean) {
        observer.done()
      } else {
        observer.error(e)
      }
    }
    socket.onmessage = (e: MessageEvent) => {
      try {
        const { deserializer } = this._config
        observer.next(deserializer!(e))
      } catch (err) {
        observer.error(err)
      }
    }
  }
  protected override _subscribe(subscriber: Subscriber<T>): Subscription {
    const { src: source } = this
    if (source) {
      return source.subscribe(subscriber)
    }
    if (!this._socket) {
      this._connectSocket()
    }
    this._output.subscribe(subscriber)
    subscriber.add(() => {
      const { _socket } = this
      if (this._output.observers.length === 0) {
        if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
          _socket.close()
        }
        this._resetState()
      }
    })
    return subscriber
  }
  override unsubscribe() {
    const { _socket } = this
    if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
      _socket.close()
    }
    this._resetState()
    super.unsubscribe()
  }
}
