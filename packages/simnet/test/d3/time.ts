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
import { timeDay, timeDays, timeYear } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeDays in an alias for timeDay.range", () => {
  assert.strictEqual(timeDays, timeDay.range)
})

it("timeDay() is equivalent to timeDay.floor(new Date)", () => {
  const t = new Date()
  assert.deepStrictEqual(timeDay(), timeDay.floor(t))
})

it("timeDay(date) is equivalent to timeDay.floor(date)", () => {
  const t = new Date()
  assert.deepStrictEqual(timeDay(t), timeDay.floor(t))
})

it("timeDay.floor(date) returns days", () => {
  assert.deepStrictEqual(timeDay.floor(local(2010, 11, 31, 23)), local(2010, 11, 31))
  assert.deepStrictEqual(timeDay.floor(local(2011, 0, 1, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeDay.floor(local(2011, 0, 1, 1)), local(2011, 0, 1))
})

it("timeDay.floor(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeDay.floor(utc(2011, 2, 13, 7)), local(2011, 2, 12))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 2, 13, 8)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 2, 13, 9)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 2, 13, 10)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 10, 6, 7)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 10, 6, 8)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 10, 6, 9)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.floor(utc(2011, 10, 6, 10)), local(2011, 10, 6))
})

it("timeDay.floor(date) handles years in the first century", () => {
  assert.deepStrictEqual(timeDay.floor(local(9, 10, 6, 7)), local(9, 10, 6))
})

it("timeDay.round(date) returns days", () => {
  assert.deepStrictEqual(timeDay.round(local(2010, 11, 30, 13)), local(2010, 11, 31))
  assert.deepStrictEqual(timeDay.round(local(2010, 11, 30, 11)), local(2010, 11, 30))
})

it("timeDay.round(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeDay.round(utc(2011, 2, 13, 7)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.round(utc(2011, 2, 13, 8)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.round(utc(2011, 2, 13, 9)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.round(utc(2011, 2, 13, 20)), local(2011, 2, 14))
  assert.deepStrictEqual(timeDay.round(utc(2011, 10, 6, 7)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.round(utc(2011, 10, 6, 8)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.round(utc(2011, 10, 6, 9)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.round(utc(2011, 10, 6, 20)), local(2011, 10, 7))
})

it("timeDay.round(date) handles midnight in leap years", () => {
  assert.deepStrictEqual(timeDay.round(utc(2012, 2, 1, 0)), local(2012, 2, 1))
  assert.deepStrictEqual(timeDay.round(utc(2012, 2, 1, 0)), local(2012, 2, 1))
})

it("timeDay.ceil(date) returns days", () => {
  assert.deepStrictEqual(timeDay.ceil(local(2010, 11, 30, 23)), local(2010, 11, 31))
  assert.deepStrictEqual(timeDay.ceil(local(2010, 11, 31, 0)), local(2010, 11, 31))
  assert.deepStrictEqual(timeDay.ceil(local(2010, 11, 31, 1)), local(2011, 0, 1))
})

it("timeDay.ceil(date) observes start of daylight saving", () => {
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 2, 13, 7)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 2, 13, 8)), local(2011, 2, 13))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 2, 13, 9)), local(2011, 2, 14))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 2, 13, 10)), local(2011, 2, 14))
})

it("timeDay.ceil(date) observes end of daylight saving", () => {
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 10, 6, 7)), local(2011, 10, 6))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 10, 6, 8)), local(2011, 10, 7))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 10, 6, 9)), local(2011, 10, 7))
  assert.deepStrictEqual(timeDay.ceil(utc(2011, 10, 6, 10)), local(2011, 10, 7))
})

it("timeDay.ceil(date) handles midnight for leap years", () => {
  assert.deepStrictEqual(timeDay.ceil(utc(2012, 2, 1, 0)), local(2012, 2, 1))
  assert.deepStrictEqual(timeDay.ceil(utc(2012, 2, 1, 0)), local(2012, 2, 1))
})

it("timeDay.offset(date) is an alias for timeDay.offset(date, 1)", () => {
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31, 23, 59, 59, 999)), local(2011, 0, 1, 23, 59, 59, 999))
})

it("timeDay.offset(date, step) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeDay.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeDay.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31, 23, 59, 59, 999), +1), local(2011, 0, 1, 23, 59, 59, 999))
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31, 23, 59, 59, 456), -2), local(2010, 11, 29, 23, 59, 59, 456))
})

it("timeDay.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31), -1), local(2010, 11, 30))
  assert.deepStrictEqual(timeDay.offset(local(2011, 0, 1), -2), local(2010, 11, 30))
  assert.deepStrictEqual(timeDay.offset(local(2011, 0, 1), -1), local(2010, 11, 31))
})

it("timeDay.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31), +1), local(2011, 0, 1))
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 30), +2), local(2011, 0, 1))
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 30), +1), local(2010, 11, 31))
})

it("timeDay.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31, 23, 59, 59, 999), 0), local(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(timeDay.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeDay.range(start, stop) returns days between start (inclusive) and stop (exclusive)", () => {
  assert.deepStrictEqual(timeDay.range(local(2011, 10, 4), local(2011, 10, 10)), [
    local(2011, 10, 4),
    local(2011, 10, 5),
    local(2011, 10, 6),
    local(2011, 10, 7),
    local(2011, 10, 8),
    local(2011, 10, 9),
  ])
})

it("timeDay.range(start, stop) returns days", () => {
  assert.deepStrictEqual(timeDay.range(local(2011, 10, 4, 2), local(2011, 10, 10, 13)), [
    local(2011, 10, 5),
    local(2011, 10, 6),
    local(2011, 10, 7),
    local(2011, 10, 8),
    local(2011, 10, 9),
    local(2011, 10, 10),
  ])
})

it("timeDay.range(start, stop) coerces start and stop to dates", () => {
  assert.deepStrictEqual(timeDay.range(+local(2011, 10, 4), +local(2011, 10, 7)), [
    local(2011, 10, 4),
    local(2011, 10, 5),
    local(2011, 10, 6),
  ])
})

it("timeDay.range(start, stop) returns the empty array for invalid dates", () => {
  assert.deepStrictEqual(timeDay.range(new Date(NaN), Infinity), [])
})

it("timeDay.range(start, stop) returns the empty array if start >= stop", () => {
  assert.deepStrictEqual(timeDay.range(local(2011, 10, 10), local(2011, 10, 4)), [])
  assert.deepStrictEqual(timeDay.range(local(2011, 10, 10), local(2011, 10, 10)), [])
})

it("timeDay.range(start, stop, step) returns every step day", () => {
  assert.deepStrictEqual(timeDay.range(local(2011, 10, 4, 2), local(2011, 10, 14, 13), 3), [
    local(2011, 10, 5),
    local(2011, 10, 8),
    local(2011, 10, 11),
    local(2011, 10, 14),
  ])
})

it("timeDay.range(start, stop, step) returns the empty array if step is zero, negative or NaN", () => {
  assert.deepStrictEqual(timeDay.range(local(2011, 0, 1, 0), local(2011, 4, 9, 0), 0), [])
  assert.deepStrictEqual(timeDay.range(local(2011, 0, 1, 0), local(2011, 4, 9, 0), -1), [])
  assert.deepStrictEqual(timeDay.range(local(2011, 0, 1, 0), local(2011, 4, 9, 0), 0.5), [])
  assert.deepStrictEqual(timeDay.range(local(2011, 0, 1, 0), local(2011, 4, 9, 0), NaN), [])
})

it("timeDay.count(start, end) counts days after start (exclusive) and before end (inclusive)", () => {
  assert.strictEqual(timeDay.count(local(2011, 0, 1, 0), local(2011, 4, 9, 0)), 128)
  assert.strictEqual(timeDay.count(local(2011, 0, 1, 1), local(2011, 4, 9, 0)), 128)
  assert.strictEqual(timeDay.count(local(2010, 11, 31, 23), local(2011, 4, 9, 0)), 129)
  assert.strictEqual(timeDay.count(local(2011, 0, 1, 0), local(2011, 4, 8, 23)), 127)
  assert.strictEqual(timeDay.count(local(2011, 0, 1, 0), local(2011, 4, 9, 1)), 128)
})

it("timeDay.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 71)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 71)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 71)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 309)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 309)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 309)
})

it("timeDay.count(start, stop) does not exhibit floating-point rounding error", () => {
  const date = new Date(2011, 4, 9)
  assert.strictEqual(timeDay.count(timeYear(date), date), 128)
})

it("timeDay.count(start, end) returns 364 or 365 for a full year", () => {
  assert.strictEqual(timeDay.count(local(1999, 0, 1), local(1999, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2000, 0, 1), local(2000, 11, 31)), 365) // leap year
  assert.strictEqual(timeDay.count(local(2001, 0, 1), local(2001, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2002, 0, 1), local(2002, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2003, 0, 1), local(2003, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2004, 0, 1), local(2004, 11, 31)), 365) // leap year
  assert.strictEqual(timeDay.count(local(2005, 0, 1), local(2005, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2006, 0, 1), local(2006, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2007, 0, 1), local(2007, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2008, 0, 1), local(2008, 11, 31)), 365) // leap year
  assert.strictEqual(timeDay.count(local(2009, 0, 1), local(2009, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2010, 0, 1), local(2010, 11, 31)), 364)
  assert.strictEqual(timeDay.count(local(2011, 0, 1), local(2011, 11, 31)), 364)
})

it("timeDay.every(step) returns every stepth day, starting with the first day of the month", () => {
  assert.deepStrictEqual(timeDay.every(3).range(local(2008, 11, 30, 0, 12), local(2009, 0, 5, 23, 48)), [
    local(2008, 11, 31),
    local(2009, 0, 1),
    local(2009, 0, 4),
  ])
  assert.deepStrictEqual(timeDay.every(5).range(local(2008, 11, 30, 0, 12), local(2009, 0, 6, 23, 48)), [
    local(2008, 11, 31),
    local(2009, 0, 1),
    local(2009, 0, 6),
  ])
  assert.deepStrictEqual(timeDay.every(7).range(local(2008, 11, 30, 0, 12), local(2009, 0, 8, 23, 48)), [
    local(2009, 0, 1),
    local(2009, 0, 8),
  ])
})
import assert from "assert"
import { timeFriday, timeFridays } from "../src/index.js"
import { local } from "./date.js"

it("timeFridays in an alias for timeFriday.range", () => {
  assert.strictEqual(timeFridays, timeFriday.range)
})

it("timeFriday.floor(date) returns Fridays", () => {
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 5, 23, 59, 59)), local(2010, 11, 31))
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 6, 0, 0, 0)), local(2010, 11, 31))
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 6, 0, 0, 1)), local(2010, 11, 31))
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 6, 23, 59, 59)), local(2010, 11, 31))
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 7, 0, 0, 0)), local(2011, 0, 7))
  assert.deepStrictEqual(timeFriday.floor(local(2011, 0, 7, 0, 0, 1)), local(2011, 0, 7))
})

it("timeFriday.count(start, end) counts Fridays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(timeFriday.count(local(2012, 0, 1), local(2012, 0, 5)), 0)
  assert.strictEqual(timeFriday.count(local(2012, 0, 1), local(2012, 0, 6)), 1)
  assert.strictEqual(timeFriday.count(local(2012, 0, 1), local(2012, 0, 7)), 1)
  assert.strictEqual(timeFriday.count(local(2012, 0, 1), local(2012, 0, 13)), 2)

  //     January 2010
  // Su Mo Tu We Th Fr Sa
  //                 1  2
  //  3  4  5  6  7  8  9
  // 10 11 12 13 14 15 16
  // 17 18 19 20 21 22 23
  // 24 25 26 27 28 29 30
  // 31
  assert.strictEqual(timeFriday.count(local(2010, 0, 1), local(2010, 0, 7)), 0)
  assert.strictEqual(timeFriday.count(local(2010, 0, 1), local(2010, 0, 8)), 1)
  assert.strictEqual(timeFriday.count(local(2010, 0, 1), local(2010, 0, 9)), 1)
})

it("timeFriday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeFriday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { timeHour } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeHour.floor(date) returns hours", () => {
  assert.deepStrictEqual(timeHour.floor(local(2010, 11, 31, 23, 59)), local(2010, 11, 31, 23))
  assert.deepStrictEqual(timeHour.floor(local(2011, 0, 1, 0, 0)), local(2011, 0, 1, 0))
  assert.deepStrictEqual(timeHour.floor(local(2011, 0, 1, 0, 1)), local(2011, 0, 1, 0))
})

it("timeHour.floor(date) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 8, 59)), utc(2011, 2, 13, 8))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 9, 0)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 9, 1)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 9, 59)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 10, 0)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 2, 13, 10, 1)), utc(2011, 2, 13, 10))
})

it("timeHour.floor(date) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 7, 59)), utc(2011, 10, 6, 7))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 8, 0)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 8, 1)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 8, 59)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 9, 0)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(timeHour.floor(utc(2011, 10, 6, 9, 1)), utc(2011, 10, 6, 9))
})

it("timeHour.ceil(date) returns hours", () => {
  assert.deepStrictEqual(timeHour.ceil(local(2010, 11, 31, 23, 59)), local(2011, 0, 1, 0))
  assert.deepStrictEqual(timeHour.ceil(local(2011, 0, 1, 0, 0)), local(2011, 0, 1, 0))
  assert.deepStrictEqual(timeHour.ceil(local(2011, 0, 1, 0, 1)), local(2011, 0, 1, 1))
})

it("timeHour.ceil(date) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 8, 59)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 9, 0)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 9, 1)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 9, 59)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 10, 0)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 2, 13, 10, 1)), utc(2011, 2, 13, 11))
})

it("timeHour.ceil(date) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 7, 59)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 8, 0)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 8, 1)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 8, 59)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 9, 0)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(timeHour.ceil(utc(2011, 10, 6, 9, 1)), utc(2011, 10, 6, 10))
})

it("timeHour.offset(date) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeHour.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeHour.offset(date) does not round the passed-in-date", () => {
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 23, 59, 59, 999), +1), local(2011, 0, 1, 0, 59, 59, 999))
  assert.deepStrictEqual(
    timeHour.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 11, 31, 21, 59, 59, 456)
  )
})

it("timeHour.offset(date) allows negative offsets", () => {
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 12), -1), local(2010, 11, 31, 11))
  assert.deepStrictEqual(timeHour.offset(local(2011, 0, 1, 1), -2), local(2010, 11, 31, 23))
  assert.deepStrictEqual(timeHour.offset(local(2011, 0, 1, 0), -1), local(2010, 11, 31, 23))
})

it("timeHour.offset(date) allows positive offsets", () => {
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 11), +1), local(2010, 11, 31, 12))
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 23), +2), local(2011, 0, 1, 1))
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 23), +1), local(2011, 0, 1, 0))
})

it("timeHour.offset(date) allows zero offset", () => {
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 23, 59, 59, 999), 0), local(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(timeHour.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeHour.range(start, stop) returns hours", () => {
  assert.deepStrictEqual(timeHour.range(local(2010, 11, 31, 12, 30), local(2010, 11, 31, 15, 30)), [
    local(2010, 11, 31, 13),
    local(2010, 11, 31, 14),
    local(2010, 11, 31, 15),
  ])
})

it("timeHour.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(timeHour.range(local(2010, 11, 31, 23), local(2011, 0, 1, 2))[0], local(2010, 11, 31, 23))
})

it("timeHour.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(timeHour.range(local(2010, 11, 31, 23), local(2011, 0, 1, 2))[2], local(2011, 0, 1, 1))
})

it("timeHour.range(start, stop) can skip hours", () => {
  assert.deepStrictEqual(timeHour.range(local(2011, 1, 1, 1), local(2011, 1, 1, 13), 3), [
    local(2011, 1, 1, 1),
    local(2011, 1, 1, 4),
    local(2011, 1, 1, 7),
    local(2011, 1, 1, 10),
  ])
})

it("timeHour.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.range(local(2011, 2, 13, 1), local(2011, 2, 13, 5)), [
    utc(2011, 2, 13, 9),
    utc(2011, 2, 13, 10),
    utc(2011, 2, 13, 11),
  ])
})

it("timeHour.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeHour.range(local(2011, 10, 6, 0), local(2011, 10, 6, 2)), [
    utc(2011, 10, 6, 7),
    utc(2011, 10, 6, 8),
    utc(2011, 10, 6, 9),
  ])
})

it("timeHour.every(step) returns every stepth hour, starting with the first hour of the day", () => {
  assert.deepStrictEqual(timeHour.every(4).range(local(2008, 11, 30, 12, 47), local(2008, 11, 31, 13, 57)), [
    local(2008, 11, 30, 16),
    local(2008, 11, 30, 20),
    local(2008, 11, 31, 0),
    local(2008, 11, 31, 4),
    local(2008, 11, 31, 8),
    local(2008, 11, 31, 12),
  ])
  assert.deepStrictEqual(timeHour.every(12).range(local(2008, 11, 30, 12, 47), local(2008, 11, 31, 13, 57)), [
    local(2008, 11, 31, 0),
    local(2008, 11, 31, 12),
  ])
})

it("timeHour.range(start, stop) returns every hour crossing the daylight savings boundary", () => {
  assert.deepStrictEqual(timeHour.range(new Date(1478422800000 - 2 * 36e5), new Date(1478422800000 + 2 * 36e5)), [
    new Date(1478415600000), // Sun Nov  6 2016  0:00:00 GMT-0700 (PDT)
    new Date(1478419200000), // Sun Nov  6 2016  1:00:00 GMT-0700 (PDT)
    new Date(1478422800000), // Sun Nov  6 2016  1:00:00 GMT-0800 (PDT)
    new Date(1478426400000), // Sun Nov  6 2016  2:00:00 GMT-0800 (PDT)
  ])
})
import assert from "assert"
import { timeDay, timeHour, timeInterval, timeMinute, timeSecond, timeYear } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeInterval() is equivalent to timeInterval.floor(new Date)", () => {
  const t = new Date()
  assert.deepStrictEqual(timeYear(), timeYear.floor(t))
})

