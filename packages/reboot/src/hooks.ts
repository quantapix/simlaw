import { dequal } from "dequal"
import * as qr from "react"

export const noop = () => {}

/*
interface Window {
  ResizeObserver: ResizeObserver
}

interface ResizeObserver {
  new (callback: ResizeObserverCB): any
  observe: (x: Element) => void
  unobserve: (x: Element) => void
  disconnect: () => void
}

interface ResizeObserverCB {
  (es: ResizeObserverEntry[], o: ResizeObserver): void
}

interface ResizeObserverEntry {
  new (x: Element): any
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
*/

export interface AnimationFrame {
  cancel(): void
  request(f: FrameRequestCallback): void
  request(cancel: boolean, f: FrameRequestCallback): void
}

export function useAnimationFrame(): AnimationFrame {
  const isMounted = useMounted()
  const ref = qr.useRef<number | undefined>()
  const doCancel = () => {
    if (ref.current != null) {
      cancelAnimationFrame(ref.current)
    }
  }
  useWillUnmount(doCancel)
  return useStableMemo(
    () => ({
      request(
        cancel: boolean | FrameRequestCallback,
        f?: FrameRequestCallback
      ) {
        if (!isMounted()) return
        if (cancel) doCancel()
        ref.current = requestAnimationFrame(
          f || (cancel as FrameRequestCallback)
        )
      },
      cancel: doCancel,
    }),
    []
  )
}

export type BreakpointDirection = "up" | "down" | true

export type BreakpointMap<K extends string> = Partial<
  Record<K, BreakpointDirection>
>

