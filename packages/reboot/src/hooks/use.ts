/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback, useRef, useEffect, useState, EffectCallback } from "react"
import type { DependencyList } from "react"
import type React from "react"
import { useLayoutEffect } from "react"
import { useReducer, Reducer } from "react"
import { MutableRefObject, useMemo } from "react"
import type { SyntheticEvent } from "react"
import type { Dispatch, SetStateAction } from "react"
import { dequal } from "dequal"

export function useCallbackRef<TValue = unknown>(): [
  TValue | null,
  (ref: TValue | null) => void
] {
  return useState<TValue | null>(null)
}

export function useInterval(fn: () => void, ms: number): void
export function useInterval(fn: () => void, ms: number, paused: boolean): void
export function useInterval(
  fn: () => void,
  ms: number,
  paused: boolean,
  runImmediately: boolean
): void
export function useInterval(
  fn: () => void,
  ms: number,
  paused = false,
  runImmediately = false
): void {
  let handle: number
  const fnRef = useCommittedRef(fn)
  const pausedRef = useCommittedRef(paused)
  const tick = () => {
    if (pausedRef.current) return
    fnRef.current()
    schedule()
  }
  const schedule = () => {
    clearTimeout(handle)
    handle = setTimeout(tick, ms) as any
  }
  useEffect(() => {
    if (runImmediately) {
      tick()
    } else {
      schedule()
    }
    return () => clearTimeout(handle)
  }, [paused, runImmediately])
}

const isReactNative =
  typeof global !== "undefined" &&
  global.navigator &&
  global.navigator.product === "ReactNative"

const isDOM = typeof document !== "undefined"

export const useIsomorphicEffect =
  isDOM || isReactNative ? useLayoutEffect : useEffect

export class ObservableMap<K, V> extends Map<K, V> {
  private readonly listener: (map: ObservableMap<K, V>) => void
  constructor(
    listener: (map: ObservableMap<K, V>) => void,
    init?: Iterable<Readonly<[K, V]>>
  ) {
    super(init as any)
    this.listener = listener
  }
  override set(key: K, value: V): this {
    super.set(key, value)
    if (this.listener) this.listener(this)
    return this
  }
  override delete(key: K): boolean {
    let result = super.delete(key)
    this.listener(this)
    return result
  }
  override clear(): void {
    super.clear()
    this.listener(this)
  }
}

export function useMap<K, V>(init?: Iterable<Readonly<[K, V]>>) {
  const forceUpdate = useForceUpdate()
  return useStableMemo(() => new ObservableMap<K, V>(forceUpdate, init), [])
}

interface RefCountedMediaQueryList extends MediaQueryList {
  refCount: number
}
const matchersByWindow = new WeakMap<
  Window,
  Map<string, RefCountedMediaQueryList>
>()

const getMatcher = (
  query: string | null,
  targetWindow?: Window
): RefCountedMediaQueryList | undefined => {
  if (!query || !targetWindow) return undefined
  const matchers =
    matchersByWindow.get(targetWindow) ||
    new Map<string, RefCountedMediaQueryList>()
  matchersByWindow.set(targetWindow, matchers)
  let mql = matchers.get(query)
  if (!mql) {
    mql = targetWindow.matchMedia(query) as RefCountedMediaQueryList
    mql.refCount = 0
    matchers.set(mql.media, mql)
  }
  return mql
}

export function useMediaQuery(
  query: string | null,
  targetWindow: Window | undefined = typeof window === "undefined"
    ? undefined
    : window
) {
  const mql = getMatcher(query, targetWindow)
  const [matches, setMatches] = useState(() => (mql ? mql.matches : false))
  useEffect(() => {
    let mql = getMatcher(query, targetWindow)
    if (!mql) {
      return setMatches(false)
    }
    const matchers = matchersByWindow.get(targetWindow!)
    const handleChange = () => {
      setMatches(mql!.matches)
    }
    mql.refCount++
    mql.addListener(handleChange)
    handleChange()
    return () => {
      mql!.removeListener(handleChange)
      mql!.refCount--
      if (mql!.refCount <= 0) {
        matchers?.delete(mql!.media)
      }
      mql = undefined
    }
  }, [query])
  return matches
}

