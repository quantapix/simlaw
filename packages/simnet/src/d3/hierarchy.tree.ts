import { required } from "../accessors.js"
import constant, { constantZero } from "../constant.js"

export const phi = (1 + Math.sqrt(5)) / 2

export function binary(parent, x0, y0, x1, y1) {
  let nodes = parent.children,
    i,
    n = nodes.length,
    sum,
    sums = new Array(n + 1)
  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value
  }
  partition(0, n, parent.value, x0, y0, x1, y1)
  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      let node = nodes[i]
      ;(node.x0 = x0), (node.y0 = y0)
      ;(node.x1 = x1), (node.y1 = y1)
      return
    }
    let valueOffset = sums[i],
      valueTarget = value / 2 + valueOffset,
      k = i + 1,
      hi = j - 1
    while (k < hi) {
      let mid = (k + hi) >>> 1
      if (sums[mid] < valueTarget) k = mid + 1
      else hi = mid
    }
    if (valueTarget - sums[k - 1] < sums[k] - valueTarget && i + 1 < k) --k
    let valueLeft = sums[k] - valueOffset,
      valueRight = value - valueLeft
    if (x1 - x0 > y1 - y0) {
      let xk = value ? (x0 * valueRight + x1 * valueLeft) / value : x1
      partition(i, k, valueLeft, x0, y0, xk, y1)
      partition(k, j, valueRight, xk, y0, x1, y1)
    } else {
      let yk = value ? (y0 * valueRight + y1 * valueLeft) / value : y1
      partition(i, k, valueLeft, x0, y0, x1, yk)
      partition(k, j, valueRight, x0, yk, x1, y1)
    }
  }
}
export function dice(parent, x0, y0, x1, y1) {
  const nodes = parent.children
  let node,
    i = -1,
    n = nodes.length,
    k = parent.value && (x1 - x0) / parent.value
  while (++i < n) {
    ;(node = nodes[i]), (node.y0 = y0), (node.y1 = y1)
    ;(node.x0 = x0), (node.x1 = x0 += node.value * k)
  }
}

export function treemap() {
  let tile = squarify,
    round = false,
    dx = 1,
    dy = 1,
    paddingStack = [0],
    paddingInner = constantZero,
    paddingTop = constantZero,
    paddingRight = constantZero,
    paddingBottom = constantZero,
    paddingLeft = constantZero
  function treemap(root) {
    root.x0 = root.y0 = 0
    root.x1 = dx
    root.y1 = dy
    root.eachBefore(positionNode)
    paddingStack = [0]
    if (round) root.eachBefore(roundNode)
    return root
  }
  function positionNode(node) {
    let p = paddingStack[node.depth],
      x0 = node.x0 + p,
      y0 = node.y0 + p,
      x1 = node.x1 - p,
      y1 = node.y1 - p
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2
    node.x0 = x0
    node.y0 = y0
    node.x1 = x1
    node.y1 = y1
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2
      x0 += paddingLeft(node) - p
      y0 += paddingTop(node) - p
      x1 -= paddingRight(node) - p
      y1 -= paddingBottom(node) - p
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2
      tile(node, x0, y0, x1, y1)
    }
  }
  treemap.round = function (x) {
    return arguments.length ? ((round = !!x), treemap) : round
  }
  treemap.size = function (x) {
    return arguments.length ? ((dx = +x[0]), (dy = +x[1]), treemap) : [dx, dy]
  }
  treemap.tile = function (x) {
    return arguments.length ? ((tile = required(x)), treemap) : tile
  }
  treemap.padding = function (x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner()
  }
  treemap.paddingInner = function (x) {
    return arguments.length ? ((paddingInner = typeof x === "function" ? x : constant(+x)), treemap) : paddingInner
  }
  treemap.paddingOuter = function (x) {
    return arguments.length
      ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x)
      : treemap.paddingTop()
  }
  treemap.paddingTop = function (x) {
    return arguments.length ? ((paddingTop = typeof x === "function" ? x : constant(+x)), treemap) : paddingTop
  }
  treemap.paddingRight = function (x) {
    return arguments.length ? ((paddingRight = typeof x === "function" ? x : constant(+x)), treemap) : paddingRight
  }
  treemap.paddingBottom = function (x) {
    return arguments.length ? ((paddingBottom = typeof x === "function" ? x : constant(+x)), treemap) : paddingBottom
  }
  treemap.paddingLeft = function (x) {
    return arguments.length ? ((paddingLeft = typeof x === "function" ? x : constant(+x)), treemap) : paddingLeft
  }
  return treemap
}

export const resquarify = (function f(ratio) {
  function y(parent, x0, y0, x1, y1) {
    let rows: any
    if ((rows = parent._squarify) && rows.ratio === ratio) {
      let row,
        nodes,
        i,
        j = -1,
        n,
        m = rows.length,
        value = parent.value
      while (++j < m) {
        ;(row = rows[j]), (nodes = row.children)
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value
        if (row.dice) dice(row, x0, y0, x1, value ? (y0 += ((y1 - y0) * row.value) / value) : y1)
        else slice(row, x0, y0, value ? (x0 += ((x1 - x0) * row.value) / value) : x1, y1)
        value -= row.value
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1)
      rows.ratio = ratio
    }
  }
  y.ratio = x => f((x = +x) > 1 ? x : 1)
  return y
})(phi)

export function roundNode(x) {
  x.x0 = Math.round(x.x0)
  x.y0 = Math.round(x.y0)
  x.x1 = Math.round(x.x1)
  x.y1 = Math.round(x.y1)
}

export function slice(parent, x0, y0, x1, y1) {
  let nodes = parent.children,
    node,
    i = -1,
    n = nodes.length,
    k = parent.value && (y1 - y0) / parent.value
  while (++i < n) {
    ;(node = nodes[i]), (node.x0 = x0), (node.x1 = x1)
    ;(node.y0 = y0), (node.y1 = y0 += node.value * k)
  }
}

export function sliceDice(parent, x0, y0, x1, y1) {
  ;(parent.depth & 1 ? slice : dice)(parent, x0, y0, x1, y1)
}

export function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  let rows = [],
    nodes = parent.children,
    row,
    nodeValue,
    i0 = 0,
    i1 = 0,
    n = nodes.length,
    dx,
    dy,
    value = parent.value,
    sumValue,
    minValue,
    maxValue,
    newRatio,
    minRatio,
    alpha,
    beta
  while (i0 < n) {
    ;(dx = x1 - x0), (dy = y1 - y0)
    do sumValue = nodes[i1++].value
    while (!sumValue && i1 < n)
    minValue = maxValue = sumValue
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio)
    beta = sumValue * sumValue * alpha
    minRatio = Math.max(maxValue / beta, beta / minValue)
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value
      if (nodeValue < minValue) minValue = nodeValue
      if (nodeValue > maxValue) maxValue = nodeValue
      beta = sumValue * sumValue * alpha
      newRatio = Math.max(maxValue / beta, beta / minValue)
      if (newRatio > minRatio) {
        sumValue -= nodeValue
        break
      }
      minRatio = newRatio
    }
    rows.push((row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) }))
    if (row.dice) dice(row, x0, y0, x1, value ? (y0 += (dy * sumValue) / value) : y1)
    else slice(row, x0, y0, value ? (x0 += (dx * sumValue) / value) : x1, y1)
    ;(value -= sumValue), (i0 = i1)
  }
  return rows
}
export const squarify = (function f(ratio) {
  function y(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1)
  }
  y.ratio = x => f((x = +x) > 1 ? x : 1)
  return y
})(phi)
