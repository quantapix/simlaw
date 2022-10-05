function responseBlob(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText);
  return response.blob();
}

export default function(input, init) {
  return fetch(input, init).then(responseBlob);
}
function responseArrayBuffer(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText);
  return response.arrayBuffer();
}

export default function(input, init) {
  return fetch(input, init).then(responseArrayBuffer);
}
import {csvParse, dsvFormat, tsvParse} from "d3-dsv";
import text from "./text.js";

function dsvParse(parse) {
  return function(input, init, row) {
    if (arguments.length === 2 && typeof init === "function") row = init, init = undefined;
    return text(input, init).then(function(response) {
      return parse(response, row);
    });
  };
}

export default function dsv(delimiter, input, init, row) {
  if (arguments.length === 3 && typeof init === "function") row = init, init = undefined;
  var format = dsvFormat(delimiter);
  return text(input, init).then(function(response) {
    return format.parse(response, row);
  });
}

export var csv = dsvParse(csvParse);
export var tsv = dsvParse(tsvParse);
export default function(input, init) {
  return new Promise(function(resolve, reject) {
    var image = new Image;
    for (var key in init) image[key] = init[key];
    image.onerror = reject;
    image.onload = function() { resolve(image); };
    image.src = input;
  });
}
export {default as blob} from "./blob.js";
export {default as buffer} from "./buffer.js";
export {default as dsv, csv, tsv} from "./dsv.js";
export {default as image} from "./image.js";
export {default as json} from "./json.js";
export {default as text} from "./text.js";
export {default as xml, html, svg} from "./xml.js";
function responseJson(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText);
  if (response.status === 204 || response.status === 205) return;
  return response.json();
}

export default function(input, init) {
  return fetch(input, init).then(responseJson);
}
function responseText(response) {
  if (!response.ok) throw new Error(response.status + " " + response.statusText);
  return response.text();
}

export default function(input, init) {
  return fetch(input, init).then(responseText);
}
import text from "./text.js";

function parser(type) {
  return (input, init) => text(input, init)
    .then(text => (new DOMParser).parseFromString(text, type));
}

export default parser("application/xml");

export var html = parser("text/html");

export var svg = parser("image/svg+xml");
