import type * as qt from "./types.js"

export function autoType<R extends object | undefined | null, T extends string>(
  object: qt.DSVRowString<T> | readonly string[]
): R {
  for (const key in object) {
    var value = object[key].trim(),
      number,
      m
    if (!value) value = null
    else if (value === "true") value = true
    else if (value === "false") value = false
    else if (value === "NaN") value = NaN
    else if (!isNaN((number = +value))) value = number
    else if (
      (m = value.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/))
    ) {
      if (fixtz && !!m[4] && !m[7]) value = value.replace(/-/g, "/").replace(/T/, " ")
      value = new Date(value)
    } else continue
    object[key] = value
  }
  return object
}
const fixtz = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours()
const csv = dsvFormat(",")
export function csvParse<C extends string>(csvString: string): qt.DSVRowArray<C>
export function csvParse<R extends object, T extends string>(
  csvString: string,
  row: (rawRow: qt.DSVRowString<T>, i: number, columns: T[]) => R | undefined | null
): qt.DSVParsedArray<R>
export function csvParse = csv.parse
export function csvParseRows(csvString: string): string[][]
export function csvParseRows<R extends object>(
  csvString: string,
  row: (rawRow: string[], i: number) => R | undefined | null
): R[]
export function csvParseRows = csv.parseRows
export function csvFormat<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function csvFormat = csv.format
export function csvFormatBody<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function csvFormatBody = csv.formatBody
export function csvFormatRows(xs: readonly string[][]): string
export function csvFormatRows = csv.formatRows
export function csvFormatRow(x: readonly string[]): string
export function csvFormatRow = csv.formatRow
export function csvFormatValue(x: string): string
export function csvFormatValue = csv.formatValue
const EOL = {},
  EOF = {},
  QUOTE = 34,
  NEWLINE = 10,
  RETURN = 13
function objectConverter(columns) {
  return new Function(
    "d",
    "return {" +
      columns
        .map(function (name, i) {
          return JSON.stringify(name) + ": d[" + i + '] || ""'
        })
        .join(",") +
      "}"
  )
}
function customConverter(columns, f) {
  const object = objectConverter(columns)
  return function (row, i) {
    return f(object(row), i, columns)
  }
}
function inferColumns(rows) {
  const columnSet = Object.create(null),
    columns = []
  rows.forEach(function (row) {
    for (const column in row) {
      if (!(column in columnSet)) {
        columns.push((columnSet[column] = column))
      }
    }
  })
  return columns
}
function pad(value, width) {
  const s = value + "",
    length = s.length
  return length < width ? new Array(width - length + 1).join(0) + s : s
}
function formatYear(year) {
  return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4)
}
function formatDate(date) {
  const hours = date.getUTCHours(),
    minutes = date.getUTCMinutes(),
    seconds = date.getUTCSeconds(),
    milliseconds = date.getUTCMilliseconds()
  return isNaN(date)
    ? "Invalid Date"
    : formatYear(date.getUTCFullYear(), 4) +
        "-" +
        pad(date.getUTCMonth() + 1, 2) +
        "-" +
        pad(date.getUTCDate(), 2) +
        (milliseconds
          ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds
          ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours
          ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "")
}
export function dsvFormat(delimiter: string): qt.DSV {
  const reFormat = new RegExp('["' + delimiter + "\n\r]"),
    DELIMITER = delimiter.charCodeAt(0)
  function parse(text, f) {
    let convert,
      columns,
      rows = parseRows(text, function (row, i) {
        if (convert) return convert(row, i - 1)
        ;(columns = row), (convert = f ? customConverter(row, f) : objectConverter(row))
      })
    rows.columns = columns || []
    return rows
  }
  function parseRows(text, f) {
    let rows = [],
      N = text.length,
      I = 0,
      n = 0,
      t,
      eof = N <= 0,
      eol = false
    if (text.charCodeAt(N - 1) === NEWLINE) --N
    if (text.charCodeAt(N - 1) === RETURN) --N
    function token() {
      if (eof) return EOF
      if (eol) return (eol = false), EOL
      let i,
        j = I,
        c
      if (text.charCodeAt(j) === QUOTE) {
        while ((I++ < N && text.charCodeAt(I) !== QUOTE) || text.charCodeAt(++I) === QUOTE);
        if ((i = I) >= N) eof = true
        else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true
        else if (c === RETURN) {
          eol = true
          if (text.charCodeAt(I) === NEWLINE) ++I
        }
        return text.slice(j + 1, i - 1).replace(/""/g, '"')
      }
      while (I < N) {
        if ((c = text.charCodeAt((i = I++))) === NEWLINE) eol = true
        else if (c === RETURN) {
          eol = true
          if (text.charCodeAt(I) === NEWLINE) ++I
        } else if (c !== DELIMITER) continue
        return text.slice(j, i)
      }
      return (eof = true), text.slice(j, N)
    }
    while ((t = token()) !== EOF) {
      let row = []
      while (t !== EOL && t !== EOF) row.push(t), (t = token())
      if (f && (row = f(row, n++)) == null) continue
      rows.push(row)
    }
    return rows
  }
  function preformatBody(rows, columns) {
    return rows.map(function (row) {
      return columns
        .map(function (column) {
          return formatValue(row[column])
        })
        .join(delimiter)
    })
  }
  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows)
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n")
  }
  function formatBody(rows, columns) {
    if (columns == null) columns = inferColumns(rows)
    return preformatBody(rows, columns).join("\n")
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n")
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter)
  }
  function formatValue(value) {
    return value == null
      ? ""
      : value instanceof Date
      ? formatDate(value)
      : reFormat.test((value += ""))
      ? '"' + value.replace(/"/g, '""') + '"'
      : value
  }
  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatBody: formatBody,
    formatRows: formatRows,
    formatRow: formatRow,
    formatValue: formatValue,
  }
}
const tsv = dsvFormat("\t")
export function tsvParse<C extends string>(tsvString: string): qt.DSVRowArray<C>
export function tsvParse<R extends object, C extends string>(
  tsvString: string,
  row: (rawRow: qt.DSVRowString<C>, i: number, columns: C[]) => R | undefined | null
): qt.DSVParsedArray<R>
export function tsvParse = tsv.parse
export function tsvParseRows(tsvString: string): string[][]
export function tsvParseRows<T extends object>(
  tsvString: string,
  row: (rawRow: string[], i: number) => T | undefined | null
): T[]
export function tsvParseRows = tsv.parseRows
export function tsvFormat<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function tsvFormat = tsv.format
export function tsvFormatBody<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function tsvFormatBody = tsv.formatBody
export function tsvFormatRows(xs: readonly string[][]): string
export function tsvFormatRows = tsv.formatRows
export function tsvFormatRow(x: readonly string[]): string
export function tsvFormatRow = tsv.formatRow
export function tsvFormatValue(x: string): string
export function tsvFormatValue = tsv.formatValue