it("timeInterval(date) is equivalent to timeInterval.floor(date)", () => {
  const t = new Date()
  assert.deepStrictEqual(timeYear(t), timeYear.floor(t))
})

it("timeInterval(floor, offset) returns a custom time interval", () => {
  const i = timeInterval(
    function (date) {
      date.setUTCMinutes(0, 0, 0)
    },
    function (date, step) {
      date.setUTCHours(date.getUTCHours() + step)
    }
  )
  assert.deepStrictEqual(i(utc(2015, 0, 1, 12, 34, 56, 789)), utc(2015, 0, 1, 12))
})

it("timeInterval(floor, offset) does not define a count method", () => {
  const i = timeInterval(
    function (date) {
      date.setUTCMinutes(0, 0, 0)
    },
    function (date, step) {
      date.setUTCHours(date.getUTCHours() + step)
    }
  )
  assert(!("count" in i))
})

it("timeInterval(floor, offset) floors the step before passing it to offset", () => {
  const steps = [],
    i = timeInterval(
      function (date) {
        date.setUTCMinutes(0, 0, 0)
      },
      function (date, step) {
        steps.push(+step), date.setUTCHours(date.getUTCHours() + step)
      }
    )
  assert.deepStrictEqual(i.offset(utc(2015, 0, 1, 12, 34, 56, 789), 1.5), utc(2015, 0, 1, 13, 34, 56, 789))
  assert.deepStrictEqual(i.range(utc(2015, 0, 1, 12), utc(2015, 0, 1, 15), 1.5), [
    utc(2015, 0, 1, 12),
    utc(2015, 0, 1, 13),
    utc(2015, 0, 1, 14),
  ])
  assert(
    steps.every(function (step) {
      return step === 1
    })
  )
})

it("timeInterval(floor, offset, count) defines a count method", () => {
  const i = timeInterval(
    function (date) {
      date.setUTCMinutes(0, 0, 0)
    },
    function (date, step) {
      date.setUTCHours(date.getUTCHours() + step)
    },
    function (start, end) {
      return (end - start) / 36e5
    }
  )
  assert.strictEqual(i.count(utc(2015, 0, 1, 12, 34), utc(2015, 0, 1, 15, 56)), 3)
})

it("timeInterval(floor, offset, count) floors dates before passing them to count", () => {
  const dates = [],
    i = timeInterval(
      function (date) {
        date.setUTCMinutes(0, 0, 0)
      },
      function (date, step) {
        date.setUTCHours(date.getUTCHours() + step)
      },
      function (start, end) {
        return dates.push(new Date(+start), new Date(+end)), (end - start) / 36e5
      }
    )
  i.count(utc(2015, 0, 1, 12, 34), utc(2015, 0, 1, 15, 56))
  assert.deepStrictEqual(dates, [utc(2015, 0, 1, 12), utc(2015, 0, 1, 15)])
})

it("timeInterval.every(step) returns null if step is invalid", () => {
  assert.strictEqual(timeDay.every(), null)
  assert.strictEqual(timeMinute.every(null), null)
  assert.strictEqual(timeSecond.every(undefined), null)
  assert.strictEqual(timeDay.every(NaN), null)
  assert.strictEqual(timeMinute.every(0), null)
  assert.strictEqual(timeSecond.every(0.8), null)
  assert.strictEqual(timeHour.every(-1), null)
})

it("timeInterval.every(step) returns interval if step is one", () => {
  assert.strictEqual(timeDay.every("1"), timeDay)
  assert.strictEqual(timeMinute.every(1), timeMinute)
  assert.strictEqual(timeSecond.every(1.8), timeSecond)
})

it("timeInterval.every(step).range(invalid, invalid) returns the empty array", () => {
  assert.deepStrictEqual(timeMinute.every(15).range(NaN, NaN), [])
})

it("timeInterval.every(…).offset(date, step) returns the expected value when step is positive", () => {
  const i = timeMinute.every(15)
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 0), local(2015, 0, 1, 12, 34))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 1), local(2015, 0, 1, 12, 45))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 2), local(2015, 0, 1, 13, 0))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 3), local(2015, 0, 1, 13, 15))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 4), local(2015, 0, 1, 13, 30))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 5), local(2015, 0, 1, 13, 45))
})

it("timeInterval.every(…).offset(date, step) returns the expected value when step is negative", () => {
  const i = timeMinute.every(15)
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), -1), local(2015, 0, 1, 12, 30))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), -2), local(2015, 0, 1, 12, 15))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), -3), local(2015, 0, 1, 12, 0))
})

it("timeInterval.every(…).offset(date, step) returns the expected value when step is not an integer", () => {
  const i = timeMinute.every(15)
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), 1.2), local(2015, 0, 1, 12, 45))
  assert.deepStrictEqual(i.offset(local(2015, 0, 1, 12, 34), -0.8), local(2015, 0, 1, 12, 30))
})
import assert from "assert"
import { timeMillisecond } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeMillisecond.every(step) returns every stepth millisecond, starting with the first millisecond of the second", () => {
  assert.deepStrictEqual(
    timeMillisecond.every(50).range(local(2008, 11, 30, 12, 36, 0, 947), local(2008, 11, 30, 12, 36, 1, 157)),
    [
      local(2008, 11, 30, 12, 36, 0, 950),
      local(2008, 11, 30, 12, 36, 1, 0),
      local(2008, 11, 30, 12, 36, 1, 50),
      local(2008, 11, 30, 12, 36, 1, 100),
      local(2008, 11, 30, 12, 36, 1, 150),
    ]
  )
  assert.deepStrictEqual(
    timeMillisecond.every(100).range(local(2008, 11, 30, 12, 36, 0, 947), local(2008, 11, 30, 12, 36, 1, 157)),
    [local(2008, 11, 30, 12, 36, 1, 0), local(2008, 11, 30, 12, 36, 1, 100)]
  )
  assert.deepStrictEqual(
    timeMillisecond.every(50).range(utc(2008, 11, 30, 12, 36, 0, 947), utc(2008, 11, 30, 12, 36, 1, 157)),
    [
      utc(2008, 11, 30, 12, 36, 0, 950),
      utc(2008, 11, 30, 12, 36, 1, 0),
      utc(2008, 11, 30, 12, 36, 1, 50),
      utc(2008, 11, 30, 12, 36, 1, 100),
      utc(2008, 11, 30, 12, 36, 1, 150),
    ]
  )
  assert.deepStrictEqual(
    timeMillisecond.every(100).range(utc(2008, 11, 30, 12, 36, 0, 947), utc(2008, 11, 30, 12, 36, 1, 157)),
    [utc(2008, 11, 30, 12, 36, 1, 0), utc(2008, 11, 30, 12, 36, 1, 100)]
  )
})
import assert from "assert"
import { timeMinute } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeMinute.floor(date) returns minutes", () => {
  assert.deepStrictEqual(timeMinute.floor(local(2010, 11, 31, 23, 59, 59)), local(2010, 11, 31, 23, 59))
  assert.deepStrictEqual(timeMinute.floor(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(timeMinute.floor(local(2011, 0, 1, 0, 0, 59)), local(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(timeMinute.floor(local(2011, 0, 1, 0, 1, 0)), local(2011, 0, 1, 0, 1))
})

it("timeMinute.ceil(date) returns minutes", () => {
  assert.deepStrictEqual(timeMinute.ceil(local(2010, 11, 31, 23, 59, 59)), local(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(timeMinute.ceil(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(timeMinute.ceil(local(2011, 0, 1, 0, 0, 59)), local(2011, 0, 1, 0, 1))
  assert.deepStrictEqual(timeMinute.ceil(local(2011, 0, 1, 0, 1, 0)), local(2011, 0, 1, 0, 1))
})

it("timeMinute.offset(date) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeMinute.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeMinute.offset(date) does not round the passed-in-date", () => {
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 59, 59, 999), +1), local(2011, 0, 1, 0, 0, 59, 999))
  assert.deepStrictEqual(
    timeMinute.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 11, 31, 23, 57, 59, 456)
  )
})

it("timeMinute.offset(date) allows negative offsets", () => {
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 12), -1), local(2010, 11, 31, 23, 11))
  assert.deepStrictEqual(timeMinute.offset(local(2011, 0, 1, 0, 1), -2), local(2010, 11, 31, 23, 59))
  assert.deepStrictEqual(timeMinute.offset(local(2011, 0, 1, 0, 0), -1), local(2010, 11, 31, 23, 59))
})

it("timeMinute.offset(date) allows positive offsets", () => {
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 11), +1), local(2010, 11, 31, 23, 12))
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 59), +2), local(2011, 0, 1, 0, 1))
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 59), +1), local(2011, 0, 1, 0, 0))
})

it("timeMinute.offset(date) allows zero offset", () => {
  assert.deepStrictEqual(
    timeMinute.offset(local(2010, 11, 31, 23, 59, 59, 999), 0),
    local(2010, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(timeMinute.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeMinute.range(start, stop), returns minutes", () => {
  assert.deepStrictEqual(timeMinute.range(local(2010, 11, 31, 23, 59), local(2011, 0, 1, 0, 2)), [
    local(2010, 11, 31, 23, 59),
    local(2011, 0, 1, 0, 0),
    local(2011, 0, 1, 0, 1),
  ])
})

it("timeMinute.range(start, stop), has an inclusive lower bound", () => {
  assert.deepStrictEqual(
    timeMinute.range(local(2010, 11, 31, 23, 59), local(2011, 0, 1, 0, 2))[0],
    local(2010, 11, 31, 23, 59)
  )
})

it("timeMinute.range(start, stop), has an exclusive upper bound", () => {
  assert.deepStrictEqual(
    timeMinute.range(local(2010, 11, 31, 23, 59), local(2011, 0, 1, 0, 2))[2],
    local(2011, 0, 1, 0, 1)
  )
})

it("timeMinute.range(start, stop), can skip minutes", () => {
  assert.deepStrictEqual(timeMinute.range(local(2011, 1, 1, 12, 7), local(2011, 1, 1, 13, 7), 15), [
    local(2011, 1, 1, 12, 7),
    local(2011, 1, 1, 12, 22),
    local(2011, 1, 1, 12, 37),
    local(2011, 1, 1, 12, 52),
  ])
})

it("timeMinute.range(start, stop), observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeMinute.range(utc(2011, 2, 13, 9, 59), utc(2011, 2, 13, 10, 2)), [
    utc(2011, 2, 13, 9, 59),
    utc(2011, 2, 13, 10, 0),
    utc(2011, 2, 13, 10, 1),
  ])
})

it("timeMinute.range(start, stop), observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeMinute.range(utc(2011, 10, 6, 8, 59), utc(2011, 10, 6, 9, 2)), [
    utc(2011, 10, 6, 8, 59),
    utc(2011, 10, 6, 9, 0),
    utc(2011, 10, 6, 9, 1),
  ])
})

it("timeMinute.every(step) returns every stepth minute, starting with the first minute of the hour", () => {
  assert.deepStrictEqual(timeMinute.every(15).range(local(2008, 11, 30, 12, 47), local(2008, 11, 30, 13, 57)), [
    local(2008, 11, 30, 13, 0),
    local(2008, 11, 30, 13, 15),
    local(2008, 11, 30, 13, 30),
    local(2008, 11, 30, 13, 45),
  ])
  assert.deepStrictEqual(timeMinute.every(30).range(local(2008, 11, 30, 12, 47), local(2008, 11, 30, 13, 57)), [
    local(2008, 11, 30, 13, 0),
    local(2008, 11, 30, 13, 30),
  ])
})

it("timeMinute.range(start, stop) returns every minute crossing the daylight savings boundary", () => {
  assert.deepStrictEqual(timeMinute.range(new Date(1478422800000 - 2 * 6e4), new Date(1478422800000 + 2 * 6e4)), [
    new Date(1478422680000), // Sun Nov  6 2016  1:58:00 GMT-0700 (PDT)
    new Date(1478422740000), // Sun Nov  6 2016  1:59:00 GMT-0700 (PDT)
    new Date(1478422800000), // Sun Nov  6 2016  1:00:00 GMT-0800 (PDT)
    new Date(1478422860000), // Sun Nov  6 2016  1:01:00 GMT-0800 (PDT)
  ])
})
import assert from "assert"
import { timeMonday, timeMondays } from "../src/index.js"
import { local } from "./date.js"

it("timeMondays in an alias for timeMonday.range", () => {
  assert.strictEqual(timeMondays, timeMonday.range)
})

it("timeMonday.floor(date) returns Mondays", () => {
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 1, 23, 59, 59)), local(2010, 11, 27))
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 2, 0, 0, 0)), local(2010, 11, 27))
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 2, 0, 0, 1)), local(2010, 11, 27))
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 2, 23, 59, 59)), local(2010, 11, 27))
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 3, 0, 0, 0)), local(2011, 0, 3))
  assert.deepStrictEqual(timeMonday.floor(local(2011, 0, 3, 0, 0, 1)), local(2011, 0, 3))
})

it("timeMonday.range(start, stop, step) returns every step Monday", () => {
  assert.deepStrictEqual(timeMonday.range(local(2011, 11, 1), local(2012, 0, 15), 2), [
    local(2011, 11, 5),
    local(2011, 11, 19),
    local(2012, 0, 2),
  ])
})

it("timeMonday.count(start, end) counts Mondays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(timeMonday.count(local(2014, 0, 1), local(2014, 0, 5)), 0)
  assert.strictEqual(timeMonday.count(local(2014, 0, 1), local(2014, 0, 6)), 1)
  assert.strictEqual(timeMonday.count(local(2014, 0, 1), local(2014, 0, 7)), 1)
  assert.strictEqual(timeMonday.count(local(2014, 0, 1), local(2014, 0, 13)), 2)

  //     January 2018
  // Su Mo Tu We Th Fr Sa
  //     1  2  3  4  5  6
  //  7  8  9 10 11 12 13
  // 14 15 16 17 18 19 20
  // 21 22 23 24 25 26 27
  // 28 29 30 31
  assert.strictEqual(timeMonday.count(local(2018, 0, 1), local(2018, 0, 7)), 0)
  assert.strictEqual(timeMonday.count(local(2018, 0, 1), local(2018, 0, 8)), 1)
  assert.strictEqual(timeMonday.count(local(2018, 0, 1), local(2018, 0, 9)), 1)
})

it("timeMonday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeMonday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { timeMonth, timeMonths } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeMonths in an alias for timeMonth.range", () => {
  assert.strictEqual(timeMonths, timeMonth.range)
})

it("timeMonth.floor(date) returns months", () => {
  assert.deepStrictEqual(timeMonth.floor(local(2010, 11, 31, 23, 59, 59)), local(2010, 11, 1))
  assert.deepStrictEqual(timeMonth.floor(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.floor(local(2011, 0, 1, 0, 0, 1)), local(2011, 0, 1))
})

it("timeMonth.floor(date) observes the start of daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.floor(local(2011, 2, 13, 1)), local(2011, 2, 1))
})

it("timeMonth.floor(date) observes the end of the daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.floor(local(2011, 10, 6, 1)), local(2011, 10, 1))
})

it("timeMonth.floor(date) correctly handles years in the first century", () => {
  assert.deepStrictEqual(timeMonth.floor(local(9, 10, 6, 7)), local(9, 10, 1))
})

it("timeMonth.ceil(date) returns months", () => {
  assert.deepStrictEqual(timeMonth.ceil(local(2010, 11, 31, 23, 59, 59)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 0, 1, 0, 0, 1)), local(2011, 1, 1))
})

it("timeMonth.ceil(date) observes the start of daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 2, 13, 1)), local(2011, 3, 1))
})

it("timeMonth.ceil(date) observes the end of the daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 10, 6, 1)), local(2011, 11, 1))
})

it("timeMonth.offset(date) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeMonth.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeMonth.offset(date) does not round the passed-in-date", () => {
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 999), +1),
    local(2011, 0, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 9, 31, 23, 59, 59, 456)
  )
})

it("timeMonth.offset(date) allows negative offsets", () => {
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 1), -1), local(2010, 10, 1))
  assert.deepStrictEqual(timeMonth.offset(local(2011, 0, 1), -2), local(2010, 10, 1))
  assert.deepStrictEqual(timeMonth.offset(local(2011, 0, 1), -1), local(2010, 11, 1))
})

it("timeMonth.offset(date) allows positive offsets", () => {
  assert.deepStrictEqual(timeMonth.offset(local(2010, 10, 1), +1), local(2010, 11, 1))
  assert.deepStrictEqual(timeMonth.offset(local(2010, 10, 1), +2), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 1), +1), local(2011, 0, 1))
})

it("timeMonth.offset(date) allows zero offset", () => {
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 999), 0),
    local(2010, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeMonths in an alias for timeMonth.range", () => {
  assert.strictEqual(timeMonths, timeMonth.range)
})

it("timeMonth.floor(date) returns months", () => {
  assert.deepStrictEqual(timeMonth.floor(local(2010, 11, 31, 23)), local(2010, 11, 1))
  assert.deepStrictEqual(timeMonth.floor(local(2011, 0, 1, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.floor(local(2011, 0, 1, 1)), local(2011, 0, 1))
})

it("timeMonth.floor(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 2, 13, 7)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 2, 13, 8)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 2, 13, 9)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 2, 13, 10)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 10, 6, 7)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 10, 6, 8)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 10, 6, 9)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.floor(utc(2011, 10, 6, 10)), local(2011, 10, 1))
})

it("timeMonth.floor(date) handles years in the first century", () => {
  assert.deepStrictEqual(timeMonth.floor(local(9, 10, 6, 7)), local(9, 10, 1))
})

it("timeMonth.round(date) returns months", () => {
  assert.deepStrictEqual(timeMonth.round(local(2010, 11, 16, 12)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.round(local(2010, 11, 16, 11)), local(2010, 11, 1))
})

it("timeMonth.round(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeMonth.round(utc(2011, 2, 13, 7)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 2, 13, 8)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 2, 13, 9)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 2, 13, 20)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 10, 6, 7)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 10, 6, 8)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 10, 6, 9)), local(2011, 10, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2011, 10, 6, 20)), local(2011, 10, 1))
})

it("timeMonth.round(date) handles midnight for leap years", () => {
  assert.deepStrictEqual(timeMonth.round(utc(2012, 2, 1, 0)), local(2012, 2, 1))
  assert.deepStrictEqual(timeMonth.round(utc(2012, 2, 1, 0)), local(2012, 2, 1))
})

it("timeMonth.ceil(date) returns months", () => {
  assert.deepStrictEqual(timeMonth.ceil(local(2010, 10, 30, 23)), local(2010, 11, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2010, 11, 1, 1)), local(2011, 0, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 1, 1)), local(2011, 1, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 2, 1)), local(2011, 2, 1))
  assert.deepStrictEqual(timeMonth.ceil(local(2011, 3, 1)), local(2011, 3, 1))
})

