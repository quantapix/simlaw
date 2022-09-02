import {
  DRAFT_STATE,
  NOTHING,
  QType,
  Draft,
  Drafted,
  IProduce,
  IProduceWithPatches,
  Objectish,
  Patch,
  Listener,
  PatchPath,
  ProxyState,
  ProxyType,
  ProxyObj,
  ProxyArray,
  Scope,
  SetState,
  State,
} from "./types.js"
import {
  die,
  each,
  freeze,
  get,
  getType,
  getPlugin,
  has,
  is,
  isDraft,
  isDraftable,
  isFrozen,
  isMap,
  isSet,
  latest,
  set,
  shallowCopy,
} from "./utils.js"

let currentScope: Scope | undefined

export function getCurrentScope() {
  if (__DEV__ && !currentScope) die(0)
  return currentScope!
}

function createScope(parent: Scope | undefined, immer: Immer): Scope {
  return {
    canAutoFreeze: true,
    drafts: [],
    immer,
    parent,
    unfinalized: 0,
  }
}

export function usePatchesInScope(x: Scope, listener?: Listener) {
  if (listener) {
    getPlugin("Patches")
    x.patches = []
    x.inverses = []
    x.listener = listener
  }
}

export function revokeScope(x: Scope) {
  leaveScope(x)
  x.drafts.forEach(revokeDraft)
  x.drafts = []
}

export function leaveScope(x: Scope) {
  if (x === currentScope) currentScope = x.parent
}

export function enterScope(x: Immer) {
  return (currentScope = createScope(currentScope, x))
}

function revokeDraft(x: Drafted) {
  const s: State = x[DRAFT_STATE]
  if (s.type === ProxyType.Obj || s.type === ProxyType.Array) s.revoke()
  else s.revoked = true
}

export function current<T>(x: T): T
export function current(x: any): any {
  if (!isDraft(x)) die(22, x)
  return _current(x)
}

function _current(x: any): any {
  if (!isDraftable(x)) return x
  const s: State | undefined = x[DRAFT_STATE]
  let copy: any
  const t = getType(x)
  if (s) {
    if (!s.modified) return s.base
    s.finalized = true
    copy = _copy(x, t)
    s.finalized = false
  } else {
    copy = _copy(x, t)
  }
  each(copy, (k, v) => {
    if (s && get(s.base, k) === v) return
    set(copy, k, _current(v))
  })
  return t === QType.Set ? new Set(copy) : copy
}

function _copy(x: any, typ: number): any {
  switch (typ) {
    case QType.Map:
      return new Map(x)
    case QType.Set:
      return Array.from(x)
  }
  return shallowCopy(x)
}

export function processResult(x: any, s: Scope) {
  s.unfinalized = s.drafts.length
  const d0 = s.drafts![0]
  const isReplaced = x !== undefined && x !== d0
  if (isReplaced) {
    if (d0[DRAFT_STATE].modified) {
      revokeScope(s)
      die(4)
    }
    if (isDraftable(x)) {
      x = finalize(s, x)
      if (!s.parent) maybeFreeze(s, x)
    }
    if (s.patches) {
      getPlugin("Patches").replacementPatches(
        d0[DRAFT_STATE].base,
        x,
        s.patches,
        s.inverses!
      )
    }
  } else x = finalize(s, d0, [])
  revokeScope(s)
  if (s.patches) s.listener!(s.patches, s.inverses!)
  return x !== NOTHING ? x : undefined
}

function finalize(root: Scope, x: any, p?: PatchPath) {
  if (isFrozen(x)) return x
  const s: State = x[DRAFT_STATE]
  if (!s) {
    each(x, (k, v) => finalizeProperty(root, s, x, k, v, p), true)
    return x
  }
  if (s.scope !== root) return x
  if (!s.modified) {
    maybeFreeze(root, s.base, true)
    return s.base
  }
  if (!s.finalized) {
    s.finalized = true
    s.scope.unfinalized--
    const y = s.copy
    each(s.type === ProxyType.Set ? new Set(y) : y, (k, v) =>
      finalizeProperty(root, s, y, k, v, p)
    )
    maybeFreeze(root, y, false)
    if (p && root.patches) {
      getPlugin("Patches").generatePatches(s, p, root.patches, root.inverses!)
    }
  }
  return s.copy
}

function finalizeProperty(
  root: Scope,
  state: State | undefined,
  x: any,
  prop: string | number,
  v: any,
  p?: PatchPath
) {
  if (__DEV__ && v === x) die(5)
  if (isDraft(v)) {
    const path =
      p &&
      state &&
      state!.type !== ProxyType.Set &&
      !has((state as Exclude<State, SetState>).assigned!, prop)
        ? p!.concat(prop)
        : undefined
    const y = finalize(root, v, path)
    set(x, prop, y)
    if (isDraft(y)) root.canAutoFreeze = false
    else return
  }
  if (isDraftable(v) && !isFrozen(v)) {
    if (!root.immer.autoFreeze && root.unfinalized < 1) {
      return
    }
    finalize(root, v)
    if (!state || !state.scope.parent) maybeFreeze(root, v)
  }
}