function responseBlob(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.blob()
}
export async function blob(url: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(url, init)
  return responseBlob(response)
}
function responseArrayBuffer(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.arrayBuffer()
}
export async function buffer(url: string, init?: RequestInit): Promise<ArrayBuffer> {
  const response = await fetch(url, init)
  return responseArrayBuffer(response)
}
function dsvParse(parse) {
  return function (input, init, row) {
    if (arguments.length === 2 && typeof init === "function") (row = init), (init = undefined)
    return text(input, init).then(function (response) {
      return parse(response, row)
    })
  }
}
export async function dsv<C extends string>(
  delimiter: string,
  url: string,
  init?: RequestInit
): Promise<qt.DSVRowArray<C>>
export async function dsv<R extends object, T extends string = string>(
  delimiter: string,
  url: string,
  row: (rawRow: qt.DSVRowString<T>, i: number, columns: T[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export function dsv<R extends object, C extends string = string>(
  delimiter: string,
  url: string,
  init: RequestInit,
  row: (rawRow: qt.DSVRowString<C>, i: number, columns: C[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export async function dsv(delimiter, input, init, row) {
  if (arguments.length === 3 && typeof init === "function") (row = init), (init = undefined)
  const format = dsvFormat(delimiter)
  const response = await text(input, init)
  return format.parse(response, row)
}
export function csv<C extends string>(url: string, init?: RequestInit): Promise<qt.DSVRowArray<C>>
export function csv<R extends object, C extends string = string>(
  url: string,
  row: (rawRow: qt.DSVRowString<C>, i: number, columns: C[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export function csv<R extends object, T extends string = string>(
  url: string,
  init: RequestInit,
  row: (rawRow: qt.DSVRowString<T>, i: number, columns: T[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export function csv = dsvParse(csvParse)
export function tsv<C extends string>(url: string, init?: RequestInit): Promise<qt.DSVRowArray<C>>
export function tsv<R extends object, C extends string = string>(
  url: string,
  row: (rawRow: qt.DSVRowString<C>, i: number, columns: C[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export function tsv<R extends object, C extends string = string>(
  url: string,
  init: RequestInit,
  row: (rawRow: qt.DSVRowString<C>, i: number, columns: C[]) => R | undefined | null
): Promise<qt.DSVParsedArray<R>>
export function tsv = dsvParse(tsvParse)
export function image(url: string, init?: Partial<HTMLImageElement>): Promise<HTMLImageElement> {
  return new Promise(function (resolve, reject) {
    const image = new Image()
    for (const key in init) image[key] = init[key]
    image.onerror = reject
    image.onload = function () {
      resolve(image)
    }
    image.src = url
  })
}
function responseJson(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  if (response.status === 204 || response.status === 205) return
  return response.json()
}
export async function json<T>(url: string, init?: RequestInit): Promise<T | undefined> {
  const response = await fetch(url, init)
  return responseJson(response)
}
function responseText(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.text()
}
export async function text(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init)
  return responseText(response)
}
function parser(type) {
  return (input, init) => text(input, init).then(text => new DOMParser().parseFromString(text, type))
}
export function xml(url: string, init?: RequestInit): Promise<XMLDocument>
export function xml = parser("application/xml")
export function html(url: string, init?: RequestInit): Promise<Document>
export function html = parser("text/html")
export function svg(url: string, init?: RequestInit): Promise<Document>
export function svg = parser("image/svg+xml")
