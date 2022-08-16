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
    f(newNegotiator(request({ "Accept-Charset": x })))
  })
}
describe("negotiator.charset()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return *", () => {
      expect(n.charsets()[0]).toBe("*")
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *2", () => {
      expect(n.charsets()[0]).toBe("*")
    })
  })
  whenAccept("*, UTF-8", (n: N) => {
    it("should return *3", () => {
      expect(n.charsets()[0]).toBe("*")
    })
  })
  whenAccept("*, UTF-8;q=0", (n: N) => {
    it("should return *4", () => {
      expect(n.charsets()[0]).toBe("*")
    })
  })
  whenAccept("ISO-8859-1", (n: N) => {
    it("should return ISO-8859-1", () => {
      expect(n.charsets()[0]).toBe("ISO-8859-1")
    })
  })
  whenAccept("UTF-8;q=0", (n: N) => {
    it("should return undefined", () => {
      expect(n.charsets()).toEqual([])
    })
  })
  whenAccept("UTF-8, ISO-8859-1", (n: N) => {
    it("should return UTF-8", () => {
      expect(n.charsets()[0]).toBe("UTF-8")
    })
  })
  whenAccept("UTF-8;q=0.8, ISO-8859-1", (n: N) => {
    it("should return ISO-8859-1 2", () => {
      expect(n.charsets()[0]).toBe("ISO-8859-1")
    })
  })
  whenAccept("UTF-8;q=0.9, ISO-8859-1;q=0.8, UTF-8;q=0.7", (n: N) => {
    it("should return UTF-82", () => {
      expect(n.charsets()[0]).toBe("UTF-8")
    })
  })
})
describe("negotiator.charset(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return undefined for empty list", () => {
      expect(n.charsets([])).toEqual([])
    })
    it("should return first type in list", () => {
      expect(n.charsets(["UTF-8"])[0]).toBe("UTF-8")
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("UTF-8")
    })
  })
  whenAccept("*", (n: N) => {
    it("should return undefined for empty list2", () => {
      expect(n.charsets([])).toEqual([])
    })
    it("should return first type in list2", () => {
      expect(n.charsets(["UTF-8"])[0]).toBe("UTF-8")
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("UTF-8")
    })
  })
  whenAccept("*, UTF-8", (n: N) => {
    it("should return first type in list3", () => {
      expect(n.charsets(["UTF-8"])[0]).toBe("UTF-8")
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("UTF-8")
    })
  })
  whenAccept("*, UTF-8;q=0", (n: N) => {
    it("should return most client-preferred charset", () => {
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("ISO-8859-1")
    })
    it("should exclude UTF-8", () => {
      expect(n.charsets(["UTF-8"])).toEqual([])
    })
  })
  whenAccept("ISO-8859-1", (n: N) => {
    it("should return matching charset", () => {
      expect(n.charsets(["ISO-8859-1"])[0]).toBe("ISO-8859-1")
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("ISO-8859-1")
    })
    it("should be case insensitive, returning provided casing", () => {
      expect(n.charsets(["iso-8859-1"])[0]).toBe("iso-8859-1")
      expect(n.charsets(["iso-8859-1", "ISO-8859-1"])[0]).toBe("iso-8859-1")
      expect(n.charsets(["ISO-8859-1", "iso-8859-1"])[0]).toBe("ISO-8859-1")
    })
    it("should return undefined when no matching charsets", () => {
      expect(n.charsets(["utf-8"])).toEqual([])
    })
  })
  whenAccept("UTF-8;q=0", (n: N) => {
    it("should always return undefined", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual([])
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])).toEqual([])
      expect(n.charsets(["KOI8-R"])).toEqual([])
    })
  })
  whenAccept("UTF-8, ISO-8859-1", (n: N) => {
    it("should return first matching charset", () => {
      expect(n.charsets(["ISO-8859-1"])[0]).toBe("ISO-8859-1")
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])[0]).toBe("UTF-8")
    })
    it("should return undefined when no matching charsets2", () => {
      expect(n.charsets(["KOI8-R"])).toEqual([])
    })
  })
  whenAccept("UTF-8;q=0.8, ISO-8859-1", (n: N) => {
    it("should return most client-preferred charset2", () => {
      expect(n.charsets(["ISO-8859-1"])[0]).toBe("ISO-8859-1")
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])[0]).toBe(
        "ISO-8859-1"
      )
      expect(n.charsets(["UTF-8", "KOI8-R"])[0]).toBe("UTF-8")
    })
  })
  whenAccept("UTF-8;q=0.9, ISO-8859-1;q=0.8, UTF-8;q=0.7", (n: N) => {
    it("should use highest perferred order on duplicate", () => {
      expect(n.charsets(["ISO-8859-1"])[0]).toBe("ISO-8859-1")
      expect(n.charsets(["UTF-8", "ISO-8859-1"])[0]).toBe("UTF-8")
      expect(n.charsets(["ISO-8859-1", "UTF-8"])[0]).toBe("UTF-8")
    })
  })
})
describe("negotiator.charsets()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return *", () => {
      expect(n.charsets()).toEqual(["*"])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *2", () => {
      expect(n.charsets()).toEqual(["*"])
    })
  })
  whenAccept("*, UTF-8", (n: N) => {
    it("should return client-preferred charsets", () => {
      expect(n.charsets()).toEqual(["*", "UTF-8"])
    })
  })
  whenAccept("*, UTF-8;q=0", (n: N) => {
    it("should exclude UTF-8", () => {
      expect(n.charsets()).toEqual(["*"])
    })
  })
  whenAccept("UTF-8;q=0", (n: N) => {
    it("should return empty list", () => {
      expect(n.charsets()).toEqual([])
    })
  })
  whenAccept("ISO-8859-1", (n: N) => {
    it("should return client-preferred charsets2", () => {
      expect(n.charsets()).toEqual(["ISO-8859-1"])
    })
  })
  whenAccept("UTF-8, ISO-8859-1", (n: N) => {
    it("should return client-preferred charsets3", () => {
      expect(n.charsets()).toEqual(["UTF-8", "ISO-8859-1"])
    })
  })
  whenAccept("UTF-8;q=0.8, ISO-8859-1", (n: N) => {
    it("should return client-preferred charsets4", () => {
      expect(n.charsets()).toEqual(["ISO-8859-1", "UTF-8"])
    })
  })
  whenAccept("UTF-8;foo=bar;q=1, ISO-8859-1;q=1", (n: N) => {
    it("should return client-preferred charsets5", () => {
      expect(n.charsets()).toEqual(["UTF-8", "ISO-8859-1"])
    })
  })
  whenAccept("UTF-8;q=0.9, ISO-8859-1;q=0.8, UTF-8;q=0.7", (n: N) => {
    it.skip("should use highest perferred order on duplicate", () => {
      expect(n.charsets()).toEqual(["UTF-8", "ISO-8859-1"])
    })
  })
})
describe("negotiator.charsets(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return empty list for empty list", () => {
      expect(n.charsets([])).toEqual([])
    })
    it("should return original list", () => {
      expect(n.charsets(["UTF-8"])).toEqual(["UTF-8"])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return empty list for empty list2", () => {
      expect(n.charsets([])).toEqual([])
    })
    it("should return original list2", () => {
      expect(n.charsets(["UTF-8"])).toEqual(["UTF-8"])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
    })
  })
  whenAccept("*, UTF-8", (n: N) => {
    it("should return matching charsets", () => {
      expect(n.charsets(["UTF-8"])).toEqual(["UTF-8"])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
    })
  })
  whenAccept("*, UTF-8;q=0", (n: N) => {
    it("should exclude UTF-8", () => {
      expect(n.charsets(["UTF-8"])).toEqual([])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual(["ISO-8859-1"])
    })
  })
  whenAccept("UTF-8;q=0", (n: N) => {
    it("should always return empty list", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual([])
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])).toEqual([])
      expect(n.charsets(["KOI8-R"])).toEqual([])
    })
  })
  whenAccept("ISO-8859-1", (n: N) => {
    it("should return matching charsets2", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual(["ISO-8859-1"])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual(["ISO-8859-1"])
    })
    it("should be case insensitive, returning provided casing", () => {
      expect(n.charsets(["iso-8859-1"])).toEqual(["iso-8859-1"])
      expect(n.charsets(["iso-8859-1", "ISO-8859-1"])).toEqual([
        "iso-8859-1",
        "ISO-8859-1",
      ])
      expect(n.charsets(["ISO-8859-1", "iso-8859-1"])).toEqual([
        "ISO-8859-1",
        "iso-8859-1",
      ])
    })
    it("should return empty list when no matching charsets", () => {
      expect(n.charsets(["utf-8"])).toEqual([])
    })
  })
  whenAccept("UTF-8, ISO-8859-1", (n: N) => {
    it("should return matching charsets3", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual(["ISO-8859-1"])
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
    })
    it("should return empty list when no matching charsets2", () => {
      expect(n.charsets(["KOI8-R"])).toEqual([])
    })
  })
  whenAccept("UTF-8;q=0.8, ISO-8859-1", (n: N) => {
    it("should return matching charsets in client-preferred order", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual(["ISO-8859-1"])
      expect(n.charsets(["UTF-8", "KOI8-R", "ISO-8859-1"])).toEqual([
        "ISO-8859-1",
        "UTF-8",
      ])
    })
    it("should return empty list when no matching charsets3", () => {
      expect(n.charsets(["KOI8-R"])).toEqual([])
    })
  })
  whenAccept("UTF-8;q=0.9, ISO-8859-1;q=0.8, UTF-8;q=0.7", (n: N) => {
    it("should use highest perferred order on duplicate", () => {
      expect(n.charsets(["ISO-8859-1"])).toEqual(["ISO-8859-1"])
      expect(n.charsets(["UTF-8", "ISO-8859-1"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
      expect(n.charsets(["ISO-8859-1", "UTF-8"])).toEqual([
        "UTF-8",
        "ISO-8859-1",
      ])
    })
  })
})
