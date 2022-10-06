import interval from "./interval.js"
import { durationDay, durationMinute } from "./duration.js"

var day = interval(
  date => date.setHours(0, 0, 0, 0),
  (date, step) => date.setDate(date.getDate() + step),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  date => date.getDate() - 1
)

export default day
export var days = day.range
export const durationSecond = 1000
export const durationMinute = durationSecond * 60
export const durationHour = durationMinute * 60
export const durationDay = durationHour * 24
export const durationWeek = durationDay * 7
export const durationMonth = durationDay * 30
export const durationYear = durationDay * 365
import interval from "./interval.js"
import { durationHour, durationMinute, durationSecond } from "./duration.js"

var hour = interval(
  function (date) {
    date.setTime(
      date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute
    )
  },
  function (date, step) {
    date.setTime(+date + step * durationHour)
  },
  function (start, end) {
    return (end - start) / durationHour
  },
  function (date) {
    return date.getHours()
  }
)

export default hour
export var hours = hour.range
export { default as timeInterval } from "./interval.js"

export {
  default as timeMillisecond,
  milliseconds as timeMilliseconds,
  default as utcMillisecond,
  milliseconds as utcMilliseconds,
} from "./millisecond.js"

export { default as timeSecond, seconds as timeSeconds, default as utcSecond, seconds as utcSeconds } from "./second.js"

export { default as timeMinute, minutes as timeMinutes } from "./minute.js"

export { default as timeHour, hours as timeHours } from "./hour.js"

export { default as timeDay, days as timeDays } from "./day.js"

export {
  sunday as timeWeek,
  sundays as timeWeeks,
  sunday as timeSunday,
  sundays as timeSundays,
  monday as timeMonday,
  mondays as timeMondays,
  tuesday as timeTuesday,
  tuesdays as timeTuesdays,
  wednesday as timeWednesday,
  wednesdays as timeWednesdays,
  thursday as timeThursday,
  thursdays as timeThursdays,
  friday as timeFriday,
  fridays as timeFridays,
  saturday as timeSaturday,
  saturdays as timeSaturdays,
} from "./week.js"

export { default as timeMonth, months as timeMonths } from "./month.js"

export { default as timeYear, years as timeYears } from "./year.js"

export { default as utcMinute, utcMinutes as utcMinutes } from "./utcMinute.js"

export { default as utcHour, utcHours as utcHours } from "./utcHour.js"

export { default as utcDay, utcDays as utcDays } from "./utcDay.js"

export {
  utcSunday as utcWeek,
  utcSundays as utcWeeks,
  utcSunday as utcSunday,
  utcSundays as utcSundays,
  utcMonday as utcMonday,
  utcMondays as utcMondays,
  utcTuesday as utcTuesday,
  utcTuesdays as utcTuesdays,
  utcWednesday as utcWednesday,
  utcWednesdays as utcWednesdays,
  utcThursday as utcThursday,
  utcThursdays as utcThursdays,
  utcFriday as utcFriday,
  utcFridays as utcFridays,
  utcSaturday as utcSaturday,
  utcSaturdays as utcSaturdays,
} from "./utcWeek.js"

export { default as utcMonth, utcMonths as utcMonths } from "./utcMonth.js"

export { default as utcYear, utcYears as utcYears } from "./utcYear.js"

export { utcTicks, utcTickInterval, timeTicks, timeTickInterval } from "./ticks.js"
var t0 = new Date(),
  t1 = new Date()

