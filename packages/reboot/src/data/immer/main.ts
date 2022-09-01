import {
  die,
  each,
  freeze,
  get,
  getQType,
  getPlugin,
  has,
  Immer,
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
  PatchListener,
  PatchPath,
  ProxyState,
  ProxyType,
  ProxyObject,
  ProxyArray,
  Scope,
  SetState,
  State,
} from "./types.js"

let currentScope: Scope | undefined

export function getCurrentScope() {
  if (__DEV__ && !currentScope) die(0)
  return currentScope!
}

function createScope(parent_: Scope | undefined, immer_: Immer): Scope {
  return {
    drafts_: [],
    parent_,
    immer_,
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0,
  }
}

export function usePatchesInScope(x: Scope, patchListener?: PatchListener) {
  if (patchListener) {
    getPlugin("Patches")
    x.patches_ = []
    x.inversePatches_ = []
    x.patchListener_ = patchListener
  }
}

export function revokeScope(x: Scope) {
  leaveScope(x)
  x.drafts_.forEach(revokeDraft)
  x.drafts_ = []
}

export function leaveScope(x: Scope) {
  if (x === currentScope) currentScope = x.parent_
}

export function enterScope(x: Immer) {
  return (currentScope = createScope(currentScope, x))
}

function revokeDraft(x: Drafted) {
  const s: State = x[DRAFT_STATE]
  if (s.type_ === ProxyType.ProxyObject || s.type_ === ProxyType.ProxyArray)
    s.revoke_()
  else s.revoked_ = true
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
  const t = getQType(x)
  if (s) {
    if (!s.modified_) return s.base_
    s.finalized_ = true
    copy = _copy(x, t)
    s.finalized_ = false
  } else {
    copy = _copy(x, t)
  }
  each(copy, (k, v) => {
    if (s && get(s.base_, k) === v) return
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
  s.unfinalizedDrafts_ = s.drafts_.length
  const d0 = s.drafts_![0]
  const isReplaced = x !== undefined && x !== d0
  if (isReplaced) {
    if (d0[DRAFT_STATE].modified_) {
      revokeScope(s)
      die(4)
    }
    if (isDraftable(x)) {
      x = finalize(s, x)
      if (!s.parent_) maybeFreeze(s, x)
    }
    if (s.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        d0[DRAFT_STATE].base_,
        x,
        s.patches_,
        s.inversePatches_!
      )
    }
  } else x = finalize(s, d0, [])
  revokeScope(s)
  if (s.patches_) s.patchListener_!(s.patches_, s.inversePatches_!)
  return x !== NOTHING ? x : undefined
}

function finalize(root: Scope, x: any, p?: PatchPath) {
  if (isFrozen(x)) return x
  const s: State = x[DRAFT_STATE]
  if (!s) {
    each(x, (k, v) => finalizeProperty(root, s, x, k, v, p), true)
    return x
  }
  if (s.scope_ !== root) return x
  if (!s.modified_) {
    maybeFreeze(root, s.base_, true)
    return s.base_
  }
  if (!s.finalized_) {
    s.finalized_ = true
    s.scope_.unfinalizedDrafts_--
    const y = s.copy_
    each(s.type_ === ProxyType.Set ? new Set(y) : y, (k, v) =>
      finalizeProperty(root, s, y, k, v, p)
    )
    maybeFreeze(root, y, false)
    if (p && root.patches_) {
      getPlugin("Patches").generatePatches_(
        s,
        p,
        root.patches_,
        root.inversePatches_!
      )
    }
  }
  return s.copy_
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
      state!.type_ !== ProxyType.Set &&
      !has((state as Exclude<State, SetState>).assigned_!, prop)
        ? p!.concat(prop)
        : undefined
    const y = finalize(root, v, path)
    set(x, prop, y)
    if (isDraft(y)) root.canAutoFreeze_ = false
    else return
  }
  if (isDraftable(v) && !isFrozen(v)) {
    if (!root.immer_.autoFreeze_ && root.unfinalizedDrafts_ < 1) {
      return
    }
    finalize(root, v)
    if (!state || !state.scope_.parent_) maybeFreeze(root, v)
  }
}

function maybeFreeze(s: Scope, x: any, deep = false) {
  if (s.immer_.autoFreeze_ && s.canAutoFreeze_) {
    freeze(x, deep)
  }
}

