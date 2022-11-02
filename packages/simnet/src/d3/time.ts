import { bisector, tickStep } from "./utils_seq.js"
import type * as qt from "./types.js"

const t0 = new Date(),
  t1 = new Date()

export function interval(floor: (x: Date) => void, offset: (x: Date, step: number) => void): qt.TimeInterval
export function interval(
  floor: (x: Date) => void,
  offset: (x: Date, step: number) => void,
  count: (start: Date, end: Date) => number,
  field?: (x: Date) => number
): qt.CountableTimeInterval
export function interval(floor: Function, offset: Function, count?: Function, field?: Function) {
  function y(x) {
    return floor((x = arguments.length === 0 ? new Date() : new Date(+x))), x
  }
  y.floor = function (x) {
    return floor((x = new Date(+x))), x
  }
  y.ceil = function (x) {
    return floor((x = new Date(x - 1))), offset(x, 1), floor(x), x
  }
  y.round = function (x) {
    const d0 = y(x),
      d1 = y.ceil(x)
    return x - d0 < d1 - x ? d0 : d1
  }
  y.offset = function (x, step) {
    return offset((x = new Date(+x)), step == null ? 1 : Math.floor(step)), x
  }
  y.range = function (start, stop, step) {
    let range = [],
      previous
    start = y.ceil(start)
    step = step == null ? 1 : Math.floor(step)
    if (!(start < stop) || !(step > 0)) return range
    do range.push((previous = new Date(+start))), offset(start, step), floor(start)
    while (previous < start && start < stop)
    return range
  }
  y.filter = function (test) {
    return interval(
      function (x) {
        if (x >= x) while ((floor(x), !test(x))) x.setTime(x - 1)
      },
      function (x, step) {
        if (x >= x) {
          if (step < 0)
            while (++step <= 0) {
              while ((offset(x, -1), !test(x))) {}
            }
          else
            while (--step >= 0) {
              while ((offset(x, +1), !test(x))) {}
            }
        }
      }
    )
  }
  if (count) {
    y.count = function (start, end) {
      t0.setTime(+start), t1.setTime(+end)
      floor(t0), floor(t1)
      return Math.floor(count(t0, t1))
    }
    y.every = function (step) {
      step = Math.floor(step)
      return !isFinite(step) || !(step > 0)
        ? null
        : !(step > 1)
        ? y
        : y.filter(
            field
              ? function (d) {
                  return field(d) % step === 0
                }
              : function (d) {
                  return y.count(0, d) % step === 0
                }
          )
    }
  }
  return y
}

export const durationSecond = 1000
export const durationMinute = durationSecond * 60
export const durationHour = durationMinute * 60
export const durationDay = durationHour * 24
export const durationWeek = durationDay * 7
export const durationMonth = durationDay * 30
export const durationYear = durationDay * 365

export const millisecond: qt.CountableTimeInterval = interval(
  function () {},
  (x, step) => x.setTime(+x + step),
  (start, end) => end - start
)
millisecond.every = function (k) {
  k = Math.floor(k)
  if (!isFinite(k) || !(k > 0)) return null
  if (!(k > 1)) return millisecond
  return interval(
    x => x.setTime(Math.floor(x / k) * k),
    (x, step) => x.setTime(+x + step * k),
    (start, end) => (end - start) / k
  )
}
export const milliseconds = millisecond.range

export const second: qt.CountableTimeInterval = interval(
  x => x.setTime(x - x.getMilliseconds()),
  (x, step) => x.setTime(+x + step * durationSecond),
  (start, end) => (end - start) / durationSecond,
  x => x.getUTCSeconds()
)
export const seconds = second.range

export const minute: qt.CountableTimeInterval = interval(
  x => x.setTime(x - x.getMilliseconds() - x.getSeconds() * durationSecond),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (end - start) / durationMinute,
  x => x.getMinutes()
)
export const minutes = minute.range

