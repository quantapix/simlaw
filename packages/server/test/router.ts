/**
 * Router tests
 */

const fs = require("fs")
const http = require("http")
const path = require("path")
const assert = require("assert")
const Koa = require("koa")
const methods = require("methods")
const request = require("supertest")
const expect = require("expect.js")
const should = require("should")
const Router = require("../../lib/router")
const Layer = require("../../lib/layer")

/**
 * Route tests
 */

const http = require("http")
const Koa = require("koa")
const request = require("supertest")
const Router = require("../../lib/router")
const Layer = require("../../lib/layer")

describe("Layer", function () {
  it("composes multiple callbacks/middleware", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    router.get(
      "/:category/:title",
      function (ctx, next) {
        ctx.status = 500
        return next()
      },
      function (ctx, next) {
        ctx.status = 204
        return next()
      }
    )
    request(http.createServer(app.callback()))
      .get("/programming/how-to-node")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)
        done()
      })
  })

  describe("Layer#match()", function () {
    it("captures URL path parameters", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get("/:category/:title", function (ctx) {
        ctx.should.have.property("params")
        ctx.params.should.be.type("object")
        ctx.params.should.have.property("category", "match")
        ctx.params.should.have.property("title", "this")
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get("/match/this")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("return original path parameters when decodeURIComponent throw error", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get("/:category/:title", function (ctx) {
        ctx.should.have.property("params")
        ctx.params.should.be.type("object")
        ctx.params.should.have.property("category", "100%")
        ctx.params.should.have.property("title", "101%")
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get("/100%/101%")
        .expect(204)
        .end(done)
    })

    it("populates ctx.captures with regexp captures", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get(
        /^\/api\/([^/]+)\/?/i,
        function (ctx, next) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.instanceOf(Array)
          ctx.captures.should.have.property(0, "1")
          return next()
        },
        function (ctx) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.instanceOf(Array)
          ctx.captures.should.have.property(0, "1")
          ctx.status = 204
        }
      )
      request(http.createServer(app.callback()))
        .get("/api/1")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("return original ctx.captures when decodeURIComponent throw error", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get(
        /^\/api\/([^/]+)\/?/i,
        function (ctx, next) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.type("object")
          ctx.captures.should.have.property(0, "101%")
          return next()
        },
        function (ctx) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.type("object")
          ctx.captures.should.have.property(0, "101%")
          ctx.status = 204
        }
      )
      request(http.createServer(app.callback()))
        .get("/api/101%")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("populates ctx.captures with regexp captures include undefined", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get(
        /^\/api(\/.+)?/i,
        function (ctx, next) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.type("object")
          ctx.captures.should.have.property(0, undefined)
          return next()
        },
        function (ctx) {
          ctx.should.have.property("captures")
          ctx.captures.should.be.type("object")
          ctx.captures.should.have.property(0, undefined)
          ctx.status = 204
        }
      )
      request(http.createServer(app.callback()))
        .get("/api")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("should throw friendly error message when handle not exists", function () {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      const notexistHandle = undefined
      ;(function () {
        router.get("/foo", notexistHandle)
      }.should.throw(
        "get `/foo`: `middleware` must be a function, not `undefined`"
      ))

      ;(function () {
        router.get("foo router", "/foo", notexistHandle)
      }.should.throw(
        "get `foo router`: `middleware` must be a function, not `undefined`"
      ))

      ;(function () {
        router.post("/foo", function () {}, notexistHandle)
      }.should.throw(
        "post `/foo`: `middleware` must be a function, not `undefined`"
      ))
    })
  })

  describe("Layer#param()", function () {
    it("composes middleware for param fn", function (done) {
      const app = new Koa()
      const router = new Router()
      const route = new Layer(
        "/users/:user",
        ["GET"],
        [
          function (ctx) {
            ctx.body = ctx.user
          },
        ]
      )
      route.param("user", function (id, ctx, next) {
        ctx.user = { name: "alex" }
        if (!id) return (ctx.status = 404)
        return next()
      })
      router.stack.push(route)
      app.use(router.middleware())
      request(http.createServer(app.callback()))
        .get("/users/3")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.have.property("name", "alex")
          done()
        })
    })

    it("ignores params which are not matched", function (done) {
      const app = new Koa()
      const router = new Router()
      const route = new Layer(
        "/users/:user",
        ["GET"],
        [
          function (ctx) {
            ctx.body = ctx.user
          },
        ]
      )
      route.param("user", function (id, ctx, next) {
        ctx.user = { name: "alex" }
        if (!id) return (ctx.status = 404)
        return next()
      })
      route.param("title", function (id, ctx, next) {
        ctx.user = { name: "mark" }
        if (!id) return (ctx.status = 404)
        return next()
      })
      router.stack.push(route)
      app.use(router.middleware())
      request(http.createServer(app.callback()))
        .get("/users/3")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.have.property("name", "alex")
          done()
        })
    })
  })

  describe("Layer#params()", function () {
    let route

    before(function () {
      route = new Layer("/:category", ["GET"], [function () {}])
    })

    it("should return an empty object if params were not pass", function () {
      const params = route.params("", [])

      params.should.deepEqual({})
    })

    it("should return empty object if params is empty string", function () {
      const params = route.params("", [""])

      params.should.deepEqual({})
    })

    it("should return an object with escaped params", function () {
      const params = route.params("", ["how%20to%20node"])

      params.should.deepEqual({ category: "how to node" })
    })

    it("should return an object with the same params if an error occurs", function () {
      const params = route.params("", ["%E0%A4%A"])

      params.should.deepEqual({ category: "%E0%A4%A" })
    })

    it("should return an object with data if params were pass", function () {
      const params = route.params("", ["programming"])

      params.should.deepEqual({ category: "programming" })
    })

    it("should return empty object if params were not pass", function () {
      route.paramNames = []
      const params = route.params("", ["programming"])

      params.should.deepEqual({})
    })
  })

  describe("Layer#url()", function () {
    it("generates route URL", function () {
      const route = new Layer("/:category/:title", ["get"], [function () {}], {
        name: "books",
      })
      let url = route.url({ category: "programming", title: "how-to-node" })
      url.should.equal("/programming/how-to-node")
      url = route.url("programming", "how-to-node")
      url.should.equal("/programming/how-to-node")
    })

    it("escapes using encodeURIComponent()", function () {
      const route = new Layer("/:category/:title", ["get"], [function () {}], {
        name: "books",
      })
      const url = route.url({
        category: "programming",
        title: "how to node & js/ts",
      })
      url.should.equal("/programming/how%20to%20node%20%26%20js%2Fts")
    })

    it("setPrefix method checks Layer for path", function () {
      const route = new Layer("/category", ["get"], [function () {}], {
        name: "books",
      })
      route.path = "/hunter2"
      const prefix = route.setPrefix("TEST")
      prefix.path.should.equal("TEST/hunter2")
    })
  })

  describe("Layer#prefix", () => {
    it("setPrefix method passes check Layer for path", function () {
      const route = new Layer("/category", ["get"], [function () {}], {
        name: "books",
      })
      route.path = "/hunter2"
      const prefix = route.setPrefix("/TEST")
      prefix.path.should.equal("/TEST/hunter2")
    })

    it("setPrefix method fails check Layer for path", function () {
      const route = new Layer(false, ["get"], [function () {}], {
        name: "books",
      })
      route.path = false
      const prefix = route.setPrefix("/TEST")
      prefix.path.should.equal(false)
    })
  })
})

