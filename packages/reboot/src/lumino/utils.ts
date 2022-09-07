/* eslint-disable @typescript-eslint/no-namespace */
export type JSONPrimitive = boolean | number | string | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export interface JSONObject {
  [key: string]: JSONValue
}
export interface JSONArray extends Array<JSONValue> {}
export interface ReadonlyJSONObject {
  readonly [key: string]: ReadonlyJSONValue
}
export interface ReadonlyJSONArray extends ReadonlyArray<ReadonlyJSONValue> {}
export type ReadonlyJSONValue =
  | JSONPrimitive
  | ReadonlyJSONObject
  | ReadonlyJSONArray
export type PartialJSONValue =
  | JSONPrimitive
  | PartialJSONObject
  | PartialJSONArray
export interface PartialJSONObject {
  [key: string]: PartialJSONValue | undefined
}
export interface PartialJSONArray extends Array<PartialJSONValue> {}
export interface ReadonlyPartialJSONObject {
  readonly [key: string]: ReadonlyPartialJSONValue | undefined
}
export interface ReadonlyPartialJSONArray
  extends ReadonlyArray<ReadonlyPartialJSONValue> {}
export type ReadonlyPartialJSONValue =
  | JSONPrimitive
  | ReadonlyPartialJSONObject
  | ReadonlyPartialJSONArray
