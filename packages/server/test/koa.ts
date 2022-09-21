import { HttpError } from "http-errors"
import * as fs from "fs"
import * as http from "http"
import * as mm from "mm"
import * as qx from "../src/koa.js"
import * as Stream from "stream"
import * as util from "util"
import parseurl from "parseurl"
import request from "supertest"
import statuses from "statuses"
import * as net from "net"
import type * as qt from "../src/types.js"

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms || 1))
}

const PassThrough = Stream.PassThrough

type Input = http.IncomingMessage

function newCtx(headers?: qt.Dict, x: qt.Dict = {}, ps: qt.Dict = {}) {
  const koa = qx.newKoa(ps)
  const inp = { ...x, headers } as Input
  return koa.createContext(inp, new http.ServerResponse(inp))
}

beforeAll(() => {})
afterAll(() => {})

beforeAll(() => undefined)
afterAll(() => undefined)
describe("req.accept", () => {
  it("should return an Accept instance", () => {
    const x = newCtx({
      accept: "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
    }).req
    expect(x.acceptor).toHaveProperty("charsets")
    expect(x.acceptor).toHaveProperty("encodings")
    expect(x.acceptor).toHaveProperty("languages")
    expect(x.acceptor).toHaveProperty("types")
  })
})
describe("req.accept=", () => {
  it("should replace the accept object", () => {
    let x = newCtx({ accept: "text/plain" }).req
    expect(x.accepts()).toEqual(["text/plain"])
    x = newCtx({
      accept: "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
    }).req
    x.acceptor = qx.newAcceptor(x.inp)
    expect(x.accepts()).toEqual([
      "text/html",
      "text/plain",
      "image/jpeg",
      "application/*",
    ])
  })
})
describe("req.accepts(types)", () => {
  describe("with no arguments", () => {
    describe("when Accept is populated", () => {
      it("should return all accepted types", () => {
        const x = newCtx({
          accept:
            "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
        }).req
        expect(x.accepts()).toEqual([
          "text/html",
          "text/plain",
          "image/jpeg",
          "application/*",
        ])
      })
    })
  })
  describe("with no valid types", () => {
    describe("when Accept is populated", () => {
      it("should return false", () => {
        const x = newCtx({
          accept:
            "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
        }).req
        expect(x.accepts("image/png", "image/tiff")).toBe(false)
      })
    })
    describe("when Accept is not populated", () => {
      it("should return the first type", () => {
        const x = newCtx().req
        expect(
          x.accepts("text/html", "text/plain", "image/jpeg", "application/*")
        ).toBe("text/html")
      })
    })
  })
  describe("when extensions are given", () => {
    it("should convert to mime types", () => {
      const x = newCtx({ accept: "text/plain, text/html" }).req
      expect(x.accepts("html")).toBe("html")
      expect(x.accepts(".html")).toBe(".html")
      expect(x.accepts("txt")).toBe("txt")
      expect(x.accepts(".txt")).toBe(".txt")
      expect(x.accepts("png")).toBe(false)
    })
  })
  describe("when an array is given", () => {
    it("should return the first match", () => {
      const x = newCtx({ accept: "text/plain, text/html" }).req
      expect(x.accepts(["png", "text", "html"])).toBe("text")
      expect(x.accepts(["png", "html"])).toBe("html")
    })
  })
  describe("when multiple arguments are given", () => {
    it("should return the first match", () => {
      const x = newCtx({ accept: "text/plain, text/html" }).req
      expect(x.accepts("png", "text", "html")).toBe("text")
      expect(x.accepts("png", "html")).toBe("html")
    })
  })
  describe("when value present in Accept is an exact match", () => {
    it("should return the type", () => {
      const x = newCtx({ accept: "text/plain, text/html" }).req
      expect(x.accepts("text/html")).toBe("text/html")
      expect(x.accepts("text/plain")).toBe("text/plain")
    })
  })
  describe("when value present in Accept is a type match", () => {
    it("should return the type", () => {
      const x = newCtx({ accept: "application/json, */*" }).req
      expect(x.accepts("text/html")).toBe("text/html")
      expect(x.accepts("text/plain")).toBe("text/plain")
      expect(x.accepts("image/png")).toBe("image/png")
    })
  })
  describe("when value present in Accept is a subtype match", () => {
    it("should return the type", () => {
      const x = newCtx({ accept: "application/json, text/*" }).req
      expect(x.accepts("text/html")).toBe("text/html")
      expect(x.accepts("text/plain")).toBe("text/plain")
      expect(x.accepts("image/png")).toBe(false)
      expect(x.accepts("png")).toBe(false)
    })
  })
})
describe("req.acceptsCharsets()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Charset is populated", () => {
      it("should return accepted types", () => {
        const x = newCtx({
          ["accept-charset"]: "utf-8, iso-8859-1;q=0.2, utf-7;q=0.5",
        }).req
        expect(x.acceptsCharsets()).toEqual(["utf-8", "utf-7", "iso-8859-1"])
      })
    })
  })
  describe("with multiple arguments", () => {
    describe("when Accept-Charset is populated", () => {
      describe("if any types match", () => {
        it("should return the best fit", () => {
          const x = newCtx({
            ["accept-charset"]: "utf-8, iso-8859-1;q=0.2, utf-7;q=0.5",
          }).req
          expect(x.acceptsCharsets("utf-7", "utf-8")).toBe("utf-8")
        })
      })
      describe("if no types match", () => {
        it("should return false", () => {
          const x = newCtx({
            ["accept-charset"]: "utf-8, iso-8859-1;q=0.2, utf-7;q=0.5",
          }).req
          expect(x.acceptsCharsets("utf-16")).toBe(false)
        })
      })
    })
    describe("when Accept-Charset is not populated", () => {
      it("should return the first type", () => {
        const x = newCtx().req
        expect(x.acceptsCharsets("utf-7", "utf-8")).toBe("utf-7")
      })
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const x = newCtx({
        ["accept-charset"]: "utf-8, iso-8859-1;q=0.2, utf-7;q=0.5",
      }).req
      expect(x.acceptsCharsets(["utf-7", "utf-8"])).toBe("utf-8")
    })
  })
})
describe("req.acceptsEncodings()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Encoding is populated", () => {
      it("should return accepted types", () => {
        const x = newCtx({ ["accept-encoding"]: "gzip, compress;q=0.2" }).req
        expect(x.acceptsEncodings()).toEqual(["gzip", "compress", "identity"])
        expect(x.acceptsEncodings("gzip", "compress")).toBe("gzip")
      })
    })
    describe("when Accept-Encoding is not populated", () => {
      it("should return identity", () => {
        const x = newCtx().req
        expect(x.acceptsEncodings()).toEqual(["identity"])
        expect(x.acceptsEncodings("gzip", "deflate", "identity")).toBe(
          "identity"
        )
      })
    })
  })
  describe("with multiple arguments", () => {
    it("should return the best fit", () => {
      const x = newCtx({ ["accept-encoding"]: "gzip, compress;q=0.2" }).req
      expect(x.acceptsEncodings("compress", "gzip")).toBe("gzip")
      expect(x.acceptsEncodings("gzip", "compress")).toBe("gzip")
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const x = newCtx({ ["accept-encoding"]: "gzip, compress;q=0.2" }).req
      expect(x.acceptsEncodings(["compress", "gzip"])).toBe("gzip")
    })
  })
})
describe("req.acceptsLanguages(langs)", () => {
  describe("with no arguments", () => {
    describe("when Accept-Language is populated", () => {
      it("should return accepted types", () => {
        const x = newCtx({ ["accept-language"]: "en;q=0.8, es, pt" }).req
        expect(x.acceptsLanguages()).toEqual(["es", "pt", "en"])
      })
    })
  })
  describe("with multiple arguments", () => {
    describe("when Accept-Language is populated", () => {
      describe("if any types types match", () => {
        it("should return the best fit", () => {
          const x = newCtx({ ["accept-language"]: "en;q=0.8, es, pt" }).req
          expect(x.acceptsLanguages("es", "en")).toBe("es")
        })
      })
      describe("if no types match", () => {
        it("should return false", () => {
          const x = newCtx({ ["accept-language"]: "en;q=0.8, es, pt" }).req
          expect(x.acceptsLanguages("fr", "au")).toBe(false)
        })
      })
    })
    describe("when Accept-Language is not populated", () => {
      it("should return the first type", () => {
        const x = newCtx().req
        expect(x.acceptsLanguages("es", "en")).toBe("es")
      })
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const x = newCtx({ ["accept-language"]: "en;q=0.8, es, pt" }).req
      expect(x.acceptsLanguages(["es", "en"])).toBe("es")
    })
  })
})
describe("req.charset", () => {
  describe("with no content-type present", () => {
    it('should return ""', () => {
      const x = newCtx().req
      expect(x.charset).toBe("")
    })
  })
  describe("with charset present", () => {
    it('should return ""', () => {
      const x = newCtx({ ["content-type"]: "text/plain" }).req
      expect(x.charset).toBe("")
    })
  })
  describe("with a charset", () => {
    it("should return the charset", () => {
      const x = newCtx({ ["content-type"]: "text/plain; charset=utf-8" }).req
      expect(x.charset).toBe("utf-8")
    })
    it('should return "" if content-type is invalid', () => {
      const x = newCtx({
        ["content-type"]: "application/json; application/text; charset=utf-8",
      }).req
      expect(x.charset).toBe("")
    })
  })
})
describe("req.fresh", () => {
  describe("the request method is not GET and HEAD", () => {
    it("should return false", () => {
      const x = newCtx(undefined, { method: "POST" }).req
      expect(x.fresh).toBe(false)
    })
  })
  describe("the response is non-2xx", () => {
    it("should return false", () => {
      const x = newCtx({ ["if-none-match"]: "123" }, { method: "GET" })
      x.res.status = 404
      x.res.set("ETag", "123")
      expect(x.req.fresh).toBe(false)
    })
  })
  describe("the response is 2xx", () => {
    describe("and etag matches", () => {
      it("should return true", () => {
        const x = newCtx({ ["if-none-match"]: "123" }, { method: "GET" })
        x.res.status = 200
        x.res.set("ETag", "123")
        expect(x.req.fresh).toBe(true)
      })
    })
    describe("and etag does not match", () => {
      it("should return false", () => {
        const x = newCtx({ ["if-none-match"]: "123" }, { method: "GET" })
        x.res.status = 200
        x.res.set("ETag", "hey")
        expect(x.req.fresh).toBe(false)
      })
    })
  })
})
describe("req.get(name)", () => {
  it("should return the field value", () => {
    const x = newCtx(undefined, {
      host: "http://google.com",
      referer: "http://google.com",
    }).req
    expect(x.get("HOST")).toBe("http://google.com")
    expect(x.get("Host")).toBe("http://google.com")
    expect(x.get("host")).toBe("http://google.com")
    expect(x.get("referer")).toBe("http://google.com")
    expect(x.get("referrer")).toBe("http://google.com")
  })
})
describe("req.header", () => {
  it("should return the request header object", () => {
    const x = newCtx().req
    expect(x.header).toBe(x.headers)
  })
  it("should set the request header object", () => {
    const x = newCtx({
      "X-Custom-Headerfield": "Its one header, with headerfields",
    }).req
    expect(x.header).toBe(x.headers)
  })
})
describe("req.headers", () => {
  it("should return the request header object", () => {
    const x = newCtx().req
    expect(x.headers).toBe(x.header)
  })
  it("should set the request header object", () => {
    const x = newCtx({
      "X-Custom-Headerfield": "Its one header, with headerfields",
    }).req
    expect(x.headers).toBe(x.header)
  })
})
describe("req.host", () => {
  it("should return host with port", () => {
    const x = newCtx({ host: "foo.com:3000" }).req
    expect(x.host).toBe("foo.com:3000")
  })
  describe("with no host present", () => {
    it('should return ""', () => {
      const x = newCtx().req
      expect(x.host).toBe("")
    })
  })
  describe("when less then HTTP/2", () => {
    it("should not use :authority header", () => {
      const x = newCtx({
        httpVersionMajor: 1,
        httpVersion: "1.1",
        [":authority"]: "foo.com:3000",
      }).req
      x.header.host = "bar.com:8000"
      expect(x.host).toBe("bar.com:8000")
    })
  })
  describe("when HTTP/2", () => {
    it("should use :authority header", () => {
      const x = newCtx({
        httpVersionMajor: 2,
        httpVersion: "2.0",
        [":authority"]: "foo.com:3000",
      }).req
      x.header.host = "bar.com:8000"
      expect(x.host).toBe("foo.com:3000")
    })
    it("should use host header as fallback", () => {
      const x = newCtx({
        httpVersionMajor: 2,
        httpVersion: "2.0",
      }).req
      x.header.host = "bar.com:8000"
      expect(x.host).toBe("bar.com:8000")
    })
  })
  describe("when X-Forwarded-Host is present", () => {
    describe("and proxy is not trusted", () => {
      it("should be ignored on HTTP/1", () => {
        const x = newCtx({ ["x-forwarded-host"]: "bar.com" }).req
        x.header.host = "foo.com"
        expect(x.host).toBe("foo.com")
      })
      it("should be ignored on HTTP/2", () => {
        const x = newCtx({
          httpVersionMajor: 2,
          httpVersion: "2.0",
          ["x-forwarded-host"]: "proxy.com:8080",
          [":authority"]: "foo.com:3000",
        }).req
        x.header.host = "bar.com:8000"
        expect(x.host).toBe("foo.com:3000")
      })
    })
    describe("and proxy is trusted", () => {
      it("should be used on HTTP/1", () => {
        const x = newCtx(
          { ["x-forwarded-host"]: "bar.com, baz.com" },
          undefined,
          {
            proxy: true,
          }
        ).req
        x.header.host = "foo.com"
        expect(x.host).toBe("bar.com")
      })
      it("should be used on HTTP/2", () => {
        const x = newCtx(
          {
            ["x-forwarded-host"]: "proxy.com:8080",
            [":authority"]: "foo.com:3000",
          },
          {
            httpVersionMajor: 2,
            httpVersion: "2.0",
          },
          { proxy: true }
        ).req
        x.header.host = "bar.com:8000"
        expect(x.host).toBe("proxy.com:8080")
      })
    })
  })
})
describe("req.hostname", () => {
  it("should return hostname void of port", () => {
    const x = newCtx().req
    x.header.host = "foo.com:3000"
    expect(x.hostname).toBe("foo.com")
  })
  describe("with no host present", () => {
    it('should return ""', () => {
      const x = newCtx().req
      expect(x.hostname).toBe("")
    })
  })
  describe("with IPv6 in host", () => {
    it("should parse localhost void of port", () => {
      const x = newCtx().req
      x.header.host = "[::1]"
      expect(x.hostname).toBe("[::1]")
    })
    it("should parse localhost with port 80", () => {
      const x = newCtx().req
      x.header.host = "[::1]:80"
      expect(x.hostname).toBe("[::1]")
    })
    it("should parse localhost with non-special schema port", () => {
      const x = newCtx().req
      x.header.host = "[::1]:1337"
      expect(x.hostname).toBe("[::1]")
    })
    it("should reduce IPv6 with non-special schema port as hostname", () => {
      const x = newCtx().req
      x.header.host = "[2001:cdba:0000:0000:0000:0000:3257:9652]:1337"
      expect(x.hostname).toBe("[2001:cdba::3257:9652]")
    })
    it("should return empty string when invalid", () => {
      const x = newCtx().req
      x.header.host = "[invalidIPv6]"
      expect(x.hostname).toBe("")
    })
  })
  describe("when X-Forwarded-Host is present", () => {
    describe("and proxy is not trusted", () => {
      it("should be ignored", () => {
        const x = newCtx({ ["x-forwarded-host"]: "bar.com" }).req
        x.header.host = "foo.com"
        expect(x.hostname).toBe("foo.com")
      })
    })
    describe("and proxy is trusted", () => {
      it("should be used", () => {
        const x = newCtx(
          { ["x-forwarded-host"]: "bar.com, baz.com" },
          undefined,
          {
            proxy: true,
          }
        ).req
        x.header.host = "foo.com"
        expect(x.hostname).toBe("bar.com")
      })
    })
  })
})
describe("req.href", () => {
  it("should return the full request url", () => {
    const x = newCtx(
      { host: "localhost" },
      {
        url: "/users/1?next=/dashboard",
        socket: new Stream.Duplex(),
        __proto__: Stream.Readable.prototype,
      }
    ).req
    expect(x.href).toBe("http://localhost/users/1?next=/dashboard")
    x.url = "/foo/users/1?next=/dashboard"
    expect(x.href).toBe("http://localhost/users/1?next=/dashboard")
  })
  it("should work with `GET http://example.com/foo`", done => {
    const koa = qx.newKoa()
    koa.use(c => (c.res.body = c.req.href))
    koa.listen(function (this: http.Server) {
      const port = (this.address() as net.AddressInfo).port
      http.get(
        {
          host: "localhost",
          path: "http://example.com/foo",
          port,
        },
        res => {
          expect(res.statusCode).toBe(200)
          let buf = ""
          res.setEncoding("utf8")
          res.on("data", s => (buf += s))
          res.on("end", () => {
            expect(buf).toBe("http://example.com/foo")
            done()
          })
        }
      )
    })
  })
})
describe("req.idempotent", () => {
  describe("when the request method is idempotent", () => {
    it("should return true", () => {
      const check = (m: string) => {
        const x = newCtx().req
        x.method = m
        expect(x.idempotent).toBe(true)
      }
      ;["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"].forEach(check)
    })
  })
  describe("when the request method is not idempotent", () => {
    it("should return false", () => {
      const x = newCtx().req
      x.method = "POST"
      expect(x.idempotent).toBe(false)
    })
  })
})
describe("req.inspect()", () => {
  describe("with no request.req present", () => {
    it("should return null", () => {
      const x = newCtx().req
      x.method = "GET"
      //delete x.inp
      expect(x.inspect()).toBe(undefined)
      expect(util.inspect(x)).toBe("undefined")
    })
  })
  it("should return a json representation", () => {
    const x = newCtx().req
    x.method = "GET"
    x.url = "example.com"
    x.header.host = "example.com"
    const expected = {
      method: "GET",
      url: "example.com",
      header: {
        host: "example.com",
      },
    }
    expect(x.inspect()).toEqual(expected)
    expect(util.inspect(x)).toEqual(util.inspect(expected))
  })
})
describe("req.ip", () => {
  describe("with req.ips present", () => {
    it("should return req.ips[0]", () => {
      const socket = new Stream.Duplex()
      Object.defineProperty(socket, "remoteAddress", {
        get: () => "127.0.0.2",
        set: () => undefined,
      })
      const x = newCtx(
        { ["x-forwarded-for"]: "127.0.0.1" },
        { socket },
        { proxy: true }
      ).req
      expect(x.ip).toBe("127.0.0.1")
    })
  })
  describe("with no req.ips present", () => {
    it("should return req.socket.remoteAddress", () => {
      const socket = new Stream.Duplex()
      Object.defineProperty(socket, "remoteAddress", {
        get: () => "127.0.0.2",
        set: () => undefined,
      })
      const x = newCtx(undefined, { socket }).req
      expect(x.ip).toBe("127.0.0.2")
    })
    describe("with req.socket.remoteAddress not present", () => {
      it("should return an empty string", () => {
        const socket = new Stream.Duplex()
        Object.defineProperty(socket, "remoteAddress", {
          get: () => undefined,
          set: () => undefined,
        })
        expect(newCtx(undefined, { socket }).req.ip).toBe("")
      })
    })
  })
  it("should be lazy inited and cached", () => {
    const socket = new Stream.Duplex()
    Object.defineProperty(socket, "remoteAddress", {
      get: () => "127.0.0.2",
      set: () => undefined,
    })
    const x = newCtx(undefined, { socket: new Stream.Duplex() }).req
    expect(x.ip).toBe("127.0.0.2")
    //req.socket.remoteAddress = "127.0.0.1"
    expect(x.ip).toBe("127.0.0.2")
  })
  it("should reset ip work", () => {
    const socket = new Stream.Duplex()
    Object.defineProperty(socket, "remoteAddress", {
      get: () => "127.0.0.2",
      set: () => undefined,
    })
    const x = newCtx(undefined, { socket }).req
    expect(x.ip).toBe("127.0.0.2")
    x.ip = "127.0.0.1"
    expect(x.ip).toBe("127.0.0.1")
  })
})
describe("req.ips", () => {
  describe("when X-Forwarded-For is present", () => {
    describe("and proxy is not trusted", () => {
      it("should be ignored", () => {
        const x = newCtx(
          { ["x-forwarded-for"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: false,
          }
        ).req
        expect(x.ips).toEqual([])
      })
    })
    describe("and proxy is trusted", () => {
      it("should be used", () => {
        const x = newCtx(
          { ["x-forwarded-for"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: true,
          }
        ).req
        expect(x.ips).toEqual(["127.0.0.1", "127.0.0.2"])
      })
    })
  })
  describe("when options.proxyIpHeader is present", () => {
    describe("and proxy is not trusted", () => {
      it("should be ignored", () => {
        const x = newCtx(
          { ["x-client-ip"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: false,
            proxyHeader: "x-client-ip",
          }
        ).req
        expect(x.ips).toEqual([])
      })
    })
    describe("and proxy is trusted", () => {
      it("should be used", () => {
        const x = newCtx(
          { ["x-client-ip"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: true,
            proxyHeader: "x-client-ip",
          }
        ).req
        expect(x.ips).toEqual(["127.0.0.1", "127.0.0.2"])
      })
    })
  })
  describe("when options.maxIpsCount is present", () => {
    describe("and proxy is not trusted", () => {
      it("should be ignored", () => {
        const x = newCtx(
          { ["x-forwarded-for"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: false,
            maxIps: 1,
          }
        ).req
        expect(x.ips).toEqual([])
      })
    })
    describe("and proxy is trusted", () => {
      it("should be used", () => {
        const x = newCtx(
          { ["x-forwarded-for"]: "127.0.0.1,127.0.0.2" },
          undefined,
          {
            proxy: true,
            maxIps: 1,
          }
        ).req
        expect(x.ips).toEqual(["127.0.0.2"])
      })
    })
  })
})
describe("req.is(type)", () => {
  it("should ignore params", () => {
    const x = newCtx({
      ["content-type"]: "text/html; charset=utf-8",
      ["transfer-encoding"]: "chunked",
    }).req
    expect(x.is("text/*")).toBe("text/html")
  })
  describe("when no body is given", () => {
    it("should return null", () => {
      const x = newCtx().req
      expect(x.is()).toBe(null)
      expect(x.is("image/*")).toBe(null)
      expect(x.is("image/*", "text/*")).toBe(null)
    })
  })
  describe("when no content type is given", () => {
    it("should return false", () => {
      const x = newCtx({
        ["transfer-encoding"]: "chunked",
      }).req
      expect(x.is()).toBe(false)
      expect(x.is("image/*")).toBe(false)
      expect(x.is("text/*", "image/*")).toBe(false)
    })
  })
  describe("give no types", () => {
    it("should return the mime type", () => {
      const x = newCtx({
        ["content-type"]: "image/png",
        ["transfer-encoding"]: "chunked",
      }).req
      expect(x.is()).toBe("image/png")
    })
  })
  describe("given one type", () => {
    it("should return the type or false", () => {
      const x = newCtx({
        ["content-type"]: "image/png",
        ["transfer-encoding"]: "chunked",
      }).req
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
      const x = newCtx({
        ["content-type"]: "image/png",
        ["transfer-encoding"]: "chunked",
      }).req
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
      expect(
        x.is("text/html", "text/plain", "application/json; charset=utf-8")
      ).toBe(false)
    })
  })
  describe("when Content-Type: application/x-www-form-urlencoded", () => {
    it('should match "urlencoded"', () => {
      const x = newCtx({
        ["content-type"]: "application/x-www-form-urlencoded",
        ["transfer-encoding"]: "chunked",
      }).req
      expect(x.is("urlencoded")).toBe("urlencoded")
      expect(x.is("json", "urlencoded")).toBe("urlencoded")
      expect(x.is("urlencoded", "json")).toBe("urlencoded")
    })
  })
})
describe("req.length", () => {
  it("should return length in content-length", () => {
    const x = newCtx({
      ["content-length"]: "10",
    }).req
    expect(x.length).toBe(10)
  })
  it("should return undefined with no content-length present", () => {
    const x = newCtx().req
    expect(x.length).toBe(undefined)
  })
})
describe("req.origin", () => {
  it("should return the origin of url", () => {
    const x = newCtx(
      { host: "localhost" },
      {
        url: "/users/1?next=/dashboard",
        socket: new Stream.Duplex(),
        __proto__: Stream.Readable.prototype,
      }
    ).req
    expect(x.origin).toBe("http://localhost")
    x.url = "/foo/users/1?next=/dashboard"
    expect(x.origin).toBe("http://localhost")
  })
})
describe("req.path", () => {
  it("should return the pathname", () => {
    const x = newCtx().req
    x.url = "/login?next=/dashboard"
    expect(x.path).toBe("/login")
  })
})
describe("req.path=", () => {
  it("should set the pathname", () => {
    const x = newCtx().req
    x.url = "/login?next=/dashboard"
    x.path = "/logout"
    expect(x.path).toBe("/logout")
    expect(x.url).toBe("/logout?next=/dashboard")
  })
  it("should change .url but not .originalUrl", () => {
    const x = newCtx(undefined, { url: "/login" }).req
    x.path = "/logout"
    expect(x.url).toBe("/logout")
    expect(x.origUrl).toBe("/login")
  })
  it("should not affect parseurl", () => {
    const x = newCtx(undefined, { url: "/login?foo=bar" }).req
    x.path = "/login"
    const url = parseurl(x.inp)
    expect(url?.path).toBe("/login?foo=bar")
  })
})
describe("req.protocol", () => {
  describe("when encrypted", () => {
    it('should return "https"', () => {
      const x = newCtx({ socket: { encrypted: true } }).req
      expect(x.protocol).toBe("https")
    })
  })
  describe("when unencrypted", () => {
    it('should return "http"', () => {
      const x = newCtx({ socket: {} }).req
      expect(x.protocol).toBe("http")
    })
  })
  describe("when X-Forwarded-Proto is set", () => {
    describe("and proxy is trusted", () => {
      it("should be used", () => {
        const x = newCtx(
          { ["x-forwarded-proto"]: "https, http" },
          { socket: {} },
          { proxy: true }
        ).req
        expect(x.protocol).toBe("https")
      })
      describe("and X-Forwarded-Proto is empty", () => {
        it('should return "http"', () => {
          const x = newCtx(
            { ["x-forwarded-proto"]: "" },
            { socket: {} },
            { proxy: true }
          ).req
          expect(x.protocol).toBe("http")
        })
      })
    })
    describe("and proxy is not trusted", () => {
      it("should not be used", () => {
        const x = newCtx({
          socket: {},
          ["x-forwarded-proto"]: "https, http",
        }).req
        expect(x.protocol).toBe("http")
      })
    })
  })
})
describe("req.query", () => {
  describe("when missing", () => {
    it("should return an empty object", () => {
      const x = newCtx(undefined, { url: "/" }).req
      expect(x.query).toEqual({})
    })
    it("should return the same object each time it's accessed", () => {
      const x = newCtx(undefined, { url: "/" }).req
      x.query["a"] = "2"
      expect(x.query["a"]).toBe("2")
    })
  })
  it("should return a parsed query string", () => {
    const x = newCtx(undefined, { url: "/?page=2" }).req
    expect(x.query["page"]).toBe("2")
  })
})
describe("req.query=", () => {
  it("should stringify and replace the query string and search", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.query = { page: "2", color: "blue" }
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.qstring).toBe("page=2&color=blue")
    expect(x.search).toBe("?page=2&color=blue")
  })
  it("should change .url but not .originalUrl", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.query = { page: "2" }
    expect(x.url).toBe("/store/shoes?page=2")
    expect(x.origUrl).toBe("/store/shoes")
  })
})
describe("req.qstring", () => {
  it("should return the querystring", () => {
    const x = newCtx(undefined, { url: "/store/shoes?page=2&color=blue" }).req
    expect(x.qstring).toBe("page=2&color=blue")
  })
  describe("when ctx.req not present", () => {
    it("should return an empty string", () => {
      const x = newCtx().req
      //x.inp = null
      expect(x.qstring).toBe("")
    })
  })
})
describe("req.qstring=", () => {
  it("should replace the querystring", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.qstring = "page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.qstring).toBe("page=2&color=blue")
  })
  it("should update x.search and ctx.query", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.qstring = "page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.search).toBe("?page=2&color=blue")
    expect(x.query["page"]).toBe("2")
    expect(x.query["color"]).toBe("blue")
  })
  it("should change .url but not .originalUrl", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.qstring = "page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.origUrl).toBe("/store/shoes")
  })
  it("should not affect parseurl", () => {
    const x = newCtx(undefined, { url: "/login?foo=bar" }).req
    x.qstring = "foo=bar"
    const url = parseurl(x.inp)
    expect(url?.path).toBe("/login?foo=bar")
  })
})
describe("req.search=", () => {
  it("should replace the search", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.search = "?page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.search).toBe("?page=2&color=blue")
  })
  it("should update x.qstring and ctx.query", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.search = "?page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.qstring).toBe("page=2&color=blue")
    expect(x.query["page"]).toBe("2")
    expect(x.query["color"]).toBe("blue")
  })
  it("should change .url but not .originalUrl", () => {
    const x = newCtx(undefined, { url: "/store/shoes" }).req
    x.search = "?page=2&color=blue"
    expect(x.url).toBe("/store/shoes?page=2&color=blue")
    expect(x.origUrl).toBe("/store/shoes")
  })
  describe("when missing", () => {
    it('should return ""', () => {
      const x = newCtx(undefined, { url: "/store/shoes" }).req
      expect(x.search).toBe("")
    })
  })
})
describe("req.secure", () => {
  it("should return true when encrypted", () => {
    const x = newCtx({ socket: { encrypted: true } }).req
    expect(x.secure).toBe(true)
  })
})
describe("req.stale", () => {
  it("should be the inverse of req.fresh", () => {
    const x = newCtx(
      {
        ["if-none-match"]: '"123"',
      },
      { method: "GET" }
    )
    x.res.status = 200
    x.res.set("ETag", '"123"')
    expect(x.req.fresh).toBe(true)
    expect(x.req.stale).toBe(false)
  })
})
describe("req.subdoms", () => {
  it("should return subdomain array", () => {
    let x = newCtx(undefined, undefined, { subdomOffset: 2 }).req
    x.header.host = "tobi.ferrets.example.com"
    expect(x.subdoms).toEqual(["ferrets", "tobi"])
    x = newCtx(undefined, undefined, { subdomOffset: 3 }).req
    expect(x.subdoms).toEqual(["tobi"])
  })
  it("should work with no host present", () => {
    const x = newCtx().req
    expect(x.subdoms).toEqual([])
  })
  it("should check if the host is an ip address, even with a port", () => {
    const x = newCtx(undefined, { host: "127.0.0.1:3000" }).req
    expect(x.subdoms).toEqual([])
  })
})
describe("req.type", () => {
  it("should return type void of parameters", () => {
    const x = newCtx({ ["content-type"]: "text/html; charset=utf-8" }).req
    expect(x.type).toBe("text/html")
  })
  it("should return empty string with no host present", () => {
    const x = newCtx().req
    expect(x.type).toBe("")
  })
})
describe("req.URL", () => {
  it("should not throw when host is void", () => {
    newCtx().req.URL
  })
  it("should not throw when header.host is invalid", () => {
    const x = newCtx().req
    x.header.host = "invalid host"
    x.URL
  })
  it("should return empty object when invalid", () => {
    const x = newCtx().req
    x.header.host = "invalid host"
    expect(x.URL).toEqual(Object.create(null))
  })
})
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
    expect(x.header["link"]).toBe("<http://127.0.0.1/>")
  })
  it("should work with res.set(field, val) first", () => {
    const x = newCtx().res
    x.set("Link", "<http://localhost/>")
    x.append("Link", "<http://localhost:80/>")
    expect(x.header["link"]).toEqual([
      "<http://localhost/>",
      "<http://localhost:80/>",
    ])
  })
})
describe("res.attachment([filename])", () => {
  describe("when given a filename", () => {
    it("should set the filename param", () => {
      const x = newCtx().res
      x.attachment("path/to/tobi.png")
      expect(x.header["content-disposition"]).toBe(
        'attachment; filename="tobi.png"'
      )
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
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.attachment("path/to/include-no-ascii-char-中文名-ok.json")
        x.body = { foo: "bar" }
      })
      return request(koa.callback())
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
        expect(x.header["content-disposition"]).toBe(
          'attachment; filename="£ rates.pdf"'
        )
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
        expect(x.header["content-disposition"]).toBe(
          'attachment; filename="£ rates.pdf"'
        )
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
        expect(x.header["content-disposition"]).toBe(
          'attachment; filename="plans.pdf"'
        )
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
      expect(x.header["content-disposition"]).toBe(
        'inline; filename="plans.pdf"'
      )
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
    expect(x.header["etag"]).toBe('"asdf"')
  })
  it("should not modify a weak etag", () => {
    const x = newCtx().res
    x.etag = 'W/"asdf"'
    expect(x.header["etag"]).toBe('W/"asdf"')
  })
  it("should add quotes around an etag if necessary", () => {
    const x = newCtx().res
    x.etag = "asdf"
    expect(x.header["etag"]).toBe('"asdf"')
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
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.body = "Body"
      x.status = 200
      x.flushHeaders()
      expect(x.out.headersSent).toBe(true)
    })
    const s = koa.listen()
    return request(s).get("/").expect(200).expect("Body")
  })
  it("should allow a response afterwards", () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.status = 200
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "Body"
    })
    const s = koa.listen()
    return request(s)
      .get("/")
      .expect(200)
      .expect("Content-Type", "text/plain")
      .expect("Body")
  })
  it("should send the correct status code", () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.status = 401
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "Body"
    })
    const s = koa.listen()
    return request(s)
      .get("/")
      .expect(401)
      .expect("Content-Type", "text/plain")
      .expect("Body")
  })
  it("should ignore set header after flushHeaders", async () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.status = 401
      x.out.setHeader("Content-Type", "text/plain")
      x.flushHeaders()
      x.body = "foo"
      x.set("X-Shouldnt-Work", "Value")
      x.remove("Content-Type")
      x.vary("Content-Type")
    })
    const s = koa.listen()
    const x = await request(s)
      .get("/")
      .expect(401)
      .expect("Content-Type", "text/plain")
    expect(x.headers["x-shouldnt-work"]).toBe(undefined)
    expect(x.headers.vary).toBe(undefined)
  })
  it("should flush headers first and delay to send data", done => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.type = "json"
      x.status = 200
      x.headers["Link"] =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin"
      const stream = (x.body = new PassThrough())
      x.flushHeaders()
      setTimeout(() => {
        stream.end(JSON.stringify({ message: "hello!" }))
      }, 10000)
    })
    koa.listen(function (this: http.Server, err: any) {
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
    const koa = qx.newKoa()
    koa.emitter.once("error", err => {
      expect(err.message).toBe("mock error")
      done()
    })
    koa.use(ctx => {
      const x = ctx.res
      x.type = "json"
      x.status = 200
      x.headers["Link"] =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin"
      x.length = 20
      x.flushHeaders()
      const stream = (x.body = new PassThrough())
      setTimeout(() => {
        stream.emit("error", new Error("mock error"))
      }, 100)
    })
    const s = koa.listen()
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
    const koa = qx.newKoa()
    let h
    koa.use(ctx => {
      const x = ctx.res
      x.set("x-foo", "42")
      h = Object.assign({}, x.header)
    })
    await request(koa.callback()).get("/")
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
      expect(
        x.is("text/html", "text/plain", "application/json; charset=utf-8")
      ).toBe(false)
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
    expect(x.lastModified.getTime() / 1000).toBe(
      Math.floor(date.getTime() / 1000)
    )
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
    expect(x.header["location"]).toBe("http://google.com")
    expect(x.status).toBe(302)
  })
  it("should auto fix not encode url", done => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.redirect("http://google.com/😓")
    })
    request(koa.callback())
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
      expect(x.header["location"]).toBe("/login")
    })
    it("should redirect to Referer", () => {
      const x = newCtx({ referer: "/login" }).res
      x.redirect("back")
      expect(x.header["location"]).toBe("/login")
    })
    it("should default to alt", () => {
      const x = newCtx().res
      x.redirect("back", "/index.html")
      expect(x.header["location"]).toBe("/index.html")
    })
    it("should default redirect to /", () => {
      const x = newCtx().res
      x.redirect("back")
      expect(x.header["location"]).toBe("/")
    })
  })
  describe("when html is accepted", () => {
    it("should respond with html", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.header["accept"] = "text/html"
      x.redirect(u)
      expect(x.header["content-type"]).toBe("text/html; charset=utf-8")
      expect(x.body).toBe(`Redirecting to <a href="${u}">${u}</a>.`)
    })
    it("should escape the url", () => {
      const x = newCtx().res
      let u = "<script>"
      x.header["accept"] = "text/html"
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
      x.header["accept"] = "text/plain"
      x.redirect(u)
      expect(x.body).toBe(`Redirecting to ${u}.`)
    })
  })
  describe("when status is 301", () => {
    it("should not change the status code", () => {
      const x = newCtx().res
      const u = "http://google.com"
      x.status = 301
      x.header["accept"] = "text/plain"
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
      x.header["accept"] = "text/plain"
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
      x.header["accept"] = "text/plain"
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
    expect(x.header["foo"]).toBe("1")
    expect(x.header["bar"]).toBe("2")
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
      const koa = qx.newKoa()
      koa.use(ctx => {
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
      const x = await request(koa.callback()).get("/").expect(s)
      expect(x.headers.hasOwnProperty("content-type")).toBe(false)
      expect(x.headers.hasOwnProperty("content-length")).toBe(false)
      expect(x.headers.hasOwnProperty("content-encoding")).toBe(false)
      expect(x.text.length).toBe(0)
    })
    it("should strip content related header fields after status set", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.status = s
        x.body = { foo: "bar" }
        x.set("Content-Type", "application/json; charset=utf-8")
        x.set("Content-Length", "15")
        x.set("Transfer-Encoding", "chunked")
      })
      const x = await request(koa.callback()).get("/").expect(s)
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
      expect(x.header["vary"]).toBe("Accept")
    })
  })
  describe("when Vary is set", () => {
    it("should append", () => {
      const x = newCtx().res
      x.vary("Accept")
      x.vary("Accept-Encoding")
      expect(x.header["vary"]).toBe("Accept, Accept-Encoding")
    })
  })
  describe("when Vary already contains the value", () => {
    it("should not append", () => {
      const x = newCtx().res
      x.vary("Accept")
      x.vary("Accept-Encoding")
      x.vary("Accept")
      x.vary("Accept-Encoding")
      expect(x.header["vary"]).toBe("Accept, Accept-Encoding")
    })
  })
})
describe("res.writable", () => {
  describe("when continuous requests in one persistent connection", () => {
    function requestTwice(s: http.Server, done: (_: any, xs: any) => any) {
      const p = (s.address() as net.AddressInfo).port
      const buf = Buffer.from(
        "GET / HTTP/1.1\r\nHost: localhost:" +
          p +
          "\r\nConnection: keep-alive\r\n\r\n"
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
      const koa = qx.newKoa()
      let c = 0
      koa.use(ctx => {
        const x = ctx.res
        c++
        x.body = "request " + c + ", writable: " + x.writable
      })
      const s = koa.listen()
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
        "GET / HTTP/1.1\r\nHost: localhost:" +
          p +
          "\r\nConnection: keep-alive\r\n\r\n"
      )
      const client = net.connect(p)
      setImmediate(() => {
        client.write(buf)
        client.end()
      })
    }
    it("should not be writable", done => {
      const koa = qx.newKoa()
      const sleep = (x: number) => new Promise(res => setTimeout(res, x))
      koa.use(ctx => {
        const x = ctx.res
        sleep(1000).then(() => {
          if (x.writable) {
            return done(new Error("ctx.writable should not be true"))
          }
          done()
        })
      })
      const s = koa.listen()
      requestClosed(s)
    })
  })
  describe("when response finished", () => {
    function request(s: http.Server) {
      const p = (s.address() as net.AddressInfo).port
      const buf = Buffer.from(
        "GET / HTTP/1.1\r\nHost: localhost:" +
          p +
          "\r\nConnection: keep-alive\r\n\r\n"
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
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.out.end()
        if (x.writable) {
          return done(new Error("ctx.writable should not be true"))
        }
        done()
      })
      const s = koa.listen()
      request(s)
    })
  })
})
describe("ctx.assert(value, status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.assert(false, 404)
      throw new Error("asdf")
    } catch (e: any) {
      expect(e.status).toBe(404)
      expect(e.expose).toBe(true)
    }
  })
})
describe("ctx.cookies", () => {
  describe("ctx.cookies.set()", () => {
    it("should set an unsigned cookie", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.cookies.set("name", "jon")
        ctx.res.status = 204
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(204)
      const cs: string[] = y.headers["set-cookie"]
      expect(cs.some(x => /^name=/.test(x))).toBe(true)
    })
    describe("with .signed", () => {
      describe("when no .keys are set", () => {
        it("should error", () => {
          const koa = qx.newKoa()
          koa.use(ctx => {
            try {
              ctx.cookies.set("foo", "bar", { signed: true })
            } catch (e: any) {
              ctx.res.body = e.message
            }
          })
          return request(koa.callback())
            .get("/")
            .expect(".keys required for signed cookies")
        })
      })
      it("should send a signed cookie", async () => {
        const koa = qx.newKoa({ keys: ["a", "b"] })
        koa.use(ctx => {
          ctx.cookies.set("name", "jon", { signed: true })
          ctx.res.status = 204
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(204)
        const cs: string[] = y.headers["set-cookie"]
        expect(cs.some(x => /^name=/.test(x))).toBe(true)
        expect(cs.some(x => /(,|^)name\.sig=/.test(x))).toBe(true)
      })
    })
    describe("with secure", () => {
      it("should get secure from request", async () => {
        const koa = qx.newKoa({ proxy: true, keys: ["a", "b"] })
        koa.use(ctx => {
          ctx.cookies.set("name", "jon", { signed: true })
          ctx.res.status = 204
        })
        const s = koa.listen()
        const y = await request(s)
          .get("/")
          .set("x-forwarded-proto", "https")
          .expect(204)
        const cs: string[] = y.headers["set-cookie"]
        expect(cs.some(x => /^name=/.test(x))).toBe(true)
        expect(cs.some(x => /(,|^)name\.sig=/.test(x))).toBe(true)
        expect(cs.every(x => /secure/.test(x))).toBe(true)
      })
    })
  })
  describe("ctx.cookies=", () => {
    it("should override cookie work", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.cookies = {
          set(k, v) {
            ctx.res.set(k, v)
          },
        }
        ctx.cookies.set("name", "jon")
        ctx.res.status = 204
      })
      const s = koa.listen()
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
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.body = "something else"
      ctx.throw("boom", 418)
    })
    const s = koa.listen()
    return request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Content-Length", "4")
  })
  it("should unset all headers", async () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.set("Vary", "Accept-Encoding")
      x.set("X-CSRF-Token", "asdf")
      x.body = "response"
      ctx.throw("boom", 418)
    })
    const s = koa.listen()
    const res = await request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Content-Length", "4")
    expect(res.headers.hasOwnProperty("vary")).toBe(false)
    expect(res.headers.hasOwnProperty("x-csrf-token")).toBe(false)
  })
  it("should set headers specified in the error", async () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
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
    const s = koa.listen()
    const res = await request(s)
      .get("/")
      .expect(418)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("X-New-Header", "Value")
    expect(res.headers.hasOwnProperty("vary")).toBe(false)
    expect(res.headers.hasOwnProperty("x-csrf-token")).toBe(false)
  })
  it("should ignore error after headerSent", done => {
    const koa = qx.newKoa()
    koa.emitter.on("error", err => {
      expect(err.message).toBe("mock error")
      expect(err.headerSent).toBe(true)
      done()
    })
    koa.use(async ctx => {
      const x = ctx.res
      x.status = 200
      x.set("X-Foo", "Bar")
      x.flushHeaders()
      await Promise.reject(new Error("mock error"))
      x.body = "response"
    })
    request(koa.callback())
      .get("/")
      .expect("X-Foo", "Bar")
      .expect(200, () => {})
  })
  it("should set status specified in the error using statusCode", () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      const x = ctx.res
      x.body = "something else"
      const e = new HttpError("Not found")
      e.statusCode = 404
      throw e
    })
    const s = koa.listen()
    return request(s)
      .get("/")
      .expect(404)
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("Not Found")
  })
  describe("when invalid err.statusCode", () => {
    describe("not number", () => {
      it("should respond 500", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.statusCode = Number.NaN
          throw e
        })
        const s = koa.listen()
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
        const koa = qx.newKoa()
        koa.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.status = Number.NaN
          throw e
        })
        const s = koa.listen()
        return request(s)
          .get("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Internal Server Error")
      })
    })
    describe("when ENOENT error", () => {
      it("should respond 404", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("test for ENOENT")
          e["code"] = "ENOENT"
          throw e
        })
        const s = koa.listen()
        return request(s)
          .get("/")
          .expect(404)
          .expect("Content-Type", "text/plain; charset=utf-8")
          .expect("Not Found")
      })
    })
    describe("not http status code", () => {
      it("should respond 500", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          const x = ctx.res
          x.body = "something else"
          const e = new HttpError("some error")
          e.status = 9999
          throw e
        })
        const s = koa.listen()
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
      const koa = qx.newKoa()
      const e = Object.assign(new ExternError("boom"), {
        status: 418,
        expose: true,
      })
      koa.use(_ => {
        throw e
      })
      const s = koa.listen()
      const p = new Promise<void>((res, rej) => {
        koa.emitter.on("error", x => {
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
      const koa = qx.newKoa()
      koa.use(_ => {
        throw "string error"
      })
      const s = koa.listen()
      return request(s)
        .get("/")
        .expect(500)
        .expect("Content-Type", "text/plain; charset=utf-8")
        .expect("Internal Server Error")
    })
    it("should use res.getHeaderNames() accessor when available", () => {
      let y = 0
      const x = newCtx()
      x["koa"].emit = () => {}
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
      const koa = qx.newKoa()
      koa.emitter.on("error", err => {
        expect(err).toBe('Error: non-error thrown: {"key":"value"}')
        done()
      })
      koa.use(async _ => {
        throw { key: "value" }
      })
      request(koa.callback())
        .get("/")
        .expect(500)
        .expect("Internal Server Error", () => {})
    })
  })
})
describe("ctx.state", () => {
  it("should provide a ctx.state namespace", () => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      expect(ctx.state).toEqual({})
    })
    const s = koa.listen()
    return request(s).get("/").expect(404)
  })
})
describe("ctx.throw(msg)", () => {
  it("should set .status to 500", () => {
    const x = newCtx()
    try {
      x.throw("boom")
    } catch (e: any) {
      expect(e.status).toBe(500)
      expect(e.expose).toBe(false)
    }
  })
})
describe("ctx.throw(err)", () => {
  it("should set .status to 500", () => {
    const x = newCtx()
    const err = new Error("test")
    try {
      x.throw(err)
    } catch (e: any) {
      expect(e.status).toBe(500)
      expect(e.message).toBe("test")
      expect(e.expose).toBe(false)
    }
  })
})
describe("ctx.throw(err, status)", () => {
  it("should throw the error and set .status", () => {
    const x = newCtx()
    const e = new HttpError("test")
    try {
      x.throw(e, 422)
    } catch (e: any) {
      expect(e.status).toBe(422)
      expect(e.message).toBe("test")
      expect(e.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status, err)", () => {
  it("should throw the error and set .status", () => {
    const x = newCtx()
    const e = new HttpError("test")
    try {
      x.throw(422, e)
    } catch (e: any) {
      expect(e.status).toBe(422)
      expect(e.message).toBe("test")
      expect(e.expose).toBe(true)
    }
  })
})
describe("ctx.throw(msg, status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw("name required", 400)
    } catch (e: any) {
      expect(e.message).toBe("name required")
      expect(e.status).toBe(400)
      expect(e.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status, msg)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw("name required", 400)
    } catch (e: any) {
      expect(e.message).toBe("name required")
      expect(e.status).toBe(400)
      expect(e.expose).toBe(true)
    }
  })
})
describe("ctx.throw(status)", () => {
  it("should throw an error", () => {
    const x = newCtx()
    try {
      x.throw(400)
    } catch (e: any) {
      expect(e.message).toBe("Bad Request")
      expect(e.status).toBe(400)
      expect(e.expose).toBe(true)
    }
  })
  describe("when not valid status", () => {
    it("should not expose", () => {
      const x = newCtx()
      try {
        const e = new HttpError("some error")
        e.status = -1
        x.throw(e)
      } catch (e: any) {
        expect(e.message).toBe("some error")
        expect(e.expose).toBe(false)
      }
    })
  })
})
describe("ctx.throw(status, msg, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw("msg", 400, { prop: true })
    } catch (e: any) {
      expect(e.message).toBe("msg")
      expect(e.status).toBe(400)
      expect(e.expose).toBe(true)
      expect(e.prop).toBe(true)
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
      } catch (e: any) {
        expect(e.message).toBe("msg")
        expect(e.status).toBe(400)
        expect(e.expose).toBe(true)
        expect(e.prop).toBe(true)
      }
    })
  })
})
describe("ctx.throw(msg, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw("msg", undefined, { prop: true })
    } catch (e: any) {
      expect(e.message).toBe("msg")
      expect(e.status).toBe(500)
      expect(e.expose).toBe(false)
      expect(e.prop).toBe(true)
    }
  })
})
describe("ctx.throw(status, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw(400, { prop: true })
    } catch (e: any) {
      expect(e.message).toBe("Bad Request")
      expect(e.status).toBe(400)
      expect(e.expose).toBe(true)
      expect(e.prop).toBe(true)
    }
  })
})
describe("ctx.throw(err, props)", () => {
  it("should mixin props", () => {
    const x = newCtx()
    try {
      x.throw(new Error("test"), { prop: true })
    } catch (e: any) {
      expect(e.message).toBe("test")
      expect(e.status).toBe(500)
      expect(e.expose).toBe(false)
      expect(e.prop).toBe(true)
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

describe("koa.context", () => {
  const app1 = qx.newKoa<qt.State, { msg: string }>()
  app1.context.msg = "hello"
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx.msg).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  const app2 = qx.newKoa<qt.State, { msg: string }>()
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx.msg).toBe(undefined)
      ctx.res.status = 204
    })
    return request(app2.listen()).get("/").expect(204)
  })
})
describe("koa", () => {
  it("should handle socket errors", done => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      ctx["socket"].emit("error", new Error("boom"))
    })
    koa.emitter.on("error", err => {
      expect(err.message).toBe("boom")
      done()
    })
    request(koa.callback())
      .get("/")
      .end(() => {})
  })
  it("should not .writeHead when !socket.writable", done => {
    const koa = qx.newKoa()
    koa.use(ctx => {
      ctx.req.socket.writable = false
      ctx.res.status = 204
      ctx.out.writeHead = ctx.out.end = () => {
        throw new Error("response sent")
      }
    })
    setImmediate(done)
    request(koa.callback())
      .get("/")
      .end(() => {})
  })
  it("should set development env when NODE_ENV missing", () => {
    const NODE_ENV = process.env["NODE_ENV"]
    process.env["NODE_ENV"] = ""
    const koa = qx.newKoa()
    process.env["NODE_ENV"] = NODE_ENV
    expect(koa.env).toBe("development")
  })
  it("should set env from the constructor", () => {
    const env = "custom"
    const koa = qx.newKoa({ env })
    expect(koa.env).toBe(env)
  })
  it("should set proxy flag from the constructor", () => {
    const proxy = true
    const koa = qx.newKoa({ proxy })
    expect(koa.proxy).toBe(proxy)
  })
  it("should set signed cookie keys from the constructor", () => {
    const keys = ["customkey"]
    const koa = qx.newKoa({ keys })
    expect(koa.keys).toBe(keys)
  })
  it("should set subdomOffset from the constructor", () => {
    const subdomOffset = 3
    const koa = qx.newKoa({ subdomOffset })
    expect(koa.subdomOffset).toBe(subdomOffset)
  })
  it("should have a static property exporting `HttpError` from http-errors library", () => {
    expect(qx.HttpError).not.toBe(undefined)
    expect(qx.HttpError).toBe(HttpError)
    expect(() => {
      throw new HttpError(500)
    }).toThrow(HttpError)
  })
})
const koa = qx.newKoa()
describe("koa.inspect()", () => {
  it("should work", () => {
    const str = util.inspect(koa)
    expect("{ subdomOffset: 2, proxy: false, env: 'test' }").toBe(str)
  })
  it("should return a json representation", () => {
    expect(koa.inspect()).toEqual({
      subdomOffset: 2,
      proxy: false,
      env: "test",
    })
  })
})
describe("koa.onerror(err)", () => {
  afterEach(mm.restore)
  it("should throw an error if a non-error is given", () => {
    const koa = qx.newKoa()
    expect(() => {
      koa.onerror("foo")
    }).toThrow(TypeError, "non-error thrown: foo")
  })
  it("should accept errors coming from other scopes", () => {
    const ExternError = require("vm").runInNewContext("Error")
    const koa = qx.newKoa()
    const error = Object.assign(new ExternError("boom"), {
      status: 418,
      expose: true,
    })
    expect(() => koa.onerror(error)).not.toThrow()
  })
  it("should do nothing if status is 404", () => {
    const koa = qx.newKoa()
    const e = new HttpError()
    e.status = 404
    let called = false
    mm(console, "error", () => {
      called = true
    })
    koa.onerror(e)
    expect(!called).toBe(true)
  })
  it("should do nothing if .silent", () => {
    const koa = qx.newKoa({ silent: true })
    const e = new HttpError()
    let called = false
    mm(console, "error", () => {
      called = true
    })
    koa.onerror(e)
    expect(!called).toBe(true)
  })
  it("should log the error to stderr", () => {
    const koa = qx.newKoa({ env: "dev" })
    const e = new HttpError()
    e.stack = "Foo"
    let msg = ""
    mm(console, "error", (x: string) => {
      if (x) msg = x
    })
    koa.onerror(e)
    expect(msg).toBe("\n  Foo\n")
  })
  it("should use err.toString() instead of err.stack", () => {
    const koa = qx.newKoa({ env: "dev" })
    const e = new HttpError("mock stack null")
    e.stack = null
    koa.onerror(e)
    let msg = ""
    mm(console, "error", x => {
      if (x) msg = x
    })
    koa.onerror(e)
    expect(msg).toBe("\n  Error: mock stack null\n")
  })
})
describe("koa.request", () => {
  const app1 = qx.newKoa()
  app1.request.message = "hello"
  const app2 = qx.newKoa()
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx["request"].message).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx["request"].message).toBe(undefined)
      ctx.res.status = 204
    })
    return request(app2.listen()).get("/").expect(204)
  })
})
describe("koa.respond", () => {
  describe("when ctx.respond === false", () => {
    it("should function (ctx)", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
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
      const s = koa.listen()
      return request(s).get("/").expect(200).expect("lol")
    })
    it("should ignore set header after header sent", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = "Hello"
        ctx.respond = false
        const x = ctx.out
        x.statusCode = 200
        x.setHeader("Content-Type", "text/plain")
        x.setHeader("Content-Length", "3")
        x.end("lol")
        ctx.res.set("foo", "bar")
      })
      const s = koa.listen()
      return request(s)
        .get("/")
        .expect(200)
        .expect("lol")
        .expect(res => {
          expect(!res.headers.foo).toBe(true)
        })
    })
    it("should ignore set status after header sent", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = "Hello"
        ctx.respond = false
        const x = ctx.out
        x.statusCode = 200
        x.setHeader("Content-Type", "text/plain")
        x.setHeader("Content-Length", "3")
        x.end("lol")
        ctx.res.status = 201
      })
      const s = koa.listen()
      return request(s).get("/").expect(200).expect("lol")
    })
  })
  describe("when res.type === null", () => {
    it("should not send Content-Type header", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = ""
        x.type = null
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(200)
      expect(y.headers.hasOwnProperty("Content-Type")).toBe(false)
    })
  })
  describe("when HEAD is used", () => {
    it("should not respond with the body", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = "Hello"
      })
      const s = koa.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("text/plain; charset=utf-8")
      expect(y.headers["content-length"]).toBe("5")
      expect(!y.text).toBe(true)
    })
    it("should keep json headers", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = { hello: "world" }
      })
      const s = koa.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("application/json; charset=utf-8")
      expect(y.headers["content-length"]).toBe("17")
      expect(!y.text).toBe(true)
    })
    it("should keep string headers", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = "hello world"
      })
      const s = koa.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("text/plain; charset=utf-8")
      expect(y.headers["content-length"]).toBe("11")
      expect(!y.text).toBe(true)
    })
    it("should keep buffer headers", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = Buffer.from("hello world")
      })
      const s = koa.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.headers["content-type"]).toBe("application/octet-stream")
      expect(y.headers["content-length"]).toBe("11")
      expect(!y.text).toBe(true)
    })
    it("should keep stream header if set manually", async () => {
      const koa = qx.newKoa()
      const { length } = fs.readFileSync("package.json")
      koa.use(ctx => {
        const x = ctx.res
        x.length = length
        x.body = fs.createReadStream("package.json")
      })
      const s = koa.listen()
      const y = await request(s).head("/").expect(200)
      expect(y.header["content-length"]).toBe(length)
      expect(!y.text).toBe(true)
    })
    it("should respond with a 404 if no body was set", () => {
      const koa = qx.newKoa()
      koa.use(_ => {})
      const s = koa.listen()
      return request(s).head("/").expect(404)
    })
    it('should respond with a 200 if body = ""', () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = ""
      })
      const s = koa.listen()
      return request(s).head("/").expect(200)
    })
    it("should not overwrite the content-type", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.status = 200
        x.type = "application/javascript"
      })
      const s = koa.listen()
      return request(s)
        .head("/")
        .expect("content-type", /application\/javascript/)
        .expect(200)
    })
  })
  describe("when no middleware is present", () => {
    it("should 404", () => {
      const koa = qx.newKoa()
      const s = koa.listen()
      return request(s).get("/").expect(404)
    })
  })
  describe("when res has already been written to", () => {
    it("should not cause an koa error", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.out
        ctx.res.status = 200
        x.setHeader("Content-Type", "text/html")
        x.write("Hello")
      })
      koa.emitter.on("error", err => {
        throw err
      })
      const s = koa.listen()
      return request(s).get("/").expect(200)
    })
    it("should send the right body", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
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
      const s = koa.listen()
      return request(s).get("/").expect(200).expect("HelloGoodbye")
    })
  })
  describe("when .body is missing", () => {
    describe("with status=400", () => {
      it("should respond with the associated status message", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.res.status = 400
        })
        const s = koa.listen()
        return request(s)
          .get("/")
          .expect(400)
          .expect("Content-Length", "11")
          .expect("Bad Request")
      })
    })
    describe("with status=204", () => {
      it("should respond without a body", async () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.res.status = 204
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(204).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with status=205", () => {
      it("should respond without a body", async () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.res.status = 205
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(205).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with status=304", () => {
      it("should respond without a body", async () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.res.status = 304
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(304).expect("")
        expect(y.headers.hasOwnProperty("content-type")).toBe(false)
      })
    })
    describe("with custom status=700", () => {
      it("should respond with the associated status message", async () => {
        const koa = qx.newKoa()
        statuses.message[700] = "custom status"
        koa.use(ctx => {
          ctx.res.status = 700
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(700).expect("custom status")
        expect(y.statusMessage).toBe("custom status")
      })
    })
    describe("with custom statusMessage=ok", () => {
      it("should respond with the custom status message", async () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.res.status = 200
          ctx.res.message = "ok"
        })
        const s = koa.listen()
        const y = await request(s).get("/").expect(200).expect("ok")
        expect(y.statusMessage).toBe("ok")
      })
    })
    describe("with custom status without message", () => {
      it("should respond with the status code number", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          ctx.out.statusCode = 701
        })
        const s = koa.listen()
        return request(s).get("/").expect(701).expect("701")
      })
    })
  })
  describe("when .body is a null", () => {
    it("should respond 204 by default", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = null
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(204).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 204 with status=200", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.status = 200
        ctx.res.body = null
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(204).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 205 with status=205", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.status = 205
        ctx.res.body = null
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(205).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
    it("should respond 304 with status=304", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.status = 304
        ctx.res.body = null
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(304).expect("")
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
  describe("when .body is a string", () => {
    it("should respond", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = "Hello"
      })
      const s = koa.listen()
      return request(s).get("/").expect("Hello")
    })
  })
  describe("when .body is a Buffer", () => {
    it("should respond", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = Buffer.from("Hello")
      })
      const s = koa.listen()
      return request(s).get("/").expect(200).expect(Buffer.from("Hello"))
    })
  })
  describe("when .body is a Stream", () => {
    it("should respond", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = koa.listen()
      const y = await request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(false)
      expect(y.body).toEqual(pkg)
    })
    it("should strip content-length when overwriting", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = "hello"
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = koa.listen()
      const y = await request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(false)
      expect(y.body).toEqual(pkg)
    })
    it("should keep content-length if not overwritten", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.length = fs.readFileSync("package.json").length
        x.body = fs.createReadStream("package.json")
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = koa.listen()
      const y = await request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(true)
      expect(y.body).toEqual(pkg)
    })
    it("should keep content-length if overwritten with the same stream", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.length = fs.readFileSync("package.json").length
        const stream = fs.createReadStream("package.json")
        x.body = stream
        x.body = stream
        x.set("Content-Type", "application/json; charset=utf-8")
      })
      const s = koa.listen()
      const y = await request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
      const pkg = require("../../package")
      expect(y.headers.hasOwnProperty("content-length")).toBe(true)
      expect(y.body).toEqual(pkg)
    })
    it("should handle errors", done => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.set("Content-Type", "application/json; charset=utf-8")
        x.body = fs.createReadStream("does not exist")
      })
      const s = koa.listen()
      request(s)
        .get("/")
        .expect("Content-Type", "text/plain; charset=utf-8")
        .expect(404)
        .end(done)
    })
    it("should handle errors when no content status", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.status = 204
        x.body = fs.createReadStream("does not exist")
      })
      const s = koa.listen()
      return request(s).get("/").expect(204)
    })
    it("should handle all intermediate stream body errors", done => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = fs.createReadStream("does not exist")
        x.body = fs.createReadStream("does not exist")
        x.body = fs.createReadStream("does not exist")
      })
      const s = koa.listen()
      request(s).get("/").expect(404).end(done)
    })
  })
  describe("when .body is an Object", () => {
    it("should respond with json", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        ctx.res.body = { hello: "world" }
      })
      const s = koa.listen()
      return request(s)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect('{"hello":"world"}')
    })
    describe("and headers sent", () => {
      it("should respond with json body and headers", () => {
        const koa = qx.newKoa()
        koa.use(ctx => {
          const x = ctx.res
          x.length = 17
          x.type = "json"
          x.set("foo", "bar")
          x.flushHeaders()
          x.body = { hello: "world" }
        })
        const s = koa.listen()
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
    it('should emit "error" on the koa', done => {
      const koa = qx.newKoa()
      koa.use(_ => {
        throw new Error("boom")
      })
      koa.emitter.on("error", err => {
        expect(err.message).toBe("boom")
        done()
      })
      request(koa.callback())
        .get("/")
        .end(() => {})
    })
    describe("with an .expose property", () => {
      it("should expose the message", () => {
        const koa = qx.newKoa()
        koa.use(_ => {
          const e = new HttpError("sorry!")
          e.status = 403
          e.expose = true
          throw e
        })
        return request(koa.callback()).get("/").expect(403, "sorry!")
      })
    })
    describe("with a .status property", () => {
      it("should respond with .status", () => {
        const koa = qx.newKoa()
        koa.use(_ => {
          const e = new HttpError("s3 explodes")
          e.status = 403
          throw e
        })
        return request(koa.callback()).get("/").expect(403, "Forbidden")
      })
    })
    it("should respond with 500", () => {
      const koa = qx.newKoa()
      koa.use(_ => {
        throw new Error("boom!")
      })
      const s = koa.listen()
      return request(s).get("/").expect(500, "Internal Server Error")
    })
    it("should be catchable", () => {
      const koa = qx.newKoa()
      koa.use(async (ctx, next) => {
        try {
          await next()
          ctx.res.body = "Hello"
        } catch (e) {
          ctx.res.body = "Got error"
        }
      })
      koa.use(_ => {
        throw new Error("boom!")
      })
      const s = koa.listen()
      return request(s).get("/").expect(200, "Got error")
    })
  })
  describe("when status and body property", () => {
    it("should 200", () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.status = 304
        x.body = "hello"
        x.status = 200
      })
      const s = koa.listen()
      return request(s).get("/").expect(200).expect("hello")
    })
    it("should 204", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.status = 200
        x.body = "hello"
        x.set("content-type", "text/plain; charset=utf8")
        x.status = 204
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(204)
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
  describe("with explicit null body", () => {
    it("should preserve given status", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = null
        x.status = 404
      })
      const s = koa.listen()
      return request(s).get("/").expect(404).expect("").expect({})
    })
    it("should respond with correct headers", async () => {
      const koa = qx.newKoa()
      koa.use(ctx => {
        const x = ctx.res
        x.body = null
        x.status = 401
      })
      const s = koa.listen()
      const y = await request(s).get("/").expect(401).expect("").expect({})
      expect(y.headers.hasOwnProperty("content-type")).toBe(false)
    })
  })
})
describe("koa.response", () => {
  const app1 = qx.newKoa()
  app1.res.msg = "hello"
  const app2 = qx.newKoa()
  const app3 = qx.newKoa()
  const app4 = qx.newKoa()
  const app5 = qx.newKoa()
  it("should merge properties", () => {
    app1.use(ctx => {
      expect(ctx.res.msg).toBe("hello")
      ctx.res.status = 204
    })
    return request(app1.listen()).get("/").expect(204)
  })
  it("should not affect the original prototype", () => {
    app2.use(ctx => {
      expect(ctx["response"].msg).toBe(undefined)
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
describe("koa.toJSON()", () => {
  it("should work", () => {
    const koa = qx.newKoa()
    const x = koa.toJSON()
    expect({
      subdomOffset: 2,
      proxy: false,
      env: "test",
    }).toEqual(x)
  })
})
describe("koa.use(fn)", () => {
  it("should compose middleware", async () => {
    const koa = qx.newKoa()
    const ys: number[] = []
    koa.use(async (_, next) => {
      ys.push(1)
      await next()
      ys.push(6)
    })
    koa.use(async (_, next) => {
      ys.push(2)
      await next()
      ys.push(5)
    })
    koa.use(async (_, next) => {
      ys.push(3)
      await next()
      ys.push(4)
    })
    const s = koa.listen()
    await request(s).get("/").expect(404)
    expect(ys).toEqual([1, 2, 3, 4, 5, 6])
  })
  it("should catch thrown errors in non-async functions", () => {
    const koa = qx.newKoa()
    koa.use(ctx => ctx.throw("Not Found", 404))
    return request(koa.callback()).get("/").expect(404)
  })
})
describe("compose", () => {
  it("should work", async () => {
    const stack: qt.Plugin[] = []
    const ys: number[] = []
    stack.push(async (_, next) => {
      ys.push(1)
      await wait(1)
      await next()
      await wait(1)
      ys.push(6)
    })
    stack.push(async (_, next) => {
      ys.push(2)
      await wait(1)
      await next()
      await wait(1)
      ys.push(5)
    })
    stack.push(async (_, next) => {
      ys.push(3)
      await wait(1)
      await next()
      await wait(1)
      ys.push(4)
    })
    await qx.compose(stack)({} as qt.Context)
    expect(ys).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]))
  })
  it("should be callable twice", async () => {
    type S = qt.State
    type C = { ys: number[] }
    const stack: qt.Plugin<S, C>[] = []
    stack.push(async (ctx, next) => {
      ctx.ys.push(1)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(6)
    })
    stack.push(async (ctx, next) => {
      ctx.ys.push(2)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(5)
    })
    stack.push(async (ctx, next) => {
      ctx.ys.push(3)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(4)
    })
    const p = qx.compose(stack)
    const ctx1: C = { ys: [] }
    const ctx2: C = { ys: [] }
    const ys = [1, 2, 3, 4, 5, 6]
    await p(ctx1 as qt.Context<S, C>)
    expect(ctx1.ys).toEqual(ys)
    await p(ctx2 as qt.Context<S, C>)
    expect(ctx2.ys).toEqual(ys)
  })
  it("should only accept an array", () => {
    let y
    try {
      expect(qx.compose()).toThrow()
    } catch (e) {
      y = e
    }
    return expect(y).toBeInstanceOf(TypeError)
  })
  it("should create nexts to return a Promise", () => {
    const stack: qt.Plugin[] = []
    const ys: Promise<any>[] = []
    for (let i = 0; i < 5; i++) {
      stack.push((_, next) => {
        ys.push(next())
      })
    }
    qx.compose(stack)({} as qt.Context)
    for (const y of ys) {
      expect(typeof y.then).toBe("function")
    }
  })
  it("should work with 0 plugins", () => {
    return qx.compose([])({})
  })
  it("should only accept functions", () => {
    let y
    try {
      expect(qx.compose([{} as qt.Servlet])).toThrow()
    } catch (e) {
      y = e
    }
    return expect(y).toBeInstanceOf(TypeError)
  })
  it("should work when yielding at the end of the stack", async () => {
    const stack: qt.Plugin[] = []
    let y = false
    stack.push(async (_, next) => {
      await next()
      y = true
    })
    await qx.compose(stack)({} as qt.Context)
    expect(y).toBe(true)
  })
  it("should reject on errors in plugin", async () => {
    const stack: qt.Plugin[] = []
    stack.push(() => {
      throw new Error()
    })
    try {
      await qx.compose(stack)({} as qt.Context)
      throw new Error("promise was not rejected")
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
  it("should work when yielding at the end of the stack with yield*", () => {
    const stack: qt.Plugin[] = []
    stack.push(async (_, next) => {
      await next
    })
    return qx.compose(stack)({} as qt.Context)
  })
  it("should keep the context", () => {
    const stack: qt.Plugin[] = []
    const y = {} as qt.Context
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    return qx.compose(stack)(y)
  })
  it("should catch downstream errors", async () => {
    const stack: qt.Plugin[] = []
    const ys: number[] = []
    stack.push(async (_, next) => {
      ys.push(1)
      try {
        ys.push(6)
        await next()
        ys.push(7)
      } catch (e) {
        ys.push(2)
      }
      ys.push(3)
    })
    stack.push(async _ => {
      ys.push(4)
      throw new Error()
    })
    await qx.compose(stack)({} as qt.Context)
    expect(ys).toEqual([1, 6, 4, 2, 3])
  })
  it("should compose w/ next", async () => {
    let y = false
    await qx.compose([])({}, async () => {
      y = true
    })
    expect(y).toBe(true)
  })
  it("should handle errors in wrapped non-async functions", async () => {
    const stack: qt.Plugin[] = []
    stack.push(() => {
      throw new Error()
    })
    try {
      await qx.compose(stack)({} as qt.Context)
      throw new Error("promise was not rejected")
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
  it("should compose w/ other compositions", () => {
    const ys: number[] = []
    return qx
      .compose([
        qx.compose([
          (_, next) => {
            ys.push(1)
            return next()
          },
          (_, next) => {
            ys.push(2)
            return next()
          },
        ]),
        (_, next) => {
          ys.push(3)
          return next()
        },
      ])({} as qt.Context, async () => {})
      .then(() => expect(ys).toEqual([1, 2, 3]))
  })
  it("should throw if next() is called multiple times", () => {
    return qx
      .compose([
        async (_, next) => {
          await next()
          await next()
        },
      ])({})
      .then(
        () => {
          throw new Error("boom")
        },
        e => {
          expect(/multiple times/.test(e.message)).toBe(true)
        }
      )
  })
  it("should return a valid plugin", () => {
    let y = 0
    return qx
      .compose([
        qx.compose([
          (_, next) => {
            y++
            return next()
          },
          (_, next) => {
            y++
            return next()
          },
        ]),
        (_, next) => {
          y++
          return next()
        },
      ])({} as qt.Context, async () => {})
      .then(() => {
        expect(y).toEqual(3)
      })
  })
  it("should return last return value", async () => {
    const stack: qt.Plugin[] = []
    stack.push(async (_, next) => {
      const y = await next()
      expect(y).toEqual(2)
      return 1
    })
    stack.push(async (_, next) => {
      const y = await next()
      expect(y).toEqual(0)
      return 2
    })
    const y = await qx.compose(stack)({} as qt.Context, async () => 0)
    expect(y).toEqual(1)
  })
  it("should not affect the original plugin array", () => {
    const stack: qt.Plugin[] = []
    const p: qt.Plugin = (_, next) => {
      return next()
    }
    stack.push(p)
    for (const x of stack) {
      expect(x).toBe(p)
    }
    qx.compose(stack)
    for (const x of stack) {
      expect(x).toBe(p)
    }
  })
  it("should not get stuck on the passed in next", async () => {
    type S = qt.State
    type C = { count: number; next: number }
    const stack: qt.Plugin<S, C>[] = [
      (ctx, next) => {
        ctx.count++
        return next()
      },
    ]
    const y = {
      count: 0,
      next: 0,
    }
    await qx.compose(stack)(y as qt.Context<S, C>, (ctx, next: qt.Next) => {
      ctx.next++
      return next()
    })
    expect(y).toEqual({ count: 1, next: 1 })
  })
})
