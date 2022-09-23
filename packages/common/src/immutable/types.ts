/* eslint-disable @typescript-eslint/no-namespace */

export interface Dict<T = unknown> {
  [k: string]: T
}

export interface ValueObject {
  equals(x: unknown): boolean
  hashCode(): number
}

export interface Collection<K, V> {
  [Symbol.iterator](): IterableIterator<unknown>
  butLast(): this
  concat(...xs: Array<unknown>): Collection<unknown, unknown>
  contains(v: V): boolean
  count(): number
  count(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): number
  countBy<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Map<T, number>
  entries(): IterableIterator<[K, V]>
  entrySeq(): Seq.Indexed<[K, V]>
  equals(x: unknown): boolean
  every(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): boolean
  filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Collection<K, T>
  filterNot(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  find(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown, v0?: V): V | undefined
  findEntry(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown, v0?: V): [K, V] | undefined
  findKey(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): K | undefined
  findLast(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown, v0?: V): V | undefined
  findLastEntry(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown, v0?: V): [K, V] | undefined
  findLastKey(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): K | undefined
  first<T = undefined>(v0?: T): V | T
  flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): Collection<K2, V2>
  flatMap<T>(f: (v: V, k: K, iter: this) => Iterable<T>, ctx?: unknown): Collection<K, T>
  flatten(depth?: number): Collection<unknown, unknown>
  flatten(shallow?: boolean): Collection<unknown, unknown>
  forEach(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): number
  get(k: K): V | undefined
  get<T>(k: K, v0: T): V | T
  getIn(x: Iterable<unknown>, v0?: unknown): unknown
  groupBy<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Seq.Keyed<T, Collection<K, V>>
  has(k: K): boolean
  hashCode(): number
  hasIn(x: Iterable<unknown>): boolean
  includes(v: V): boolean
  isEmpty(): boolean
  isSubset(x: Iterable<V>): boolean
  isSuperset(x: Iterable<V>): boolean
  join(separator?: string): string
  keyOf(v: V): K | undefined
  keys(): IterableIterator<K>
  keySeq(): Seq.Indexed<K>
  last<T = undefined>(v0?: T): V | T
  lastKeyOf(v: V): K | undefined
  map(...xs: Array<never>): unknown
  map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Collection<K, T>
  max(c?: (a: V, b: V) => number): V | undefined
  maxBy<T>(f: (v: V, k: K, iter: this) => T, c?: (a: T, b: T) => number): V | undefined
  min(c?: (a: V, b: V) => number): V | undefined
  minBy<T>(f: (v: V, k: K, iter: this) => T, c?: (a: T, b: T) => number): V | undefined
  reduce<T>(f: (y: T, v: V, k: K, iter: this) => T, y0: T, ctx?: unknown): T
  reduce<T>(f: (y: V | T, v: V, k: K, iter: this) => T): T
  reduceRight<T>(f: (y: T, v: V, k: K, iter: this) => T, y0: T, ctx?: unknown): T
  reduceRight<T>(f: (y: V | T, v: V, k: K, iter: this) => T): T
  rest(): this
  reverse(): this
  skip(x: number): this
  skipLast(x: number): this
  skipUntil(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  skipWhile(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  slice(begin?: number, end?: number): this
  some(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): boolean
  sort(comparator?: (a: V, b: V) => number): this
  sortBy<T>(f: (v: V, k: K, iter: this) => T, c?: (a: T, b: T) => number): this
  take(x: number): this
  takeLast(x: number): this
  takeUntil(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  takeWhile(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  toArray(): Array<V> | Array<[K, V]>
  toIndexedSeq(): Seq.Indexed<V>
  toJS(): Array<unknown> | Dict<unknown>
  toJSON(): Array<V> | Dict<V>
  toKeyedSeq(): Seq.Keyed<K, V>
  toList(): List<V>
  toMap(): Map<K, V>
  toObject(): Dict<V>
  toOrderedMap(): OrderedMap<K, V>
  toOrderedSet(): OrderedSet<V>
  toSeq(): Seq<K, V>
  toSet(): Set<V>
  toSetSeq(): Seq.Set<V>
  toStack(): Stack<V>
  update<R>(f: (x: this) => R): R
  values(): IterableIterator<V>
  valueSeq(): Seq.Indexed<V>
}

export namespace Collection {
  export function isKeyed(x: unknown): x is Collection.Keyed<unknown, unknown>
  export function isIndexed(x: unknown): x is Collection.Indexed<unknown>
  export function isAssociative(x: unknown): x is Collection.Keyed<unknown, unknown> | Collection.Indexed<unknown>
  export function isOrdered(x: unknown): boolean
  export namespace Keyed {}
  export function Keyed<K, V>(x?: Iterable<[K, V]>): Collection.Keyed<K, V>
  export function Keyed<V>(x: Dict<V>): Collection.Keyed<string, V>
  export interface Keyed<K, V> extends Collection<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>
    concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Collection.Keyed<K | K2, V | V2>
    concat<T>(...xs: Array<Dict<T>>): Collection.Keyed<K | string, V | T>
    filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
    filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Collection.Keyed<K, T>
    flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): Collection.Keyed<K2, V2>
    flip(): Collection.Keyed<V, K>
    map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Collection.Keyed<K, T>
    mapEntries<K2, V2>(f: (x: [K, V], i: number, iter: this) => [K2, V2] | undefined, ctx?: unknown): Collection.Keyed<K2, V2>
    mapKeys<T>(f: (k: K, v: V, iter: this) => T, ctx?: unknown): Collection.Keyed<T, V>
    toArray(): Array<[K, V]>
    toJS(): Dict
    toJSON(): Dict<V>
    toSeq(): Seq.Keyed<K, V>
  }
  export namespace Indexed {}
  export function Indexed<V>(x?: Iterable<V> | ArrayLike<V>): Collection.Indexed<V>
  export interface Indexed<V> extends Collection<number, V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<T>(...xs: Array<Iterable<T> | T>): Collection.Indexed<V | T>
    filter(f: (v: V, i: number, iter: this) => unknown, ctx?: unknown): this
    filter<T extends V>(f: (v: V, i: number, iter: this) => v is T, ctx?: unknown): Collection.Indexed<T>
    findIndex(f: (v: V, i: number, iter: this) => boolean, ctx?: unknown): number
    findLastIndex(f: (v: V, i: number, iter: this) => boolean, ctx?: unknown): number
    flatMap<T>(f: (v: V, i: number, iter: this) => Iterable<T>, ctx?: unknown): Collection.Indexed<T>
    fromEntrySeq(): Seq.Keyed<unknown, unknown>
    get(i: number): V | undefined
    get<T>(i: number, v0: T): V | T
    indexOf(v: V): number
    interleave(...xs: Array<Collection<unknown, V>>): this
    interpose(v: V): this
    lastIndexOf(v: V): number
    map<T>(f: (v: V, i: number, iter: this) => T, ctx?: unknown): Collection.Indexed<T>
    splice(i: number, removeNum: number, ...vs: Array<V>): this
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): Seq.Indexed<V>
    zip(...xs: Array<Collection<unknown, unknown>>): Collection.Indexed<unknown>
    zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Collection.Indexed<[V, T, U]>
    zip<T>(x: Collection<unknown, T>): Collection.Indexed<[V, T]>
    zipAll(...xs: Array<Collection<unknown, unknown>>): Collection.Indexed<unknown>
    zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Collection.Indexed<[V, T, U]>
    zipAll<T>(x: Collection<unknown, T>): Collection.Indexed<[V, T]>
    zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): Collection.Indexed<Z>
    zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Collection.Indexed<U>
    zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Collection.Indexed<T>
  }
  export namespace Set {}
  export function Set<K>(x?: Iterable<K> | ArrayLike<K>): Collection.Set<K>
  export interface Set<K> extends Collection<K, K> {
    [Symbol.iterator](): IterableIterator<K>
    concat<U>(...xs: Array<Iterable<U>>): Collection.Set<K | U>
    filter(f: (v: K, k: K, iter: this) => unknown, ctx?: unknown): this
    filter<T extends K>(f: (v: K, k: K, iter: this) => v is T, ctx?: unknown): Collection.Set<T>
    flatMap<T>(f: (v: K, k: K, iter: this) => Iterable<T>, ctx?: unknown): Collection.Set<T>
    map<T>(f: (v: K, k: K, iter: this) => T, ctx?: unknown): Collection.Set<T>
    toArray(): Array<K>
    toJS(): Array<unknown>
    toJSON(): Array<K>
    toSeq(): Seq.Set<K>
  }
}
export function Collection<T extends Collection<unknown, unknown>>(x: T): T
export function Collection<T>(x: Iterable<T> | ArrayLike<T>): Collection.Indexed<T>
export function Collection<V>(x: Dict<V>): Collection.Keyed<string, V>
export function Collection<K = unknown, V = unknown>(): Collection<K, V>

