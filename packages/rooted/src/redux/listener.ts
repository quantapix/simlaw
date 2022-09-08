import type { SerializedError } from '@reduxjs/toolkit'

const task = 'task'
const listener = 'listener'
const completed = 'completed'
const cancelled = 'cancelled'

/* TaskAbortError error codes  */
export const taskCancelled = `task-${cancelled}` as const
export const taskCompleted = `task-${completed}` as const
export const listenerCancelled = `${listener}-${cancelled}` as const
export const listenerCompleted = `${listener}-${completed}` as const

export class TaskAbortError implements SerializedError {
  name = 'TaskAbortError'
  message: string
  constructor(public code: string | undefined) {
    this.message = `${task} ${cancelled} (reason: ${code})`
  }
}
import type { Dispatch, AnyAction, MiddlewareAPI } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'
import { createAction } from '../createAction'
import { nanoid } from '../nanoid'

import type {
  ListenerMiddleware,
  ListenerMiddlewareInstance,
  AddListenerOverloads,
  AnyListenerPredicate,
  CreateListenerMiddlewareOptions,
  TypedAddListener,
  TypedCreateListenerEntry,
  FallbackAddListenerOptions,
  ListenerEntry,
  ListenerErrorHandler,
  UnsubscribeListener,
  TakePattern,
  ListenerErrorInfo,
  ForkedTaskExecutor,
  ForkedTask,
  TypedRemoveListener,
  TaskResult,
  AbortSignalWithReason,
  UnsubscribeListenerOptions,
} from './types'
import {
  abortControllerWithReason,
  addAbortSignalListener,
  assertFunction,
  catchRejection,
} from './utils'
import {
  listenerCancelled,
  listenerCompleted,
  TaskAbortError,
  taskCancelled,
  taskCompleted,
} from './exceptions'
import {
  runTask,
  promisifyAbortSignal,
  validateActive,
  createPause,
  createDelay,
} from './task'
export { TaskAbortError } from './exceptions'
export type {
  ListenerEffect,
  ListenerMiddleware,
  ListenerEffectAPI,
  ListenerMiddlewareInstance,
  CreateListenerMiddlewareOptions,
  ListenerErrorHandler,
  TypedStartListening,
  TypedAddListener,
  TypedStopListening,
  TypedRemoveListener,
  UnsubscribeListener,
  UnsubscribeListenerOptions,
  ForkedTaskExecutor,
  ForkedTask,
  ForkedTaskAPI,
  AsyncTaskExecutor,
  SyncTaskExecutor,
  TaskCancelled,
  TaskRejected,
  TaskResolved,
  TaskResult,
} from './types'

//Overly-aggressive byte-shaving
const { assign } = Object
/**
 * @internal
 */
const INTERNAL_NIL_TOKEN = {} as const

const alm = 'listenerMiddleware' as const

