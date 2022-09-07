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
 * The namespace for array-specific algorithms.
 */
export namespace ArrayExt {
  /**
   * Find the index of the first occurrence of a value in an array.
   *
   * @param array - The array-like object to search.
   *
   * @param value - The value to locate in the array. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the first occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = ['one', 'two', 'three', 'four', 'one'];
   * ArrayExt.firstIndexOf(data, 'red');        // -1
   * ArrayExt.firstIndexOf(data, 'one');        // 0
   * ArrayExt.firstIndexOf(data, 'one', 1);     // 4
   * ArrayExt.firstIndexOf(data, 'two', 2);     // -1
   * ArrayExt.firstIndexOf(data, 'two', 2, 1);  // 1
   * ```
   */
  export function firstIndexOf<T>(
    array: ArrayLike<T>,
    value: T,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return -1;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let span: number;
    if (stop < start) {
      span = stop + 1 + (n - start);
    } else {
      span = stop - start + 1;
    }
    for (let i = 0; i < span; ++i) {
      let j = (start + i) % n;
      if (array[j] === value) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the index of the last occurrence of a value in an array.
   *
   * @param array - The array-like object to search.
   *
   * @param value - The value to locate in the array. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the last occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = ['one', 'two', 'three', 'four', 'one'];
   * ArrayExt.lastIndexOf(data, 'red');        // -1
   * ArrayExt.lastIndexOf(data, 'one');        // 4
   * ArrayExt.lastIndexOf(data, 'one', 1);     // 0
   * ArrayExt.lastIndexOf(data, 'two', 0);     // -1
   * ArrayExt.lastIndexOf(data, 'two', 0, 1);  // 1
   * ```
   */
  export function lastIndexOf<T>(
    array: ArrayLike<T>,
    value: T,
    start = -1,
    stop = 0
  ): number {
    let n = array.length;
    if (n === 0) {
      return -1;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let span: number;
    if (start < stop) {
      span = start + 1 + (n - stop);
    } else {
      span = start - stop + 1;
    }
    for (let i = 0; i < span; ++i) {
      let j = (start - i + n) % n;
      if (array[j] === value) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the index of the first value which matches a predicate.
   *
   * @param array - The array-like object to search.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the first matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [1, 2, 3, 4, 3, 2, 1];
   * ArrayExt.findFirstIndex(data, isEven);       // 1
   * ArrayExt.findFirstIndex(data, isEven, 4);    // 5
   * ArrayExt.findFirstIndex(data, isEven, 6);    // -1
   * ArrayExt.findFirstIndex(data, isEven, 6, 5); // 1
   * ```
   */
  export function findFirstIndex<T>(
    array: ArrayLike<T>,
    fn: (value: T, index: number) => boolean,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return -1;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let span: number;
    if (stop < start) {
      span = stop + 1 + (n - start);
    } else {
      span = stop - start + 1;
    }
    for (let i = 0; i < span; ++i) {
      let j = (start + i) % n;
      if (fn(array[j], j)) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the index of the last value which matches a predicate.
   *
   * @param object - The array-like object to search.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the last matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [1, 2, 3, 4, 3, 2, 1];
   * ArrayExt.findLastIndex(data, isEven);        // 5
   * ArrayExt.findLastIndex(data, isEven, 4);     // 3
   * ArrayExt.findLastIndex(data, isEven, 0);     // -1
   * ArrayExt.findLastIndex(data, isEven, 0, 1);  // 5
   * ```
   */
  export function findLastIndex<T>(
    array: ArrayLike<T>,
    fn: (value: T, index: number) => boolean,
    start = -1,
    stop = 0
  ): number {
    let n = array.length;
    if (n === 0) {
      return -1;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let d: number;
    if (start < stop) {
      d = start + 1 + (n - stop);
    } else {
      d = start - stop + 1;
    }
    for (let i = 0; i < d; ++i) {
      let j = (start - i + n) % n;
      if (fn(array[j], j)) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the first value which matches a predicate.
   *
   * @param array - The array-like object to search.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The first matching value, or `undefined` if no matching
   *   value is found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [1, 2, 3, 4, 3, 2, 1];
   * ArrayExt.findFirstValue(data, isEven);       // 2
   * ArrayExt.findFirstValue(data, isEven, 2);    // 4
   * ArrayExt.findFirstValue(data, isEven, 6);    // undefined
   * ArrayExt.findFirstValue(data, isEven, 6, 5); // 2
   * ```
   */
  export function findFirstValue<T>(
    array: ArrayLike<T>,
    fn: (value: T, index: number) => boolean,
    start = 0,
    stop = -1
  ): T | undefined {
    let index = findFirstIndex(array, fn, start, stop);
    return index !== -1 ? array[index] : undefined;
  }

  /**
   * Find the last value which matches a predicate.
   *
   * @param object - The array-like object to search.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The last matching value, or `undefined` if no matching
   *   value is found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [1, 2, 3, 4, 3, 2, 1];
   * ArrayExt.findLastValue(data, isEven);        // 2
   * ArrayExt.findLastValue(data, isEven, 4);     // 4
   * ArrayExt.findLastValue(data, isEven, 0);     // undefined
   * ArrayExt.findLastValue(data, isEven, 0, 1);  // 2
   * ```
   */
  export function findLastValue<T>(
    array: ArrayLike<T>,
    fn: (value: T, index: number) => boolean,
    start = -1,
    stop = 0
  ): T | undefined {
    let index = findLastIndex(array, fn, start, stop);
    return index !== -1 ? array[index] : undefined;
  }

  /**
   * Find the index of the first element which compares `>=` to a value.
   *
   * @param array - The sorted array-like object to search.
   *
   * @param value - The value to locate in the array.
   *
   * @param fn - The 3-way comparison function to apply to the values.
   *   It should return `< 0` if an element is less than a value, `0` if
   *   an element is equal to a value, or `> 0` if an element is greater
   *   than a value.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the first element which compares `>=` to the
   *   value, or `length` if there is no such element. If the computed
   *   index for `stop` is less than `start`, then the computed index
   *   for `start` is returned.
   *
   * #### Notes
   * The array must already be sorted in ascending order according to
   * the comparison function.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * Searching a range which is not sorted in ascending order.
   *
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function numberCmp(a: number, b: number): number {
   *   return a - b;
   * }
   *
   * let data = [0, 3, 4, 7, 7, 9];
   * ArrayExt.lowerBound(data, 0, numberCmp);   // 0
   * ArrayExt.lowerBound(data, 6, numberCmp);   // 3
   * ArrayExt.lowerBound(data, 7, numberCmp);   // 3
   * ArrayExt.lowerBound(data, -1, numberCmp);  // 0
   * ArrayExt.lowerBound(data, 10, numberCmp);  // 6
   * ```
   */
  export function lowerBound<T, U>(
    array: ArrayLike<T>,
    value: U,
    fn: (element: T, value: U) => number,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return 0;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let begin = start;
    let span = stop - start + 1;
    while (span > 0) {
      let half = span >> 1;
      let middle = begin + half;
      if (fn(array[middle], value) < 0) {
        begin = middle + 1;
        span -= half + 1;
      } else {
        span = half;
      }
    }
    return begin;
  }

  /**
   * Find the index of the first element which compares `>` than a value.
   *
   * @param array - The sorted array-like object to search.
   *
   * @param value - The value to locate in the array.
   *
   * @param fn - The 3-way comparison function to apply to the values.
   *   It should return `< 0` if an element is less than a value, `0` if
   *   an element is equal to a value, or `> 0` if an element is greater
   *   than a value.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the first element which compares `>` than the
   *   value, or `length` if there is no such element. If the computed
   *   index for `stop` is less than `start`, then the computed index
   *   for `start` is returned.
   *
   * #### Notes
   * The array must already be sorted in ascending order according to
   * the comparison function.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * Searching a range which is not sorted in ascending order.
   *
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the array while searching.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function numberCmp(a: number, b: number): number {
   *   return a - b;
   * }
   *
   * let data = [0, 3, 4, 7, 7, 9];
   * ArrayExt.upperBound(data, 0, numberCmp);   // 1
   * ArrayExt.upperBound(data, 6, numberCmp);   // 3
   * ArrayExt.upperBound(data, 7, numberCmp);   // 5
   * ArrayExt.upperBound(data, -1, numberCmp);  // 0
   * ArrayExt.upperBound(data, 10, numberCmp);  // 6
   * ```
   */
  export function upperBound<T, U>(
    array: ArrayLike<T>,
    value: U,
    fn: (element: T, value: U) => number,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return 0;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let begin = start;
    let span = stop - start + 1;
    while (span > 0) {
      let half = span >> 1;
      let middle = begin + half;
      if (fn(array[middle], value) > 0) {
        span = half;
      } else {
        begin = middle + 1;
        span -= half + 1;
      }
    }
    return begin;
  }

  /**
   * Test whether two arrays are shallowly equal.
   *
   * @param a - The first array-like object to compare.
   *
   * @param b - The second array-like object to compare.
   *
   * @param fn - The comparison function to apply to the elements. It
   *   should return `true` if the elements are "equal". The default
   *   compares elements using strict `===` equality.
   *
   * @returns Whether the two arrays are shallowly equal.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * Modifying the length of the arrays while comparing.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let d1 = [0, 3, 4, 7, 7, 9];
   * let d2 = [0, 3, 4, 7, 7, 9];
   * let d3 = [42];
   * ArrayExt.shallowEqual(d1, d2);  // true
   * ArrayExt.shallowEqual(d2, d3);  // false
   * ```
   */
  export function shallowEqual<T>(
    a: ArrayLike<T>,
    b: ArrayLike<T>,
    fn?: (a: T, b: T) => boolean
  ): boolean {
    // Check for object identity first.
    if (a === b) {
      return true;
    }

    // Bail early if the lengths are different.
    if (a.length !== b.length) {
      return false;
    }

    // Compare each element for equality.
    for (let i = 0, n = a.length; i < n; ++i) {
      if (fn ? !fn(a[i], b[i]) : a[i] !== b[i]) {
        return false;
      }
    }

    // The array are shallowly equal.
    return true;
  }

  /**
   * Create a slice of an array subject to an optional step.
   *
   * @param array - The array-like object of interest.
   *
   * @param options - The options for configuring the slice.
   *
   * @returns A new array with the specified values.
   *
   * @throws An exception if the slice `step` is `0`.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start`, `stop`, or `step` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 3, 4, 7, 7, 9];
   * ArrayExt.slice(data);                         // [0, 3, 4, 7, 7, 9]
   * ArrayExt.slice(data, { start: 2 });           // [4, 7, 7, 9]
   * ArrayExt.slice(data, { start: 0, stop: 4 });  // [0, 3, 4, 7]
   * ArrayExt.slice(data, { step: 2 });            // [0, 4, 7]
   * ArrayExt.slice(data, { step: -1 });           // [9, 7, 7, 4, 3, 0]
   * ```
   */
  export function slice<T>(
    array: ArrayLike<T>,
    options: slice.IOptions = {}
  ): T[] {
    // Extract the options.
    let { start, stop, step } = options;

    // Set up the `step` value.
    if (step === undefined) {
      step = 1;
    }

    // Validate the step size.
    if (step === 0) {
      throw new Error('Slice `step` cannot be zero.');
    }

    // Look up the length of the array.
    let n = array.length;

    // Set up the `start` value.
    if (start === undefined) {
      start = step < 0 ? n - 1 : 0;
    } else if (start < 0) {
      start = Math.max(start + n, step < 0 ? -1 : 0);
    } else if (start >= n) {
      start = step < 0 ? n - 1 : n;
    }

    // Set up the `stop` value.
    if (stop === undefined) {
      stop = step < 0 ? -1 : n;
    } else if (stop < 0) {
      stop = Math.max(stop + n, step < 0 ? -1 : 0);
    } else if (stop >= n) {
      stop = step < 0 ? n - 1 : n;
    }

    // Compute the slice length.
    let length;
    if ((step < 0 && stop >= start) || (step > 0 && start >= stop)) {
      length = 0;
    } else if (step < 0) {
      length = Math.floor((stop - start + 1) / step + 1);
    } else {
      length = Math.floor((stop - start - 1) / step + 1);
    }

    // Compute the sliced result.
    let result: T[] = [];
    for (let i = 0; i < length; ++i) {
      result[i] = array[start + i * step];
    }

    // Return the result.
    return result;
  }

  /**
   * The namespace for the `slice` function statics.
   */
  export namespace slice {
    /**
     * The options for the `slice` function.
     */
    export interface IOptions {
      /**
       * The starting index of the slice, inclusive.
       *
       * Negative values are taken as an offset from the end
       * of the array.
       *
       * The default is `0` if `step > 0` else `n - 1`.
       */
      start?: number;

      /**
       * The stopping index of the slice, exclusive.
       *
       * Negative values are taken as an offset from the end
       * of the array.
       *
       * The default is `n` if `step > 0` else `-n - 1`.
       */
      stop?: number;

      /**
       * The step value for the slice.
       *
       * This must not be `0`.
       *
       * The default is `1`.
       */
      step?: number;
    }
  }

  /**
   * An array-like object which supports item assignment.
   */
  export type MutableArrayLike<T> = {
    readonly length: number;
    [index: number]: T;
  };

  /**
   * Move an element in an array from one index to another.
   *
   * @param array - The mutable array-like object of interest.
   *
   * @param fromIndex - The index of the element to move. Negative
   *   values are taken as an offset from the end of the array.
   *
   * @param toIndex - The target index of the element. Negative
   *   values are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `fromIndex` or `toIndex` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from from '@lumino/algorithm';
   *
   * let data = [0, 1, 2, 3, 4];
   * ArrayExt.move(data, 1, 2);  // [0, 2, 1, 3, 4]
   * ArrayExt.move(data, 4, 2);  // [0, 2, 4, 1, 3]
   * ```
   */
  export function move<T>(
    array: MutableArrayLike<T>,
    fromIndex: number,
    toIndex: number
  ): void {
    let n = array.length;
    if (n <= 1) {
      return;
    }
    if (fromIndex < 0) {
      fromIndex = Math.max(0, fromIndex + n);
    } else {
      fromIndex = Math.min(fromIndex, n - 1);
    }
    if (toIndex < 0) {
      toIndex = Math.max(0, toIndex + n);
    } else {
      toIndex = Math.min(toIndex, n - 1);
    }
    if (fromIndex === toIndex) {
      return;
    }
    let value = array[fromIndex];
    let d = fromIndex < toIndex ? 1 : -1;
    for (let i = fromIndex; i !== toIndex; i += d) {
      array[i] = array[i + d];
    }
    array[toIndex] = value;
  }

  /**
   * Reverse an array in-place.
   *
   * @param array - The mutable array-like object of interest.
   *
   * @param start - The index of the first element in the range to be
   *   reversed, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   reversed, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or  `stop` index which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 1, 2, 3, 4];
   * ArrayExt.reverse(data, 1, 3);  // [0, 3, 2, 1, 4]
   * ArrayExt.reverse(data, 3);     // [0, 3, 2, 4, 1]
   * ArrayExt.reverse(data);        // [1, 4, 2, 3, 0]
   * ```
   */
  export function reverse<T>(
    array: MutableArrayLike<T>,
    start = 0,
    stop = -1
  ): void {
    let n = array.length;
    if (n <= 1) {
      return;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    while (start < stop) {
      let a = array[start];
      let b = array[stop];
      array[start++] = b;
      array[stop--] = a;
    }
  }

  /**
   * Rotate the elements of an array in-place.
   *
   * @param array - The mutable array-like object of interest.
   *
   * @param delta - The amount of rotation to apply to the elements. A
   *   positive value will rotate the elements to the left. A negative
   *   value will rotate the elements to the right.
   *
   * @param start - The index of the first element in the range to be
   *   rotated, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   rotated, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `delta`, `start`, or `stop` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 1, 2, 3, 4];
   * ArrayExt.rotate(data, 2);        // [2, 3, 4, 0, 1]
   * ArrayExt.rotate(data, -2);       // [0, 1, 2, 3, 4]
   * ArrayExt.rotate(data, 10);       // [0, 1, 2, 3, 4]
   * ArrayExt.rotate(data, 9);        // [4, 0, 1, 2, 3]
   * ArrayExt.rotate(data, 2, 1, 3);  // [4, 2, 0, 1, 3]
   * ```
   */
  export function rotate<T>(
    array: MutableArrayLike<T>,
    delta: number,
    start = 0,
    stop = -1
  ): void {
    let n = array.length;
    if (n <= 1) {
      return;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    if (start >= stop) {
      return;
    }
    let length = stop - start + 1;
    if (delta > 0) {
      delta = delta % length;
    } else if (delta < 0) {
      delta = ((delta % length) + length) % length;
    }
    if (delta === 0) {
      return;
    }
    let pivot = start + delta;
    reverse(array, start, pivot - 1);
    reverse(array, pivot, stop);
    reverse(array, start, stop);
  }

  /**
   * Fill an array with a static value.
   *
   * @param array - The mutable array-like object to fill.
   *
   * @param value - The static value to use to fill the array.
   *
   * @param start - The index of the first element in the range to be
   *   filled, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   filled, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Notes
   * If `stop < start` the fill will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = ['one', 'two', 'three', 'four'];
   * ArrayExt.fill(data, 'r');        // ['r', 'r', 'r', 'r']
   * ArrayExt.fill(data, 'g', 1);     // ['r', 'g', 'g', 'g']
   * ArrayExt.fill(data, 'b', 2, 3);  // ['r', 'g', 'b', 'b']
   * ArrayExt.fill(data, 'z', 3, 1);  // ['z', 'z', 'b', 'z']
   * ```
   */
  export function fill<T>(
    array: MutableArrayLike<T>,
    value: T,
    start = 0,
    stop = -1
  ): void {
    let n = array.length;
    if (n === 0) {
      return;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let span: number;
    if (stop < start) {
      span = stop + 1 + (n - start);
    } else {
      span = stop - start + 1;
    }
    for (let i = 0; i < span; ++i) {
      array[(start + i) % n] = value;
    }
  }

  /**
   * Insert a value into an array at a specific index.
   *
   * @param array - The array of interest.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the array.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 1, 2];
   * ArrayExt.insert(data, 0, -1);  // [-1, 0, 1, 2]
   * ArrayExt.insert(data, 2, 12);  // [-1, 0, 12, 1, 2]
   * ArrayExt.insert(data, -1, 7);  // [-1, 0, 12, 1, 7, 2]
   * ArrayExt.insert(data, 6, 19);  // [-1, 0, 12, 1, 7, 2, 19]
   * ```
   */
  export function insert<T>(array: Array<T>, index: number, value: T): void {
    let n = array.length;
    if (index < 0) {
      index = Math.max(0, index + n);
    } else {
      index = Math.min(index, n);
    }
    for (let i = n; i > index; --i) {
      array[i] = array[i - 1];
    }
    array[index] = value;
  }

  /**
   * Remove and return a value at a specific index in an array.
   *
   * @param array - The array of interest.
   *
   * @param index - The index of the value to remove. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The value at the specified index, or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 12, 23, 39, 14, 12, 75];
   * ArrayExt.removeAt(data, 2);   // 23
   * ArrayExt.removeAt(data, -2);  // 12
   * ArrayExt.removeAt(data, 10);  // undefined;
   * ```
   */
  export function removeAt<T>(array: Array<T>, index: number): T | undefined {
    let n = array.length;
    if (index < 0) {
      index += n;
    }
    if (index < 0 || index >= n) {
      return undefined;
    }
    let value = array[index];
    for (let i = index + 1; i < n; ++i) {
      array[i - 1] = array[i];
    }
    array.length = n - 1;
    return value;
  }

  /**
   * Remove the first occurrence of a value from an array.
   *
   * @param array - The array of interest.
   *
   * @param value - The value to remove from the array. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the removed value, or `-1` if the value
   *   is not contained in the array.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 12, 23, 39, 14, 12, 75];
   * ArrayExt.removeFirstOf(data, 12);        // 1
   * ArrayExt.removeFirstOf(data, 17);        // -1
   * ArrayExt.removeFirstOf(data, 39, 3);     // -1
   * ArrayExt.removeFirstOf(data, 39, 3, 2);  // 2
   * ```
   */
  export function removeFirstOf<T>(
    array: Array<T>,
    value: T,
    start = 0,
    stop = -1
  ): number {
    let index = firstIndexOf(array, value, start, stop);
    if (index !== -1) {
      removeAt(array, index);
    }
    return index;
  }

  /**
   * Remove the last occurrence of a value from an array.
   *
   * @param array - The array of interest.
   *
   * @param value - The value to remove from the array. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The index of the removed value, or `-1` if the value
   *   is not contained in the array.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [0, 12, 23, 39, 14, 12, 75];
   * ArrayExt.removeLastOf(data, 12);        // 5
   * ArrayExt.removeLastOf(data, 17);        // -1
   * ArrayExt.removeLastOf(data, 39, 2);     // -1
   * ArrayExt.removeLastOf(data, 39, 2, 3);  // 3
   * ```
   */
  export function removeLastOf<T>(
    array: Array<T>,
    value: T,
    start = -1,
    stop = 0
  ): number {
    let index = lastIndexOf(array, value, start, stop);
    if (index !== -1) {
      removeAt(array, index);
    }
    return index;
  }

  /**
   * Remove all occurrences of a value from an array.
   *
   * @param array - The array of interest.
   *
   * @param value - The value to remove from the array. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The number of elements removed from the array.
   *
   * #### Notes
   * If `stop < start` the search will conceptually wrap at the end of
   * the array, however the array will be traversed front-to-back.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * let data = [14, 12, 23, 39, 14, 12, 19, 14];
   * ArrayExt.removeAllOf(data, 12);        // 2
   * ArrayExt.removeAllOf(data, 17);        // 0
   * ArrayExt.removeAllOf(data, 14, 1, 4);  // 1
   * ```
   */
  export function removeAllOf<T>(
    array: Array<T>,
    value: T,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return 0;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (start <= stop && i >= start && i <= stop && array[i] === value) {
        count++;
      } else if (
        stop < start &&
        (i <= stop || i >= start) &&
        array[i] === value
      ) {
        count++;
      } else if (count > 0) {
        array[i - count] = array[i];
      }
    }
    if (count > 0) {
      array.length = n - count;
    }
    return count;
  }

  /**
   * Remove the first occurrence of a value which matches a predicate.
   *
   * @param array - The array of interest.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The removed `{ index, value }`, which will be `-1` and
   *   `undefined` if the value is not contained in the array.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [0, 12, 23, 39, 14, 12, 75];
   * ArrayExt.removeFirstWhere(data, isEven);     // { index: 0, value: 0 }
   * ArrayExt.removeFirstWhere(data, isEven, 2);  // { index: 3, value: 14 }
   * ArrayExt.removeFirstWhere(data, isEven, 4);  // { index: -1, value: undefined }
   * ```
   */
  export function removeFirstWhere<T>(
    array: Array<T>,
    fn: (value: T, index: number) => boolean,
    start = 0,
    stop = -1
  ): { index: number; value: T | undefined } {
    let value: T | undefined;
    let index = findFirstIndex(array, fn, start, stop);
    if (index !== -1) {
      value = removeAt(array, index);
    }
    return { index, value };
  }

  /**
   * Remove the last occurrence of a value which matches a predicate.
   *
   * @param array - The array of interest.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The removed `{ index, value }`, which will be `-1` and
   *   `undefined` if the value is not contained in the array.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * let data = [0, 12, 23, 39, 14, 12, 75];
   * ArrayExt.removeLastWhere(data, isEven);        // { index: 5, value: 12 }
   * ArrayExt.removeLastWhere(data, isEven, 2);     // { index: 1, value: 12 }
   * ArrayExt.removeLastWhere(data, isEven, 2, 1);  // { index: -1, value: undefined }
   * ```
   */
  export function removeLastWhere<T>(
    array: Array<T>,
    fn: (value: T, index: number) => boolean,
    start = -1,
    stop = 0
  ): { index: number; value: T | undefined } {
    let value: T | undefined;
    let index = findLastIndex(array, fn, start, stop);
    if (index !== -1) {
      value = removeAt(array, index);
    }
    return { index, value };
  }

  /**
   * Remove all occurrences of values which match a predicate.
   *
   * @param array - The array of interest.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the array.
   *
   * @returns The number of elements removed from the array.
   *
   * #### Notes
   * If `stop < start` the search will conceptually wrap at the end of
   * the array, however the array will be traversed front-to-back.
   *
   * #### Complexity
   * Linear.
   *
   * #### Example
   * ```typescript
   * import { ArrayExt } from '@lumino/algorithm';
   *
   * function isEven(value: number): boolean {
   *   return value % 2 === 0;
   * }
   *
   * function isNegative(value: number): boolean {
   *   return value < 0;
   * }
   *
   * let data = [0, 12, -13, -9, 23, 39, 14, -15, 12, 75];
   * ArrayExt.removeAllWhere(data, isEven);            // 4
   * ArrayExt.removeAllWhere(data, isNegative, 0, 3);  // 2
   * ```
   */
  export function removeAllWhere<T>(
    array: Array<T>,
    fn: (value: T, index: number) => boolean,
    start = 0,
    stop = -1
  ): number {
    let n = array.length;
    if (n === 0) {
      return 0;
    }
    if (start < 0) {
      start = Math.max(0, start + n);
    } else {
      start = Math.min(start, n - 1);
    }
    if (stop < 0) {
      stop = Math.max(0, stop + n);
    } else {
      stop = Math.min(stop, n - 1);
    }
    let count = 0;
    for (let i = 0; i < n; ++i) {
      if (start <= stop && i >= start && i <= stop && fn(array[i], i)) {
        count++;
      } else if (stop < start && (i <= stop || i >= start) && fn(array[i], i)) {
        count++;
      } else if (count > 0) {
        array[i - count] = array[i];
      }
    }
    if (count > 0) {
      array.length = n - count;
    }
    return count;
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
 * Chain together several iterables.
 *
 * @deprecated
 *
 * @param objects - The iterable objects of interest.
 *
 * @returns An iterator which yields the values of the iterables
 *   in the order in which they are supplied.
 *
 * #### Example
 * ```typescript
 * import { chain } from '@lumino/algorithm';
 *
 * let data1 = [1, 2, 3];
 * let data2 = [4, 5, 6];
 *
 * let stream = chain(data1, data2);
 *
 * Array.from(stream);  // [1, 2, 3, 4, 5, 6]
 * ```
 */
export function* chain<T>(...objects: Iterable<T>[]): IterableIterator<T> {
  for (const object of objects) {
    yield* object;
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
 * Create an empty iterator.
 *
 * @deprecated
 *
 * @returns A new iterator which yields nothing.
 *
 * #### Example
 * ```typescript
 * import { empty } from '@lumino/algorithm';
 *
 * let stream = empty<number>();
 *
 * Array.from(stream);  // []
 * ```
 */
// eslint-disable-next-line require-yield
export function* empty<T>(): IterableIterator<T> {
  return;
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
 * Enumerate an iterable object.
 *
 * @param object - The iterable object of interest.
 *
 * @param start - The starting enum value. The default is `0`.
 *
 * @returns An iterator which yields the enumerated values.
 *
 * #### Example
 * ```typescript
 * import { enumerate } from '@lumino/algorithm';
 *
 * let data = ['foo', 'bar', 'baz'];
 *
 * let stream = enumerate(data, 1);
 *
 * Array.from(stream);  // [[1, 'foo'], [2, 'bar'], [3, 'baz']]
 * ```
 */
export function* enumerate<T>(
  object: Iterable<T>,
  start = 0
): IterableIterator<[number, T]> {
  for (const value of object) {
    yield [start++, value];
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
 * Filter an iterable for values which pass a test.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns An iterator which yields the values which pass the test.
 *
 * #### Example
 * ```typescript
 * import { filter } from '@lumino/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = filter(data, value => value % 2 === 0);
 *
 * Array.from(stream);  // [2, 4, 6]
 * ```
 */
export function* filter<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): IterableIterator<T> {
  let index = 0;
  for (const value of object) {
    if (fn(value, index++)) {
      yield value;
    }
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
 * Find the first value in an iterable which matches a predicate.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @returns The first matching value, or `undefined` if no matching
 *   value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { find } from '@lumino/algorithm';
 *
 * interface IAnimal { species: string, name: string };
 *
 * function isCat(value: IAnimal): boolean {
 *   return value.species === 'cat';
 * }
 *
 * let data: IAnimal[] = [
 *   { species: 'dog', name: 'spot' },
 *   { species: 'cat', name: 'fluffy' },
 *   { species: 'alligator', name: 'pocho' }
 * ];
 *
 * find(data, isCat).name;  // 'fluffy'
 * ```
 */
export function find<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): T | undefined {
  let index = 0;
  for (const value of object) {
    if (fn(value, index++)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Find the index of the first value which matches a predicate.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @returns The index of the first matching value, or `-1` if no
 *   matching value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { findIndex } from '@lumino/algorithm';
 *
 * interface IAnimal { species: string, name: string };
 *
 * function isCat(value: IAnimal): boolean {
 *   return value.species === 'cat';
 * }
 *
 * let data: IAnimal[] = [
 *   { species: 'dog', name: 'spot' },
 *   { species: 'cat', name: 'fluffy' },
 *   { species: 'alligator', name: 'pocho' }
 * ];
 *
 * findIndex(data, isCat);  // 1
 * ```
 */
export function findIndex<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): number {
  let index = 0;
  for (const value of object) {
    if (fn(value, index++)) {
      return index - 1;
    }
  }
  return -1;
}

/**
 * Find the minimum value in an iterable.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns The minimum value in the iterable. If multiple values are
 *   equivalent to the minimum, the left-most value is returned. If
 *   the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { min } from '@lumino/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * min([7, 4, 0, 3, 9, 4], numberCmp);  // 0
 * ```
 */
export function min<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): T | undefined {
  let result: T | undefined = undefined;
  for (const value of object) {
    if (result === undefined) {
      result = value;
      continue;
    }
    if (fn(value, result) < 0) {
      result = value;
    }
  }
  return result;
}

/**
 * Find the maximum value in an iterable.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns The maximum value in the iterable. If multiple values are
 *   equivalent to the maximum, the left-most value is returned. If
 *   the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { max } from '@lumino/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * max([7, 4, 0, 3, 9, 4], numberCmp);  // 9
 * ```
 */
export function max<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): T | undefined {
  let result: T | undefined = undefined;
  for (const value of object) {
    if (result === undefined) {
      result = value;
      continue;
    }
    if (fn(value, result) > 0) {
      result = value;
    }
  }
  return result;
}

/**
 * Find the minimum and maximum values in an iterable.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns A 2-tuple of the `[min, max]` values in the iterable. If
 *   multiple values are equivalent, the left-most values are returned.
 *   If the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { minmax } from '@lumino/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * minmax([7, 4, 0, 3, 9, 4], numberCmp);  // [0, 9]
 * ```
 */
export function minmax<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): [T, T] | undefined {
  let empty = true;
  let vmin: T;
  let vmax: T;
  for (const value of object) {
    if (empty) {
      vmin = value;
      vmax = value;
      empty = false;
    } else if (fn(value, vmin!) < 0) {
      vmin = value;
    } else if (fn(value, vmax!) > 0) {
      vmax = value;
    }
  }
  return empty ? undefined : [vmin!, vmax!];
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
export * from './array';
export * from './chain';
export * from './empty';
export * from './enumerate';
export * from './filter';
export * from './find';
export * from './iter';
export * from './map';
export * from './range';
export * from './reduce';
export * from './repeat';
export * from './retro';
export * from './sort';
export * from './stride';
export * from './string';
export * from './take';
export * from './zip';
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
 * Create an array from an iterable of values.
 *
 * @deprecated
 *
 * @param object - The iterable object of interest.
 *
 * @returns A new array of values from the given object.
 *
 * #### Example
 * ```typescript
 * import { toArray } from '@lumino/algorithm';
 *
 * let stream = [1, 2, 3, 4, 5, 6][Symbol.iterator]();
 *
 * toArray(stream);  // [1, 2, 3, 4, 5, 6];
 * ```
 */
export function toArray<T>(object: Iterable<T>): T[] {
  return Array.from(object);
}

/**
 * Create an object from an iterable of key/value pairs.
 *
 * @param object - The iterable object of interest.
 *
 * @returns A new object mapping keys to values.
 *
 * #### Example
 * ```typescript
 * import { toObject } from '@lumino/algorithm';
 *
 * let data: [string, number][] = [['one', 1], ['two', 2], ['three', 3]];
 *
 * toObject(data);  // { one: 1, two: 2, three: 3 }
 * ```
 */
export function toObject<T>(object: Iterable<[string, T]>): {
  [key: string]: T;
} {
  const result: { [key: string]: T } = {};
  for (const [key, value] of object) {
    result[key] = value;
  }
  return result;
}

/**
 * Invoke a function for each value in an iterable.
 *
 * @deprecated
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The callback function to invoke for each value.
 *
 * #### Notes
 * Iteration can be terminated early by returning `false` from the
 * callback function.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { each } from '@lumino/algorithm';
 *
 * let data = [5, 7, 0, -2, 9];
 *
 * each(data, value => { console.log(value); });
 * ```
 */
export function each<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean | void
): void {
  let index = 0;
  for (const value of object) {
    if (false === fn(value, index++)) {
      return;
    }
  }
}

/**
 * Test whether all values in an iterable satisfy a predicate.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if all values pass the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `false` predicate result.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { every } from '@lumino/algorithm';
 *
 * let data = [5, 7, 1];
 *
 * every(data, value => value % 2 === 0);  // false
 * every(data, value => value % 2 === 1);  // true
 * ```
 */
export function every<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): boolean {
  let index = 0;
  for (const value of object) {
    if (false === fn(value, index++)) {
      return false;
    }
  }
  return true;
}

/**
 * Test whether any value in an iterable satisfies a predicate.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if any value passes the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `true` predicate result.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { some } from '@lumino/algorithm';
 *
 * let data = [5, 7, 1];
 *
 * some(data, value => value === 7);  // true
 * some(data, value => value === 3);  // false
 * ```
 */
export function some<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): boolean {
  let index = 0;
  for (const value of object) {
    if (fn(value, index++)) {
      return true;
    }
  }
  return false;
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
 * Transform the values of an iterable with a mapping function.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The mapping function to invoke for each value.
 *
 * @returns An iterator which yields the transformed values.
 *
 * #### Example
 * ```typescript
 * import { map } from '@lumino/algorithm';
 *
 * let data = [1, 2, 3];
 *
 * let stream = map(data, value => value * 2);
 *
 * Array.from(stream);  // [2, 4, 6]
 * ```
 */
export function* map<T, U>(
  object: Iterable<T>,
  fn: (value: T, index: number) => U
): IterableIterator<U> {
  let index = 0;
  for (const value of object) {
    yield fn(value, index++);
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
 * Create an iterator of evenly spaced values.
 *
 * @param start - The starting value for the range, inclusive.
 *
 * @param stop - The stopping value for the range, exclusive.
 *
 * @param step - The distance between each value.
 *
 * @returns An iterator which produces evenly spaced values.
 *
 * #### Notes
 * In the single argument form of `range(stop)`, `start` defaults to
 * `0` and `step` defaults to `1`.
 *
 * In the two argument form of `range(start, stop)`, `step` defaults
 * to `1`.
 *
 * #### Example
 * ```typescript
 * import { range } from '@lumino/algorithm';
 *
 * let stream = range(2, 4);
 *
 * Array.from(stream);  // [2, 3]
 * ```
 */
export function* range(
  start: number,
  stop?: number,
  step?: number
): IterableIterator<number> {
  if (stop === undefined) {
    stop = start;
    start = 0;
    step = 1;
  } else if (step === undefined) {
    step = 1;
  }
  const length = Private.rangeLength(start, stop, step);
  for (let index = 0; index < length; index++) {
    yield start + step * index;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Compute the effective length of a range.
   *
   * @param start - The starting value for the range, inclusive.
   *
   * @param stop - The stopping value for the range, exclusive.
   *
   * @param step - The distance between each value.
   *
   * @returns The number of steps need to traverse the range.
   */
  export function rangeLength(
    start: number,
    stop: number,
    step: number
  ): number {
    if (step === 0) {
      return Infinity;
    }
    if (start > stop && step > 0) {
      return 0;
    }
    if (start < stop && step < 0) {
      return 0;
    }
    return Math.ceil((stop - start) / step);
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
 * Summarize all values in an iterable using a reducer function.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The reducer function to invoke for each value.
 *
 * @param initial - The initial value to start accumulation.
 *
 * @returns The final accumulated value.
 *
 * #### Notes
 * The `reduce` function follows the conventions of `Array#reduce`.
 *
 * If the iterator is empty, an initial value is required. That value
 * will be used as the return value. If no initial value is provided,
 * an error will be thrown.
 *
 * If the iterator contains a single item and no initial value is
 * provided, the single item is used as the return value.
 *
 * Otherwise, the reducer is invoked for each element in the iterable.
 * If an initial value is not provided, the first element will be used
 * as the initial accumulated value.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { reduce } from '@lumino/algorithm';
 *
 * let data = [1, 2, 3, 4, 5];
 *
 * let sum = reduce(data, (a, value) => a + value);  // 15
 * ```
 */
export function reduce<T>(
  object: Iterable<T>,
  fn: (accumulator: T, value: T, index: number) => T
): T;
export function reduce<T, U>(
  object: Iterable<T>,
  fn: (accumulator: U, value: T, index: number) => U,
  initial: U
): U;
export function reduce<T>(
  object: Iterable<T>,
  fn: (accumulator: any, value: T, index: number) => any,
  initial?: unknown
): any {
  // Setup the iterator and fetch the first value.
  const it = object[Symbol.iterator]();
  let index = 0;
  let first = it.next();

  // An empty iterator and no initial value is an error.
  if (first.done && initial === undefined) {
    throw new TypeError('Reduce of empty iterable with no initial value.');
  }

  // If the iterator is empty, return the initial value.
  if (first.done) {
    return initial;
  }

  // If the iterator has a single item and no initial value, the
  // reducer is not invoked and the first item is the return value.
  let second = it.next();
  if (second.done && initial === undefined) {
    return first.value;
  }

  // If iterator has a single item and an initial value is provided,
  // the reducer is invoked and that result is the return value.
  if (second.done) {
    return fn(initial, first.value, index++);
  }

  // Setup the initial accumlated value.
  let accumulator: any;
  if (initial === undefined) {
    accumulator = fn(first.value, second.value, index++);
  } else {
    accumulator = fn(fn(initial, first.value, index++), second.value, index++);
  }

  // Iterate the rest of the values, updating the accumulator.
  let next: IteratorResult<T>;
  while (!(next = it.next()).done) {
    accumulator = fn(accumulator, next.value, index++);
  }

  // Return the final accumulated value.
  return accumulator;
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
 * Create an iterator which repeats a value a number of times.
 *
 * @deprecated
 *
 * @param value - The value to repeat.
 *
 * @param count - The number of times to repeat the value.
 *
 * @returns A new iterator which repeats the specified value.
 *
 * #### Example
 * ```typescript
 * import { repeat } from '@lumino/algorithm';
 *
 * let stream = repeat(7, 3);
 *
 * Array.from(stream);  // [7, 7, 7]
 * ```
 */
export function* repeat<T>(value: T, count: number): IterableIterator<T> {
  while (0 < count--) {
    yield value;
  }
}

/**
 * Create an iterator which yields a value a single time.
 *
 * @deprecated
 *
 * @param value - The value to wrap in an iterator.
 *
 * @returns A new iterator which yields the value a single time.
 *
 * #### Example
 * ```typescript
 * import { once } from '@lumino/algorithm';
 *
 * let stream = once(7);
 *
 * Array.from(stream);  // [7]
 * ```
 */
export function* once<T>(value: T): IterableIterator<T> {
  yield value;
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
 * An object which can produce a reverse iterator over its values.
 */
export interface IRetroable<T> {
  /**
   * Get a reverse iterator over the object's values.
   *
   * @returns An iterator which yields the object's values in reverse.
   */
  retro(): IterableIterator<T>;
}

/**
 * Create an iterator for a retroable object.
 *
 * @param object - The retroable or array-like object of interest.
 *
 * @returns An iterator which traverses the object's values in reverse.
 *
 * #### Example
 * ```typescript
 * import { retro } from '@lumino/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = retro(data);
 *
 * Array.from(stream);  // [6, 5, 4, 3, 2, 1]
 * ```
 */
export function* retro<T>(
  object: IRetroable<T> | ArrayLike<T>
): IterableIterator<T> {
  if (typeof (object as IRetroable<T>).retro === 'function') {
    yield* (object as IRetroable<T>).retro();
  } else {
    for (let index = (object as ArrayLike<T>).length - 1; index > -1; index--) {
      yield (object as ArrayLike<T>)[index];
    }
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
 * Topologically sort an iterable of edges.
 *
 * @param edges - The iterable object of edges to sort.
 *   An edge is represented as a 2-tuple of `[fromNode, toNode]`.
 *
 * @returns The topologically sorted array of nodes.
 *
 * #### Notes
 * If a cycle is present in the graph, the cycle will be ignored and
 * the return value will be only approximately sorted.
 *
 * #### Example
 * ```typescript
 * import { topologicSort } from '@lumino/algorithm';
 *
 * let data = [
 *   ['d', 'e'],
 *   ['c', 'd'],
 *   ['a', 'b'],
 *   ['b', 'c']
 * ];
 *
 * topologicSort(data);  // ['a', 'b', 'c', 'd', 'e']
 * ```
 */
export function topologicSort<T>(edges: Iterable<[T, T]>): T[] {
  // Setup the shared sorting state.
  let sorted: T[] = [];
  let visited = new Set<T>();
  let graph = new Map<T, T[]>();

  // Add the edges to the graph.
  for (const edge of edges) {
    addEdge(edge);
  }

  // Visit each node in the graph.
  for (const [k] of graph) {
    visit(k);
  }

  // Return the sorted results.
  return sorted;

  // Add an edge to the graph.
  function addEdge(edge: [T, T]): void {
    let [fromNode, toNode] = edge;
    let children = graph.get(toNode);
    if (children) {
      children.push(fromNode);
    } else {
      graph.set(toNode, [fromNode]);
    }
  }

  // Recursively visit the node.
  function visit(node: T): void {
    if (visited.has(node)) {
      return;
    }
    visited.add(node);
    let children = graph.get(node);
    if (children) {
      for (const child of children) {
        visit(child);
      }
    }
    sorted.push(node);
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
 * Iterate over an iterable using a stepped increment.
 *
 * @param object - The iterable object of interest.
 *
 * @param step - The distance to step on each iteration. A value
 *   of less than `1` will behave the same as a value of `1`.
 *
 * @returns An iterator which traverses the iterable step-wise.
 *
 * #### Example
 * ```typescript
 * import { stride } from '@lumino/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = stride(data, 2);
 *
 * Array.from(stream);  // [1, 3, 5];
 * ```
 */
export function* stride<T>(
  object: Iterable<T>,
  step: number
): IterableIterator<T> {
  let count = 0;
  for (const value of object) {
    if (0 === count++ % step) {
      yield value;
    }
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
 * The namespace for string-specific algorithms.
 */
export namespace StringExt {
  /**
   * Find the indices of characters in a source text.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @param start - The index to start the search.
   *
   * @returns The matched indices, or `null` if there is no match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * In order for there to be a match, all of the characters in `query`
   * **must** appear in `source` in the order given by `query`.
   *
   * Characters are matched using strict `===` equality.
   */
  export function findIndices(
    source: string,
    query: string,
    start = 0
  ): number[] | null {
    let indices = new Array<number>(query.length);
    for (let i = 0, j = start, n = query.length; i < n; ++i, ++j) {
      j = source.indexOf(query[i], j);
      if (j === -1) {
        return null;
      }
      indices[i] = j;
    }
    return indices;
  }

  /**
   * The result of a string match function.
   */
  export interface IMatchResult {
    /**
     * A score which indicates the strength of the match.
     *
     * The documentation of a given match function should specify
     * whether a lower or higher score is a stronger match.
     */
    score: number;

    /**
     * The indices of the matched characters in the source text.
     *
     * The indices will appear in increasing order.
     */
    indices: number[];
  }

  /**
   * A string matcher which uses a sum-of-squares algorithm.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @param start - The index to start the search.
   *
   * @returns The match result, or `null` if there is no match.
   *   A lower `score` represents a stronger match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-squares approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `query` **must** appear in `source` in order. The index of each
   * matching character is squared and added to the score. This means
   * that early and consecutive character matches are preferred, while
   * late matches are heavily penalized.
   */
  export function matchSumOfSquares(
    source: string,
    query: string,
    start = 0
  ): IMatchResult | null {
    let indices = findIndices(source, query, start);
    if (!indices) {
      return null;
    }
    let score = 0;
    for (let i = 0, n = indices.length; i < n; ++i) {
      let j = indices[i] - start;
      score += j * j;
    }
    return { score, indices };
  }

  /**
   * A string matcher which uses a sum-of-deltas algorithm.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @param start - The index to start the search.
   *
   * @returns The match result, or `null` if there is no match.
   *   A lower `score` represents a stronger match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-deltas approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `query` **must** appear in `source` in order. The delta between
   * the indices are summed to create the score. This means that groups
   * of matched characters are preferred, while fragmented matches are
   * penalized.
   */
  export function matchSumOfDeltas(
    source: string,
    query: string,
    start = 0
  ): IMatchResult | null {
    let indices = findIndices(source, query, start);
    if (!indices) {
      return null;
    }
    let score = 0;
    let last = start - 1;
    for (let i = 0, n = indices.length; i < n; ++i) {
      let j = indices[i];
      score += j - last - 1;
      last = j;
    }
    return { score, indices };
  }

  /**
   * Highlight the matched characters of a source text.
   *
   * @param source - The text which should be highlighted.
   *
   * @param indices - The indices of the matched characters. They must
   *   appear in increasing order and must be in bounds of the source.
   *
   * @param fn - The function to apply to the matched chunks.
   *
   * @returns An array of unmatched and highlighted chunks.
   */
  export function highlight<T>(
    source: string,
    indices: ReadonlyArray<number>,
    fn: (chunk: string) => T
  ): Array<string | T> {
    // Set up the result array.
    let result: Array<string | T> = [];

    // Set up the counter variables.
    let k = 0;
    let last = 0;
    let n = indices.length;

    // Iterator over each index.
    while (k < n) {
      // Set up the chunk indices.
      let i = indices[k];
      let j = indices[k];

      // Advance the right chunk index until it's non-contiguous.
      while (++k < n && indices[k] === j + 1) {
        j++;
      }

      // Extract the unmatched text.
      if (last < i) {
        result.push(source.slice(last, i));
      }

      // Extract and highlight the matched text.
      if (i < j + 1) {
        result.push(fn(source.slice(i, j + 1)));
      }

      // Update the last visited index.
      last = j + 1;
    }

    // Extract any remaining unmatched text.
    if (last < source.length) {
      result.push(source.slice(last));
    }

    // Return the highlighted result.
    return result;
  }

  /**
   * A 3-way string comparison function.
   *
   * @param a - The first string of interest.
   *
   * @param b - The second string of interest.
   *
   * @returns `-1` if `a < b`, else `1` if `a > b`, else `0`.
   */
  export function cmp(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
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
 * Take a fixed number of items from an iterable.
 *
 * @param object - The iterable object of interest.
 *
 * @param count - The number of items to take from the iterable.
 *
 * @returns An iterator which yields the specified number of items
 *   from the source iterable.
 *
 * #### Notes
 * The returned iterator will exhaust early if the source iterable
 * contains an insufficient number of items.
 *
 * #### Example
 * ```typescript
 * import { take } from '@lumino/algorithm';
 *
 * let stream = take([5, 4, 3, 2, 1, 0, -1], 3);
 *
 * Array.from(stream);  // [5, 4, 3]
 * ```
 */
export function* take<T>(
  object: Iterable<T>,
  count: number
): IterableIterator<T> {
  if (count < 1) {
    return;
  }
  const it = object[Symbol.iterator]();
  let item: IteratorResult<T>;
  while (0 < count-- && !(item = it.next()).done) {
    yield item.value;
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
import { every } from './iter';

/**
 * Iterate several iterables in lockstep.
 *
 * @param objects - The iterable objects of interest.
 *
 * @returns An iterator which yields successive tuples of values where
 *   each value is taken in turn from the provided iterables. It will
 *   be as long as the shortest provided iterable.
 *
 * #### Example
 * ```typescript
 * import { zip } from '@lumino/algorithm';
 *
 * let data1 = [1, 2, 3];
 * let data2 = [4, 5, 6];
 *
 * let stream = zip(data1, data2);
 *
 * Array.from(stream);  // [[1, 4], [2, 5], [3, 6]]
 * ```
 */
export function* zip<T>(...objects: Iterable<T>[]): IterableIterator<T[]> {
  const iters = objects.map(obj => obj[Symbol.iterator]());
  let tuple = iters.map(it => it.next());
  for (; every(tuple, item => !item.done); tuple = iters.map(it => it.next())) {
    yield tuple.map(item => item.value);
  }
}
