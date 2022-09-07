// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export * from './json';
export * from './mime';
export * from './promise';
export * from './token';
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

export * from './index.common';
export * from './random.node';
export * from './uuid.node';
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export * from './index.common';
export * from './random.browser';
export * from './uuid.browser';
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 * A type alias for a JSON primitive.
 */
export type JSONPrimitive = boolean | number | string | null;

/**
 * A type alias for a JSON value.
 */
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

/**
 * A type definition for a JSON object.
 */
export interface JSONObject {
  [key: string]: JSONValue;
}

/**
 * A type definition for a JSON array.
 */
export interface JSONArray extends Array<JSONValue> {}

/**
 * A type definition for a readonly JSON object.
 */
export interface ReadonlyJSONObject {
  readonly [key: string]: ReadonlyJSONValue;
}

/**
 * A type definition for a readonly JSON array.
 */
export interface ReadonlyJSONArray extends ReadonlyArray<ReadonlyJSONValue> {}

/**
 * A type alias for a readonly JSON value.
 */
export type ReadonlyJSONValue =
  | JSONPrimitive
  | ReadonlyJSONObject
  | ReadonlyJSONArray;

/**
 * A type alias for a partial JSON value.
 *
 * Note: Partial here means that JSON object attributes can be `undefined`.
 */
export type PartialJSONValue =
  | JSONPrimitive
  | PartialJSONObject
  | PartialJSONArray;

/**
 * A type definition for a partial JSON object.
 *
 * Note: Partial here means that the JSON object attributes can be `undefined`.
 */
export interface PartialJSONObject {
  [key: string]: PartialJSONValue | undefined;
}

/**
 * A type definition for a partial JSON array.
 *
 * Note: Partial here means that JSON object attributes can be `undefined`.
 */
export interface PartialJSONArray extends Array<PartialJSONValue> {}

/**
 * A type definition for a readonly partial JSON object.
 *
 * Note: Partial here means that JSON object attributes can be `undefined`.
 */
export interface ReadonlyPartialJSONObject {
  readonly [key: string]: ReadonlyPartialJSONValue | undefined;
}

/**
 * A type definition for a readonly partial JSON array.
 *
 * Note: Partial here means that JSON object attributes can be `undefined`.
 */
export interface ReadonlyPartialJSONArray
  extends ReadonlyArray<ReadonlyPartialJSONValue> {}

/**
 * A type alias for a readonly partial JSON value.
 *
 * Note: Partial here means that JSON object attributes can be `undefined`.
 */
export type ReadonlyPartialJSONValue =
  | JSONPrimitive
  | ReadonlyPartialJSONObject
  | ReadonlyPartialJSONArray;

/**
 * The namespace for JSON-specific functions.
 */
export namespace JSONExt {
  /**
   * A shared frozen empty JSONObject
   */
  export const emptyObject = Object.freeze({}) as ReadonlyJSONObject;

  /**
   * A shared frozen empty JSONArray
   */
  export const emptyArray = Object.freeze([]) as ReadonlyJSONArray;

  /**
   * Test whether a JSON value is a primitive.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a primitive,`false` otherwise.
   */
  export function isPrimitive(
    value: ReadonlyPartialJSONValue
  ): value is JSONPrimitive {
    return (
      value === null ||
      typeof value === 'boolean' ||
      typeof value === 'number' ||
      typeof value === 'string'
    );
  }

  /**
   * Test whether a JSON value is an array.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a an array, `false` otherwise.
   */
  export function isArray(value: JSONValue): value is JSONArray;
  export function isArray(value: ReadonlyJSONValue): value is ReadonlyJSONArray;
  export function isArray(value: PartialJSONValue): value is PartialJSONArray;
  export function isArray(
    value: ReadonlyPartialJSONValue
  ): value is ReadonlyPartialJSONArray;
  export function isArray(value: ReadonlyPartialJSONValue): boolean {
    return Array.isArray(value);
  }

  /**
   * Test whether a JSON value is an object.
   *
   * @param value - The JSON value of interest.
   *
   * @returns `true` if the value is a an object, `false` otherwise.
   */
  export function isObject(value: JSONValue): value is JSONObject;
  export function isObject(
    value: ReadonlyJSONValue
  ): value is ReadonlyJSONObject;
  export function isObject(value: PartialJSONValue): value is PartialJSONObject;
  export function isObject(
    value: ReadonlyPartialJSONValue
  ): value is ReadonlyPartialJSONObject;
  export function isObject(value: ReadonlyPartialJSONValue): boolean {
    return !isPrimitive(value) && !isArray(value);
  }

