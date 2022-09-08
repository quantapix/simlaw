import {
  ActionCreator,
  Action,
  Dispatch,
  bindActionCreators,
  ActionCreatorsMapObject
} from '../..'

interface AddTodoAction extends Action {
  text: string
}

const addTodo: ActionCreator<AddTodoAction, [string]> = text => ({
  type: 'ADD_TODO',
  text
})

const addTodoAction: AddTodoAction = addTodo('test')

type AddTodoThunk = (dispatch: Dispatch) => AddTodoAction

const addTodoViaThunk: ActionCreator<AddTodoThunk> = text => (_: Dispatch) => ({
  type: 'ADD_TODO',
  text
})

declare const dispatch: Dispatch

function bound() {
  const boundAddTodo = bindActionCreators(addTodo, dispatch)

  const dispatchedAddTodoAction: AddTodoAction = boundAddTodo('test')

  const boundAddTodoViaThunk = bindActionCreators<
    ActionCreator<AddTodoThunk, [string]>,
    ActionCreator<AddTodoAction, [string]>
  >(addTodoViaThunk, dispatch)

  const dispatchedAddTodoViaThunkAction: AddTodoAction =
    boundAddTodoViaThunk('test')

  const boundActionCreators = bindActionCreators({ addTodo }, dispatch)

  const otherDispatchedAddTodoAction: AddTodoAction =
    boundActionCreators.addTodo('test')

  interface M extends ActionCreatorsMapObject {
    addTodoViaThunk: ActionCreator<AddTodoThunk, [string]>
  }

  interface N extends ActionCreatorsMapObject {
    addTodoViaThunk: ActionCreator<AddTodoAction, [string]>
  }

  const boundActionCreators2 = bindActionCreators<M, N>(
    {
      addTodoViaThunk
    },
    dispatch
  )

  const otherDispatchedAddTodoAction2: AddTodoAction =
    boundActionCreators2.addTodoViaThunk('test')
}
import { Action as ReduxAction } from '../..'

namespace FSA {
  interface Action<P> extends ReduxAction {
    payload: P
  }

  const action: Action<string> = {
    type: 'ACTION_TYPE',
    payload: 'test'
  }

  const payload: string = action.payload
}

namespace FreeShapeAction {
  interface Action extends ReduxAction {
    [key: string]: any
  }

  const action: Action = {
    type: 'ACTION_TYPE',
    text: 'test'
  }

  const text: string = action['text']
}

namespace StringLiteralTypeAction {
  type ActionType = 'A' | 'B' | 'C'

  interface Action extends ReduxAction {
    type: ActionType
  }

  const action: Action = {
    type: 'A'
  }

  const type: ActionType = action.type
}

namespace EnumTypeAction {
  enum ActionType {
    A,
    B,
    C
  }

  interface Action extends ReduxAction {
    type: ActionType
  }

  const action: Action = {
    type: ActionType.A
  }

  const type: ActionType = action.type
}
import { compose } from '../..'

// adapted from DefinitelyTyped/compose-function

const numberToNumber = (a: number): number => a + 2
const numberToString = (a: number): string => 'foo'
const stringToNumber = (a: string): number => 5

const t1: number = compose(numberToNumber, numberToNumber)(5)
const t2: string = compose(numberToString, numberToNumber)(5)
const t3: string = compose(numberToString, stringToNumber)('f')
const t4: (a: string) => number = compose(
  (f: (a: string) => number) => (p: string) => 5,
  (f: (a: number) => string) => (p: string) => 4
)(numberToString)

const t5: number = compose(stringToNumber, numberToString, numberToNumber)(5)
const t6: string = compose(
  numberToString,
  stringToNumber,
  numberToString,
  numberToNumber
)(5)

// rest signature
const t7: string = compose<string>(
  numberToString,
  numberToNumber,
  stringToNumber,
  numberToString,
  stringToNumber
)('fo')

const multiArgFn = (a: string, b: number, c: boolean): string => 'foo'

