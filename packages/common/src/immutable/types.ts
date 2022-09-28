export interface BySym {
  [k: symbol]: unknown
}

export interface ByStr<T = unknown> {
  [k: string]: T
}

export interface HasValue {
  equals(x: unknown): boolean
  hashCode(): number
}

export type Comp<T> = (a: T, b: T) => number
export type Step<K, V, T, R = unknown> = (v: V, k: K, t?: T) => R
export type Guard<K, V, T, R extends V> = (v: V, k: K, t?: T) => v is R

export interface Collection<K, V> extends BySym, HasValue {
  [Symbol.iterator](): IterableIterator<unknown>
  readonly size?: number | undefined
  butLast(): this
  concat(...xs: Array<unknown>): Collection<unknown, unknown>
  contains(v: V): boolean
  count(): number
  count(s?: Step<K, V, this, boolean>, ctx?: unknown): number
  countBy<T>(s: Step<K, V, this, T>, ctx?: unknown): Map<T, number>
  entries(): IterableIterator<[K, V]>
  entrySeq(): Seq.ByIdx<[K, V]>
  every(s: Step<K, V, this, boolean>, ctx?: unknown): boolean
  filter(s: Step<K, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): Collection<K, T>
  filterNot(s: Step<K, V, this, boolean>, ctx?: unknown): this
  find(s: Step<K, V, this, boolean>, ctx?: unknown, v0?: V): V | undefined
  findEntry(s: Step<K, V, this, boolean>, ctx?: unknown, v0?: V): [K, V] | undefined
  findKey(s: Step<K, V, this, boolean>, ctx?: unknown): K | undefined
  findLast(s: Step<K, V, this, boolean>, ctx?: unknown, v0?: V): V | undefined
  findLastEntry(s: Step<K, V, this, boolean>, ctx?: unknown, v0?: V): [K, V] | undefined
  findLastKey(s: Step<K, V, this, boolean>, ctx?: unknown): K | undefined
  first<T = undefined>(v0?: T): V | T
  flatMap<K2, V2>(s: Step<K, V, this, Iterable<[K2, V2]>>, ctx?: unknown): Collection<K2, V2>
  flatMap<T>(s: Step<K, V, this, Iterable<T>>, ctx?: unknown): Collection<K, T>
  flatten(depth?: number): Collection<unknown, unknown>
  flatten(shallow?: boolean): Collection<unknown, unknown>
  forEach(s: Step<K, V, this>, ctx?: unknown): number
  get(k: K): V | undefined
  get<V2>(k: K, v0: V2): V | V2
  getIn(x: Iterable<unknown>, v0?: unknown): unknown
  groupBy<T>(s: Step<K, V, this, T>, ctx?: unknown): Seq.ByKey<T, Collection<K, V>>
  has(k: K): boolean
  hasIn(x: Iterable<unknown>): boolean
  includes(v: V): boolean
  isEmpty(): boolean
  isSubset(x: Iterable<V>): boolean
  isSuperset(x: Iterable<V>): boolean
  join(sep?: string): string
  keyOf(v: V): K | undefined
  _keys(): IterableIterator<K>
  keySeq(): Seq.ByIdx<K>
  last<T = undefined>(v0?: T): V | T
  lastKeyOf(v: V): K | undefined
  map(...xs: Array<never>): unknown
  map<T>(s: Step<K, V, this, T>, ctx?: unknown): Collection<K, T>
  max(c?: Comp<V>): V | undefined
  maxBy<T>(s: Step<K, V, this, T>, c?: (a: T, b: T) => number): V | undefined
  min(c?: Comp<V>): V | undefined
  minBy<T>(s: Step<K, V, this, T>, c?: (a: T, b: T) => number): V | undefined
  reduce<T>(f: (y: T, v: V, k: K, c: this) => T, y0: T, ctx?: unknown): T
  reduce<T>(f: (y: V | T, v: V, k: K, c: this) => T): T
  reduceRight<T>(f: (y: T, v: V, k: K, c: this) => T, y0: T, ctx?: unknown): T
  reduceRight<T>(f: (y: V | T, v: V, k: K, c: this) => T): T
  rest(): this
  reverse(): this
  skip(x: number): this
  skipLast(x: number): this
  skipUntil(s: Step<K, V, this, boolean>, ctx?: unknown): this
  skipWhile(s: Step<K, V, this, boolean>, ctx?: unknown): this
  slice(beg?: number, end?: number): this
  some(s: Step<K, V, this, boolean>, ctx?: unknown): boolean
  sort(c?: Comp<V>): this
  sortBy<T>(s: Step<K, V, this, T>, c?: (a: T, b: T) => number): this
  take(x: number): this
  takeLast(x: number): this
  takeUntil(s: Step<K, V, this, boolean>, ctx?: unknown): this
  takeWhile(s: Step<K, V, this, boolean>, ctx?: unknown): this
  toArray(): Array<V> | Array<[K, V]>
  toSeqIndexed(): Seq.ByIdx<V>
  toJS(): Array<unknown> | ByStr<unknown>
  toJSON(): Array<V> | ByStr<V>
  toSeqKeyed(): Seq.ByKey<K, V>
  toList(): List<V>
  toMap(): Map<K, V>
  toObject(): ByStr<V>
  toOrderedMap(): OrderedMap<K, V>
  toOrderedSet(): OrderedSet<V>
  toSeq(): Seq<K, V>
  toSet(): Set<V>
  toSeqSet(): Seq.ByVal<V>
  toStack(): Stack<V>
  update<R>(f: (x: this) => R): R
  values(): IterableIterator<V>
  valueSeq(): Seq.ByIdx<V>
}

