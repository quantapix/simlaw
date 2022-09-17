import { map } from "./operator.js"
import { Observable } from "./observable.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class AjaxResponse<T> {
  readonly status: number
  readonly response: T
  readonly responseType: XMLHttpRequestResponseType
  readonly loaded: number
  readonly total: number
  readonly responseHeaders: Record<string, string>
  constructor(
    public readonly originalEvent: ProgressEvent,
    public readonly xhr: XMLHttpRequest,
    public readonly request: AjaxRequest,
    public readonly type: AjaxResponseType = "download_load"
  ) {
    const { status, responseType } = xhr
    this.status = status ?? 0
    this.responseType = responseType ?? ""
    const allHeaders = xhr.getAllResponseHeaders()
    this.responseHeaders = allHeaders
      ? allHeaders
          .split("\n")
          .reduce((headers: Record<string, string>, line) => {
            const index = line.indexOf(": ")
            headers[line.slice(0, index)] = line.slice(index + 2)
            return headers
          }, {})
      : {}
    this.response = getXHRResponse(xhr)
    const { loaded, total } = originalEvent
    this.loaded = loaded
    this.total = total
  }
}
export interface AjaxCreationMethod {
  <T>(config: AjaxConfig): Observable<AjaxResponse<T>>
  <T>(url: string): Observable<AjaxResponse<T>>
  get<T>(
    url: string,
    headers?: Record<string, string>
  ): Observable<AjaxResponse<T>>
  post<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Observable<AjaxResponse<T>>
  put<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Observable<AjaxResponse<T>>
  patch<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Observable<AjaxResponse<T>>
  delete<T>(
    url: string,
    headers?: Record<string, string>
  ): Observable<AjaxResponse<T>>
  getJSON<T>(url: string, headers?: Record<string, string>): Observable<T>
}
function ajaxGet<T>(
  url: string,
  headers?: Record<string, string>
): Observable<AjaxResponse<T>> {
  return ajax({ method: "GET", url, headers })
}
function ajaxPost<T>(
  url: string,
  body?: any,
  headers?: Record<string, string>
): Observable<AjaxResponse<T>> {
  return ajax({ method: "POST", url, body, headers })
}
function ajaxDelete<T>(
  url: string,
  headers?: Record<string, string>
): Observable<AjaxResponse<T>> {
  return ajax({ method: "DELETE", url, headers })
}
function ajaxPut<T>(
  url: string,
  body?: any,
  headers?: Record<string, string>
): Observable<AjaxResponse<T>> {
  return ajax({ method: "PUT", url, body, headers })
}
function ajaxPatch<T>(
  url: string,
  body?: any,
  headers?: Record<string, string>
): Observable<AjaxResponse<T>> {
  return ajax({ method: "PATCH", url, body, headers })
}
const mapResponse = map((x: AjaxResponse<any>) => x.response)
function ajaxGetJSON<T>(
  url: string,
  headers?: Record<string, string>
): Observable<T> {
  return mapResponse(
    ajax<T>({
      method: "GET",
      url,
      headers,
    })
  )
}

export const ajax: AjaxCreationMethod = (() => {
  const create = <T>(urlOrConfig: string | AjaxConfig) => {
    const config: AjaxConfig =
      typeof urlOrConfig === "string"
        ? {
            url: urlOrConfig,
          }
        : urlOrConfig
    return fromAjax<T>(config)
  }
  create.get = ajaxGet
  create.post = ajaxPost
  create.delete = ajaxDelete
  create.put = ajaxPut
  create.patch = ajaxPatch
  create.getJSON = ajaxGetJSON
  return create
})()

const UPLOAD = "upload"
const DOWNLOAD = "download"
const LOADSTART = "loadstart"
const PROGRESS = "progress"
const LOAD = "load"