const createFork = (parentAbortSignal: AbortSignalWithReason<unknown>) => {
  const linkControllers = (controller: AbortController) =>
    addAbortSignalListener(parentAbortSignal, () =>
      abortControllerWithReason(controller, parentAbortSignal.reason)
    )

  return <T>(taskExecutor: ForkedTaskExecutor<T>): ForkedTask<T> => {
    assertFunction(taskExecutor, 'taskExecutor')
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
    Dispatch<AnyAction>
  >,
  signal: AbortSignal
): TakePattern<S> => {
  /**
   * A function that takes a ListenerPredicate and an optional timeout,
   * and resolves when either the predicate returns `true` based on an action
   * state combination or when the timeout expires.
   * If the parent listener is canceled while waiting, this will throw a
   * TaskAbortError.
   */
  const take = async <P extends AnyListenerPredicate<S>>(
    predicate: P,
    timeout: number | undefined
  ) => {
    validateActive(signal)

    // Placeholder unsubscribe function until the listener is added
    let unsubscribe: UnsubscribeListener = () => {}

    const tuplePromise = new Promise<[AnyAction, S, S]>((resolve) => {
      // Inside the Promise, we synchronously add the listener.
      unsubscribe = startListening({
        predicate: predicate as any,
        effect: (action, listenerApi): void => {
          // One-shot listener that cleans up as soon as the predicate passes
          listenerApi.unsubscribe()
          // Resolve the promise with the same arguments the predicate saw
          resolve([
            action,
            listenerApi.getState(),
            listenerApi.getOriginalState(),
          ])
        },
      })
    })

    const promises: (Promise<null> | Promise<[AnyAction, S, S]>)[] = [
      promisifyAbortSignal(signal),
      tuplePromise,
    ]

    if (timeout != null) {
      promises.push(
        new Promise<null>((resolve) => setTimeout(resolve, timeout, null))
      )
    }

    try {
      const output = await Promise.race(promises)

      validateActive(signal)
      return output
    } finally {
      // Always clean up the listener
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
    // pass
  } else {
    throw new Error(
      'Creating or removing a listener requires one of the known fields for matching an action'
    )
  }

  assertFunction(effect, 'options.listener')

  return { predicate, type, effect }
}

/** Accepts the possible options for creating a listener, and returns a formatted listener entry */
export const createListenerEntry: TypedCreateListenerEntry<unknown> = (
  options: FallbackAddListenerOptions
) => {
  const { type, predicate, effect } = getListenerEntryPropsFrom(options)

  const id = nanoid()
  const entry: ListenerEntry<unknown> = {
    id,
    effect,
    type,
    predicate,
    pending: new Set<AbortController>(),
    unsubscribe: () => {
      throw new Error('Unsubscribe not initialized')
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

/**
 * Safely reports errors to the `errorHandler` provided.
 * Errors that occur inside `errorHandler` are notified in a new task.
 * Inspired by [rxjs reportUnhandledError](https://github.com/ReactiveX/rxjs/blob/6fafcf53dc9e557439b25debaeadfd224b245a66/src/internal/util/reportUnhandledError.ts)
 * @param errorHandler
 * @param errorToNotify
 */
const safelyNotifyError = (
  errorHandler: ListenerErrorHandler,
  errorToNotify: unknown,
  errorInfo: ListenerErrorInfo
): void => {
  try {
    errorHandler(errorToNotify, errorInfo)
  } catch (errorHandlerError) {
    // We cannot let an error raised here block the listener queue.
    // The error raised here will be picked up by `window.onerror`, `process.on('error')` etc...
    setTimeout(() => {
      throw errorHandlerError
    }, 0)
  }
}

/**
 * @public
 */
export const addListener = createAction(
  `${alm}/add`
) as TypedAddListener<unknown>

/**
 * @public
 */
export const clearAllListeners = createAction(`${alm}/removeAll`)

/**
 * @public
 */
export const removeListener = createAction(
  `${alm}/remove`
) as TypedRemoveListener<unknown>

const defaultErrorHandler: ListenerErrorHandler = (...args: unknown[]) => {
  console.error(`${alm}/error`, ...args)
}

const cancelActiveListeners = (
  entry: ListenerEntry<unknown, Dispatch<AnyAction>>
) => {
  entry.pending.forEach((controller) => {
    abortControllerWithReason(controller, listenerCancelled)
  })
}

/**
 * @public
 */
export function createListenerMiddleware<
  S = unknown,
  D extends Dispatch<AnyAction> = ThunkDispatch<S, unknown, AnyAction>,
  ExtraArgument = unknown
>(middlewareOptions: CreateListenerMiddlewareOptions<ExtraArgument> = {}) {
  const listenerMap = new Map<string, ListenerEntry>()
  const { extra, onError = defaultErrorHandler } = middlewareOptions

  assertFunction(onError, 'onError')

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
      (existingEntry) => existingEntry.effect === options.effect
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

    const entry = findListenerEntry((entry) => {
      const matchPredicateOrType =
        typeof type === 'string'
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
    entry: ListenerEntry<unknown, Dispatch<AnyAction>>,
    action: AnyAction,
    api: MiddlewareAPI,
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
          // Use assign() rather than ... to avoid extra helper functions added to bundle
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
          raisedBy: 'effect',
        })
      }
    } finally {
      abortControllerWithReason(internalTaskController, listenerCompleted) // Notify that the task has completed
      entry.pending.delete(internalTaskController)
    }
  }

  const clearListenerMiddleware = createClearListenerMiddleware(listenerMap)

  const middleware: ListenerMiddleware<S, D, ExtraArgument> =
    (api) => (next) => (action) => {
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

      // Need to get this state _before_ the reducer processes the action
      let originalState: S | typeof INTERNAL_NIL_TOKEN = api.getState()

      // `getOriginalState` can only be called synchronously.
      // @see https://github.com/reduxjs/redux-toolkit/discussions/1648#discussioncomment-1932820
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
        // Actually forward the action to the reducer before we handle listeners
        result = next(action)

        if (listenerMap.size > 0) {
          let currentState = api.getState()
          // Work around ESBuild+TS transpilation issue
          const listenerEntries = Array.from(listenerMap.values())
          for (let entry of listenerEntries) {
            let runListener = false

            try {
              runListener = entry.predicate(action, currentState, originalState)
            } catch (predicateError) {
              runListener = false

              safelyNotifyError(onError, predicateError, {
                raisedBy: 'predicate',
              })
            }

            if (!runListener) {
              continue
            }

            notifyListener(entry, action, api, getOriginalState)
          }
        }
      } finally {
        // Remove `originalState` store from this scope.
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
import { TaskAbortError } from './exceptions'
import type { AbortSignalWithReason, TaskResult } from './types'
import { addAbortSignalListener, catchRejection } from './utils'

/**
 * Synchronously raises {@link TaskAbortError} if the task tied to the input `signal` has been cancelled.
 * @param signal
 * @param reason
 * @see {TaskAbortError}
 */
export const validateActive = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new TaskAbortError((signal as AbortSignalWithReason<string>).reason)
  }
}

/**
 * Returns a promise that will reject {@link TaskAbortError} if the task is cancelled.
 * @param signal
 * @returns
 */
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

/**
 * Runs a task and returns promise that resolves to {@link TaskResult}.
 * Second argument is an optional `cleanUp` function that always runs after task.
 *
 * **Note:** `runTask` runs the executor in the next microtask.
 * @returns
 */
export const runTask = async <T>(
  task: () => Promise<T>,
  cleanUp?: () => void
): Promise<TaskResult<T>> => {
  try {
    await Promise.resolve()
    const value = await task()
    return {
      status: 'ok',
      value,
    }
  } catch (error: any) {
    return {
      status: error instanceof TaskAbortError ? 'cancelled' : 'rejected',
      error,
    }
  } finally {
    cleanUp?.()
  }
}

/**
 * Given an input `AbortSignal` and a promise returns another promise that resolves
 * as soon the input promise is provided or rejects as soon as
 * `AbortSignal.abort` is `true`.
 * @param signal
 * @returns
 */
export const createPause = <T>(signal: AbortSignal) => {
  return (promise: Promise<T>): Promise<T> => {
    return catchRejection(
      Promise.race([promisifyAbortSignal(signal), promise]).then((output) => {
        validateActive(signal)
        return output
      })
    )
  }
}

/**
 * Given an input `AbortSignal` and `timeoutMs` returns a promise that resolves
 * after `timeoutMs` or rejects as soon as `AbortSignal.abort` is `true`.
 * @param signal
 * @returns
 */
export const createDelay = (signal: AbortSignal) => {
  const pause = createPause<void>(signal)
  return (timeoutMs: number): Promise<void> => {
    return pause(new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)))
  }
}
import type { PayloadAction, BaseActionCreator } from '../createAction'
import type {
  Dispatch as ReduxDispatch,
  AnyAction,
  MiddlewareAPI,
  Middleware,
  Action as ReduxAction,
} from 'redux'
import type { ThunkDispatch } from 'redux-thunk'
import type { TaskAbortError } from './exceptions'