export namespace Collection {
  export interface ByKey<K, V> extends Collection<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>
    concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Collection.ByKey<K | K2, V | V2>
    concat<V2>(...xs: Array<ByStr<V2>>): Collection.ByKey<K | string, V | V2>
    filter(s: Step<K, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): Collection.ByKey<K, T>
    flatMap<K2, V2>(s: Step<K, V, this, Iterable<[K2, V2]>>, ctx?: unknown): Collection.ByKey<K2, V2>
    flip(): Collection.ByKey<V, K>
    map<T>(s: Step<K, V, this, T>, ctx?: unknown): Collection.ByKey<K, T>
    mapEntries<K2, V2>(s: Step<number, [K, V], this, [K2, V2] | undefined>, ctx?: unknown): Collection.ByKey<K2, V2>
    mapKeys<T>(s: Step<K, V, this, T>, ctx?: unknown): Collection.ByKey<T, V>
    toArray(): Array<[K, V]>
    toJS(): ByStr
    toJSON(): ByStr<V>
    toSeq(): Seq.ByKey<K, V>
  }
  export interface ByIdx<V> extends Collection<number, V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<V2>(...xs: Array<Iterable<V2> | V2>): Collection.ByIdx<V | V2>
    filter(s: Step<number, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<number, V, this, T>, ctx?: unknown): Collection.ByIdx<T>
    findIndex(s: Step<number, V, this, boolean>, ctx?: unknown): number
    findLastIndex(s: Step<number, V, this, boolean>, ctx?: unknown): number
    flatMap<T>(s: Step<number, V, this, Iterable<T>>, ctx?: unknown): Collection.ByIdx<T>
    fromEntrySeq(): Seq.ByKey<unknown, unknown>
    get(i: number): V | undefined
    get<T>(i: number, v0: T): V | T
    indexOf(v: V): number
    interleave(...xs: Array<Collection<unknown, V>>): this
    interpose(v: V): this
    lastIndexOf(v: V): number
    map<T>(s: Step<number, V, this, T>, ctx?: unknown): Collection.ByIdx<T>
    splice(i: number, removeNum: number, ...vs: Array<V>): this
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): Seq.ByIdx<V>
    zip(...xs: Array<Collection<unknown, unknown>>): Collection.ByIdx<unknown>
    zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Collection.ByIdx<[V, T, U]>
    zip<T>(x: Collection<unknown, T>): Collection.ByIdx<[V, T]>
    zipAll(...xs: Array<Collection<unknown, unknown>>): Collection.ByIdx<unknown>
    zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Collection.ByIdx<[V, T, U]>
    zipAll<T>(x: Collection<unknown, T>): Collection.ByIdx<[V, T]>
    zipWith<T, U, Z>(
      f: (v: V, x: T, x2: U) => Z,
      x: Collection<unknown, T>,
      x2: Collection<unknown, U>
    ): Collection.ByIdx<Z>
    zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Collection.ByIdx<U>
    zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Collection.ByIdx<T>
  }
  export interface ByVal<V> extends Collection<V, V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<V2>(...xs: Array<Iterable<V2>>): Collection.ByVal<V | V2>
    filter(s: Step<V, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<V, V, this, T>, ctx?: unknown): Collection.ByVal<T>
    flatMap<T>(s: Step<V, V, this, Iterable<T>>, ctx?: unknown): Collection.ByVal<T>
    map<T>(s: Step<V, V, this, T>, ctx?: unknown): Collection.ByVal<T>
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): Seq.ByVal<V>
  }
}

