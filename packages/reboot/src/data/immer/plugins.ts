import { getCurrentScope, markChanged, createProxy } from "./immer.js"
import * as qt from "./types.js"
import * as qu from "./utils.js"

export function enableMapSet() {
  let statics = function (d: any, b: any): any {
    statics =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (d, b) {
          d.__proto__ = b
        }) ||
      function (d, b) {
        for (const p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
      }
    return statics(d, b)
  }

  function __extends(d: any, b: any): any {
    statics(d, b)
    function __(this: any): any {
      this.constructor = d
    }
    d.prototype = ((__.prototype = b.prototype), new __())
  }

  const DraftMap = (function (_super) {
    __extends(DraftMap, _super)
    function DraftMap(this: any, target: qt.AnyMap, parent?: qt.State): any {
      this[qt.DRAFT_STATE] = {
        type: qt.ProxyType.Map,
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
      } as qt.MapState
      return this
    }
    const p = DraftMap.prototype
    Object.defineProperty(p, "size", {
      get: function () {
        return qu.latest(this[qt.DRAFT_STATE]).size
      },
    })
    p.has = function (k: any): boolean {
      return qu.latest(this[qt.DRAFT_STATE]).has(k)
    }
    p.set = function (k: any, v: any) {
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      if (!qu.latest(s).has(k) || qu.latest(s).get(k) !== v) {
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
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepareMapCopy(s)
      markChanged(s)
      if (s.base.has(k)) s.assigned!.set(k, false)
      else s.assigned!.delete(k)
      s.copy!.delete(k)
      return true
    }
    p.clear = function () {
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      if (qu.latest(s).size) {
        prepareMapCopy(s)
        markChanged(s)
        s.assigned = new Map()
        qu.each(s.base, k => {
          s.assigned!.set(k, false)
        })
        s.copy!.clear()
      }
    }
    p.forEach = function (
      cb: (x: any, k: any, self: any) => void,
      thisArg?: any
    ) {
      const s: qt.MapState = this[qt.DRAFT_STATE]
      qu.latest(s).forEach((_x: any, k: any, _map: any) => {
        cb.call(thisArg, this.get(k), k, this)
      })
    }
    p.get = function (k: any): any {
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      const v = qu.latest(s).get(k)
      if (s.finalized || !qu.isDraftable(v)) return v
      if (v !== s.base.get(k)) return v
      const y = createProxy(v, s)
      prepareMapCopy(s)
      s.copy!.set(k, y)
      return y
    }
    p.keys = function (): IterableIterator<any> {
      return qu.latest(this[qt.DRAFT_STATE]).keys()
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

  function proxyMap_<T extends qt.AnyMap>(target: T, parent?: qt.State): T {
    return new DraftMap(target, parent)
  }

  function prepareMapCopy(x: qt.MapState) {
    if (!x.copy) {
      x.assigned = new Map()
      x.copy = new Map(x.base)
    }
  }

  const DraftSet = (function (_super) {
    __extends(DraftSet, _super)
    function DraftSet(this: any, target: qt.AnySet, parent?: qt.State) {
      this[qt.DRAFT_STATE] = {
        type: qt.ProxyType.Set,
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
      } as qt.SetState
      return this
    }
    const p = DraftSet.prototype
    Object.defineProperty(p, "size", {
      get: function () {
        return qu.latest(this[qt.DRAFT_STATE]).size
      },
    })
    p.has = function (x: any): boolean {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      if (!s.copy) return s.base.has(x)
      if (s.copy.has(x)) return true
      if (s.drafts.has(x) && s.copy.has(s.drafts.get(x))) return true
      return false
    }
    p.add = function (x: any): any {
      const s: qt.SetState = this[qt.DRAFT_STATE]
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
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      markChanged(s)
      return (
        s.copy!.delete(x) ||
        (s.drafts.has(x) ? s.copy!.delete(s.drafts.get(x)) : false)
      )
    }
    p.clear = function () {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      if (qu.latest(s).size) {
        prepareSetCopy(s)
        markChanged(s)
        s.copy!.clear()
      }
    }
    p.values = function (): IterableIterator<any> {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepareSetCopy(s)
      return s.copy!.values()
    }
    p.entries = function entries(): IterableIterator<[any, any]> {
      const s: qt.SetState = this[qt.DRAFT_STATE]
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

  function proxySet_<T extends qt.AnySet>(target: T, parent?: qt.State): T {
    return new DraftSet(target, parent)
  }

  function prepareSetCopy(x: qt.SetState) {
    if (!x.copy) {
      x.copy = new Set()
      x.base.forEach(value => {
        if (qu.isDraftable(value)) {
          const draft = createProxy(value, x)
          x.drafts.set(value, draft)
          x.copy!.add(draft)
        } else x.copy!.add(value)
      })
    }
  }

  function assertUnrevoked(x: any) {
    if (x.revoked_) qu.die(3, JSON.stringify(qu.latest(x)))
  }

  qu.loadPlugin("MapSet", { proxyMap: proxyMap_, proxySet: proxySet_ })
}

export function enablePatches() {
  const REPLACE = "replace"
  const ADD = "add"
  const REMOVE = "remove"

  function generatePatches(
    state: qt.State,
    basePath: qt.PatchPath,
    patches: qt.Patch[],
    inverses: qt.Patch[]
  ): void {
    switch (state.type) {
      case qt.ProxyType.Obj:
      case qt.ProxyType.Map:
        return generatePatchesFromAssigned(state, basePath, patches, inverses)
      case qt.ProxyType.Array:
        return generateArrayPatches(state, basePath, patches, inverses)
      case qt.ProxyType.Set:
        return generateSetPatches(
          state as any as qt.SetState,
          basePath,
          patches,
          inverses
        )
    }
  }

  function generateArrayPatches(
    state: qt.ProxyArray,
    basePath: qt.PatchPath,
    patches: qt.Patch[],
    inverses: qt.Patch[]
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
    state: qt.MapState | qt.ProxyObj,
    basePath: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ) {
    const { base: base_, copy: copy_ } = state
    qu.each(state.assigned!, (key, assignedValue) => {
      const origValue = qu.get(base_, key)
      const value = qu.get(copy_!, key)
      const op = !assignedValue ? REMOVE : qu.has(base_, key) ? REPLACE : ADD
      if (origValue === value && op === REPLACE) return
      const path = basePath.concat(key as any)
      ps.push(op === REMOVE ? { op, path } : { op, path, value })
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
    state: qt.SetState,
    basePath: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ) {
    let { base: base_, copy: copy_ } = state
    let i = 0
    base_.forEach((value: any) => {
      if (!copy_!.has(value)) {
        const path = basePath.concat([i])
        ps.push({
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
        ps.push({
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

  function replacementPatches(
    base: any,
    replacement: any,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ): void {
    ps.push({
      op: REPLACE,
      path: [],
      value: replacement === qt.NOTHING ? undefined : replacement,
    })
    inverses.push({
      op: REPLACE,
      path: [],
      value: base,
    })
  }

  function applyPatches<T>(x: T, ps: qt.Patch[]): T {
    ps.forEach(p => {
      const { path, op } = p
      let y: any = x
      for (let i = 0; i < path.length - 1; i++) {
        const t = qu.getType(y)
        const n = "" + path[i]
        if (
          (t === qt.QType.Obj || t === qt.QType.Array) &&
          (n === "__proto__" || n === "constructor")
        )
          qu.die(24)
        if (typeof y === "function" && n === "prototype") qu.die(24)
        y = qu.get(y, n)
        if (typeof y !== "object") qu.die(15, path.join("/"))
      }
      const t = qu.getType(y)
      const v = deepClonePatchValue(p.value)
      const k = path[path.length - 1]!
      switch (op) {
        case REPLACE:
          switch (t) {
            case qt.QType.Map:
              return y.set(k, v)
            case qt.QType.Set:
              qu.die(16)
            // eslint-disable-next-line no-fallthrough
            default:
              return (y[k] = v)
          }
        case ADD:
          switch (t) {
            case qt.QType.Array:
              return k === "-" ? y.push(v) : y.splice(k as any, 0, v)
            case qt.QType.Map:
              return y.set(k, v)
            case qt.QType.Set:
              return y.add(v)
            default:
              return (y[k] = v)
          }
        case REMOVE:
          switch (t) {
            case qt.QType.Array:
              return y.splice(k as any, 1)
            case qt.QType.Map:
              return y.delete(k)
            case qt.QType.Set:
              return y.delete(p.value)
            default:
              return delete y[k]
          }
        default:
          qu.die(17, op)
      }
    })
    return x
  }

  function deepClonePatchValue<T>(x: T): T
  function deepClonePatchValue(x: any) {
    if (!qu.isDraftable(x)) return x
    if (Array.isArray(x)) return x.map(deepClonePatchValue)
    if (qu.isMap(x))
      return new Map(
        Array.from(x.entries()).map(([k, v]) => [k, deepClonePatchValue(v)])
      )
    if (qu.isSet(x)) return new Set(Array.from(x).map(deepClonePatchValue))
    const y = Object.create(Object.getPrototypeOf(x))
    for (const k in x) y[k] = deepClonePatchValue(x[k])
    if (qu.has(x, qt.DRAFTABLE)) y[qt.DRAFTABLE] = x[qt.DRAFTABLE]
    return y
  }

  function clonePatchValueIfNeeded<T>(x: T): T {
    if (qu.isDraft(x)) {
      return deepClonePatchValue(x)
    } else return x
  }

  qu.loadPlugin("Patches", {
    applyPatches,
    generatePatches,
    replacementPatches,
  })
}

export function enableAllPlugins() {
  enableMapSet()
  enablePatches()
}
