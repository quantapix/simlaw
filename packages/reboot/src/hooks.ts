import { useCallback, useRef, useEffect, useState, EffectCallback } from "react"
import type { DependencyList } from "react"
import type React from "react"
import { useLayoutEffect } from "react"
import { useReducer, Reducer } from "react"
import { MutableRefObject, useMemo } from "react"
import type { SyntheticEvent } from "react"
import type { Dispatch, SetStateAction } from "react"
import { dequal } from "dequal"
import { useDebugValue } from "react"

interface Window {
  ResizeObserver: ResizeObserver
}

interface ResizeObserver {
  new (callback: ResizeObserverCallback)
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}

interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void
}

interface ResizeObserverEntry {
  new (target: Element)
  readonly target: Element
  readonly contentRect: DOMRectReadOnly
}

interface DOMRectReadOnly {
  fromRect(other: DOMRectInit | undefined): DOMRectReadOnly
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
  toJSON: () => any
}

export interface UseAnimationFrameReturn {
  cancel(): void
  request(callback: FrameRequestCallback): void
  request(cancelPrevious: boolean, callback: FrameRequestCallback): void
}

export function useAnimationFrame(): UseAnimationFrameReturn {
  const isMounted = useMounted()
  const handle = useRef<number | undefined>()
  const cancel = () => {
    if (handle.current != null) {
      cancelAnimationFrame(handle.current)
    }
  }
  useWillUnmount(cancel)
  return useStableMemo(
    () => ({
      request(
        cancelPrevious: boolean | FrameRequestCallback,
        fn?: FrameRequestCallback
      ) {
        if (!isMounted()) return
        if (cancelPrevious) cancel()
        handle.current = requestAnimationFrame(
          fn || (cancelPrevious as FrameRequestCallback)
        )
      },
      cancel,
    }),
    []
  )
}

export type BreakpointDirection = "up" | "down" | true

export type BreakpointMap<TKey extends string> = Partial<
  Record<TKey, BreakpointDirection>
>

export function createBreakpointHook<TKey extends string>(
  breakpointValues: Record<TKey, string | number>
) {
  const names = Object.keys(breakpointValues) as TKey[]
  function and(query: string, next: string) {
    if (query === next) {
      return next
    }
    return query ? `${query} and ${next}` : next
  }
  function getNext(breakpoint: TKey) {
    return names[Math.min(names.indexOf(breakpoint) + 1, names.length - 1)]
  }
  function getMaxQuery(breakpoint: TKey) {
    const next = getNext(breakpoint)
    let value = breakpointValues[next]
    if (typeof value === "number") value = `${value - 0.2}px`
    else value = `calc(${value} - 0.2px)`

    return `(max-width: ${value})`
  }
  function getMinQuery(breakpoint: TKey) {
    let value = breakpointValues[breakpoint]
    if (typeof value === "number") {
      value = `${value}px`
    }
    return `(min-width: ${value})`
  }
  function useBreakpoint(
    breakpointMap: BreakpointMap<TKey>,
    window?: Window
  ): boolean
  function useBreakpoint(
    breakpoint: TKey,
    direction?: BreakpointDirection,
    window?: Window
  ): boolean
  function useBreakpoint(
    breakpointOrMap: TKey | BreakpointMap<TKey>,
    direction?: BreakpointDirection | Window,
    window?: Window
  ): boolean {
    let breakpointMap: BreakpointMap<TKey>
    if (typeof breakpointOrMap === "object") {
      breakpointMap = breakpointOrMap
      window = direction as Window
      direction = true
    } else {
      direction = direction || true
      breakpointMap = { [breakpointOrMap]: direction } as Record<
        TKey,
        BreakpointDirection
      >
    }
    const query = useMemo(
      () =>
        Object.entries(breakpointMap).reduce(
          (query, [key, direction]: [TKey, BreakpointDirection]) => {
            if (direction === "up" || direction === true) {
              query = and(query, getMinQuery(key))
            }
            if (direction === "down" || direction === true) {
              query = and(query, getMaxQuery(key))
            }

            return query
          },
          ""
        ),
      [JSON.stringify(breakpointMap)]
    )
    return useMediaQuery(query, window)
  }
  return useBreakpoint
}

