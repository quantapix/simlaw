import * as qt from "./types.js"

export function is(x: any, y: any): boolean {
  if (x === y) return x !== 0 || 1 / x === 1 / y
  return x !== x && y !== y
}

export function isMap(x: any): x is qt.AnyMap {
  return x instanceof Map
}

export function isSet(x: any): x is qt.AnySet {
  return x instanceof Set
}

export function isDraft(x: any): boolean {
  return !!x && !!x[qt.DRAFT_STATE]
}

export function isDraftable(x: any): boolean {
  if (!x) return false
  return isPlain(x) || Array.isArray(x) || !!x[qt.immerable] || !!x.constructor[qt.immerable] || isMap(x) || isSet(x)
}

export function isFrozen(x: any): boolean {
  if (x == null || typeof x !== "object") return true
  return Object.isFrozen(x)
}

const CTOR = Object.prototype.constructor.toString()

export function isPlain(x: any): boolean {
  if (!x || typeof x !== "object") return false
  const p = Object.getPrototypeOf(x)
  if (p === null) return true
  const c = Object.hasOwnProperty.call(p, "constructor") && p.constructor
  if (c === Object) return true
  return typeof c == "function" && Function.toString.call(c) === CTOR
}

export function original<T>(x: T): T | undefined
export function original(x: qt.Drafted<any>): any {
  if (!isDraft(x)) die(23, x)
  return x[qt.DRAFT_STATE].base_
}

export function latest(x: qt.State): any {
  return x.copy || x.base
}

export function getType(x: any): qt.QType {
  const s: undefined | qt.State = x[qt.DRAFT_STATE]
  return s
    ? (s.type as any)
    : Array.isArray(x)
    ? qt.QType.Array
    : isMap(x)
    ? qt.QType.Map
    : isSet(x)
    ? qt.QType.Set
    : qt.QType.Obj
}

export const ownKeys: (x: qt.AnyObj) => PropertyKey[] =
  typeof Reflect !== "undefined" && Reflect.ownKeys
    ? Reflect.ownKeys
    : typeof Object.getOwnPropertySymbols !== "undefined"
    ? x => Object.getOwnPropertyNames(x).concat(Object.getOwnPropertySymbols(x) as any)
    : Object.getOwnPropertyNames

export function each<T extends qt.Objectish>(
  x: T,
  iter: (k: string | number, v: any, src: T) => void,
  enumOnly?: boolean
): void
export function each(x: any, iter: any, enumOnly = false) {
  if (getType(x) === qt.QType.Obj) {
    ;(enumOnly ? Object.keys : ownKeys)(x).forEach(k => {
      if (!enumOnly || typeof k !== "symbol") iter(k, x[k], x)
    })
  } else x.forEach((entry: any, i: any) => iter(i, entry, x))
}

export function has(x: any, k: PropertyKey): boolean {
  return getType(x) === qt.QType.Map ? x.has(k) : Object.prototype.hasOwnProperty.call(x, k)
}

export function get(x: qt.AnyMap | qt.AnyObj, k: PropertyKey): any {
  return getType(x) === qt.QType.Map ? x.get(k) : (x as any)[k]
}

export function set(x: any, k: PropertyKey, v: any) {
  const t = getType(x)
  if (t === qt.QType.Map) x.set(k, v)
  else if (t === qt.QType.Set) {
    x.delete(k)
    x.add(v)
  } else x[k] = v
}

export const ownDescriptors =
  Object.getOwnPropertyDescriptors ||
  ((x: any) => {
    const y: any = {}
    ownKeys(x).forEach(k => {
      y[k] = Object.getOwnPropertyDescriptor(x, k)
    })
    return y
  })

export function shallowCopy(x: any) {
  if (Array.isArray(x)) return Array.prototype.slice.call(x)
  const ds = ownDescriptors(x)
  delete ds[qt.DRAFT_STATE as any]
  const ks = ownKeys(ds)
  for (let i = 0; i < ks.length; i++) {
    const k: any = ks[i]
    const d = ds[k]
    if (d?.writable === false) {
      d.writable = true
      d.configurable = true
    }
    if (d?.get || d?.set)
      ds[k] = {
        configurable: true,
        writable: true,
        //qfix enumerable: d?.enumerable,
        value: x[k],
      }
  }
  return Object.create(Object.getPrototypeOf(x), ds)
}