export interface List<V> extends Collection.Indexed<V> {
  readonly size: number
  asImmutable(): this
  asMutable(): this
  clear(): List<V>
  concat<T>(...xs: Array<Iterable<T> | T>): List<V | T>
  delete(i: number): List<V>
  deleteIn(x: Iterable<unknown>): this
  filter(f: (v: V, i: number, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, i: number, iter: this) => v is T, ctx?: unknown): List<T>
  flatMap<T>(f: (v: V, i: number, iter: this) => Iterable<T>, ctx?: unknown): List<T>
  insert(i: number, v: V): List<V>
  map<T>(f: (v: V, i: number, iter: this) => T, ctx?: unknown): List<T>
  merge<T>(...xs: Array<Iterable<T>>): List<V | T>
  mergeDeepIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  pop(): List<V>
  push(...vs: Array<V>): List<V>
  remove(i: number): List<V>
  removeIn(x: Iterable<unknown>): this
  set(i: number, v: V): List<V>
  setIn(x: Iterable<unknown>, v: unknown): this
  setSize(size: number): List<V>
  shift(): List<V>
  unshift(...vs: Array<V>): List<V>
  update(i: number, f: (v: V | undefined) => V): this
  update(i: number, v0: V, f: (v: V) => V): this
  update<R>(f: (x: this) => R): R
  updateIn(x: Iterable<unknown>, f: (x: unknown) => unknown): this
  updateIn(x: Iterable<unknown>, v0: unknown, f: (x: unknown) => unknown): this
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
  zip(...xs: Array<Collection<unknown, unknown>>): List<unknown>
  zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, V>): List<[V, T, U]>
  zip<T>(x: Collection<unknown, T>): List<[V, T]>
  zipAll(...xs: Array<Collection<unknown, unknown>>): List<unknown>
  zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): List<[V, T, U]>
  zipAll<T>(x: Collection<unknown, T>): List<[V, T]>
  zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): List<Z>
  zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): List<U>
  zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): List<T>
}

