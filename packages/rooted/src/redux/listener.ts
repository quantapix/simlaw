import * as qu from "./utils.js"
import {
  createAction,
  PayloadAction,
  BaseActionCreator,
  qt.SerializedError,
} from "./create.js"
import type * as qt from "./types.js"

const task = "task"
const listener = "listener"
const completed = "completed"
const cancelled = "cancelled"
export const taskCancelled = `task-${cancelled}` as const
export const taskCompleted = `task-${completed}` as const
export const listenerCancelled = `${listener}-${cancelled}` as const
export const listenerCompleted = `${listener}-${completed}` as const
export class TaskAbortError implements qt.SerializedError {
  name = "TaskAbortError"
  message: string
  constructor(public code: string | undefined) {
    this.message = `${task} ${cancelled} (reason: ${code})`
  }
}
const { assign } = Object
const INTERNAL_NIL_TOKEN = {} as const
const alm = "listenerMiddleware" as const
const createFork = (parentAbortSignal: AbortSignalWithReason<unknown>) => {
  const linkControllers = (controller: AbortController) =>
    addAbortSignalListener(parentAbortSignal, () =>
      abortControllerWithReason(controller, parentAbortSignal.reason)
    )
  return <T>(taskExecutor: ForkedTaskExecutor<T>): ForkedTask<T> => {
    assertFunction(taskExecutor, "taskExecutor")
    const childAbortController = new AbortController()
    linkControllers(childAbortController)
    const result = runTask<T>(
      async (): Promise<T> => {
        validateActive(parentAbortSignal)
        validateActive(childAbortController.signal)
        const result = (await taskExecutor({
          pause: createPause(childAbortController.signal),
          delay: createDelay(childAbortController.signal),
          signal: childAbortController.signal,
        })) as T
        validateActive(childAbortController.signal)
        return result
      },
      () => abortControllerWithReason(childAbortController, taskCompleted)
    )
    return {
      result: createPause<TaskResult<T>>(parentAbortSignal)(result),
      cancel() {
        abortControllerWithReason(childAbortController, taskCancelled)
      },
    }
  }
}
const createTakePattern = <S>(
  startListening: AddListenerOverloads<
    UnsubscribeListener,
    S,
    qt.Dispatch<qt.AnyAction>
  >,
  signal: AbortSignal
): TakePattern<S> => {
  const take = async <P extends AnyListenerPredicate<S>>(
    predicate: P,
    timeout: number | undefined
  ) => {
    validateActive(signal)
    let unsubscribe: UnsubscribeListener = () => {}
    const tuplePromise = new Promise<[qt.AnyAction, S, S]>(resolve => {
      unsubscribe = startListening({
        predicate: predicate as any,
        effect: (action, listenerApi): void => {
          listenerApi.unsubscribe()
          resolve([
            action,
            listenerApi.getState(),
            listenerApi.getOriginalState(),
          ])
        },
      })
    })
    const promises: (Promise<null> | Promise<[qt.AnyAction, S, S]>)[] = [
      promisifyAbortSignal(signal),
      tuplePromise,
    ]
    if (timeout != null) {
      promises.push(
        new Promise<null>(resolve => setTimeout(resolve, timeout, null))
      )
    }
    try {
      const output = await Promise.race(promises)
      validateActive(signal)
      return output
    } finally {
      unsubscribe()
    }
  }
  return ((predicate: AnyListenerPredicate<S>, timeout: number | undefined) =>
    catchRejection(take(predicate, timeout))) as TakePattern<S>
}
const getListenerEntryPropsFrom = (options: FallbackAddListenerOptions) => {
  let { type, actionCreator, matcher, predicate, effect } = options
  if (type) {
    predicate = createAction(type).match
  } else if (actionCreator) {
    type = actionCreator!.type
    predicate = actionCreator.match
  } else if (matcher) {
    predicate = matcher
  } else if (predicate) {

  } else {
    throw new Error(
      "Creating or removing a listener requires one of the known fields for matching an action"
    )
  }
  assertFunction(effect, "options.listener")
  return { predicate, type, effect }
}
export const createListenerEntry: TypedCreateListenerEntry<unknown> = (
  options: FallbackAddListenerOptions
) => {
  const { type, predicate, effect } = getListenerEntryPropsFrom(options)
  const id = qu.nanoid()
  const entry: ListenerEntry<unknown> = {
    id,
    effect,
    type,
    predicate,
    pending: new Set<AbortController>(),
    unsubscribe: () => {
      throw new Error("Unsubscribe not initialized")
    },
  }
  return entry
}
const createClearListenerMiddleware = (
  listenerMap: Map<string, ListenerEntry>
) => {
  return () => {
    listenerMap.forEach(cancelActiveListeners)
    listenerMap.clear()
  }
}
const safelyNotifyError = (
  errorHandler: ListenerErrorHandler,
  errorToNotify: unknown,
  errorInfo: ListenerErrorInfo
): void => {
  try {
    errorHandler(errorToNotify, errorInfo)
  } catch (errorHandlerError) {
    setTimeout(() => {
      throw errorHandlerError
    }, 0)
  }
}
export const addListener = createAction(
  `${alm}/add`
) as TypedAddListener<unknown>
export const clearAllListeners = createAction(`${alm}/removeAll`)
export const removeListener = createAction(
  `${alm}/remove`
) as TypedRemoveListener<unknown>
const defaultErrorHandler: ListenerErrorHandler = (...args: unknown[]) => {
  console.error(`${alm}/error`, ...args)
}
const cancelActiveListeners = (
  entry: ListenerEntry<unknown, qt.Dispatch<qt.AnyAction>>
) => {
  entry.pending.forEach(controller => {
    abortControllerWithReason(controller, listenerCancelled)
  })
}
export function createListenerMiddleware<
  S = unknown,
  D extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    S,
    unknown,
    qt.AnyAction
  >,
  ExtraArgument = unknown
