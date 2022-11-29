import type { Random as qr } from "./types.js"

export const src = Math.random

export const irwinHall: qr.IrwinHall = (function s(f) {
  function y(n: number) {
    if ((n = +n) <= 0) return () => 0
    return () => {
      let sum = 0
      let i = n
      for (; i > 1; --i) sum += f()
      return sum + i * f()
    }
  }
  y.source = s
  return y
})(src)

export const bates: qr.Bates = (function s(f) {
  const si = irwinHall.source(f)
  function y(n: number) {
    if ((n = +n) === 0) return f
    const i = si(n)
    return () => i() / n
  }
  y.source = s
  return y
})(src)

export const bernoulli: qr.Bernoulli = (function s(f) {
  function y(p: number) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p")
    return () => Math.floor(f() + p)
  }
  y.source = s
  return y
})(src)

export const normal: qr.Normal = (function s(f) {
  function y(mu?: number, sigma?: number) {
    mu = mu === undefined ? 0 : +mu
    sigma = sigma == undefined ? 1 : +sigma
    let x: number | undefined
    let r: number
    return () => {
      let y: number
      if (x != undefined) (y = x), (x = undefined)
      else
        do {
          x = f() * 2 - 1
          y = f() * 2 - 1
          r = x * x + y * y
        } while (!r || r > 1)
      return mu! + sigma! * y * Math.sqrt((-2 * Math.log(r)) / r)
    }
  }
  y.source = s
  return y
})(src)

export const gamma: qr.Gamma = (function s(f) {
  const sn = normal.source(f)()
  function y(k: number, theta?: number) {
    if ((k = +k) < 0) throw new RangeError("invalid k")
    if (k === 0) return () => 0
    theta = theta == undefined ? 1 : +theta
    if (k === 1) return () => -Math.log1p(-f()) * theta!
    const d = (k < 1 ? k + 1 : k) - 1 / 3
    const c = 1 / (3 * Math.sqrt(d))
    const multiplier = k < 1 ? () => Math.pow(f(), 1 / k) : () => 1
    return () => {
      let x, u, v
      do {
        do {
          x = sn()
          v = 1 + c * x
        } while (v <= 0)
        v *= v * v
        u = 1 - f()
      } while (u >= 1 - 0.0331 * x * x * x * x && Math.log(u) >= 0.5 * x * x + d * (1 - v + Math.log(v)))
      return d * v * multiplier() * theta!
    }
  }
  y.source = s
  return y
})(src)

export const beta: qr.Beta = (function s(f) {
  const sg = gamma.source(f)
  function y(alpha: number, beta: number) {
    const a = sg(alpha)
    const b = sg(beta)
    return () => {
      const x = a()
      return x === 0 ? 0 : x / (x + b())
    }
  }
  y.source = s
  return y
})(src)

export const geometric: qr.Geometric = (function s(f) {
  function y(p: number) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p")
    if (p === 0) return () => Infinity
    if (p === 1) return () => 1
    p = Math.log1p(-p)
    return () => 1 + Math.floor(Math.log1p(-f()) / p)
  }
  y.source = s
  return y
})(src)

export const binomial: qr.Binomial = (function s(f) {
  const sg = geometric.source(f)
  const sb = beta.source(f)
  function y(n: number, p: number) {
    n = +n
    if ((p = +p) >= 1) return () => n
    if (p <= 0) return () => 0
    return () => {
      let acc = 0,
        n2 = n,
        p2 = p
      while (n2 * p2 > 16 && n2 * (1 - p2) > 16) {
        const i = Math.floor((n2 + 1) * p2)
        const y = sb(i, n2 - i + 1)()
        if (y <= p2) {
          acc += i
          n2 -= i
          p2 = (p2 - y) / (1 - y)
        } else {
          n2 = i - 1
          p2 /= y
        }
      }
      const sign = p2 < 0.5
      const g = sg(sign ? p2 : 1 - p2)
      let k = 0
      for (let s = g(); s <= n2; ++k) s += g()
      return acc + (sign ? k : n2 - k)
    }
  }
  y.source = s
  return y
})(src)

export const cauchy: qr.Cauchy = (function s(f) {
  function y(a?: number, b?: number) {
    a = a == undefined ? 0 : +a
    b = b == undefined ? 1 : +b
    return () => a! + b! * Math.tan(Math.PI * f())
  }
  y.source = s
  return y
})(src)

export const exponential: qr.Exponential = (function s(f) {
  function y(lambda: number) {
    return () => -Math.log1p(-f()) / lambda
  }
  y.source = s
  return y
})(src)

export const int: qr.Int = (function s(f) {
  function y(min = 0, max?: number) {
    if (max === undefined) (max = min), (min = 0)
    min = Math.floor(min)
    max = Math.floor(max) - min
    return () => Math.floor(f() * max! + min)
  }
  y.source = s
  return y
})(src)

export const logNormal: qr.LogNormal = (function s(f) {
  const sn = normal.source(f)
  function y(...xs: any) {
    const n = sn.apply(xs)
    return () => Math.exp(n())
  }
  y.source = s
  return y
})(src)

export const logistic: qr.Logistic = (function s(f) {
  function y(a?: number, b?: number) {
    a = a == undefined ? 0 : +a
    b = b == undefined ? 1 : +b
    return () => {
      const u = f()
      return a! + b! * Math.log(u / (1 - u))
    }
  }
  y.source = s
  return y
})(src)

export const pareto: qr.Pareto = (function s(f) {
  function y(alpha: number) {
    if ((alpha = +alpha) < 0) throw new RangeError("invalid alpha")
    alpha = 1 / -alpha
    return () => Math.pow(1 - f(), alpha)
  }
  y.source = s
  return y
})(src)

export const poisson: qr.Poisson = (function s(f) {
  const sg = gamma.source(f)
  const sb = binomial.source(f)
  function y(lambda: number) {
    return () => {
      let acc = 0,
        l = lambda
      while (l > 16) {
        const n = Math.floor(0.875 * l)
        const t = sg(n)()
        if (t > l) return acc + sb(n - 1, l / t)()
        acc += n
        l -= t
      }
      let k = 0
      for (let s = -Math.log1p(-f()); s <= l; ++k) s -= Math.log1p(-f())
      return acc + k
    }
  }
  y.source = s
  return y
})(src)

export const uniform: qr.Uniform = (function s(f) {
  function y(min = 0, max?: number) {
    if (max === undefined) (max = min), (min = 0)
    return () => f() * max! + min
  }
  y.source = s
  return y
})(src)

export const weibull: qr.Weibull = (function s(f) {
  function y(k: number, a?: number, b?: number) {
    let outer: Function
    if ((k = +k) === 0) outer = (x: number) => -Math.log(x)
    else {
      k = 1 / k
      outer = (x: number) => Math.pow(x, k)
    }
    a = a == null ? 0 : +a
    b = b == null ? 1 : +b
    return () => a! + b! * outer(-Math.log1p(-f()))
  }
  y.source = s
  return y
})(src)

const mul = 0x19660d
const inc = 0x3c6ef35f
const eps = 1 / 0x100000000

export function lcg(seed = Math.random()) {
  let state = (0 <= seed && seed < 1 ? seed / eps : Math.abs(seed)) | 0
  return () => ((state = (mul * state + inc) | 0), eps * (state >>> 0))
}
