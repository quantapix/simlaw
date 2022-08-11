import { EventEmitter } from "events"
import { Http2ServerRequest, Http2ServerResponse } from "http2"
import { ListenOptions, Socket } from "net"
import { ParsedUrlQuery } from "querystring"
import * as contentDisposition from "content-disposition"
import * as Cookies from "cookies"
import * as http from "http"
import * as httpAssert from "http-assert"
import * as Keygrip from "keygrip"
import * as url from "url"

export type MaybePromise<T> = Promise<T> | T
export interface Dict<T = unknown> {
  readonly [k: string]: T
}

export type Next = () => Promise<unknown>
export type Stringy = string | string[]
export type Servlet<C = Context> = (c: C, next: Next) => unknown
export type Runner<C = Context> = (c: C, next?: Next) => Promise<void>

export interface Acceptor {
  charsets(x?: Stringy, ...xs: string[]): Stringy | false
  encodings(x?: Stringy, ...xs: string[]): Stringy | false
  languages(x?: Stringy, ...xs: string[]): Stringy | false
  types(x?: Stringy, ...xs: string[]): Stringy | false
}

export interface Request {
  acceptor: Acceptor
  charset: string
  fresh: boolean
  header: http.IncomingHttpHeaders
  headers: http.IncomingHttpHeaders
  host: string
  hostname: string
  href: string
  idempotent: boolean
  inp: http.IncomingMessage
  ip: string
  ips: string[]
  length: number
  method?: string
  origin: string
  origUrl?: string
  path?: string | null
  protocol: string
  qstring: string
  query: ParsedUrlQuery
  search: string
  secure: boolean
  socket: Socket
  stale: boolean
  subdoms: string[]
  type: string
  URL: url.URL
  url?: string
  accepts(): string[]
  accepts(x: Stringy, ...xs: string[]): string | false
  acceptsCharsets(): string[]
  acceptsCharsets(x: Stringy, ...xs: string[]): string | false
  acceptsEncodings(): string[]
  acceptsEncodings(x: Stringy, ...xs: string[]): string | false
  acceptsLanguages(): string[]
  acceptsLanguages(x: Stringy, ...xs: string[]): string | false
  get(x: Stringy): string
  inspect(): unknown
  is(x?: Stringy, ...xs: string[]): string | false | null
  toJSON(): unknown
}

export interface Response {
  body: unknown
  etag: string
  header: http.OutgoingHttpHeaders
  headers: http.OutgoingHttpHeaders
  headerSent: boolean
  lastModified: Date | string
  length?: number
  message: string
  out: http.ServerResponse
  socket: Socket | null
  status: number
  type: string
  writable: boolean
  attachment(f?: string, xs?: contentDisposition.Options): void
  flushHeaders(): void
  get(x: string): string
  has(x: string): boolean
  inspect(): unknown
  is(x?: Stringy, ...xs: string[]): string | false | null
  redirect(url: string, alt?: string): void
  append(x: string, v: Stringy): void
  remove(x: string): void
  serverend(x: string, v: Stringy): void
  set(x: string | Dict<Stringy>, v?: string | number | unknown[]): void
  toJSON(): unknown
  vary(x: string): void
}

export interface BaseContext {
  assert: typeof httpAssert
  cookies: Cookies
  inp: http.IncomingMessage
  out: http.ServerResponse
  req: Request
  respond?: boolean
  res: Response
  inspect(): unknown
  onerror(x: Error | null): void
  throw(...xs: Error[]): never
  throw(m: string, code?: number, ps?: unknown): never
  throw(status: number): never
  toJSON(): unknown
}

export type State = Record<string, never>
export type Custom = Record<string, never>

export type Context<S = State, C = Custom, B = unknown> = BaseContext & {
  state: S
} & C & { res: { body: B } }

export type Plugin<S = State, C = Custom> = Servlet<Context<S, C>>

export interface Options<S = State, C = Custom> {
  env: string
  keys: Keygrip | string[]
  maxIps: number
  plugins: Plugin<S, C>[]
  proxy: boolean
  proxyHeader: string
  silent?: boolean
  subdomOffset: number
}

export interface App<S = State, C = Custom> extends Readonly<Options<S, C>> {
  emitter: EventEmitter
  ctx: Context<S, C>
  req: Request
  res: Response
  callback(): (
    inp: http.IncomingMessage | Http2ServerRequest,
    out: http.ServerResponse | Http2ServerResponse
  ) => void
  createContext(
    inp: http.IncomingMessage | Http2ServerRequest,
    out: http.ServerResponse | Http2ServerResponse
  ): Context<S, C>
  inspect(): void
  handleRequest(ctx: Context<S, C>, f: unknown): unknown
  listen(
    port?: number,
    host?: string,
    backlog?: number,
    cb?: () => void
  ): http.Server
  listen(port: number, host?: string, cb?: () => void): http.Server
  listen(port: number, backlog?: number, cb?: () => void): http.Server
  listen(port: number, cb?: () => void): http.Server
  listen(path: string, backlog?: number, cb?: () => void): http.Server
  listen(path: string, cb?: () => void): http.Server
  listen(options: ListenOptions, cb?: () => void): http.Server
  listen(handle: unknown, backlog?: number, cb?: () => void): http.Server
  listen(handle: unknown, cb?: () => void): http.Server
  onerror(x: Error | null): void
  toJSON(): unknown
  use(f: Plugin<S, C>): void
}