  /**
   * Compare two JSON values for deep equality.
   *
   * @param first - The first JSON value of interest.
   *
   * @param second - The second JSON value of interest.
   *
   * @returns `true` if the values are equivalent, `false` otherwise.
   */
  export function deepEqual(
    first: ReadonlyPartialJSONValue,
    second: ReadonlyPartialJSONValue
  ): boolean {
    // Check referential and primitive equality first.
    if (first === second) {
      return true;
    }

    // If one is a primitive, the `===` check ruled out the other.
    if (isPrimitive(first) || isPrimitive(second)) {
      return false;
    }

    // Test whether they are arrays.
    let a1 = isArray(first);
    let a2 = isArray(second);

    // Bail if the types are different.
    if (a1 !== a2) {
      return false;
    }

    // If they are both arrays, compare them.
    if (a1 && a2) {
      return deepArrayEqual(
        first as ReadonlyPartialJSONArray,
        second as ReadonlyPartialJSONArray
      );
    }

    // At this point, they must both be objects.
    return deepObjectEqual(
      first as ReadonlyPartialJSONObject,
      second as ReadonlyPartialJSONObject
    );
  }

  /**
   * Create a deep copy of a JSON value.
   *
   * @param value - The JSON value to copy.
   *
   * @returns A deep copy of the given JSON value.
   */
  export function deepCopy<T extends ReadonlyPartialJSONValue>(value: T): T {
    // Do nothing for primitive values.
    if (isPrimitive(value)) {
      return value;
    }

    // Deep copy an array.
    if (isArray(value)) {
      return deepArrayCopy(value);
    }

    // Deep copy an object.
    return deepObjectCopy(value);
  }

  /**
   * Compare two JSON arrays for deep equality.
   */
  function deepArrayEqual(
    first: ReadonlyPartialJSONArray,
    second: ReadonlyPartialJSONArray
  ): boolean {
    // Check referential equality first.
    if (first === second) {
      return true;
    }

    // Test the arrays for equal length.
    if (first.length !== second.length) {
      return false;
    }

    // Compare the values for equality.
    for (let i = 0, n = first.length; i < n; ++i) {
      if (!deepEqual(first[i], second[i])) {
        return false;
      }
    }

    // At this point, the arrays are equal.
    return true;
  }

  /**
   * Compare two JSON objects for deep equality.
   */
  function deepObjectEqual(
    first: ReadonlyPartialJSONObject,
    second: ReadonlyPartialJSONObject
  ): boolean {
    // Check referential equality first.
    if (first === second) {
      return true;
    }

    // Check for the first object's keys in the second object.
    for (let key in first) {
      if (first[key] !== undefined && !(key in second)) {
        return false;
      }
    }

    // Check for the second object's keys in the first object.
    for (let key in second) {
      if (second[key] !== undefined && !(key in first)) {
        return false;
      }
    }

    // Compare the values for equality.
    for (let key in first) {
      // Get the values.
      let firstValue = first[key];
      let secondValue = second[key];

      // If both are undefined, ignore the key.
      if (firstValue === undefined && secondValue === undefined) {
        continue;
      }

      // If only one value is undefined, the objects are not equal.
      if (firstValue === undefined || secondValue === undefined) {
        return false;
      }

      // Compare the values.
      if (!deepEqual(firstValue, secondValue)) {
        return false;
      }
    }

    // At this point, the objects are equal.
    return true;
  }

  /**
   * Create a deep copy of a JSON array.
   */
  function deepArrayCopy(value: any): any {
    let result = new Array<any>(value.length);
    for (let i = 0, n = value.length; i < n; ++i) {
      result[i] = deepCopy(value[i]);
    }
    return result;
  }

