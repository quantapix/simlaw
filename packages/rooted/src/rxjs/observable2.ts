import {
  ObservableInput,
  SchedulerLike,
  ObservedValueOf,
  ObservableInputTuple,
} from "../types"
import {
  isReadableStreamLike,
  readableStreamLikeToAsyncGenerator,
} from "../util/isReadableStreamLike"

import { animationFrameProvider } from "../../scheduler/animationFrameProvider"
import { AnyCatcher } from "../AnyCatcher"
import { argsArgArrayOrObject } from "../util/argsArgArrayOrObject"
import { argsOrArgArray } from "../util/argsOrArgArray"
import { async as asyncScheduler } from "../scheduler/async"
import { asyncScheduler } from "../scheduler/async"
import { AsyncSubject } from "../AsyncSubject"
import { bindCallbackInternals } from "./bindCallbackInternals"
import { concatAll } from "../operators/concatAll"
import { Connectable, ObservableInput, SubjectLike } from "../types"
import { createInvalidObservableTypeError } from "../util/throwUnobservableError"
import { createObject } from "../util/createObject"
import { createOperatorSubscriber } from "../operators/OperatorSubscriber"
import { defer } from "./defer"
import { EMPTY } from "./empty"
import { executeSchedule } from "../util/executeSchedule"
import { filter } from "../operators/filter"
import { from } from "./from"
import { hasLift } from "../util/lift"
import { identity } from "../util/identity"
import { innerFrom } from "./innerFrom"
import { isArrayLike } from "../util/isArrayLike"
import { isAsyncIterable } from "../util/isAsyncIterable"
import { isFunction } from "../util/isFunction"
import { isInteropObservable } from "../util/isInteropObservable"
import { isIterable } from "../util/isIterable"
import { isPromise } from "../util/isPromise"
import { isScheduler } from "../util/isScheduler"
import { isValidDate } from "../util/isDate"
import { mapOneOrManyArgs } from "../util/mapOneOrManyArgs"
import { mergeAll } from "../operators/mergeAll"
import { mergeMap } from "../operators/mergeMap"
import { NodeEventHandler } from "./fromEvent"
import { noop } from "../util/noop"
import { not } from "../util/not"
import { Observable } from "../../Observable"
import { observable as Symbol_observable } from "../symbol/observable"
import { ObservableInput, ObservableInputTuple, SchedulerLike } from "../types"
import { ObservableInput, ObservedValueOf, ReadableStreamLike } from "../types"
import { observeOn } from "../operators/observeOn"
import { Observer, NextObserver } from "../../types"
import { onErrorResumeNext as onErrorResumeNextWith } from "../operators/onErrorResumeNext"
import { Operator } from "../../Operator"
import { performanceTimestampProvider } from "../../scheduler/performanceTimestampProvider"
import { popNumber, popScheduler } from "../util/args"
import { popResultSelector } from "../util/args"
import { popScheduler } from "../util/args"
import { refCount as higherOrderRefCount } from "../operators/refCount"
import { ReplaySubject } from "../../ReplaySubject"
import { reportUnhandledError } from "../util/reportUnhandledError"
import { scheduled } from "../scheduled/scheduled"
import { scheduleIterable } from "../scheduled/scheduleIterable"
import { SchedulerLike, ValueFromArray } from "../types"
import { Subject, AnonymousSubject } from "../../Subject"
import { Subscribable } from "../types"
import { subscribeOn } from "../operators/subscribeOn"
import { Subscriber } from "../../Subscriber"
import { Subscription } from "../../Subscription"
import { timer } from "./timer"
import { TimestampProvider } from "../../types"
import { Unsubscribable, ObservableInput, ObservedValueOf } from "../types"
import { WebSocketSubject, WebSocketSubjectConfig } from "./WebSocketSubject"

