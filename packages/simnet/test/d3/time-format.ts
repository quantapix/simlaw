export function local(year, month, day, hours, minutes, seconds, milliseconds) {
  if (year == null) year = 0
  if (month == null) month = 0
  if (day == null) day = 1
  if (hours == null) hours = 0
  if (minutes == null) minutes = 0
  if (seconds == null) seconds = 0
  if (milliseconds == null) milliseconds = 0
  if (0 <= year && year < 100) {
    const date = new Date(-1, month, day, hours, minutes, seconds, milliseconds)
    date.setFullYear(year)
    return date
  }
  return new Date(year, month, day, hours, minutes, seconds, milliseconds)
}

export function utc(year, month, day, hours, minutes, seconds, milliseconds) {
  if (year == null) year = 0
  if (month == null) month = 0
  if (day == null) day = 1
  if (hours == null) hours = 0
  if (minutes == null) minutes = 0
  if (seconds == null) seconds = 0
  if (milliseconds == null) milliseconds = 0
  if (0 <= year && year < 100) {
    const date = new Date(Date.UTC(-1, month, day, hours, minutes, seconds, milliseconds))
    date.setUTCFullYear(year)
    return date
  }
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds))
}
import assert from "assert"
import { readFileSync } from "fs"
import { timeFormat, timeFormatDefaultLocale, timeParse, utcFormat, utcParse } from "../src/index.js"

const enUs = JSON.parse(readFileSync("./locale/en-US.json"))
const frFr = JSON.parse(readFileSync("./locale/fr-FR.json"))

it("timeFormat(specifier) defaults to en-US", () => {
  assert.strictEqual(timeFormat("%c")(new Date(2000, 0, 1)), "1/1/2000, 12:00:00 AM")
})

it("timeParse(specifier) defaults to en-US", () => {
  assert.strictEqual(+timeParse("%c")("1/1/2000, 12:00:00 AM"), +new Date(2000, 0, 1))
})

it("utcFormat(specifier) defaults to en-US", () => {
  assert.strictEqual(utcFormat("%c")(new Date(Date.UTC(2000, 0, 1))), "1/1/2000, 12:00:00 AM")
})

it("utcParse(specifier) defaults to en-US", () => {
  assert.strictEqual(+utcParse("%c")("1/1/2000, 12:00:00 AM"), +new Date(Date.UTC(2000, 0, 1)))
})

it("timeFormatDefaultLocale(definition) returns the new default locale", () => {
  const locale = timeFormatDefaultLocale(frFr)
  try {
    assert.strictEqual(locale.format("%c")(new Date(2000, 0, 1)), "samedi  1 janvier 2000 à 00:00:00")
  } finally {
    timeFormatDefaultLocale(enUs)
  }
})

it("timeFormatDefaultLocale(definition) affects timeFormat", () => {
  const locale = timeFormatDefaultLocale(frFr)
  try {
    assert.strictEqual(timeFormat, locale.format)
    assert.strictEqual(timeFormat("%c")(new Date(2000, 0, 1)), "samedi  1 janvier 2000 à 00:00:00")
  } finally {
    timeFormatDefaultLocale(enUs)
  }
})

it("timeFormatDefaultLocale(definition) affects timeParse", () => {
  const locale = timeFormatDefaultLocale(frFr)
  try {
    assert.strictEqual(timeParse, locale.parse)
    assert.strictEqual(+timeParse("%c")("samedi  1 janvier 2000 à 00:00:00"), +new Date(2000, 0, 1))
  } finally {
    timeFormatDefaultLocale(enUs)
  }
})

it("timeFormatDefaultLocale(definition) affects utcFormat", () => {
  const locale = timeFormatDefaultLocale(frFr)
  try {
    assert.strictEqual(utcFormat, locale.utcFormat)
    assert.strictEqual(utcFormat("%c")(new Date(Date.UTC(2000, 0, 1))), "samedi  1 janvier 2000 à 00:00:00")
  } finally {
    timeFormatDefaultLocale(enUs)
  }
})

it("timeFormatDefaultLocale(definition) affects utcParse", () => {
  const locale = timeFormatDefaultLocale(frFr)
  try {
    assert.strictEqual(utcParse, locale.utcParse)
    assert.strictEqual(+utcParse("%c")("samedi  1 janvier 2000 à 00:00:00"), +new Date(Date.UTC(2000, 0, 1)))
  } finally {
    timeFormatDefaultLocale(enUs)
  }
})
import assert from "assert"
import { timeSecond, timeMinute, timeHour, timeDay, timeMonth, timeWeek, timeYear } from "d3-time"
import { timeFormat } from "../src/index.js"
import { local } from "./date.js"

const formatMillisecond = timeFormat(".%L"),
  formatSecond = timeFormat(":%S"),
  formatMinute = timeFormat("%I:%M"),
  formatHour = timeFormat("%I %p"),
  formatDay = timeFormat("%a %d"),
  formatWeek = timeFormat("%b %d"),
  formatMonth = timeFormat("%B"),
  formatYear = timeFormat("%Y")

function multi(d) {
  return (
    timeSecond(d) < d
      ? formatMillisecond
      : timeMinute(d) < d
      ? formatSecond
      : timeHour(d) < d
      ? formatMinute
      : timeDay(d) < d
      ? formatHour
      : timeMonth(d) < d
      ? timeWeek(d) < d
        ? formatDay
        : formatWeek
      : timeYear(d) < d
      ? formatMonth
      : formatYear
  )(d)
}

it("timeFormat(date) coerces the specified date to a Date", () => {
  const f = timeFormat("%c")
  assert.strictEqual(f(+local(1990, 0, 1)), "1/1/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 2)), "1/2/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 3)), "1/3/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 4)), "1/4/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 5)), "1/5/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 6)), "1/6/1990, 12:00:00 AM")
  assert.strictEqual(f(+local(1990, 0, 7)), "1/7/1990, 12:00:00 AM")
})

it('timeFormat("%a")(date) formats abbreviated weekdays', () => {
  const f = timeFormat("%a")
  assert.strictEqual(f(local(1990, 0, 1)), "Mon")
  assert.strictEqual(f(local(1990, 0, 2)), "Tue")
  assert.strictEqual(f(local(1990, 0, 3)), "Wed")
  assert.strictEqual(f(local(1990, 0, 4)), "Thu")
  assert.strictEqual(f(local(1990, 0, 5)), "Fri")
  assert.strictEqual(f(local(1990, 0, 6)), "Sat")
  assert.strictEqual(f(local(1990, 0, 7)), "Sun")
})

it('timeFormat("%A")(date) formats weekdays', () => {
  const f = timeFormat("%A")
  assert.strictEqual(f(local(1990, 0, 1)), "Monday")
  assert.strictEqual(f(local(1990, 0, 2)), "Tuesday")
  assert.strictEqual(f(local(1990, 0, 3)), "Wednesday")
  assert.strictEqual(f(local(1990, 0, 4)), "Thursday")
  assert.strictEqual(f(local(1990, 0, 5)), "Friday")
  assert.strictEqual(f(local(1990, 0, 6)), "Saturday")
  assert.strictEqual(f(local(1990, 0, 7)), "Sunday")
})

