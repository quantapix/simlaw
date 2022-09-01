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

export function isDraft(value: any): boolean {
  return !!value && !!value[qt.DRAFT_STATE]
}

export function isDraftable(value: any): boolean {
  if (!value) return false
  return (
    isPlainObject(value) ||
    Array.isArray(value) ||
    !!value[qt.DRAFTABLE] ||
    !!value.constructor[qt.DRAFTABLE] ||
    isMap(value) ||
    isSet(value)
  )
}

const CTOR = Object.prototype.constructor.toString()

export function isPlainObject(x: any): boolean {
  if (!x || typeof x !== "object") return false
  const proto = Object.getPrototypeOf(x)
  if (proto === null) return true
  const Ctor =
    Object.hasOwnProperty.call(proto, "constructor") && proto.constructor
  if (Ctor === Object) return true
  return typeof Ctor == "function" && Function.toString.call(Ctor) === CTOR
}

export function latest(x: qt.State): any {
  return x.copy_ || x.base_
}

export function original<T>(x: T): T | undefined
export function original(x: qt.Drafted<any>): any {
  if (!isDraft(x)) die(23, x)
  return x[qt.DRAFT_STATE].base_
}

export const ownKeys: (x: qt.AnyObject) => PropertyKey[] =
  typeof Reflect !== "undefined" && Reflect.ownKeys
    ? Reflect.ownKeys
    : typeof Object.getOwnPropertySymbols !== "undefined"
    ? x =>
        Object.getOwnPropertyNames(x).concat(
          Object.getOwnPropertySymbols(x) as any
        )
    : Object.getOwnPropertyNames

export const getOwnPropertyDescriptors =
  Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(x: any) {
    const res: any = {}
    ownKeys(x).forEach(k => {
      res[k] = Object.getOwnPropertyDescriptor(x, k)
    })
    return res
  }

export function each<T extends qt.Objectish>(
  x: T,
  iter: (k: string | number, v: any, src: T) => void,
  enumerableOnly?: boolean
): void
export function each(x: any, iter: any, enumerableOnly = false) {
  if (getQType(x) === qt.QType.Object) {
    ;(enumerableOnly ? Object.keys : ownKeys)(x).forEach(k => {
      if (!enumerableOnly || typeof k !== "symbol") iter(k, x[k], x)
    })
  } else {
    x.forEach((entry: any, i: any) => iter(i, entry, x))
  }
}

export function getQType(x: any): qt.QType {
  const state: undefined | qt.State = x[qt.DRAFT_STATE]
  return state
    ? (state.type_ as any)
    : Array.isArray(x)
    ? qt.QType.Array
    : isMap(x)
    ? qt.QType.Map
    : isSet(x)
    ? qt.QType.Set
    : qt.QType.Object
}

export function has(x: any, k: PropertyKey): boolean {
  return getQType(x) === qt.QType.Map
    ? x.has(k)
    : Object.prototype.hasOwnProperty.call(x, k)
}

export function get(x: qt.AnyMap | qt.AnyObject, k: PropertyKey): any {
  return getQType(x) === qt.QType.Map ? x.get(k) : (x as any)[k]
}

export function set(x: any, k: PropertyKey, v: any) {
  const t = getQType(x)
  if (t === qt.QType.Map) x.set(k, v)
  else if (t === qt.QType.Set) {
    x.delete(k)
    x.add(v)
  } else x[k] = v
}

export function shallowCopy(x: any) {
  if (Array.isArray(x)) return Array.prototype.slice.call(x)
  const ds = getOwnPropertyDescriptors(x)
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

export function freeze<T>(x: T, deep?: boolean): T
export function freeze<T>(x: any, deep = false): T {
  if (isFrozen(x) || isDraft(x) || !isDraftable(x)) return x
  if (getQType(x) > 1) {
    x.set = x.add = x.clear = x.delete = dontMutateFrozenCollections as any
  }
  Object.freeze(x)
  if (deep) each(x, (_, v) => freeze(v, true), true)
  return x
}

function dontMutateFrozenCollections() {
  die(2)
}

export function isFrozen(x: any): boolean {
  if (x == null || typeof x !== "object") return true
  return Object.isFrozen(x)
}

const plugins: {
  Patches?: {
    generatePatches_(
      state: qt.State,
      basePath: qt.PatchPath,
      patches: qt.Patch[],
      inversePatches: qt.Patch[]
    ): void
    generateReplacementPatches_(
      base: any,
      replacement: any,
      patches: qt.Patch[],
      inversePatches: qt.Patch[]
    ): void
    applyPatches_<T>(draft: T, patches: qt.Patch[]): T
  }
  MapSet?: {
    proxyMap_<T extends qt.AnyMap>(x: T, parent?: qt.State): T
    proxySet_<T extends qt.AnySet>(x: T, parent?: qt.State): T
  }
} = {}

type Plugins = typeof plugins

export function getPlugin<K extends keyof Plugins>(
  k: K
): Exclude<Plugins[K], undefined> {
  const y = plugins[k]
  if (!y) {
    die(18, k)
  }
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

export function die(error: keyof typeof errors, ...args: any[]): never {
  if (__DEV__) {
    const e = errors[error]
    const m = !e
      ? "unknown error nr: " + error
      : typeof e === "function"
      ? e.apply(null, args as any)
      : e
    throw new Error(`[Immer] ${m}`)
  }
  throw new Error(
    `[Immer] minified error nr: ${error}${
      args.length ? " " + args.map(s => `'${s}'`).join(",") : ""
    }. Find the full error at: https://bit.ly/3cXEKWf`
  )
}