const t8: string = compose(multiArgFn)('bar', 42, true)
const t9: number = compose(stringToNumber, multiArgFn)('bar', 42, true)
const t10: string = compose(numberToString, stringToNumber, multiArgFn)(
  'bar',
  42,
  true
)

const t11: number = compose(
  stringToNumber,
  numberToString,
  stringToNumber,
  multiArgFn
)('bar', 42, true)

const funcs = [stringToNumber, numberToString, stringToNumber]
const t12 = compose(...funcs)('bar')
import { Dispatch } from '../..'

/**
 * Default Dispatch type accepts any object with `type` property.
 */
function simple() {
  const dispatch: Dispatch = null as any

  const a = dispatch({ type: 'INCREMENT', count: 10 })

  a.count
  // @ts-expect-error
  a.wrongProp

  // @ts-expect-error
  dispatch('not-an-action')
}

/**
 * Dispatch accepts type argument that restricts allowed action types.
 */
function discriminated() {
  interface IncrementAction {
    type: 'INCREMENT'
    count?: number
  }

  interface DecrementAction {
    type: 'DECREMENT'
    count?: number
  }

  // Union of all actions in the app.
  type MyAction = IncrementAction | DecrementAction

  const dispatch: Dispatch<MyAction> = null as any

  dispatch({ type: 'INCREMENT' })
  dispatch({ type: 'DECREMENT', count: 10 })
  // Known actions are strictly checked.
  // @ts-expect-error
  dispatch({ type: 'DECREMENT', count: '' })
  // Unknown actions are rejected.
  // @ts-expect-error
  dispatch({ type: 'SOME_OTHER_TYPE' })
}
import { StoreEnhancer, Action, AnyAction, Reducer, createStore } from '../..'

interface State {
  someField: 'string'
}
const reducer: Reducer<State> = null as any

/**
 * Store enhancer that extends the type of dispatch.
 */
function dispatchExtension() {
  type PromiseDispatch = <T extends Action>(promise: Promise<T>) => Promise<T>

  const enhancer: StoreEnhancer<{
    dispatch: PromiseDispatch
  }> =
    createStore =>
    <S, A extends Action = AnyAction>(
      reducer: Reducer<S, A>,
      preloadedState?: any
    ) => {
      const store = createStore(reducer, preloadedState)
      return {
        ...store,
        dispatch: (action: any) => {
          if (action.type) {
            store.dispatch(action)
          } else if (action.then) {
            action.then(store.dispatch)
          }
          return action
        }
      }
    }

  const store = createStore(reducer, enhancer)

  store.dispatch({ type: 'INCREMENT' })
  store.dispatch(Promise.resolve({ type: 'INCREMENT' }))
  // @ts-expect-error
  store.dispatch('not-an-action')
  // @ts-expect-error
  store.dispatch(Promise.resolve('not-an-action'))
}

/**
 * Store enhancer that extends the type of the state.
 */
function stateExtension() {
  interface ExtraState {
    extraField: 'extra'
  }

  const enhancer: StoreEnhancer<{}, ExtraState> =
    createStore =>
    <S, A extends Action = AnyAction>(
      reducer: Reducer<S, A>,
      preloadedState?: any
    ) => {
      const wrappedReducer: Reducer<S & ExtraState, A> = (state, action) => {
        const newState = reducer(state, action)
        return {
          ...newState,
          extraField: 'extra'
        }
      }
      const wrappedPreloadedState = preloadedState
        ? {
            ...preloadedState,
            extraField: 'extra'
          }
        : undefined
      return createStore(wrappedReducer, wrappedPreloadedState)
    }

  const store = createStore(reducer, enhancer)

  store.getState().someField
  store.getState().extraField
  // @ts-expect-error
  store.getState().wrongField
}

/**
 * Store enhancer that adds methods to the store.
 */
function extraMethods() {
  const enhancer: StoreEnhancer<{ method(): string }> =
    createStore =>
    (...args) => {
      const store = createStore(...args)
      store.method = () => 'foo'
      return store
    }

  const store = createStore(reducer, enhancer)

  store.getState()
  const res: string = store.method()
  // @ts-expect-error
  store.wrongMethod()
}