it("timeMonth.ceil(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 2, 13, 7)), local(2011, 3, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 2, 13, 8)), local(2011, 3, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 2, 13, 9)), local(2011, 3, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 2, 13, 10)), local(2011, 3, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 10, 6, 7)), local(2011, 11, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 10, 6, 8)), local(2011, 11, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 10, 6, 9)), local(2011, 11, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2011, 10, 6, 10)), local(2011, 11, 1))
})

it("timeMonth.ceil(date) handles midnight for leap years", () => {
  assert.deepStrictEqual(timeMonth.ceil(utc(2012, 2, 1, 0)), local(2012, 2, 1))
  assert.deepStrictEqual(timeMonth.ceil(utc(2012, 2, 1, 0)), local(2012, 2, 1))
})

it("timeMonth.offset(date) is an alias for timeMonth.offset(date, 1)", () => {
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 999)), local(2011, 0, 31, 23, 59, 59, 999))
})

it("timeMonth.offset(date, step) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeMonth.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeMonth.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 999), +1),
    local(2011, 0, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 9, 31, 23, 59, 59, 456)
  )
})

it("timeMonth.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 31), -1), local(2010, 10, 31))
  assert.deepStrictEqual(timeMonth.offset(local(2011, 0, 1), -2), local(2010, 10, 1))
  assert.deepStrictEqual(timeMonth.offset(local(2011, 0, 1), -1), local(2010, 11, 1))
})

it("timeMonth.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 31), +1), local(2011, 0, 31))
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 30), +2), local(2011, 1, 30))
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 30), +1), local(2011, 0, 30))
})

it("timeMonth.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(
    timeMonth.offset(local(2010, 11, 31, 23, 59, 59, 999), 0),
    local(2010, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(timeMonth.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeMonth.range(start, stop) returns months between start (inclusive) and stop (exclusive)", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 11, 1), local(2012, 5, 1)), [
    local(2011, 11, 1),
    local(2012, 0, 1),
    local(2012, 1, 1),
    local(2012, 2, 1),
    local(2012, 3, 1),
    local(2012, 4, 1),
  ])
})

it("timeMonth.range(start, stop) returns months", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 10, 4, 2), local(2012, 4, 10, 13)), [
    local(2011, 11, 1),
    local(2012, 0, 1),
    local(2012, 1, 1),
    local(2012, 2, 1),
    local(2012, 3, 1),
    local(2012, 4, 1),
  ])
})

it("timeMonth.range(start, stop) coerces start and stop to dates", () => {
  assert.deepStrictEqual(timeMonth.range(+local(2011, 10, 4), +local(2012, 1, 7)), [
    local(2011, 11, 1),
    local(2012, 0, 1),
    local(2012, 1, 1),
  ])
})

it("timeMonth.range(start, stop) returns the empty array for invalid dates", () => {
  assert.deepStrictEqual(timeMonth.range(new Date(NaN), Infinity), [])
})

it("timeMonth.range(start, stop) returns the empty array if start >= stop", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 11, 10), local(2011, 10, 4)), [])
  assert.deepStrictEqual(timeMonth.range(local(2011, 10, 1), local(2011, 10, 1)), [])
})

it("timeMonth.range(start, stop) returns months", () => {
  assert.deepStrictEqual(timeMonth.range(local(2010, 10, 31), local(2011, 2, 1)), [
    local(2010, 11, 1),
    local(2011, 0, 1),
    local(2011, 1, 1),
  ])
})

it("timeMonth.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(timeMonth.range(local(2010, 10, 31), local(2011, 2, 1))[0], local(2010, 11, 1))
})

it("timeMonth.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(timeMonth.range(local(2010, 10, 31), local(2011, 2, 1))[2], local(2011, 1, 1))
})

it("timeMonth.range(start, stop) can skip months", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 1, 1), local(2012, 1, 1), 3), [
    local(2011, 1, 1),
    local(2011, 4, 1),
    local(2011, 7, 1),
    local(2011, 10, 1),
  ])
})

it("timeMonth.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 0, 1), local(2011, 4, 1)), [
    local(2011, 0, 1),
    local(2011, 1, 1),
    local(2011, 2, 1),
    local(2011, 3, 1),
  ])
})

it("timeMonth.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeMonth.range(local(2011, 9, 1), local(2012, 1, 1)), [
    local(2011, 9, 1),
    local(2011, 10, 1),
    local(2011, 11, 1),
    local(2012, 0, 1),
  ])
})

it("timeMonth.count(start, end) counts months after start (exclusive) and before end (inclusive)", () => {
  assert.strictEqual(timeMonth.count(local(2011, 0, 1), local(2011, 4, 1)), 4)
  assert.strictEqual(timeMonth.count(local(2011, 0, 1), local(2011, 3, 30)), 3)
  assert.strictEqual(timeMonth.count(local(2010, 11, 31), local(2011, 3, 30)), 4)
  assert.strictEqual(timeMonth.count(local(2010, 11, 31), local(2011, 4, 1)), 5)
  assert.strictEqual(timeMonth.count(local(2009, 11, 31), local(2012, 4, 1)), 29)
  assert.strictEqual(timeMonth.count(local(2012, 4, 1), local(2009, 11, 31)), -29)
})

it("timeMonth.every(step) returns every stepth month, starting with the first month of the year", () => {
  assert.deepStrictEqual(timeMonth.every(3).range(local(2008, 11, 3), local(2010, 6, 5)), [
    local(2009, 0, 1),
    local(2009, 3, 1),
    local(2009, 6, 1),
    local(2009, 9, 1),
    local(2010, 0, 1),
    local(2010, 3, 1),
    local(2010, 6, 1),
  ])
})
import assert from "assert"
import { timeYear } from "../src/index.js"
import { local } from "./date.js"

it("timeYear.every(n).floor(date) returns integer multiples of n years", () => {
  assert.deepStrictEqual(timeYear.every(10).floor(local(2009, 11, 31, 23, 59, 59)), local(2000, 0, 1))
  assert.deepStrictEqual(timeYear.every(10).floor(local(2010, 0, 1, 0, 0, 0)), local(2010, 0, 1))
  assert.deepStrictEqual(timeYear.every(10).floor(local(2010, 0, 1, 0, 0, 1)), local(2010, 0, 1))
})

it("timeYear.every(n).ceil(date) returns integer multiples of n years", () => {
  assert.deepStrictEqual(timeYear.every(100).ceil(local(1999, 11, 31, 23, 59, 59)), local(2000, 0, 1))
  assert.deepStrictEqual(timeYear.every(100).ceil(local(2000, 0, 1, 0, 0, 0)), local(2000, 0, 1))
  assert.deepStrictEqual(timeYear.every(100).ceil(local(2000, 0, 1, 0, 0, 1)), local(2100, 0, 1))
})

it("timeYear.every(n).offset(date, count) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeYear.every(5).offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeYear.every(n).offset(date, count) does not round the passed-in-date", () => {
  assert.deepStrictEqual(
    timeYear.every(5).offset(local(2010, 11, 31, 23, 59, 59, 999), +1),
    local(2015, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    timeYear.every(5).offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2000, 11, 31, 23, 59, 59, 456)
  )
})

it("timeYear.every(n) does not define interval.count or interval.every", () => {
  const decade = timeYear.every(10)
  assert.strictEqual(decade.count, undefined)
  assert.strictEqual(decade.every, undefined)
})

it("timeYear.every(n).range(start, stop) returns multiples of n years", () => {
  assert.deepStrictEqual(timeYear.every(10).range(local(2010, 0, 1), local(2031, 0, 1)), [
    local(2010, 0, 1),
    local(2020, 0, 1),
    local(2030, 0, 1),
  ])
})
import assert from "assert"
import { timeSaturday, timeSaturdays } from "../src/index.js"
import { local } from "./date.js"

it("timeSaturdays in an alias for timeSaturday.range", () => {
  assert.strictEqual(timeSaturdays, timeSaturday.range)
})

it("timeSaturday.floor(date) returns Saturdays", () => {
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 6, 23, 59, 59)), local(2011, 0, 1))
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 7, 0, 0, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 7, 0, 0, 1)), local(2011, 0, 1))
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 7, 23, 59, 59)), local(2011, 0, 1))
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 8, 0, 0, 0)), local(2011, 0, 8))
  assert.deepStrictEqual(timeSaturday.floor(local(2011, 0, 8, 0, 0, 1)), local(2011, 0, 8))
})

it("timeSaturday.count(start, end) counts Saturdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(timeSaturday.count(local(2012, 0, 1), local(2012, 0, 6)), 0)
  assert.strictEqual(timeSaturday.count(local(2012, 0, 1), local(2012, 0, 7)), 1)
  assert.strictEqual(timeSaturday.count(local(2012, 0, 1), local(2012, 0, 8)), 1)
  assert.strictEqual(timeSaturday.count(local(2012, 0, 1), local(2012, 0, 14)), 2)

  //     January 2011
  // Su Mo Tu We Th Fr Sa
  //                    1
  //  2  3  4  5  6  7  8
  //  9 10 11 12 13 14 15
  // 16 17 18 19 20 21 22
  // 23 24 25 26 27 28 29
  // 30 31
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 0, 7)), 0)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 0, 8)), 1)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 0, 9)), 1)
})

it("timeSaturday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeSaturday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { timeSecond } from "../src/index.js"
import { local, utc } from "./date.js"

it("timeSecond.floor(date) returns seconds", () => {
  assert.deepStrictEqual(timeSecond.floor(local(2010, 11, 31, 23, 59, 59, 999)), local(2010, 11, 31, 23, 59, 59))
  assert.deepStrictEqual(timeSecond.floor(local(2011, 0, 1, 0, 0, 0, 0)), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.floor(local(2011, 0, 1, 0, 0, 0, 1)), local(2011, 0, 1, 0, 0, 0))
})

it("timeSecond.round(date) returns seconds", () => {
  assert.deepStrictEqual(timeSecond.round(local(2010, 11, 31, 23, 59, 59, 999)), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.round(local(2011, 0, 1, 0, 0, 0, 499)), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.round(local(2011, 0, 1, 0, 0, 0, 500)), local(2011, 0, 1, 0, 0, 1))
})

it("timeSecond.ceil(date) returns seconds", () => {
  assert.deepStrictEqual(timeSecond.ceil(local(2010, 11, 31, 23, 59, 59, 999)), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.ceil(local(2011, 0, 1, 0, 0, 0, 0)), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.ceil(local(2011, 0, 1, 0, 0, 0, 1)), local(2011, 0, 1, 0, 0, 1))
})

it("timeSecond.offset(date, step) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeSecond.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeSecond.offset(date, step) does not round the passed-in-date", () => {
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 59, 999), +1), local(2011, 0, 1, 0, 0, 0, 999))
  assert.deepStrictEqual(
    timeSecond.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 11, 31, 23, 59, 57, 456)
  )
})

it("timeSecond.offset(date, step) allows negative offsets", () => {
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 59), -1), local(2010, 11, 31, 23, 59, 58))
  assert.deepStrictEqual(timeSecond.offset(local(2011, 0, 1, 0, 0, 0), -2), local(2010, 11, 31, 23, 59, 58))
  assert.deepStrictEqual(timeSecond.offset(local(2011, 0, 1, 0, 0, 0), -1), local(2010, 11, 31, 23, 59, 59))
})

it("timeSecond.offset(date, step) allows positive offsets", () => {
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 58), +1), local(2010, 11, 31, 23, 59, 59))
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 58), +2), local(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 59), +1), local(2011, 0, 1, 0, 0, 0))
})

it("timeSecond.offset(date, step) allows zero offset", () => {
  assert.deepStrictEqual(
    timeSecond.offset(local(2010, 11, 31, 23, 59, 59, 999), 0),
    local(2010, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(timeSecond.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeSecond.range(start, stop) returns seconds", () => {
  assert.deepStrictEqual(timeSecond.range(local(2010, 11, 31, 23, 59, 59), local(2011, 0, 1, 0, 0, 2)), [
    local(2010, 11, 31, 23, 59, 59),
    local(2011, 0, 1, 0, 0, 0),
    local(2011, 0, 1, 0, 0, 1),
  ])
})

it("timeSecond.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(
    timeSecond.range(local(2010, 11, 31, 23, 59, 59), local(2011, 0, 1, 0, 0, 2))[0],
    local(2010, 11, 31, 23, 59, 59)
  )
})

it("timeSecond.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(
    timeSecond.range(local(2010, 11, 31, 23, 59, 59), local(2011, 0, 1, 0, 0, 2))[2],
    local(2011, 0, 1, 0, 0, 1)
  )
})

it("timeSecond.range(start, stop, step) can skip seconds", () => {
  assert.deepStrictEqual(timeSecond.range(local(2011, 1, 1, 12, 0, 7), local(2011, 1, 1, 12, 1, 7), 15), [
    local(2011, 1, 1, 12, 0, 7),
    local(2011, 1, 1, 12, 0, 22),
    local(2011, 1, 1, 12, 0, 37),
    local(2011, 1, 1, 12, 0, 52),
  ])
})

it("timeSecond.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeSecond.range(utc(2011, 2, 13, 9, 59, 59), utc(2011, 2, 13, 10, 0, 2)), [
    utc(2011, 2, 13, 9, 59, 59),
    utc(2011, 2, 13, 10, 0, 0),
    utc(2011, 2, 13, 10, 0, 1),
  ])
})

it("timeSecond.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeSecond.range(utc(2011, 10, 6, 8, 59, 59), utc(2011, 10, 6, 9, 0, 2)), [
    utc(2011, 10, 6, 8, 59, 59),
    utc(2011, 10, 6, 9, 0, 0),
    utc(2011, 10, 6, 9, 0, 1),
  ])
})

it("timeSecond.every(step) returns every stepth second, starting with the first second of the minute", () => {
  assert.deepStrictEqual(timeSecond.every(15).range(local(2008, 11, 30, 12, 36, 47), local(2008, 11, 30, 12, 37, 57)), [
    local(2008, 11, 30, 12, 37, 0),
    local(2008, 11, 30, 12, 37, 15),
    local(2008, 11, 30, 12, 37, 30),
    local(2008, 11, 30, 12, 37, 45),
  ])
  assert.deepStrictEqual(timeSecond.every(30).range(local(2008, 11, 30, 12, 36, 47), local(2008, 11, 30, 12, 37, 57)), [
    local(2008, 11, 30, 12, 37, 0),
    local(2008, 11, 30, 12, 37, 30),
  ])
})

it("timeSecond.range(start, stop) returns every second crossing the daylight savings boundary", () => {
  assert.deepStrictEqual(timeSecond.range(new Date(1478422800000 - 2 * 1e3), new Date(1478422800000 + 2 * 1e3)), [
    new Date(1478422798000), // Sun Nov  6 2016  1:59:58 GMT-0700 (PDT)
    new Date(1478422799000), // Sun Nov  6 2016  1:59:59 GMT-0700 (PDT)
    new Date(1478422800000), // Sun Nov  6 2016  1:00:00 GMT-0800 (PDT)
    new Date(1478422801000), // Sun Nov  6 2016  1:00:01 GMT-0800 (PDT)
  ])
})
import assert from "assert"
import { timeSunday, timeSundays } from "../src/index.js"
import { local } from "./date.js"

it("timeSundays in an alias for timeSunday.range", () => {
  assert.strictEqual(timeSundays, timeSunday.range)
})

it("timeSunday.floor(date) returns Sundays", () => {
  assert.deepStrictEqual(timeSunday.floor(local(2010, 11, 31, 23, 59, 59)), local(2010, 11, 26))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 0, 1, 0, 0, 0)), local(2010, 11, 26))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 0, 1, 0, 0, 1)), local(2010, 11, 26))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 0, 1, 23, 59, 59)), local(2010, 11, 26))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 0, 2, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 0, 2, 0, 0, 1)), local(2011, 0, 2))
})

it("timeSunday.floor(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeSunday.floor(local(2011, 2, 13, 1)), local(2011, 2, 13))
  assert.deepStrictEqual(timeSunday.floor(local(2011, 10, 6, 1)), local(2011, 10, 6))
})

it("timeSunday.floor(date) handles years in the first century", () => {
  assert.deepStrictEqual(timeSunday.floor(local(9, 10, 6, 7)), local(9, 10, 1))
})

it("timeSunday.ceil(date) returns Sundays", () => {
  assert.deepStrictEqual(timeSunday.ceil(local(2010, 11, 31, 23, 59, 59)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 0, 1, 0, 0, 1)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 0, 1, 23, 59, 59)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 0, 2, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 0, 2, 0, 0, 1)), local(2011, 0, 9))
})

it("timeSunday.ceil(date) observes daylight saving", () => {
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 2, 13, 1)), local(2011, 2, 20))
  assert.deepStrictEqual(timeSunday.ceil(local(2011, 10, 6, 1)), local(2011, 10, 13))
})

it("timeSunday.offset(date) is an alias for timeSunday.offset(date, 1)", () => {
  assert.deepStrictEqual(timeSunday.offset(local(2010, 11, 31, 23, 59, 59, 999)), local(2011, 0, 7, 23, 59, 59, 999))
})