describe("Router", function () {
  it("creates new router with koa app", function (done) {
    const router = new Router()
    router.should.be.instanceOf(Router)
    done()
  })

  it("should", function (done) {
    const router = new Router()
    console.info(router.params)

    done()
  })

  it("shares context between routers (gh-205)", function (done) {
    const app = new Koa()
    const router1 = new Router()
    const router2 = new Router()
    router1.get("/", function (ctx, next) {
      ctx.foo = "bar"
      return next()
    })
    router2.get("/", function (ctx, next) {
      ctx.baz = "qux"
      ctx.body = { foo: ctx.foo }
      return next()
    })
    app.use(router1.routes()).use(router2.routes())
    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("foo", "bar")
        done()
      })
  })

  it("does not register middleware more than once (gh-184)", function (done) {
    const app = new Koa()
    const parentRouter = new Router()
    const nestedRouter = new Router()

    nestedRouter
      .get("/first-nested-route", function (ctx) {
        ctx.body = { n: ctx.n }
      })
      .get("/second-nested-route", function (ctx, next) {
        return next()
      })
      .get("/third-nested-route", function (ctx, next) {
        return next()
      })

    parentRouter.use(
      "/parent-route",
      function (ctx, next) {
        ctx.n = ctx.n ? ctx.n + 1 : 1
        return next()
      },
      nestedRouter.routes()
    )

    app.use(parentRouter.routes())

    request(http.createServer(app.callback()))
      .get("/parent-route/first-nested-route")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("n", 1)
        done()
      })
  })

  it("router can be accecced with ctx", function (done) {
    const app = new Koa()
    const router = new Router()
    router.get("home", "/", function (ctx) {
      ctx.body = {
        url: ctx.router.url("home"),
      }
    })
    app.use(router.routes())
    request(http.createServer(app.callback()))
      .get("/")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body.url).to.eql("/")
        done()
      })
  })

  it("registers multiple middleware for one route", function (done) {
    const app = new Koa()
    const router = new Router()

    router.get(
      "/double",
      function (ctx, next) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            ctx.body = { message: "Hello" }
            resolve(next())
          }, 1)
        })
      },
      function (ctx, next) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            ctx.body.message += " World"
            resolve(next())
          }, 1)
        })
      },
      function (ctx) {
        ctx.body.message += "!"
      }
    )

    app.use(router.routes())

    request(http.createServer(app.callback()))
      .get("/double")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body.message).to.eql("Hello World!")
        done()
      })
  })

  it("does not break when nested-routes use regexp paths", function (done) {
    const app = new Koa()
    const parentRouter = new Router()
    const nestedRouter = new Router()

    nestedRouter
      .get(/^\/\w$/i, function (ctx, next) {
        return next()
      })
      .get("/first-nested-route", function (ctx, next) {
        return next()
      })
      .get("/second-nested-route", function (ctx, next) {
        return next()
      })

    parentRouter.use(
      "/parent-route",
      function (ctx, next) {
        return next()
      },
      nestedRouter.routes()
    )

    app.use(parentRouter.routes())
    app.should.be.ok()
    done()
  })

  it("exposes middleware factory", function (done) {
    const router = new Router()
    router.should.have.property("routes")
    router.routes.should.be.type("function")
    const middleware = router.routes()
    should.exist(middleware)
    middleware.should.be.type("function")
    done()
  })

  it("supports promises for async/await", function (done) {
    const app = new Koa()
    app.experimental = true
    const router = Router()
    router.get("/async", function (ctx) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          ctx.body = {
            msg: "promises!",
          }
          resolve()
        }, 1)
      })
    })

    app.use(router.routes()).use(router.allowedMethods())
    request(http.createServer(app.callback()))
      .get("/async")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("msg", "promises!")
        done()
      })
  })

  it("matches middleware only if route was matched (gh-182)", function (done) {
    const app = new Koa()
    const router = new Router()
    const otherRouter = new Router()

    router.use(function (ctx, next) {
      ctx.body = { bar: "baz" }
      return next()
    })

    otherRouter.get("/bar", function (ctx) {
      ctx.body = ctx.body || { foo: "bar" }
    })

    app.use(router.routes()).use(otherRouter.routes())

    request(http.createServer(app.callback()))
      .get("/bar")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("foo", "bar")
        expect(res.body).to.not.have.property("bar")
        done()
      })
  })

  it("matches first to last", function (done) {
    const app = new Koa()
    const router = new Router()

    router
      .get("user_page", "/user/(.*).jsx", function (ctx) {
        ctx.body = { order: 1 }
      })
      .all("app", "/app/(.*).jsx", function (ctx) {
        ctx.body = { order: 2 }
      })
      .all("view", "(.*).jsx", function (ctx) {
        ctx.body = { order: 3 }
      })

    request(http.createServer(app.use(router.routes()).callback()))
      .get("/user/account.jsx")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("order", 1)
        done()
      })
  })

  it("runs multiple controllers when there are multiple matches", function (done) {
    const app = new Koa()
    const router = new Router()

    router
      .get("users_single", "/users/:id(.*)", function (ctx, next) {
        ctx.body = { single: true }
        next()
      })
      .get("users_all", "/users/all", function (ctx, next) {
        ctx.body = { ...ctx.body, all: true }
        next()
      })

    request(http.createServer(app.use(router.routes()).callback()))
      .get("/users/all")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("single", true)
        expect(res.body).to.have.property("all", true)
        done()
      })
  })

  it("runs only the last match when the 'exclusive' option is enabled", function (done) {
    const app = new Koa()
    const router = new Router({ exclusive: true })

    router
      .get("users_single", "/users/:id(.*)", function (ctx, next) {
        ctx.body = { single: true }
        next()
      })
      .get("users_all", "/users/all", function (ctx, next) {
        ctx.body = { ...ctx.body, all: true }
        next()
      })

    request(http.createServer(app.use(router.routes()).callback()))
      .get("/users/all")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.not.have.property("single")
        expect(res.body).to.have.property("all", true)
        done()
      })
  })

  it("does not run subsequent middleware without calling next", function (done) {
    const app = new Koa()
    const router = new Router()

    router.get(
      "user_page",
      "/user/(.*).jsx",
      function () {
        // no next()
      },
      function (ctx) {
        ctx.body = { order: 1 }
      }
    )

    request(http.createServer(app.use(router.routes()).callback()))
      .get("/user/account.jsx")
      .expect(404)
      .end(done)
  })

  it("nests routers with prefixes at root", function (done) {
    const app = new Koa()
    const api = new Router()
    const forums = new Router({
      prefix: "/forums",
    })
    const posts = new Router({
      prefix: "/:fid/posts",
    })
    let server

    posts
      .get("/", function (ctx, next) {
        ctx.status = 204
        return next()
      })
      .get("/:pid", function (ctx, next) {
        ctx.body = ctx.params
        return next()
      })

    forums.use(posts.routes())

    server = http.createServer(app.use(forums.routes()).callback())

    request(server)
      .get("/forums/1/posts")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)

        request(server)
          .get("/forums/1")
          .expect(404)
          .end(function (err) {
            if (err) return done(err)

            request(server)
              .get("/forums/1/posts/2")
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err)

                expect(res.body).to.have.property("fid", "1")
                expect(res.body).to.have.property("pid", "2")
                done()
              })
          })
      })
  })

  it("nests routers with prefixes at path", function (done) {
    const app = new Koa()
    const forums = new Router({
      prefix: "/api",
    })
    const posts = new Router({
      prefix: "/posts",
    })
    let server

    posts
      .get("/", function (ctx, next) {
        ctx.status = 204
        return next()
      })
      .get("/:pid", function (ctx, next) {
        ctx.body = ctx.params
        return next()
      })

    forums.use("/forums/:fid", posts.routes())

    server = http.createServer(app.use(forums.routes()).callback())

    request(server)
      .get("/api/forums/1/posts")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)

        request(server)
          .get("/api/forums/1")
          .expect(404)
          .end(function (err) {
            if (err) return done(err)

            request(server)
              .get("/api/forums/1/posts/2")
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err)

                expect(res.body).to.have.property("fid", "1")
                expect(res.body).to.have.property("pid", "2")
                done()
              })
          })
      })
  })

  it("runs subrouter middleware after parent", function (done) {
    const app = new Koa()
    const subrouter = Router()
      .use(function (ctx, next) {
        ctx.msg = "subrouter"
        return next()
      })
      .get("/", function (ctx) {
        ctx.body = { msg: ctx.msg }
      })
    const router = Router()
      .use(function (ctx, next) {
        ctx.msg = "router"
        return next()
      })
      .use(subrouter.routes())
    request(http.createServer(app.use(router.routes()).callback()))
      .get("/")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("msg", "subrouter")
        done()
      })
  })

  it("runs parent middleware for subrouter routes", function (done) {
    const app = new Koa()
    const subrouter = Router().get("/sub", function (ctx) {
      ctx.body = { msg: ctx.msg }
    })
    const router = Router()
      .use(function (ctx, next) {
        ctx.msg = "router"
        return next()
      })
      .use("/parent", subrouter.routes())
    request(http.createServer(app.use(router.routes()).callback()))
      .get("/parent/sub")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.have.property("msg", "router")
        done()
      })
  })

  it("matches corresponding requests", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    router.get("/:category/:title", function (ctx) {
      ctx.should.have.property("params")
      ctx.params.should.have.property("category", "programming")
      ctx.params.should.have.property("title", "how-to-node")
      ctx.status = 204
    })
    router.post("/:category", function (ctx) {
      ctx.should.have.property("params")
      ctx.params.should.have.property("category", "programming")
      ctx.status = 204
    })
    router.put("/:category/not-a-title", function (ctx) {
      ctx.should.have.property("params")
      ctx.params.should.have.property("category", "programming")
      ctx.params.should.not.have.property("title")
      ctx.status = 204
    })
    const server = http.createServer(app.callback())
    request(server)
      .get("/programming/how-to-node")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)
        request(server)
          .post("/programming")
          .expect(204)
          .end(function (err) {
            if (err) return done(err)
            request(server)
              .put("/programming/not-a-title")
              .expect(204)
              .end(function (err, res) {
                done(err)
              })
          })
      })
  })

  it("matches corresponding requests with optional route parameter", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    router.get("/resources", function (ctx) {
      ctx.should.have.property("params")
      ctx.params.should.be.empty()
      ctx.status = 204
    })
    const id = "10"
    const ext = ".json"
    router.get("/resources/:id{.:ext}?", function (ctx) {
      ctx.should.have.property("params")
      ctx.params.should.have.property("id", id)
      if (ctx.params.ext) ctx.params.ext.should.be.equal(ext.slice(1))
      ctx.status = 204
    })
    const server = http.createServer(app.callback())
    request(server)
      .get("/resources")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)
        request(server)
          .get("/resources/" + id)
          .expect(204)
          .end(function (err) {
            if (err) return done(err)
            request(server)
              .get("/resources/" + id + ext)
              .expect(204)
              .end(function (err, res) {
                done(err)
              })
          })
      })
  })

  it("executes route middleware using `app.context`", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    router.use(function (ctx, next) {
      ctx.bar = "baz"
      return next()
    })
    router.get(
      "/:category/:title",
      function (ctx, next) {
        ctx.foo = "bar"
        return next()
      },
      function (ctx) {
        ctx.should.have.property("bar", "baz")
        ctx.should.have.property("foo", "bar")
        ctx.should.have.property("app")
        ctx.should.have.property("req")
        ctx.should.have.property("res")
        ctx.status = 204
        done()
      }
    )
    request(http.createServer(app.callback()))
      .get("/match/this")
      .expect(204)
      .end(function (err) {
        if (err) return done(err)
      })
  })

  it("does not match after ctx.throw()", function (done) {
    const app = new Koa()
    let counter = 0
    const router = new Router()
    app.use(router.routes())
    router.get("/", function (ctx) {
      counter++
      ctx.throw(403)
    })
    router.get("/", function () {
      counter++
    })
    const server = http.createServer(app.callback())
    request(server)
      .get("/")
      .expect(403)
      .end(function (err, res) {
        if (err) return done(err)
        counter.should.equal(1)
        done()
      })
  })

  it("supports promises for route middleware", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    const readVersion = function () {
      return new Promise(function (resolve, reject) {
        const packagePath = path.join(__dirname, "..", "..", "package.json")
        fs.readFile(packagePath, "utf8", function (err, data) {
          if (err) return reject(err)
          resolve(JSON.parse(data).version)
        })
      })
    }

    router.get(
      "/",
      function (ctx, next) {
        return next()
      },
      function (ctx) {
        return readVersion().then(function () {
          ctx.status = 204
        })
      }
    )
    request(http.createServer(app.callback())).get("/").expect(204).end(done)
  })

  describe("Router#allowedMethods()", function () {
    it("responds to OPTIONS requests", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(router.allowedMethods())
      router.get("/users", function () {})
      router.put("/users", function () {})
      request(http.createServer(app.callback()))
        .options("/users")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("content-length", "0")
          res.header.should.have.property("allow", "HEAD, GET, PUT")
          done()
        })
    })

    it("responds with 405 Method Not Allowed", function (done) {
      const app = new Koa()
      const router = new Router()
      router.get("/users", function () {})
      router.put("/users", function () {})
      router.post("/events", function () {})
      app.use(router.routes())
      app.use(router.allowedMethods())
      request(http.createServer(app.callback()))
        .post("/users")
        .expect(405)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("allow", "HEAD, GET, PUT")
          done()
        })
    })

    it('responds with 405 Method Not Allowed using the "throw" option', function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(function (ctx, next) {
        return next().catch(function (err) {
          // assert that the correct HTTPError was thrown
          err.name.should.equal("MethodNotAllowedError")
          err.statusCode.should.equal(405)

          // translate the HTTPError to a normal response
          ctx.body = err.name
          ctx.status = err.statusCode
        })
      })
      app.use(router.allowedMethods({ throw: true }))
      router.get("/users", function () {})
      router.put("/users", function () {})
      router.post("/events", function () {})
      request(http.createServer(app.callback()))
        .post("/users")
        .expect(405)
        .end(function (err, res) {
          if (err) return done(err)
          // the 'Allow' header is not set when throwing
          res.header.should.not.have.property("allow")
          done()
        })
    })

    it('responds with user-provided throwable using the "throw" and "methodNotAllowed" options', function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(function (ctx, next) {
        return next().catch(function (err) {
          // assert that the correct HTTPError was thrown
          err.message.should.equal("Custom Not Allowed Error")
          err.statusCode.should.equal(405)

          // translate the HTTPError to a normal response
          ctx.body = err.body
          ctx.status = err.statusCode
        })
      })
      app.use(
        router.allowedMethods({
          throw: true,
          methodNotAllowed() {
            const notAllowedErr = new Error("Custom Not Allowed Error")
            notAllowedErr.type = "custom"
            notAllowedErr.statusCode = 405
            notAllowedErr.body = {
              error: "Custom Not Allowed Error",
              statusCode: 405,
              otherStuff: true,
            }
            return notAllowedErr
          },
        })
      )
      router.get("/users", function () {})
      router.put("/users", function () {})
      router.post("/events", function () {})
      request(http.createServer(app.callback()))
        .post("/users")
        .expect(405)
        .end(function (err, res) {
          if (err) return done(err)
          // the 'Allow' header is not set when throwing
          res.header.should.not.have.property("allow")
          res.body.should.eql({
            error: "Custom Not Allowed Error",
            statusCode: 405,
            otherStuff: true,
          })
          done()
        })
    })

    it("responds with 501 Not Implemented", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(router.allowedMethods())
      router.get("/users", function () {})
      router.put("/users", function () {})
      request(http.createServer(app.callback()))
        .search("/users")
        .expect(501)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it('responds with 501 Not Implemented using the "throw" option', function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(function (ctx, next) {
        return next().catch(function (err) {
          // assert that the correct HTTPError was thrown
          err.name.should.equal("NotImplementedError")
          err.statusCode.should.equal(501)

          // translate the HTTPError to a normal response
          ctx.body = err.name
          ctx.status = err.statusCode
        })
      })
      app.use(router.allowedMethods({ throw: true }))
      router.get("/users", function () {})
      router.put("/users", function () {})
      request(http.createServer(app.callback()))
        .search("/users")
        .expect(501)
        .end(function (err, res) {
          if (err) return done(err)
          // the 'Allow' header is not set when throwing
          res.header.should.not.have.property("allow")
          done()
        })
    })

    it('responds with user-provided throwable using the "throw" and "notImplemented" options', function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(function (ctx, next) {
        return next().catch(function (err) {
          // assert that our custom error was thrown
          err.message.should.equal("Custom Not Implemented Error")
          err.type.should.equal("custom")
          err.statusCode.should.equal(501)

          // translate the HTTPError to a normal response
          ctx.body = err.body
          ctx.status = err.statusCode
        })
      })
      app.use(
        router.allowedMethods({
          throw: true,
          notImplemented() {
            const notImplementedErr = new Error("Custom Not Implemented Error")
            notImplementedErr.type = "custom"
            notImplementedErr.statusCode = 501
            notImplementedErr.body = {
              error: "Custom Not Implemented Error",
              statusCode: 501,
              otherStuff: true,
            }
            return notImplementedErr
          },
        })
      )
      router.get("/users", function () {})
      router.put("/users", function () {})
      request(http.createServer(app.callback()))
        .search("/users")
        .expect(501)
        .end(function (err, res) {
          if (err) return done(err)
          // the 'Allow' header is not set when throwing
          res.header.should.not.have.property("allow")
          res.body.should.eql({
            error: "Custom Not Implemented Error",
            statusCode: 501,
            otherStuff: true,
          })
          done()
        })
    })

    it("does not send 405 if route matched but status is 404", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(router.allowedMethods())
      router.get("/users", function (ctx) {
        ctx.status = 404
      })
      request(http.createServer(app.callback()))
        .get("/users")
        .expect(404)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("sets the allowed methods to a single Allow header #273", function (done) {
      // https://tools.ietf.org/html/rfc7231#section-7.4.1
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      app.use(router.allowedMethods())

      router.get("/", function () {})

      request(http.createServer(app.callback()))
        .options("/")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("allow", "HEAD, GET")
          const allowHeaders = res.res.rawHeaders.filter(
            item => item === "Allow"
          )
          expect(allowHeaders.length).to.eql(1)
          done()
        })
    })
  })

  it("allowedMethods check if flow (allowedArr.length)", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    app.use(router.allowedMethods())

    router.get("")

    request(http.createServer(app.callback()))
      .get("/users")
      .end(() => done())
  })

  it("supports custom routing detect path: ctx.routerPath", function (done) {
    const app = new Koa()
    const router = new Router()
    app.use(function (ctx, next) {
      // bind helloworld.example.com/users => example.com/helloworld/users
      const appname = ctx.request.hostname.split(".", 1)[0]
      ctx.routerPath = "/" + appname + ctx.path
      return next()
    })
    app.use(router.routes())
    router.get("/helloworld/users", function (ctx) {
      ctx.body = ctx.method + " " + ctx.url
    })

    request(http.createServer(app.callback()))
      .get("/users")
      .set("Host", "helloworld.example.com")
      .expect(200)
      .expect("GET /users", done)
  })

  it("parameter added to request in ctx", function (done) {
    const app = new Koa()
    const router = new Router()
    router.get("/echo/:saying", function (ctx) {
      try {
        expect(ctx.params.saying).eql("helloWorld")
        expect(ctx.request.params.saying).eql("helloWorld")
        ctx.body = { echo: ctx.params.saying }
      } catch (err) {
        ctx.status = 500
        ctx.body = err.message
      }
    })
    app.use(router.routes())
    request(http.createServer(app.callback()))
      .get("/echo/helloWorld")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.eql({ echo: "helloWorld" })
        done()
      })
  })

  it("parameter added to request in ctx with sub router", function (done) {
    const app = new Koa()
    const router = new Router()
    const subrouter = new Router()

    router.use(function (ctx, next) {
      ctx.foo = "boo"
      return next()
    })

    subrouter.get("/:saying", function (ctx) {
      try {
        expect(ctx.params.saying).eql("helloWorld")
        expect(ctx.request.params.saying).eql("helloWorld")
        ctx.body = { echo: ctx.params.saying }
      } catch (err) {
        ctx.status = 500
        ctx.body = err.message
      }
    })

    router.use("/echo", subrouter.routes())
    app.use(router.routes())
    request(http.createServer(app.callback()))
      .get("/echo/helloWorld")
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        expect(res.body).to.eql({ echo: "helloWorld" })
        done()
      })
  })

  describe("Router#[verb]()", function () {
    it("registers route specific to HTTP verb", function () {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      for (const method of methods) {
        router.should.have.property(method)
        router[method].should.be.type("function")
        router[method]("/", function () {})
      }

      router.stack.should.have.length(methods.length)
    })

    it("registers route with a regexp path", function () {
      const router = new Router()
      for (const method of methods) {
        router[method](/^\/\w$/i, function () {}).should.equal(router)
      }
    })

    it("registers route with a given name", function () {
      const router = new Router()
      for (const method of methods) {
        router[method](method, "/", function () {}).should.equal(router)
      }
    })

    it("registers route with with a given name and regexp path", function () {
      const router = new Router()
      for (const method of methods) {
        router[method](method, /^\/$/i, function () {}).should.equal(router)
      }
    })

    it("enables route chaining", function () {
      const router = new Router()
      for (const method of methods) {
        router[method]("/", function () {}).should.equal(router)
      }
    })

    it("registers array of paths (gh-203)", function () {
      const router = new Router()
      router.get(["/one", "/two"], function (ctx, next) {
        return next()
      })
      expect(router.stack).to.have.property("length", 2)
      expect(router.stack[0]).to.have.property("path", "/one")
      expect(router.stack[1]).to.have.property("path", "/two")
    })

    it("resolves non-parameterized routes without attached parameters", function (done) {
      const app = new Koa()
      const router = new Router()

      router.get("/notparameter", function (ctx) {
        ctx.body = {
          param: ctx.params.parameter,
        }
      })

      router.get("/:parameter", function (ctx) {
        ctx.body = {
          param: ctx.params.parameter,
        }
      })

      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/notparameter")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          expect(res.body.param).to.equal(undefined)
          done()
        })
    })

    it("correctly returns an error when not passed a path for verb-specific registration (gh-147)", function () {
      const router = new Router()
      for (const el of methods) {
        try {
          router[el](function () {})
        } catch (err) {
          expect(err.message).to.be(
            `You have to provide a path when adding a ${el} handler`
          )
        }
      }
    })

    it('correctly returns an error when not passed a path for "all" registration (gh-147)', function () {
      const router = new Router()
      try {
        router.all(function () {})
      } catch (err) {
        expect(err.message).to.be(
          "You have to provide a path when adding an all handler"
        )
      }
    })
  })

  describe("Router#use()", function () {
    it("uses router middleware without path", function (done) {
      const app = new Koa()
      const router = new Router()

      router.use(function (ctx, next) {
        ctx.foo = "baz"
        return next()
      })

      router.use(function (ctx, next) {
        ctx.foo = "foo"
        return next()
      })

      router.get("/foo/bar", function (ctx) {
        ctx.body = {
          foobar: ctx.foo + "bar",
        }
      })

      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/foo/bar")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          expect(res.body).to.have.property("foobar", "foobar")
          done()
        })
    })

    it("uses router middleware at given path", function (done) {
      const app = new Koa()
      const router = new Router()

      router.use("/foo/bar", function (ctx, next) {
        ctx.foo = "foo"
        return next()
      })

      router.get("/foo/bar", function (ctx) {
        ctx.body = {
          foobar: ctx.foo + "bar",
        }
      })

      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/foo/bar")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          expect(res.body).to.have.property("foobar", "foobar")
          done()
        })
    })

    it("runs router middleware before subrouter middleware", function (done) {
      const app = new Koa()
      const router = new Router()
      const subrouter = new Router()

      router.use(function (ctx, next) {
        ctx.foo = "boo"
        return next()
      })

      subrouter
        .use(function (ctx, next) {
          ctx.foo = "foo"
          return next()
        })
        .get("/bar", function (ctx) {
          ctx.body = {
            foobar: ctx.foo + "bar",
          }
        })

      router.use("/foo", subrouter.routes())
      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/foo/bar")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          expect(res.body).to.have.property("foobar", "foobar")
          done()
        })
    })

    it("assigns middleware to array of paths", function (done) {
      const app = new Koa()
      const router = new Router()

      router.use(["/foo", "/bar"], function (ctx, next) {
        ctx.foo = "foo"
        ctx.bar = "bar"
        return next()
      })

      router.get("/foo", function (ctx) {
        ctx.body = {
          foobar: ctx.foo + "bar",
        }
      })

      router.get("/bar", function (ctx) {
        ctx.body = {
          foobar: "foo" + ctx.bar,
        }
      })

      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/foo")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body).to.have.property("foobar", "foobar")
          request(http.createServer(app.callback()))
            .get("/bar")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              expect(res.body).to.have.property("foobar", "foobar")
              done()
            })
        })
    })

    it("without path, does not set params.0 to the matched path - gh-247", function (done) {
      const app = new Koa()
      const router = new Router()

      router.use(function (ctx, next) {
        return next()
      })

      router.get("/foo/:id", function (ctx) {
        ctx.body = ctx.params
      })

      app.use(router.routes())
      request(http.createServer(app.callback()))
        .get("/foo/815")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          expect(res.body).to.have.property("id", "815")
          expect(res.body).to.not.have.property("0")
          done()
        })
    })

    it("does not add an erroneous (.*) to unprefiexed nested routers - gh-369 gh-410", function (done) {
      const app = new Koa()
      const router = new Router()
      const nested = new Router()
      let called = 0

      nested
        .get("/", (ctx, next) => {
          ctx.body = "root"
          called += 1
          return next()
        })
        .get("/test", (ctx, next) => {
          ctx.body = "test"
          called += 1
          return next()
        })

      router.use(nested.routes())
      app.use(router.routes())

      request(app.callback())
        .get("/test")
        .expect(200)
        .expect("test")
        .end(function (err) {
          if (err) return done(err)
          expect(called).to.eql(1, "too many routes matched")
          done()
        })
    })

    it("assigns middleware to array of paths with function middleware and router need to nest. - gh-22", function (done) {
      const app = new Koa()
      const base = new Router({ prefix: "/api" })
      const nested = new Router({ prefix: "/qux" })
      const pathList = ["/foo", "/bar"]

      nested.get("/baz", ctx => {
        ctx.body = {
          foo: ctx.foo,
          bar: ctx.bar,
          baz: "baz",
        }
      })

      base.use(
        pathList,
        (ctx, next) => {
          ctx.foo = "foo"
          ctx.bar = "bar"

          return next()
        },
        nested.routes()
      )

      app.use(base.routes())

      Promise.all(
        pathList.map(pathname => {
          return request(http.createServer(app.callback()))
            .get(`/api${pathname}/qux/baz`)
            .expect(200)
        })
      ).then(
        resList => {
          for (const res of resList) {
            assert.deepEqual(res.body, { foo: "foo", bar: "bar", baz: "baz" })
          }

          done()
        },
        err => done(err)
      )
    })

    it("uses a same router middleware at given paths continuously - ZijianHe/koa-router#gh-244 gh-18", function (done) {
      const app = new Koa()
      const base = new Router({ prefix: "/api" })
      const nested = new Router({ prefix: "/qux" })

      nested.get("/baz", ctx => {
        ctx.body = {
          foo: ctx.foo,
          bar: ctx.bar,
          baz: "baz",
        }
      })

      base
        .use(
          "/foo",
          (ctx, next) => {
            ctx.foo = "foo"
            ctx.bar = "bar"

            return next()
          },
          nested.routes()
        )
        .use(
          "/bar",
          (ctx, next) => {
            ctx.foo = "foo"
            ctx.bar = "bar"

            return next()
          },
          nested.routes()
        )

      app.use(base.routes())

      Promise.all(
        ["/foo", "/bar"].map(pathname => {
          return request(http.createServer(app.callback()))
            .get(`/api${pathname}/qux/baz`)
            .expect(200)
        })
      ).then(
        resList => {
          for (const res of resList) {
            assert.deepEqual(res.body, { foo: "foo", bar: "bar", baz: "baz" })
          }

          done()
        },
        err => done(err)
      )
    })
  })

  describe("Router#register()", function () {
    it("registers new routes", function (done) {
      const app = new Koa()
      const router = new Router()
      router.should.have.property("register")
      router.register.should.be.type("function")
      router.register("/", ["GET", "POST"], function () {})
      app.use(router.routes())
      router.stack.should.be.an.instanceOf(Array)
      router.stack.should.have.property("length", 1)
      router.stack[0].should.have.property("path", "/")
      done()
    })
  })

  describe("Router#redirect()", function () {
    it("registers redirect routes", function (done) {
      const app = new Koa()
      const router = new Router()
      router.should.have.property("redirect")
      router.redirect.should.be.type("function")
      router.redirect("/source", "/destination", 302)
      app.use(router.routes())
      router.stack.should.have.property("length", 1)
      router.stack[0].should.be.instanceOf(Layer)
      router.stack[0].should.have.property("path", "/source")
      done()
    })

    it("redirects using route names", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get("home", "/", function () {})
      router.get("sign-up-form", "/sign-up-form", function () {})
      router.redirect("home", "sign-up-form")
      request(http.createServer(app.callback()))
        .post("/")
        .expect(301)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("location", "/sign-up-form")
          done()
        })
    })

    it("redirects using symbols as route names", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      const homeSymbol = Symbol("home")
      const signUpFormSymbol = Symbol("sign-up-form")
      router.get(homeSymbol, "/", function () {})
      router.get(signUpFormSymbol, "/sign-up-form", function () {})
      router.redirect(homeSymbol, signUpFormSymbol)
      request(http.createServer(app.callback()))
        .post("/")
        .expect(301)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("location", "/sign-up-form")
          done()
        })
    })

    it("throws an error if no route is found for name", function () {
      const router = new Router()
      expect(() => router.redirect("missing", "/destination")).to.throwError()
      expect(() => router.redirect("/source", "missing")).to.throwError()
      expect(() =>
        router.redirect(Symbol("missing"), "/destination")
      ).to.throwError()
      expect(() =>
        router.redirect("/source", Symbol("missing"))
      ).to.throwError()
    })

    it("redirects to external sites", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.redirect("/", "https://www.example.com")
      request(http.createServer(app.callback()))
        .post("/")
        .expect(301)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property("location", "https://www.example.com")
          done()
        })
    })

    it("redirects to any external protocol", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.redirect("/", "my-custom-app-protocol://www.example.com/foo")
      request(http.createServer(app.callback()))
        .post("/")
        .expect(301)
        .end(function (err, res) {
          if (err) return done(err)
          res.header.should.have.property(
            "location",
            "my-custom-app-protocol://www.example.com/foo"
          )
          done()
        })
    })
  })

  describe("Router#route()", function () {
    it("inherits routes from nested router", function () {
      const subrouter = Router().get("child", "/hello", function (ctx) {
        ctx.body = { hello: "world" }
      })
      const router = Router().use(subrouter.routes())
      expect(router.route("child")).to.have.property("name", "child")
    })

    it("supports symbols as names", function () {
      const childSymbol = Symbol("child")
      const subrouter = Router().get(childSymbol, "/hello", function (ctx) {
        ctx.body = { hello: "world" }
      })
      const router = Router().use(subrouter.routes())
      expect(router.route(childSymbol)).to.have.property("name", childSymbol)
    })

    it("returns false if no name matches", function () {
      const router = new Router()
      router.get("books", "/books", function (ctx) {
        ctx.status = 204
      })
      router.get(Symbol("Picard"), "/enterprise", function (ctx) {
        ctx.status = 204
      })
      router.route("Picard").should.be.false()
      router.route(Symbol("books")).should.be.false()
    })
  })

  describe("Router#url()", function () {
    it("generates URL for given route name", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get("books", "/:category/:title", function (ctx) {
        ctx.status = 204
      })
      let url = router.url(
        "books",
        { category: "programming", title: "how to node" },
        { encode: encodeURIComponent }
      )
      url.should.equal("/programming/how%20to%20node")
      url = router.url("books", "programming", "how to node", {
        encode: encodeURIComponent,
      })
      url.should.equal("/programming/how%20to%20node")
      done()
    })

    it("generates URL for given route name within embedded routers", function (done) {
      const app = new Koa()
      const router = new Router({
        prefix: "/books",
      })

      const embeddedRouter = new Router({
        prefix: "/chapters",
      })
      embeddedRouter.get(
        "chapters",
        "/:chapterName/:pageNumber",
        function (ctx) {
          ctx.status = 204
        }
      )
      router.use(embeddedRouter.routes())
      app.use(router.routes())
      let url = router.url(
        "chapters",
        { chapterName: "Learning ECMA6", pageNumber: 123 },
        { encode: encodeURIComponent }
      )
      url.should.equal("/books/chapters/Learning%20ECMA6/123")
      url = router.url("chapters", "Learning ECMA6", 123, {
        encode: encodeURIComponent,
      })
      url.should.equal("/books/chapters/Learning%20ECMA6/123")
      done()
    })

    it("generates URL for given route name within two embedded routers", function (done) {
      const app = new Koa()
      const router = new Router({
        prefix: "/books",
      })
      const embeddedRouter = new Router({
        prefix: "/chapters",
      })
      const embeddedRouter2 = new Router({
        prefix: "/:chapterName/pages",
      })
      embeddedRouter2.get("chapters", "/:pageNumber", function (ctx) {
        ctx.status = 204
      })
      embeddedRouter.use(embeddedRouter2.routes())
      router.use(embeddedRouter.routes())
      app.use(router.routes())
      const url = router.url(
        "chapters",
        { chapterName: "Learning ECMA6", pageNumber: 123 },
        { encode: encodeURIComponent }
      )
      url.should.equal("/books/chapters/Learning%20ECMA6/pages/123")
      done()
    })

    it("generates URL for given route name with params and query params", function (done) {
      const router = new Router()
      const query = { page: 3, limit: 10 }

      router.get("books", "/books/:category/:id", function (ctx) {
        ctx.status = 204
      })
      let url = router.url("books", "programming", 4, { query })
      url.should.equal("/books/programming/4?page=3&limit=10")
      url = router.url("books", { category: "programming", id: 4 }, { query })
      url.should.equal("/books/programming/4?page=3&limit=10")
      url = router.url(
        "books",
        { category: "programming", id: 4 },
        { query: "page=3&limit=10" }
      )
      url.should.equal("/books/programming/4?page=3&limit=10")
      done()
    })

    it("generates URL for given route name without params and query params", function (done) {
      const router = new Router()
      router.get("books", "/books", function (ctx) {
        ctx.status = 204
      })
      var url = router.url("books")
      url.should.equal("/books")
      var url = router.url("books")
      url.should.equal("/books", {})
      var url = router.url("books")
      url.should.equal("/books", {}, {})
      var url = router.url("books", {}, { query: { page: 3, limit: 10 } })
      url.should.equal("/books?page=3&limit=10")
      var url = router.url("books", {}, { query: "page=3&limit=10" })
      url.should.equal("/books?page=3&limit=10")
      done()
    })

    it("generates URL for given route name without params and query params", function (done) {
      const router = new Router()
      router.get("category", "/category", function (ctx) {
        ctx.status = 204
      })
      const url = router.url("category", {
        query: { page: 3, limit: 10 },
      })
      url.should.equal("/category?page=3&limit=10")
      done()
    })

    it("returns an Error if no route is found for name", function () {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get("books", "/books", function (ctx) {
        ctx.status = 204
      })
      router.get(Symbol("Picard"), "/enterprise", function (ctx) {
        ctx.status = 204
      })

      router.url("Picard").should.be.Error()
      router.url(Symbol("books")).should.be.Error()
    })

    it("escapes using encodeURIComponent()", function () {
      const url = Router.url("/:category/:title", {
        category: "programming",
        title: "how to node & js/ts",
      })
      url.should.equal("/programming/how%20to%20node%20%26%20js%2Fts")
    })
  })

  describe("Router#param()", function () {
    it("runs parameter middleware", function (done) {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router
        .param("user", function (id, ctx, next) {
          ctx.user = { name: "alex" }
          if (!id) return (ctx.status = 404)
          return next()
        })
        .get("/users/:user", function (ctx) {
          ctx.body = ctx.user
        })
      request(http.createServer(app.callback()))
        .get("/users/3")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.have.property("name", "alex")
          done()
        })
    })

    it("runs parameter middleware in order of URL appearance", function (done) {
      const app = new Koa()
      const router = new Router()
      router
        .param("user", function (id, ctx, next) {
          ctx.user = { name: "alex" }
          if (ctx.ranFirst) {
            ctx.user.ordered = "parameters"
          }

          if (!id) return (ctx.status = 404)
          return next()
        })
        .param("first", function (id, ctx, next) {
          ctx.ranFirst = true
          if (ctx.user) {
            ctx.ranFirst = false
          }

          if (!id) return (ctx.status = 404)
          return next()
        })
        .get("/:first/users/:user", function (ctx) {
          ctx.body = ctx.user
        })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/first/users/3")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.have.property("name", "alex")
          res.body.should.have.property("ordered", "parameters")
          done()
        })
    })

    it("runs parameter middleware in order of URL appearance even when added in random order", function (done) {
      const app = new Koa()
      const router = new Router()
      router
        // intentional random order
        .param("a", function (id, ctx, next) {
          ctx.state.loaded = [id]
          return next()
        })
        .param("d", function (id, ctx, next) {
          ctx.state.loaded.push(id)
          return next()
        })
        .param("c", function (id, ctx, next) {
          ctx.state.loaded.push(id)
          return next()
        })
        .param("b", function (id, ctx, next) {
          ctx.state.loaded.push(id)
          return next()
        })
        .get("/:a/:b/:c/:d", function (ctx, next) {
          ctx.body = ctx.state.loaded
        })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/1/2/3/4")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.eql(["1", "2", "3", "4"])
          done()
        })
    })

    it("runs parent parameter middleware for subrouter", function (done) {
      const app = new Koa()
      const router = new Router()
      const subrouter = new Router()
      subrouter.get("/:cid", function (ctx) {
        ctx.body = {
          id: ctx.params.id,
          cid: ctx.params.cid,
        }
      })
      router
        .param("id", function (id, ctx, next) {
          ctx.params.id = "ran"
          if (!id) return (ctx.status = 404)
          return next()
        })
        .use("/:id/children", subrouter.routes())

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/did-not-run/children/2")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.property("body")
          res.body.should.have.property("id", "ran")
          res.body.should.have.property("cid", "2")
          done()
        })
    })
  })

  describe("Router#opts", function () {
    it("responds with 200", function (done) {
      const app = new Koa()
      const router = new Router({
        strict: true,
      })
      router.get("/info", function (ctx) {
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .get("/info")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.text.should.equal("hello")
          done()
        })
    })

    it("should allow setting a prefix", function (done) {
      const app = new Koa()
      const routes = Router({ prefix: "/things/:thing_id" })

      routes.get("/list", function (ctx) {
        ctx.body = ctx.params
      })

      app.use(routes.routes())

      request(http.createServer(app.callback()))
        .get("/things/1/list")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.body.thing_id.should.equal("1")
          done()
        })
    })

    it("responds with 404 when has a trailing slash", function (done) {
      const app = new Koa()
      const router = new Router({
        strict: true,
      })
      router.get("/info", function (ctx) {
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .get("/info/")
        .expect(404)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })
  })

  describe("use middleware with opts", function () {
    it("responds with 200", function (done) {
      const app = new Koa()
      const router = new Router({
        strict: true,
      })
      router.get("/info", function (ctx) {
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .get("/info")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          res.text.should.equal("hello")
          done()
        })
    })

    it("responds with 404 when has a trailing slash", function (done) {
      const app = new Koa()
      const router = new Router({
        strict: true,
      })
      router.get("/info", function (ctx) {
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .get("/info/")
        .expect(404)
        .end(function (err, res) {
          if (err) return done(err)
          done()
        })
    })
  })

  describe("router.routes()", function () {
    it("should return composed middleware", function (done) {
      const app = new Koa()
      const router = new Router()
      let middlewareCount = 0
      const middlewareA = function (ctx, next) {
        middlewareCount++
        return next()
      }

      const middlewareB = function (ctx, next) {
        middlewareCount++
        return next()
      }

      router.use(middlewareA, middlewareB)
      router.get("/users/:id", function (ctx) {
        should.exist(ctx.params.id)
        ctx.body = { hello: "world" }
      })

      const routerMiddleware = router.routes()

      expect(routerMiddleware).to.be.a("function")

      request(http.createServer(app.use(routerMiddleware).callback()))
        .get("/users/1")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body).to.be.an("object")
          expect(res.body).to.have.property("hello", "world")
          expect(middlewareCount).to.equal(2)
          done()
        })
    })

    it("places a `_matchedRoute` value on context", function (done) {
      const app = new Koa()
      const router = new Router()
      const middleware = function (ctx, next) {
        next()
        expect(ctx._matchedRoute).to.be("/users/:id")
      }

      router.use(middleware)
      router.get("/users/:id", function (ctx) {
        expect(ctx._matchedRoute).to.be("/users/:id")
        should.exist(ctx.params.id)
        ctx.body = { hello: "world" }
      })

      const routerMiddleware = router.routes()

      request(http.createServer(app.use(routerMiddleware).callback()))
        .get("/users/1")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("places a `_matchedRouteName` value on the context for a named route", function (done) {
      const app = new Koa()
      const router = new Router()

      router.get("users#show", "/users/:id", function (ctx) {
        expect(ctx._matchedRouteName).to.be("users#show")
        ctx.status = 200
      })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/users/1")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("does not place a `_matchedRouteName` value on the context for unnamed routes", function (done) {
      const app = new Koa()
      const router = new Router()

      router.get("/users/:id", function (ctx) {
        expect(ctx._matchedRouteName).to.be(undefined)
        ctx.status = 200
      })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/users/1")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("places a `routerPath` value on the context for current route", function (done) {
      const app = new Koa()
      const router = new Router()

      router.get("/users/:id", function (ctx) {
        expect(ctx.routerPath).to.be("/users/:id")
        ctx.status = 200
      })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/users/1")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("places a `_matchedRoute` value on the context for current route", function (done) {
      const app = new Koa()
      const router = new Router()

      router.get("/users/list", function (ctx) {
        expect(ctx._matchedRoute).to.be("/users/list")
        ctx.status = 200
      })
      router.get("/users/:id", function (ctx) {
        expect(ctx._matchedRoute).to.be("/users/:id")
        ctx.status = 200
      })

      request(http.createServer(app.use(router.routes()).callback()))
        .get("/users/list")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })
  })

  describe("If no HEAD method, default to GET", function () {
    it("should default to GET", function (done) {
      const app = new Koa()
      const router = new Router()
      router.get("/users/:id", function (ctx) {
        should.exist(ctx.params.id)
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .head("/users/1")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body).to.be.empty()
          done()
        })
    })

    it("should work with middleware", function (done) {
      const app = new Koa()
      const router = new Router()
      router.get("/users/:id", function (ctx) {
        should.exist(ctx.params.id)
        ctx.body = "hello"
      })
      request(http.createServer(app.use(router.routes()).callback()))
        .head("/users/1")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body).to.be.empty()
          done()
        })
    })
  })

  describe("Router#prefix", function () {
    it("should set opts.prefix", function () {
      const router = Router()
      expect(router.opts).to.not.have.key("prefix")
      router.prefix("/things/:thing_id")
      expect(router.opts.prefix).to.equal("/things/:thing_id")
    })

    it("should prefix existing routes", function () {
      const router = Router()
      router.get("/users/:id", function (ctx) {
        ctx.body = "test"
      })
      router.prefix("/things/:thing_id")
      const route = router.stack[0]
      expect(route.path).to.equal("/things/:thing_id/users/:id")
      expect(route.paramNames).to.have.length(2)
      expect(route.paramNames[0]).to.have.property("name", "thing_id")
      expect(route.paramNames[1]).to.have.property("name", "id")
    })

    it("populates ctx.params correctly for router prefix (including use)", function (done) {
      const app = new Koa()
      const router = new Router({ prefix: "/:category" })
      app.use(router.routes())
      router
        .use((ctx, next) => {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("category", "cats")
          return next()
        })
        .get("/suffixHere", function (ctx) {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("category", "cats")
          ctx.status = 204
        })
      request(http.createServer(app.callback()))
        .get("/cats/suffixHere")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("populates ctx.params correctly for more complex router prefix (including use)", function (done) {
      const app = new Koa()
      const router = new Router({ prefix: "/:category/:color" })
      app.use(router.routes())
      router
        .use((ctx, next) => {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("category", "cats")
          ctx.params.should.have.property("color", "gray")
          return next()
        })
        .get("/:active/suffixHere", function (ctx) {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("category", "cats")
          ctx.params.should.have.property("color", "gray")
          ctx.params.should.have.property("active", "true")
          ctx.status = 204
        })
      request(http.createServer(app.callback()))
        .get("/cats/gray/true/suffixHere")
        .expect(204)
        .end(function (err, res) {
          if (err) return done(err)
          done()
        })
    })

    it("populates ctx.params correctly for dynamic and static prefix (including async use)", function (done) {
      const app = new Koa()
      const router = new Router({ prefix: "/:ping/pong" })
      app.use(router.routes())
      router
        .use(async (ctx, next) => {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("ping", "pingKey")
          await next()
        })
        .get("/", function (ctx) {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("ping", "pingKey")
          ctx.body = ctx.params
        })
      request(http.createServer(app.callback()))
        .get("/pingKey/pong")
        .expect(200, /{"ping":"pingKey"}/)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    it("populates ctx.params correctly for static prefix", function (done) {
      const app = new Koa()
      const router = new Router({ prefix: "/all" })
      app.use(router.routes())
      router
        .use((ctx, next) => {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.be.empty()
          return next()
        })
        .get("/:active/suffixHere", function (ctx) {
          ctx.should.have.property("params")
          ctx.params.should.be.type("object")
          ctx.params.should.have.property("active", "true")
          ctx.status = 204
        })
      request(http.createServer(app.callback()))
        .get("/all/true/suffixHere")
        .expect(204)
        .end(function (err) {
          if (err) return done(err)
          done()
        })
    })

    describe("when used with .use(fn) - gh-247", function () {
      it("does not set params.0 to the matched path", function (done) {
        const app = new Koa()
        const router = new Router()

        router.use(function (ctx, next) {
          return next()
        })

        router.get("/foo/:id", function (ctx) {
          ctx.body = ctx.params
        })

        router.prefix("/things")

        app.use(router.routes())
        request(http.createServer(app.callback()))
          .get("/things/foo/108")
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err)

            expect(res.body).to.have.property("id", "108")
            expect(res.body).to.not.have.property("0")
            done()
          })
      })
    })

    describe("with trailing slash", testPrefix("/admin/"))
    describe("without trailing slash", testPrefix("/admin"))

    function testPrefix(prefix) {
      return function () {
        let server
        let middlewareCount = 0

        before(function () {
          const app = new Koa()
          const router = Router()

          router.use(function (ctx, next) {
            middlewareCount++
            ctx.thing = "worked"
            return next()
          })

          router.get("/", function (ctx) {
            middlewareCount++
            ctx.body = { name: ctx.thing }
          })

          router.prefix(prefix)
          server = http.createServer(app.use(router.routes()).callback())
        })

        after(function () {
          server.close()
        })

        beforeEach(function () {
          middlewareCount = 0
        })

        it("should support root level router middleware", function (done) {
          request(server)
            .get(prefix)
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              expect(middlewareCount).to.equal(2)
              expect(res.body).to.be.an("object")
              expect(res.body).to.have.property("name", "worked")
              done()
            })
        })

        it("should support requests with a trailing path slash", function (done) {
          request(server)
            .get("/admin/")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              expect(middlewareCount).to.equal(2)
              expect(res.body).to.be.an("object")
              expect(res.body).to.have.property("name", "worked")
              done()
            })
        })

        it("should support requests without a trailing path slash", function (done) {
          request(server)
            .get("/admin")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)
              expect(middlewareCount).to.equal(2)
              expect(res.body).to.be.an("object")
              expect(res.body).to.have.property("name", "worked")
              done()
            })
        })
      }
    }

    it(`prefix and '/' route behavior`, function (done) {
      const app = new Koa()
      const router = new Router({
        strict: false,
        prefix: "/foo",
      })

      const strictRouter = new Router({
        strict: true,
        prefix: "/bar",
      })

      router.get("/", function (ctx) {
        ctx.body = ""
      })

      strictRouter.get("/", function (ctx) {
        ctx.body = ""
      })

      app.use(router.routes())
      app.use(strictRouter.routes())

      const server = http.createServer(app.callback())

      request(server)
        .get("/foo")
        .expect(200)
        .end(function (err) {
          if (err) return done(err)

          request(server)
            .get("/foo/")
            .expect(200)
            .end(function (err) {
              if (err) return done(err)

              request(server)
                .get("/bar")
                .expect(404)
                .end(function (err) {
                  if (err) return done(err)

                  request(server)
                    .get("/bar/")
                    .expect(200)
                    .end(function (err) {
                      if (err) return done(err)
                      done()
                    })
                })
            })
        })
    })
  })

  describe("Static Router#url()", function () {
    it("generates route URL", function () {
      const url = Router.url("/:category/:title", {
        category: "programming",
        title: "how-to-node",
      })
      url.should.equal("/programming/how-to-node")
    })

    it("escapes using encodeURIComponent()", function () {
      const url = Router.url(
        "/:category/:title",
        { category: "programming", title: "how to node" },
        { encode: encodeURIComponent }
      )
      url.should.equal("/programming/how%20to%20node")
    })

    it("generates route URL with params and query params", function (done) {
      const query = { page: 3, limit: 10 }
      let url = Router.url("/books/:category/:id", "programming", 4, { query })
      url.should.equal("/books/programming/4?page=3&limit=10")
      url = Router.url(
        "/books/:category/:id",
        { category: "programming", id: 4 },
        { query }
      )
      url.should.equal("/books/programming/4?page=3&limit=10")
      url = Router.url(
        "/books/:category/:id",
        { category: "programming", id: 4 },
        { query: "page=3&limit=10" }
      )
      url.should.equal("/books/programming/4?page=3&limit=10")
      done()
    })

    it("generates router URL without params and with with query params", function (done) {
      const url = Router.url("/category", {
        query: { page: 3, limit: 10 },
      })
      url.should.equal("/category?page=3&limit=10")
      done()
    })
  })

  describe("Support host", function () {
    it("should support host match", function (done) {
      const app = new Koa()
      const router = new Router({
        host: "test.domain",
      })
      router.get("/", ctx => {
        ctx.body = {
          url: "/",
        }
      })
      app.use(router.routes())

      const server = http.createServer(app.callback())

      request(server)
        .get("/")
        .set("Host", "test.domain")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          request(server)
            .get("/")
            .set("Host", "a.domain")
            .expect(404)
            .end(function (err, res) {
              if (err) return done(err)
              done()
            })
        })
    })
    it("should support host match regexp", function (done) {
      const app = new Koa()
      const router = new Router({
        host: /^(.*\.)?test\.domain/,
      })
      router.get("/", ctx => {
        ctx.body = {
          url: "/",
        }
      })
      app.use(router.routes())
      const server = http.createServer(app.callback())

      request(server)
        .get("/")
        .set("Host", "test.domain")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err)

          request(server)
            .get("/")
            .set("Host", "www.test.domain")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err)

              request(server)
                .get("/")
                .set("Host", "any.sub.test.domain")
                .expect(200)
                .end(function (err, res) {
                  if (err) return done(err)

                  request(server)
                    .get("/")
                    .set("Host", "sub.anytest.domain")
                    .expect(404)
                    .end(function (err, res) {
                      if (err) return done(err)

                      done()
                    })
                })
            })
        })
    })
  })
})
