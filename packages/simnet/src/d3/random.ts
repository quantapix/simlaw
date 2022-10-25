import type * as qt from "./types.js"

export const src = Math.random

export const bates: qt.RandomBates = (function s(x) {
  const I = irwinHall.source(x)
  function y(n) {
    if ((n = +n) === 0) return x
    const randomIrwinHall = I(n)
    return function () {
      return randomIrwinHall() / n
    }
  }
  y.source = s
  return y
})(src)

export const bernoulli: qt.RandomBernoulli = (function s(x) {
  function y(p) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p")
    return function () {
      return Math.floor(x() + p)
    }
  }
  y.source = s
  return y
})(src)

export const beta: qt.RandomBeta = (function s(x) {
  const G = gamma.source(x)
  function y(alpha, beta) {
    const X = G(alpha),
      Y = G(beta)
    return function () {
      const x = X()
      return x === 0 ? 0 : x / (x + Y())
    }
  }
  y.source = s
  return y
})(src)

export const binomial: qt.RandomBinomial = (function s(x) {
  const G = geometric.source(x),
    B = beta.source(x)
  function y(n, p) {
    n = +n
    if ((p = +p) >= 1) return () => n
    if (p <= 0) return () => 0
    return function () {
      let acc = 0,
        nn = n,
        pp = p
      while (nn * pp > 16 && nn * (1 - pp) > 16) {
        const i = Math.floor((nn + 1) * pp),
          y = B(i, nn - i + 1)()
        if (y <= pp) {
          acc += i
          nn -= i
          pp = (pp - y) / (1 - y)
        } else {
          nn = i - 1
          pp /= y
        }
      }
      const sign = pp < 0.5,
        pFinal = sign ? pp : 1 - pp,
        g = G(pFinal)
      for (let s = g(), k = 0; s <= nn; ++k) s += g()
      return acc + (sign ? k : nn - k)
    }
  }
  y.source = s
  return y
})(src)

export const cauchy: qt.RandomCauchy = (function s(x) {
  function y(a, b) {
    a = a == null ? 0 : +a
    b = b == null ? 1 : +b
    return function () {
      return a + b * Math.tan(Math.PI * x())
    }
  }
  y.source = s
  return y
})(src)

export const exponential: qt.RandomExponential = (function s(x) {
  function y(lambda) {
    return function () {
      return -Math.log1p(-x()) / lambda
    }
  }
  y.source = s
  return y
})(src)

export const gamma: qt.RandomGamma = (function s(x) {
  const randomNormal = normal.source(x)()
  function y(k, theta) {
    if ((k = +k) < 0) throw new RangeError("invalid k")
    if (k === 0) return () => 0
    theta = theta == null ? 1 : +theta
    if (k === 1) return () => -Math.log1p(-x()) * theta
    const d = (k < 1 ? k + 1 : k) - 1 / 3,
      c = 1 / (3 * Math.sqrt(d)),
      multiplier = k < 1 ? () => Math.pow(x(), 1 / k) : () => 1
    return function () {
      let u, v
      do {
        do {
          const x = randomNormal()
          v = 1 + c * x
        } while (v <= 0)
        v *= v * v
        u = 1 - x()
      } while (u >= 1 - 0.0331 * x * x * x * x && Math.log(u) >= 0.5 * x * x + d * (1 - v + Math.log(v)))
      return d * v * multiplier() * theta
    }
  }
  y.source = s
  return y
})(src)

export const geometric: qt.RandomGeometric = (function s(x) {
  function y(p) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p")
    if (p === 0) return () => Infinity
    if (p === 1) return () => 1
    p = Math.log1p(-p)
    return function () {
      return 1 + Math.floor(Math.log1p(-x()) / p)
    }
  }
  y.source = s
  return y
})(src)

export const int: qt.RandomInt = (function s(x) {
  function y(min, max) {
    if (arguments.length < 2) (max = min), (min = 0)
    min = Math.floor(min)
    max = Math.floor(max) - min
    return function () {
      return Math.floor(x() * max + min)
    }
  }
  y.source = s
  return y
})(src)

export const irwinHall: qt.RandomIrwinHall = (function s(x) {
  function y(n) {
    if ((n = +n) <= 0) return () => 0
    return function () {
      let sum = 0
      let i = n
      for (; i > 1; --i) sum += x()
      return sum + i * x()
    }
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

export const logNormal: qt.RandomLogNormal = (function s(x) {
  const N = normal.source(x)
  function y() {
    const randomNormal = N.apply(this, arguments)
    return function () {
      return Math.exp(randomNormal())
    }
  }
  y.source = s
  return y
})(src)

export const logistic: qt.RandomLogistic = (function s(x) {
  function y(a, b) {
    a = a == null ? 0 : +a
    b = b == null ? 1 : +b
    return function () {
      const u = x()
      return a + b * Math.log(u / (1 - u))
    }
  }
  y.source = s
  return y
})(src)

export const normal: qt.RandomNormal = (function s(x) {
  function y(mu, sigma) {
    let x, r
    mu = mu == null ? 0 : +mu
    sigma = sigma == null ? 1 : +sigma
    return function () {
      let y
      if (x != null) (y = x), (x = null)
      else
        do {
          x = x() * 2 - 1
          y = x() * 2 - 1
          r = x * x + y * y
        } while (!r || r > 1)
      return mu + sigma * y * Math.sqrt((-2 * Math.log(r)) / r)
    }
  }
  y.source = s
  return y
})(src)

export const pareto: qt.RandomPareto = (function s(x) {
  function y(alpha) {
    if ((alpha = +alpha) < 0) throw new RangeError("invalid alpha")
    alpha = 1 / -alpha
    return function () {
      return Math.pow(1 - x(), alpha)
    }
  }
  y.source = s
  return y
})(src)

export const poisson: qt.RandomPoisson = (function s(x) {
  const G = gamma.source(x),
    B = binomial.source(x)
  function y(lambda) {
    return function () {
      let acc = 0,
        l = lambda
      while (l > 16) {
        const n = Math.floor(0.875 * l),
          t = G(n)()
        if (t > l) return acc + B(n - 1, l / t)()
        acc += n
        l -= t
      }
      for (let s = -Math.log1p(-x()), k = 0; s <= l; ++k) s -= Math.log1p(-x())
      return acc + k
    }
  }
  y.source = s
  return y
})(src)

export const uniform: qt.RandomUniform = (function s(x) {
  function y(min, max) {
    min = min == null ? 0 : +min
    max = max == null ? 1 : +max
    if (arguments.length === 1) (max = min), (min = 0)
    else max -= min
    return function () {
      return x() * max + min
    }
  }
  y.source = s
  return y
})(src)

export const weibull: qt.RandomWeibull = (function s(x) {
  function y(k, a, b) {
    let outer: Function
    if ((k = +k) === 0) {
      outer = x => -Math.log(x)
    } else {
      k = 1 / k
      outer = x => Math.pow(x, k)
    }
    a = a == null ? 0 : +a
    b = b == null ? 1 : +b
    return function () {
      return a + b * outer(-Math.log1p(-x()))
    }
  }
  y.source = s
  return y
})(src)