export function newInterval(floori, offseti, count, field) {
  function interval(date) {
    return floori((date = arguments.length === 0 ? new Date() : new Date(+date))), date
  }

  interval.floor = function (date) {
    return floori((date = new Date(+date))), date
  }

  interval.ceil = function (date) {
    return floori((date = new Date(date - 1))), offseti(date, 1), floori(date), date
  }

  interval.round = function (date) {
    var d0 = interval(date),
      d1 = interval.ceil(date)
    return date - d0 < d1 - date ? d0 : d1
  }

  interval.offset = function (date, step) {
    return offseti((date = new Date(+date)), step == null ? 1 : Math.floor(step)), date
  }

  interval.range = function (start, stop, step) {
    var range = [],
      previous
    start = interval.ceil(start)
    step = step == null ? 1 : Math.floor(step)
    if (!(start < stop) || !(step > 0)) return range // also handles Invalid Date
    do range.push((previous = new Date(+start))), offseti(start, step), floori(start)
    while (previous < start && start < stop)
    return range
  }

  interval.filter = function (test) {
    return newInterval(
      function (date) {
        if (date >= date) while ((floori(date), !test(date))) date.setTime(date - 1)
      },
      function (date, step) {
        if (date >= date) {
          if (step < 0)
            while (++step <= 0) {
              while ((offseti(date, -1), !test(date))) {} // eslint-disable-line no-empty
            }
          else
            while (--step >= 0) {
              while ((offseti(date, +1), !test(date))) {} // eslint-disable-line no-empty
            }
        }
      }
    )
  }

  if (count) {
    interval.count = function (start, end) {
      t0.setTime(+start), t1.setTime(+end)
      floori(t0), floori(t1)
      return Math.floor(count(t0, t1))
    }

    interval.every = function (step) {
      step = Math.floor(step)
      return !isFinite(step) || !(step > 0)
        ? null
        : !(step > 1)
        ? interval
        : interval.filter(
            field
              ? function (d) {
                  return field(d) % step === 0
                }
              : function (d) {
                  return interval.count(0, d) % step === 0
                }
          )
    }
  }

  return interval
}
import interval from "./interval.js"

var millisecond = interval(
  function () {},
  function (date, step) {
    date.setTime(+date + step)
  },
  function (start, end) {
    return end - start
  }
)

millisecond.every = function (k) {
  k = Math.floor(k)
  if (!isFinite(k) || !(k > 0)) return null
  if (!(k > 1)) return millisecond
  return interval(
    function (date) {
      date.setTime(Math.floor(date / k) * k)
    },
    function (date, step) {
      date.setTime(+date + step * k)
    },
    function (start, end) {
      return (end - start) / k
    }
  )
}

export default millisecond
export var milliseconds = millisecond.range
import interval from "./interval.js"
import { durationMinute, durationSecond } from "./duration.js"

var minute = interval(
  function (date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond)
  },
  function (date, step) {
    date.setTime(+date + step * durationMinute)
  },
  function (start, end) {
    return (end - start) / durationMinute
  },
  function (date) {
    return date.getMinutes()
  }
)

export default minute
export var minutes = minute.range
import interval from "./interval.js"

var month = interval(
  function (date) {
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
  },
  function (date, step) {
    date.setMonth(date.getMonth() + step)
  },
  function (start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12
  },
  function (date) {
    return date.getMonth()
  }
)

export default month
export var months = month.range
import interval from "./interval.js"
import { durationSecond } from "./duration.js"

var second = interval(
  function (date) {
    date.setTime(date - date.getMilliseconds())
  },
  function (date, step) {
    date.setTime(+date + step * durationSecond)
  },
  function (start, end) {
    return (end - start) / durationSecond
  },
  function (date) {
    return date.getUTCSeconds()
  }
)

export default second
export var seconds = second.range
import { bisector, tickStep } from "d3-array"
import {
  durationDay,
  durationHour,
  durationMinute,
  durationMonth,
  durationSecond,
  durationWeek,
  durationYear,
} from "./duration.js"
import millisecond from "./millisecond.js"
import second from "./second.js"
import minute from "./minute.js"
import hour from "./hour.js"
import day from "./day.js"
import { sunday as week } from "./week.js"
import month from "./month.js"
import year from "./year.js"
import utcMinute from "./utcMinute.js"
import utcHour from "./utcHour.js"
import utcDay from "./utcDay.js"
import { utcSunday as utcWeek } from "./utcWeek.js"
import utcMonth from "./utcMonth.js"
import utcYear from "./utcYear.js"

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

const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute)
const [timeTicks, timeTickInterval] = ticker(year, month, week, day, hour, minute)

export { utcTicks, utcTickInterval, timeTicks, timeTickInterval }
import interval from "./interval.js"
import { durationDay } from "./duration.js"

var utcDay = interval(
  function (date) {
    date.setUTCHours(0, 0, 0, 0)
  },
  function (date, step) {
    date.setUTCDate(date.getUTCDate() + step)
  },
  function (start, end) {
    return (end - start) / durationDay
  },
  function (date) {
    return date.getUTCDate() - 1
  }
)

export default utcDay
export var utcDays = utcDay.range
import interval from "./interval.js"
import { durationHour } from "./duration.js"