/**
 * replaceReducer with a store enhancer
 */
function replaceReducerExtender() {
  interface ExtraState {
    extraField: 'extra'
  }

  const enhancer: StoreEnhancer<{ method(): string }, ExtraState> =
    createStore =>
    <S, A extends Action = AnyAction>(
      reducer: Reducer<S, A>,
      preloadedState?: any
    ) => {
      const wrappedReducer: Reducer<S & ExtraState, A> = (state, action) => {
        const newState = reducer(state, action)
        return {
          ...newState,
          extraField: 'extra'
        }
      }
      const wrappedPreloadedState = preloadedState
        ? {
            ...preloadedState,
            extraField: 'extra'
          }
        : undefined
      return createStore(wrappedReducer, wrappedPreloadedState)
    }

  const store = createStore(reducer, enhancer)

  const newReducer = (
    state: { test: boolean } = { test: true },
    _: AnyAction
  ) => state

  const newStore = store.replaceReducer(newReducer)
  newStore.getState().test
  newStore.getState().extraField
  // @ts-expect-error
  newStore.getState().wrongField

  const res: string = newStore.method()
  // @ts-expect-error
  newStore.wrongMethod()
}

function mhelmersonExample() {
  interface State {
    someField: 'string'
  }

  interface ExtraState {
    extraField: 'extra'
  }

  const reducer: Reducer<State> = null as any

  function stateExtensionExpectedToWork() {
    interface ExtraState {
      extraField: 'extra'
    }

    const enhancer: StoreEnhancer<{}, ExtraState> =
      createStore =>
      <S, A extends Action = AnyAction>(
        reducer: Reducer<S, A>,
        preloadedState?: any
      ) => {
        const wrappedReducer: Reducer<S & ExtraState, A> = (state, action) => {
          const newState = reducer(state, action)
          return {
            ...newState,
            extraField: 'extra'
          }
        }
        const wrappedPreloadedState = preloadedState
          ? {
              ...preloadedState,
              extraField: 'extra'
            }
          : undefined
        const store = createStore(wrappedReducer, wrappedPreloadedState)
        return {
          ...store,
          replaceReducer<NS, NA extends Action = AnyAction>(
            nextReducer: (
              state: (NS & ExtraState) | undefined,
              action: NA
            ) => NS & ExtraState
          ) {
            const nextWrappedReducer: Reducer<NS & ExtraState, NA> = (
              state,
              action
            ) => {
              const newState = nextReducer(state, action)
              return {
                ...newState,
                extraField: 'extra'
              }
            }
            return store.replaceReducer(nextWrappedReducer)
          }
        }
      }

    const store = createStore(reducer, enhancer)
    store.replaceReducer(reducer)

    store.getState().extraField
    // @ts-expect-error
    store.getState().wrongField
    // @ts-expect-error
    store.getState().test

    const newReducer = (
      state: { test: boolean } = { test: true },
      _: AnyAction
    ) => state

    const newStore = store.replaceReducer(newReducer)
    newStore.getState().test
    newStore.getState().extraField
    // @ts-expect-error
    newStore.getState().wrongField
  }
}

function finalHelmersonExample() {
  interface ExtraState {
    foo: string
  }

  function persistReducer<S, A extends AnyAction>(
    config: any,
    reducer: Reducer<S, A>
  ) {
    return (state: (S & ExtraState) | undefined, action: AnyAction) => {
      const newState = reducer(state, action as unknown as A)
      return {
        ...newState,
        foo: 'hi'
      }
    }
  }

  function persistStore<S>(store: S) {
    return store
  }

  function createPersistEnhancer(
    persistConfig: any
  ): StoreEnhancer<{}, ExtraState> {
    return createStore =>
      <S, A extends Action = AnyAction>(
        reducer: Reducer<S, A>,
        preloadedState?: any
      ) => {
        const persistedReducer = persistReducer<S, A>(persistConfig, reducer)
        const store = createStore(persistedReducer, preloadedState)
        const persistor = persistStore(store)

        return {
          ...store,
          replaceReducer: nextReducer => {
            return store.replaceReducer(
              persistReducer(persistConfig, nextReducer)
            )
          },
          persistor
        }
      }
  }

  const store = createStore(reducer, createPersistEnhancer('hi'))

  store.getState().foo
  // @ts-expect-error
  store.getState().wrongField

  const newReducer = (
    state: { test: boolean } = { test: true },
    _: AnyAction
  ) => state

  const newStore = store.replaceReducer(newReducer)
  newStore.getState().test
  // @ts-expect-error
  newStore.getState().whatever
  // @ts-expect-error
  newStore.getState().wrongField
}
import { Dispatch, Action } from '../..'