/**
 * @internal
 * At the time of writing `lib.dom.ts` does not provide `abortSignal.reason`.
 */
export type AbortSignalWithReason<T> = AbortSignal & { reason?: T }

/**
 * Types copied from RTK
 */

/** @internal */
export interface TypedActionCreator<Type extends string> {
  (...args: any[]): ReduxAction<Type>
  type: Type
  match: MatchFunction<any>
}

/** @internal */
export type AnyListenerPredicate<State> = (
  action: AnyAction,
  currentState: State,
  originalState: State
) => boolean

/** @public */
export type ListenerPredicate<Action extends AnyAction, State> = (
  action: AnyAction,
  currentState: State,
  originalState: State
) => action is Action

/** @public */
export interface ConditionFunction<State> {
  (predicate: AnyListenerPredicate<State>, timeout?: number): Promise<boolean>
  (predicate: AnyListenerPredicate<State>, timeout?: number): Promise<boolean>
  (predicate: () => boolean, timeout?: number): Promise<boolean>
}

/** @internal */
export type MatchFunction<T> = (v: any) => v is T

/** @public */
export interface ForkedTaskAPI {
  /**
   * Returns a promise that resolves when `waitFor` resolves or
   * rejects if the task or the parent listener has been cancelled or is completed.
   */
  pause<W>(waitFor: Promise<W>): Promise<W>
  /**
   * Returns a promise that resolves after `timeoutMs` or
   * rejects if the task or the parent listener has been cancelled or is completed.
   * @param timeoutMs
   */
  delay(timeoutMs: number): Promise<void>
  /**
   * An abort signal whose `aborted` property is set to `true`
   * if the task execution is either aborted or completed.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
   */
  signal: AbortSignal
}

