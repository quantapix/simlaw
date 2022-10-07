/* eslint-disable @typescript-eslint/no-this-alias */
import type * as qt from "./types.js"

export function hierarchy<T>(data: T, children?: (x: T) => Iterable<T> | null | undefined): qt.HierarchyNode<T> {
  if (data instanceof Map) {
    data = [undefined, data]
    if (children === undefined) children = mapChildren
  } else if (children === undefined) children = objectChildren
  const root = new Node(data)
  let node,
    nodes = [root],
    child,
    childs,
    i,
    n
  while ((node = nodes.pop())) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs
      for (i = n - 1; i >= 0; --i) {
        nodes.push((child = childs[i] = new Node(childs[i])))
        child.parent = node
        child.depth = node.depth + 1
      }
    }
  }
  return root.eachBefore(computeHeight)
}

function objectChildren(x: any) {
  return x.children
}
function mapChildren(x: any) {
  return Array.isArray(x) ? x[1] : null
}
function copyData(x) {
  if (x.data.value !== undefined) x.value = x.data.value
  x.data = x.data.data
}
function computeHeight(x) {
  let height = 0
  do x.height = height
  while ((x = x.parent) && x.height < ++height)
}

export class Node<T> implements qt.HierarchyNode<T> {
  children?: this[]
  parent = null
  depth = 0
  height = 0
  constructor(public data: T) {}
  ancestors() {
    let y: this | null = this
    const ys = [y]
    while ((y = y.parent)) {
      ys.push(y)
    }
    return ys
  }
  copy() {
    return hierarchy(this).eachBefore(copyData)
  }
  count() {
    const count = (x: this) => {
      const cs = x.children
      let sum = 0,
        i = cs && cs.length
      if (!i) sum = 1
      else while (--i >= 0) sum += cs[i]?.value
      x.value = sum
    }
    return this.eachAfter(count)
  }
  descendants() {
    return Array.from(this)
  }
  each<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  each(f: any, ctx?: unknown) {
    let i = -1
    for (const y of this) {
      f.call(ctx, y, ++i, this)
    }
    return this
  }
  eachAfter<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachAfter(f: any, ctx?: unknown) {
    let y: this | undefined = this
    const ys = [y]
    const next = []
    while ((y = ys.pop())) {
      next.push(y)
      let cs
      if ((cs = y.children)) {
        for (const c of cs) {
          ys.push(c)
        }
      }
    }
    let i = -1
    while ((y = next.pop())) {
      f.call(ctx, y, ++i, this)
    }
    return this
  }
  eachBefore<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachBefore(f: any, ctx?: unknown) {
    let y: this | undefined = this
    const ys = [y]
    let i = -1
    while ((y = ys.pop())) {
      f.call(ctx, y, ++i, this)
      let cs
      if ((cs = y.children)) {
        for (let j = cs.length - 1; j >= 0; --j) {
          ys.push(cs[j])
        }
      }
    }
    return this
  }
  find(f: (x: this) => boolean): this | undefined
  find(f: any, ctx?: unknown) {
    let i = -1
    for (const y of this) {
      if (f.call(ctx, y, ++i, this)) return y
    }
    return
  }
  *iterator() {
    let y: this | undefined = this,
      current,
      next = [y]
    do {
      ;(current = next.reverse()), (next = [])
      while ((y = current.pop())) {
        yield y
        let cs
        if ((cs = y.children)) {
          for (const c of cs) {
            next.push(c)
          }
        }
      }
    } while (next.length)
  }
  [Symbol.iterator] = this.iterator
  leaves() {
    const ys: this[] = []
    this.eachBefore(x => {
      if (!x.children) ys.push(x)
    })
    return ys
  }
  links() {
    const ys: qt.HierarchyLink<T>[] = []
    this.each(x => {
      if (x !== this) ys.push({ source: x.parent, target: x })
    })
    return ys
  }
  path(end: this) {
    let y: this | null = this
    const ys = [y]
    const ancestor = leastCommonAncestor(y, end)
    while (y !== ancestor) {
      y = y?.parent
      ys.push(y)
    }
    const k = ys.length
    while (end !== ancestor) {
      ys.splice(k, 0, end)
      end = end.parent
    }
    return ys
  }
  sort(f: (a: this, b: this) => number): this
  sort(f: any) {
    return this.eachBefore((x: any) => {
      if (x.children) x.children.sort(f)
    })
  }
  sum(f: (x: T) => number): this
  sum(f: any) {
    return this.eachAfter((x: any) => {
      const cs = x.children
      let y = +f(x.data) || 0
      let i = cs && cs.length
      while (--i >= 0) y += cs[i].value
      x.value = y
    })
  }
}

function leastCommonAncestor(a, b) {
  if (a === b) return a
  const aNodes = a.ancestors(),
    bNodes = b.ancestors()
  let c = null
  a = aNodes.pop()
  b = bNodes.pop()
  while (a === b) {
    c = a
    a = aNodes.pop()
    b = bNodes.pop()
  }
  return c
}
