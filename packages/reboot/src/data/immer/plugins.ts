import {
  createProxy,
  die,
  each,
  get,
  getQType,
  getCurrentScope,
  has,
  immerable,
  isDraft,
  isDraftable,
  isMap,
  isSet,
  latest,
  loadPlugin,
  markChanged,
} from "./utils.js"
import {
  DRAFT_STATE,
  NOTHING,
  AnyMap,
  AnySet,
  QType,
  MapState,
  Patch,
  PatchPath,
  ProxyArray,
  ProxyObject,
  ProxyType,
  SetState,
  State,
} from "./types.js"

export function enableMapSet() {
  var extendStatics = function (d: any, b: any): any {
    extendStatics =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (d, b) {
          d.__proto__ = b
        }) ||
      function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
      }
    return extendStatics(d, b)
  }

  function __extends(d: any, b: any): any {
    extendStatics(d, b)
    function __(this: any): any {
      this.constructor = d
    }
    d.prototype = ((__.prototype = b.prototype), new __())
  }

  const DraftMap = (function (_super) {
    __extends(DraftMap, _super)
    function DraftMap(this: any, target: AnyMap, parent?: State): any {
      this[DRAFT_STATE] = {
        type_: ProxyType.Map,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope()!,
        modified_: false,
        finalized_: false,
        copy_: undefined,
        assigned_: undefined,
        base_: target,
        draft_: this as any,
        isManual_: false,
        revoked_: false,
      } as MapState
      return this
    }
    const p = DraftMap.prototype

    Object.defineProperty(p, "size", {
      get: function () {
        return latest(this[DRAFT_STATE]).size
      },
    })

    p.has = function (key: any): boolean {
      return latest(this[DRAFT_STATE]).has(key)
    }

    p.set = function (key: any, value: any) {
      const state: MapState = this[DRAFT_STATE]
      assertUnrevoked(state)
      if (!latest(state).has(key) || latest(state).get(key) !== value) {
        prepareMapCopy(state)
        markChanged(state)
        state.assigned_!.set(key, true)
        state.copy_!.set(key, value)
        state.assigned_!.set(key, true)
      }
      return this
    }

    p.delete = function (key: any): boolean {
      if (!this.has(key)) {
        return false
      }

      const state: MapState = this[DRAFT_STATE]
      assertUnrevoked(state)
      prepareMapCopy(state)
      markChanged(state)
      if (state.base_.has(key)) {
        state.assigned_!.set(key, false)
      } else {
        state.assigned_!.delete(key)
      }
      state.copy_!.delete(key)
      return true
    }

    p.clear = function () {
      const state: MapState = this[DRAFT_STATE]
      assertUnrevoked(state)
      if (latest(state).size) {
        prepareMapCopy(state)
        markChanged(state)
        state.assigned_ = new Map()
        each(state.base_, key => {
          state.assigned_!.set(key, false)
        })
        state.copy_!.clear()
      }
    }

    p.forEach = function (
      cb: (value: any, key: any, self: any) => void,
      thisArg?: any
    ) {
      const state: MapState = this[DRAFT_STATE]
      latest(state).forEach((_value: any, key: any, _map: any) => {
        cb.call(thisArg, this.get(key), key, this)
      })
    }

    p.get = function (key: any): any {
      const state: MapState = this[DRAFT_STATE]
      assertUnrevoked(state)
      const value = latest(state).get(key)
      if (state.finalized_ || !isDraftable(value)) {
        return value
      }
      if (value !== state.base_.get(key)) {
        return value
      }
      const draft = createProxy(value, state)
      prepareMapCopy(state)
      state.copy_!.set(key, draft)
      return draft
    }

    p.keys = function (): IterableIterator<any> {
      return latest(this[DRAFT_STATE]).keys()
    }

    p.values = function (): IterableIterator<any> {
      const iterator = this.keys()
      return {
        [Symbol.iterator]: () => this.values(),
        next: () => {
          const r = iterator.next()
          if (r.done) return r
          const value = this.get(r.value)
          return {
            done: false,
            value,
          }
        },
      } as any
    }

    p.entries = function (): IterableIterator<[any, any]> {
      const iterator = this.keys()
      return {
        [Symbol.iterator]: () => this.entries(),
        next: () => {
          const r = iterator.next()
          if (r.done) return r
          const value = this.get(r.value)
          return {
            done: false,
            value: [r.value, value],
          }
        },
      } as any
    }

    p[Symbol.iterator] = function () {
      return this.entries()
    }

    return DraftMap
  })(Map)

  function proxyMap_<T extends AnyMap>(target: T, parent?: State): T {
    return new DraftMap(target, parent)
  }

  function prepareMapCopy(state: MapState) {
    if (!state.copy_) {
      state.assigned_ = new Map()
      state.copy_ = new Map(state.base_)
    }
  }

  const DraftSet = (function (_super) {
    __extends(DraftSet, _super)
    function DraftSet(this: any, target: AnySet, parent?: State) {
      this[DRAFT_STATE] = {
        type_: ProxyType.Set,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope()!,
        modified_: false,
        finalized_: false,
        copy_: undefined,
        base_: target,
        draft_: this,
        drafts_: new Map(),
        revoked_: false,
        isManual_: false,
      } as SetState
      return this
    }
    const p = DraftSet.prototype

    Object.defineProperty(p, "size", {
      get: function () {
        return latest(this[DRAFT_STATE]).size
      },
    })

    p.has = function (value: any): boolean {
      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      if (!state.copy_) {
        return state.base_.has(value)
      }
      if (state.copy_.has(value)) return true
      if (state.drafts_.has(value) && state.copy_.has(state.drafts_.get(value)))
        return true
      return false
    }

    p.add = function (value: any): any {
      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      if (!this.has(value)) {
        prepareSetCopy(state)
        markChanged(state)
        state.copy_!.add(value)
      }
      return this
    }

    p.delete = function (value: any): any {
      if (!this.has(value)) {
        return false
      }

      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      prepareSetCopy(state)
      markChanged(state)
      return (
        state.copy_!.delete(value) ||
        (state.drafts_.has(value)
          ? state.copy_!.delete(state.drafts_.get(value))
          : false)
      )
    }

    p.clear = function () {
      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      if (latest(state).size) {
        prepareSetCopy(state)
        markChanged(state)
        state.copy_!.clear()
      }
    }

    p.values = function (): IterableIterator<any> {
      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      prepareSetCopy(state)
      return state.copy_!.values()
    }

    p.entries = function entries(): IterableIterator<[any, any]> {
      const state: SetState = this[DRAFT_STATE]
      assertUnrevoked(state)
      prepareSetCopy(state)
      return state.copy_!.entries()
    }

    p.keys = function (): IterableIterator<any> {
      return this.values()
    }

    p[Symbol.iterator] = function () {
      return this.values()
    }

    p.forEach = function forEach(cb: any, thisArg?: any) {
      const iterator = this.values()
      let result = iterator.next()
      while (!result.done) {
        cb.call(thisArg, result.value, result.value, this)
        result = iterator.next()
      }
    }

    return DraftSet
  })(Set)

  function proxySet_<T extends AnySet>(target: T, parent?: State): T {
    return new DraftSet(target, parent)
  }

  function prepareSetCopy(state: SetState) {
    if (!state.copy_) {
      state.copy_ = new Set()
      state.base_.forEach(value => {
        if (isDraftable(value)) {
          const draft = createProxy(value, state)
          state.drafts_.set(value, draft)
          state.copy_!.add(draft)
        } else {
          state.copy_!.add(value)
        }
      })
    }
  }

  function assertUnrevoked(state: any) {
    if (state.revoked_) die(3, JSON.stringify(latest(state)))
  }

  loadPlugin("MapSet", { proxyMap_, proxySet_ })
}

