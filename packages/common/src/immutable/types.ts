export interface Dict<T = unknown> {
  [k: string]: T
}

export interface ValueObject {
  equals(x: unknown): boolean
  hashCode(): number
}

export interface Collection<K = unknown, V = unknown> {
  [Symbol.iterator](): IterableIterator<unknown>
  readonly size: number | undefined
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
  _keys(): IterableIterator<K>
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
  slice(beg?: number, end?: number): this
  some(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): boolean
  sort(c?: (a: V, b: V) => number): this
  sortBy<T>(f: (v: V, k: K, iter: this) => T, c?: (a: T, b: T) => number): this
  take(x: number): this
  takeLast(x: number): this
  takeUntil(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  takeWhile(f: (v: V, k: K, iter: this) => boolean, ctx?: unknown): this
  toArray(): Array<V> | Array<[K, V]>
  toSeqIndexed(): Seq.Indexed<V>
  toJS(): Array<unknown> | Dict<unknown>
  toJSON(): Array<V> | Dict<V>
  toSeqKeyed(): Seq.Keyed<K, V>
  toList(): List<V>
  toMap(): Map<K, V>
  toObject(): Dict<V>
  toOrderedMap(): OrderedMap<K, V>
  toOrderedSet(): OrderedSet<V>
  toSeq(): Seq<K, V>
  toSet(): Set<V>
  toSeqSet(): Seq.Set<V>
  toStack(): Stack<V>
  update<R>(f: (x: this) => R): R
  values(): IterableIterator<V>
  valueSeq(): Seq.Indexed<V>
}

export namespace Collection {
  export interface Keyed<K = unknown, V = unknown> extends Collection<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>
    concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Collection.Keyed<K | K2, V | V2>
    concat<T>(...xs: Array<Dict<T>>): Collection.Keyed<K | string, V | T>
    filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
    filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Collection.Keyed<K, T>
    flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): Collection.Keyed<K2, V2>
    flip(): Collection.Keyed<V, K>
    map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Collection.Keyed<K, T>
    mapEntries<K2, V2>(
      f: (x: [K, V], i: number, iter: this) => [K2, V2] | undefined,
      ctx?: unknown
    ): Collection.Keyed<K2, V2>
    mapKeys<T>(f: (k: K, v: V, iter: this) => T, ctx?: unknown): Collection.Keyed<T, V>
    toArray(): Array<[K, V]>
    toJS(): Dict
    toJSON(): Dict<V>
    toSeq(): Seq.Keyed<K, V>
  }
  export interface Indexed<V = unknown> extends Collection<number, V> {
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
    zipWith<T, U, Z>(
      f: (v: V, x: T, x2: U) => Z,
      x: Collection<unknown, T>,
      x2: Collection<unknown, U>
    ): Collection.Indexed<Z>
    zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Collection.Indexed<U>
    zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Collection.Indexed<T>
  }
  export interface Set<K = unknown> extends Collection<K, K> {
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

export interface Seq<K, V> extends Collection<K, V> {
  cacheResult(): this
  filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
  filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Seq<K, T>
  flatMap<T>(f: (v: V, k: K, iter: this) => Iterable<T>, ctx?: unknown): Seq<K, T>
  flatMap<T>(f: (v: V, k: K, iter: this) => Iterable<T>, ctx?: unknown): Seq<T, T>
  map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Seq<K, T>
  map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Seq<T, T>
}

export namespace Seq {
  export interface Keyed<K, V> extends Seq<K, V>, Collection.Keyed<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>
    concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Seq.Keyed<K | K2, V | V2>
    concat<T>(...xs: Array<Dict<T>>): Seq.Keyed<K | string, V | T>
    filter(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): this
    filter<T extends V>(f: (v: V, k: K, iter: this) => v is T, ctx?: unknown): Seq.Keyed<K, T>
    flatMap<K2, V2>(f: (v: V, k: K, iter: this) => Iterable<[K2, V2]>, ctx?: unknown): Seq.Keyed<K2, V2>
    flip(): Seq.Keyed<V, K>
    map<T>(f: (v: V, k: K, iter: this) => T, ctx?: unknown): Seq.Keyed<K, T>
    mapEntries<K2, V2>(f: (x: [K, V], i: number, iter: this) => [K2, V2] | undefined, ctx?: unknown): Seq.Keyed<K2, V2>
    mapKeys<T>(f: (k: K, v: V, iter: this) => T, ctx?: unknown): Seq.Keyed<T, V>
    toArray(): Array<[K, V]>
    toJS(): Dict
    toJSON(): Dict<V>
    toSeq(): this
  }
  export interface Indexed<V> extends Seq<number, V>, Collection.Indexed<V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<T>(...xs: Array<Iterable<T> | T>): Seq.Indexed<V | T>
    filter(f: (v: V, i: number, iter: this) => unknown, ctx?: unknown): this
    filter<T extends V>(f: (v: V, i: number, iter: this) => v is T, ctx?: unknown): Seq.Indexed<T>
    flatMap<T>(f: (v: V, i: number, iter: this) => Iterable<T>, ctx?: unknown): Seq.Indexed<T>
    map<T>(f: (v: V, i: number, iter: this) => T, ctx?: unknown): Seq.Indexed<T>
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): this
    zip(...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<unknown>
    zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.Indexed<[U, T, U]>
    zip<T>(x: Collection<unknown, T>): Seq.Indexed<[V, T]>
    zipAll(...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<unknown>
    zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.Indexed<[U, T, U]>
    zipAll<T>(x: Collection<unknown, T>): Seq.Indexed<[V, T]>
    zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.Indexed<Z>
    zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Seq.Indexed<U>
    zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Seq.Indexed<T>
  }
  export interface Set<K> extends Seq<K, K>, Collection.Set<K> {
    [Symbol.iterator](): IterableIterator<K>
    concat<T>(...xs: Array<Iterable<T>>): Seq.Set<K | T>
    filter(f: (v: K, k: K, iter: this) => unknown, ctx?: unknown): this
    filter<T extends K>(f: (v: K, k: K, iter: this) => v is T, ctx?: unknown): Seq.Set<T>
    flatMap<T>(f: (v: K, k: K, iter: this) => Iterable<T>, ctx?: unknown): Seq.Set<T>
    map<T>(f: (v: K, k: K, iter: this) => T, ctx?: unknown): Seq.Set<T>
    toArray(): Array<K>
    toJS(): Array<unknown>
    toJSON(): Array<K>
    toSeq(): this
  }
}

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

