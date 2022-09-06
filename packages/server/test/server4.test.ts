import * as request from "supertest"
import * as util from "util"
import * as statuses from "statuses"
import * as fs from "fs"
import * as mm from "mm"
import * as qt from "../types"
import { newApp, HttpError as _HttpError } from "../server"
import { HttpError } from "http-errors"

describe("app.context", () => {
  const app1 = newApp<qt.State, { msg: string }>()
  app1.context.msg = "hello"
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx.msg).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  const app2 = newApp<qt.State, { msg: string }>()
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx.msg).toBe(undefined)
      ctx.res.status = 204
    })
    return request(app2.listen()).get("/").expect(204)
  })
})
describe("app", () => {
  it("should handle socket errors", done => {
    const app = newApp()
    app.use(ctx => {
      ctx.socket.emit("error", new Error("boom"))
    })
    app.emitter.on("error", err => {
      expect(err.message).toBe("boom")
      done()
    })
    request(app.callback())
      .get("/")
      .end(() => {})
  })
  it("should not .writeHead when !socket.writable", done => {
    const app = newApp()
    app.use(ctx => {
      ctx.req.socket.writable = false
      ctx.res.status = 204
      ctx.out.writeHead = ctx.out.end = () => {
        throw new Error("response sent")
      }
    })
    setImmediate(done)
    request(app.callback())
      .get("/")
      .end(() => {})
  })
  it("should set development env when NODE_ENV missing", () => {
    const NODE_ENV = process.env.NODE_ENV
    process.env.NODE_ENV = ""
    const app = newApp()
    process.env.NODE_ENV = NODE_ENV
    expect(app.env).toBe("development")
  })
  it("should set env from the constructor", () => {
    const env = "custom"
    const app = newApp({ env })
    expect(app.env).toBe(env)
  })
  it("should set proxy flag from the constructor", () => {
    const proxy = true
    const app = newApp({ proxy })
    expect(app.proxy).toBe(proxy)
  })
  it("should set signed cookie keys from the constructor", () => {
    const keys = ["customkey"]
    const app = newApp({ keys })
    expect(app.keys).toBe(keys)
  })
  it("should set subdomOffset from the constructor", () => {
    const subdomOffset = 3
    const app = newApp({ subdomOffset })
    expect(app.subdomOffset).toBe(subdomOffset)
  })
  it("should have a static property exporting `HttpError` from http-errors library", () => {
    expect(_HttpError).not.toBe(undefined)
    expect(_HttpError).toBe(HttpError)
    expect(() => {
      throw new HttpError(500)
    }).toThrow(HttpError)
  })
})
const app = newApp()
describe("app.inspect()", () => {
  it("should work", () => {
    const str = util.inspect(app)
    expect("{ subdomOffset: 2, proxy: false, env: 'test' }").toBe(str)
  })
  it("should return a json representation", () => {
    expect(app.inspect()).toEqual({
      subdomOffset: 2,
      proxy: false,
      env: "test",
    })
  })
})
describe("app.onerror(err)", () => {
  afterEach(mm.restore)
  it("should throw an error if a non-error is given", () => {
    const app = newApp()
    expect(() => {
      app.onerror("foo")
    }).toThrow(TypeError, "non-error thrown: foo")
  })
  it("should accept errors coming from other scopes", () => {
    const ExternError = require("vm").runInNewContext("Error")
    const app = newApp()
    const error = Object.assign(new ExternError("boom"), {
      status: 418,
      expose: true,
    })
    expect(() => app.onerror(error)).not.toThrow()
  })
  it("should do nothing if status is 404", () => {
    const app = newApp()
    const e = new HttpError()
    e.status = 404
    let called = false
    mm(console, "error", () => {
      called = true
    })
    app.onerror(e)
    expect(!called).toBe(true)
  })
  it("should do nothing if .silent", () => {
    const app = newApp({ silent: true })
    const e = new HttpError()
    let called = false
    mm(console, "error", () => {
      called = true
    })
    app.onerror(e)
    expect(!called).toBe(true)
  })
  it("should log the error to stderr", () => {
    const app = newApp({ env: "dev" })
    const e = new HttpError()
    e.stack = "Foo"
    let msg = ""
    mm(console, "error", (x: string) => {
      if (x) msg = x
    })
    app.onerror(e)
    expect(msg).toBe("\n  Foo\n")
  })
  it("should use err.toString() instead of err.stack", () => {
    const app = newApp({ env: "dev" })
    const e = new HttpError("mock stack null")
    e.stack = null
    app.onerror(e)
    let msg = ""
    mm(console, "error", x => {
      if (x) msg = x
    })
    app.onerror(e)
    expect(msg).toBe("\n  Error: mock stack null\n")
  })
})
describe("app.request", () => {
  const app1 = newApp()
  app1.request.message = "hello"
  const app2 = newApp()
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx.request.message).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx.request.message).toBe(undefined)
      ctx.res.status = 204
    })
    return request(app2.listen()).get("/").expect(204)
  })
})
describe("app.respond", () => {
  describe("when ctx.respond === false", () => {
    it("should function (ctx)", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "Hello"
        ctx.respond = false
        const x = ctx.out
        x.statusCode = 200
        setImmediate(() => {
          x.setHeader("Content-Type", "text/plain")
          x.setHeader("Content-Length", "3")
          x.end("lol")
        })
      })
      const s = app.listen()
      return request(s).get("/").expect(200).expect("lol")
    })
    it("should ignore set header after header sent", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "Hello"
        ctx.respond = false
        const x = ctx.out
        x.statusCode = 200
        x.setHeader("Content-Type", "text/plain")
        x.setHeader("Content-Length", "3")
        x.end("lol")
        ctx.res.set("foo", "bar")
      })
      const s = app.listen()
      return request(s)
        .get("/")
        .expect(200)
        .expect("lol")
        .expect(res => {
          expect(!res.headers.foo).toBe(true)
        })
    })
    it("should ignore set status after header sent", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "Hello"
        ctx.respond = false
        const x = ctx.out
        x.statusCode = 200
        x.setHeader("Content-Type", "text/plain")
        x.setHeader("Content-Length", "3")
        x.end("lol")
        ctx.res.status = 201
      })
      const s = app.listen()
      return request(s).get("/").expect(200).expect("lol")
    })
  })
  describe("when res.type === null", () => {
    it("should not send Content-Type header", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = ""
        x.type = null
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(200)
      expect(y.headers.hasOwnProperty("Content-Type")).toBe(false)
    })
  })
  describe("when HEAD is used", () => {
    it("should not respond with the body", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "Hello"
      })
      const s = app.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("text/plain; charset=utf-8")
      expect(y.headers["content-length"]).toBe("5")
      expect(!y.text).toBe(true)
    })
    it("should keep json headers", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = { hello: "world" }
      })
      const s = app.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("application/json; charset=utf-8")
      expect(y.headers["content-length"]).toBe("17")
      expect(!y.text).toBe(true)
    })
    it("should keep string headers", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "hello world"
      })
      const s = app.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("text/plain; charset=utf-8")
      expect(y.headers["content-length"]).toBe("11")
      expect(!y.text).toBe(true)
    })
    it("should keep buffer headers", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = Buffer.from("hello world")
      })
      const s = app.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("application/octet-stream")
      expect(y.headers["content-length"]).toBe("11")
      expect(!y.text).toBe(true)
    })
    it("should keep stream header if set manually", async () => {
      const app = newApp()
      const { length } = fs.readFileSync("package.json")
      app.use(ctx => {
        const x = ctx.res
        x.length = length
        x.body = fs.createReadStream("package.json")
      })
      const s = app.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.header["content-length"]).toBe(length)
      expect(!y.text).toBe(true)
    })
    it("should respond with a 404 if no body was set", () => {
      const app = newApp()
      app.use(_ => {})
      const s = app.listen()
      return request(s).head("/").expect(404)
    })
    it('should respond with a 200 if body = ""', () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = ""
      })
      const s = app.listen()
      return request(s).head("/").expect(200)
    })
    it("should not overwrite the content-type", () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.status = 200
        x.type = "application/javascript"
      })
      const s = app.listen()
      return request(s)
        .head("/")
        .expect("content-type", /application\/javascript/)
        .expect(200)
    })
  })
  describe("when no middleware is present", () => {
    it("should 404", () => {
      const app = newApp()
      const s = app.listen()
      return request(s).get("/").expect(404)
    })
  })
  describe("when res has already been written to", () => {
    it("should not cause an app error", () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.out
        ctx.res.status = 200
        x.setHeader("Content-Type", "text/html")
        x.write("Hello")
      })
      app.emitter.on("error", err => {
        throw err
      })
      const s = app.listen()
      return request(s).get("/").expect(200)
    })
    it("should send the right body", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.status = 200
        const x = ctx.out
        x.setHeader("Content-Type", "text/html")
        x.write("Hello")
        return new Promise<void>(res => {
          setTimeout(() => {
            x.end("Goodbye")
            res()
          }, 0)
        })
      })
      const s = app.listen()
      return request(s).get("/").expect(200).expect("HelloGoodbye")
    })
  })
  describe("when .body is missing", () => {
    describe("with status=400", () => {
      it("should respond with the associated status message", () => {
        const app = newApp()
        app.use(ctx => {
          ctx.res.status = 400
        })
        const s = app.listen()
        return request(s).get("/").expect(400).expect("Content-Length", "11").expect("Bad Request")
      })
    })
    describe("with status=204", () => {
      it("should respond without a body", async () => {
        const app = newApp()
        app.use(ctx => {
          ctx.res.status = 204
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(204).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with status=205", () => {
      it("should respond without a body", async () => {
        const app = newApp()
        app.use(ctx => {
          ctx.res.status = 205
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(205).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with status=304", () => {
      it("should respond without a body", async () => {
        const app = newApp()
        app.use(ctx => {
          ctx.res.status = 304
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(304).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with custom status=700", () => {
      it("should respond with the associated status message", async () => {
        const app = newApp()
        statuses.message[700] = "custom status"
        app.use(ctx => {
          ctx.res.status = 700
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(700).expect("custom status")
        expect(y.statusMessage).toBe("custom status")
      })
    })
    describe("with custom statusMessage=ok", () => {
      it("should respond with the custom status message", async () => {
        const app = newApp()
        app.use(ctx => {
          ctx.res.status = 200
          ctx.res.message = "ok"
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(200).expect("ok")
        expect(y.statusMessage).toBe("ok")
      })
    })
    describe("with custom status without message", () => {
      it("should respond with the status code number", () => {
        const app = newApp()
        app.use(ctx => {
          ctx.out.statusCode = 701
        })
        const s = app.listen()
        return request(s).get("/").expect(701).expect("701")
      })
    })
  })
  describe("when .body is a null", () => {
    it("should respond 204 by default", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = null
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(204).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 204 with status=200", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.status = 200
        ctx.res.body = null
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(204).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 205 with status=205", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.status = 205
        ctx.res.body = null
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(205).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 304 with status=304", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.status = 304
        ctx.res.body = null
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(304).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
  describe("when .body is a string", () => {
    it("should respond", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = "Hello"
      })
      const s = app.listen()
      return request(s).get("/").expect("Hello")
    })
  })
  describe("when .body is a Buffer", () => {
    it("should respond", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = Buffer.from("Hello")
      })
      const s = app.listen()
      return request(s).get("/").expect(200).expect(Buffer.from("Hello"))
    })
  })
  describe("when .body is a Stream", () => {
    it("should respond", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = app.listen()
      const y = await request(s).get("/").expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(false)
      expect(y.body).toEqual(pkg)
    })
    it("should strip content-length when overwriting", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = "hello"
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = app.listen()
      const y = await request(s).get("/").expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(false)
      expect(y.body).toEqual(pkg)
    })
    it("should keep content-length if not overwritten", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.length = fs.readFileSync("package.json").length
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = app.listen()
      const y = await request(s).get("/").expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(true)
      expect(y.body).toEqual(pkg)
    })
    it("should keep content-length if overwritten with the same stream", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.length = fs.readFileSync("package.json").length
        const stream = fs.createReadStream("package.json")
        x.body = stream
        x.body = stream
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = app.listen()
      const y = await request(s).get("/").expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(true)
      expect(y.body).toEqual(pkg)
    })
    it("should handle errors", done => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.set("Content-Type", "application/json; charset=utf-8")
        x.body = fs.createReadStream("does not exist")
      })
      const s = app.listen()
      request(s).get("/").expect("Content-Type", "text/plain; charset=utf-8").expect(404).end(done)
    })
    it("should handle errors when no content status", () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.status = 204
        x.body = fs.createReadStream("does not exist")
      })
      const s = app.listen()
      return request(s).get("/").expect(204)
    })
    it("should handle all intermediate stream body errors", done => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = fs.createReadStream("does not exist")
        x.body = fs.createReadStream("does not exist")
        x.body = fs.createReadStream("does not exist")
      })
      const s = app.listen()
      request(s).get("/").expect(404).end(done)
    })
  })
  describe("when .body is an Object", () => {
    it("should respond with json", () => {
      const app = newApp()
      app.use(ctx => {
        ctx.res.body = { hello: "world" }
      })
      const s = app.listen()
      return request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect('{"hello":"world"}')
    })
    describe("and headers sent", () => {
      it("should respond with json body and headers", () => {
        const app = newApp()
        app.use(ctx => {
          const x = ctx.res
          x.length = 17
          x.type = "json"
          x.set("foo", "bar")
          x.flushHeaders()
          x.body = { hello: "world" }
        })
        const s = app.listen()
        return request(s)
          .get("/")
          .expect("Content-Type", "application/json; charset=utf-8")
          .expect("Content-Length", "17")
          .expect("foo", "bar")
          .expect('{"hello":"world"}')
      })
    })
  })
  describe("when an error occurs", () => {
    it('should emit "error" on the app', done => {
      const app = newApp()
      app.use(_ => {
        throw new Error("boom")
      })
      app.emitter.on("error", err => {
        expect(err.message).toBe("boom")
        done()
      })
      request(app.callback())
        .get("/")
        .end(() => {})
    })
    describe("with an .expose property", () => {
      it("should expose the message", () => {
        const app = newApp()
        app.use(_ => {
          const e = new HttpError("sorry!")
          e.status = 403
          e.expose = true
          throw e
        })
        return request(app.callback()).get("/").expect(403, "sorry!")
      })
    })
    describe("with a .status property", () => {
      it("should respond with .status", () => {
        const app = newApp()
        app.use(_ => {
          const e = new HttpError("s3 explodes")
          e.status = 403
          throw e
        })
        return request(app.callback()).get("/").expect(403, "Forbidden")
      })
    })
    it("should respond with 500", () => {
      const app = newApp()
      app.use(_ => {
        throw new Error("boom!")
      })
      const s = app.listen()
      return request(s).get("/").expect(500, "Internal Server Error")
    })
    it("should be catchable", () => {
      const app = newApp()
      app.use(async (ctx, next) => {
        try {
          await next()
          ctx.res.body = "Hello"
        } catch (e) {
          ctx.res.body = "Got error"
        }
      })
      app.use(_ => {
        throw new Error("boom!")
      })
      const s = app.listen()
      return request(s).get("/").expect(200, "Got error")
    })
  })
  describe("when status and body property", () => {
    it("should 200", () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.status = 304
        x.body = "hello"
        x.status = 200
      })
      const s = app.listen()
      return request(s).get("/").expect(200).expect("hello")
    })
    it("should 204", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.status = 200
        x.body = "hello"
        x.set("content-type", "text/plain; charset=utf8")
        x.status = 204
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(204)
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
  describe("with explicit null body", () => {
    it("should preserve given status", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = null
        x.status = 404
      })
      const s = app.listen()
      return request(s).get("/").expect(404).expect("").expect({})
    })
    it("should respond with correct headers", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = null
        x.status = 401
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(401).expect("").expect({})
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
})
describe("app.response", () => {
  const app1 = newApp()
  app1.res.msg = "hello"
  const app2 = newApp()
  const app3 = newApp()
  const app4 = newApp()
  const app5 = newApp()
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx.res.msg).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx.response.msg).toBe(undefined)
      ctx.res.status = 204
    })
    return request(app2.listen()).get("/").expect(204)
  })
  it("should not include status message in body for http2", async () => {
    app3.use(ctx => {
      ctx.req.httpVersionMajor = 2
      ctx.res.status = 404
    })
    const response = await request(app3.listen()).get("/").expect(404)
    expect(response.text).toBe("404")
  })
  it("should set ._nullBody correctly", async () => {
    app4.use(ctx => {
      ctx.res.body = null
      expect(ctx.res._nullBody).toBe(true)
    })
    return request(app4.listen()).get("/").expect(204)
  })
  it("should not set ._nullBody incorrectly", async () => {
    app5.use(ctx => {
      ctx.res.body = undefined
      expect(ctx.res._nullBody).toBe(undefined)
      ctx.res.body = ""
      expect(ctx.res._nullBody).toBe(undefined)
      ctx.res.body = false
      expect(ctx.res._nullBody).toBe(undefined)
    })
    return request(app5.listen()).get("/").expect(204)
  })
})
describe("app.toJSON()", () => {
  it("should work", () => {
    const app = newApp()
    const x = app.toJSON()
    expect({
      subdomOffset: 2,
      proxy: false,
      env: "test",
    }).toEqual(x)
  })
})
describe("app.use(fn)", () => {
  it("should compose middleware", async () => {
    const app = newApp()
    const ys: number[] = []
    app.use(async (_, next) => {
      ys.push(1)
      await next()
      ys.push(6)
    })
    app.use(async (_, next) => {
      ys.push(2)
      await next()
      ys.push(5)
    })
    app.use(async (_, next) => {
      ys.push(3)
      await next()
      ys.push(4)
    })
    const s = app.listen()
    await request(s).get("/").expect(404)
    expect(ys).toEqual([1, 2, 3, 4, 5, 6])
  })
  it("should catch thrown errors in non-async functions", () => {
    const app = newApp()
    app.use(ctx => ctx.throw("Not Found", 404))
    return request(app.callback()).get("/").expect(404)
  })
})
