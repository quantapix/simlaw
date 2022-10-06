import assert from "assert"

export function assertInDelta(actual, expected, delta) {
  assert(expected - delta <= actual && actual <= expected + delta, `${actual} should be within ${delta} of ${expected}`)
}
import { mean, range, variance } from "d3-array"
import { randomBates, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

it("randomBates(n) returns random numbers with a mean of one-half", () => {
  const r = randomBates.source(randomLcg(0.6351090615932817))
  assertInDelta(mean(range(10000).map(r(1))), 0.5, 0.05)
  assertInDelta(mean(range(10000).map(r(10))), 0.5, 0.05)
  assertInDelta(mean(range(10000).map(r(1.5))), 0.5, 0.05)
  assertInDelta(mean(range(10000).map(r(4.2))), 0.5, 0.05)
})

it("randomBates(n) returns random numbers with a variance of 1 / (12 * n)", () => {
  const r = randomBates.source(randomLcg(0.1284832084868286))
  assertInDelta(variance(range(10000).map(r(1))), 1 / 12, 0.05)
  assertInDelta(variance(range(10000).map(r(10))), 1 / 120, 0.05)
  assertInDelta(variance(range(10000).map(r(1.5))), 1 / 18, 0.05)
  assertInDelta(variance(range(10000).map(r(4.2))), 1 / 50.4, 0.05)
})

it("randomBates(n) returns random numbers with a skewness of 0", () => {
  const r = randomBates.source(randomLcg(0.051567609139606674))
  assertInDelta(skewness(range(10000).map(r(1))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(10))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(1.5))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(4.2))), 0, 0.05)
})

it("randomBates(n) returns random numbers with a kurtosis of -6 / (5 * n)", () => {
  const r = randomBates.source(randomLcg(0.696913354780724))
  assertInDelta(kurtosis(range(10000).map(r(1))), -6 / 5, 0.05)
  assertInDelta(kurtosis(range(10000).map(r(10))), -6 / 50, 0.1)
  assertInDelta(kurtosis(range(10000).map(r(1.5))), -6 / 7.5, 0.05)
  assertInDelta(kurtosis(range(10000).map(r(4.2))), -6 / 21, 0.05)
})

