import {
  die,
  DRAFT_STATE,
  each,
  freeze,
  get,
  getArchtype,
  getPlugin,
  has,
  hasProxies,
  Immer,
  is,
  isDraft,
  isDraftable,
  isFrozen,
  isMap,
  isSet,
  latest,
  NOTHING,
  set,
  shallowCopy,
} from "./utils.js"

import {
  Archtype,
  Draft,
  Drafted,
  IProduce,
  IProduceWithPatches,
  Objectish,
  Patch,
  PatchListener,
  PatchPath,
  ProxyType,
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
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0,
  }
}

export function usePatchesInScope(scope: Scope, patchListener?: PatchListener) {
  if (patchListener) {
    getPlugin("Patches")
    scope.patches_ = []
    scope.inversePatches_ = []
    scope.patchListener_ = patchListener
  }
}

export function revokeScope(scope: Scope) {
  leaveScope(scope)
  scope.drafts_.forEach(revokeDraft)
  scope.drafts_ = null
}

export function leaveScope(scope: Scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_
  }
}

export function enterScope(immer: Immer) {
  return (currentScope = createScope(currentScope, immer))
}

function revokeDraft(draft: Drafted) {
  const state: State = draft[DRAFT_STATE]
  if (
    state.type_ === ProxyType.ProxyObject ||
    state.type_ === ProxyType.ProxyArray
  )
    state.revoke_()
  else state.revoked_ = true
}

export function current<T>(value: T): T
export function current(value: any): any {
  if (!isDraft(value)) die(22, value)
  return _current(value)
}

function _current(value: any): any {
  if (!isDraftable(value)) return value
  const state: State | undefined = value[DRAFT_STATE]
  let copy: any
  const archType = getArchtype(value)
  if (state) {
    if (
      !state.modified_ &&
      (state.type_ < 4 || !getPlugin("ES5").hasChanges_(state as any))
    )
      return state.base_
    state.finalized_ = true
    copy = _copy(value, archType)
    state.finalized_ = false
  } else {
    copy = _copy(value, archType)
  }
  each(copy, (key, childValue) => {
    if (state && get(state.base_, key) === childValue) return
    set(copy, key, _current(childValue))
  })
  return archType === Archtype.Set ? new Set(copy) : copy
}

function _copy(value: any, archType: number): any {
  switch (archType) {
    case Archtype.Map:
      return new Map(value)
    case Archtype.Set:
      return Array.from(value)
  }
  return shallowCopy(value)
}

export function processResult(result: any, scope: Scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length
  const baseDraft = scope.drafts_![0]
  const isReplaced = result !== undefined && result !== baseDraft
  if (!scope.immer_.useProxies_)
    getPlugin("ES5").willFinalizeES5_(scope, result, isReplaced)
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope)
      die(4)
    }
    if (isDraftable(result)) {
      result = finalize(scope, result)
      if (!scope.parent_) maybeFreeze(scope, result)
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_!
      )
    }
  } else {
    result = finalize(scope, baseDraft, [])
  }
  revokeScope(scope)
  if (scope.patches_) {
    scope.patchListener_!(scope.patches_, scope.inversePatches_!)
  }
  return result !== NOTHING ? result : undefined
}

function finalize(rootScope: Scope, value: any, path?: PatchPath) {
  if (isFrozen(value)) return value
  const state: State = value[DRAFT_STATE]
  if (!state) {
    each(
      value,
      (key, childValue) =>
        finalizeProperty(rootScope, state, value, key, childValue, path),
      true
    )
    return value
  }
  if (state.scope_ !== rootScope) return value
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true)
    return state.base_
  }
  if (!state.finalized_) {
    state.finalized_ = true
    state.scope_.unfinalizedDrafts_--
    const result =
      state.type_ === ProxyType.ES5Object || state.type_ === ProxyType.ES5Array
        ? (state.copy_ = shallowCopy(state.draft_))
        : state.copy_
    each(
      state.type_ === ProxyType.Set ? new Set(result) : result,
      (key, childValue) =>
        finalizeProperty(rootScope, state, result, key, childValue, path)
    )
    maybeFreeze(rootScope, result, false)
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_!
      )
    }
  }
  return state.copy_
}

function finalizeProperty(
  rootScope: Scope,
  parentState: undefined | State,
  targetObject: any,
  prop: string | number,
  childValue: any,
  rootPath?: PatchPath
) {
  if (__DEV__ && childValue === targetObject) die(5)
  if (isDraft(childValue)) {
    const path =
      rootPath &&
      parentState &&
      parentState!.type_ !== ProxyType.Set &&
      !has((parentState as Exclude<State, SetState>).assigned_!, prop)
        ? rootPath!.concat(prop)
        : undefined
    const res = finalize(rootScope, childValue, path)
    set(targetObject, prop, res)
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false
    } else return
  }
  if (isDraftable(childValue) && !isFrozen(childValue)) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return
    }
    finalize(rootScope, childValue)
    if (!parentState || !parentState.scope_.parent_)
      maybeFreeze(rootScope, childValue)
  }
}