export interface Seq<K, V> extends Collection<K, V> {
  cacheResult(): this
  filter(s: Step<K, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): Seq<K, T>
  flatMap<T>(s: Step<K, V, this, Iterable<T>>, ctx?: unknown): Seq<K, T>
  flatMap<T>(s: Step<K, V, this, Iterable<T>>, ctx?: unknown): Seq<T, T>
  map<T>(s: Step<K, V, this, T>, ctx?: unknown): Seq<K, T>
  map<T>(s: Step<K, V, this, T>, ctx?: unknown): Seq<T, T>
}

export namespace Seq {
  export interface ByKey<K, V> extends Seq<K, V>, Collection.ByKey<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>
    concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Seq.ByKey<K | K2, V | V2>
    concat<V2>(...xs: Array<ByStr<V2>>): Seq.ByKey<K | string, V | V2>
    filter(s: Step<K, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): Seq.ByKey<K, T>
    flatMap<K2, V2>(s: Step<K, V, this, Iterable<[K2, V2]>>, ctx?: unknown): Seq.ByKey<K2, V2>
    flip(): Seq.ByKey<V, K>
    map<T>(s: Step<K, V, this, T>, ctx?: unknown): Seq.ByKey<K, T>
    mapEntries<K2, V2>(s: Step<number, [K, V], this, [K2, V2] | undefined>, ctx?: unknown): Seq.ByKey<K2, V2>
    mapKeys<T>(s: Step<K, V, this, T>, ctx?: unknown): Seq.ByKey<T, V>
    toArray(): Array<[K, V]>
    toJS(): ByStr
    toJSON(): ByStr<V>
    toSeq(): this
  }
  export interface ByIdx<V> extends Seq<number, V>, Collection.ByIdx<V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<V2>(...xs: Array<Iterable<V2> | V2>): Seq.ByIdx<V | V2>
    filter(s: Step<number, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<number, V, this, T>, ctx?: unknown): Seq.ByIdx<T>
    flatMap<T>(s: Step<number, V, this, Iterable<T>>, ctx?: unknown): Seq.ByIdx<T>
    map<T>(s: Step<number, V, this, T>, ctx?: unknown): Seq.ByIdx<T>
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): this
    zip(...xs: Array<Collection<unknown, unknown>>): Seq.ByIdx<unknown>
    zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.ByIdx<[U, T, U]>
    zip<T>(x: Collection<unknown, T>): Seq.ByIdx<[V, T]>
    zipAll(...xs: Array<Collection<unknown, unknown>>): Seq.ByIdx<unknown>
    zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.ByIdx<[U, T, U]>
    zipAll<T>(x: Collection<unknown, T>): Seq.ByIdx<[V, T]>
    zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): Seq.ByIdx<Z>
    zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): Seq.ByIdx<U>
    zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): Seq.ByIdx<T>
  }
  export interface ByVal<V> extends Seq<V, V>, Collection.ByVal<V> {
    [Symbol.iterator](): IterableIterator<V>
    concat<V2>(...xs: Array<Iterable<V2>>): Seq.ByVal<V | V2>
    filter(s: Step<V, V, this>, ctx?: unknown): this
    filter<T extends V>(g: Guard<V, V, this, T>, ctx?: unknown): Seq.ByVal<T>
    flatMap<T>(s: Step<V, V, this, Iterable<T>>, ctx?: unknown): Seq.ByVal<T>
    map<T>(s: Step<V, V, this, T>, ctx?: unknown): Seq.ByVal<T>
    toArray(): Array<V>
    toJS(): Array<unknown>
    toJSON(): Array<V>
    toSeq(): this
  }
}