it('timeFormat("%b")(date) formats abbreviated months', () => {
  const f = timeFormat("%b")
  assert.strictEqual(f(local(1990, 0, 1)), "Jan")
  assert.strictEqual(f(local(1990, 1, 1)), "Feb")
  assert.strictEqual(f(local(1990, 2, 1)), "Mar")
  assert.strictEqual(f(local(1990, 3, 1)), "Apr")
  assert.strictEqual(f(local(1990, 4, 1)), "May")
  assert.strictEqual(f(local(1990, 5, 1)), "Jun")
  assert.strictEqual(f(local(1990, 6, 1)), "Jul")
  assert.strictEqual(f(local(1990, 7, 1)), "Aug")
  assert.strictEqual(f(local(1990, 8, 1)), "Sep")
  assert.strictEqual(f(local(1990, 9, 1)), "Oct")
  assert.strictEqual(f(local(1990, 10, 1)), "Nov")
  assert.strictEqual(f(local(1990, 11, 1)), "Dec")
})

it('timeFormat("%B")(date) formats months', () => {
  const f = timeFormat("%B")
  assert.strictEqual(f(local(1990, 0, 1)), "January")
  assert.strictEqual(f(local(1990, 1, 1)), "February")
  assert.strictEqual(f(local(1990, 2, 1)), "March")
  assert.strictEqual(f(local(1990, 3, 1)), "April")
  assert.strictEqual(f(local(1990, 4, 1)), "May")
  assert.strictEqual(f(local(1990, 5, 1)), "June")
  assert.strictEqual(f(local(1990, 6, 1)), "July")
  assert.strictEqual(f(local(1990, 7, 1)), "August")
  assert.strictEqual(f(local(1990, 8, 1)), "September")
  assert.strictEqual(f(local(1990, 9, 1)), "October")
  assert.strictEqual(f(local(1990, 10, 1)), "November")
  assert.strictEqual(f(local(1990, 11, 1)), "December")
})

it('timeFormat("%c")(date) formats localized dates and times', () => {
  const f = timeFormat("%c")
  assert.strictEqual(f(local(1990, 0, 1)), "1/1/1990, 12:00:00 AM")
})

it('timeFormat("%d")(date) formats zero-padded dates', () => {
  const f = timeFormat("%d")
  assert.strictEqual(f(local(1990, 0, 1)), "01")
})

it('timeFormat("%e")(date) formats space-padded dates', () => {
  const f = timeFormat("%e")
  assert.strictEqual(f(local(1990, 0, 1)), " 1")
})

it('timeFormat("%g")(date) formats zero-padded two-digit ISO 8601 years', () => {
  const f = timeFormat("%g")
  assert.strictEqual(f(local(2018, 11, 30, 0)), "18") // Sunday
  assert.strictEqual(f(local(2018, 11, 31, 0)), "19") // Monday
  assert.strictEqual(f(local(2019, 0, 1, 0)), "19")
})

it('timeFormat("%G")(date) formats zero-padded four-digit ISO 8601 years', () => {
  const f = timeFormat("%G")
  assert.strictEqual(f(local(2018, 11, 30, 0)), "2018") // Sunday
  assert.strictEqual(f(local(2018, 11, 31, 0)), "2019") // Monday
  assert.strictEqual(f(local(2019, 0, 1, 0)), "2019")
})

it('timeFormat("%H")(date) formats zero-padded hours (24)', () => {
  const f = timeFormat("%H")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "00")
  assert.strictEqual(f(local(1990, 0, 1, 13)), "13")
})

it('timeFormat("%I")(date) formats zero-padded hours (12)', () => {
  const f = timeFormat("%I")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "12")
  assert.strictEqual(f(local(1990, 0, 1, 13)), "01")
})

it('timeFormat("%j")(date) formats zero-padded day of year numbers', () => {
  const f = timeFormat("%j")
  assert.strictEqual(f(local(1990, 0, 1)), "001")
  assert.strictEqual(f(local(1990, 5, 1)), "152")
  assert.strictEqual(f(local(2010, 2, 13)), "072")
  assert.strictEqual(f(local(2010, 2, 14)), "073") // DST begins
  assert.strictEqual(f(local(2010, 2, 15)), "074")
  assert.strictEqual(f(local(2010, 10, 6)), "310")
  assert.strictEqual(f(local(2010, 10, 7)), "311") // DST ends
  assert.strictEqual(f(local(2010, 10, 8)), "312")
})

it('timeFormat("%m")(date) formats zero-padded months', () => {
  const f = timeFormat("%m")
  assert.strictEqual(f(local(1990, 0, 1)), "01")
  assert.strictEqual(f(local(1990, 9, 1)), "10")
})

it('timeFormat("%M")(date) formats zero-padded minutes', () => {
  const f = timeFormat("%M")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0)), "00")
  assert.strictEqual(f(local(1990, 0, 1, 0, 32)), "32")
})

it('timeFormat("%p")(date) formats AM or PM', () => {
  const f = timeFormat("%p")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "AM")
  assert.strictEqual(f(local(1990, 0, 1, 13)), "PM")
})

it('timeFormat("%q")(date) formats quarters', () => {
  const f = timeFormat("%q")
  assert.strictEqual(f(local(1990, 0, 1)), "1")
  assert.strictEqual(f(local(1990, 3, 1)), "2")
  assert.strictEqual(f(local(1990, 6, 1)), "3")
  assert.strictEqual(f(local(1990, 9, 1)), "4")
})

it('timeFormat("%S")(date) formats zero-padded seconds', () => {
  const f = timeFormat("%S")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0)), "00")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 32)), "32")
  const f2 = timeFormat("%0S")
  assert.strictEqual(f2(local(1990, 0, 1, 0, 0, 0)), "00")
  assert.strictEqual(f2(local(1990, 0, 1, 0, 0, 32)), "32")
})

it('timeFormat("%_S")(date) formats space-padded seconds', () => {
  const f = timeFormat("%_S")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0)), " 0")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 3)), " 3")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 32)), "32")
})

it('timeFormat("-S")(date) formats no-padded seconds', () => {
  const f = timeFormat("%-S")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0)), "0")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 3)), "3")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 32)), "32")
})

it('timeFormat("%L")(date) formats zero-padded milliseconds', () => {
  const f = timeFormat("%L")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0, 0)), "000")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0, 432)), "432")
})

it('timeFormat("%u")(date) formats week day numbers', () => {
  const f = timeFormat("%u")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "1")
  assert.strictEqual(f(local(1990, 0, 7, 0)), "7")
  assert.strictEqual(f(local(2010, 2, 13, 23)), "6")
})

it('timeFormat("%f")(date) formats zero-padded microseconds', () => {
  const f = timeFormat("%f")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0, 0)), "000000")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0, 432)), "432000")
})