function maybeFreeze(s: Scope, x: any, deep = false) {
  if (s.immer.autoFreeze && s.canAutoFreeze) {
    freeze(x, deep)
  }
}

export function createProxyProxy<T extends Objectish>(
  base: T,
  parent?: State
): Drafted<T, ProxyState> {
  const isArray = Array.isArray(base)
  const state: ProxyState = {
    type: isArray ? ProxyType.Array : (ProxyType.Obj as any),
    scope: parent ? parent.scope : getCurrentScope()!,
    modified: false,
    finalized: false,
    assigned: {},
    parent: parent,
    base: base,
    draft: null as any,
    copy: null,
    revoke: null as any,
    manual: false,
  }
  let target: T = state as any
  let traps: ProxyHandler<object | Array<any>> = objectTraps
  if (isArray) {
    target = [state] as any
    traps = arrayTraps
  }
  const { revoke, proxy } = Proxy.revocable(target, traps)
  state.draft = proxy as any
  state.revoke = revoke
  return proxy as any
}

export const objectTraps: ProxyHandler<ProxyState> = {
  get(x, prop) {
    if (prop === DRAFT_STATE) return x
    const source = latest(x)
    if (!has(source, prop)) {
      return readPropFromProto(x, source, prop)
    }
    const y = source[prop]
    if (x.finalized || !isDraftable(y)) return y
    if (y === peek(x.base, prop)) {
      prepareCopy(x)
      return (x.copy![prop as any] = createProxy(y, x))
    }
    return y
  },
  has(x, k) {
    return k in latest(x)
  },
  ownKeys(x) {
    return Reflect.ownKeys(latest(x))
  },
  set(x: ProxyObj, k: string, v) {
    const desc = getDescriptorFromProto(latest(x), k)
    if (desc?.set) {
      desc.set.call(x.draft, v)
      return true
    }
    if (!x.modified) {
      const current = peek(latest(x), k)
      const currentState: ProxyObj = current?.[DRAFT_STATE]
      if (currentState && currentState.base === v) {
        x.copy![k] = v
        x.assigned[k] = false
        return true
      }
      if (is(v, current) && (v !== undefined || has(x.base, k))) return true
      prepareCopy(x)
      markChanged(x)
    }
    if (
      x.copy![k] === v &&
      typeof v !== "number" &&
      (v !== undefined || k in x.copy)
    )
      return true
    x.copy![k] = v
    x.assigned[k] = true
    return true
  },
  deleteProperty(x, k: string) {
    if (peek(x.base, k) !== undefined || k in x.base) {
      x.assigned[k] = false
      prepareCopy(x)
      markChanged(x)
    } else delete x.assigned[k]
    if (x.copy) delete x.copy[k]
    return true
  },
  getOwnPropertyDescriptor(x, k) {
    const owner = latest(x)
    const d = Reflect.getOwnPropertyDescriptor(owner, k)
    if (!d) return d
    return {
      writable: true,
      configurable: x.type !== ProxyType.Array || k !== "length",
      //qfix enumerable: d.enumerable,
      value: owner[k],
    }
  },
  defineProperty() {
    die(11)
  },
  getPrototypeOf(x) {
    return Object.getPrototypeOf(x.base)
  },
  setPrototypeOf() {
    die(12)
  },
}

const arrayTraps: ProxyHandler<[ProxyArray]> = {}

each(objectTraps, (k, f) => {
  arrayTraps[k] = function () {
    arguments[0] = arguments[0][0]
    return f.apply(this, arguments)
  }
})
arrayTraps.deleteProperty = function (x, k) {
  if (__DEV__ && isNaN(parseInt(k as any))) die(13)
  return arrayTraps.set!.call(this, x, k, undefined)
}
arrayTraps.set = function (x, k, v) {
  if (__DEV__ && k !== "length" && isNaN(parseInt(k as any))) die(14)
  return objectTraps.set!.call(this, x[0], k, v, x[0])
}

function peek(x: Drafted, k: PropertyKey) {
  const s = x[DRAFT_STATE]
  const y = s ? latest(s) : x
  return y[k]
}

function readPropFromProto(s: State, source: any, k: PropertyKey) {
  const d = getDescriptorFromProto(source, k)
  return d ? (`value` in d ? d.value : d.get?.call(s.draft)) : undefined
}

