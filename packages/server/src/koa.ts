//import { inspect as _inspect, format } from "util"
//import * as url from "url"
import { EventEmitter } from "events"
import { extname } from "path"
import { format } from "util"
import { HttpError, UnknownError } from "http-errors"
import { is as typeis } from "type-is"
import { isIP } from "net"
import { parse } from "content-type"
import { ReadStream } from "fs"
import { Stream, Writable } from "stream"
import { URL } from "url"
import * as http from "http"
import * as mime from "mime-types"
import * as qs from "querystring"
import * as qu from "./utils.js"
import assert from "assert"
import contentDisposition from "content-disposition"
import Cookies from "cookies"
import createError from "http-errors"
import fresh from "fresh"
import httpAssert from "http-assert"
import onFinish from "on-finished"
import onFinished from "on-finished"
import parseurl from "parseurl"
import Status from "statuses"
import type { FileHandle } from "fs/promises"
import type { Http2ServerRequest, Http2ServerResponse } from "http2"
import type * as qt from "./types.js"
import type * as tls from "tls"
import type Keygrip from "keygrip"
import vary from "vary"

export { HttpError } from "http-errors"

export function newApp<S = qt.State, C = qt.Custom>(ps: qt.Dict = {}) {
  const emitter = new EventEmitter()
  const opts: qt.Options<S, C> = (() => {
    const env = ps["env"] || process.env["NODE_ENV"] || "development"
    const keys: Keygrip | string[] = ps["keys"] as string[]
    const maxIps = ps["maxIps"] || 0
    const plugins: qt.Plugin<S, C>[] = []
    const proxy = ps["proxy"] || false
    const proxyHeader = ps["proxyHeader"] || "X-Forwarded-For"
    const subdomOffset = ps["subdomOffset"] || 2
    return {
      get env() {
        return env
      },
      get keys() {
        return keys
      },
      get maxIps() {
        return maxIps
      },
      get plugins() {
        return plugins
      },
      get proxy() {
        return proxy
      },
      get proxyHeader() {
        return proxyHeader
      },
      get subdomOffset() {
        return subdomOffset
      },
    } as qt.Options<S, C>
  })()
  let _nullBody = false
  function createContext(
    inp: http.IncomingMessage | Http2ServerRequest,
    out: http.ServerResponse | Http2ServerResponse
  ) {
    const origUrl = inp.url ?? ""
    const state: S = {} as S
    let ctx: qt.Context<S, C>
    let req: qt.Request
    let res: qt.Response
    let _body: unknown
    let _explicitStatus = false
    const _qcache: { [k: string]: qs.ParsedUrlQuery } = {}
    let _ip: string
    let _memoURL: URL
    let _acceptor: qt.Acceptor
    let _cookies: Cookies
    const newReq = () =>
      ({
        get header() {
          return inp.headers
        },
        get headers() {
          return inp.headers
        },
        get url() {
          return inp.url
        },
        get origin(): string {
          return `${this.protocol}://${this.host}`
        },
        get href() {
          if (/^https?:\/\//i.test(origUrl)) return origUrl
          return origin + origUrl
        },
        get method() {
          return inp.method
        },
        get path() {
          return parseurl(inp as http.IncomingMessage)?.pathname
        },
        set path(x) {
          const url = parseurl(inp as http.IncomingMessage)
          if (x && url) {
            if (url.pathname === x) return
            url.pathname = x
            url.path = null
            this.url = url.stringify(url)
          }
        },
        get query() {
          const x = this.qstring
          const c = _qcache
          return c[x] || (c[x] = qs.parse(x))
        },
        set query(x) {
          this.qstring = qs.stringify(x)
        },
        get qstring() {
          if (!inp) return ""
          const x = parseurl(inp as http.IncomingMessage)?.query
          return typeof x === "string" ? x : ""
        },
        set qstring(x) {
          const url = parseurl(inp as http.IncomingMessage)
          if (url) {
            if (url.search === `?${x}`) return
            url.search = x
            url.path = null
            this.url = url.stringify(url)
          }
        },
        get search() {
          const x = this.qstring
          if (!x) return ""
          return `?${x}`
        },
        set search(x) {
          this.qstring = x
        },
        get host() {
          const p = opts.proxy
          let h = p && this.get("X-Forwarded-Host")
          if (!h) {
            if (inp.httpVersionMajor >= 2) h = this.get(":authority")
            if (!h) h = this.get("Host")
          }
          if (!h) return ""
          return h.split(/\s*,\s*/, 1)[0]
        },
        get hostname() {
          const h = this.host
          if (!h) return ""
          if ("[" === h[0]) return this.URL.hostname || ""
          return h.split(":", 1)[0]
        },
        get URL() {
          if (!_memoURL) {
            const x = origUrl || ""
            try {
              _memoURL = new URL(`${origin}${x}`)
            } catch (err) {
              _memoURL = Object.create(null)
            }
          }
          return _memoURL
        },
        get fresh() {
          const m = this.method
          if (m !== "GET" && m !== "HEAD") return false
          const s = res.status
          if ((s >= 200 && s < 300) || 304 === s) {
            return fresh(this.header, res.header)
          }
          return false
        },
        get stale() {
          return !this.fresh
        },
        get idempotent() {
          const xs = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"]
          return !!~xs.indexOf(this.method ?? "")
        },
        get socket() {
          return inp.socket
        },
        get charset() {
          try {
            const { parameters } = parse(inp)
            return parameters["charset"] || ""
          } catch (e) {
            return ""
          }
        },
        get length() {
          const y = this.get("Content-Length")
          return y === "" ? 0 : ~~y
        },
        get protocol() {
          const s = this.socket as tls.TLSSocket
          if (s.encrypted) return "https"
          if (!opts.proxy) return "http"
          const x = this.get("X-Forwarded-Proto")
          return x ? x.split(/\s*,\s*/, 1)[0] : "http"
        },
        get secure() {
          return "https" === this.protocol
        },
        get ips() {
          const p = opts.proxy
          const x = this.get(opts.proxyHeader)
          let ys = p && x ? x.split(/\s*,\s*/) : []
          if (opts.maxIps > 0) ys = ys.slice(-opts.maxIps)
          return ys
        },
        get ip() {
          if (!_ip) _ip = this.ips[0] || this.socket.remoteAddress || ""
          return _ip
        },
        set ip(x) {
          _ip = x
        },
        get subdoms() {
          const off = opts.subdomOffset
          const n = this.hostname
          if (isIP(n)) return []
          return n.split(".").reverse().slice(off)
        },
        get acceptor() {
          return (
            _acceptor || (_acceptor = newAcceptor(inp as http.IncomingMessage))
          )
        },
        set acceptor(x) {
          _acceptor = x
        },
        accepts(x?: qt.Stringy, ...xs: string[]) {
          return this.acceptor.types(x, ...xs)
        },
        acceptsEncodings(x?: qt.Stringy, ...xs: string[]) {
          return this.acceptor.encodings(x, ...xs)
        },
        acceptsCharsets(x?: qt.Stringy, ...xs: string[]) {
          return this.acceptor.charsets(x, ...xs)
        },
        acceptsLanguages(x?: qt.Stringy, ...xs: string[]) {
          return this.acceptor.languages(x, ...xs)
        },
        is(x, ...xs) {
          if (x === undefined) return null
          return typeof x === "string"
            ? typeis(x, ...xs)
            : typeis(x[0]!, x.slice(1))
        },
        get(x: string | string[]) {
          x = typeof x === "string" ? x.toLowerCase() : x
          switch (x) {
            case "referer":
            case "referrer":
              return inp.headers["referrer"] || inp.headers.referer || ""
            default:
              return typeof x === "string" ? inp.headers[x] || "" : ""
          }
        },
        get type() {
          const type = this.get("Content-Type")
          if (!type) return ""
          return type.split(";")[0]
        },
        inspect() {
          if (!inp) return
          return this.toJSON()
        },
        toJSON() {
          return only(this, ["method", "url", "header"])
        },
        origUrl,
        inp,
      } as qt.Request)
    const newRes = () =>
      ({
        get header() {
          return out.getHeaders()
        },
        get headers() {
          return this.header
        },
        get socket() {
          return out.socket
        },
        get body() {
          return _body
        },
        set body(x) {
          const old = _body
          _body = x
          if (x === null) {
            _nullBody = true
            if (!Status.empty[this.status]) this.status = 204
            this.remove("Content-Type")
            this.remove("Content-Length")
            this.remove("Transfer-Encoding")
            return
          }
          if (!_explicitStatus) this.status = 200
          const setType = !this.has("Content-Type")
          if (typeof x === "string") {
            if (setType) this.type = /^\s*</.test(x) ? "html" : "text"
            this.length = Buffer.byteLength(x)
            return
          }
          if (Buffer.isBuffer(x)) {
            if (setType) this.type = "bin"
            this.length = x.length
            return
          }
          if (x instanceof Stream) {
            onFinish(out as http.OutgoingMessage, destroy.bind(null, x))
            if (old !== x) {
              x.once("error", err => ctx.onerror(err))
              if (old != null) this.remove("Content-Length")
            }
            if (setType) this.type = "bin"
            return
          }
          this.remove("Content-Length")
          this.type = "json"
        },
        get etag() {
          return this.get("ETag")
        },
        set etag(x) {
          if (!/^(W\/)?"/.test(x)) x = `"${x}"`
          this.set("ETag", x)
        },
        get headerSent() {
          return out.headersSent
        },
        get lastModified() {
          const x = this.get("last-modified")
          return new Date(x)
        },
        set lastModified(x) {
          if (typeof x === "string") x = new Date(x)
          this.set("Last-Modified", x.toUTCString())
        },
        get length() {
          if (this.has("Content-Length")) {
            return parseInt(this.get("Content-Length"), 10) || 0
          }
          const { body } = this
          if (!body || body instanceof Stream) return undefined
          if (typeof body === "string") return Buffer.byteLength(body)
          if (Buffer.isBuffer(body)) return body.length
          return Buffer.byteLength(JSON.stringify(body))
        },
        set length(x) {
          if (x) this.set("Content-Length", x.toString())
        },
        get message() {
          return out.statusMessage || Status.message[this.status] || ""
        },
        set message(x) {
          out.statusMessage = x
        },
        get status() {
          return out.statusCode
        },
        set status(x) {
          if (this.headerSent) return
          assert(Number.isInteger(x), "status code must be a number")
          assert(x >= 100 && x <= 999, `invalid status code: ${x}`)
          _explicitStatus = true
          out.statusCode = x
          if (inp.httpVersionMajor < 2)
            out.statusMessage = Status.message[x] || ""
          if (this.body && Status.empty[x]) this.body = null
        },
        get type() {
          const x = this.get("Content-Type")
          if (!x) return ""
          return x.split(";", 1)[0]
        },
        set type(x) {
          x = getType(x)
          if (x) this.set("Content-Type", x)
          else this.remove("Content-Type")
        },
        get writable() {
          if (out.writableEnded || out.finished) return false
          const x = out.socket
          if (!x) return true
          return x.writable
        },
        serverend(x, v) {
          const o = this.get(x)
          if (o) v = Array.isArray(o) ? o.concat(v) : [o].concat(v)
          return this.set(x, v)
        },
        attachment(f, xs) {
          if (f) this.type = extname(f)
          this.set("Content-Disposition", contentDisposition(f, xs))
        },
        flushHeaders() {
          ;(out as http.ServerResponse).flushHeaders()
        },
        has(x) {
          return typeof out.hasHeader === "function"
            ? out.hasHeader(x)
            : x.toLowerCase() in this.headers
        },
        redirect(url, alt) {
          if (url === "back") url = req.get("Referrer") || alt || "/"
          this.set("Location", encode(url))
          if (!Status.redirect[this.status]) this.status = 302
          if (req.accepts("html")) {
            url = escape(url)
            this.type = "text/html; charset=utf-8"
            this.body = `Redirecting to <a href="${url}">${url}</a>.`
            return
          }
          this.type = "text/plain; charset=utf-8"
          this.body = `Redirecting to ${url}.`
        },
        append(x, v) {
          const o = this.get(x)
          if (o) v = Array.isArray(o) ? o.concat(v) : [o].concat(v)
          return this.set(x, v)
        },
        remove(x) {
          if (this.headerSent) return
          out.removeHeader(x)
        },
        set(x, v) {
          if (this.headerSent) return
          if (typeof x === "string") {
            if (v === undefined) return
            if (Array.isArray(v)) {
              v = v.map(x2 => (typeof x2 === "string" ? x2 : String(x2)))
            }
            out.setHeader(x, v)
          } else {
            for (const k in x) {
              this.set(k, x[k])
            }
          }
        },
        vary(x) {
          if (this.headerSent) return
          vary(out as http.ServerResponse, x)
        },
        get(x) {
          return this.header[x.toLowerCase()] || ""
        },
        inspect() {
          if (!out) return
          const y: any = this.toJSON()
          y.body = this.body
          return y
        },
        is(x, ...xs) {
          if (x === undefined) return null
          return typeof x === "string"
            ? typeis(x, ...xs)
            : typeis(x[0]!, x.slice(1))
        },
        toJSON() {
          return only(this, ["status", "message", "header"])
        },
        out,
      } as qt.Response)
    const newCtx = () =>
      ({
        assert: httpAssert,
        inspect() {
          //if (context === proto) return context
          return this.toJSON()
        },
        onerror(x) {
          if (x == null) return
          const native =
            Object.prototype.toString.call(x) === "[object Error]" ||
            x instanceof Error
          if (!native) x = new HttpError(format("non-error thrown: %j", x))
          const e: HttpError = x as HttpError
          let sent = false
          if (res.headerSent || !res.writable) {
            sent = e["headerSent"] = true
          }
          emitter.emit("error", x, this)
          if (sent) return
          out.getHeaderNames().forEach(x => out.removeHeader(x))
          res.set(e.headers!)
          res.type = "text"
          let s = e.status || e.statusCode
          if (e["code"] === "ENOENT") s = 404
          if (typeof s !== "number" || !Status.code[s]) s = 500
          const m = e.expose ? x.message : Status.message[s] || ""
          res.status = e.status = s
          res.length = Buffer.byteLength(m)
          out.end(m)
        },
        throw(x, ...xs) {
          if (typeof x === "string") createError(x, xs)
          else if (typeof x === "number") createError(x)
          else throw createError(x as UnknownError, ...(xs as UnknownError[]))
        },
        toJSON() {
          return {
            req: req.toJSON(),
            res: res.toJSON(),
            app: this.toJSON(),
            origUrl,
            inp: "<original node input>",
            out: "<original node output>",
            socket: "<original node socket>",
          }
        },
        get cookies() {
          if (!_cookies) {
            _cookies = new Cookies(
              inp as http.IncomingMessage,
              out as http.ServerResponse,
              {
                keys: opts.keys,
                secure: req.secure,
              }
            )
          }
          return _cookies
        },
        set cookies(x) {
          _cookies = x
        },
        inp,
        out,
        req,
        respond: false,
        res,
        state,
      } as qt.Context<S, C>)
    req = newReq()
    res = newRes()
    return (ctx = newCtx())
  }
  function respond(ctx: qt.Context<S, C>) {
    if (!ctx.respond) return
    const { inp, out, req, res } = ctx
    if (!res.writable) return
    let body = res.body
    const { status } = res
    if (Status.empty[status]) {
      res.body = null
      return out.end()
    }
    if ("HEAD" === req.method) {
      if (!out.headersSent && !res.has("Content-Length")) {
        const { length } = res
        if (Number.isInteger(length)) res.length = length!
      }
      return out.end()
    }
    if (body === null) {
      if (_nullBody) {
        res.remove("Content-Type")
        res.remove("Transfer-Encoding")
        return out.end()
      }
      if (inp.httpVersionMajor >= 2) body = String(status)
      else body = res.message || String(status)
      if (!out.headersSent) {
        res.type = "text"
        res.length = Buffer.byteLength(body as string)
      }
      return out.end(body)
    }
    if (Buffer.isBuffer(body)) return out.end(body)
    if (typeof body === "string") return out.end(body)
    if (body instanceof Stream) return body.pipe(out)
    body = JSON.stringify(body)
    if (!out.headersSent) res.length = Buffer.byteLength(body as string)
    out.end(body)
  }
  const createApp = () =>
    ({
      emitter,
      ...opts,
      callback() {
        const xs = compose(opts.plugins)
        if (!emitter.listenerCount("error")) emitter.on("error", this.onerror)
        return (inp, out) => this.handleRequest(createContext(inp, out), xs)
      },
      createContext,
      handleRequest(ctx, f: any) {
        const { out } = ctx
        out.statusCode = 404
        const handleResponse = () => respond(ctx)
        const onerror = (x: Error | null) => ctx.onerror(x)
        onFinished(out, onerror)
        return f(ctx).then(handleResponse).catch(onerror)
      },
      inspect() {
        return this.toJSON()
      },
      listen(...xs: any) {
        const s = http.createServer(this.callback())
        return s.listen(...xs)
      },
      onerror(x) {
        const native =
          Object.prototype.toString.call(x) === "[object Error]" ||
          x instanceof Error
        if (!x || !native) {
          throw new TypeError(format("non-error thrown: %j", x))
        }
        const e: HttpError = x as HttpError
        if (e.status === 404 || e.expose) return
        if (opts.silent) return
        const m = x.stack || x.toString()
        console.error(`\n${m.replace(/^/gm, "  ")}\n`)
      },
      toJSON() {
        return only(opts, ["subdomOffset", "proxy", "env"])
      },
      use(f) {
        if (typeof f !== "function") throw new TypeError("Must be a function!")
        opts.plugins.push(f)
      },
    } as qt.App<S, C>)
  return createApp()
}

/*
if (_inspect.custom) {
  module.exports[_inspect.custom] = inspect
}
*/

// prettier-ignore
export function compose<T1, U1, T2, U2>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>]): qt.Plugin<T1 & T2, U1 & U2>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3>(xs: [ qt.Plugin<T1, U1>,  qt.Plugin<T2, U2>,  qt.Plugin<T3, U3>]): qt.Plugin<T1 & T2 & T3, U1 & U2 & U3>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3, T4, U4>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>, qt.Plugin<T3, U3>, qt.Plugin<T4, U4>]): qt.Plugin<T1 & T2 & T3 & T4, U1 & U2 & U3 & U4>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>, qt.Plugin<T3, U3>, qt.Plugin<T4, U4>, qt.Plugin<T5, U5>]): qt.Plugin<T1 & T2 & T3 & T4 & T5, U1 & U2 & U3 & U4 & U5>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5, T6, U6>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>, qt.Plugin<T3, U3>, qt.Plugin<T4, U4>, qt.Plugin<T5, U5>, qt.Plugin<T6, U6>]): qt.Plugin<T1 & T2 & T3 & T4 & T5 & T6, U1 & U2 & U3 & U4 & U5 & U6>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5, T6, U6, T7, U7>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>, qt.Plugin<T3, U3>, qt.Plugin<T4, U4>, qt.Plugin<T5, U5>, qt.Plugin<T6, U6>, qt.Plugin<T7, U7>]): qt.Plugin< T1 & T2 & T3 & T4 & T5 & T6 & T7, U1 & U2 & U3 & U4 & U5 & U6 & U7>
// prettier-ignore
export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5, T6, U6, T7, U7, T8, U8>(xs: [qt.Plugin<T1, U1>, qt.Plugin<T2, U2>, qt.Plugin<T3, U3>, qt.Plugin<T4, U4>, qt.Plugin<T5, U5>, qt.Plugin<T6, U6>, qt.Plugin<T7, U7>, qt.Plugin<T8, U8>]): qt.Plugin< T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8, U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8>
export function compose<C>(xs?: Array<qt.Servlet<C>>): qt.Runner<C>
export function compose(xs: any) {
  if (!Array.isArray(xs)) throw new TypeError("Needs an array")
  for (const x of xs) {
    if (typeof x !== "function") throw new TypeError("Needs functions")
  }
  return (ctx: any, next: any) => {
    let n = -1
    function dispatch(i: number): Promise<void> {
      if (i <= n) return Promise.reject(new Error("Repeated next()"))
      n = i
      let x = xs[i]
      if (i === xs.length) x = next
      if (!x) return Promise.resolve()
      try {
        return Promise.resolve(x(ctx, dispatch.bind(null, i + 1)))
      } catch (e) {
        return Promise.reject(e)
      }
    }
    return dispatch(0)
  }
}