it('timeFormat("%U")(date) formats zero-padded week numbers', () => {
  const f = timeFormat("%U")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "00")
  assert.strictEqual(f(local(1990, 5, 1, 0)), "21")
  assert.strictEqual(f(local(2010, 2, 13, 23)), "10")
  assert.strictEqual(f(local(2010, 2, 14, 0)), "11") // DST begins
  assert.strictEqual(f(local(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(local(2010, 10, 6, 23)), "44")
  assert.strictEqual(f(local(2010, 10, 7, 0)), "45") // DST ends
  assert.strictEqual(f(local(2010, 10, 8, 0)), "45")
  assert.strictEqual(f(local(2012, 0, 1, 0)), "01") // Sunday!
})

it('timeFormat("%W")(date) formats zero-padded week numbers', () => {
  const f = timeFormat("%W")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "01") // Monday!
  assert.strictEqual(f(local(1990, 5, 1, 0)), "22")
  assert.strictEqual(f(local(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(local(2010, 10, 8, 0)), "45")
})

it('timeFormat("%V")(date) formats zero-padded ISO 8601 week numbers', () => {
  const f = timeFormat("%V")
  assert.strictEqual(f(local(1990, 0, 1, 0)), "01")
  assert.strictEqual(f(local(1990, 5, 1, 0)), "22")
  assert.strictEqual(f(local(2010, 2, 13, 23)), "10")
  assert.strictEqual(f(local(2010, 2, 14, 0)), "10") // DST begins
  assert.strictEqual(f(local(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(local(2010, 10, 6, 23)), "44")
  assert.strictEqual(f(local(2010, 10, 7, 0)), "44") // DST ends
  assert.strictEqual(f(local(2010, 10, 8, 0)), "45")
  assert.strictEqual(f(local(2015, 11, 31, 0)), "53")
  assert.strictEqual(f(local(2016, 0, 1, 0)), "53")
})

it('timeFormat("%x")(date) formats localized dates', () => {
  const f = timeFormat("%x")
  assert.strictEqual(f(local(1990, 0, 1)), "1/1/1990")
  assert.strictEqual(f(local(2010, 5, 1)), "6/1/2010")
})

it('timeFormat("%X")(date) formats localized times', () => {
  const f = timeFormat("%X")
  assert.strictEqual(f(local(1990, 0, 1, 0, 0, 0)), "12:00:00 AM")
  assert.strictEqual(f(local(1990, 0, 1, 13, 34, 59)), "1:34:59 PM")
})

it('timeFormat("%y")(date) formats zero-padded two-digit years', () => {
  const f = timeFormat("%y")
  assert.strictEqual(f(local(+1990, 0, 1)), "90")
  assert.strictEqual(f(local(+2002, 0, 1)), "02")
  assert.strictEqual(f(local(-2, 0, 1)), "-02")
})

it('timeFormat("%Y")(date) formats zero-padded four-digit years', () => {
  const f = timeFormat("%Y")
  assert.strictEqual(f(local(123, 0, 1)), "0123")
  assert.strictEqual(f(local(1990, 0, 1)), "1990")
  assert.strictEqual(f(local(2002, 0, 1)), "2002")
  assert.strictEqual(f(local(10002, 0, 1)), "0002")
  assert.strictEqual(f(local(-2, 0, 1)), "-0002")
})

it('timeFormat("%Z")(date) formats time zones', () => {
  const f = timeFormat("%Z")
  assert.strictEqual(f(local(1990, 0, 1)), "-0800")
})

it('timeFormat("%%")(date) formats literal percent signs', () => {
  const f = timeFormat("%%")
  assert.strictEqual(f(local(1990, 0, 1)), "%")
})

it("timeFormat(…) can be used to create a conditional multi-format", () => {
  assert.strictEqual(multi(local(1990, 0, 1, 0, 0, 0, 12)), ".012")
  assert.strictEqual(multi(local(1990, 0, 1, 0, 0, 1, 0)), ":01")
  assert.strictEqual(multi(local(1990, 0, 1, 0, 1, 0, 0)), "12:01")
  assert.strictEqual(multi(local(1990, 0, 1, 1, 0, 0, 0)), "01 AM")
  assert.strictEqual(multi(local(1990, 0, 2, 0, 0, 0, 0)), "Tue 02")
  assert.strictEqual(multi(local(1990, 1, 1, 0, 0, 0, 0)), "February")
  assert.strictEqual(multi(local(1990, 0, 1, 0, 0, 0, 0)), "1990")
})
import assert from "assert"
import { isoFormat } from "../src/index.js"
import { utc } from "./date.js"

it("isoFormat(date) returns an ISO 8601 UTC string", () => {
  assert.strictEqual(isoFormat(utc(1990, 0, 1, 0, 0, 0)), "1990-01-01T00:00:00.000Z")
  assert.strictEqual(isoFormat(utc(2011, 11, 31, 23, 59, 59)), "2011-12-31T23:59:59.000Z")
})
import assert from "assert"
import { isoParse } from "../src/index.js"
import { utc } from "./date.js"

it("isoParse as ISO 8601", () => {
  assert.deepStrictEqual(isoParse("1990-01-01T00:00:00.000Z"), utc(1990, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(isoParse("2011-12-31T23:59:59.000Z"), utc(2011, 11, 31, 23, 59, 59))
  assert.strictEqual(isoParse("1990-01-01T00:00:00.000X"), null)
})
import assert from "assert"
import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { timeFormatLocale } from "../src/index.js"

it("locale data is valid", () => {
  for (const localePath of readdirSync("locale")) {
    if (!/\.json$/i.test(localePath)) continue
    const locale = JSON.parse(readFileSync(join("locale", localePath), "utf8"))
    assert.deepStrictEqual(Object.keys(locale).sort(), [
      "date",
      "dateTime",
      "days",
      "months",
      "periods",
      "shortDays",
      "shortMonths",
      "time",
    ])
    timeFormatLocale(locale)
  }
})
import assert from "assert"
import { readFileSync } from "fs"
import { timeFormatLocale, timeParse } from "../src/index.js"
import { local } from "./date.js"

const fiFi = JSON.parse(readFileSync("./locale/fi-FI.json"))

it("parse(string) coerces the specified string to a string", () => {
  const p = timeParse("%c")
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/1/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 1)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/2/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 2)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/3/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 3)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/4/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 4)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/5/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 5)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/6/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 6)
  )
  assert.deepStrictEqual(
    p({
      toString: function () {
        return "1/7/1990, 12:00:00 AM"
      },
    }),
    local(1990, 0, 7)
  )
})

it("timeParse(specifier) coerces the specified specifier to a string", () => {
  const p = timeParse({
    toString: function () {
      return "%c"
    },
  })
  assert.deepStrictEqual(p("1/1/1990, 12:00:00 AM"), local(1990, 0, 1))
})

it('timeParse("%a %m/%d/%Y")(date) parses abbreviated weekday and date', () => {
  const p = timeParse("%a %m/%d/%Y")
  assert.deepStrictEqual(p("Sun 01/01/1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Wed 02/03/1991"), local(1991, 1, 3))
  assert.strictEqual(p("XXX 03/10/2010"), null)
})

it('timeParse("%A %m/%d/%Y")(date) parses weekday and date', () => {
  const p = timeParse("%A %m/%d/%Y")
  assert.deepStrictEqual(p("Sunday 01/01/1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Wednesday 02/03/1991"), local(1991, 1, 3))
  assert.strictEqual(p("Caturday 03/10/2010"), null)
})