export type DefaultBreakpoints = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"
export type DefaultBreakpointMap = BreakpointMap<DefaultBreakpoints>

export const useBreakpoint = createBreakpointHook<DefaultBreakpoints>({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
})

export function useCallbackRef<TValue = unknown>(): [
  TValue | null,
  (ref: TValue | null) => void
] {
  return useState<TValue | null>(null)
}

export function useCommittedRef<TValue>(
  value: TValue
): React.MutableRefObject<TValue> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

export type EffectHook = (effect: EffectCallback, deps?: DependencyList) => void

export type IsEqual<TDeps extends DependencyList> = (
  nextDeps: TDeps,
  prevDeps: TDeps
) => boolean

export type CustomEffectOptions<TDeps extends DependencyList> = {
  isEqual: IsEqual<TDeps>
  effectHook?: EffectHook
}

type CleanUp = {
  (): void
  cleanup?: ReturnType<EffectCallback>
}

export function useCustomEffect<TDeps extends DependencyList = DependencyList>(
  effect: EffectCallback,
  dependencies: TDeps,
  isEqual: IsEqual<TDeps>
): void
export function useCustomEffect<TDeps extends DependencyList = DependencyList>(
  effect: EffectCallback,
  dependencies: TDeps,
  options: CustomEffectOptions<TDeps>
): void
export function useCustomEffect<TDeps extends DependencyList = DependencyList>(
  effect: EffectCallback,
  dependencies: TDeps,
  isEqualOrOptions: IsEqual<TDeps> | CustomEffectOptions<TDeps>
) {
  const isMounted = useMounted()
  const { isEqual, effectHook = useEffect } =
    typeof isEqualOrOptions === "function"
      ? { isEqual: isEqualOrOptions }
      : isEqualOrOptions
  const dependenciesRef = useRef<TDeps>()
  dependenciesRef.current = dependencies
  const cleanupRef = useRef<CleanUp | null>(null)
  effectHook(() => {
    if (cleanupRef.current === null) {
      const cleanup = effect()
      cleanupRef.current = () => {
        if (isMounted() && isEqual(dependenciesRef.current!, dependencies)) {
          return
        }
        cleanupRef.current = null
        if (cleanup) cleanup()
      }
    }
    return cleanupRef.current
  })
  useDebugValue(effect)
}

export function useDebouncedCallback<TCallback extends (...args: any[]) => any>(
  fn: TCallback,
  delay: number
): TCallback {
  const timeout = useTimeout()
  return useCallback(
    (...args: any[]) => {
      timeout.set(() => {
        fn(...args)
      }, delay)
    },
    [fn, delay]
  ) as any
}

export function useDebouncedState<T>(
  initialState: T,
  delay: number
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initialState)
  const debouncedSetState = useDebouncedCallback<Dispatch<SetStateAction<T>>>(
    setState,
    delay
  )
  return [state, debouncedSetState]
}

export function useDebouncedValue<TValue>(
  value: TValue,
  delayMs = 500
): TValue {
  const [debouncedValue, setDebouncedValue] = useDebouncedState(value, delayMs)
  useDebugValue(debouncedValue)
  useEffect(() => {
    setDebouncedValue(value)
  }, [value, delayMs])
  return debouncedValue
}

export function useEventCallback<TCallback extends (...args: any[]) => any>(
  fn?: TCallback | null
): TCallback {
  const ref = useCommittedRef(fn)
  return useCallback(
    function (...args: any[]) {
      return ref.current && ref.current(...args)
    },
    [ref]
  ) as any
}

type EventHandler<T, K extends keyof DocumentEventMap> = (
  this: T,
  ev: DocumentEventMap[K]
) => any

export function useEventListener<
  T extends Element | Document | Window,
  K extends keyof DocumentEventMap