it("timeSunday.offset(date, step) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeSunday.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeSunday.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(
    timeSunday.offset(local(2010, 11, 31, 23, 59, 59, 999), +1),
    local(2011, 0, 7, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    timeSunday.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 11, 17, 23, 59, 59, 456)
  )
})

it("timeSunday.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(timeSunday.offset(local(2010, 11, 1), -1), local(2010, 10, 24))
  assert.deepStrictEqual(timeSunday.offset(local(2011, 0, 1), -2), local(2010, 11, 18))
  assert.deepStrictEqual(timeSunday.offset(local(2011, 0, 1), -1), local(2010, 11, 25))
})

it("timeSunday.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(timeSunday.offset(local(2010, 10, 24), +1), local(2010, 11, 1))
  assert.deepStrictEqual(timeSunday.offset(local(2010, 11, 18), +2), local(2011, 0, 1))
  assert.deepStrictEqual(timeSunday.offset(local(2010, 11, 25), +1), local(2011, 0, 1))
})

it("timeSunday.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(
    timeSunday.offset(local(2010, 11, 31, 23, 59, 59, 999), 0),
    local(2010, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(timeSunday.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeSunday.range(start, stop) returns Sundays between start (inclusive) and stop (exclusive)", () => {
  assert.deepStrictEqual(timeSunday.range(local(2011, 11, 1), local(2012, 0, 15)), [
    local(2011, 11, 4),
    local(2011, 11, 11),
    local(2011, 11, 18),
    local(2011, 11, 25),
    local(2012, 0, 1),
    local(2012, 0, 8),
  ])
})

it("timeSunday.range(start, stop) returns Sundays", () => {
  assert.deepStrictEqual(timeSunday.range(local(2011, 11, 1, 12, 23), local(2012, 0, 14, 12, 23)), [
    local(2011, 11, 4),
    local(2011, 11, 11),
    local(2011, 11, 18),
    local(2011, 11, 25),
    local(2012, 0, 1),
    local(2012, 0, 8),
  ])
})

it("timeSunday.range(start, stop) coerces start and stop to dates", () => {
  assert.deepStrictEqual(timeSunday.range(+local(2011, 11, 1), +local(2012, 0, 15)), [
    local(2011, 11, 4),
    local(2011, 11, 11),
    local(2011, 11, 18),
    local(2011, 11, 25),
    local(2012, 0, 1),
    local(2012, 0, 8),
  ])
})

it("timeSunday.range(start, stop) returns the empty array for invalid dates", () => {
  assert.deepStrictEqual(timeSunday.range(new Date(NaN), Infinity), [])
})

it("timeSunday.range(start, stop) returns the empty array if start >= stop", () => {
  assert.deepStrictEqual(timeSunday.range(local(2011, 11, 10), local(2011, 10, 4)), [])
  assert.deepStrictEqual(timeSunday.range(local(2011, 10, 1), local(2011, 10, 1)), [])
})

it("timeSunday.range(start, stop, step) returns every step Sunday", () => {
  assert.deepStrictEqual(timeSunday.range(local(2011, 11, 1), local(2012, 0, 15), 2), [
    local(2011, 11, 4),
    local(2011, 11, 18),
    local(2012, 0, 1),
  ])
})

it("timeSunday.count(start, end) counts Sundays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(timeSunday.count(local(2014, 0, 1), local(2014, 0, 4)), 0)
  assert.strictEqual(timeSunday.count(local(2014, 0, 1), local(2014, 0, 5)), 1)
  assert.strictEqual(timeSunday.count(local(2014, 0, 1), local(2014, 0, 6)), 1)
  assert.strictEqual(timeSunday.count(local(2014, 0, 1), local(2014, 0, 12)), 2)

  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(timeSunday.count(local(2012, 0, 1), local(2012, 0, 7)), 0)
  assert.strictEqual(timeSunday.count(local(2012, 0, 1), local(2012, 0, 8)), 1)
  assert.strictEqual(timeSunday.count(local(2012, 0, 1), local(2012, 0, 9)), 1)
})

it("timeSunday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 11)
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 11)
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 11)
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 45)
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 45)
  assert.strictEqual(timeSunday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 45)
})
import assert from "assert"
import { timeThursday, timeThursdays } from "../src/index.js"
import { local } from "./date.js"

it("timeThursdays in an alias for timeThursday.range", () => {
  assert.strictEqual(timeThursdays, timeThursday.range)
})

it("timeThursday.floor(date) returns Thursdays", () => {
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 4, 23, 59, 59)), local(2010, 11, 30))
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 5, 0, 0, 0)), local(2010, 11, 30))
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 5, 0, 0, 1)), local(2010, 11, 30))
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 5, 23, 59, 59)), local(2010, 11, 30))
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 6, 0, 0, 0)), local(2011, 0, 6))
  assert.deepStrictEqual(timeThursday.floor(local(2011, 0, 6, 0, 0, 1)), local(2011, 0, 6))
})

it("timeThursday.count(start, end) counts Thursdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(timeThursday.count(local(2012, 0, 1), local(2012, 0, 4)), 0)
  assert.strictEqual(timeThursday.count(local(2012, 0, 1), local(2012, 0, 5)), 1)
  assert.strictEqual(timeThursday.count(local(2012, 0, 1), local(2012, 0, 6)), 1)
  assert.strictEqual(timeThursday.count(local(2012, 0, 1), local(2012, 0, 12)), 2)

  //     January 2015
  // Su Mo Tu We Th Fr Sa
  //              1  2  3
  //  4  5  6  7  8  9 10
  // 11 12 13 14 15 16 17
  // 18 19 20 21 22 23 24
  // 25 26 27 28 29 30 31
  assert.strictEqual(timeThursday.count(local(2015, 0, 1), local(2015, 0, 7)), 0)
  assert.strictEqual(timeThursday.count(local(2015, 0, 1), local(2015, 0, 8)), 1)
  assert.strictEqual(timeThursday.count(local(2015, 0, 1), local(2015, 0, 9)), 1)
})

it("timeThursday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeThursday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { timeMinute, timeTicks } from "../src/index.js"
import { local } from "./date.js"

it("timeTicks(start, stop, interval) respects the specified interval", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 1, 0), local(2011, 0, 1, 12, 4, 4), timeMinute), [
    local(2011, 0, 1, 12, 1),
    local(2011, 0, 1, 12, 2),
    local(2011, 0, 1, 12, 3),
    local(2011, 0, 1, 12, 4),
  ])
})

it("timeTicks(start, stop, interval) returns the empty array for invalid intervals", () => {
  assert.deepStrictEqual(timeTicks(NaN, NaN, 10), [])
})

it("timeTicks(start, stop, interval.every(step)) observes the specified tick interval and step", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 33, 4), timeMinute.every(10)), [
    local(2011, 0, 1, 12, 0),
    local(2011, 0, 1, 12, 10),
    local(2011, 0, 1, 12, 20),
    local(2011, 0, 1, 12, 30),
  ])
})

it("timeTicks(start, stop, count) can generate sub-second ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 1), 4), [
    local(2011, 0, 1, 12, 0, 0, 0),
    local(2011, 0, 1, 12, 0, 0, 200),
    local(2011, 0, 1, 12, 0, 0, 400),
    local(2011, 0, 1, 12, 0, 0, 600),
    local(2011, 0, 1, 12, 0, 0, 800),
    local(2011, 0, 1, 12, 0, 1, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-second ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 4), 4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 1),
    local(2011, 0, 1, 12, 0, 2),
    local(2011, 0, 1, 12, 0, 3),
    local(2011, 0, 1, 12, 0, 4),
  ])
})

it("timeTicks(start, stop, count) can generate 5-second ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 20), 4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 5),
    local(2011, 0, 1, 12, 0, 10),
    local(2011, 0, 1, 12, 0, 15),
    local(2011, 0, 1, 12, 0, 20),
  ])
})

it("timeTicks(start, stop, count) can generate 15-second ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 50), 4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 15),
    local(2011, 0, 1, 12, 0, 30),
    local(2011, 0, 1, 12, 0, 45),
  ])
})

it("timeTicks(start, stop, count) can generate 30-second ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 1, 50), 4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 30),
    local(2011, 0, 1, 12, 1, 0),
    local(2011, 0, 1, 12, 1, 30),
  ])
})

it("timeTicks(start, stop, count) can generate 1-minute ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 0, 27), local(2011, 0, 1, 12, 4, 12), 4), [
    local(2011, 0, 1, 12, 1),
    local(2011, 0, 1, 12, 2),
    local(2011, 0, 1, 12, 3),
    local(2011, 0, 1, 12, 4),
  ])
})

it("timeTicks(start, stop, count) can generate 5-minute ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 3, 27), local(2011, 0, 1, 12, 21, 12), 4), [
    local(2011, 0, 1, 12, 5),
    local(2011, 0, 1, 12, 10),
    local(2011, 0, 1, 12, 15),
    local(2011, 0, 1, 12, 20),
  ])
})

it("timeTicks(start, stop, count) can generate 15-minute ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 8, 27), local(2011, 0, 1, 13, 4, 12), 4), [
    local(2011, 0, 1, 12, 15),
    local(2011, 0, 1, 12, 30),
    local(2011, 0, 1, 12, 45),
    local(2011, 0, 1, 13, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 30-minute ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 28, 27), local(2011, 0, 1, 14, 4, 12), 4), [
    local(2011, 0, 1, 12, 30),
    local(2011, 0, 1, 13, 0),
    local(2011, 0, 1, 13, 30),
    local(2011, 0, 1, 14, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-hour ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 12, 28, 27), local(2011, 0, 1, 16, 34, 12), 4), [
    local(2011, 0, 1, 13, 0),
    local(2011, 0, 1, 14, 0),
    local(2011, 0, 1, 15, 0),
    local(2011, 0, 1, 16, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 3-hour ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 14, 28, 27), local(2011, 0, 2, 1, 34, 12), 4), [
    local(2011, 0, 1, 15, 0),
    local(2011, 0, 1, 18, 0),
    local(2011, 0, 1, 21, 0),
    local(2011, 0, 2, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 6-hour ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 16, 28, 27), local(2011, 0, 2, 14, 34, 12), 4), [
    local(2011, 0, 1, 18, 0),
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 2, 6, 0),
    local(2011, 0, 2, 12, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 12-hour ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 16, 28, 27), local(2011, 0, 3, 21, 34, 12), 4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 2, 12, 0),
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 3, 12, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-day ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 16, 28, 27), local(2011, 0, 5, 21, 34, 12), 4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 4, 0, 0),
    local(2011, 0, 5, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 2-day ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 2, 16, 28, 27), local(2011, 0, 9, 21, 34, 12), 4), [
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 5, 0, 0),
    local(2011, 0, 7, 0, 0),
    local(2011, 0, 9, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-week ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 1, 16, 28, 27), local(2011, 0, 23, 21, 34, 12), 4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 9, 0, 0),
    local(2011, 0, 16, 0, 0),
    local(2011, 0, 23, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-month ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2011, 0, 18), local(2011, 4, 2), 4), [
    local(2011, 1, 1, 0, 0),
    local(2011, 2, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 4, 1, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 3-month ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2010, 11, 18), local(2011, 10, 2), 4), [
    local(2011, 0, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 6, 1, 0, 0),
    local(2011, 9, 1, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate 1-year ticks", () => {
  assert.deepStrictEqual(timeTicks(local(2010, 11, 18), local(2014, 2, 2), 4), [
    local(2011, 0, 1, 0, 0),
    local(2012, 0, 1, 0, 0),
    local(2013, 0, 1, 0, 0),
    local(2014, 0, 1, 0, 0),
  ])
})

it("timeTicks(start, stop, count) can generate multi-year ticks", () => {
  assert.deepStrictEqual(timeTicks(local(0, 11, 18), local(2014, 2, 2), 6), [
    local(500, 0, 1, 0, 0),
    local(1000, 0, 1, 0, 0),
    local(1500, 0, 1, 0, 0),
    local(2000, 0, 1, 0, 0),
  ])
})

it("timeTicks(start, stop, count) returns one tick for an empty domain", () => {
  assert.deepStrictEqual(timeTicks(local(2014, 2, 2), local(2014, 2, 2), 6), [local(2014, 2, 2)])
})

it("timeTicks(start, stop, count) returns descending ticks for a descending domain", () => {
  assert.deepStrictEqual(timeTicks(local(2014, 2, 2), local(2010, 11, 18), 4), [
    local(2014, 0, 1, 0, 0),
    local(2013, 0, 1, 0, 0),
    local(2012, 0, 1, 0, 0),
    local(2011, 0, 1, 0, 0),
  ])
  assert.deepStrictEqual(timeTicks(local(2011, 10, 2), local(2010, 11, 18), 4), [
    local(2011, 9, 1, 0, 0),
    local(2011, 6, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 0, 1, 0, 0),
  ])
})
import assert from "assert"
import { timeTuesday, timeTuesdays } from "../src/index.js"
import { local } from "./date.js"

it("timeTuesdays in an alias for timeTuesday.range", () => {
  assert.strictEqual(timeTuesdays, timeTuesday.range)
})

it("timeTuesday.floor(date) returns Tuesdays", () => {
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 2, 23, 59, 59)), local(2010, 11, 28))
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 3, 0, 0, 0)), local(2010, 11, 28))
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 3, 0, 0, 1)), local(2010, 11, 28))
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 3, 23, 59, 59)), local(2010, 11, 28))
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 4, 0, 0, 0)), local(2011, 0, 4))
  assert.deepStrictEqual(timeTuesday.floor(local(2011, 0, 4, 0, 0, 1)), local(2011, 0, 4))
})

it("timeTuesday.count(start, end) counts Tuesdays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(timeTuesday.count(local(2014, 0, 1), local(2014, 0, 6)), 0)
  assert.strictEqual(timeTuesday.count(local(2014, 0, 1), local(2014, 0, 7)), 1)
  assert.strictEqual(timeTuesday.count(local(2014, 0, 1), local(2014, 0, 8)), 1)
  assert.strictEqual(timeTuesday.count(local(2014, 0, 1), local(2014, 0, 14)), 2)

  //     January 2013
  // Su Mo Tu We Th Fr Sa
  //        1  2  3  4  5
  //  6  7  8  9 10 11 12
  // 13 14 15 16 17 18 19
  // 20 21 22 23 24 25 26
  // 27 28 29 30 31
  assert.strictEqual(timeTuesday.count(local(2013, 0, 1), local(2013, 0, 7)), 0)
  assert.strictEqual(timeTuesday.count(local(2013, 0, 1), local(2013, 0, 8)), 1)
  assert.strictEqual(timeTuesday.count(local(2013, 0, 1), local(2013, 0, 9)), 1)
})

it("timeTuesday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeTuesday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcDay, utcDays } from "../src/index.js"
import { utc } from "./date.js"

it("utcDays in an alias for utcDay.range", () => {
  assert.strictEqual(utcDays, utcDay.range)
})

it("utcDay.floor(date) returns days", () => {
  assert.deepStrictEqual(utcDay.floor(utc(2010, 11, 31, 23)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 0, 1, 0)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 0, 1, 1)), utc(2011, 0, 1))
})

it("utcDay.floor(date) does not observe daylight saving", () => {
  assert.deepStrictEqual(utcDay.floor(utc(2011, 2, 13, 7)), utc(2011, 2, 13))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 2, 13, 8)), utc(2011, 2, 13))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 2, 13, 9)), utc(2011, 2, 13))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 2, 13, 10)), utc(2011, 2, 13))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 10, 6, 5)), utc(2011, 10, 6))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 10, 6, 6)), utc(2011, 10, 6))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 10, 6, 7)), utc(2011, 10, 6))
  assert.deepStrictEqual(utcDay.floor(utc(2011, 10, 6, 8)), utc(2011, 10, 6))
})

it("utcDay.round(date) returns days", () => {
  assert.deepStrictEqual(utcDay.round(utc(2010, 11, 30, 13)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcDay.round(utc(2010, 11, 30, 11)), utc(2010, 11, 30))
})

it("utcDay.ceil(date) returns days", () => {
  assert.deepStrictEqual(utcDay.ceil(utc(2010, 11, 30, 23)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcDay.ceil(utc(2010, 11, 31, 0)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcDay.ceil(utc(2010, 11, 31, 1)), utc(2011, 0, 1))
})

it("utcDay.ceil(date) does not observe daylight saving", () => {
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 2, 13, 7)), utc(2011, 2, 14))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 2, 13, 8)), utc(2011, 2, 14))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 2, 13, 9)), utc(2011, 2, 14))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 2, 13, 10)), utc(2011, 2, 14))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 10, 6, 5)), utc(2011, 10, 7))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 10, 6, 6)), utc(2011, 10, 7))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 10, 6, 7)), utc(2011, 10, 7))
  assert.deepStrictEqual(utcDay.ceil(utc(2011, 10, 6, 8)), utc(2011, 10, 7))
})

it("utcDay.offset(date) is an alias for utcDay.offset(date, 1)", () => {
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2011, 0, 1, 23, 59, 59, 999))
})

it("utcDay.offset(date, step) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcDay.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcDay.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 1, 23, 59, 59, 999))
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 29, 23, 59, 59, 456))
})

it("utcDay.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31), -1), utc(2010, 11, 30))
  assert.deepStrictEqual(utcDay.offset(utc(2011, 0, 1), -2), utc(2010, 11, 30))
  assert.deepStrictEqual(utcDay.offset(utc(2011, 0, 1), -1), utc(2010, 11, 31))
})

it("utcDay.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31), +1), utc(2011, 0, 1))
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 30), +2), utc(2011, 0, 1))
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 30), +1), utc(2010, 11, 31))
})

it("utcDay.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcDay.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcDay.count(start, end) counts days after start (exclusive) and before end (inclusive)", () => {
  assert.strictEqual(utcDay.count(utc(2011, 0, 1, 0), utc(2011, 4, 9, 0)), 128)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1, 1), utc(2011, 4, 9, 0)), 128)
  assert.strictEqual(utcDay.count(utc(2010, 11, 31, 23), utc(2011, 4, 9, 0)), 129)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1, 0), utc(2011, 4, 8, 23)), 127)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1, 0), utc(2011, 4, 9, 1)), 128)
})