export const utcMinute: qt.CountableTimeInterval = interval(
  x => x.setUTCSeconds(0, 0),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (end - start) / durationMinute,
  x => x.getUTCMinutes()
)
export const utcMinutes = utcMinute.range

export const hour: qt.CountableTimeInterval = interval(
  x => x.setTime(x - x.getMilliseconds() - x.getSeconds() * durationSecond - x.getMinutes() * durationMinute),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (end - start) / durationHour,
  x => x.getHours()
)
export const hours = hour.range

export const utcHour: qt.CountableTimeInterval = interval(
  x => x.setUTCMinutes(0, 0, 0),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (end - start) / durationHour,
  x => x.getUTCHours()
)
export const utcHours = utcHour.range

export const day: qt.CountableTimeInterval = interval(
  x => x.setHours(0, 0, 0, 0),
  (x, step) => x.setDate(x.getDate() + step),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  x => x.getDate() - 1
)
export const days = day.range

export const utcDay: qt.CountableTimeInterval = interval(
  x => x.setUTCHours(0, 0, 0, 0),
  (x, step) => x.setUTCDate(x.getUTCDate() + step),
  (start, end) => (end - start) / durationDay,
  x => x.getUTCDate() - 1
)
export const utcDays = utcDay.range

export const month: qt.CountableTimeInterval = interval(
  function (x) {
    x.setDate(1)
    x.setHours(0, 0, 0, 0)
  },
  (x, step) => x.setMonth(x.getMonth() + step),
  (start, end) => end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12,
  x => x.getMonth()
)
export const months = month.range

export const utcMonth: qt.CountableTimeInterval = interval(
  function (x) {
    x.setUTCDate(1)
    x.setUTCHours(0, 0, 0, 0)
  },
  (x, step) => x.setUTCMonth(x.getUTCMonth() + step),
  (start, end) => end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12,
  x => x.getUTCMonth()
)
export const utcMonths = utcMonth.range

export const year: qt.CountableTimeInterval = interval(
  function (x) {
    x.setMonth(0, 1)
    x.setHours(0, 0, 0, 0)
  },
  (x, step) => x.setFullYear(x.getFullYear() + step),
  (start, end) => end.getFullYear() - start.getFullYear(),
  x => x.getFullYear()
)
year.every = function (k) {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (x) {
          x.setFullYear(Math.floor(x.getFullYear() / k) * k)
          x.setMonth(0, 1)
          x.setHours(0, 0, 0, 0)
        },
        (x, step) => x.setFullYear(x.getFullYear() + step * k)
      )
}
export const years = year.range

export const utcYear: qt.CountableTimeInterval = interval(
  function (x) {
    x.setUTCMonth(0, 1)
    x.setUTCHours(0, 0, 0, 0)
  },
  (x, step) => x.setUTCFullYear(x.getUTCFullYear() + step),
  (start, end) => end.getUTCFullYear() - start.getUTCFullYear(),
  x => x.getUTCFullYear()
)
utcYear.every = function (k) {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (x) {
          x.setUTCFullYear(Math.floor(x.getUTCFullYear() / k) * k)
          x.setUTCMonth(0, 1)
          x.setUTCHours(0, 0, 0, 0)
        },
        (x, step) => x.setUTCFullYear(x.getUTCFullYear() + step * k)
      )
}
export const utcYears = utcYear.range