type CallbackRef<T> = (ref: T | null) => void
type Ref<T> = React.MutableRefObject<T> | CallbackRef<T>

const toFnRef = <T>(ref?: Ref<T> | null) =>
  !ref || typeof ref === "function"
    ? ref
    : (value: T) => {
        ref.current = value
      }

export function mergeRefs<T>(refA?: Ref<T> | null, refB?: Ref<T> | null) {
  const a = toFnRef(refA)
  const b = toFnRef(refB)
  return (value: T | null) => {
    if (a) a(value)
    if (b) b(value)
  }
}

export function useMergedRefs<T>(refA?: Ref<T> | null, refB?: Ref<T> | null) {
  return useMemo(() => mergeRefs(refA, refB), [refA, refB])
}

type Updater<TState> = (state: TState) => Partial<TState> | null

export type MergeStateSetter<TState> = (
  update: Updater<TState> | Partial<TState> | null
) => void

export function useMergeState<TState extends {}>(
  initialState: TState | (() => TState)
): [TState, MergeStateSetter<TState>] {
  const [state, setState] = useState<TState>(initialState)
  const updater = useCallback(
    (update: Updater<TState> | Partial<TState> | null) => {
      if (update === null) return
      if (typeof update === "function") {
        setState(state => {
          const nextState = update(state)
          return nextState == null ? state : { ...state, ...nextState }
        })
      } else {
        setState(state => ({ ...state, ...update }))
      }
    },
    [setState]
  )
  return [state, updater]
}

type Mapper<TProps, TState> = (
  props: TProps,
  state: TState
) => null | Partial<TState>

export function useMergeStateFromProps<TProps, TState>(
  props: TProps,
  gDSFP: Mapper<TProps, TState>,
  initialState: TState
): [TState, MergeStateSetter<TState>] {
  const [state, setState] = useMergeState<TState>(initialState)
  const nextState = gDSFP(props, state)
  if (nextState !== null) setState(nextState)
  return [state, setState]
}

export function useMounted(): () => boolean {
  const mounted = useRef(true)
  const isMounted = useRef(() => mounted.current)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return isMounted.current
}

export function useMountEffect(effect: EffectCallback) {
  return useEffect(effect, [])
}

type Deps = [Element | null | undefined, MutationObserverInit]

function isDepsEqual(
  [nextElement, nextConfig]: Deps,
  [prevElement, prevConfig]: Deps
) {
  return nextElement === prevElement && dequal(nextConfig, prevConfig)
}

export function useMutationObserver(
  element: Element | null | undefined,
  config: MutationObserverInit,
  callback: MutationCallback
): void
export function useMutationObserver(
  element: Element | null | undefined,
  config: MutationObserverInit
): MutationRecord[]
export function useMutationObserver(
  element: Element | null | undefined,
  config: MutationObserverInit,
  callback?: MutationCallback
): MutationRecord[] | void {
  const [records, setRecords] = useState<MutationRecord[] | null>(null)
  const handler = useEventCallback(callback || setRecords)
  useCustomEffect(
    () => {
      if (!element) return
      const observer = new MutationObserver(handler)
      observer.observe(element, config)
      return () => {
        observer.disconnect()
      }
    },
    [element, config],
    {
      isEqual: isDepsEqual,
      effectHook: useImmediateUpdateEffect,
    }
  )
  return callback ? void 0 : records || []
}

export function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export function useRafInterval(fn: () => void, ms: number): void
export function useRafInterval(
  fn: () => void,
  ms: number,
  paused = false
): void {
  let handle: number
  let start = new Date().getTime()
  const fnRef = useCommittedRef(fn)
  const pausedRef = useCommittedRef(paused)
  function loop() {
    const current = new Date().getTime()
    const delta = current - start
    if (pausedRef.current) return
    if (delta >= ms && fnRef.current) {
      fnRef.current()
      start = new Date().getTime()
    }
    cancelAnimationFrame(handle)
    handle = requestAnimationFrame(loop)
  }
  useEffect(() => {
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  }, [])
}

const dft: any = Symbol("default value sigil")