it("utcDay.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 71)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 71)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 71)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 309)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 309)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 309)
})

it("utcDay.count(start, end) returns 364 or 365 for a full year", () => {
  assert.strictEqual(utcDay.count(utc(1999, 0, 1), utc(1999, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2000, 0, 1), utc(2000, 11, 31)), 365) // leap year
  assert.strictEqual(utcDay.count(utc(2001, 0, 1), utc(2001, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2002, 0, 1), utc(2002, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2003, 0, 1), utc(2003, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2004, 0, 1), utc(2004, 11, 31)), 365) // leap year
  assert.strictEqual(utcDay.count(utc(2005, 0, 1), utc(2005, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2006, 0, 1), utc(2006, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2007, 0, 1), utc(2007, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2008, 0, 1), utc(2008, 11, 31)), 365) // leap year
  assert.strictEqual(utcDay.count(utc(2009, 0, 1), utc(2009, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2010, 0, 1), utc(2010, 11, 31)), 364)
  assert.strictEqual(utcDay.count(utc(2011, 0, 1), utc(2011, 11, 31)), 364)
})

it("utcDay.every(step) returns every stepth day, starting with the first day of the month", () => {
  assert.deepStrictEqual(utcDay.every(3).range(utc(2008, 11, 30, 0, 12), utc(2009, 0, 5, 23, 48)), [
    utc(2008, 11, 31),
    utc(2009, 0, 1),
    utc(2009, 0, 4),
  ])
  assert.deepStrictEqual(utcDay.every(5).range(utc(2008, 11, 30, 0, 12), utc(2009, 0, 6, 23, 48)), [
    utc(2008, 11, 31),
    utc(2009, 0, 1),
    utc(2009, 0, 6),
  ])
  assert.deepStrictEqual(utcDay.every(7).range(utc(2008, 11, 30, 0, 12), utc(2009, 0, 8, 23, 48)), [
    utc(2009, 0, 1),
    utc(2009, 0, 8),
  ])
})
import assert from "assert"
import { utcFriday, utcFridays } from "../src/index.js"
import { utc } from "./date.js"

it("utcFridays in an alias for utcFriday.range", () => {
  assert.strictEqual(utcFridays, utcFriday.range)
})

it("utcFriday.floor(date) returns Fridays", () => {
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 5, 23, 59, 59)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 6, 0, 0, 0)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 6, 0, 0, 1)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 6, 23, 59, 59)), utc(2010, 11, 31))
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 7, 0, 0, 0)), utc(2011, 0, 7))
  assert.deepStrictEqual(utcFriday.floor(utc(2011, 0, 7, 0, 0, 1)), utc(2011, 0, 7))
})

it("utcFriday.count(start, end) counts Fridays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(utcFriday.count(utc(2012, 0, 1), utc(2012, 0, 5)), 0)
  assert.strictEqual(utcFriday.count(utc(2012, 0, 1), utc(2012, 0, 6)), 1)
  assert.strictEqual(utcFriday.count(utc(2012, 0, 1), utc(2012, 0, 7)), 1)
  assert.strictEqual(utcFriday.count(utc(2012, 0, 1), utc(2012, 0, 13)), 2)

  //     January 2010
  // Su Mo Tu We Th Fr Sa
  //                 1  2
  //  3  4  5  6  7  8  9
  // 10 11 12 13 14 15 16
  // 17 18 19 20 21 22 23
  // 24 25 26 27 28 29 30
  // 31
  assert.strictEqual(utcFriday.count(utc(2010, 0, 1), utc(2010, 0, 7)), 0)
  assert.strictEqual(utcFriday.count(utc(2010, 0, 1), utc(2010, 0, 8)), 1)
  assert.strictEqual(utcFriday.count(utc(2010, 0, 1), utc(2010, 0, 9)), 1)
})

it("utcFriday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcFriday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcHour } from "../src/index.js"
import { utc } from "./date.js"

it("utcHour.floor(date) returns hours", () => {
  assert.deepStrictEqual(utcHour.floor(utc(2010, 11, 31, 23, 59)), utc(2010, 11, 31, 23))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 0, 1, 0, 0)), utc(2011, 0, 1, 0))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 0, 1, 0, 1)), utc(2011, 0, 1, 0))
})

it("utcHour.floor(date) observes start of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 8, 59)), utc(2011, 2, 13, 8))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 9, 0)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 9, 1)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 9, 59)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 10, 0)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 2, 13, 10, 1)), utc(2011, 2, 13, 10))
})

it("utcHour.floor(date) observes end of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 7, 59)), utc(2011, 10, 6, 7))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 8, 0)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 8, 1)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 8, 59)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 9, 0)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(utcHour.floor(utc(2011, 10, 6, 9, 1)), utc(2011, 10, 6, 9))
})

it("utcHour.ceil(date) returns hours", () => {
  assert.deepStrictEqual(utcHour.ceil(utc(2010, 11, 31, 23, 59)), utc(2011, 0, 1, 0))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 0, 1, 0, 0)), utc(2011, 0, 1, 0))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 0, 1, 0, 1)), utc(2011, 0, 1, 1))
})

it("utcHour.ceil(date) observes start of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 8, 59)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 9, 0)), utc(2011, 2, 13, 9))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 9, 1)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 9, 59)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 10, 0)), utc(2011, 2, 13, 10))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 2, 13, 10, 1)), utc(2011, 2, 13, 11))
})

it("utcHour.ceil(date) observes end of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 7, 59)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 8, 0)), utc(2011, 10, 6, 8))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 8, 1)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 8, 59)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 9, 0)), utc(2011, 10, 6, 9))
  assert.deepStrictEqual(utcHour.ceil(utc(2011, 10, 6, 9, 1)), utc(2011, 10, 6, 10))
})

it("utcHour.offset(date) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcHour.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcHour.offset(date) does not round the passed-in-date", () => {
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 1, 0, 59, 59, 999))
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 31, 21, 59, 59, 456))
})

it("utcHour.offset(date) allows negative offsets", () => {
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 12), -1), utc(2010, 11, 31, 11))
  assert.deepStrictEqual(utcHour.offset(utc(2011, 0, 1, 1), -2), utc(2010, 11, 31, 23))
  assert.deepStrictEqual(utcHour.offset(utc(2011, 0, 1, 0), -1), utc(2010, 11, 31, 23))
})

it("utcHour.offset(date) allows positive offsets", () => {
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 11), +1), utc(2010, 11, 31, 12))
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23), +2), utc(2011, 0, 1, 1))
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23), +1), utc(2011, 0, 1, 0))
})

it("utcHour.offset(date) allows zero offset", () => {
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcHour.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcHour.range(start, stop) returns hours", () => {
  assert.deepStrictEqual(utcHour.range(utc(2010, 11, 31, 12, 30), utc(2010, 11, 31, 15, 30)), [
    utc(2010, 11, 31, 13),
    utc(2010, 11, 31, 14),
    utc(2010, 11, 31, 15),
  ])
})

it("utcHour.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(utcHour.range(utc(2010, 11, 31, 23), utc(2011, 0, 1, 2))[0], utc(2010, 11, 31, 23))
})

it("utcHour.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(utcHour.range(utc(2010, 11, 31, 23), utc(2011, 0, 1, 2))[2], utc(2011, 0, 1, 1))
})

it("utcHour.range(start, stop) can skip hours", () => {
  assert.deepStrictEqual(utcHour.range(utc(2011, 1, 1, 1), utc(2011, 1, 1, 13), 3), [
    utc(2011, 1, 1, 1),
    utc(2011, 1, 1, 4),
    utc(2011, 1, 1, 7),
    utc(2011, 1, 1, 10),
  ])
})

it("utcHour.range(start, stop) does not observe the start of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.range(utc(2011, 2, 13, 1), utc(2011, 2, 13, 5)), [
    utc(2011, 2, 13, 1),
    utc(2011, 2, 13, 2),
    utc(2011, 2, 13, 3),
    utc(2011, 2, 13, 4),
  ])
})

it("utcHour.range(start, stop) does not observe the end of daylight savings time", () => {
  assert.deepStrictEqual(utcHour.range(utc(2011, 10, 6, 0), utc(2011, 10, 6, 2)), [
    utc(2011, 10, 6, 0),
    utc(2011, 10, 6, 1),
  ])
})

it("utcHour.every(step) returns every stepth hour, starting with the first hour of the day", () => {
  assert.deepStrictEqual(utcHour.every(4).range(utc(2008, 11, 30, 12, 47), utc(2008, 11, 31, 13, 57)), [
    utc(2008, 11, 30, 16),
    utc(2008, 11, 30, 20),
    utc(2008, 11, 31, 0),
    utc(2008, 11, 31, 4),
    utc(2008, 11, 31, 8),
    utc(2008, 11, 31, 12),
  ])
  assert.deepStrictEqual(utcHour.every(12).range(utc(2008, 11, 30, 12, 47), utc(2008, 11, 31, 13, 57)), [
    utc(2008, 11, 31, 0),
    utc(2008, 11, 31, 12),
  ])
})
import assert from "assert"
import { timeMillisecond, utcMillisecond } from "../src/index.js"

it("utcMillisecond is an alias for timeMillisecond", () => {
  assert.strictEqual(utcMillisecond, timeMillisecond)
})
import assert from "assert"
import { utcMinute } from "../src/index.js"
import { utc } from "./date.js"

it("utcMinute.floor(date) returns minutes", () => {
  assert.deepStrictEqual(utcMinute.floor(utc(2010, 11, 31, 23, 59, 59)), utc(2010, 11, 31, 23, 59))
  assert.deepStrictEqual(utcMinute.floor(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(utcMinute.floor(utc(2011, 0, 1, 0, 0, 59)), utc(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(utcMinute.floor(utc(2011, 0, 1, 0, 1, 0)), utc(2011, 0, 1, 0, 1))
})

it("utcMinute.ceil(date) returns minutes", () => {
  assert.deepStrictEqual(utcMinute.ceil(utc(2010, 11, 31, 23, 59, 59)), utc(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(utcMinute.ceil(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 1, 0, 0))
  assert.deepStrictEqual(utcMinute.ceil(utc(2011, 0, 1, 0, 0, 59)), utc(2011, 0, 1, 0, 1))
  assert.deepStrictEqual(utcMinute.ceil(utc(2011, 0, 1, 0, 1, 0)), utc(2011, 0, 1, 0, 1))
})

it("utcMinute.offset(date) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcMinute.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcMinute.offset(date) does not round the passed-in-date", () => {
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 1, 0, 0, 59, 999))
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 31, 23, 57, 59, 456))
})

it("utcMinute.offset(date) allows negative offsets", () => {
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 12), -1), utc(2010, 11, 31, 23, 11))
  assert.deepStrictEqual(utcMinute.offset(utc(2011, 0, 1, 0, 1), -2), utc(2010, 11, 31, 23, 59))
  assert.deepStrictEqual(utcMinute.offset(utc(2011, 0, 1, 0, 0), -1), utc(2010, 11, 31, 23, 59))
})

it("utcMinute.offset(date) allows positive offsets", () => {
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 11), +1), utc(2010, 11, 31, 23, 12))
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59), +2), utc(2011, 0, 1, 0, 1))
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59), +1), utc(2011, 0, 1, 0, 0))
})

it("utcMinute.offset(date) allows zero offset", () => {
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcMinute.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcMinute.range(start, stop), returns minutes", () => {
  assert.deepStrictEqual(utcMinute.range(utc(2010, 11, 31, 23, 59), utc(2011, 0, 1, 0, 2)), [
    utc(2010, 11, 31, 23, 59),
    utc(2011, 0, 1, 0, 0),
    utc(2011, 0, 1, 0, 1),
  ])
})

it("utcMinute.range(start, stop), has an inclusive lower bound", () => {
  assert.deepStrictEqual(
    utcMinute.range(utc(2010, 11, 31, 23, 59), utc(2011, 0, 1, 0, 2))[0],
    utc(2010, 11, 31, 23, 59)
  )
})

it("utcMinute.range(start, stop), has an exclusive upper bound", () => {
  assert.deepStrictEqual(utcMinute.range(utc(2010, 11, 31, 23, 59), utc(2011, 0, 1, 0, 2))[2], utc(2011, 0, 1, 0, 1))
})

it("utcMinute.range(start, stop), can skip minutes", () => {
  assert.deepStrictEqual(utcMinute.range(utc(2011, 1, 1, 12, 7), utc(2011, 1, 1, 13, 7), 15), [
    utc(2011, 1, 1, 12, 7),
    utc(2011, 1, 1, 12, 22),
    utc(2011, 1, 1, 12, 37),
    utc(2011, 1, 1, 12, 52),
  ])
})

it("utcMinute.range(start, stop), observes start of daylight savings time", () => {
  assert.deepStrictEqual(utcMinute.range(utc(2011, 2, 13, 9, 59), utc(2011, 2, 13, 10, 2)), [
    utc(2011, 2, 13, 9, 59),
    utc(2011, 2, 13, 10, 0),
    utc(2011, 2, 13, 10, 1),
  ])
})

it("utcMinute.range(start, stop), observes end of daylight savings time", () => {
  assert.deepStrictEqual(utcMinute.range(utc(2011, 10, 6, 8, 59), utc(2011, 10, 6, 9, 2)), [
    utc(2011, 10, 6, 8, 59),
    utc(2011, 10, 6, 9, 0),
    utc(2011, 10, 6, 9, 1),
  ])
})

it("utcMinute.every(step) returns every stepth minute, starting with the first minute of the hour", () => {
  assert.deepStrictEqual(utcMinute.every(15).range(utc(2008, 11, 30, 12, 47), utc(2008, 11, 30, 13, 57)), [
    utc(2008, 11, 30, 13, 0),
    utc(2008, 11, 30, 13, 15),
    utc(2008, 11, 30, 13, 30),
    utc(2008, 11, 30, 13, 45),
  ])
  assert.deepStrictEqual(utcMinute.every(30).range(utc(2008, 11, 30, 12, 47), utc(2008, 11, 30, 13, 57)), [
    utc(2008, 11, 30, 13, 0),
    utc(2008, 11, 30, 13, 30),
  ])
})
import assert from "assert"
import { utcMonday, utcMondays } from "../src/index.js"
import { utc } from "./date.js"

it("utcMondays in an alias for utcMonday.range", () => {
  assert.strictEqual(utcMondays, utcMonday.range)
})

it("utcMonday.floor(date) returns Mondays", () => {
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 1, 23, 59, 59)), utc(2010, 11, 27))
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 2, 0, 0, 0)), utc(2010, 11, 27))
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 2, 0, 0, 1)), utc(2010, 11, 27))
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 2, 23, 59, 59)), utc(2010, 11, 27))
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 3, 0, 0, 0)), utc(2011, 0, 3))
  assert.deepStrictEqual(utcMonday.floor(utc(2011, 0, 3, 0, 0, 1)), utc(2011, 0, 3))
})

it("utcMonday.range(start, stop, step) returns every step Monday", () => {
  assert.deepStrictEqual(utcMonday.range(utc(2011, 11, 1), utc(2012, 0, 15), 2), [
    utc(2011, 11, 5),
    utc(2011, 11, 19),
    utc(2012, 0, 2),
  ])
})

it("utcMonday.count(start, end) counts Mondays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(utcMonday.count(utc(2014, 0, 1), utc(2014, 0, 5)), 0)
  assert.strictEqual(utcMonday.count(utc(2014, 0, 1), utc(2014, 0, 6)), 1)
  assert.strictEqual(utcMonday.count(utc(2014, 0, 1), utc(2014, 0, 7)), 1)
  assert.strictEqual(utcMonday.count(utc(2014, 0, 1), utc(2014, 0, 13)), 2)

  //     January 2018
  // Su Mo Tu We Th Fr Sa
  //     1  2  3  4  5  6
  //  7  8  9 10 11 12 13
  // 14 15 16 17 18 19 20
  // 21 22 23 24 25 26 27
  // 28 29 30 31
  assert.strictEqual(utcMonday.count(utc(2018, 0, 1), utc(2018, 0, 7)), 0)
  assert.strictEqual(utcMonday.count(utc(2018, 0, 1), utc(2018, 0, 8)), 1)
  assert.strictEqual(utcMonday.count(utc(2018, 0, 1), utc(2018, 0, 9)), 1)
})

it("utcMonday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcMonday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcMonth, utcMonths } from "../src/index.js"
import { utc } from "./date.js"

it("utcMonths in an alias for utcMonth.range", () => {
  assert.strictEqual(utcMonths, utcMonth.range)
})

it("utcMonth.floor(date) returns months", () => {
  assert.deepStrictEqual(utcMonth.floor(utc(2010, 11, 31, 23)), utc(2010, 11, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 0, 1, 0)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 0, 1, 1)), utc(2011, 0, 1))
})

it("utcMonth.floor(date) observes daylight saving", () => {
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 2, 13, 7)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 2, 13, 8)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 2, 13, 9)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 2, 13, 10)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 10, 6, 7)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 10, 6, 8)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 10, 6, 9)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.floor(utc(2011, 10, 6, 10)), utc(2011, 10, 1))
})

it("utcMonth.floor(date) handles years in the first century", () => {
  assert.deepStrictEqual(utcMonth.floor(utc(9, 10, 6, 7)), utc(9, 10, 1))
})

it("utcMonth.round(date) returns months", () => {
  assert.deepStrictEqual(utcMonth.round(utc(2010, 11, 16, 12)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2010, 11, 16, 11)), utc(2010, 11, 1))
})

it("utcMonth.round(date) observes daylight saving", () => {
  assert.deepStrictEqual(utcMonth.round(utc(2011, 2, 13, 7)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 2, 13, 8)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 2, 13, 9)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 2, 13, 20)), utc(2011, 2, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 10, 6, 7)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 10, 6, 8)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 10, 6, 9)), utc(2011, 10, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2011, 10, 6, 20)), utc(2011, 10, 1))
})

