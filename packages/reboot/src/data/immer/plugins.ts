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
  ProxyObj,
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
import { getCurrentScope, markChanged, createProxy } from "./immer.js"

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
        type: ProxyType.Map,
        parent: parent,
        scope: parent ? parent.scope : getCurrentScope()!,
        modified: false,
        finalized: false,
        copy: undefined,
        assigned: undefined,
        base: target,
        draft: this as any,
        manual: false,
        revoked: false,
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
        s.assigned!.set(k, true)
        s.copy!.set(k, v)
        s.assigned!.set(k, true)
      }
      return this
    }
    p.delete = function (k: any): boolean {
      if (!this.has(k)) return false
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareMapCopy(s)
      markChanged(s)
      if (s.base.has(k)) s.assigned!.set(k, false)
      else s.assigned!.delete(k)
      s.copy!.delete(k)
      return true
    }
    p.clear = function () {
      const s: MapState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (latest(s).size) {
        prepareMapCopy(s)
        markChanged(s)
        s.assigned = new Map()
        each(s.base, k => {
          s.assigned!.set(k, false)
        })
        s.copy!.clear()
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
      if (s.finalized || !isDraftable(v)) return v
      if (v !== s.base.get(k)) return v
      const y = createProxy(v, s)
      prepareMapCopy(s)
      s.copy!.set(k, y)
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
    if (!x.copy) {
      x.assigned = new Map()
      x.copy = new Map(x.base)
    }
  }

  const DraftSet = (function (_super) {
    __extends(DraftSet, _super)
    function DraftSet(this: any, target: AnySet, parent?: State) {
      this[DRAFT_STATE] = {
        type: ProxyType.Set,
        parent: parent,
        scope: parent ? parent.scope : getCurrentScope()!,
        modified: false,
        finalized: false,
        copy: undefined,
        base: target,
        draft: this,
        drafts: new Map(),
        revoked: false,
        manual: false,
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
      if (!s.copy) return s.base.has(x)
      if (s.copy.has(x)) return true
      if (s.drafts.has(x) && s.copy.has(s.drafts.get(x))) return true
      return false
    }
    p.add = function (x: any): any {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (!this.has(x)) {
        prepareSetCopy(s)
        markChanged(s)
        s.copy!.add(x)
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
        s.copy!.delete(x) ||
        (s.drafts.has(x) ? s.copy!.delete(s.drafts.get(x)) : false)
      )
    }
    p.clear = function () {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      if (latest(s).size) {
        prepareSetCopy(s)
        markChanged(s)
        s.copy!.clear()
      }
    }
    p.values = function (): IterableIterator<any> {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      return s.copy!.values()
    }
    p.entries = function entries(): IterableIterator<[any, any]> {
      const s: SetState = this[DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      return s.copy!.entries()
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
    if (!x.copy) {
      x.copy = new Set()
      x.base.forEach(value => {
        if (isDraftable(value)) {
          const draft = createProxy(value, x)
          x.drafts.set(value, draft)
          x.copy!.add(draft)
        } else x.copy!.add(value)
      })
    }
  }

  function assertUnrevoked(x: any) {
    if (x.revoked_) die(3, JSON.stringify(latest(x)))
  }

  loadPlugin("MapSet", { proxyMap: proxyMap_, proxySet: proxySet_ })
}

export function enablePatches() {
  const REPLACE = "replace"
  const ADD = "add"
  const REMOVE = "remove"

  function generatePatches_(
    state: State,
    basePath: PatchPath,
    patches: Patch[],
    inverses: Patch[]
  ): void {
    switch (state.type) {
      case ProxyType.Obj:
      case ProxyType.Map:
        return generatePatchesFromAssigned(state, basePath, patches, inverses)
      case ProxyType.Array:
        return generateArrayPatches(state, basePath, patches, inverses)
      case ProxyType.Set:
        return generateSetPatches(
          state as any as SetState,
          basePath,
          patches,
          inverses
        )
    }
  }

  function generateArrayPatches(
    state: ProxyArray,
    basePath: PatchPath,
    patches: Patch[],
    inverses: Patch[]
  ) {
    let { base: base_, assigned: assigned_ } = state
    let copy_ = state.copy!
    if (copy_.length < base_.length) {
      ;[base_, copy_] = [copy_, base_]
      ;[patches, inverses] = [inverses, patches]
    }
    for (let i = 0; i < base_.length; i++) {
      if (assigned_[i] && copy_[i] !== base_[i]) {
        const path = basePath.concat([i])
        patches.push({
          op: REPLACE,
          path,
          value: clonePatchValueIfNeeded(copy_[i]),
        })
        inverses.push({
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
      inverses.push({
        op: REPLACE,
        path: basePath.concat(["length"]),
        value: base_.length,
      })
    }
  }

  function generatePatchesFromAssigned(
    state: MapState | ProxyObj,
    basePath: PatchPath,
    patches: Patch[],
    inverses: Patch[]
  ) {
    const { base: base_, copy: copy_ } = state
    each(state.assigned!, (key, assignedValue) => {
      const origValue = get(base_, key)
      const value = get(copy_!, key)
      const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD
      if (origValue === value && op === REPLACE) return
      const path = basePath.concat(key as any)
      patches.push(op === REMOVE ? { op, path } : { op, path, value })
      inverses.push(
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
    inverses: Patch[]
  ) {
    let { base: base_, copy: copy_ } = state
    let i = 0
    base_.forEach((value: any) => {
      if (!copy_!.has(value)) {
        const path = basePath.concat([i])
        patches.push({
          op: REMOVE,
          path,
          value,
        })
        inverses.unshift({
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
        inverses.unshift({
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
    inverses: Patch[]
  ): void {
    patches.push({
      op: REPLACE,
      path: [],
      value: replacement === NOTHING ? undefined : replacement,
    })
    inverses.push({
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
    applyPatches: applyPatches_,
    generatePatches: generatePatches_,
    replacementPatches: generateReplacementPatches_,
  })
}

export function enableAllPlugins() {
  enableMapSet()
  enablePatches()
}
