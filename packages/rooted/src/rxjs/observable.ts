import { Subscription } from "./subscription.js"
import {
  asyncScheduler,
  performanceTimestampProvider,
  animationFrameProvider,
  async as asyncScheduler,
} from "./scheduler.js"
import * as qu from "./utils.js"
import {
  Subject,
  AnonymousSubject,
  AsyncSubject,
  ReplaySubject,
} from "./subject.js"
import { SafeSubscriber, Subscriber, isSubscriber } from "./subscriber.js"
import { scheduled, scheduleIterable } from "./scheduled.js"
import type * as qt from "./types.js"
import {
  Operator,
  subscribeOn,
  concatAll,
  mergeAll,
  mergeMap,
  filter,
  createOperatorSubscriber,
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
    complete?: (() => void) | null
  ): Subscription {
    const y = isSubscriber(next)
      ? next
      : new SafeSubscriber(next, error, complete)
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
        complete: res,
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
  pipe<A>(op1: qt.OperatorFunction<T, A>): Observable<A>
  pipe<A, B>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>
  ): Observable<B>
  pipe<A, B, C>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>
  ): Observable<C>
  pipe<A, B, C, D>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>
  ): Observable<D>
  pipe<A, B, C, D, E>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>
  ): Observable<E>
  pipe<A, B, C, D, E, F>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>,
    op6: qt.OperatorFunction<E, F>
  ): Observable<F>
  pipe<A, B, C, D, E, F, G>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>,
    op6: qt.OperatorFunction<E, F>,
    op7: qt.OperatorFunction<F, G>
  ): Observable<G>
  pipe<A, B, C, D, E, F, G, H>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>,
    op6: qt.OperatorFunction<E, F>,
    op7: qt.OperatorFunction<F, G>,
    op8: qt.OperatorFunction<G, H>
  ): Observable<H>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>,
    op6: qt.OperatorFunction<E, F>,
    op7: qt.OperatorFunction<F, G>,
    op8: qt.OperatorFunction<G, H>,
    op9: qt.OperatorFunction<H, I>
  ): Observable<I>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: qt.OperatorFunction<T, A>,
    op2: qt.OperatorFunction<A, B>,
    op3: qt.OperatorFunction<B, C>,
    op4: qt.OperatorFunction<C, D>,
    op5: qt.OperatorFunction<D, E>,
    op6: qt.OperatorFunction<E, F>,
    op7: qt.OperatorFunction<F, G>,
    op8: qt.OperatorFunction<G, H>,
    op9: qt.OperatorFunction<H, I>,
    ...xs: qt.OperatorFunction<any, any>[]
  ): Observable<unknown>
  pipe(...xs: qt.OperatorFunction<any, any>[]): Observable<any> {
    return qu.pipeFromArray(xs)(this)
  }
}

export function bindCallback(
  cb: (...xs: any[]) => void,
  res: (...xs: any[]) => any,
  scheduler?: qt.Scheduler
): (...xs: any[]) => Observable<any>
export function bindCallback<
  T extends readonly unknown[],
  R extends readonly unknown[]
>(
  cb: (...xs: [...T, (...rs: R) => void]) => void,
  scheduler?: qt.Scheduler
): (...arg: T) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindCallback(
  cb: (...xs: [...any[], (...rs: any) => void]) => void,
  res?: ((...xs: any[]) => any) | qt.Scheduler,
  scheduler?: qt.Scheduler
): (...xs: any[]) => Observable<unknown> {
  return _bindCallback(false, cb, res, scheduler)
}
function _bindCallback(
  nodeStyle: boolean,
  cb: any,
  res?: any,
  scheduler?: qt.Scheduler
): (...xs: any[]) => Observable<unknown> {
  if (res) {
    if (qu.isScheduler(res)) scheduler = res
    else {
      return function (this: any, ...xs: any[]) {
        return (_bindCallback(nodeStyle, cb, scheduler) as any)
          .apply(this, xs)
          .pipe(qu.mapOneOrManyArgs(res as any))
      }
    }
  }
  if (scheduler) {
    return function (this: any, ...xs: any[]) {
      return (_bindCallback(nodeStyle, cb) as any)
        .apply(this, xs)
        .pipe(subscribeOn(scheduler!), observeOn(scheduler!))
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
            if (isAsync) s.complete()
          },
        ])
        if (isComplete) s.complete()
        isAsync = true
      }
      return y
    })
  }
}