it("utcMonth.round(date) handles midnight for leap years", () => {
  assert.deepStrictEqual(utcMonth.round(utc(2012, 2, 1, 0)), utc(2012, 2, 1))
  assert.deepStrictEqual(utcMonth.round(utc(2012, 2, 1, 0)), utc(2012, 2, 1))
})

it("utcMonth.ceil(date) returns months", () => {
  assert.deepStrictEqual(utcMonth.ceil(utc(2010, 10, 30, 23)), utc(2010, 11, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2010, 11, 1, 1)), utc(2011, 0, 1))
})

it("utcMonth.ceil(date) observes daylight saving", () => {
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 2, 13, 7)), utc(2011, 3, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 2, 13, 8)), utc(2011, 3, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 2, 13, 9)), utc(2011, 3, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 2, 13, 10)), utc(2011, 3, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 10, 6, 7)), utc(2011, 11, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 10, 6, 8)), utc(2011, 11, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 10, 6, 9)), utc(2011, 11, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2011, 10, 6, 10)), utc(2011, 11, 1))
})

it("utcMonth.ceil(date) handles midnight for leap years", () => {
  assert.deepStrictEqual(utcMonth.ceil(utc(2012, 2, 1, 0)), utc(2012, 2, 1))
  assert.deepStrictEqual(utcMonth.ceil(utc(2012, 2, 1, 0)), utc(2012, 2, 1))
})

it("utcMonth.offset(date) is an alias for utcMonth.offset(date, 1)", () => {
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2011, 0, 31, 23, 59, 59, 999))
})

it("utcMonth.offset(date, step) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcMonth.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcMonth.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 9, 31, 23, 59, 59, 456))
})

it("utcMonth.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31), -1), utc(2010, 10, 31))
  assert.deepStrictEqual(utcMonth.offset(utc(2011, 0, 1), -2), utc(2010, 10, 1))
  assert.deepStrictEqual(utcMonth.offset(utc(2011, 0, 1), -1), utc(2010, 11, 1))
})

it("utcMonth.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31), +1), utc(2011, 0, 31))
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 30), +2), utc(2011, 1, 30))
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 30), +1), utc(2011, 0, 30))
})

it("utcMonth.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcMonth.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcMonth.range(start, stop) returns months between start (inclusive) and stop (exclusive)", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 11, 1), utc(2012, 5, 1)), [
    utc(2011, 11, 1),
    utc(2012, 0, 1),
    utc(2012, 1, 1),
    utc(2012, 2, 1),
    utc(2012, 3, 1),
    utc(2012, 4, 1),
  ])
})

it("utcMonth.range(start, stop) returns months", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 10, 4, 2), utc(2012, 4, 10, 13)), [
    utc(2011, 11, 1),
    utc(2012, 0, 1),
    utc(2012, 1, 1),
    utc(2012, 2, 1),
    utc(2012, 3, 1),
    utc(2012, 4, 1),
  ])
})

it("utcMonth.range(start, stop) coerces start and stop to dates", () => {
  assert.deepStrictEqual(utcMonth.range(+utc(2011, 10, 4), +utc(2012, 1, 7)), [
    utc(2011, 11, 1),
    utc(2012, 0, 1),
    utc(2012, 1, 1),
  ])
})

it("utcMonth.range(start, stop) returns the empty array for invalid dates", () => {
  assert.deepStrictEqual(utcMonth.range(new Date(NaN), Infinity), [])
})

it("utcMonth.range(start, stop) returns the empty array if start >= stop", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 11, 10), utc(2011, 10, 4)), [])
  assert.deepStrictEqual(utcMonth.range(utc(2011, 10, 1), utc(2011, 10, 1)), [])
})

it("utcMonth.range(start, stop) returns months", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2010, 10, 31), utc(2011, 2, 1)), [
    utc(2010, 11, 1),
    utc(2011, 0, 1),
    utc(2011, 1, 1),
  ])
})

it("utcMonth.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2010, 10, 31), utc(2011, 2, 1))[0], utc(2010, 11, 1))
})

it("utcMonth.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2010, 10, 31), utc(2011, 2, 1))[2], utc(2011, 1, 1))
})

it("utcMonth.range(start, stop) can skip months", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 1, 1), utc(2012, 1, 1), 3), [
    utc(2011, 1, 1),
    utc(2011, 4, 1),
    utc(2011, 7, 1),
    utc(2011, 10, 1),
  ])
})

it("utcMonth.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 0, 1), utc(2011, 4, 1)), [
    utc(2011, 0, 1),
    utc(2011, 1, 1),
    utc(2011, 2, 1),
    utc(2011, 3, 1),
  ])
})

it("utcMonth.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(utcMonth.range(utc(2011, 9, 1), utc(2012, 1, 1)), [
    utc(2011, 9, 1),
    utc(2011, 10, 1),
    utc(2011, 11, 1),
    utc(2012, 0, 1),
  ])
})

it("utcMonth.count(start, end) counts months after start (exclusive) and before end (inclusive)", () => {
  assert.strictEqual(utcMonth.count(utc(2011, 0, 1), utc(2011, 4, 1)), 4)
  assert.strictEqual(utcMonth.count(utc(2011, 0, 1), utc(2011, 3, 30)), 3)
  assert.strictEqual(utcMonth.count(utc(2010, 11, 31), utc(2011, 3, 30)), 4)
  assert.strictEqual(utcMonth.count(utc(2010, 11, 31), utc(2011, 4, 1)), 5)
  assert.strictEqual(utcMonth.count(utc(2009, 11, 31), utc(2012, 4, 1)), 29)
  assert.strictEqual(utcMonth.count(utc(2012, 4, 1), utc(2009, 11, 31)), -29)
})

it("utcMonth.every(step) returns every stepth month, starting with the first month of the year", () => {
  assert.deepStrictEqual(utcMonth.every(3).range(utc(2008, 11, 3), utc(2010, 6, 5)), [
    utc(2009, 0, 1),
    utc(2009, 3, 1),
    utc(2009, 6, 1),
    utc(2009, 9, 1),
    utc(2010, 0, 1),
    utc(2010, 3, 1),
    utc(2010, 6, 1),
  ])
})
import assert from "assert"
import { utcYear } from "../src/index.js"
import { utc } from "./date.js"

it("utcYear.every(n).floor(date) returns integer multiples of n years", () => {
  assert.deepStrictEqual(utcYear.every(10).floor(utc(2009, 11, 31, 23, 59, 59)), utc(2000, 0, 1))
  assert.deepStrictEqual(utcYear.every(10).floor(utc(2010, 0, 1, 0, 0, 0)), utc(2010, 0, 1))
  assert.deepStrictEqual(utcYear.every(10).floor(utc(2010, 0, 1, 0, 0, 1)), utc(2010, 0, 1))
})

it("utcYear.every(n).ceil(date) returns integer multiples of n years", () => {
  assert.deepStrictEqual(utcYear.every(100).ceil(utc(1999, 11, 31, 23, 59, 59)), utc(2000, 0, 1))
  assert.deepStrictEqual(utcYear.every(100).ceil(utc(2000, 0, 1, 0, 0, 0)), utc(2000, 0, 1))
  assert.deepStrictEqual(utcYear.every(100).ceil(utc(2000, 0, 1, 0, 0, 1)), utc(2100, 0, 1))
})

it("utcYear.every(n).offset(date, count) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcYear.every(5).offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcYear.every(n).offset(date, count) does not round the passed-in-date", () => {
  assert.deepStrictEqual(
    utcYear.every(5).offset(utc(2010, 11, 31, 23, 59, 59, 999), +1),
    utc(2015, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    utcYear.every(5).offset(utc(2010, 11, 31, 23, 59, 59, 456), -2),
    utc(2000, 11, 31, 23, 59, 59, 456)
  )
})

it("utcYear.every(n) does not define interval.count or interval.every", () => {
  const decade = utcYear.every(10)
  assert.strictEqual(decade.count, undefined)
  assert.strictEqual(decade.every, undefined)
})

it("utcYear.every(n).range(start, stop) returns multiples of n years", () => {
  assert.deepStrictEqual(utcYear.every(10).range(utc(2010, 0, 1), utc(2031, 0, 1)), [
    utc(2010, 0, 1),
    utc(2020, 0, 1),
    utc(2030, 0, 1),
  ])
})
import assert from "assert"
import { utcSaturday, utcSaturdays } from "../src/index.js"
import { utc } from "./date.js"

it("utcSaturdays in an alias for utcSaturday.range", () => {
  assert.strictEqual(utcSaturdays, utcSaturday.range)
})

it("utcSaturday.floor(date) returns Saturdays", () => {
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 6, 23, 59, 59)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 7, 0, 0, 0)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 7, 0, 0, 1)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 7, 23, 59, 59)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 8, 0, 0, 0)), utc(2011, 0, 8))
  assert.deepStrictEqual(utcSaturday.floor(utc(2011, 0, 8, 0, 0, 1)), utc(2011, 0, 8))
})

it("utcSaturday.count(start, end) counts Saturdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(utcSaturday.count(utc(2012, 0, 1), utc(2012, 0, 6)), 0)
  assert.strictEqual(utcSaturday.count(utc(2012, 0, 1), utc(2012, 0, 7)), 1)
  assert.strictEqual(utcSaturday.count(utc(2012, 0, 1), utc(2012, 0, 8)), 1)
  assert.strictEqual(utcSaturday.count(utc(2012, 0, 1), utc(2012, 0, 14)), 2)

  //     January 2011
  // Su Mo Tu We Th Fr Sa
  //                    1
  //  2  3  4  5  6  7  8
  //  9 10 11 12 13 14 15
  // 16 17 18 19 20 21 22
  // 23 24 25 26 27 28 29
  // 30 31
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 0, 7)), 0)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 0, 8)), 1)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 0, 9)), 1)
})

it("utcSaturday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcSaturday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcSecond } from "../src/index.js"
import { utc } from "./date.js"

it("utcSecond.floor(date) returns seconds", () => {
  assert.deepStrictEqual(utcSecond.floor(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2010, 11, 31, 23, 59, 59))
  assert.deepStrictEqual(utcSecond.floor(utc(2011, 0, 1, 0, 0, 0, 0)), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.floor(utc(2011, 0, 1, 0, 0, 0, 1)), utc(2011, 0, 1, 0, 0, 0))
})

it("utcSecond.round(date) returns seconds", () => {
  assert.deepStrictEqual(utcSecond.round(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.round(utc(2011, 0, 1, 0, 0, 0, 499)), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.round(utc(2011, 0, 1, 0, 0, 0, 500)), utc(2011, 0, 1, 0, 0, 1))
})

it("utcSecond.ceil(date) returns seconds", () => {
  assert.deepStrictEqual(utcSecond.ceil(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.ceil(utc(2011, 0, 1, 0, 0, 0, 0)), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.ceil(utc(2011, 0, 1, 0, 0, 0, 1)), utc(2011, 0, 1, 0, 0, 1))
})

it("utcSecond.offset(date, step) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcSecond.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcSecond.offset(date, step) does not round the passed-in-date", () => {
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 1, 0, 0, 0, 999))
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 31, 23, 59, 57, 456))
})

it("utcSecond.offset(date, step) allows negative offsets", () => {
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 59), -1), utc(2010, 11, 31, 23, 59, 58))
  assert.deepStrictEqual(utcSecond.offset(utc(2011, 0, 1, 0, 0, 0), -2), utc(2010, 11, 31, 23, 59, 58))
  assert.deepStrictEqual(utcSecond.offset(utc(2011, 0, 1, 0, 0, 0), -1), utc(2010, 11, 31, 23, 59, 59))
})

it("utcSecond.offset(date, step) allows positive offsets", () => {
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 58), +1), utc(2010, 11, 31, 23, 59, 59))
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 58), +2), utc(2011, 0, 1, 0, 0, 0))
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 59), +1), utc(2011, 0, 1, 0, 0, 0))
})

it("utcSecond.offset(date, step) allows zero offset", () => {
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcSecond.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcSecond.range(start, stop) returns seconds", () => {
  assert.deepStrictEqual(utcSecond.range(utc(2010, 11, 31, 23, 59, 59), utc(2011, 0, 1, 0, 0, 2)), [
    utc(2010, 11, 31, 23, 59, 59),
    utc(2011, 0, 1, 0, 0, 0),
    utc(2011, 0, 1, 0, 0, 1),
  ])
})

it("utcSecond.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(
    utcSecond.range(utc(2010, 11, 31, 23, 59, 59), utc(2011, 0, 1, 0, 0, 2))[0],
    utc(2010, 11, 31, 23, 59, 59)
  )
})

it("utcSecond.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(
    utcSecond.range(utc(2010, 11, 31, 23, 59, 59), utc(2011, 0, 1, 0, 0, 2))[2],
    utc(2011, 0, 1, 0, 0, 1)
  )
})

it("utcSecond.range(start, stop, step) can skip seconds", () => {
  assert.deepStrictEqual(utcSecond.range(utc(2011, 1, 1, 12, 0, 7), utc(2011, 1, 1, 12, 1, 7), 15), [
    utc(2011, 1, 1, 12, 0, 7),
    utc(2011, 1, 1, 12, 0, 22),
    utc(2011, 1, 1, 12, 0, 37),
    utc(2011, 1, 1, 12, 0, 52),
  ])
})

it("utcSecond.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(utcSecond.range(utc(2011, 2, 13, 9, 59, 59), utc(2011, 2, 13, 10, 0, 2)), [
    utc(2011, 2, 13, 9, 59, 59),
    utc(2011, 2, 13, 10, 0, 0),
    utc(2011, 2, 13, 10, 0, 1),
  ])
})

it("utcSecond.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(utcSecond.range(utc(2011, 10, 6, 8, 59, 59), utc(2011, 10, 6, 9, 0, 2)), [
    utc(2011, 10, 6, 8, 59, 59),
    utc(2011, 10, 6, 9, 0, 0),
    utc(2011, 10, 6, 9, 0, 1),
  ])
})

it("utcSecond.every(step) returns every stepth second, starting with the first second of the minute", () => {
  assert.deepStrictEqual(utcSecond.every(15).range(utc(2008, 11, 30, 12, 36, 47), utc(2008, 11, 30, 12, 37, 57)), [
    utc(2008, 11, 30, 12, 37, 0),
    utc(2008, 11, 30, 12, 37, 15),
    utc(2008, 11, 30, 12, 37, 30),
    utc(2008, 11, 30, 12, 37, 45),
  ])
  assert.deepStrictEqual(utcSecond.every(30).range(utc(2008, 11, 30, 12, 36, 47), utc(2008, 11, 30, 12, 37, 57)), [
    utc(2008, 11, 30, 12, 37, 0),
    utc(2008, 11, 30, 12, 37, 30),
  ])
})
import assert from "assert"
import { utcSunday, utcSundays } from "../src/index.js"
import { utc } from "./date.js"

it("utcSundays in an alias for utcSunday.range", () => {
  assert.strictEqual(utcSundays, utcSunday.range)
})

it("utcSunday.floor(date) returns Sundays", () => {
  assert.deepStrictEqual(utcSunday.floor(utc(2010, 11, 31, 23, 59, 59)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 0, 1, 0, 0, 0)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 0, 1, 0, 0, 1)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 0, 1, 23, 59, 59)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 0, 2, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 0, 2, 0, 0, 1)), utc(2011, 0, 2))
})

it("utcSunday.floor(date) observes daylight saving", () => {
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 2, 13, 1)), utc(2011, 2, 13))
  assert.deepStrictEqual(utcSunday.floor(utc(2011, 10, 6, 1)), utc(2011, 10, 6))
})

it("utcSunday.floor(date) handles years in the first century", () => {
  assert.deepStrictEqual(utcSunday.floor(utc(9, 10, 6, 7)), utc(9, 10, 1))
})

it("utcSunday.ceil(date) returns Sundays", () => {
  assert.deepStrictEqual(utcSunday.ceil(utc(2010, 11, 31, 23, 59, 59)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 0, 1, 0, 0, 1)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 0, 1, 23, 59, 59)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 0, 2, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 0, 2, 0, 0, 1)), utc(2011, 0, 9))
})

it("utcSunday.ceil(date) observes daylight saving", () => {
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 2, 13, 1)), utc(2011, 2, 20))
  assert.deepStrictEqual(utcSunday.ceil(utc(2011, 10, 6, 1)), utc(2011, 10, 13))
})

it("utcSunday.offset(date) is an alias for utcSunday.offset(date, 1)", () => {
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 31, 23, 59, 59, 999)), utc(2011, 0, 7, 23, 59, 59, 999))
})

it("utcSunday.offset(date, step) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcSunday.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcSunday.offset(date, step) does not round the passed-in date", () => {
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 7, 23, 59, 59, 999))
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 17, 23, 59, 59, 456))
})

it("utcSunday.offset(date, step) allows step to be negative", () => {
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 1), -1), utc(2010, 10, 24))
  assert.deepStrictEqual(utcSunday.offset(utc(2011, 0, 1), -2), utc(2010, 11, 18))
  assert.deepStrictEqual(utcSunday.offset(utc(2011, 0, 1), -1), utc(2010, 11, 25))
})

it("utcSunday.offset(date, step) allows step to be positive", () => {
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 10, 24), +1), utc(2010, 11, 1))
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 18), +2), utc(2011, 0, 1))
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 25), +1), utc(2011, 0, 1))
})

it("utcSunday.offset(date, step) allows step to be zero", () => {
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcSunday.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcSunday.range(start, stop) returns Sundays between start (inclusive) and stop (exclusive)", () => {
  assert.deepStrictEqual(utcSunday.range(utc(2011, 11, 1), utc(2012, 0, 15)), [
    utc(2011, 11, 4),
    utc(2011, 11, 11),
    utc(2011, 11, 18),
    utc(2011, 11, 25),
    utc(2012, 0, 1),
    utc(2012, 0, 8),
  ])
})

