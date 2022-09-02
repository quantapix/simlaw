import * as qt from "./types.js"
import * as qu from "./utils.js"

let currentScope: qt.Scope | undefined

export function getCurrentScope() {
  if (__DEV__ && !currentScope) qu.die(0)
  return currentScope!
}

function createScope(parent: qt.Scope | undefined, immer: Immer): qt.Scope {
  return {
    canAutoFreeze: true,
    drafts: [],
    immer,
    parent,
    unfinalized: 0,
  }
}

export function enterScope(x: Immer) {
  return (currentScope = createScope(currentScope, x))
}

export function leaveScope(x: qt.Scope) {
  if (x === currentScope) currentScope = x.parent
}

export function revokeScope(x: qt.Scope) {
  leaveScope(x)
  x.drafts.forEach(revokeDraft)
  x.drafts = []
}

export function usePatchesInScope(x: qt.Scope, listener?: qt.Listener) {
  if (listener) {
    qu.getPlugin("Patches")
    x.patches = []
    x.inverses = []
    x.listener = listener
  }
}

function revokeDraft(x: qt.Drafted) {
  const s: qt.State = x[qt.DRAFT_STATE]
  if (s.type === qt.ProxyType.Obj || s.type === qt.ProxyType.Array) s.revoke()
  else s.revoked = true
}

export function current<T>(x: T): T
export function current(x: any): any {
  if (!qu.isDraft(x)) qu.die(22, x)
  return _current(x)
}

function _current(x: any): any {
  if (!qu.isDraftable(x)) return x
  const s: qt.State | undefined = x[qt.DRAFT_STATE]
  let copy: any
  const t = qu.getType(x)
  if (s) {
    if (!s.modified) return s.base
    s.finalized = true
    copy = _copy(x, t)
    s.finalized = false
  } else copy = _copy(x, t)
  qu.each(copy, (k, v) => {
    if (s && qu.get(s.base, k) === v) return
    qu.set(copy, k, _current(v))
  })
  return t === qt.QType.Set ? new Set(copy) : copy
}

function _copy(x: any, t: number): any {
  switch (t) {
    case qt.QType.Map:
      return new Map(x)
    case qt.QType.Set:
      return Array.from(x)
  }
  return qu.shallowCopy(x)
}

export function processResult(x: any, s: qt.Scope) {
  s.unfinalized = s.drafts.length
  const d0 = s.drafts![0]
  const isReplaced = x !== undefined && x !== d0
  if (isReplaced) {
    if (d0[qt.DRAFT_STATE].modified) {
      revokeScope(s)
      qu.die(4)
    }
    if (qu.isDraftable(x)) {
      x = finalize(s, x)
      if (!s.parent) maybeFreeze(s, x)
    }
    if (s.patches) {
      qu.getPlugin("Patches").substitutePatches(
        d0[qt.DRAFT_STATE].base,
        x,
        s.patches,
        s.inverses!
      )
    }
  } else x = finalize(s, d0, [])
  revokeScope(s)
  if (s.patches) s.listener!(s.patches, s.inverses!)
  return x !== qt.NOTHING ? x : undefined
}

function finalize(root: qt.Scope, x: any, p?: qt.PatchPath) {
  if (qu.isFrozen(x)) return x
  const s: qt.State = x[qt.DRAFT_STATE]
  if (!s) {
    qu.each(x, (k, v) => finalizeProperty(root, s, x, k, v, p), true)
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
    qu.each(s.type === qt.ProxyType.Set ? new Set(y) : y, (k, v) =>
      finalizeProperty(root, s, y, k, v, p)
    )
    maybeFreeze(root, y, false)
    if (p && root.patches) {
      qu.getPlugin("Patches").generatePatches(
        s,
        p,
        root.patches,
        root.inverses!
      )
    }
  }
  return s.copy
}

