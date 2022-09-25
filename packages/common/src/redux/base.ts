import * as qt from "./types.js"
import * as qu from "./utils.js"

export function applyMiddleware(): qt.StoreEnhancer
export function applyMiddleware<Ext1, S>(middleware1: qt.Middleware<Ext1, S, any>): qt.StoreEnhancer<{ dispatch: Ext1 }>
export function applyMiddleware<Ext1, Ext2, S>(middleware1: qt.Middleware<Ext1, S, any>, middleware2: qt.Middleware<Ext2, S, any>): qt.StoreEnhancer<{ dispatch: Ext1 & Ext2 }>
export function applyMiddleware<Ext1, Ext2, Ext3, S>(
  middleware1: qt.Middleware<Ext1, S, any>,
  middleware2: qt.Middleware<Ext2, S, any>,
  middleware3: qt.Middleware<Ext3, S, any>
): qt.StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 }>
export function applyMiddleware<Ext1, Ext2, Ext3, Ext4, S>(
  middleware1: qt.Middleware<Ext1, S, any>,
  middleware2: qt.Middleware<Ext2, S, any>,
  middleware3: qt.Middleware<Ext3, S, any>,
  middleware4: qt.Middleware<Ext4, S, any>
): qt.StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 }>
export function applyMiddleware<Ext1, Ext2, Ext3, Ext4, Ext5, S>(
  middleware1: qt.Middleware<Ext1, S, any>,
  middleware2: qt.Middleware<Ext2, S, any>,
  middleware3: qt.Middleware<Ext3, S, any>,
  middleware4: qt.Middleware<Ext4, S, any>,
  middleware5: qt.Middleware<Ext5, S, any>
): qt.StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 & Ext5 }>
export function applyMiddleware<Ext, S = any>(...middlewares: qt.Middleware<any, S, any>[]): qt.StoreEnhancer<{ dispatch: Ext }>
export function applyMiddleware(...middlewares: qt.Middleware[]): qt.StoreEnhancer<any> {
  return (createStore: qt.StoreEnhancerStoreCreator) =>
    <S, A extends qt.AnyAction>(reducer: qt.Reducer<S, A>, preloadedState?: qt.PreloadedState<S>) => {
      const store = createStore(reducer, preloadedState)
      let dispatch: qt.Dispatch = () => {
        throw new Error("Dispatching while constructing your middleware is not allowed. " + "Other middleware would not be applied to this dispatch.")
      }
      const middlewareAPI: qt.MiddlewareAPI = {
        getState: store.getState,
        dispatch: (action, ...args) => dispatch(action, ...args),
      }
      const chain = middlewares.map(middleware => middleware(middlewareAPI))
      dispatch = compose<typeof dispatch>(...chain)(store.dispatch)
      return {
        ...store,
        dispatch,
      }
    }
}

function bindActionCreator<A extends qt.AnyAction = qt.AnyAction>(actionCreator: qt.ActionCreator<A>, dispatch: qt.Dispatch) {
  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export function bindActionCreators<A, C extends qt.ActionCreator<A>>(actionCreator: C, dispatch: qt.Dispatch): C
export function bindActionCreators<A extends qt.ActionCreator<any>, B extends qt.ActionCreator<any>>(actionCreator: A, dispatch: qt.Dispatch): B
export function bindActionCreators<A, M extends qt.ActionCreatorsMapObject<A>>(actionCreators: M, dispatch: qt.Dispatch): M
export function bindActionCreators<M extends qt.ActionCreatorsMapObject, N extends qt.ActionCreatorsMapObject>(actionCreators: M, dispatch: qt.Dispatch): N
export function bindActionCreators(actionCreators: qt.ActionCreator<any> | qt.ActionCreatorsMapObject, dispatch: qt.Dispatch) {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch)
  }
  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, but instead received: '${qu.kindOf(actionCreators)}'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }
  const boundActionCreators: qt.ActionCreatorsMapObject = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}