export interface List<V> extends Collection.ByIdx<V> {
  asImmutable(): this
  asMutable(): this
  clear(): List<V>
  concat<V2>(...xs: Array<Iterable<V2> | V2>): List<V | V2>
  delete(i: number): List<V>
  deleteIn(x: Iterable<unknown>): this
  filter(s: Step<number, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<number, V, this, T>, ctx?: unknown): List<T>
  flatMap<T>(s: Step<number, V, this, Iterable<T>>, ctx?: unknown): List<T>
  insert(i: number, v: V): List<V>
  map<T>(s: Step<number, V, this, T>, ctx?: unknown): List<T>
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

export interface Map<K, V> extends Collection.ByKey<K, V> {
  asImmutable(): this
  asMutable(): this
  clear(): this
  concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Map<K | K2, V | V2>
  concat<V2>(...xs: Array<ByStr<V2>>): Map<K | string, V | V2>
  delete(k: K): this
  deleteAll(ks: Iterable<K>): this
  deleteIn(x: Iterable<unknown>): this
  filter(s: Step<K, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): Map<K, T>
  flatMap<K2, V2>(s: Step<K, V, this, Iterable<[K2, V2]>>, ctx?: unknown): Map<K2, V2>
  flip(): Map<V, K>
  map<T>(s: Step<K, V, this, T>, ctx?: unknown): Map<K, T>
  mapEntries<K2, V2>(s: Step<number, [K, V], this, [K2, V2] | undefined>, ctx?: unknown): Map<K2, V2>
  mapKeys<T>(s: Step<K, V, this, T>, ctx?: unknown): Map<T, V>
  merge<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): Map<K | K2, V | V2>
  merge<T>(...xs: Array<ByStr<T>>): Map<K | string, V | T>
  mergeDeep(...xs: Array<Iterable<[K, V]> | ByStr<V>>): this
  mergeDeepIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeDeepWith(f: (old: unknown, v: unknown, k: unknown) => unknown, ...xs: Array<Iterable<[K, V]> | ByStr<V>>): this
  mergeIn(x: Iterable<unknown>, ...xs: Array<unknown>): this
  mergeWith(f: (old: V, v: V, k: K) => V, ...xs: Array<Iterable<[K, V]> | ByStr<V>>): this
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
  concat<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): OrderedMap<K | K2, V | V2>
  concat<V2>(...xs: Array<ByStr<V2>>): OrderedMap<K | string, V | V2>
  filter(s: Step<K, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<K, V, this, T>, ctx?: unknown): OrderedMap<K, T>
  flatMap<K2, V2>(s: Step<K, V, this, Iterable<[K2, V2]>>, ctx?: unknown): OrderedMap<K2, V2>
  flip(): OrderedMap<V, K>
  map<T>(s: Step<K, V, this, T>, ctx?: unknown): OrderedMap<K, T>
  mapEntries<K2, V2>(s: Step<number, [K, V], this, [K2, V2] | undefined>, ctx?: unknown): OrderedMap<K2, V2>
  mapKeys<T>(s: Step<K, V, this, T>, ctx?: unknown): OrderedMap<T, V>
  merge<K2, V2>(...xs: Array<Iterable<[K2, V2]>>): OrderedMap<K | K2, V | V2>
  merge<T>(...xs: Array<ByStr<T>>): OrderedMap<K | string, V | T>
  set(k: K, v: V): this
}

