import { newAcceptor } from "../server"
function charset(x?: string) {
  return { headers: { "accept-charset": x } }
}
function encoding(x?: string) {
  return { headers: { "accept-encoding": x } }
}
function language(x?: string) {
  return { headers: { "accept-language": x } }
}
function type(x?: string) {
  return { headers: { accept: x } }
}
describe("accepts.charsets()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Charset is populated", () => {
      it("should return accepted types", () => {
        const req = charset("utf-8, iso-8859-1;q=0.2, utf-7;q=0.5")
        const a = newAcceptor(req)
        expect(a.charsets()).toEqual(["utf-8", "utf-7", "iso-8859-1"])
      })
    })
    describe("when Accept-Charset is not in request", () => {
      it("should return *", () => {
        const req = charset()
        const a = newAcceptor(req)
        expect(a.charsets()).toEqual(["*"])
      })
    })
    describe("when Accept-Charset is empty", () => {
      it("should return an empty array", () => {
        const req = charset("")
        const a = newAcceptor(req)
        expect(a.charsets()).toEqual([])
      })
    })
  })
  describe("with multiple arguments", () => {
    describe("when Accept-Charset is populated", () => {
      describe("if any types match", () => {
        it("should return the best fit", () => {
          const req = charset("utf-8, iso-8859-1;q=0.2, utf-7;q=0.5")
          const a = newAcceptor(req)
          expect(a.charsets("utf-7", "utf-8")).toBe("utf-8")
        })
      })
      describe("if no types match", () => {
        it("should return false", () => {
          const req = charset("utf-8, iso-8859-1;q=0.2, utf-7;q=0.5")
          const a = newAcceptor(req)
          expect(a.charsets("utf-16")).toBe(false)
        })
      })
    })
    describe("when Accept-Charset is not populated", () => {
      it("should return the first type", () => {
        const req = charset()
        const a = newAcceptor(req)
        expect(a.charsets("utf-7", "utf-8")).toBe("utf-7")
      })
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const req = charset("utf-8, iso-8859-1;q=0.2, utf-7;q=0.5")
      const a = newAcceptor(req)
      expect(a.charsets(["utf-7", "utf-8"])).toBe("utf-8")
    })
  })
})
describe("accepts.encodings()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Encoding is populated", () => {
      it("should return accepted types", () => {
        const req = encoding("gzip, compress;q=0.2")
        const a = newAcceptor(req)
        expect(a.encodings()).toEqual(["gzip", "compress", "identity"])
        expect(a.encodings("gzip", "compress")).toBe("gzip")
      })
    })
    describe("when Accept-Encoding is not in request", () => {
      it("should return identity", () => {
        const req = encoding()
        const a = newAcceptor(req)
        expect(a.encodings()).toEqual(["identity"])
        expect(a.encodings("gzip", "deflate", "identity")).toBe("identity")
      })
      describe("when identity is not included", () => {
        it("should return false", () => {
          const req = encoding()
          const a = newAcceptor(req)
          expect(a.encodings("gzip", "deflate")).toBe(false)
        })
      })
    })
    describe("when Accept-Encoding is empty", () => {
      it("should return identity", () => {
        const req = encoding("")
        const a = newAcceptor(req)
        expect(a.encodings()).toEqual(["identity"])
        expect(a.encodings("gzip", "deflate", "identity")).toBe("identity")
      })
      describe("when identity is not included", () => {
        it("should return false", () => {
          const req = encoding("")
          const a = newAcceptor(req)
          expect(a.encodings("gzip", "deflate")).toBe(false)
        })
      })
    })
  })
  describe("with multiple arguments", () => {
    it("should return the best fit", () => {
      const req = encoding("gzip, compress;q=0.2")
      const a = newAcceptor(req)
      expect(a.encodings("compress", "gzip")).toBe("gzip")
      expect(a.encodings("gzip", "compress")).toBe("gzip")
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const req = encoding("gzip, compress;q=0.2")
      const a = newAcceptor(req)
      expect(a.encodings(["compress", "gzip"])).toBe("gzip")
    })
  })
})
describe("accepts.languages()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Language is populated", () => {
      it("should return accepted types", () => {
        const req = language("en;q=0.8, es, pt")
        const a = newAcceptor(req)
        expect(a.languages()).toEqual(["es", "pt", "en"])
      })
    })
    describe("when Accept-Language is not in request", () => {
      it("should return *", () => {
        const req = language()
        const a = newAcceptor(req)
        expect(a.languages()).toEqual(["*"])
      })
    })
    describe("when Accept-Language is empty", () => {
      it("should return an empty array", () => {
        const req = language("")
        const a = newAcceptor(req)
        expect(a.languages()).toEqual([])
      })
    })
  })
  describe("with multiple arguments", () => {
    describe("when Accept-Language is populated", () => {
      describe("if any types types match", () => {
        it("should return the best fit", () => {
          const req = language("en;q=0.8, es, pt")
          const a = newAcceptor(req)
          expect(a.languages("es", "en")).toBe("es")
        })
      })
      describe("if no types match", () => {
        it("should return false", () => {
          const req = language("en;q=0.8, es, pt")
          const a = newAcceptor(req)
          expect(a.languages("fr", "au")).toBe(false)
        })
      })
    })
    describe("when Accept-Language is not populated", () => {
      it("should return the first type", () => {
        const req = language()
        const a = newAcceptor(req)
        expect(a.languages("es", "en")).toBe("es")
      })
    })
  })
  describe("with an array", () => {
    it("should return the best fit", () => {
      const req = language("en;q=0.8, es, pt")
      const a = newAcceptor(req)
      expect(a.languages(["es", "en"])).toBe("es")
    })
  })
})
describe("accepts.types()", () => {
  describe("with no arguments", () => {
    describe("when Accept is populated", () => {
      it("should return all accepted types", () => {
        const req = type("application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain")
        const a = newAcceptor(req)
        expect(a.types()).toEqual(["text/html", "text/plain", "image/jpeg", "application/*"])
      })
    })
    describe("when Accept not in request", () => {
      it("should return */*", () => {
        const req = type()
        const a = newAcceptor(req)
        expect(a.types()).toEqual(["*/*"])
      })
    })
    describe("when Accept is empty", () => {
      it("should return []", () => {
        const req = type("")
        const a = newAcceptor(req)
        expect(a.types()).toEqual([])
      })
    })
  })
  describe("with no valid types", () => {
    describe("when Accept is populated", () => {
      it("should return false", () => {
        const req = type("application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain")
        const a = newAcceptor(req)
        expect(a.types("image/png", "image/tiff")).toBe(false)
      })
    })
    describe("when Accept is not populated", () => {
      it("should return the first type", () => {
        const req = type()
        const a = newAcceptor(req)
        expect(a.types("text/html", "text/plain", "image/jpeg", "application/*")).toBe("text/html")
      })
    })
  })
  describe("when extensions are given", () => {
    it("should convert to mime types", () => {
      const req = type("text/plain, text/html")
      const a = newAcceptor(req)
      expect(a.types("html")).toBe("html")
      expect(a.types(".html")).toBe(".html")
      expect(a.types("txt")).toBe("txt")
      expect(a.types(".txt")).toBe(".txt")
      expect(a.types("png")).toBe(false)
      expect(a.types("bogus")).toBe(false)
    })
  })
  describe("when an array is given", () => {
    it("should return the first match", () => {
      const req = type("text/plain, text/html")
      const a = newAcceptor(req)
      expect(a.types(["png", "text", "html"])).toBe("text")
      expect(a.types(["png", "html"])).toBe("html")
      expect(a.types(["bogus", "html"])).toBe("html")
    })
  })
  describe("when multiple arguments are given", () => {
    it("should return the first match", () => {
      const req = type("text/plain, text/html")
      const a = newAcceptor(req)
      expect(a.types("png", "text", "html")).toBe("text")
      expect(a.types("png", "html")).toBe("html")
      expect(a.types("bogus", "html")).toBe("html")
    })
  })
  describe("when present in Accept as an exact match", () => {
    it("should return the type", () => {
      const req = type("text/plain, text/html")
      const a = newAcceptor(req)
      expect(a.types("text/html")).toBe("text/html")
      expect(a.types("text/plain")).toBe("text/plain")
    })
  })
  describe("when present in Accept as a type match", () => {
    it("should return the type", () => {
      const req = type("application/json, */*")
      const a = newAcceptor(req)
      expect(a.types("text/html")).toBe("text/html")
      expect(a.types("text/plain")).toBe("text/plain")
      expect(a.types("image/png")).toBe("image/png")
    })
  })
  describe("when present in Accept as a subtype match", () => {
    it("should return the type", () => {
      const req = type("application/json, text/*")
      const a = newAcceptor(req)
      expect(a.types("text/html")).toBe("text/html")
      expect(a.types("text/plain")).toBe("text/plain")
      expect(a.types("image/png")).toBe(false)
    })
  })
})