export function createProxyProxy<T extends Objectish>(
  base: T,
  parent?: State
): Drafted<T, ProxyState> {
  const isArray = Array.isArray(base)
  const state: ProxyState = {
    type_: isArray ? ProxyType.ProxyArray : (ProxyType.ProxyObject as any),
    scope_: parent ? parent.scope_ : getCurrentScope()!,
    modified_: false,
    finalized_: false,
    assigned_: {},
    parent_: parent,
    base_: base,
    draft_: null as any,
    copy_: null,
    revoke_: null as any,
    isManual_: false,
  }
  let target: T = state as any
  let traps: ProxyHandler<object | Array<any>> = objectTraps
  if (isArray) {
    target = [state] as any
    traps = arrayTraps
  }
  const { revoke, proxy } = Proxy.revocable(target, traps)
  state.draft_ = proxy as any
  state.revoke_ = revoke
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
    if (x.finalized_ || !isDraftable(y)) return y
    if (y === peek(x.base_, prop)) {
      prepareCopy(x)
      return (x.copy_![prop as any] = createProxy(y, x))
    }
    return y
  },
  has(x, k) {
    return k in latest(x)
  },
  ownKeys(x) {
    return Reflect.ownKeys(latest(x))
  },
  set(x: ProxyObject, k: string, v) {
    const desc = getDescriptorFromProto(latest(x), k)
    if (desc?.set) {
      desc.set.call(x.draft_, v)
      return true
    }
    if (!x.modified_) {
      const current = peek(latest(x), k)
      const currentState: ProxyObject = current?.[DRAFT_STATE]
      if (currentState && currentState.base_ === v) {
        x.copy_![k] = v
        x.assigned_[k] = false
        return true
      }
      if (is(v, current) && (v !== undefined || has(x.base_, k))) return true
      prepareCopy(x)
      markChanged(x)
    }
    if (
      x.copy_![k] === v &&
      typeof v !== "number" &&
      (v !== undefined || k in x.copy_)
    )
      return true
    x.copy_![k] = v
    x.assigned_[k] = true
    return true
  },
  deleteProperty(x, k: string) {
    if (peek(x.base_, k) !== undefined || k in x.base_) {
      x.assigned_[k] = false
      prepareCopy(x)
      markChanged(x)
    } else delete x.assigned_[k]
    if (x.copy_) delete x.copy_[k]
    return true
  },
  getOwnPropertyDescriptor(x, k) {
    const owner = latest(x)
    const desc = Reflect.getOwnPropertyDescriptor(owner, k)
    if (!desc) return desc
    return {
      writable: true,
      configurable: x.type_ !== ProxyType.ProxyArray || k !== "length",
      enumerable: desc.enumerable,
      value: owner[k],
    }
  },
  defineProperty() {
    die(11)
  },
  getPrototypeOf(x) {
    return Object.getPrototypeOf(x.base_)
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
  return d ? (`value` in d ? d.value : d.get?.call(s.draft_)) : undefined
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
  if (!x.modified_) {
    x.modified_ = true
    if (x.parent_) markChanged(x.parent_)
  }
}

export function prepareCopy(state: { base_: any; copy_: any }) {
  if (!state.copy_) state.copy_ = shallowCopy(state.base_)
}

interface ProducersFns {
  produce: IProduce
  produceWithPatches: IProduceWithPatches
}

export class Immer implements ProducersFns {
  autoFreeze_ = true

  constructor(config?: { autoFreeze?: boolean }) {
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config!.autoFreeze)
  }

  produce: IProduce = (base: any, recipe?: any, patchListener?: any) => {
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
    if (patchListener !== undefined && typeof patchListener !== "function")
      die(7)
    let result
    if (isDraftable(base)) {
      const scope = enterScope(this)
      const proxy = createProxy(this, base, undefined)
      let hasError = true
      try {
        result = recipe(proxy)
        hasError = false
      } finally {
        if (hasError) revokeScope(scope)
        else leaveScope(scope)
      }
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then(
          result => {
            usePatchesInScope(scope, patchListener)
            return processResult(result, scope)
          },
          error => {
            revokeScope(scope)
            throw error
          }
        )
      }
      usePatchesInScope(scope, patchListener)
      return processResult(result, scope)
    } else if (!base || typeof base !== "object") {
      result = recipe(base)
      if (result === undefined) result = base
      if (result === NOTHING) result = undefined
      if (this.autoFreeze_) freeze(result, true)
      if (patchListener) {
        const p: Patch[] = []
        const ip: Patch[] = []
        getPlugin("Patches").generateReplacementPatches_(base, result, p, ip)
        patchListener(p, ip)
      }
      return result
    } else die(21, base)
  }

  produceWithPatches: IProduceWithPatches = (
    arg1: any,
    arg2?: any,
    arg3?: any
  ): any => {
    if (typeof arg1 === "function") {
      return (state: any, ...args: any[]) =>
        this.produceWithPatches(state, (draft: any) => arg1(draft, ...args))
    }

    let patches: Patch[], inversePatches: Patch[]
    const result = this.produce(arg1, arg2, (p: Patch[], ip: Patch[]) => {
      patches = p
      inversePatches = ip
    })

    if (typeof Promise !== "undefined" && result instanceof Promise) {
      return result.then(nextState => [nextState, patches!, inversePatches!])
    }
    return [result, patches!, inversePatches!]
  }

  createDraft<T extends Objectish>(base: T): Draft<T> {
    if (!isDraftable(base)) die(8)
    if (isDraft(base)) base = current(base)
    const scope = enterScope(this)
    const proxy = createProxy(this, base, undefined)
    proxy[DRAFT_STATE].isManual_ = true
    leaveScope(scope)
    return proxy as any
  }

  finishDraft<D extends Draft<any>>(
    draft: D,
    patchListener?: PatchListener
  ): D extends Draft<infer T> ? T : never {
    const state: State = draft && (draft as any)[DRAFT_STATE]
    if (__DEV__) {
      if (!state || !state.isManual_) die(9)
      if (state.finalized_) die(10)
    }
    const { scope_: scope } = state
    usePatchesInScope(scope, patchListener)
    return processResult(undefined, scope)
  }

  setAutoFreeze(value: boolean) {
    this.autoFreeze_ = value
  }

  applyPatches<T extends Objectish>(base: T, patches: Patch[]): T {
    let i: number
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i]
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value
        break
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1)
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches)
    }
    return this.produce(base, (draft: Drafted) =>
      applyPatchesImpl(draft, patches)
    )
  }
}

export function createProxy<T extends Objectish>(
  x: T,
  s?: State
): Drafted<T, State> {
  const y: Drafted = isMap(x)
    ? getPlugin("MapSet").proxyMap_(x, s)
    : isSet(x)
    ? getPlugin("MapSet").proxySet_(x, s)
    : createProxyProxy(x, s)
  const scope = s ? s.scope_ : getCurrentScope()
  scope.drafts_.push(y)
  return y
}
