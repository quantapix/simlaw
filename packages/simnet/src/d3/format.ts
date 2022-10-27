import type * as qt from "./types.js"
import * as qu from "./utils.js"

let locale
export let format: (x: string) => (n: number | { valueOf(): number }) => string
export let formatPrefix: (x: string, value: number) => (n: number | { valueOf(): number }) => string

formatDefaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
})

export function formatDefaultLocale(definition: qt.FormatLocaleDefinition): qt.FormatLocaleObject {
  locale = formatLocale(definition)
  format = locale.format
  formatPrefix = locale.formatPrefix
  return locale
}
export function exponent(x) {
  return (x = formatDecimalParts(Math.abs(x))), x ? x[1] : NaN
}
export function formatDecimal(x) {
  return Math.abs((x = Math.round(x))) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10)
}
export function formatDecimalParts(x, p) {
  let i
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null
  const coefficient = x.slice(0, i)
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)]
}
export function formatGroup(grouping, thousands) {
  return function (value, width) {
    let i = value.length,
      t = [],
      j = 0,
      g = grouping[0],
      length = 0
    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length)
      t.push(value.substring((i -= g), i + g))
      if ((length += g + 1) > width) break
      g = grouping[(j = (j + 1) % grouping.length)]
    }
    return t.reverse().join(thousands)
  }
}

export function formatNumerals(numerals) {
  return function (x) {
    return x.replace(/[0-9]/g, function (i) {
      return numerals[+i]
    })
  }
}

export let prefixExponent: number

export function formatPrefixAuto(x, p) {
  const d = formatDecimalParts(x, p)
  if (!d) return x + ""
  const coefficient = d[0],
    exponent = d[1],
    i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
    n = coefficient.length
  return i === n
    ? coefficient
    : i > n
    ? coefficient + new Array(i - n + 1).join("0")
    : i > 0
    ? coefficient.slice(0, i) + "." + coefficient.slice(i)
    : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0] // less than 1y!
}

export function formatRounded(x, p) {
  const d = formatDecimalParts(x, p)
  if (!d) return x + ""
  const coefficient = d[0],
    exponent = d[1]
  return exponent < 0
    ? "0." + new Array(-exponent).join("0") + coefficient
    : coefficient.length > exponent + 1
    ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
    : coefficient + new Array(exponent - coefficient.length + 2).join("0")
}

const re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i
export function formatSpecifier(x: string) {
  let match
  if (!(match = re.exec(x))) throw new Error("invalid format: " + x)
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10],
  })
}

export class FormatSpecifier implements qt.FormatSpecifier {
  fill: string
  align: ">" | "<" | "^" | "="
  sign: "-" | "+" | "(" | " "
  symbol: "$" | "#" | ""
  zero: boolean
  width: number | undefined
  comma: boolean
  precision: number | undefined
  trim: boolean
  type: "e" | "f" | "g" | "r" | "s" | "%" | "p" | "b" | "o" | "d" | "x" | "X" | "c" | "" | "n"