it('timeParse("%U %Y")(date) parses week number (Sunday) and year', () => {
  const p = timeParse("%U %Y")
  assert.deepStrictEqual(p("00 1990"), local(1989, 11, 31))
  assert.deepStrictEqual(p("05 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("01 1995"), local(1995, 0, 1))
})

it('timeParse("%a %U %Y")(date) parses abbreviated weekday, week number (Sunday) and year', () => {
  const p = timeParse("%a %U %Y")
  assert.deepStrictEqual(p("Mon 00 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Sun 05 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("Sun 01 1995"), local(1995, 0, 1))
  assert.strictEqual(p("XXX 03 2010"), null)
})

it('timeParse("%A %U %Y")(date) parses weekday, week number (Sunday) and year', () => {
  const p = timeParse("%A %U %Y")
  assert.deepStrictEqual(p("Monday 00 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Sunday 05 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("Sunday 01 1995"), local(1995, 0, 1))
  assert.strictEqual(p("Caturday 03 2010"), null)
})

it('timeParse("%w %U %Y")(date) parses numeric weekday (Sunday), week number (Sunday) and year', () => {
  const p = timeParse("%w %U %Y")
  assert.deepStrictEqual(p("1 00 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("0 05 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("0 01 1995"), local(1995, 0, 1))
  assert.strictEqual(p("X 03 2010"), null)
})

it('timeParse("%w %V %G")(date) parses numeric weekday, week number (ISO) and corresponding year', () => {
  const p = timeParse("%w %V %G")
  assert.deepStrictEqual(p("1 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("0 05 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("4 53 1992"), local(1992, 11, 31))
  assert.deepStrictEqual(p("0 52 1994"), local(1995, 0, 1))
  assert.deepStrictEqual(p("0 01 1995"), local(1995, 0, 8))
  assert.deepStrictEqual(p("1 01 2018"), local(2018, 0, 1))
  assert.deepStrictEqual(p("1 01 2019"), local(2018, 11, 31))
})

it('timeParse("%w %V %g")(date) parses numeric weekday, week number (ISO) and corresponding two-digits year', () => {
  const p = timeParse("%w %V %g")
  assert.deepStrictEqual(p("1 01 90"), local(1990, 0, 1))
  assert.deepStrictEqual(p("0 05 91"), local(1991, 1, 3))
  assert.deepStrictEqual(p("4 53 92"), local(1992, 11, 31))
  assert.deepStrictEqual(p("0 52 94"), local(1995, 0, 1))
  assert.deepStrictEqual(p("0 01 95"), local(1995, 0, 8))
  assert.deepStrictEqual(p("1 01 18"), local(2018, 0, 1))
  assert.deepStrictEqual(p("1 01 19"), local(2018, 11, 31))
})

it('timeParse("%V %g")(date) parses week number (ISO) and corresponding two-digits year', () => {
  const p = timeParse("%V %g")
  assert.deepStrictEqual(p("01 90"), local(1990, 0, 1))
  assert.deepStrictEqual(p("05 91"), local(1991, 0, 28))
  assert.deepStrictEqual(p("53 92"), local(1992, 11, 28))
  assert.deepStrictEqual(p("52 94"), local(1994, 11, 26))
  assert.deepStrictEqual(p("01 95"), local(1995, 0, 2))
  assert.deepStrictEqual(p("01 18"), local(2018, 0, 1))
  assert.deepStrictEqual(p("01 19"), local(2018, 11, 31))
})

it('timeParse("%u %U %Y")(date) parses numeric weekday (Monday), week number (Monday) and year', () => {
  const p = timeParse("%u %W %Y")
  assert.deepStrictEqual(p("1 00 1990"), local(1989, 11, 25))
  assert.deepStrictEqual(p("1 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("1 05 1991"), local(1991, 1, 4))
  assert.deepStrictEqual(p("7 00 1995"), local(1995, 0, 1))
  assert.deepStrictEqual(p("1 01 1995"), local(1995, 0, 2))
  assert.strictEqual(p("X 03 2010"), null)
})

it('timeParse("%W %Y")(date) parses week number (Monday) and year', () => {
  const p = timeParse("%W %Y")
  assert.deepStrictEqual(p("01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("04 1991"), local(1991, 0, 28))
  assert.deepStrictEqual(p("00 1995"), local(1994, 11, 26))
})

it('timeParse("%a %W %Y")(date) parses abbreviated weekday, week number (Monday) and year', () => {
  const p = timeParse("%a %W %Y")
  assert.deepStrictEqual(p("Mon 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Sun 04 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("Sun 00 1995"), local(1995, 0, 1))
  assert.strictEqual(p("XXX 03 2010"), null)
})

it('timeParse("%A %W %Y")(date) parses weekday, week number (Monday) and year', () => {
  const p = timeParse("%A %W %Y")
  assert.deepStrictEqual(p("Monday 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("Sunday 04 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("Sunday 00 1995"), local(1995, 0, 1))
  assert.strictEqual(p("Caturday 03 2010"), null)
})

it('timeParse("%w %W %Y")(date) parses numeric weekday (Sunday), week number (Monday) and year', () => {
  const p = timeParse("%w %W %Y")
  assert.deepStrictEqual(p("1 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("0 04 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("0 00 1995"), local(1995, 0, 1))
  assert.strictEqual(p("X 03 2010"), null)
})

it('timeParse("%u %W %Y")(date) parses numeric weekday (Monday), week number (Monday) and year', () => {
  const p = timeParse("%u %W %Y")
  assert.deepStrictEqual(p("1 01 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("7 04 1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("7 00 1995"), local(1995, 0, 1))
  assert.strictEqual(p("X 03 2010"), null)
})

it('timeParse("%m/%d/%y")(date) parses month, date and two-digit year', () => {
  const p = timeParse("%m/%d/%y")
  assert.deepStrictEqual(p("02/03/69"), local(1969, 1, 3))
  assert.deepStrictEqual(p("01/01/90"), local(1990, 0, 1))
  assert.deepStrictEqual(p("02/03/91"), local(1991, 1, 3))
  assert.deepStrictEqual(p("02/03/68"), local(2068, 1, 3))
  assert.strictEqual(p("03/10/2010"), null)
})

it('timeParse("%x")(date) parses locale date', () => {
  const p = timeParse("%x")
  assert.deepStrictEqual(p("1/1/1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("2/3/1991"), local(1991, 1, 3))
  assert.deepStrictEqual(p("3/10/2010"), local(2010, 2, 10))
})

it('timeParse("%b %d, %Y")(date) parses abbreviated month, date and year', () => {
  const p = timeParse("%b %d, %Y")
  assert.deepStrictEqual(p("jan 01, 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("feb  2, 2010"), local(2010, 1, 2))
  assert.strictEqual(p("jan. 1, 1990"), null)
})

it('timeParse("%B %d, %Y")(date) parses month, date and year', () => {
  const p = timeParse("%B %d, %Y")
  assert.deepStrictEqual(p("january 01, 1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("February  2, 2010"), local(2010, 1, 2))
  assert.strictEqual(p("jan 1, 1990"), null)
})

it('timeParse("%j %m/%d/%Y")(date) parses day of year and date', () => {
  const p = timeParse("%j %m/%d/%Y")
  assert.deepStrictEqual(p("001 01/01/1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("034 02/03/1991"), local(1991, 1, 3))
  assert.strictEqual(p("2012 03/10/2010"), null)
})

it('timeParse("%c")(date) parses locale date and time', () => {
  const p = timeParse("%c")
  assert.deepStrictEqual(p("1/1/1990, 12:00:00 AM"), local(1990, 0, 1))
})

it('timeParse("%H:%M:%S")(date) parses twenty-four hour, minute and second', () => {
  const p = timeParse("%H:%M:%S")
  assert.deepStrictEqual(p("00:00:00"), local(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59"), local(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00"), local(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01"), local(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("23:59:59"), local(1900, 0, 1, 23, 59, 59))
})

it('timeParse("%X")(date) parses locale time', () => {
  const p = timeParse("%X")
  assert.deepStrictEqual(p("12:00:00 AM"), local(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59 AM"), local(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00 PM"), local(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01 PM"), local(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("11:59:59 PM"), local(1900, 0, 1, 23, 59, 59))
})

it('timeParse("%L")(date) parses milliseconds', () => {
  const p = timeParse("%L")
  assert.deepStrictEqual(p("432"), local(1900, 0, 1, 0, 0, 0, 432))
})

it('timeParse("%f")(date) parses microseconds', () => {
  const p = timeParse("%f")
  assert.deepStrictEqual(p("432000"), local(1900, 0, 1, 0, 0, 0, 432))
})

it('timeParse("%I:%M:%S %p")(date) parses twelve hour, minute and second', () => {
  const p = timeParse("%I:%M:%S %p")
  assert.deepStrictEqual(p("12:00:00 am"), local(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59 AM"), local(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00 pm"), local(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01 pm"), local(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("11:59:59 PM"), local(1900, 0, 1, 23, 59, 59))
})

it('timeParse("%I %p")(date) parses period in non-English locales', () => {
  const p = timeFormatLocale(fiFi).parse("%I:%M:%S %p")
  assert.deepStrictEqual(p("12:00:00 a.m."), local(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59 A.M."), local(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00 p.m."), local(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01 p.m."), local(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("11:59:59 P.M."), local(1900, 0, 1, 23, 59, 59))
})

it('timeParse("%Y %q")(date) parses quarters', () => {
  const p = timeParse("%Y %q")
  assert.deepStrictEqual(p("1990 1"), local(1990, 0, 1))
  assert.deepStrictEqual(p("1990 2"), local(1990, 3, 1))
  assert.deepStrictEqual(p("1990 3"), local(1990, 6, 1))
  assert.deepStrictEqual(p("1990 4"), local(1990, 9, 1))
})

it('timeParse("%Y %q %m")(date) gives the month number priority', () => {
  const p = timeParse("%Y %q %m")
  assert.deepStrictEqual(p("1990 1 2"), local(1990, 1, 1))
  assert.deepStrictEqual(p("1990 2 5"), local(1990, 4, 1))
  assert.deepStrictEqual(p("1990 3 8"), local(1990, 7, 1))
  assert.deepStrictEqual(p("1990 4 9"), local(1990, 8, 1))
})

it('timeParse("%% %m/%d/%Y")(date) parses literal %', () => {
  const p = timeParse("%% %m/%d/%Y")
  assert.deepStrictEqual(p("% 01/01/1990"), local(1990, 0, 1))
  assert.deepStrictEqual(p("% 02/03/1991"), local(1991, 1, 3))
  assert.strictEqual(p("%% 03/10/2010"), null)
})

it('timeParse("%m/%d/%Y %Z")(date) parses timezone offset', () => {
  const p = timeParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +0000"), local(1990, 0, 1, 16))
  assert.deepStrictEqual(p("01/02/1990 +0100"), local(1990, 0, 1, 15))
  assert.deepStrictEqual(p("01/02/1990 +0130"), local(1990, 0, 1, 14, 30))
  assert.deepStrictEqual(p("01/02/1990 -0100"), local(1990, 0, 1, 17))
  assert.deepStrictEqual(p("01/02/1990 -0130"), local(1990, 0, 1, 17, 30))
  assert.deepStrictEqual(p("01/02/1990 -0800"), local(1990, 0, 2, 0))
})

it("timeParse(\"%m/%d/%Y %Z\")(date) parses timezone offset in the form '+-hh:mm'", () => {
  const p = timeParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +01:30"), local(1990, 0, 1, 14, 30))
  assert.deepStrictEqual(p("01/02/1990 -01:30"), local(1990, 0, 1, 17, 30))
})

it("timeParse(\"%m/%d/%Y %Z\")(date) parses timezone offset in the form '+-hh'", () => {
  const p = timeParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +01"), local(1990, 0, 1, 15))
  assert.deepStrictEqual(p("01/02/1990 -01"), local(1990, 0, 1, 17))
})

it("timeParse(\"%m/%d/%Y %Z\")(date) parses timezone offset in the form 'Z'", () => {
  const p = timeParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 Z"), local(1990, 0, 1, 16))
})

it('timeParse("%-m/%0d/%_Y")(date) ignores optional padding modifier, skipping zeroes and spaces', () => {
  const p = timeParse("%-m/%0d/%_Y")
  assert.deepStrictEqual(p("01/ 1/1990"), local(1990, 0, 1))
})

it('timeParse("%b %d, %Y")(date) doesn\'t crash when given weird strings', () => {
  try {
    Object.prototype.foo = 10
    const p = timeParse("%b %d, %Y")
    assert.strictEqual(p("foo 1, 1990"), null)
  } finally {
    delete Object.prototype.foo
  }
})
import assert from "assert"
import { utcSecond, utcMinute, utcHour, utcDay, utcMonth, utcWeek, utcYear } from "d3-time"
import { utcFormat } from "../src/index.js"
import { utc } from "./date.js"

const formatMillisecond = utcFormat(".%L"),
  formatSecond = utcFormat(":%S"),
  formatMinute = utcFormat("%I:%M"),
  formatHour = utcFormat("%I %p"),
  formatDay = utcFormat("%a %d"),
  formatWeek = utcFormat("%b %d"),
  formatMonth = utcFormat("%B"),
  formatYear = utcFormat("%Y")

function multi(d) {
  return (
    utcSecond(d) < d
      ? formatMillisecond
      : utcMinute(d) < d
      ? formatSecond
      : utcHour(d) < d
      ? formatMinute
      : utcDay(d) < d
      ? formatHour
      : utcMonth(d) < d
      ? utcWeek(d) < d
        ? formatDay
        : formatWeek
      : utcYear(d) < d
      ? formatMonth
      : formatYear
  )(d)
}

it('utcFormat("%a")(date) formats abbreviated weekdays', () => {
  const f = utcFormat("%a")
  assert.strictEqual(f(utc(1990, 0, 1)), "Mon")
  assert.strictEqual(f(utc(1990, 0, 2)), "Tue")
  assert.strictEqual(f(utc(1990, 0, 3)), "Wed")
  assert.strictEqual(f(utc(1990, 0, 4)), "Thu")
  assert.strictEqual(f(utc(1990, 0, 5)), "Fri")
  assert.strictEqual(f(utc(1990, 0, 6)), "Sat")
  assert.strictEqual(f(utc(1990, 0, 7)), "Sun")
})

it('utcFormat("%A")(date) formats weekdays', () => {
  const f = utcFormat("%A")
  assert.strictEqual(f(utc(1990, 0, 1)), "Monday")
  assert.strictEqual(f(utc(1990, 0, 2)), "Tuesday")
  assert.strictEqual(f(utc(1990, 0, 3)), "Wednesday")
  assert.strictEqual(f(utc(1990, 0, 4)), "Thursday")
  assert.strictEqual(f(utc(1990, 0, 5)), "Friday")
  assert.strictEqual(f(utc(1990, 0, 6)), "Saturday")
  assert.strictEqual(f(utc(1990, 0, 7)), "Sunday")
})

it('utcFormat("%b")(date) formats abbreviated months', () => {
  const f = utcFormat("%b")
  assert.strictEqual(f(utc(1990, 0, 1)), "Jan")
  assert.strictEqual(f(utc(1990, 1, 1)), "Feb")
  assert.strictEqual(f(utc(1990, 2, 1)), "Mar")
  assert.strictEqual(f(utc(1990, 3, 1)), "Apr")
  assert.strictEqual(f(utc(1990, 4, 1)), "May")
  assert.strictEqual(f(utc(1990, 5, 1)), "Jun")
  assert.strictEqual(f(utc(1990, 6, 1)), "Jul")
  assert.strictEqual(f(utc(1990, 7, 1)), "Aug")
  assert.strictEqual(f(utc(1990, 8, 1)), "Sep")
  assert.strictEqual(f(utc(1990, 9, 1)), "Oct")
  assert.strictEqual(f(utc(1990, 10, 1)), "Nov")
  assert.strictEqual(f(utc(1990, 11, 1)), "Dec")
})

it('utcFormat("%B")(date) formats months', () => {
  const f = utcFormat("%B")
  assert.strictEqual(f(utc(1990, 0, 1)), "January")
  assert.strictEqual(f(utc(1990, 1, 1)), "February")
  assert.strictEqual(f(utc(1990, 2, 1)), "March")
  assert.strictEqual(f(utc(1990, 3, 1)), "April")
  assert.strictEqual(f(utc(1990, 4, 1)), "May")
  assert.strictEqual(f(utc(1990, 5, 1)), "June")
  assert.strictEqual(f(utc(1990, 6, 1)), "July")
  assert.strictEqual(f(utc(1990, 7, 1)), "August")
  assert.strictEqual(f(utc(1990, 8, 1)), "September")
  assert.strictEqual(f(utc(1990, 9, 1)), "October")
  assert.strictEqual(f(utc(1990, 10, 1)), "November")
  assert.strictEqual(f(utc(1990, 11, 1)), "December")
})

it('utcFormat("%c")(date) formats localized dates and times', () => {
  const f = utcFormat("%c")
  assert.strictEqual(f(utc(1990, 0, 1)), "1/1/1990, 12:00:00 AM")
})

it('utcFormat("%d")(date) formats zero-padded dates', () => {
  const f = utcFormat("%d")
  assert.strictEqual(f(utc(1990, 0, 1)), "01")
})

it('utcFormat("%e")(date) formats space-padded dates', () => {
  const f = utcFormat("%e")
  assert.strictEqual(f(utc(1990, 0, 1)), " 1")
})

it('timeFormat("%g")(date) formats zero-padded two-digit ISO 8601 years', () => {
  const f = utcFormat("%g")
  assert.strictEqual(f(utc(2018, 11, 30, 0)), "18") // Sunday
  assert.strictEqual(f(utc(2018, 11, 31, 0)), "19") // Monday
  assert.strictEqual(f(utc(2019, 0, 1, 0)), "19")
})

it('utcFormat("%G")(date) formats zero-padded four-digit ISO 8601 years', () => {
  const f = utcFormat("%G")
  assert.strictEqual(f(utc(2018, 11, 30, 0)), "2018") // Sunday
  assert.strictEqual(f(utc(2018, 11, 31, 0)), "2019") // Monday
  assert.strictEqual(f(utc(2019, 0, 1, 0)), "2019")
})

it('utcFormat("%H")(date) formats zero-padded hours (24)', () => {
  const f = utcFormat("%H")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "00")
  assert.strictEqual(f(utc(1990, 0, 1, 13)), "13")
})

it('utcFormat("%I")(date) formats zero-padded hours (12)', () => {
  const f = utcFormat("%I")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "12")
  assert.strictEqual(f(utc(1990, 0, 1, 13)), "01")
})

it('utcFormat("%j")(date) formats zero-padded day of year numbers', () => {
  const f = utcFormat("%j")
  assert.strictEqual(f(utc(1990, 0, 1)), "001")
  assert.strictEqual(f(utc(1990, 5, 1)), "152")
  assert.strictEqual(f(utc(2010, 2, 13)), "072")
  assert.strictEqual(f(utc(2010, 2, 14)), "073") // DST begins
  assert.strictEqual(f(utc(2010, 2, 15)), "074")
  assert.strictEqual(f(utc(2010, 10, 6)), "310")
  assert.strictEqual(f(utc(2010, 10, 7)), "311") // DST ends
  assert.strictEqual(f(utc(2010, 10, 8)), "312")
})

it('utcFormat("%m")(date) formats zero-padded months', () => {
  const f = utcFormat("%m")
  assert.strictEqual(f(utc(1990, 0, 1)), "01")
  assert.strictEqual(f(utc(1990, 9, 1)), "10")
})

it('utcFormat("%M")(date) formats zero-padded minutes', () => {
  const f = utcFormat("%M")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0)), "00")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 32)), "32")
})

it('utcFormat("%p")(date) formats AM or PM', () => {
  const f = utcFormat("%p")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "AM")
  assert.strictEqual(f(utc(1990, 0, 1, 13)), "PM")
})

it('utcFormat("%q")(date) formats quarters', () => {
  const f = utcFormat("%q")
  assert.strictEqual(f(utc(1990, 0, 1)), "1")
  assert.strictEqual(f(utc(1990, 3, 1)), "2")
  assert.strictEqual(f(utc(1990, 6, 1)), "3")
  assert.strictEqual(f(utc(1990, 9, 1)), "4")
})

it('utcFormat("%Q")(date) formats UNIX timestamps', () => {
  const f = utcFormat("%Q")
  assert.strictEqual(f(utc(1970, 0, 1, 0, 0, 0)), "0")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), "631152000000")
  assert.strictEqual(f(utc(1990, 0, 1, 12, 34, 56)), "631197296000")
})

it('utcFormat("%s")(date) formats UNIX timetamps in seconds', () => {
  const f = utcFormat("%s")
  assert.strictEqual(f(utc(1970, 0, 1, 0, 0, 0)), "0")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), "631152000")
  assert.strictEqual(f(utc(1990, 0, 1, 12, 34, 56)), "631197296")
})

it('utcFormat("%s.%L")(date) formats UNIX timetamps in seconds and milliseconds', () => {
  const f = utcFormat("%s.%L")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 123)), "631152000.123")
  assert.strictEqual(f(utc(1990, 0, 1, 12, 34, 56, 789)), "631197296.789")
})

it('utcFormat("%s.%f")(date) formats UNIX timetamps in seconds and microseconds', () => {
  const f = utcFormat("%s.%f")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 123)), "631152000.123000")
  assert.strictEqual(f(utc(1990, 0, 1, 12, 34, 56, 789)), "631197296.789000")
})

it('utcFormat("%S")(date) formats zero-padded seconds', () => {
  const f = utcFormat("%S")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), "00")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 32)), "32")
  const f2 = utcFormat("%0S")
  assert.strictEqual(f2(utc(1990, 0, 1, 0, 0, 0)), "00")
  assert.strictEqual(f2(utc(1990, 0, 1, 0, 0, 32)), "32")
})

it('utcFormat("%_S")(date) formats space-padded seconds', () => {
  const f = utcFormat("%_S")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), " 0")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 3)), " 3")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 32)), "32")
})

it('utcFormat("-S")(date) formats no-padded seconds', () => {
  const f = utcFormat("%-S")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), "0")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 3)), "3")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 32)), "32")
})