export function enablePatches() {
  const REPLACE = "replace"
  const ADD = "add"
  const REMOVE = "remove"

  function generatePatches_(
    state: State,
    basePath: PatchPath,
    patches: Patch[],
    inversePatches: Patch[]
  ): void {
    switch (state.type_) {
      case ProxyType.ProxyObject:
      case ProxyType.Object:
      case ProxyType.Map:
        return generatePatchesFromAssigned(
          state,
          basePath,
          patches,
          inversePatches
        )
      case ProxyType.ProxyArray:
        return generateArrayPatches(state, basePath, patches, inversePatches)
      case ProxyType.Set:
        return generateSetPatches(
          state as any as SetState,
          basePath,
          patches,
          inversePatches
        )
    }
  }

  function generateArrayPatches(
    state: ProxyArray,
    basePath: PatchPath,
    patches: Patch[],
    inversePatches: Patch[]
  ) {
    let { base_, assigned_ } = state
    let copy_ = state.copy_!
    if (copy_.length < base_.length) {
      ;[base_, copy_] = [copy_, base_]
      ;[patches, inversePatches] = [inversePatches, patches]
    }
    for (let i = 0; i < base_.length; i++) {
      if (assigned_[i] && copy_[i] !== base_[i]) {
        const path = basePath.concat([i])
        patches.push({
          op: REPLACE,
          path,
          value: clonePatchValueIfNeeded(copy_[i]),
        })
        inversePatches.push({
          op: REPLACE,
          path,
          value: clonePatchValueIfNeeded(base_[i]),
        })
      }
    }
    for (let i = base_.length; i < copy_.length; i++) {
      const path = basePath.concat([i])
      patches.push({
        op: ADD,
        path,
        value: clonePatchValueIfNeeded(copy_[i]),
      })
    }
    if (base_.length < copy_.length) {
      inversePatches.push({
        op: REPLACE,
        path: basePath.concat(["length"]),
        value: base_.length,
      })
    }
  }

  function generatePatchesFromAssigned(
    state: MapState | ProxyObject,
    basePath: PatchPath,
    patches: Patch[],
    inversePatches: Patch[]
  ) {
    const { base_, copy_ } = state
    each(state.assigned_!, (key, assignedValue) => {
      const origValue = get(base_, key)
      const value = get(copy_!, key)
      const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD
      if (origValue === value && op === REPLACE) return
      const path = basePath.concat(key as any)
      patches.push(op === REMOVE ? { op, path } : { op, path, value })
      inversePatches.push(
        op === ADD
          ? { op: REMOVE, path }
          : op === REMOVE
          ? { op: ADD, path, value: clonePatchValueIfNeeded(origValue) }
          : { op: REPLACE, path, value: clonePatchValueIfNeeded(origValue) }
      )
    })
  }

  function generateSetPatches(
    state: SetState,
    basePath: PatchPath,
    patches: Patch[],
    inversePatches: Patch[]
  ) {
    let { base_, copy_ } = state

    let i = 0
    base_.forEach((value: any) => {
      if (!copy_!.has(value)) {
        const path = basePath.concat([i])
        patches.push({
          op: REMOVE,
          path,
          value,
        })
        inversePatches.unshift({
          op: ADD,
          path,
          value,
        })
      }
      i++
    })
    i = 0
    copy_!.forEach((value: any) => {
      if (!base_.has(value)) {
        const path = basePath.concat([i])
        patches.push({
          op: ADD,
          path,
          value,
        })
        inversePatches.unshift({
          op: REMOVE,
          path,
          value,
        })
      }
      i++
    })
  }

  function generateReplacementPatches_(
    baseValue: any,
    replacement: any,
    patches: Patch[],
    inversePatches: Patch[]
  ): void {
    patches.push({
      op: REPLACE,
      path: [],
      value: replacement === NOTHING ? undefined : replacement,
    })
    inversePatches.push({
      op: REPLACE,
      path: [],
      value: baseValue,
    })
  }

  function applyPatches_<T>(draft: T, patches: Patch[]): T {
    patches.forEach(patch => {
      const { path, op } = patch

      let base: any = draft
      for (let i = 0; i < path.length - 1; i++) {
        const parentType = getQType(base)
        const p = "" + path[i]
        if (
          (parentType === QType.Object || parentType === QType.Array) &&
          (p === "__proto__" || p === "constructor")
        )
          die(24)
        if (typeof base === "function" && p === "prototype") die(24)
        base = get(base, p)
        if (typeof base !== "object") die(15, path.join("/"))
      }

      const type = getQType(base)
      const value = deepClonePatchValue(patch.value)
      const key = path[path.length - 1]
      switch (op) {
        case REPLACE:
          switch (type) {
            case QType.Map:
              return base.set(key, value)
            case QType.Set:
              die(16)
            default:
              return (base[key] = value)
          }
        case ADD:
          switch (type) {
            case QType.Array:
              return key === "-"
                ? base.push(value)
                : base.splice(key as any, 0, value)
            case QType.Map:
              return base.set(key, value)
            case QType.Set:
              return base.add(value)
            default:
              return (base[key] = value)
          }
        case REMOVE:
          switch (type) {
            case QType.Array:
              return base.splice(key as any, 1)
            case QType.Map:
              return base.delete(key)
            case QType.Set:
              return base.delete(patch.value)
            default:
              return delete base[key]
          }
        default:
          die(17, op)
      }
    })

    return draft
  }

  function deepClonePatchValue<T>(obj: T): T
  function deepClonePatchValue(obj: any) {
    if (!isDraftable(obj)) return obj
    if (Array.isArray(obj)) return obj.map(deepClonePatchValue)
    if (isMap(obj))
      return new Map(
        Array.from(obj.entries()).map(([k, v]) => [k, deepClonePatchValue(v)])
      )
    if (isSet(obj)) return new Set(Array.from(obj).map(deepClonePatchValue))
    const cloned = Object.create(Object.getPrototypeOf(obj))
    for (const key in obj) cloned[key] = deepClonePatchValue(obj[key])
    if (has(obj, immerable)) cloned[immerable] = obj[immerable]
    return cloned
  }

  function clonePatchValueIfNeeded<T>(obj: T): T {
    if (isDraft(obj)) {
      return deepClonePatchValue(obj)
    } else return obj
  }

  loadPlugin("Patches", {
    applyPatches_,
    generatePatches_,
    generateReplacementPatches_,
  })
}

export function enableAllPlugins() {
  enableMapSet()
  enablePatches()
}
