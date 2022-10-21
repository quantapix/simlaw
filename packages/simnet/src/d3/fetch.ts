import { csvParse, dsvFormat, tsvParse } from "./dsv.js"
import type * as qt from "./types.js"

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
