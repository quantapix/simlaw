import { animationFrameProvider } from "./scheduler.js"
import { async as asyncScheduler } from "./scheduler.js"
import { asyncScheduler } from "./scheduler.js"
import { AsyncSubject } from "./subject.js"
import { Subscription } from "./subscription.js"
import type { Operator } from "./operator.js"
import { performanceTimestampProvider } from "./scheduler.js"
import * as qu from "./utils.js"
import { refCount as higherOrderRefCount } from "./operator.js"
import { ReplaySubject } from "./subject.js"
import { SafeSubscriber, Subscriber } from "./subscriber.js"
import { scheduled, scheduleIterable } from "./scheduled.js"
import { Subject, AnonymousSubject } from "./subject.js"
import { subscribeOn } from "./operator.js"
import type * as qt from "./types.js"
import {
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
  operator: Operator<any, T> | undefined
  constructor(
    subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => qt.Teardown
  ) {
    if (subscribe) {
      this._subscribe = subscribe
    }
  }
  static create: (...args: any[]) => any = <T>(
    subscribe?: (subscriber: Subscriber<T>) => qt.Teardown
  ) => {
    return new Observable<T>(subscribe)
  }
  lift<R>(operator?: Operator<T, R>): Observable<R> {
    const observable = new Observable<R>()
    observable.src = this
    observable.operator = operator
    return observable
  }
  subscribe(observer?: Partial<qt.Observer<T>>): Subscription
  subscribe(next: (value: T) => void): Subscription
  subscribe(
    next?: ((value: T) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null
  ): Subscription
  subscribe(
    observerOrNext?: Partial<qt.Observer<T>> | ((value: T) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null
  ): Subscription {
    const subscriber = isSubscriber(observerOrNext)
      ? observerOrNext
      : new SafeSubscriber(observerOrNext, error, complete)
    qu.errorContext(() => {
      const { operator, src: source } = this
      subscriber.add(
        operator
          ? operator.call(subscriber, source)
          : source
          ? this._subscribe(subscriber)
          : this._trySubscribe(subscriber)
      )
    })
    return subscriber
  }
  protected _trySubscribe(sink: Subscriber<T>): qt.Teardown {
    try {
      return this._subscribe(sink)
    } catch (err) {
      sink.error(err)
    }
  }
  forEach(next: (value: T) => void): Promise<void>
  forEach(
    next: (value: T) => void,
    promiseCtor: PromiseConstructorLike
  ): Promise<void>
  forEach(
    next: (value: T) => void,
    promiseCtor?: PromiseConstructorLike
  ): Promise<void> {
    promiseCtor = getPromiseCtor(promiseCtor)
    return new promiseCtor<void>((resolve, reject) => {
      const subscriber = new SafeSubscriber<T>({
        next: value => {
          try {
            next(value)
          } catch (err) {
            reject(err)
            subscriber.unsubscribe()
          }
        },
        error: reject,
        complete: resolve,
      })
      this.subscribe(subscriber)
    }) as Promise<void>
  }
  protected _subscribe(subscriber: Subscriber<any>): qt.Teardown {
    return this.src?.subscribe(subscriber)
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
    ...operations: qt.OperatorFunction<any, any>[]
  ): Observable<unknown>
  pipe(...operations: qt.OperatorFunction<any, any>[]): Observable<any> {
    return qu.pipeFromArray(operations)(this)
  }
  toPromise(): Promise<T | undefined>
  toPromise(PromiseCtor: typeof Promise): Promise<T | undefined>
  toPromise(PromiseCtor: PromiseConstructorLike): Promise<T | undefined>
  toPromise(promiseCtor?: PromiseConstructorLike): Promise<T | undefined> {
    promiseCtor = getPromiseCtor(promiseCtor)
    return new promiseCtor((resolve, reject) => {
      let value: T | undefined
      this.subscribe(
        (x: T) => (value = x),
        (err: any) => reject(err),
        () => resolve(value)
      )
    }) as Promise<T | undefined>
  }
}

export class ConnectableObservable<T> extends Observable<T> {
  protected _subject: Subject<T> | null = null
  protected _refCount: number = 0
  protected _connection: Subscription | null = null
  constructor(
    public src: Observable<T>,
    protected subjectFactory: () => Subject<T>
  ) {
    super()
    if (qu.hasLift(src)) {
      this.lift = src.lift
    }
  }
  protected _subscribe(subscriber: Subscriber<T>) {
    return this.getSubject().subscribe(subscriber)
  }
  protected getSubject(): Subject<T> {
    const subject = this._subject
    if (!subject || subject.isStopped) {
      this._subject = this.subjectFactory()
    }
    return this._subject!
  }
  protected _teardown() {
    this._refCount = 0
    const { _connection } = this
    this._subject = this._connection = null
    _connection?.unsubscribe()
  }
  connect(): Subscription {
    let connection = this._connection
    if (!connection) {
      connection = this._connection = new Subscription()
      const subject = this.getSubject()
      connection.add(
        this.src.subscribe(
          createOperatorSubscriber(
            subject as any,
            undefined,
            () => {
              this._teardown()
              subject.complete()
            },
            err => {
              this._teardown()
              subject.error(err)
            },
            () => this._teardown()
          )
        )
      )
      if (connection.closed) {
        this._connection = null
        connection = Subscription.EMPTY
      }
    }
    return connection
  }
  refCount(): Observable<T> {
    return higherOrderRefCount()(this) as Observable<T>
  }
}
export function bindCallback(
  callbackFunc: (...args: any[]) => void,
  resultSelector: (...args: any[]) => any,
  scheduler?: qt.Scheduler
): (...args: any[]) => Observable<any>
export function bindCallback<
  A extends readonly unknown[],
  R extends readonly unknown[]
>(
  callbackFunc: (...args: [...A, (...res: R) => void]) => void,
  scheduler?: qt.Scheduler
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindCallback(
  callbackFunc: (...args: [...any[], (...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | qt.Scheduler,
  scheduler?: qt.Scheduler
): (...args: any[]) => Observable<unknown> {
  return bindCallbackInternals(false, callbackFunc, resultSelector, scheduler)
}
export function bindCallbackInternals(
  isNodeStyle: boolean,
  callbackFunc: any,
  resultSelector?: any,
  scheduler?: qt.Scheduler
): (...args: any[]) => Observable<unknown> {
  if (resultSelector) {
    if (qu.isScheduler(resultSelector)) {
      scheduler = resultSelector
    } else {
      return function (this: any, ...args: any[]) {
        return (
          bindCallbackInternals(isNodeStyle, callbackFunc, scheduler) as any
        )
          .apply(this, args)
          .pipe(qu.mapOneOrManyArgs(resultSelector as any))
      }
    }
  }

  if (scheduler) {
    return function (this: any, ...args: any[]) {
      return (bindCallbackInternals(isNodeStyle, callbackFunc) as any)
        .apply(this, args)
        .pipe(subscribeOn(scheduler!), observeOn(scheduler!))
    }
  }
  return function (this: any, ...args: any[]): Observable<any> {
    const subject = new AsyncSubject<any>()

    let uninitialized = true
    return new Observable(subscriber => {
      const subs = subject.subscribe(subscriber)
      if (uninitialized) {
        uninitialized = false

        let isAsync = false

        let isComplete = false

        callbackFunc.apply(this, [
          ...args,

          (...results: any[]) => {
            if (isNodeStyle) {
              const err = results.shift()
              if (err != null) {
                subject.error(err)

                return
              }
            }

            subject.next(1 < results.length ? results : results[0])

            isComplete = true

            if (isAsync) {
              subject.complete()
            }
          },
        ])

        if (isComplete) {
          subject.complete()
        }

        isAsync = true
      }

      return subs
    })
  }
}
export function bindNodeCallback(
  callbackFunc: (...args: any[]) => void,
  resultSelector: (...args: any[]) => any,
  scheduler?: qt.Scheduler
): (...args: any[]) => Observable<any>
export function bindNodeCallback<
  A extends readonly unknown[],
  R extends readonly unknown[]
>(
  callbackFunc: (...args: [...A, (err: any, ...res: R) => void]) => void,
  scheduler?: qt.Scheduler
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindNodeCallback(
  callbackFunc: (...args: [...any[], (err: any, ...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | qt.Scheduler,
  scheduler?: qt.Scheduler
): (...args: any[]) => Observable<any> {
  return bindCallbackInternals(true, callbackFunc, resultSelector, scheduler)
}
export function combineLatest<T extends qt.AnyCatcher>(
  arg: T
): Observable<unknown>
export function combineLatest(sources: []): Observable<never>
export function combineLatest<A extends readonly unknown[]>(
  sources: readonly [...qt.ObservableInputTuple<A>]
): Observable<A>
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...qt.ObservableInputTuple<A>],
  resultSelector: (...values: A) => R,
  scheduler: qt.Scheduler
): Observable<R>
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...qt.ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function combineLatest<A extends readonly unknown[]>(
  sources: readonly [...qt.ObservableInputTuple<A>],
  scheduler: qt.Scheduler
): Observable<A>
export function combineLatest<A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): Observable<A>
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelectorAndScheduler: [
    ...qt.ObservableInputTuple<A>,
    (...values: A) => R,
    qt.Scheduler
  ]
): Observable<R>
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [
    ...qt.ObservableInputTuple<A>,
    (...values: A) => R
  ]
): Observable<R>
export function combineLatest<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...qt.ObservableInputTuple<A>, qt.Scheduler]
): Observable<A>
export function combineLatest(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function combineLatest<
  T extends Record<string, qt.ObservableInput<any>>
>(sourcesObject: T): Observable<{ [K in keyof T]: qt.ObservedValueOf<T[K]> }>
export function combineLatest<O extends qt.ObservableInput<any>, R>(
  ...args: any[]
): Observable<R> | Observable<qt.ObservedValueOf<O>[]> {
  const scheduler = qu.popScheduler(args)
  const resultSelector = qu.popResultSelector(args)
  const { args: observables, keys } = qu.argsArgArrayOrObject(args)
  if (observables.length === 0) {
    return from([], scheduler as any)
  }
  const result = new Observable<qt.ObservedValueOf<O>[]>(
    combineLatestInit(
      observables as qt.ObservableInput<qt.ObservedValueOf<O>>[],
      scheduler,
      keys ? values => qu.createObject(keys, values) : qu.identity
    )
  )
  return resultSelector
    ? (result.pipe(qu.mapOneOrManyArgs(resultSelector)) as Observable<R>)
    : result
}
export function combineLatestInit(
  observables: qt.ObservableInput<any>[],
  scheduler?: qt.Scheduler,
  valueTransform: (values: any[]) => any = qu.identity
) {
  return (subscriber: Subscriber<any>) => {
    maybeSchedule(
      scheduler,
      () => {
        const { length } = observables

        const values = new Array(length)

        let active = length

        let remainingFirstValues = length

        for (let i = 0; i < length; i++) {
          maybeSchedule(
            scheduler,
            () => {
              const source = from(observables[i], scheduler as any)
              let hasFirstValue = false
              source.subscribe(
                createOperatorSubscriber(
                  subscriber,
                  value => {
                    values[i] = value
                    if (!hasFirstValue) {
                      hasFirstValue = true
                      remainingFirstValues--
                    }
                    if (!remainingFirstValues) {
                      subscriber.next(valueTransform(values.slice()))
                    }
                  },
                  () => {
                    if (!--active) {
                      subscriber.complete()
                    }
                  }
                )
              )
            },
            subscriber
          )
        }
      },
      subscriber
    )
  }
}
function maybeSchedule(
  scheduler: qt.Scheduler | undefined,
  execute: () => void,
  subscription: Subscription
) {
  if (scheduler) {
    qu.executeSchedule(subscription, scheduler, execute)
  } else {
    execute()
  }
}
export function concat<T extends readonly unknown[]>(
  ...inputs: [...qt.ObservableInputTuple<T>]
): Observable<T[number]>
export function concat<T extends readonly unknown[]>(
  ...inputsAndScheduler: [...qt.ObservableInputTuple<T>, qt.Scheduler]
): Observable<T[number]>
export function concat(...args: any[]): Observable<unknown> {
  return concatAll()(from(args, qu.popScheduler(args)))
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
  source: qt.ObservableInput<T>,
  config: ConnectableConfig<T> = DEFAULT_CONFIG
): qt.Connectable<T> {
  let connection: Subscription | null = null
  const { connector, resetOnDisconnect = true } = config
  let subject = connector()
  const result: any = new Observable<T>(subscriber => {
    return subject.subscribe(subscriber)
  })
  result.connect = () => {
    if (!connection || connection.closed) {
      connection = defer(() => source).subscribe(subject)
      if (resetOnDisconnect) {
        connection.add(() => (subject = connector()))
      }
    }
    return connection
  }
  return result
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
  lift<R>(operator: Operator<T, R>): WebSocketSubject<R> {
    const sock = new WebSocketSubject<R>(
      this._config as WebSocketSubjectConfig<any>,
      this.dest as any
    )
    sock.operator = operator
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
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
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
  unsubscribe() {
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
