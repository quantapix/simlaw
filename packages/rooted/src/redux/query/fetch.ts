import { isPlainObject } from "../../redux/index.js"
import { joinUrls } from "./utils.js"
import type * as qt from "./types.js"

export type ResponseHandler =
  | "json"
  | "text"
  | ((response: Response) => Promise<any>)
type CustomRequestInit = qt.Override<
  RequestInit,
  {
    headers?:
      | Headers
      | string[][]
      | Record<string, string | undefined>
      | undefined
  }
>
export interface FetchArgs extends CustomRequestInit {
  url: string
  params?: Record<string, any>
  body?: any
  responseHandler?: ResponseHandler
  validateStatus?: (response: Response, body: any) => boolean
}
const defaultFetchFn: typeof fetch = (...args) => fetch(...args)
const defaultValidateStatus = (response: Response) =>
  response.status >= 200 && response.status <= 299
const isJsonContentType = (headers: Headers) =>
  headers.get("content-type")?.trim()?.startsWith("application/json")
const handleResponse = async (
  response: Response,
  responseHandler: ResponseHandler
) => {
  if (typeof responseHandler === "function") {
    return responseHandler(response)
  }
  if (responseHandler === "text") {
    return response.text()
  }
  if (responseHandler === "json") {
    const text = await response.text()
    return text.length ? JSON.parse(text) : null
  }
}
export type FetchBaseQueryError =
  | {
      status: number
      data: unknown
    }
  | {
      status: "FETCH_ERROR"
      data?: undefined
      error: string
    }
  | {
      status: "PARSING_ERROR"
      originalStatus: number
      data: string
      error: string
    }
  | {
      status: "CUSTOM_ERROR"
      data?: unknown
      error: string
    }
function stripUndefined(obj: any) {
  if (!isPlainObject(obj)) {
    return obj
  }
  const copy: Record<string, any> = { ...obj }
  for (const [k, v] of Object.entries(copy)) {
    if (v === undefined) delete copy[k]
  }
  return copy
}
export type FetchBaseQueryArgs = {
  baseUrl?: string
  prepareHeaders?: (
    headers: Headers,
    api: Pick<
      qt.BaseQueryApi,
      "getState" | "extra" | "endpoint" | "type" | "forced"
    >
  ) => qt.MaybePromise<Headers>
  fetchFn?: (
    input: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
  paramsSerializer?: (params: Record<string, any>) => string
} & RequestInit
export type FetchBaseQueryMeta = { request: Request; response?: Response }
export function fetchBaseQuery({
  baseUrl,
  prepareHeaders = x => x,
  fetchFn = defaultFetchFn,
  paramsSerializer,
  ...baseFetchOptions
}: FetchBaseQueryArgs = {}): qt.BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> {
  if (typeof fetch === "undefined" && fetchFn === defaultFetchFn) {
    console.warn(
      "Warning: `fetch` is not available. Please supply a custom `fetchFn` property to use `fetchBaseQuery` on SSR environments."
    )
  }
  return async (arg, api) => {
    const { signal, getState, extra, endpoint, forced, type } = api
    let {
      url,
      method = "GET" as const,
      headers = new Headers({}),
      body = undefined,
      params = undefined,
      responseHandler = "json" as const,
      validateStatus = defaultValidateStatus,
      ...rest
    } = typeof arg == "string" ? { url: arg } : arg
    const config: RequestInit = {
      ...baseFetchOptions,
      method,
      signal,
      body,
      ...rest,
    }
    config.headers = await prepareHeaders(
      new Headers(stripUndefined(headers)),
      { getState, extra, endpoint, forced, type }
    )
    const isJsonifiable = (body: any) =>
      typeof body === "object" &&
      (isPlainObject(body) ||
        Array.isArray(body) ||
        typeof body.toJSON === "function")
    if (!config.headers.has("content-type") && isJsonifiable(body)) {
      config.headers.set("content-type", "application/json")
    }
    if (isJsonifiable(body) && isJsonContentType(config.headers)) {
      config.body = JSON.stringify(body)
    }
    if (params) {
      const divider = ~url.indexOf("?") ? "&" : "?"
      const query = paramsSerializer
        ? paramsSerializer(params)
        : new URLSearchParams(stripUndefined(params))
      url += divider + query
    }
    url = joinUrls(baseUrl, url)
    const request = new Request(url, config)
    const requestClone = request.clone()
    const meta: FetchBaseQueryMeta | undefined = { request: requestClone }
    let response
    try {
      response = await fetchFn(request)
    } catch (e) {
      return { error: { status: "FETCH_ERROR", error: String(e) }, meta }
    }
    const responseClone = response.clone()
    meta.response = responseClone
    let resultData: any
    let responseText = ""
    try {
      let handleResponseError
      await Promise.all([
        handleResponse(response, responseHandler).then(
          r => (resultData = r),
          e => (handleResponseError = e)
        ),
        responseClone.text().then(
          r => (responseText = r),
          () => {}
        ),
      ])
      if (handleResponseError) throw handleResponseError
    } catch (e) {
      return {
        error: {
          status: "PARSING_ERROR",
          originalStatus: response.status,
          data: responseText,
          error: String(e),
        },
        meta,
      }
    }
    return validateStatus(response, resultData)
      ? {
          data: resultData,
          meta,
        }
      : {
          error: {
            status: response.status,
            data: resultData,
          },
          meta,
        }
  }
}