function finalizeProperty(
  root: qt.Scope,
  state: qt.State | undefined,
  x: any,
  prop: string | number,
  v: any,
  p?: qt.PatchPath
) {
  if (__DEV__ && v === x) qu.die(5)
  if (qu.isDraft(v)) {
    const path =
      p &&
      state &&
      state!.type !== qt.ProxyType.Set &&
      !qu.has((state as Exclude<qt.State, qt.SetState>).assigned!, prop)
        ? p!.concat(prop)
        : undefined
    const y = finalize(root, v, path)
    qu.set(x, prop, y)
    if (qu.isDraft(y)) root.canAutoFreeze = false
    else return
  }
  if (qu.isDraftable(v) && !qu.isFrozen(v)) {
    if (!root.immer.autoFreeze && root.unfinalized < 1) {
      return
    }
    finalize(root, v)
    if (!state || !state.scope.parent) maybeFreeze(root, v)
  }
}

function maybeFreeze(s: qt.Scope, x: any, deep = false) {
  if (s.immer.autoFreeze && s.canAutoFreeze) {
    qu.freeze(x, deep)
  }
}

export function createProxyProxy<T extends qt.Objectish>(
  base: T,
  parent?: qt.State
): qt.Drafted<T, qt.ProxyState> {
  const isArray = Array.isArray(base)
  const state: qt.ProxyState = {
    type: isArray ? qt.ProxyType.Array : (qt.ProxyType.Obj as any),
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

export const objectTraps: ProxyHandler<qt.ProxyState> = {
  get(x, k) {
    if (k === qt.DRAFT_STATE) return x
    const src = qu.latest(x)
    if (!qu.has(src, k)) {
      return readPropFromProto(x, src, k)
    }
    const y = src[k]
    if (x.finalized || !qu.isDraftable(y)) return y
    if (y === peek(x.base, k)) {
      prepareCopy(x)
      return (x.copy![k as any] = createProxy(y, x))
    }
    return y
  },
  has(x, k) {
    return k in qu.latest(x)
  },
  ownKeys(x) {
    return Reflect.ownKeys(qu.latest(x))
  },
  set(x: qt.ProxyObj, k: string, v) {
    const desc = getDescriptorFromProto(qu.latest(x), k)
    if (desc?.set) {
      desc.set.call(x.draft, v)
      return true
    }
    if (!x.modified) {
      const current = peek(qu.latest(x), k)
      const currentState: qt.ProxyObj = current?.[qt.DRAFT_STATE]
      if (currentState && currentState.base === v) {
        x.copy![k] = v
        x.assigned[k] = false
        return true
      }
      if (qu.is(v, current) && (v !== undefined || qu.has(x.base, k)))
        return true
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
    const owner = qu.latest(x)
    const d = Reflect.getOwnPropertyDescriptor(owner, k)
    if (!d) return d
    return {
      writable: true,
      configurable: x.type !== qt.ProxyType.Array || k !== "length",
      //qfix enumerable: d.enumerable,
      value: owner[k],
    }
  },
  defineProperty() {
    qu.die(11)
  },
  getPrototypeOf(x) {
    return Object.getPrototypeOf(x.base)
  },
  setPrototypeOf() {
    qu.die(12)
  },
}

const arrayTraps: ProxyHandler<[qt.ProxyArray]> = {}

qu.each(objectTraps, (k, f) => {
  arrayTraps[k] = function () {
    arguments[0] = arguments[0][0]
    return f.apply(this, arguments)
  }
})
arrayTraps.deleteProperty = function (x, k) {
  if (__DEV__ && isNaN(parseInt(k as any))) qu.die(13)
  return arrayTraps.set!.call(this, x, k, undefined)
}
arrayTraps.set = function (x, k, v) {
  if (__DEV__ && k !== "length" && isNaN(parseInt(k as any))) qu.die(14)
  return objectTraps.set!.call(this, x[0], k, v, x[0])
}

function peek(x: qt.Drafted, k: PropertyKey) {
  const s = x[qt.DRAFT_STATE]
  const y = s ? qu.latest(s) : x
  return y[k]
}

function readPropFromProto(s: qt.State, src: any, k: PropertyKey) {
  const d = getDescriptorFromProto(src, k)
  return d ? (`value` in d ? d.value : d.get?.call(s.draft)) : undefined
}

function getDescriptorFromProto(
  src: any,
  k: PropertyKey
): PropertyDescriptor | undefined {
  if (!(k in src)) return undefined
  let proto = Object.getPrototypeOf(src)
  while (proto) {
    const d = Object.getOwnPropertyDescriptor(proto, k)
    if (d) return d
    proto = Object.getPrototypeOf(proto)
  }
  return undefined
}

export function markChanged(x: qt.State) {
  if (!x.modified) {
    x.modified = true
    if (x.parent) markChanged(x.parent)
  }
}

export function prepareCopy(x: { base: any; copy: any }) {
  if (!x.copy) x.copy = qu.shallowCopy(x.base)
}

interface ProducersFns {
  produce: qt.Produce
  produceWithPatches: qt.ProduceWithPatches
}

export class Immer implements ProducersFns {
  autoFreeze = true

  constructor(cfg?: { autoFreeze?: boolean }) {
    if (typeof cfg?.autoFreeze === "boolean")
      this.setAutoFreeze(cfg!.autoFreeze)
  }

  produce: qt.Produce = (base: any, recipe?: any, listener?: any) => {
    if (typeof base === "function" && typeof recipe !== "function") {
      const defaultBase = recipe
      recipe = base
      const self = this
      return function curriedProduce(
        this: any,
        base = defaultBase,
        ...args: any[]
      ) {
        return self.produce(base, (draft: qt.Drafted) => recipe.call(this, draft, ...args)) // prettier-ignore
      }
    }
    if (typeof recipe !== "function") qu.die(6)
    if (listener !== undefined && typeof listener !== "function") qu.die(7)
    let y
    if (qu.isDraftable(base)) {
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
      if (y === qt.NOTHING) y = undefined
      if (this.autoFreeze) qu.freeze(y, true)
      if (listener) {
        const p: qt.Patch[] = []
        const ip: qt.Patch[] = []
        qu.getPlugin("Patches").substitutePatches(base, y, p, ip)
        listener(p, ip)
      }
      return y
    } else qu.die(21, base)
  }

  produceWithPatches: qt.ProduceWithPatches = (
    arg1: any,
    arg2?: any,
    _?: any
  ): any => {
    if (typeof arg1 === "function") {
      return (x: any, ...xs: any[]) =>
        this.produceWithPatches(x, (draft: any) => arg1(draft, ...xs))
    }
    let ps: qt.Patch[], inverses: qt.Patch[]
    const y = this.produce(arg1, arg2, (p: qt.Patch[], ip: qt.Patch[]) => {
      ps = p
      inverses = ip
    })
    if (typeof Promise !== "undefined" && y instanceof Promise) {
      return y.then(next => [next, ps!, inverses!])
    }
    return [y, ps!, inverses!]
  }

  createDraft<T extends qt.Objectish>(x: T): qt.Draft<T> {
    if (!qu.isDraftable(x)) qu.die(8)
    if (qu.isDraft(x)) x = current(x)
    const scope = enterScope(this)
    const y = createProxy(x, undefined)
    y[qt.DRAFT_STATE].manual = true
    leaveScope(scope)
    return y as any
  }

  finishDraft<D extends qt.Draft<any>>(
    x: D,
    listener?: qt.Listener
  ): D extends qt.Draft<infer T> ? T : never {
    const s: qt.State = x && (x as any)[qt.DRAFT_STATE]
    if (__DEV__) {
      if (!s || !s.manual) qu.die(9)
      if (s.finalized) qu.die(10)
    }
    const { scope: scope } = s
    usePatchesInScope(scope, listener)
    return processResult(undefined, scope)
  }

  setAutoFreeze(x: boolean) {
    this.autoFreeze = x
  }

  applyPatches<T extends qt.Objectish>(x: T, ps: qt.Patch[]): T {
    let i: number
    for (i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      if (p && p.path.length === 0 && p.op === "replace") {
        x = p.value
        break
      }
    }
    if (i > -1) ps = ps.slice(i + 1)
    const f = qu.getPlugin("Patches").applyPatches
    if (qu.isDraft(x)) return f(x, ps)
    return this.produce(x, (d: qt.Drafted) => f(d, ps))
  }
}

export function createProxy<T extends qt.Objectish>(
  x: T,
  s?: qt.State
): qt.Drafted<T, qt.State> {
  const y: qt.Drafted = qu.isMap(x)
    ? qu.getPlugin("MapSet").proxyMap(x, s)
    : qu.isSet(x)
    ? qu.getPlugin("MapSet").proxySet(x, s)
    : createProxyProxy(x, s)
  const scope = s ? s.scope : getCurrentScope()
  scope.drafts.push(y)
  return y
}