function maybeFreeze(scope: Scope, value: any, deep = false) {
  if (scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep)
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
  get(state, prop) {
    if (prop === DRAFT_STATE) return state

    const source = latest(state)
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop)
    }
    const value = source[prop]
    if (state.finalized_ || !isDraftable(value)) {
      return value
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state)
      return (state.copy_![prop as any] = createProxy(
        state.scope_.immer_,
        value,
        state
      ))
    }
    return value
  },
  has(state, prop) {
    return prop in latest(state)
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state))
  },
  set(state: ProxyObject, prop: string, value) {
    const desc = getDescriptorFromProto(latest(state), prop)
    if (desc?.set) {
      desc.set.call(state.draft_, value)
      return true
    }
    if (!state.modified_) {
      const current = peek(latest(state), prop)
      const currentState: ProxyObject = current?.[DRAFT_STATE]
      if (currentState && currentState.base_ === value) {
        state.copy_![prop] = value
        state.assigned_[prop] = false
        return true
      }
      if (is(value, current) && (value !== undefined || has(state.base_, prop)))
        return true
      prepareCopy(state)
      markChanged(state)
    }

    if (
      state.copy_![prop] === value &&
      typeof value !== "number" &&
      (value !== undefined || prop in state.copy_)
    )
      return true
    state.copy_![prop] = value
    state.assigned_[prop] = true
    return true
  },
  deleteProperty(state, prop: string) {
    if (peek(state.base_, prop) !== undefined || prop in state.base_) {
      state.assigned_[prop] = false
      prepareCopy(state)
      markChanged(state)
    } else {
      delete state.assigned_[prop]
    }
    if (state.copy_) delete state.copy_[prop]
    return true
  },
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state)
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop)
    if (!desc) return desc
    return {
      writable: true,
      configurable: state.type_ !== ProxyType.ProxyArray || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop],
    }
  },
  defineProperty() {
    die(11)
  },
  getPrototypeOf(state) {
    return Object.getPrototypeOf(state.base_)
  },
  setPrototypeOf() {
    die(12)
  },
}

const arrayTraps: ProxyHandler<[ProxyArray]> = {}
each(objectTraps, (key, fn) => {
  arrayTraps[key] = function () {
    arguments[0] = arguments[0][0]
    return fn.apply(this, arguments)
  }
})
arrayTraps.deleteProperty = function (state, prop) {
  if (__DEV__ && isNaN(parseInt(prop as any))) die(13)
  return arrayTraps.set!.call(this, state, prop, undefined)
}
arrayTraps.set = function (state, prop, value) {
  if (__DEV__ && prop !== "length" && isNaN(parseInt(prop as any))) die(14)
  return objectTraps.set!.call(this, state[0], prop, value, state[0])
}

function peek(draft: Drafted, prop: PropertyKey) {
  const state = draft[DRAFT_STATE]
  const source = state ? latest(state) : draft
  return source[prop]
}

function readPropFromProto(state: State, source: any, prop: PropertyKey) {
  const desc = getDescriptorFromProto(source, prop)
  return desc
    ? `value` in desc
      ? desc.value
      : desc.get?.call(state.draft_)
    : undefined
}

function getDescriptorFromProto(
  source: any,
  prop: PropertyKey
): PropertyDescriptor | undefined {
  if (!(prop in source)) return undefined
  let proto = Object.getPrototypeOf(source)
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop)
    if (desc) return desc
    proto = Object.getPrototypeOf(proto)
  }
  return undefined
}

export function markChanged(state: State) {
  if (!state.modified_) {
    state.modified_ = true
    if (state.parent_) {
      markChanged(state.parent_)
    }
  }
}

export function prepareCopy(state: { base_: any; copy_: any }) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(state.base_)
  }
}

interface ProducersFns {
  produce: IProduce
  produceWithPatches: IProduceWithPatches
}

export class Immer implements ProducersFns {
  useProxies_: boolean = hasProxies
  autoFreeze_ = true

  constructor(config?: { useProxies?: boolean; autoFreeze?: boolean }) {
    if (typeof config?.useProxies === "boolean")
      this.setUseProxies(config!.useProxies)
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

  setUseProxies(value: boolean) {
    if (value && !hasProxies) {
      die(20)
    }
    this.useProxies_ = value
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
  immer: Immer,
  value: T,
  parent?: State
): Drafted<T, State> {
  const draft: Drafted = isMap(value)
    ? getPlugin("MapSet").proxyMap_(value, parent)
    : isSet(value)
    ? getPlugin("MapSet").proxySet_(value, parent)
    : immer.useProxies_
    ? createProxyProxy(value, parent)
    : getPlugin("ES5").createES5Proxy_(value, parent)

  const scope = parent ? parent.scope_ : getCurrentScope()
  scope.drafts_.push(draft)
  return draft
}