it("randomBates(0) is equivalent to randomUniform()", () => {
  const r = randomBates.source(randomLcg(0.7717596603725383))
  assertInDelta(mean(range(10000).map(r(0))), 0.5, 0.05)
  assertInDelta(variance(range(10000).map(r(0))), 1 / 12, 0.05)
  assertInDelta(skewness(range(10000).map(r(0))), 0, 0.05)
  assertInDelta(kurtosis(range(10000).map(r(0))), -6 / 5, 0.05)
})
import { mean, range, variance } from "d3-array"
import { randomBernoulli, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

function dmean(p) {
  return p
}

function dvariance(p) {
  return p * (1 - p)
}

function skew(p) {
  return (1 - 2 * p) / Math.sqrt(dvariance(p))
}

function kurt(p) {
  return (6 * Math.pow(p, 2) - 6 * p + 1) / dvariance(p)
}

it("randomBernoulli(p) returns random bernoulli distributed numbers with a mean of p", () => {
  const r = randomBernoulli.source(randomLcg(0.48444190806583465))
  assertInDelta(mean(range(10000).map(r(1))), dmean(1), dvariance(1))
  assertInDelta(mean(range(10000).map(r(0.5))), dmean(0.5), dvariance(0.5))
  assertInDelta(mean(range(10000).map(r(0.25))), dmean(0.25), dvariance(0.25))
  assertInDelta(mean(range(10000).map(r(0))), dmean(0), dvariance(0))
})

it("randomBernoulli(p) returns random bernoulli distributed numbers with a variance of p * (1 - p)", () => {
  const r = randomBernoulli.source(randomLcg(0.9781605192898934))
  assertInDelta(variance(range(10000).map(r(1))), dvariance(1), 0)
  assertInDelta(variance(range(10000).map(r(0.5))), dvariance(0.5), 0.05)
  assertInDelta(variance(range(10000).map(r(0.25))), dvariance(0.25), 0.05)
  assertInDelta(variance(range(10000).map(r(0))), dvariance(0), 0)
})

it("randomBernoulli(p) returns random bernoulli distributed numbers with a skewness of (1 - 2 * p) / sqrt(p * (1 - p)).", () => {
  const r = randomBernoulli.source(randomLcg(0.9776249148208429))
  assertInDelta(skewness(range(10000).map(r(0.5))), skew(0.5), 0.08)
  assertInDelta(skewness(range(10000).map(r(0.25))), skew(0.25), 0.05)
})

it("randomBernoulli(p) returns random bernoulli distributed numbers with a kurtosis excess of (6 * p^2 - 6 * p - 1) / (p * (1 - p)).", () => {
  const r = randomBernoulli.source(randomLcg(0.8260973119979638))
  assertInDelta(kurtosis(range(10000).map(r(0.05))), kurt(0.05), kurt(0.05) * 0.2)
  assertInDelta(kurtosis(range(10000).map(r(0.1))), kurt(0.1), kurt(0.1) * 0.2)
  assertInDelta(kurtosis(range(10000).map(r(0.15))), kurt(0.15), kurt(0.15) * 0.2)
  assertInDelta(kurtosis(range(50000).map(r(0.2))), kurt(0.2), kurt(0.2) * 0.4)
})
import { mean, range, variance } from "d3-array"
import { randomBeta, randomLcg } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

function dmean(alpha, beta) {
  return alpha / (alpha + beta)
}

function dvariance(alpha, beta) {
  return (alpha * beta) / Math.pow(alpha + beta, 2) / (alpha + beta + 1)
}

it("randomBeta(alpha, beta) returns random numbers with a mean of alpha / (alpha + beta)", () => {
  const r = randomBeta.source(randomLcg(0.8275880644751501))
  assertInDelta(mean(range(10000).map(r(1, 1))), dmean(1, 1), 0.05)
  assertInDelta(mean(range(10000).map(r(1, 2))), dmean(1, 2), 0.05)
  assertInDelta(mean(range(10000).map(r(2, 1))), dmean(2, 1), 0.05)
  assertInDelta(mean(range(10000).map(r(3, 4))), dmean(3, 4), 0.05)
  assertInDelta(mean(range(10000).map(r(0.5, 0.5))), dmean(0.5, 0.5), 0.05)
  assertInDelta(mean(range(10000).map(r(2.7, 0.3))), dmean(2.7, 0.3), 0.05)
})

it("randomBeta(alpha, beta) returns random numbers with a variance of (alpha * beta) / (alpha + beta)^2 / (alpha + beta + 1)", () => {
  const r = randomBeta.source(randomLcg(0.8272345925494458))
  assertInDelta(variance(range(10000).map(r(1, 1))), dvariance(1, 1), 0.05)
  assertInDelta(variance(range(10000).map(r(1, 2))), dvariance(1, 2), 0.05)
  assertInDelta(variance(range(10000).map(r(2, 1))), dvariance(2, 1), 0.05)
  assertInDelta(variance(range(10000).map(r(3, 4))), dvariance(3, 4), 0.05)
  assertInDelta(variance(range(10000).map(r(0.5, 0.5))), dvariance(0.5, 0.5), 0.05)
  assertInDelta(variance(range(10000).map(r(2.7, 0.3))), dvariance(2.7, 0.3), 0.05)
})
import { mean, range, variance } from "d3-array"
import { randomBinomial, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

function dmean(n, p) {
  return n * p
}

function dvariance(n, p) {
  return n * p * (1 - p)
}

function skew(n, p) {
  return (1 - 2 * p) / Math.sqrt(dvariance(n, p))
}

function kurt(n, p) {
  return (6 * Math.pow(p, 2) - 6 * p + 1) / dvariance(n, p)
}

it("randomBinomial(n, p) returns random binomial distributed numbers with a mean of n * p", () => {
  const r = randomBinomial.source(randomLcg(0.3994478770613372))
  assertInDelta(mean(range(10000).map(r(100, 1))), dmean(100, 1), dvariance(100, 1))
  assertInDelta(mean(range(10000).map(r(100, 0.5))), dmean(100, 0.5), dvariance(100, 0.5))
  assertInDelta(mean(range(10000).map(r(100, 0.25))), dmean(100, 0.25), dvariance(100, 0.25))
  assertInDelta(mean(range(10000).map(r(100, 0))), dmean(100, 0), dvariance(100, 0))
  assertInDelta(mean(range(10000).map(r(0, 0))), dmean(0, 0), dvariance(0, 0))
})

it("randomBinomial(n, p) returns random binomial distributed numbers with a variance of n * p * (1 - p)", () => {
  const r = randomBinomial.source(randomLcg(0.7214876234380256))
  assertInDelta(variance(range(10000).map(r(100, 1))), dvariance(100, 1), 0)
  assertInDelta(variance(range(10000).map(r(100, 0.5))), dvariance(100, 0.5), 0.5)
  assertInDelta(variance(range(10000).map(r(100, 0.25))), dvariance(100, 0.25), 1)
  assertInDelta(variance(range(10000).map(r(100, 0))), dvariance(100, 0), 0)
  assertInDelta(variance(range(10000).map(r(0, 0))), dvariance(0, 0), 0)
})

it("randomBinomial(n, p) returns random binomial distributed numbers with a skewness of (1 - 2 * p) / sqrt(n * p * (1 - p))", () => {
  const r = randomBinomial.source(randomLcg(0.0646181509291679))
  assertInDelta(skewness(range(10000).map(r(100, 0.05))), skew(100, 0.05), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.1))), skew(100, 0.1), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.15))), skew(100, 0.15), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.2))), skew(100, 0.2), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.25))), skew(100, 0.25), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.3))), skew(100, 0.3), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.35))), skew(100, 0.35), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.4))), skew(100, 0.4), 0.05)
  assertInDelta(skewness(range(10000).map(r(100, 0.45))), skew(100, 0.45), 0.05)
})