>(middlewareOptions: CreateListenerMiddlewareOptions<ExtraArgument> = {}) {
  const listenerMap = new Map<string, ListenerEntry>()
  const { extra, onError = defaultErrorHandler } = middlewareOptions
  assertFunction(onError, "onError")
  const insertEntry = (entry: ListenerEntry) => {
    entry.unsubscribe = () => listenerMap.delete(entry!.id)
    listenerMap.set(entry.id, entry)
    return (cancelOptions?: UnsubscribeListenerOptions) => {
      entry.unsubscribe()
      if (cancelOptions?.cancelActive) {
        cancelActiveListeners(entry)
      }
    }
  }
  const findListenerEntry = (
    comparator: (entry: ListenerEntry) => boolean
  ): ListenerEntry | undefined => {
    for (const entry of Array.from(listenerMap.values())) {
      if (comparator(entry)) {
        return entry
      }
    }
    return undefined
  }
  const startListening = (options: FallbackAddListenerOptions) => {
    let entry = findListenerEntry(
      existingEntry => existingEntry.effect === options.effect
    )
    if (!entry) {
      entry = createListenerEntry(options as any)
    }
    return insertEntry(entry)
  }
  const stopListening = (
    options: FallbackAddListenerOptions & UnsubscribeListenerOptions
  ): boolean => {
    const { type, effect, predicate } = getListenerEntryPropsFrom(options)
    const entry = findListenerEntry(entry => {
      const matchPredicateOrType =
        typeof type === "string"
          ? entry.type === type
          : entry.predicate === predicate
      return matchPredicateOrType && entry.effect === effect
    })
    if (entry) {
      entry.unsubscribe()
      if (options.cancelActive) {
        cancelActiveListeners(entry)
      }
    }
    return !!entry
  }
  const notifyListener = async (
    entry: ListenerEntry<unknown, qt.Dispatch<qt.AnyAction>>,
    action: qt.AnyAction,
    api: qt.MiddlewareAPI,
    getOriginalState: () => S
  ) => {
    const internalTaskController = new AbortController()
    const take = createTakePattern(
      startListening,
      internalTaskController.signal
    )
    try {
      entry.pending.add(internalTaskController)
      await Promise.resolve(
        entry.effect(
          action,

          assign({}, api, {
            getOriginalState,
            condition: (
              predicate: AnyListenerPredicate<any>,
              timeout?: number
            ) => take(predicate, timeout).then(Boolean),
            take,
            delay: createDelay(internalTaskController.signal),
            pause: createPause<any>(internalTaskController.signal),
            extra,
            signal: internalTaskController.signal,
            fork: createFork(internalTaskController.signal),
            unsubscribe: entry.unsubscribe,
            subscribe: () => {
              listenerMap.set(entry.id, entry)
            },
            cancelActiveListeners: () => {
              entry.pending.forEach((controller, _, set) => {
                if (controller !== internalTaskController) {
                  abortControllerWithReason(controller, listenerCancelled)
                  set.delete(controller)
                }
              })
            },
          })
        )
      )
    } catch (listenerError) {
      if (!(listenerError instanceof TaskAbortError)) {
        safelyNotifyError(onError, listenerError, {
          raisedBy: "effect",
        })
      }
    } finally {
      abortControllerWithReason(internalTaskController, listenerCompleted)
      entry.pending.delete(internalTaskController)
    }
  }
  const clearListenerMiddleware = createClearListenerMiddleware(listenerMap)
  const middleware: ListenerMiddleware<S, D, ExtraArgument> =
    api => next => action => {
      if (addListener.match(action)) {
        return startListening(action.payload)
      }
      if (clearAllListeners.match(action)) {
        clearListenerMiddleware()
        return
      }
      if (removeListener.match(action)) {
        return stopListening(action.payload)
      }
      let originalState: S | typeof INTERNAL_NIL_TOKEN = api.getState()
      const getOriginalState = (): S => {
        if (originalState === INTERNAL_NIL_TOKEN) {
          throw new Error(
            `${alm}: getOriginalState can only be called synchronously`
          )
        }
        return originalState as S
      }
      let result: unknown
      try {
        result = next(action)
        if (listenerMap.size > 0) {
          const currentState = api.getState()
          const listenerEntries = Array.from(listenerMap.values())
          for (const entry of listenerEntries) {
            let runListener = false
            try {
              runListener = entry.predicate(action, currentState, originalState)
            } catch (predicateError) {
              runListener = false
              safelyNotifyError(onError, predicateError, {
                raisedBy: "predicate",
              })
            }
            if (!runListener) {
              continue
            }
            notifyListener(entry, action, api, getOriginalState)
          }
        }
      } finally {
        originalState = INTERNAL_NIL_TOKEN
      }
      return result
    }
  return {
    middleware,
    startListening,
    stopListening,
    clearListeners: clearListenerMiddleware,
  } as ListenerMiddlewareInstance<S, D, ExtraArgument>
}
export const validateActive = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new TaskAbortError((signal as AbortSignalWithReason<string>).reason)
  }
}
export const promisifyAbortSignal = (
  signal: AbortSignalWithReason<string>
): Promise<never> => {
  return catchRejection(
    new Promise<never>((_, reject) => {
      const notifyRejection = () => reject(new TaskAbortError(signal.reason))
      if (signal.aborted) {
        notifyRejection()
      } else {
        addAbortSignalListener(signal, notifyRejection)
      }
    })
  )
}
export const runTask = async <T>(
  task: () => Promise<T>,
  cleanUp?: () => void
): Promise<TaskResult<T>> => {
  try {
    await Promise.resolve()
    const value = await task()
    return {
      status: "ok",
      value,
    }
  } catch (error: any) {
    return {
      status: error instanceof TaskAbortError ? "cancelled" : "rejected",
      error,
    }
  } finally {
    cleanUp?.()
  }
}
export const createPause = <T>(signal: AbortSignal) => {
  return (promise: Promise<T>): Promise<T> => {
    return catchRejection(
      Promise.race([promisifyAbortSignal(signal), promise]).then(output => {
        validateActive(signal)
        return output
      })
    )
  }
}
export const createDelay = (signal: AbortSignal) => {
  const pause = createPause<void>(signal)
  return (timeoutMs: number): Promise<void> => {
    return pause(new Promise<void>(resolve => setTimeout(resolve, timeoutMs)))
  }
}
export type AbortSignalWithReason<T> = AbortSignal & { reason?: T }
export interface TypedActionCreator<Type extends string> {
  (...args: any[]): qt.Action<Type>
  type: Type
  match: MatchFunction<any>
}
export type AnyListenerPredicate<State> = (
  action: qt.AnyAction,
  currentState: State,
  originalState: State
) => boolean
export type ListenerPredicate<Action extends qt.AnyAction, State> = (
  action: qt.AnyAction,
  currentState: State,
  originalState: State
) => action is Action
export interface ConditionFunction<State> {
  (predicate: AnyListenerPredicate<State>, timeout?: number): Promise<boolean>
  (predicate: AnyListenerPredicate<State>, timeout?: number): Promise<boolean>
  (predicate: () => boolean, timeout?: number): Promise<boolean>
}
export type MatchFunction<T> = (v: any) => v is T
export interface ForkedTaskAPI {
  pause<W>(waitFor: Promise<W>): Promise<W>
  delay(timeoutMs: number): Promise<void>
  signal: AbortSignal
}
export interface AsyncTaskExecutor<T> {
  (forkApi: ForkedTaskAPI): Promise<T>
}
export interface SyncTaskExecutor<T> {
  (forkApi: ForkedTaskAPI): T
}
export type ForkedTaskExecutor<T> = AsyncTaskExecutor<T> | SyncTaskExecutor<T>
export type TaskResolved<T> = {
  readonly status: "ok"
  readonly value: T
}
export type TaskRejected = {
  readonly status: "rejected"
  readonly error: unknown
}
export type TaskCancelled = {
  readonly status: "cancelled"
  readonly error: TaskAbortError
}
export type TaskResult<Value> =
  | TaskResolved<Value>
  | TaskRejected
  | TaskCancelled
