import { debuglog } from "util"
import compose from "koa-compose"
import HttpError from "http-errors"
import methods from "methods"
import { parse as parseUrl, format as formatUrl } from "url"
import { pathToRegexp, compile, parse } from "path-to-regexp"

const debug = debuglog("koa-router")

export class Layer {
  constructor(
    path: string | RegExp,
    methods: Array<any>,
    middleware: Array<any>,
    opts: object | undefined = {}
  ) {
    this.opts = opts
    this.name = this.opts.name || null
    this.methods = []
    this.paramNames = []
    this.stack = Array.isArray(middleware) ? middleware : [middleware]
    for (const method of methods) {
      const l = this.methods.push(method.toUpperCase())
      if (this.methods[l - 1] === "GET") this.methods.unshift("HEAD")
    }
    for (let i = 0; i < this.stack.length; i++) {
      const fn = this.stack[i]
      const type = typeof fn
      if (type !== "function")
        throw new Error(
          `${methods.toString()} \`${
            this.opts.name || path
          }\`: \`middleware\` must be a function, not \`${type}\``
        )
    }
    this.path = path
    this.regexp = pathToRegexp(path, this.paramNames, this.opts)
  }
  match(path: string): boolean {
    return this.regexp.test(path)
  }
  params(
    path: string,
    captures: Array<string>,
    params: object | undefined = {}
  ): object {
    for (let len = captures.length, i = 0; i < len; i++) {
      if (this.paramNames[i]) {
        const c = captures[i]
        if (c && c.length > 0)
          params[this.paramNames[i].name] = c ? safeDecodeURIComponent(c) : c
      }
    }
    return params
  }
  captures(path: string): Array<string> {
    return this.opts.ignoreCaptures ? [] : path.match(this.regexp).slice(1)
  }
  url(params: object, options): string {
    let args = params
    const url = this.path.replace(/\(\.\*\)/g, "")
    if (typeof params !== "object") {
      args = Array.prototype.slice.call(arguments)
      if (typeof args[args.length - 1] === "object") {
        options = args[args.length - 1]
        args = args.slice(0, -1)
      }
    }
    const toPath = compile(url, { encode: encodeURIComponent, ...options })
    let replaced
    const tokens = parse(url)
    let replace = {}
    if (Array.isArray(args)) {
      for (let len = tokens.length, i = 0, j = 0; i < len; i++) {
        if (tokens[i].name) replace[tokens[i].name] = args[j++]
      }
    } else if (tokens.some(token => token.name)) {
      replace = params
    } else if (!options) {
      options = params
    }
    replaced = toPath(replace)
    if (options && options.query) {
      replaced = parseUrl(replaced)
      if (typeof options.query === "string") {
        replaced.search = options.query
      } else {
        replaced.search = undefined
        replaced.query = options.query
      }
      return formatUrl(replaced)
    }
    return replaced
  }
  param(param: string, fn): Layer {
    const { stack } = this
    const params = this.paramNames
    const middleware = function (ctx, next) {
      return fn.call(this, ctx.params[param], ctx, next)
    }
    middleware.param = param
    const names = params.map(function (p) {
      return p.name
    })
    const x = names.indexOf(param)
    if (x > -1) {
      stack.some(function (fn, i) {
        if (!fn.param || names.indexOf(fn.param) > x) {
          stack.splice(i, 0, middleware)
          return true
        }
      })
    }
    return this
  }
  setPrefix(prefix: string): Layer {
    if (this.path) {
      this.path =
        this.path !== "/" || this.opts.strict === true
          ? `${prefix}${this.path}`
          : prefix
      this.paramNames = []
      this.regexp = pathToRegexp(this.path, this.paramNames, this.opts)
    }
    return this
  }
}
function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

