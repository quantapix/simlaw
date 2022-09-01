import * as qt from "./types.js"

const hasSymbol =
  typeof Symbol !== "undefined" && typeof Symbol("x") === "symbol"
export const hasMap = typeof Map !== "undefined"
export const hasSet = typeof Set !== "undefined"
export const hasProxies =
  typeof Proxy !== "undefined" &&
  typeof Proxy.revocable !== "undefined" &&
  typeof Reflect !== "undefined"

export const NOTHING: qt.Nothing = hasSymbol
  ? Symbol.for("immer-nothing")
  : ({ ["immer-nothing"]: true } as any)

export const DRAFTABLE: unique symbol = hasSymbol
  ? Symbol.for("immer-draftable")
  : ("__$immer_draftable" as any)

export const DRAFT_STATE: unique symbol = hasSymbol
  ? Symbol.for("immer-state")
  : ("__$immer_state" as any)

export const iteratorSymbol: typeof Symbol.iterator =
  (typeof Symbol != "undefined" && Symbol.iterator) || ("@@iterator" as any)

export function isDraft(value: any): boolean {
  return !!value && !!value[DRAFT_STATE]
}

export function isDraftable(value: any): boolean {
  if (!value) return false
  return (
    isPlainObject(value) ||
    Array.isArray(value) ||
    !!value[DRAFTABLE] ||
    !!value.constructor[DRAFTABLE] ||
    isMap(value) ||
    isSet(value)
  )
}

const objectCtorString = Object.prototype.constructor.toString()

export function isPlainObject(value: any): boolean {
  if (!value || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null) {
    return true
  }
  const Ctor =
    Object.hasOwnProperty.call(proto, "constructor") && proto.constructor

  if (Ctor === Object) return true

  return (
    typeof Ctor == "function" &&
    Function.toString.call(Ctor) === objectCtorString
  )
}

export function original<T>(value: T): T | undefined
export function original(value: qt.Drafted<any>): any {
  if (!isDraft(value)) die(23, value)
  return value[DRAFT_STATE].base_
}

export const ownKeys: (target: qt.AnyObject) => PropertyKey[] =
  typeof Reflect !== "undefined" && Reflect.ownKeys
    ? Reflect.ownKeys
    : typeof Object.getOwnPropertySymbols !== "undefined"
    ? obj =>
        Object.getOwnPropertyNames(obj).concat(
          Object.getOwnPropertySymbols(obj) as any
        )
    : Object.getOwnPropertyNames

export const getOwnPropertyDescriptors =
  Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(target: any) {
    const res: any = {}
    ownKeys(target).forEach(key => {
      res[key] = Object.getOwnPropertyDescriptor(target, key)
    })
    return res
  }

export function each<T extends qt.Objectish>(
  obj: T,
  iter: (key: string | number, value: any, source: T) => void,
  enumerableOnly?: boolean
): void
export function each(obj: any, iter: any, enumerableOnly = false) {
  if (getArchtype(obj) === qt.Archtype.Object) {
    ;(enumerableOnly ? Object.keys : ownKeys)(obj).forEach(key => {
      if (!enumerableOnly || typeof key !== "symbol") iter(key, obj[key], obj)
    })
  } else {
    obj.forEach((entry: any, index: any) => iter(index, entry, obj))
  }
}

export function getArchtype(thing: any): qt.Archtype {
  const state: undefined | qt.State = thing[DRAFT_STATE]
  return state
    ? state.type_ > 3
      ? state.type_ - 4
      : (state.type_ as any)
    : Array.isArray(thing)
    ? qt.Archtype.Array
    : isMap(thing)
    ? qt.Archtype.Map
    : isSet(thing)
    ? qt.Archtype.Set
    : qt.Archtype.Object
}

export function has(thing: any, prop: PropertyKey): boolean {
  return getArchtype(thing) === qt.Archtype.Map
    ? thing.has(prop)
    : Object.prototype.hasOwnProperty.call(thing, prop)
}