export interface ForkedTask<T> {
  result: Promise<TaskResult<T>>
  cancel(): void
}
export interface ListenerEffectAPI<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction>,
  ExtraArgument = unknown
> extends qt.MiddlewareAPI<Dispatch, State> {
  getOriginalState: () => State
  unsubscribe(): void
  subscribe(): void
  condition: ConditionFunction<State>
  take: TakePattern<State>
  cancelActiveListeners: () => void
  signal: AbortSignal
  delay(timeoutMs: number): Promise<void>
  fork<T>(executor: ForkedTaskExecutor<T>): ForkedTask<T>
  pause<M>(promise: Promise<M>): Promise<M>
  extra: ExtraArgument
}
export type ListenerEffect<
  Action extends qt.AnyAction,
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction>,
  ExtraArgument = unknown
> = (
  action: Action,
  api: ListenerEffectAPI<State, Dispatch, ExtraArgument>
) => void | Promise<void>
export interface ListenerErrorInfo {
  raisedBy: "effect" | "predicate"
}
export interface ListenerErrorHandler {
  (error: unknown, errorInfo: ListenerErrorInfo): void
}
export interface CreateListenerMiddlewareOptions<ExtraArgument = unknown> {
  extra?: ExtraArgument
  onError?: ListenerErrorHandler
}
export type ListenerMiddleware<
  State = unknown,
  Dispatch extends qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  > = qt.ThunkDispatch<State, unknown, qt.AnyAction>,
  ExtraArgument = unknown