function weekday(i) {
  return interval(
    function (x) {
      x.setDate(x.getDate() - ((x.getDay() + 7 - i) % 7))
      x.setHours(0, 0, 0, 0)
    },
    (x, step) => x.setDate(x.getDate() + step * 7),
    (start, end) =>
      (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek
  )
}
export const sunday: qt.CountableTimeInterval = weekday(0)
export const sundays = sunday.range
export const week: qt.CountableTimeInterval = sunday
export const monday: qt.CountableTimeInterval = weekday(1)
export const mondays = monday.range
export const tuesday: qt.CountableTimeInterval = weekday(2)
export const tuesdays = tuesday.range
export const wednesday: qt.CountableTimeInterval = weekday(3)
export const wednesdays = wednesday.range
export const thursday: qt.CountableTimeInterval = weekday(4)
export const thursdays = thursday.range
export const friday: qt.CountableTimeInterval = weekday(5)
export const fridays = friday.range
export const saturday: qt.CountableTimeInterval = weekday(6)
export const saturdays = saturday.range

function utcWeekday(i) {
  return interval(
    function (x) {
      x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 7 - i) % 7))
      x.setUTCHours(0, 0, 0, 0)
    },
    (x, step) => x.setUTCDate(x.getUTCDate() + step * 7),
    (start, end) => (end - start) / durationWeek
  )
}
export const utcSunday: qt.CountableTimeInterval = utcWeekday(0)
export const utcSundays = utcSunday.range
export const utcWeek: qt.CountableTimeInterval = utcSunday
export const utcMonday: qt.CountableTimeInterval = utcWeekday(1)
export const utcMondays = utcMonday.range
export const utcTuesday: qt.CountableTimeInterval = utcWeekday(2)
export const utcTuesdays = utcTuesday.range
export const utcWednesday: qt.CountableTimeInterval = utcWeekday(3)
export const utcWednesdays = utcWednesday.range
export const utcThursday: qt.CountableTimeInterval = utcWeekday(4)
export const utcThursdays = utcThursday.range
export const utcFriday: qt.CountableTimeInterval = utcWeekday(5)
export const utcFridays = utcFriday.range
export const utcSaturday: qt.CountableTimeInterval = utcWeekday(6)
export const utcSaturdays = utcSaturday.range

function ticker(year, month, week, day, hour, minute) {
  const tickIntervals = [
    [second, 1, durationSecond],
    [second, 5, 5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute, 1, durationMinute],
    [minute, 5, 5 * durationMinute],
    [minute, 15, 15 * durationMinute],
    [minute, 30, 30 * durationMinute],
    [hour, 1, durationHour],
    [hour, 3, 3 * durationHour],
    [hour, 6, 6 * durationHour],
    [hour, 12, 12 * durationHour],
    [day, 1, durationDay],
    [day, 2, 2 * durationDay],
    [week, 1, durationWeek],
    [month, 1, durationMonth],
    [month, 3, 3 * durationMonth],
    [year, 1, durationYear],
  ]
  function ticks(start: Date, stop: Date, count: number): Date[] {
    const reverse = stop < start
    if (reverse) [start, stop] = [stop, start]
    const interval = count && typeof count.range === "function" ? count : tickInterval(start, stop, count)
    const ticks = interval ? interval.range(start, +stop + 1) : [] // inclusive stop
    return reverse ? ticks.reverse() : ticks
  }
  function interval(start: Date, stop: Date, count: number): qt.TimeInterval | null {
    const target = Math.abs(stop - start) / count
    const i = bisector(([, , step]) => step).right(tickIntervals, target)
    if (i === tickIntervals.length) return year.every(tickStep(start / durationYear, stop / durationYear, count))
    if (i === 0) return millisecond.every(Math.max(tickStep(start, stop, count), 1))
    const [t, step] = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i]
    return t.every(step)
  }
  return [ticks, interval] as [typeof ticks, typeof interval]
}

export const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute)
export const [timeTicks, timeTickInterval] = ticker(year, month, week, day, hour, minute)

let locale
export let timeFormat: (x: string) => (x: Date) => string
export let timeParse: (x: string) => (x: string) => Date | null
export let utcFormat: (x: string) => (x: Date) => string
export let utcParse: (x: string) => (x: string) => Date | null

export const isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ"
export const isoFormat = (x: Date) => x.toISOString()
export function isoParse(x: string) {
  const y = new Date(x)
  return isNaN(y) ? null : y
}

formatDefaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
})

