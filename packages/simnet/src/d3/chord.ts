import { slice } from "./utils_seq.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export const abs = Math.abs
export const cos = Math.cos
export const sin = Math.sin
export const pi = Math.PI
export const halfPi = pi / 2
export const tau = pi * 2
export const max = Math.max
export const epsilon = 1e-12

export const slice = Array.prototype.slice

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
export function chordTranspose() {
  return _chord(false, true)
}
export function chordDirected() {
  return _chord(true, false)
}
function _chord(directed, transpose): qt.ChordLayout {
  let padAngle = 0,
    sortGroups = null,
    sortSubgroups = null,
    sortChords = null
  function chord(matrix) {
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
    k = max(0, tau - padAngle * n) / k
    dx = k ? padAngle : tau / n
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
  chord.padAngle = function (_) {
    return arguments.length ? ((padAngle = max(0, _)), chord) : padAngle
  }
  chord.sortGroups = function (_) {
    return arguments.length ? ((sortGroups = _), chord) : sortGroups
  }
  chord.sortSubgroups = function (_) {
    return arguments.length ? ((sortSubgroups = _), chord) : sortSubgroups
  }
  chord.sortChords = function (_) {
    return arguments.length
      ? (_ == null ? (sortChords = null) : ((sortChords = compareValue(_))._ = _), chord)
      : sortChords && sortChords._
  }
  return chord
}
function defaultSource(d) {
  return d.source
}
function defaultTarget(d) {
  return d.target
}
function defaultRadius(d) {
  return d.radius
}
function defaultStartAngle(d) {
  return d.startAngle
}
function defaultEndAngle(d) {
  return d.endAngle
}
function defaultPadAngle() {
  return 0
}
function defaultArrowheadRadius() {
  return 10
}
function _ribbon(headRadius) {
  let source = defaultSource,
    target = defaultTarget,
    sourceRadius = defaultRadius,
    targetRadius = defaultRadius,
    startAngle = defaultStartAngle,
    endAngle = defaultEndAngle,
    padAngle = defaultPadAngle,
    context = null
  function y() {
    let buffer,
      s = source.apply(this, arguments),
      t = target.apply(this, arguments),
      ap = padAngle.apply(this, arguments) / 2,
      argv = slice.call(arguments),
      sr = +sourceRadius.apply(this, ((argv[0] = s), argv)),
      sa0 = startAngle.apply(this, argv) - halfPi,
      sa1 = endAngle.apply(this, argv) - halfPi,
      tr = +targetRadius.apply(this, ((argv[0] = t), argv)),
      ta0 = startAngle.apply(this, argv) - halfPi,
      ta1 = endAngle.apply(this, argv) - halfPi
    if (!context) context = buffer = new qu.Path()
    if (ap > epsilon) {
      if (abs(sa1 - sa0) > ap * 2 + epsilon) sa1 > sa0 ? ((sa0 += ap), (sa1 -= ap)) : ((sa0 -= ap), (sa1 += ap))
      else sa0 = sa1 = (sa0 + sa1) / 2
      if (abs(ta1 - ta0) > ap * 2 + epsilon) ta1 > ta0 ? ((ta0 += ap), (ta1 -= ap)) : ((ta0 -= ap), (ta1 += ap))
      else ta0 = ta1 = (ta0 + ta1) / 2
    }
    context.moveTo(sr * cos(sa0), sr * sin(sa0))
    context.arc(0, 0, sr, sa0, sa1)
    if (sa0 !== ta0 || sa1 !== ta1) {
      if (headRadius) {
        let hr = +headRadius.apply(this, arguments),
          tr2 = tr - hr,
          ta2 = (ta0 + ta1) / 2
        context.quadraticCurveTo(0, 0, tr2 * cos(ta0), tr2 * sin(ta0))
        context.lineTo(tr * cos(ta2), tr * sin(ta2))
        context.lineTo(tr2 * cos(ta1), tr2 * sin(ta1))
      } else {
        context.quadraticCurveTo(0, 0, tr * cos(ta0), tr * sin(ta0))
        context.arc(0, 0, tr, ta0, ta1)
      }
    }
    context.quadraticCurveTo(0, 0, sr * cos(sa0), sr * sin(sa0))
    context.closePath()
    if (buffer) return (context = null), buffer + "" || null
  }
  if (headRadius)
    y.headRadius = function (_) {
      return arguments.length ? ((headRadius = typeof _ === "function" ? _ : qu.constant(+_)), y) : headRadius
    }
  y.radius = function (_) {
    return arguments.length
      ? ((sourceRadius = targetRadius = typeof _ === "function" ? _ : qu.constant(+_)), y)
      : sourceRadius
  }
  y.sourceRadius = function (_) {
    return arguments.length ? ((sourceRadius = typeof _ === "function" ? _ : qu.constant(+_)), y) : sourceRadius
  }
  y.targetRadius = function (_) {
    return arguments.length ? ((targetRadius = typeof _ === "function" ? _ : qu.constant(+_)), y) : targetRadius
  }
  y.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : qu.constant(+_)), y) : startAngle
  }
  y.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : qu.constant(+_)), y) : endAngle
  }
  y.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : qu.constant(+_)), y) : padAngle
  }
  y.source = function (_) {
    return arguments.length ? ((source = _), y) : source
  }
  y.target = function (_) {
    return arguments.length ? ((target = _), y) : target
  }
  y.context = function (_) {
    return arguments.length ? ((context = _ == null ? null : _), y) : context
  }
  return y
}
export function ribbon(): qt.RibbonGenerator<any, qt.Ribbon, qt.RibbonSubgroup>
export function ribbon<T, U>(): qt.RibbonGenerator<any, T, U>
export function ribbon<This, T, U>(): qt.RibbonGenerator<This, T, U> {
  return _ribbon()
}
export function ribbonArrow(): qt.RibbonArrowGenerator<any, qt.Ribbon, qt.RibbonSubgroup>
export function ribbonArrow<T, U>(): qt.RibbonArrowGenerator<any, T, U>
export function ribbonArrow<This, T, U>(): qt.RibbonArrowGenerator<This, T, U> {
  return _ribbon(defaultArrowheadRadius)
}
