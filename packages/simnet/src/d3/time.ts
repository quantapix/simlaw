import { bisector, tickStep } from "./sequence.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

const t0 = new Date(),
  t1 = new Date()

export function interval(floor: (x: Date) => void, offset: (x: Date, step: number) => void): qt.Time.Interval
export function interval(
  floor: (x: Date) => void,
  offset: (x: Date, step: number) => void,
  count: (start: Date, stop: Date) => number,
  field?: (x: Date) => number
): qt.Time.Countable
export function interval(floor: any, offset: any, count?: any, field?: any) {
  function f(x?: Date) {
    return floor((x = x === undefined ? new Date() : new Date(+x))), x
  }
  f.floor = (x: Date) => (floor((x = new Date(+x))), x)
  f.ceil = (x: Date) => (floor((x = new Date(+x - 1))), offset(x, 1), floor(x), x)
  f.round = (x: Date) => {
    const d0 = f(x),
      d1 = f.ceil(x)
    return +x - +d0 < +d1 - +x ? d0 : d1
  }
  f.offset = (x: Date, step: number) => (offset((x = new Date(+x)), step === null ? 1 : qu.floor(step)), x)
  f.range = (start: Date, stop: Date, step: number) => {
    const y: Date[] = []
    start = f.ceil(start)
    step = step === null ? 1 : qu.floor(step)
    if (!(start < stop) || !(step > 0)) return y
    let prev
    do y.push((prev = new Date(+start))), offset(start, step), floor(start)
    while (prev < start && start < stop)
    return y
  }
  f.filter = (p: any) =>
    interval(
      x => {
        if (x >= x) while ((floor(x), !p(x))) x.setTime(+x - 1)
      },
      (x, step) => {
        if (x >= x) {
          if (step < 0)
            while (++step <= 0) {
              while ((offset(x, -1), !p(x))) {}
            }
          else
            while (--step >= 0) {
              while ((offset(x, +1), !p(x))) {}
            }
        }
      }
    )
  if (count) {
    f.count = (start: Date, stop: Date) => {
      t0.setTime(+start), t1.setTime(+stop)
      floor(t0), floor(t1)
      return qu.floor(count(t0, t1))
    }
    f.every = (step: number) => {
      step = qu.floor(step)
      return !isFinite(step) || !(step > 0)
        ? null
        : !(step > 1)
        ? f
        : f.filter(field ? (x: Date) => field(x) % step === 0 : (x: Date) => f.count(new Date(0), x) % step === 0)
    }
  }
  return f
}

export const durationSecond = 1000
export const durationMinute = durationSecond * 60
export const durationHour = durationMinute * 60
export const durationDay = durationHour * 24
export const durationWeek = durationDay * 7
export const durationMonth = durationDay * 30
export const durationYear = durationDay * 365

export const millisecond: qt.Time.Countable = interval(
  () => {},
  (x, step) => x.setTime(+x + step),
  (start, end) => +end - +start
)
millisecond.every = k => {
  k = qu.floor(k)
  if (!isFinite(k) || !(k > 0)) return null
  if (!(k > 1)) return millisecond
  return interval(
    x => x.setTime(qu.floor(+x / k) * k),
    (x, step) => x.setTime(+x + step * k),
    (start, end) => (+end - +start) / k
  )
}
export const milliseconds = millisecond.range

export const second: qt.Time.Countable = interval(
  x => x.setTime(+x - x.getMilliseconds()),
  (x, step) => x.setTime(+x + step * durationSecond),
  (start, end) => (+end - +start) / durationSecond,
  x => x.getUTCSeconds()
)
export const seconds = second.range

export const minute: qt.Time.Countable = interval(
  x => x.setTime(+x - x.getMilliseconds() - x.getSeconds() * durationSecond),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (+end - +start) / durationMinute,
  x => x.getMinutes()
)
export const minutes = minute.range

export const utcMinute: qt.Time.Countable = interval(
  x => x.setUTCSeconds(0, 0),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (+end - +start) / durationMinute,
  x => x.getUTCMinutes()
)
export const utcMinutes = utcMinute.range