interface Component<P> {
  props: P
}

interface HOC<T> {
  <P>(wrapped: Component<P & T>): Component<P>
}

declare function connect<T, D extends Dispatch = Dispatch>(
  mapDispatchToProps: (dispatch: D) => T
): HOC<T>

/**
 * Inject default dispatch.
 */
function simple() {
  const hoc: HOC<{ onClick(): void }> = connect(dispatch => {
    return {
      onClick() {
        dispatch({ type: 'INCREMENT' })
        // @ts-expect-error
        dispatch(Promise.resolve({ type: 'INCREMENT' }))
        // @ts-expect-error
        dispatch('not-an-action')
      }
    }
  })
}

/**
 * Inject dispatch that restricts allowed action types.
 */
function discriminated() {
  interface IncrementAction {
    type: 'INCREMENT'
    count?: number
  }

  interface DecrementAction {
    type: 'DECREMENT'
    count?: number
  }

  // Union of all actions in the app.
  type MyAction = IncrementAction | DecrementAction

  const hoc: HOC<{ onClick(): void }> = connect(
    (dispatch: Dispatch<MyAction>) => {
      return {
        onClick() {
          dispatch({ type: 'INCREMENT' })
          dispatch({ type: 'DECREMENT', count: 10 })
          // @ts-expect-error
          dispatch({ type: 'DECREMENT', count: '' })
          // @ts-expect-error
          dispatch({ type: 'SOME_OTHER_TYPE' })
          // @ts-expect-error
          dispatch('not-an-action')
        }
      }
    }
  )
}

/**
 * Inject extended dispatch.
 */
function promise() {
  type PromiseDispatch = <T extends Action>(promise: Promise<T>) => Promise<T>

  type MyDispatch = Dispatch & PromiseDispatch

  const hoc: HOC<{ onClick(): void }> = connect((dispatch: MyDispatch) => {
    return {
      onClick() {
        dispatch({ type: 'INCREMENT' })
        dispatch(Promise.resolve({ type: 'INCREMENT' }))
        // @ts-expect-error
        dispatch('not-an-action')
      }
    }
  })
}
import {
  Middleware,
  MiddlewareAPI,
  applyMiddleware,
  createStore,
  Dispatch,
  Reducer,
  Action,
  AnyAction
} from '../..'

/**
 * Logger middleware doesn't add any extra types to dispatch, just logs actions
 * and state.
 */
function logger() {
  const loggerMiddleware: Middleware =
    ({ getState }: MiddlewareAPI) =>
    (next: Dispatch) =>
    action => {
      console.log('will dispatch', action)

      // Call the next dispatch method in the middleware chain.
      const returnValue = next(action)

      console.log('state after dispatch', getState())

      // This will likely be the action itself, unless
      // a middleware further in chain changed it.
      return returnValue
    }

  return loggerMiddleware
}

/**
 * Promise middleware adds support for dispatching promises.
 */

type PromiseDispatch = <T extends Action>(promise: Promise<T>) => Promise<T>

function promise() {
  const promiseMiddleware: Middleware<PromiseDispatch> =
    ({ dispatch }: MiddlewareAPI) =>
    next =>
    <T extends Action>(action: AnyAction | Promise<T>) => {
      if (action instanceof Promise) {
        action.then(dispatch)
        return action
      }

      return next(action)
    }

  return promiseMiddleware
}