namespace List {
  function isList(x: unknown): x is List<unknown>
  function of<T>(...xs: Array<T>): List<T>
}
function List<T>(x?: Iterable<T> | ArrayLike<T>): List<T>

namespace Map {
  function isMap(x: unknown): x is Map<unknown, unknown>
  function of(...xs: Array<unknown>): Map<unknown, unknown>
}
function Map<K, V>(x?: Iterable<[K, V]>): Map<K, V>
function Map<V>(x: Dict<V>): Map<string, V>
function Map<K extends string | symbol, V>(x: { [P in K]?: V }): Map<K, V>

interface Map<K, V> extends Collection.Keyed<K, V> {
  readonly size: number
  asImmutable(): this
  asMutable(): this
  clear(): this
  concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Map<K | K2, V | V2>
  concat<T>(...xs: Array<Dict<T>>): Map<K | string, V | T>
  delete(k: K): this
  deleteAll(ks: Iterable<K>): this
  deleteIn(x: Iterable<unknown>): this
  filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Map<K, T>
  flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): Map<K2, V2>
  flip(): Map<V, K>
  map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Map<K, T>
  mapEntries<K2, V2>(f: (x: [K, V], i: number, iter: this) => [K2, V2] | undefined, ctx?: unknown): Map<K2, V2>
  mapKeys<T>(f: (k: K, v: V, iter: this) => T, ctx?: unknown): Map<T, V>
  merge<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Map<K | K2, V | V2>
  merge<T>(...xs: Array<Dict<T>>): Map<K | string, V | T>
  mergeDeep(...xs: Array<Iterable<[K, V]> | Dict<V>>): this
  mergeDeepIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeDeepWith(f: (old: unknown, v: unknown, k: unknown) => unknown, ...xs: Array<Iterable<[K, V]> | Dict<V>>): this
  mergeIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeWith(f: (old: V, v: V, k: K) => V, ...xs: Array<Iterable<[K, V]> | Dict<V>>): this
  remove(k: K): this
  removeAll(ks: Iterable<K>): this
  removeIn(k: Iterable<unknown>): this
  set(k: K, v: V): this
  setIn(x: Iterable<unknown>, v: unknown): this
  update(k: K, f: (v: V | undefined) => V): this
  update(k: K, v0: V, f: (v: V) => V): this
  update<T>(f: (x: this) => T): T
  updateIn(x: Iterable<unknown>, f: (x: unknown) => unknown): this
  updateIn(x: Iterable<unknown>, v0: unknown, f: (x: unknown) => unknown): this
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
}