export namespace JSONExt {
  export const emptyObject = Object.freeze({}) as ReadonlyJSONObject
  export const emptyArray = Object.freeze([]) as ReadonlyJSONArray
  export function isPrimitive(
    value: ReadonlyPartialJSONValue
  ): value is JSONPrimitive {
    return (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    )
  }
  export function isArray(value: JSONValue): value is JSONArray
  export function isArray(value: ReadonlyJSONValue): value is ReadonlyJSONArray
  export function isArray(value: PartialJSONValue): value is PartialJSONArray
  export function isArray(
    value: ReadonlyPartialJSONValue
  ): value is ReadonlyPartialJSONArray
  export function isArray(value: ReadonlyPartialJSONValue): boolean {
    return Array.isArray(value)
  }
  export function isObject(value: JSONValue): value is JSONObject
  export function isObject(
    value: ReadonlyJSONValue
  ): value is ReadonlyJSONObject
  export function isObject(value: PartialJSONValue): value is PartialJSONObject
  export function isObject(
    value: ReadonlyPartialJSONValue
  ): value is ReadonlyPartialJSONObject
  export function isObject(value: ReadonlyPartialJSONValue): boolean {
    return !isPrimitive(value) && !isArray(value)
  }
  export function deepEqual(
    first: ReadonlyPartialJSONValue,
    second: ReadonlyPartialJSONValue
  ): boolean {
    if (first === second) {
      return true
    }
    if (isPrimitive(first) || isPrimitive(second)) {
      return false
    }
    let a1 = isArray(first)
    let a2 = isArray(second)
    if (a1 !== a2) {
      return false
    }
    if (a1 && a2) {
      return deepArrayEqual(
        first as ReadonlyPartialJSONArray,
        second as ReadonlyPartialJSONArray
      )
    }
    return deepObjectEqual(
      first as ReadonlyPartialJSONObject,
      second as ReadonlyPartialJSONObject
    )
  }
  export function deepCopy<T extends ReadonlyPartialJSONValue>(value: T): T {
    if (isPrimitive(value)) {
      return value
    }
    if (isArray(value)) {
      return deepArrayCopy(value)
    }
    return deepObjectCopy(value)
  }
  function deepArrayEqual(
    first: ReadonlyPartialJSONArray,
    second: ReadonlyPartialJSONArray
  ): boolean {
    if (first === second) {
      return true
    }
    if (first.length !== second.length) {
      return false
    }
    for (let i = 0, n = first.length; i < n; ++i) {
      if (!deepEqual(first[i], second[i])) {
        return false
      }
    }
    return true
  }
  function deepObjectEqual(
    first: ReadonlyPartialJSONObject,
    second: ReadonlyPartialJSONObject
  ): boolean {
    if (first === second) {
      return true
    }
    for (let key in first) {
      if (first[key] !== undefined && !(key in second)) {
        return false
      }
    }
    for (let key in second) {
      if (second[key] !== undefined && !(key in first)) {
        return false
      }
    }
    for (let key in first) {
      let firstValue = first[key]
      let secondValue = second[key]
      if (firstValue === undefined && secondValue === undefined) {
        continue
      }
      if (firstValue === undefined || secondValue === undefined) {
        return false
      }
      if (!deepEqual(firstValue, secondValue)) {
        return false
      }
    }
    return true
  }
  function deepArrayCopy(value: any): any {
    let result = new Array<any>(value.length)
    for (let i = 0, n = value.length; i < n; ++i) {
      result[i] = deepCopy(value[i])
    }
    return result
  }
  function deepObjectCopy(value: any): any {
    let result: any = {}
    for (let key in value) {
      let subvalue = value[key]
      if (subvalue === undefined) {
        continue
      }
      result[key] = deepCopy(subvalue)
    }
    return result
  }
}
export class MimeData {
  types(): string[] {
    return this._types.slice()
  }
  hasData(mime: string): boolean {
    return this._types.indexOf(mime) !== -1
  }
  getData(mime: string): any | undefined {
    let i = this._types.indexOf(mime)
    return i !== -1 ? this._values[i] : undefined
  }
  setData(mime: string, data: unknown): void {
    this.clearData(mime)
    this._types.push(mime)
    this._values.push(data)
  }
  clearData(mime: string): void {
    let i = this._types.indexOf(mime)
    if (i !== -1) {
      this._types.splice(i, 1)
      this._values.splice(i, 1)
    }
  }
  clear(): void {
    this._types.length = 0
    this._values.length = 0
  }
  private _types: string[] = []
  private _values: any[] = []
}
export class PromiseDelegate<T> {
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }
  readonly promise: Promise<T>
  resolve(value: T | PromiseLike<T>): void {
    let resolve = this._resolve
    resolve(value)
  }
  reject(reason: unknown): void {
    let reject = this._reject
    reject(reason)
  }
  private _resolve: (value: T | PromiseLike<T>) => void
  private _reject: (reason: any) => void
}
declare let window: any
export namespace Random {
  export const getRandomValues = (() => {
    const crypto: any =
      (typeof window !== "undefined" && (window.crypto || window.msCrypto)) ||
      null
    if (crypto && typeof crypto.getRandomValues === "function") {
      return function getRandomValues(buffer: Uint8Array): void {
        return crypto.getRandomValues(buffer)
      }
    }
    return fallbackRandomValues
  })()
}
declare let require: any
export namespace Random {
  export const getRandomValues = (() => {
    const crypto: any =
      (typeof require !== "undefined" && require("crypto")) || null
    if (crypto && typeof crypto.randomFillSync === "function") {
      return function getRandomValues(buffer: Uint8Array): void {
        return crypto.randomFillSync(buffer)
      }
    }
    if (crypto && typeof crypto.randomBytes === "function") {
      return function getRandomValues(buffer: Uint8Array): void {
        let bytes = crypto.randomBytes(buffer.length)
        for (let i = 0, n = bytes.length; i < n; ++i) {
          buffer[i] = bytes[i]
        }
      }
    }
    return fallbackRandomValues
  })()
}
export function fallbackRandomValues(buffer: Uint8Array): void {
  let value = 0
  for (let i = 0, n = buffer.length; i < n; ++i) {
    if (i % 4 === 0) {
      value = (Math.random() * 0xffffffff) >>> 0
    }
    buffer[i] = value & 0xff
    value >>>= 8
  }
}
export class Token<T> {
  constructor(name: string) {
    this.name = name
    this._tokenStructuralPropertyT = null!
  }
  readonly name: string
  private _tokenStructuralPropertyT: T
}
export namespace UUID {
  export const uuid4 = uuid4Factory(Random.getRandomValues)
}
export namespace UUID {
  export const uuid4 = uuid4Factory(Random.getRandomValues)
}
export function uuid4Factory(
  getRandomValues: (bytes: Uint8Array) => void
): () => string {
  const bytes = new Uint8Array(16)
  const lut = new Array<string>(256)
  for (let i = 0; i < 16; ++i) {
    lut[i] = "0" + i.toString(16)
  }
  for (let i = 16; i < 256; ++i) {
    lut[i] = i.toString(16)
  }
  return function uuid4(): string {
    getRandomValues(bytes)
    bytes[6] = 0x40 | (bytes[6] & 0x0f)
    bytes[8] = 0x80 | (bytes[8] & 0x3f)
    return (
      lut[bytes[0]] +
      lut[bytes[1]] +
      lut[bytes[2]] +
      lut[bytes[3]] +
      "-" +
      lut[bytes[4]] +
      lut[bytes[5]] +
      "-" +
      lut[bytes[6]] +
      lut[bytes[7]] +
      "-" +
      lut[bytes[8]] +
      lut[bytes[9]] +
      "-" +
      lut[bytes[10]] +
      lut[bytes[11]] +
      lut[bytes[12]] +
      lut[bytes[13]] +
      lut[bytes[14]] +
      lut[bytes[15]]
    )
  }
}