/** @public */
export interface AsyncTaskExecutor<T> {
  (forkApi: ForkedTaskAPI): Promise<T>
}

/** @public */
export interface SyncTaskExecutor<T> {
  (forkApi: ForkedTaskAPI): T
}

/** @public */
export type ForkedTaskExecutor<T> = AsyncTaskExecutor<T> | SyncTaskExecutor<T>

/** @public */
export type TaskResolved<T> = {
  readonly status: 'ok'
  readonly value: T
}

/** @public */
export type TaskRejected = {
  readonly status: 'rejected'
  readonly error: unknown
}

/** @public */
export type TaskCancelled = {
  readonly status: 'cancelled'
  readonly error: TaskAbortError
}

/** @public */
export type TaskResult<Value> =
  | TaskResolved<Value>
  | TaskRejected
  | TaskCancelled

/** @public */
export interface ForkedTask<T> {
  /**
   * A promise that resolves when the task is either completed or cancelled or rejects
   * if parent listener execution is cancelled or completed.
   *
   * ### Example
   * ```ts
   * const result = await fork(async (forkApi) => Promise.resolve(4)).result
   *
   * if(result.status === 'ok') {
   *   console.log(result.value) // logs 4
   * }}
   * ```
   */
  result: Promise<TaskResult<T>>
  /**
   * Cancel task if it is in progress or not yet started,
   * it is noop otherwise.
   */
  cancel(): void
}

/** @public */
export interface ListenerEffectAPI<
  State,
  Dispatch extends ReduxDispatch<AnyAction>,
  ExtraArgument = unknown