it("randomBinomial(n, p) returns random binomial distributed numbers with a kurtosis excess of (6 * p^2 - 6 * p - 1) / (n * p * (1 - p))", () => {
  const r = randomBinomial.source(randomLcg(0.6451552018202751))
  assertInDelta(kurtosis(range(10000).map(r(100, 0.05))), kurt(100, 0.05), 0.2)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.1))), kurt(100, 0.1), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.15))), kurt(100, 0.15), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.2))), kurt(100, 0.2), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.25))), kurt(100, 0.25), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.3))), kurt(100, 0.3), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.35))), kurt(100, 0.35), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.4))), kurt(100, 0.4), 0.1)
  assertInDelta(kurtosis(range(10000).map(r(100, 0.45))), kurt(100, 0.45), 0.05)
})
import { median, range } from "d3-array"
import { randomCauchy, randomLcg } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomCauchy(a, b) returns random numbers with a median of a", () => {
  const r = randomCauchy.source(randomLcg(0.42))
  assertInDelta(median(range(10000).map(r())), 0, 0.05)
  assertInDelta(median(range(10000).map(r(5))), 5, 0.05)
  assertInDelta(median(range(10000).map(r(0, 4))), 0, 0.1)
  assertInDelta(median(range(10000).map(r(1, 3))), 1, 0.1)
  assertInDelta(median(range(10000).map(r(3, 1))), 3, 0.05)
})
import { mean, range } from "d3-array"
import { randomExponential, randomLcg } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomExponential(lambda) returns random exponentially distributed numbers with a mean of 1/lambda.", () => {
  const r = randomExponential.source(randomLcg(0.42))
  const period = 20
  const lambda = 1 / period // average rate (e.g. 1 per 20 minutes)
  const times = range(10000).map(r(lambda))

  assertInDelta(mean(times), period, period * 0.05)

  range(10, 100, 10).forEach(function (elapsed) {
    const within = times.filter(t => t <= elapsed)
    const expected = 1 - Math.exp(-elapsed * lambda)
    assertInDelta(within.length / times.length, expected, expected * 0.02)
  })
})
import { deviation, mean, range, variance } from "d3-array"
import { randomGamma, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

it("randomGamma(k) returns random numbers with a mean of k", () => {
  const r = randomGamma.source(randomLcg(0.8177609532536807))
  assertInDelta(mean(range(10000).map(r(0.1))), 0.1, 0.01)
  assertInDelta(mean(range(10000).map(r(0.5))), 0.5, 0.05)
  assertInDelta(mean(range(10000).map(r(1))), 1, 0.05)
  assertInDelta(mean(range(10000).map(r(2))), 2, 0.05)
  assertInDelta(mean(range(10000).map(r(10))), 10, 0.05)
})

it("randomGamma(k) returns random numbers with a variance of k", () => {
  const r = randomGamma.source(randomLcg(0.6494198931625885))
  assertInDelta(variance(range(10000).map(r(0.1))), 0.1, 0.005)
  assertInDelta(variance(range(10000).map(r(0.5))), 0.5, 0.05)
  assertInDelta(variance(range(10000).map(r(1))), 1, 0.05)
  assertInDelta(variance(range(10000).map(r(2))), 2, 0.1)
  assertInDelta(variance(range(10000).map(r(10))), 10, 0.5)
})

it("randomGamma(k) returns random numbers with a skewness of 2 / sqrt(k)", () => {
  const r = randomGamma.source(randomLcg(0.02223371708142996))
  assertInDelta(skewness(range(10000).map(r(0.1))), Math.sqrt(40), 1)
  assertInDelta(skewness(range(10000).map(r(0.5))), Math.sqrt(8), 0.25)
  assertInDelta(skewness(range(10000).map(r(1))), 2, 0.1)
  assertInDelta(skewness(range(10000).map(r(2))), Math.sqrt(2), 0.1)
  assertInDelta(skewness(range(10000).map(r(10))), Math.sqrt(0.4), 0.05)
})

it("randomGamma(k) returns random numbers with an excess kurtosis of 6 / k", () => {
  const r = randomGamma.source(randomLcg(0.19568718910927974))
  assertInDelta(kurtosis(range(10000).map(r(0.1))), 60, 15)
  assertInDelta(kurtosis(range(10000).map(r(0.5))), 12, 3)
  assertInDelta(kurtosis(range(10000).map(r(1))), 6, 1.5)
  assertInDelta(kurtosis(range(10000).map(r(2))), 3, 1)
  assertInDelta(kurtosis(range(10000).map(r(10))), 0.6, 0.2)
})

it("randomGamma(k, theta) returns random numbers with a mean of k * theta and a variance of k * theta^2", () => {
  const r = randomGamma.source(randomLcg(0.9608725416165995))
  assertInDelta(mean(range(10000).map(r(1, 2))), 2, 0.05)
  assertInDelta(mean(range(10000).map(r(2, 4))), 8, 0.2)
  assertInDelta(deviation(range(10000).map(r(1, 2))), 2, 0.1)
  assertInDelta(deviation(range(10000).map(r(2, 4))), Math.sqrt(2) * 4, 0.1)
})
import { mean, range, variance } from "d3-array"
import { randomGeometric, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

function dmean(p) {
  return 1 / p
}

function dvariance(p) {
  return (1 - p) / Math.pow(p, 2)
}

function skew(p) {
  return (2 - p) / Math.sqrt(1 - p)
}

function kurt(p) {
  return (Math.pow(p, 2) - 6 * p + 6) / (1 - p)
}

it("randomGeometric(p) returns random geometrically distributed numbers with a mean of 1 / p.", () => {
  const r = randomGeometric.source(randomLcg(0.7687729138471455))
  assertInDelta(mean(range(10000).map(r(1))), dmean(1), dvariance(1))
  assertInDelta(mean(range(10000).map(r(0.5))), dmean(0.5), dvariance(0.5))
  assertInDelta(mean(range(10000).map(r(0.25))), dmean(0.25), dvariance(0.25))
  assertInDelta(mean(range(10000).map(r(0.125))), dmean(0.125), dvariance(0.125))
})

it("randomGeometric(p) returns random geometrically distributed numbers with a dvariance of (1 - p) / p^2.", () => {
  const r = randomGeometric.source(randomLcg(0.7194220774328326))
  assertInDelta(variance(range(10000).map(r(1))), dvariance(1), dvariance(1) * 0.05)
  assertInDelta(variance(range(10000).map(r(0.5))), dvariance(0.5), dvariance(0.5) * 0.05)
  assertInDelta(variance(range(10000).map(r(0.25))), dvariance(0.25), dvariance(0.25) * 0.05)
  assertInDelta(variance(range(10000).map(r(0.125))), dvariance(0.125), dvariance(0.125) * 0.05)
})

it("randomGeometric(p) returns random geometrically distributed numbers with a skewness of (2 - p) / sqrt(1 - p).", () => {
  const r = randomGeometric.source(randomLcg(0.016030992648006448))
  assertInDelta(skewness(range(10000).map(r(0.5))), skew(0.5), 0.05 * skew(0.5))
  assertInDelta(skewness(range(10000).map(r(0.25))), skew(0.25), 0.05 * skew(0.25))
  assertInDelta(skewness(range(10000).map(r(0.125))), skew(0.125), 0.1 * skew(0.125))
})

it("randomGeometric(p) returns random geometrically distributed numbers with a kurtosis excess of (p^2 - 6 * p + 6) / (1 - p).", () => {
  const r = randomGeometric.source(randomLcg(0.4039802168183795))
  assertInDelta(kurtosis(range(20000).map(r(0.5))), kurt(0.5), 0.2 * kurt(0.5))
  assertInDelta(kurtosis(range(20000).map(r(0.25))), kurt(0.25), 0.3 * kurt(0.25))
  assertInDelta(kurtosis(range(20000).map(r(0.125))), kurt(0.125), 0.3 * kurt(0.125))
})
import assert from "assert"
import { extent, mean, range } from "d3-array"
import { randomInt, randomLcg } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomInt(max) returns random integers with a mean of (max - 1) / 2", () => {
  const r = randomInt.source(randomLcg(0.7350864698209636))
  assertInDelta(mean(range(10000).map(r(3))), 1.0, 0.05)
  assertInDelta(mean(range(10000).map(r(21))), 10.0, 0.5)
})

