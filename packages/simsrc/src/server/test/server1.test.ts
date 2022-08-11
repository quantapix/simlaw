import { newApp, newAcceptor } from "../server"
import * as http from "http"
import * as net from "net"
import * as parseurl from "parseurl"
import * as qt from "../types"
import * as Stream from "stream"
import * as util from "util"

type Input = http.IncomingMessage

function newCtx(headers?: qt.Dict, x: qt.Dict = {}, ps: qt.Dict = {}) {
  const app = newApp(ps)
  const inp = { ...x, headers } as Input
  return app.createContext(inp, new http.ServerResponse(inp))
}
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
    x.acceptor = newAcceptor(x.inp)
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
    const app = newApp()
    app.use(c => (c.res.body = c.req.href))
    app.listen(function (this: http.Server) {
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
