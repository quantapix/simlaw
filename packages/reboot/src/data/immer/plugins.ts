import {
  createProxy,
  die,
  DRAFT_STATE,
  each,
  get,
  getArchtype,
  getCurrentScope,
  getOwnPropertyDescriptors,
  has,
  immerable,
  is,
  isDraft,
  isDraftable,
  isMap,
  isSet,
  iteratorSymbol,
  latest,
  loadPlugin,
  markChanged,
  NOTHING,
  objectTraps,
  ownKeys,
} from "./utils.js"
import {
  AnyMap,
  AnySet,
  Archtype,
  Drafted,
  ES5ArrayState,
  ES5ObjectState,
  MapState,
  Patch,
  PatchPath,
  ProxyArray,
  ProxyObject,
  ProxyType,
  Scope,
  SetState,
  State,
} from "./types.js"

type ES5State = ES5ArrayState | ES5ObjectState

export function enableES5() {
  function willFinalizeES5_(scope: Scope, result: any, isReplaced: boolean) {
    if (!isReplaced) {
      if (scope.patches_) {
        markChangesRecursively(scope.drafts_![0])
      }
      markChangesSweep(scope.drafts_)
    } else if (
      isDraft(result) &&
      (result[DRAFT_STATE] as ES5State).scope_ === scope
    ) {
      markChangesSweep(scope.drafts_)
    }
  }

  function createES5Draft(isArray: boolean, base: any) {
    if (isArray) {
      const draft = new Array(base.length)
      for (let i = 0; i < base.length; i++)
        Object.defineProperty(draft, "" + i, proxyProperty(i, true))
      return draft
    } else {
      const descriptors = getOwnPropertyDescriptors(base)
      delete descriptors[DRAFT_STATE as any]
      const keys = ownKeys(descriptors)
      for (let i = 0; i < keys.length; i++) {
        const key: any = keys[i]
        descriptors[key] = proxyProperty(
          key,
          isArray || !!descriptors[key].enumerable
        )
      }
      return Object.create(Object.getPrototypeOf(base), descriptors)
    }
  }

  function createES5Proxy_<T>(
    base: T,
    parent?: State
  ): Drafted<T, ES5ObjectState | ES5ArrayState> {
    const isArray = Array.isArray(base)
    const draft = createES5Draft(isArray, base)

    const state: ES5ObjectState | ES5ArrayState = {
      type_: isArray ? ProxyType.ES5Array : (ProxyType.ES5Object as any),
      scope_: parent ? parent.scope_ : getCurrentScope(),
      modified_: false,
      finalized_: false,
      assigned_: {},
      parent_: parent,
      base_: base,
      draft_: draft,
      copy_: null,
      revoked_: false,
      isManual_: false,
    }

    Object.defineProperty(draft, DRAFT_STATE, {
      value: state,
      writable: true,
    })
    return draft
  }

  const descriptors: { [prop: string]: PropertyDescriptor } = {}

  function proxyProperty(
    prop: string | number,
    enumerable: boolean
  ): PropertyDescriptor {
    let desc = descriptors[prop]
    if (desc) {
      desc.enumerable = enumerable
    } else {
      descriptors[prop] = desc = {
        configurable: true,
        enumerable,
        get(this: any) {
          const state = this[DRAFT_STATE]
          if (__DEV__) assertUnrevoked(state)
          return objectTraps.get(state, prop)
        },
        set(this: any, value) {
          const state = this[DRAFT_STATE]
          if (__DEV__) assertUnrevoked(state)
          objectTraps.set(state, prop, value)
        },
      }
    }
    return desc
  }

  function markChangesSweep(drafts: Drafted<any, State>[]) {
    for (let i = drafts.length - 1; i >= 0; i--) {
      const state: ES5State = drafts[i][DRAFT_STATE]
      if (!state.modified_) {
        switch (state.type_) {
          case ProxyType.ES5Array:
            if (hasArrayChanges(state)) markChanged(state)
            break
          case ProxyType.ES5Object:
            if (hasObjectChanges(state)) markChanged(state)
            break
        }
      }
    }
  }

  function markChangesRecursively(object: any) {
    if (!object || typeof object !== "object") return
    const state: ES5State | undefined = object[DRAFT_STATE]
    if (!state) return
    const { base_, draft_, assigned_, type_ } = state
    if (type_ === ProxyType.ES5Object) {
      each(draft_, key => {
        if ((key as any) === DRAFT_STATE) return
        if ((base_ as any)[key] === undefined && !has(base_, key)) {
          assigned_[key] = true
          markChanged(state)
        } else if (!assigned_[key]) {
          markChangesRecursively(draft_[key])
        }
      })
      each(base_, key => {
        if (draft_[key] === undefined && !has(draft_, key)) {
          assigned_[key] = false
          markChanged(state)
        }
      })
    } else if (type_ === ProxyType.ES5Array) {
      if (hasArrayChanges(state as ES5ArrayState)) {
        markChanged(state)
        assigned_.length = true
      }

      if (draft_.length < base_.length) {
        for (let i = draft_.length; i < base_.length; i++) assigned_[i] = false
      } else {
        for (let i = base_.length; i < draft_.length; i++) assigned_[i] = true
      }
      const min = Math.min(draft_.length, base_.length)
      for (let i = 0; i < min; i++) {
        if (!draft_.hasOwnProperty(i)) {
          assigned_[i] = true
        }
        if (assigned_[i] === undefined) markChangesRecursively(draft_[i])
      }
    }
  }

  function hasObjectChanges(state: ES5ObjectState) {
    const { base_, draft_ } = state
    const keys = ownKeys(draft_)
    for (let i = keys.length - 1; i >= 0; i--) {
      const key: any = keys[i]
      if (key === DRAFT_STATE) continue
      const baseValue = base_[key]
      if (baseValue === undefined && !has(base_, key)) {
        return true
      } else {
        const value = draft_[key]
        const state: State = value && value[DRAFT_STATE]
        if (state ? state.base_ !== baseValue : !is(value, baseValue)) {
          return true
        }
      }
    }
    const baseIsDraft = !!base_[DRAFT_STATE as any]
    return keys.length !== ownKeys(base_).length + (baseIsDraft ? 0 : 1)
  }

  function hasArrayChanges(state: ES5ArrayState) {
    const { draft_ } = state
    if (draft_.length !== state.base_.length) return true
    const descriptor = Object.getOwnPropertyDescriptor(
      draft_,
      draft_.length - 1
    )
    if (descriptor && !descriptor.get) return true
    for (let i = 0; i < draft_.length; i++) {
      if (!draft_.hasOwnProperty(i)) return true
    }
    return false
  }

  function hasChanges_(state: ES5State) {
    return state.type_ === ProxyType.ES5Object
      ? hasObjectChanges(state)
      : hasArrayChanges(state)
  }

  function assertUnrevoked(state: any) {
    if (state.revoked_) die(3, JSON.stringify(latest(state)))
  }

  loadPlugin("ES5", {
    createES5Proxy_,
    willFinalizeES5_,
    hasChanges_,
  })
}

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
      const draft = createProxy(state.scope_.immer_, value, state)
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
        [iteratorSymbol]: () => this.values(),
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
        [iteratorSymbol]: () => this.entries(),
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

    p[iteratorSymbol] = function () {
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

    p[iteratorSymbol] = function () {
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
          const draft = createProxy(state.scope_.immer_, value, state)
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
      case ProxyType.ES5Object:
      case ProxyType.Map:
        return generatePatchesFromAssigned(
          state,
          basePath,
          patches,
          inversePatches
        )
      case ProxyType.ES5Array:
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
    state: ES5ArrayState | ProxyArray,
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
    state: MapState | ES5ObjectState | ProxyObject,
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
        const parentType = getArchtype(base)
        const p = "" + path[i]
        if (
          (parentType === Archtype.Object || parentType === Archtype.Array) &&
          (p === "__proto__" || p === "constructor")
        )
          die(24)
        if (typeof base === "function" && p === "prototype") die(24)
        base = get(base, p)
        if (typeof base !== "object") die(15, path.join("/"))
      }

      const type = getArchtype(base)
      const value = deepClonePatchValue(patch.value)
      const key = path[path.length - 1]
      switch (op) {
        case REPLACE:
          switch (type) {
            case Archtype.Map:
              return base.set(key, value)
            case Archtype.Set:
              die(16)
            default:
              return (base[key] = value)
          }
        case ADD:
          switch (type) {
            case Archtype.Array:
              return key === "-"
                ? base.push(value)
                : base.splice(key as any, 0, value)
            case Archtype.Map:
              return base.set(key, value)
            case Archtype.Set:
              return base.add(value)
            default:
              return (base[key] = value)
          }
        case REMOVE:
          switch (type) {
            case Archtype.Array:
              return base.splice(key as any, 1)
            case Archtype.Map:
              return base.delete(key)
            case Archtype.Set:
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
  enableES5()
  enableMapSet()
  enablePatches()
}