it("utcSunday.range(start, stop) returns Sundays", () => {
  assert.deepStrictEqual(utcSunday.range(utc(2011, 11, 1, 12, 23), utc(2012, 0, 14, 12, 23)), [
    utc(2011, 11, 4),
    utc(2011, 11, 11),
    utc(2011, 11, 18),
    utc(2011, 11, 25),
    utc(2012, 0, 1),
    utc(2012, 0, 8),
  ])
})

it("utcSunday.range(start, stop) coerces start and stop to dates", () => {
  assert.deepStrictEqual(utcSunday.range(+utc(2011, 11, 1), +utc(2012, 0, 15)), [
    utc(2011, 11, 4),
    utc(2011, 11, 11),
    utc(2011, 11, 18),
    utc(2011, 11, 25),
    utc(2012, 0, 1),
    utc(2012, 0, 8),
  ])
})

it("utcSunday.range(start, stop) returns the empty array for invalid dates", () => {
  assert.deepStrictEqual(utcSunday.range(new Date(NaN), Infinity), [])
})

it("utcSunday.range(start, stop) returns the empty array if start >= stop", () => {
  assert.deepStrictEqual(utcSunday.range(utc(2011, 11, 10), utc(2011, 10, 4)), [])
  assert.deepStrictEqual(utcSunday.range(utc(2011, 10, 1), utc(2011, 10, 1)), [])
})

it("utcSunday.range(start, stop, step) returns every step Sunday", () => {
  assert.deepStrictEqual(utcSunday.range(utc(2011, 11, 1), utc(2012, 0, 15), 2), [
    utc(2011, 11, 4),
    utc(2011, 11, 18),
    utc(2012, 0, 1),
  ])
})

it("utcSunday.count(start, end) counts Sundays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(utcSunday.count(utc(2014, 0, 1), utc(2014, 0, 4)), 0)
  assert.strictEqual(utcSunday.count(utc(2014, 0, 1), utc(2014, 0, 5)), 1)
  assert.strictEqual(utcSunday.count(utc(2014, 0, 1), utc(2014, 0, 6)), 1)
  assert.strictEqual(utcSunday.count(utc(2014, 0, 1), utc(2014, 0, 12)), 2)

  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(utcSunday.count(utc(2012, 0, 1), utc(2012, 0, 7)), 0)
  assert.strictEqual(utcSunday.count(utc(2012, 0, 1), utc(2012, 0, 8)), 1)
  assert.strictEqual(utcSunday.count(utc(2012, 0, 1), utc(2012, 0, 9)), 1)
})

it("utcSunday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 11)
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 11)
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 11)
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 45)
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 45)
  assert.strictEqual(utcSunday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 45)
})
import assert from "assert"
import { utc } from "./date.js"
import { utcThursday, utcThursdays } from "../src/index.js"

it("utcThursdays in an alias for utcThursday.range", () => {
  assert.strictEqual(utcThursdays, utcThursday.range)
})

it("utcThursday.floor(date) returns Thursdays", () => {
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 4, 23, 59, 59)), utc(2010, 11, 30))
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 5, 0, 0, 0)), utc(2010, 11, 30))
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 5, 0, 0, 1)), utc(2010, 11, 30))
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 5, 23, 59, 59)), utc(2010, 11, 30))
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 6, 0, 0, 0)), utc(2011, 0, 6))
  assert.deepStrictEqual(utcThursday.floor(utc(2011, 0, 6, 0, 0, 1)), utc(2011, 0, 6))
})

it("utcThursday.count(start, end) counts Thursdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(utcThursday.count(utc(2012, 0, 1), utc(2012, 0, 4)), 0)
  assert.strictEqual(utcThursday.count(utc(2012, 0, 1), utc(2012, 0, 5)), 1)
  assert.strictEqual(utcThursday.count(utc(2012, 0, 1), utc(2012, 0, 6)), 1)
  assert.strictEqual(utcThursday.count(utc(2012, 0, 1), utc(2012, 0, 12)), 2)

  //     January 2015
  // Su Mo Tu We Th Fr Sa
  //              1  2  3
  //  4  5  6  7  8  9 10
  // 11 12 13 14 15 16 17
  // 18 19 20 21 22 23 24
  // 25 26 27 28 29 30 31
  assert.strictEqual(utcThursday.count(utc(2015, 0, 1), utc(2015, 0, 7)), 0)
  assert.strictEqual(utcThursday.count(utc(2015, 0, 1), utc(2015, 0, 8)), 1)
  assert.strictEqual(utcThursday.count(utc(2015, 0, 1), utc(2015, 0, 9)), 1)
})

it("utcThursday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcThursday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcMinute, utcTicks } from "../src/index.js"
import { utc } from "./date.js"

it("utcTicks(start, stop, interval) respects the specified interval", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 1, 0), utc(2011, 0, 1, 12, 4, 4), utcMinute), [
    utc(2011, 0, 1, 12, 1),
    utc(2011, 0, 1, 12, 2),
    utc(2011, 0, 1, 12, 3),
    utc(2011, 0, 1, 12, 4),
  ])
})

it("utcTicks(start, stop, interval.every(step)) observes the specified tick interval and step", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 33, 4), utcMinute.every(10)), [
    utc(2011, 0, 1, 12, 0),
    utc(2011, 0, 1, 12, 10),
    utc(2011, 0, 1, 12, 20),
    utc(2011, 0, 1, 12, 30),
  ])
})

it("utcTicks(start, stop, count) can generate sub-second ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 1), 4), [
    utc(2011, 0, 1, 12, 0, 0, 0),
    utc(2011, 0, 1, 12, 0, 0, 200),
    utc(2011, 0, 1, 12, 0, 0, 400),
    utc(2011, 0, 1, 12, 0, 0, 600),
    utc(2011, 0, 1, 12, 0, 0, 800),
    utc(2011, 0, 1, 12, 0, 1, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-second ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 4), 4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 1),
    utc(2011, 0, 1, 12, 0, 2),
    utc(2011, 0, 1, 12, 0, 3),
    utc(2011, 0, 1, 12, 0, 4),
  ])
})

it("utcTicks(start, stop, count) can generate 5-second ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 20), 4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 5),
    utc(2011, 0, 1, 12, 0, 10),
    utc(2011, 0, 1, 12, 0, 15),
    utc(2011, 0, 1, 12, 0, 20),
  ])
})

it("utcTicks(start, stop, count) can generate 15-second ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 50), 4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 15),
    utc(2011, 0, 1, 12, 0, 30),
    utc(2011, 0, 1, 12, 0, 45),
  ])
})

it("utcTicks(start, stop, count) can generate 30-second ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 1, 50), 4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 30),
    utc(2011, 0, 1, 12, 1, 0),
    utc(2011, 0, 1, 12, 1, 30),
  ])
})

it("utcTicks(start, stop, count) can generate 1-minute ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 0, 27), utc(2011, 0, 1, 12, 4, 12), 4), [
    utc(2011, 0, 1, 12, 1),
    utc(2011, 0, 1, 12, 2),
    utc(2011, 0, 1, 12, 3),
    utc(2011, 0, 1, 12, 4),
  ])
})

it("utcTicks(start, stop, count) can generate 5-minute ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 3, 27), utc(2011, 0, 1, 12, 21, 12), 4), [
    utc(2011, 0, 1, 12, 5),
    utc(2011, 0, 1, 12, 10),
    utc(2011, 0, 1, 12, 15),
    utc(2011, 0, 1, 12, 20),
  ])
})

it("utcTicks(start, stop, count) can generate 15-minute ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 8, 27), utc(2011, 0, 1, 13, 4, 12), 4), [
    utc(2011, 0, 1, 12, 15),
    utc(2011, 0, 1, 12, 30),
    utc(2011, 0, 1, 12, 45),
    utc(2011, 0, 1, 13, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 30-minute ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 28, 27), utc(2011, 0, 1, 14, 4, 12), 4), [
    utc(2011, 0, 1, 12, 30),
    utc(2011, 0, 1, 13, 0),
    utc(2011, 0, 1, 13, 30),
    utc(2011, 0, 1, 14, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-hour ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 12, 28, 27), utc(2011, 0, 1, 16, 34, 12), 4), [
    utc(2011, 0, 1, 13, 0),
    utc(2011, 0, 1, 14, 0),
    utc(2011, 0, 1, 15, 0),
    utc(2011, 0, 1, 16, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 3-hour ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 14, 28, 27), utc(2011, 0, 2, 1, 34, 12), 4), [
    utc(2011, 0, 1, 15, 0),
    utc(2011, 0, 1, 18, 0),
    utc(2011, 0, 1, 21, 0),
    utc(2011, 0, 2, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 6-hour ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 2, 14, 34, 12), 4), [
    utc(2011, 0, 1, 18, 0),
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 2, 6, 0),
    utc(2011, 0, 2, 12, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 12-hour ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 3, 21, 34, 12), 4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 2, 12, 0),
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 3, 12, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-day ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 5, 21, 34, 12), 4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 4, 0, 0),
    utc(2011, 0, 5, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 2-day ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 2, 16, 28, 27), utc(2011, 0, 9, 21, 34, 12), 4), [
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 5, 0, 0),
    utc(2011, 0, 7, 0, 0),
    utc(2011, 0, 9, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-week ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 23, 21, 34, 12), 4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 9, 0, 0),
    utc(2011, 0, 16, 0, 0),
    utc(2011, 0, 23, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-month ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2011, 0, 18), utc(2011, 4, 2), 4), [
    utc(2011, 1, 1, 0, 0),
    utc(2011, 2, 1, 0, 0),
    utc(2011, 3, 1, 0, 0),
    utc(2011, 4, 1, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 3-month ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2010, 11, 18), utc(2011, 10, 2), 4), [
    utc(2011, 0, 1, 0, 0),
    utc(2011, 3, 1, 0, 0),
    utc(2011, 6, 1, 0, 0),
    utc(2011, 9, 1, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate 1-year ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(2010, 11, 18), utc(2014, 2, 2), 4), [
    utc(2011, 0, 1, 0, 0),
    utc(2012, 0, 1, 0, 0),
    utc(2013, 0, 1, 0, 0),
    utc(2014, 0, 1, 0, 0),
  ])
})

it("utcTicks(start, stop, count) can generate multi-year ticks", () => {
  assert.deepStrictEqual(utcTicks(utc(0, 11, 18), utc(2014, 2, 2), 6), [
    utc(500, 0, 1, 0, 0),
    utc(1000, 0, 1, 0, 0),
    utc(1500, 0, 1, 0, 0),
    utc(2000, 0, 1, 0, 0),
  ])
})

it("utcTicks(start, stop, count) returns one tick for an empty domain", () => {
  assert.deepStrictEqual(utcTicks(utc(2014, 2, 2), utc(2014, 2, 2), 6), [utc(2014, 2, 2)])
})

it("utcTicks(start, stop, count) returns descending ticks for a descending domain", () => {
  assert.deepStrictEqual(utcTicks(utc(2014, 2, 2), utc(2010, 11, 18), 4), [
    utc(2014, 0, 1, 0, 0),
    utc(2013, 0, 1, 0, 0),
    utc(2012, 0, 1, 0, 0),
    utc(2011, 0, 1, 0, 0),
  ])
  assert.deepStrictEqual(utcTicks(utc(2011, 10, 2), utc(2010, 11, 18), 4), [
    utc(2011, 9, 1, 0, 0),
    utc(2011, 6, 1, 0, 0),
    utc(2011, 3, 1, 0, 0),
    utc(2011, 0, 1, 0, 0),
  ])
})
import assert from "assert"
import { utcTuesday, utcTuesdays } from "../src/index.js"
import { utc } from "./date.js"

it("utcTuesdays in an alias for utcTuesday.range", () => {
  assert.strictEqual(utcTuesdays, utcTuesday.range)
})

it("utcTuesday.floor(date) returns Tuesdays", () => {
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 2, 23, 59, 59)), utc(2010, 11, 28))
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 3, 0, 0, 0)), utc(2010, 11, 28))
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 3, 0, 0, 1)), utc(2010, 11, 28))
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 3, 23, 59, 59)), utc(2010, 11, 28))
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 4, 0, 0, 0)), utc(2011, 0, 4))
  assert.deepStrictEqual(utcTuesday.floor(utc(2011, 0, 4, 0, 0, 1)), utc(2011, 0, 4))
})

it("utcTuesday.count(start, end) counts Tuesdays after start (exclusive) and before end (inclusive)", () => {
  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(utcTuesday.count(utc(2014, 0, 1), utc(2014, 0, 6)), 0)
  assert.strictEqual(utcTuesday.count(utc(2014, 0, 1), utc(2014, 0, 7)), 1)
  assert.strictEqual(utcTuesday.count(utc(2014, 0, 1), utc(2014, 0, 8)), 1)
  assert.strictEqual(utcTuesday.count(utc(2014, 0, 1), utc(2014, 0, 14)), 2)

  //     January 2013
  // Su Mo Tu We Th Fr Sa
  //        1  2  3  4  5
  //  6  7  8  9 10 11 12
  // 13 14 15 16 17 18 19
  // 20 21 22 23 24 25 26
  // 27 28 29 30 31
  assert.strictEqual(utcTuesday.count(utc(2013, 0, 1), utc(2013, 0, 7)), 0)
  assert.strictEqual(utcTuesday.count(utc(2013, 0, 1), utc(2013, 0, 8)), 1)
  assert.strictEqual(utcTuesday.count(utc(2013, 0, 1), utc(2013, 0, 9)), 1)
})

it("utcTuesday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcTuesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcWednesday, utcWednesdays } from "../src/index.js"
import { utc } from "./date.js"

it("utcWednesdays in an alias for utcWednesday.range", () => {
  assert.strictEqual(utcWednesdays, utcWednesday.range)
})

it("utcWednesday.floor(date) returns Wednesdays", () => {
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 3, 23, 59, 59)), utc(2010, 11, 29))
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 4, 0, 0, 0)), utc(2010, 11, 29))
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 4, 0, 0, 1)), utc(2010, 11, 29))
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 4, 23, 59, 59)), utc(2010, 11, 29))
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 5, 0, 0, 0)), utc(2011, 0, 5))
  assert.deepStrictEqual(utcWednesday.floor(utc(2011, 0, 5, 0, 0, 1)), utc(2011, 0, 5))
})

it("utcWednesday.count(start, end) counts Wednesdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(utcWednesday.count(utc(2012, 0, 1), utc(2012, 0, 3)), 0)
  assert.strictEqual(utcWednesday.count(utc(2012, 0, 1), utc(2012, 0, 4)), 1)
  assert.strictEqual(utcWednesday.count(utc(2012, 0, 1), utc(2012, 0, 5)), 1)
  assert.strictEqual(utcWednesday.count(utc(2012, 0, 1), utc(2012, 0, 11)), 2)

  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(utcWednesday.count(utc(2014, 0, 1), utc(2014, 0, 7)), 0)
  assert.strictEqual(utcWednesday.count(utc(2014, 0, 1), utc(2014, 0, 8)), 1)
  assert.strictEqual(utcWednesday.count(utc(2014, 0, 1), utc(2014, 0, 9)), 1)
})

it("utcWednesday.count(start, end) does not observe daylight saving", () => {
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 1)), 10)
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 3)), 10)
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 2, 13, 4)), 10)
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 0)), 44)
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 1)), 44)
  assert.strictEqual(utcWednesday.count(utc(2011, 0, 1), utc(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { utcSunday, utcWeek } from "../src/index.js"
import { utc } from "./date.js"

it("utcWeek.floor(date) returns sundays", () => {
  assert.deepStrictEqual(utcWeek.floor(utc(2010, 11, 31, 23, 59, 59)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 0, 1, 0, 0, 0)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 0, 1, 0, 0, 1)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 0, 1, 23, 59, 59)), utc(2010, 11, 26))
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 0, 2, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 0, 2, 0, 0, 1)), utc(2011, 0, 2))
})

it("utcWeek.floor(date) observes the start of daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 2, 13, 1)), utc(2011, 2, 13))
})

it("utcWeek.floor(date) observes the end of the daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.floor(utc(2011, 10, 6, 1)), utc(2011, 10, 6))
})

it("utcWeek.floor(date) correctly handles years in the first century", () => {
  assert.deepStrictEqual(utcWeek.floor(utc(9, 10, 6, 7)), utc(9, 10, 1))
})

it("utcWeek.ceil(date) returns sundays", () => {
  assert.deepStrictEqual(utcWeek.ceil(utc(2010, 11, 31, 23, 59, 59)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 0, 1, 0, 0, 1)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 0, 1, 23, 59, 59)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 0, 2, 0, 0, 0)), utc(2011, 0, 2))
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 0, 2, 0, 0, 1)), utc(2011, 0, 9))
})

it("utcWeek.ceil(date) does not observe the start of daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 2, 13, 1)), utc(2011, 2, 20))
})

it("utcWeek.ceil(date) does not observe the end of the daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.ceil(utc(2011, 10, 6, 1)), utc(2011, 10, 13))
})

it("utcWeek.offset(date, step) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcWeek.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcWeek.offset(date, step) does not round the passed-in-date", () => {
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 0, 7, 23, 59, 59, 999))
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2010, 11, 17, 23, 59, 59, 456))
})

it("utcWeek.offset(date, step) allows negative offsets", () => {
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 1), -1), utc(2010, 10, 24))
  assert.deepStrictEqual(utcWeek.offset(utc(2011, 0, 1), -2), utc(2010, 11, 18))
  assert.deepStrictEqual(utcWeek.offset(utc(2011, 0, 1), -1), utc(2010, 11, 25))
})

it("utcWeek.offset(date, step) allows positive offsets", () => {
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 10, 24), +1), utc(2010, 11, 1))
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 18), +2), utc(2011, 0, 1))
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 25), +1), utc(2011, 0, 1))
})

it("utcWeek.offset(date, step) allows zero offset", () => {
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcWeek.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcWeek.range(start, stop) returns sundays", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2010, 11, 21), utc(2011, 0, 12)), [
    utc(2010, 11, 26),
    utc(2011, 0, 2),
    utc(2011, 0, 9),
  ])
})

