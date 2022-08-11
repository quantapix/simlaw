import * as qt from "../types"
import { newApp } from "../server"
import * as request from "supertest"
//import prototype from "../../lib/context"
import * as util from "util"
import * as http from "http"
import { HttpError } from "http-errors"

type Input = http.IncomingMessage

function newCtx(headers?: qt.Dict, x: qt.Dict = {}, ps: qt.Dict = {}) {
  const app = newApp(ps)
  const inp = { ...x, headers } as Input
  return app.createContext(inp, new http.ServerResponse(inp))
}

describe("ctx.assert(value, status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.assert(false, 404)
      throw new Error("asdf")
    } catch (err) {
      expect(err.status).toBe(404)
      expect(err.expose).toBe(true)
    }
  })
})
describe("ctx.cookies", () => {
  describe("ctx.cookies.set()", () => {
    it("should set an unsigned cookie", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.cookies.set("name", "jon")
        ctx.res.status = 204
      })
      const s = app.listen()
      const y = await request(s).get("/").expect(204)
      const cs: string[] = y.headers["set-cookie"]
      expect(cs.some(x => /^name=/.test(x))).toBe(true)
    })
    describe("with .signed", () => {
      describe("when no .keys are set", () => {
        it("should error", () => {
          const app = newApp()
          app.use(ctx => {
            try {
              ctx.cookies.set("foo", "bar", { signed: true })
            } catch (err) {
              ctx.res.body = err.message
            }
          })
          return request(app.callback()).get("/").expect(".keys required for signed cookies")
        })
      })
      it("should send a signed cookie", async () => {
        const app = newApp({ keys: ["a", "b"] })
        app.use(ctx => {
          ctx.cookies.set("name", "jon", { signed: true })
          ctx.res.status = 204
        })
        const s = app.listen()
        const y = await request(s).get("/").expect(204)
        const cs: string[] = y.headers["set-cookie"]
        expect(cs.some(x => /^name=/.test(x))).toBe(true)
        expect(cs.some(x => /(,|^)name\.sig=/.test(x))).toBe(true)
      })
    })
    describe("with secure", () => {
      it("should get secure from request", async () => {
        const app = newApp({ proxy: true, keys: ["a", "b"] })
        app.use(ctx => {
          ctx.cookies.set("name", "jon", { signed: true })
          ctx.res.status = 204
        })
        const s = app.listen()
        const y = await request(s).get("/").set("x-forwarded-proto", "https").expect(204)
        const cs: string[] = y.headers["set-cookie"]
        expect(cs.some(x => /^name=/.test(x))).toBe(true)
        expect(cs.some(x => /(,|^)name\.sig=/.test(x))).toBe(true)
        expect(cs.every(x => /secure/.test(x))).toBe(true)
      })
    })
  })
  describe("ctx.cookies=", () => {
    it("should override cookie work", async () => {
      const app = newApp()
      app.use(ctx => {
        ctx.cookies = {
          set(k, v) {
            ctx.res.set(k, v)
          },
        }
        ctx.cookies.set("name", "jon")
        ctx.res.status = 204
      })
      const s = app.listen()
      await request(s).get("/").expect("name", "jon").expect(204)
    })
  })
})
describe("ctx.inspect()", () => {
  it("should return a json representation", () => {
    const x = newCtx()
    const toJSON = x.toJSON(x)
    expect(toJSON).toEqual(x.inspect())
    expect(util.inspect(toJSON)).toEqual(util.inspect(x))
  })
  it("should not crash when called on the prototype", () => {
    expect(prototype).toEqual(prototype.inspect())
    expect(util.inspect(prototype.inspect())).toEqual(util.inspect(prototype))
  })
})
describe("ctx.onerror(err)", () => {
  it("should respond", () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.body = "something else"
      ctx.throw("boom", 418)
    })
    const s = app.listen()
    return request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Content-Length", "4")
  })
  it("should unset all headers", async () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.set("Vary", "Accept-Encoding")
      x.set("X-CSRF-Token", "asdf")
      x.body = "response"
      ctx.throw("boom", 418)
    })
    const s = app.listen()
    const res = await request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Content-Length", "4")
    expect(res.headers.hasOwnProperty("vary")).toBe(false)
    expect(res.headers.hasOwnProperty("x-csrf-token")).toBe(false)
  })
  it("should set headers specified in the error", async () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.set("Vary", "Accept-Encoding")
      x.set("X-CSRF-Token", "asdf")
      x.body = "response"
      throw Object.assign(new Error("boom"), {
        status: 418,
        expose: true,
        headers: {
          "X-New-Header": "Value",
        },
      })
    })
    const s = app.listen()
    const res = await request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("X-New-Header", "Value")
    expect(res.headers.hasOwnProperty("vary")).toBe(false)
    expect(res.headers.hasOwnProperty("x-csrf-token")).toBe(false)
  })
  it("should ignore error after headerSent", done => {
    const app = newApp()
    app.emitter.on("error", err => {
      expect(err.message).toBe("mock error")
      expect(err.headerSent).toBe(true)
      done()
    })
    app.use(async ctx => {
      const x = ctx.res
      x.status = 200
      x.set("X-Foo", "Bar")
      x.flushHeaders()
      await Promise.reject(new Error("mock error"))
      x.body = "response"
    })
    request(app.callback())
      .get("/")
      .expect("X-Foo", "Bar")
      .expect(200, () => {})
  })
  it("should set status specified in the error using statusCode", () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.body = "something else"
      const e = new HttpError("Not found")
      e.statusCode = 404
      throw e
    })
    const s = app.listen()
    return request(s)
      .get("/")
      .expect(404)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Not Found")
  })
  describe("when invalid err.statusCode", () => {
    describe("not number", () => {
      it("should respond 500", () => {
        const app = newApp()
        app.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.statusCode = Number.NaN
          throw e
        })
        const s = app.listen()
        return request(s)
          .get("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Internal Server Error")
      })
    })
  })
  describe("when invalid err.status", () => {
    describe("not number", () => {
      it("should respond 500", () => {
        const app = newApp()
        app.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.status = Number.NaN
          throw e
        })
        const s = app.listen()
        return request(s)
          .get("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Internal Server Error")
      })
    })
    describe("when ENOENT error", () => {
      it("should respond 404", () => {
        const app = newApp()
        app.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("test for ENOENT")
          e.code = "ENOENT"
          throw e
        })
        const s = app.listen()
        return request(s)
          .get("/")
          .expect(404)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Not Found")
      })
    })
    describe("not http status code", () => {
      it("should respond 500", () => {
        const app = newApp()
        app.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.status = 9999
          throw e
        })
        const s = app.listen()
        return request(s)
          .get("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Internal Server Error")
      })
    })
  })
  describe("when error from another scope thrown", () => {
    it("should handle it like a normal error", async () => {
      const ExternError = require("vm").runInNewContext("Error")
      const app = newApp()
      const e = Object.assign(new ExternError("boom"), {
        status: 418,
        expose: true,
      })
      app.use(_ => {
        throw e
      })
      const s = app.listen()
      const p = new Promise<void>((res, rej) => {
        app.emitter.on("error", x => {
          try {
            expect(x).toBe(e)
            res()
          } catch (e) {
            rej(e)
          }
        })
      })
      await request(s).get("/").expect(418)
      await p
    })
  })
  describe("when non-error thrown", () => {
    it("should respond with non-error thrown message", () => {
      const app = newApp()
      app.use(_ => {
        throw "string error"
      })
      const s = app.listen()
      return request(s)
        .get("/")
        .expect(500)
        .expect("Content-Type", "text/plain; charset=utf-8")
        .expect("Internal Server Error")
    })
    it("should use res.getHeaderNames() accessor when available", () => {
      let y = 0
      const x = newCtx()
      x.app.emit = () => {}
      x.out = {
        getHeaderNames: () => ["content-type", "content-length"],
        removeHeader: () => y++,
        end: () => {},
        emit: () => {},
      }
      x.onerror(new HttpError("error"))
      expect(y).toBe(2)
    })
    it("should stringify error if it is an object", done => {
      const app = newApp()
      app.emitter.on("error", err => {
        expect(err).toBe('Error: non-error thrown: {"key":"value"}')
        done()
      })
      app.use(async _ => {
        throw { key: "value" }
      })
      request(app.callback())
        .get("/")
        .expect(500)
        .expect("Internal Server Error", () => {})
    })
  })
})
describe("ctx.state", () => {
  it("should provide a ctx.state namespace", () => {
    const app = newApp()
    app.use(ctx => {
      expect(ctx.state).toEqual({})
    })
    const s = app.listen()
    return request(s).get("/").expect(404)
  })
})
describe("ctx.throw(msg)", () => {
  it("should set .status to 500", () => {
    const x = newCtx()
    try {
      x.throw("boom")
    } catch (err) {
      expect(err.status).toBe(500)
      expect(err.expose).toBe(false)
    }
  })
})
describe("ctx.throw(err)", () => {
  it("should set .status to 500", () => {
    const x = newCtx()
    const err = new Error("test")
    try {
      x.throw(err)
    } catch (err) {
      expect(err.status).toBe(500)
      expect(err.message).toBe("test")
      expect(err.expose).toBe(false)
    }
  })
})
describe("ctx.throw(err, status)", () => {
  it("should throw the error and set .status", () => {
    const x = newCtx()
    const e = new HttpError("test")
    try {
      x.throw(e, 422)
    } catch (err) {
      expect(err.status).toBe(422)
      expect(err.message).toBe("test")
      expect(err.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status, err)", () => {
  it("should throw the error and set .status", () => {
    const x = newCtx()
    const e = new HttpError("test")
    try {
      x.throw(422, e)
    } catch (err) {
      expect(err.status).toBe(422)
      expect(err.message).toBe("test")
      expect(err.expose).toBe(true)
    }
  })
})
describe("ctx.throw(msg, status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw("name required", 400)
    } catch (err) {
      expect(err.message).toBe("name required")
      expect(err.status).toBe(400)
      expect(err.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status, msg)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw("name required", 400)
    } catch (err) {
      expect(err.message).toBe("name required")
      expect(err.status).toBe(400)
      expect(err.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw(400)
    } catch (err) {
      expect(err.message).toBe("Bad Request")
      expect(err.status).toBe(400)
      expect(err.expose).toBe(true)
    }
  })
  describe("when not valid status", () => {
    it("should not expose", () => {
      const x = newCtx()
      try {
        const e = new HttpError("some error")
        e.status = -1
        x.throw(e)
      } catch (err) {
        expect(err.message).toBe("some error")
        expect(err.expose).toBe(false)
      }
    })
  })
})
describe("ctx.throw(status, msg, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw("msg", 400, { prop: true })
    } catch (err) {
      expect(err.message).toBe("msg")
      expect(err.status).toBe(400)
      expect(err.expose).toBe(true)
      expect(err.prop).toBe(true)
    }
  })
  describe("when props include status", () => {
    it("should be ignored", () => {
      const x = newCtx()
      try {
        x.throw("msg", 400, {
          prop: true,
          status: -1,
        })
      } catch (err) {
        expect(err.message).toBe("msg")
        expect(err.status).toBe(400)
        expect(err.expose).toBe(true)
        expect(err.prop).toBe(true)
      }
    })
  })
})
describe("ctx.throw(msg, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw("msg", undefined, { prop: true })
    } catch (err) {
      expect(err.message).toBe("msg")
      expect(err.status).toBe(500)
      expect(err.expose).toBe(false)
      expect(err.prop).toBe(true)
    }
  })
})
describe("ctx.throw(status, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw(400, { prop: true })
    } catch (err) {
      expect(err.message).toBe("Bad Request")
      expect(err.status).toBe(400)
      expect(err.expose).toBe(true)
      expect(err.prop).toBe(true)
    }
  })
})
describe("ctx.throw(err, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw(new Error("test"), { prop: true })
    } catch (err) {
      expect(err.message).toBe("test")
      expect(err.status).toBe(500)
      expect(err.expose).toBe(false)
      expect(err.prop).toBe(true)
    }
  })
})
describe("ctx.toJSON()", () => {
  it("should return a json representation", () => {
    const x = newCtx()
    x.req.method = "POST"
    x.req.url = "/items"
    x.req.headers["content-type"] = "text/plain"
    x.res.status = 200
    x.res.body = "<p>Hey</p>"
    const obj = JSON.parse(JSON.stringify(x))
    const req = obj.request
    const res = obj.response
    expect({
      method: "POST",
      url: "/items",
      header: {
        "content-type": "text/plain",
      },
    }).toEqual(req)
    expect({
      status: 200,
      message: "OK",
      header: {
        "content-type": "text/html; charset=utf-8",
        "content-length": "10",
      },
    }).toEqual(res)
  })
})