> = qt.Middleware<
  {
    (action: qt.Action<"listenerMiddleware/add">): UnsubscribeListener
  },
  State,
  Dispatch
>
export interface ListenerMiddlewareInstance<
  State = unknown,
  Dispatch extends qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  > = qt.ThunkDispatch<State, unknown, qt.AnyAction>,
  ExtraArgument = unknown
> {
  middleware: ListenerMiddleware<State, Dispatch, ExtraArgument>
  startListening: AddListenerOverloads<
    UnsubscribeListener,
    State,
    Dispatch,
    ExtraArgument
  >
  stopListening: RemoveListenerOverloads<State, Dispatch>
  clearListeners: () => void
}
export type TakePatternOutputWithoutTimeout<
  State,
  Predicate extends AnyListenerPredicate<State>
> = Predicate extends MatchFunction<infer Action>
  ? Promise<[Action, State, State]>
  : Promise<[qt.AnyAction, State, State]>
export type TakePatternOutputWithTimeout<
  State,
  Predicate extends AnyListenerPredicate<State>
> = Predicate extends MatchFunction<infer Action>
  ? Promise<[Action, State, State] | null>
  : Promise<[qt.AnyAction, State, State] | null>
export interface TakePattern<State> {
  <Predicate extends AnyListenerPredicate<State>>(
    predicate: Predicate
  ): TakePatternOutputWithoutTimeout<State, Predicate>
  <Predicate extends AnyListenerPredicate<State>>(
    predicate: Predicate,
    timeout: number
  ): TakePatternOutputWithTimeout<State, Predicate>
  <Predicate extends AnyListenerPredicate<State>>(
    predicate: Predicate,
    timeout?: number | undefined
  ): TakePatternOutputWithTimeout<State, Predicate>
}
export interface UnsubscribeListenerOptions {
  cancelActive?: true
}
export type UnsubscribeListener = (
  unsubscribeOptions?: UnsubscribeListenerOptions
) => void
export interface AddListenerOverloads<
  Return,
  State = unknown,
  Dispatch extends qt.Dispatch = qt.ThunkDispatch<State, unknown, qt.AnyAction>,
  ExtraArgument = unknown,
  AdditionalOptions = unknown
