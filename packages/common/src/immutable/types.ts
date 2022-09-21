/* eslint-disable @typescript-eslint/no-namespace */
export interface List<T> extends Collection.Indexed<T> {
  readonly size: number
  set(index: number, value: T): List<T>
  delete(index: number): List<T>
  remove(index: number): List<T>
  insert(index: number, value: T): List<T>
  clear(): List<T>
  push(...values: Array<T>): List<T>
  pop(): List<T>
  unshift(...values: Array<T>): List<T>
  shift(): List<T>
  update(index: number, notSetValue: T, updater: (value: T) => T): this
  update(index: number, updater: (value: T | undefined) => T): this
  update<R>(updater: (value: this) => R): R
  setSize(size: number): List<T>
  setIn(keyPath: Iterable<unknown>, value: unknown): this
  deleteIn(keyPath: Iterable<unknown>): this
  removeIn(keyPath: Iterable<unknown>): this
  updateIn(
    keyPath: Iterable<unknown>,
    notSetValue: unknown,
    updater: (value: unknown) => unknown
  ): this
  updateIn(
    keyPath: Iterable<unknown>,
    updater: (value: unknown) => unknown
  ): this
  mergeIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  mergeDeepIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  withMutations(mutator: (mutable: this) => unknown): this
  asMutable(): this
  wasAltered(): boolean
  asImmutable(): this
  concat<C>(...valuesOrCollections: Array<Iterable<C> | C>): List<T | C>
  merge<C>(...collections: Array<Iterable<C>>): List<T | C>
  map<M>(
    mapper: (value: T, key: number, iter: this) => M,
    context?: unknown
  ): List<M>
  flatMap<M>(
    mapper: (value: T, key: number, iter: this) => Iterable<M>,
    context?: unknown
  ): List<M>
  filter<F extends T>(
    predicate: (value: T, index: number, iter: this) => value is F,
    context?: unknown
  ): List<F>
  filter(
    predicate: (value: T, index: number, iter: this) => unknown,
    context?: unknown
  ): this
  zip<U>(other: Collection<unknown, U>): List<[T, U]>
  zip<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): List<[T, U, V]>
  zip(...collections: Array<Collection<unknown, unknown>>): List<unknown>
  zipAll<U>(other: Collection<unknown, U>): List<[T, U]>
  zipAll<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): List<[T, U, V]>
  zipAll(...collections: Array<Collection<unknown, unknown>>): List<unknown>
  zipWith<U, Z>(
    zipper: (value: T, otherValue: U) => Z,
    otherCollection: Collection<unknown, U>
  ): List<Z>
  zipWith<U, V, Z>(
    zipper: (value: T, otherValue: U, thirdValue: V) => Z,
    otherCollection: Collection<unknown, U>,
    thirdCollection: Collection<unknown, V>
  ): List<Z>
  zipWith<Z>(
    zipper: (...values: Array<unknown>) => Z,
    ...collections: Array<Collection<unknown, unknown>>
  ): List<Z>
}
namespace List {
  function isList(maybeList: unknown): maybeList is List<unknown>
  function of<T>(...values: Array<T>): List<T>
}
function List<T>(collection?: Iterable<T> | ArrayLike<T>): List<T>
namespace Map {
  function isMap(maybeMap: unknown): maybeMap is Map<unknown, unknown>
  function of(...keyValues: Array<unknown>): Map<unknown, unknown>
}
function Map<K, V>(collection?: Iterable<[K, V]>): Map<K, V>
function Map<V>(obj: { [key: string]: V }): Map<string, V>
function Map<K extends string | symbol, V>(obj: { [P in K]?: V }): Map<K, V>