/**
 * Thunk middleware adds support for dispatching thunks.
 */

interface Thunk<R, S, DispatchExt = {}> {
  (dispatch: Dispatch & ThunkDispatch<S> & DispatchExt, getState: () => S): R
}

interface ThunkDispatch<S, DispatchExt = {}> {
  <R>(thunk: Thunk<R, S, DispatchExt>): R
}

function thunk<S, DispatchExt>() {
  const thunkMiddleware: Middleware<
    ThunkDispatch<S, DispatchExt>,
    S,
    Dispatch & ThunkDispatch<S>
  > =
    api =>
    (next: Dispatch) =>
    <R>(action: AnyAction | Thunk<R, any>) =>
      typeof action === 'function'
        ? action(api.dispatch, api.getState)
        : next(action)

  return thunkMiddleware
}

/**
 * Middleware that expects exact state type.
 */
function customState() {
  type State = { field: 'string' }

  const customMiddleware: Middleware<{}, State> =
    api => (next: Dispatch) => action => {
      api.getState().field
      // @ts-expect-error
      api.getState().wrongField

      return next(action)
    }

  return customMiddleware
}

/**
 * Middleware that expects custom dispatch.
 */
function customDispatch() {
  type MyAction = { type: 'INCREMENT' } | { type: 'DECREMENT' }

  // dispatch that expects action union
  type MyDispatch = Dispatch<MyAction>

  const customDispatch: Middleware =
    (api: MiddlewareAPI<MyDispatch>) => next => action => {
      api.dispatch({ type: 'INCREMENT' })
      api.dispatch({ type: 'DECREMENT' })
      // @ts-expect-error
      api.dispatch({ type: 'UNKNOWN' })
    }
}

/**
 * Test the type of store.dispatch after applying different middleware.
 */
function apply() {
  interface State {
    someField: 'string'
  }
  const reducer: Reducer<State> = null as any

  /**
   * logger
   */
  const storeWithLogger = createStore(reducer, applyMiddleware(logger()))
  // can only dispatch actions
  storeWithLogger.dispatch({ type: 'INCREMENT' })
  // @ts-expect-error
  storeWithLogger.dispatch(Promise.resolve({ type: 'INCREMENT' }))
  // @ts-expect-error
  storeWithLogger.dispatch('not-an-action')

  /**
   * promise
   */
  const storeWithPromise = createStore(reducer, applyMiddleware(promise()))
  // can dispatch actions and promises
  storeWithPromise.dispatch({ type: 'INCREMENT' })
  storeWithPromise.dispatch(Promise.resolve({ type: 'INCREMENT' }))
  // @ts-expect-error
  storeWithPromise.dispatch('not-an-action')
  // @ts-expect-error
  storeWithPromise.dispatch(Promise.resolve('not-an-action'))

  /**
   * promise + logger
   */
  const storeWithPromiseAndLogger = createStore(
    reducer,
    applyMiddleware(promise(), logger())
  )
  // can dispatch actions and promises
  storeWithPromiseAndLogger.dispatch({ type: 'INCREMENT' })
  storeWithPromiseAndLogger.dispatch(Promise.resolve({ type: 'INCREMENT' }))
  // @ts-expect-error
  storeWithPromiseAndLogger.dispatch('not-an-action')
  // @ts-expect-error
  storeWithPromiseAndLogger.dispatch(Promise.resolve('not-an-action'))

  /**
   * promise + thunk
   */
  const storeWithPromiseAndThunk = createStore(
    reducer,
    applyMiddleware(promise(), thunk<State, PromiseDispatch>(), logger())
  )
  // can dispatch actions, promises and thunks
  storeWithPromiseAndThunk.dispatch({ type: 'INCREMENT' })
  storeWithPromiseAndThunk.dispatch(Promise.resolve({ type: 'INCREMENT' }))
  storeWithPromiseAndThunk.dispatch((dispatch, getState) => {
    getState().someField
    // @ts-expect-error
    getState().wrongField

    // injected dispatch accepts actions, thunks and promises
    dispatch({ type: 'INCREMENT' })
    dispatch(dispatch => dispatch({ type: 'INCREMENT' }))
    dispatch(Promise.resolve({ type: 'INCREMENT' }))
    // @ts-expect-error
    dispatch('not-an-action')
  })
  // @ts-expect-error
  storeWithPromiseAndThunk.dispatch('not-an-action')
  // @ts-expect-error
  storeWithPromiseAndThunk.dispatch(Promise.resolve('not-an-action'))

  /**
   * Test variadic signature.
   */
  const storeWithLotsOfMiddleware = createStore(
    reducer,
    applyMiddleware<PromiseDispatch>(
      promise(),
      logger(),
      logger(),
      logger(),
      logger(),
      logger()
    )
  )
  storeWithLotsOfMiddleware.dispatch({ type: 'INCREMENT' })
  storeWithLotsOfMiddleware.dispatch(Promise.resolve({ type: 'INCREMENT' }))
}
import { Reducer, Action, combineReducers, ReducersMapObject } from '../..'