  /**
   * Create a deep copy of a JSON object.
   */
  function deepObjectCopy(value: any): any {
    let result: any = {};
    for (let key in value) {
      // Ignore undefined values.
      let subvalue = value[key];
      if (subvalue === undefined) {
        continue;
      }
      result[key] = deepCopy(subvalue);
    }
    return result;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 * An object which stores MIME data for general application use.
 *
 * #### Notes
 * This class does not attempt to enforce "correctness" of MIME types
 * and their associated data. Since this class is designed to transfer
 * arbitrary data and objects within the same application, it assumes
 * that the user provides correct and accurate data.
 */
export class MimeData {
  /**
   * Get an array of the MIME types contained within the dataset.
   *
   * @returns A new array of the MIME types, in order of insertion.
   */
  types(): string[] {
    return this._types.slice();
  }

  /**
   * Test whether the dataset has an entry for the given type.
   *
   * @param mime - The MIME type of interest.
   *
   * @returns `true` if the dataset contains a value for the given
   *   MIME type, `false` otherwise.
   */
  hasData(mime: string): boolean {
    return this._types.indexOf(mime) !== -1;
  }

  /**
   * Get the data value for the given MIME type.
   *
   * @param mime - The MIME type of interest.
   *
   * @returns The value for the given MIME type, or `undefined` if
   *   the dataset does not contain a value for the type.
   */
  getData(mime: string): any | undefined {
    let i = this._types.indexOf(mime);
    return i !== -1 ? this._values[i] : undefined;
  }

  /**
   * Set the data value for the given MIME type.
   *
   * @param mime - The MIME type of interest.
   *
   * @param data - The data value for the given MIME type.
   *
   * #### Notes
   * This will overwrite any previous entry for the MIME type.
   */
  setData(mime: string, data: unknown): void {
    this.clearData(mime);
    this._types.push(mime);
    this._values.push(data);
  }

  /**
   * Remove the data entry for the given MIME type.
   *
   * @param mime - The MIME type of interest.
   *
   * #### Notes
   * This is a no-op if there is no entry for the given MIME type.
   */
  clearData(mime: string): void {
    let i = this._types.indexOf(mime);
    if (i !== -1) {
      this._types.splice(i, 1);
      this._values.splice(i, 1);
    }
  }

  /**
   * Remove all data entries from the dataset.
   */
  clear(): void {
    this._types.length = 0;
    this._values.length = 0;
  }

  private _types: string[] = [];
  private _values: any[] = [];
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 * A class which wraps a promise into a delegate object.
 *
 * #### Notes
 * This class is useful when the logic to resolve or reject a promise
 * cannot be defined at the point where the promise is created.
 */
export class PromiseDelegate<T> {
  /**
   * Construct a new promise delegate.
   */
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * The promise wrapped by the delegate.
   */
  readonly promise: Promise<T>;

  /**
   * Resolve the wrapped promise with the given value.
   *
   * @param value - The value to use for resolving the promise.
   */
  resolve(value: T | PromiseLike<T>): void {
    let resolve = this._resolve;
    resolve(value);
  }

  /**
   * Reject the wrapped promise with the given value.
   *
   * @reason - The reason for rejecting the promise.
   */
  reject(reason: unknown): void {
    let reject = this._reject;
    reject(reason);
  }

  private _resolve: (value: T | PromiseLike<T>) => void;
  private _reject: (reason: any) => void;
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import { fallbackRandomValues } from './random';

// Declare ambient variables for `window` and `require` to avoid a
// hard dependency on both. This package must run on node.
declare let window: any;

/**
 * The namespace for random number related functionality.
 */
export namespace Random {
  /**
   * A function which generates random bytes.
   *
   * @param buffer - The `Uint8Array` to fill with random bytes.
   *
   * #### Notes
   * A cryptographically strong random number generator will be used if
   * available. Otherwise, `Math.random` will be used as a fallback for
   * randomness.
   *
   * The following RNGs are supported, listed in order of precedence:
   *   - `window.crypto.getRandomValues`
   *   - `window.msCrypto.getRandomValues`
   *   - `require('crypto').randomFillSync
   *   - `require('crypto').randomBytes
   *   - `Math.random`
   */
  export const getRandomValues = (() => {
    // Look up the crypto module if available.
    const crypto: any =
      (typeof window !== 'undefined' && (window.crypto || window.msCrypto)) ||
      null;

    // Modern browsers and IE 11
    if (crypto && typeof crypto.getRandomValues === 'function') {
      return function getRandomValues(buffer: Uint8Array): void {
        return crypto.getRandomValues(buffer);
      };
    }

    // Fallback
    return fallbackRandomValues;
  })();
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import { fallbackRandomValues } from './random';

// Declare ambient variables for `window` and `require` to avoid a
// hard dependency on both. This package must run on node.
declare let require: any;

/**
 * The namespace for random number related functionality.
 */
export namespace Random {
  /**
   * A function which generates random bytes.
   *
   * @param buffer - The `Uint8Array` to fill with random bytes.
   *
   * #### Notes
   * A cryptographically strong random number generator will be used if
   * available. Otherwise, `Math.random` will be used as a fallback for
   * randomness.
   *
   * The following RNGs are supported, listed in order of precedence:
   *   - `window.crypto.getRandomValues`
   *   - `window.msCrypto.getRandomValues`
   *   - `require('crypto').randomFillSync
   *   - `require('crypto').randomBytes
   *   - `Math.random`
   */
  export const getRandomValues = (() => {
    // Look up the crypto module if available.
    const crypto: any =
      (typeof require !== 'undefined' && require('crypto')) || null;

    // Node 7+
    if (crypto && typeof crypto.randomFillSync === 'function') {
      return function getRandomValues(buffer: Uint8Array): void {
        return crypto.randomFillSync(buffer);
      };
    }

    // Node 0.10+
    if (crypto && typeof crypto.randomBytes === 'function') {
      return function getRandomValues(buffer: Uint8Array): void {
        let bytes = crypto.randomBytes(buffer.length);
        for (let i = 0, n = bytes.length; i < n; ++i) {
          buffer[i] = bytes[i];
        }
      };
    }

    // Fallback
    return fallbackRandomValues;
  })();
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

// Fallback
export function fallbackRandomValues(buffer: Uint8Array): void {
  let value = 0;
  for (let i = 0, n = buffer.length; i < n; ++i) {
    if (i % 4 === 0) {
      value = (Math.random() * 0xffffffff) >>> 0;
    }
    buffer[i] = value & 0xff;
    value >>>= 8;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 * A runtime object which captures compile-time type information.
 *
 * #### Notes
 * A token captures the compile-time type of an interface or class in
 * an object which can be used at runtime in a type-safe fashion.
 */
export class Token<T> {
  /**
   * Construct a new token.
   *
   * @param name - A human readable name for the token.
   */
  constructor(name: string) {
    this.name = name;
    this._tokenStructuralPropertyT = null!;
  }

  /**
   * The human readable name for the token.
   *
   * #### Notes
   * This can be useful for debugging and logging.
   */
  readonly name: string;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private _tokenStructuralPropertyT: T;
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { Random } from './random.browser';
import { uuid4Factory } from './uuid';

/**
 * The namespace for UUID related functionality.
 */
export namespace UUID {
  /**
   * A function which generates UUID v4 identifiers.
   *
   * @returns A new UUID v4 string.
   *
   * #### Notes
   * This implementation complies with RFC 4122.
   *
   * This uses `Random.getRandomValues()` for random bytes, which in
   * turn will use the underlying `crypto` module of the platform if
   * it is available. The fallback for randomness is `Math.random`.
   */
  export const uuid4 = uuid4Factory(Random.getRandomValues);
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { Random } from './random.node';
import { uuid4Factory } from './uuid';

/**
 * The namespace for UUID related functionality.
 */
export namespace UUID {
  /**
   * A function which generates UUID v4 identifiers.
   *
   * @returns A new UUID v4 string.
   *
   * #### Notes
   * This implementation complies with RFC 4122.
   *
   * This uses `Random.getRandomValues()` for random bytes, which in
   * turn will use the underlying `crypto` module of the platform if
   * it is available. The fallback for randomness is `Math.random`.
   */
  export const uuid4 = uuid4Factory(Random.getRandomValues);
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
/**
 * A function which creates a function that generates UUID v4 identifiers.
 *
 * @returns A new function that creates a UUID v4 string.
 *
 * #### Notes
 * This implementation complies with RFC 4122.
 *
 * This uses `Random.getRandomValues()` for random bytes, which in
 * turn will use the underlying `crypto` module of the platform if
 * it is available. The fallback for randomness is `Math.random`.
 */
export function uuid4Factory(
  getRandomValues: (bytes: Uint8Array) => void
): () => string {
  // Create a 16 byte array to hold the random values.
  const bytes = new Uint8Array(16);

  // Create a look up table from bytes to hex strings.
  const lut = new Array<string>(256);

  // Pad the single character hex digits with a leading zero.
  for (let i = 0; i < 16; ++i) {
    lut[i] = '0' + i.toString(16);
  }

  // Populate the rest of the hex digits.
  for (let i = 16; i < 256; ++i) {
    lut[i] = i.toString(16);
  }

  // Return a function which generates the UUID.
  return function uuid4(): string {
    // Get a new batch of random values.
    getRandomValues(bytes);

    // Set the UUID version number to 4.
    bytes[6] = 0x40 | (bytes[6] & 0x0f);

    // Set the clock sequence bit to the RFC spec.
    bytes[8] = 0x80 | (bytes[8] & 0x3f);

    // Assemble the UUID string.
    return (
      lut[bytes[0]] +
      lut[bytes[1]] +
      lut[bytes[2]] +
      lut[bytes[3]] +
      '-' +
      lut[bytes[4]] +
      lut[bytes[5]] +
      '-' +
      lut[bytes[6]] +
      lut[bytes[7]] +
      '-' +
      lut[bytes[8]] +
      lut[bytes[9]] +
      '-' +
      lut[bytes[10]] +
      lut[bytes[11]] +
      lut[bytes[12]] +
      lut[bytes[13]] +
      lut[bytes[14]] +
      lut[bytes[15]]
    );
  };
}