export function formatDefaultLocale(definition: qt.TimeLocaleDefinition): qt.TimeLocaleObject {
  locale = formatLocale(definition)
  timeFormat = locale.format
  timeParse = locale.parse
  utcFormat = locale.utcFormat
  utcParse = locale.utcParse
  return locale
}

export function formatLocale(locale: qt.TimeLocaleDefinition): qt.TimeLocaleObject {
  const locale_dateTime = locale.dateTime,
    locale_date = locale.date,
    locale_time = locale.time,
    locale_periods = locale.periods,
    locale_weekdays = locale.days,
    locale_shortWeekdays = locale.shortDays,
    locale_months = locale.months,
    locale_shortMonths = locale.shortMonths
  const periodRe = formatRe(locale_periods),
    periodLookup = formatLookup(locale_periods),
    weekdayRe = formatRe(locale_weekdays),
    weekdayLookup = formatLookup(locale_weekdays),
    shortWeekdayRe = formatRe(locale_shortWeekdays),
    shortWeekdayLookup = formatLookup(locale_shortWeekdays),
    monthRe = formatRe(locale_months),
    monthLookup = formatLookup(locale_months),
    shortMonthRe = formatRe(locale_shortMonths),
    shortMonthLookup = formatLookup(locale_shortMonths)
  const formats = {
    a: formatShortWeekday,
    A: formatWeekday,
    b: formatShortMonth,
    B: formatMonth,
    c: null,
    d: formatDayOfMonth,
    e: formatDayOfMonth,
    f: formatMicroseconds,
    g: formatYearISO,
    G: formatFullYearISO,
    H: formatHour24,
    I: formatHour12,
    j: formatDayOfYear,
    L: formatMilliseconds,
    m: formatMonthNumber,
    M: formatMinutes,
    p: formatPeriod,
    q: formatQuarter,
    Q: formatUnixTimestamp,
    s: formatUnixTimestampSeconds,
    S: formatSeconds,
    u: formatWeekdayNumberMonday,
    U: formatWeekNumberSunday,
    V: formatWeekNumberISO,
    w: formatWeekdayNumberSunday,
    W: formatWeekNumberMonday,
    x: null,
    X: null,
    y: formatYear,
    Y: formatFullYear,
    Z: formatZone,
    "%": formatLiteralPercent,
  }
  const utcFormats = {
    a: formatUTCShortWeekday,
    A: formatUTCWeekday,
    b: formatUTCShortMonth,
    B: formatUTCMonth,
    c: null,
    d: formatUTCDayOfMonth,
    e: formatUTCDayOfMonth,
    f: formatUTCMicroseconds,
    g: formatUTCYearISO,
    G: formatUTCFullYearISO,
    H: formatUTCHour24,
    I: formatUTCHour12,
    j: formatUTCDayOfYear,
    L: formatUTCMilliseconds,
    m: formatUTCMonthNumber,
    M: formatUTCMinutes,
    p: formatUTCPeriod,
    q: formatUTCQuarter,
    Q: formatUnixTimestamp,
    s: formatUnixTimestampSeconds,
    S: formatUTCSeconds,
    u: formatUTCWeekdayNumberMonday,
    U: formatUTCWeekNumberSunday,
    V: formatUTCWeekNumberISO,
    w: formatUTCWeekdayNumberSunday,
    W: formatUTCWeekNumberMonday,
    x: null,
    X: null,
    y: formatUTCYear,
    Y: formatUTCFullYear,
    Z: formatUTCZone,
    "%": formatLiteralPercent,
  }
  const parses = {
    a: parseShortWeekday,
    A: parseWeekday,
    b: parseShortMonth,
    B: parseMonth,
    c: parseLocaleDateTime,
    d: parseDayOfMonth,
    e: parseDayOfMonth,
    f: parseMicroseconds,
    g: parseYear,
    G: parseFullYear,
    H: parseHour24,
    I: parseHour24,
    j: parseDayOfYear,
    L: parseMilliseconds,
    m: parseMonthNumber,
    M: parseMinutes,
    p: parsePeriod,
    q: parseQuarter,
    Q: parseUnixTimestamp,
    s: parseUnixTimestampSeconds,
    S: parseSeconds,
    u: parseWeekdayNumberMonday,
    U: parseWeekNumberSunday,
    V: parseWeekNumberISO,
    w: parseWeekdayNumberSunday,
    W: parseWeekNumberMonday,
    x: parseLocaleDate,
    X: parseLocaleTime,
    y: parseYear,
    Y: parseFullYear,
    Z: parseZone,
    "%": parseLiteralPercent,
  }
  formats.x = newFormat(locale_date, formats)
  formats.X = newFormat(locale_time, formats)
  formats.c = newFormat(locale_dateTime, formats)
  utcFormats.x = newFormat(locale_date, utcFormats)
  utcFormats.X = newFormat(locale_time, utcFormats)
  utcFormats.c = newFormat(locale_dateTime, utcFormats)
  function newFormat(specifier, formats) {
    return function (date) {
      const string = []
      let i = -1,
        j = 0,
        n = specifier.length,
        c,
        pad,
        format
      if (!(date instanceof Date)) date = new Date(+date)
      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i))
          if ((pad = pads[(c = specifier.charAt(++i))]) != null) c = specifier.charAt(++i)
          else pad = c === "e" ? " " : "0"
          if ((format = formats[c])) c = format(date, pad)
          string.push(c)
          j = i + 1
        }
      }
      string.push(specifier.slice(j, i))
      return string.join("")
    }
  }
  function newParse(specifier, Z) {
    return function (string) {
      let d = newDate(1900, undefined, 1),
        i = parseSpecifier(d, specifier, (string += ""), 0),
        week,
        day
      if (i != string.length) return null
      if ("Q" in d) return new Date(d.Q)
      if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0))
      if (Z && !("Z" in d)) d.Z = 0
      if ("p" in d) d.H = (d.H % 12) + d.p * 12
      if (d.m === undefined) d.m = "q" in d ? d.q : 0
      if ("V" in d) {
        if (d.V < 1 || d.V > 53) return null
        if (!("w" in d)) d.w = 1
        if ("Z" in d) {
          ;(week = utcDate(newDate(d.y, 0, 1))), (day = week.getUTCDay())
          week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week)
          week = utcDay.offset(week, (d.V - 1) * 7)
          d.y = week.getUTCFullYear()
          d.m = week.getUTCMonth()
          d.d = week.getUTCDate() + ((d.w + 6) % 7)
        } else {
          ;(week = localDate(newDate(d.y, 0, 1))), (day = week.getDay())
          week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week)
          week = timeDay.offset(week, (d.V - 1) * 7)
          d.y = week.getFullYear()
          d.m = week.getMonth()
          d.d = week.getDate() + ((d.w + 6) % 7)
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0
        day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay()
        d.m = 0
        d.d = "W" in d ? ((d.w + 6) % 7) + d.W * 7 - ((day + 5) % 7) : d.w + d.U * 7 - ((day + 6) % 7)
      }
      if ("Z" in d) {
        d.H += (d.Z / 100) | 0
        d.M += d.Z % 100
        return utcDate(d)
      }
      return localDate(d)
    }
  }
  function parseSpecifier(d, specifier, string, j) {
    let i = 0,
      n = specifier.length,
      m = string.length,
      c,
      parse
    while (i < n) {
      if (j >= m) return -1
      c = specifier.charCodeAt(i++)
      if (c === 37) {
        c = specifier.charAt(i++)
        parse = parses[c in pads ? specifier.charAt(i++) : c]
        if (!parse || (j = parse(d, string, j)) < 0) return -1
      } else if (c != string.charCodeAt(j++)) {
        return -1
      }
    }
    return j
  }
  function parsePeriod(d, string, i) {
    const n = periodRe.exec(string.slice(i))
    return n ? ((d.p = periodLookup.get(n[0].toLowerCase())), i + n[0].length) : -1
  }
  function parseShortWeekday(d, string, i) {
    const n = shortWeekdayRe.exec(string.slice(i))
    return n ? ((d.w = shortWeekdayLookup.get(n[0].toLowerCase())), i + n[0].length) : -1
  }
  function parseWeekday(d, string, i) {
    const n = weekdayRe.exec(string.slice(i))
    return n ? ((d.w = weekdayLookup.get(n[0].toLowerCase())), i + n[0].length) : -1
  }
  function parseShortMonth(d, string, i) {
    const n = shortMonthRe.exec(string.slice(i))
    return n ? ((d.m = shortMonthLookup.get(n[0].toLowerCase())), i + n[0].length) : -1
  }
  function parseMonth(d, string, i) {
    const n = monthRe.exec(string.slice(i))
    return n ? ((d.m = monthLookup.get(n[0].toLowerCase())), i + n[0].length) : -1
  }
  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i)
  }
  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i)
  }
  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i)
  }
  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()]
  }
  function formatWeekday(d) {
    return locale_weekdays[d.getDay()]
  }
  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()]
  }
  function formatMonth(d) {
    return locale_months[d.getMonth()]
  }
  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)]
  }
  function formatQuarter(d) {
    return 1 + ~~(d.getMonth() / 3)
  }
  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()]
  }
  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()]
  }
  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()]
  }
  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()]
  }
  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)]
  }
  function formatUTCQuarter(d) {
    return 1 + ~~(d.getUTCMonth() / 3)
  }
  return {
    format: function (specifier) {
      const f = newFormat((specifier += ""), formats)
      f.toString = function () {
        return specifier
      }
      return f
    },
    parse: function (specifier) {
      const p = newParse((specifier += ""), false)
      p.toString = function () {
        return specifier
      }
      return p
    },
    utcFormat: function (specifier) {
      const f = newFormat((specifier += ""), utcFormats)
      f.toString = function () {
        return specifier
      }
      return f
    },
    utcParse: function (specifier) {
      const p = newParse((specifier += ""), true)
      p.toString = function () {
        return specifier
      }
      return p
    },
  }
}

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    const date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L)
    date.setFullYear(d.y)
    return date
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L)
}
function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    const date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L))
    date.setUTCFullYear(d.y)
    return date
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L))
}
function newDate(y, m, d) {
  return { y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0 }
}