function dontMutate() {
  die(2)
}

export function freeze<T>(x: T, deep?: boolean): T
export function freeze<T>(x: any, deep = false): T {
  if (isFrozen(x) || isDraft(x) || !isDraftable(x)) return x
  if (getType(x) > 1) x.set = x.add = x.clear = x.delete = dontMutate as any
  Object.freeze(x)
  if (deep) each(x, (_, v) => freeze(v, true), true)
  return x
}

export type DeepReadonly<T> = T extends (...xs: any) => any ? T : { readonly [P in keyof T]: DeepReadonly<T[P]> }

export function deepFreeze<T>(x: T[]): ReadonlyArray<DeepReadonly<T>>
export function deepFreeze<T extends Function>(x: T): T
export function deepFreeze<T>(x: T): DeepReadonly<T>
export function deepFreeze(x: any) {
  Object.freeze(x)
  Object.getOwnPropertyNames(x).forEach(k => {
    if (
      Object.hasOwnProperty.call(x, k) &&
      x[k] !== null &&
      (typeof x[k] === "object" || typeof x[k] === "function") &&
      !Object.isFrozen(x[k])
    ) {
      deepFreeze(x[k])
    }
  })
  return x
}

const plugins: {
  Patches?: {
    generatePatches(s: qt.State, path: qt.PatchPath, patches: qt.Patch[], inverses: qt.Patch[]): void
    substitutePatches(base: any, sub: any, ps: qt.Patch[], inverses: qt.Patch[]): void
    applyPatches<T>(x: T, ps: qt.Patch[]): T
  }
  MapSet?: {
    proxyMap<T extends qt.AnyMap>(x: T, parent?: qt.State): T
    proxySet<T extends qt.AnySet>(x: T, parent?: qt.State): T
  }
} = {}

type Plugins = typeof plugins

export function getPlugin<K extends keyof Plugins>(k: K): NonNullable<Plugins[K]> {
  const y = plugins[k]
  if (!y) die(18, k)
  return y
}

export function loadPlugin<K extends keyof Plugins>(k: K, p: Plugins[K]): void {
  if (!plugins[k]) plugins[k] = p
}

const errors = {
  0: "Illegal state",
  1: "Immer drafts cannot have computed properties",
  2: "This object has been frozen and should not be mutated",
  3(data: any) {
    return (
      "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " +
      data
    )
  },
  4: "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  5: "Immer forbids circular references",
  6: "The first or second argument to `produce` must be a function",
  7: "The third argument to `produce` must be a function or undefined",
  8: "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  9: "First argument to `finishDraft` must be a draft returned by `createDraft`",
  10: "The given draft is already finalized",
  11: "Object.defineProperty() cannot be used on an Immer draft",
  12: "Object.setPrototypeOf() cannot be used on an Immer draft",
  13: "Immer only supports deleting array indices",
  14: "Immer only supports setting array indices and the 'length' property",
  15(path: string) {
    return "Cannot apply patch, path doesn't resolve: " + path
  },
  16: 'Sets cannot have "replace" patches.',
  17(op: string) {
    return "Unsupported patch operation: " + op
  },
  18(plugin: string) {
    return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`
  },
  20: "Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available",
  21(thing: string) {
    return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`
  },
  22(thing: string) {
    return `'current' expects a draft, got: ${thing}`
  },
  23(thing: string) {
    return `'original' expects a draft, got: ${thing}`
  },
  24: "Patching reserved attributes like __proto__, prototype and constructor is not allowed",
} as const

export function die(k: keyof typeof errors, ...xs: any[]): never {
  if (__DEV__) {
    const e = errors[k]
    const m = !e ? "unknown error nr: " + k : typeof e === "function" ? (e as (...xs: any[]) => any)(xs) : e
    throw new Error(`[Immer] ${m}`)
  }
  throw new Error(
    `[Immer] minified error nr: ${k}${
      xs.length ? " " + xs.map(s => `'${s}'`).join(",") : ""
    }. Find the full error at: https://bit.ly/3cXEKWf`
  )
}