>(
  eventTarget: T | (() => T),
  event: K,
  listener: EventHandler<T, K>,
  capture: boolean | AddEventListenerOptions = false
) {
  const handler = useEventCallback(listener)
  useEffect(() => {
    const target =
      typeof eventTarget === "function" ? eventTarget() : eventTarget
    target.addEventListener(event, handler, capture)
    return () => target.removeEventListener(event, handler, capture)
  }, [eventTarget])
}

export interface FocusManagerOptions {
  willHandle?(focused: boolean, event: React.FocusEvent): boolean | void
  didHandle?(focused: boolean, event: React.FocusEvent): void
  onChange?(focused: boolean, event: React.FocusEvent): void
  isDisabled: () => boolean
}

export interface FocusController {
  onBlur: (event: any) => void
  onFocus: (event: any) => void
}

export function useFocusManager(opts: FocusManagerOptions): FocusController {
  const isMounted = useMounted()
  const lastFocused = useRef<boolean | undefined>()
  const handle = useRef<number | undefined>()
  const willHandle = useEventCallback(opts.willHandle)
  const didHandle = useEventCallback(opts.didHandle)
  const onChange = useEventCallback(opts.onChange)
  const isDisabled = useEventCallback(opts.isDisabled)
  const handleFocusChange = useCallback(
    (focused: boolean, event: React.FocusEvent) => {
      if (event && event.persist) event.persist()
      if (willHandle && willHandle(focused, event) === false) return
      clearTimeout(handle.current)
      handle.current = window.setTimeout(() => {
        if (focused !== lastFocused.current) {
          if (didHandle) didHandle(focused, event)
          if (isMounted() || !focused) {
            lastFocused.current = focused
            onChange && onChange(focused, event)
          }
        }
      })
    },
    [isMounted, willHandle, didHandle, onChange, lastFocused]
  )
  const handleBlur = useCallback(
    (event: any) => {
      if (!isDisabled()) handleFocusChange(false, event)
    },
    [handleFocusChange, isDisabled]
  )
  const handleFocus = useCallback(
    (event: any) => {
      if (!isDisabled()) handleFocusChange(true, event)
    },
    [handleFocusChange, isDisabled]
  )
  return useMemo(
    () => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
    }),
    [handleBlur, handleFocus]
  )
}

export function useForceUpdate(): () => void {
  const [, dispatch] = useReducer((state: boolean) => !state, false)
  return dispatch as () => void
}

type DocumentEventHandler<K extends keyof DocumentEventMap> = (
  this: Document,
  ev: DocumentEventMap[K]
) => any

export function useGlobalListener<K extends keyof DocumentEventMap>(
  event: K,
  handler: DocumentEventHandler<K>,
  capture: boolean | AddEventListenerOptions = false
) {
  const documentTarget = useCallback(() => document, [])
  return useEventListener(documentTarget, event, handler, capture)
}

type State = {
  image: HTMLImageElement | null
  error: unknown | null
}

export function useImage(
  imageOrUrl?: string | HTMLImageElement | null | undefined,
  crossOrigin?: "anonymous" | "use-credentials" | string
) {
  const [state, setState] = useState<State>({
    image: null,
    error: null,
  })
  useEffect(() => {
    if (!imageOrUrl) return undefined
    let image: HTMLImageElement
    if (typeof imageOrUrl === "string") {
      image = new Image()
      if (crossOrigin) image.crossOrigin = crossOrigin
      image.src = imageOrUrl
    } else {
      image = imageOrUrl
      if (image.complete && image.naturalHeight > 0) {
        setState({ image, error: null })
        return
      }
    }
    function onLoad() {
      setState({ image, error: null })
    }
    function onError(error: ErrorEvent) {
      setState({ image, error })
    }
    image.addEventListener("load", onLoad)
    image.addEventListener("error", onError)
    return () => {
      image.removeEventListener("load", onLoad)
      image.removeEventListener("error", onError)
    }
  }, [imageOrUrl, crossOrigin])

  return state
}

export function useIntersectionObserver<TElement extends Element>(
  element: TElement | null | undefined,
  options?: IntersectionObserverInit
): IntersectionObserverEntry[]
export function useIntersectionObserver<TElement extends Element>(
  element: TElement | null | undefined,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): void