> extends MiddlewareAPI<Dispatch, State> {
  /**
   * Returns the store state as it existed when the action was originally dispatched, _before_ the reducers ran.
   *
   * ### Synchronous invocation
   *
   * This function can **only** be invoked **synchronously**, it throws error otherwise.
   *
   * @example
   *
   * ```ts
   * middleware.startListening({
   *  predicate: () => true,
   *  async effect(_, { getOriginalState }) {
   *    getOriginalState(); // sync: OK!
   *
   *    setTimeout(getOriginalState, 0); // async: throws Error
   *
   *    await Promise().resolve();
   *
   *    getOriginalState() // async: throws Error
   *  }
   * })
   * ```
   */
  getOriginalState: () => State
  /**
   * Removes the listener entry from the middleware and prevent future instances of the listener from running.
   *
   * It does **not** cancel any active instances.
   */
  unsubscribe(): void
  /**
   * It will subscribe a listener if it was previously removed, noop otherwise.
   */
  subscribe(): void
  /**
   * Returns a promise that resolves when the input predicate returns `true` or
   * rejects if the listener has been cancelled or is completed.
   *
   * The return value is `true` if the predicate succeeds or `false` if a timeout is provided and expires first.
   * 
   * ### Example
   * 
   * ```ts
   * const updateBy = createAction<number>('counter/updateBy');
   *
   * middleware.startListening({
   *  actionCreator: updateBy,
   *  async effect(_, { condition }) {
   *    // wait at most 3s for `updateBy` actions.
   *    if(await condition(updateBy.match, 3_000)) {
   *      // `updateBy` has been dispatched twice in less than 3s.
   *    }
   *  }
   * })
   * ```
   */
  condition: ConditionFunction<State>
  /**
   * Returns a promise that resolves when the input predicate returns `true` or
   * rejects if the listener has been cancelled or is completed.
   *
   * The return value is the `[action, currentState, previousState]` combination that the predicate saw as arguments.
   *
   * The promise resolves to null if a timeout is provided and expires first, 
   *
   * ### Example
   *
   * ```ts
   * const updateBy = createAction<number>('counter/updateBy');
   *
   * middleware.startListening({
   *  actionCreator: updateBy,
   *  async effect(_, { take }) {
   *    const [{ payload }] =  await take(updateBy.match);
   *    console.log(payload); // logs 5;
   *  }
   * })
   *
   * store.dispatch(updateBy(5));
   * ```
   */
  take: TakePattern<State>
  /**
   * Cancels all other running instances of this same listener except for the one that made this call.
   */
  cancelActiveListeners: () => void
  /**
   * An abort signal whose `aborted` property is set to `true`
   * if the listener execution is either aborted or completed.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
   */
  signal: AbortSignal
  /**
   * Returns a promise that resolves after `timeoutMs` or
   * rejects if the listener has been cancelled or is completed.
   */
  delay(timeoutMs: number): Promise<void>
  /**
   * Queues in the next microtask the execution of a task.
   * @param executor
   */
  fork<T>(executor: ForkedTaskExecutor<T>): ForkedTask<T>
  /**
   * Returns a promise that resolves when `waitFor` resolves or
   * rejects if the listener has been cancelled or is completed.
   * @param promise
   */
  pause<M>(promise: Promise<M>): Promise<M>
  extra: ExtraArgument
}

/** @public */
export type ListenerEffect<
  Action extends AnyAction,
  State,
  Dispatch extends ReduxDispatch<AnyAction>,
  ExtraArgument = unknown
> = (
  action: Action,
  api: ListenerEffectAPI<State, Dispatch, ExtraArgument>
) => void | Promise<void>

/**
 * @public
 * Additional infos regarding the error raised.
 */
export interface ListenerErrorInfo {
  /**
   * Which function has generated the exception.
   */
  raisedBy: 'effect' | 'predicate'
}

/**
 * @public
 * Gets notified with synchronous and asynchronous errors raised by `listeners` or `predicates`.
 * @param error The thrown error.
 * @param errorInfo Additional information regarding the thrown error.
 */
export interface ListenerErrorHandler {
  (error: unknown, errorInfo: ListenerErrorInfo): void
}

/** @public */
export interface CreateListenerMiddlewareOptions<ExtraArgument = unknown> {
  extra?: ExtraArgument
  /**
   * Receives synchronous errors that are raised by `listener` and `listenerOption.predicate`.
   */
  onError?: ListenerErrorHandler
}

/** @public */
export type ListenerMiddleware<
  State = unknown,
  Dispatch extends ThunkDispatch<State, unknown, AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >,
  ExtraArgument = unknown
> = Middleware<
  {
    (action: ReduxAction<'listenerMiddleware/add'>): UnsubscribeListener
  },
  State,
  Dispatch