export interface Map<K, V> extends Collection.Keyed<K, V> {
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

export interface OrderedMap<K, V> extends Map<K, V> {
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

export interface Set<K> extends Collection.Set<K> {
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

export interface OrderedSet<K> extends Set<K> {
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

export interface Stack<V> extends Collection.Indexed<V> {
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

export interface Record<T extends object> {
  [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>
  asImmutable(): this
  asMutable(): this
  clear(): this
  delete<K extends keyof T>(k: K): this
  deleteIn(x: Iterable<unknown>): this
  equals(x: unknown): boolean
  get<K extends keyof T>(k: K, v0?: unknown): T[K]
  get<V>(k: string, v0: V): V
  getIn(x: Iterable<unknown>): unknown
  has(k: string): k is keyof T & string
  hashCode(): number
  hasIn(x: Iterable<unknown>): boolean
  merge(...xs: Array<Partial<T> | Iterable<[string, unknown]>>): this
  mergeDeep(...xs: Array<Partial<T> | Iterable<[string, unknown]>>): this
  mergeDeepIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeDeepWith(
    f: (old: unknown, x: unknown, k: unknown) => unknown,
    ...xs: Array<Partial<T> | Iterable<[string, unknown]>>
  ): this
  mergeIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeWith(
    f: (old: unknown, x: unknown, k: keyof T) => unknown,
    ...xs: Array<Partial<T> | Iterable<[string, unknown]>>
  ): this
  remove<K extends keyof T>(k: K): this
  removeIn(x: Iterable<unknown>): this
  set<K extends keyof T>(k: K, v: T[K]): this
  setIn(x: Iterable<unknown>, v: unknown): this
  toJS(): { [K in keyof T]: unknown }
  toJSON(): T
  toObject(): T
  toSeq(): Seq.Keyed<keyof T, T[keyof T]>
  update<K extends keyof T>(k: K, f: (v: T[K]) => T[K]): this
  updateIn(x: Iterable<unknown>, f: (v: unknown) => unknown): this
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
}

export type RecordOf<T extends object> = Record<T> & Readonly<T>

export namespace Record {
  export interface Factory<T extends object> {
    (xs?: Partial<T> | Iterable<[string, unknown]>): Record<T> & Readonly<T>
    new (xs?: Partial<T> | Iterable<[string, unknown]>): Record<T> & Readonly<T>
    displayName: string
  }
}