interface Map<K, V> extends Collection.Keyed<K, V> {
  readonly size: number
  set(key: K, value: V): this
  delete(key: K): this
  remove(key: K): this
  deleteAll(keys: Iterable<K>): this
  removeAll(keys: Iterable<K>): this
  clear(): this
  update(key: K, notSetValue: V, updater: (value: V) => V): this
  update(key: K, updater: (value: V | undefined) => V): this
  update<R>(updater: (value: this) => R): R
  merge<KC, VC>(...collections: Array<Iterable<[KC, VC]>>): Map<K | KC, V | VC>
  merge<C>(...collections: Array<{ [key: string]: C }>): Map<K | string, V | C>
  concat<KC, VC>(...collections: Array<Iterable<[KC, VC]>>): Map<K | KC, V | VC>
  concat<C>(...collections: Array<{ [key: string]: C }>): Map<K | string, V | C>
  mergeWith(
    merger: (oldVal: V, newVal: V, key: K) => V,
    ...collections: Array<Iterable<[K, V]> | { [key: string]: V }>
  ): this
  mergeDeep(
    ...collections: Array<Iterable<[K, V]> | { [key: string]: V }>
  ): this
  mergeDeepWith(
    merger: (oldVal: unknown, newVal: unknown, key: unknown) => unknown,
    ...collections: Array<Iterable<[K, V]> | { [key: string]: V }>
  ): this
  setIn(keyPath: Iterable<unknown>, value: unknown): this
  deleteIn(keyPath: Iterable<unknown>): this
  removeIn(keyPath: Iterable<unknown>): this
  updateIn(
    keyPath: Iterable<unknown>,
    notSetValue: unknown,
    updater: (value: unknown) => unknown
  ): this
  updateIn(
    keyPath: Iterable<unknown>,
    updater: (value: unknown) => unknown
  ): this
  mergeIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  mergeDeepIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  withMutations(mutator: (mutable: this) => unknown): this
  asMutable(): this
  wasAltered(): boolean
  asImmutable(): this
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Map<K, M>
  mapKeys<M>(
    mapper: (key: K, value: V, iter: this) => M,
    context?: unknown
  ): Map<M, V>
  mapEntries<KM, VM>(
    mapper: (entry: [K, V], index: number, iter: this) => [KM, VM] | undefined,
    context?: unknown
  ): Map<KM, VM>
  flatMap<KM, VM>(
    mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
    context?: unknown
  ): Map<KM, VM>
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): Map<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
  flip(): Map<V, K>
}
namespace OrderedMap {
  function isOrderedMap(
    maybeOrderedMap: unknown
  ): maybeOrderedMap is OrderedMap<unknown, unknown>
}
function OrderedMap<K, V>(collection?: Iterable<[K, V]>): OrderedMap<K, V>
function OrderedMap<V>(obj: { [key: string]: V }): OrderedMap<string, V>
interface OrderedMap<K, V> extends Map<K, V> {
  /**
   * The number of entries in this OrderedMap.
   */
  readonly size: number
  /**
   * Returns a new OrderedMap also containing the new key, value pair. If an
   * equivalent key already exists in this OrderedMap, it will be replaced
   * while maintaining the existing order.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { OrderedMap } = require('immutable')
   * const originalMap = OrderedMap({a:1, b:1, c:1})
   * const updatedMap = originalMap.set('b', 2)
   *
   * originalMap
   * // OrderedMap {a: 1, b: 1, c: 1}
   * updatedMap
   * // OrderedMap {a: 1, b: 2, c: 1}
   * ```
   *
   * Note: `set` can be used in `withMutations`.
   */
  set(key: K, value: V): this
  /**
   * Returns a new OrderedMap resulting from merging the provided Collections
   * (or JS objects) into this OrderedMap. In other words, this takes each
   * entry of each collection and sets it on this OrderedMap.
   *
   * Note: Values provided to `merge` are shallowly converted before being
   * merged. No nested values are altered.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { OrderedMap } = require('immutable')
   * const one = OrderedMap({ a: 10, b: 20, c: 30 })
   * const two = OrderedMap({ b: 40, a: 50, d: 60 })
   * one.merge(two) // OrderedMap { "a": 50, "b": 40, "c": 30, "d": 60 }
   * two.merge(one) // OrderedMap { "b": 20, "a": 10, "d": 60, "c": 30 }
   * ```
   *
   * Note: `merge` can be used in `withMutations`.
   *
   * @alias concat
   */
  merge<KC, VC>(
    ...collections: Array<Iterable<[KC, VC]>>
  ): OrderedMap<K | KC, V | VC>
  merge<C>(
    ...collections: Array<{ [key: string]: C }>
  ): OrderedMap<K | string, V | C>
  concat<KC, VC>(
    ...collections: Array<Iterable<[KC, VC]>>
  ): OrderedMap<K | KC, V | VC>
  concat<C>(
    ...collections: Array<{ [key: string]: C }>
  ): OrderedMap<K | string, V | C>
  // Sequence algorithms
  /**
   * Returns a new OrderedMap with values passed through a
   * `mapper` function.
   *
   *     OrderedMap({ a: 1, b: 2 }).map(x => 10 * x)
   *     // OrderedMap { "a": 10, "b": 20 }
   *
   * Note: `map()` always returns a new instance, even if it produced the same
   * value at every step.
   */
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): OrderedMap<K, M>
  /**
   * @see Collection.Keyed.mapKeys
   */
  mapKeys<M>(
    mapper: (key: K, value: V, iter: this) => M,
    context?: unknown
  ): OrderedMap<M, V>
  /**
   * @see Collection.Keyed.mapEntries
   */
  mapEntries<KM, VM>(
    mapper: (entry: [K, V], index: number, iter: this) => [KM, VM] | undefined,
    context?: unknown
  ): OrderedMap<KM, VM>
  /**
   * Flat-maps the OrderedMap, returning a new OrderedMap.
   *
   * Similar to `data.map(...).flatten(true)`.
   */
  flatMap<KM, VM>(
    mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
    context?: unknown
  ): OrderedMap<KM, VM>
  /**
   * Returns a new OrderedMap with only the entries for which the `predicate`
   * function returns true.
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): OrderedMap<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
  /**
   * @see Collection.Keyed.flip
   */
  flip(): OrderedMap<V, K>
}
namespace Set {
  function isSet(maybeSet: unknown): maybeSet is Set<unknown>
  function of<T>(...values: Array<T>): Set<T>
  function fromKeys<T>(iter: Collection<T, unknown>): Set<T>
  function fromKeys(obj: { [key: string]: unknown }): Set<string>
  function intersect<T>(sets: Iterable<Iterable<T>>): Set<T>
  function union<T>(sets: Iterable<Iterable<T>>): Set<T>
}
function Set<T>(collection?: Iterable<T> | ArrayLike<T>): Set<T>
interface Set<T> extends Collection.Set<T> {
  /**
   * The number of items in this Set.
   */
  readonly size: number
  // Persistent changes
  /**
   * Returns a new Set which also includes this value.
   *
   * Note: `add` can be used in `withMutations`.
   */
  add(value: T): this
  /**
   * Returns a new Set which excludes this value.
   *
   * Note: `delete` can be used in `withMutations`.
   *
   * Note: `delete` **cannot** be safely used in IE8, use `remove` if
   * supporting old browsers.
   *
   * @alias remove
   */
  delete(value: T): this
  remove(value: T): this
  /**
   * Returns a new Set containing no values.
   *
   * Note: `clear` can be used in `withMutations`.
   */
  clear(): this
  /**
   * Returns a Set including any value from `collections` that does not already
   * exist in this Set.
   *
   * Note: `union` can be used in `withMutations`.
   * @alias merge
   * @alias concat
   */
  union<C>(...collections: Array<Iterable<C>>): Set<T | C>
  merge<C>(...collections: Array<Iterable<C>>): Set<T | C>
  concat<C>(...collections: Array<Iterable<C>>): Set<T | C>
  /**
   * Returns a Set which has removed any values not also contained
   * within `collections`.
   *
   * Note: `intersect` can be used in `withMutations`.
   */
  intersect(...collections: Array<Iterable<T>>): this
  /**
   * Returns a Set excluding any values contained within `collections`.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { OrderedSet } = require('immutable')
   * OrderedSet([ 1, 2, 3 ]).subtract([1, 3])
   * // OrderedSet [2]
   * ```
   *
   * Note: `subtract` can be used in `withMutations`.
   */
  subtract(...collections: Array<Iterable<T>>): this
  // Transient changes
  /**
   * Note: Not all methods can be used on a mutable collection or within
   * `withMutations`! Check the documentation for each method to see if it
   * mentions being safe to use in `withMutations`.
   *
   * @see `Map#withMutations`
   */
  withMutations(mutator: (mutable: this) => unknown): this
  /**
   * Note: Not all methods can be used on a mutable collection or within
   * `withMutations`! Check the documentation for each method to see if it
   * mentions being safe to use in `withMutations`.
   *
   * @see `Map#asMutable`
   */
  asMutable(): this
  /**
   * @see `Map#wasAltered`
   */
  wasAltered(): boolean
  /**
   * @see `Map#asImmutable`
   */
  asImmutable(): this
  // Sequence algorithms
  /**
   * Returns a new Set with values passed through a
   * `mapper` function.
   *
   *     Set([1,2]).map(x => 10 * x)
   *     // Set [10,20]
   */
  map<M>(mapper: (value: T, key: T, iter: this) => M, context?: unknown): Set<M>
  /**
   * Flat-maps the Set, returning a new Set.
   *
   * Similar to `set.map(...).flatten(true)`.
   */
  flatMap<M>(
    mapper: (value: T, key: T, iter: this) => Iterable<M>,
    context?: unknown
  ): Set<M>
  /**
   * Returns a new Set with only the values for which the `predicate`
   * function returns true.
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends T>(
    predicate: (value: T, key: T, iter: this) => value is F,
    context?: unknown
  ): Set<F>
  filter(
    predicate: (value: T, key: T, iter: this) => unknown,
    context?: unknown
  ): this
}
namespace OrderedSet {
  function isOrderedSet(maybeOrderedSet: unknown): boolean
  function of<T>(...values: Array<T>): OrderedSet<T>
  function fromKeys<T>(iter: Collection<T, unknown>): OrderedSet<T>
  function fromKeys(obj: { [key: string]: unknown }): OrderedSet<string>
}
function OrderedSet<T>(collection?: Iterable<T> | ArrayLike<T>): OrderedSet<T>
interface OrderedSet<T> extends Set<T> {
  /**
   * The number of items in this OrderedSet.
   */
  readonly size: number
  /**
   * Returns an OrderedSet including any value from `collections` that does
   * not already exist in this OrderedSet.
   *
   * Note: `union` can be used in `withMutations`.
   * @alias merge
   * @alias concat
   */
  union<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  merge<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  concat<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  // Sequence algorithms
  /**
   * Returns a new Set with values passed through a
   * `mapper` function.
   *
   *     OrderedSet([ 1, 2 ]).map(x => 10 * x)
   *     // OrderedSet [10, 20]
   */
  map<M>(
    mapper: (value: T, key: T, iter: this) => M,
    context?: unknown
  ): OrderedSet<M>
  /**
   * Flat-maps the OrderedSet, returning a new OrderedSet.
   *
   * Similar to `set.map(...).flatten(true)`.
   */
  flatMap<M>(
    mapper: (value: T, key: T, iter: this) => Iterable<M>,
    context?: unknown
  ): OrderedSet<M>
  /**
   * Returns a new OrderedSet with only the values for which the `predicate`
   * function returns true.
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends T>(
    predicate: (value: T, key: T, iter: this) => value is F,
    context?: unknown
  ): OrderedSet<F>
  filter(
    predicate: (value: T, key: T, iter: this) => unknown,
    context?: unknown
  ): this
  /**
   * Returns an OrderedSet of the same type "zipped" with the provided
   * collections.
   *
   * Like `zipWith`, but using the default `zipper`: creating an `Array`.
   *
   * ```js
   * const a = OrderedSet([ 1, 2, 3 ])
   * const b = OrderedSet([ 4, 5, 6 ])
   * const c = a.zip(b)
   * // OrderedSet [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
   * ```
   */
  zip<U>(other: Collection<unknown, U>): OrderedSet<[T, U]>
  zip<U, V>(
    other1: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): OrderedSet<[T, U, V]>
  zip(...collections: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  /**
   * Returns a OrderedSet of the same type "zipped" with the provided
   * collections.
   *
   * Unlike `zip`, `zipAll` continues zipping until the longest collection is
   * exhausted. Missing values from shorter collections are filled with `undefined`.
   *
   * ```js
   * const a = OrderedSet([ 1, 2 ]);
   * const b = OrderedSet([ 3, 4, 5 ]);
   * const c = a.zipAll(b); // OrderedSet [ [ 1, 3 ], [ 2, 4 ], [ undefined, 5 ] ]
   * ```
   *
   * Note: Since zipAll will return a collection as large as the largest
   * input, some results may contain undefined values. TypeScript cannot
   * account for these without cases (as of v2.5).
   */
  zipAll<U>(other: Collection<unknown, U>): OrderedSet<[T, U]>
  zipAll<U, V>(
    other1: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): OrderedSet<[T, U, V]>
  zipAll(
    ...collections: Array<Collection<unknown, unknown>>
  ): OrderedSet<unknown>
  /**
   * Returns an OrderedSet of the same type "zipped" with the provided
   * collections by using a custom `zipper` function.
   *
   * @see Seq.Indexed.zipWith
   */
  zipWith<U, Z>(
    zipper: (value: T, otherValue: U) => Z,
    otherCollection: Collection<unknown, U>
  ): OrderedSet<Z>
  zipWith<U, V, Z>(
    zipper: (value: T, otherValue: U, thirdValue: V) => Z,
    otherCollection: Collection<unknown, U>,
    thirdCollection: Collection<unknown, V>
  ): OrderedSet<Z>
  zipWith<Z>(
    zipper: (...values: Array<unknown>) => Z,
    ...collections: Array<Collection<unknown, unknown>>
  ): OrderedSet<Z>
}
namespace Stack {
  function isStack(maybeStack: unknown): maybeStack is Stack<unknown>
  function of<T>(...values: Array<T>): Stack<T>
}
function Stack<T>(collection?: Iterable<T> | ArrayLike<T>): Stack<T>
interface Stack<T> extends Collection.Indexed<T> {
  /**
   * The number of items in this Stack.
   */
  readonly size: number
  // Reading values
  /**
   * Alias for `Stack.first()`.
   */
  peek(): T | undefined
  // Persistent changes
  /**
   * Returns a new Stack with 0 size and no values.
   *
   * Note: `clear` can be used in `withMutations`.
   */
  clear(): Stack<T>
  /**
   * Returns a new Stack with the provided `values` prepended, shifting other
   * values ahead to higher indices.
   *
   * This is very efficient for Stack.
   *
   * Note: `unshift` can be used in `withMutations`.
   */
  unshift(...values: Array<T>): Stack<T>
  /**
   * Like `Stack#unshift`, but accepts a collection rather than varargs.
   *
   * Note: `unshiftAll` can be used in `withMutations`.
   */
  unshiftAll(iter: Iterable<T>): Stack<T>
  /**
   * Returns a new Stack with a size ones less than this Stack, excluding
   * the first item in this Stack, shifting all other values to a lower index.
   *
   * Note: this differs from `Array#shift` because it returns a new
   * Stack rather than the removed value. Use `first()` or `peek()` to get the
   * first value in this Stack.
   *
   * Note: `shift` can be used in `withMutations`.
   */
  shift(): Stack<T>
  /**
   * Alias for `Stack#unshift` and is not equivalent to `List#push`.
   */
  push(...values: Array<T>): Stack<T>
  /**
   * Alias for `Stack#unshiftAll`.
   */
  pushAll(iter: Iterable<T>): Stack<T>
  /**
   * Alias for `Stack#shift` and is not equivalent to `List#pop`.
   */
  pop(): Stack<T>
  // Transient changes
  /**
   * Note: Not all methods can be used on a mutable collection or within
   * `withMutations`! Check the documentation for each method to see if it
   * mentions being safe to use in `withMutations`.
   *
   * @see `Map#withMutations`
   */
  withMutations(mutator: (mutable: this) => unknown): this
  /**
   * Note: Not all methods can be used on a mutable collection or within
   * `withMutations`! Check the documentation for each method to see if it
   * mentions being safe to use in `withMutations`.
   *
   * @see `Map#asMutable`
   */
  asMutable(): this
  /**
   * @see `Map#wasAltered`
   */
  wasAltered(): boolean
  /**
   * @see `Map#asImmutable`
   */
  asImmutable(): this
  // Sequence algorithms
  /**
   * Returns a new Stack with other collections concatenated to this one.
   */
  concat<C>(...valuesOrCollections: Array<Iterable<C> | C>): Stack<T | C>
  /**
   * Returns a new Stack with values passed through a
   * `mapper` function.
   *
   *     Stack([ 1, 2 ]).map(x => 10 * x)
   *     // Stack [ 10, 20 ]
   *
   * Note: `map()` always returns a new instance, even if it produced the same
   * value at every step.
   */
  map<M>(
    mapper: (value: T, key: number, iter: this) => M,
    context?: unknown
  ): Stack<M>
  /**
   * Flat-maps the Stack, returning a new Stack.
   *
   * Similar to `stack.map(...).flatten(true)`.
   */
  flatMap<M>(
    mapper: (value: T, key: number, iter: this) => Iterable<M>,
    context?: unknown
  ): Stack<M>
  /**
   * Returns a new Set with only the values for which the `predicate`
   * function returns true.
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends T>(
    predicate: (value: T, index: number, iter: this) => value is F,
    context?: unknown
  ): Set<F>
  filter(
    predicate: (value: T, index: number, iter: this) => unknown,
    context?: unknown
  ): this
  /**
   * Returns a Stack "zipped" with the provided collections.
   *
   * Like `zipWith`, but using the default `zipper`: creating an `Array`.
   *
   * ```js
   * const a = Stack([ 1, 2, 3 ]);
   * const b = Stack([ 4, 5, 6 ]);
   * const c = a.zip(b); // Stack [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
   * ```
   */
  zip<U>(other: Collection<unknown, U>): Stack<[T, U]>
  zip<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): Stack<[T, U, V]>
  zip(...collections: Array<Collection<unknown, unknown>>): Stack<unknown>
  /**
   * Returns a Stack "zipped" with the provided collections.
   *
   * Unlike `zip`, `zipAll` continues zipping until the longest collection is
   * exhausted. Missing values from shorter collections are filled with `undefined`.
   *
   * ```js
   * const a = Stack([ 1, 2 ]);
   * const b = Stack([ 3, 4, 5 ]);
   * const c = a.zipAll(b); // Stack [ [ 1, 3 ], [ 2, 4 ], [ undefined, 5 ] ]
   * ```
   *
   * Note: Since zipAll will return a collection as large as the largest
   * input, some results may contain undefined values. TypeScript cannot
   * account for these without cases (as of v2.5).
   */
  zipAll<U>(other: Collection<unknown, U>): Stack<[T, U]>
  zipAll<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): Stack<[T, U, V]>
  zipAll(...collections: Array<Collection<unknown, unknown>>): Stack<unknown>
  /**
   * Returns a Stack "zipped" with the provided collections by using a
   * custom `zipper` function.
   *
   * ```js
   * const a = Stack([ 1, 2, 3 ]);
   * const b = Stack([ 4, 5, 6 ]);
   * const c = a.zipWith((a, b) => a + b, b);
   * // Stack [ 5, 7, 9 ]
   * ```
   */
  zipWith<U, Z>(
    zipper: (value: T, otherValue: U) => Z,
    otherCollection: Collection<unknown, U>
  ): Stack<Z>
  zipWith<U, V, Z>(
    zipper: (value: T, otherValue: U, thirdValue: V) => Z,
    otherCollection: Collection<unknown, U>,
    thirdCollection: Collection<unknown, V>
  ): Stack<Z>
  zipWith<Z>(
    zipper: (...values: Array<unknown>) => Z,
    ...collections: Array<Collection<unknown, unknown>>
  ): Stack<Z>
}
function Range(start?: number, end?: number, step?: number): Seq.Indexed<number>
function Repeat<T>(value: T, times?: number): Seq.Indexed<T>
namespace Record {
  function isRecord(maybeRecord: unknown): maybeRecord is Record<{}>
  function getDescriptiveName(record: Record<any>): string
  namespace Factory {}
  interface Factory<TProps extends object> {
    (values?: Partial<TProps> | Iterable<[string, unknown]>): Record<TProps> &
      Readonly<TProps>
    new (
      values?: Partial<TProps> | Iterable<[string, unknown]>
    ): Record<TProps> & Readonly<TProps>
    /**
     * The name provided to `Record(values, name)` can be accessed with
     * `displayName`.
     */
    displayName: string
  }
  function Factory<TProps extends object>(
    values?: Partial<TProps> | Iterable<[string, unknown]>
  ): Record<TProps> & Readonly<TProps>
}
function Record<TProps extends object>(
  defaultValues: TProps,
  name?: string
): Record.Factory<TProps>
interface Record<TProps extends object> {
  // Reading values
  has(key: string): key is keyof TProps & string
  /**
   * Returns the value associated with the provided key, which may be the
   * default value defined when creating the Record factory function.
   *
   * If the requested key is not defined by this Record type, then
   * notSetValue will be returned if provided. Note that this scenario would
   * produce an error when using Flow or TypeScript.
   */
  get<K extends keyof TProps>(key: K, notSetValue?: unknown): TProps[K]
  get<T>(key: string, notSetValue: T): T
  // Reading deep values
  hasIn(keyPath: Iterable<unknown>): boolean
  getIn(keyPath: Iterable<unknown>): unknown
  // Value equality
  equals(other: unknown): boolean
  hashCode(): number
  // Persistent changes
  set<K extends keyof TProps>(key: K, value: TProps[K]): this
  update<K extends keyof TProps>(
    key: K,
    updater: (value: TProps[K]) => TProps[K]
  ): this
  merge(
    ...collections: Array<Partial<TProps> | Iterable<[string, unknown]>>
  ): this
  mergeDeep(
    ...collections: Array<Partial<TProps> | Iterable<[string, unknown]>>
  ): this
  mergeWith(
    merger: (oldVal: unknown, newVal: unknown, key: keyof TProps) => unknown,
    ...collections: Array<Partial<TProps> | Iterable<[string, unknown]>>
  ): this
  mergeDeepWith(
    merger: (oldVal: unknown, newVal: unknown, key: unknown) => unknown,
    ...collections: Array<Partial<TProps> | Iterable<[string, unknown]>>
  ): this
  /**
   * Returns a new instance of this Record type with the value for the
   * specific key set to its default value.
   *
   * @alias remove
   */
  delete<K extends keyof TProps>(key: K): this
  remove<K extends keyof TProps>(key: K): this
  /**
   * Returns a new instance of this Record type with all values set
   * to their default values.
   */
  clear(): this
  // Deep persistent changes
  setIn(keyPath: Iterable<unknown>, value: unknown): this
  updateIn(
    keyPath: Iterable<unknown>,
    updater: (value: unknown) => unknown
  ): this
  mergeIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  mergeDeepIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  /**
   * @alias removeIn
   */
  deleteIn(keyPath: Iterable<unknown>): this
  removeIn(keyPath: Iterable<unknown>): this
  // Conversion to JavaScript types
  /**
   * Deeply converts this Record to equivalent native JavaScript Object.
   *
   * Note: This method may not be overridden. Objects with custom
   * serialization to plain JS may override toJSON() instead.
   */
  toJS(): { [K in keyof TProps]: unknown }
  /**
   * Shallowly converts this Record to equivalent native JavaScript Object.
   */
  toJSON(): TProps
  /**
   * Shallowly converts this Record to equivalent JavaScript Object.
   */
  toObject(): TProps
  // Transient changes
  /**
   * Note: Not all methods can be used on a mutable collection or within
   * `withMutations`! Only `set` may be used mutatively.
   *
   * @see `Map#withMutations`
   */
  withMutations(mutator: (mutable: this) => unknown): this
  /**
   * @see `Map#asMutable`
   */
  asMutable(): this
  /**
   * @see `Map#wasAltered`
   */
  wasAltered(): boolean
  /**
   * @see `Map#asImmutable`
   */
  asImmutable(): this
  // Sequence algorithms
  toSeq(): Seq.Keyed<keyof TProps, TProps[keyof TProps]>
  [Symbol.iterator](): IterableIterator<[keyof TProps, TProps[keyof TProps]]>
}
type RecordOf<TProps extends object> = Record<TProps> & Readonly<TProps>
namespace Seq {
  function isSeq(
    maybeSeq: unknown
  ): maybeSeq is
    | Seq.Indexed<unknown>
    | Seq.Keyed<unknown, unknown>
    | Seq.Set<unknown>
  namespace Keyed {}
  function Keyed<K, V>(collection?: Iterable<[K, V]>): Seq.Keyed<K, V>
  function Keyed<V>(obj: { [key: string]: V }): Seq.Keyed<string, V>
  interface Keyed<K, V> extends Seq<K, V>, Collection.Keyed<K, V> {
    /**
     * Deeply converts this Keyed Seq to equivalent native JavaScript Object.
     *
     * Converts keys to Strings.
     */
    toJS(): { [key: string]: unknown }
    /**
     * Shallowly converts this Keyed Seq to equivalent native JavaScript Object.
     *
     * Converts keys to Strings.
     */
    toJSON(): { [key: string]: V }
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<[K, V]>
    /**
     * Returns itself
     */
    toSeq(): this
    /**
     * Returns a new Seq with other collections concatenated to this one.
     *
     * All entries will be present in the resulting Seq, even if they
     * have the same key.
     */
    concat<KC, VC>(
      ...collections: Array<Iterable<[KC, VC]>>
    ): Seq.Keyed<K | KC, V | VC>
    concat<C>(
      ...collections: Array<{ [key: string]: C }>
    ): Seq.Keyed<K | string, V | C>
    /**
     * Returns a new Seq.Keyed with values passed through a
     * `mapper` function.
     *
     * ```js
     * const { Seq } = require('immutable')
     * Seq.Keyed({ a: 1, b: 2 }).map(x => 10 * x)
     * // Seq { "a": 10, "b": 20 }
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: V, key: K, iter: this) => M,
      context?: unknown
    ): Seq.Keyed<K, M>
    /**
     * @see Collection.Keyed.mapKeys
     */
    mapKeys<M>(
      mapper: (key: K, value: V, iter: this) => M,
      context?: unknown
    ): Seq.Keyed<M, V>
    /**
     * @see Collection.Keyed.mapEntries
     */
    mapEntries<KM, VM>(
      mapper: (
        entry: [K, V],
        index: number,
        iter: this
      ) => [KM, VM] | undefined,
      context?: unknown
    ): Seq.Keyed<KM, VM>
    /**
     * Flat-maps the Seq, returning a Seq of the same type.
     *
     * Similar to `seq.map(...).flatten(true)`.
     */
    flatMap<KM, VM>(
      mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
      context?: unknown
    ): Seq.Keyed<KM, VM>
    /**
     * Returns a new Seq with only the entries for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends V>(
      predicate: (value: V, key: K, iter: this) => value is F,
      context?: unknown
    ): Seq.Keyed<K, F>
    filter(
      predicate: (value: V, key: K, iter: this) => unknown,
      context?: unknown
    ): this
    /**
     * @see Collection.Keyed.flip
     */
    flip(): Seq.Keyed<V, K>
    [Symbol.iterator](): IterableIterator<[K, V]>
  }
  namespace Indexed {
    function of<T>(...values: Array<T>): Seq.Indexed<T>
  }
  function Indexed<T>(collection?: Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
  interface Indexed<T> extends Seq<number, T>, Collection.Indexed<T> {
    /**
     * Deeply converts this Indexed Seq to equivalent native JavaScript Array.
     */
    toJS(): Array<unknown>
    /**
     * Shallowly converts this Indexed Seq to equivalent native JavaScript Array.
     */
    toJSON(): Array<T>
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<T>
    /**
     * Returns itself
     */
    toSeq(): this
    /**
     * Returns a new Seq with other collections concatenated to this one.
     */
    concat<C>(
      ...valuesOrCollections: Array<Iterable<C> | C>
    ): Seq.Indexed<T | C>
    /**
     * Returns a new Seq.Indexed with values passed through a
     * `mapper` function.
     *
     * ```js
     * const { Seq } = require('immutable')
     * Seq.Indexed([ 1, 2 ]).map(x => 10 * x)
     * // Seq [ 10, 20 ]
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: T, key: number, iter: this) => M,
      context?: unknown
    ): Seq.Indexed<M>
    /**
     * Flat-maps the Seq, returning a a Seq of the same type.
     *
     * Similar to `seq.map(...).flatten(true)`.
     */
    flatMap<M>(
      mapper: (value: T, key: number, iter: this) => Iterable<M>,
      context?: unknown
    ): Seq.Indexed<M>
    /**
     * Returns a new Seq with only the values for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends T>(
      predicate: (value: T, index: number, iter: this) => value is F,
      context?: unknown
    ): Seq.Indexed<F>
    filter(
      predicate: (value: T, index: number, iter: this) => unknown,
      context?: unknown
    ): this
    /**
     * Returns a Seq "zipped" with the provided collections.
     *
     * Like `zipWith`, but using the default `zipper`: creating an `Array`.
     *
     * ```js
     * const a = Seq([ 1, 2, 3 ]);
     * const b = Seq([ 4, 5, 6 ]);
     * const c = a.zip(b); // Seq [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
     * ```
     */
    zip<U>(other: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zip<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Seq.Indexed<[T, U, V]>
    zip(
      ...collections: Array<Collection<unknown, unknown>>
    ): Seq.Indexed<unknown>
    /**
     * Returns a Seq "zipped" with the provided collections.
     *
     * Unlike `zip`, `zipAll` continues zipping until the longest collection is
     * exhausted. Missing values from shorter collections are filled with `undefined`.
     *
     * ```js
     * const a = Seq([ 1, 2 ]);
     * const b = Seq([ 3, 4, 5 ]);
     * const c = a.zipAll(b); // Seq [ [ 1, 3 ], [ 2, 4 ], [ undefined, 5 ] ]
     * ```
     */
    zipAll<U>(other: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zipAll<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Seq.Indexed<[T, U, V]>
    zipAll(
      ...collections: Array<Collection<unknown, unknown>>
    ): Seq.Indexed<unknown>
    /**
     * Returns a Seq "zipped" with the provided collections by using a
     * custom `zipper` function.
     *
     * ```js
     * const a = Seq([ 1, 2, 3 ]);
     * const b = Seq([ 4, 5, 6 ]);
     * const c = a.zipWith((a, b) => a + b, b);
     * // Seq [ 5, 7, 9 ]
     * ```
     */
    zipWith<U, Z>(
      zipper: (value: T, otherValue: U) => Z,
      otherCollection: Collection<unknown, U>
    ): Seq.Indexed<Z>
    zipWith<U, V, Z>(
      zipper: (value: T, otherValue: U, thirdValue: V) => Z,
      otherCollection: Collection<unknown, U>,
      thirdCollection: Collection<unknown, V>
    ): Seq.Indexed<Z>
    zipWith<Z>(
      zipper: (...values: Array<unknown>) => Z,
      ...collections: Array<Collection<unknown, unknown>>
    ): Seq.Indexed<Z>
    [Symbol.iterator](): IterableIterator<T>
  }
  namespace Set {
    function of<T>(...values: Array<T>): Seq.Set<T>
  }
  function Set<T>(collection?: Iterable<T> | ArrayLike<T>): Seq.Set<T>
  interface Set<T> extends Seq<T, T>, Collection.Set<T> {
    /**
     * Deeply converts this Set Seq to equivalent native JavaScript Array.
     */
    toJS(): Array<unknown>
    /**
     * Shallowly converts this Set Seq to equivalent native JavaScript Array.
     */
    toJSON(): Array<T>
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<T>
    /**
     * Returns itself
     */
    toSeq(): this
    /**
     * Returns a new Seq with other collections concatenated to this one.
     *
     * All entries will be present in the resulting Seq, even if they
     * are duplicates.
     */
    concat<U>(...collections: Array<Iterable<U>>): Seq.Set<T | U>
    /**
     * Returns a new Seq.Set with values passed through a
     * `mapper` function.
     *
     * ```js
     * Seq.Set([ 1, 2 ]).map(x => 10 * x)
     * // Seq { 10, 20 }
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: T, key: T, iter: this) => M,
      context?: unknown
    ): Seq.Set<M>
    /**
     * Flat-maps the Seq, returning a Seq of the same type.
     *
     * Similar to `seq.map(...).flatten(true)`.
     */
    flatMap<M>(
      mapper: (value: T, key: T, iter: this) => Iterable<M>,
      context?: unknown
    ): Seq.Set<M>
    /**
     * Returns a new Seq with only the values for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends T>(
      predicate: (value: T, key: T, iter: this) => value is F,
      context?: unknown
    ): Seq.Set<F>
    filter(
      predicate: (value: T, key: T, iter: this) => unknown,
      context?: unknown
    ): this
    [Symbol.iterator](): IterableIterator<T>
  }
}
function Seq<S extends Seq<unknown, unknown>>(seq: S): S
function Seq<K, V>(collection: Collection.Keyed<K, V>): Seq.Keyed<K, V>
function Seq<T>(collection: Collection.Set<T>): Seq.Set<T>
function Seq<T>(
  collection: Collection.Indexed<T> | Iterable<T> | ArrayLike<T>
): Seq.Indexed<T>
function Seq<V>(obj: { [key: string]: V }): Seq.Keyed<string, V>
function Seq<K = unknown, V = unknown>(): Seq<K, V>
interface Seq<K, V> extends Collection<K, V> {
  /**
   * Some Seqs can describe their size lazily. When this is the case,
   * size will be an integer. Otherwise it will be undefined.
   *
   * For example, Seqs returned from `map()` or `reverse()`
   * preserve the size of the original `Seq` while `filter()` does not.
   *
   * Note: `Range`, `Repeat` and `Seq`s made from `Array`s and `Object`s will
   * always have a size.
   */
  readonly size: number | undefined
  // Force evaluation
  /**
   * Because Sequences are lazy and designed to be chained together, they do
   * not cache their results. For example, this map function is called a total
   * of 6 times, as each `join` iterates the Seq of three values.
   *
   *     var squares = Seq([ 1, 2, 3 ]).map(x => x * x)
   *     squares.join() + squares.join()
   *
   * If you know a `Seq` will be used multiple times, it may be more
   * efficient to first cache it in memory. Here, the map function is called
   * only 3 times.
   *
   *     var squares = Seq([ 1, 2, 3 ]).map(x => x * x).cacheResult()
   *     squares.join() + squares.join()
   *
   * Use this method judiciously, as it must fully evaluate a Seq which can be
   * a burden on memory and possibly performance.
   *
   * Note: after calling `cacheResult`, a Seq will always have a `size`.
   */
  cacheResult(): this
  // Sequence algorithms
  /**
   * Returns a new Seq with values passed through a
   * `mapper` function.
   *
   * ```js
   * const { Seq } = require('immutable')
   * Seq([ 1, 2 ]).map(x => 10 * x)
   * // Seq [ 10, 20 ]
   * ```
   *
   * Note: `map()` always returns a new instance, even if it produced the same
   * value at every step.
   */
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Seq<K, M>
  /**
   * Returns a new Seq with values passed through a
   * `mapper` function.
   *
   * ```js
   * const { Seq } = require('immutable')
   * Seq([ 1, 2 ]).map(x => 10 * x)
   * // Seq [ 10, 20 ]
   * ```
   *
   * Note: `map()` always returns a new instance, even if it produced the same
   * value at every step.
   * Note: used only for sets.
   */
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Seq<M, M>
  /**
   * Flat-maps the Seq, returning a Seq of the same type.
   *
   * Similar to `seq.map(...).flatten(true)`.
   */
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Seq<K, M>
  /**
   * Flat-maps the Seq, returning a Seq of the same type.
   *
   * Similar to `seq.map(...).flatten(true)`.
   * Note: Used only for sets.
   */
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Seq<M, M>
  /**
   * Returns a new Seq with only the values for which the `predicate`
   * function returns true.
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): Seq<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
}
namespace Collection {
  function isKeyed(
    maybeKeyed: unknown
  ): maybeKeyed is Collection.Keyed<unknown, unknown>
  function isIndexed(
    maybeIndexed: unknown
  ): maybeIndexed is Collection.Indexed<unknown>
  function isAssociative(
    maybeAssociative: unknown
  ): maybeAssociative is
    | Collection.Keyed<unknown, unknown>
    | Collection.Indexed<unknown>
  function isOrdered(maybeOrdered: unknown): boolean
  namespace Keyed {}
  function Keyed<K, V>(collection?: Iterable<[K, V]>): Collection.Keyed<K, V>
  function Keyed<V>(obj: { [key: string]: V }): Collection.Keyed<string, V>
  interface Keyed<K, V> extends Collection<K, V> {
    /**
     * Deeply converts this Keyed collection to equivalent native JavaScript Object.
     *
     * Converts keys to Strings.
     */
    toJS(): { [key: string]: unknown }
    /**
     * Shallowly converts this Keyed collection to equivalent native JavaScript Object.
     *
     * Converts keys to Strings.
     */
    toJSON(): { [key: string]: V }
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<[K, V]>
    /**
     * Returns Seq.Keyed.
     * @override
     */
    toSeq(): Seq.Keyed<K, V>
    // Sequence functions
    /**
     * Returns a new Collection.Keyed of the same type where the keys and values
     * have been flipped.
     *
     * <!-- runkit:activate -->
     * ```js
     * const { Map } = require('immutable')
     * Map({ a: 'z', b: 'y' }).flip()
     * // Map { "z": "a", "y": "b" }
     * ```
     */
    flip(): Collection.Keyed<V, K>
    /**
     * Returns a new Collection with other collections concatenated to this one.
     */
    concat<KC, VC>(
      ...collections: Array<Iterable<[KC, VC]>>
    ): Collection.Keyed<K | KC, V | VC>
    concat<C>(
      ...collections: Array<{ [key: string]: C }>
    ): Collection.Keyed<K | string, V | C>
    /**
     * Returns a new Collection.Keyed with values passed through a
     * `mapper` function.
     *
     * ```js
     * const { Collection } = require('immutable')
     * Collection.Keyed({ a: 1, b: 2 }).map(x => 10 * x)
     * // Seq { "a": 10, "b": 20 }
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: V, key: K, iter: this) => M,
      context?: unknown
    ): Collection.Keyed<K, M>
    /**
     * Returns a new Collection.Keyed of the same type with keys passed through
     * a `mapper` function.
     *
     * <!-- runkit:activate -->
     * ```js
     * const { Map } = require('immutable')
     * Map({ a: 1, b: 2 }).mapKeys(x => x.toUpperCase())
     * // Map { "A": 1, "B": 2 }
     * ```
     *
     * Note: `mapKeys()` always returns a new instance, even if it produced
     * the same key at every step.
     */
    mapKeys<M>(
      mapper: (key: K, value: V, iter: this) => M,
      context?: unknown
    ): Collection.Keyed<M, V>
    /**
     * Returns a new Collection.Keyed of the same type with entries
     * ([key, value] tuples) passed through a `mapper` function.
     *
     * <!-- runkit:activate -->
     * ```js
     * const { Map } = require('immutable')
     * Map({ a: 1, b: 2 })
     *   .mapEntries(([ k, v ]) => [ k.toUpperCase(), v * 2 ])
     * // Map { "A": 2, "B": 4 }
     * ```
     *
     * Note: `mapEntries()` always returns a new instance, even if it produced
     * the same entry at every step.
     *
     * If the mapper function returns `undefined`, then the entry will be filtered
     */
    mapEntries<KM, VM>(
      mapper: (
        entry: [K, V],
        index: number,
        iter: this
      ) => [KM, VM] | undefined,
      context?: unknown
    ): Collection.Keyed<KM, VM>
    /**
     * Flat-maps the Collection, returning a Collection of the same type.
     *
     * Similar to `collection.map(...).flatten(true)`.
     */
    flatMap<KM, VM>(
      mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
      context?: unknown
    ): Collection.Keyed<KM, VM>
    /**
     * Returns a new Collection with only the values for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends V>(
      predicate: (value: V, key: K, iter: this) => value is F,
      context?: unknown
    ): Collection.Keyed<K, F>
    filter(
      predicate: (value: V, key: K, iter: this) => unknown,
      context?: unknown
    ): this
    [Symbol.iterator](): IterableIterator<[K, V]>
  }
  namespace Indexed {}
  function Indexed<T>(
    collection?: Iterable<T> | ArrayLike<T>
  ): Collection.Indexed<T>
  interface Indexed<T> extends Collection<number, T> {
    /**
     * Deeply converts this Indexed collection to equivalent native JavaScript Array.
     */
    toJS(): Array<unknown>
    /**
     * Shallowly converts this Indexed collection to equivalent native JavaScript Array.
     */
    toJSON(): Array<T>
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<T>
    // Reading values
    /**
     * Returns the value associated with the provided index, or notSetValue if
     * the index is beyond the bounds of the Collection.
     *
     * `index` may be a negative number, which indexes back from the end of the
     * Collection. `s.get(-1)` gets the last item in the Collection.
     */
    get<NSV>(index: number, notSetValue: NSV): T | NSV
    get(index: number): T | undefined
    // Conversion to Seq
    /**
     * Returns Seq.Indexed.
     * @override
     */
    toSeq(): Seq.Indexed<T>
    /**
     * If this is a collection of [key, value] entry tuples, it will return a
     * Seq.Keyed of those entries.
     */
    fromEntrySeq(): Seq.Keyed<unknown, unknown>
    // Combination
    /**
     * Returns a Collection of the same type with `separator` between each item
     * in this Collection.
     */
    interpose(separator: T): this
    /**
     * Returns a Collection of the same type with the provided `collections`
     * interleaved into this collection.
     *
     * The resulting Collection includes the first item from each, then the
     * second from each, etc.
     *
     * <!-- runkit:activate
     *      { "preamble": "require('immutable')"}
     * -->
     * ```js
     * const { List } = require('immutable')
     * List([ 1, 2, 3 ]).interleave(List([ 'A', 'B', 'C' ]))
     * // List [ 1, "A", 2, "B", 3, "C" ]
     * ```
     *
     * The shortest Collection stops interleave.
     *
     * <!-- runkit:activate
     *      { "preamble": "const { List } = require('immutable')" }
     * -->
     * ```js
     * List([ 1, 2, 3 ]).interleave(
     *   List([ 'A', 'B' ]),
     *   List([ 'X', 'Y', 'Z' ])
     * )
     * // List [ 1, "A", "X", 2, "B", "Y" ]
     * ```
     *
     * Since `interleave()` re-indexes values, it produces a complete copy,
     * which has `O(N)` complexity.
     *
     * Note: `interleave` *cannot* be used in `withMutations`.
     */
    interleave(...collections: Array<Collection<unknown, T>>): this
    /**
     * Splice returns a new indexed Collection by replacing a region of this
     * Collection with new values. If values are not provided, it only skips the
     * region to be removed.
     *
     * `index` may be a negative number, which indexes back from the end of the
     * Collection. `s.splice(-2)` splices after the second to last item.
     *
     * <!-- runkit:activate -->
     * ```js
     * const { List } = require('immutable')
     * List([ 'a', 'b', 'c', 'd' ]).splice(1, 2, 'q', 'r', 's')
     * // List [ "a", "q", "r", "s", "d" ]
     * ```
     *
     * Since `splice()` re-indexes values, it produces a complete copy, which
     * has `O(N)` complexity.
     *
     * Note: `splice` *cannot* be used in `withMutations`.
     */
    splice(index: number, removeNum: number, ...values: Array<T>): this
    /**
     * Returns a Collection of the same type "zipped" with the provided
     * collections.
     *
     * Like `zipWith`, but using the default `zipper`: creating an `Array`.
     *
     *
     * <!-- runkit:activate
     *      { "preamble": "const { List } = require('immutable')" }
     * -->
     * ```js
     * const a = List([ 1, 2, 3 ]);
     * const b = List([ 4, 5, 6 ]);
     * const c = a.zip(b); // List [ [ 1, 4 ], [ 2, 5 ], [ 3, 6 ] ]
     * ```
     */
    zip<U>(other: Collection<unknown, U>): Collection.Indexed<[T, U]>
    zip<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Collection.Indexed<[T, U, V]>
    zip(
      ...collections: Array<Collection<unknown, unknown>>
    ): Collection.Indexed<unknown>
    /**
     * Returns a Collection "zipped" with the provided collections.
     *
     * Unlike `zip`, `zipAll` continues zipping until the longest collection is
     * exhausted. Missing values from shorter collections are filled with `undefined`.
     *
     * ```js
     * const a = List([ 1, 2 ]);
     * const b = List([ 3, 4, 5 ]);
     * const c = a.zipAll(b); // List [ [ 1, 3 ], [ 2, 4 ], [ undefined, 5 ] ]
     * ```
     */
    zipAll<U>(other: Collection<unknown, U>): Collection.Indexed<[T, U]>
    zipAll<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Collection.Indexed<[T, U, V]>
    zipAll(
      ...collections: Array<Collection<unknown, unknown>>
    ): Collection.Indexed<unknown>
    /**
     * Returns a Collection of the same type "zipped" with the provided
     * collections by using a custom `zipper` function.
     *
     * <!-- runkit:activate
     *      { "preamble": "const { List } = require('immutable')" }
     * -->
     * ```js
     * const a = List([ 1, 2, 3 ]);
     * const b = List([ 4, 5, 6 ]);
     * const c = a.zipWith((a, b) => a + b, b);
     * // List [ 5, 7, 9 ]
     * ```
     */
    zipWith<U, Z>(
      zipper: (value: T, otherValue: U) => Z,
      otherCollection: Collection<unknown, U>
    ): Collection.Indexed<Z>
    zipWith<U, V, Z>(
      zipper: (value: T, otherValue: U, thirdValue: V) => Z,
      otherCollection: Collection<unknown, U>,
      thirdCollection: Collection<unknown, V>
    ): Collection.Indexed<Z>
    zipWith<Z>(
      zipper: (...values: Array<unknown>) => Z,
      ...collections: Array<Collection<unknown, unknown>>
    ): Collection.Indexed<Z>
    // Search for value
    /**
     * Returns the first index at which a given value can be found in the
     * Collection, or -1 if it is not present.
     */
    indexOf(searchValue: T): number
    /**
     * Returns the last index at which a given value can be found in the
     * Collection, or -1 if it is not present.
     */
    lastIndexOf(searchValue: T): number
    /**
     * Returns the first index in the Collection where a value satisfies the
     * provided predicate function. Otherwise -1 is returned.
     */
    findIndex(
      predicate: (value: T, index: number, iter: this) => boolean,
      context?: unknown
    ): number
    /**
     * Returns the last index in the Collection where a value satisfies the
     * provided predicate function. Otherwise -1 is returned.
     */
    findLastIndex(
      predicate: (value: T, index: number, iter: this) => boolean,
      context?: unknown
    ): number
    // Sequence algorithms
    /**
     * Returns a new Collection with other collections concatenated to this one.
     */
    concat<C>(
      ...valuesOrCollections: Array<Iterable<C> | C>
    ): Collection.Indexed<T | C>
    /**
     * Returns a new Collection.Indexed with values passed through a
     * `mapper` function.
     *
     * ```js
     * const { Collection } = require('immutable')
     * Collection.Indexed([1,2]).map(x => 10 * x)
     * // Seq [ 1, 2 ]
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: T, key: number, iter: this) => M,
      context?: unknown
    ): Collection.Indexed<M>
    /**
     * Flat-maps the Collection, returning a Collection of the same type.
     *
     * Similar to `collection.map(...).flatten(true)`.
     */
    flatMap<M>(
      mapper: (value: T, key: number, iter: this) => Iterable<M>,
      context?: unknown
    ): Collection.Indexed<M>
    /**
     * Returns a new Collection with only the values for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends T>(
      predicate: (value: T, index: number, iter: this) => value is F,
      context?: unknown
    ): Collection.Indexed<F>
    filter(
      predicate: (value: T, index: number, iter: this) => unknown,
      context?: unknown
    ): this
    [Symbol.iterator](): IterableIterator<T>
  }
  namespace Set {}
  function Set<T>(collection?: Iterable<T> | ArrayLike<T>): Collection.Set<T>
  interface Set<T> extends Collection<T, T> {
    /**
     * Deeply converts this Set collection to equivalent native JavaScript Array.
     */
    toJS(): Array<unknown>
    /**
     * Shallowly converts this Set collection to equivalent native JavaScript Array.
     */
    toJSON(): Array<T>
    /**
     * Shallowly converts this collection to an Array.
     */
    toArray(): Array<T>
    /**
     * Returns Seq.Set.
     * @override
     */
    toSeq(): Seq.Set<T>
    // Sequence algorithms
    /**
     * Returns a new Collection with other collections concatenated to this one.
     */
    concat<U>(...collections: Array<Iterable<U>>): Collection.Set<T | U>
    /**
     * Returns a new Collection.Set with values passed through a
     * `mapper` function.
     *
     * ```
     * Collection.Set([ 1, 2 ]).map(x => 10 * x)
     * // Seq { 1, 2 }
     * ```
     *
     * Note: `map()` always returns a new instance, even if it produced the
     * same value at every step.
     */
    map<M>(
      mapper: (value: T, key: T, iter: this) => M,
      context?: unknown
    ): Collection.Set<M>
    /**
     * Flat-maps the Collection, returning a Collection of the same type.
     *
     * Similar to `collection.map(...).flatten(true)`.
     */
    flatMap<M>(
      mapper: (value: T, key: T, iter: this) => Iterable<M>,
      context?: unknown
    ): Collection.Set<M>
    /**
     * Returns a new Collection with only the values for which the `predicate`
     * function returns true.
     *
     * Note: `filter()` always returns a new instance, even if it results in
     * not filtering out any values.
     */
    filter<F extends T>(
      predicate: (value: T, key: T, iter: this) => value is F,
      context?: unknown
    ): Collection.Set<F>
    filter(
      predicate: (value: T, key: T, iter: this) => unknown,
      context?: unknown
    ): this
    [Symbol.iterator](): IterableIterator<T>
  }
}
function Collection<I extends Collection<unknown, unknown>>(collection: I): I
function Collection<T>(
  collection: Iterable<T> | ArrayLike<T>
): Collection.Indexed<T>
function Collection<V>(obj: { [key: string]: V }): Collection.Keyed<string, V>
function Collection<K = unknown, V = unknown>(): Collection<K, V>
interface Collection<K, V> extends ValueObject {
  // Value equality
  /**
   * True if this and the other Collection have value equality, as defined
   * by `Immutable.is()`.
   *
   * Note: This is equivalent to `Immutable.is(this, other)`, but provided to
   * allow for chained expressions.
   */
  equals(other: unknown): boolean
  /**
   * Computes and returns the hashed identity for this Collection.
   *
   * The `hashCode` of a Collection is used to determine potential equality,
   * and is used when adding this to a `Set` or as a key in a `Map`, enabling
   * lookup via a different instance.
   *
   * <!-- runkit:activate
   *      { "preamble": "const { Set,  List } = require('immutable')" }
   * -->
   * ```js
   * const a = List([ 1, 2, 3 ]);
   * const b = List([ 1, 2, 3 ]);
   * assert.notStrictEqual(a, b); // different instances
   * const set = Set([ a ]);
   * assert.equal(set.has(b), true);
   * ```
   *
   * If two values have the same `hashCode`, they are [not guaranteed
   * to be equal][Hash Collision]. If two values have different `hashCode`s,
   * they must not be equal.
   *
   * [Hash Collision]: https://en.wikipedia.org/wiki/Collision_(computer_science)
   */
  hashCode(): number
  // Reading values
  /**
   * Returns the value associated with the provided key, or notSetValue if
   * the Collection does not contain this key.
   *
   * Note: it is possible a key may be associated with an `undefined` value,
   * so if `notSetValue` is not provided and this method returns `undefined`,
   * that does not guarantee the key was not found.
   */
  get<NSV>(key: K, notSetValue: NSV): V | NSV
  get(key: K): V | undefined
  /**
   * True if a key exists within this `Collection`, using `Immutable.is`
   * to determine equality
   */
  has(key: K): boolean
  /**
   * True if a value exists within this `Collection`, using `Immutable.is`
   * to determine equality
   * @alias contains
   */
  includes(value: V): boolean
  contains(value: V): boolean
  /**
   * In case the `Collection` is not empty returns the first element of the
   * `Collection`.
   * In case the `Collection` is empty returns the optional default
   * value if provided, if no default value is provided returns undefined.
   */
  first<NSV = undefined>(notSetValue?: NSV): V | NSV
  /**
   * In case the `Collection` is not empty returns the last element of the
   * `Collection`.
   * In case the `Collection` is empty returns the optional default
   * value if provided, if no default value is provided returns undefined.
   */
  last<NSV = undefined>(notSetValue?: NSV): V | NSV
  // Reading deep values
  /**
   * Returns the value found by following a path of keys or indices through
   * nested Collections.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map, List } = require('immutable')
   * const deepData = Map({ x: List([ Map({ y: 123 }) ]) });
   * deepData.getIn(['x', 0, 'y']) // 123
   * ```
   *
   * Plain JavaScript Object or Arrays may be nested within an Immutable.js
   * Collection, and getIn() can access those values as well:
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map, List } = require('immutable')
   * const deepData = Map({ x: [ { y: 123 } ] });
   * deepData.getIn(['x', 0, 'y']) // 123
   * ```
   */
  getIn(searchKeyPath: Iterable<unknown>, notSetValue?: unknown): unknown
  /**
   * True if the result of following a path of keys or indices through nested
   * Collections results in a set value.
   */
  hasIn(searchKeyPath: Iterable<unknown>): boolean
  // Persistent changes
  /**
   * This can be very useful as a way to "chain" a normal function into a
   * sequence of methods. RxJS calls this "let" and lodash calls it "thru".
   *
   * For example, to sum a Seq after mapping and filtering:
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Seq } = require('immutable')
   *
   * function sum(collection) {
   *   return collection.reduce((sum, x) => sum + x, 0)
   * }
   *
   * Seq([ 1, 2, 3 ])
   *   .map(x => x + 1)
   *   .filter(x => x % 2 === 0)
   *   .update(sum)
   * // 6
   * ```
   */
  update<R>(updater: (value: this) => R): R
  // Conversion to JavaScript types
  /**
   * Deeply converts this Collection to equivalent native JavaScript Array or Object.
   *
   * `Collection.Indexed`, and `Collection.Set` become `Array`, while
   * `Collection.Keyed` become `Object`, converting keys to Strings.
   */
  toJS(): Array<unknown> | { [key: string]: unknown }
  /**
   * Shallowly converts this Collection to equivalent native JavaScript Array or Object.
   *
   * `Collection.Indexed`, and `Collection.Set` become `Array`, while
   * `Collection.Keyed` become `Object`, converting keys to Strings.
   */
  toJSON(): Array<V> | { [key: string]: V }
  /**
   * Shallowly converts this collection to an Array.
   *
   * `Collection.Indexed`, and `Collection.Set` produce an Array of values.
   * `Collection.Keyed` produce an Array of [key, value] tuples.
   */
  toArray(): Array<V> | Array<[K, V]>
  /**
   * Shallowly converts this Collection to an Object.
   *
   * Converts keys to Strings.
   */
  toObject(): { [key: string]: V }
  // Conversion to Collections
  /**
   * Converts this Collection to a Map, Throws if keys are not hashable.
   *
   * Note: This is equivalent to `Map(this.toKeyedSeq())`, but provided
   * for convenience and to allow for chained expressions.
   */
  toMap(): Map<K, V>
  /**
   * Converts this Collection to a Map, maintaining the order of iteration.
   *
   * Note: This is equivalent to `OrderedMap(this.toKeyedSeq())`, but
   * provided for convenience and to allow for chained expressions.
   */
  toOrderedMap(): OrderedMap<K, V>
  /**
   * Converts this Collection to a Set, discarding keys. Throws if values
   * are not hashable.
   *
   * Note: This is equivalent to `Set(this)`, but provided to allow for
   * chained expressions.
   */
  toSet(): Set<V>
  /**
   * Converts this Collection to a Set, maintaining the order of iteration and
   * discarding keys.
   *
   * Note: This is equivalent to `OrderedSet(this.valueSeq())`, but provided
   * for convenience and to allow for chained expressions.
   */
  toOrderedSet(): OrderedSet<V>
  /**
   * Converts this Collection to a List, discarding keys.
   *
   * This is similar to `List(collection)`, but provided to allow for chained
   * expressions. However, when called on `Map` or other keyed collections,
   * `collection.toList()` discards the keys and creates a list of only the
   * values, whereas `List(collection)` creates a list of entry tuples.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map, List } = require('immutable')
   * var myMap = Map({ a: 'Apple', b: 'Banana' })
   * List(myMap) // List [ [ "a", "Apple" ], [ "b", "Banana" ] ]
   * myMap.toList() // List [ "Apple", "Banana" ]
   * ```
   */
  toList(): List<V>
  /**
   * Converts this Collection to a Stack, discarding keys. Throws if values
   * are not hashable.
   *
   * Note: This is equivalent to `Stack(this)`, but provided to allow for
   * chained expressions.
   */
  toStack(): Stack<V>
  // Conversion to Seq
  /**
   * Converts this Collection to a Seq of the same kind (indexed,
   * keyed, or set).
   */
  toSeq(): Seq<K, V>
  /**
   * Returns a Seq.Keyed from this Collection where indices are treated as keys.
   *
   * This is useful if you want to operate on an
   * Collection.Indexed and preserve the [index, value] pairs.
   *
   * The returned Seq will have identical iteration order as
   * this Collection.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Seq } = require('immutable')
   * const indexedSeq = Seq([ 'A', 'B', 'C' ])
   * // Seq [ "A", "B", "C" ]
   * indexedSeq.filter(v => v === 'B')
   * // Seq [ "B" ]
   * const keyedSeq = indexedSeq.toKeyedSeq()
   * // Seq { 0: "A", 1: "B", 2: "C" }
   * keyedSeq.filter(v => v === 'B')
   * // Seq { 1: "B" }
   * ```
   */
  toKeyedSeq(): Seq.Keyed<K, V>
  /**
   * Returns an Seq.Indexed of the values of this Collection, discarding keys.
   */
  toIndexedSeq(): Seq.Indexed<V>
  /**
   * Returns a Seq.Set of the values of this Collection, discarding keys.
   */
  toSetSeq(): Seq.Set<V>
  // Iterators
  /**
   * An iterator of this `Collection`'s keys.
   *
   * Note: this will return an ES6 iterator which does not support
   * Immutable.js sequence algorithms. Use `keySeq` instead, if this is
   * what you want.
   */
  keys(): IterableIterator<K>
  /**
   * An iterator of this `Collection`'s values.
   *
   * Note: this will return an ES6 iterator which does not support
   * Immutable.js sequence algorithms. Use `valueSeq` instead, if this is
   * what you want.
   */
  values(): IterableIterator<V>
  /**
   * An iterator of this `Collection`'s entries as `[ key, value ]` tuples.
   *
   * Note: this will return an ES6 iterator which does not support
   * Immutable.js sequence algorithms. Use `entrySeq` instead, if this is
   * what you want.
   */
  entries(): IterableIterator<[K, V]>
  [Symbol.iterator](): IterableIterator<unknown>
  // Collections (Seq)
  /**
   * Returns a new Seq.Indexed of the keys of this Collection,
   * discarding values.
   */
  keySeq(): Seq.Indexed<K>
  /**
   * Returns an Seq.Indexed of the values of this Collection, discarding keys.
   */
  valueSeq(): Seq.Indexed<V>
  /**
   * Returns a new Seq.Indexed of [key, value] tuples.
   */
  entrySeq(): Seq.Indexed<[K, V]>
  // Sequence algorithms
  /**
   * Returns a new Collection of the same type with values passed through a
   * `mapper` function.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Collection } = require('immutable')
   * Collection({ a: 1, b: 2 }).map(x => 10 * x)
   * // Seq { "a": 10, "b": 20 }
   * ```
   *
   * Note: `map()` always returns a new instance, even if it produced the same
   * value at every step.
   */
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Collection<K, M>
  /**
   * Note: used only for sets, which return Collection<M, M> but are otherwise
   * identical to normal `map()`.
   *
   * @ignore
   */
  map(...args: Array<never>): unknown
  /**
   * Returns a new Collection of the same type with only the entries for which
   * the `predicate` function returns true.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map } = require('immutable')
   * Map({ a: 1, b: 2, c: 3, d: 4}).filter(x => x % 2 === 0)
   * // Map { "b": 2, "d": 4 }
   * ```
   *
   * Note: `filter()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): Collection<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
  /**
   * Returns a new Collection of the same type with only the entries for which
   * the `predicate` function returns false.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map } = require('immutable')
   * Map({ a: 1, b: 2, c: 3, d: 4}).filterNot(x => x % 2 === 0)
   * // Map { "a": 1, "c": 3 }
   * ```
   *
   * Note: `filterNot()` always returns a new instance, even if it results in
   * not filtering out any values.
   */
  filterNot(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  /**
   * Returns a new Collection of the same type in reverse order.
   */
  reverse(): this
  /**
   * Returns a new Collection of the same type which includes the same entries,
   * stably sorted by using a `comparator`.
   *
   * If a `comparator` is not provided, a default comparator uses `<` and `>`.
   *
   * `comparator(valueA, valueB)`:
   *
   *   * Returns `0` if the elements should not be swapped.
   *   * Returns `-1` (or any negative number) if `valueA` comes before `valueB`
   *   * Returns `1` (or any positive number) if `valueA` comes after `valueB`
   *   * Is pure, i.e. it must always return the same value for the same pair
   *     of values.
   *
   * When sorting collections which have no defined order, their ordered
   * equivalents will be returned. e.g. `map.sort()` returns OrderedMap.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map } = require('immutable')
   * Map({ "c": 3, "a": 1, "b": 2 }).sort((a, b) => {
   *   if (a < b) { return -1; }
   *   if (a > b) { return 1; }
   *   if (a === b) { return 0; }
   * });
   * // OrderedMap { "a": 1, "b": 2, "c": 3 }
   * ```
   *
   * Note: `sort()` Always returns a new instance, even if the original was
   * already sorted.
   *
   * Note: This is always an eager operation.
   */
  sort(comparator?: (valueA: V, valueB: V) => number): this
  /**
   * Like `sort`, but also accepts a `comparatorValueMapper` which allows for
   * sorting by more sophisticated means:
   *
   * <!-- runkit:activate -->
   * ```js
   * const { Map } = require('immutable')
   * const beattles = Map({
   *   John: { name: "Lennon" },
   *   Paul: { name: "McCartney" },
   *   George: { name: "Harrison" },
   *   Ringo: { name: "Starr" },
   * });
   * beattles.sortBy(member => member.name);
   * ```
   *
   * Note: `sortBy()` Always returns a new instance, even if the original was
   * already sorted.
   *
   * Note: This is always an eager operation.
   */
  sortBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): this
  /**
   * Returns a `Collection.Keyed` of `Collection.Keyeds`, grouped by the return
   * value of the `grouper` function.
   *
   * Note: This is always an eager operation.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List, Map } = require('immutable')
   * const listOfMaps = List([
   *   Map({ v: 0 }),
   *   Map({ v: 1 }),
   *   Map({ v: 1 }),
   *   Map({ v: 0 }),
   *   Map({ v: 2 })
   * ])
   * const groupsOfMaps = listOfMaps.groupBy(x => x.get('v'))
   * // Map {
   * //   0: List [ Map{ "v": 0 }, Map { "v": 0 } ],
   * //   1: List [ Map{ "v": 1 }, Map { "v": 1 } ],
   * //   2: List [ Map{ "v": 2 } ],
   * // }
   * ```
   */
  groupBy<G>(
    grouper: (value: V, key: K, iter: this) => G,
    context?: unknown
  ): /*Map*/ Seq.Keyed<G, /*this*/ Collection<K, V>>
  // Side effects
  /**
   * The `sideEffect` is executed for every entry in the Collection.
   *
   * Unlike `Array#forEach`, if any call of `sideEffect` returns
   * `false`, the iteration will stop. Returns the number of entries iterated
   * (including the last iteration which returned false).
   */
  forEach(
    sideEffect: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): number
  // Creating subsets
  /**
   * Returns a new Collection of the same type representing a portion of this
   * Collection from start up to but not including end.
   *
   * If begin is negative, it is offset from the end of the Collection. e.g.
   * `slice(-2)` returns a Collection of the last two entries. If it is not
   * provided the new Collection will begin at the beginning of this Collection.
   *
   * If end is negative, it is offset from the end of the Collection. e.g.
   * `slice(0, -1)` returns a Collection of everything but the last entry. If
   * it is not provided, the new Collection will continue through the end of
   * this Collection.
   *
   * If the requested slice is equivalent to the current Collection, then it
   * will return itself.
   */
  slice(begin?: number, end?: number): this
  /**
   * Returns a new Collection of the same type containing all entries except
   * the first.
   */
  rest(): this
  /**
   * Returns a new Collection of the same type containing all entries except
   * the last.
   */
  butLast(): this
  /**
   * Returns a new Collection of the same type which excludes the first `amount`
   * entries from this Collection.
   */
  skip(amount: number): this
  /**
   * Returns a new Collection of the same type which excludes the last `amount`
   * entries from this Collection.
   */
  skipLast(amount: number): this
  /**
   * Returns a new Collection of the same type which includes entries starting
   * from when `predicate` first returns false.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List } = require('immutable')
   * List([ 'dog', 'frog', 'cat', 'hat', 'god' ])
   *   .skipWhile(x => x.match(/g/))
   * // List [ "cat", "hat", "god" ]
   * ```
   */
  skipWhile(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  /**
   * Returns a new Collection of the same type which includes entries starting
   * from when `predicate` first returns true.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List } = require('immutable')
   * List([ 'dog', 'frog', 'cat', 'hat', 'god' ])
   *   .skipUntil(x => x.match(/hat/))
   * // List [ "hat", "god" ]
   * ```
   */
  skipUntil(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  /**
   * Returns a new Collection of the same type which includes the first `amount`
   * entries from this Collection.
   */
  take(amount: number): this
  /**
   * Returns a new Collection of the same type which includes the last `amount`
   * entries from this Collection.
   */
  takeLast(amount: number): this
  /**
   * Returns a new Collection of the same type which includes entries from this
   * Collection as long as the `predicate` returns true.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List } = require('immutable')
   * List([ 'dog', 'frog', 'cat', 'hat', 'god' ])
   *   .takeWhile(x => x.match(/o/))
   * // List [ "dog", "frog" ]
   * ```
   */
  takeWhile(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  /**
   * Returns a new Collection of the same type which includes entries from this
   * Collection as long as the `predicate` returns false.
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List } = require('immutable')
   * List([ 'dog', 'frog', 'cat', 'hat', 'god' ])
   *   .takeUntil(x => x.match(/at/))
   * // List [ "dog", "frog" ]
   * ```
   */
  takeUntil(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  // Combination
  /**
   * Returns a new Collection of the same type with other values and
   * collection-like concatenated to this one.
   *
   * For Seqs, all entries will be present in the resulting Seq, even if they
   * have the same key.
   */
  concat(...valuesOrCollections: Array<unknown>): Collection<unknown, unknown>
  /**
   * Flattens nested Collections.
   *
   * Will deeply flatten the Collection by default, returning a Collection of the
   * same type, but a `depth` can be provided in the form of a number or
   * boolean (where true means to shallowly flatten one level). A depth of 0
   * (or shallow: false) will deeply flatten.
   *
   * Flattens only others Collection, not Arrays or Objects.
   *
   * Note: `flatten(true)` operates on Collection<unknown, Collection<K, V>> and
   * returns Collection<K, V>
   */
  flatten(depth?: number): Collection<unknown, unknown>
  // tslint:disable-next-line unified-signatures
  flatten(shallow?: boolean): Collection<unknown, unknown>
  /**
   * Flat-maps the Collection, returning a Collection of the same type.
   *
   * Similar to `collection.map(...).flatten(true)`.
   */
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Collection<K, M>
  /**
   * Flat-maps the Collection, returning a Collection of the same type.
   *
   * Similar to `collection.map(...).flatten(true)`.
   * Used for Dictionaries only.
   */
  flatMap<KM, VM>(
    mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
    context?: unknown
  ): Collection<KM, VM>
  // Reducing a value
  /**
   * Reduces the Collection to a value by calling the `reducer` for every entry
   * in the Collection and passing along the reduced value.
   *
   * If `initialReduction` is not provided, the first item in the
   * Collection will be used.
   *
   * @see `Array#reduce`.
   */
  reduce<R>(
    reducer: (reduction: R, value: V, key: K, iter: this) => R,
    initialReduction: R,
    context?: unknown
  ): R
  reduce<R>(reducer: (reduction: V | R, value: V, key: K, iter: this) => R): R
  /**
   * Reduces the Collection in reverse (from the right side).
   *
   * Note: Similar to this.reverse().reduce(), and provided for parity
   * with `Array#reduceRight`.
   */
  reduceRight<R>(
    reducer: (reduction: R, value: V, key: K, iter: this) => R,
    initialReduction: R,
    context?: unknown
  ): R
  reduceRight<R>(
    reducer: (reduction: V | R, value: V, key: K, iter: this) => R
  ): R
  /**
   * True if `predicate` returns true for all entries in the Collection.
   */
  every(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): boolean
  /**
   * True if `predicate` returns true for any entry in the Collection.
   */
  some(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): boolean
  /**
   * Joins values together as a string, inserting a separator between each.
   * The default separator is `","`.
   */
  join(separator?: string): string
  /**
   * Returns true if this Collection includes no values.
   *
   * For some lazy `Seq`, `isEmpty` might need to iterate to determine
   * emptiness. At most one iteration will occur.
   */
  isEmpty(): boolean
  /**
   * Returns the size of this Collection.
   *
   * Regardless of if this Collection can describe its size lazily (some Seqs
   * cannot), this method will always return the correct size. E.g. it
   * evaluates a lazy `Seq` if necessary.
   *
   * If `predicate` is provided, then this returns the count of entries in the
   * Collection for which the `predicate` returns true.
   */
  count(): number
  count(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): number
  /**
   * Returns a `Seq.Keyed` of counts, grouped by the return value of
   * the `grouper` function.
   *
   * Note: This is not a lazy operation.
   */
  countBy<G>(
    grouper: (value: V, key: K, iter: this) => G,
    context?: unknown
  ): Map<G, number>
  // Search for value
  /**
   * Returns the first value for which the `predicate` returns true.
   */
  find(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): V | undefined
  /**
   * Returns the last value for which the `predicate` returns true.
   *
   * Note: `predicate` will be called for each entry in reverse.
   */
  findLast(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): V | undefined
  /**
   * Returns the first [key, value] entry for which the `predicate` returns true.
   */
  findEntry(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): [K, V] | undefined
  /**
   * Returns the last [key, value] entry for which the `predicate`
   * returns true.
   *
   * Note: `predicate` will be called for each entry in reverse.
   */
  findLastEntry(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): [K, V] | undefined
  /**
   * Returns the key for which the `predicate` returns true.
   */
  findKey(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): K | undefined
  /**
   * Returns the last key for which the `predicate` returns true.
   *
   * Note: `predicate` will be called for each entry in reverse.
   */
  findLastKey(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): K | undefined
  /**
   * Returns the key associated with the search value, or undefined.
   */
  keyOf(searchValue: V): K | undefined
  /**
   * Returns the last key associated with the search value, or undefined.
   */
  lastKeyOf(searchValue: V): K | undefined
  /**
   * Returns the maximum value in this collection. If any values are
   * comparatively equivalent, the first one found will be returned.
   *
   * The `comparator` is used in the same way as `Collection#sort`. If it is not
   * provided, the default comparator is `>`.
   *
   * When two values are considered equivalent, the first encountered will be
   * returned. Otherwise, `max` will operate independent of the order of input
   * as long as the comparator is commutative. The default comparator `>` is
   * commutative *only* when types do not differ.
   *
   * If `comparator` returns 0 and either value is NaN, undefined, or null,
   * that value will be returned.
   */
  max(comparator?: (valueA: V, valueB: V) => number): V | undefined
  /**
   * Like `max`, but also accepts a `comparatorValueMapper` which allows for
   * comparing by more sophisticated means:
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List, } = require('immutable');
   * const l = List([
   *   { name: 'Bob', avgHit: 1 },
   *   { name: 'Max', avgHit: 3 },
   *   { name: 'Lili', avgHit: 2 } ,
   * ]);
   * l.maxBy(i => i.avgHit); // will output { name: 'Max', avgHit: 3 }
   * ```
   */
  maxBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): V | undefined
  /**
   * Returns the minimum value in this collection. If any values are
   * comparatively equivalent, the first one found will be returned.
   *
   * The `comparator` is used in the same way as `Collection#sort`. If it is not
   * provided, the default comparator is `<`.
   *
   * When two values are considered equivalent, the first encountered will be
   * returned. Otherwise, `min` will operate independent of the order of input
   * as long as the comparator is commutative. The default comparator `<` is
   * commutative *only* when types do not differ.
   *
   * If `comparator` returns 0 and either value is NaN, undefined, or null,
   * that value will be returned.
   */
  min(comparator?: (valueA: V, valueB: V) => number): V | undefined
  /**
   * Like `min`, but also accepts a `comparatorValueMapper` which allows for
   * comparing by more sophisticated means:
   *
   * <!-- runkit:activate -->
   * ```js
   * const { List, } = require('immutable');
   * const l = List([
   *   { name: 'Bob', avgHit: 1 },
   *   { name: 'Max', avgHit: 3 },
   *   { name: 'Lili', avgHit: 2 } ,
   * ]);
   * l.minBy(i => i.avgHit); // will output { name: 'Bob', avgHit: 1 }
   * ```
   */
  minBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): V | undefined
  // Comparison
  /**
   * True if `iter` includes every value in this Collection.
   */
  isSubset(iter: Iterable<V>): boolean
  /**
   * True if this Collection includes every value in `iter`.
   */
  isSuperset(iter: Iterable<V>): boolean
}
interface ValueObject {
  equals(other: unknown): boolean
  hashCode(): number
}
function fromJS(
  jsValue: unknown,
  reviver?: (
    key: string | number,
    sequence: Collection.Keyed<string, unknown> | Collection.Indexed<unknown>,
    path?: Array<string | number>
  ) => unknown
): Collection<unknown, unknown>
function is(first: unknown, second: unknown): boolean
function hash(value: unknown): number
function isImmutable(
  maybeImmutable: unknown
): maybeImmutable is Collection<unknown, unknown>
function isCollection(
  maybeCollection: unknown
): maybeCollection is Collection<unknown, unknown>
function isKeyed(
  maybeKeyed: unknown
): maybeKeyed is Collection.Keyed<unknown, unknown>
function isIndexed(
  maybeIndexed: unknown
): maybeIndexed is Collection.Indexed<unknown>
function isAssociative(
  maybeAssociative: unknown
): maybeAssociative is
  | Collection.Keyed<unknown, unknown>
  | Collection.Indexed<unknown>
function isOrdered(maybeOrdered: unknown): boolean
function isValueObject(maybeValue: unknown): maybeValue is ValueObject
function isSeq(
  maybeSeq: unknown
): maybeSeq is
  | Seq.Indexed<unknown>
  | Seq.Keyed<unknown, unknown>
  | Seq.Set<unknown>
function isList(maybeList: unknown): maybeList is List<unknown>
function isMap(maybeMap: unknown): maybeMap is Map<unknown, unknown>
function isOrderedMap(
  maybeOrderedMap: unknown
): maybeOrderedMap is OrderedMap<unknown, unknown>
function isStack(maybeStack: unknown): maybeStack is Stack<unknown>
function isSet(maybeSet: unknown): maybeSet is Set<unknown>
function isOrderedSet(
  maybeOrderedSet: unknown
): maybeOrderedSet is OrderedSet<unknown>
function isRecord(maybeRecord: unknown): maybeRecord is Record<{}>
function get<K, V>(collection: Collection<K, V>, key: K): V | undefined
function get<K, V, NSV>(
  collection: Collection<K, V>,
  key: K,
  notSetValue: NSV
): V | NSV
function get<TProps extends object, K extends keyof TProps>(
  record: Record<TProps>,
  key: K,
  notSetValue: unknown
): TProps[K]
function get<V>(collection: Array<V>, key: number): V | undefined
function get<V, NSV>(
  collection: Array<V>,
  key: number,
  notSetValue: NSV
): V | NSV
function get<C extends object, K extends keyof C>(
  object: C,
  key: K,
  notSetValue: unknown
): C[K]
function get<V>(collection: { [key: string]: V }, key: string): V | undefined
function get<V, NSV>(
  collection: { [key: string]: V },
  key: string,
  notSetValue: NSV
): V | NSV
function has(collection: object, key: unknown): boolean
function remove<K, C extends Collection<K, unknown>>(collection: C, key: K): C
function remove<
  TProps extends object,
  C extends Record<TProps>,
  K extends keyof TProps
>(collection: C, key: K): C
function remove<C extends Array<unknown>>(collection: C, key: number): C
function remove<C, K extends keyof C>(collection: C, key: K): C
function remove<C extends { [key: string]: unknown }, K extends keyof C>(
  collection: C,
  key: K
): C
function set<K, V, C extends Collection<K, V>>(
  collection: C,
  key: K,
  value: V
): C
function set<
  TProps extends object,
  C extends Record<TProps>,
  K extends keyof TProps
>(record: C, key: K, value: TProps[K]): C
function set<V, C extends Array<V>>(collection: C, key: number, value: V): C
function set<C, K extends keyof C>(object: C, key: K, value: C[K]): C
function set<V, C extends { [key: string]: V }>(
  collection: C,
  key: string,
  value: V
): C
function update<K, V, C extends Collection<K, V>>(
  collection: C,
  key: K,
  updater: (value: V | undefined) => V
): C
function update<K, V, C extends Collection<K, V>, NSV>(
  collection: C,
  key: K,
  notSetValue: NSV,
  updater: (value: V | NSV) => V
): C
function update<
  TProps extends object,
  C extends Record<TProps>,
  K extends keyof TProps
>(record: C, key: K, updater: (value: TProps[K]) => TProps[K]): C
function update<
  TProps extends object,
  C extends Record<TProps>,
  K extends keyof TProps,
  NSV
>(
  record: C,
  key: K,
  notSetValue: NSV,
  updater: (value: TProps[K] | NSV) => TProps[K]
): C
function update<V>(
  collection: Array<V>,
  key: number,
  updater: (value: V) => V
): Array<V>
function update<V, NSV>(
  collection: Array<V>,
  key: number,
  notSetValue: NSV,
  updater: (value: V | NSV) => V
): Array<V>
function update<C, K extends keyof C>(
  object: C,
  key: K,
  updater: (value: C[K]) => C[K]
): C
function update<C, K extends keyof C, NSV>(
  object: C,
  key: K,
  notSetValue: NSV,
  updater: (value: C[K] | NSV) => C[K]
): C
function update<V, C extends { [key: string]: V }, K extends keyof C>(
  collection: C,
  key: K,
  updater: (value: V) => V
): { [key: string]: V }
function update<V, C extends { [key: string]: V }, K extends keyof C, NSV>(
  collection: C,
  key: K,
  notSetValue: NSV,
  updater: (value: V | NSV) => V
): { [key: string]: V }
function getIn(
  collection: unknown,
  keyPath: Iterable<unknown>,
  notSetValue?: unknown
): unknown
function hasIn(collection: unknown, keyPath: Iterable<unknown>): boolean
function removeIn<C>(collection: C, keyPath: Iterable<unknown>): C
function setIn<C>(collection: C, keyPath: Iterable<unknown>, value: unknown): C
function updateIn<C>(
  collection: C,
  keyPath: Iterable<unknown>,
  updater: (value: unknown) => unknown
): C
function updateIn<C>(
  collection: C,
  keyPath: Iterable<unknown>,
  notSetValue: unknown,
  updater: (value: unknown) => unknown
): C
function merge<C>(
  collection: C,
  ...collections: Array<
    | Iterable<unknown>
    | Iterable<[unknown, unknown]>
    | { [key: string]: unknown }
  >
): C
function mergeWith<C>(
  merger: (oldVal: unknown, newVal: unknown, key: unknown) => unknown,
  collection: C,
  ...collections: Array<
    | Iterable<unknown>
    | Iterable<[unknown, unknown]>
    | { [key: string]: unknown }
  >
): C
function mergeDeep<C>(
  collection: C,
  ...collections: Array<
    | Iterable<unknown>
    | Iterable<[unknown, unknown]>
    | { [key: string]: unknown }
  >
): C
function mergeDeepWith<C>(
  merger: (oldVal: unknown, newVal: unknown, key: unknown) => unknown,
  collection: C,
  ...collections: Array<
    | Iterable<unknown>
    | Iterable<[unknown, unknown]>
    | { [key: string]: unknown }
  >
): C
