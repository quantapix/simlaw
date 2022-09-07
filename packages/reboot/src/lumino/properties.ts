/* eslint-disable @typescript-eslint/no-namespace */
export class AttachedProperty<T, U> {
  constructor(options: AttachedProperty.IOptions<T, U>) {
    this.name = options.name
    this._create = options.create
    this._coerce = options.coerce || null
    this._compare = options.compare || null
    this._changed = options.changed || null
  }
  readonly name: string
  get(owner: T): U {
    let value: U
    let map = Private.ensureMap(owner)
    if (this._pid in map) {
      value = map[this._pid]
    } else {
      value = map[this._pid] = this._createValue(owner)
    }
    return value
  }
  set(owner: T, value: U): void {
    let oldValue: U
    let map = Private.ensureMap(owner)
    if (this._pid in map) {
      oldValue = map[this._pid]
    } else {
      oldValue = map[this._pid] = this._createValue(owner)
    }
    let newValue = this._coerceValue(owner, value)
    this._maybeNotify(owner, oldValue, (map[this._pid] = newValue))
  }
  coerce(owner: T): void {
    let oldValue: U
    let map = Private.ensureMap(owner)
    if (this._pid in map) {
      oldValue = map[this._pid]
    } else {
      oldValue = map[this._pid] = this._createValue(owner)
    }
    let newValue = this._coerceValue(owner, oldValue)
    this._maybeNotify(owner, oldValue, (map[this._pid] = newValue))
  }
  private _createValue(owner: T): U {
    let create = this._create
    return create(owner)
  }
  private _coerceValue(owner: T, value: U): U {
    let coerce = this._coerce
    return coerce ? coerce(owner, value) : value
  }
  private _compareValue(oldValue: U, newValue: U): boolean {
    let compare = this._compare
    return compare ? compare(oldValue, newValue) : oldValue === newValue
  }
  private _maybeNotify(owner: T, oldValue: U, newValue: U): void {
    let changed = this._changed
    if (changed && !this._compareValue(oldValue, newValue)) {
      changed(owner, oldValue, newValue)
    }
  }
  private _pid = Private.nextPID()
  private _create: (owner: T) => U
  private _coerce: ((owner: T, value: U) => U) | null
  private _compare: ((oldValue: U, newValue: U) => boolean) | null
  private _changed: ((owner: T, oldValue: U, newValue: U) => void) | null
}
export namespace AttachedProperty {
  export interface IOptions<T, U> {
    name: string
    create: (owner: T) => U
    coerce?: (owner: T, value: U) => U
    compare?: (oldValue: U, newValue: U) => boolean
    changed?: (owner: T, oldValue: U, newValue: U) => void
  }
  export function clearData(owner: unknown): void {
    Private.ownerData.delete(owner)
  }
}
namespace Private {
  export type PropertyMap = { [key: string]: any }
  export const ownerData = new WeakMap<any, PropertyMap>()
  export const nextPID = (() => {
    let id = 0
    return () => {
      let rand = Math.random()
      let stem = `${rand}`.slice(2)
      return `pid-${stem}-${id++}`
    }
  })()
  export function ensureMap(owner: unknown): PropertyMap {
    let map = ownerData.get(owner)
    if (map) {
      return map
    }
    map = Object.create(null) as PropertyMap
    ownerData.set(owner, map)
    return map
  }
}
