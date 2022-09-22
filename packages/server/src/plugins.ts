import { gzip } from "zlib"
import * as assert from "assert"
import { promisify } from "util"
import * as bytes from "bytes"
import * as compressible from "compressible"
import * as getStream from "get-stream"
import * as isJSON from "koa-is-json"
import * as isStream from "is-stream"
import * as safeStringify from "fast-safe-stringify"
import * as qt from "./types.js"
import * as buddy from "co-body"
import * as forms from "formidable"
import symbolUnparsed = require("./unparsed.js")
import * as parseurl from "parseurl"

import compose = require("koa-compose")
import HttpError = require("http-errors")
import methods = require("methods")
import { Key, Path, pathToRegexp, compile, parse } from "path-to-regexp"
import { format as formatUrl } from "url"
const debug = require("debug")("koa-router")

type Stack<C> = (qt.Servlet<C> & { param: any })[]

export function route<C extends { params: any[] }>(
  path: string,
  ms: string[],
  ss: (qt.Servlet<C> & { param: any }) | Stack<C>,
  ps: qt.Dict = {}
) {
  const name: string = ps.name
  const methods: string[] = []
  for (const m of ms) {
    const i = methods.push(m.toUpperCase())
    if (methods[i - 1] === "GET") methods.unshift("HEAD")
  }
  const stack: Stack<C> = Array.isArray(ss) ? ss : [ss]
  for (const s of stack) {
    const t = typeof s
    assert(t === "function")
  }
  let keys: Key[] = []
  let re = pathToRegexp(path, keys, ps)
  const match = (x: string) => re.test(x)
  const captures = x => (ps.ignoreCaptures ? [] : x.match(re).slice(1))
  const setPrefix = (x: string) => {
    if (path) {
      path = path !== "/" || ps.strict === true ? `${x}${path}` : x
      keys = []
      re = pathToRegexp(path, keys, ps)
    }
  }
  const params = (captures: any[], ys: qt.Dict = {}) => {
    const decode = (x: string) => {
      try {
        return decodeURIComponent(x)
      } catch (e) {
        return x
      }
    }
    captures.forEach((c, i) => {
      if (keys[i]) ys[keys[i].name] = c ? decode(c) : c
    })
    return ys
  }
  const url = (xs, ps) => {
    let args = xs
    const url = path.replace(/\(\.\*\)/g, "")
    if (typeof xs != "object") {
      args = Array.prototype.slice.call(arguments)
      if (typeof args[args.length - 1] == "object") {
        ps = args[args.length - 1]
        args = args.slice(0, args.length - 1)
      }
    }
    const toks = parse(url)
    let replace: qt.Dict = {}
    if (args instanceof Array) {
      toks.forEach((t, i) => {
        if (typeof t !== "string") replace[t.name] = args[i++]
      })
    } else if (toks.some(x => typeof x !== "string")) replace = xs
    else if (!ps) ps = xs
    let y = compile(url, ps)(replace)
    if (ps && ps.query) {
      const u = parseurl(y)!
      if (typeof ps.query === "string") u.search = ps.query
      else {
        u.search = null
        u.query = ps.query
      }
      return formatUrl(y)
    }
    return y
  }
  const param = (x: string | number, f: Function) => {
    const s = (ctx: C, next: qt.Next) => f(ctx.params[x], ctx, next)
    s.param = x
    const ns = keys.map(k => k.name)
    const i = ns.indexOf(x)
    if (i > -1) {
      stack.some((x, i) => {
        if (!x.param || ns.indexOf(x.param) > i) {
          stack.splice(i, 0, s)
          return true
        }
        return false
      })
    }
  }
  return {
    name,
    path,
    stack,
    match,
    methods,
    setPrefix,
    captures,
    params,
    param,
    url,
  }
}

type Route = ReturnType<typeof route>