it('utcFormat("%L")(date) formats zero-padded milliseconds', () => {
  const f = utcFormat("%L")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 0)), "000")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 432)), "432")
})

it('utcFormat("%u")(date) formats week day numbers', () => {
  const f = utcFormat("%u")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "1")
  assert.strictEqual(f(utc(1990, 0, 7, 0)), "7")
  assert.strictEqual(f(utc(2010, 2, 13, 23)), "6")
})

it('utcFormat("%f")(date) formats zero-padded microseconds', () => {
  const f = utcFormat("%f")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 0)), "000000")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0, 432)), "432000")
})

it('utcFormat("%U")(date) formats zero-padded week numbers', () => {
  const f = utcFormat("%U")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "00")
  assert.strictEqual(f(utc(1990, 5, 1, 0)), "21")
  assert.strictEqual(f(utc(2010, 2, 13, 23)), "10")
  assert.strictEqual(f(utc(2010, 2, 14, 0)), "11") // DST begins
  assert.strictEqual(f(utc(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(utc(2010, 10, 6, 23)), "44")
  assert.strictEqual(f(utc(2010, 10, 7, 0)), "45") // DST ends
  assert.strictEqual(f(utc(2010, 10, 8, 0)), "45")
  assert.strictEqual(f(utc(2012, 0, 1, 0)), "01") // Sunday!
})

it('utcFormat("%W")(date) formats zero-padded week numbers', () => {
  const f = utcFormat("%W")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "01") // Monday!
  assert.strictEqual(f(utc(1990, 5, 1, 0)), "22")
  assert.strictEqual(f(utc(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(utc(2010, 10, 8, 0)), "45")
})

it('utcFormat("%V")(date) formats zero-padded ISO 8601 week numbers', () => {
  const f = utcFormat("%V")
  assert.strictEqual(f(utc(1990, 0, 1, 0)), "01")
  assert.strictEqual(f(utc(1990, 5, 1, 0)), "22")
  assert.strictEqual(f(utc(2010, 2, 13, 23)), "10")
  assert.strictEqual(f(utc(2010, 2, 14, 0)), "10") // DST begins
  assert.strictEqual(f(utc(2010, 2, 15, 0)), "11")
  assert.strictEqual(f(utc(2010, 10, 6, 23)), "44")
  assert.strictEqual(f(utc(2010, 10, 7, 0)), "44") // DST ends
  assert.strictEqual(f(utc(2010, 10, 8, 0)), "45")
  assert.strictEqual(f(utc(2015, 11, 31, 0)), "53")
  assert.strictEqual(f(utc(2016, 0, 1, 0)), "53")
})

it('utcFormat("%x")(date) formats localized dates', () => {
  const f = utcFormat("%x")
  assert.strictEqual(f(utc(1990, 0, 1)), "1/1/1990")
  assert.strictEqual(f(utc(2010, 5, 1)), "6/1/2010")
})

it('utcFormat("%X")(date) formats localized times', () => {
  const f = utcFormat("%X")
  assert.strictEqual(f(utc(1990, 0, 1, 0, 0, 0)), "12:00:00 AM")
  assert.strictEqual(f(utc(1990, 0, 1, 13, 34, 59)), "1:34:59 PM")
})

it('utcFormat("%y")(date) formats zero-padded two-digit years', () => {
  const f = utcFormat("%y")
  assert.strictEqual(f(utc(+1990, 0, 1)), "90")
  assert.strictEqual(f(utc(+2002, 0, 1)), "02")
  assert.strictEqual(f(utc(-2, 0, 1)), "-02")
})

it('utcFormat("%Y")(date) formats zero-padded four-digit years', () => {
  const f = utcFormat("%Y")
  assert.strictEqual(f(utc(123, 0, 1)), "0123")
  assert.strictEqual(f(utc(1990, 0, 1)), "1990")
  assert.strictEqual(f(utc(2002, 0, 1)), "2002")
  assert.strictEqual(f(utc(10002, 0, 1)), "0002")
  assert.strictEqual(f(utc(-2, 0, 1)), "-0002")
})

it('utcFormat("%Z")(date) formats time zones', () => {
  const f = utcFormat("%Z")
  assert.strictEqual(f(utc(1990, 0, 1)), "+0000")
})

it('utcFormat("%%")(date) formats literal percent signs', () => {
  const f = utcFormat("%%")
  assert.strictEqual(f(utc(1990, 0, 1)), "%")
})

it("utcFormat(…) can be used to create a conditional multi-format", () => {
  assert.strictEqual(multi(utc(1990, 0, 1, 0, 0, 0, 12)), ".012")
  assert.strictEqual(multi(utc(1990, 0, 1, 0, 0, 1, 0)), ":01")
  assert.strictEqual(multi(utc(1990, 0, 1, 0, 1, 0, 0)), "12:01")
  assert.strictEqual(multi(utc(1990, 0, 1, 1, 0, 0, 0)), "01 AM")
  assert.strictEqual(multi(utc(1990, 0, 2, 0, 0, 0, 0)), "Tue 02")
  assert.strictEqual(multi(utc(1990, 1, 1, 0, 0, 0, 0)), "February")
  assert.strictEqual(multi(utc(1990, 0, 1, 0, 0, 0, 0)), "1990")
})
import assert from "assert"
import { utcParse } from "../src/index.js"
import { local, utc } from "./date.js"

it("utcParse(specifier) coerces the specified specifier to a string", () => {
  const p = utcParse({
    toString: function () {
      return "%c"
    },
  })
  assert.deepStrictEqual(p("1/1/1990, 12:00:00 AM"), utc(1990, 0, 1))
})

it('utcParse("")(date) parses abbreviated weekday and numeric date', () => {
  const p = utcParse("%a %m/%d/%Y")
  assert.deepStrictEqual(p("Sun 01/01/1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("Wed 02/03/1991"), utc(1991, 1, 3))
  assert.strictEqual(p("XXX 03/10/2010"), null)
})

it('utcParse("")(date) parses weekday and numeric date', () => {
  const p = utcParse("%A %m/%d/%Y")
  assert.deepStrictEqual(p("Sunday 01/01/1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("Wednesday 02/03/1991"), utc(1991, 1, 3))
  assert.strictEqual(p("Caturday 03/10/2010"), null)
})

it('utcParse("")(date) parses numeric date', () => {
  const p = utcParse("%m/%d/%y")
  assert.deepStrictEqual(p("01/01/90"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("02/03/91"), utc(1991, 1, 3))
  assert.strictEqual(p("03/10/2010"), null)
})

it('utcParse("")(date) parses locale date', () => {
  const p = utcParse("%x")
  assert.deepStrictEqual(p("01/01/1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("02/03/1991"), utc(1991, 1, 3))
  assert.deepStrictEqual(p("03/10/2010"), utc(2010, 2, 10))
})

it('utcParse("")(date) parses abbreviated month, date and year', () => {
  const p = utcParse("%b %d, %Y")
  assert.deepStrictEqual(p("jan 01, 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("feb  2, 2010"), utc(2010, 1, 2))
  assert.strictEqual(p("jan. 1, 1990"), null)
})

it('utcParse("")(date) parses month, date and year', () => {
  const p = utcParse("%B %d, %Y")
  assert.deepStrictEqual(p("january 01, 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("February  2, 2010"), utc(2010, 1, 2))
  assert.strictEqual(p("jan 1, 1990"), null)
})

it('utcParse("")(date) parses locale date and time', () => {
  const p = utcParse("%c")
  assert.deepStrictEqual(p("1/1/1990, 12:00:00 AM"), utc(1990, 0, 1))
})

it('utcParse("")(date) parses twenty-four hour, minute and second', () => {
  const p = utcParse("%H:%M:%S")
  assert.deepStrictEqual(p("00:00:00"), utc(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59"), utc(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00"), utc(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01"), utc(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("23:59:59"), utc(1900, 0, 1, 23, 59, 59))
})

it('utcParse("")(date) parses locale time', () => {
  const p = utcParse("%X")
  assert.deepStrictEqual(p("12:00:00 AM"), utc(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59 AM"), utc(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00 PM"), utc(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01 PM"), utc(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("11:59:59 PM"), utc(1900, 0, 1, 23, 59, 59))
})

it('utcParse("%L")(date) parses milliseconds', () => {
  const p = utcParse("%L")
  assert.deepStrictEqual(p("432"), utc(1900, 0, 1, 0, 0, 0, 432))
})

it('utcParse("%f")(date) parses microseconds', () => {
  const p = utcParse("%f")
  assert.deepStrictEqual(p("432000"), utc(1900, 0, 1, 0, 0, 0, 432))
})

it('utcParse("")(date) parses twelve hour, minute and second', () => {
  const p = utcParse("%I:%M:%S %p")
  assert.deepStrictEqual(p("12:00:00 am"), utc(1900, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(p("11:59:59 AM"), utc(1900, 0, 1, 11, 59, 59))
  assert.deepStrictEqual(p("12:00:00 pm"), utc(1900, 0, 1, 12, 0, 0))
  assert.deepStrictEqual(p("12:00:01 pm"), utc(1900, 0, 1, 12, 0, 1))
  assert.deepStrictEqual(p("11:59:59 PM"), utc(1900, 0, 1, 23, 59, 59))
})

it('utcParse("")(date) parses timezone offset', () => {
  const p = utcParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +0000"), utc(1990, 0, 2))
  assert.deepStrictEqual(p("01/02/1990 +0100"), utc(1990, 0, 1, 23))
  assert.deepStrictEqual(p("01/02/1990 -0100"), utc(1990, 0, 2, 1))
  assert.deepStrictEqual(p("01/02/1990 -0800"), local(1990, 0, 2))
})

it("utcParse(\"\")(date) parses timezone offset (in the form '+-hh:mm')", () => {
  const p = utcParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +01:30"), utc(1990, 0, 1, 22, 30))
  assert.deepStrictEqual(p("01/02/1990 -01:30"), utc(1990, 0, 2, 1, 30))
})

it("utcParse(\"\")(date) parses timezone offset (in the form '+-hh')", () => {
  const p = utcParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 +01"), utc(1990, 0, 1, 23))
  assert.deepStrictEqual(p("01/02/1990 -01"), utc(1990, 0, 2, 1))
})

it("utcParse(\"\")(date) parses timezone offset (in the form 'Z')", () => {
  const p = utcParse("%m/%d/%Y %Z")
  assert.deepStrictEqual(p("01/02/1990 Z"), utc(1990, 0, 2))
})

it('utcParse("%Y %U %w")(date) handles a year that starts on Sunday', () => {
  const p = utcParse("%Y %U %w")
  assert.deepStrictEqual(p("2012 01 0"), utc(2012, 0, 1))
})

it('utcParse("%w %V %Y")(date) parses numeric weekday, week number (ISO) and year', () => {
  const p = utcParse("%w %V %Y")
  assert.deepStrictEqual(p("1 01 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("0 05 1991"), utc(1991, 1, 3))
  assert.deepStrictEqual(p("4 53 1992"), utc(1992, 11, 31))
  assert.deepStrictEqual(p("0 52 1994"), utc(1995, 0, 1))
  assert.deepStrictEqual(p("0 01 1995"), utc(1995, 0, 8))
  assert.strictEqual(p("X 03 2010"), null)
})

it('utcParse("%w %V %G")(date) parses numeric weekday, week number (ISO) and corresponding year', () => {
  const p = utcParse("%w %V %G")
  assert.deepStrictEqual(p("1 01 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("0 05 1991"), utc(1991, 1, 3))
  assert.deepStrictEqual(p("4 53 1992"), utc(1992, 11, 31))
  assert.deepStrictEqual(p("0 52 1994"), utc(1995, 0, 1))
  assert.deepStrictEqual(p("0 01 1995"), utc(1995, 0, 8))
  assert.deepStrictEqual(p("1 01 2018"), utc(2018, 0, 1))
  assert.deepStrictEqual(p("1 01 2019"), utc(2018, 11, 31))
  assert.strictEqual(p("X 03 2010"), null)
})

it('utcParse("%V %Y")(date) week number (ISO) and year', () => {
  const p = utcParse("%V %Y")
  assert.deepStrictEqual(p("01 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("05 1991"), utc(1991, 0, 28))
  assert.deepStrictEqual(p("53 1992"), utc(1992, 11, 28))
  assert.deepStrictEqual(p("01 1993"), utc(1993, 0, 4))
  assert.deepStrictEqual(p("01 1995"), utc(1995, 0, 2))
  assert.deepStrictEqual(p("00 1995"), null)
  assert.deepStrictEqual(p("54 1995"), null)
  assert.deepStrictEqual(p("X 1995"), null)
})

it('utcParse("%V %g")(date) week number (ISO) and corresponding two-digits year', () => {
  const p = utcParse("%V %g")
  assert.deepStrictEqual(p("01 90"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("05 91"), utc(1991, 0, 28))
  assert.deepStrictEqual(p("53 92"), utc(1992, 11, 28))
  assert.deepStrictEqual(p("01 93"), utc(1993, 0, 4))
  assert.deepStrictEqual(p("01 95"), utc(1995, 0, 2))
  assert.deepStrictEqual(p("01 18"), utc(2018, 0, 1))
  assert.deepStrictEqual(p("01 19"), utc(2018, 11, 31))
  assert.deepStrictEqual(p("00 95"), null)
  assert.deepStrictEqual(p("54 95"), null)
  assert.deepStrictEqual(p("X 95"), null)
})

it('utcParse("%V %G")(date) week number (ISO) and corresponding year', () => {
  const p = utcParse("%V %G")
  assert.deepStrictEqual(p("01 1990"), utc(1990, 0, 1))
  assert.deepStrictEqual(p("05 1991"), utc(1991, 0, 28))
  assert.deepStrictEqual(p("53 1992"), utc(1992, 11, 28))
  assert.deepStrictEqual(p("01 1993"), utc(1993, 0, 4))
  assert.deepStrictEqual(p("01 1995"), utc(1995, 0, 2))
  assert.deepStrictEqual(p("01 2018"), utc(2018, 0, 1))
  assert.deepStrictEqual(p("01 2019"), utc(2018, 11, 31))
  assert.deepStrictEqual(p("00 1995"), null)
  assert.deepStrictEqual(p("54 1995"), null)
  assert.deepStrictEqual(p("X 1995"), null)
})

it('utcParse("%Q")(date) parses UNIX timestamps', () => {
  const p = utcParse("%Q")
  assert.deepStrictEqual(p("0"), utc(1970, 0, 1))
  assert.deepStrictEqual(p("631152000000"), utc(1990, 0, 1))
})

it('utcParse("%s")(date) parses UNIX timestamps in seconds', () => {
  const p = utcParse("%s")
  assert.deepStrictEqual(p("0"), utc(1970, 0, 1))
  assert.deepStrictEqual(p("631152000"), utc(1990, 0, 1))
})

it('utcParse("%s.%L")(date) parses UNIX timetamps in seconds and milliseconds', () => {
  const p = utcParse("%s.%L")
  assert.deepStrictEqual(p("631152000.123"), utc(1990, 0, 1, 0, 0, 0, 123))
  assert.deepStrictEqual(p("631197296.789"), utc(1990, 0, 1, 12, 34, 56, 789))
})

it('utcParse("%s.%f")(date) parses UNIX timetamps in seconds and microseconds', () => {
  const p = utcParse("%s.%f")
  assert.deepStrictEqual(p("631152000.123000"), utc(1990, 0, 1, 0, 0, 0, 123))
  assert.deepStrictEqual(p("631197296.789000"), utc(1990, 0, 1, 12, 34, 56, 789))
})