export const hour: qt.Time.Countable = interval(
  x => x.setTime(+x - x.getMilliseconds() - x.getSeconds() * durationSecond - x.getMinutes() * durationMinute),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (+end - +start) / durationHour,
  x => x.getHours()
)
export const hours = hour.range

export const utcHour: qt.Time.Countable = interval(
  x => x.setUTCMinutes(0, 0, 0),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (+end - +start) / durationHour,
  x => x.getUTCHours()
)
export const utcHours = utcHour.range

export const day: qt.Time.Countable = interval(
  x => x.setHours(0, 0, 0, 0),
  (x, step) => x.setDate(x.getDate() + step),
  (start, end) =>
    (+end - +start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  x => x.getDate() - 1
)
export const days = day.range

export const utcDay: qt.Time.Countable = interval(
  x => x.setUTCHours(0, 0, 0, 0),
  (x, step) => x.setUTCDate(x.getUTCDate() + step),
  (start, end) => (+end - +start) / durationDay,
  x => x.getUTCDate() - 1
)
export const utcDays = utcDay.range

export const month: qt.Time.Countable = interval(
  x => {
    x.setDate(1)
    x.setHours(0, 0, 0, 0)
  },
  (x, step) => x.setMonth(x.getMonth() + step),
  (start, end) => end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12,
  x => x.getMonth()
)
export const months = month.range

export const utcMonth: qt.Time.Countable = interval(
  x => {
    x.setUTCDate(1)
    x.setUTCHours(0, 0, 0, 0)
  },
  (x, step) => x.setUTCMonth(x.getUTCMonth() + step),
  (start, end) => end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12,
  x => x.getUTCMonth()
)
export const utcMonths = utcMonth.range

export const year: qt.Time.Countable = interval(
  x => {
    x.setMonth(0, 1)
    x.setHours(0, 0, 0, 0)
  },
  (x, step) => x.setFullYear(x.getFullYear() + step),
  (start, end) => end.getFullYear() - start.getFullYear(),
  x => x.getFullYear()
)
year.every = k =>
  !isFinite((k = qu.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (x) {
          x.setFullYear(qu.floor(x.getFullYear() / k) * k)
          x.setMonth(0, 1)
          x.setHours(0, 0, 0, 0)
        },
        (x, step) => x.setFullYear(x.getFullYear() + step * k)
      )
export const years = year.range

export const utcYear: qt.Time.Countable = interval(
  x => {
    x.setUTCMonth(0, 1)
    x.setUTCHours(0, 0, 0, 0)
  },
  (x, step) => x.setUTCFullYear(x.getUTCFullYear() + step),
  (start, end) => end.getUTCFullYear() - start.getUTCFullYear(),
  x => x.getUTCFullYear()
)
utcYear.every = k =>
  !isFinite((k = qu.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (x) {
          x.setUTCFullYear(qu.floor(x.getUTCFullYear() / k) * k)
          x.setUTCMonth(0, 1)
          x.setUTCHours(0, 0, 0, 0)
        },
        (x, step) => x.setUTCFullYear(x.getUTCFullYear() + step * k)
      )
export const utcYears = utcYear.range

function weekday(i: number) {
  return interval(
    x => {
      x.setDate(x.getDate() - ((x.getDay() + 7 - i) % 7))
      x.setHours(0, 0, 0, 0)
    },
    (x, step) => x.setDate(x.getDate() + step * 7),
    (start, end) =>
      (+end - +start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek
  )
}
export const sunday: qt.Time.Countable = weekday(0)
export const sundays = sunday.range
export const week: qt.Time.Countable = sunday
export const monday: qt.Time.Countable = weekday(1)
export const mondays = monday.range
export const tuesday: qt.Time.Countable = weekday(2)
export const tuesdays = tuesday.range
export const wednesday: qt.Time.Countable = weekday(3)
export const wednesdays = wednesday.range
export const thursday: qt.Time.Countable = weekday(4)
export const thursdays = thursday.range
export const friday: qt.Time.Countable = weekday(5)
export const fridays = friday.range
export const saturday: qt.Time.Countable = weekday(6)
export const saturdays = saturday.range

function utcWeekday(i: number) {
  return interval(
    x => {
      x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 7 - i) % 7))
      x.setUTCHours(0, 0, 0, 0)
    },
    (x, step) => x.setUTCDate(x.getUTCDate() + step * 7),
    (start, end) => (+end - +start) / durationWeek
  )
}
export const utcSunday: qt.Time.Countable = utcWeekday(0)
export const utcSundays = utcSunday.range
export const utcWeek: qt.Time.Countable = utcSunday
export const utcMonday: qt.Time.Countable = utcWeekday(1)
export const utcMondays = utcMonday.range
export const utcTuesday: qt.Time.Countable = utcWeekday(2)
export const utcTuesdays = utcTuesday.range
export const utcWednesday: qt.Time.Countable = utcWeekday(3)
export const utcWednesdays = utcWednesday.range
export const utcThursday: qt.Time.Countable = utcWeekday(4)
export const utcThursdays = utcThursday.range
export const utcFriday: qt.Time.Countable = utcWeekday(5)
export const utcFridays = utcFriday.range
export const utcSaturday: qt.Time.Countable = utcWeekday(6)
export const utcSaturdays = utcSaturday.range

function ticker(year, month, week, day, hour, minute) {
  const intervals = [
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
  function ticks(start: Date, stop: Date, count: any): Date[] {
    const reverse = stop < start
    if (reverse) [start, stop] = [stop, start]
    const x = count && typeof count.range === "function" ? count : tickInterval(start, stop, count)
    const y = x ? x.range(start, +stop + 1) : []
    return reverse ? y.reverse() : y
  }
  function interval(start: Date, stop: Date, count: number): qt.Time.Interval | null {
    const target = qu.abs(+stop - +start) / count
    const i = bisector(([, , step]) => step).right(intervals, target)
    if (i === intervals.length) return year.every(tickStep(+start / durationYear, +stop / durationYear, count))
    if (i === 0) return millisecond.every(qu.max(tickStep(+start, +stop, count), 1))
    const [t, step] = intervals[target / intervals[i - 1]![2] < intervals[i]![2] / target ? i - 1 : i]
    return t.every(step)
  }
  return [ticks, interval] as [typeof ticks, typeof interval]
}

export const [ticks, tickInterval] = ticker(year, month, week, day, hour, minute)
export const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute)

export let timeFormat: (x: string) => (x: Date) => string
export let timeParse: (x: string) => (x: string) => Date | null
export let utcFormat: (x: string) => (x: Date) => string
export let utcParse: (x: string) => (x: string) => Date | null

export const isoSpec = "%Y-%m-%dT%H:%M:%S.%LZ"
export const isoFormat = (x: Date) => x.toISOString()
export function isoParse(x: string) {
  const y = new Date(x)
  return isNaN(+y) ? null : y
}

let locale
export function formatDefault(x: qt.Time.Definition): qt.Time.Locale {
  locale = formatLocale(x)
  timeFormat = locale.format
  timeParse = locale.parse
  utcFormat = locale.utcFormat
  utcParse = locale.utcParse
  return locale
}

formatDefault({
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

export function formatLocale(x: qt.Time.Definition): qt.Time.Locale {
  const _dateTime = x.dateTime,
    _date = x.date,
    _time = x.time,
    _periods = x.periods,
    _weekdays = x.days,
    _shortWeekdays = x.shortDays,
    _months = x.months,
    _shortMonths = x.shortMonths
  const formatRe = (xs: string[]) => new RegExp("^(?:" + xs.map(x => x.replace(requoteRe, "\\$&")).join("|") + ")", "i")
  const formatLookup = (xs: string[]) => new Map(xs.map((x, i) => [x.toLowerCase(), i]))
  const periodRe = formatRe(_periods),
    periodLookup = formatLookup(_periods),
    weekdayRe = formatRe(_weekdays),
    weekdayLookup = formatLookup(_weekdays),
    shortWeekdayRe = formatRe(_shortWeekdays),
    shortWeekdayLookup = formatLookup(_shortWeekdays),
    monthRe = formatRe(_months),
    monthLookup = formatLookup(_months),
    shortMonthRe = formatRe(_shortMonths),
    shortMonthLookup = formatLookup(_shortMonths)
  function pad(x: number, fill: string, width: number) {
    const s = x < 0 ? "-" : "",
      y = (s ? -x : x) + "",
      n = y.length
    return s + (n < width ? new Array(width - n + 1).join(fill) + y : y)
  }
  const dISO = (d: Date) => {
    const y = d.getDay()
    return y >= 4 || y === 0 ? thursday(d) : thursday.ceil(d)
  }
  const formats = {
    a: (d: Date) => _shortWeekdays[d.getDay()],
    A: (d: Date) => _weekdays[d.getDay()],
    b: (d: Date) => _shortMonths[d.getMonth()],
    B: (d: Date) => _months[d.getMonth()],
    c: unknown,
    d: (d: Date, p: string) => pad(d.getDate(), p, 2),
    e: (d: Date, p: string) => pad(d.getDate(), p, 2),
    f: (d: Date, p: string) => pad(d.getMilliseconds(), p, 3) + "000",
    g: (d: Date, p: string) => ((d = dISO(d)), pad(d.getFullYear() % 100, p, 2)),
    G: (d: Date, p: string) => {
      const y = d.getDay()
      d = y >= 4 || y === 0 ? thursday(d) : thursday.ceil(d)
      return pad(d.getFullYear() % 10000, p, 4)
    },
    H: (d: Date, p: string) => pad(d.getHours(), p, 2),
    I: (d: Date, p: string) => pad(d.getHours() % 12 || 12, p, 2),
    j: (d: Date, p: string) => pad(1 + day.count(year(d), d), p, 3),
    L: (d: Date, p: string) => pad(d.getMilliseconds(), p, 3),
    m: (d: Date, p: string) => pad(d.getMonth() + 1, p, 2),
    M: (d: Date, p: string) => pad(d.getMinutes(), p, 2),
    p: (d: Date) => _periods[+(d.getHours() >= 12)],
    q: (d: Date) => 1 + ~~(d.getMonth() / 3),
    Q: (d: Date) => +d,
    s: (d: Date) => qu.floor(+d / 1000),
    S: (d: Date, p: string) => pad(d.getSeconds(), p, 2),
    u: (d: Date) => {
      const y = d.getDay()
      return y === 0 ? 7 : y
    },
    U: (d: Date, p: string) => pad(sunday.count(year(d) - 1, d), p, 2),
    V: (d: Date, p: string) => ((d = dISO(d)), pad(thursday.count(timeYear(d), d) + (year(d).getDay() === 4), p, 2)),
    w: (d: Date) => d.getDay(),
    W: (d: Date, p: string) => pad(monday.count(year(d) - 1, d), p, 2),
    x: null,
    X: null,
    y: (d: Date, p: string) => pad(d.getFullYear() % 100, p, 2),
    Y: (d: Date, p: string) => pad(d.getFullYear() % 10000, p, 4),
    Z: (d: Date) => {
      let y = d.getTimezoneOffset()
      return (y > 0 ? "-" : ((y *= -1), "+")) + pad((y / 60) | 0, "0", 2) + pad(y % 60, "0", 2)
    },
    "%": () => "%",
  }
  const UTCdISO = (d: Date) => {
    const y = d.getUTCDay()
    return y >= 4 || y === 0 ? utcThursday(d) : utcThursday.ceil(d)
  }
  const utcFormats = {
    a: (d: Date) => _shortWeekdays[d.getUTCDay()],
    A: (d: Date) => _weekdays[d.getUTCDay()],
    b: (d: Date) => _shortMonths[d.getUTCMonth()],
    B: (d: Date) => _months[d.getUTCMonth()],
    c: null,
    d: (d: Date, p: string) => pad(d.getUTCDate(), p, 2),
    e: (d: Date, p: string) => pad(d.getUTCDate(), p, 2),
    f: (d: Date, p: string) => pad(d.getUTCMilliseconds(), p, 3) + "000",
    g: (d: Date, p: string) => ((d = UTCdISO(d)), pad(d.getUTCFullYear() % 100, p, 2)),
    G: (d: Date, p: string) => {
      const y = d.getUTCDay()
      d = y >= 4 || y === 0 ? utcThursday(d) : utcThursday.ceil(d)
      return pad(d.getUTCFullYear() % 10000, p, 4)
    },
    H: (d: Date, p: string) => pad(d.getUTCHours(), p, 2),
    I: (d: Date, p: string) => pad(d.getUTCHours() % 12 || 12, p, 2),
    j: (d: Date, p: string) => pad(1 + utcDay.count(utcYear(d), d), p, 3),
    L: (d: Date, p: string) => pad(d.getUTCMilliseconds(), p, 3),
    m: (d: Date, p: string) => pad(d.getUTCMonth() + 1, p, 2),
    M: (d: Date, p: string) => pad(d.getUTCMinutes(), p, 2),
    p: (d: Date) => _periods[+(d.getUTCHours() >= 12)],
    q: (d: Date) => 1 + ~~(d.getUTCMonth() / 3),
    Q: (d: Date) => +d,
    s: (d: Date) => qu.floor(+d / 1000),
    S: (d: Date, p: string) => pad(d.getUTCSeconds(), p, 2),
    u: (d: Date) => {
      const y = d.getUTCDay()
      return y === 0 ? 7 : y
    },
    U: (d: Date, p: string) => pad(utcSunday.count(utcYear(d) - 1, d), p, 2),
    V: (d: Date, p: string) => (
      (d = UTCdISO(d)), pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2)
    ),
    w: (d: Date) => d.getUTCDay(),
    W: (d: Date, p: string) => pad(utcMonday.count(utcYear(d) - 1, d), p, 2),
    x: null,
    X: null,
    y: (d: Date, p: string) => pad(d.getUTCFullYear() % 100, p, 2),
    Y: (d: Date, p: string) => pad(d.getUTCFullYear() % 10000, p, 4),
    Z: () => "+0000",
    "%": () => "%",
  }
  const numberRe = /^\s*\d+/,
    percentRe = /^%/,
    requoteRe = /[\\^$*+?|[\]().{}]/g
  const parses = {
    a: (d, x, i) => {
      const y = shortWeekdayRe.exec(x.slice(i))
      return y ? ((d.w = shortWeekdayLookup.get(y[0].toLowerCase())), i + y[0].length) : -1
    },
    A: (d, x, i) => {
      const y = weekdayRe.exec(x.slice(i))
      return y ? ((d.w = weekdayLookup.get(y[0].toLowerCase())), i + y[0].length) : -1
    },
    b: (d, x, i) => {
      const y = shortMonthRe.exec(x.slice(i))
      return y ? ((d.m = shortMonthLookup.get(y[0].toLowerCase())), i + y[0].length) : -1
    },
    B: (d, x, i) => {
      const y = monthRe.exec(x.slice(i))
      return y ? ((d.m = monthLookup.get(y[0].toLowerCase())), i + y[0].length) : -1
    },
    c: (d, x, i) => parseSpec(d, _dateTime, x, i),
    d: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.d = +y[0]), i + y[0].length) : -1
    },
    e: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.d = +y[0]), i + y[0].length) : -1
    },
    f: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 6))
      return y ? ((d.L = qu.floor(y[0] / 1000)), i + y[0].length) : -1
    },
    g: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.y = +y[0] + (+y[0] > 68 ? 1900 : 2000)), i + y[0].length) : -1
    },
    G: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 4))
      return y ? ((d.y = +y[0]), i + y[0].length) : -1
    },
    H: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.H = +y[0]), i + y[0].length) : -1
    },
    I: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.H = +y[0]), i + y[0].length) : -1
    },
    j: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 3))
      return y ? ((d.m = 0), (d.d = +y[0]), i + y[0].length) : -1
    },
    L: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 3))
      return y ? ((d.L = +y[0]), i + y[0].length) : -1
    },
    m: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.m = y[0] - 1), i + y[0].length) : -1
    },
    M: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.M = +y[0]), i + y[0].length) : -1
    },
    p: (d, x, i) => {
      const y = periodRe.exec(x.slice(i))
      return y ? ((d.p = periodLookup.get(y[0].toLowerCase())), i + y[0].length) : -1
    },
    q: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 1))
      return y ? ((d.q = y[0] * 3 - 3), i + y[0].length) : -1
    },
    Q: (d, x, i) => {
      const y = numberRe.exec(x.slice(i))
      return y ? ((d.Q = +y[0]), i + y[0].length) : -1
    },
    s: (d, x, i) => {
      const y = numberRe.exec(x.slice(i))
      return y ? ((d.s = +y[0]), i + y[0].length) : -1
    },
    S: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.S = +y[0]), i + y[0].length) : -1
    },
    u: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 1))
      return y ? ((d.u = +y[0]), i + y[0].length) : -1
    },
    U: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.U = +y[0]), i + y[0].length) : -1
    },
    V: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.V = +y[0]), i + y[0].length) : -1
    },
    w: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 1))
      return y ? ((d.w = +y[0]), i + y[0].length) : -1
    },
    W: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.W = +y[0]), i + y[0].length) : -1
    },
    x: (d, x, i) => parseSpec(d, _date, x, i),
    X: (d, x, i) => parseSpec(d, _time, x, i),
    y: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 2))
      return y ? ((d.y = +y[0] + (+y[0] > 68 ? 1900 : 2000)), i + y[0].length) : -1
    },
    Y: (d, x, i) => {
      const y = numberRe.exec(x.slice(i, i + 4))
      return y ? ((d.y = +y[0]), i + y[0].length) : -1
    },
    Z: (d, x, i) => {
      const y = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(x.slice(i, i + 6))
      return y ? ((d.Z = y[1] ? 0 : -(y[2] + (y[3] || "00"))), i + y[0].length) : -1
    },
    "%": (d, x, i) => {
      const y = percentRe.exec(x.slice(i, i + 1))
      return y ? i + y[0].length : -1
    },
  }
  formats.x = newFormat(_date, formats)
  formats.X = newFormat(_time, formats)
  formats.c = newFormat(_dateTime, formats)
  utcFormats.x = newFormat(_date, utcFormats)
  utcFormats.X = newFormat(_time, utcFormats)
  utcFormats.c = newFormat(_dateTime, utcFormats)
  const pads = { "-": "", _: " ", "0": "0" }
  function newFormat(spec: string, formats) {
    return (x: any) => {
      const ys = [],
        n = spec.length
      let i = -1,
        j = 0,
        c,
        pad,
        format
      if (!(x instanceof Date)) x = new Date(+x)
      while (++i < n) {
        if (spec.charCodeAt(i) === 37) {
          ys.push(spec.slice(j, i))
          if ((pad = pads[(c = spec.charAt(++i))]) != null) c = spec.charAt(++i)
          else pad = c === "e" ? " " : "0"
          if ((format = formats[c])) c = format(x, pad)
          ys.push(c)
          j = i + 1
        }
      }
      ys.push(spec.slice(j, i))
      return ys.join("")
    }
  }
  function newParse(spec: string, Z) {
    function newDate(y, m, d) {
      return { y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0 }
    }
    function localDate(d) {
      if (0 <= d.y && d.y < 100) {
        const y = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L)
        y.setFullYear(d.y)
        return y
      }
      return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L)
    }
    function utcDate(d) {
      if (0 <= d.y && d.y < 100) {
        const y = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L))
        y.setUTCFullYear(d.y)
        return y
      }
      return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L))
    }
    return string => {
      const d = newDate(1900, undefined, 1),
        i = parseSpec(d, spec, (string += ""), 0)
      let week, day
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
  function parseSpec(d, spec, string, j) {
    const n = spec.length,
      m = string.length
    let i = 0,
      c,
      parse
    while (i < n) {
      if (j >= m) return -1
      c = spec.charCodeAt(i++)
      if (c === 37) {
        c = spec.charAt(i++)
        parse = parses[c in pads ? spec.charAt(i++) : c]
        if (!parse || (j = parse(d, string, j)) < 0) return -1
      } else if (c != string.charCodeAt(j++)) return -1
    }
    return j
  }
  return {
    format: x => {
      const y = newFormat((x += ""), formats)
      y.toString = () => x
      return y
    },
    parse: x => {
      const y = newParse((x += ""), false)
      y.toString = () => x
      return y
    },
    utcFormat: x => {
      const y = newFormat((x += ""), utcFormats)
      y.toString = () => x
      return y
    },
    utcParse: x => {
      const y = newParse((x += ""), true)
      y.toString = () => x
      return y
    },
  }
}