export function Router<C extends qt.Context>(ps: any) {
  ps = ps || {}
  // prettier-ignore
  const methods = ps.methods || ["HEAD", "OPTIONS", "GET", "PUT", "PATCH", "POST", "DELETE"]
  const params: qt.Dict = {}
  const stack: Route[] = []
  const param = (x: string | number, f) => {
    params[x] = f
    for (const r of stack) {
      r.param(x, f)
    }
  }
  const prefix = (x: string) => {
    x = x.replace(/\/$/, "")
    ps.prefix = x
    for (const r of stack) {
      r.setPrefix(x)
    }
  }
  const route = (x: string) => {
    for (const r of stack) {
      if (r.name && r.name === x) return r
    }
    return undefined
  }
  const url = (x: string, ...xs: string[]) => {
    const y = route(x)
    if (y) return y.url.apply(y, xs)
    return new Error(`No route found for: ${x}`)
  }
  const url2 = (path: string, ...xs: string[]) => {
    return Layer.prototype.url.apply({ path }, xs)
  }
  const match = (x: string, m) => {
    const y = {
      path: [],
      pathAndMethod: [],
      route: false,
    }
    for (const r of stack) {
      debug("test %s %s", r.path, r.regexp)
      if (r.match(x)) {
        y.path.push(r)
        if (r.methods.length === 0 || ~r.methods.indexOf(m)) {
          y.pathAndMethod.push(r)
          if (r.methods.length) y.route = true
        }
      }
    }
    return y
  }
  const all = (name: string, x, ...xs) => {
    if (typeof x !== "string") {
      xs = [x, ...xs]
      x = name
      name = null
    }
    register(x, methods, xs, { name })
  }
  const redirect = (src: string, dst: string, code) => {
    if (src[0] !== "/") src = url(src)
    if (dst[0] !== "/" && !dst.includes("://")) dst = url(dst)
    return all(src, ctx => {
      ctx.redirect(dst)
      ctx.status = code || 301
    })
  }
  const register = (path, methods, middleware, opts) => {
    opts = opts || {}
    if (Array.isArray(path)) {
      for (let i = 0; i < path.length; i++) {
        const curPath = path[i]
        register(curPath, methods, middleware, opts)
      }
    }
    const route = route<C>(path, methods, middleware, {
      end: opts.end === false ? opts.end : true,
      name: opts.name,
      sensitive: opts.sensitive || opts.sensitive || false,
      strict: opts.strict || opts.strict || false,
      prefix: opts.prefix || opts.prefix || "",
      ignoreCaptures: opts.ignoreCaptures,
    })
    if (opts.prefix) route.setPrefix(opts.prefix)
    for (let i = 0; i < Object.keys(params).length; i++) {
      const param = Object.keys(params)[i]
      route.param(param, params[param])
    }
    stack.push(route)
    debug("defined route %s %s", route.methods, route.path)
    return route
  }
  for (const m of methods) {
    function setMethodVerb(x) {
      Router.prototype[x] = function (name, path, middleware) {
        if (typeof path === "string" || path instanceof RegExp) {
          middleware = Array.prototype.slice.call(arguments, 2)
        } else {
          middleware = Array.prototype.slice.call(arguments, 1)
          path = name
          name = null
        }
        register(path, [x], middleware, {
          name: name,
        })
        return this
      }
    }
    setMethodVerb(m)
  }
  const del = Router.prototype["delete"]
  const use = () => {
    const middleware = Array.prototype.slice.call(arguments)
    let path
    if (Array.isArray(middleware[0]) && typeof middleware[0][0] === "string") {
      let arrPaths = middleware[0]
      for (let i = 0; i < arrPaths.length; i++) {
        const p = arrPaths[i]
        use([p].concat(middleware.slice(1)))
      }
    }
    const hasPath = typeof middleware[0] === "string"
    if (hasPath) path = middleware.shift()
    for (let i = 0; i < middleware.length; i++) {
      const m = middleware[i]
      if (m.router) {
        const cloneRouter = Object.assign(
          Object.create(Router.prototype),
          m.router,
          {
            stack: m.router.stack.slice(0),
          }
        )
        for (let j = 0; j < cloneRouter.stack.length; j++) {
          const nestedLayer = cloneRouter.stack[j]
          const cloneLayer = Object.assign(
            Object.create(Layer.prototype),
            nestedLayer
          )
          if (path) cloneLayer.setPrefix(path)
          if (ps.prefix) cloneLayer.setPrefix(ps.prefix)
          stack.push(cloneLayer)
          cloneRouter.stack[j] = cloneLayer
        }
        if (params) {
          function setRouterParams(paramArr) {
            const routerParams = paramArr
            for (let j = 0; j < routerParams.length; j++) {
              const key = routerParams[j]
              cloneRouter.param(key, params[key])
            }
          }
          setRouterParams(Object.keys(params))
        }
      } else {
        const keys = []
        pathToRegexp(ps.prefix || "", keys)
        const routerPrefixHasParam = ps.prefix && keys.length
        register(path || "([^/]*)", [], m, {
          end: false,
          ignoreCaptures: !hasPath && !routerPrefixHasParam,
        })
      }
    }
  }
  const routes = (Router.prototype.middleware = () => {
    return (ctx: C, next: qt.Next) => {
      const path = ps.routerPath || ctx.routerPath || ctx.path
      const m = match(path, ctx.method)
      if (ctx.matched) ctx.matched.push.apply(ctx.matched, m.path)
      else ctx.matched = m.path
      ctx.router = router
      if (!m.route) return next()
      const rs: Route[] = m.pathAndMethod
      const last = rs[rs.length - 1]
      ctx._matchedRoute = last.path
      if (last.name) ctx._matchedRouteName = last.name
      const y = rs.reduce((ys, r: Route) => {
        ys.push((ctx, next) => {
          ctx.captures = r.captures(path, ctx.captures)
          ctx.params = ctx.request.params = r.params(
            path,
            ctx.captures,
            ctx.params
          )
          ctx.routerPath = r.path
          ctx.routerName = r.name
          ctx._matchedRoute = r.path
          if (r.name) ctx._matchedRouteName = r.name
          return next()
        })
        return ys.concat(r.stack)
      }, [])
      return compose(y)(ctx, next)
    }
  })
  const allowedMethods = (ps: qt.Dict = {}) => {
    return async (ctx: C, next: qt.Next) => {
      await next()
      const req = ctx.request
      const res = ctx.response
      const y: { [k: string]: any } = {}
      if (!res.status || res.status === 404) {
        for (const r of ctx.matched) {
          for (const m of r.methods) {
            y[m] = m
          }
        }
        const ks = Object.keys(y)
        if (!~methods.indexOf(req.method)) {
          if (ps.throw) {
            throw typeof ps.notImplemented === "function"
              ? ps.notImplemented()
              : new HttpError.NotImplemented()
          } else {
            res.status = 501
            res.set("Allow", ks.join(", "))
          }
        } else if (ks.length) {
          if (req.method === "OPTIONS") {
            res.status = 200
            ctx.body = ""
            res.set("Allow", ks.join(", "))
          } else if (!y[req.method!]) {
            if (ps.throw) {
              throw typeof ps.methodNotAllowed === "function"
                ? ps.methodNotAllowed()
                : new HttpError.MethodNotAllowed()
            } else {
              res.status = 405
              res.set("Allow", ks.join(", "))
            }
          }
        }
      }
    }
  }
}
const compress = promisify(gzip)
export function cached<C extends qt.Context>(ps: any) {
  ps = ps || { compress: false, setCachedHeader: false }
  const hash = ps.hash || ((ctx: C) => ctx.request.url)
  const stringify = ps.stringify || safeStringify || JSON.stringify
  let threshold = ps.threshold || "1kb"
  if (typeof threshold === "string") threshold = bytes(threshold)
  const { get } = ps
  const { set } = ps
  if (!get) throw new Error(".get not defined")
  if (!set) throw new Error(".set not defined")
  return (async (ctx: C, next: qt.Next) => {
    ctx.vary("Accept-Encoding")
    const req = ctx.request
    const res = ctx.response
    ctx.cached = async (maxAge: number) => {
      if (req.method !== "HEAD" && req.method !== "GET") return false
      const k = (ctx.cacheKey = hash(ctx))
      const y = await get(k, maxAge || ps.maxAge || 0)
      const body = y && y.body
      if (!body) {
        ctx.cacheData = { maxAge }
        return false
      }
      res.type = y.type
      if (y.lastModified) res.lastModified = y.lastModified
      if (y.etag) res.etag = y.etag
      if (ps.setCachedHeader) res.set("X-Cached-Response", "HIT")
      if (req.fresh) {
        res.status = 304
        return true
      }
      if (
        ps.compress &&
        y.gzip &&
        req.acceptsEncodings("gzip", "identity") === "gzip"
      ) {
        res.body = Buffer.from(y.gzip)
        res.set("Content-Encoding", "gzip")
      } else {
        res.body = y.body
        if (ps.compress) res.set("Content-Encoding", "identity")
      }
      return true
    }
    await next()
    if (!ctx.cached()) {
      if (req.fresh) res.status = 304
      return
    }
    if (res.status !== 200) return
    if (req.method !== "HEAD" && req.method !== "GET") return
    let { body } = res
    if (!body) return
    if (isJSON(body)) res.body = body = stringify(body)
    else if (isStream(body)) res.body = body = await getStream.buffer(body)
    if ((res.get("Content-Encoding") || "identity") !== "identity") {
      throw new Error("Cache needs to be after other compressions.")
    }
    const y = {
      body,
      type: res.get("Content-Type") || undefined,
      lastModified: res.lastModified || undefined,
      etag: res.get("etag") || undefined,
    }
    const { fresh } = req
    if (fresh) res.status = 304
    if (ps.compress && compressible(y.type) && (res.length ?? 0) >= threshold) {
      y.gzip = await compress(body)
      if (!fresh && req.acceptsEncodings("gzip", "identity") === "gzip") {
        res.body = y.gzip
        res.set("Content-Encoding", "gzip")
      }
    }
    if (ps.compress && !res.get("Content-Encoding"))
      res.set("Content-Encoding", "identity")
    await set(ctx.cacheKey, y, ctx.cacheData.maxAge || ps.maxAge || 0)
  }) as qt.Servlet<C>
}
const jsonTypes = [
  "application/json",
  "application/json-patch+json",
  "application/vnd.api+json",
  "application/csp-report",
]
export function requestbody<C extends qt.Context>(ps: any) {
  ps = ps || {}
  ps.onError = "onError" in ps ? ps.onError : false
  ps.patchNode = "patchNode" in ps ? ps.patchNode : false
  ps.patchKoa = "patchKoa" in ps ? ps.patchKoa : true
  ps.multipart = "multipart" in ps ? ps.multipart : false
  ps.urlencoded = "urlencoded" in ps ? ps.urlencoded : true
  ps.json = "json" in ps ? ps.json : true
  ps.text = "text" in ps ? ps.text : true
  ps.encoding = "encoding" in ps ? ps.encoding : "utf-8"
  ps.jsonLimit = "jsonLimit" in ps ? ps.jsonLimit : "1mb"
  ps.jsonStrict = "jsonStrict" in ps ? ps.jsonStrict : true
  ps.formLimit = "formLimit" in ps ? ps.formLimit : "56kb"
  ps.queryString = "queryString" in ps ? ps.queryString : null
  ps.formidable = "formidable" in ps ? ps.formidable : {}
  ps.includeUnparsed = "includeUnparsed" in ps ? ps.includeUnparsed : false
  ps.textLimit = "textLimit" in ps ? ps.textLimit : "56kb"
  ps.parsedMethods =
    "parsedMethods" in ps ? ps.parsedMethods : ["POST", "PUT", "PATCH"]
  ps.parsedMethods = ps.parsedMethods.map((x: string) => x.toUpperCase())
  return (async (ctx: C, next: qt.Next) => {
    let y
    if (ps.parsedMethods.includes(ctx.method.toUpperCase())) {
      try {
        if (ps.json && ctx.is(jsonTypes)) {
          y = buddy.json(ctx, {
            encoding: ps.encoding,
            limit: ps.jsonLimit,
            strict: ps.jsonStrict,
            returnRawBody: ps.includeUnparsed,
          })
        } else if (ps.urlencoded && ctx.is("urlencoded")) {
          y = buddy.form(ctx, {
            encoding: ps.encoding,
            limit: ps.formLimit,
            queryString: ps.queryString,
            returnRawBody: ps.includeUnparsed,
          })
        } else if (ps.text && ctx.is("text/*")) {
          y = buddy.text(ctx, {
            encoding: ps.encoding,
            limit: ps.textLimit,
            returnRawBody: ps.includeUnparsed,
          })
        } else if (ps.multipart && ctx.is("multipart")) {
          const formy = ps => {
            return new Promise((resolve, reject) => {
              const fields: { [k: string]: any } = {}
              const files: { [k: string]: any } = {}
              const y = new forms.IncomingForm(ps)
              y.on("end", () => resolve({ fields, files }))
                .on("error", e => reject(e))
                .on("field", (n, x) => {
                  if (fields[n]) {
                    if (Array.isArray(fields[n])) fields[n].push(x)
                    else fields[n] = [fields[n], x]
                  } else fields[n] = x
                })
                .on("file", (n, x) => {
                  if (files[n]) {
                    if (Array.isArray(files[n])) files[n].push(x)
                    else files[n] = [files[n], x]
                  } else files[n] = x
                })
              if (ps.onFileBegin) y.on("fileBegin", ps.onFileBegin)
              y.parse(ctx.req)
            })
          }
          y = formy(ps.formidable)
        }
      } catch (e) {
        if (typeof ps.onError === "function") ps.onError(e, ctx)
        else throw e
      }
    }
    y = y || Promise.resolve({})
    const isMultiPart = () => ps.multipart && ctx.is("multipart")
    return y
      .catch(e => {
        if (typeof ps.onError === "function") ps.onError(e, ctx)
        else throw e
        return next()
      })
      .then(body => {
        if (ps.patchNode) {
          if (isMultiPart()) {
            ctx.req.body = body.fields
            ctx.req.files = body.files
          } else if (ps.includeUnparsed) {
            ctx.req.body = body.parsed || {}
            if (!ctx.is("text/*")) ctx.req.body[symbolUnparsed] = body.raw
          } else ctx.req.body = body
        }
        if (ps.patchKoa) {
          if (isMultiPart()) {
            ctx.request.body = body.fields
            ctx.request.files = body.files
          } else if (ps.includeUnparsed) {
            ctx.request.body = body.parsed || {}
            if (!ctx.is("text/*")) ctx.request.body[symbolUnparsed] = body.raw
          } else ctx.request.body = body
        }
        return next()
      })
  }) as qt.Servlet<C>
}
/*
import assert = require("assert")
const debug = require("debug")("koa-joi-router")
import isGenFn = require("is-gen-fn")
import flatten = require("flatten")
import methods = require("methods")
import KoaRouter = require("@koa/router")
import busboy = require("await-busboy")
import parse = require("co-body")
import Joi = require("joi")
import slice = require("sliced")
import delegate = require("delegates")
import clone = require("clone")
import OutputValidator = require("./output-validator")
module.exports = Router
Router.Joi = Joi
function Router() {
  if (!(this instanceof Router)) {
    return new Router()
  }
  this.routes = []
  this.router = new KoaRouter()
}
delegate(Router.prototype, "router")
  .method("prefix")
  .method("use")
  .method("param")
Router.prototype.middleware = function middleware() {
  return this.router.routes()
}
Router.prototype.route = function route(spec) {
  if (Array.isArray(spec)) {
    for (let i = 0; i < spec.length; i++) {
      this._addRoute(spec[i])
    }
  } else {
    this._addRoute(spec)
  }
  return this
}
Router.prototype._addRoute = function addRoute(spec) {
  this._validateRouteSpec(spec)
  this.routes.push(spec)
  debug('add %s "%s"', spec.method, spec.path)
  const bodyParser = makeBodyParser(spec)
  const specExposer = makeSpecExposer(spec)
  const validator = makeValidator(spec)
  const preHandlers = spec.pre ? flatten(spec.pre) : []
  const handlers = flatten(spec.handler)
  const args = [spec.path].concat(
    preHandlers,
    [prepareRequest, specExposer, bodyParser, validator],
    handlers
  )
  const router = this.router
  spec.method.forEach(method => {
    router[method].apply(router, args)
  })
}
Router.prototype._validateRouteSpec = function validateRouteSpec(spec) {
  assert(spec, "missing spec")
  const ok = typeof spec.path === "string" || spec.path instanceof RegExp
  assert(ok, "invalid route path")
  checkHandler(spec)
  checkPreHandler(spec)
  checkMethods(spec)
  checkValidators(spec)
}
function checkHandler(spec) {
  if (!Array.isArray(spec.handler)) {
    spec.handler = [spec.handler]
  }
  return flatten(spec.handler).forEach(isSupportedFunction)
}
function checkPreHandler(spec) {
  if (!spec.pre) {
    return
  }
  if (!Array.isArray(spec.pre)) {
    spec.pre = [spec.pre]
  }
  return flatten(spec.pre).forEach(isSupportedFunction)
}
function isSupportedFunction(handler) {
  assert.equal("function", typeof handler, "route handler must be a function")
  if (isGenFn(handler)) {
    throw new Error(`route handlers must not be GeneratorFunctions
       Please use "async function" or "function".`)
  }
}
function checkMethods(spec) {
  assert(spec.method, "missing route methods")
  if (typeof spec.method === "string") {
    spec.method = spec.method.split(" ")
  }
  if (!Array.isArray(spec.method)) {
    throw new TypeError("route methods must be an array or string")
  }
  if (spec.method.length === 0) {
    throw new Error("missing route method")
  }
  spec.method.forEach((method, i) => {
    assert(typeof method === "string", "route method must be a string")
    spec.method[i] = method.toLowerCase()
  })
}
function checkValidators(spec) {
  if (!spec.validate) return
  let text
  if (spec.validate.body) {
    text = "validate.type must be declared when using validate.body"
    assert(/json|form/.test(spec.validate.type), text)
  }
  if (spec.validate.type) {
    text = "validate.type must be either json, form, multipart or stream"
    assert(/json|form|multipart|stream/i.test(spec.validate.type), text)
  }
  if (spec.validate.output) {
    spec.validate._outputValidator = new OutputValidator(spec.validate.output)
  }
  if (!spec.validate.failure) {
    spec.validate.failure = 400
  }
}
async function noopMiddleware(ctx, next) {
  return await next()
}
function wrapError(spec, parsePayload) {
  return async function errorHandler(ctx, next) {
    try {
      await parsePayload(ctx)
    } catch (err) {
      captureError(ctx, "type", err)
      if (!spec.validate.continueOnError) {
        return ctx.throw(err)
      }
    }
    await next()
  }
}
function makeJSONBodyParser(spec) {
  const opts = spec.validate.jsonOptions || {}
  if (typeof opts.limit === "undefined") {
    opts.limit = spec.validate.maxBody
  }
  return async function parseJSONPayload(ctx) {
    if (!ctx.request.is("json")) {
      return ctx.throw(400, "expected json")
    }
    // eslint-disable-next-line require-atomic-updates
    ctx.request.body = ctx.request.body || (await parse.json(ctx, opts))
  }
}
function makeFormBodyParser(spec) {
  const opts = spec.validate.formOptions || {}
  if (typeof opts.limit === "undefined") {
    opts.limit = spec.validate.maxBody
  }
  return async function parseFormBody(ctx) {
    if (!ctx.request.is("urlencoded")) {
      return ctx.throw(400, "expected x-www-form-urlencoded")
    }
    // eslint-disable-next-line require-atomic-updates
    ctx.request.body = ctx.request.body || (await parse.form(ctx, opts))
  }
}
function makeMultipartParser(spec) {
  const opts = spec.validate.multipartOptions || {}
  if (typeof opts.autoFields === "undefined") {
    opts.autoFields = true
  }
  return async function parseMultipart(ctx) {
    if (!ctx.request.is("multipart/*")) {
      return ctx.throw(400, "expected multipart")
    }
    ctx.request.parts = busboy(ctx, opts)
  }
}
function makeBodyParser(spec) {
  if (!(spec.validate && spec.validate.type)) return noopMiddleware
  switch (spec.validate.type) {
    case "json":
      return wrapError(spec, makeJSONBodyParser(spec))
    case "form":
      return wrapError(spec, makeFormBodyParser(spec))
    case "stream":
    case "multipart":
      return wrapError(spec, makeMultipartParser(spec))
    default:
      throw new Error(`unsupported body type: ${spec.validate.type}`)
  }
}
function captureError(ctx, type, err) {
  err.msg = err.message
  if (!ctx.invalid) ctx.invalid = {}
  ctx.invalid[type] = err
}
function makeValidator(spec) {
  const props = "header query params body".split(" ")
  return async function validator(ctx, next) {
    if (!spec.validate) return await next()
    let err
    for (let i = 0; i < props.length; ++i) {
      const prop = props[i]
      if (spec.validate[prop]) {
        err = validateInput(prop, ctx, spec.validate)
        if (err) {
          captureError(ctx, prop, err)
          if (!spec.validate.continueOnError) return ctx.throw(err)
        }
      }
    }
    await next()
    if (spec.validate._outputValidator) {
      debug("validating output")
      err = spec.validate._outputValidator.validate(ctx)
      if (err) {
        err.status = 500
        return ctx.throw(err)
      }
    }
  }
}
function makeSpecExposer(spec) {
  const defn = clone(spec)
  return async function specExposer(ctx, next) {
    ctx.state.route = defn
    await next()
  }
}
async function prepareRequest(ctx, next) {
  ctx.request.params = ctx.params
  await next()
}
function validateInput(prop, ctx, validate) {
  debug("validating %s", prop)
  const request = ctx.request
  const res = Joi.compile(validate[prop]).validate(
    request[prop],
    validate.validateOptions || {}
  )
  if (res.error) {
    res.error.status = validate.failure
    return res.error
  }
  // update our request w/ the casted values
  switch (prop) {
    case "header": // request.header is getter only, cannot set it
    case "query": // setting request.query directly causes casting back to strings
      Object.keys(res.value).forEach(key => {
        request[prop][key] = res.value[key]
      })
      break
    case "params":
      request.params = ctx.params = res.value
      break
    default:
      request[prop] = res.value
  }
}
methods.forEach(method => {
  method = method.toLowerCase()
  Router.prototype[method] = function (path) {
    // path, handler1, handler2, ...
    // path, config, handler1
    // path, config, handler1, handler2, ...
    // path, config, [handler1, handler2], handler3, ...
    let fns
    let config
    if (typeof arguments[1] === "function" || Array.isArray(arguments[1])) {
      config = {}
      fns = slice(arguments, 1)
    } else if (typeof arguments[1] === "object") {
      config = arguments[1]
      fns = slice(arguments, 2)
    }
    const spec = {
      path: path,
      method: method,
      handler: fns,
    }
    Object.assign(spec, config)
    this.route(spec)
    return this
  }
})
import assert = require("assert")
import Joi = require("joi")
const helpMsg =
  " -> see: https://github.com/koajs/joi-router/#validating-output"
module.exports = OutputValidationRule
function OutputValidationRule(status, spec) {
  assert(status, "OutputValidationRule: missing status param")
  assert(spec, "OutputValidationRule: missing spec param")
  this.ranges = status.split(",").map(trim).filter(Boolean).map(rangify)
  assert(this.ranges.length > 0, "invalid status code: " + status + helpMsg)
  this.status = status
  this.spec = spec
  this.validateSpec()
}
OutputValidationRule.prototype.validateSpec = function validateSpec() {
  assert(
    this.spec.body || this.spec.headers,
    "output validation key: " +
      this.status +
      " must have either a body or headers validator specified"
  )
}
OutputValidationRule.prototype.toString = function toString() {
  return this.status
}
OutputValidationRule.prototype.overlaps = function overlaps(ruleB) {
  return OutputValidationRule.overlaps(this, ruleB)
}
OutputValidationRule.prototype.matches = function matches(ctx) {
  for (let i = 0; i < this.ranges.length; ++i) {
    const range = this.ranges[i]
    if (ctx.status >= range.lower && ctx.status <= range.upper) {
      return true
    }
  }
  return false
}
OutputValidationRule.prototype.validateOutput = function validateOutput(ctx) {
  let result
  if (this.spec.headers) {
    result = Joi.compile(this.spec.headers).validate(ctx.response.headers)
    if (result.error) return result.error
    // use casted values
    ctx.set(result.value)
  }
  if (this.spec.body) {
    result = Joi.compile(this.spec.body).validate(ctx.body)
    if (result.error) return result.error
    ctx.body = result.value
  }
}
OutputValidationRule.overlaps = function overlaps(a, b) {
  return a.ranges.some(function checkRangeA(rangeA) {
    return b.ranges.some(function checkRangeB(rangeB) {
      if (rangeA.upper >= rangeB.lower && rangeA.lower <= rangeB.upper) {
        return true
      }
      return false
    })
  })
}
function trim(s) {
  return s.trim()
}
function rangify(rule) {
  if (rule === "*") {
    return { lower: 0, upper: Infinity }
  }
  const parts = rule.split("-")
  assert(
    parts.length && parts.length < 3,
    "invalid status code: " + rule + helpMsg
  )
  const lower = parts[0]
  const upper = parts.length === 2 ? parts[1] : lower
  validateCode(lower)
  validateCode(upper)
  return { lower: parseInt(lower, 10), upper: parseInt(upper, 10) }
}
function validateCode(code) {
  assert(
    /^[1-5][0-9]{2}$/.test(code),
    "invalid status code: " + code + " must be between 100-599"
  )
}
import OutputValidationRule = require("./output-validation-rule")
import assert = require("assert")
module.exports = OutputValidator
function OutputValidator(output) {
  assert.equal(
    "object",
    typeof output,
    "spec.validate.output must be an object"
  )
  this.rules = OutputValidator.tokenizeRules(output)
  OutputValidator.assertNoOverlappingStatusRules(this.rules)
  this.output = output
}
OutputValidator.tokenizeRules = function tokenizeRules(output) {
  function createRule(status) {
    return new OutputValidationRule(status, output[status])
  }
  return Object.keys(output).map(createRule)
}
OutputValidator.assertNoOverlappingStatusRules =
  function assertNoOverlappingStatusRules(rules) {
    for (let i = 0; i < rules.length; ++i) {
      const ruleA = rules[i]
      for (let j = 0; j < rules.length; ++j) {
        if (i === j) continue
        const ruleB = rules[j]
        if (ruleA.overlaps(ruleB)) {
          throw new Error(
            "Output validation rules may not overlap: " +
              ruleA +
              " <=> " +
              ruleB
          )
        }
      }
    }
  }
OutputValidator.prototype.validate = function (ctx) {
  assert(ctx, "missing request context!")
  for (let i = 0; i < this.rules.length; ++i) {
    const rule = this.rules[i]
    if (rule.matches(ctx)) {
      return rule.validateOutput(ctx)
    }
  }
}
import onFinished = require("on-finished")
import temp = require("temp-path")
import crypto = require("crypto")
import knox = require("knox")
import cp = require("fs-cp")
import fs = require("fs")
module.exports = Cache
function Cache(options) {
  if (!(this instanceof Cache)) return new Cache(options)
  this.client = knox.createClient(options)
  // salt for hashing
  this.salt = options.salt || ""
}
Cache.prototype.constructor = function* () {}.constructor
Cache.prototype.call = function* (ctx, next) {
  if (yield this.get(ctx)) return
  yield next
  yield this.put(ctx)
}
Cache.prototype.wrap = function (fn) {
  const self = this
  return function* (next) {
    if (yield self.get(this)) return
    yield fn.call(this, next)
    yield self.put(this)
  }
}
Cache.prototype.get = function* (ctx) {
  const key = this._key(ctx)
  const res = yield new Promise((resolve, reject) => {
    this.client.getFile(key, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
  if (res.statusCode !== 200) {
    res.resume()
    return false
  }
  ctx.body = res
  const keys = [
    "cache-control",
    "content-disposition",
    "content-encoding",
    "content-language",
    "content-length",
    "content-type",
    "etag",
  ]
  for (const key of keys) {
    if (res.headers[key]) {
      ctx.response.set(key, res.headers[key])
    }
  }
  if (ctx.fresh) ctx.status = 304
  return true
}
Cache.prototype.set = Cache.prototype.put = function* (ctx) {
  switch (ctx.status) {
    case 200:
    case 201:
    case 202:
      break
    default:
      return
  }
  const client = this.client
  const response = ctx.response
  const res = ctx.res
  let body = response.body
  if (!body) return
  let filename
  if (typeof body.pipe === "function") {
    yield cp(body, (filename = temp()))
    body = null
    response.body = fs.createReadStream(filename)
    // always delete the file afterwards
    onFinished(res, () => {
      setImmediate(() => {
        fs.unlink(filename, noop)
      })
    })
  }
  const headers = {
    "x-amz-storage-class": "REDUCED_REDUNDANCY",
  }
  // note: capitalization required for Knox
  const keys = [
    "Cache-Control",
    "Content-Disposition",
    "Content-Encoding",
    "Content-Language",
    "Content-Type",
  ]
  for (const key of keys) {
    if (response.get(key)) {
      headers[key] = response.get(key)
    }
  }
  const key = this._key(ctx)
  const s3response = yield new Promise((resolve, reject) => {
    if (filename) {
      client.putFile(filename, key, headers, callback)
    } else {
      client.putBuffer(body, key, headers, callback)
    }
    function callback(err, res) {
      if (err) return reject(err)
      resolve(res)
      if (res.statusCode !== 200) {
        res.setEncoding("utf8")
        res.on("data", chunk => {
          console.log(chunk)
        })
      }
    }
  })
  s3response.resume()
  ctx.assert(
    s3response.statusCode === 200,
    "Did not get a 200 from uploading the file."
  )
  response.etag = s3response.headers.etag
  if (ctx.fresh) ctx.status = 304
}
Cache.prototype._key = function (ctx) {
  return crypto
    .createHash("sha256")
    .update(this.salt)
    .update("url:")
    .update(ctx.request.url)
    .digest("hex")
}
function noop() {}
const promisify = require("util").promisify
const extname = require("path").extname
import fs = require("fs")
import calculate = require("etag")
const stat = promisify(fs.stat)
const notfound = {
  ENOENT: true,
  ENAMETOOLONG: true,
  ENOTDIR: true,
}
module.exports = async function sendfile(ctx, path) {
  try {
    const stats = await stat(path)
    if (!stats) return null
    if (!stats.isFile()) return stats
    ctx.response.status = 200
    ctx.response.lastModified = stats.mtime
    ctx.response.length = stats.size
    ctx.response.type = extname(path)
    if (!ctx.response.etag) {
      ctx.response.etag = calculate(stats, {
        weak: true,
      })
    }
    // fresh based solely on last-modified
    switch (ctx.request.method) {
      case "HEAD":
        ctx.status = ctx.request.fresh ? 304 : 200
        break
      case "GET":
        if (ctx.request.fresh) {
          ctx.status = 304
        } else {
          ctx.body = fs.createReadStream(path)
        }
        break
    }
    return stats
  } catch (err) {
    if (notfound[err.code]) return
    err.status = 500
    throw err
  }
}
const debug = require("debug")("koa-session")
import ContextSession = require("./lib/context")
import util = require("./lib/util")
import assert = require("assert")
import uuid = require("uuid/v4")
import is = require("is-type-of")
const CONTEXT_SESSION = Symbol("context#contextSession")
const _CONTEXT_SESSION = Symbol("context#_contextSession")
module.exports = function (opts, app) {
  // session(app[, opts])
  if (opts && typeof opts.use === "function") {
    ;[app, opts] = [opts, app]
  }
  // app required
  if (!app || typeof app.use !== "function") {
    throw new TypeError("app instance required: `session(opts, app)`")
  }
  opts = formatOpts(opts)
  extendContext(app.context, opts)
  return async function session(ctx, next) {
    const sess = ctx[CONTEXT_SESSION]
    if (sess.store) await sess.initFromExternal()
    try {
      await next()
    } catch (err) {
      throw err
    } finally {
      if (opts.autoCommit) {
        await sess.commit()
      }
    }
  }
}
function formatOpts(opts) {
  opts = opts || {}
  // key
  opts.key = opts.key || "koa.sess"
  // back-compat maxage
  if (!("maxAge" in opts)) opts.maxAge = opts.maxage
  // defaults
  if (opts.overwrite == null) opts.overwrite = true
  if (opts.httpOnly == null) opts.httpOnly = true
  // delete null sameSite config
  if (opts.sameSite == null) delete opts.sameSite
  if (opts.signed == null) opts.signed = true
  if (opts.autoCommit == null) opts.autoCommit = true
  debug("session options %j", opts)
  // setup encoding/decoding
  if (typeof opts.encode !== "function") {
    opts.encode = util.encode
  }
  if (typeof opts.decode !== "function") {
    opts.decode = util.decode
  }
  const store = opts.store
  if (store) {
    assert(is.function(store.get), "store.get must be function")
    assert(is.function(store.set), "store.set must be function")
    assert(is.function(store.destroy), "store.destroy must be function")
  }
  const externalKey = opts.externalKey
  if (externalKey) {
    assert(is.function(externalKey.get), "externalKey.get must be function")
    assert(is.function(externalKey.set), "externalKey.set must be function")
  }
  const ContextStore = opts.ContextStore
  if (ContextStore) {
    assert(is.class(ContextStore), "ContextStore must be a class")
    assert(
      is.function(ContextStore.prototype.get),
      "ContextStore.prototype.get must be function"
    )
    assert(
      is.function(ContextStore.prototype.set),
      "ContextStore.prototype.set must be function"
    )
    assert(
      is.function(ContextStore.prototype.destroy),
      "ContextStore.prototype.destroy must be function"
    )
  }
  if (!opts.genid) {
    if (opts.prefix) opts.genid = () => `${opts.prefix}${uuid()}`
    else opts.genid = uuid
  }
  return opts
}
function extendContext(context, opts) {
  if (context.hasOwnProperty(CONTEXT_SESSION)) {
    return
  }
  Object.defineProperties(context, {
    [CONTEXT_SESSION]: {
      get() {
        if (this[_CONTEXT_SESSION]) return this[_CONTEXT_SESSION]
        this[_CONTEXT_SESSION] = new ContextSession(this, opts)
        return this[_CONTEXT_SESSION]
      },
    },
    session: {
      get() {
        return this[CONTEXT_SESSION].get()
      },
      set(val) {
        this[CONTEXT_SESSION].set(val)
      },
      configurable: true,
    },
    sessionOptions: {
      get() {
        return this[CONTEXT_SESSION].opts
      },
    },
  })
}
var session = require("./")
var Koa = require("koa")
var app = new Koa()
app.keys = ["some secret hurr"]
app.use(session(app))
app.use(function* (next) {
  if ("/favicon.ico" == this.path) return
  var n = this.session.views || 0
  this.session.views = ++n
  this.body = n + " views"
})
app.listen(3000)
console.log("listening on port 3000")
;("use strict")
const debug = require("debug")("koa-session:context")
import Session = require("./session")
import util = require("./util")
const COOKIE_EXP_DATE = new Date(util.CookieDateEpoch)
const ONE_DAY = 24 * 60 * 60 * 1000
class ContextSession {
  constructor(ctx, opts) {
    this.ctx = ctx
    this.app = ctx.app
    this.opts = Object.assign({}, opts)
    this.store = this.opts.ContextStore
      ? new this.opts.ContextStore(ctx)
      : this.opts.store
  }
  get() {
    const session = this.session
    // already retrieved
    if (session) return session
    // unset
    if (session === false) return null
    // create an empty session or init from cookie
    this.store ? this.create() : this.initFromCookie()
    return this.session
  }
  set(val) {
    if (val === null) {
      this.session = false
      return
    }
    if (typeof val === "object") {
      // use the original `externalKey` if exists to avoid waste storage
      this.create(val, this.externalKey)
      return
    }
    throw new Error("this.session can only be set as null or an object.")
  }
  async initFromExternal() {
    debug("init from external")
    const ctx = this.ctx
    const opts = this.opts
    let externalKey
    if (opts.externalKey) {
      externalKey = opts.externalKey.get(ctx)
      debug("get external key from custom %s", externalKey)
    } else {
      externalKey = ctx.cookies.get(opts.key, opts)
      debug("get external key from cookie %s", externalKey)
    }
    if (!externalKey) {
      // create a new `externalKey`
      this.create()
      return
    }
    const json = await this.store.get(externalKey, opts.maxAge, {
      ctx,
      rolling: opts.rolling,
    })
    if (!this.valid(json, externalKey)) {
      // create a new `externalKey`
      this.create()
      return
    }
    // create with original `externalKey`
    this.create(json, externalKey)
    this.prevHash = util.hash(this.session.toJSON())
  }
  initFromCookie() {
    debug("init from cookie")
    const ctx = this.ctx
    const opts = this.opts
    const cookie = ctx.cookies.get(opts.key, opts)
    if (!cookie) {
      this.create()
      return
    }
    let json
    debug("parse %s", cookie)
    try {
      json = opts.decode(cookie)
    } catch (err) {
      debug("decode %j error: %s", cookie, err)
      if (!(err instanceof SyntaxError)) {
        // clean this cookie to ensure next request won't throw again
        ctx.cookies.set(opts.key, "", opts)
        // ctx.onerror will unset all headers, and set those specified in err
        err.headers = {
          "set-cookie": ctx.response.get("set-cookie"),
        }
        throw err
      }
      this.create()
      return
    }
    debug("parsed %j", json)
    if (!this.valid(json)) {
      this.create()
      return
    }
    // support access `ctx.session` before session middleware
    this.create(json)
    this.prevHash = util.hash(this.session.toJSON())
  }
  valid(value, key) {
    const ctx = this.ctx
    if (!value) {
      this.emit("missed", { key, value, ctx })
      return false
    }
    if (value._expire && value._expire < Date.now()) {
      debug("expired session")
      this.emit("expired", { key, value, ctx })
      return false
    }
    const valid = this.opts.valid
    if (typeof valid === "function" && !valid(ctx, value)) {
      // valid session value fail, ignore this session
      debug("invalid session")
      this.emit("invalid", { key, value, ctx })
      return false
    }
    return true
  }
  emit(event, data) {
    setImmediate(() => {
      this.app.emit(`session:${event}`, data)
    })
  }
  create(val, externalKey) {
    debug("create session with val: %j externalKey: %s", val, externalKey)
    if (this.store)
      this.externalKey =
        externalKey || (this.opts.genid && this.opts.genid(this.ctx))
    this.session = new Session(this, val, this.externalKey)
  }
  async commit() {
    const session = this.session
    const opts = this.opts
    const ctx = this.ctx
    if (undefined === session) return
    // removed
    if (session === false) {
      await this.remove()
      return
    }
    const reason = this._shouldSaveSession()
    debug("should save session: %s", reason)
    if (!reason) return
    if (typeof opts.beforeSave === "function") {
      debug("before save")
      opts.beforeSave(ctx, session)
    }
    const changed = reason === "changed"
    await this.save(changed)
  }
  _shouldSaveSession() {
    const prevHash = this.prevHash
    const session = this.session
    // force save session when `session._requireSave` set
    if (session._requireSave) return "force"
    // do nothing if new and not populated
    const json = session.toJSON()
    if (!prevHash && !Object.keys(json).length) return ""
    // save if session changed
    const changed = prevHash !== util.hash(json)
    if (changed) return "changed"
    // save if opts.rolling set
    if (this.opts.rolling) return "rolling"
    // save if opts.renew and session will expired
    if (this.opts.renew) {
      const expire = session._expire
      const maxAge = session.maxAge
      // renew when session will expired in maxAge / 2
      if (expire && maxAge && expire - Date.now() < maxAge / 2) return "renew"
    }
    return ""
  }
  async remove() {
    // Override the default options so that we can properly expire the session cookies
    const opts = Object.assign({}, this.opts, {
      expires: COOKIE_EXP_DATE,
      maxAge: false,
    })
    const ctx = this.ctx
    const key = opts.key
    const externalKey = this.externalKey
    if (externalKey) await this.store.destroy(externalKey, { ctx })
    ctx.cookies.set(key, "", opts)
  }
  async save(changed) {
    const opts = this.opts
    const key = opts.key
    const externalKey = this.externalKey
    let json = this.session.toJSON()
    // set expire for check
    let maxAge = opts.maxAge ? opts.maxAge : ONE_DAY
    if (maxAge === "session") {
      // do not set _expire in json if maxAge is set to 'session'
      // also delete maxAge from options
      opts.maxAge = undefined
      json._session = true
    } else {
      // set expire for check
      json._expire = maxAge + Date.now()
      json._maxAge = maxAge
    }
    // save to external store
    if (externalKey) {
      debug("save %j to external key %s", json, externalKey)
      if (typeof maxAge === "number") {
        // ensure store expired after cookie
        maxAge += 10000
      }
      await this.store.set(externalKey, json, maxAge, {
        changed,
        ctx: this.ctx,
        rolling: opts.rolling,
      })
      if (opts.externalKey) {
        opts.externalKey.set(this.ctx, externalKey)
      } else {
        this.ctx.cookies.set(key, externalKey, opts)
      }
      return
    }
    // save to cookie
    debug("save %j to cookie", json)
    json = opts.encode(json)
    debug("save %s", json)
    this.ctx.cookies.set(key, json, opts)
  }
}
module.exports = ContextSession
const inspect = Symbol.for("nodejs.util.inspect.custom")
class Session {
  constructor(sessionContext, obj, externalKey) {
    this._sessCtx = sessionContext
    this._ctx = sessionContext.ctx
    this._externalKey = externalKey
    if (!obj) {
      this.isNew = true
    } else {
      for (const k in obj) {
        // restore maxAge from store
        if (k === "_maxAge") this._ctx.sessionOptions.maxAge = obj._maxAge
        else if (k === "_session") this._ctx.sessionOptions.maxAge = "session"
        else this[k] = obj[k]
      }
    }
  }
  toJSON() {
    const obj = {}
    Object.keys(this).forEach(key => {
      if (key === "isNew") return
      if (key[0] === "_") return
      obj[key] = this[key]
    })
    return obj
  }
  [inspect]() {
    return this.toJSON()
  }
  get length() {
    return Object.keys(this.toJSON()).length
  }
  get populated() {
    return !!this.length
  }
  get maxAge() {
    return this._ctx.sessionOptions.maxAge
  }
  set maxAge(val) {
    this._ctx.sessionOptions.maxAge = val
    // maxAge changed, must save to cookie and store
    this._requireSave = true
  }
  get externalKey() {
    return this._externalKey
  }
  save() {
    this._requireSave = true
  }
  async manuallyCommit() {
    await this._sessCtx.commit()
  }
}
module.exports = Session
const crc = require("crc").crc32
module.exports = {
  decode(string) {
    const body = Buffer.from(string, "base64").toString("utf8")
    const json = JSON.parse(body)
    return json
  },
  encode(body) {
    body = JSON.stringify(body)
    return Buffer.from(body).toString("base64")
  },
  hash(sess) {
    return crc(JSON.stringify(sess))
  },
  CookieDateEpoch: "Thu, 01 Jan 1970 00:00:00 GMT",
}
const debug = require("debug")("koa-static")
import { resolve } from "path"
import assert = require("assert")
import send = require("koa-send")
module.exports = serve
function serve(root, opts) {
  opts = Object.assign(Object.create(null), opts)
  assert(root, "root directory is required to serve files")
  // options
  debug('static "%s" %j', root, opts)
  opts.root = resolve(root)
  if (opts.index !== false) opts.index = opts.index || "index.html"
  if (!opts.defer) {
    return async function serve(ctx, next) {
      let done = false
      if (ctx.method === "HEAD" || ctx.method === "GET") {
        try {
          done = await send(ctx, ctx.path, opts)
        } catch (err) {
          if (err.status !== 404) {
            throw err
          }
        }
      }
      if (!done) {
        await next()
      }
    }
  }
  return async function serve(ctx, next) {
    await next()
    if (ctx.method !== "HEAD" && ctx.method !== "GET") return
    // response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line
    try {
      await send(ctx, ctx.path, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}
import serve = require("./")
import Koa = require("koa")
const app = new Koa()
// $ GET /package.json
// $ GET /
app.use(serve("."))
app.use((ctx, next) => {
  return next().then(() => {
    if (ctx.path === "/") {
      ctx.body = "Try `GET /package.json`"
    }
  })
})
app.listen(3000)
console.log("listening on port 3000")
import originalMulter = require("multer")
function multer(options) {
  const m = originalMulter(options)
  makePromise(m, "any")
  makePromise(m, "array")
  makePromise(m, "fields")
  makePromise(m, "none")
  makePromise(m, "single")
  return m
}
function makePromise(multer, name) {
  if (!multer[name]) return
  const fn = multer[name]
  multer[name] = function () {
    const middleware = Reflect.apply(fn, this, arguments)
    return async (ctx, next) => {
      await new Promise((resolve, reject) => {
        middleware(ctx.req, ctx.res, err => {
          if (err) return reject(err)
          if ("request" in ctx) {
            if (ctx.req.body) {
              ctx.request.body = ctx.req.body
              delete ctx.req.body
            }
            if (ctx.req.file) {
              ctx.request.file = ctx.req.file
              ctx.file = ctx.req.file
              delete ctx.req.file
            }
            if (ctx.req.files) {
              ctx.request.files = ctx.req.files
              ctx.files = ctx.req.files
              delete ctx.req.files
            }
          }
          resolve(ctx)
        })
      })
      return next()
    }
  }
}
multer.diskStorage = originalMulter.diskStorage
multer.memoryStorage = originalMulter.memoryStorage
module.exports = multer
import vary = require("vary")
module.exports = function (options) {
  const defaults = {
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
  }
  options = {
    ...defaults,
    ...options,
  }
  if (Array.isArray(options.exposeHeaders)) {
    options.exposeHeaders = options.exposeHeaders.join(",")
  }
  if (Array.isArray(options.allowMethods)) {
    options.allowMethods = options.allowMethods.join(",")
  }
  if (Array.isArray(options.allowHeaders)) {
    options.allowHeaders = options.allowHeaders.join(",")
  }
  if (options.maxAge) {
    options.maxAge = String(options.maxAge)
  }
  options.keepHeadersOnError =
    options.keepHeadersOnError === undefined || !!options.keepHeadersOnError
  return async function cors(ctx, next) {
    // If the Origin header is not present terminate this set of steps.
    // The request is outside the scope of this specification.
    const requestOrigin = ctx.get("Origin")
    // Always set Vary header
    // https://github.com/rs/cors/issues/10
    ctx.vary("Origin")
    if (!requestOrigin) return await next()
    let origin
    if (typeof options.origin === "function") {
      origin = options.origin(ctx)
      if (origin instanceof Promise) origin = await origin
      if (!origin) return await next()
    } else {
      origin = options.origin || requestOrigin
    }
    let credentials
    if (typeof options.credentials === "function") {
      credentials = options.credentials(ctx)
      if (credentials instanceof Promise) credentials = await credentials
    } else {
      credentials = !!options.credentials
    }
    const headersSet = {}
    function set(key, value) {
      ctx.set(key, value)
      headersSet[key] = value
    }
    if (ctx.method !== "OPTIONS") {
      // Simple Cross-Origin Request, Actual Request, and Redirects
      set("Access-Control-Allow-Origin", origin)
      if (credentials === true) {
        set("Access-Control-Allow-Credentials", "true")
      }
      if (options.exposeHeaders) {
        set("Access-Control-Expose-Headers", options.exposeHeaders)
      }
      if (!options.keepHeadersOnError) {
        return await next()
      }
      try {
        return await next()
      } catch (err) {
        const errHeadersSet = err.headers || {}
        const varyWithOrigin = vary.append(
          errHeadersSet.vary || errHeadersSet.Vary || "",
          "Origin"
        )
        delete errHeadersSet.Vary
        err.headers = {
          ...errHeadersSet,
          ...headersSet,
          ...{ vary: varyWithOrigin },
        }
        throw err
      }
    } else {
      // Preflight Request
      // If there is no Access-Control-Request-Method header or if parsing failed,
      // do not set any additional headers and terminate this set of steps.
      // The request is outside the scope of this specification.
      if (!ctx.get("Access-Control-Request-Method")) {
        // this not preflight request, ignore it
        return await next()
      }
      ctx.set("Access-Control-Allow-Origin", origin)
      if (credentials === true) {
        ctx.set("Access-Control-Allow-Credentials", "true")
      }
      if (options.maxAge) {
        ctx.set("Access-Control-Max-Age", options.maxAge)
      }
      if (options.allowMethods) {
        ctx.set("Access-Control-Allow-Methods", options.allowMethods)
      }
      let allowHeaders = options.allowHeaders
      if (!allowHeaders) {
        allowHeaders = ctx.get("Access-Control-Request-Headers")
      }
      if (allowHeaders) {
        ctx.set("Access-Control-Allow-Headers", allowHeaders)
      }
      ctx.status = 204
    }
  }
}
*/
