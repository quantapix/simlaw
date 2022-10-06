import assert from "assert"
import { autoType } from "../src/index.js"

it("autoType(object) mutates in-place", () => {
  const object = { foo: "4.2" }
  assert.strictEqual(autoType(object), object)
  assert.deepStrictEqual(object, { foo: 4.2 })
})

it("autoType(object) detects numbers", () => {
  assert.deepStrictEqual(autoType({ foo: "4.2" }), { foo: 4.2 })
  assert.deepStrictEqual(autoType({ foo: "04.2" }), { foo: 4.2 })
  assert.deepStrictEqual(autoType({ foo: "-4.2" }), { foo: -4.2 })
  assert.deepStrictEqual(autoType({ foo: "1e4" }), { foo: 10000 })
})

it("autoType(object) detects NaN", () => {
  assert.strictEqual(Number.isNaN(autoType({ foo: "NaN" }).foo), true)
})

// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-date-time-string-format
// When the time zone offset is absent, date-only forms are interpreted as a UTC time and date-time forms are interpreted as a local time.
// YYYY is ambiguous with number, so the number takes priority.
it("autoType(object) detects dates", () => {
  assert.deepStrictEqual(autoType({ foo: "2018-01" }), { foo: new Date("2018-01-01T00:00:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018-01-01" }), { foo: new Date("2018-01-01T00:00:00.000Z") })
})

it("autoType(object) detects extended years", () => {
  assert.deepStrictEqual(autoType({ foo: "-010001-01-01T00:00:00Z" }), { foo: new Date("-010001-01-01T00:00:00Z") })
  assert.deepStrictEqual(autoType({ foo: "+010001-01-01T00:00:00Z" }), { foo: new Date("+010001-01-01T00:00:00Z") })
})

