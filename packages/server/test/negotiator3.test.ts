import { Headers, newNegotiator } from "../server"
import * as qt from "../types"

type N = ReturnType<typeof newNegotiator>
function whenAccept(x: string | undefined, f: (n: N) => void) {
  const title = !x ? "when no Accept" : "when Accept: " + x
  const request = (x: Record<string, qt.Stringy | undefined>) => {
    const y = { headers: {} as Headers }
    if (x) {
      Object.keys(x).forEach(k => {
        y.headers[k.toLowerCase()] = x[k]
      })
    }
    return y
  }
  describe(`${title}`, () => {
    f(newNegotiator(request({ "Accept-Language": x })))
  })
}
describe("negotiator.language()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return *", () => {
      expect(n.languages()[0]).toBe("*")
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *2", () => {
      expect(n.languages()[0]).toBe("*")
    })
  })
  whenAccept("*, en", (n: N) => {
    it("should return *3", () => {
      expect(n.languages()[0]).toBe("*")
    })
  })
  whenAccept("*, en;q=0", (n: N) => {
    it("should return *4", () => {
      expect(n.languages()[0]).toBe("*")
    })
  })
  whenAccept("*;q=0.8, en, es", (n: N) => {
    it("should return en", () => {
      expect(n.languages()[0]).toBe("en")
    })
  })
  whenAccept("en", (n: N) => {
    it("should en", () => {
      expect(n.languages()[0]).toBe("en")
    })
  })
  whenAccept("en;q=0", (n: N) => {
    it("should return undefined", () => {
      expect(n.languages()).toEqual([])
    })
  })
  whenAccept("en;q=0.8, es", (n: N) => {
    it("should return es", () => {
      expect(n.languages()[0]).toBe("es")
    })
  })
  whenAccept("en;q=0.9, es;q=0.8, en;q=0.7", (n: N) => {
    it("should return en2", () => {
      expect(n.languages()[0]).toBe("en")
    })
  })
  whenAccept("en-US, en;q=0.8", (n: N) => {
    it("should return en-US", () => {
      expect(n.languages()[0]).toBe("en-US")
    })
  })
  whenAccept("en-US, en-GB", (n: N) => {
    it("should return en-US2", () => {
      expect(n.languages()[0]).toBe("en-US")
    })
  })
  whenAccept("en-US;q=0.8, es", (n: N) => {
    it("should return es2", () => {
      expect(n.languages()[0]).toBe("es")
    })
  })
  whenAccept("nl;q=0.5, fr, de, en, it, es, pt, no, se, fi, ro", (n: N) => {
    it("should return fr", () => {
      expect(n.languages()[0]).toBe("fr")
    })
  })
})
describe("negotiator.language(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return undefined for empty list", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return first language in list", () => {
      expect(n.languages(["en"])[0]).toBe("en")
      expect(n.languages(["es", "en"])[0]).toBe("es")
    })
  })
  whenAccept("*", (n: N) => {
    it("should return undefined for empty list2", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return first language in list2", () => {
      expect(n.languages(["en"])[0]).toBe("en")
      expect(n.languages(["es", "en"])[0]).toBe("es")
    })
  })
  whenAccept("*, en", (n: N) => {
    it("should return undefined for empty list3", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return most preferred language", () => {
      expect(n.languages(["en"])[0]).toBe("en")
      expect(n.languages(["es", "en"])[0]).toBe("en")
    })
  })
  whenAccept("*, en;q=0", (n: N) => {
    it("should return undefined for empty list4", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should exclude en", () => {
      expect(n.languages(["en"])).toEqual([])
      expect(n.languages(["es", "en"])[0]).toBe("es")
    })
  })
  whenAccept("*;q=0.8, en, es", (n: N) => {
    it("should prefer en and es over everything", () => {
      expect(n.languages(["en", "nl"])[0]).toBe("en")
      expect(n.languages(["ro", "nl"])[0]).toBe("ro")
    })
  })
  whenAccept("en", (n: N) => {
    it("should return undefined for empty list5", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return preferred langauge", () => {
      expect(n.languages(["en"])[0]).toBe("en")
      expect(n.languages(["es", "en"])[0]).toBe("en")
    })
    it("should accept en-US, preferring en over en-US", () => {
      expect(n.languages(["en-US"])[0]).toBe("en-US")
      expect(n.languages(["en-US", "en"])[0]).toBe("en")
      expect(n.languages(["en", "en-US"])[0]).toBe("en")
    })
  })
  whenAccept("en;q=0", (n: N) => {
    it("should return undefined for empty list6", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return preferred langauge2", () => {
      expect(n.languages(["es", "en"])).toEqual([])
    })
  })
  whenAccept("en;q=0.8, es", (n: N) => {
    it("should return undefined for empty list7", () => {
      expect(n.languages([])).toEqual([])
    })
    it("should return preferred langauge3", () => {
      expect(n.languages(["en"])[0]).toBe("en")
      expect(n.languages(["en", "es"])[0]).toBe("es")
    })
  })
  whenAccept("en;q=0.9, es;q=0.8, en;q=0.7", (n: N) => {
    it("should use highest perferred order on duplicate", () => {
      expect(n.languages(["es"])[0]).toBe("es")
      expect(n.languages(["en", "es"])[0]).toBe("en")
      expect(n.languages(["es", "en"])[0]).toBe("en")
    })
  })
  whenAccept("en-US, en;q=0.8", (n: N) => {
    it("should use prefer en-US over en", () => {
      expect(n.languages(["en", "en-US"])[0]).toBe("en-US")
      expect(n.languages(["en-GB", "en-US"])[0]).toBe("en-US")
      expect(n.languages(["en-GB", "es"])[0]).toBe("en-GB")
    })
  })
  whenAccept("en-US, en-GB", (n: N) => {
    it("should prefer en-US", () => {
      expect(n.languages(["en-US", "en-GB"])[0]).toBe("en-US")
      expect(n.languages(["en-GB", "en-US"])[0]).toBe("en-US")
    })
  })
  whenAccept("en-US;q=0.8, es", (n: N) => {
    it("should prefer es over en-US", () => {
      expect(n.languages(["es", "en-US"])[0]).toBe("es")
      expect(n.languages(["en-US", "es"])[0]).toBe("es")
      expect(n.languages(["en-US", "en"])[0]).toBe("en-US")
    })
  })
  whenAccept("nl;q=0.5, fr, de, en, it, es, pt, no, se, fi, ro", (n: N) => {
    it("should use prefer fr over nl", () => {
      expect(n.languages(["nl", "fr"])[0]).toBe("fr")
    })
  })
})
describe("negotiator.languages()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return *", () => {
      expect(n.languages()).toEqual(["*"])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *2", () => {
      expect(n.languages()).toEqual(["*"])
    })
  })
  whenAccept("*, en", (n: N) => {
    it("should return *, en", () => {
      expect(n.languages()).toEqual(["*", "en"])
    })
  })
  whenAccept("*, en;q=0", (n: N) => {
    it("should return *3", () => {
      expect(n.languages()).toEqual(["*"])
    })
  })
  whenAccept("*;q=0.8, en, es", (n: N) => {
    it("should return preferred languages", () => {
      expect(n.languages()).toEqual(["en", "es", "*"])
    })
  })
  whenAccept("en", (n: N) => {
    it("should return preferred languages2", () => {
      expect(n.languages()).toEqual(["en"])
    })
  })
  whenAccept("en;q=0", (n: N) => {
    it("should return empty list", () => {
      expect(n.languages()).toEqual([])
    })
  })
  whenAccept("en;q=0.8, es", (n: N) => {
    it("should return preferred languages3", () => {
      expect(n.languages()).toEqual(["es", "en"])
    })
  })
  whenAccept("en;q=0.9, es;q=0.8, en;q=0.7", (n: N) => {
    it.skip("should use highest perferred order on duplicate", () => {
      expect(n.languages()).toEqual(["en", "es"])
    })
  })
  whenAccept("en-US, en;q=0.8", (n: N) => {
    it("should return en-US, en", () => {
      expect(n.languages()).toEqual(["en-US", "en"])
    })
  })
  whenAccept("en-US, en-GB", (n: N) => {
    it("should return en-US, en-GB", () => {
      expect(n.languages()).toEqual(["en-US", "en-GB"])
    })
  })
  whenAccept("en-US;q=0.8, es", (n: N) => {
    it("should return es, en-US", () => {
      expect(n.languages()).toEqual(["es", "en-US"])
    })
  })
  whenAccept("en-US;foo=bar;q=1, en-GB;q=1", (n: N) => {
    it("should return en-US, en-GB2", () => {
      expect(n.languages()).toEqual(["en-US", "en-GB"])
    })
  })
  whenAccept("nl;q=0.5, fr, de, en, it, es, pt, no, se, fi, ro", (n: N) => {
    it("should use prefer fr over nl", () => {
      expect(n.languages()).toEqual([
        "fr",
        "de",
        "en",
        "it",
        "es",
        "pt",
        "no",
        "se",
        "fi",
        "ro",
        "nl",
      ])
    })
  })
})
describe("negotiator.languages(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return original list", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["es", "en"])).toEqual(["es", "en"])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return original list2", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["es", "en"])).toEqual(["es", "en"])
    })
  })
  whenAccept("*, en", (n: N) => {
    it("should return list in client-preferred order", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["es", "en"])).toEqual(["en", "es"])
    })
  })
  whenAccept("*, en;q=0", (n: N) => {
    it("should exclude en", () => {
      expect(n.languages(["en"])).toEqual([])
      expect(n.languages(["es", "en"])).toEqual(["es"])
    })
  })
  whenAccept("*;q=0.8, en, es", (n: N) => {
    it("should return preferred languages", () => {
      expect(
        n.languages([
          "fr",
          "de",
          "en",
          "it",
          "es",
          "pt",
          "no",
          "se",
          "fi",
          "ro",
          "nl",
        ])
      ).toEqual([
        "en",
        "es",
        "fr",
        "de",
        "it",
        "pt",
        "no",
        "se",
        "fi",
        "ro",
        "nl",
      ])
    })
  })
  whenAccept("en", (n: N) => {
    it("should return preferred languages2", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["en", "es"])).toEqual(["en"])
      expect(n.languages(["es", "en"])).toEqual(["en"])
    })
    it("should accept en-US, preferring en over en-US", () => {
      expect(n.languages(["en-US"])).toEqual(["en-US"])
      expect(n.languages(["en-US", "en"])).toEqual(["en", "en-US"])
      expect(n.languages(["en", "en-US"])).toEqual(["en", "en-US"])
    })
  })
  whenAccept("en;q=0", (n: N) => {
    it("should return nothing", () => {
      expect(n.languages(["en"])).toEqual([])
      expect(n.languages(["en", "es"])).toEqual([])
    })
  })
  whenAccept("en;q=0.8, es", (n: N) => {
    it("should return preferred languages3", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["en", "es"])).toEqual(["es", "en"])
      expect(n.languages(["es", "en"])).toEqual(["es", "en"])
    })
  })
  whenAccept("en;q=0.9, es;q=0.8, en;q=0.7", (n: N) => {
    it.skip("should return preferred languages4", () => {
      expect(n.languages(["en"])).toEqual(["en"])
      expect(n.languages(["en", "es"])).toEqual(["es", "en"])
      expect(n.languages(["es", "en"])).toEqual(["es", "en"])
    })
  })
  whenAccept("en-US, en;q=0.8", (n: N) => {
    it("should be case insensitive", () => {
      expect(n.languages(["en-us", "EN"])).toEqual(["en-us", "EN"])
    })
    it("should prefer en-US over en", () => {
      expect(n.languages(["en-US", "en"])).toEqual(["en-US", "en"])
      expect(n.languages(["en-GB", "en-US", "en"])).toEqual([
        "en-US",
        "en",
        "en-GB",
      ])
    })
  })
  whenAccept("en-US, en-GB", (n: N) => {
    it("should prefer en-US over en-GB", () => {
      expect(n.languages(["en-US", "en-GB"])).toEqual(["en-US", "en-GB"])
      expect(n.languages(["en-GB", "en-US"])).toEqual(["en-US", "en-GB"])
    })
  })
  whenAccept("en-US;q=0.8, es", (n: N) => {
    it("should prefer es over en-US", () => {
      expect(n.languages(["en", "es"])).toEqual(["es", "en"])
      expect(n.languages(["en", "es", "en-US"])).toEqual(["es", "en-US", "en"])
    })
  })
  whenAccept("nl;q=0.5, fr, de, en, it, es, pt, no, se, fi, ro", (n: N) => {
    it("should return preferred languages5", () => {
      expect(
        n.languages([
          "fr",
          "de",
          "en",
          "it",
          "es",
          "pt",
          "no",
          "se",
          "fi",
          "ro",
          "nl",
        ])
      ).toEqual([
        "fr",
        "de",
        "en",
        "it",
        "es",
        "pt",
        "no",
        "se",
        "fi",
        "ro",
        "nl",
      ])
    })
  })
})