/**
 * Simple reducer definition with no action shape checks.
 * Uses string comparison to determine action type.
 *
 * `AnyAction` type is used to allow action property access without requiring
 * type casting.
 */
function simple() {
  type State = number

  const reducer: Reducer<State> = (state = 0, action) => {
    if (action.type === 'INCREMENT') {
      const { count = 1 } = action

      return state + count
    }

    if (action.type === 'DECREMENT') {
      const { count = 1 } = action

      return state - count
    }

    return state
  }

  // Reducer function accepts any object with `type` prop as action.
  // Any extra props are allowed too.
  let s: State = reducer(undefined, { type: 'init' })
  s = reducer(s, { type: 'INCREMENT' })
  s = reducer(s, { type: 'INCREMENT', count: 10 })
  s = reducer(s, { type: 'DECREMENT' })
  s = reducer(s, { type: 'DECREMENT', count: 10 })
  s = reducer(s, { type: 'SOME_OTHER_TYPE', someField: 'value' })

  // State shape is strictly checked.
  // @ts-expect-error
  reducer('string', { type: 'INCREMENT' })

  // Combined reducer also accepts any action.
  const combined = combineReducers({ sub: reducer })

  let cs: { sub: State } = combined(undefined, { type: 'init' })
  cs = combined(cs, { type: 'INCREMENT', count: 10 })

  // Combined reducer's state is strictly checked.
  // @ts-expect-error
  combined({ unknown: '' }, { type: 'INCREMENT' })
}

/**
 * Reducer definition using discriminated unions.
 *
 * See https://basarat.gitbooks.io/typescript/content/docs/types/discriminated-unions.html#redux
 */