namespace OrderedMap {
  function isOrderedMap(x: unknown): x is OrderedMap<unknown, unknown>
}
function OrderedMap<K, V>(x?: Iterable<[K, V]>): OrderedMap<K, V>
function OrderedMap<V>(x: Dict<V>): OrderedMap<string, V>

interface OrderedMap<K, V> extends Map<K, V> {
  readonly size: number
  concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): OrderedMap<K | K2, V | V2>
  concat<T>(...xs: Array<Dict<T>>): OrderedMap<K | string, V | T>
  filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): OrderedMap<K, T>
  flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): OrderedMap<K2, V2>
  flip(): OrderedMap<V, K>
  map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): OrderedMap<K, T>
  mapEntries<K2, V2>(f: (x: [K, V], i: number, iter: this) => [K2, V2] | undefined, ctx?: unknown): OrderedMap<K2, V2>
  mapKeys<T>(f: (k: K, v: V, iter: this) => T, ctx?: unknown): OrderedMap<T, V>
  merge<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): OrderedMap<K | K2, V | V2>
  merge<T>(...xs: Array<Dict<T>>): OrderedMap<K | string, V | T>
  set(k: K, v: V): this
}

namespace Set {
  function isSet(x: unknown): x is Set<unknown>
  function of<T>(...xs: Array<T>): Set<T>
  function fromKeys<T>(x: Collection<T, unknown>): Set<T>
  function fromKeys(x: Dict): Set<string>
  function intersect<T>(x: Iterable<Iterable<T>>): Set<T>
  function union<T>(x: Iterable<Iterable<T>>): Set<T>
}
function Set<K>(x?: Iterable<K> | ArrayLike<K>): Set<K>