export function useRefWithInitialValueFactory<T>(initialValueFactory: () => T) {
  const ref = useRef<T>(dft)
  if (ref.current === dft) {
    ref.current = initialValueFactory()
  }
  return ref
}

export interface Rect {
  width: number
  height: number
  x?: number
  y?: number
}

type Handler = (contentRect: Rect) => void

const targetMap = new WeakMap<Element, Handler>()
let resizeObserver: ResizeObserver

function getResizeObserver() {
  return (resizeObserver =
    resizeObserver ||
    new window.ResizeObserver((entries: ResizeObserverEntry[]) => {
      entries.forEach(entry => {
        const handler = targetMap.get(entry.target)
        if (handler) handler(entry.contentRect)
      })
    }))
}

export function useResizeObserver<TElement extends Element>(
  element: TElement | null | undefined
): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)
  useEffect(() => {
    if (!element) return
    getResizeObserver().observe(element)
    setRect(element.getBoundingClientRect())
    targetMap.set(element, rect => {
      setRect(rect)
    })
    return () => {
      targetMap.delete(element)
    }
  }, [element])
  return rect
}

type StateSetter<TState> = Dispatch<SetStateAction<TState>>

export function useSafeState<TState>(
  state: [TState, AsyncSetState<TState>]
): [TState, (stateUpdate: React.SetStateAction<TState>) => Promise<void>]
export function useSafeState<TState>(
  state: [TState, StateSetter<TState>]
): [TState, StateSetter<TState>]
export function useSafeState<TState>(
  state: [TState, StateSetter<TState> | AsyncSetState<TState>]
): [TState, StateSetter<TState> | AsyncSetState<TState>] {
  const isMounted = useMounted()
  return [
    state[0],
    useCallback(
      (nextState: SetStateAction<TState>) => {
        if (!isMounted()) return
        return state[1](nextState)
      },
      [isMounted, state[1]]
    ),
  ]
}

export class ObservableSet<V> extends Set<V> {
  private readonly listener: (map: ObservableSet<V>) => void
  constructor(listener: (map: ObservableSet<V>) => void, init?: Iterable<V>) {
    super(init as any)
    this.listener = listener
  }
  override add(value: V): this {
    super.add(value)
    if (this.listener) this.listener(this)
    return this
  }
  override delete(value: V): boolean {
    const result = super.delete(value)
    this.listener(this)
    return result
  }
  override clear(): void {
    super.clear()
    this.listener(this)
  }
}

export function useSet<V>(init?: Iterable<V>): ObservableSet<V> {
  const forceUpdate = useForceUpdate()
  return useStableMemo(() => new ObservableSet<V>(forceUpdate, init), [])
}

function isEqual(a: DependencyList, b: DependencyList) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

type DepsCache<T> = {
  deps?: DependencyList
  result: T
}

export function useStableMemo<T>(factory: () => T, deps?: DependencyList): T {
  let isValid: boolean = true
  const valueRef = useRef<DepsCache<T>>()
  if (!valueRef.current) {
    valueRef.current = {
      deps,
      result: factory(),
    }
  } else {
    isValid = !!(
      deps &&
      valueRef.current.deps &&
      isEqual(deps, valueRef.current.deps)
    )
  }
  const cache = isValid ? valueRef.current : { deps, result: factory() }
  valueRef.current = cache
  return cache.result
}

type Updater<TState> = (state: TState) => TState

export type AsyncSetState<TState> = (
  stateUpdate: React.SetStateAction<TState>
) => Promise<TState>

export function useStateAsync<TState>(
  initialState: TState | (() => TState)
): [TState, AsyncSetState<TState>] {
  const [state, setState] = useState(initialState)
  const resolvers = useRef<((state: TState) => void)[]>([])
  useEffect(() => {
    resolvers.current.forEach(resolve => resolve(state))
    resolvers.current.length = 0
  }, [state])
  const setStateAsync = useCallback(
    (update: Updater<TState> | TState) => {
      return new Promise<TState>((resolve, reject) => {
        setState(prevState => {
          try {
            let nextState: TState
            if (update instanceof Function) {
              nextState = update(prevState)
            } else {
              nextState = update
            }
            if (!resolvers.current.length && Object.is(nextState, prevState)) {
              resolve(nextState)
            } else {
              resolvers.current.push(resolve)
            }
            return nextState
          } catch (e) {
            reject(e)
            throw e
          }
        })
      })
    },
    [setState]
  )
  return [state, setStateAsync]
}