function discriminated() {
  type State = number

  interface IncrementAction {
    type: 'INCREMENT'
    count?: number
  }

  interface DecrementAction {
    type: 'DECREMENT'
    count?: number
  }

  interface MultiplyAction {
    type: 'MULTIPLY'
    count?: number
  }

  interface DivideAction {
    type: 'DIVIDE'
    count?: number
  }

  // Union of all actions in the app.
  type MyAction0 = IncrementAction | DecrementAction
  type MyAction1 = MultiplyAction | DivideAction

  const reducer0: Reducer<State, MyAction0> = (state = 0, action) => {
    if (action.type === 'INCREMENT') {
      // Action shape is determined by `type` discriminator.
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state + count
    }

    if (action.type === 'DECREMENT') {
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state - count
    }

    return state
  }

  const reducer1: Reducer<State, MyAction1> = (state = 0, action) => {
    if (action.type === 'MULTIPLY') {
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state * count
    }

    if (action.type === 'DIVIDE') {
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state / count
    }

    return state
  }

  // Reducer state is initialized by Redux using Init action which is private.
  // To initialize manually (e.g. in tests) we have to type cast init action
  // or add a custom init action to MyAction union.
  let s: State = reducer0(undefined, { type: 'init' } as any)
  s = reducer0(s, { type: 'INCREMENT' })
  s = reducer0(s, { type: 'INCREMENT', count: 10 })
  // Known actions are strictly checked.
  // @ts-expect-error
  s = reducer0(s, { type: 'DECREMENT', coun: 10 })
  s = reducer0(s, { type: 'DECREMENT', count: 10 })
  // Unknown actions are rejected.
  // @ts-expect-error
  s = reducer0(s, { type: 'SOME_OTHER_TYPE' })
  // @ts-expect-error
  s = reducer0(s, { type: 'SOME_OTHER_TYPE', someField: 'value' })

  // Combined reducer infers state and actions by default which maintains type
  // safety and still allows inclusion of third-party reducers without the need
  // to explicitly add their state and actions to the union.
  const combined = combineReducers({ sub0: reducer0, sub1: reducer1 })

  const cs = combined(undefined, { type: 'INCREMENT' })
  combined(cs, { type: 'MULTIPLY' })
  // TODO // @ts-expect-error
  combined(cs, { type: 'init' })
  // TODO // @ts-expect-error
  combined(cs, { type: 'SOME_OTHER_TYPE' })

  // Combined reducer can be made to only accept known actions.
  const strictCombined = combineReducers<{ sub: State }, MyAction0>({
    sub: reducer0
  })

  const scs = strictCombined(undefined, { type: 'INCREMENT' })
  strictCombined(scs, { type: 'DECREMENT' })
  // @ts-expect-error
  strictCombined(scs, { type: 'SOME_OTHER_TYPE' })
}

/**
 * Reducer definition using type guards.
 */
function typeGuards() {
  function isAction<A extends Action>(action: Action, type: any): action is A {
    return action.type === type
  }

  type State = number

  interface IncrementAction {
    type: 'INCREMENT'
    count?: number
  }

  interface DecrementAction {
    type: 'DECREMENT'
    count?: number
  }

  const reducer: Reducer<State> = (state = 0, action) => {
    if (isAction<IncrementAction>(action, 'INCREMENT')) {
      // Action shape is determined by the type guard returned from `isAction`
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state + count
    }

    if (isAction<DecrementAction>(action, 'DECREMENT')) {
      // @ts-expect-error
      action.wrongField

      const { count = 1 } = action

      return state - count
    }

    return state
  }

  let s: State = reducer(undefined, { type: 'init' })
  s = reducer(s, { type: 'INCREMENT' })
  s = reducer(s, { type: 'INCREMENT', count: 10 })
  s = reducer(s, { type: 'DECREMENT' })
  s = reducer(s, { type: 'DECREMENT', count: 10 })
  s = reducer(s, { type: 'SOME_OTHER_TYPE', someField: 'value' })

  const combined = combineReducers({ sub: reducer })

  let cs: { sub: State } = combined(undefined, { type: 'init' })
  cs = combined(cs, { type: 'INCREMENT', count: 10 })
}

/**
 * Test ReducersMapObject with default type args.
 */
function reducersMapObject() {
  const obj: ReducersMapObject = {}

  for (const key of Object.keys(obj)) {
    obj[key](undefined, { type: 'SOME_TYPE' })
    // @ts-expect-error
    obj[key](undefined, 'not-an-action')
  }
}
import { combineReducers, createStore } from '../..'

/**
 * verify that replaceReducer maintains strict typing if the new types change
 */
const bar = (state = { value: 'bar' }) => state
const baz = (state = { value: 'baz' }) => state
const ACTION = {
  type: 'action'
}

const originalCompositeReducer = combineReducers({ bar })
const store = createStore(originalCompositeReducer)
store.dispatch(ACTION)

const firstState = store.getState()
firstState.bar.value
// @ts-expect-error
firstState.baz.value

const nextStore = store.replaceReducer(combineReducers({ baz })) // returns ->  { baz: { value: 'baz' }}

const nextState = nextStore.getState()
// @ts-expect-error
nextState.bar.value
nextState.baz.value
import {
  Store,
  createStore,
  Reducer,
  Action,
  StoreEnhancer,
  Unsubscribe,
  Observer,
  ExtendState
} from '../..'
import 'symbol-observable'