export type Headers = { [k: string]: qt.Stringy | undefined }

export function newAcceptor(x: { headers?: Headers }): qt.Acceptor {
  const neg = newNegotiator(x)
  const { headers } = x
  const charsets = (x?: qt.Stringy, ...xs: string[]) => {
    if (!x) return neg.charsets()
    xs = Array.isArray(x) ? x : [x, ...xs]
    return neg.charsets(xs)[0] || false
  }
  const encodings = (x?: qt.Stringy, ...xs: string[]) => {
    if (!x) return neg.encodings()
    xs = Array.isArray(x) ? x : [x, ...xs]
    return neg.encodings(xs)[0] || false
  }
  const languages = (x?: qt.Stringy, ...xs: string[]) => {
    if (!x) return neg.languages()
    xs = Array.isArray(x) ? x : [x, ...xs]
    return neg.languages(xs)[0] || false
  }
  const types = (x?: qt.Stringy, ...xs: string[]) => {
    if (!x) return neg.types()
    xs = Array.isArray(x) ? x : [x, ...xs]
    if (!headers?.["accept"]) return xs[0]
    const to = (x: string) => (x.indexOf("/") === -1 ? mime.lookup(x) : x)
    const ms = xs.map(to)
    const valid = (x: unknown) => typeof x === "string"
    const ys = neg.types(ms.filter(valid) as string[])
    const y = ys[0]
    return y ? xs[ms.indexOf(y)] : false
  }
  return { charsets, encodings, languages, types }
}