export class ConnectableObservable<T> extends Observable<T> {
  protected _subject: Subject<T> | null = null
  protected _refCount: number = 0
  protected _connection: Subscription | null = null
  constructor(
    public source: Observable<T>,
    protected subjectFactory: () => Subject<T>
  ) {
    super()
    if (hasLift(source)) {
      this.lift = source.lift
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
        this.source.subscribe(
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
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any>
export function bindCallback<
  A extends readonly unknown[],
  R extends readonly unknown[]
>(
  callbackFunc: (...args: [...A, (...res: R) => void]) => void,
  schedulerLike?: SchedulerLike
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindCallback(
  callbackFunc: (...args: [...any[], (...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | SchedulerLike,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<unknown> {
  return bindCallbackInternals(false, callbackFunc, resultSelector, scheduler)
}
export function bindCallbackInternals(
  isNodeStyle: boolean,
  callbackFunc: any,
  resultSelector?: any,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<unknown> {
  if (resultSelector) {
    if (isScheduler(resultSelector)) {
      scheduler = resultSelector
    } else {
      return function (this: any, ...args: any[]) {
        return (
          bindCallbackInternals(isNodeStyle, callbackFunc, scheduler) as any
        )
          .apply(this, args)
          .pipe(mapOneOrManyArgs(resultSelector as any))
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
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any>
export function bindNodeCallback<
  A extends readonly unknown[],
  R extends readonly unknown[]
>(
  callbackFunc: (...args: [...A, (err: any, ...res: R) => void]) => void,
  schedulerLike?: SchedulerLike
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>
export function bindNodeCallback(
  callbackFunc: (...args: [...any[], (err: any, ...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | SchedulerLike,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any> {
  return bindCallbackInternals(true, callbackFunc, resultSelector, scheduler)
}
export function combineLatest<T extends AnyCatcher>(arg: T): Observable<unknown>
export function combineLatest(sources: []): Observable<never>
export function combineLatest<A extends readonly unknown[]>(
  sources: readonly [...ObservableInputTuple<A>]
): Observable<A>
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R,
  scheduler: SchedulerLike
): Observable<R>
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function combineLatest<A extends readonly unknown[]>(
  sources: readonly [...ObservableInputTuple<A>],
  scheduler: SchedulerLike
): Observable<A>
export function combineLatest<A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): Observable<A>
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelectorAndScheduler: [
    ...ObservableInputTuple<A>,
    (...values: A) => R,
    SchedulerLike
  ]
): Observable<R>
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>
export function combineLatest<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): Observable<A>
export function combineLatest(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function combineLatest<T extends Record<string, ObservableInput<any>>>(
  sourcesObject: T
): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>
export function combineLatest<O extends ObservableInput<any>, R>(
  ...args: any[]
): Observable<R> | Observable<ObservedValueOf<O>[]> {
  const scheduler = popScheduler(args)
  const resultSelector = popResultSelector(args)
  const { args: observables, keys } = argsArgArrayOrObject(args)
  if (observables.length === 0) {
    return from([], scheduler as any)
  }
  const result = new Observable<ObservedValueOf<O>[]>(
    combineLatestInit(
      observables as ObservableInput<ObservedValueOf<O>>[],
      scheduler,
      keys ? values => createObject(keys, values) : identity
    )
  )
  return resultSelector
    ? (result.pipe(mapOneOrManyArgs(resultSelector)) as Observable<R>)
    : result
}
export function combineLatestInit(
  observables: ObservableInput<any>[],
  scheduler?: SchedulerLike,
  valueTransform: (values: any[]) => any = identity
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
  scheduler: SchedulerLike | undefined,
  execute: () => void,
  subscription: Subscription
) {
  if (scheduler) {
    executeSchedule(subscription, scheduler, execute)
  } else {
    execute()
  }
}
export function concat<T extends readonly unknown[]>(
  ...inputs: [...ObservableInputTuple<T>]
): Observable<T[number]>
export function concat<T extends readonly unknown[]>(
  ...inputsAndScheduler: [...ObservableInputTuple<T>, SchedulerLike]
): Observable<T[number]>
export function concat(...args: any[]): Observable<unknown> {
  return concatAll()(from(args, popScheduler(args)))
}
export interface ConnectableConfig<T> {
  connector: () => SubjectLike<T>
  resetOnDisconnect?: boolean
}
const DEFAULT_CONFIG: ConnectableConfig<unknown> = {
  connector: () => new Subject<unknown>(),
  resetOnDisconnect: true,
}
export function connectable<T>(
  source: ObservableInput<T>,
  config: ConnectableConfig<T> = DEFAULT_CONFIG
): Connectable<T> {
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
export function defer<R extends ObservableInput<any>>(
  observableFactory: () => R
): Observable<ObservedValueOf<R>> {
  return new Observable<ObservedValueOf<R>>(subscriber => {
    innerFrom(observableFactory()).subscribe(subscriber)
  })
}
export interface WebSocketSubjectConfig<T> {
  url: string
  protocol?: string | Array<string>
  resultSelector?: (e: MessageEvent) => T
  serializer?: (value: T) => WebSocketMessage
  deserializer?: (e: MessageEvent) => T
  openObserver?: NextObserver<Event>
  closeObserver?: NextObserver<CloseEvent>
  closingObserver?: NextObserver<void>
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
    destination?: Observer<T>
  ) {
    super()
    if (urlConfigOrSource instanceof Observable) {
      this.destination = destination
      this.source = urlConfigOrSource as Observable<T>
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
      this.destination = new ReplaySubject()
    }
  }
  lift<R>(operator: Operator<T, R>): WebSocketSubject<R> {
    const sock = new WebSocketSubject<R>(
      this._config as WebSocketSubjectConfig<any>,
      this.destination as any
    )
    sock.operator = operator
    sock.source = this
    return sock
  }
  private _resetState() {
    this._socket = null
    if (!this.source) {
      this.destination = new ReplaySubject()
    }
    this._output = new Subject<T>()
  }
  multiplex(
    subMsg: () => any,
    unsubMsg: () => any,
    messageFilter: (value: T) => boolean
  ) {
    const self = this
    return new Observable((observer: Observer<T>) => {
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
      const queue = this.destination
      this.destination = Subscriber.create<T>(
        x => {
          if (socket!.readyState === 1) {
            try {
              const { serializer } = this._config
              socket!.send(serializer!(x!))
            } catch (e) {
              this.destination!.error(e)
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
        subscription.add(
          (queue as ReplaySubject<T>).subscribe(this.destination)
        )
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
    const { source } = this
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
export function animationFrames(timestampProvider?: TimestampProvider) {
  return timestampProvider
    ? animationFramesFactory(timestampProvider)
    : DEFAULT_ANIMATION_FRAMES
}
function animationFramesFactory(timestampProvider?: TimestampProvider) {
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
    selector: (response: Response) => ObservableInput<T>
  }
): Observable<T>
export function fromFetch(
  input: string | Request,
  init?: RequestInit
): Observable<Response>
export function fromFetch<T>(
  input: string | Request,
  initWithSelector: RequestInit & {
    selector?: (response: Response) => ObservableInput<T>
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
export function empty(scheduler?: SchedulerLike) {
  return scheduler ? emptyScheduled(scheduler) : EMPTY
}
function emptyScheduled(scheduler: SchedulerLike) {
  return new Observable<never>(subscriber =>
    scheduler.schedule(() => subscriber.complete())
  )
}
export function forkJoin<T extends AnyCatcher>(arg: T): Observable<unknown>
export function forkJoin(scheduler: null | undefined): Observable<never>
export function forkJoin(sources: readonly []): Observable<never>
export function forkJoin<A extends readonly unknown[]>(
  sources: readonly [...ObservableInputTuple<A>]
): Observable<A>
export function forkJoin<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function forkJoin<A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): Observable<A>
export function forkJoin<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>
export function forkJoin(sourcesObject: {
  [K in any]: never
}): Observable<never>
export function forkJoin<T extends Record<string, ObservableInput<any>>>(
  sourcesObject: T
): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>
export function forkJoin(...args: any[]): Observable<any> {
  const resultSelector = popResultSelector(args)
  const { args: sources, keys } = argsArgArrayOrObject(args)
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
                subscriber.next(keys ? createObject(keys, values) : values)
              }
              subscriber.complete()
            }
          }
        )
      )
    }
  })
  return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result
}
export function from<O extends ObservableInput<any>>(
  input: O
): Observable<ObservedValueOf<O>>
export function from<O extends ObservableInput<any>>(
  input: O,
  scheduler: SchedulerLike | undefined
): Observable<ObservedValueOf<O>>
export function from<T>(
  input: ObservableInput<T>,
  scheduler?: SchedulerLike
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
  if (isFunction(options)) {
    resultSelector = options
    options = undefined
  }
  if (resultSelector) {
    return fromEvent<T>(
      target,
      eventName,
      options as EventListenerOptions
    ).pipe(mapOneOrManyArgs(resultSelector))
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
    if (isArrayLike(target)) {
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
  return isFunction(target.addListener) && isFunction(target.removeListener)
}
function isJQueryStyleEventEmitter(
  target: any
): target is JQueryStyleEventEmitter<any, any> {
  return isFunction(target.on) && isFunction(target.off)
}
function isEventTarget(target: any): target is HasEventTargetAddRemove<any> {
  return (
    isFunction(target.addEventListener) &&
    isFunction(target.removeEventListener)
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
      mapOneOrManyArgs(resultSelector)
    )
  }
  return new Observable<T | T[]>(subscriber => {
    const handler = (...e: T[]) => subscriber.next(e.length === 1 ? e[0] : e)
    const retValue = addHandler(handler)
    return isFunction(removeHandler)
      ? () => removeHandler(handler, retValue)
      : undefined
  })
}
export function fromSubscribable<T>(subscribable: Subscribable<T>) {
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
  scheduler?: SchedulerLike
}
export interface GenerateOptions<T, S> extends GenerateBaseOptions<S> {
  resultSelector: ResultFunc<S, T>
}
export function generate<T, S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  resultSelector: ResultFunc<S, T>,
  scheduler?: SchedulerLike
): Observable<T>
export function generate<S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  scheduler?: SchedulerLike
): Observable<S>
export function generate<S>(options: GenerateBaseOptions<S>): Observable<S>
export function generate<T, S>(options: GenerateOptions<T, S>): Observable<T>
export function generate<T, S>(
  initialStateOrOptions: S | GenerateOptions<T, S>,
  condition?: ConditionFunc<S>,
  iterate?: IterateFunc<S>,
  resultSelectorOrScheduler?: ResultFunc<S, T> | SchedulerLike,
  scheduler?: SchedulerLike
): Observable<T> {
  let resultSelector: ResultFunc<S, T>
  let initialState: S

  if (arguments.length === 1) {
    ;({
      initialState,
      condition,
      iterate,
      resultSelector = identity as ResultFunc<S, T>,
      scheduler,
    } = initialStateOrOptions as GenerateOptions<T, S>)
  } else {
    initialState = initialStateOrOptions as S
    if (!resultSelectorOrScheduler || isScheduler(resultSelectorOrScheduler)) {
      resultSelector = identity as ResultFunc<S, T>
      scheduler = resultSelectorOrScheduler as SchedulerLike
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
      : gen) as () => ObservableInput<T>
  )
}
export function iif<T, F>(
  condition: () => boolean,
  trueResult: ObservableInput<T>,
  falseResult: ObservableInput<F>
): Observable<T | F> {
  return defer(() => (condition() ? trueResult : falseResult))
}
export function innerFrom<O extends ObservableInput<any>>(
  input: O
): Observable<ObservedValueOf<O>>
export function innerFrom<T>(input: ObservableInput<T>): Observable<T> {
  if (input instanceof Observable) {
    return input
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input)
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input)
    }
    if (isPromise(input)) {
      return fromPromise(input)
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input)
    }
    if (isIterable(input)) {
      return fromIterable(input)
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input)
    }
  }
  throw createInvalidObservableTypeError(input)
}
export function fromInteropObservable<T>(obj: any) {
  return new Observable((subscriber: Subscriber<T>) => {
    const obs = obj[Symbol_observable]()
    if (isFunction(obs.subscribe)) {
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
      .then(null, reportUnhandledError)
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
  readableStream: ReadableStreamLike<T>
) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream))
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
  scheduler: SchedulerLike = asyncScheduler
): Observable<number> {
  if (period < 0) {
    period = 0
  }
  return timer(period, period, scheduler)
}
export function merge<A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...ObservableInputTuple<A>, number?]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike?]
): Observable<A[number]>
export function merge<A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [
    ...ObservableInputTuple<A>,
    number?,
    SchedulerLike?
  ]
): Observable<A[number]>
export function merge(
  ...args: (ObservableInput<unknown> | number | SchedulerLike)[]
): Observable<unknown> {
  const scheduler = popScheduler(args)
  const concurrent = popNumber(args, Infinity)
  const sources = args as ObservableInput<unknown>[]
  return !sources.length
    ? EMPTY
    : sources.length === 1
    ? innerFrom(sources[0])
    : mergeAll(concurrent)(from(sources, scheduler))
}
export const NEVER = new Observable<never>(noop)
export function never() {
  return NEVER
}
export function of(value: null): Observable<null>
export function of(value: undefined): Observable<undefined>
export function of(scheduler: SchedulerLike): Observable<never>
export function of<A extends readonly unknown[]>(
  ...valuesAndScheduler: [...A, SchedulerLike]
): Observable<ValueFromArray<A>>
export function of(): Observable<never>
export function of<T>(): Observable<T>
export function of<T>(value: T): Observable<T>
export function of<A extends readonly unknown[]>(
  ...values: A
): Observable<ValueFromArray<A>>
export function of<T>(...args: Array<T | SchedulerLike>): Observable<T> {
  const scheduler = popScheduler(args)
  return from(args as T[], scheduler)
}
export function onErrorResumeNext<A extends readonly unknown[]>(
  sources: [...ObservableInputTuple<A>]
): Observable<A[number]>
export function onErrorResumeNext<A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): Observable<A[number]>
export function onErrorResumeNext<A extends readonly unknown[]>(
  ...sources: [[...ObservableInputTuple<A>]] | [...ObservableInputTuple<A>]
): Observable<A[number]> {
  return onErrorResumeNextWith(argsOrArgArray(sources))(EMPTY)
}
export function pairs<T>(
  arr: readonly T[],
  scheduler?: SchedulerLike
): Observable<[string, T]>
export function pairs<O extends Record<string, unknown>>(
  obj: O,
  scheduler?: SchedulerLike
): Observable<[keyof O, O[keyof O]]>
export function pairs<T>(
  iterable: Iterable<T>,
  scheduler?: SchedulerLike
): Observable<[string, T]>
export function pairs(
  n: number | bigint | boolean | ((...args: any[]) => any) | symbol,
  scheduler?: SchedulerLike
): Observable<[never, never]>
export function pairs(obj: any, scheduler?: SchedulerLike) {
  return from(Object.entries(obj), scheduler as any)
}
export function partition<T, U extends T, A>(
  source: ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => value is U,
  thisArg: A
): [Observable<U>, Observable<Exclude<T, U>>]
export function partition<T, U extends T>(
  source: ObservableInput<T>,
  predicate: (value: T, index: number) => value is U
): [Observable<U>, Observable<Exclude<T, U>>]
export function partition<T, A>(
  source: ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): [Observable<T>, Observable<T>]
export function partition<T>(
  source: ObservableInput<T>,
  predicate: (value: T, index: number) => boolean
): [Observable<T>, Observable<T>]
export function partition<T>(
  source: ObservableInput<T>,
  predicate: (this: any, value: T, index: number) => boolean,
  thisArg?: any
): [Observable<T>, Observable<T>] {
  return [
    filter(predicate, thisArg)(innerFrom(source)),
    filter(not(predicate, thisArg))(innerFrom(source)),
  ] as [Observable<T>, Observable<T>]
}
export function race<T extends readonly unknown[]>(
  inputs: [...ObservableInputTuple<T>]
): Observable<T[number]>
export function race<T extends readonly unknown[]>(
  ...inputs: [...ObservableInputTuple<T>]
): Observable<T[number]>
export function race<T>(
  ...sources: (ObservableInput<T> | ObservableInput<T>[])[]
): Observable<any> {
  sources = argsOrArgArray(sources)

  return sources.length === 1
    ? innerFrom(sources[0] as ObservableInput<T>)
    : new Observable<T>(raceInit(sources as ObservableInput<T>[]))
}
export function raceInit<T>(sources: ObservableInput<T>[]) {
  return (subscriber: Subscriber<T>) => {
    let subscriptions: Subscription[] = []

    for (
      let i = 0;
      subscriptions && !subscriber.closed && i < sources.length;
      i++
    ) {
      subscriptions.push(
        innerFrom(sources[i] as ObservableInput<T>).subscribe(
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
  scheduler: SchedulerLike
): Observable<number>
export function range(
  start: number,
  count?: number,
  scheduler?: SchedulerLike
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
  scheduler: SchedulerLike
): Observable<never>
export function throwError(
  errorOrErrorFactory: any,
  scheduler?: SchedulerLike
): Observable<never> {
  const errorFactory = isFunction(errorOrErrorFactory)
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
  scheduler?: SchedulerLike
): Observable<0>
export function timer(
  startDue: number | Date,
  intervalDuration: number,
  scheduler?: SchedulerLike
): Observable<number>
export function timer(
  dueTime: number | Date,
  unused: undefined,
  scheduler?: SchedulerLike
): Observable<0>
export function timer(
  dueTime: number | Date = 0,
  intervalOrScheduler?: number | SchedulerLike,
  scheduler: SchedulerLike = asyncScheduler
): Observable<number> {
  let intervalDuration = -1
  if (intervalOrScheduler != null) {
    if (isScheduler(intervalOrScheduler)) {
      scheduler = intervalOrScheduler
    } else {
      intervalDuration = intervalOrScheduler
    }
  }
  return new Observable(subscriber => {
    let due = isValidDate(dueTime) ? +dueTime - scheduler!.now() : dueTime
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
export function using<T extends ObservableInput<any>>(
  resourceFactory: () => Unsubscribable | void,
  observableFactory: (resource: Unsubscribable | void) => T | void
): Observable<ObservedValueOf<T>> {
  return new Observable<ObservedValueOf<T>>(subscriber => {
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
  sources: [...ObservableInputTuple<A>]
): Observable<A>
export function zip<A extends readonly unknown[], R>(
  sources: [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>
export function zip<A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): Observable<A>
export function zip<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>
export function zip(...args: unknown[]): Observable<unknown> {
  const resultSelector = popResultSelector(args)
  const sources = argsOrArgArray(args) as Observable<unknown>[]
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
