import { Collection, seqKeyedFrom } from "./main.js"
import { List } from "./list.js"
import * as qf from "./functions.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

function throwOnInvalidDefaultValues(x) {
  if (qu.isRecord(x)) {
    throw new Error("Can not call `Record` with an immutable Record as default values. Use a plain javascript object instead.")
  }
  if (qu.isImmutable(x)) {
    throw new Error("Can not call `Record` with an immutable Collection as default values. Use a plain javascript object instead.")
  }
  if (x === null || typeof x !== "object") {
    throw new Error("Can not call `Record` with a non-object as default values. Use a plain javascript object instead.")
  }
}

export class Record<T extends object> implements qt.Record<T> {
  static isRecord = qu.isRecord
  static getDescriptiveName = recordName

  static create<T extends object>(vs0: T, name?: string): Record.Factory<T> {
    let hasInitialized
    throwOnInvalidDefaultValues(vs0)
    const y = function Record(values) {
      if (values instanceof y) return values
      if (!(this instanceof y)) return new y(values)
      if (!hasInitialized) {
        hasInitialized = true
        const keys = Object.keys(vs0)
        const indices = (RecordTypePrototype._indices = {})
        RecordTypePrototype._keys = keys
        RecordTypePrototype._defaultValues = vs0
        for (let i = 0; i < keys.length; i++) {
          const propName = keys[i]
          indices[propName] = i
          if (RecordTypePrototype[propName]) {
            typeof console === "object" && console.warn && console.warn("Cannot define " + recordName(this) + ' with property "' + propName + '" since that property name is part of the Record API.')
          } else setProp(RecordTypePrototype, propName)
        }
      }
      this.__ownerID = undefined
      this._values = List().withMutations(l => {
        l.setSize(this._keys.length)
        new Collection.Keyed(values).forEach((v, k) => {
          l.set(this._indices[k], v === this._defaultValues[k] ? undefined : v)
        })
      })
      return this
    }
    const RecordTypePrototype = (y.prototype = Object.create(RecordPrototype))
    RecordTypePrototype.constructor = y
    if (name) y.displayName = name
    return y
  }
  [qu.IS_RECORD_SYMBOL] = true;
  [qu.DELETE] = this.remove
  toString() {
    let str = recordName(this) + " { "
    const keys = this._keys
    let k
    for (let i = 0, l = keys.length; i !== l; i++) {
      k = keys[i]
      str += (i ? ", " : "") + k + ": " + qu.quoteString(this.get(k))
    }
    return str + " }"
  }
  equals(other) {
    return this === other || (qu.isRecord(other) && recordSeq(this).equals(recordSeq(other)))
  }
  hashCode() {
    return recordSeq(this).hashCode()
  }
  has(k) {
    return this._indices.hasOwnProperty(k)
  }
  get(k, notSetValue) {
    if (!this.has(k)) return notSetValue
    const index = this._indices[k]
    const value = this._values.get(index)
    return value === undefined ? this._defaultValues[k] : value
  }
  set(k, v) {
    if (this.has(k)) {
      const newValues = this._values.set(this._indices[k], v === this._defaultValues[k] ? undefined : v)
      if (newValues !== this._values && !this.__ownerID) return makeRecord(this, newValues)
    }
    return this
  }
  remove(k) {
    return this.set(k)
  }
  clear() {
    const newValues = this._values.clear().setSize(this._keys.length)
    return this.__ownerID ? this : makeRecord(this, newValues)
  }
  wasAltered() {
    return this._values.wasAltered()
  }
  toSeq() {
    return recordSeq(this)
  }
  toJS() {
    return qu.toJS(this)
  }
  entries() {
    return this.__iterator(qu.ITERATE_ENTRIES)
  }
  __iterator(type, reverse) {
    return recordSeq(this).__iterator(type, reverse)
  }
  __iterate(fn, reverse) {
    return recordSeq(this).__iterate(fn, reverse)
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newValues = this._values.__ensureOwner(ownerID)
    if (!ownerID) {
      this.__ownerID = ownerID
      this._values = newValues
      return this
    }
    return makeRecord(this, newValues, ownerID)
  }
  deleteIn = qf.deleteIn
  removeIn = qf.deleteIn
  getIn = qf.getIn
  hasIn = Collection.prototype.hasIn
  merge = qf.merge
  mergeWith = qf.mergeWith
  mergeIn = qf.mergeIn
  mergeDeep = qf.mergeDeep
  mergeDeepWith = qf.mergeDeepWith
  mergeDeepIn = qf.mergeDeepIn
  setIn = qf.setIn
  update = qf.update
  updateIn = qf.updateIn
  withMutations = qf.withMutations
  asMutable = qf.asMutable
  asImmutable = qf.asImmutable;
  [Symbol.iterator] = this.entries
  toObject = Collection.prototype.toObject
  toJSON = Collection.prototype.toObject
  toSource = function () {
    return this.toString()
  }
  inspect = this.toSource
}

export namespace Record {
  namespace Factory {}
  function Factory<TProps extends object>(values?: Partial<TProps> | Iterable<[string, unknown]>): Record<TProps> & Readonly<TProps>
}

function makeRecord(likeRecord, values, ownerID) {
  const y = Object.create(Object.getPrototypeOf(likeRecord))
  y._values = values
  y.__ownerID = ownerID
  return y
}

function recordName(x) {
  return x.constructor.displayName || x.constructor.name || "Record"
}

function recordSeq(x) {
  return seqKeyedFrom(x._keys.map(k => [k, x.get(k)]))
}

function setProp(prototype, name) {
  try {
    Object.defineProperty(prototype, name, {
      get: function () {
        return this.get(name)
      },
      set: function (value) {
        qu.invariant(this.__ownerID, "Cannot set on an immutable record.")
        this.set(name, value)
      },
    })
  } catch (e) {}
}