function only(x: unknown, ks: qt.Stringy) {
  if (typeof ks === "string") ks = ks.split(/ +/)
  x = x || {}
  return ks.reduce((ys, k) => {
    if (!x[k]) return ys
    ys[k] = x[k]
    return ys
  }, {} as { [k: string]: unknown })
}

// prettier-ignore
const ENCODE_RE = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g
// prettier-ignore
const PAIR_RE = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g
const REPLACE = "$1\uFFFD$2"
function encode(x: string) {
  return String(x).replace(PAIR_RE, REPLACE).replace(ENCODE_RE, encodeURI)
}
const HTML_RE = /["'&<>]/

function escape(x: string) {
  const m = HTML_RE.exec(x)
  if (!m) return x
  let esc
  let y = ""
  let i = 0
  let last = 0
  for (i = m.index; i < x.length; i++) {
    switch (x.charCodeAt(i)) {
      case 34: // "
        esc = "&quot;"
        break
      case 38: // &
        esc = "&amp;"
        break
      case 39: // '
        esc = "&#39;"
        break
      case 60: // <
        esc = "&lt;"
        break
      case 62: // >
        esc = "&gt;"
        break
      default:
        continue
    }
    if (last !== i) y += x.substring(last, i)
    last = i + 1
    y += esc
  }
  return last !== i ? y + x.substring(last, i) : y
}

const cache = new qu.Cache(100)

function getType(x: string) {
  let y = cache.get(x)
  if (!y) {
    y = mime.contentType(x)
    cache.set(x, y)
  }
  return y
}

function destroy(x: unknown) {
  const destroy = (x: ReadStream) => {
    x.destroy()
    function on(this: FileHandle) {
      if (typeof this.fd === "number") this.close()
    }
    if (typeof x.close === "function") x.on("open", on)
    return x
  }
  if (x instanceof ReadStream) return destroy(x)
  if (x instanceof Writable) x.destroy()
  return x
}

export function newNegotiator(x: { headers?: Headers }) {
  type Spec = { type: string; q: number; i: number; o: number; s: number }
  const { headers } = x
  const charsets = () => {
    const RE = /^\s*([^\s;]+)\s*(?:;(.*))?$/
    const accept = (x: qt.Stringy) => {
      const xs = typeof x === "string" ? x.split(",") : x
      const ys = Array<Spec>(xs.length)
      const parse = (x: string, i: number) => {
        const m = RE.exec(x)
        if (!m) return undefined
        const type = m[1]
        let q = 1
        if (m[2]) {
          const ps = m[2].split(";")
          for (const x of ps) {
            const p = x.trim().split("=")
            if (p[0] === "q") {
              q = parseFloat(p[1]!)
              break
            }
          }
        }
        return { type, q, i, o: 0, s: 0 } as Spec
      }
      let j = 0
      xs.forEach((x, i) => {
        const y = parse(x.trim(), i)
        if (y) ys[j++] = y
      })
      ys.length = j
      return ys
    }
    const priority = (t: string, xs: Spec[], i: number) => {
      let y = { o: -1, q: 0, s: 0 } as Spec
      const specify = (x: Spec) => {
        let s = 0
        if (x.type.toLowerCase() === t.toLowerCase()) s |= 1
        else if (x.type !== "*") return undefined
        return { i, o: x.i, q: x.q, s } as Spec
      }
      for (const x of xs) {
        const p = specify(x)
        if (p && (y.s - p.s || y.q - p.q || y.o - p.o) < 0) y = p
      }
      return y
    }
    return (x?: qt.Stringy, xs?: string[]) => {
      const ys = accept(x === undefined ? "*" : x || "")
      const ok = (x: Spec) => x.q > 0
      const cmp = (a: Spec, b: Spec) => {
        return b.q - a.q || a.i - b.i || b.s - a.s || a.o - b.o || 0
      }
      if (!xs) {
        return ys
          .filter(ok)
          .sort(cmp)
          .map((x: Spec) => x.type)
      }
      const ps = xs.map((t, i) => priority(t, ys, i))
      return ps
        .filter(ok)
        .sort(cmp)
        .map(p => xs[ps.indexOf(p)])
    }
  }
  const encodings = () => {
    const RE = /^\s*([^\s;]+)\s*(?:;(.*))?$/
    const specify = (t: string, x: Spec, i: number) => {
      let s = 0
      if (x.type.toLowerCase() === t.toLowerCase()) s |= 1
      else if (x.type !== "*") return undefined
      return { i, o: x.i, q: x.q, s } as Spec
    }
    const accept = (x: qt.Stringy) => {
      const xs = typeof x === "string" ? x.split(",") : x
      const ys = Array<Spec>(xs.length)
      const parse = (x: string, i: number) => {
        const m = RE.exec(x)
        if (!m) return undefined
        const type = m[1]
        let q = 1
        if (m[2]) {
          const ps = m[2].split(";")
          for (const x of ps) {
            const p = x.trim().split("=")
            if (p[0] === "q") {
              q = parseFloat(p[1]!)
              break
            }
          }
        }
        return { type, q, i, o: 0, s: 0 } as Spec
      }
      let j = 0
      let min = 1
      let id = false
      xs.forEach((x, i) => {
        const y = parse(x.trim(), i)
        if (y) {
          ys[j++] = y
          min = Math.min(min, y.q || 1)
          id = id || !!specify("identity", y, i)
        }
      })
      if (!id) ys[j++] = { type: "identity", q: min, i: xs.length } as Spec
      ys.length = j
      return ys
    }
    const priority = (t: string, xs: Spec[], i: number) => {
      let y = { o: -1, q: 0, s: 0 } as Spec
      for (const x of xs) {
        const p = specify(t, x, i)
        if (p && (y.s - p.s || y.q - p.q || y.o - p.o) < 0) y = p
      }
      return y
    }
    return (x?: qt.Stringy, xs?: string[]) => {
      const ys = accept(x || "")
      const ok = (x: Spec) => x.q > 0
      const cmp = (a: Spec, b: Spec) => {
        return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0
      }
      if (!xs) {
        return ys
          .filter(ok)
          .sort(cmp)
          .map((x: Spec) => x.type)
      }
      const ps = xs.map((t, i) => priority(t, ys, i))
      return ps
        .filter(ok)
        .sort(cmp)
        .map(p => xs[ps.indexOf(p)])
    }
  }
  const languages = () => {
    type Spec2 = Spec & { pre: string; suff: string }
    const RE = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/
    const parse = (x: string, i: number) => {
      const m = RE.exec(x)
      if (!m) return undefined
      const pre = m[1]
      const suff = m[2]
      let type = pre
      if (suff) type += "-" + suff
      let q = 1
      if (m[3]) {
        const ps = m[3].split(";")
        for (const x of ps) {
          const p = x.split("=")
          if (p[0] === "q") q = parseFloat(p[1]!)
        }
      }
      return { type, pre, suff, q, i, o: 0, s: 0 } as Spec2
    }
    const accept = (x: qt.Stringy) => {
      const xs = typeof x === "string" ? x.split(",") : x
      const ys = Array<Spec2>(xs.length)
      let j = 0
      xs.forEach((x, i) => {
        const y = parse(x.trim(), i)
        if (y) ys[j++] = y
      })
      ys.length = j
      return ys
    }
    const priority = (t: string, xs: Spec2[], i: number) => {
      let y = { o: -1, q: 0, s: 0 } as Spec
      const specify = (x: Spec2) => {
        const p = parse(t, i)
        if (!p) return undefined
        let s = 0
        if (x.type.toLowerCase() === p.type.toLowerCase()) s |= 4
        else if (x.pre.toLowerCase() === p.type.toLowerCase()) s |= 2
        else if (x.type.toLowerCase() === p.pre.toLowerCase()) s |= 1
        else if (x.type !== "*") return undefined
        return { i, o: x.i, q: x.q, s } as Spec
      }
      for (const x of xs) {
        const p = specify(x)
        if (p && (y.s - p.s || y.q - p.q || y.o - p.o) < 0) y = p
      }
      return y
    }
    return (x?: qt.Stringy, xs?: string[]) => {
      const ys = accept(x === undefined ? "*" : x || "")
      const ok = (x: Spec) => x.q > 0
      const cmp = (a: Spec, b: Spec) => {
        return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0
      }
      if (!xs) {
        return ys
          .filter(ok)
          .sort(cmp)
          .map((x: Spec) => x.type)
      }
      const ps = xs.map((t, i) => priority(t, ys, i))
      return ps
        .filter(ok)
        .sort(cmp)
        .map(p => xs[ps.indexOf(p)])
    }
  }
  const types = () => {
    type Spec2 = Spec & { sub: string; params: { [k: string]: string } }
    const RE = /^\s*([^\s/;]+)\/([^;\s]+)\s*(?:;(.*))?$/
    const parse = (x: string, i: number) => {
      const m = RE.exec(x)
      if (!m) return undefined
      const type = m[1]
      const sub = m[2]
      const params: qt.Dict<string> = {}
      let q = 1
      if (m[3]) {
        const ps = splitParams(m[3]).map(splitPair)
        for (const p of ps) {
          const v = p[1]
          if (v !== undefined) {
            const y =
              v && v[0] === '"' && v[v.length - 1] === '"'
                ? v.substr(1, v.length - 2)
                : v
            const k = p[0]?.toLowerCase()
            if (k === "q" && !!y) {
              q = parseFloat(y)
              break
            }
            params[k] = y
          }
        }
      }
      return { type, sub, params, q, i, o: 0, s: 0 } as Spec2
    }
    const accept = (x: qt.Stringy) => {
      const xs = splitTypes(x)
      const ys = Array<Spec2>(xs.length)
      let j = 0
      xs.forEach((x, i) => {
        const y = parse(x.trim(), i)
        if (y) ys[j++] = y
      })
      ys.length = j
      return ys
    }
    const specify = (t: string, x: Spec2, i: number) => {
      const p = parse(t, i)
      let s = 0
      if (!p) return undefined
      if (x.type.toLowerCase() === p.type.toLowerCase()) s |= 4
      else if (x.type !== "*") return undefined
      if (x.sub.toLowerCase() === p.sub.toLowerCase()) s |= 2
      else if (x.sub !== "*") return undefined
      const ks = Object.keys(x.params)
      if (ks.length > 0) {
        if (
          ks.every(k => {
            return (
              x.params[k] === "*" ||
              (x.params[k] || "").toLowerCase() ===
                (p.params[k] || "").toLowerCase()
            )
          })
        ) {
          s |= 1
        } else return undefined
      }
      return { i, o: x.i, q: x.q, s } as Spec
    }
    const priority = (t: string, xs: Spec2[], i: number) => {
      let y = { o: -1, q: 0, s: 0 } as Spec
      for (const x of xs) {
        const p = specify(t, x, i)
        if (p && (y.s - p.s || y.q - p.q || y.o - p.o) < 0) y = p
      }
      return y
    }
    return (x?: qt.Stringy, xs?: string[]) => {
      const ys = accept(x === undefined ? "*/*" : x || "")
      const ok = (x: Spec) => x.q > 0
      const cmp = (a: Spec, b: Spec) => {
        return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0
      }
      if (!xs) {
        return ys
          .filter(ok)
          .sort(cmp)
          .map((x: Spec2) => x.type + "/" + x.sub)
      }
      const ps = xs.map((t, i) => priority(t, ys, i))
      return ps
        .filter(ok)
        .sort(cmp)
        .map(p => xs[ps.indexOf(p)])
    }
  }
  return {
    charsets: (xs?: string[]) => {
      const ys = charsets()
      return ys(headers?.["accept-charset"], xs)
    },
    encodings: (xs?: string[]) => {
      const ys = encodings()
      return ys(headers?.["accept-encoding"], xs)
    },
    languages: (xs?: string[]) => {
      const ys = languages()
      return ys(headers?.["accept-language"], xs)
    },
    types: (xs?: string[]) => {
      const ys = types()
      return ys(headers?.["accept"], xs)
    },
  }
}

function splitPair(x: string) {
  const i = x.indexOf("=")
  return i == -1 ? [x, undefined] : [x.substr(0, i), x.substr(i + 1)]
}

function numQuotes(x: string) {
  let y = 0
  let i = 0
  while ((i = x.indexOf('"', i)) !== -1) {
    y++
    i++
  }
  return y
}

function splitTypes(x: qt.Stringy) {
  const ys = typeof x === "string" ? x.split(",") : x
  let j = 0
  for (let i = 1; i < ys.length; i++) {
    if (numQuotes(ys[j]!) % 2 == 0) ys[++j] = ys[i]!
    else ys[j] += "," + ys[i]
  }
  ys.length = j + 1
  return ys
}

function splitParams(x: string) {
  const ys = x.split(";")
  let j = 0
  for (let i = 1; i < ys.length; i++) {
    if (numQuotes(ys[j]!) % 2 == 0) ys[++j] = ys[i]!
    else ys[j] += ";" + ys[i]
  }
  ys.length = j + 1
  for (let i = 0; i < ys.length; i++) {
    ys[i] = ys[i]!.trim()
  }
  return ys
}
