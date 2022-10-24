import { bisector, tickStep } from "./array.js"

export const durationSecond = 1000
export const durationMinute = durationSecond * 60
export const durationHour = durationMinute * 60
export const durationDay = durationHour * 24
export const durationWeek = durationDay * 7
export const durationMonth = durationDay * 30
export const durationYear = durationDay * 365

export function interval(floori, offseti, count?, field?) {
  function y(x) {
    return floori((x = arguments.length === 0 ? new Date() : new Date(+x))), x
  }
  y.floor = function (x) {
    return floori((x = new Date(+x))), x
  }
  y.ceil = function (x) {
    return floori((x = new Date(x - 1))), offseti(x, 1), floori(x), x
  }
  y.round = function (x) {
    const d0 = y(x),
      d1 = y.ceil(x)
    return x - d0 < d1 - x ? d0 : d1
  }
  y.offset = function (x, step) {
    return offseti((x = new Date(+x)), step == null ? 1 : Math.floor(step)), x
  }
  y.range = function (start, stop, step) {
    let range = [],
      previous
    start = y.ceil(start)
    step = step == null ? 1 : Math.floor(step)
    if (!(start < stop) || !(step > 0)) return range
    do range.push((previous = new Date(+start))), offseti(start, step), floori(start)
    while (previous < start && start < stop)
    return range
  }
  y.filter = function (test) {
    return interval(
      function (x) {
        if (x >= x) while ((floori(x), !test(x))) x.setTime(x - 1)
      },
      function (x, step) {
        if (x >= x) {
          if (step < 0)
            while (++step <= 0) {
              while ((offseti(x, -1), !test(x))) {}
            }
          else
            while (--step >= 0) {
              while ((offseti(x, +1), !test(x))) {}
            }
        }
      }
    )
  }
  if (count) {
    y.count = function (start, end) {
      t0.setTime(+start), t1.setTime(+end)
      floori(t0), floori(t1)
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

export const day = interval(
  x => x.setHours(0, 0, 0, 0),
  (x, step) => x.setDate(x.getDate() + step),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  x => x.getDate() - 1
)
export const days = day.range

export const hour = interval(
  x => x.setTime(x - x.getMilliseconds() - x.getSeconds() * durationSecond - x.getMinutes() * durationMinute),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (end - start) / durationHour,
  x => x.getHours()
)
export const hours = hour.range

const t0 = new Date(),
  t1 = new Date()

export const millisecond = interval(
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
export const minute = interval(
  x => x.setTime(x - x.getMilliseconds() - x.getSeconds() * durationSecond),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (end - start) / durationMinute,
  x => x.getMinutes()
)
export const minutes = minute.range
export const month = interval(
  function (x) {
    x.setDate(1)
    x.setHours(0, 0, 0, 0)
  },
  (x, step) => x.setMonth(x.getMonth() + step),
  (start, end) => end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12,
  x => x.getMonth()
)
export const months = month.range
export const second = interval(
  x => x.setTime(x - x.getMilliseconds()),
  (x, step) => x.setTime(+x + step * durationSecond),
  (start, end) => (end - start) / durationSecond,
  x => x.getUTCSeconds()
)
export const seconds = second.range

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
  function ticks(start, stop, count) {
    const reverse = stop < start
    if (reverse) [start, stop] = [stop, start]
    const interval = count && typeof count.range === "function" ? count : tickInterval(start, stop, count)
    const ticks = interval ? interval.range(start, +stop + 1) : [] // inclusive stop
    return reverse ? ticks.reverse() : ticks
  }
  function tickInterval(start, stop, count) {
    const target = Math.abs(stop - start) / count
    const i = bisector(([, , step]) => step).right(tickIntervals, target)
    if (i === tickIntervals.length) return year.every(tickStep(start / durationYear, stop / durationYear, count))
    if (i === 0) return millisecond.every(Math.max(tickStep(start, stop, count), 1))
    const [t, step] = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i]
    return t.every(step)
  }
  return [ticks, tickInterval]
}

export const utcDay = interval(
  x => x.setUTCHours(0, 0, 0, 0),
  (x, step) => x.setUTCDate(x.getUTCDate() + step),
  (start, end) => (end - start) / durationDay,
  x => x.getUTCDate() - 1
)
export const utcDays = utcDay.range

export const utcHour = interval(
  x => x.setUTCMinutes(0, 0, 0),
  (x, step) => x.setTime(+x + step * durationHour),
  (start, end) => (end - start) / durationHour,
  x => x.getUTCHours()
)
export const utcHours = utcHour.range

export const utcMinute = interval(
  x => x.setUTCSeconds(0, 0),
  (x, step) => x.setTime(+x + step * durationMinute),
  (start, end) => (end - start) / durationMinute,
  x => x.getUTCMinutes()
)
export const utcMinutes = utcMinute.range
export const utcMonth = interval(
  function (x) {
    x.setUTCDate(1)
    x.setUTCHours(0, 0, 0, 0)
  },
  (x, step) => x.setUTCMonth(x.getUTCMonth() + step),
  (start, end) => end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12,
  x => x.getUTCMonth()
)
export const utcMonths = utcMonth.range

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
export const sunday = weekday(0)
export const week = sunday
export const monday = weekday(1)
export const tuesday = weekday(2)
export const wednesday = weekday(3)
export const thursday = weekday(4)
export const friday = weekday(5)
export const saturday = weekday(6)
export const sundays = sunday.range
export const mondays = monday.range
export const tuesdays = tuesday.range
export const wednesdays = wednesday.range
export const thursdays = thursday.range
export const fridays = friday.range
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
export const utcSunday = utcWeekday(0)
export const utcWeek = utcSunday
export const utcMonday = utcWeekday(1)
export const utcTuesday = utcWeekday(2)
export const utcWednesday = utcWeekday(3)
export const utcThursday = utcWeekday(4)
export const utcFriday = utcWeekday(5)
export const utcSaturday = utcWeekday(6)
export const utcSundays = utcSunday.range
export const utcMondays = utcMonday.range
export const utcTuesdays = utcTuesday.range
export const utcWednesdays = utcWednesday.range
export const utcThursdays = utcThursday.range
export const utcFridays = utcFriday.range
export const utcSaturdays = utcSaturday.range

export const year = interval(
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

export const utcYear = interval(
  function (x) {
    x.setUTCMonth(0, 1)
    x.setUTCHours(0, 0, 0, 0)
  },
  function (x, step) {
    x.setUTCFullYear(x.getUTCFullYear() + step)
  },
  function (start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear()
  },
  function (x) {
    return x.getUTCFullYear()
  }
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

export const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute)
export const [timeTicks, timeTickInterval] = ticker(year, month, week, day, hour, minute)