var utcHour = interval(
  function (date) {
    date.setUTCMinutes(0, 0, 0)
  },
  function (date, step) {
    date.setTime(+date + step * durationHour)
  },
  function (start, end) {
    return (end - start) / durationHour
  },
  function (date) {
    return date.getUTCHours()
  }
)

export default utcHour
export var utcHours = utcHour.range
import interval from "./interval.js"
import { durationMinute } from "./duration.js"

var utcMinute = interval(
  function (date) {
    date.setUTCSeconds(0, 0)
  },
  function (date, step) {
    date.setTime(+date + step * durationMinute)
  },
  function (start, end) {
    return (end - start) / durationMinute
  },
  function (date) {
    return date.getUTCMinutes()
  }
)

export default utcMinute
export var utcMinutes = utcMinute.range
import interval from "./interval.js"

var utcMonth = interval(
  function (date) {
    date.setUTCDate(1)
    date.setUTCHours(0, 0, 0, 0)
  },
  function (date, step) {
    date.setUTCMonth(date.getUTCMonth() + step)
  },
  function (start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12
  },
  function (date) {
    return date.getUTCMonth()
  }
)

export default utcMonth
export var utcMonths = utcMonth.range
import interval from "./interval.js"
import { durationWeek } from "./duration.js"

function utcWeekday(i) {
  return interval(
    function (date) {
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 7 - i) % 7))
      date.setUTCHours(0, 0, 0, 0)
    },
    function (date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7)
    },
    function (start, end) {
      return (end - start) / durationWeek
    }
  )
}

export var utcSunday = utcWeekday(0)
export var utcMonday = utcWeekday(1)
export var utcTuesday = utcWeekday(2)
export var utcWednesday = utcWeekday(3)
export var utcThursday = utcWeekday(4)
export var utcFriday = utcWeekday(5)
export var utcSaturday = utcWeekday(6)

export var utcSundays = utcSunday.range
export var utcMondays = utcMonday.range
export var utcTuesdays = utcTuesday.range
export var utcWednesdays = utcWednesday.range
export var utcThursdays = utcThursday.range
export var utcFridays = utcFriday.range
export var utcSaturdays = utcSaturday.range
import interval from "./interval.js"

var utcYear = interval(
  function (date) {
    date.setUTCMonth(0, 1)
    date.setUTCHours(0, 0, 0, 0)
  },
  function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step)
  },
  function (start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear()
  },
  function (date) {
    return date.getUTCFullYear()
  }
)

utcYear.every = function (k) {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (date) {
          date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k)
          date.setUTCMonth(0, 1)
          date.setUTCHours(0, 0, 0, 0)
        },
        function (date, step) {
          date.setUTCFullYear(date.getUTCFullYear() + step * k)
        }
      )
}

export default utcYear
export var utcYears = utcYear.range
import interval from "./interval.js"
import { durationMinute, durationWeek } from "./duration.js"

function weekday(i) {
  return interval(
    function (date) {
      date.setDate(date.getDate() - ((date.getDay() + 7 - i) % 7))
      date.setHours(0, 0, 0, 0)
    },
    function (date, step) {
      date.setDate(date.getDate() + step * 7)
    },
    function (start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek
    }
  )
}

export var sunday = weekday(0)
export var monday = weekday(1)
export var tuesday = weekday(2)
export var wednesday = weekday(3)
export var thursday = weekday(4)
export var friday = weekday(5)
export var saturday = weekday(6)

export var sundays = sunday.range
export var mondays = monday.range
export var tuesdays = tuesday.range
export var wednesdays = wednesday.range
export var thursdays = thursday.range
export var fridays = friday.range
export var saturdays = saturday.range
import interval from "./interval.js"

var year = interval(
  function (date) {
    date.setMonth(0, 1)
    date.setHours(0, 0, 0, 0)
  },
  function (date, step) {
    date.setFullYear(date.getFullYear() + step)
  },
  function (start, end) {
    return end.getFullYear() - start.getFullYear()
  },
  function (date) {
    return date.getFullYear()
  }
)

year.every = function (k) {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : interval(
        function (date) {
          date.setFullYear(Math.floor(date.getFullYear() / k) * k)
          date.setMonth(0, 1)
          date.setHours(0, 0, 0, 0)
        },
        function (date, step) {
          date.setFullYear(date.getFullYear() + step * k)
        }
      )
}

export default year
export var years = year.range