export function get(thing: qt.AnyMap | qt.AnyObject, prop: PropertyKey): any {
  return getArchtype(thing) === qt.Archtype.Map ? thing.get(prop) : thing[prop]
}

export function set(thing: any, propOrOldValue: PropertyKey, value: any) {
  const t = getArchtype(thing)
  if (t === qt.Archtype.Map) thing.set(propOrOldValue, value)
  else if (t === qt.Archtype.Set) {
    thing.delete(propOrOldValue)
    thing.add(value)
  } else thing[propOrOldValue] = value
}

export function is(x: any, y: any): boolean {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y
  } else {
    return x !== x && y !== y
  }
}

export function isMap(target: any): target is qt.AnyMap {
  return hasMap && target instanceof Map
}

export function isSet(target: any): target is qt.AnySet {
  return hasSet && target instanceof Set
}
export function latest(state: qt.State): any {
  return state.copy_ || state.base_
}

export function shallowCopy(base: any) {
  if (Array.isArray(base)) return Array.prototype.slice.call(base)
  const descriptors = getOwnPropertyDescriptors(base)
  delete descriptors[DRAFT_STATE as any]
  const keys = ownKeys(descriptors)
  for (let i = 0; i < keys.length; i++) {
    const key: any = keys[i]
    const desc = descriptors[key]
    if (desc?.writable === false) {
      desc.writable = true
      desc.configurable = true
    }
    if (desc?.get || desc?.set)
      descriptors[key] = {
        configurable: true,
        writable: true,
        enumerable: desc?.enumerable,
        value: base[key],
      }
  }
  return Object.create(Object.getPrototypeOf(base), descriptors)
}

export function freeze<T>(obj: T, deep?: boolean): T
export function freeze<T>(obj: any, deep = false): T {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj
  if (getArchtype(obj) > 1 /* Map or Set */) {
    obj.set =
      obj.add =
      obj.clear =
      obj.delete =
        dontMutateFrozenCollections as any
  }
  Object.freeze(obj)
  if (deep) each(obj, (key, value) => freeze(value, true), true)
  return obj
}

function dontMutateFrozenCollections() {
  die(2)
}

export function isFrozen(obj: any): boolean {
  if (obj == null || typeof obj !== "object") return true
  return Object.isFrozen(obj)
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
  ES5?: {
    willFinalizeES5_(scope: qt.Scope, result: any, isReplaced: boolean): void
    createES5Proxy_<T>(
      base: T,
      parent?: qt.State
    ): qt.Drafted<T, qt.ES5ObjectState | qt.ES5ArrayState>
    hasChanges_(state: qt.ES5ArrayState | qt.ES5ObjectState): boolean
  }
  MapSet?: {
    proxyMap_<T extends qt.AnyMap>(target: T, parent?: qt.State): T
    proxySet_<T extends qt.AnySet>(target: T, parent?: qt.State): T
  }
} = {}

type Plugins = typeof plugins

export function getPlugin<K extends keyof Plugins>(
  pluginKey: K
): Exclude<Plugins[K], undefined> {
  const plugin = plugins[pluginKey]
  if (!plugin) {
    die(18, pluginKey)
  }
  return plugin
}

export function loadPlugin<K extends keyof Plugins>(
  pluginKey: K,
  implementation: Plugins[K]
): void {
  if (!plugins[pluginKey]) plugins[pluginKey] = implementation
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
    const msg = !e
      ? "unknown error nr: " + error
      : typeof e === "function"
      ? e.apply(null, args as any)
      : e
    throw new Error(`[Immer] ${msg}`)
  }
  throw new Error(
    `[Immer] minified error nr: ${error}${
      args.length ? " " + args.map(s => `'${s}'`).join(",") : ""
    }. Find the full error at: https://bit.ly/3cXEKWf`
  )
}