type BrandedString = string & { _brand: 'type' }
const brandedString = 'a string' as BrandedString

type State = {
  a: 'a'
  b: {
    c: 'c'
    d: 'd'
  }
  e: BrandedString
}

/* extended state */
const noExtend: ExtendState<State, never> = {
  a: 'a',
  b: {
    c: 'c',
    d: 'd'
  },
  e: brandedString
}

const noExtendError: ExtendState<State, never> = {
  a: 'a',
  b: {
    c: 'c',
    d: 'd'
  },
  e: brandedString,
  // @ts-expect-error
  f: 'oops'
}

const yesExtend: ExtendState<State, { yes: 'we can' }> = {
  a: 'a',
  b: {
    c: 'c',
    d: 'd'
  },
  e: brandedString,
  yes: 'we can'
}
// @ts-expect-error
const yesExtendError: ExtendState<State, { yes: 'we can' }> = {
  a: 'a',
  b: {
    c: 'c',
    d: 'd'
  },
  e: brandedString
}

interface DerivedAction extends Action {
  type: 'a'
  b: 'b'
}

const reducer: Reducer<State> = (
  state: State | undefined = {
    a: 'a',
    b: {
      c: 'c',
      d: 'd'
    },
    e: brandedString
  },
  action: Action
): State => {
  return state
}

const reducerWithAction: Reducer<State, DerivedAction> = (
  state: State | undefined = {
    a: 'a',
    b: {
      c: 'c',
      d: 'd'
    },
    e: brandedString
  },
  action: DerivedAction
): State => {
  return state
}

const funcWithStore = (store: Store<State, DerivedAction>) => {}

/* createStore */

const store: Store<State> = createStore(reducer)

// ensure that an array-based state works
const arrayReducer = (state: any[] = []) => state || []
const storeWithArrayState: Store<any[]> = createStore(arrayReducer)
const storeWithPreloadedState: Store<State> = createStore(reducer, {
  a: 'a',
  b: { c: 'c', d: 'd' },
  e: brandedString
})
// @ts-expect-error
const storeWithBadPreloadedState: Store<State> = createStore(reducer, {
  b: { c: 'c' },
  e: brandedString
})

const storeWithActionReducer = createStore(reducerWithAction)
const storeWithActionReducerAndPreloadedState = createStore(reducerWithAction, {
  a: 'a',
  b: { c: 'c', d: 'd' },
  e: brandedString
})
funcWithStore(storeWithActionReducer)
funcWithStore(storeWithActionReducerAndPreloadedState)

// @ts-expect-error
const storeWithActionReducerAndBadPreloadedState = createStore(
  reducerWithAction,
  {
    b: { c: 'c' },
    e: brandedString
  }
)

const enhancer: StoreEnhancer = next => next

const storeWithSpecificEnhancer: Store<State> = createStore(reducer, enhancer)

const storeWithPreloadedStateAndEnhancer: Store<State> = createStore(
  reducer,
  {
    a: 'a',
    b: { c: 'c', d: 'd' },
    e: brandedString
  },
  enhancer
)

const storeWithBadPreloadedStateAndEnhancer: Store<State> = createStore(
  reducer,
  {
    // @ts-expect-error
    b: { c: 'c' }
  },
  enhancer
)

/* dispatch */

store.dispatch({
  type: 'ADD_TODO',
  text: 'test'
})

/* getState */

const state: State = store.getState()

/* subscribe / unsubscribe */

const unsubscribe: Unsubscribe = store.subscribe(() => {
  console.log('Current state:', store.getState())
})

unsubscribe()

/* replaceReducer */

const newReducer: Reducer<State> = reducer

store.replaceReducer(newReducer)

/* observable */

let observable = store[Symbol.observable]()
observable = observable[Symbol.observable]()
const observer: Observer<State> = {
  next(state: State) {
    console.log('current state:', state)
  }
}
const unsubscribeFromObservable = observable.subscribe(observer).unsubscribe
unsubscribeFromObservable()
