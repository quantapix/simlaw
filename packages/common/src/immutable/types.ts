/* eslint-disable @typescript-eslint/no-namespace */
interface ValueObject {
  equals(other: unknown): boolean
  hashCode(): number
}
export interface Collection<K, V> extends ValueObject {
  equals(other: unknown): boolean
  hashCode(): number
  get<NSV>(key: K, notSetValue: NSV): V | NSV
  get(key: K): V | undefined
  has(key: K): boolean
  includes(value: V): boolean
  contains(value: V): boolean
  first<NSV = undefined>(notSetValue?: NSV): V | NSV
  last<NSV = undefined>(notSetValue?: NSV): V | NSV
  getIn(searchKeyPath: Iterable<unknown>, notSetValue?: unknown): unknown
  hasIn(searchKeyPath: Iterable<unknown>): boolean
  update<R>(updater: (value: this) => R): R
  toJS(): Array<unknown> | { [key: string]: unknown }
  toJSON(): Array<V> | { [key: string]: V }
  toArray(): Array<V> | Array<[K, V]>
  toObject(): { [key: string]: V }
  toMap(): Map<K, V>
  toOrderedMap(): OrderedMap<K, V>
  toSet(): Set<V>
  toOrderedSet(): OrderedSet<V>
  toList(): List<V>
  toStack(): Stack<V>
  toSeq(): Seq<K, V>
  toKeyedSeq(): Seq.Keyed<K, V>
  toIndexedSeq(): Seq.Indexed<V>
  toSetSeq(): Seq.Set<V>
  keys(): IterableIterator<K>
  values(): IterableIterator<V>
  entries(): IterableIterator<[K, V]>
  [Symbol.iterator](): IterableIterator<unknown>
  keySeq(): Seq.Indexed<K>
  valueSeq(): Seq.Indexed<V>
  entrySeq(): Seq.Indexed<[K, V]>
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Collection<K, M>
  map(...args: Array<never>): unknown
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): Collection<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
  filterNot(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  reverse(): this
  sort(comparator?: (valueA: V, valueB: V) => number): this
  sortBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): this
  groupBy<G>(
    grouper: (value: V, key: K, iter: this) => G,
    context?: unknown
  ): /*Map*/ Seq.Keyed<G, /*this*/ Collection<K, V>>
  forEach(
    sideEffect: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): number
  slice(begin?: number, end?: number): this
  rest(): this
  butLast(): this
  skip(amount: number): this
  skipLast(amount: number): this
  skipWhile(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  skipUntil(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  take(amount: number): this
  takeLast(amount: number): this
  takeWhile(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  takeUntil(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): this
  concat(...valuesOrCollections: Array<unknown>): Collection<unknown, unknown>
  flatten(depth?: number): Collection<unknown, unknown>
  flatten(shallow?: boolean): Collection<unknown, unknown>
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Collection<K, M>
  flatMap<KM, VM>(
    mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
    context?: unknown
  ): Collection<KM, VM>
  reduce<R>(
    reducer: (reduction: R, value: V, key: K, iter: this) => R,
    initialReduction: R,
    context?: unknown
  ): R
  reduce<R>(reducer: (reduction: V | R, value: V, key: K, iter: this) => R): R
  reduceRight<R>(
    reducer: (reduction: R, value: V, key: K, iter: this) => R,
    initialReduction: R,
    context?: unknown
  ): R
  reduceRight<R>(
    reducer: (reduction: V | R, value: V, key: K, iter: this) => R
  ): R
  every(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): boolean
  some(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): boolean
  join(separator?: string): string
  isEmpty(): boolean
  count(): number
  count(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): number
  countBy<G>(
    grouper: (value: V, key: K, iter: this) => G,
    context?: unknown
  ): Map<G, number>
  find(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): V | undefined
  findLast(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): V | undefined
  findEntry(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): [K, V] | undefined
  findLastEntry(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown,
    notSetValue?: V
  ): [K, V] | undefined
  findKey(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): K | undefined
  findLastKey(
    predicate: (value: V, key: K, iter: this) => boolean,
    context?: unknown
  ): K | undefined
  keyOf(searchValue: V): K | undefined
  lastKeyOf(searchValue: V): K | undefined
  max(comparator?: (valueA: V, valueB: V) => number): V | undefined
  maxBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): V | undefined
  min(comparator?: (valueA: V, valueB: V) => number): V | undefined
  minBy<C>(
    comparatorValueMapper: (value: V, key: K, iter: this) => C,
    comparator?: (valueA: C, valueB: C) => number
  ): V | undefined
  isSubset(iter: Iterable<V>): boolean
  isSuperset(iter: Iterable<V>): boolean
}
export namespace Collection {
  export function isKeyed(
    maybeKeyed: unknown
  ): maybeKeyed is Collection.Keyed<unknown, unknown>
  export function isIndexed(
    maybeIndexed: unknown
  ): maybeIndexed is Collection.Indexed<unknown>
  export function isAssociative(
    maybeAssociative: unknown
  ): maybeAssociative is
    | Collection.Keyed<unknown, unknown>
    | Collection.Indexed<unknown>
  export function isOrdered(maybeOrdered: unknown): boolean
  export namespace Keyed {}
  export function Keyed<K, V>(
    collection?: Iterable<[K, V]>
  ): Collection.Keyed<K, V>
  export function Keyed<V>(obj: {
    [key: string]: V
  }): Collection.Keyed<string, V>
  export interface Keyed<K, V> extends Collection<K, V> {
    toJS(): { [key: string]: unknown }
    toJSON(): { [key: string]: V }
    toArray(): Array<[K, V]>
    toSeq(): Seq.Keyed<K, V>
    flip(): Collection.Keyed<V, K>
    concat<KC, VC>(
      ...collections: Array<Iterable<[KC, VC]>>
    ): Collection.Keyed<K | KC, V | VC>
    concat<C>(
      ...collections: Array<{ [key: string]: C }>
    ): Collection.Keyed<K | string, V | C>
    map<M>(
      mapper: (value: V, key: K, iter: this) => M,
      context?: unknown
    ): Collection.Keyed<K, M>
    mapKeys<M>(
      mapper: (key: K, value: V, iter: this) => M,
      context?: unknown
    ): Collection.Keyed<M, V>
    mapEntries<KM, VM>(
      mapper: (
        entry: [K, V],
        index: number,
        iter: this
      ) => [KM, VM] | undefined,
      context?: unknown
    ): Collection.Keyed<KM, VM>
    flatMap<KM, VM>(
      mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
      context?: unknown
    ): Collection.Keyed<KM, VM>
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
  export namespace Indexed {}
  export function Indexed<T>(
    collection?: Iterable<T> | ArrayLike<T>
  ): Collection.Indexed<T>
  export interface Indexed<T> extends Collection<number, T> {
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    get<NSV>(index: number, notSetValue: NSV): T | NSV
    get(index: number): T | undefined
    toSeq(): Seq.Indexed<T>
    fromEntrySeq(): Seq.Keyed<unknown, unknown>
    interpose(separator: T): this
    interleave(...collections: Array<Collection<unknown, T>>): this
    splice(index: number, removeNum: number, ...values: Array<T>): this
    zip<U>(other: Collection<unknown, U>): Collection.Indexed<[T, U]>
    zip<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Collection.Indexed<[T, U, V]>
    zip(
      ...collections: Array<Collection<unknown, unknown>>
    ): Collection.Indexed<unknown>
    zipAll<U>(other: Collection<unknown, U>): Collection.Indexed<[T, U]>
    zipAll<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Collection.Indexed<[T, U, V]>
    zipAll(
      ...collections: Array<Collection<unknown, unknown>>
    ): Collection.Indexed<unknown>
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
    indexOf(searchValue: T): number
    lastIndexOf(searchValue: T): number
    findIndex(
      predicate: (value: T, index: number, iter: this) => boolean,
      context?: unknown
    ): number
    findLastIndex(
      predicate: (value: T, index: number, iter: this) => boolean,
      context?: unknown
    ): number
    concat<C>(
      ...valuesOrCollections: Array<Iterable<C> | C>
    ): Collection.Indexed<T | C>
    map<M>(
      mapper: (value: T, key: number, iter: this) => M,
      context?: unknown
    ): Collection.Indexed<M>
    flatMap<M>(
      mapper: (value: T, key: number, iter: this) => Iterable<M>,
      context?: unknown
    ): Collection.Indexed<M>
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
  export namespace Set {}
  export function Set<T>(
    collection?: Iterable<T> | ArrayLike<T>
  ): Collection.Set<T>
  export interface Set<T> extends Collection<T, T> {
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    toSeq(): Seq.Set<T>
    concat<U>(...collections: Array<Iterable<U>>): Collection.Set<T | U>
    map<M>(
      mapper: (value: T, key: T, iter: this) => M,
      context?: unknown
    ): Collection.Set<M>
    flatMap<M>(
      mapper: (value: T, key: T, iter: this) => Iterable<M>,
      context?: unknown
    ): Collection.Set<M>
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
export function Collection<I extends Collection<unknown, unknown>>(
  collection: I
): I
export function Collection<T>(
  collection: Iterable<T> | ArrayLike<T>
): Collection.Indexed<T>
export function Collection<V>(obj: {
  [key: string]: V
}): Collection.Keyed<string, V>
export function Collection<K = unknown, V = unknown>(): Collection<K, V>

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
  readonly size: number
  set(key: K, value: V): this
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
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): OrderedMap<K, M>
  mapKeys<M>(
    mapper: (key: K, value: V, iter: this) => M,
    context?: unknown
  ): OrderedMap<M, V>
  mapEntries<KM, VM>(
    mapper: (entry: [K, V], index: number, iter: this) => [KM, VM] | undefined,
    context?: unknown
  ): OrderedMap<KM, VM>
  flatMap<KM, VM>(
    mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
    context?: unknown
  ): OrderedMap<KM, VM>
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): OrderedMap<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
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
  readonly size: number
  add(value: T): this
  delete(value: T): this
  remove(value: T): this
  clear(): this
  union<C>(...collections: Array<Iterable<C>>): Set<T | C>
  merge<C>(...collections: Array<Iterable<C>>): Set<T | C>
  concat<C>(...collections: Array<Iterable<C>>): Set<T | C>
  intersect(...collections: Array<Iterable<T>>): this
  subtract(...collections: Array<Iterable<T>>): this
  withMutations(mutator: (mutable: this) => unknown): this
  asMutable(): this
  wasAltered(): boolean
  asImmutable(): this
  map<M>(mapper: (value: T, key: T, iter: this) => M, context?: unknown): Set<M>
  flatMap<M>(
    mapper: (value: T, key: T, iter: this) => Iterable<M>,
    context?: unknown
  ): Set<M>
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
  readonly size: number
  union<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  merge<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  concat<C>(...collections: Array<Iterable<C>>): OrderedSet<T | C>
  map<M>(
    mapper: (value: T, key: T, iter: this) => M,
    context?: unknown
  ): OrderedSet<M>
  flatMap<M>(
    mapper: (value: T, key: T, iter: this) => Iterable<M>,
    context?: unknown
  ): OrderedSet<M>
  filter<F extends T>(
    predicate: (value: T, key: T, iter: this) => value is F,
    context?: unknown
  ): OrderedSet<F>
  filter(
    predicate: (value: T, key: T, iter: this) => unknown,
    context?: unknown
  ): this
  zip<U>(other: Collection<unknown, U>): OrderedSet<[T, U]>
  zip<U, V>(
    other1: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): OrderedSet<[T, U, V]>
  zip(...collections: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  zipAll<U>(other: Collection<unknown, U>): OrderedSet<[T, U]>
  zipAll<U, V>(
    other1: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): OrderedSet<[T, U, V]>
  zipAll(
    ...collections: Array<Collection<unknown, unknown>>
  ): OrderedSet<unknown>
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
  readonly size: number
  peek(): T | undefined
  clear(): Stack<T>
  unshift(...values: Array<T>): Stack<T>
  unshiftAll(iter: Iterable<T>): Stack<T>
  shift(): Stack<T>
  push(...values: Array<T>): Stack<T>
  pushAll(iter: Iterable<T>): Stack<T>
  pop(): Stack<T>
  withMutations(mutator: (mutable: this) => unknown): this
  asMutable(): this
  wasAltered(): boolean
  asImmutable(): this
  concat<C>(...valuesOrCollections: Array<Iterable<C> | C>): Stack<T | C>
  map<M>(
    mapper: (value: T, key: number, iter: this) => M,
    context?: unknown
  ): Stack<M>
  flatMap<M>(
    mapper: (value: T, key: number, iter: this) => Iterable<M>,
    context?: unknown
  ): Stack<M>
  filter<F extends T>(
    predicate: (value: T, index: number, iter: this) => value is F,
    context?: unknown
  ): Set<F>
  filter(
    predicate: (value: T, index: number, iter: this) => unknown,
    context?: unknown
  ): this
  zip<U>(other: Collection<unknown, U>): Stack<[T, U]>
  zip<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): Stack<[T, U, V]>
  zip(...collections: Array<Collection<unknown, unknown>>): Stack<unknown>
  zipAll<U>(other: Collection<unknown, U>): Stack<[T, U]>
  zipAll<U, V>(
    other: Collection<unknown, U>,
    other2: Collection<unknown, V>
  ): Stack<[T, U, V]>
  zipAll(...collections: Array<Collection<unknown, unknown>>): Stack<unknown>
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
  has(key: string): key is keyof TProps & string
  get<K extends keyof TProps>(key: K, notSetValue?: unknown): TProps[K]
  get<T>(key: string, notSetValue: T): T
  hasIn(keyPath: Iterable<unknown>): boolean
  getIn(keyPath: Iterable<unknown>): unknown
  equals(other: unknown): boolean
  hashCode(): number
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
  delete<K extends keyof TProps>(key: K): this
  remove<K extends keyof TProps>(key: K): this
  clear(): this
  setIn(keyPath: Iterable<unknown>, value: unknown): this
  updateIn(
    keyPath: Iterable<unknown>,
    updater: (value: unknown) => unknown
  ): this
  mergeIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  mergeDeepIn(keyPath: Iterable<unknown>, ...collections: Array<unknown>): this
  deleteIn(keyPath: Iterable<unknown>): this
  removeIn(keyPath: Iterable<unknown>): this
  toJS(): { [K in keyof TProps]: unknown }
  toJSON(): TProps
  toObject(): TProps
  withMutations(mutator: (mutable: this) => unknown): this
  asMutable(): this
  wasAltered(): boolean
  asImmutable(): this
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
    toJS(): { [key: string]: unknown }
    toJSON(): { [key: string]: V }
    toArray(): Array<[K, V]>
    toSeq(): this
    concat<KC, VC>(
      ...collections: Array<Iterable<[KC, VC]>>
    ): Seq.Keyed<K | KC, V | VC>
    concat<C>(
      ...collections: Array<{ [key: string]: C }>
    ): Seq.Keyed<K | string, V | C>
    map<M>(
      mapper: (value: V, key: K, iter: this) => M,
      context?: unknown
    ): Seq.Keyed<K, M>
    mapKeys<M>(
      mapper: (key: K, value: V, iter: this) => M,
      context?: unknown
    ): Seq.Keyed<M, V>
    mapEntries<KM, VM>(
      mapper: (
        entry: [K, V],
        index: number,
        iter: this
      ) => [KM, VM] | undefined,
      context?: unknown
    ): Seq.Keyed<KM, VM>
    flatMap<KM, VM>(
      mapper: (value: V, key: K, iter: this) => Iterable<[KM, VM]>,
      context?: unknown
    ): Seq.Keyed<KM, VM>
    filter<F extends V>(
      predicate: (value: V, key: K, iter: this) => value is F,
      context?: unknown
    ): Seq.Keyed<K, F>
    filter(
      predicate: (value: V, key: K, iter: this) => unknown,
      context?: unknown
    ): this
    flip(): Seq.Keyed<V, K>
    [Symbol.iterator](): IterableIterator<[K, V]>
  }
  namespace Indexed {
    function of<T>(...values: Array<T>): Seq.Indexed<T>
  }
  function Indexed<T>(collection?: Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
  interface Indexed<T> extends Seq<number, T>, Collection.Indexed<T> {
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    toSeq(): this
    concat<C>(
      ...valuesOrCollections: Array<Iterable<C> | C>
    ): Seq.Indexed<T | C>
    map<M>(
      mapper: (value: T, key: number, iter: this) => M,
      context?: unknown
    ): Seq.Indexed<M>
    flatMap<M>(
      mapper: (value: T, key: number, iter: this) => Iterable<M>,
      context?: unknown
    ): Seq.Indexed<M>
    filter<F extends T>(
      predicate: (value: T, index: number, iter: this) => value is F,
      context?: unknown
    ): Seq.Indexed<F>
    filter(
      predicate: (value: T, index: number, iter: this) => unknown,
      context?: unknown
    ): this
    zip<U>(other: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zip<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Seq.Indexed<[T, U, V]>
    zip(
      ...collections: Array<Collection<unknown, unknown>>
    ): Seq.Indexed<unknown>
    zipAll<U>(other: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zipAll<U, V>(
      other: Collection<unknown, U>,
      other2: Collection<unknown, V>
    ): Seq.Indexed<[T, U, V]>
    zipAll(
      ...collections: Array<Collection<unknown, unknown>>
    ): Seq.Indexed<unknown>
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
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    toSeq(): this
    concat<U>(...collections: Array<Iterable<U>>): Seq.Set<T | U>
    map<M>(
      mapper: (value: T, key: T, iter: this) => M,
      context?: unknown
    ): Seq.Set<M>
    flatMap<M>(
      mapper: (value: T, key: T, iter: this) => Iterable<M>,
      context?: unknown
    ): Seq.Set<M>
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
  readonly size: number | undefined
  cacheResult(): this
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Seq<K, M>
  map<M>(
    mapper: (value: V, key: K, iter: this) => M,
    context?: unknown
  ): Seq<M, M>
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Seq<K, M>
  flatMap<M>(
    mapper: (value: V, key: K, iter: this) => Iterable<M>,
    context?: unknown
  ): Seq<M, M>
  filter<F extends V>(
    predicate: (value: V, key: K, iter: this) => value is F,
    context?: unknown
  ): Seq<K, F>
  filter(
    predicate: (value: V, key: K, iter: this) => unknown,
    context?: unknown
  ): this
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
