import type * as qt from "./types.js"

const overshoot = 1.70158
export const backIn: qt.BackEasingFactory = (function custom(s) {
  s = +s
  function y(x: number) {
    return (x = +x) * x * (s * (x - 1) + x)
  }
  y.overshoot = custom
  return y
})(overshoot)
export const backOut: qt.BackEasingFactory = (function custom(s) {
  s = +s
  function y(x: number) {
    return --x * x * ((x + 1) * s + x) + 1
  }
  y.overshoot = custom
  return y
})(overshoot)
export const back: qt.BackEasingFactory = (function custom(s) {
  s = +s
  function y(x: number) {
    return ((x *= 2) < 1 ? x * x * ((s + 1) * x - s) : (x -= 2) * x * ((s + 1) * x + s) + 2) / 2
  }
  y.overshoot = custom
  return y
})(overshoot)

const b1 = 4 / 11,
  b2 = 6 / 11,
  b3 = 8 / 11,
  b4 = 3 / 4,
  b5 = 9 / 11,
  b6 = 10 / 11,
  b7 = 15 / 16,
  b8 = 21 / 22,
  b9 = 63 / 64,
  b0 = 1 / b1 / b1
export function bounceIn(x: number) {
  return 1 - bounceOut(1 - x)
}
export function bounceOut(x: number) {
  return (x = +x) < b1
    ? b0 * x * x
    : x < b3
    ? b0 * (x -= b2) * x + b4
    : x < b6
    ? b0 * (x -= b5) * x + b7
    : b0 * (x -= b8) * x + b9
}
export function bounce(x: number) {
  return ((x *= 2) <= 1 ? 1 - bounceOut(1 - x) : bounceOut(x - 1) + 1) / 2
}

export function circleIn(x: number) {
  return 1 - Math.sqrt(1 - x * x)
}
export function circleOut(x: number) {
  return Math.sqrt(1 - --x * x)
}
export function circle(x: number) {
  return ((x *= 2) <= 1 ? 1 - Math.sqrt(1 - x * x) : Math.sqrt(1 - (x -= 2) * x) + 1) / 2
}

export function cubicIn(x: number) {
  return x * x * x
}
export function cubicOut(x: number) {
  return --x * x * x + 1
}
export function cubic(x: number) {
  return ((x *= 2) <= 1 ? x * x * x : (x -= 2) * x * x + 2) / 2
}

const tau = 2 * Math.PI
const amplitude = 1
const period = 0.3
export const elasticIn: qt.ElasticEasingFactory = (function custom(a, p) {
  const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau)
  function y(x: number) {
    return a * tpmt(-(--x)) * Math.sin((s - x) / p)
  }
  y.amplitude = function (x: number) {
    return custom(x, p * tau)
  }
  y.period = function (x: number) {
    return custom(a, x)
  }
  return y
})(amplitude, period)
export const elasticOut: qt.ElasticEasingFactory = (function custom(a, p) {
  const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau)
  function y(x: number) {
    return 1 - a * tpmt((x = +x)) * Math.sin((x + s) / p)
  }
  y.amplitude = function (x: number) {
    return custom(x, p * tau)
  }
  y.period = function (x: number) {
    return custom(a, x)
  }
  return y
})(amplitude, period)
export const elastic: qt.ElasticEasingFactory = (function custom(a, p) {
  const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau)
  function y(x: number) {
    return ((x = x * 2 - 1) < 0 ? a * tpmt(-x) * Math.sin((s - x) / p) : 2 - a * tpmt(x) * Math.sin((s + x) / p)) / 2
  }
  y.amplitude = function (x: number) {
    return custom(x, p * tau)
  }
  y.period = function (x: number) {
    return custom(a, x)
  }
  return y
})(amplitude, period)

export function expIn(x: number) {
  return tpmt(1 - +x)
}
export function expOut(x: number) {
  return 1 - tpmt(x)
}
export function exp(x: number) {
  return ((x *= 2) <= 1 ? tpmt(1 - x) : 2 - tpmt(x - 1)) / 2
}

export const linear = (x: number) => +x

export function tpmt(x: number) {
  return (Math.pow(2, -10 * x) - 0.0009765625) * 1.0009775171065494
}

const exponent = 3
export const polyIn: qt.PolyEasingFactory = (function custom(e) {
  e = +e
  function y(x: number) {
    return Math.pow(x, e)
  }
  y.exponent = custom
  return y
})(exponent)
export const polyOut: qt.PolyEasingFactory = (function custom(e) {
  e = +e
  function y(x: number) {
    return 1 - Math.pow(1 - x, e)
  }
  y.exponent = custom
  return y
})(exponent)
export const poly: qt.PolyEasingFactory = (function custom(e) {
  e = +e
  function y(x: number) {
    return ((x *= 2) <= 1 ? Math.pow(x, e) : 2 - Math.pow(2 - x, e)) / 2
  }
  y.exponent = custom
  return y
})(exponent)

export function quadIn(x: number) {
  return x * x
}
export function quadOut(x: number) {
  return x * (2 - x)
}
export function quad(x: number) {
  return ((x *= 2) <= 1 ? x * x : --x * (2 - x) + 1) / 2
}

const pi = Math.PI
const halfPi = pi / 2
export function sinIn(x: number) {
  return +x === 1 ? 1 : 1 - Math.cos(x * halfPi)
}
export function sinOut(x: number) {
  return Math.sin(x * halfPi)
}
export function sin(x: number) {
  return (1 - Math.cos(pi * x)) / 2
}