export function createBreakpointHook<K extends string>(
  xs: Record<K, string | number>
) {
  const names = Object.keys(xs) as K[]
  function and(query: string, next: string) {
    if (query === next) {
      return next
    }
    return query ? `${query} and ${next}` : next
  }
  function getNext(key: K) {
    return names[Math.min(names.indexOf(key) + 1, names.length - 1)]
  }
  function getMaxQuery(key: K) {
    const next = getNext(key)!
    let v = xs[next]
    if (typeof v === "number") v = `${v - 0.2}px`
    else v = `calc(${v} - 0.2px)`
    return `(max-width: ${v})`
  }
  function getMinQuery(key: K) {
    let v = xs[key]
    if (typeof v === "number") {
      v = `${v}px`
    }
    return `(min-width: ${v})`
  }
  function useBreakpoint(m: BreakpointMap<K>, window?: Window): boolean
  function useBreakpoint(
    key: K,
    direction?: BreakpointDirection,
    window?: Window
  ): boolean
  function useBreakpoint(
    x: K | BreakpointMap<K>,
    direction?: BreakpointDirection | Window,
    window?: Window
  ): boolean {
    let m: BreakpointMap<K>
    if (typeof x === "object") {
      m = x
      window = direction as Window
      direction = true
    } else {
      direction = direction || true
      m = { [x]: direction } as Record<K, BreakpointDirection>
    }
    const query = qr.useMemo(
      () =>
        Object.entries(m).reduce((query, [key, direction]) => {
          if (direction === "up" || direction === true) {
            query = and(query, getMinQuery(key as K))
          }
          if (direction === "down" || direction === true) {
            query = and(query, getMaxQuery(key as K))
          }
          return query
        }, ""),
      [JSON.stringify(m)]
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

export function useCallbackRef<V = unknown>(): [
  V | null,
  (ref: V | null) => void
] {
  return qr.useState<V | null>(null)
}

export function useCommittedRef<V>(v: V): qr.MutableRefObject<V> {
  const ref = qr.useRef(v)
  qr.useEffect(() => {
    ref.current = v
  }, [v])
  return ref
}

export type EffectHook = (
  effect: qr.EffectCallback,
  deps?: qr.DependencyList
) => void

export type IsEqual<Ds extends qr.DependencyList> = (
  next: Ds,
  prev: Ds
) => boolean

export type CustomEffectOptions<Ds extends qr.DependencyList> = {
  isEqual: IsEqual<Ds>
  effectHook?: EffectHook
}

type CleanUp = {
  (): void
  cleanup?: ReturnType<qr.EffectCallback>
}

export function useCustomEffect<
  Ds extends qr.DependencyList = qr.DependencyList
>(cb: qr.EffectCallback, ds: Ds, opts: IsEqual<Ds>): void
export function useCustomEffect<
  Ds extends qr.DependencyList = qr.DependencyList
>(cb: qr.EffectCallback, ds: Ds, opts: CustomEffectOptions<Ds>): void
export function useCustomEffect<
  Ds extends qr.DependencyList = qr.DependencyList
>(cb: qr.EffectCallback, ds: Ds, opts: IsEqual<Ds> | CustomEffectOptions<Ds>) {
  const isMounted = useMounted()
  const { isEqual, effectHook = qr.useEffect } =
    typeof opts === "function" ? { isEqual: opts } : opts
  const ref = qr.useRef<Ds>()
  ref.current = ds
  const ref2 = qr.useRef<CleanUp | null>(null)
  effectHook(() => {
    if (ref2.current === null) {
      const cleanup = cb()
      ref2.current = () => {
        if (isMounted() && isEqual(ref.current!, ds)) {
          return
        }
        ref2.current = null
        if (cleanup) cleanup()
      }
    }
    return ref2.current
  })
  qr.useDebugValue(cb)
}

export function useDebouncedCB<F extends (...xs: any[]) => any>(
  f: F,
  delay: number
): F {
  const timeout = useTimeout()
  return qr.useCallback(
    (...xs: any[]) => {
      timeout.set(() => {
        f(...xs)
      }, delay)
    },
    [f, delay]
  ) as any
}

export function useDebouncedState<S>(
  s0: S,
  delay: number
): [S, qr.Dispatch<qr.SetStateAction<S>>] {
  const [state, setState] = qr.useState(s0)
  const debounced = useDebouncedCB<qr.Dispatch<qr.SetStateAction<S>>>(
    setState,
    delay
  )
  return [state, debounced]
}

export function useDebouncedValue<V>(v: V, delay = 500): V {
  const [debounced, setDebounced] = useDebouncedState(v, delay)
  qr.useDebugValue(debounced)
  qr.useEffect(() => {
    setDebounced(v)
  }, [v, delay])
  return debounced
}

export function useEventCB<F extends (...xs: any[]) => any>(f?: F | null): F {
  const ref = useCommittedRef(f)
  return qr.useCallback(
    (...xs: any[]) => ref.current && ref.current(...xs),
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
  x: T | (() => T),
  key: K,
  listener: EventHandler<T, K>,
  capture: boolean | AddEventListenerOptions = false
) {
  const cb = useEventCB(listener)
  qr.useEffect(() => {
    const target = typeof x === "function" ? x() : x
    target.addEventListener(key, cb, capture)
    return () => target.removeEventListener(key, cb, capture)
  }, [x])
}

export interface FocusManagerOpts {
  willHandle?(focused: boolean, e: qr.FocusEvent): boolean | void
  didHandle?(focused: boolean, e: qr.FocusEvent): void
  onChange?(focused: boolean, e: qr.FocusEvent): void
  isDisabled: () => boolean
}

export interface FocusController {
  onBlur: (e: any) => void
  onFocus: (e: any) => void
}

export function useFocusManager(opts: FocusManagerOpts): FocusController {
  const isMounted = useMounted()
  const focus = qr.useRef<boolean | undefined>()
  const handle = qr.useRef<number | undefined>()
  const willHandle = useEventCB(opts.willHandle)
  const didHandle = useEventCB(opts.didHandle)
  const onChange = useEventCB(opts.onChange)
  const isDisabled = useEventCB(opts.isDisabled)
  const doFocusChange = qr.useCallback(
    (focused: boolean, e: qr.FocusEvent) => {
      if (e && e.persist) e.persist()
      if (willHandle && willHandle(focused, e) === false) return
      clearTimeout(handle.current)
      handle.current = window.setTimeout(() => {
        if (focused !== focus.current) {
          if (didHandle) didHandle(focused, e)
          if (isMounted() || !focused) {
            focus.current = focused
            onChange && onChange(focused, e)
          }
        }
      })
    },
    [isMounted, willHandle, didHandle, onChange, focus]
  )
  const doBlur = qr.useCallback(
    (e: any) => {
      if (!isDisabled()) doFocusChange(false, e)
    },
    [doFocusChange, isDisabled]
  )
  const doFocus = qr.useCallback(
    (e: any) => {
      if (!isDisabled()) doFocusChange(true, e)
    },
    [doFocusChange, isDisabled]
  )
  return qr.useMemo(
    () => ({ onBlur: doBlur, onFocus: doFocus }),
    [doBlur, doFocus]
  )
}

export function useForceUpdate(): () => void {
  const [, dispatch] = qr.useReducer((state: boolean) => !state, false)
  return dispatch as () => void
}

type DocEventHandler<K extends keyof DocumentEventMap> = (
  this: Document,
  ev: DocumentEventMap[K]
) => any

export function useGlobalListener<K extends keyof DocumentEventMap>(
  event: K,
  handler: DocEventHandler<K>,
  capture: boolean | AddEventListenerOptions = false
) {
  const cb = qr.useCallback(() => document, [])
  return useEventListener(cb, event, handler, capture)
}

type State = {
  image: HTMLImageElement | null
  error: unknown | null
}

export function useImage(
  url?: string | HTMLImageElement | null | undefined,
  crossOrigin?: "anonymous" | "use-credentials" | string
) {
  const [state, setState] = qr.useState<State>({
    image: null,
    error: null,
  })
  qr.useEffect(() => {
    if (!url) return undefined
    let image: HTMLImageElement
    if (typeof url === "string") {
      image = new Image()
      if (crossOrigin) image.crossOrigin = crossOrigin
      image.src = url
    } else {
      image = url
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
  }, [url, crossOrigin])

  return state
}

export function useIntersectionObserver<E extends Element>(
  e: E | null | undefined,
  init?: IntersectionObserverInit
): IntersectionObserverEntry[]
export function useIntersectionObserver<E extends Element>(
  e: E | null | undefined,
  cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
): void
export function useIntersectionObserver<E extends Element>(
  e: E | null | undefined,
  opts?: IntersectionObserverCallback | IntersectionObserverInit,
  init?: IntersectionObserverInit
): void | IntersectionObserverEntry[] {
  let cb: IntersectionObserverCallback | undefined
  let opts2: IntersectionObserverInit
  if (typeof opts === "function") {
    cb = opts
    opts2 = init || {}
  } else {
    opts2 = opts || {}
  }
  const { threshold, root, rootMargin } = opts2
  const [entries, setEntry] = qr.useState<IntersectionObserverEntry[] | null>(
    null
  )
  const cb2 = useEventCB(cb || setEntry)
  const observer = useStableMemo(
    () =>
      root !== null &&
      typeof IntersectionObserver !== "undefined" &&
      new IntersectionObserver(cb2, {
        threshold: threshold!,
        root: root!,
        rootMargin: rootMargin!,
      }),

    [cb2, root, rootMargin, threshold && JSON.stringify(threshold)]
  )
  useIsomorphicEffect(() => {
    if (!e || !observer) return
    observer.observe(e)
    return () => {
      observer.unobserve(e)
    }
  }, [observer, e])
  return cb ? undefined : entries || []
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
  qr.useEffect(() => {
    if (runImmediately) tick()
    else schedule()
    return () => clearTimeout(handle)
  }, [paused, runImmediately])
}

const isDOM = typeof document !== "undefined"

export const useIsomorphicEffect = isDOM ? qr.useLayoutEffect : qr.useEffect

export class ObservableMap<K, V> extends Map<K, V> {
  private readonly listener: (m: ObservableMap<K, V>) => void
  constructor(
    listener: (m: ObservableMap<K, V>) => void,
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
    const result = super.delete(key)
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
  w?: Window
): RefCountedMediaQueryList | undefined => {
  if (!query || !w) return undefined
  const matchers =
    matchersByWindow.get(w) || new Map<string, RefCountedMediaQueryList>()
  matchersByWindow.set(w, matchers)
  let ys = matchers.get(query)
  if (!ys) {
    ys = w.matchMedia(query) as RefCountedMediaQueryList
    ys.refCount = 0
    matchers.set(ys.media, ys)
  }
  return ys
}

export function useMediaQuery(
  query: string | null,
  w: Window | undefined = typeof window === "undefined" ? undefined : window
) {
  const mql = getMatcher(query, w)
  const [matches, setMatches] = qr.useState(() => (mql ? mql.matches : false))
  qr.useEffect(() => {
    let ys = getMatcher(query, w)
    if (!ys) {
      return setMatches(false)
    }
    const ms = matchersByWindow.get(w!)
    const doChange = () => {
      setMatches(ys!.matches)
    }
    ys.refCount++
    ys.addListener(doChange)
    doChange()
    return () => {
      ys!.removeListener(doChange)
      ys!.refCount--
      if (ys!.refCount <= 0) {
        ms?.delete(ys!.media)
      }
      ys = undefined
    }
  }, [query])
  return matches
}

const toFnRef = <T>(x?: qr.ForwardedRef<T>) =>
  !x || typeof x === "function"
    ? x
    : (v: T) => {
        x.current = v
      }

export function mergeRefs<T>(x?: qr.ForwardedRef<T>, y?: qr.ForwardedRef<T>) {
  const a = toFnRef(x)
  const b = toFnRef(y)
  return (v: T | null) => {
    if (a) a(v)
    if (b) b(v)
  }
}

export function useMergedRefs<T>(
  x?: qr.ForwardedRef<T>,
  y?: qr.ForwardedRef<T>
) {
  return qr.useMemo(() => mergeRefs(x, y), [x, y])
}

type Updater<TState> = (state: TState) => Partial<TState> | null

export type MergeStateSetter<TState> = (
  update: Updater<TState> | Partial<TState> | null
) => void

export function useMergeState<S>(s0: S | (() => S)): [S, MergeStateSetter<S>] {
  const [state, setState] = qr.useState<S>(s0)
  const cb = qr.useCallback(
    (f: Updater<S> | Partial<S> | null) => {
      if (f === null) return
      if (typeof f === "function") {
        setState(x => {
          const next = f(x)
          return next == null ? x : { ...x, ...next }
        })
      } else {
        setState(x => ({ ...x, ...f }))
      }
    },
    [setState]
  )
  return [state, cb]
}

type Mapper<P, S> = (ps: P, state: S) => null | Partial<S>

export function useMergeStateFromProps<P, S>(
  ps: P,
  m: Mapper<P, S>,
  s0: S
): [S, MergeStateSetter<S>] {
  const [state, setState] = useMergeState<S>(s0)
  const next = m(ps, state)
  if (next !== null) setState(next)
  return [state, setState]
}

export function useMounted(): () => boolean {
  const mounted = qr.useRef(true)
  const isMounted = qr.useRef(() => mounted.current)
  qr.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return isMounted.current
}

export function useMountEffect(effect: qr.EffectCallback) {
  return qr.useEffect(effect, [])
}

type Deps = [Element | null | undefined, MutationObserverInit]

function isDepsEqual(
  [nextElement, nextConfig]: Deps,
  [prevElement, prevConfig]: Deps
) {
  return nextElement === prevElement && dequal(nextConfig, prevConfig)
}

export function useMutationObserver(
  e: Element | null | undefined,
  init: MutationObserverInit,
  cb2: MutationCallback
): void
export function useMutationObserver(
  e: Element | null | undefined,
  init: MutationObserverInit
): MutationRecord[]
export function useMutationObserver(
  e: Element | null | undefined,
  init: MutationObserverInit,
  cb?: MutationCallback
): MutationRecord[] | void {
  const [records, setRecords] = qr.useState<MutationRecord[] | null>(null)
  const cb2 = useEventCB(cb || setRecords)
  useCustomEffect(
    () => {
      if (!e) return
      const o = new MutationObserver(cb2)
      o.observe(e, init)
      return () => {
        o.disconnect()
      }
    },
    [e, init],
    {
      isEqual: isDepsEqual,
      effectHook: useUpdateImmediateEffect,
    }
  )
  return cb ? void 0 : records || []
}

export function usePrevious<T>(value: T): T | null {
  const ref = qr.useRef<T | null>(null)
  qr.useEffect(() => {
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
  qr.useEffect(() => {
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  }, [])
}

const dft: any = Symbol("default value sigil")

export function useRefWithInitialValueFactory<T>(initialValueFactory: () => T) {
  const ref = qr.useRef<T>(dft)
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
  const [rect, setRect] = qr.useState<Rect | null>(null)
  qr.useEffect(() => {
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

type StateSetter<TState> = qr.Dispatch<qr.SetStateAction<TState>>

export function useSafeState<TState>(
  state: [TState, AsyncSetState<TState>]
): [TState, (stateUpdate: qr.SetStateAction<TState>) => Promise<void>]
export function useSafeState<TState>(
  state: [TState, StateSetter<TState>]
): [TState, StateSetter<TState>]
export function useSafeState<TState>(
  state: [TState, StateSetter<TState> | AsyncSetState<TState>]
): [TState, StateSetter<TState> | AsyncSetState<TState>] {
  const isMounted = useMounted()
  return [
    state[0],
    qr.useCallback(
      (nextState: qr.SetStateAction<TState>) => {
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

function isEqual(a: qr.DependencyList, b: qr.DependencyList) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

type DepsCache<T> = {
  deps?: qr.DependencyList
  result: T
}

export function useStableMemo<T>(
  factory: () => T,
  deps?: qr.DependencyList
): T {
  let isValid = true
  const ref = qr.useRef<DepsCache<T>>()
  if (!ref.current) {
    ref.current = {
      deps,
      result: factory(),
    }
  } else {
    isValid = !!(deps && ref.current.deps && isEqual(deps, ref.current.deps))
  }
  const cache = isValid ? ref.current : { deps, result: factory() }
  ref.current = cache
  return cache.result
}

type Updater2<S> = (state: S) => S

export type AsyncSetState<S> = (stateUpdate: qr.SetStateAction<S>) => Promise<S>

export function useStateAsync<S>(
  initialState: S | (() => S)
): [S, AsyncSetState<S>] {
  const [state, setState] = qr.useState(initialState)
  const ref = qr.useRef<((state: S) => void)[]>([])
  qr.useEffect(() => {
    ref.current.forEach(resolve => resolve(state))
    ref.current.length = 0
  }, [state])
  const cb = qr.useCallback(
    (update: Updater2<S> | S) => {
      return new Promise<S>((res, rej) => {
        setState(prev => {
          try {
            let next: S
            if (update instanceof Function) {
              next = update(prev)
            } else {
              next = update
            }
            if (!ref.current.length && Object.is(next, prev)) {
              res(next)
            } else {
              ref.current.push(res)
            }
            return next
          } catch (e) {
            rej(e)
            throw e
          }
        })
      })
    },
    [setState]
  )
  return [state, cb]
}

const isSyntheticEvent = (e: any): e is qr.SyntheticEvent =>
  typeof e.persist === "function"

export type ThrottledHandler<E> = ((e: E) => void) & {
  clear(): void
}

export function useThrottledEventHandler<E = qr.SyntheticEvent>(
  handler: (e: E) => void
): ThrottledHandler<E> {
  const isMounted = useMounted()
  const eventHandler = useEventCB(handler)
  const ref = qr.useRef<{
    event: E | null
    handle: null | number
  }>({
    event: null,
    handle: null,
  })
  const clear = () => {
    cancelAnimationFrame(ref.current.handle!)
    ref.current.handle = null
  }
  const doPointerMoveAnimation = () => {
    const { current: next } = ref
    if (next.handle && next.event) {
      if (isMounted()) {
        next.handle = null
        eventHandler(next.event)
      }
    }
    next.event = null
  }
  const throttledHandler = (e: E) => {
    if (!isMounted()) return
    if (isSyntheticEvent(e)) {
      e.persist()
    } else if ("evt" in e) {
      e = { ...e }
    }
    ref.current.event = e
    if (!ref.current.handle) {
      ref.current.handle = requestAnimationFrame(doPointerMoveAnimation)
    }
  }
  throttledHandler.clear = clear
  return throttledHandler
}

const MAX_DELAY_MS = 2 ** 31 - 1

function setChainedTimeout(
  handleRef: qr.MutableRefObject<any>,
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
  const handleRef = qr.useRef<any>()
  useWillUnmount(() => clearTimeout(handleRef.current))
  return qr.useMemo(() => {
    const clear = () => clearTimeout(handleRef.current)
    function set(fn: () => void, delay = 0): void {
      if (!isMounted()) return
      clear()
      if (delay <= MAX_DELAY_MS) {
        handleRef.current = setTimeout(fn, delay)
      } else {
        setChainedTimeout(handleRef, fn, Date.now() + delay)
      }
    }
    return { set, clear }
  }, [])
}

export function useToggleState(initialState = false) {
  return qr.useReducer<qr.Reducer<boolean, boolean | undefined>>(
    (state: boolean, action?: boolean) => (action == null ? !state : action),
    initialState
  ) as [boolean, (value?: boolean) => void]
}

export type Handler = (...xs: any[]) => any

export function useUncontrolledVal<V, H extends Handler = Handler>(
  v: V | undefined,
  v0: V,
  handler?: H
): readonly [V, H]
export function useUncontrolledVal<V, H extends Handler = Handler>(
  v: V | undefined,
  v0?: V,
  handler?: H
): readonly [V | undefined, H]
export function useUncontrolledVal<V, H extends Handler = Handler>(
  v?: V,
  v0?: V,
  handler?: H
) {
  const wasRef = qr.useRef<boolean>(v !== undefined)
  const [state, setState] = qr.useState<V | undefined>(v0)
  const isProp = v !== undefined
  const wasProp = wasRef.current
  wasRef.current = isProp
  if (!isProp && wasProp && state !== v0) {
    setState(v0)
  }
  return [
    isProp ? v : state,
    qr.useCallback(
      (x: V, ...xs: any[]) => {
        if (handler) handler(x, ...xs)
        setState(x)
      },
      [handler]
    ) as H,
  ] as const
}

type FilterFlags<P, Condition> = {
  [k in keyof P]: NonNullable<P[k]> extends Condition ? k : never
}
type AllowedNames<P, Condition> = FilterFlags<P, Condition>[keyof P]

type ConfigMap<P extends object> = {
  [k in keyof P]?: AllowedNames<P, Handler>
}

export function useUncontrolled<P extends object, P0 extends string = never>(
  p: P,
  m: ConfigMap<P>
): Omit<P, P0> {
  type K = keyof P
  return Object.keys(m).reduce((x: P, k: string) => {
    const { [defaultKey(k)]: v0, [k]: v, ...xs2 } = x as any
    const h = m[k as K]
    const [value, handler] = useUncontrolledVal(v, v0, p[h as K] as Handler)
    return {
      ...xs2,
      [k]: value,
      [h as string]: handler,
    }
  }, p)
}

export function defaultKey(key: string) {
  return "default" + key.charAt(0).toUpperCase() + key.substr(1)
}

export function useUpdatedRef<T>(x: T) {
  const valueRef = qr.useRef<T>(x)
  valueRef.current = x
  return valueRef
}

export function useUpdateEffect(
  fn: qr.EffectCallback,
  deps: qr.DependencyList
) {
  const isFirst = qr.useRef(true)
  qr.useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return fn()
  }, deps)
}

export function useUpdateImmediateEffect(
  effect: qr.EffectCallback,
  deps: qr.DependencyList
) {
  const firstRef = qr.useRef(true)
  const tearDown = qr.useRef<ReturnType<qr.EffectCallback>>()
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
  fn: qr.EffectCallback,
  deps: qr.DependencyList
) {
  const isFirst = qr.useRef(true)
  qr.useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return fn()
  }, deps)
}

export function useWillUnmount(fn: () => void) {
  const onUnmount = useUpdatedRef(fn)
  qr.useEffect(() => () => onUnmount.current(), [])
}