it("utcWeek.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2010, 11, 21), utc(2011, 0, 12))[0], utc(2010, 11, 26))
})

it("utcWeek.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2010, 11, 21), utc(2011, 0, 12))[2], utc(2011, 0, 9))
})

it("utcWeek.range(start, stop) can skip weeks", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2011, 0, 1), utc(2011, 3, 1), 4), [
    utc(2011, 0, 2),
    utc(2011, 0, 30),
    utc(2011, 1, 27),
    utc(2011, 2, 27),
  ])
})

it("utcWeek.range(start, stop) does not observe start of daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2011, 2, 1), utc(2011, 2, 28)), [
    utc(2011, 2, 6),
    utc(2011, 2, 13),
    utc(2011, 2, 20),
    utc(2011, 2, 27),
  ])
})

it("utcWeek.range(start, stop) does not observe end of daylight savings time", () => {
  assert.deepStrictEqual(utcWeek.range(utc(2011, 10, 1), utc(2011, 10, 30)), [
    utc(2011, 10, 6),
    utc(2011, 10, 13),
    utc(2011, 10, 20),
    utc(2011, 10, 27),
  ])
})

it("utcWeek is an alias for utcSunday", () => {
  assert.strictEqual(utcWeek, utcSunday)
})

it("utcWeek.every(step) returns every stepth Sunday, starting with the first Sunday of the month", () => {
  assert.deepStrictEqual(utcWeek.every(2).range(utc(2008, 11, 3), utc(2009, 1, 5)), [
    utc(2008, 11, 7),
    utc(2008, 11, 21),
    utc(2009, 0, 4),
    utc(2009, 0, 18),
    utc(2009, 1, 1),
  ])
})
import assert from "assert"
import { utcYear } from "../src/index.js"
import { utc } from "./date.js"

it("utcYear.floor(date) returns years", () => {
  assert.deepStrictEqual(utcYear.floor(utc(2010, 11, 31, 23, 59, 59)), utc(2010, 0, 1))
  assert.deepStrictEqual(utcYear.floor(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcYear.floor(utc(2011, 0, 1, 0, 0, 1)), utc(2011, 0, 1))
})

it("utcYear.floor(date) does not modify the specified date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59)
  assert.deepStrictEqual(utcYear.floor(d), utc(2010, 0, 1))
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59))
})

it("utcYear.floor(date) correctly handles years in the first century", () => {
  assert.deepStrictEqual(utcYear.floor(utc(9, 10, 6, 7)), utc(9, 0, 1))
})

it("utcYear.ceil(date) returns years", () => {
  assert.deepStrictEqual(utcYear.ceil(utc(2010, 11, 31, 23, 59, 59)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcYear.ceil(utc(2011, 0, 1, 0, 0, 0)), utc(2011, 0, 1))
  assert.deepStrictEqual(utcYear.ceil(utc(2011, 0, 1, 0, 0, 1)), utc(2012, 0, 1))
})

it("utcYear.offset(date, count) does not modify the passed-in date", () => {
  const d = utc(2010, 11, 31, 23, 59, 59, 999)
  utcYear.offset(d, +1)
  assert.deepStrictEqual(d, utc(2010, 11, 31, 23, 59, 59, 999))
})

it("utcYear.offset(date, count) does not round the passed-in-date", () => {
  assert.deepStrictEqual(utcYear.offset(utc(2010, 11, 31, 23, 59, 59, 999), +1), utc(2011, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcYear.offset(utc(2010, 11, 31, 23, 59, 59, 456), -2), utc(2008, 11, 31, 23, 59, 59, 456))
})

it("utcYear.offset(date, count) allows negative offsets", () => {
  assert.deepStrictEqual(utcYear.offset(utc(2010, 11, 1), -1), utc(2009, 11, 1))
  assert.deepStrictEqual(utcYear.offset(utc(2011, 0, 1), -2), utc(2009, 0, 1))
  assert.deepStrictEqual(utcYear.offset(utc(2011, 0, 1), -1), utc(2010, 0, 1))
})

it("utcYear.offset(date, count) allows positive offsets", () => {
  assert.deepStrictEqual(utcYear.offset(utc(2009, 11, 1), +1), utc(2010, 11, 1))
  assert.deepStrictEqual(utcYear.offset(utc(2009, 0, 1), +2), utc(2011, 0, 1))
  assert.deepStrictEqual(utcYear.offset(utc(2010, 0, 1), +1), utc(2011, 0, 1))
})

it("utcYear.offset(date, count) allows zero offset", () => {
  assert.deepStrictEqual(utcYear.offset(utc(2010, 11, 31, 23, 59, 59, 999), 0), utc(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(utcYear.offset(utc(2010, 11, 31, 23, 59, 58, 0), 0), utc(2010, 11, 31, 23, 59, 58, 0))
})

it("utcYear.every(step) returns every stepth year, starting with year zero", () => {
  assert.deepStrictEqual(utcYear.every(5).range(utc(2008), utc(2023)), [utc(2010), utc(2015), utc(2020)])
})

it("utcYear.range(start, stop) returns years", () => {
  assert.deepStrictEqual(utcYear.range(utc(2010, 0, 1), utc(2013, 0, 1)), [
    utc(2010, 0, 1),
    utc(2011, 0, 1),
    utc(2012, 0, 1),
  ])
})

it("utcYear.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(utcYear.range(utc(2010, 0, 1), utc(2013, 0, 1))[0], utc(2010, 0, 1))
})

it("utcYear.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(utcYear.range(utc(2010, 0, 1), utc(2013, 0, 1))[2], utc(2012, 0, 1))
})

it("utcYear.range(start, stop, step) can skip years", () => {
  assert.deepStrictEqual(utcYear.range(utc(2009, 0, 1), utc(2029, 0, 1), 5), [
    utc(2009, 0, 1),
    utc(2014, 0, 1),
    utc(2019, 0, 1),
    utc(2024, 0, 1),
  ])
})
import assert from "assert"
import { local } from "./date.js"
import { timeWednesday, timeWednesdays } from "../src/index.js"

it("timeWednesdays in an alias for timeWednesday.range", () => {
  assert.strictEqual(timeWednesdays, timeWednesday.range)
})

it("timeWednesday.floor(date) returns Wednesdays", () => {
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 3, 23, 59, 59)), local(2010, 11, 29))
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 4, 0, 0, 0)), local(2010, 11, 29))
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 4, 0, 0, 1)), local(2010, 11, 29))
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 4, 23, 59, 59)), local(2010, 11, 29))
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 5, 0, 0, 0)), local(2011, 0, 5))
  assert.deepStrictEqual(timeWednesday.floor(local(2011, 0, 5, 0, 0, 1)), local(2011, 0, 5))
})

it("timeWednesday.count(start, end) counts Wednesdays after start (exclusive) and before end (inclusive)", () => {
  //       January 2012
  // Su Mo Tu We Th Fr Sa
  //  1  2  3  4  5  6  7
  //  8  9 10 11 12 13 14
  // 15 16 17 18 19 20 21
  // 22 23 24 25 26 27 28
  // 29 30 31
  assert.strictEqual(timeWednesday.count(local(2012, 0, 1), local(2012, 0, 3)), 0)
  assert.strictEqual(timeWednesday.count(local(2012, 0, 1), local(2012, 0, 4)), 1)
  assert.strictEqual(timeWednesday.count(local(2012, 0, 1), local(2012, 0, 5)), 1)
  assert.strictEqual(timeWednesday.count(local(2012, 0, 1), local(2012, 0, 11)), 2)

  //     January 2014
  // Su Mo Tu We Th Fr Sa
  //           1  2  3  4
  //  5  6  7  8  9 10 11
  // 12 13 14 15 16 17 18
  // 19 20 21 22 23 24 25
  // 26 27 28 29 30 31
  assert.strictEqual(timeWednesday.count(local(2014, 0, 1), local(2014, 0, 7)), 0)
  assert.strictEqual(timeWednesday.count(local(2014, 0, 1), local(2014, 0, 8)), 1)
  assert.strictEqual(timeWednesday.count(local(2014, 0, 1), local(2014, 0, 9)), 1)
})

it("timeWednesday.count(start, end) observes daylight saving", () => {
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 2, 13, 1)), 10)
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 2, 13, 3)), 10)
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 2, 13, 4)), 10)
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 10, 6, 0)), 44)
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 10, 6, 1)), 44)
  assert.strictEqual(timeWednesday.count(local(2011, 0, 1), local(2011, 10, 6, 2)), 44)
})
import assert from "assert"
import { timeSunday, timeWeek } from "../src/index.js"
import { local } from "./date.js"

it("timeWeek.floor(date) returns sundays", () => {
  assert.deepStrictEqual(timeWeek.floor(local(2010, 11, 31, 23, 59, 59)), local(2010, 11, 26))
  assert.deepStrictEqual(timeWeek.floor(local(2011, 0, 1, 0, 0, 0)), local(2010, 11, 26))
  assert.deepStrictEqual(timeWeek.floor(local(2011, 0, 1, 0, 0, 1)), local(2010, 11, 26))
  assert.deepStrictEqual(timeWeek.floor(local(2011, 0, 1, 23, 59, 59)), local(2010, 11, 26))
  assert.deepStrictEqual(timeWeek.floor(local(2011, 0, 2, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.floor(local(2011, 0, 2, 0, 0, 1)), local(2011, 0, 2))
})

it("timeWeek.floor(date) observes the start of daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.floor(local(2011, 2, 13, 1)), local(2011, 2, 13))
})

it("timeWeek.floor(date) observes the end of the daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.floor(local(2011, 10, 6, 1)), local(2011, 10, 6))
})

it("timeWeek.floor(date) correctly handles years in the first century", () => {
  assert.deepStrictEqual(timeWeek.floor(local(9, 10, 6, 7)), local(9, 10, 1))
})

it("timeWeek.ceil(date) returns sundays", () => {
  assert.deepStrictEqual(timeWeek.ceil(local(2010, 11, 31, 23, 59, 59)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 0, 1, 0, 0, 1)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 0, 1, 23, 59, 59)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 0, 2, 0, 0, 0)), local(2011, 0, 2))
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 0, 2, 0, 0, 1)), local(2011, 0, 9))
})

it("timeWeek.ceil(date) observes the start of daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 2, 13, 1)), local(2011, 2, 20))
})

it("timeWeek.ceil(date) observes the end of the daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.ceil(local(2011, 10, 6, 1)), local(2011, 10, 13))
})

it("timeWeek.offset(date, step) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeWeek.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeWeek.offset(date, step) does not round the passed-in-date", () => {
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 31, 23, 59, 59, 999), +1), local(2011, 0, 7, 23, 59, 59, 999))
  assert.deepStrictEqual(
    timeWeek.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2010, 11, 17, 23, 59, 59, 456)
  )
})

it("timeWeek.offset(date, step) allows negative offsets", () => {
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 1), -1), local(2010, 10, 24))
  assert.deepStrictEqual(timeWeek.offset(local(2011, 0, 1), -2), local(2010, 11, 18))
  assert.deepStrictEqual(timeWeek.offset(local(2011, 0, 1), -1), local(2010, 11, 25))
})

it("timeWeek.offset(date, step) allows positive offsets", () => {
  assert.deepStrictEqual(timeWeek.offset(local(2010, 10, 24), +1), local(2010, 11, 1))
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 18), +2), local(2011, 0, 1))
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 25), +1), local(2011, 0, 1))
})

it("timeWeek.offset(date, step) allows zero offset", () => {
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 31, 23, 59, 59, 999), 0), local(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(timeWeek.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeWeek.range(start, stop) returns sundays", () => {
  assert.deepStrictEqual(timeWeek.range(local(2010, 11, 21), local(2011, 0, 12)), [
    local(2010, 11, 26),
    local(2011, 0, 2),
    local(2011, 0, 9),
  ])
})

it("timeWeek.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(timeWeek.range(local(2010, 11, 21), local(2011, 0, 12))[0], local(2010, 11, 26))
})

it("timeWeek.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(timeWeek.range(local(2010, 11, 21), local(2011, 0, 12))[2], local(2011, 0, 9))
})

it("timeWeek.range(start, stop) can skip weeks", () => {
  assert.deepStrictEqual(timeWeek.range(local(2011, 0, 1), local(2011, 3, 1), 4), [
    local(2011, 0, 2),
    local(2011, 0, 30),
    local(2011, 1, 27),
    local(2011, 2, 27),
  ])
})

it("timeWeek.range(start, stop) observes start of daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.range(local(2011, 2, 1), local(2011, 2, 28)), [
    local(2011, 2, 6),
    local(2011, 2, 13),
    local(2011, 2, 20),
    local(2011, 2, 27),
  ])
})

it("timeWeek.range(start, stop) observes end of daylight savings time", () => {
  assert.deepStrictEqual(timeWeek.range(local(2011, 10, 1), local(2011, 10, 30)), [
    local(2011, 10, 6),
    local(2011, 10, 13),
    local(2011, 10, 20),
    local(2011, 10, 27),
  ])
})

it("timeWeek is an alias for timeSunday", () => {
  assert.strictEqual(timeWeek, timeSunday)
})

it("timeWeek.every(step) returns every stepth Sunday, starting with the first Sunday of the month", () => {
  assert.deepStrictEqual(timeWeek.every(2).range(local(2008, 11, 3), local(2009, 1, 5)), [
    local(2008, 11, 7),
    local(2008, 11, 21),
    local(2009, 0, 4),
    local(2009, 0, 18),
    local(2009, 1, 1),
  ])
})
import assert from "assert"
import { timeYear } from "../src/index.js"
import { local } from "./date.js"

it("timeYear.floor(date) returns years", () => {
  assert.deepStrictEqual(timeYear.floor(local(2010, 11, 31, 23, 59, 59)), local(2010, 0, 1))
  assert.deepStrictEqual(timeYear.floor(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeYear.floor(local(2011, 0, 1, 0, 0, 1)), local(2011, 0, 1))
})

it("timeYear.floor(date) does not modify the specified date", () => {
  const d = local(2010, 11, 31, 23, 59, 59)
  assert.deepStrictEqual(timeYear.floor(d), local(2010, 0, 1))
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59))
})

it("timeYear.floor(date) correctly handles years in the first century", () => {
  assert.deepStrictEqual(timeYear.floor(local(9, 10, 6, 7)), local(9, 0, 1))
})

it("timeYear.ceil(date) returns years", () => {
  assert.deepStrictEqual(timeYear.ceil(local(2010, 11, 31, 23, 59, 59)), local(2011, 0, 1))
  assert.deepStrictEqual(timeYear.ceil(local(2011, 0, 1, 0, 0, 0)), local(2011, 0, 1))
  assert.deepStrictEqual(timeYear.ceil(local(2011, 0, 1, 0, 0, 1)), local(2012, 0, 1))
})

it("timeYear.offset(date, count) does not modify the passed-in date", () => {
  const d = local(2010, 11, 31, 23, 59, 59, 999)
  timeYear.offset(d, +1)
  assert.deepStrictEqual(d, local(2010, 11, 31, 23, 59, 59, 999))
})

it("timeYear.offset(date, count) does not round the passed-in-date", () => {
  assert.deepStrictEqual(
    timeYear.offset(local(2010, 11, 31, 23, 59, 59, 999), +1),
    local(2011, 11, 31, 23, 59, 59, 999)
  )
  assert.deepStrictEqual(
    timeYear.offset(local(2010, 11, 31, 23, 59, 59, 456), -2),
    local(2008, 11, 31, 23, 59, 59, 456)
  )
})

it("timeYear.offset(date, count) allows negative offsets", () => {
  assert.deepStrictEqual(timeYear.offset(local(2010, 11, 1), -1), local(2009, 11, 1))
  assert.deepStrictEqual(timeYear.offset(local(2011, 0, 1), -2), local(2009, 0, 1))
  assert.deepStrictEqual(timeYear.offset(local(2011, 0, 1), -1), local(2010, 0, 1))
})

it("timeYear.offset(date, count) allows positive offsets", () => {
  assert.deepStrictEqual(timeYear.offset(local(2009, 11, 1), +1), local(2010, 11, 1))
  assert.deepStrictEqual(timeYear.offset(local(2009, 0, 1), +2), local(2011, 0, 1))
  assert.deepStrictEqual(timeYear.offset(local(2010, 0, 1), +1), local(2011, 0, 1))
})

it("timeYear.offset(date, count) allows zero offset", () => {
  assert.deepStrictEqual(timeYear.offset(local(2010, 11, 31, 23, 59, 59, 999), 0), local(2010, 11, 31, 23, 59, 59, 999))
  assert.deepStrictEqual(timeYear.offset(local(2010, 11, 31, 23, 59, 58, 0), 0), local(2010, 11, 31, 23, 59, 58, 0))
})

it("timeYear.every(step) returns every stepth year, starting with year zero", () => {
  assert.deepStrictEqual(timeYear.every(5).range(local(2008), local(2023)), [local(2010), local(2015), local(2020)])
})

it("timeYear.range(start, stop) returns years", () => {
  assert.deepStrictEqual(timeYear.range(local(2010, 0, 1), local(2013, 0, 1)), [
    local(2010, 0, 1),
    local(2011, 0, 1),
    local(2012, 0, 1),
  ])
})

it("timeYear.range(start, stop) has an inclusive lower bound", () => {
  assert.deepStrictEqual(timeYear.range(local(2010, 0, 1), local(2013, 0, 1))[0], local(2010, 0, 1))
})

it("timeYear.range(start, stop) has an exclusive upper bound", () => {
  assert.deepStrictEqual(timeYear.range(local(2010, 0, 1), local(2013, 0, 1))[2], local(2012, 0, 1))
})

it("timeYear.range(start, stop, step) can skip years", () => {
  assert.deepStrictEqual(timeYear.range(local(2009, 0, 1), local(2029, 0, 1), 5), [
    local(2009, 0, 1),
    local(2014, 0, 1),
    local(2019, 0, 1),
    local(2024, 0, 1),
  ])
})