export function useIntersectionObserver<TElement extends Element>(
  element: TElement | null | undefined,
  callbackOrOptions?: IntersectionObserverCallback | IntersectionObserverInit,
  maybeOptions?: IntersectionObserverInit
): void | IntersectionObserverEntry[] {
  let callback: IntersectionObserverCallback | undefined
  let options: IntersectionObserverInit
  if (typeof callbackOrOptions === "function") {
    callback = callbackOrOptions
    options = maybeOptions || {}
  } else {
    options = callbackOrOptions || {}
  }
  const { threshold, root, rootMargin } = options
  const [entries, setEntry] = useState<IntersectionObserverEntry[] | null>(null)
  const handler = useEventCallback(callback || setEntry)
  const observer = useStableMemo(
    () =>
      root !== null &&
      typeof IntersectionObserver !== "undefined" &&
      new IntersectionObserver(handler, {
        threshold,
        root,
        rootMargin,
      }),

    [handler, root, rootMargin, threshold && JSON.stringify(threshold)]
  )
  useIsomorphicEffect(() => {
    if (!element || !observer) return
    observer.observe(element)
    return () => {
      observer.unobserve(element)
    }
  }, [observer, element])
  return callback ? undefined : entries || []
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
      effectHook: useUpdateImmediateEffect,
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

type Actor = (x: Rect) => void

const targetMap = new WeakMap<Element, Actor>()
let resizeObserver: ResizeObserver

function getResizeObserver() {
  return (resizeObserver =
    resizeObserver ||
    new window.ResizeObserver((xs: ResizeObserverEntry[]) => {
      xs.forEach(x => {
        const a = targetMap.get(x.target)
        if (a) a(x.contentRect)
      })
    }))
}

export function useResizeObserver<E extends Element>(
  element: E | null | undefined
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

export type Handler = (...xs: any[]) => any

export function useUncontrolledProp<P, H extends Handler = Handler>(
  propValue: P | undefined,
  defaultValue: P,
  handler?: H
): readonly [P, H]
export function useUncontrolledProp<P, H extends Handler = Handler>(
  propValue: P | undefined,
  defaultValue?: P | undefined,
  handler?: H
): readonly [P | undefined, H]
export function useUncontrolledProp<P, H extends Handler = Handler>(
  propValue: P | undefined,
  defaultValue: P | undefined,
  handler?: H
) {
  const wasPropRef = useRef<boolean>(propValue !== undefined)
  const [stateValue, setState] = useState<P | undefined>(defaultValue)
  const isProp = propValue !== undefined
  const wasProp = wasPropRef.current
  wasPropRef.current = isProp
  if (!isProp && wasProp && stateValue !== defaultValue) {
    setState(defaultValue)
  }
  return [
    isProp ? propValue : stateValue,
    useCallback(
      (value: P, ...xs: any[]) => {
        if (handler) handler(value, ...xs)
        setState(value)
      },
      [handler]
    ) as H,
  ] as const
}

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: NonNullable<Base[Key]> extends Condition ? Key : never
}
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]

type ConfigMap<TProps extends object> = {
  [p in keyof TProps]?: AllowedNames<TProps, Function>
}

export function useUncontrolled<
  TProps extends object,
  TDefaults extends string = never
>(props: TProps, config: ConfigMap<TProps>): Omit<TProps, TDefaults> {
  return Object.keys(config).reduce((result: TProps, fieldName: string) => {
    const {
      [defaultKey(fieldName)]: defaultValue,
      [fieldName]: propsValue,
      ...rest
    } = result as any
    const handlerName = config[fieldName]
    const [value, handler] = useUncontrolledProp(
      propsValue,
      defaultValue,
      props[handlerName]
    )
    return {
      ...rest,
      [fieldName]: value,
      [handlerName]: handler,
    }
  }, props)
}

export function defaultKey(key: string) {
  return "default" + key.charAt(0).toUpperCase() + key.substr(1)
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

export function useWillUnmount(fn: () => void) {
  const onUnmount = useUpdatedRef(fn)
  useEffect(() => () => onUnmount.current(), [])
}
