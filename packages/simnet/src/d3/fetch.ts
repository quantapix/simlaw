import { csvParse, dsvFormat, tsvParse } from "./dsv.js"
import text from "./text.js"
function responseBlob(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.blob()
}
export function (input, init) {
  return fetch(input, init).then(responseBlob)
}
function responseArrayBuffer(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.arrayBuffer()
}
export function (input, init) {
  return fetch(input, init).then(responseArrayBuffer)
}
function dsvParse(parse) {
  return function (input, init, row) {
    if (arguments.length === 2 && typeof init === "function") (row = init), (init = undefined)
    return text(input, init).then(function (response) {
      return parse(response, row)
    })
  }
}
export function dsv(delimiter, input, init, row) {
  if (arguments.length === 3 && typeof init === "function") (row = init), (init = undefined)
  var format = dsvFormat(delimiter)
  return text(input, init).then(function (response) {
    return format.parse(response, row)
  })
}
export const csv = dsvParse(csvParse)
export const tsv = dsvParse(tsvParse)
export function (input, init) {
  return new Promise(function (resolve, reject) {
    var image = new Image()
    for (var key in init) image[key] = init[key]
    image.onerror = reject
    image.onload = function () {
      resolve(image)
    }
    image.src = input
  })
}
function responseJson(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  if (response.status === 204 || response.status === 205) return
  return response.json()
}
export function (input, init) {
  return fetch(input, init).then(responseJson)
}
function responseText(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText)
  return response.text()
}
export function (input, init) {
  return fetch(input, init).then(responseText)
}
function parser(type) {
  return (input, init) => text(input, init).then(text => new DOMParser().parseFromString(text, type))
}
export default parser("application/xml")
export const html = parser("text/html")
export const svg = parser("image/svg+xml")