const pads = { "-": "", _: " ", "0": "0" },
  numberRe = /^\s*\d+/,
  percentRe = /^%/,
  requoteRe = /[\\^$*+?|[\]().{}]/g

function pad(value, fill, width) {
  const sign = value < 0 ? "-" : "",
    string = (sign ? -value : value) + "",
    length = string.length
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string)
}
function requote(s) {
  return s.replace(requoteRe, "\\$&")
}
function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i")
}
function formatLookup(names) {
  return new Map(names.map((name, i) => [name.toLowerCase(), i]))
}
function parseWeekdayNumberSunday(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 1))
  return n ? ((d.w = +n[0]), i + n[0].length) : -1
}
function parseWeekdayNumberMonday(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 1))
  return n ? ((d.u = +n[0]), i + n[0].length) : -1
}
function parseWeekNumberSunday(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.U = +n[0]), i + n[0].length) : -1
}
function parseWeekNumberISO(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.V = +n[0]), i + n[0].length) : -1
}
function parseWeekNumberMonday(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.W = +n[0]), i + n[0].length) : -1
}
function parseFullYear(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 4))
  return n ? ((d.y = +n[0]), i + n[0].length) : -1
}
function parseYear(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000)), i + n[0].length) : -1
}
function parseZone(d, string, i) {
  const n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6))
  return n ? ((d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00"))), i + n[0].length) : -1
}
function parseQuarter(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 1))
  return n ? ((d.q = n[0] * 3 - 3), i + n[0].length) : -1
}
function parseMonthNumber(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.m = n[0] - 1), i + n[0].length) : -1
}
function parseDayOfMonth(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.d = +n[0]), i + n[0].length) : -1
}
function parseDayOfYear(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 3))
  return n ? ((d.m = 0), (d.d = +n[0]), i + n[0].length) : -1
}
function parseHour24(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.H = +n[0]), i + n[0].length) : -1
}
function parseMinutes(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.M = +n[0]), i + n[0].length) : -1
}
function parseSeconds(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 2))
  return n ? ((d.S = +n[0]), i + n[0].length) : -1
}
function parseMilliseconds(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 3))
  return n ? ((d.L = +n[0]), i + n[0].length) : -1
}
function parseMicroseconds(d, string, i) {
  const n = numberRe.exec(string.slice(i, i + 6))
  return n ? ((d.L = Math.floor(n[0] / 1000)), i + n[0].length) : -1
}
function parseLiteralPercent(d, string, i) {
  const n = percentRe.exec(string.slice(i, i + 1))
  return n ? i + n[0].length : -1
}
function parseUnixTimestamp(d, string, i) {
  const n = numberRe.exec(string.slice(i))
  return n ? ((d.Q = +n[0]), i + n[0].length) : -1
}
function parseUnixTimestampSeconds(d, string, i) {
  const n = numberRe.exec(string.slice(i))
  return n ? ((d.s = +n[0]), i + n[0].length) : -1
}
function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2)
}
function formatHour24(d, p) {
  return pad(d.getHours(), p, 2)
}
function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2)
}
function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3)
}
function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3)
}
function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000"
}
function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2)
}
function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2)
}
function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2)
}
function formatWeekdayNumberMonday(d) {
  const day = d.getDay()
  return day === 0 ? 7 : day
}
function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d) - 1, d), p, 2)
}
function dISO(d) {
  const day = d.getDay()
  return day >= 4 || day === 0 ? thursday(d) : thursday.ceil(d)
}
function formatWeekNumberISO(d, p) {
  d = dISO(d)
  return pad(thursday.count(timeYear(d), d) + (year(d).getDay() === 4), p, 2)
}
function formatWeekdayNumberSunday(d) {
  return d.getDay()
}
function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d) - 1, d), p, 2)
}
function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2)
}
function formatYearISO(d, p) {
  d = dISO(d)
  return pad(d.getFullYear() % 100, p, 2)
}
function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4)
}
function formatFullYearISO(d, p) {
  const day = d.getDay()
  d = day >= 4 || day === 0 ? thursday(d) : thursday.ceil(d)
  return pad(d.getFullYear() % 10000, p, 4)
}
function formatZone(d) {
  let z = d.getTimezoneOffset()
  return (z > 0 ? "-" : ((z *= -1), "+")) + pad((z / 60) | 0, "0", 2) + pad(z % 60, "0", 2)
}
function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2)
}
function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2)
}
function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2)
}
function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3)
}
function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3)
}
function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000"
}
function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2)
}
function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2)
}
function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2)
}
function formatUTCWeekdayNumberMonday(d) {
  const dow = d.getUTCDay()
  return dow === 0 ? 7 : dow
}
function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d) - 1, d), p, 2)
}
function UTCdISO(d) {
  const day = d.getUTCDay()
  return day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d)
}
function formatUTCWeekNumberISO(d, p) {
  d = UTCdISO(d)
  return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2)
}
function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay()
}
function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d) - 1, d), p, 2)
}
function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2)
}
function formatUTCYearISO(d, p) {
  d = UTCdISO(d)
  return pad(d.getUTCFullYear() % 100, p, 2)
}
function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4)
}
function formatUTCFullYearISO(d, p) {
  const day = d.getUTCDay()
  d = day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d)
  return pad(d.getUTCFullYear() % 10000, p, 4)
}
function formatUTCZone() {
  return "+0000"
}
function formatLiteralPercent() {
  return "%"
}
function formatUnixTimestamp(d) {
  return +d
}
function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1000)
}
