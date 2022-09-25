import { map } from "./operator.js"
import { Observable } from "./observable.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export interface Config {
  url: string
  body?: any
  async?: boolean
  method?: string
  headers?: Readonly<Record<string, any>> | undefined
  timeout?: number
  user?: string
  password?: string
  crossDomain?: boolean
  withCredentials?: boolean
  xsrfCookieName?: string
  xsrfHeaderName?: string
  responseType?: XMLHttpRequestResponseType
  createXHR?: () => XMLHttpRequest
  progressSubscriber?: qt.PartialObserver<ProgressEvent>
  downloadProgress?: boolean
  uploadProgress?: boolean
  queryParams?:
    | string
    | URLSearchParams
    | Record<string, string | number | boolean | string[] | number[] | boolean[]>
    | [string, string | number | boolean | string[] | number[] | boolean[]][]
}

export interface Request {
  url: string
  body?: any
  method: string
  async: boolean
  headers: Readonly<Record<string, any>>
  timeout: number
  user?: string
  password?: string
  crossDomain: boolean
  withCredentials: boolean
  responseType: XMLHttpRequestResponseType
}

export type Direction = "upload" | "download"
export type ProgressType = "loadstart" | "progress" | "load"

export type ResponseType = `${Direction}_${ProgressType}`

export class Response<T> {
  readonly status: number
  readonly response: T
  readonly responseType: XMLHttpRequestResponseType
  readonly loaded: number
  readonly total: number
  readonly responseHeaders: Record<string, string>
  constructor(
    public readonly originalEvent: ProgressEvent,
    public readonly xhr: XMLHttpRequest,
    public readonly request: Request,
    public readonly type: ResponseType = "download_load"
  ) {
    const { status, responseType } = xhr
    this.status = status ?? 0
    this.responseType = responseType ?? ""
    const allHeaders = xhr.getAllResponseHeaders()
    this.responseHeaders = allHeaders
      ? allHeaders.split("\n").reduce((xs: Record<string, string>, line) => {
          const i = line.indexOf(": ")
          xs[line.slice(0, i)] = line.slice(i + 2)
          return xs
        }, {})
      : {}
    this.response = getXHRResponse(xhr)
    const { loaded, total } = originalEvent
    this.loaded = loaded
    this.total = total
  }
}

export interface CreationMethod {
  <T>(x: Config): Observable<Response<T>>
  <T>(url: string): Observable<Response<T>>
  get<T>(url: string, headers?: Record<string, string>): Observable<Response<T>>
  post<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>>
  put<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>>
  patch<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>>
  delete<T>(url: string, headers?: Record<string, string>): Observable<Response<T>>
  getJSON<T>(url: string, headers?: Record<string, string>): Observable<T>
}

function get<T>(url: string, headers?: Record<string, string>): Observable<Response<T>> {
  return ajax({ method: "GET", url, headers })
}
function post<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>> {
  return ajax({ method: "POST", url, body, headers })
}
function delete2<T>(url: string, headers?: Record<string, string>): Observable<Response<T>> {
  return ajax({ method: "DELETE", url, headers })
}
function put<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>> {
  return ajax({ method: "PUT", url, body, headers })
}
function patch<T>(url: string, body?: any, headers?: Record<string, string>): Observable<Response<T>> {
  return ajax({ method: "PATCH", url, body, headers })
}

const mapResponse = map((x: Response<any>) => x.response)

function getJSON<T>(url: string, headers?: Record<string, string>) {
  return mapResponse(ajax<T>({ method: "GET", url, headers })) as Observable<T>
}

export const ajax: CreationMethod = (() => {
  const create = <T>(x: string | Config) => {
    const y: Config = typeof x === "string" ? { url: x } : x
    return fromAjax<T>(y)
  }
  create.get = get
  create.post = post
  create.delete = delete2
  create.put = put
  create.patch = patch
  create.getJSON = getJSON
  return create
})()

const DOWNLOAD = "download"
const LOAD = "load"
const LOADSTART = "loadstart"
const PROGRESS = "progress"
const UPLOAD = "upload"