export function fromAjax<T>(init: AjaxConfig): Observable<AjaxResponse<T>> {
  return new Observable(destination => {
    const config = {
      async: true,
      crossDomain: false,
      withCredentials: false,
      method: "GET",
      timeout: 0,
      responseType: "json" as XMLHttpRequestResponseType,
      ...init,
    }
    const {
      queryParams,
      body: configuredBody,
      headers: configuredHeaders,
    } = config
    let url = config.url
    if (!url) {
      throw new TypeError("url is required")
    }
    if (queryParams) {
      let searchParams: URLSearchParams
      if (url.includes("?")) {
        const parts = url.split("?")
        if (2 < parts.length) {
          throw new TypeError("invalid url")
        }
        searchParams = new URLSearchParams(parts[1])
        new URLSearchParams(queryParams as any).forEach((value, key) =>
          searchParams.set(key, value)
        )
        url = parts[0] + "?" + searchParams
      } else {
        searchParams = new URLSearchParams(queryParams as any)
        url = url + "?" + searchParams
      }
    }
    const headers: Record<string, any> = {}
    if (configuredHeaders) {
      for (const key in configuredHeaders) {
        if (configuredHeaders.hasOwnProperty(key)) {
          headers[key.toLowerCase()] = configuredHeaders[key]
        }
      }
    }
    const crossDomain = config.crossDomain
    if (!crossDomain && !("x-requested-with" in headers)) {
      headers["x-requested-with"] = "XMLHttpRequest"
    }
    const { withCredentials, xsrfCookieName, xsrfHeaderName } = config
    if ((withCredentials || !crossDomain) && xsrfCookieName && xsrfHeaderName) {
      const xsrfCookie =
        document?.cookie
          .match(new RegExp(`(^|;\\s*)(${xsrfCookieName})=([^;]*)`))
          ?.pop() ?? ""
      if (xsrfCookie) {
        headers[xsrfHeaderName] = xsrfCookie
      }
    }
    const body = extractContentTypeAndMaybeSerializeBody(
      configuredBody,
      headers
    )
    const _request: Readonly<AjaxRequest> = {
      ...config,
      url,
      headers,
      body,
    }
    let xhr: XMLHttpRequest
    xhr = init.createXHR ? init.createXHR() : new XMLHttpRequest()
    {
      const {
        progressSubscriber,
        includeDownloadProgress = false,
        includeUploadProgress = false,
      } = init
      const addErrorEvent = (type: string, errorFactory: () => any) => {
        xhr.addEventListener(type, () => {
          const error = errorFactory()
          progressSubscriber?.error?.(error)
          destination.error(error)
        })
      }
      addErrorEvent("timeout", () => new AjaxTimeoutError(xhr, _request))
      addErrorEvent("abort", () => new AjaxError("aborted", xhr, _request))
      const createResponse = (direction: AjaxDirection, event: ProgressEvent) =>
        new AjaxResponse<T>(
          event,
          xhr,
          _request,
          `${direction}_${event.type as ProgressEventType}` as const
        )
      const addProgressEvent = (
        target: any,
        type: string,
        direction: AjaxDirection
      ) => {
        target.addEventListener(type, (event: ProgressEvent) => {
          destination.next(createResponse(direction, event))
        })
      }
      if (includeUploadProgress) {
        ;[LOADSTART, PROGRESS, LOAD].forEach(type =>
          addProgressEvent(xhr.upload, type, UPLOAD)
        )
      }
      if (progressSubscriber) {
        ;[LOADSTART, PROGRESS].forEach(type =>
          xhr.upload.addEventListener(type, (e: any) =>
            progressSubscriber?.next?.(e)
          )
        )
      }
      if (includeDownloadProgress) {
        ;[LOADSTART, PROGRESS].forEach(type =>
          addProgressEvent(xhr, type, DOWNLOAD)
        )
      }
      const emitError = (status?: number) => {
        const msg = "ajax error" + (status ? " " + status : "")
        destination.error(new AjaxError(msg, xhr, _request))
      }
      xhr.addEventListener("error", e => {
        progressSubscriber?.error?.(e)
        emitError()
      })
      xhr.addEventListener(LOAD, event => {
        const { status } = xhr
        if (status < 400) {
          progressSubscriber?.complete?.()
          let response: AjaxResponse<T>
          try {
            response = createResponse(DOWNLOAD, event)
          } catch (err) {
            destination.error(err)
            return
          }
          destination.next(response)
          destination.complete()
        } else {
          progressSubscriber?.error?.(event)
          emitError(status)
        }
      })
    }
    const { user, method, async } = _request
    if (user) {
      xhr.open(method, url, async, user, _request.password)
    } else {
      xhr.open(method, url, async)
    }
    if (async) {
      xhr.timeout = _request.timeout
      xhr.responseType = _request.responseType
    }
    if ("withCredentials" in xhr) {
      xhr.withCredentials = _request.withCredentials
    }
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key])
      }
    }
    if (body) {
      xhr.send(body)
    } else {
      xhr.send()
    }
    return () => {
      if (xhr && xhr.readyState !== 4) {
        xhr.abort()
      }
    }
  })
}