it("randomInt(max) returns random integers in the range [0, max - 1]", () => {
  const r = randomInt.source(randomLcg(0.17809137433591848))
  assert.deepStrictEqual(extent(range(10000).map(r(3))), [0, 2])
  assert.deepStrictEqual(extent(range(10000).map(r(21))), [0, 20])
})

it("randomInt(min, max) returns random integers with a mean of (min + max - 1) / 2", () => {
  const r = randomInt.source(randomLcg(0.46394764422984647))
  assertInDelta(mean(range(10000).map(r(10, 43))), 26, 0.5)
})

it("randomInt(min, max) returns random integers in the range [min, max - 1]", () => {
  const r = randomInt.source(randomLcg(0.9598431138570096))
  assert.deepStrictEqual(extent(range(10000).map(r(10, 42))), [10, 41])
})
import { mean, range, variance } from "d3-array"
import { randomIrwinHall, randomLcg } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

it("randomIrwinHall(n) returns random numbers with a mean of n / 2", () => {
  const r = randomIrwinHall.source(randomLcg(0.028699383123896194))
  assertInDelta(mean(range(10000).map(r(1))), 1 / 2, 0.05)
  assertInDelta(mean(range(10000).map(r(10))), 10 / 2, 0.05)
  assertInDelta(mean(range(10000).map(r(1.5))), 1.5 / 2, 0.05)
  assertInDelta(mean(range(10000).map(r(4.2))), 4.2 / 2, 0.05)
})