export function fromAjax<T>(cfg: Config): Observable<Response<T>> {
  return new Observable(dest => {
    const cfg2 = {
      async: true,
      crossDomain: false,
      withCredentials: false,
      method: "GET",
      timeout: 0,
      responseType: "json" as XMLHttpRequestResponseType,
      ...cfg,
    }
    const { queryParams, body: b, headers: hs } = cfg2
    let url = cfg2.url
    if (!url) throw new TypeError("url is required")
    if (queryParams) {
      let ps: URLSearchParams
      if (url.includes("?")) {
        const parts = url.split("?")
        if (2 < parts.length) throw new TypeError("invalid url")
        ps = new URLSearchParams(parts[1])
        new URLSearchParams(queryParams as any).forEach((v, k) => ps.set(k, v))
        url = parts[0] + "?" + ps
      } else {
        ps = new URLSearchParams(queryParams as any)
        url = url + "?" + ps
      }
    }
    const headers: Record<string, any> = {}
    if (hs) {
      for (const h in hs) {
        if (hs.hasOwnProperty(h)) headers[h.toLowerCase()] = hs[h]
      }
    }
    const cross = cfg2.crossDomain
    if (!cross && !("x-requested-with" in headers)) headers["x-requested-with"] = "XMLHttpRequest"

    const { withCredentials, xsrfCookieName, xsrfHeaderName } = cfg2
    if ((withCredentials || !cross) && xsrfCookieName && xsrfHeaderName) {
      const cookie = document?.cookie.match(new RegExp(`(^|;\\s*)(${xsrfCookieName})=([^;]*)`))?.pop() ?? ""
      if (cookie) headers[xsrfHeaderName] = cookie
    }
    const body = extract(b, headers)
    const req: Readonly<Request> = {
      ...cfg2,
      url,
      headers,
      body,
    }
    const y: XMLHttpRequest = cfg.createXHR ? cfg.createXHR() : new XMLHttpRequest()
    {
      const { progressSubscriber: sub, downloadProgress: download = false, uploadProgress: upload = false } = cfg
      const addError = (type: string, errorFactory: () => any) => {
        y.addEventListener(type, () => {
          const y2 = errorFactory()
          sub?.error?.(y2)
          dest.error(y2)
        })
      }
      addError("timeout", () => new timeoutError(y, req))
      addError("abort", () => new error("aborted", y, req))
      const createResponse = (d: Direction, x: ProgressEvent) =>
        new Response<T>(x, y, req, `${d}_${x.type as ProgressType}` as const)
      const addProgress = (x: any, type: string, d: Direction) => {
        x.addEventListener(type, (e: ProgressEvent) => {
          dest.next(createResponse(d, e))
        })
      }
      if (upload) {
        ;[LOADSTART, PROGRESS, LOAD].forEach(x => addProgress(y.upload, x, UPLOAD))
      }
      if (sub) {
        ;[LOADSTART, PROGRESS].forEach(x => y.upload.addEventListener(x, (e: any) => sub?.next?.(e)))
      }
      if (download) {
        ;[LOADSTART, PROGRESS].forEach(x => addProgress(y, x, DOWNLOAD))
      }
      const emitError = (status?: number) => {
        const m = "ajax error" + (status ? " " + status : "")
        dest.error(new error(m, y, req))
      }
      y.addEventListener("error", x => {
        sub?.error?.(x)
        emitError()
      })
      y.addEventListener(LOAD, x => {
        const { status } = y
        if (status < 400) {
          sub?.done?.()
          let y2: Response<T>
          try {
            y2 = createResponse(DOWNLOAD, x)
          } catch (e) {
            dest.error(e)
            return
          }
          dest.next(y2)
          dest.done()
        } else {
          sub?.error?.(x)
          emitError(status)
        }
      })
    }
    const { user, method, async } = req
    if (user) y.open(method, url, async, user, req.password)
    else y.open(method, url, async)
    if (async) {
      y.timeout = req.timeout
      y.responseType = req.responseType
    }
    if ("withCredentials" in y) y.withCredentials = req.withCredentials
    for (const h in headers) {
      if (headers.hasOwnProperty(h)) y.setRequestHeader(h, headers[h])
    }
    if (body) y.send(body)
    else y.send()
    return () => {
      if (y && y.readyState !== 4) y.abort()
    }
  })
}

function extract(x: any, xs: Record<string, string>) {
  if (
    !x ||
    typeof x === "string" ||
    isFormData(x) ||
    isURLSearchParams(x) ||
    isArrayBuffer(x) ||
    isFile(x) ||
    isBlob(x) ||
    isReadableStream(x)
  ) {
    return x
  }
  if (isArrayBufferView(x)) return x.buffer
  if (typeof x === "object") {
    xs["content-type"] = xs["content-type"] ?? "application/json;charset=utf-8"
    return JSON.stringify(x)
  }
  throw new TypeError("Unknown body type")
}

const _toString = Object.prototype.toString

function toStringCheck(x: any, name: string): boolean {
  return _toString.call(x) === `[object ${name}]`
}
function isArrayBuffer(x: any): x is ArrayBuffer {
  return toStringCheck(x, "ArrayBuffer")
}
function isFile(x: any): x is File {
  return toStringCheck(x, "File")
}
function isBlob(x: any): x is Blob {
  return toStringCheck(x, "Blob")
}
function isArrayBufferView(x: any): x is ArrayBufferView {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(x)
}
function isFormData(x: any): x is FormData {
  return typeof FormData !== "undefined" && x instanceof FormData
}
function isURLSearchParams(x: any): x is URLSearchParams {
  return typeof URLSearchParams !== "undefined" && x instanceof URLSearchParams
}
function isReadableStream(x: any): x is ReadableStream {
  return typeof ReadableStream !== "undefined" && x instanceof ReadableStream
}

export interface Err extends Error {
  xhr: XMLHttpRequest
  request: Request
  status: number
  responseType: XMLHttpRequestResponseType
  response: any
}
export interface ErrCtor {
  new (m: string, xhr: XMLHttpRequest, req: Request): Err
}

export const error: ErrCtor = qu.createErrorClass(
  _super =>
    function impl(this: any, m: string, x: XMLHttpRequest, req: Request) {
      this.message = m
      this.name = "AjaxError"
      this.xhr = x
      this.request = req
      this.status = x.status
      this.responseType = x.responseType
      let y: any
      try {
        y = getXHRResponse(x)
      } catch (err) {
        y = x.responseText
      }
      this.response = y
    }
)

export interface TimeoutErr extends Err {}
export interface TimeoutErrCtor {
  new (x: XMLHttpRequest, req: Request): TimeoutErr
}

export const timeoutError: TimeoutErrCtor = (() => {
  function impl(this: any, x: XMLHttpRequest, req: Request) {
    error.call(this, "ajax timeout", x, req)
    this.name = "AjaxTimeoutError"
    return this
  }
  impl.prototype = Object.create(error.prototype)
  return impl
})() as any

export function getXHRResponse(x: XMLHttpRequest) {
  switch (x.responseType) {
    case "json": {
      if ("response" in x) return x.response
      else return JSON.parse(x.responseText)
    }
    case "document":
      return x.responseXML
    case "text":
    default: {
      if ("response" in x) return x.response
      else return x.responseText
    }
  }
}
