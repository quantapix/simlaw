import { slice } from "./utils_seq.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

function range(i, j) {
  return Array.from({ length: j - i }, (_, k) => i + k)
}
function compareValue(compare) {
  return function (a, b) {
    return compare(a.source.value + a.target.value, b.source.value + b.target.value)
  }
}
export function chord() {
  return _chord(false, false)
}
export function transpose() {
  return _chord(false, true)
}
export function directed() {
  return _chord(true, false)
}
function _chord(directed, transpose): qt.Chord.Layout {
  let padAngle = 0,
    sortGroups = null,
    sortSubgroups = null,
    sortChords = null
  function f(matrix) {
    let n = matrix.length,
      groupSums = new Array(n),
      groupIndex = range(0, n),
      chords = new Array(n * n),
      groups = new Array(n),
      k = 0,
      dx
    matrix = Float64Array.from(
      { length: n * n },
      transpose ? (_, i) => matrix[i % n][(i / n) | 0] : (_, i) => matrix[(i / n) | 0][i % n]
    )
    for (let i = 0; i < n; ++i) {
      let x = 0
      for (let j = 0; j < n; ++j) x += matrix[i * n + j] + directed * matrix[j * n + i]
      k += groupSums[i] = x
    }
    k = qu.max(0, qu.tau - padAngle * n) / k
    dx = k ? padAngle : qu.tau / n
    {
      let x = 0
      if (sortGroups) groupIndex.sort((a, b) => sortGroups(groupSums[a], groupSums[b]))
      for (const i of groupIndex) {
        const x0 = x
        if (directed) {
          const subgroupIndex = range(~n + 1, n).filter(j => (j < 0 ? matrix[~j * n + i] : matrix[i * n + j]))
          if (sortSubgroups)
            subgroupIndex.sort((a, b) =>
              sortSubgroups(
                a < 0 ? -matrix[~a * n + i] : matrix[i * n + a],
                b < 0 ? -matrix[~b * n + i] : matrix[i * n + b]
              )
            )
          for (const j of subgroupIndex) {
            if (j < 0) {
              const chord = chords[~j * n + i] || (chords[~j * n + i] = { source: null, target: null })
              chord.target = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[~j * n + i] * k),
                value: matrix[~j * n + i],
              }
            } else {
              const chord = chords[i * n + j] || (chords[i * n + j] = { source: null, target: null })
              chord.source = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
            }
          }
          groups[i] = { index: i, startAngle: x0, endAngle: x, value: groupSums[i] }
        } else {
          const subgroupIndex = range(0, n).filter(j => matrix[i * n + j] || matrix[j * n + i])
          if (sortSubgroups) subgroupIndex.sort((a, b) => sortSubgroups(matrix[i * n + a], matrix[i * n + b]))
          for (const j of subgroupIndex) {
            let chord
            if (i < j) {
              chord = chords[i * n + j] || (chords[i * n + j] = { source: null, target: null })
              chord.source = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
            } else {
              chord = chords[j * n + i] || (chords[j * n + i] = { source: null, target: null })
              chord.target = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
              if (i === j) chord.source = chord.target
            }
            if (chord.source && chord.target && chord.source.value < chord.target.value) {
              const source = chord.source
              chord.source = chord.target
              chord.target = source
            }
          }
          groups[i] = { index: i, startAngle: x0, endAngle: x, value: groupSums[i] }
        }
        x += dx
      }
    }
    chords = Object.values(chords)
    chords.groups = groups
    return sortChords ? chords.sort(sortChords) : chords
  }
  f.padAngle = (x: any) => (x === undefined ? padAngle : ((padAngle = qu.max(0, x)), f))
  f.sortGroups = (x: any) => (x === undefined ? sortGroups : ((sortGroups = x), f))
  f.sortSubgroups = (x: any) => (x === undefined ? sortSubgroups : ((sortSubgroups = x), f))
  f.sortChords = (x: any) =>
    x === undefined
      ? sortChords && sortChords._
      : (x == null ? (sortChords = null) : ((sortChords = compareValue(x))._ = x), f)
  return f
}
function _ribbon(headRadius?) {
  let source = x => x.source,
    target = x => x.target,
    sourceRadius = x => x.radius,
    targetRadius = x => x.radius,
    startAngle = x => x.startAngle,
    endAngle = x => x.endAngle,
    padAngle = () => 0,
    context = null
  function f() {
    let buffer,
      s = source.apply(this, arguments),
      t = target.apply(this, arguments),
      ap = padAngle.apply(this, arguments) / 2,
      argv = slice.call(arguments),
      sr = +sourceRadius.apply(this, ((argv[0] = s), argv)),
      sa0 = startAngle.apply(this, argv) - qu.halfPI,
      sa1 = endAngle.apply(this, argv) - qu.halfPI,
      tr = +targetRadius.apply(this, ((argv[0] = t), argv)),
      ta0 = startAngle.apply(this, argv) - qu.halfPI,
      ta1 = endAngle.apply(this, argv) - qu.halfPI
    if (!context) context = buffer = new qu.Path()
    if (ap > qu.epsilon2) {
      if (qu.abs(sa1 - sa0) > ap * 2 + qu.epsilon2) sa1 > sa0 ? ((sa0 += ap), (sa1 -= ap)) : ((sa0 -= ap), (sa1 += ap))
      else sa0 = sa1 = (sa0 + sa1) / 2
      if (qu.abs(ta1 - ta0) > ap * 2 + qu.epsilon2) ta1 > ta0 ? ((ta0 += ap), (ta1 -= ap)) : ((ta0 -= ap), (ta1 += ap))
      else ta0 = ta1 = (ta0 + ta1) / 2
    }
    context.moveTo(sr * qu.cos(sa0), sr * qu.sin(sa0))
    context.arc(0, 0, sr, sa0, sa1)
    if (sa0 !== ta0 || sa1 !== ta1) {
      if (headRadius) {
        let hr = +headRadius.apply(this, arguments),
          tr2 = tr - hr,
          ta2 = (ta0 + ta1) / 2
        context.quadraticTo(0, 0, tr2 * qu.cos(ta0), tr2 * qu.sin(ta0))
        context.lineTo(tr * qu.cos(ta2), tr * qu.sin(ta2))
        context.lineTo(tr2 * qu.cos(ta1), tr2 * qu.sin(ta1))
      } else {
        context.quadraticTo(0, 0, tr * qu.cos(ta0), tr * qu.sin(ta0))
        context.arc(0, 0, tr, ta0, ta1)
      }
    }
    context.quadraticTo(0, 0, sr * qu.cos(sa0), sr * qu.sin(sa0))
    context.closePath()
    if (buffer) return (context = null), buffer + "" || null
  }
  if (headRadius)
    f.headRadius = function (_) {
      return arguments.length ? ((headRadius = typeof _ === "function" ? _ : qu.constant(+_)), f) : headRadius
    }
  f.radius = function (_) {
    return arguments.length
      ? ((sourceRadius = targetRadius = typeof _ === "function" ? _ : qu.constant(+_)), f)
      : sourceRadius
  }
  f.sourceRadius = function (_) {
    return arguments.length ? ((sourceRadius = typeof _ === "function" ? _ : qu.constant(+_)), f) : sourceRadius
  }
  f.targetRadius = function (_) {
    return arguments.length ? ((targetRadius = typeof _ === "function" ? _ : qu.constant(+_)), f) : targetRadius
  }
  f.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : qu.constant(+_)), f) : startAngle
  }
  f.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : qu.constant(+_)), f) : endAngle
  }
  f.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : qu.constant(+_)), f) : padAngle
  }
  f.source = function (_) {
    return arguments.length ? ((source = _), f) : source
  }
  f.target = function (_) {
    return arguments.length ? ((target = _), f) : target
  }
  f.context = function (_) {
    return arguments.length ? ((context = _ == null ? null : _), f) : context
  }
  return f
}
export function ribbon(): qt.Ribbon.Gen<any, qt.Ribbon, qt.Ribbon.Subgroup>
export function ribbon<T, U>(): qt.Ribbon.Gen<any, T, U>
export function ribbon<This, T, U>(): qt.Ribbon.Gen<This, T, U> {
  return _ribbon()
}
export function ribbonArrow(): qt.Ribbon.ArrowGen<any, qt.Ribbon, qt.Ribbon.Subgroup>
export function ribbonArrow<T, U>(): qt.Ribbon.ArrowGen<any, T, U>
export function ribbonArrow<This, T, U>(): qt.Ribbon.ArrowGen<This, T, U> {
  return _ribbon(() => 10)
}
