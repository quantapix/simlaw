import { getCurrentScope, markChanged, createProxy } from "./main.js"
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
        for (const p in b)
          if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]
      }
    return statics(d, b)
  }

  function __extends(draft: any, base: any): any {
    statics(draft, base)
    function __(this: any): any {
      this.constructor = draft
    }
    draft.prototype = ((__.prototype = base.prototype), __())
  }

  const DraftMap = (function (_super) {
    __extends(DraftMap, _super)
    function DraftMap(this: any, base: qt.AnyMap, parent?: qt.State) {
      this[qt.DRAFT_STATE] = {
        assigned: undefined,
        base,
        copy: undefined,
        draft: this,
        finalized: false,
        manual: false,
        modified: false,
        parent,
        revoked: false,
        scope: parent ? parent.scope : getCurrentScope()!,
        type: qt.ProxyType.Map,
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
        prepMapCopy(s)
        markChanged(s)
        s.assigned!.set(k, true)
        s.copy!.set(k, v)
        s.assigned!.set(k, true)
      }
      return this
    }
    p.delete = function (k: any) {
      if (!this.has(k)) return false
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepMapCopy(s)
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
        prepMapCopy(s)
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
    p.get = function (k: any) {
      const s: qt.MapState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      const v = qu.latest(s).get(k)
      if (s.finalized || !qu.isDraftable(v)) return v
      if (v !== s.base.get(k)) return v
      const y = createProxy(v, s)
      prepMapCopy(s)
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
          return { done: false, value: [k.value, value] }
        },
      } as any
    }
    p[Symbol.iterator] = function () {
      return this.entries()
    }
    return DraftMap
  })(Map)

  function proxyMap<T extends qt.AnyMap>(x: T, parent?: qt.State): T {
    return DraftMap(x, parent)
  }

  function prepMapCopy(x: qt.MapState) {
    if (!x.copy) {
      x.assigned = new Map()
      x.copy = new Map(x.base)
    }
  }

  const DraftSet = (function (_super) {
    __extends(DraftSet, _super)
    function DraftSet(this: any, base: qt.AnySet, parent?: qt.State) {
      this[qt.DRAFT_STATE] = {
        base,
        copy: undefined,
        draft: this,
        drafts: new Map(),
        finalized: false,
        manual: false,
        modified: false,
        parent,
        revoked: false,
        scope: parent ? parent.scope : getCurrentScope()!,
        type: qt.ProxyType.Set,
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
    p.add = function (x: any) {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      if (!this.has(x)) {
        prepSetCopy(s)
        markChanged(s)
        s.copy!.add(x)
      }
      return this
    }
    p.delete = function (x: any) {
      if (!this.has(x)) return false
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepSetCopy(s)
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
        prepSetCopy(s)
        markChanged(s)
        s.copy!.clear()
      }
    }
    p.values = function (): IterableIterator<any> {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepSetCopy(s)
      return s.copy!.values()
    }
    p.entries = function entries(): IterableIterator<[any, any]> {
      const s: qt.SetState = this[qt.DRAFT_STATE]
      assertUnrevoked(s)
      prepSetCopy(s)
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

  function proxySet<T extends qt.AnySet>(x: T, parent?: qt.State): T {
    return DraftSet(x, parent)
  }

  function prepSetCopy(x: qt.SetState) {
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

  qu.loadPlugin("MapSet", { proxyMap, proxySet })
}

export function enablePatches() {
  const ADD = "add"
  const REMOVE = "remove"
  const REPLACE = "replace"

  function generatePatches(
    s: qt.State,
    path: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ): void {
    switch (s.type) {
      case qt.ProxyType.Obj:
      case qt.ProxyType.Map:
        return fromAssigned(s, path, ps, inverses)
      case qt.ProxyType.Array:
        return arrayPatches(s, path, ps, inverses)
      case qt.ProxyType.Set:
        return setPatches(s as any as qt.SetState, path, ps, inverses)
    }
  }

  function fromAssigned(
    s: qt.MapState | qt.ProxyObj,
    basePath: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ) {
    const { base, copy } = s
    qu.each(s.assigned!, (k, x) => {
      const v0 = qu.get(base, k)
      const v = qu.get(copy, k)
      const op = !x ? REMOVE : qu.has(base, k) ? REPLACE : ADD
      if (v0 === v && op === REPLACE) return
      const path = basePath.concat(k as any)
      ps.push(op === REMOVE ? { op, path } : { op, path, value: v })
      inverses.push(
        op === ADD
          ? { op: REMOVE, path }
          : op === REMOVE
          ? { op: ADD, path, value: clone(v0) }
          : { op: REPLACE, path, value: clone(v0) }
      )
    })
  }

  function arrayPatches(
    s: qt.ProxyArray,
    basePath: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ) {
    let base = s.base
    let copy = s.copy!
    if (copy.length < base.length) {
      ;[base, copy] = [copy, base]
      ;[ps, inverses] = [inverses, ps]
    }
    for (let i = 0; i < base.length; i++) {
      if (s.assigned[i] && copy[i] !== base[i]) {
        const path = basePath.concat([i])
        ps.push({ op: REPLACE, path, value: clone(copy[i]) })
        inverses.push({ op: REPLACE, path, value: clone(base[i]) })
      }
    }
    for (let i = base.length; i < copy.length; i++) {
      const path = basePath.concat([i])
      ps.push({ op: ADD, path, value: clone(copy[i]) })
    }
    if (base.length < copy.length) {
      const path = basePath.concat(["length"])
      inverses.push({ op: REPLACE, path, value: base.length })
    }
  }

  function setPatches(
    state: qt.SetState,
    basePath: qt.PatchPath,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ) {
    const { base, copy } = state
    let i = 0
    base.forEach((value: any) => {
      if (!copy!.has(value)) {
        const path = basePath.concat([i])
        ps.push({ op: REMOVE, path, value })
        inverses.unshift({ op: ADD, path, value })
      }
      i++
    })
    i = 0
    copy!.forEach((value: any) => {
      if (!base.has(value)) {
        const path = basePath.concat([i])
        ps.push({ op: ADD, path, value })
        inverses.unshift({ op: REMOVE, path, value })
      }
      i++
    })
  }

  function substitutePatches(
    base: any,
    sub: any,
    ps: qt.Patch[],
    inverses: qt.Patch[]
  ): void {
    const value = sub === qt.nothing ? undefined : sub
    ps.push({ op: REPLACE, path: [], value })
    inverses.push({ op: REPLACE, path: [], value: base })
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
      const v = deepClone(p.value)
      const k = path[path.length - 1]!
      switch (op) {
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
        case REPLACE:
          switch (t) {
            case qt.QType.Map:
              return y.set(k, v)
            case qt.QType.Set:
              qu.die(16)

            default:
              return (y[k] = v)
          }
        default:
          qu.die(17, op)
      }
    })
    return x
  }

  function clone<T>(x: T): T {
    if (qu.isDraft(x)) {
      return deepClone(x)
    } else return x
  }

  function deepClone<T>(x: T): T
  function deepClone(x: any) {
    if (!qu.isDraftable(x)) return x
    if (Array.isArray(x)) return x.map(deepClone)
    if (qu.isMap(x))
      return new Map(Array.from(x.entries()).map(([k, v]) => [k, deepClone(v)]))
    if (qu.isSet(x)) return new Set(Array.from(x).map(deepClone))
    const y = Object.create(Object.getPrototypeOf(x))
    for (const k in x) y[k] = deepClone(x[k])
    if (qu.has(x, qt.immerable)) y[qt.immerable] = x[qt.immerable]
    return y
  }

  qu.loadPlugin("Patches", {
    generatePatches,
    substitutePatches,
    applyPatches,
  })
}

export function enableAllPlugins() {
  enableMapSet()
  enablePatches()
}