>

/** @public */
export interface ListenerMiddlewareInstance<
  State = unknown,
  Dispatch extends ThunkDispatch<State, unknown, AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >,
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
  /**
   * Unsubscribes all listeners, cancels running listeners and tasks.
   */
  clearListeners: () => void
}

/**
 * API Function Overloads
 */

/** @public */
export type TakePatternOutputWithoutTimeout<
  State,
  Predicate extends AnyListenerPredicate<State>
> = Predicate extends MatchFunction<infer Action>
  ? Promise<[Action, State, State]>
  : Promise<[AnyAction, State, State]>

/** @public */
export type TakePatternOutputWithTimeout<
  State,
  Predicate extends AnyListenerPredicate<State>
> = Predicate extends MatchFunction<infer Action>
  ? Promise<[Action, State, State] | null>
  : Promise<[AnyAction, State, State] | null>

/** @public */
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

/** @public */
export interface UnsubscribeListenerOptions {
  cancelActive?: true
}

/** @public */
export type UnsubscribeListener = (
  unsubscribeOptions?: UnsubscribeListenerOptions
) => void

/**
 * @public
 * The possible overloads and options for defining a listener. The return type of each function is specified as a generic arg, so the overloads can be reused for multiple different functions
 */
export interface AddListenerOverloads<
  Return,
  State = unknown,
  Dispatch extends ReduxDispatch = ThunkDispatch<State, unknown, AnyAction>,
  ExtraArgument = unknown,
  AdditionalOptions = unknown