it("randomIrwinHall(n) returns random numbers with a variance of n / 12", () => {
  const r = randomIrwinHall.source(randomLcg(0.1515471143624345))
  assertInDelta(variance(range(10000).map(r(1))), 1 / 12, 0.05)
  assertInDelta(variance(range(10000).map(r(10))), 10 / 12, 0.05)
  assertInDelta(variance(range(10000).map(r(1.5))), 1.5 / 12, 0.05)
  assertInDelta(variance(range(10000).map(r(4.2))), 4.2 / 12, 0.05)
})

it("randomIrwinHall(n) returns random numbers with a skewness of 0", () => {
  const r = randomIrwinHall.source(randomLcg(0.47334122849782845))
  assertInDelta(skewness(range(10000).map(r(1))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(10))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(1.5))), 0, 0.05)
  assertInDelta(skewness(range(10000).map(r(4.2))), 0, 0.05)
})

it("randomIrwinHall(n) returns random numbers with a kurtosis of -6 / (5 * n)", () => {
  const r = randomIrwinHall.source(randomLcg(0.8217913599574529))
  assertInDelta(kurtosis(range(10000).map(r(1))), -6 / 5, 0.1)
  assertInDelta(kurtosis(range(10000).map(r(10))), -6 / 50, 0.1)
  assertInDelta(kurtosis(range(10000).map(r(1.5))), -6 / 7.5, 0.05)
  assertInDelta(kurtosis(range(10000).map(r(4.2))), -6 / 21, 0.05)
})
import assert from "assert"
import { deviation, mean, min, range, rollup, variance } from "d3-array"
import { randomLcg } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("lcg is the expected deterministic PRNG", () => {
  const R1 = 0.6678668977692723
  const lcg1 = randomLcg(0)
  assertInDelta((lcg1(), lcg1(), lcg1(), lcg1()), R1, 1e-16)
  const lcg2 = randomLcg(0)
  assertInDelta((lcg2(), lcg2(), lcg2(), lcg2()), R1, 1e-16)
})

it("lcg is seeded", () => {
  const seed = 0.42
  const R42 = 0.6760216606780887
  const lcg = randomLcg(seed)
  assertInDelta((lcg(), lcg(), lcg(), lcg()), R42, 1e-16)
})

it("lcg is well-distributed", () => {
  const seed = 0.2 // 1…11 are ok
  const lcg = randomLcg(seed)
  const run = Float32Array.from({ length: 10000 }, lcg)
  assertInDelta(mean(run), 1 / 2, 1e-2)
  assertInDelta(deviation(run), Math.sqrt(1 / 12), 1e-2)
  const histogram = rollup(
    run,
    v => v.length,
    d => Math.floor(d * 10)
  )
  for (const h of histogram) assertInDelta(h[1], 1000, 120)
})

it("lcg with small fractional seeds is well-distributed", () => {
  const G = range(100).map(i => randomLcg(i / 100))
  const means = [],
    variances = []
  for (let i = 0; i < 10; i++) {
    const M = G.map(d => d())
    means.push(mean(M))
    variances.push(variance(M))
  }
  assertInDelta(mean(means), 0.5, 0.02)
  assert(min(variances) > 0.75 / 12)
})
import { deviation, mean, range } from "d3-array"
import { randomLcg, randomLogNormal } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomLogNormal() returns random numbers with a log-mean of zero", () => {
  const r = randomLogNormal.source(randomLcg(0.9575554996277458))
  assertInDelta(mean(range(10000).map(r()), Math.log), 0, 0.05)
})

it("randomLogNormal() returns random numbers with a log-standard deviation of one", () => {
  const r = randomLogNormal.source(randomLcg(0.7369869597887295))
  assertInDelta(deviation(range(10000).map(r()), Math.log), 1, 0.05)
})

it("randomLogNormal(mu) returns random numbers with the specified log-mean", () => {
  const r = randomLogNormal.source(randomLcg(0.2083455771760374))
  assertInDelta(mean(range(10000).map(r(42)), Math.log), 42, 0.05)
  assertInDelta(mean(range(10000).map(r(-2)), Math.log), -2, 0.05)
})

