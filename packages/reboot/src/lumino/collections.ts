import type { IRetroable } from "./algorithm.js"
export class LinkedList<T> implements Iterable<T>, IRetroable<T> {
  get isEmpty(): boolean {
    return this._size === 0
  }
  get size(): number {
    return this._size
  }
  get length(): number {
    return this._size
  }
  get first(): T | undefined {
    return this._first ? this._first.value : undefined
  }
  get last(): T | undefined {
    return this._last ? this._last.value : undefined
  }
  get firstNode(): INode<T> | null {
    return this._first
  }
  get lastNode(): INode<T> | null {
    return this._last
  }
  *[Symbol.iterator](): IterableIterator<T> {
    let node = this._first
    while (node) {
      yield node.value
      node = node.next
    }
  }
  *retro(): IterableIterator<T> {
    let node = this._last
    while (node) {
      yield node.value
      node = node.prev
    }
  }
  *nodes(): IterableIterator<INode<T>> {
    let node = this._first
    while (node) {
      yield node
      node = node.next
    }
  }
  *retroNodes(): IterableIterator<INode<T>> {
    let node = this._last
    while (node) {
      yield node
      node = node.prev
    }
  }
  assign(values: Iterable<T>): void {
    this.clear()
    for (const value of values) {
      this.addLast(value)
    }
  }
  push(value: T): void {
    this.addLast(value)
  }
  pop(): T | undefined {
    return this.removeLast()
  }
  shift(value: T): void {
    this.addFirst(value)
  }
  unshift(): T | undefined {
    return this.removeFirst()
  }
  addFirst(value: T): INode<T> {
    const node = new LinkedListNode<T>(this, value)
    if (!this._first) {
      this._first = node
      this._last = node
    } else {
      node.next = this._first
      this._first.prev = node
      this._first = node
    }
    this._size++
    return node
  }
  addLast(value: T): INode<T> {
    const node = new LinkedListNode<T>(this, value)
    if (!this._last) {
      this._first = node
      this._last = node
    } else {
      node.prev = this._last
      this._last.next = node
      this._last = node
    }
    this._size++
    return node
  }
  insertBefore(value: T, ref: INode<T> | null): INode<T> {
    if (!ref || ref === this._first) {
      return this.addFirst(value)
    }
    if (!(ref instanceof LinkedListNode) || ref.list !== this) {
      throw new Error("Reference node is not owned by the list.")
    }
    const node = new LinkedListNode<T>(this, value)
    const _ref = ref as LinkedListNode<T>
    const prev = _ref.prev!
    node.next = _ref
    node.prev = prev
    _ref.prev = node
    prev.next = node
    this._size++
    return node
  }
  insertAfter(value: T, ref: INode<T> | null): INode<T> {
    if (!ref || ref === this._last) {
      return this.addLast(value)
    }
    if (!(ref instanceof LinkedListNode) || ref.list !== this) {
      throw new Error("Reference node is not owned by the list.")
    }
    const node = new LinkedListNode<T>(this, value)
    const _ref = ref as LinkedListNode<T>
    const next = _ref.next!
    node.next = next
    node.prev = _ref
    _ref.next = node
    next.prev = node
    this._size++
    return node
  }
  removeFirst(): T | undefined {
    const node = this._first
    if (!node) {
      return undefined
    }
    if (node === this._last) {
      this._first = null
      this._last = null
    } else {
      this._first = node.next
      this._first!.prev = null
    }
    node.list = null
    node.next = null
    node.prev = null
    this._size--
    return node.value
  }
  removeLast(): T | undefined {
    const node = this._last
    if (!node) {
      return undefined
    }
    if (node === this._first) {
      this._first = null
      this._last = null
    } else {
      this._last = node.prev
      this._last!.next = null
    }
    node.list = null
    node.next = null
    node.prev = null
    this._size--
    return node.value
  }
  removeNode(node: INode<T>): void {
    if (!(node instanceof LinkedListNode) || node.list !== this) {
      throw new Error("Node is not owned by the list.")
    }
    const _node = node as LinkedListNode<T>
    if (_node === this._first && _node === this._last) {
      this._first = null
      this._last = null
    } else if (_node === this._first) {
      this._first = _node.next
      this._first!.prev = null
    } else if (_node === this._last) {
      this._last = _node.prev
      this._last!.next = null
    } else {
      _node.next!.prev = _node.prev
      _node.prev!.next = _node.next
    }
    _node.list = null
    _node.next = null
    _node.prev = null
    this._size--
  }
  clear(): void {
    let node = this._first
    while (node) {
      const next = node.next
      node.list = null
      node.prev = null
      node.next = null
      node = next
    }
    this._first = null
    this._last = null
    this._size = 0
  }
  private _first: LinkedListNode<T> | null = null
  private _last: LinkedListNode<T> | null = null
  private _size = 0
}
export interface INode<T> {
  readonly list: LinkedList<T> | null
  readonly next: INode<T> | null
  readonly prev: INode<T> | null
  readonly value: T
}
export function from<T>(values: Iterable<T>): LinkedList<T> {
  const list = new LinkedList<T>()
  list.assign(values)
  return list
}
export class LinkedListNode<T> {
  list: LinkedList<T> | null = null
  next: LinkedListNode<T> | null = null
  prev: LinkedListNode<T> | null = null
  readonly value: T
  constructor(list: LinkedList<T>, value: T) {
    this.list = list
    this.value = value
  }
}