const isSyntheticEvent = (event: any): event is SyntheticEvent =>
  typeof event.persist === "function"

export type ThrottledHandler<TEvent> = ((event: TEvent) => void) & {
  clear(): void
}

export function useThrottledEventHandler<TEvent = SyntheticEvent>(
  handler: (event: TEvent) => void
): ThrottledHandler<TEvent> {
  const isMounted = useMounted()
  const eventHandler = useEventCallback(handler)
  const nextEventInfoRef = useRef<{
    event: TEvent | null
    handle: null | number
  }>({
    event: null,
    handle: null,
  })
  const clear = () => {
    cancelAnimationFrame(nextEventInfoRef.current.handle!)
    nextEventInfoRef.current.handle = null
  }
  const handlePointerMoveAnimation = () => {
    const { current: next } = nextEventInfoRef
    if (next.handle && next.event) {
      if (isMounted()) {
        next.handle = null
        eventHandler(next.event)
      }
    }
    next.event = null
  }
  const throttledHandler = (event: TEvent) => {
    if (!isMounted()) return
    if (isSyntheticEvent(event)) {
      event.persist()
    } else if ("evt" in event) {
      event = { ...event }
    }
    nextEventInfoRef.current.event = event
    if (!nextEventInfoRef.current.handle) {
      nextEventInfoRef.current.handle = requestAnimationFrame(
        handlePointerMoveAnimation
      )
    }
  }
  throttledHandler.clear = clear
  return throttledHandler
}

const MAX_DELAY_MS = 2 ** 31 - 1

function setChainedTimeout(
  handleRef: MutableRefObject<any>,
  fn: () => void,
  timeoutAtMs: number
) {
  const delayMs = timeoutAtMs - Date.now()
  handleRef.current =
    delayMs <= MAX_DELAY_MS
      ? setTimeout(fn, delayMs)
      : setTimeout(
          () => setChainedTimeout(handleRef, fn, timeoutAtMs),
          MAX_DELAY_MS
        )
}

export function useTimeout() {
  const isMounted = useMounted()
  const handleRef = useRef<any>()
  useWillUnmount(() => clearTimeout(handleRef.current))
  return useMemo(() => {
    const clear = () => clearTimeout(handleRef.current)
    function set(fn: () => void, delayMs = 0): void {
      if (!isMounted()) return
      clear()
      if (delayMs <= MAX_DELAY_MS) {
        handleRef.current = setTimeout(fn, delayMs)
      } else {
        setChainedTimeout(handleRef, fn, Date.now() + delayMs)
      }
    }
    return { set, clear }
  }, [])
}

export function useToggleState(initialState = false) {
  return useReducer<Reducer<boolean, boolean | undefined>>(
    (state: boolean, action?: boolean) => (action == null ? !state : action),
    initialState
  ) as [boolean, (value?: boolean) => void]
}

export function useUpdatedRef<T>(value: T) {
  const valueRef = useRef<T>(value)
  valueRef.current = value
  return valueRef
}

export function useUpdateEffect(fn: EffectCallback, deps: DependencyList) {
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return fn()
  }, deps)
}

export function useUpdateImmediateEffect(
  effect: EffectCallback,
  deps: DependencyList
) {
  const firstRef = useRef(true)
  const tearDown = useRef<ReturnType<EffectCallback>>()
  useWillUnmount(() => {
    if (tearDown.current) tearDown.current()
  })
  useStableMemo(() => {
    if (firstRef.current) {
      firstRef.current = false
      return
    }
    if (tearDown.current) tearDown.current()
    tearDown.current = effect()
  }, deps)
}

export function useUpdateLayoutEffect(
  fn: EffectCallback,
  deps: DependencyList
) {
  const isFirst = useRef(true)
  useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return fn()
  }, deps)
}

export default function useWillUnmount(fn: () => void) {
  const onUnmount = useUpdatedRef(fn)
  useEffect(() => () => onUnmount.current(), [])
}