it("randomLogNormal(mu) returns random numbers with a log-standard deviation of 1", () => {
  const r = randomLogNormal.source(randomLcg(0.7805370705171648))
  assertInDelta(deviation(range(10000).map(r(42)), Math.log), 1, 0.05)
  assertInDelta(deviation(range(10000).map(r(-2)), Math.log), 1, 0.05)
})

it("randomLogNormal(mu, sigma) returns random numbers with the specified log-mean and log-standard deviation", () => {
  const r = randomLogNormal.source(randomLcg(0.5178163416754684))
  assertInDelta(mean(range(10000).map(r(42, 2)), Math.log), 42, 0.05)
  assertInDelta(mean(range(10000).map(r(-2, 2)), Math.log), -2, 0.05)
  assertInDelta(deviation(range(10000).map(r(42, 2)), Math.log), 2, 0.05)
  assertInDelta(deviation(range(10000).map(r(-2, 2)), Math.log), 2, 0.05)
})
import { mean, range, variance } from "d3-array"
import { randomLcg, randomLogistic } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

function dvariance(a, b) {
  return Math.pow(Math.PI * b, 2) / 3
}

it("randomLogistic(a, b) returns random numbers with a mean of a", () => {
  const r = randomLogistic.source(randomLcg(0.8792712826844997))
  assertInDelta(mean(range(10000).map(r())), 0, 0.05)
  assertInDelta(mean(range(10000).map(r(5))), 5, 0.05)
  assertInDelta(mean(range(10000).map(r(0, 4))), 0, 0.1)
  assertInDelta(mean(range(10000).map(r(1, 3))), 1, 0.1)
  assertInDelta(mean(range(10000).map(r(3, 1))), 3, 0.05)
})

it("randomLogistic(a, b) returns random numbers with a variance of (b * pi)^2 / 3", () => {
  const r = randomLogistic.source(randomLcg(0.5768515852192524))
  assertInDelta(variance(range(10000).map(r())), dvariance(0, 1), 0.2)
  assertInDelta(variance(range(10000).map(r(5))), dvariance(5, 1), 0.2)
  assertInDelta(variance(range(10000).map(r(0, 4))), dvariance(0, 4), 2)
  assertInDelta(variance(range(10000).map(r(1, 3))), dvariance(1, 3), 2)
  assertInDelta(variance(range(10000).map(r(3, 1))), dvariance(3, 1), 2)
})

it("randomLogistic(a, b) returns random numbers with a skewness of zero", () => {
  const r = randomLogistic.source(randomLcg(0.8835033777589203))
  assertInDelta(skewness(range(10000).map(r())), 0, 0.1)
  assertInDelta(skewness(range(10000).map(r(5))), 0, 0.1)
  assertInDelta(skewness(range(10000).map(r(0, 4))), 0, 0.1)
  assertInDelta(skewness(range(10000).map(r(1, 3))), 0, 0.1)
  assertInDelta(skewness(range(10000).map(r(3, 1))), 0, 0.1)
})

it("randomLogistic(a, b) returns random numbers with an excess kurtosis of 1.2", () => {
  const r = randomLogistic.source(randomLcg(0.8738996292947383))
  assertInDelta(kurtosis(range(10000).map(r())), 1.2, 0.6)
  assertInDelta(kurtosis(range(10000).map(r(5))), 1.2, 0.6)
  assertInDelta(kurtosis(range(10000).map(r(0, 4))), 1.2, 0.6)
  assertInDelta(kurtosis(range(10000).map(r(1, 3))), 1.2, 0.6)
  assertInDelta(kurtosis(range(10000).map(r(3, 1))), 1.2, 0.6)
})
import { deviation, mean, range } from "d3-array"
import { randomLcg, randomNormal } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomNormal() returns random numbers with a mean of zero", () => {
  const r = randomNormal.source(randomLcg(0.3193923539476107))
  assertInDelta(mean(range(10000).map(r())), 0, 0.05)
})

it("randomNormal() returns random numbers with a standard deviation of one", () => {
  const r = randomNormal.source(randomLcg(0.5618016004747401))
  assertInDelta(deviation(range(10000).map(r())), 1, 0.05)
})

it("randomNormal(mu) returns random numbers with the specified mean", () => {
  const r = randomNormal.source(randomLcg(0.22864660166790118))
  assertInDelta(mean(range(10000).map(r(42))), 42, 0.05)
  assertInDelta(mean(range(10000).map(r(-2))), -2, 0.05)
})

it("randomNormal(mu) returns random numbers with a standard deviation of 1", () => {
  const r = randomNormal.source(randomLcg(0.1274290504810609))
  assertInDelta(deviation(range(10000).map(r(42))), 1, 0.05)
  assertInDelta(deviation(range(10000).map(r(-2))), 1, 0.05)
})