  constructor(specifier: qt.FormatSpecifierObject) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + ""
    this.align = specifier.align === undefined ? ">" : specifier.align + ""
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + ""
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + ""
    this.zero = !!specifier.zero
    this.width = specifier.width === undefined ? undefined : +specifier.width
    this.comma = !!specifier.comma
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision
    this.trim = !!specifier.trim
    this.type = specifier.type === undefined ? "" : specifier.type + ""
  }
  toString() {
    return (
      this.fill +
      this.align +
      this.sign +
      this.symbol +
      (this.zero ? "0" : "") +
      (this.width === undefined ? "" : Math.max(1, this.width | 0)) +
      (this.comma ? "," : "") +
      (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0)) +
      (this.trim ? "~" : "") +
      this.type
    )
  }
}
export function formatTrim(s) {
  out: for (let n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".":
        i0 = i1 = i
        break
      case "0":
        if (i0 === 0) i0 = i
        i1 = i
        break
      default:
        if (!+s[i]) break out
        if (i0 > 0) i0 = 0
        break
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s
}

export const formatTypes = {
  "%": (x, p) => (x * 100).toFixed(p),
  b: x => Math.round(x).toString(2),
  c: x => x + "",
  d: formatDecimal,
  e: (x, p) => x.toExponential(p),
  f: (x, p) => x.toFixed(p),
  g: (x, p) => x.toPrecision(p),
  o: x => Math.round(x).toString(8),
  p: (x, p) => formatRounded(x * 100, p),
  r: formatRounded,
  s: formatPrefixAuto,
  X: x => Math.round(x).toString(16).toUpperCase(),
  x: x => Math.round(x).toString(16),
}

const map = Array.prototype.map,
  prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"]
export function formatLocale(locale: qt.FormatLocaleDefinition): qt.FormatLocaleObject {
  const group =
      locale.grouping === undefined || locale.thousands === undefined
        ? qu.identity
        : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
    currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
    currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
    decimal = locale.decimal === undefined ? "." : locale.decimal + "",
    numerals = locale.numerals === undefined ? qu.identity : formatNumerals(map.call(locale.numerals, String)),
    percent = locale.percent === undefined ? "%" : locale.percent + "",
    minus = locale.minus === undefined ? "−" : locale.minus + "",
    nan = locale.nan === undefined ? "NaN" : locale.nan + ""
  function newFormat(specifier) {
    specifier = formatSpecifier(specifier)
    let fill = specifier.fill,
      align = specifier.align,
      sign = specifier.sign,
      symbol = specifier.symbol,
      zero = specifier.zero,
      width = specifier.width,
      comma = specifier.comma,
      precision = specifier.precision,
      trim = specifier.trim,
      type = specifier.type
    if (type === "n") (comma = true), (type = "g")
    else if (!formatTypes[type]) precision === undefined && (precision = 12), (trim = true), (type = "g")
    if (zero || (fill === "0" && align === "=")) (zero = true), (fill = "0"), (align = "=")
    const prefix =
        symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
      suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : ""
    const formatType = formatTypes[type],
      maybeSuffix = /[defgprs%]/.test(type)
    precision =
      precision === undefined
        ? 6
        : /[gprs]/.test(type)
        ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision))
    function format(value) {
      let valuePrefix = prefix,
        valueSuffix = suffix,
        i,
        n,
        c
      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix
        value = ""
      } else {
        value = +value
        let valueNegative = value < 0 || 1 / value < 0
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision)
        if (trim) value = formatTrim(value)
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false
        valuePrefix =
          (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix
        valueSuffix =
          (type === "s" ? prefixes[8 + prefixExponent / 3] : "") +
          valueSuffix +
          (valueNegative && sign === "(" ? ")" : "")
        if (maybeSuffix) {
          ;(i = -1), (n = value.length)
          while (++i < n) {
            if (((c = value.charCodeAt(i)), 48 > c || c > 57)) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix
              value = value.slice(0, i)
              break
            }
          }
        }
      }
      if (comma && !zero) value = group(value, Infinity)
      let length = valuePrefix.length + value.length + valueSuffix.length,
        padding = length < width ? new Array(width - length + 1).join(fill) : ""
      if (comma && zero)
        (value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity)), (padding = "")
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding
          break
        case "=":
          value = valuePrefix + padding + value + valueSuffix
          break
        case "^":
          value =
            padding.slice(0, (length = padding.length >> 1)) + valuePrefix + value + valueSuffix + padding.slice(length)
          break
        default:
          value = padding + valuePrefix + value + valueSuffix
          break
      }
      return numerals(value)
    }
    format.toString = function () {
      return specifier + ""
    }
    return format
  }
  function formatPrefix(specifier, value) {
    const f = newFormat(((specifier = formatSpecifier(specifier)), (specifier.type = "f"), specifier)),
      e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
      k = Math.pow(10, -e),
      prefix = prefixes[8 + e / 3]
    return function (value) {
      return f(k * value) + prefix
    }
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix,
  }
}

export function precisionFixed(step: number) {
  return Math.max(0, -exponent(Math.abs(step)))
}
export function precisionPrefix(step: number, value: number) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)))
}
export function precisionRound(step: number, max: number) {
  ;(step = Math.abs(step)), (max = Math.abs(max) - step)
  return Math.max(0, exponent(max) - exponent(step)) + 1
}
