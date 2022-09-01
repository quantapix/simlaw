import {
  AnyMap,
  AnySet,
  DRAFT_STATE,
  DRAFTABLE,
  MapState,
  NOTHING,
  Patch,
  PatchPath,
  ProxyArray,
  ProxyObject,
  ProxyType,
  QType,
  SetState,
  State,
} from "./types.js"
import {
  die,
  each,
  get,
  getType,
  has,
  isDraft,
  isDraftable,
  isMap,
  isSet,
  latest,
  loadPlugin,
} from "./utils.js"
import { getCurrentScope, markChanged, createProxy } from "./main.js"

export function enableMapSet() {
  let extendStatics = function (d: any, b: any): any {
    extendStatics =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (d, b) {
          d.__proto__ = b
        }) ||
      function (d, b) {
        for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
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
    p.has = function (k: any): boolean {
      return latest(this[DRAFT_STATE]).has(k)
    }
    p.set = function (k: any, v: any) {
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (!latest(s).has(k) || latest(s).get(k) !== v) {
        prepareMapCopy(s)
        markChanged(s)
        s.assigned_!.set(k, true)
        s.copy_!.set(k, v)
        s.assigned_!.set(k, true)
      }
      return this
    }
    p.delete = function (k: any): boolean {
      if (!this.has(k)) return false
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareMapCopy(s)
      markChanged(s)
      if (s.base_.has(k)) s.assigned_!.set(k, false)
      else s.assigned_!.delete(k)
      s.copy_!.delete(k)
      return true
    }
    p.clear = function () {
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (latest(s).size) {
        prepareMapCopy(s)
        markChanged(s)
        s.assigned_ = new Map()
        each(s.base_, k => {
          s.assigned_!.set(k, false)
        })
        s.copy_!.clear()
      }
    }
    p.forEach = function (
      cb: (x: any, k: any, self: any) => void,
      thisArg?: any
    ) {
      const s: MapState = this[DRAFT_STATE]
      latest(s).forEach((_x: any, k: any, _map: any) => {
        cb.call(thisArg, this.get(k), k, this)
      })
    }
    p.get = function (k: any): any {
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      const v = latest(s).get(k)
      if (s.finalized_ || !isDraftable(v)) return v
      if (v !== s.base_.get(k)) return v
      const y = createProxy(v, s)
      prepareMapCopy(s)
      s.copy_!.set(k, y)
      return y
    }
    p.keys = function (): IterableIterator<any> {
      return latest(this[DRAFT_STATE]).keys()
    }
    p.values = function (): IterableIterator<any> {
      const ks = this.keys()
      return {
        [Symbol.iterator]: () => this.values(),
        next: () => {
          const k = ks.next()
          if (k.done) return k
          const value = this.get(k.value)
          return { done: false, value }
        },
      } as any
    }
    p.entries = function (): IterableIterator<[any, any]> {
      const ks = this.keys()
      return {
        [Symbol.iterator]: () => this.entries(),
        next: () => {
          const k = ks.next()
          if (k.done) return k
          const value = this.get(k.value)
          return {
            done: false,
            value: [k.value, value],
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

  function prepareMapCopy(x: MapState) {
    if (!x.copy_) {
      x.assigned_ = new Map()
      x.copy_ = new Map(x.base_)
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
    p.has = function (x: any): boolean {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (!s.copy_) return s.base_.has(x)
      if (s.copy_.has(x)) return true
      if (s.drafts_.has(x) && s.copy_.has(s.drafts_.get(x))) return true
      return false
    }
    p.add = function (x: any): any {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (!this.has(x)) {
        prepareSetCopy(s)
        markChanged(s)
        s.copy_!.add(x)
      }
      return this
    }
    p.delete = function (x: any): any {
      if (!this.has(x)) return false
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      markChanged(s)
      return (
        s.copy_!.delete(x) ||
        (s.drafts_.has(x) ? s.copy_!.delete(s.drafts_.get(x)) : false)
      )
    }
    p.clear = function () {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (latest(s).size) {
        prepareSetCopy(s)
        markChanged(s)
        s.copy_!.clear()
      }
    }
    p.values = function (): IterableIterator<any> {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      return s.copy_!.values()
    }
    p.entries = function entries(): IterableIterator<[any, any]> {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      return s.copy_!.entries()
    }
    p.keys = function (): IterableIterator<any> {
      return this.values()
    }
    p[Symbol.iterator] = function () {
      return this.values()
    }
    p.forEach = function forEach(cb: any, thisArg?: any) {
      const vs = this.values()
      let y = vs.next()
      while (!y.done) {
        cb.call(thisArg, y.value, y.value, this)
        y = vs.next()
      }
    }
    return DraftSet
  })(Set)

  function proxySet_<T extends AnySet>(target: T, parent?: State): T {
    return new DraftSet(target, parent)
  }

  function prepareSetCopy(x: SetState) {
    if (!x.copy_) {
      x.copy_ = new Set()
      x.base_.forEach(value => {
        if (isDraftable(value)) {
          const draft = createProxy(value, x)
          x.drafts_.set(value, draft)
          x.copy_!.add(draft)
        } else x.copy_!.add(value)
      })
    }
  }

  function assertUnrevoked(x: any) {
    if (x.revoked_) die(3, JSON.stringify(latest(x)))
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
      case ProxyType.Obj:
      case ProxyType.Map:
        return generatePatchesFromAssigned(
          state,
          basePath,
          patches,
          inversePatches
        )
      case ProxyType.Array:
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

  function applyPatches_<T>(x: T, ps: Patch[]): T {
    ps.forEach(p => {
      const { path, op } = p
      let y: any = x
      for (let i = 0; i < path.length - 1; i++) {
        const t = getType(y)
        const n = "" + path[i]
        if (
          (t === QType.Obj || t === QType.Array) &&
          (n === "__proto__" || n === "constructor")
        )
          die(24)
        if (typeof y === "function" && n === "prototype") die(24)
        y = get(y, n)
        if (typeof y !== "object") die(15, path.join("/"))
      }
      const t = getType(y)
      const v = deepClonePatchValue(p.value)
      const k = path[path.length - 1]!
      switch (op) {
        case REPLACE:
          switch (t) {
            case QType.Map:
              return y.set(k, v)
            case QType.Set:
              die(16)
            // eslint-disable-next-line no-fallthrough
            default:
              return (y[k] = v)
          }
        case ADD:
          switch (t) {
            case QType.Array:
              return k === "-" ? y.push(v) : y.splice(k as any, 0, v)
            case QType.Map:
              return y.set(k, v)
            case QType.Set:
              return y.add(v)
            default:
              return (y[k] = v)
          }
        case REMOVE:
          switch (t) {
            case QType.Array:
              return y.splice(k as any, 1)
            case QType.Map:
              return y.delete(k)
            case QType.Set:
              return y.delete(p.value)
            default:
              return delete y[k]
          }
        default:
          die(17, op)
      }
    })
    return x
  }

  function deepClonePatchValue<T>(x: T): T
  function deepClonePatchValue(x: any) {
    if (!isDraftable(x)) return x
    if (Array.isArray(x)) return x.map(deepClonePatchValue)
    if (isMap(x))
      return new Map(
        Array.from(x.entries()).map(([k, v]) => [k, deepClonePatchValue(v)])
      )
    if (isSet(x)) return new Set(Array.from(x).map(deepClonePatchValue))
    const y = Object.create(Object.getPrototypeOf(x))
    for (const k in x) y[k] = deepClonePatchValue(x[k])
    if (has(x, DRAFTABLE)) y[DRAFTABLE] = x[DRAFTABLE]
    return y
  }

  function clonePatchValueIfNeeded<T>(x: T): T {
    if (isDraft(x)) {
      return deepClonePatchValue(x)
    } else return x
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