function getDescriptorFromProto(
  source: any,
  k: PropertyKey
): PropertyDescriptor | undefined {
  if (!(k in source)) return undefined
  let proto = Object.getPrototypeOf(source)
  while (proto) {
    const d = Object.getOwnPropertyDescriptor(proto, k)
    if (d) return d
    proto = Object.getPrototypeOf(proto)
  }
  return undefined
}

export function markChanged(x: State) {
  if (!x.modified) {
    x.modified = true
    if (x.parent) markChanged(x.parent)
  }
}

export function prepareCopy(x: { base: any; copy: any }) {
  if (!x.copy) x.copy = shallowCopy(x.base)
}

interface ProducersFns {
  produce: IProduce
  produceWithPatches: IProduceWithPatches
}

export class Immer implements ProducersFns {
  autoFreeze = true

  constructor(cfg?: { autoFreeze?: boolean }) {
    if (typeof cfg?.autoFreeze === "boolean")
      this.setAutoFreeze(cfg!.autoFreeze)
  }

  produce: IProduce = (base: any, recipe?: any, listener?: any) => {
    if (typeof base === "function" && typeof recipe !== "function") {
      const defaultBase = recipe
      recipe = base
      const self = this
      return function curriedProduce(
        this: any,
        base = defaultBase,
        ...args: any[]
      ) {
        return self.produce(base, (draft: Drafted) => recipe.call(this, draft, ...args)) // prettier-ignore
      }
    }
    if (typeof recipe !== "function") die(6)
    if (listener !== undefined && typeof listener !== "function") die(7)
    let y
    if (isDraftable(base)) {
      const scope = enterScope(this)
      const proxy = createProxy(base, undefined)
      let hasError = true
      try {
        y = recipe(proxy)
        hasError = false
      } finally {
        if (hasError) revokeScope(scope)
        else leaveScope(scope)
      }
      if (typeof Promise !== "undefined" && y instanceof Promise) {
        return y.then(
          result => {
            usePatchesInScope(scope, listener)
            return processResult(result, scope)
          },
          error => {
            revokeScope(scope)
            throw error
          }
        )
      }
      usePatchesInScope(scope, listener)
      return processResult(y, scope)
    } else if (!base || typeof base !== "object") {
      y = recipe(base)
      if (y === undefined) y = base
      if (y === NOTHING) y = undefined
      if (this.autoFreeze) freeze(y, true)
      if (listener) {
        const p: Patch[] = []
        const ip: Patch[] = []
        getPlugin("Patches").replacementPatches(base, y, p, ip)
        listener(p, ip)
      }
      return y
    } else die(21, base)
  }

  produceWithPatches: IProduceWithPatches = (
    arg1: any,
    arg2?: any,
    _?: any
  ): any => {
    if (typeof arg1 === "function") {
      return (x: any, ...xs: any[]) =>
        this.produceWithPatches(x, (draft: any) => arg1(draft, ...xs))
    }
    let ps: Patch[], inverses: Patch[]
    const y = this.produce(arg1, arg2, (p: Patch[], ip: Patch[]) => {
      ps = p
      inverses = ip
    })
    if (typeof Promise !== "undefined" && y instanceof Promise) {
      return y.then(next => [next, ps!, inverses!])
    }
    return [y, ps!, inverses!]
  }

  createDraft<T extends Objectish>(x: T): Draft<T> {
    if (!isDraftable(x)) die(8)
    if (isDraft(x)) x = current(x)
    const scope = enterScope(this)
    const y = createProxy(x, undefined)
    y[DRAFT_STATE].manual = true
    leaveScope(scope)
    return y as any
  }

  finishDraft<D extends Draft<any>>(
    x: D,
    listener?: Listener
  ): D extends Draft<infer T> ? T : never {
    const s: State = x && (x as any)[DRAFT_STATE]
    if (__DEV__) {
      if (!s || !s.manual) die(9)
      if (s.finalized) die(10)
    }
    const { scope: scope } = s
    usePatchesInScope(scope, listener)
    return processResult(undefined, scope)
  }

  setAutoFreeze(x: boolean) {
    this.autoFreeze = x
  }

  applyPatches<T extends Objectish>(x: T, ps: Patch[]): T {
    let i: number
    for (i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      if (p && p.path.length === 0 && p.op === "replace") {
        x = p.value
        break
      }
    }
    if (i > -1) ps = ps.slice(i + 1)
    const f = getPlugin("Patches").applyPatches
    if (isDraft(x)) return f(x, ps)
    return this.produce(x, (d: Drafted) => f(d, ps))
  }
}

export function createProxy<T extends Objectish>(
  x: T,
  s?: State
): Drafted<T, State> {
  const y: Drafted = isMap(x)
    ? getPlugin("MapSet").proxyMap(x, s)
    : isSet(x)
    ? getPlugin("MapSet").proxySet(x, s)
    : createProxyProxy(x, s)
  const scope = s ? s.scope : getCurrentScope()
  scope.drafts.push(y)
  return y
}