it("autoType(object) detects date-times", () => {
  assert.deepStrictEqual(autoType({ foo: "2018T00:00Z" }), { foo: new Date("2018-01-01T00:00:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018T00:00+08:00" }), { foo: new Date("2017-12-31T16:00:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018-01T12:23" }), { foo: new Date("2018-01-01T12:23:00.000") })
  assert.deepStrictEqual(autoType({ foo: "2018-01T12:23Z" }), { foo: new Date("2018-01-01T12:23:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018-01T12:23+00:00" }), { foo: new Date("2018-01-01T12:23:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018-01-01T00:00" }), { foo: new Date("2018-01-01T00:00:00.000") })
  assert.deepStrictEqual(autoType({ foo: "2018-01-01T00:00+00:00" }), { foo: new Date("2018-01-01T00:00:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: "2018-01-01T00:00-00:00" }), { foo: new Date("2018-01-01T00:00:00.000Z") })
})

it("autoType(object) detects booleans", () => {
  assert.deepStrictEqual(autoType({ foo: "true" }), { foo: true })
  assert.deepStrictEqual(autoType({ foo: "false" }), { foo: false })
})

it("autoType(object) detects null", () => {
  assert.deepStrictEqual(autoType({ foo: "" }), { foo: null })
})

it("autoType(object) detects strings", () => {
  assert.deepStrictEqual(autoType({ foo: "yes" }), { foo: "yes" })
  assert.deepStrictEqual(autoType({ foo: "no" }), { foo: "no" })
  assert.deepStrictEqual(autoType({ foo: "01/01/2018" }), { foo: "01/01/2018" })
  assert.deepStrictEqual(autoType({ foo: "January 1, 2018" }), { foo: "January 1, 2018" })
  assert.deepStrictEqual(autoType({ foo: "1,431" }), { foo: "1,431" })
  assert.deepStrictEqual(autoType({ foo: "$1.00" }), { foo: "$1.00" })
  assert.deepStrictEqual(autoType({ foo: "(1.00)" }), { foo: "(1.00)" })
  assert.deepStrictEqual(autoType({ foo: "Nan" }), { foo: "Nan" })
  assert.deepStrictEqual(autoType({ foo: "True" }), { foo: "True" })
  assert.deepStrictEqual(autoType({ foo: "False" }), { foo: "False" })
  assert.deepStrictEqual(autoType({ foo: "TRUE" }), { foo: "TRUE" })
  assert.deepStrictEqual(autoType({ foo: "FALSE" }), { foo: "FALSE" })
  assert.deepStrictEqual(autoType({ foo: "NAN" }), { foo: "NAN" })
  assert.deepStrictEqual(autoType({ foo: "nan" }), { foo: "nan" })
  assert.deepStrictEqual(autoType({ foo: "NA" }), { foo: "NA" })
  assert.deepStrictEqual(autoType({ foo: "na" }), { foo: "na" })
})

it("autoType(object) ignores leading and trailing whitespace", () => {
  assert.deepStrictEqual(autoType({ foo: " 4.2 " }), { foo: 4.2 })
  assert.deepStrictEqual(autoType({ foo: " -4.2 " }), { foo: -4.2 })
  assert.deepStrictEqual(autoType({ foo: " 1e4 " }), { foo: 10000 })
  assert.deepStrictEqual(autoType({ foo: " 2018-01 " }), { foo: new Date("2018-01-01T00:00:00.000Z") })
  assert.deepStrictEqual(autoType({ foo: " 2018T00:00Z " }), { foo: new Date("2018-01-01T00:00:00.000Z") })
  assert.strictEqual(Number.isNaN(autoType({ foo: " NaN " }).foo), true)
  assert.deepStrictEqual(autoType({ foo: " true " }), { foo: true })
  assert.deepStrictEqual(autoType({ foo: " " }), { foo: null })
})

it("autoType(array) mutates in-place", () => {
  const array = ["4.2"]
  assert.strictEqual(autoType(array), array)
  assert.deepStrictEqual(array, [4.2])
})

it("autoType(array) can take an array", () => {
  assert.deepStrictEqual(autoType(["4.2", " 2018-01 "]), [4.2, new Date("2018-01-01T00:00:00.000Z")])
})
import assert from "assert"
import spectrum from "csv-spectrum"
import { readFileSync } from "fs"
import { csvFormat, csvFormatBody, csvFormatRow, csvFormatRows, csvParse, csvParseRows } from "../src/index.js"
import { table } from "./table.js"

it("csvParse(string) returns the expected objects", () => {
  assert.deepStrictEqual(csvParse("a,b,c\n1,2,3\n"), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(
    csvParse(readFileSync("test/data/sample.csv", "utf-8")),
    table([{ Hello: "42", World: '"fish"' }], ["Hello", "World"])
  )
})

it("csvParse(string) does not strip whitespace", () => {
  assert.deepStrictEqual(csvParse("a,b,c\n 1, 2 ,3 "), table([{ a: " 1", b: " 2 ", c: "3 " }], ["a", "b", "c"]))
})

it("csvParse(string) treats empty fields as the empty string", () => {
  assert.deepStrictEqual(csvParse("a,b,c\n1,,3"), table([{ a: "1", b: "", c: "3" }], ["a", "b", "c"]))
})

it("csvParse(string) treats a trailing empty field as the empty string", () => {
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,\n1,2,\n"),
    table(
      [
        { a: "1", b: "2", c: "" },
        { a: "1", b: "2", c: "" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) treats a trailing empty field on the last line as the empty string", () => {
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,\n1,2,"),
    table(
      [
        { a: "1", b: "2", c: "" },
        { a: "1", b: "2", c: "" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) treats quoted empty strings as the empty string", () => {
  assert.deepStrictEqual(csvParse('a,b,c\n1,"",3'), table([{ a: "1", b: "", c: "3" }], ["a", "b", "c"]))
})

it("csvParse(string) allows the last field to have unterminated quotes", () => {
  assert.deepStrictEqual(csvParse('a,b,c\n1,2,"3'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(csvParse('a,b,c\n1,2,"'), table([{ a: "1", b: "2", c: "" }], ["a", "b", "c"]))
})

it("csvParse(string) ignores a blank last line", () => {
  assert.deepStrictEqual(csvParse("a,b,c\n1,2,3\n"), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
})

it("csvParse(string) treats a blank non-last line as a single-column empty string", () => {
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,3\n\n"),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "", b: "", c: "" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) returns empty strings for missing columns", () => {
  assert.deepStrictEqual(
    csvParse("a,b,c\n1\n1,2"),
    table(
      [
        { a: "1", b: "", c: "" },
        { a: "1", b: "2", c: "" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) does not ignore a whitespace-only last line", () => {
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,3\n "),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: " ", b: "", c: "" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) parses quoted values", () => {
  assert.deepStrictEqual(csvParse('a,b,c\n"1",2,3'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(csvParse('a,b,c\n"1",2,3\n'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
})

it("csvParse(string) parses quoted values with quotes", () => {
  assert.deepStrictEqual(csvParse('a\n"""hello"""'), table([{ a: '"hello"' }], ["a"]))
})

it("csvParse(string) parses quoted values with newlines", () => {
  assert.deepStrictEqual(csvParse('a\n"new\nline"'), table([{ a: "new\nline" }], ["a"]))
  assert.deepStrictEqual(csvParse('a\n"new\rline"'), table([{ a: "new\rline" }], ["a"]))
  assert.deepStrictEqual(csvParse('a\n"new\r\nline"'), table([{ a: "new\r\nline" }], ["a"]))
})

it("csvParse(string) observes Unix, Mac and DOS newlines", () => {
  assert.deepStrictEqual(
    csvParse('a,b,c\n1,2,3\n4,5,"6"\n7,8,9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    csvParse('a,b,c\r1,2,3\r4,5,"6"\r7,8,9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    csvParse('a,b,c\r\n1,2,3\r\n4,5,"6"\r\n7,8,9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("csvParse(string) returns columns in the input order", () => {
  assert.deepStrictEqual(csvParse("a,b,c\n").columns, ["a", "b", "c"])
  assert.deepStrictEqual(csvParse("a,c,b\n").columns, ["a", "c", "b"])
  assert.deepStrictEqual(csvParse("a,0,1\n").columns, ["a", "0", "1"])
  assert.deepStrictEqual(csvParse("1,0,a\n").columns, ["1", "0", "a"])
})

it("csvParse(string) passes the csv-spectrum test suite", () => {
  spectrum(function (error, samples) {
    samples.forEach(function (sample) {
      const actual = csvParse(sample.csv.toString()),
        expected = JSON.parse(sample.json.toString())
      delete actual.columns
      assert.deepStrictEqual(actual, expected)
    })
  })
})

it("csvParse(string, row) returns the expected converted objects", () => {
  function row(d) {
    d.Hello = -d.Hello
    return d
  }
  assert.deepStrictEqual(
    csvParse(readFileSync("test/data/sample.csv", "utf-8"), row),
    table([{ Hello: -42, World: '"fish"' }], ["Hello", "World"])
  )
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,3\n", function (d) {
      return d
    }),
    table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"])
  )
})

it("csvParse(string, row) skips rows if row returns null or undefined", () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(csvParse("field\n42\n\n\n\n", row), table([{ field: "42" }, false], ["field"]))
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,3\n2,3,4", function (d) {
      return d.a & 1 ? null : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
  assert.deepStrictEqual(
    csvParse("a,b,c\n1,2,3\n2,3,4", function (d) {
      return d.a & 1 ? undefined : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
})

it("csvParse(string, row) calls row(d, i) for each row d, in order", () => {
  const rows = []
  csvParse("a\n1\n2\n3\n4", function (d, i) {
    rows.push({ d: d, i: i })
  })
  assert.deepStrictEqual(rows, [
    { d: { a: "1" }, i: 0 },
    { d: { a: "2" }, i: 1 },
    { d: { a: "3" }, i: 2 },
    { d: { a: "4" }, i: 3 },
  ])
})

it("csvParseRows(string) returns the expected array of array of string", () => {
  assert.deepStrictEqual(csvParseRows("a,b,c"), [["a", "b", "c"]])
  assert.deepStrictEqual(csvParseRows("a,b,c\n1,2,3"), [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ])
})

it("csvParseRows(string) does not strip whitespace", () => {
  assert.deepStrictEqual(csvParseRows(" 1, 2 ,3 "), [[" 1", " 2 ", "3 "]])
})

it("csvParseRows(string) treats empty fields as the empty string", () => {
  assert.deepStrictEqual(csvParseRows("1,,3"), [["1", "", "3"]])
})

it("csvParseRows(string) treats a trailing empty field as the empty string", () => {
  assert.deepStrictEqual(csvParseRows("1,2,\n1,2,3"), [
    ["1", "2", ""],
    ["1", "2", "3"],
  ])
})

it("csvParseRows(string) treats a trailing empty field on the last line as the empty string", () => {
  assert.deepStrictEqual(csvParseRows("1,2,\n"), [["1", "2", ""]])
  assert.deepStrictEqual(csvParseRows("1,2,"), [["1", "2", ""]])
})

it("csvParseRows(string) treats quoted empty strings as the empty string", () => {
  assert.deepStrictEqual(csvParseRows('"",2,3'), [["", "2", "3"]])
  assert.deepStrictEqual(csvParseRows('1,"",3'), [["1", "", "3"]])
  assert.deepStrictEqual(csvParseRows('1,2,""'), [["1", "2", ""]])
})

it("csvParseRows(string) allows the last field to have unterminated quotes", () => {
  assert.deepStrictEqual(csvParseRows('1,2,"3'), [["1", "2", "3"]])
  assert.deepStrictEqual(csvParseRows('1,2,"'), [["1", "2", ""]])
})

it("csvParseRows(string) ignores a blank last line", () => {
  assert.deepStrictEqual(csvParseRows("1,2,3\n"), [["1", "2", "3"]])
})

it("csvParseRows(string) treats a blank non-last line as a single-column empty string", () => {
  assert.deepStrictEqual(csvParseRows("1,2,3\n\n"), [["1", "2", "3"], [""]])
  assert.deepStrictEqual(csvParseRows('1,2,3\n""\n'), [["1", "2", "3"], [""]])
})

it("csvParseRows(string) can return rows of varying length", () => {
  assert.deepStrictEqual(csvParseRows("1\n1,2\n1,2,3"), [["1"], ["1", "2"], ["1", "2", "3"]])
})

it("csvParseRows(string) does not ignore a whitespace-only last line", () => {
  assert.deepStrictEqual(csvParseRows("1,2,3\n "), [["1", "2", "3"], [" "]])
})

it("csvParseRows(string) parses quoted values", () => {
  assert.deepStrictEqual(csvParseRows('"1",2,3\n'), [["1", "2", "3"]])
  assert.deepStrictEqual(csvParseRows('"hello"'), [["hello"]])
})

it("csvParseRows(string) parses quoted values with quotes", () => {
  assert.deepStrictEqual(csvParseRows('"""hello"""'), [['"hello"']])
})

it("csvParseRows(string) parses quoted values with newlines", () => {
  assert.deepStrictEqual(csvParseRows('"new\nline"'), [["new\nline"]])
  assert.deepStrictEqual(csvParseRows('"new\rline"'), [["new\rline"]])
  assert.deepStrictEqual(csvParseRows('"new\r\nline"'), [["new\r\nline"]])
})

it("csvParseRows(string) parses Unix, Mac and DOS newlines", () => {
  assert.deepStrictEqual(csvParseRows('a,b,c\n1,2,3\n4,5,"6"\n7,8,9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(csvParseRows('a,b,c\r1,2,3\r4,5,"6"\r7,8,9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(csvParseRows('a,b,c\r\n1,2,3\r\n4,5,"6"\r\n7,8,9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
})

it('csvParseRows("") returns the empty array', () => {
  assert.deepStrictEqual(csvParseRows(""), [])
})

it('csvParseRows("\n") returns an array of one empty string', () => {
  assert.deepStrictEqual(csvParseRows("\n"), [[""]])
  assert.deepStrictEqual(csvParseRows("\r"), [[""]])
  assert.deepStrictEqual(csvParseRows("\r\n"), [[""]])
})

it('csvParseRows("\n\n") returns an array of two empty strings', () => {
  assert.deepStrictEqual(csvParseRows("\n\n"), [[""], [""]])
})

it("csvParseRows(string, row) returns the expected converted array of array of string", () => {
  function row(d, i) {
    if (i) d[0] = -d[0]
    return d
  }
  assert.deepStrictEqual(csvParseRows(readFileSync("test/data/sample.csv", "utf-8"), row), [
    ["Hello", "World"],
    [-42, '"fish"'],
  ])
  assert.deepStrictEqual(
    csvParseRows("a,b,c\n1,2,3\n", function (d) {
      return d
    }),
    [
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]
  )
})

it("csvParseRows(string, row) skips rows if row returns null or undefined", () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(csvParseRows("field\n42\n\n\n", row), [["field"], false])
  assert.deepStrictEqual(
    csvParseRows("a,b,c\n1,2,3\n2,3,4", function (d, i) {
      return i & 1 ? null : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
  assert.deepStrictEqual(
    csvParseRows("a,b,c\n1,2,3\n2,3,4", function (d, i) {
      return i & 1 ? undefined : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
})

it("csvParseRows(string, row) invokes row(d, i) for each row d, in order", () => {
  const rows = []
  csvParseRows("a\n1\n2\n3\n4", function (d, i) {
    rows.push({ d: d, i: i })
  })
  assert.deepStrictEqual(rows, [
    { d: ["a"], i: 0 },
    { d: ["1"], i: 1 },
    { d: ["2"], i: 2 },
    { d: ["3"], i: 3 },
    { d: ["4"], i: 4 },
  ])
})

it("csvFormat(array) takes an array of objects as input", () => {
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }]), "a,b,c\n1,2,3")
})

it("csvFormat(array) converts dates to ISO 8601", () => {
  assert.deepStrictEqual(csvFormat([{ date: new Date(Date.UTC(2018, 0, 1)) }]), "date\n2018-01-01")
  assert.deepStrictEqual(csvFormat([{ date: new Date(2018, 0, 1) }]), "date\n2018-01-01T08:00Z")
})

it("csvFormat(array) escapes field names and values containing delimiters", () => {
  assert.deepStrictEqual(csvFormat([{ "foo,bar": true }]), '"foo,bar"\ntrue')
  assert.deepStrictEqual(csvFormat([{ field: "foo,bar" }]), 'field\n"foo,bar"')
})

it("csvFormat(array) computes the union of all fields", () => {
  assert.deepStrictEqual(
    csvFormat([{ a: 1 }, { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }, { b: 1, c: 2 }, { c: 1 }]),
    "a,b,c\n1,,\n1,2,\n1,2,3\n,1,2\n,,1"
  )
})

it("csvFormat(array) orders fields by first-seen", () => {
  assert.deepStrictEqual(
    csvFormat([
      { a: 1, b: 2 },
      { c: 3, b: 4 },
      { c: 5, a: 1, b: 2 },
    ]),
    "a,b,c\n1,2,\n,4,3\n1,2,5"
  )
})

it("csvFormat(array, columns) observes the specified array of column names", () => {
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }], ["c", "b", "a"]), "c,b,a\n3,2,1")
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }], ["c", "a"]), "c,a\n3,1")
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }], []), "\n")
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }], ["d"]), "d\n")
})

it("csvFormat(array, columns) coerces column names to strings", () => {
  assert.deepStrictEqual(
    csvFormat(
      [{ a: 1, b: 2, '"fish"': 3 }],
      [
        {
          toString: function () {
            return '"fish"'
          },
        },
      ]
    ),
    '"""fish"""\n3'
  )
  assert.deepStrictEqual(csvFormat([{ a: 1, b: 2, c: 3 }], ["a", null, "b", undefined, "c"]), "a,,b,,c\n1,,2,,3")
})

it("csvFormat(array, columns) coerces field values to strings", () => {
  assert.deepStrictEqual(
    csvFormat([
      {
        a: {
          toString: function () {
            return '"fish"'
          },
        },
      },
    ]),
    'a\n"""fish"""'
  )
  assert.deepStrictEqual(csvFormat([{ a: null, b: undefined, c: 3 }]), "a,b,c\n,,3")
})

it("csvFormatBody(array) omits the header row", () => {
  assert.deepStrictEqual(
    csvFormatBody([
      { a: 1, b: 2 },
      { c: 3, b: 4 },
      { c: 5, a: 1, b: 2 },
    ]),
    "1,2,\n,4,3\n1,2,5"
  )
})

it("csvFormatBody(array, columns) omits the header row", () => {
  assert.deepStrictEqual(
    csvFormatBody(
      [
        { a: 1, b: 2 },
        { c: 3, b: 4 },
        { c: 5, a: 1, b: 2 },
      ],
      ["a", "b"]
    ),
    "1,2\n,4\n1,2"
  )
})

it("csvFormatRows(array) takes an array of array of string as input", () => {
  assert.deepStrictEqual(
    csvFormatRows([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]),
    "a,b,c\n1,2,3"
  )
})

it("csvFormatRows(array) separates lines using Unix newline", () => {
  assert.deepStrictEqual(csvFormatRows([[], []]), "\n")
})

it("csvFormatRows(array) converts dates to ISO 8601", () => {
  assert.deepStrictEqual(csvFormatRows([[new Date(Date.UTC(2018, 0, 1))]]), "2018-01-01")
  assert.deepStrictEqual(csvFormatRows([[new Date(2018, 0, 1)]]), "2018-01-01T08:00Z")
})

it("csvFormatRows(array) does not strip whitespace", () => {
  assert.deepStrictEqual(
    csvFormatRows([
      ["a ", " b", "c"],
      ["1", "2", "3 "],
    ]),
    "a , b,c\n1,2,3 "
  )
})

it("csvFormatRows(array) does not quote simple values", () => {
  assert.deepStrictEqual(csvFormatRows([["a"], [1]]), "a\n1")
})

it("csvFormatRows(array) escapes double quotes", () => {
  assert.deepStrictEqual(csvFormatRows([['"fish"']]), '"""fish"""')
})

it("csvFormatRows(array) escapes Unix newlines", () => {
  assert.deepStrictEqual(csvFormatRows([["new\nline"]]), '"new\nline"')
})

it("csvFormatRows(array) escapes Windows newlines", () => {
  assert.deepStrictEqual(csvFormatRows([["new\rline"]]), '"new\rline"')
})

it("csvFormatRows(array) escapes values containing delimiters", () => {
  assert.deepStrictEqual(csvFormatRows([["oxford,comma"]]), '"oxford,comma"')
})

it("csvFormatRow(array) takes a single array of string as input", () => {
  assert.deepStrictEqual(csvFormatRow(["a", "b", "c"]), "a,b,c")
})
import assert from "assert"
import { readFileSync } from "fs"
import { dsvFormat } from "../src/index.js"
import { table } from "./table.js"

const psv = dsvFormat("|")

it('dsv("|").parse(string) returns the expected objects', () => {
  assert.deepStrictEqual(psv.parse("a|b|c\n1|2|3\n"), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(
    psv.parse(readFileSync("test/data/sample.psv", "utf-8")),
    table([{ Hello: "42", World: '"fish"' }], ["Hello", "World"])
  )
})

it('dsv("|").parse(string) does not strip whitespace', () => {
  assert.deepStrictEqual(psv.parse("a|b|c\n 1| 2|3\n"), table([{ a: " 1", b: " 2", c: "3" }], ["a", "b", "c"]))
})

it('dsv("|").parse(string) parses quoted values', () => {
  assert.deepStrictEqual(psv.parse('a|b|c\n"1"|2|3'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(psv.parse('a|b|c\n"1"|2|3\n'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
})

it('dsv("|").parse(string) parses quoted values with quotes', () => {
  assert.deepStrictEqual(psv.parse('a\n"""hello"""'), table([{ a: '"hello"' }], ["a"]))
})

it('dsv("|").parse(string) parses quoted values with newlines', () => {
  assert.deepStrictEqual(psv.parse('a\n"new\nline"'), table([{ a: "new\nline" }], ["a"]))
  assert.deepStrictEqual(psv.parse('a\n"new\rline"'), table([{ a: "new\rline" }], ["a"]))
  assert.deepStrictEqual(psv.parse('a\n"new\r\nline"'), table([{ a: "new\r\nline" }], ["a"]))
})

it('dsv("|").parse(string) observes Unix, Mac and DOS newlines', () => {
  assert.deepStrictEqual(
    psv.parse('a|b|c\n1|2|3\n4|5|"6"\n7|8|9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    psv.parse('a|b|c\r1|2|3\r4|5|"6"\r7|8|9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    psv.parse('a|b|c\r\n1|2|3\r\n4|5|"6"\r\n7|8|9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
})

it('dsv("|").parse(string, row) returns the expected converted objects', () => {
  function row(d) {
    d.Hello = -d.Hello
    return d
  }
  assert.deepStrictEqual(
    psv.parse(readFileSync("test/data/sample.psv", "utf-8"), row),
    table([{ Hello: -42, World: '"fish"' }], ["Hello", "World"])
  )
  assert.deepStrictEqual(
    psv.parse("a|b|c\n1|2|3\n", function (d) {
      return d
    }),
    table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"])
  )
})

it('dsv("|").parse(string, row) skips rows if row returns null or undefined', () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(psv.parse("field\n42\n\n\n\n", row), table([{ field: "42" }, false], ["field"]))
  assert.deepStrictEqual(
    psv.parse("a|b|c\n1|2|3\n2|3|4", function (d) {
      return d.a & 1 ? null : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
  assert.deepStrictEqual(
    psv.parse("a|b|c\n1|2|3\n2|3|4", function (d) {
      return d.a & 1 ? undefined : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
})

it('dsv("|").parse(string, row) invokes row(d, i, columns) for each row d, in order', () => {
  const rows = []
  psv.parse("a\n1\n2\n3\n4", function (d, i, columns) {
    rows.push({ d: d, i: i, columns: columns })
  })
  assert.deepStrictEqual(rows, [
    { d: { a: "1" }, i: 0, columns: ["a"] },
    { d: { a: "2" }, i: 1, columns: ["a"] },
    { d: { a: "3" }, i: 2, columns: ["a"] },
    { d: { a: "4" }, i: 3, columns: ["a"] },
  ])
})

it('dsv("|").parseRows(string) returns the expected array of array of string', () => {
  assert.deepStrictEqual(psv.parseRows("a|b|c\n"), [["a", "b", "c"]])
})

it('dsv("|").parseRows(string) parses quoted values', () => {
  assert.deepStrictEqual(psv.parseRows('"1"|2|3\n'), [["1", "2", "3"]])
  assert.deepStrictEqual(psv.parseRows('"hello"'), [["hello"]])
})

it('dsv("|").parseRows(string) parses quoted values with quotes', () => {
  assert.deepStrictEqual(psv.parseRows('"""hello"""'), [['"hello"']])
})

it('dsv("|").parseRows(string) parses quoted values with newlines', () => {
  assert.deepStrictEqual(psv.parseRows('"new\nline"'), [["new\nline"]])
  assert.deepStrictEqual(psv.parseRows('"new\rline"'), [["new\rline"]])
  assert.deepStrictEqual(psv.parseRows('"new\r\nline"'), [["new\r\nline"]])
})

it('dsv("|").parseRows(string) parses Unix, Mac and DOS newlines', () => {
  assert.deepStrictEqual(psv.parseRows('a|b|c\n1|2|3\n4|5|"6"\n7|8|9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(psv.parseRows('a|b|c\r1|2|3\r4|5|"6"\r7|8|9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(psv.parseRows('a|b|c\r\n1|2|3\r\n4|5|"6"\r\n7|8|9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
})

it('dsv("|").parseRows(string, row) returns the expected converted array of array of string', () => {
  function row(d, i) {
    if (i) d[0] = -d[0]
    return d
  }
  assert.deepStrictEqual(psv.parseRows(readFileSync("test/data/sample.psv", "utf-8"), row), [
    ["Hello", "World"],
    [-42, '"fish"'],
  ])
  assert.deepStrictEqual(
    psv.parseRows("a|b|c\n1|2|3\n", function (d) {
      return d
    }),
    [
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]
  )
})

it('dsv("|").parseRows(string, row) skips rows if row returns null or undefined', () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(psv.parseRows("field\n42\n\n\n", row), [["field"], false])
  assert.deepStrictEqual(
    psv.parseRows("a|b|c\n1|2|3\n2|3|4", function (d, i) {
      return i & 1 ? null : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
  assert.deepStrictEqual(
    psv.parseRows("a|b|c\n1|2|3\n2|3|4", function (d, i) {
      return i & 1 ? undefined : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
})

it('dsv("|").parseRows(string, row) invokes row(d, i) for each row d, in order', () => {
  const rows = []
  psv.parseRows("a\n1\n2\n3\n4", function (d, i) {
    rows.push({ d: d, i: i })
  })
  assert.deepStrictEqual(rows, [
    { d: ["a"], i: 0 },
    { d: ["1"], i: 1 },
    { d: ["2"], i: 2 },
    { d: ["3"], i: 3 },
    { d: ["4"], i: 4 },
  ])
})

it('dsv("|").format(array) takes an array of objects as input', () => {
  assert.deepStrictEqual(psv.format([{ a: 1, b: 2, c: 3 }]), "a|b|c\n1|2|3")
})

it('dsv("|").format(array) escapes field names and values containing delimiters', () => {
  assert.deepStrictEqual(psv.format([{ "foo|bar": true }]), '"foo|bar"\ntrue')
  assert.deepStrictEqual(psv.format([{ field: "foo|bar" }]), 'field\n"foo|bar"')
})

it('dsv("|").format(array) computes the union of all fields', () => {
  assert.deepStrictEqual(
    psv.format([{ a: 1 }, { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }, { b: 1, c: 2 }, { c: 1 }]),
    "a|b|c\n1||\n1|2|\n1|2|3\n|1|2\n||1"
  )
})

it('dsv("|").format(array) orders fields by first-seen', () => {
  assert.deepStrictEqual(
    psv.format([
      { a: 1, b: 2 },
      { c: 3, b: 4 },
      { c: 5, a: 1, b: 2 },
    ]),
    "a|b|c\n1|2|\n|4|3\n1|2|5"
  )
})

it('dsv("|").format(array, columns) observes the specified array of column names', () => {
  assert.deepStrictEqual(psv.format([{ a: 1, b: 2, c: 3 }], ["c", "b", "a"]), "c|b|a\n3|2|1")
  assert.deepStrictEqual(psv.format([{ a: 1, b: 2, c: 3 }], ["c", "a"]), "c|a\n3|1")
  assert.deepStrictEqual(psv.format([{ a: 1, b: 2, c: 3 }], []), "\n")
  assert.deepStrictEqual(psv.format([{ a: 1, b: 2, c: 3 }], ["d"]), "d\n")
})

it('dsv("|").formatRows(array) takes an array of array of string as input', () => {
  assert.deepStrictEqual(
    psv.formatRows([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]),
    "a|b|c\n1|2|3"
  )
})

it('dsv("|").formatRows(array) separates lines using Unix newline', () => {
  assert.deepStrictEqual(psv.formatRows([[], []]), "\n")
})

it('dsv("|").formatRows(array) does not strip whitespace', () => {
  assert.deepStrictEqual(
    psv.formatRows([
      ["a ", " b", "c"],
      ["1", "2", "3 "],
    ]),
    "a | b|c\n1|2|3 "
  )
})

it('dsv("|").formatRows(array) does not quote simple values', () => {
  assert.deepStrictEqual(psv.formatRows([["a"], [1]]), "a\n1")
})

it('dsv("|").formatRows(array) escapes double quotes', () => {
  assert.deepStrictEqual(psv.formatRows([['"fish"']]), '"""fish"""')
})

it('dsv("|").formatRows(array) escapes Unix newlines', () => {
  assert.deepStrictEqual(psv.formatRows([["new\nline"]]), '"new\nline"')
})

it('dsv("|").formatRows(array) escapes Windows newlines', () => {
  assert.deepStrictEqual(psv.formatRows([["new\rline"]]), '"new\rline"')
})

it('dsv("|").formatRows(array) escapes values containing delimiters', () => {
  assert.deepStrictEqual(psv.formatRows([["oxford|tab"]]), '"oxford|tab"')
})

it('dsv("|").formatRow(array) takes a single array of string as input', () => {
  assert.deepStrictEqual(psv.formatRow(["a", "b", "c"]), "a|b|c")
})
export function table(rows, columns) {
  rows.columns = columns
  return rows
}
import assert from "assert"
import { readFileSync } from "fs"
import { tsvFormat, tsvFormatRow, tsvFormatRows, tsvParse, tsvParseRows } from "../src/index.js"
import { table } from "./table.js"

it("tsvParse(string) returns the expected objects", () => {
  assert.deepStrictEqual(tsvParse("a\tb\tc\n1\t2\t3\n"), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(
    tsvParse(readFileSync("test/data/sample.tsv", "utf-8")),
    table([{ Hello: "42", World: '"fish"' }], ["Hello", "World"])
  )
})

it("tsvParse(string) does not strip whitespace", () => {
  assert.deepStrictEqual(tsvParse("a\tb\tc\n 1\t 2\t3\n"), table([{ a: " 1", b: " 2", c: "3" }], ["a", "b", "c"]))
})

it("tsvParse(string) parses quoted values", () => {
  assert.deepStrictEqual(tsvParse('a\tb\tc\n"1"\t2\t3'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
  assert.deepStrictEqual(tsvParse('a\tb\tc\n"1"\t2\t3\n'), table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"]))
})

it("tsvParse(string) parses quoted values with quotes", () => {
  assert.deepStrictEqual(tsvParse('a\n"""hello"""'), table([{ a: '"hello"' }], ["a"]))
})

it("tsvParse(string) parses quoted values with newlines", () => {
  assert.deepStrictEqual(tsvParse('a\n"new\nline"'), table([{ a: "new\nline" }], ["a"]))
  assert.deepStrictEqual(tsvParse('a\n"new\rline"'), table([{ a: "new\rline" }], ["a"]))
  assert.deepStrictEqual(tsvParse('a\n"new\r\nline"'), table([{ a: "new\r\nline" }], ["a"]))
})

it("tsvParse(string) observes Unix, Mac and DOS newlines", () => {
  assert.deepStrictEqual(
    tsvParse('a\tb\tc\n1\t2\t3\n4\t5\t"6"\n7\t8\t9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    tsvParse('a\tb\tc\r1\t2\t3\r4\t5\t"6"\r7\t8\t9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
  assert.deepStrictEqual(
    tsvParse('a\tb\tc\r\n1\t2\t3\r\n4\t5\t"6"\r\n7\t8\t9'),
    table(
      [
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5", c: "6" },
        { a: "7", b: "8", c: "9" },
      ],
      ["a", "b", "c"]
    )
  )
})

it("tsvParse(string, row) returns the expected converted objects", () => {
  function row(d) {
    d.Hello = -d.Hello
    return d
  }
  assert.deepStrictEqual(
    tsvParse(readFileSync("test/data/sample.tsv", "utf-8"), row),
    table([{ Hello: -42, World: '"fish"' }], ["Hello", "World"])
  )
  assert.deepStrictEqual(
    tsvParse("a\tb\tc\n1\t2\t3\n", function (d) {
      return d
    }),
    table([{ a: "1", b: "2", c: "3" }], ["a", "b", "c"])
  )
})

it("tsvParse(string, row) skips rows if row returns null or undefined", () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(tsvParse("field\n42\n\n\n\n", row), table([{ field: "42" }, false], ["field"]))
  assert.deepStrictEqual(
    tsvParse("a\tb\tc\n1\t2\t3\n2\t3\t4", function (d) {
      return d.a & 1 ? null : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
  assert.deepStrictEqual(
    tsvParse("a\tb\tc\n1\t2\t3\n2\t3\t4", function (d) {
      return d.a & 1 ? undefined : d
    }),
    table([{ a: "2", b: "3", c: "4" }], ["a", "b", "c"])
  )
})

it("tsvParse(string, row) invokes row(d, i) for each row d, in order", () => {
  const rows = []
  tsvParse("a\n1\n2\n3\n4", function (d, i) {
    rows.push({ d: d, i: i })
  })
  assert.deepStrictEqual(rows, [
    { d: { a: "1" }, i: 0 },
    { d: { a: "2" }, i: 1 },
    { d: { a: "3" }, i: 2 },
    { d: { a: "4" }, i: 3 },
  ])
})

it("tsvParse(string) accepts numbers as names", () => {
  assert.deepStrictEqual(tsvParse('11\t22\t33\n"a"\tb\t0'), table([{ 11: "a", 22: "b", 33: "0" }], ["11", "22", "33"]))
})

it("tsvParseRows(string) returns the expected array of array of string", () => {
  assert.deepStrictEqual(tsvParseRows("a\tb\tc\n"), [["a", "b", "c"]])
})

it("tsvParseRows(string) parses quoted values", () => {
  assert.deepStrictEqual(tsvParseRows('"1"\t2\t3\n'), [["1", "2", "3"]])
  assert.deepStrictEqual(tsvParseRows('"hello"'), [["hello"]])
})

it("tsvParseRows(string) parses quoted values with quotes", () => {
  assert.deepStrictEqual(tsvParseRows('"""hello"""'), [['"hello"']])
})

it("tsvParseRows(string) parses quoted values with newlines", () => {
  assert.deepStrictEqual(tsvParseRows('"new\nline"'), [["new\nline"]])
  assert.deepStrictEqual(tsvParseRows('"new\rline"'), [["new\rline"]])
  assert.deepStrictEqual(tsvParseRows('"new\r\nline"'), [["new\r\nline"]])
})

it("tsvParseRows(string) parses Unix, Mac and DOS newlines", () => {
  assert.deepStrictEqual(tsvParseRows('a\tb\tc\n1\t2\t3\n4\t5\t"6"\n7\t8\t9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(tsvParseRows('a\tb\tc\r1\t2\t3\r4\t5\t"6"\r7\t8\t9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
  assert.deepStrictEqual(tsvParseRows('a\tb\tc\r\n1\t2\t3\r\n4\t5\t"6"\r\n7\t8\t9'), [
    ["a", "b", "c"],
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ])
})

it("tsvParseRows(string, row) returns the expected converted array of array of string", () => {
  function row(d, i) {
    if (i) d[0] = -d[0]
    return d
  }
  assert.deepStrictEqual(tsvParseRows(readFileSync("test/data/sample.tsv", "utf-8"), row), [
    ["Hello", "World"],
    [-42, '"fish"'],
  ])
  assert.deepStrictEqual(
    tsvParseRows("a\tb\tc\n1\t2\t3\n", function (d) {
      return d
    }),
    [
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]
  )
})

it("tsvParseRows(string, row) skips rows if row returns null or undefined", () => {
  function row(d, i) {
    return [d, null, undefined, false][i]
  }
  assert.deepStrictEqual(tsvParseRows("field\n42\n\n\n", row), [["field"], false])
  assert.deepStrictEqual(
    tsvParseRows("a\tb\tc\n1\t2\t3\n2\t3\t4", function (d, i) {
      return i & 1 ? null : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
  assert.deepStrictEqual(
    tsvParseRows("a\tb\tc\n1\t2\t3\n2\t3\t4", function (d, i) {
      return i & 1 ? undefined : d
    }),
    [
      ["a", "b", "c"],
      ["2", "3", "4"],
    ]
  )
})

it("tsvParseRows(string, row) invokes row(d, i) for each row d, in order", () => {
  const rows = []
  tsvParseRows("a\n1\n2\n3\n4", function (d, i) {
    rows.push({ d: d, i: i })
  })
  assert.deepStrictEqual(rows, [
    { d: ["a"], i: 0 },
    { d: ["1"], i: 1 },
    { d: ["2"], i: 2 },
    { d: ["3"], i: 3 },
    { d: ["4"], i: 4 },
  ])
})

it("tsvFormat(array) takes an array of objects as input", () => {
  assert.deepStrictEqual(tsvFormat([{ a: 1, b: 2, c: 3 }]), "a\tb\tc\n1\t2\t3")
})

it("tsvFormat(array) escapes field names and values containing delimiters", () => {
  assert.deepStrictEqual(tsvFormat([{ "foo\tbar": true }]), '"foo\tbar"\ntrue')
  assert.deepStrictEqual(tsvFormat([{ field: "foo\tbar" }]), 'field\n"foo\tbar"')
})

it("tsvFormat(array) computes the union of all fields", () => {
  assert.deepStrictEqual(
    tsvFormat([{ a: 1 }, { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }, { b: 1, c: 2 }, { c: 1 }]),
    "a\tb\tc\n1\t\t\n1\t2\t\n1\t2\t3\n\t1\t2\n\t\t1"
  )
})

it("tsvFormat(array) orders fields by first-seen", () => {
  assert.deepStrictEqual(
    tsvFormat([
      { a: 1, b: 2 },
      { c: 3, b: 4 },
      { c: 5, a: 1, b: 2 },
    ]),
    "a\tb\tc\n1\t2\t\n\t4\t3\n1\t2\t5"
  )
})

it("tsvFormat(array, columns) observes the specified array of column names", () => {
  assert.deepStrictEqual(tsvFormat([{ a: 1, b: 2, c: 3 }], ["c", "b", "a"]), "c\tb\ta\n3\t2\t1")
  assert.deepStrictEqual(tsvFormat([{ a: 1, b: 2, c: 3 }], ["c", "a"]), "c\ta\n3\t1")
  assert.deepStrictEqual(tsvFormat([{ a: 1, b: 2, c: 3 }], []), "\n")
  assert.deepStrictEqual(tsvFormat([{ a: 1, b: 2, c: 3 }], ["d"]), "d\n")
})

it("tsvFormatRows(array) takes an array of array of string as input", () => {
  assert.deepStrictEqual(
    tsvFormatRows([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]),
    "a\tb\tc\n1\t2\t3"
  )
})

it("tsvFormatRows(array) separates lines using Unix newline", () => {
  assert.deepStrictEqual(tsvFormatRows([[], []]), "\n")
})

it("tsvFormatRows(array) does not strip whitespace", () => {
  assert.deepStrictEqual(
    tsvFormatRows([
      ["a ", " b", "c"],
      ["1", "2", "3 "],
    ]),
    "a \t b\tc\n1\t2\t3 "
  )
})

it("tsvFormatRows(array) does not quote simple values", () => {
  assert.deepStrictEqual(tsvFormatRows([["a"], [1]]), "a\n1")
})

it("tsvFormatRows(array) escapes double quotes", () => {
  assert.deepStrictEqual(tsvFormatRows([['"fish"']]), '"""fish"""')
})

it("tsvFormatRows(array) escapes Unix newlines", () => {
  assert.deepStrictEqual(tsvFormatRows([["new\nline"]]), '"new\nline"')
})

it("tsvFormatRows(array) escapes Windows newlines", () => {
  assert.deepStrictEqual(tsvFormatRows([["new\rline"]]), '"new\rline"')
})

it("tsvFormatRows(array) escapes values containing delimiters", () => {
  assert.deepStrictEqual(tsvFormatRows([["oxford\ttab"]]), '"oxford\ttab"')
})

it("tsvFormatRow(array) takes a single array of string as input", () => {
  assert.deepStrictEqual(tsvFormatRow(["a", "b", "c"]), "a\tb\tc")
})
