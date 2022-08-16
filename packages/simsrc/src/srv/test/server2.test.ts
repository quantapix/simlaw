import * as qt from "../types"
import { newApp } from "../server"
import * as fs from "fs"
import * as Stream from "stream"
import * as request from "supertest"
import * as http from "http"
import * as util from "util"
import * as statuses from "statuses"
import * as net from "net"
const PassThrough = require("stream").PassThrough

type Input = http.IncomingMessage

function newCtx(headers?: qt.Dict, x: qt.Dict = {}, ps: qt.Dict = {}) {
  const app = newApp(ps)
  const inp = { ...x, headers } as Input
  return app.createContext(inp, new http.ServerResponse(inp))
}
beforeAll(() => {})
afterAll(() => {})
describe("res.append(name, val)", () => {
  it("should append multiple headers", () => {
    const x = newCtx().res
    x.append("x-foo", "bar1")
    x.append("x-foo", "bar2")
    expect(x.header["x-foo"]).toEqual(["bar1", "bar2"])
  })
  it("should accept array of values", () => {
    const x = newCtx().res
    x.append("Set-Cookie", ["foo=bar", "fizz=buzz"])
    x.append("Set-Cookie", "hi=again")
    expect(x.header["set-cookie"]).toEqual(["foo=bar", "fizz=buzz", "hi=again"])
  })
  it("should get reset by res.set(field, val)", () => {
    const x = newCtx().res
    x.append("Link", "<http://localhost/>")
    x.append("Link", "<http://localhost:80/>")
    x.set("Link", "<http://127.0.0.1/>")
    expect(x.header.link).toBe("<http://127.0.0.1/>")
  })
  it("should work with res.set(field, val) first", () => {
    const x = newCtx().res
    x.set("Link", "<http://localhost/>")
    x.append("Link", "<http://localhost:80/>")
    expect(x.header.link).toEqual(["<http://localhost/>", "<http://localhost:80/>"])
  })
})
describe("res.attachment([filename])", () => {
  describe("when given a filename", () => {
    it("should set the filename param", () => {
      const x = newCtx().res
      x.attachment("path/to/tobi.png")
      expect(x.header["content-disposition"]).toBe('attachment; filename="tobi.png"')
    })
  })
  describe("when omitting filename", () => {
    it("should not set filename param", () => {
      const x = newCtx().res
      x.attachment()
      expect(x.header["content-disposition"]).toBe("attachment")
    })
  })
  describe("when given a non-ascii filename", () => {
    it("should set the encodeURI filename param", () => {
      const x = newCtx().res
      x.attachment("path/to/include-no-ascii-char-中文名-ok.png")
      const y =
        "attachment; filename=\"include-no-ascii-char-???-ok.png\"; filename*=UTF-8''include-no-ascii-char-%E4%B8%AD%E6%96%87%E5%90%8D-ok.png"
      expect(x.header["content-disposition"]).toBe(y)
    })
    it("should work with http client", () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.attachment("path/to/include-no-ascii-char-中文名-ok.json")
        x.body = { foo: "bar" }
      })
      return request(app.callback())
        .get("/")
        .expect(
          "content-disposition",
          "attachment; filename=\"include-no-ascii-char-???-ok.json\"; filename*=UTF-8''include-no-ascii-char-%E4%B8%AD%E6%96%87%E5%90%8D-ok.json"
        )
        .expect({ foo: "bar" })
        .expect(200)
    })
  })
})
describe("contentDisposition(filename, options)", () => {
  describe('with "fallback" option', () => {
    it("should require a string or Boolean", () => {
      const x = newCtx().res
      expect(() => {
        x.attachment("plans.pdf", { fallback: "42" })
      }).toThrow(/fallback.*string/)
    })
    it("should default to true", () => {
      const x = newCtx().res
      x.attachment("€ rates.pdf")
      expect(x.header["content-disposition"]).toBe(
        "attachment; filename=\"? rates.pdf\"; filename*=UTF-8''%E2%82%AC%20rates.pdf"
      )
    })
    describe('when "false"', () => {
      it("should not generate ISO-8859-1 fallback", () => {
        const x = newCtx().res
        x.attachment("£ and € rates.pdf", { fallback: false })
        expect(x.header["content-disposition"]).toBe(
          "attachment; filename*=UTF-8''%C2%A3%20and%20%E2%82%AC%20rates.pdf"
        )
      })
      it("should keep ISO-8859-1 filename", () => {
        const x = newCtx().res
        x.attachment("£ rates.pdf", { fallback: false })
        expect(x.header["content-disposition"]).toBe('attachment; filename="£ rates.pdf"')
      })
    })
    describe('when "true"', () => {
      it("should generate ISO-8859-1 fallback", () => {
        const x = newCtx().res
        x.attachment("£ and € rates.pdf", { fallback: true })
        expect(x.header["content-disposition"]).toBe(
          "attachment; filename=\"£ and ? rates.pdf\"; filename*=UTF-8''%C2%A3%20and%20%E2%82%AC%20rates.pdf"
        )
      })
      it("should pass through ISO-8859-1 filename", () => {
        const x = newCtx().res
        x.attachment("£ rates.pdf", { fallback: true })
        expect(x.header["content-disposition"]).toBe('attachment; filename="£ rates.pdf"')
      })
    })
    describe("when a string", () => {
      it("should require an ISO-8859-1 string", () => {
        const x = newCtx().res
        expect(() => {
          x.attachment("€ rates.pdf", { fallback: "€ rates.pdf" })
        }).toThrow(/fallback.*iso-8859-1/i)
      })
      it("should use as ISO-8859-1 fallback", () => {
        const x = newCtx().res
        x.attachment("£ and € rates.pdf", {
          fallback: "£ and EURO rates.pdf",
        })
        expect(x.header["content-disposition"]).toBe(
          "attachment; filename=\"£ and EURO rates.pdf\"; filename*=UTF-8''%C2%A3%20and%20%E2%82%AC%20rates.pdf"
        )
      })
      it("should use as fallback even when filename is ISO-8859-1", () => {
        const x = newCtx().res
        x.attachment('"£ rates".pdf', { fallback: "£ rates.pdf" })
        expect(x.header["content-disposition"]).toBe(
          "attachment; filename=\"£ rates.pdf\"; filename*=UTF-8''%22%C2%A3%20rates%22.pdf"
        )
      })
      it("should do nothing if equal to filename", () => {
        const x = newCtx().res
        x.attachment("plans.pdf", { fallback: "plans.pdf" })
        expect(x.header["content-disposition"]).toBe('attachment; filename="plans.pdf"')
      })
      it("should use the basename of the string", () => {
        const x = newCtx().res
        x.attachment("€ rates.pdf", { fallback: "/path/to/EURO rates.pdf" })
        expect(x.header["content-disposition"]).toBe(
          "attachment; filename=\"EURO rates.pdf\"; filename*=UTF-8''%E2%82%AC%20rates.pdf"
        )
      })
      it("should do nothing without filename option", () => {
        const x = newCtx().res
        x.attachment(undefined, { fallback: "plans.pdf" })
        expect(x.header["content-disposition"]).toBe("attachment")
      })
    })
  })
  describe('with "type" option', () => {
    it("should default to attachment", () => {
      const x = newCtx().res
      x.attachment()
      expect(x.header["content-disposition"]).toBe("attachment")
    })
    it("should require a string", () => {
      const x = newCtx().res
      expect(() => {
        x.attachment(undefined, { type: "42" })
      }).toThrow(/invalid type/)
    })
    it("should require a valid type", () => {
      const x = newCtx().res
      expect(() => {
        x.attachment(undefined, { type: "invlaid;type" })
      }).toThrow(/invalid type/)
    })
    it("should create a header with inline type", () => {
      const x = newCtx().res
      x.attachment(undefined, { type: "inline" })
      expect(x.header["content-disposition"]).toBe("inline")
    })
    it("should create a header with inline type and filename", () => {
      const x = newCtx().res
      x.attachment("plans.pdf", { type: "inline" })
      expect(x.header["content-disposition"]).toBe('inline; filename="plans.pdf"')
    })
    it("should normalize type", () => {
      const x = newCtx().res
      x.attachment(undefined, { type: "INLINE" })
      expect(x.header["content-disposition"]).toBe("inline")
    })
  })
})
describe("res.body=", () => {
  describe("when Content-Type is set", () => {
    it("should not override", () => {
      const x = newCtx().res
      x.type = "png"
      x.body = Buffer.from("something")
      expect("image/png").toBe(x.header["content-type"])
    })
    describe("when body is an object", () => {
      it("should override as json", () => {
        const x = newCtx().res
        x.body = "<em>hey</em>"
        expect("text/html; charset=utf-8").toBe(x.header["content-type"])
        x.body = { foo: "bar" }
        expect("application/json; charset=utf-8").toBe(x.header["content-type"])
      })
    })
    it("should override length", () => {
      const x = newCtx().res
      x.type = "html"
      x.body = "something"
      expect(x.length).toBe(9)
    })
  })
  describe("when a string is given", () => {
    it("should default to text", () => {
      const x = newCtx().res
      x.body = "Tobi"
      expect("text/plain; charset=utf-8").toBe(x.header["content-type"])
    })
    it("should set length", () => {
      const x = newCtx().res
      x.body = "Tobi"
      expect("4").toBe(x.header["content-length"])
    })
    describe("and contains a non-leading <", () => {
      it("should default to text", () => {
        const x = newCtx().res
        x.body = "aklsdjf < klajsdlfjasd"
        expect("text/plain; charset=utf-8").toBe(x.header["content-type"])
      })
    })
  })
  describe("when an html string is given", () => {
    it("should default to html", () => {
      const x = newCtx().res
      x.body = "<h1>Tobi</h1>"
      expect("text/html; charset=utf-8").toBe(x.header["content-type"])
    })
    it("should set length", () => {
      const x = newCtx().res
      const y = "<h1>Tobi</h1>"
      x.body = y
      expect(x.length).toBe(Buffer.byteLength(y))
    })
    it("should set length when body is overridden", () => {
      const x = newCtx().res
      const y = "<h1>Tobi</h1>"
      x.body = y
      x.body = y + y
      expect(x.length).toBe(2 * Buffer.byteLength(y))
    })
    describe("when it contains leading whitespace", () => {
      it("should default to html", () => {
        const x = newCtx().res
        x.body = "    <h1>Tobi</h1>"
        expect("text/html; charset=utf-8").toBe(x.header["content-type"])
      })
    })
  })
  describe("when an xml string is given", () => {
    it("should default to html", () => {
      const x = newCtx().res
      x.body = '<?xml version="1.0" encoding="UTF-8"?>\n<俄语>данные</俄语>'
      expect("text/html; charset=utf-8").toBe(x.header["content-type"])
    })
  })
  describe("when a stream is given", () => {
    it("should default to an octet stream", () => {
      const x = newCtx().res
      x.body = fs.createReadStream("LICENSE")
      expect("application/octet-stream").toBe(x.header["content-type"])
    })
    it("should add error handler to the stream, but only once", () => {
      const x = newCtx().res
      const body = new Stream.PassThrough()
      expect(body.listenerCount("error")).toBe(0)
      x.body = body
      expect(body.listenerCount("error")).toBe(1)
      x.body = body
      expect(body.listenerCount("error")).toBe(1)
    })
  })
  describe("when a buffer is given", () => {
    it("should default to an octet stream", () => {
      const x = newCtx().res
      x.body = Buffer.from("hey")
      expect("application/octet-stream").toBe(x.header["content-type"])
    })
    it("should set length", () => {
      const x = newCtx().res
      x.body = Buffer.from("Tobi")
      expect("4").toBe(x.header["content-length"])
    })
  })
  describe("when an object is given", () => {
    it("should default to json", () => {
      const x = newCtx().res
      x.body = { foo: "bar" }
      expect("application/json; charset=utf-8").toBe(x.header["content-type"])
    })
  })
})
describe("res.etag=", () => {
  it("should not modify an etag with quotes", () => {
    const x = newCtx().res
    x.etag = '"asdf"'
    expect(x.header.etag).toBe('"asdf"')
  })
  it("should not modify a weak etag", () => {
    const x = newCtx().res
    x.etag = 'W/"asdf"'
    expect(x.header.etag).toBe('W/"asdf"')
  })
  it("should add quotes around an etag if necessary", () => {
    const x = newCtx().res
    x.etag = "asdf"
    expect(x.header.etag).toBe('"asdf"')
  })
})
describe("res.etag", () => {
  it("should return etag", () => {
    const x = newCtx().res
    x.etag = '"asdf"'
    expect(x.etag).toBe('"asdf"')
  })
})
describe("res.flushHeaders()", () => {
  it("should set headersSent", () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.body = "Body"
      x.status = 200
      x.flushHeaders()
      expect(x.out.headersSent).toBe(true)
    })
    const s = app.listen()
    return request(s).get("/").expect(200).expect("Body")
  })
  it("should allow a response afterwards", () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.status = 200
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "Body"
    })
    const s = app.listen()
    return request(s).get("/").expect(200).expect("Content-Type", "text/plain").expect("Body")
  })
  it("should send the correct status code", () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.status = 401
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "Body"
    })
    const s = app.listen()
    return request(s).get("/").expect(401).expect("Content-Type", "text/plain").expect("Body")
  })
  it("should ignore set header after flushHeaders", async () => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.status = 401
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "foo"
      x.set("X-Shouldnt-Work", "Value")
      x.remove("Content-Type")
      x.vary("Content-Type")
    })
    const s = app.listen()
    const x = await request(s).get("/").expect(401).expect("Content-Type", "text/plain")
    expect(x.headers["x-shouldnt-work"]).toBe(undefined)
    expect(x.headers.vary).toBe(undefined)
  })
  it("should flush headers first and delay to send data", done => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.type = "json"
      x.status = 200
      x.headers.Link =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin"
      const stream = (x.body = new PassThrough())
      x.flushHeaders()
      setTimeout(() => {
        stream.end(JSON.stringify({ message: "hello!" }))
      }, 10000)
    })
    app.listen(function (this: http.Server, err: any) {
      if (err) return done(err)
      const port = (this.address() as net.AddressInfo).port
      http
        .request({ port })
        .on("response", x => {
          const onData = () => done(new Error("boom"))
          x.on("data", onData)
          setTimeout(() => {
            x.removeListener("data", onData)
            done()
          }, 1000)
        })
        .on("error", done)
        .end()
    })
  })
  it("should catch stream error", done => {
    const app = newApp()
    app.emitter.once("error", err => {
      expect(err.message).toBe("mock error")
      done()
    })
    app.use(ctx => {
      const x = ctx.res
      x.type = "json"
      x.status = 200
      x.headers.Link =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin"
      x.length = 20
      x.flushHeaders()
      const stream = (x.body = new PassThrough())
      setTimeout(() => {
        stream.emit("error", new Error("mock error"))
      }, 100)
    })
    const s = app.listen()
    request(s).get("/").end()
  })
})
describe("res.has(name)", () => {
  it("should check a field value, case insensitive way", () => {
    const x = newCtx().res
    x.set("X-Foo", "")
    expect(x.has("x-Foo")).toBe(true)
    expect(x.has("x-foo")).toBe(true)
  })
  it("should return false for non-existent header", () => {
    const x = newCtx().res
    expect(x.has("boo")).toBe(false)
    x.set("x-foo", 5)
    expect(x.has("x-boo")).toBe(false)
  })
})
describe("res.header", () => {
  it("should return the response header object", () => {
    const x = newCtx().res
    x.set("X-Foo", "bar")
    x.set("X-Number", 200)
    expect(x.header).toEqual({ "x-foo": "bar", "x-number": "200" })
  })
  it("should return the response header object when no mocks are in use", async () => {
    const app = newApp()
    let h
    app.use(ctx => {
      const x = ctx.res
      x.set("x-foo", "42")
      h = Object.assign({}, x.header)
    })
    await request(app.callback()).get("/")
    expect(h).toEqual({ "x-foo": "42" })
  })
})
describe("res.header", () => {
  it("should return the response header object", () => {
    const x = newCtx().res
    x.set("X-Foo", "bar")
    expect(x.headers).toEqual({ "x-foo": "bar" })
  })
})
describe("res.inspect()", () => {
  describe("with no response.res present", () => {
    it("should return null", () => {
      const x = newCtx().res
      x.body = "hello"
      //delete x.out
      expect(x.inspect()).toBe(null)
      expect(util.inspect(x)).toBe("undefined")
    })
  })
  it("should return a json representation", () => {
    const x = newCtx().res
    x.body = "hello"
    const expected = {
      status: 200,
      message: "OK",
      header: {
        "content-type": "text/plain; charset=utf-8",
        "content-length": "5",
      },
      body: "hello",
    }
    expect(x.inspect()).toEqual(expected)
    expect(util.inspect(x)).toEqual(util.inspect(expected))
  })
})
describe("res.is(type)", () => {
  it("should ignore params", () => {
    const x = newCtx().res
    x.type = "text/html; charset=utf-8"
    expect(x.is("text/*")).toBe("text/html")
  })
  describe("when no type is set", () => {
    it("should return false", () => {
      const x = newCtx().res
      expect(x.is()).toBe(false)
      expect(x.is("html")).toBe(false)
    })
  })
  describe("when given no types", () => {
    it("should return the type", () => {
      const x = newCtx().res
      x.type = "text/html; charset=utf-8"
      expect(x.is()).toBe("text/html")
    })
  })
  describe("given one type", () => {
    it("should return the type or false", () => {
      const x = newCtx().res
      x.type = "image/png"
      expect(x.is("png")).toBe("png")
      expect(x.is(".png")).toBe(".png")
      expect(x.is("image/png")).toBe("image/png")
      expect(x.is("image/*")).toBe("image/png")
      expect(x.is("*/png")).toBe("image/png")
      expect(x.is("jpeg")).toBe(false)
      expect(x.is(".jpeg")).toBe(false)
      expect(x.is("image/jpeg")).toBe(false)
      expect(x.is("text/*")).toBe(false)
      expect(x.is("*/jpeg")).toBe(false)
    })
  })
  describe("given multiple types", () => {
    it("should return the first match or false", () => {
      const x = newCtx().res
      x.type = "image/png"
      expect(x.is("png")).toBe("png")
      expect(x.is(".png")).toBe(".png")
      expect(x.is("text/*", "image/*")).toBe("image/png")
      expect(x.is("image/*", "text/*")).toBe("image/png")
      expect(x.is("image/*", "image/png")).toBe("image/png")
      expect(x.is("image/png", "image/*")).toBe("image/png")
      expect(x.is(["text/*", "image/*"])).toBe("image/png")
      expect(x.is(["image/*", "text/*"])).toBe("image/png")
      expect(x.is(["image/*", "image/png"])).toBe("image/png")
      expect(x.is(["image/png", "image/*"])).toBe("image/png")
      expect(x.is("jpeg")).toBe(false)
      expect(x.is(".jpeg")).toBe(false)
      expect(x.is("text/*", "application/*")).toBe(false)
      expect(x.is("text/html", "text/plain", "application/json; charset=utf-8")).toBe(false)
    })
  })
  describe("when Content-Type: application/x-www-form-urlencoded", () => {
    it('should match "urlencoded"', () => {
      const x = newCtx().res
      x.type = "application/x-www-form-urlencoded"
      expect(x.is("urlencoded")).toBe("urlencoded")
      expect(x.is("json", "urlencoded")).toBe("urlencoded")
      expect(x.is("urlencoded", "json")).toBe("urlencoded")
    })
  })
})
describe("res.lastModified", () => {
  it("should set the header as a UTCString", () => {
    const x = newCtx().res
    const d = new Date()
    x.lastModified = d
    expect(x.header["last-modified"]).toBe(d.toUTCString())
  })
  it("should work with date strings", () => {
    const x = newCtx().res
    const d = new Date()
    x.lastModified = d.toString()
    expect(x.header["last-modified"]).toBe(d.toUTCString())
  })
  it("should get the header as a Date", () => {
    const x = newCtx().res
    const date = new Date()
    x.lastModified = date
    expect(x.lastModified.getTime() / 1000).toBe(Math.floor(date.getTime() / 1000))
  })
  describe("when lastModified not set", () => {
    it("should get undefined", () => {
      const x = newCtx().res
      expect(x.lastModified).toBe(undefined)
    })
  })
})
describe("res.length", () => {
  describe("when Content-Length is defined", () => {
    it("should return a number", () => {
      const x = newCtx().res
      x.set("Content-Length", "1024")
      expect(x.length).toBe(1024)
    })
    describe("but not number", () => {
      it("should return 0", () => {
        const x = newCtx().res
        x.set("Content-Length", "hey")
        expect(x.length).toBe(0)
      })
    })
  })
  describe("when Content-Length is not defined", () => {
    describe("and a .body is set", () => {
      it("should return a number", () => {
        const x = newCtx().res
        x.body = "foo"
        x.remove("Content-Length")
        expect(x.length).toBe(3)
        x.body = "foo"
        expect(x.length).toBe(3)
        x.body = Buffer.from("foo bar")
        x.remove("Content-Length")
        expect(x.length).toBe(7)
        x.body = Buffer.from("foo bar")
        expect(x.length).toBe(7)
        x.body = { hello: "world" }
        x.remove("Content-Length")
        expect(x.length).toBe(17)
        x.body = { hello: "world" }
        expect(x.length).toBe(17)
        x.body = fs.createReadStream("package.json")
        expect(x.length).toBe(undefined)
        x.body = null
        expect(x.length).toBe(undefined)
      })
    })
    describe("and .body is not", () => {
      it("should return undefined", () => {
        const x = newCtx().res
        expect(x.length).toBe(undefined)
      })
    })
  })
})
describe("res.message", () => {
  it("should return the response status message", () => {
    const x = newCtx().res
    x.status = 200
    expect(x.message).toBe("OK")
  })
  describe("when res.message not present", () => {
    it("should look up in statuses", () => {
      const x = newCtx().res
      x.out.statusCode = 200
      expect(x.message).toBe("OK")
    })
  })
})
describe("res.message=", () => {
  it("should set response status message", () => {
    const x = newCtx().res
    x.status = 200
    x.message = "ok"
    expect(x.out.statusMessage).toBe("ok")
    expect(x.inspect().message).toBe("ok")
  })
})
describe("res.redirect(url)", () => {
  it("should redirect to the given url", () => {
    const x = newCtx().res
    x.redirect("http://google.com")
    expect(x.header.location).toBe("http://google.com")
    expect(x.status).toBe(302)
  })
  it("should auto fix not encode url", done => {
    const app = newApp()
    app.use(ctx => {
      const x = ctx.res
      x.redirect("http://google.com/😓")
    })
    request(app.callback())
      .get("/")
      .end((err, res) => {
        if (err) return done(err)
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe("http://google.com/%F0%9F%98%93")
        done()
      })
  })
  describe('with "back"', () => {
    it("should redirect to Referrer", () => {
      const x = newCtx({ referrer: "/login" }).res
      x.redirect("back")
      expect(x.header.location).toBe("/login")
    })
    it("should redirect to Referer", () => {
      const x = newCtx({ referer: "/login" }).res
      x.redirect("back")
      expect(x.header.location).toBe("/login")
    })
    it("should default to alt", () => {
      const x = newCtx().res
      x.redirect("back", "/index.html")
      expect(x.header.location).toBe("/index.html")
    })
    it("should default redirect to /", () => {
      const x = newCtx().res
      x.redirect("back")
      expect(x.header.location).toBe("/")
    })
  })
  describe("when html is accepted", () => {
    it("should respond with html", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.header.accept = "text/html"
      x.redirect(u)
      expect(x.header["content-type"]).toBe("text/html; charset=utf-8")
      expect(x.body).toBe(`Redirecting to <a href="${u}">${u}</a>.`)
    })
    it("should escape the url", () => {
      const x = newCtx().res
      let u = "<script>"
      x.header.accept = "text/html"
      x.redirect(u)
      const escape = (x: any) =>
        String(x)
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      u = escape(u)
      expect(x.header["content-type"]).toBe("text/html; charset=utf-8")
      expect(x.body).toBe(`Redirecting to <a href="${u}">${u}</a>.`)
    })
  })
  describe("when text is accepted", () => {
    it("should respond with text", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.header.accept = "text/plain"
      x.redirect(u)
      expect(x.body).toBe(`Redirecting to ${u}.`)
    })
  })
  describe("when status is 301", () => {
    it("should not change the status code", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.status = 301
      x.header.accept = "text/plain"
      x.redirect("http://google.com")
      expect(x.status).toBe(301)
      expect(x.body).toBe(`Redirecting to ${u}.`)
    })
  })
  describe("when status is 304", () => {
    it("should change the status code", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.status = 304
      x.header.accept = "text/plain"
      x.redirect("http://google.com")
      expect(x.status).toBe(302)
      expect(x.body).toBe(`Redirecting to ${u}.`)
    })
  })
  describe("when content-type was present", () => {
    it("should overwrite content-type", () => {
      const x = newCtx().res
      x.body = {}
      const u = "http://google.com"
      x.header.accept = "text/plain"
      x.redirect("http://google.com")
      expect(x.status).toBe(302)
      expect(x.body).toBe(`Redirecting to ${u}.`)
      expect(x.type).toBe("text/plain")
    })
  })
})
describe("res.remove(name)", () => {
  it("should remove a field", () => {
    const x = newCtx().res
    x.set("x-foo", "bar")
    x.remove("x-foo")
    expect(x.header).toEqual({})
  })
})
describe("res.set(name, val)", () => {
  it("should set a field value", () => {
    const x = newCtx().res
    x.set("x-foo", "bar")
    expect(x.header["x-foo"]).toBe("bar")
  })
  it("should coerce number to string", () => {
    const x = newCtx().res
    x.set("x-foo", 5)
    expect(x.header["x-foo"]).toBe("5")
  })
  it("should coerce undefined to string", () => {
    const x = newCtx().res
    x.set("x-foo", undefined)
    expect(x.header["x-foo"]).toBe("undefined")
  })
  it("should set a field value of array", () => {
    const x = newCtx().res
    x.set("x-foo", ["foo", "bar", 123])
    expect(x.header["x-foo"]).toEqual(["foo", "bar", "123"])
  })
})
describe("res.set(object)", () => {
  it("should set multiple fields", () => {
    const x = newCtx().res
    x.set({ foo: "1", bar: "2" })
    expect(x.header.foo).toBe("1")
    expect(x.header.bar).toBe("2")
  })
})
describe("res.socket", () => {
  it("should return the request socket object", () => {
    const x = newCtx().res
    expect(x.socket instanceof Stream).toBe(true)
  })
})
describe("res.status=", () => {
  describe("when a status code", () => {
    describe("and valid", () => {
      it("should set the status", () => {
        const x = newCtx().res
        x.status = 403
        expect(x.status).toBe(403)
      })
      it("should not throw", () => {
        newCtx().res.status = 403
      })
    })
    describe("and invalid", () => {
      it("should throw", () => {
        expect(() => {
          newCtx().res.status = 99
        }).toThrow(/invalid status code: 99/)
      })
    })
    describe("and custom status", () => {
      beforeEach(() => (statuses.message[700] = "custom status"))
      it("should set the status", () => {
        const x = newCtx().res
        x.status = 700
        expect(x.status).toBe(700)
      })
      it("should not throw", () => {
        newCtx().res.status = 700
      })
    })
    describe("and HTTP/2", () => {
      it("should not set the status message", () => {
        const x = newCtx(undefined, {
          httpVersionMajor: 2,
          httpVersion: "2.0",
        }).res
        x.status = 200
        expect(!x.out.statusMessage).toBe(true)
      })
    })
  })
  function strip(s: number) {
    it("should strip content related header fields", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.body = { foo: "bar" }
        x.set("Content-Type", "application/json; charset=utf-8")
        x.set("Content-Length", "15")
        x.set("Transfer-Encoding", "chunked")
        x.status = s
        expect(x.header["content-type"]).toBe(null)
        expect(x.header["content-length"]).toBe(null)
        expect(x.header["transfer-encoding"]).toBe(null)
      })
      const x = await request(app.callback()).get("/").expect(s)
      expect(x.headers.hasOwnProperty("content-type")).toBe(false)
      expect(x.headers.hasOwnProperty("content-length")).toBe(false)
      expect(x.headers.hasOwnProperty("content-encoding")).toBe(false)
      expect(x.text.length).toBe(0)
    })
    it("should strip content related header fields after status set", async () => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.status = s
        x.body = { foo: "bar" }
        x.set("Content-Type", "application/json; charset=utf-8")
        x.set("Content-Length", "15")
        x.set("Transfer-Encoding", "chunked")
      })
      const x = await request(app.callback()).get("/").expect(s)
      expect(x.headers.hasOwnProperty("content-type")).toBe(false)
      expect(x.headers.hasOwnProperty("content-length")).toBe(false)
      expect(x.headers.hasOwnProperty("content-encoding")).toBe(false)
      expect(x.text.length).toBe(0)
    })
  }
  describe("when 204", () => strip(204))
  describe("when 205", () => strip(205))
  describe("when 304", () => strip(304))
})
describe("res.type=", () => {
  describe("with a mime", () => {
    it("should set the Content-Type", () => {
      const x = newCtx().res
      x.type = "text/plain"
      expect(x.type).toBe("text/plain")
      expect(x.header["content-type"]).toBe("text/plain; charset=utf-8")
    })
  })
  describe("with an extension", () => {
    it("should lookup the mime", () => {
      const x = newCtx().res
      x.type = "json"
      expect(x.type).toBe("application/json")
      expect(x.header["content-type"]).toBe("application/json; charset=utf-8")
    })
  })
  describe("without a charset", () => {
    it("should default the charset", () => {
      const x = newCtx().res
      x.type = "text/html"
      expect(x.type).toBe("text/html")
      expect(x.header["content-type"]).toBe("text/html; charset=utf-8")
    })
  })
  describe("with a charset", () => {
    it("should not default the charset", () => {
      const x = newCtx().res
      x.type = "text/html; charset=foo"
      expect(x.type).toBe("text/html")
      expect(x.header["content-type"]).toBe("text/html; charset=foo")
    })
  })
  describe("with an unknown extension", () => {
    it("should not set a content-type", () => {
      const x = newCtx().res
      x.type = "asdf"
      expect(!x.type).toBe(true)
      expect(!x.header["content-type"]).toBe(true)
    })
  })
})
describe("res.type", () => {
  describe("with no Content-Type", () => {
    it('should return ""', () => {
      const x = newCtx().res
      expect(!x.type).toBe(true)
    })
  })
  describe("with a Content-Type", () => {
    it("should return the mime", () => {
      const x = newCtx().res
      x.type = "json"
      expect(x.type).toBe("application/json")
    })
  })
})
describe("res.vary(field)", () => {
  describe("when Vary is not set", () => {
    it("should set it", () => {
      const x = newCtx().res
      x.vary("Accept")
      expect(x.header.vary).toBe("Accept")
    })
  })
  describe("when Vary is set", () => {
    it("should append", () => {
      const x = newCtx().res
      x.vary("Accept")
      x.vary("Accept-Encoding")
      expect(x.header.vary).toBe("Accept, Accept-Encoding")
    })
  })
  describe("when Vary already contains the value", () => {
    it("should not append", () => {
      const x = newCtx().res
      x.vary("Accept")
      x.vary("Accept-Encoding")
      x.vary("Accept")
      x.vary("Accept-Encoding")
      expect(x.header.vary).toBe("Accept, Accept-Encoding")
    })
  })
})
describe("res.writable", () => {
  describe("when continuous requests in one persistent connection", () => {
    function requestTwice(s: http.Server, done: (_: any, xs: any) => any) {
      const p = (s.address() as net.AddressInfo).port
      const buf = Buffer.from(
        "GET / HTTP/1.1\r\nHost: localhost:" + p + "\r\nConnection: keep-alive\r\n\r\n"
      )
      const client = net.connect(p)
      const xs: Buffer[] = []
      client
        .on("error", done)
        .on("data", x => xs.push(x))
        .on("end", () => done(null, xs))
      setImmediate(() => client.write(buf))
      setImmediate(() => client.write(buf))
      setTimeout(() => client.end(), 100)
    }
    it("should always be writable and respond to all requests", done => {
      const app = newApp()
      let c = 0
      app.use(ctx => {
        const x = ctx.res
        c++
        x.body = "request " + c + ", writable: " + x.writable
      })
      const s = app.listen()
      requestTwice(s, (_, xs) => {
        const ys = Buffer.concat(xs).toString()
        expect(/request 1, writable: true/.test(ys)).toBe(true)
        expect(/request 2, writable: true/.test(ys)).toBe(true)
        done()
      })
    })
  })
  describe("when socket closed before response sent", () => {
    function requestClosed(s: http.Server) {
      const p = (s.address() as net.AddressInfo).port
      const buf = Buffer.from(
        "GET / HTTP/1.1\r\nHost: localhost:" + p + "\r\nConnection: keep-alive\r\n\r\n"
      )
      const client = net.connect(p)
      setImmediate(() => {
        client.write(buf)
        client.end()
      })
    }
    it("should not be writable", done => {
      const app = newApp()
      const sleep = (x: number) => new Promise(res => setTimeout(res, x))
      app.use(ctx => {
        const x = ctx.res
        sleep(1000).then(() => {
          if (x.writable) {
            return done(new Error("ctx.writable should not be true"))
          }
          done()
        })
      })
      const s = app.listen()
      requestClosed(s)
    })
  })
  describe("when response finished", () => {
    function request(s: http.Server) {
      const p = (s.address() as net.AddressInfo).port
      const buf = Buffer.from(
        "GET / HTTP/1.1\r\nHost: localhost:" + p + "\r\nConnection: keep-alive\r\n\r\n"
      )
      const client = net.connect(p)
      setImmediate(() => {
        client.write(buf)
      })
      setTimeout(() => {
        client.end()
      }, 100)
    }
    it("should not be writable", done => {
      const app = newApp()
      app.use(ctx => {
        const x = ctx.res
        x.out.end()
        if (x.writable) {
          return done(new Error("ctx.writable should not be true"))
        }
        done()
      })
      const s = app.listen()
      request(s)
    })
  })
})