export function bindNodeCallback(
  cb: (...xs: any[]) => void,
  res: (...xs: any[]) => any,
  scheduler?: qt.Scheduler
): (...xs: any[]) => Observable<any>
export function bindNodeCallback<
  T extends readonly unknown[],
  R extends readonly unknown[]
>(
  cb: (...xs: [...T, (err: any, ...rs: R) => void]) => void,
  scheduler?: qt.Scheduler
): (...x: T) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindNodeCallback(
  cb: (...xs: [...any[], (err: any, ...rs: any) => void]) => void,
  res?: ((...xs: any[]) => any) | qt.Scheduler,
  scheduler?: qt.Scheduler
): (...xs: any[]) => Observable<any> {
  return _bindCallback(true, cb, res, scheduler)
}

export function combineLatest<T extends qt.AnyCatcher>(
  x: T
): Observable<unknown>
export function combineLatest(xs: []): Observable<never>
export function combineLatest<T extends readonly unknown[]>(
  xs: readonly [...qt.ObservableInputTuple<T>]
): Observable<T>
export function combineLatest<T extends readonly unknown[], R>(
  xs: readonly [...qt.ObservableInputTuple<T>],
  res: (...xs: T) => R
): Observable<R>
export function combineLatest(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function combineLatest<
  T extends Record<string, qt.ObservableInput<any>>
>(x: T): Observable<{ [K in keyof T]: qt.ObservedValueOf<T[K]> }>
export function combineLatest<T extends qt.ObservableInput<any>, R>(
  ...xs: any[]
): Observable<R> | Observable<qt.ObservedValueOf<T>[]> {
  const s = qu.popScheduler(xs)
  const res = qu.popResultSelector(xs)
  const { args: os, keys } = qu.argsArgArrayOrObject(xs)
  if (os.length === 0) return from([], s as any)
  const y = new Observable<qt.ObservedValueOf<T>[]>(
    _combineLatest(
      os as qt.ObservableInput<qt.ObservedValueOf<T>>[],
      s,
      keys ? xs => qu.createObject(keys, xs) : qu.identity
    )
  )
  return res ? (y.pipe(qu.mapOneOrManyArgs(res)) as Observable<R>) : y
}

export function _combineLatest(
  xs: qt.ObservableInput<any>[],
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
                createOperatorSubscriber(
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
                    if (!--active) s.complete()
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
  if (sched) qu.executeSchedule(s, sched, f)
  else f()
}

export function concat<T extends readonly unknown[]>(
  ...xs: [...qt.ObservableInputTuple<T>]
): Observable<T[number]>
export function concat<T extends readonly unknown[]>(
  ...xs: [...qt.ObservableInputTuple<T>, qt.Scheduler]
): Observable<T[number]>
export function concat(...xs: any[]): Observable<unknown> {
  return concatAll()(from(xs, qu.popScheduler(xs)))
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
  x: qt.ObservableInput<T>,
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

export function defer<R extends qt.ObservableInput<any>>(
  observableFactory: () => R
): Observable<qt.ObservedValueOf<R>> {
  return new Observable<qt.ObservedValueOf<R>>(subscriber => {
    innerFrom(observableFactory()).subscribe(subscriber)
  })
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
        complete: () => observer.complete(),
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
        observer.complete()
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
export function animationFrames(timestampProvider?: qt.TimestampProvider) {
  return timestampProvider
    ? animationFramesFactory(timestampProvider)
    : DEFAULT_ANIMATION_FRAMES
}
function animationFramesFactory(timestampProvider?: qt.TimestampProvider) {
  const { schedule } = animationFrameProvider
  return new Observable<{ timestamp: number; elapsed: number }>(subscriber => {
    const subscription = new Subscription()
    const provider = timestampProvider || performanceTimestampProvider
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
    selector: (response: Response) => qt.ObservableInput<T>
  }
): Observable<T>
export function fromFetch(
  input: string | Request,
  init?: RequestInit
): Observable<Response>
export function fromFetch<T>(
  input: string | Request,
  initWithSelector: RequestInit & {
    selector?: (response: Response) => qt.ObservableInput<T>
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
            createOperatorSubscriber(
              subscriber,
              undefined,
              () => {
                abortable = false
                subscriber.complete()
              },
              handleError
            )
          )
        } else {
          abortable = false
          subscriber.next(response)
          subscriber.complete()
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
export const EMPTY = new Observable<never>(subscriber => subscriber.complete())
export function empty(scheduler?: qt.Scheduler) {
  return scheduler ? emptyScheduled(scheduler) : EMPTY
}
function emptyScheduled(scheduler: qt.Scheduler) {
  return new Observable<never>(subscriber =>
    scheduler.schedule(() => subscriber.complete())
  )
}
export function forkJoin<T extends qt.AnyCatcher>(arg: T): Observable<unknown>
export function forkJoin(scheduler: null | undefined): Observable<never>
export function forkJoin(sources: readonly []): Observable<never>
export function forkJoin<A extends readonly unknown[]>(
  sources: readonly [...qt.ObservableInputTuple<A>]
): Observable<A>
export function forkJoin<A extends readonly unknown[], R>(
  sources: readonly [...qt.ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function forkJoin<A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): Observable<A>
export function forkJoin<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [
    ...qt.ObservableInputTuple<A>,
    (...values: A) => R
  ]
): Observable<R>
export function forkJoin(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function forkJoin<T extends Record<string, qt.ObservableInput<any>>>(
  sourcesObject: T
): Observable<{ [K in keyof T]: qt.ObservedValueOf<T[K]> }>
export function forkJoin(...args: any[]): Observable<any> {
  const resultSelector = qu.popResultSelector(args)
  const { args: sources, keys } = qu.argsArgArrayOrObject(args)
  const result = new Observable(subscriber => {
    const { length } = sources
    if (!length) {
      subscriber.complete()
      return
    }
    const values = new Array(length)
    let remainingCompletions = length
    let remainingEmissions = length
    for (let sourceIndex = 0; sourceIndex < length; sourceIndex++) {
      let hasValue = false
      innerFrom(sources[sourceIndex]).subscribe(
        createOperatorSubscriber(
          subscriber,
          value => {
            if (!hasValue) {
              hasValue = true
              remainingEmissions--
            }
            values[sourceIndex] = value
          },
          () => remainingCompletions--,
          undefined,
          () => {
            if (!remainingCompletions || !hasValue) {
              if (!remainingEmissions) {
                subscriber.next(keys ? qu.createObject(keys, values) : values)
              }
              subscriber.complete()
            }
          }
        )
      )
    }
  })
  return resultSelector
    ? result.pipe(qu.mapOneOrManyArgs(resultSelector))
    : result
}
export function from<O extends qt.ObservableInput<any>>(
  input: O
): Observable<qt.ObservedValueOf<O>>
export function from<O extends qt.ObservableInput<any>>(
  input: O,
  scheduler: qt.Scheduler | undefined
): Observable<qt.ObservedValueOf<O>>
export function from<T>(
  input: qt.ObservableInput<T>,
  scheduler?: qt.Scheduler
): Observable<T> {
  return scheduler ? scheduled(input, scheduler) : innerFrom(input)
}
const nodeEventEmitterMethods = ["addListener", "removeListener"] as const
const eventTargetMethods = ["addEventListener", "removeEventListener"] as const
const jqueryMethods = ["on", "off"] as const
export interface NodeStyleEventEmitter {
  addListener(eventName: string | symbol, handler: NodeEventHandler): this
  removeListener(eventName: string | symbol, handler: NodeEventHandler): this
}
export type NodeEventHandler = (...args: any[]) => void
export interface NodeCompatibleEventEmitter {
  addListener(eventName: string, handler: NodeEventHandler): void | {}
  removeListener(eventName: string, handler: NodeEventHandler): void | {}
}
export interface JQueryStyleEventEmitter<TContext, T> {
  on(
    eventName: string,
    handler: (this: TContext, t: T, ...args: any[]) => any
  ): void
  off(
    eventName: string,
    handler: (this: TContext, t: T, ...args: any[]) => any
  ): void
}
export interface EventListenerObject<E> {
  handleEvent(evt: E): void
}
export interface HasEventTargetAddRemove<E> {
  addEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: EventListenerOptions | boolean
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
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string
): Observable<T>
export function fromEvent<T, R>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  resultSelector: (event: T) => R
): Observable<R>
export function fromEvent<T>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  options: EventListenerOptions
): Observable<T>
export function fromEvent<T, R>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  options: EventListenerOptions,
  resultSelector: (event: T) => R
): Observable<R>
export function fromEvent(
  target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  eventName: string
): Observable<unknown>
export function fromEvent<T>(
  target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  eventName: string
): Observable<T>
export function fromEvent<R>(
  target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  eventName: string,
  resultSelector: (...args: any[]) => R
): Observable<R>
export function fromEvent(
  target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  eventName: string
): Observable<unknown>
export function fromEvent<T>(
  target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  eventName: string
): Observable<T>
export function fromEvent<R>(
  target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  eventName: string,
  resultSelector: (...args: any[]) => R
): Observable<R>
export function fromEvent<T>(
  target:
    | JQueryStyleEventEmitter<any, T>
    | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  eventName: string
): Observable<T>
export function fromEvent<T, R>(
  target:
    | JQueryStyleEventEmitter<any, T>
    | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  eventName: string,
  resultSelector: (value: T, ...args: any[]) => R
): Observable<R>
export function fromEvent<T>(
  target: any,
  eventName: string,
  options?: EventListenerOptions | ((...args: any[]) => T),
  resultSelector?: (...args: any[]) => T
): Observable<T> {
  if (qu.isFunction(options)) {
    resultSelector = options
    options = undefined
  }
  if (resultSelector) {
    return fromEvent<T>(
      target,
      eventName,
      options as EventListenerOptions
    ).pipe(qu.mapOneOrManyArgs(resultSelector))
  }
  const [add, remove] = isEventTarget(target)
    ? eventTargetMethods.map(
        methodName => (handler: any) =>
          target[methodName](
            eventName,
            handler,
            options as EventListenerOptions
          )
      )
    : isNodeStyleEventEmitter(target)
    ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
    : isJQueryStyleEventEmitter(target)
    ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
    : []
  if (!add) {
    if (qu.isArrayLike(target)) {
      return mergeMap((subTarget: any) =>
        fromEvent(subTarget, eventName, options as EventListenerOptions)
      )(innerFrom(target)) as Observable<T>
    }
  }
  if (!add) {
    throw new TypeError("Invalid event target")
  }
  return new Observable<T>(subscriber => {
    const handler = (...args: any[]) =>
      subscriber.next(1 < args.length ? args : args[0])
    add(handler)
    return () => remove!(handler)
  })
}
function toCommonHandlerRegistry(target: any, eventName: string) {
  return (methodName: string) => (handler: any) =>
    target[methodName](eventName, handler)
}
function isNodeStyleEventEmitter(target: any): target is NodeStyleEventEmitter {
  return (
    qu.isFunction(target.addListener) && qu.isFunction(target.removeListener)
  )
}
function isJQueryStyleEventEmitter(
  target: any
): target is JQueryStyleEventEmitter<any, any> {
  return qu.isFunction(target.on) && qu.isFunction(target.off)
}
function isEventTarget(target: any): target is HasEventTargetAddRemove<any> {
  return (
    qu.isFunction(target.addEventListener) &&
    qu.isFunction(target.removeEventListener)
  )
}
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void
): Observable<T>
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void,
  resultSelector?: (...args: any[]) => T
): Observable<T>
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void,
  resultSelector?: (...args: any[]) => T
): Observable<T | T[]> {
  if (resultSelector) {
    return fromEventPattern<T>(addHandler, removeHandler).pipe(
      qu.mapOneOrManyArgs(resultSelector)
    )
  }
  return new Observable<T | T[]>(subscriber => {
    const handler = (...e: T[]) => subscriber.next(e.length === 1 ? e[0] : e)
    const retValue = addHandler(handler)
    return qu.isFunction(removeHandler)
      ? () => removeHandler(handler, retValue)
      : undefined
  })
}
export function fromSubscribable<T>(subscribable: qt.Subscribable<T>) {
  return new Observable((subscriber: Subscriber<T>) =>
    subscribable.subscribe(subscriber)
  )
}
type ConditionFunc<S> = (state: S) => boolean
type IterateFunc<S> = (state: S) => S
type ResultFunc<S, T> = (state: S) => T
export interface GenerateBaseOptions<S> {
  initialState: S
  condition?: ConditionFunc<S>
  iterate: IterateFunc<S>
  scheduler?: qt.Scheduler
}
export interface GenerateOptions<T, S> extends GenerateBaseOptions<S> {
  resultSelector: ResultFunc<S, T>
}
export function generate<T, S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  resultSelector: ResultFunc<S, T>,
  scheduler?: qt.Scheduler
): Observable<T>
export function generate<S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  scheduler?: qt.Scheduler
): Observable<S>
export function generate<S>(options: GenerateBaseOptions<S>): Observable<S>
export function generate<T, S>(options: GenerateOptions<T, S>): Observable<T>
export function generate<T, S>(
  initialStateOrOptions: S | GenerateOptions<T, S>,
  condition?: ConditionFunc<S>,
  iterate?: IterateFunc<S>,
  resultSelectorOrScheduler?: ResultFunc<S, T> | qt.Scheduler,
  scheduler?: qt.Scheduler
): Observable<T> {
  let resultSelector: ResultFunc<S, T>
  let initialState: S
  if (arguments.length === 1) {
    ;({
      initialState,
      condition,
      iterate,
      resultSelector = qu.identity as ResultFunc<S, T>,
      scheduler,
    } = initialStateOrOptions as GenerateOptions<T, S>)
  } else {
    initialState = initialStateOrOptions as S
    if (
      !resultSelectorOrScheduler ||
      qu.isScheduler(resultSelectorOrScheduler)
    ) {
      resultSelector = qu.identity as ResultFunc<S, T>
      scheduler = resultSelectorOrScheduler as qt.Scheduler
    } else {
      resultSelector = resultSelectorOrScheduler as ResultFunc<S, T>
    }
  }
  function* gen() {
    for (
      let state = initialState;
      !condition || condition(state);
      state = iterate!(state)
    ) {
      yield resultSelector(state)
    }
  }
  return defer(
    (scheduler
      ? () => scheduleIterable(gen(), scheduler!)
      : gen) as () => qt.ObservableInput<T>
  )
}
export function iif<T, F>(
  condition: () => boolean,
  trueResult: qt.ObservableInput<T>,
  falseResult: qt.ObservableInput<F>
): Observable<T | F> {
  return defer(() => (condition() ? trueResult : falseResult))
}
export function innerFrom<O extends qt.ObservableInput<any>>(
  input: O
): Observable<qt.ObservedValueOf<O>>
export function innerFrom<T>(input: qt.ObservableInput<T>): Observable<T> {
  if (input instanceof Observable) {
    return input
  }
  if (input != null) {
    if (qu.isInteropObservable(input)) {
      return fromInteropObservable(input)
    }
    if (qu.isArrayLike(input)) {
      return fromArrayLike(input)
    }
    if (qu.isPromise(input)) {
      return fromPromise(input)
    }
    if (qu.isAsyncIterable(input)) {
      return fromAsyncIterable(input)
    }
    if (qu.isIterable(input)) {
      return fromIterable(input)
    }
    if (qu.isReadableStreamLike(input)) {
      return fromReadableStreamLike(input)
    }
  }
  throw qu.createInvalidObservableTypeError(input)
}
export function fromInteropObservable<T>(obj: any) {
  return new Observable((subscriber: Subscriber<T>) => {
    const obs = obj[Symbol.observable]()
    if (qu.isFunction(obs.subscribe)) {
      return obs.subscribe(subscriber)
    }
    throw new TypeError(
      "Provided object does not correctly implement Symbol.observable"
    )
  })
}
export function fromArrayLike<T>(array: ArrayLike<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    for (let i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i])
    }
    subscriber.complete()
  })
}
export function fromPromise<T>(promise: PromiseLike<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    promise
      .then(
        value => {
          if (!subscriber.closed) {
            subscriber.next(value)
            subscriber.complete()
          }
        },
        (err: any) => subscriber.error(err)
      )
      .then(null, qu.reportUnhandledError)
  })
}
export function fromIterable<T>(iterable: Iterable<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    for (const value of iterable) {
      subscriber.next(value)
      if (subscriber.closed) {
        return
      }
    }
    subscriber.complete()
  })
}
export function fromAsyncIterable<T>(asyncIterable: AsyncIterable<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    process(asyncIterable, subscriber).catch(err => subscriber.error(err))
  })
}
export function fromReadableStreamLike<T>(
  readableStream: qt.ReadableStreamLike<T>
) {
  return fromAsyncIterable(
    qu.readableStreamLikeToAsyncGenerator(readableStream)
  )
}
async function process<T>(
  asyncIterable: AsyncIterable<T>,
  subscriber: Subscriber<T>
) {
  for await (const value of asyncIterable) {
    subscriber.next(value)
    if (subscriber.closed) {
      return
    }
  }
  subscriber.complete()
}
export function interval(
  period = 0,
  scheduler: qt.Scheduler = asyncScheduler
): Observable<number> {
  if (period < 0) {
    period = 0
  }
  return timer(period, period, scheduler)
}
export function merge<A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...qt.ObservableInputTuple<A>, number?]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...qt.ObservableInputTuple<A>, qt.Scheduler?]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [
    ...qt.ObservableInputTuple<A>,
    number?,
    qt.Scheduler?
  ]
): Observable<A[number]>
export function merge(
  ...args: (qt.ObservableInput<unknown> | number | qt.Scheduler)[]
): Observable<unknown> {
  const scheduler = qu.popScheduler(args)
  const concurrent = qu.popNumber(args, Infinity)
  const sources = args as qt.ObservableInput<unknown>[]
  return !sources.length
    ? EMPTY
    : sources.length === 1
    ? innerFrom(sources[0])
    : mergeAll(concurrent)(from(sources, scheduler))
}
export const NEVER = new Observable<never>(qu.noop)
export function never() {
  return NEVER
}
export function of(value: null): Observable<null>
export function of(value: undefined): Observable<undefined>
export function of(scheduler: qt.Scheduler): Observable<never>
export function of<A extends readonly unknown[]>(
  ...valuesAndScheduler: [...A, qt.Scheduler]
): Observable<qt.ValueFromArray<A>>
export function of(): Observable<never>
export function of<T>(): Observable<T>
export function of<T>(value: T): Observable<T>
export function of<A extends readonly unknown[]>(
  ...values: A
): Observable<qt.ValueFromArray<A>>
export function of<T>(...args: Array<T | qt.Scheduler>): Observable<T> {
  const scheduler = qu.popScheduler(args)
  return from(args as T[], scheduler)
}
export function onErrorResumeNext<A extends readonly unknown[]>(
  sources: [...qt.ObservableInputTuple<A>]
): Observable<A[number]>
export function onErrorResumeNext<A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): Observable<A[number]>
export function onErrorResumeNext<A extends readonly unknown[]>(
  ...sources:
    | [[...qt.ObservableInputTuple<A>]]
    | [...qt.ObservableInputTuple<A>]
): Observable<A[number]> {
  return onErrorResumeNextWith(qu.argsOrArgArray(sources))(EMPTY)
}
export function pairs<T>(
  arr: readonly T[],
  scheduler?: qt.Scheduler
): Observable<[string, T]>
export function pairs<O extends Record<string, unknown>>(
  obj: O,
  scheduler?: qt.Scheduler
): Observable<[keyof O, O[keyof O]]>
export function pairs<T>(
  iterable: Iterable<T>,
  scheduler?: qt.Scheduler
): Observable<[string, T]>
export function pairs(
  n: number | bigint | boolean | ((...args: any[]) => any) | symbol,
  scheduler?: qt.Scheduler
): Observable<[never, never]>
export function pairs(obj: any, scheduler?: qt.Scheduler) {
  return from(Object.entries(obj), scheduler as any)
}
export function partition<T, U extends T, A>(
  source: qt.ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => value is U,
  thisArg: A
): [Observable<U>, Observable<Exclude<T, U>>]
export function partition<T, U extends T>(
  source: qt.ObservableInput<T>,
  predicate: (value: T, index: number) => value is U
): [Observable<U>, Observable<Exclude<T, U>>]
export function partition<T, A>(
  source: qt.ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): [Observable<T>, Observable<T>]