> {
  <MA extends qt.AnyAction, LP extends ListenerPredicate<MA, State>>(
    options: {
      actionCreator?: never
      type?: never
      matcher?: never
      predicate: LP
      effect: ListenerEffect<
        ListenerPredicateGuardedActionType<LP>,
        State,
        Dispatch,
        ExtraArgument
      >
    } & AdditionalOptions
  ): Return
  <C extends TypedActionCreator<any>>(
    options: {
      actionCreator: C
      type?: never
      matcher?: never
      predicate?: never
      effect: ListenerEffect<ReturnType<C>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return
  <T extends string>(
    options: {
      actionCreator?: never
      type: T
      matcher?: never
      predicate?: never
      effect: ListenerEffect<qt.Action<T>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return
  <MA extends qt.AnyAction, M extends MatchFunction<MA>>(
    options: {
      actionCreator?: never
      type?: never
      matcher: M
      predicate?: never
      effect: ListenerEffect<GuardedType<M>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return
  <LP extends AnyListenerPredicate<State>>(
    options: {
      actionCreator?: never
      type?: never
      matcher?: never
      predicate: LP
      effect: ListenerEffect<qt.AnyAction, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return
}
export type RemoveListenerOverloads<
  State = unknown,
  Dispatch extends qt.Dispatch = qt.ThunkDispatch<State, unknown, qt.AnyAction>
> = AddListenerOverloads<
  boolean,
  State,
  Dispatch,
  any,
  UnsubscribeListenerOptions
>
export interface RemoveListenerAction<
  Action extends qt.AnyAction,
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction>
> {
  type: "listenerMiddleware/remove"
  payload: {
    type: string
    listener: ListenerEffect<Action, State, Dispatch>
  }
}
export type TypedAddListener<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  >,
  ExtraArgument = unknown,
  Payload = ListenerEntry<State, Dispatch>,
  T extends string = "listenerMiddleware/add"
> = BaseActionCreator<Payload, T> &
  AddListenerOverloads<
    PayloadAction<Payload, T>,
    State,
    Dispatch,
    ExtraArgument
  >
export type TypedRemoveListener<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  >,
  Payload = ListenerEntry<State, Dispatch>,
  T extends string = "listenerMiddleware/remove"
> = BaseActionCreator<Payload, T> &
  AddListenerOverloads<
    PayloadAction<Payload, T>,
    State,
    Dispatch,
    any,
    UnsubscribeListenerOptions
  >
export type TypedStartListening<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  >,
  ExtraArgument = unknown
> = AddListenerOverloads<UnsubscribeListener, State, Dispatch, ExtraArgument>
export type TypedStopListening<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  >
> = RemoveListenerOverloads<State, Dispatch>
export type TypedCreateListenerEntry<
  State,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.ThunkDispatch<
    State,
    unknown,
    qt.AnyAction
  >
> = AddListenerOverloads<ListenerEntry<State, Dispatch>, State, Dispatch>
export type ListenerEntry<
  State = unknown,
  Dispatch extends qt.Dispatch<qt.AnyAction> = qt.Dispatch<qt.AnyAction>
> = {
  id: string
  effect: ListenerEffect<any, State, Dispatch>
  unsubscribe: () => void
  pending: Set<AbortController>
  type?: string
  predicate: ListenerPredicate<qt.AnyAction, State>
}
export type FallbackAddListenerOptions = {
  actionCreator?: TypedActionCreator<string>
  type?: string
  matcher?: MatchFunction<any>
  predicate?: ListenerPredicate<any, any>
} & { effect: ListenerEffect<any, any, any> }
export type GuardedType<T> = T extends (
  x: any,
  ...args: unknown[]
) => x is infer T
  ? T
  : never
export type ListenerPredicateGuardedActionType<T> = T extends ListenerPredicate<
  infer Action,
  any
>
  ? Action
  : never
export const assertFunction: (
  func: unknown,
  expected: string
) => asserts func is (...args: unknown[]) => unknown = (
  func: unknown,
  expected: string
) => {
  if (typeof func !== "function") {
    throw new TypeError(`${expected} is not a function`)
  }
}
export const noop = () => {}
export const catchRejection = <T>(
  promise: Promise<T>,
  onError = noop
): Promise<T> => {
  promise.catch(onError)
  return promise
}
export const addAbortSignalListener = (
  abortSignal: AbortSignal,
  callback: (evt: Event) => void
) => {
  abortSignal.addEventListener("abort", callback, { once: true })
}
export const abortControllerWithReason = <T>(
  abortController: AbortController,
  reason: T
): void => {
  type Consumer<T> = (val: T) => void
  const signal = abortController.signal as AbortSignalWithReason<T>
  if (signal.aborted) {
    return
  }
  if (!("reason" in signal)) {
    Object.defineProperty(signal, "reason", {
      enumerable: true,
      value: reason,
      configurable: true,
      writable: true,
    })
  }
  ;(abortController.abort as Consumer<typeof reason>)(reason)
}