export class Router {
  constructor(opts: object | undefined = {}) {
    if (!(this instanceof Router)) return new Router(opts)
    this.opts = opts
    this.methods = this.opts.methods || [
      "HEAD",
      "OPTIONS",
      "GET",
      "PUT",
      "PATCH",
      "POST",
      "DELETE",
    ]
    this.exclusive = Boolean(this.opts.exclusive)
    this.params = {}
    this.stack = []
    this.host = this.opts.host

    for (const method_ of methods) {
      function setMethodVerb(method) {
        Router.prototype[method] = function (name, path, middleware) {
          if (typeof path === "string" || path instanceof RegExp) {
            middleware = Array.prototype.slice.call(arguments, 2)
          } else {
            middleware = Array.prototype.slice.call(arguments, 1)
            path = name
            name = null
          }
          if (
            typeof path !== "string" &&
            !(path instanceof RegExp) &&
            (!Array.isArray(path) || path.length === 0)
          )
            throw new Error(
              `You have to provide a path when adding a ${method} handler`
            )
          this.register(path, [method], middleware, { name })
          return this
        }
      }
      setMethodVerb(method_)
    }
  }
  //del = Router.prototype["delete"]
  use(): Router {
    const router = this
    const middleware = Array.prototype.slice.call(arguments)
    let path
    if (Array.isArray(middleware[0]) && typeof middleware[0][0] === "string") {
      const arrPaths = middleware[0]
      for (const p of arrPaths) {
        router.use.apply(router, [p].concat(middleware.slice(1)))
      }
      return this
    }
    const hasPath = typeof middleware[0] === "string"
    if (hasPath) path = middleware.shift()
    for (const m of middleware) {
      if (m.router) {
        const cloneRouter = Object.assign(
          Object.create(Router.prototype),
          m.router,
          {
            stack: [...m.router.stack],
          }
        )
        for (let j = 0; j < cloneRouter.stack.length; j++) {
          const nestedLayer = cloneRouter.stack[j]
          const cloneLayer = Object.assign(
            Object.create(Layer.prototype),
            nestedLayer
          )
          if (path) cloneLayer.setPrefix(path)
          if (router.opts.prefix) cloneLayer.setPrefix(router.opts.prefix)
          router.stack.push(cloneLayer)
          cloneRouter.stack[j] = cloneLayer
        }
        if (router.params) {
          function setRouterParams(paramArr) {
            const routerParams = paramArr
            for (const key of routerParams) {
              cloneRouter.param(key, router.params[key])
            }
          }
          setRouterParams(Object.keys(router.params))
        }
      } else {
        const keys = []
        pathToRegexp(router.opts.prefix || "", keys)
        const routerPrefixHasParam = router.opts.prefix && keys.length
        router.register(path || "([^/]*)", [], m, {
          end: false,
          ignoreCaptures: !hasPath && !routerPrefixHasParam,
        })
      }
    }
    return this
  }
  prefix(prefix: string): Router {
    prefix = prefix.replace(/\/$/, "")
    this.opts.prefix = prefix
    for (let i = 0; i < this.stack.length; i++) {
      const route = this.stack[i]
      route.setPrefix(prefix)
    }
    return this
  }
  routes = this.middleware
  middleware(): Function {
    const router = this
    const dispatch = function dispatch(ctx, next) {
      debug("%s %s", ctx.method, ctx.path)
      const hostMatched = router.matchHost(ctx.host)
      if (!hostMatched) {
        return next()
      }
      const path = router.opts.routerPath || ctx.routerPath || ctx.path
      const matched = router.match(path, ctx.method)
      let layerChain
      if (ctx.matched) {
        ctx.matched.push.apply(ctx.matched, matched.path)
      } else {
        ctx.matched = matched.path
      }
      ctx.router = router
      if (!matched.route) return next()
      const matchedLayers = matched.pathAndMethod
      const mostSpecificLayer = matchedLayers[matchedLayers.length - 1]
      ctx._matchedRoute = mostSpecificLayer.path
      if (mostSpecificLayer.name) {
        ctx._matchedRouteName = mostSpecificLayer.name
      }
      layerChain = (
        router.exclusive ? [mostSpecificLayer] : matchedLayers
      ).reduce(function (memo, layer) {
        memo.push(function (ctx, next) {
          ctx.captures = layer.captures(path, ctx.captures)
          ctx.params = ctx.request.params = layer.params(
            path,
            ctx.captures,
            ctx.params
          )
          ctx.routerPath = layer.path
          ctx.routerName = layer.name
          ctx._matchedRoute = layer.path
          if (layer.name) {
            ctx._matchedRouteName = layer.name
          }
          return next()
        })
        return memo.concat(layer.stack)
      }, [])
      return compose(layerChain)(ctx, next)
    }
    dispatch.router = this
    return dispatch
  }
  allowedMethods(options: object | undefined = {}): Function {
    const implemented = this.methods
    return function allowedMethods(ctx, next) {
      return next().then(function () {
        const allowed = {}
        if (!ctx.status || ctx.status === 404) {
          for (let i = 0; i < ctx.matched.length; i++) {
            const route = ctx.matched[i]
            for (let j = 0; j < route.methods.length; j++) {
              const method = route.methods[j]
              allowed[method] = method
            }
          }
          const allowedArr = Object.keys(allowed)
          if (!~implemented.indexOf(ctx.method)) {
            if (options.throw) {
              const notImplementedThrowable =
                typeof options.notImplemented === "function"
                  ? options.notImplemented()
                  : new HttpError.NotImplemented()
              throw notImplementedThrowable
            } else {
              ctx.status = 501
              ctx.set("Allow", allowedArr.join(", "))
            }
          } else if (allowedArr.length > 0) {
            if (ctx.method === "OPTIONS") {
              ctx.status = 200
              ctx.body = ""
              ctx.set("Allow", allowedArr.join(", "))
            } else if (!allowed[ctx.method]) {
              if (options.throw) {
                const notAllowedThrowable =
                  typeof options.methodNotAllowed === "function"
                    ? options.methodNotAllowed()
                    : new HttpError.MethodNotAllowed()
                throw notAllowedThrowable
              } else {
                ctx.status = 405
                ctx.set("Allow", allowedArr.join(", "))
              }
            }
          }
        }
      })
    }
  }
  all(name: string, path: string, middleware: Function | undefined): Router {
    if (typeof path === "string") {
      middleware = Array.prototype.slice.call(arguments, 2)
    } else {
      middleware = Array.prototype.slice.call(arguments, 1)
      path = name
      name = null
    }
    if (
      typeof path !== "string" &&
      !(path instanceof RegExp) &&
      (!Array.isArray(path) || path.length === 0)
    )
      throw new Error("You have to provide a path when adding an all handler")
    this.register(path, methods, middleware, { name })
    return this
  }
  redirect(
    source: string,
    destination: string,
    code: number | undefined
  ): Router {
    if (typeof source === "symbol" || source[0] !== "/") {
      source = this.url(source)
      if (source instanceof Error) throw source
    }
    if (
      typeof destination === "symbol" ||
      (destination[0] !== "/" && !destination.includes("://"))
    ) {
      destination = this.url(destination)
      if (destination instanceof Error) throw destination
    }
    return this.all(source, ctx => {
      ctx.redirect(destination)
      ctx.status = code || 301
    })
  }
  register(
    path: string,
    methods: Array<string>,
    middleware: Function,
    opts = {}
  ): Layer {
    const router = this
    const { stack } = this
    if (Array.isArray(path)) {
      for (const curPath of path) {
        router.register.call(router, curPath, methods, middleware, opts)
      }
      return this
    }
    const route = new Layer(path, methods, middleware, {
      end: opts.end === false ? opts.end : true,
      name: opts.name,
      sensitive: opts.sensitive || this.opts.sensitive || false,
      strict: opts.strict || this.opts.strict || false,
      prefix: opts.prefix || this.opts.prefix || "",
      ignoreCaptures: opts.ignoreCaptures,
    })
    if (this.opts.prefix) {
      route.setPrefix(this.opts.prefix)
    }
    for (let i = 0; i < Object.keys(this.params).length; i++) {
      const param = Object.keys(this.params)[i]
      route.param(param, this.params[param])
    }
    stack.push(route)
    debug("defined route %s %s", route.methods, route.path)
    return route
  }
  route(name: string): Layer | false {
    const routes = this.stack
    for (let len = routes.length, i = 0; i < len; i++) {
      if (routes[i].name && routes[i].name === name) return routes[i]
    }
    return false
  }
  url(name: string, params: object): string | Error {
    const route = this.route(name)
    if (route) {
      const args = Array.prototype.slice.call(arguments, 1)
      return route.url.apply(route, args)
    }
    return new Error(`No route found for name: ${String(name)}`)
  }
  match(path: string, method: string) /*: object<path, pathAndMethod>*/ {
    const layers = this.stack
    let layer
    const matched = {
      path: [],
      pathAndMethod: [],
      route: false,
    }
    for (let len = layers.length, i = 0; i < len; i++) {
      layer = layers[i]
      debug("test %s %s", layer.path, layer.regexp)
      if (layer.match(path)) {
        matched.path.push(layer)
        if (layer.methods.length === 0 || ~layer.methods.indexOf(method)) {
          matched.pathAndMethod.push(layer)
          if (layer.methods.length > 0) matched.route = true
        }
      }
    }
    return matched
  }
  matchHost(input: string): boolean {
    const { host } = this
    if (!host) {
      return true
    }
    if (!input) {
      return false
    }
    if (typeof host === "string") {
      return input === host
    }
    if (typeof host === "object" && host instanceof RegExp) {
      return host.test(input)
    }
  }
  param(param: string, middleware: Function): Router {
    this.params[param] = middleware
    for (let i = 0; i < this.stack.length; i++) {
      const route = this.stack[i]
      route.param(param, middleware)
    }
    return this
  }
  url(path: string): string {
    const args = Array.prototype.slice.call(arguments, 1)
    return Layer.prototype.url.apply({ path }, args)
  }
}