interface Set<K> extends Collection.Set<K> {
  readonly size: number
  add(v: K): this
  asImmutable(): this
  asMutable(): this
  clear(): this
  concat<T>(...xs: Array<Iterable<T>>): Set<K | T>
  delete(v: K): this
  filter(f: (v: K, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends K>(f: (v: K, k: K, iter: this) => v is T, ctx?: unknown): Set<T>
  flatMap<T>(f: (v: K, k: K, iter: this) => Iterable<T>, ctx?: unknown): Set<T>
  intersect(...xs: Array<Iterable<K>>): this
  map<T>(f: (v: K, k: K, iter: this) => T, ctx?: unknown): Set<T>
  merge<T>(...xs: Array<Iterable<T>>): Set<K | T>
  remove(v: K): this
  subtract(...xs: Array<Iterable<K>>): this
  union<T>(...xs: Array<Iterable<T>>): Set<K | T>
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
}

namespace OrderedSet {
  function isOrderedSet(maybeOrderedSet: unknown): boolean
  function of<T>(...xs: Array<T>): OrderedSet<T>
  function fromKeys<T>(iter: Collection<T, unknown>): OrderedSet<T>
  function fromKeys(obj: Dict): OrderedSet<string>
}
function OrderedSet<T>(collection?: Iterable<T> | ArrayLike<T>): OrderedSet<T>

interface OrderedSet<K> extends Set<K> {
  readonly size: number
  concat<T>(...xs: Array<Iterable<T>>): OrderedSet<K | T>
  filter(f: (v: K, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends K>(f: (v: K, k: K, iter: this) => v is T, ctx?: unknown): OrderedSet<T>
  flatMap<T>(f: (v: K, k: K, iter: this) => Iterable<T>, ctx?: unknown): OrderedSet<T>
  map<T>(f: (v: K, k: K, iter: this) => T, ctx?: unknown): OrderedSet<T>
  merge<T>(...xs: Array<Iterable<T>>): OrderedSet<K | T>
  union<T>(...xs: Array<Iterable<T>>): OrderedSet<K | T>
  zip(...xs: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<[K, T, U]>
  zip<T>(x: Collection<unknown, T>): OrderedSet<[K, T]>
  zipAll(...xs: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<[K, T, U]>
  zipAll<T>(x: Collection<unknown, T>): OrderedSet<[K, T]>
  zipWith<T, U, Z>(f: (v: K, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<Z>
  zipWith<T, U>(f: (v: K, x: T) => U, x: Collection<unknown, T>): OrderedSet<U>
  zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): OrderedSet<T>
}

namespace Stack {
  function isStack(x: unknown): x is Stack<unknown>
  function of<V>(...xs: Array<V>): Stack<V>
}
function Stack<V>(x?: Iterable<V> | ArrayLike<V>): Stack<V>

interface Stack<V> extends Collection.Indexed<V> {
  readonly size: number
  asImmutable(): this
  asMutable(): this
  clear(): Stack<V>
  concat<T>(...xs: Array<Iterable<T> | T>): Stack<V | T>
  filter(f: (v: V, i: number, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, i: number, iter: this) => v is T, ctx?: unknown): Set<T>
  flatMap<T>(f: (v: V, i: number, iter: this) => Iterable<T>, ctx?: unknown): Stack<T>
  map<T>(f: (v: V, i: number, iter: this) => T, ctx?: unknown): Stack<T>
  peek(): V | undefined
  pop(): Stack<V>
  push(...xs: Array<V>): Stack<V>
  pushAll(x: Iterable<V>): Stack<V>
  shift(): Stack<V>
  unshift(...xs: Array<V>): Stack<V>
  unshiftAll(x: Iterable<V>): Stack<V>
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
  zip(...xs: Array<Collection<unknown, unknown>>): Stack<unknown>
  zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Stack<[V, T, U]>
  zip<T>(x: Collection<unknown, T>): Stack<[V, T]>
  zipAll(...xs: Array<Collection<unknown, unknown>>): Stack<unknown>
  zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Stack<[V, T, U]>
  zipAll<T>(x: Collection<unknown, T>): Stack<[V, T]>
  zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): Stack<Z>
  zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Stack<U>
  zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Stack<T>
}

function Range(start?: number, end?: number, step?: number): Seq.Indexed<number>
function Repeat<T>(value: T, times?: number): Seq.Indexed<T>
namespace Record {
  function isRecord(maybeRecord: unknown): maybeRecord is Record<{}>
  function getDescriptiveName(record: Record<any>): string
  namespace Factory {}
  interface Factory<TProps extends object> {
    (values?: Partial<TProps> | Iterable<[string, unknown]>): Record<TProps> & Readonly<TProps>
    new (values?: Partial<TProps> | Iterable<[string, unknown]>): Record<TProps> & Readonly<TProps>
    displayName: string
  }
  function Factory<TProps extends object>(values?: Partial<TProps> | Iterable<[string, unknown]>): Record<TProps> & Readonly<TProps>
}

function Record<TProps extends object>(defaultValues: TProps, name?: string): Record.Factory<TProps>

interface Record<TProps extends object> {
  [Symbol.iterator](): IterableIterator<[keyof TProps, TProps[keyof TProps]]>
  asImmutable(): this
  asMutable(): this
  clear(): this
  delete<K extends keyof TProps>(k: K): this
  deleteIn(x: Iterable<unknown>): this
  equals(x: unknown): boolean
  get<K extends keyof TProps>(k: K, v0?: unknown): TProps[K]
  get<T>(k: string, v0: T): T
  getIn(x: Iterable<unknown>): unknown
  has(k: string): k is keyof TProps & string
  hashCode(): number
  hasIn(x: Iterable<unknown>): boolean
  merge(...xs: Array<Partial<TProps> | Iterable<[string, unknown]>>): this
  mergeDeep(...xs: Array<Partial<TProps> | Iterable<[string, unknown]>>): this
  mergeDeepIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeDeepWith(merger: (old: unknown, newVal: unknown, key: unknown) => unknown, ...xs: Array<Partial<TProps> | Iterable<[string, unknown]>>): this
  mergeIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeWith(merger: (old: unknown, newVal: unknown, k: keyof TProps) => unknown, ...xs: Array<Partial<TProps> | Iterable<[string, unknown]>>): this
  remove<K extends keyof TProps>(k: K): this
  removeIn(x: Iterable<unknown>): this
  set<K extends keyof TProps>(k: K, value: TProps[K]): this
  setIn(x: Iterable<unknown>, value: unknown): this
  toJS(): { [K in keyof TProps]: unknown }
  toJSON(): TProps
  toObject(): TProps
  toSeq(): Seq.Keyed<keyof TProps, TProps[keyof TProps]>
  update<K extends keyof TProps>(k: K, f: (value: TProps[K]) => TProps[K]): this
  updateIn(x: Iterable<unknown>, f: (value: unknown) => unknown): this
  wasAltered(): boolean
  withMutations(mutator: (mutable: this) => unknown): this
}
type RecordOf<TProps extends object> = Record<TProps> & Readonly<TProps>

namespace Seq {
  function isSeq(maybeSeq: unknown): maybeSeq is Seq.Indexed<unknown> | Seq.Keyed<unknown, unknown> | Seq.Set<unknown>
  namespace Keyed {}
  function Keyed<K, V>(collection?: Iterable<[K, V]>): Seq.Keyed<K, V>
  function Keyed<V>(obj: Dict<V>): Seq.Keyed<string, V>
  interface Keyed<K, V> extends Seq<K, V>, Collection.Keyed<K, V> {
    toJS(): Dict
    toJSON(): Dict<V>
    toArray(): Array<[K, V]>
    toSeq(): this
    concat<KC, VC>(...xs: Array<Iterable<[KC, VC]>>): Seq.Keyed<K | KC, V | VC>
    concat<C>(...xs: Array<Dict<C>>): Seq.Keyed<K | string, V | C>
    map<M>(f: (v: V, k: K, iter: this) => M, ctx?: unknown): Seq.Keyed<K, M>
    mapKeys<M>(f: (k: K, v: V, iter: this) => M, ctx?: unknown): Seq.Keyed<M, V>
    mapEntries<KM, VM>(f: (entry: [K, V], i: number, iter: this) => [KM, VM] | undefined, ctx?: unknown): Seq.Keyed<KM, VM>
    flatMap<KM, VM>(f: (v: V, k: K, iter: this) => Iterable<[KM, VM]>, ctx?: unknown): Seq.Keyed<KM, VM>
    filter<F extends V>(f: (v: V, k: K, iter: this) => value is F, ctx?: unknown): Seq.Keyed<K, F>
    filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
    flip(): Seq.Keyed<V, K>
    [Symbol.iterator](): IterableIterator<[K, V]>
  }
  namespace Indexed {
    function of<T>(...xs: Array<T>): Seq.Indexed<T>
  }
  function Indexed<T>(collection?: Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
  interface Indexed<T> extends Seq<number, T>, Collection.Indexed<T> {
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    toSeq(): this
    concat<C>(...valuesOrCollections: Array<Iterable<C> | C>): Seq.Indexed<T | C>
    map<M>(f: (value: T, key: number, iter: this) => M, ctx?: unknown): Seq.Indexed<M>
    flatMap<M>(f: (value: T, key: number, iter: this) => Iterable<M>, ctx?: unknown): Seq.Indexed<M>
    filter<F extends T>(f: (value: T, i: number, iter: this) => value is F, ctx?: unknown): Seq.Indexed<F>
    filter(f: (value: T, i: number, iter: this) => unknown, ctx?: unknown): this
    zip<U>(x: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zip<U, V>(x: Collection<unknown, U>, other2: Collection<unknown, V>): Seq.Indexed<[T, U, V]>
    zip(...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<unknown>
    zipAll<U>(x: Collection<unknown, U>): Seq.Indexed<[T, U]>
    zipAll<U, V>(x: Collection<unknown, U>, other2: Collection<unknown, V>): Seq.Indexed<[T, U, V]>
    zipAll(...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<unknown>
    zipWith<U, Z>(zipper: (value: T, otherValue: U) => Z, otherCollection: Collection<unknown, U>): Seq.Indexed<Z>
    zipWith<U, V, Z>(zipper: (value: T, otherValue: U, thirdValue: V) => Z, otherCollection: Collection<unknown, U>, thirdCollection: Collection<unknown, V>): Seq.Indexed<Z>
    zipWith<Z>(zipper: (...xs: Array<unknown>) => Z, ...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<Z>
    [Symbol.iterator](): IterableIterator<T>
  }
  namespace Set {
    function of<T>(...xs: Array<T>): Seq.Set<T>
  }
  function Set<T>(collection?: Iterable<T> | ArrayLike<T>): Seq.Set<T>
  interface Set<T> extends Seq<T, T>, Collection.Set<T> {
    toJS(): Array<unknown>
    toJSON(): Array<T>
    toArray(): Array<T>
    toSeq(): this
    concat<U>(...xs: Array<Iterable<U>>): Seq.Set<T | U>
    map<M>(f: (value: T, key: T, iter: this) => M, ctx?: unknown): Seq.Set<M>
    flatMap<M>(f: (value: T, key: T, iter: this) => Iterable<M>, ctx?: unknown): Seq.Set<M>
    filter<F extends T>(f: (value: T, key: T, iter: this) => value is F, ctx?: unknown): Seq.Set<F>
    filter(f: (value: T, key: T, iter: this) => unknown, ctx?: unknown): this
    [Symbol.iterator](): IterableIterator<T>
  }
}
function Seq<S extends Seq<unknown, unknown>>(seq: S): S
function Seq<K, V>(collection: Collection.Keyed<K, V>): Seq.Keyed<K, V>
function Seq<T>(collection: Collection.Set<T>): Seq.Set<T>
function Seq<T>(collection: Collection.Indexed<T> | Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
function Seq<V>(obj: Dict<V>): Seq.Keyed<string, V>
function Seq<K = unknown, V = unknown>(): Seq<K, V>
interface Seq<K, V> extends Collection<K, V> {
  readonly size: number | undefined
  cacheResult(): this
  map<M>(f: (v: V, k: K, iter: this) => M, ctx?: unknown): Seq<K, M>
  map<M>(f: (v: V, k: K, iter: this) => M, ctx?: unknown): Seq<M, M>
  flatMap<M>(f: (v: V, k: K, iter: this) => Iterable<M>, ctx?: unknown): Seq<K, M>
  flatMap<M>(f: (v: V, k: K, iter: this) => Iterable<M>, ctx?: unknown): Seq<M, M>
  filter<F extends V>(f: (v: V, k: K, iter: this) => value is F, ctx?: unknown): Seq<K, F>
  filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
}
function fromJS(
  jsValue: unknown,
  reviver?: (k: string | number, sequence: Collection.Keyed<string, unknown> | Collection.Indexed<unknown>, path?: Array<string | number>) => unknown
): Collection<unknown, unknown>
function is(first: unknown, second: unknown): boolean
function hash(value: unknown): number
function isImmutable(maybeImmutable: unknown): maybeImmutable is Collection<unknown, unknown>
function isCollection(maybeCollection: unknown): maybeCollection is Collection<unknown, unknown>
function isKeyed(maybeKeyed: unknown): maybeKeyed is Collection.Keyed<unknown, unknown>
function isIndexed(maybeIndexed: unknown): maybeIndexed is Collection.Indexed<unknown>
function isAssociative(maybeAssociative: unknown): maybeAssociative is Collection.Keyed<unknown, unknown> | Collection.Indexed<unknown>
function isOrdered(maybeOrdered: unknown): boolean
function isValueObject(maybeValue: unknown): maybeValue is ValueObject
function isSeq(maybeSeq: unknown): maybeSeq is Seq.Indexed<unknown> | Seq.Keyed<unknown, unknown> | Seq.Set<unknown>
function isList(maybeList: unknown): maybeList is List<unknown>
function isMap(maybeMap: unknown): maybeMap is Map<unknown, unknown>
function isOrderedMap(maybeOrderedMap: unknown): maybeOrderedMap is OrderedMap<unknown, unknown>
function isStack(maybeStack: unknown): maybeStack is Stack<unknown>
function isSet(maybeSet: unknown): maybeSet is Set<unknown>
function isOrderedSet(maybeOrderedSet: unknown): maybeOrderedSet is OrderedSet<unknown>
function isRecord(maybeRecord: unknown): maybeRecord is Record<{}>
function get<K, V>(collection: Collection<K, V>, k: K): V | undefined
function get<K, V, NSV>(collection: Collection<K, V>, k: K, v0: NSV): V | NSV
function get<TProps extends object, K extends keyof TProps>(record: Record<TProps>, k: K, v0: unknown): TProps[K]
function get<V>(collection: Array<V>, key: number): V | undefined
function get<V, NSV>(collection: Array<V>, key: number, v0: NSV): V | NSV
function get<C extends object, K extends keyof C>(object: C, k: K, v0: unknown): C[K]
function get<V>(collection: Dict<V>, k: string): V | undefined
function get<V, NSV>(collection: Dict<V>, k: string, v0: NSV): V | NSV
function has(collection: object, key: unknown): boolean
function remove<K, C extends Collection<K, unknown>>(collection: C, k: K): C
function remove<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(collection: C, k: K): C
function remove<C extends Array<unknown>>(collection: C, key: number): C
function remove<C, K extends keyof C>(collection: C, k: K): C
function remove<C extends Dict, K extends keyof C>(collection: C, k: K): C
function set<K, V, C extends Collection<K, V>>(collection: C, k: K, v: V): C
function set<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(record: C, k: K, value: TProps[K]): C
function set<V, C extends Array<V>>(collection: C, key: number, v: V): C
function set<C, K extends keyof C>(object: C, k: K, value: C[K]): C
function set<V, C extends Dict<V>>(collection: C, k: string, v: V): C
function update<K, V, C extends Collection<K, V>>(collection: C, k: K, f: (v: V | undefined) => V): C
function update<K, V, C extends Collection<K, V>, NSV>(collection: C, k: K, v0: NSV, f: (v: V | NSV) => V): C
function update<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(record: C, k: K, f: (value: TProps[K]) => TProps[K]): C
function update<TProps extends object, C extends Record<TProps>, K extends keyof TProps, NSV>(record: C, k: K, v0: NSV, f: (value: TProps[K] | NSV) => TProps[K]): C
function update<V>(collection: Array<V>, key: number, f: (v: V) => V): Array<V>
function update<V, NSV>(collection: Array<V>, key: number, v0: NSV, f: (v: V | NSV) => V): Array<V>
function update<C, K extends keyof C>(object: C, k: K, f: (value: C[K]) => C[K]): C
function update<C, K extends keyof C, NSV>(object: C, k: K, v0: NSV, f: (value: C[K] | NSV) => C[K]): C
function update<V, C extends Dict<V>, K extends keyof C>(collection: C, k: K, f: (v: V) => V): Dict<V>
function update<V, C extends Dict<V>, K extends keyof C, NSV>(collection: C, k: K, v0: NSV, f: (v: V | NSV) => V): Dict<V>
function getIn(collection: unknown, x: Iterable<unknown>, v0?: unknown): unknown
function hasIn(collection: unknown, x: Iterable<unknown>): boolean
function removeIn<C>(collection: C, x: Iterable<unknown>): C
function setIn<C>(collection: C, x: Iterable<unknown>, value: unknown): C
function updateIn<C>(collection: C, x: Iterable<unknown>, f: (value: unknown) => unknown): C
function updateIn<C>(collection: C, x: Iterable<unknown>, v0: unknown, f: (value: unknown) => unknown): C
function merge<C>(collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeWith<C>(merger: (old: unknown, newVal: unknown, key: unknown) => unknown, collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeDeep<C>(collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeDeepWith<C>(merger: (old: unknown, newVal: unknown, key: unknown) => unknown, collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