it("randomNormal(mu, sigma) returns random numbers with the specified mean and standard deviation", () => {
  const r = randomNormal.source(randomLcg(0.49113635631389463))
  assertInDelta(mean(range(10000).map(r(42, 2))), 42, 0.05)
  assertInDelta(mean(range(10000).map(r(-2, 2))), -2, 0.05)
  assertInDelta(deviation(range(10000).map(r(42, 2))), 2, 0.05)
  assertInDelta(deviation(range(10000).map(r(-2, 2))), 2, 0.05)
})
import assert from "assert"
import { deviation, mean, range } from "d3-array"
import { randomLcg, randomPareto } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

function ddeviation(n) {
  return Math.sqrt(n / ((n - 1) * (n - 1) * (n - 2)))
}

it("randomPareto() returns randoms with specified mean", () => {
  const r = randomPareto.source(randomLcg(0.6165632948194271))
  assert.strictEqual(mean(range(10000).map(r(0))), Infinity)
  assert(mean(range(10000).map(r(1))) > 8)
  assertInDelta(mean(range(10000).map(r(3))), 1.5, 0.4)
  assertInDelta(mean(range(10000).map(r(5))), 1.25, 0.1)
  assertInDelta(mean(range(10000).map(r(11))), 1.1, 0.1)
})

it("randomPareto() returns randoms with specified deviation", () => {
  const r = randomPareto.source(randomLcg(0.5733127851951378))
  assert(isNaN(deviation(range(10000).map(r(0)))))
  assert(deviation(range(10000).map(r(1))) > 70)
  assertInDelta(deviation(range(10000).map(r(3))), ddeviation(3), 0.5)
  assertInDelta(deviation(range(10000).map(r(5))), ddeviation(5), 0.05)
  assertInDelta(deviation(range(10000).map(r(11))), ddeviation(11), 0.05)
})

it("randomPareto(3) returns randoms with mean of 1.5 and deviation of 0.9", () => {
  const r = randomPareto.source(randomLcg(0.9341538627900958))
  assertInDelta(deviation(range(10000).map(r(3))), 0.9, 0.2)
  assertInDelta(mean(range(10000).map(r(3))), 1.5, 0.05)
})
import { mean, range, variance } from "d3-array"
import { randomLcg, randomPoisson } from "../src/index.js"
import { skewness, kurtosis } from "./statistics.js"
import { assertInDelta } from "./asserts.js"

it("randomPoisson(lambda) returns random numbers with a mean of lambda", () => {
  const r = randomPoisson.source(randomLcg(0.48758044703454373))
  assertInDelta(mean(range(100000).map(r(0.001))), 0.001, 0.0005)
  assertInDelta(mean(range(10000).map(r(0.1))), 0.1, 0.01)
  assertInDelta(mean(range(10000).map(r(0.5))), 0.5, 0.05)
  assertInDelta(mean(range(10000).map(r(1))), 1, 0.05)
  assertInDelta(mean(range(10000).map(r(2))), 2, 0.1)
  assertInDelta(mean(range(10000).map(r(10))), 10, 0.5)
  assertInDelta(mean(range(10000).map(r(1000))), 1000, 20)
})

it("randomPoisson(lambda) returns random numbers with a variance of lambda", () => {
  const r = randomPoisson.source(randomLcg(0.4777559867161436))
  assertInDelta(variance(range(100000).map(r(0.001))), 0.001, 0.0005)
  assertInDelta(variance(range(10000).map(r(0.1))), 0.1, 0.01)
  assertInDelta(variance(range(10000).map(r(0.5))), 0.5, 0.05)
  assertInDelta(variance(range(10000).map(r(1))), 1, 0.05)
  assertInDelta(variance(range(10000).map(r(2))), 2, 0.1)
  assertInDelta(variance(range(10000).map(r(10))), 10, 0.5)
  assertInDelta(variance(range(10000).map(r(1000))), 1000, 20)
})

it("randomPoisson(lambda) returns random numbers with a skewness of 1 / sqrt(lambda)", () => {
  const r = randomPoisson.source(randomLcg(0.09357670133206075))
  assertInDelta(skewness(range(100000).map(r(0.001))), 31.6, 5)
  assertInDelta(skewness(range(10000).map(r(0.1))), 3.16, 0.2)
  assertInDelta(skewness(range(10000).map(r(0.5))), 1.414, 0.1)
  assertInDelta(skewness(range(10000).map(r(1))), 1, 0.1)
  assertInDelta(skewness(range(10000).map(r(2))), 0.707, 0.05)
  assertInDelta(skewness(range(10000).map(r(10))), 0.316, 0.05)
  assertInDelta(skewness(range(10000).map(r(1000))), 0.0316, 0.05)
})