> {
  /** Accepts a "listener predicate" that is also a TS type predicate for the action*/
  <MA extends AnyAction, LP extends ListenerPredicate<MA, State>>(
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

  /** Accepts an RTK action creator, like `incrementByAmount` */
  <C extends TypedActionCreator<any>>(
    options: {
      actionCreator: C
      type?: never
      matcher?: never
      predicate?: never
      effect: ListenerEffect<ReturnType<C>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return

  /** Accepts a specific action type string */
  <T extends string>(
    options: {
      actionCreator?: never
      type: T
      matcher?: never
      predicate?: never
      effect: ListenerEffect<ReduxAction<T>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return

  /** Accepts an RTK matcher function, such as `incrementByAmount.match` */
  <MA extends AnyAction, M extends MatchFunction<MA>>(
    options: {
      actionCreator?: never
      type?: never
      matcher: M
      predicate?: never
      effect: ListenerEffect<GuardedType<M>, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return

  /** Accepts a "listener predicate" that just returns a boolean, no type assertion */
  <LP extends AnyListenerPredicate<State>>(
    options: {
      actionCreator?: never
      type?: never
      matcher?: never
      predicate: LP
      effect: ListenerEffect<AnyAction, State, Dispatch, ExtraArgument>
    } & AdditionalOptions
  ): Return
}

/** @public */
export type RemoveListenerOverloads<
  State = unknown,
  Dispatch extends ReduxDispatch = ThunkDispatch<State, unknown, AnyAction>
> = AddListenerOverloads<
  boolean,
  State,
  Dispatch,
  any,
  UnsubscribeListenerOptions
>

/** @public */
export interface RemoveListenerAction<
  Action extends AnyAction,
  State,
  Dispatch extends ReduxDispatch<AnyAction>
> {
  type: 'listenerMiddleware/remove'
  payload: {
    type: string
    listener: ListenerEffect<Action, State, Dispatch>
  }
}

/**
 * @public
 * A "pre-typed" version of `addListenerAction`, so the listener args are well-typed */
export type TypedAddListener<
  State,
  Dispatch extends ReduxDispatch<AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >,
  ExtraArgument = unknown,
  Payload = ListenerEntry<State, Dispatch>,
  T extends string = 'listenerMiddleware/add'
> = BaseActionCreator<Payload, T> &
  AddListenerOverloads<
    PayloadAction<Payload, T>,
    State,
    Dispatch,
    ExtraArgument
  >

/**
 * @public
 * A "pre-typed" version of `removeListenerAction`, so the listener args are well-typed */
export type TypedRemoveListener<
  State,
  Dispatch extends ReduxDispatch<AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >,
  Payload = ListenerEntry<State, Dispatch>,
  T extends string = 'listenerMiddleware/remove'
> = BaseActionCreator<Payload, T> &
  AddListenerOverloads<
    PayloadAction<Payload, T>,
    State,
    Dispatch,
    any,
    UnsubscribeListenerOptions
  >

/**
 * @public
 * A "pre-typed" version of `middleware.startListening`, so the listener args are well-typed */
export type TypedStartListening<
  State,
  Dispatch extends ReduxDispatch<AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >,
  ExtraArgument = unknown
> = AddListenerOverloads<UnsubscribeListener, State, Dispatch, ExtraArgument>

/** @public
 * A "pre-typed" version of `middleware.stopListening`, so the listener args are well-typed */
export type TypedStopListening<
  State,
  Dispatch extends ReduxDispatch<AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >
> = RemoveListenerOverloads<State, Dispatch>

/** @public
 * A "pre-typed" version of `createListenerEntry`, so the listener args are well-typed */
export type TypedCreateListenerEntry<
  State,
  Dispatch extends ReduxDispatch<AnyAction> = ThunkDispatch<
    State,
    unknown,
    AnyAction
  >
> = AddListenerOverloads<ListenerEntry<State, Dispatch>, State, Dispatch>

/**
 * Internal Types
 */

/** @internal An single listener entry */
export type ListenerEntry<
  State = unknown,
  Dispatch extends ReduxDispatch<AnyAction> = ReduxDispatch<AnyAction>
> = {
  id: string
  effect: ListenerEffect<any, State, Dispatch>
  unsubscribe: () => void
  pending: Set<AbortController>
  type?: string
  predicate: ListenerPredicate<AnyAction, State>
}

/**
 * @internal
 * A shorthand form of the accepted args, solely so that `createListenerEntry` has validly-typed conditional logic when checking the options contents
 */
export type FallbackAddListenerOptions = {
  actionCreator?: TypedActionCreator<string>
  type?: string
  matcher?: MatchFunction<any>
  predicate?: ListenerPredicate<any, any>
} & { effect: ListenerEffect<any, any, any> }

/**
 * Utility Types
 */

/** @public */
export type GuardedType<T> = T extends (
  x: any,
  ...args: unknown[]
) => x is infer T
  ? T
  : never

/** @public */
export type ListenerPredicateGuardedActionType<T> = T extends ListenerPredicate<
  infer Action,
  any
>
  ? Action
  : never
import type { AbortSignalWithReason } from './types'

export const assertFunction: (
  func: unknown,
  expected: string
) => asserts func is (...args: unknown[]) => unknown = (
  func: unknown,
  expected: string
) => {
  if (typeof func !== 'function') {
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
  abortSignal.addEventListener('abort', callback, { once: true })
}

/**
 * Calls `abortController.abort(reason)` and patches `signal.reason`.
 * if it is not supported.
 *
 * At the time of writing `signal.reason` is available in FF chrome, edge node 17 and deno.
 * @param abortController
 * @param reason
 * @returns
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/reason
 */
export const abortControllerWithReason = <T>(
  abortController: AbortController,
  reason: T
): void => {
  type Consumer<T> = (val: T) => void

  const signal = abortController.signal as AbortSignalWithReason<T>

  if (signal.aborted) {
    return
  }

  // Patch `reason` if necessary.
  // - We use defineProperty here because reason is a getter of `AbortSignal.__proto__`.
  // - We need to patch 'reason' before calling `.abort()` because listeners to the 'abort'
  // event are are notified immediately.
  if (!('reason' in signal)) {
    Object.defineProperty(signal, 'reason', {
      enumerable: true,
      value: reason,
      configurable: true,
      writable: true,
    })
  }

  ;(abortController.abort as Consumer<typeof reason>)(reason)
}