function extractContentTypeAndMaybeSerializeBody(
  body: any,
  headers: Record<string, string>
) {
  if (
    !body ||
    typeof body === "string" ||
    isFormData(body) ||
    isURLSearchParams(body) ||
    isArrayBuffer(body) ||
    isFile(body) ||
    isBlob(body) ||
    isReadableStream(body)
  ) {
    return body
  }
  if (isArrayBufferView(body)) {
    return body.buffer
  }
  if (typeof body === "object") {
    headers["content-type"] =
      headers["content-type"] ?? "application/json;charset=utf-8"
    return JSON.stringify(body)
  }
  throw new TypeError("Unknown body type")
}

const _toString = Object.prototype.toString

function toStringCheck(obj: any, name: string): boolean {
  return _toString.call(obj) === `[object ${name}]`
}
function isArrayBuffer(body: any): body is ArrayBuffer {
  return toStringCheck(body, "ArrayBuffer")
}
function isFile(body: any): body is File {
  return toStringCheck(body, "File")
}
function isBlob(body: any): body is Blob {
  return toStringCheck(body, "Blob")
}
function isArrayBufferView(body: any): body is ArrayBufferView {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(body)
}
function isFormData(body: any): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData
}
function isURLSearchParams(body: any): body is URLSearchParams {
  return (
    typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams
  )
}
function isReadableStream(body: any): body is ReadableStream {
  return typeof ReadableStream !== "undefined" && body instanceof ReadableStream
}

export interface AjaxError extends Error {
  xhr: XMLHttpRequest
  request: AjaxRequest
  status: number
  responseType: XMLHttpRequestResponseType
  response: any
}

export interface AjaxErrorCtor {
  new (message: string, xhr: XMLHttpRequest, request: AjaxRequest): AjaxError
}

export const AjaxError: AjaxErrorCtor = qu.createErrorClass(
  _super =>
    function AjaxErrorImpl(
      this: any,
      message: string,
      xhr: XMLHttpRequest,
      request: AjaxRequest
    ) {
      this.message = message
      this.name = "AjaxError"
      this.xhr = xhr
      this.request = request
      this.status = xhr.status
      this.responseType = xhr.responseType
      let response: any
      try {
        response = getXHRResponse(xhr)
      } catch (err) {
        response = xhr.responseText
      }
      this.response = response
    }
)

export interface AjaxTimeoutError extends AjaxError {}

export interface AjaxTimeoutErrorCtor {
  new (xhr: XMLHttpRequest, request: AjaxRequest): AjaxTimeoutError
}

export const AjaxTimeoutError: AjaxTimeoutErrorCtor = (() => {
  function AjaxTimeoutErrorImpl(
    this: any,
    xhr: XMLHttpRequest,
    request: AjaxRequest
  ) {
    AjaxError.call(this, "ajax timeout", xhr, request)
    this.name = "AjaxTimeoutError"
    return this
  }
  AjaxTimeoutErrorImpl.prototype = Object.create(AjaxError.prototype)
  return AjaxTimeoutErrorImpl
})() as any
export function getXHRResponse(xhr: XMLHttpRequest) {
  switch (xhr.responseType) {
    case "json": {
      if ("response" in xhr) return xhr.response
      else {
        const ieXHR: any = xhr
        return JSON.parse(ieXHR.responseText)
      }
    }
    case "document":
      return xhr.responseXML
    case "text":
    default: {
      if ("response" in xhr) return xhr.response
      else {
        const ieXHR: any = xhr
        return ieXHR.responseText
      }
    }
  }
}

export type AjaxDirection = "upload" | "download"
export type ProgressEventType = "loadstart" | "progress" | "load"

export type AjaxResponseType = `${AjaxDirection}_${ProgressEventType}`

export interface AjaxRequest {
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
export interface AjaxConfig {
  url: string
  body?: any
  async?: boolean
  method?: string
  headers?: Readonly<Record<string, any>>
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
  includeDownloadProgress?: boolean
  includeUploadProgress?: boolean
  queryParams?:
    | string
    | URLSearchParams
    | Record<
        string,
        string | number | boolean | string[] | number[] | boolean[]
      >
    | [string, string | number | boolean | string[] | number[] | boolean[]][]
}