it("randomPoisson(lambda) returns random numbers with a kurtosis excess of 1 / lambda", () => {
  const r = randomPoisson.source(randomLcg(0.3299530136090847))
  assertInDelta(kurtosis(range(100000).map(r(0.001))), 1000, 200)
  assertInDelta(kurtosis(range(10000).map(r(0.1))), 10, 2)
  assertInDelta(kurtosis(range(10000).map(r(0.5))), 2, 0.5)
  assertInDelta(kurtosis(range(10000).map(r(1))), 1, 0.5)
  assertInDelta(kurtosis(range(10000).map(r(2))), 0.5, 0.2)
  assertInDelta(kurtosis(range(10000).map(r(10))), 0.1, 0.1)
  assertInDelta(kurtosis(range(10000).map(r(1000))), 0.001, 0.1)
})
import { mean } from "d3-array"

export function kurtosis(numbers) {
  let m = mean(numbers),
    sum4 = 0,
    sum2 = 0,
    v,
    i = -1,
    n = numbers.length

  while (++i < n) {
    v = numbers[i] - m
    sum2 += v * v
    sum4 += v * v * v * v
  }

  return ((1 / n) * sum4) / Math.pow((1 / n) * sum2, 2) - 3
}

export function skewness(numbers) {
  let m = mean(numbers),
    sum3 = 0,
    sum2 = 0,
    v,
    i = -1,
    n = numbers.length

  while (++i < n) {
    v = numbers[i] - m
    sum2 += v * v
    sum3 += v * v * v
  }

  return ((1 / n) * sum3) / Math.pow((1 / (n - 1)) * sum2, 3 / 2)
}
import assert from "assert"
import { mean, min, range } from "d3-array"
import { randomLcg, randomUniform } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomUniform() returns random numbers with a mean of 0.5", () => {
  const r = randomUniform.source(randomLcg(0.5233099016390388))
  assertInDelta(mean(range(10000).map(r())), 0.5, 0.05)
})

it("randomUniform() returns random numbers within the range [0,1)", () => {
  const r = randomUniform.source(randomLcg(0.6458793845385908))
  assert(min(range(10000).map(r())) >= 0)
  assert(min(range(10000).map(r())) < 1)
})

it("randomUniform(max) returns random numbers with a mean of max / 2", () => {
  const r = randomUniform.source(randomLcg(0.678948531603278))
  assertInDelta(mean(range(10000).map(r(42))), 21, 0.5)
})

it("randomUniform(max) returns random numbers within the range [0,max)", () => {
  const r = randomUniform.source(randomLcg(0.48468185818988196))
  assert(min(range(10000).map(r(42))) >= 0)
  assert(min(range(10000).map(r(42))) < 42)
})

it("randomUniform(min, max) returns random numbers with a mean of (min + max) / 2", () => {
  const r = randomUniform.source(randomLcg(0.23751000425183233))
  assertInDelta(mean(range(10000).map(r(10, 42))), 26, 0.5)
})

it("randomUniform(min, max) returns random numbers within the range [min,max)", () => {
  const r = randomUniform.source(randomLcg(0.3607454145271254))
  assert(min(range(10000).map(r(10, 42))) >= 10)
  assert(min(range(10000).map(r(10, 42))) < 42)
})
import assert from "assert"
import { deviation, mean, range } from "d3-array"
import { randomLcg, randomWeibull } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("randomWeibull() returns random numbers with the specified mean", () => {
  const r = randomWeibull.source(randomLcg(0.28845828610535373))
  assertInDelta(mean(range(10000).map(r(9))), 0.947, 0.1)
  assertInDelta(mean(range(10000).map(r(3))), 0.893, 0.1)
  assertInDelta(mean(range(10000).map(r(1))), 1, 0.1)
  assertInDelta(mean(range(10000).map(r(0.3))), 9.26, 1)
  assertInDelta(mean(range(10000).map(r(0))), 0.577, 0.1)
  assertInDelta(mean(range(10000).map(r(-3))), 1.354, 0.1)
  assertInDelta(mean(range(10000).map(r(-9))), 1.078, 0.1)
  assertInDelta(mean(range(10000).map(r(4, 1, 2))), 2.813, 0.2)
  assertInDelta(mean(range(10000).map(r(-4, 1, 2))), 3.451, 0.2)
})

it("randomWeibull() returns random numbers with the specified deviation", () => {
  const r = randomWeibull.source(randomLcg(0.6675582430306972))
  assertInDelta(deviation(range(10000).map(r(9))), 0.126, 0.02)
  assertInDelta(deviation(range(10000).map(r(3))), 0.324, 0.06)
  assertInDelta(deviation(range(10000).map(r(1))), 1, 0.2)
  assert(deviation(range(10000).map(r(0.3))) > 30)
  assertInDelta(deviation(range(10000).map(r(0))), 1.282, 0.05)
  assertInDelta(deviation(range(10000).map(r(-3))), 0.919, 0.4)
  assertInDelta(deviation(range(10000).map(r(-9))), 0.169, 0.02)
  assertInDelta(deviation(range(10000).map(r(4, 1, 2))), 0.509, 0.1)
  assertInDelta(deviation(range(10000).map(r(-4, 1, 2))), 1.0408, 0.1)
})