export interface Set<V> extends Collection.ByVal<V> {
  add(v: V): this
  asImmutable(): this
  asMutable(): this
  clear(): this
  concat<V2>(...xs: Array<Iterable<V2>>): Set<V | V2>
  delete(v: V): this
  filter(s: Step<V, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<V, V, this, T>, ctx?: unknown): Set<T>
  flatMap<T>(s: Step<V, V, this, Iterable<T>>, ctx?: unknown): Set<T>
  intersect(...xs: Array<Iterable<V>>): this
  map<T>(s: Step<V, V, this, T>, ctx?: unknown): Set<T>
  merge<T>(...xs: Array<Iterable<T>>): Set<V | T>
  remove(v: V): this
  subtract(...xs: Array<Iterable<V>>): this
  union<T>(...xs: Array<Iterable<T>>): Set<V | T>
  wasAltered(): boolean
  withMutations(f: (x: this) => unknown): this
}

export interface OrderedSet<V> extends Set<V> {
  concat<V2>(...xs: Array<Iterable<V2>>): OrderedSet<V | V2>
  filter(s: Step<V, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<V, V, this, T>, ctx?: unknown): OrderedSet<T>
  flatMap<T>(s: Step<V, V, this, Iterable<T>>, ctx?: unknown): OrderedSet<T>
  map<T>(s: Step<V, V, this, T>, ctx?: unknown): OrderedSet<T>
  merge<T>(...xs: Array<Iterable<T>>): OrderedSet<V | T>
  union<T>(...xs: Array<Iterable<T>>): OrderedSet<V | T>
  zip(...xs: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  zip<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<[V, T, U]>
  zip<T>(x: Collection<unknown, T>): OrderedSet<[V, T]>
  zipAll(...xs: Array<Collection<unknown, unknown>>): OrderedSet<unknown>
  zipAll<T, U>(x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<[V, T, U]>
  zipAll<T>(x: Collection<unknown, T>): OrderedSet<[V, T]>
  zipWith<T, U, Z>(f: (v: V, x: T, x2: U) => Z, x: Collection<unknown, T>, x2: Collection<unknown, U>): OrderedSet<Z>
  zipWith<T, U>(f: (v: V, x: T) => U, x: Collection<unknown, T>): OrderedSet<U>
  zipWith<T>(f: (...xs: Array<unknown>) => T, ...xs: Array<Collection<unknown, unknown>>): OrderedSet<T>
}

export interface Stack<V> extends Collection.ByIdx<V> {
  asImmutable(): this
  asMutable(): this
  clear(): Stack<V>
  concat<V2>(...xs: Array<Iterable<V2> | V2>): Stack<V | V2>
  filter(s: Step<number, V, this>, ctx?: unknown): this
  filter<T extends V>(g: Guard<number, V, this, T>, ctx?: unknown): Set<T>
  flatMap<T>(s: Step<number, V, this, Iterable<T>>, ctx?: unknown): Stack<T>
  map<T>(s: Step<number, V, this, T>, ctx?: unknown): Stack<T>
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

export interface Record<T extends object> extends BySym, HasValue {
  [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>
  asImmutable(): this
  asMutable(): this
  clear(): this
  delete<K extends keyof T>(k: K): this
  deleteIn(x: Iterable<unknown>): this
  get<K extends keyof T>(k: K, v0?: unknown): T[K]
  get<V>(k: string, v0: V): V
  getIn(x: Iterable<unknown>): unknown
  has(k: string): k is keyof T & string
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
  toSeq(): Seq.ByKey<keyof T, T[keyof T]>
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