function getUnexpectedStateShapeWarningMessage(inputState: object, reducers: qt.ReducersMapObject, action: qt.Action, unexpectedKeyCache: { [key: string]: true }) {
  const reducerKeys = Object.keys(reducers)
  const argumentName = action && action.type === qu.ActionTypes.INIT ? "preloadedState argument passed to createStore" : "previous state received by the reducer"
  if (reducerKeys.length === 0) {
    return "Store does not have a valid reducer. Make sure the argument passed " + "to combineReducers is an object whose values are reducers."
  }
  if (!qu.isPlainObject(inputState)) {
    return `The ${argumentName} has unexpected type of "${qu.kindOf(inputState)}". Expected argument to be an object with the following ` + `keys: "${reducerKeys.join('", "')}"`
  }
  const unexpectedKeys = Object.keys(inputState).filter(key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key])
  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })
  if (action && action.type === qu.ActionTypes.REPLACE) return
  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

function assertReducerShape(reducers: qt.ReducersMapObject) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]!
    const initialState = reducer(undefined, { type: qu.ActionTypes.INIT })
    if (typeof initialState === "undefined") {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }
    if (
      typeof reducer(undefined, {
        type: qu.ActionTypes.PROBE_UNKNOWN_ACTION(),
      }) === "undefined"
    ) {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle '${qu.ActionTypes.INIT}' or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

export function combineReducers<S>(reducers: qt.ReducersMapObject<S, any>): qt.Reducer<qt.CombinedState<S>>
export function combineReducers<S, A extends qt.Action = qt.AnyAction>(reducers: qt.ReducersMapObject<S, A>): qt.Reducer<qt.CombinedState<S>, A>
export function combineReducers<M extends qt.ReducersMapObject>(reducers: M): qt.Reducer<qt.CombinedState<qt.StateFromReducersMapObject<M>>, qt.ActionFromReducersMapObject<M>>
export function combineReducers(reducers: qt.ReducersMapObject) {
  const reducerKeys = Object.keys(reducers)
  const finalReducers: qt.ReducersMapObject = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]!
    if (process.env["NODE_ENV"] !== "production") {
      if (typeof reducers[key] === "undefined") {
        qu.warning(`No reducer provided for key "${key}"`)
      }
    }
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key]!
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)
  let unexpectedKeyCache: { [key: string]: true }
  if (process.env["NODE_ENV"] !== "production") {
    unexpectedKeyCache = {}
  }
  let shapeAssertionError: unknown
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }
  return function combination(state: qt.StateFromReducersMapObject<typeof reducers> = {}, action: qt.AnyAction) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }
    if (process.env["NODE_ENV"] !== "production") {
      const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache)
      if (warningMessage) {
        qu.warning(warningMessage)
      }
    }
    let hasChanged = false
    const nextState: qt.StateFromReducersMapObject<typeof reducers> = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]!
      const reducer = finalReducers[key]!
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === "undefined") {
        const actionType = action && action.type
        throw new Error(
          `When called with an action of type ${actionType ? `"${String(actionType)}"` : "(unknown type)"}, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        )
      }
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length
    return hasChanged ? nextState : state
  }
}

type Func<T extends any[], R> = (...a: T) => R

export function compose(): <R>(a: R) => R
export function compose<F extends Function>(f: F): F
export function compose<A, T extends any[], R>(f1: (a: A) => R, f2: Func<T, A>): Func<T, R>
export function compose<A, B, T extends any[], R>(f1: (b: B) => R, f2: (a: A) => B, f3: Func<T, A>): Func<T, R>
export function compose<A, B, C, T extends any[], R>(f1: (c: C) => R, f2: (b: B) => C, f3: (a: A) => B, f4: Func<T, A>): Func<T, R>
export function compose<R>(f1: (a: any) => R, ...funcs: Function[]): (...args: any[]) => R
export function compose<R>(...funcs: Function[]): (...args: any[]) => R
export function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    return <T>(arg: T) => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  )
}

export function createStore<S, A extends qt.Action, Ext = {}, StateExt = never>(
  reducer: qt.Reducer<S, A>,
  enhancer?: qt.StoreEnhancer<Ext, StateExt>
): qt.Store<qt.ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export function createStore<S, A extends qt.Action, Ext = {}, StateExt = never>(
  reducer: qt.Reducer<S, A>,
  preloadedState?: qt.PreloadedState<S>,
  enhancer?: qt.StoreEnhancer<Ext, StateExt>
): qt.Store<qt.ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export function createStore<S, A extends qt.Action, Ext = {}, StateExt = never>(
  reducer: qt.Reducer<S, A>,
  preloadedState?: qt.PreloadedState<S> | qt.StoreEnhancer<Ext, StateExt>,
  enhancer?: qt.StoreEnhancer<Ext, StateExt>
): qt.Store<qt.ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
  if ((typeof preloadedState === "function" && typeof enhancer === "function") || (typeof enhancer === "function" && typeof arguments[3] === "function")) {
    throw new Error(
      "It looks like you are passing several store enhancers to " +
        "createStore(). This is not supported. Instead, compose them " +
        "together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example."
    )
  }
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState as qt.StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error(`Expected the enhancer to be a function. Instead, received: '${qu.kindOf(enhancer)}'`)
    }
    return enhancer(createStore)(reducer, preloadedState as qt.PreloadedState<S>) as qt.Store<qt.ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }
  if (typeof reducer !== "function") {
    throw new Error(`Expected the root reducer to be a function. Instead, received: '${qu.kindOf(reducer)}'`)
  }
  const currentReducer = reducer
  let currentState = preloadedState as S
  let currentListeners: (() => void)[] | null = []
  let nextListeners = currentListeners
  let isDispatching = false
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
  function getState(): S {
    if (isDispatching) {
      throw new Error(
        "You may not call store.getState() while the reducer is executing. " +
          "The reducer has already received the state as an argument. " +
          "Pass it down from the top reducer instead of reading it from the store."
      )
    }
    return currentState as S
  }
  function subscribe(listener: () => void) {
    if (typeof listener !== "function") {
      throw new Error(`Expected the listener to be a function. Instead, received: '${qu.kindOf(listener)}'`)
    }
    if (isDispatching) {
      throw new Error(
        "You may not call store.subscribe() while the reducer is executing. " +
          "If you would like to be notified after the store has been updated, subscribe from a " +
          "component and invoke store.getState() in the callback to access the latest state. " +
          "See https://redux.js.org/api/store#subscribelistener for more details."
      )
    }
    let isSubscribed = true
    ensureCanMutateNextListeners()
    nextListeners.push(listener)
    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }
      if (isDispatching) {
        throw new Error("You may not unsubscribe from a store listener while the reducer is executing. " + "See https://redux.js.org/api/store#subscribelistener for more details.")
      }
      isSubscribed = false
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }
  function dispatch(action: A) {
    if (!qu.isPlainObject(action)) {
      throw new Error(
        `Actions must be plain objects. Instead, the actual type was: '${qu.kindOf(
          action
        )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
      )
    }
    if (typeof action.type === "undefined") {
      throw new Error('Actions may not have an undefined "type" property. You may have misspelled an action type string constant.')
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.")
    }
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]!
      listener()
    }
    return action
  }
  function replaceReducer<NewState, NewActions extends A>(nextReducer: qt.Reducer<NewState, NewActions>): qt.Store<qt.ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    if (typeof nextReducer !== "function") {
      throw new Error(`Expected the nextReducer to be a function. Instead, received: '${qu.kindOf(nextReducer)}`)
    }
    ;(currentReducer as unknown as qt.Reducer<NewState, NewActions>) = nextReducer
    dispatch({ type: qu.ActionTypes.REPLACE } as A)
    return store as unknown as qt.Store<qt.ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext
  }
  function observable() {
    const outerSubscribe = subscribe
    return {
      subscribe(observer: unknown) {
        if (typeof observer !== "object" || observer === null) {
          throw new TypeError(`Expected the observer to be an object. Instead, received: '${qu.kindOf(observer)}'`)
        }
        function observeState() {
          const observerAsObserver = observer as qt.Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }
        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },
      [qt.$$observable]() {
        return this
      },
    }
  }
  dispatch({ type: qu.ActionTypes.INIT } as A)
  const store = {
    dispatch: dispatch as qt.Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [qt.$$observable]: observable,
  } as unknown as qt.Store<qt.ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
}
function isCrushed() {}
if (process.env["NODE_ENV"] !== "production" && typeof isCrushed.name === "string" && isCrushed.name !== "isCrushed") {
  qu.warning(
    'You are currently using minified code outside of NODE_ENV === "production". ' +
      "This means that you are running a slower development build of Redux. " +
      "You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify " +
      "or setting mode to production in webpack (https://webpack.js.org/configuration/mode/) " +
      "to ensure you have the correct code for your production build."
  )
}
