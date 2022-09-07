export function firstIndexOf<T>(
  array: ArrayLike<T>,
  value: T,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return -1
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let span: number
  if (stop < start) {
    span = stop + 1 + (n - start)
  } else {
    span = stop - start + 1
  }
  for (let i = 0; i < span; ++i) {
    const j = (start + i) % n
    if (array[j] === value) {
      return j
    }
  }
  return -1
}
export function lastIndexOf<T>(
  array: ArrayLike<T>,
  value: T,
  start = -1,
  stop = 0
): number {
  const n = array.length
  if (n === 0) {
    return -1
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let span: number
  if (start < stop) {
    span = start + 1 + (n - stop)
  } else {
    span = start - stop + 1
  }
  for (let i = 0; i < span; ++i) {
    const j = (start - i + n) % n
    if (array[j] === value) {
      return j
    }
  }
  return -1
}
export function findFirstIndex<T>(
  array: ArrayLike<T>,
  fn: (value: T, index: number) => boolean,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return -1
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let span: number
  if (stop < start) {
    span = stop + 1 + (n - start)
  } else {
    span = stop - start + 1
  }
  for (let i = 0; i < span; ++i) {
    const j = (start + i) % n
    if (fn(array[j], j)) {
      return j
    }
  }
  return -1
}
export function findLastIndex<T>(
  array: ArrayLike<T>,
  fn: (value: T, index: number) => boolean,
  start = -1,
  stop = 0
): number {
  const n = array.length
  if (n === 0) {
    return -1
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let d: number
  if (start < stop) {
    d = start + 1 + (n - stop)
  } else {
    d = start - stop + 1
  }
  for (let i = 0; i < d; ++i) {
    const j = (start - i + n) % n
    if (fn(array[j], j)) {
      return j
    }
  }
  return -1
}
export function findFirstValue<T>(
  array: ArrayLike<T>,
  fn: (value: T, index: number) => boolean,
  start = 0,
  stop = -1
): T | undefined {
  const index = findFirstIndex(array, fn, start, stop)
  return index !== -1 ? array[index] : undefined
}
export function findLastValue<T>(
  array: ArrayLike<T>,
  fn: (value: T, index: number) => boolean,
  start = -1,
  stop = 0
): T | undefined {
  const index = findLastIndex(array, fn, start, stop)
  return index !== -1 ? array[index] : undefined
}
export function lowerBound<T, U>(
  array: ArrayLike<T>,
  value: U,
  fn: (element: T, value: U) => number,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return 0
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let begin = start
  let span = stop - start + 1
  while (span > 0) {
    const half = span >> 1
    const middle = begin + half
    if (fn(array[middle], value) < 0) {
      begin = middle + 1
      span -= half + 1
    } else {
      span = half
    }
  }
  return begin
}
export function upperBound<T, U>(
  array: ArrayLike<T>,
  value: U,
  fn: (element: T, value: U) => number,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return 0
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let begin = start
  let span = stop - start + 1
  while (span > 0) {
    const half = span >> 1
    const middle = begin + half
    if (fn(array[middle], value) > 0) {
      span = half
    } else {
      begin = middle + 1
      span -= half + 1
    }
  }
  return begin
}
export function shallowEqual<T>(
  a: ArrayLike<T>,
  b: ArrayLike<T>,
  fn?: (a: T, b: T) => boolean
): boolean {
  if (a === b) {
    return true
  }
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0, n = a.length; i < n; ++i) {
    if (fn ? !fn(a[i], b[i]) : a[i] !== b[i]) {
      return false
    }
  }
  return true
}
export function slice<T>(
  array: ArrayLike<T>,
  options: slice.IOptions = {}
): T[] {
  let { start, stop, step } = options
  if (step === undefined) {
    step = 1
  }
  if (step === 0) {
    throw new Error("Slice `step` cannot be zero.")
  }
  const n = array.length
  if (start === undefined) {
    start = step < 0 ? n - 1 : 0
  } else if (start < 0) {
    start = Math.max(start + n, step < 0 ? -1 : 0)
  } else if (start >= n) {
    start = step < 0 ? n - 1 : n
  }
  if (stop === undefined) {
    stop = step < 0 ? -1 : n
  } else if (stop < 0) {
    stop = Math.max(stop + n, step < 0 ? -1 : 0)
  } else if (stop >= n) {
    stop = step < 0 ? n - 1 : n
  }
  let length
  if ((step < 0 && stop >= start) || (step > 0 && start >= stop)) {
    length = 0
  } else if (step < 0) {
    length = Math.floor((stop - start + 1) / step + 1)
  } else {
    length = Math.floor((stop - start - 1) / step + 1)
  }
  const result: T[] = []
  for (let i = 0; i < length; ++i) {
    result[i] = array[start + i * step]
  }
  return result
}
export interface IOptions {
  start?: number
  stop?: number
  step?: number
}
export type MutableArrayLike<T> = {
  readonly length: number
  [index: number]: T
}
export function move<T>(
  array: MutableArrayLike<T>,
  fromIndex: number,
  toIndex: number
): void {
  const n = array.length
  if (n <= 1) {
    return
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(0, fromIndex + n)
  } else {
    fromIndex = Math.min(fromIndex, n - 1)
  }
  if (toIndex < 0) {
    toIndex = Math.max(0, toIndex + n)
  } else {
    toIndex = Math.min(toIndex, n - 1)
  }
  if (fromIndex === toIndex) {
    return
  }
  const value = array[fromIndex]
  const d = fromIndex < toIndex ? 1 : -1
  for (let i = fromIndex; i !== toIndex; i += d) {
    array[i] = array[i + d]
  }
  array[toIndex] = value
}
export function reverse<T>(
  array: MutableArrayLike<T>,
  start = 0,
  stop = -1
): void {
  const n = array.length
  if (n <= 1) {
    return
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  while (start < stop) {
    const a = array[start]
    const b = array[stop]
    array[start++] = b
    array[stop--] = a
  }
}
export function rotate<T>(
  array: MutableArrayLike<T>,
  delta: number,
  start = 0,
  stop = -1
): void {
  const n = array.length
  if (n <= 1) {
    return
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  if (start >= stop) {
    return
  }
  const length = stop - start + 1
  if (delta > 0) {
    delta = delta % length
  } else if (delta < 0) {
    delta = ((delta % length) + length) % length
  }
  if (delta === 0) {
    return
  }
  const pivot = start + delta
  reverse(array, start, pivot - 1)
  reverse(array, pivot, stop)
  reverse(array, start, stop)
}
export function fill<T>(
  array: MutableArrayLike<T>,
  value: T,
  start = 0,
  stop = -1
): void {
  const n = array.length
  if (n === 0) {
    return
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let span: number
  if (stop < start) {
    span = stop + 1 + (n - start)
  } else {
    span = stop - start + 1
  }
  for (let i = 0; i < span; ++i) {
    array[(start + i) % n] = value
  }
}
export function insert<T>(array: Array<T>, index: number, value: T): void {
  const n = array.length
  if (index < 0) {
    index = Math.max(0, index + n)
  } else {
    index = Math.min(index, n)
  }
  for (let i = n; i > index; --i) {
    array[i] = array[i - 1]
  }
  array[index] = value
}
export function removeAt<T>(array: Array<T>, index: number): T | undefined {
  const n = array.length
  if (index < 0) {
    index += n
  }
  if (index < 0 || index >= n) {
    return undefined
  }
  const value = array[index]
  for (let i = index + 1; i < n; ++i) {
    array[i - 1] = array[i]
  }
  array.length = n - 1
  return value
}
export function removeFirstOf<T>(
  array: Array<T>,
  value: T,
  start = 0,
  stop = -1
): number {
  const index = firstIndexOf(array, value, start, stop)
  if (index !== -1) {
    removeAt(array, index)
  }
  return index
}
export function removeLastOf<T>(
  array: Array<T>,
  value: T,
  start = -1,
  stop = 0
): number {
  const index = lastIndexOf(array, value, start, stop)
  if (index !== -1) {
    removeAt(array, index)
  }
  return index
}
export function removeAllOf<T>(
  array: Array<T>,
  value: T,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return 0
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let count = 0
  for (let i = 0; i < n; ++i) {
    if (start <= stop && i >= start && i <= stop && array[i] === value) {
      count++
    } else if (
      stop < start &&
      (i <= stop || i >= start) &&
      array[i] === value
    ) {
      count++
    } else if (count > 0) {
      array[i - count] = array[i]
    }
  }
  if (count > 0) {
    array.length = n - count
  }
  return count
}
export function removeFirstWhere<T>(
  array: Array<T>,
  fn: (value: T, index: number) => boolean,
  start = 0,
  stop = -1
): { index: number; value: T | undefined } {
  let value: T | undefined
  const index = findFirstIndex(array, fn, start, stop)
  if (index !== -1) {
    value = removeAt(array, index)
  }
  return { index, value }
}
export function removeLastWhere<T>(
  array: Array<T>,
  fn: (value: T, index: number) => boolean,
  start = -1,
  stop = 0
): { index: number; value: T | undefined } {
  let value: T | undefined
  const index = findLastIndex(array, fn, start, stop)
  if (index !== -1) {
    value = removeAt(array, index)
  }
  return { index, value }
}
export function removeAllWhere<T>(
  array: Array<T>,
  fn: (value: T, index: number) => boolean,
  start = 0,
  stop = -1
): number {
  const n = array.length
  if (n === 0) {
    return 0
  }
  if (start < 0) {
    start = Math.max(0, start + n)
  } else {
    start = Math.min(start, n - 1)
  }
  if (stop < 0) {
    stop = Math.max(0, stop + n)
  } else {
    stop = Math.min(stop, n - 1)
  }
  let count = 0
  for (let i = 0; i < n; ++i) {
    if (start <= stop && i >= start && i <= stop && fn(array[i], i)) {
      count++
    } else if (stop < start && (i <= stop || i >= start) && fn(array[i], i)) {
      count++
    } else if (count > 0) {
      array[i - count] = array[i]
    }
  }
  if (count > 0) {
    array.length = n - count
  }
  return count
}
export function* chain<T>(...objects: Iterable<T>[]): IterableIterator<T> {
  for (const object of objects) {
    yield* object
  }
}
export function* empty<T>(): IterableIterator<T> {
  return
}
export function* enumerate<T>(
  object: Iterable<T>,
  start = 0
): IterableIterator<[number, T]> {
  for (const value of object) {
    yield [start++, value]
  }
}
export function* filter<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): IterableIterator<T> {
  let index = 0
  for (const value of object) {
    if (fn(value, index++)) {
      yield value
    }
  }
}
export function find<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): T | undefined {
  let index = 0
  for (const value of object) {
    if (fn(value, index++)) {
      return value
    }
  }
  return undefined
}
export function findIndex<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): number {
  let index = 0
  for (const value of object) {
    if (fn(value, index++)) {
      return index - 1
    }
  }
  return -1
}
export function min<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): T | undefined {
  let result: T | undefined = undefined
  for (const value of object) {
    if (result === undefined) {
      result = value
      continue
    }
    if (fn(value, result) < 0) {
      result = value
    }
  }
  return result
}
export function max<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): T | undefined {
  let result: T | undefined = undefined
  for (const value of object) {
    if (result === undefined) {
      result = value
      continue
    }
    if (fn(value, result) > 0) {
      result = value
    }
  }
  return result
}
export function minmax<T>(
  object: Iterable<T>,
  fn: (first: T, second: T) => number
): [T, T] | undefined {
  let empty = true
  let vmin: T
  let vmax: T
  for (const value of object) {
    if (empty) {
      vmin = value
      vmax = value
      empty = false
    } else if (fn(value, vmin!) < 0) {
      vmin = value
    } else if (fn(value, vmax!) > 0) {
      vmax = value
    }
  }
  return empty ? undefined : [vmin!, vmax!]
}
export function toArray<T>(object: Iterable<T>): T[] {
  return Array.from(object)
}
export function toObject<T>(object: Iterable<[string, T]>): {
  [key: string]: T
} {
  const result: { [key: string]: T } = {}
  for (const [key, value] of object) {
    result[key] = value
  }
  return result
}
export function each<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean | void
): void {
  let index = 0
  for (const value of object) {
    if (false === fn(value, index++)) {
      return
    }
  }
}
export function every<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): boolean {
  let index = 0
  for (const value of object) {
    if (false === fn(value, index++)) {
      return false
    }
  }
  return true
}
export function some<T>(
  object: Iterable<T>,
  fn: (value: T, index: number) => boolean
): boolean {
  let index = 0
  for (const value of object) {
    if (fn(value, index++)) {
      return true
    }
  }
  return false
}
export function* map<T, U>(
  object: Iterable<T>,
  fn: (value: T, index: number) => U
): IterableIterator<U> {
  let index = 0
  for (const value of object) {
    yield fn(value, index++)
  }
}
export function* range(
  start: number,
  stop?: number,
  step?: number
): IterableIterator<number> {
  if (stop === undefined) {
    stop = start
    start = 0
    step = 1
  } else if (step === undefined) {
    step = 1
  }
  const length = Private.rangeLength(start, stop, step)
  for (let index = 0; index < length; index++) {
    yield start + step * index
  }
}
export function rangeLength(start: number, stop: number, step: number): number {
  if (step === 0) {
    return Infinity
  }
  if (start > stop && step > 0) {
    return 0
  }
  if (start < stop && step < 0) {
    return 0
  }
  return Math.ceil((stop - start) / step)
}
export function reduce<T>(
  object: Iterable<T>,
  fn: (accumulator: T, value: T, index: number) => T
): T
export function reduce<T, U>(
  object: Iterable<T>,
  fn: (accumulator: U, value: T, index: number) => U,
  initial: U
): U
export function reduce<T>(
  object: Iterable<T>,
  fn: (accumulator: any, value: T, index: number) => any,
  initial?: unknown
): any {
  const it = object[Symbol.iterator]()
  let index = 0
  const first = it.next()
  if (first.done && initial === undefined) {
    throw new TypeError("Reduce of empty iterable with no initial value.")
  }
  if (first.done) {
    return initial
  }
  const second = it.next()
  if (second.done && initial === undefined) {
    return first.value
  }
  if (second.done) {
    return fn(initial, first.value, index++)
  }
  let accumulator: any
  if (initial === undefined) {
    accumulator = fn(first.value, second.value, index++)
  } else {
    accumulator = fn(fn(initial, first.value, index++), second.value, index++)
  }
  let next: IteratorResult<T>
  while (!(next = it.next()).done) {
    accumulator = fn(accumulator, next.value, index++)
  }
  return accumulator
}
export function* repeat<T>(value: T, count: number): IterableIterator<T> {
  while (0 < count--) {
    yield value
  }
}
export function* once<T>(value: T): IterableIterator<T> {
  yield value
}
export interface IRetroable<T> {
  retro(): IterableIterator<T>
}
export function* retro<T>(
  object: IRetroable<T> | ArrayLike<T>
): IterableIterator<T> {
  if (typeof (object as IRetroable<T>).retro === "function") {
    yield* (object as IRetroable<T>).retro()
  } else {
    for (let index = (object as ArrayLike<T>).length - 1; index > -1; index--) {
      yield (object as ArrayLike<T>)[index]
    }
  }
}
export function topologicSort<T>(edges: Iterable<[T, T]>): T[] {
  const sorted: T[] = []
  const visited = new Set<T>()
  const graph = new Map<T, T[]>()
  for (const edge of edges) {
    addEdge(edge)
  }
  for (const [k] of graph) {
    visit(k)
  }
  return sorted
  function addEdge(edge: [T, T]): void {
    const [fromNode, toNode] = edge
    const children = graph.get(toNode)
    if (children) {
      children.push(fromNode)
    } else {
      graph.set(toNode, [fromNode])
    }
  }
  function visit(node: T): void {
    if (visited.has(node)) {
      return
    }
    visited.add(node)
    const children = graph.get(node)
    if (children) {
      for (const child of children) {
        visit(child)
      }
    }
    sorted.push(node)
  }
}
export function* stride<T>(
  object: Iterable<T>,
  step: number
): IterableIterator<T> {
  let count = 0
  for (const value of object) {
    if (0 === count++ % step) {
      yield value
    }
  }
}
export function findIndices(
  source: string,
  query: string,
  start = 0
): number[] | null {
  const indices = new Array<number>(query.length)
  for (let i = 0, j = start, n = query.length; i < n; ++i, ++j) {
    j = source.indexOf(query[i], j)
    if (j === -1) {
      return null
    }
    indices[i] = j
  }
  return indices
}
export interface IMatchResult {
  score: number
  indices: number[]
}
export function matchSumOfSquares(
  source: string,
  query: string,
  start = 0
): IMatchResult | null {
  const indices = findIndices(source, query, start)
  if (!indices) {
    return null
  }
  let score = 0
  for (let i = 0, n = indices.length; i < n; ++i) {
    const j = indices[i] - start
    score += j * j
  }
  return { score, indices }
}
export function matchSumOfDeltas(
  source: string,
  query: string,
  start = 0
): IMatchResult | null {
  const indices = findIndices(source, query, start)
  if (!indices) {
    return null
  }
  let score = 0
  let last = start - 1
  for (let i = 0, n = indices.length; i < n; ++i) {
    const j = indices[i]
    score += j - last - 1
    last = j
  }
  return { score, indices }
}
export function highlight<T>(
  source: string,
  indices: ReadonlyArray<number>,
  fn: (chunk: string) => T
): Array<string | T> {
  const result: Array<string | T> = []
  let k = 0
  let last = 0
  const n = indices.length
  while (k < n) {
    const i = indices[k]
    let j = indices[k]
    while (++k < n && indices[k] === j + 1) {
      j++
    }
    if (last < i) {
      result.push(source.slice(last, i))
    }
    if (i < j + 1) {
      result.push(fn(source.slice(i, j + 1)))
    }
    last = j + 1
  }
  if (last < source.length) {
    result.push(source.slice(last))
  }
  return result
}
export function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
export function* take<T>(
  object: Iterable<T>,
  count: number
): IterableIterator<T> {
  if (count < 1) {
    return
  }
  const it = object[Symbol.iterator]()
  let item: IteratorResult<T>
  while (0 < count-- && !(item = it.next()).done) {
    yield item.value
  }
}
export function* zip<T>(...objects: Iterable<T>[]): IterableIterator<T[]> {
  const iters = objects.map(obj => obj[Symbol.iterator]())
  let tuple = iters.map(it => it.next())
  for (; every(tuple, item => !item.done); tuple = iters.map(it => it.next())) {
    yield tuple.map(item => item.value)
  }
}