export function partition<T>(
  source: qt.ObservableInput<T>,
  predicate: (value: T, index: number) => boolean
): [Observable<T>, Observable<T>]
export function partition<T>(
  source: qt.ObservableInput<T>,
  predicate: (this: any, value: T, index: number) => boolean,
  thisArg?: any
): [Observable<T>, Observable<T>] {
  return [
    filter(predicate, thisArg)(innerFrom(source)),
    filter(qu.not(predicate, thisArg))(innerFrom(source)),
  ] as [Observable<T>, Observable<T>]
}
export function race<T extends readonly unknown[]>(
  inputs: [...qt.ObservableInputTuple<T>]
): Observable<T[number]>
export function race<T extends readonly unknown[]>(
  ...inputs: [...qt.ObservableInputTuple<T>]
): Observable<T[number]>
export function race<T>(
  ...sources: (qt.ObservableInput<T> | qt.ObservableInput<T>[])[]
): Observable<any> {
  sources = qu.argsOrArgArray(sources)
  return sources.length === 1
    ? innerFrom(sources[0] as qt.ObservableInput<T>)
    : new Observable<T>(raceInit(sources as qt.ObservableInput<T>[]))
}
export function raceInit<T>(sources: qt.ObservableInput<T>[]) {
  return (subscriber: Subscriber<T>) => {
    let subscriptions: Subscription[] = []
    for (
      let i = 0;
      subscriptions && !subscriber.closed && i < sources.length;
      i++
    ) {
      subscriptions.push(
        innerFrom(sources[i] as qt.ObservableInput<T>).subscribe(
          createOperatorSubscriber(subscriber, value => {
            if (subscriptions) {
              for (let s = 0; s < subscriptions.length; s++) {
                s !== i && subscriptions[s].unsubscribe()
              }
              subscriptions = null!
            }
            subscriber.next(value)
          })
        )
      )
    }
  }
}
export function range(start: number, count?: number): Observable<number>
export function range(
  start: number,
  count: number | undefined,
  scheduler: qt.Scheduler
): Observable<number>
export function range(
  start: number,
  count?: number,
  scheduler?: qt.Scheduler
): Observable<number> {
  if (count == null) {
    count = start
    start = 0
  }
  if (count <= 0) {
    return EMPTY
  }
  const end = count + start
  return new Observable(
    scheduler
      ? subscriber => {
          let n = start
          return scheduler.schedule(function () {
            if (n < end) {
              subscriber.next(n++)
              this.schedule()
            } else {
              subscriber.complete()
            }
          })
        }
      : subscriber => {
          let n = start
          while (n < end && !subscriber.closed) {
            subscriber.next(n++)
          }
          subscriber.complete()
        }
  )
}
export function throwError(errorFactory: () => any): Observable<never>
export function throwError(error: any): Observable<never>
export function throwError(
  errorOrErrorFactory: any,
  scheduler: qt.Scheduler
): Observable<never>
export function throwError(
  errorOrErrorFactory: any,
  scheduler?: qt.Scheduler
): Observable<never> {
  const errorFactory = qu.isFunction(errorOrErrorFactory)
    ? errorOrErrorFactory
    : () => errorOrErrorFactory
  const init = (subscriber: Subscriber<never>) =>
    subscriber.error(errorFactory())
  return new Observable(
    scheduler
      ? subscriber => scheduler.schedule(init as any, 0, subscriber)
      : init
  )
}
export function timer(
  due: number | Date,
  scheduler?: qt.Scheduler
): Observable<0>
export function timer(
  startDue: number | Date,
  intervalDuration: number,
  scheduler?: qt.Scheduler
): Observable<number>
export function timer(
  dueTime: number | Date,
  unused: undefined,
  scheduler?: qt.Scheduler
): Observable<0>
export function timer(
  dueTime: number | Date = 0,
  intervalOrScheduler?: number | qt.Scheduler,
  scheduler: qt.Scheduler = asyncScheduler
): Observable<number> {
  let intervalDuration = -1
  if (intervalOrScheduler != null) {
    if (qu.isScheduler(intervalOrScheduler)) {
      scheduler = intervalOrScheduler
    } else {
      intervalDuration = intervalOrScheduler
    }
  }
  return new Observable(subscriber => {
    let due = qu.isValidDate(dueTime) ? +dueTime - scheduler!.now() : dueTime
    if (due < 0) {
      due = 0
    }
    let n = 0
    return scheduler.schedule(function () {
      if (!subscriber.closed) {
        subscriber.next(n++)
        if (0 <= intervalDuration) {
          this.schedule(undefined, intervalDuration)
        } else {
          subscriber.complete()
        }
      }
    }, due)
  })
}
export function using<T extends qt.ObservableInput<any>>(
  resourceFactory: () => qt.Unsubscribable | void,
  observableFactory: (resource: qt.Unsubscribable | void) => T | void
): Observable<qt.ObservedValueOf<T>> {
  return new Observable<qt.ObservedValueOf<T>>(subscriber => {
    const resource = resourceFactory()
    const result = observableFactory(resource)
    const source = result ? innerFrom(result) : EMPTY
    source.subscribe(subscriber)
    return () => {
      if (resource) {
        resource.unsubscribe()
      }
    }
  })
}
export function zip<A extends readonly unknown[]>(
  sources: [...qt.ObservableInputTuple<A>]
): Observable<A>
export function zip<A extends readonly unknown[], R>(
  sources: [...qt.ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function zip<A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): Observable<A>
export function zip<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [
    ...qt.ObservableInputTuple<A>,
    (...values: A) => R
  ]
): Observable<R>
export function zip(...args: unknown[]): Observable<unknown> {
  const resultSelector = qu.popResultSelector(args)
  const sources = qu.argsOrArgArray(args) as Observable<unknown>[]
  return sources.length
    ? new Observable<unknown[]>(subscriber => {
        let buffers: unknown[][] = sources.map(() => [])
        let completed = sources.map(() => false)
        subscriber.add(() => {
          buffers = completed = null!
        })
        for (
          let sourceIndex = 0;
          !subscriber.closed && sourceIndex < sources.length;
          sourceIndex++
        ) {
          innerFrom(sources[sourceIndex]).subscribe(
            createOperatorSubscriber(
              subscriber,
              value => {
                buffers[sourceIndex].push(value)
                if (buffers.every(buffer => buffer.length)) {
                  const result: any = buffers.map(buffer => buffer.shift()!)
                  subscriber.next(
                    resultSelector ? resultSelector(...result) : result
                  )
                  if (
                    buffers.some((buffer, i) => !buffer.length && completed[i])
                  ) {
                    subscriber.complete()
                  }
                }
              },
              () => {
                completed[sourceIndex] = true
                !buffers[sourceIndex].length && subscriber.complete()
              }
            )
          )
        }
        return () => {
          buffers = completed = null!
        }
      })
    : EMPTY
}
