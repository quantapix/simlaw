import { emptyMap } from "./map.js"
import { IndexedCollection, KeyedCollection } from "./collection.js"
import * as qu from "./utils.js"
import { Seq } from "./seq.js"
import { set } from "./set.js"

export function get(x, k, v0) {
  return qu.isImmutable(x) ? x.get(k, v0) : !has(x, k) ? v0 : typeof x.get === "function" ? x.get(k) : x[k]
}

export function getIn(x, searchKeyPath, v0) {
  const keyPath = qu.coerceKeyPath(searchKeyPath)
  let i = 0
  while (i !== keyPath.length) {
    x = get(x, keyPath[i++], qu.NOT_SET)
    if (x === qu.NOT_SET) return v0
  }
  return x
}

export function has(x, k) {
  return qu.isImmutable(x) ? x.has(k) : qu.isDataStructure(x) && qu.hasOwnProperty.call(x, k)
}

export function hasIn(x, keyPath) {
  return getIn(x, keyPath, qu.NOT_SET) !== qu.NOT_SET
}

export function merge(x, ...xs) {
  return mergeWithSources(x, xs)
}

export function mergeWith(merger, x, ...xs) {
  return mergeWithSources(x, xs, merger)
}

export function mergeDeep(collection, ...sources) {
  return mergeDeepWithSources(collection, sources)
}

export function mergeDeepWith(merger, collection, ...sources) {
  return mergeDeepWithSources(collection, sources, merger)
}

export function mergeDeepWithSources(collection, sources, merger) {
  return mergeWithSources(collection, sources, deepMergerWith(merger))
}

export function mergeWithSources(x, xs, f) {
  if (!qu.isDataStructure(x)) {
    throw new TypeError("Cannot merge into non-data-structure value: " + x)
  }
  if (qu.isImmutable(x)) {
    return typeof f === "function" && x.mergeWith ? x.mergeWith(f, ...xs) : x.merge ? x.merge(...xs) : x.concat(...xs)
  }
  const isArray = Array.isArray(x)
  let y = x
  const Collection = isArray ? IndexedCollection : KeyedCollection
  const mergeItem = isArray
    ? v => {
        if (y === x) y = qu.shallowCopy(y)
        y.push(v)
      }
    : (v, k) => {
        const hasVal = qu.hasOwnProperty.call(y, k)
        const nextVal = hasVal && f ? f(y[k], v, k) : v
        if (!hasVal || nextVal !== y[k]) {
          if (y === x) y = qu.shallowCopy(y)
          y[k] = nextVal
        }
      }
  for (let i = 0; i < xs.length; i++) {
    Collection(xs[i]).forEach(mergeItem)
  }
  return y
}

function deepMergerWith(merger) {
  function deepMerger(oldValue, newValue, key) {
    return qu.isDataStructure(oldValue) && qu.isDataStructure(newValue) && areMergeable(oldValue, newValue)
      ? mergeWithSources(oldValue, [newValue], deepMerger)
      : merger
      ? merger(oldValue, newValue, key)
      : newValue
  }
  return deepMerger
}

function areMergeable(oldDataStructure, newDataStructure) {
  const oldSeq = Seq(oldDataStructure)
  const newSeq = Seq(newDataStructure)
  return qu.isIndexed(oldSeq) === qu.isIndexed(newSeq) && qu.isKeyed(oldSeq) === qu.isKeyed(newSeq)
}

export function remove(x, k) {
  if (!qu.isDataStructure(x)) {
    throw new TypeError("Cannot update non-data-structure value: " + x)
  }
  if (qu.isImmutable(x)) {
    if (!x.remove) {
      throw new TypeError("Cannot update immutable value without .remove() method: " + x)
    }
    return x.remove(k)
  }
  if (!qu.hasOwnProperty.call(x, k)) return x
  const y = qu.shallowCopy(x)
  if (Array.isArray(y)) y.splice(k, 1)
  else delete y[k]
  return y
}

export function removeIn(collection, keyPath) {
  return updateIn(collection, keyPath, () => qu.NOT_SET)
}

export function set(collection, key, value) {
  if (!qu.isDataStructure(collection)) {
    throw new TypeError("Cannot update non-data-structure value: " + collection)
  }
  if (qu.isImmutable(collection)) {
    if (!collection.set) {
      throw new TypeError("Cannot update immutable value without .set() method: " + collection)
    }
    return collection.set(key, value)
  }
  if (qu.hasOwnProperty.call(collection, key) && value === collection[key]) {
    return collection
  }
  const collectionCopy = qu.shallowCopy(collection)
  collectionCopy[key] = value
  return collectionCopy
}

export function setIn(x, keyPath, v) {
  return updateIn(x, keyPath, qu.NOT_SET, () => v)
}

export function update(x, k, v0, f) {
  return updateIn(x, [k], v0, f)
}

export function updateIn(x, keyPath, v0, f) {
  if (!f) {
    f = v0
    v0 = undefined
  }
  const y = updateInDeeply(qu.isImmutable(x), x, qu.coerceKeyPath(keyPath), 0, v0, f)
  return y === qu.NOT_SET ? v0 : y
}

function updateInDeeply(inImmutable, existing, keyPath, i, notSetValue, updater) {
  const wasNotSet = existing === qu.NOT_SET
  if (i === keyPath.length) {
    const existingValue = wasNotSet ? notSetValue : existing
    const newValue = updater(existingValue)
    return newValue === existingValue ? existing : newValue
  }
  if (!wasNotSet && !qu.isDataStructure(existing)) {
    throw new TypeError("Cannot update within non-data-structure value in path [" + keyPath.slice(0, i).map(qu.quoteString) + "]: " + existing)
  }
  const key = keyPath[i]
  const nextExisting = wasNotSet ? qu.NOT_SET : get(existing, key, qu.NOT_SET)
  const nextUpdated = updateInDeeply(nextExisting === qu.NOT_SET ? inImmutable : qu.isImmutable(nextExisting), nextExisting, keyPath, i + 1, notSetValue, updater)
  return nextUpdated === nextExisting ? existing : nextUpdated === qu.NOT_SET ? remove(existing, key) : set(wasNotSet ? (inImmutable ? emptyMap() : {}) : existing, key, nextUpdated)
}
