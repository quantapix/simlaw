import { Headers, newNegotiator } from "../src/koa.js"
import type * as qt from "../src/types.js"

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
function negotiated(n: N, xs: string[] | undefined, ys: string[]) {
  return () => {
    expect(n.types(xs)).toEqual(ys)
  }
}
function preferred(n: N, ys: string[]) {
  return function () {
    expect(n.types()).toEqual(ys)
  }
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
describe("negotiator.encoding()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return identity", () => {
      expect(n.encodings()[0]).toBe("identity")
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *", () => {
      expect(n.encodings()[0]).toBe("*")
    })
  })
  whenAccept("*, gzip", (n: N) => {
    it("should return *2", () => {
      expect(n.encodings()[0]).toBe("*")
    })
  })
  whenAccept("*, gzip;q=0", (n: N) => {
    it("should return *3", () => {
      expect(n.encodings()[0]).toBe("*")
    })
  })
  whenAccept("*;q=0", (n: N) => {
    it("should return undefined", () => {
      expect(n.encodings()).toEqual([])
    })
  })
  whenAccept("*;q=0, identity;q=1", (n: N) => {
    it("should return identity2", () => {
      expect(n.encodings()[0]).toBe("identity")
    })
  })
  whenAccept("identity", (n: N) => {
    it("should return identity3", () => {
      expect(n.encodings()[0]).toBe("identity")
    })
  })
  whenAccept("identity;q=0", (n: N) => {
    it("should return undefined2", () => {
      expect(n.encodings()).toEqual([])
    })
  })
  whenAccept("gzip", (n: N) => {
    it("should return gzip", () => {
      expect(n.encodings()[0]).toBe("gzip")
    })
  })
  whenAccept("gzip, compress;q=0", (n: N) => {
    it("should return gzip2", () => {
      expect(n.encodings()[0]).toBe("gzip")
    })
  })
  whenAccept("gzip, deflate", (n: N) => {
    it("should return gzip3", () => {
      expect(n.encodings()[0]).toBe("gzip")
    })
  })
  whenAccept("gzip;q=0.8, deflate", (n: N) => {
    it("should return deflate", () => {
      expect(n.encodings()[0]).toBe("deflate")
    })
  })
  whenAccept("gzip;q=0.8, identity;q=0.5, *;q=0.3", (n: N) => {
    it("should return gzip4", () => {
      expect(n.encodings()[0]).toBe("gzip")
    })
  })
})
describe("negotiator.encoding(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return undefined for empty list", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should only match identity", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return undefined for empty list2", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should return first item in list", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])[0]).toBe("gzip")
      expect(n.encodings(["gzip", "identity"])[0]).toBe("gzip")
    })
  })
  whenAccept("*, gzip", (n: N) => {
    it("should prefer gzip", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])[0]).toBe("gzip")
      expect(n.encodings(["compress", "gzip"])[0]).toBe("gzip")
    })
  })
  whenAccept("*, gzip;q=0", (n: N) => {
    it("should exclude gzip", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])).toEqual([])
      expect(n.encodings(["gzip", "compress"])[0]).toBe("compress")
    })
  })
  whenAccept("*;q=0", (n: N) => {
    it("should return undefined for empty list3", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should match nothing", () => {
      expect(n.encodings(["identity"])).toEqual([])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("*;q=0, identity;q=1", (n: N) => {
    it("should return undefined for empty list4", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should still match identity", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("identity", (n: N) => {
    it("should return undefined for empty list5", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should only match identity2", () => {
      expect(n.encodings(["identity"])[0]).toBe("identity")
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("identity;q=0", (n: N) => {
    it("should return undefined for empty list6", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should match nothing2", () => {
      expect(n.encodings(["identity"])).toEqual([])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("gzip", (n: N) => {
    it("should return undefined for empty list7", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should return client-preferred encodings", () => {
      expect(n.encodings(["gzip"])[0]).toBe("gzip")
      expect(n.encodings(["identity", "gzip"])[0]).toBe("gzip")
      expect(n.encodings(["identity"])[0]).toBe("identity")
    })
  })
  whenAccept("gzip, compress;q=0", (n: N) => {
    it("should not return compress", () => {
      expect(n.encodings(["compress"])).toEqual([])
      expect(n.encodings(["deflate", "compress"])).toEqual([])
      expect(n.encodings(["gzip", "compress"])[0]).toBe("gzip")
    })
  })
  whenAccept("gzip, deflate", (n: N) => {
    it("should return first client-preferred encoding", () => {
      expect(n.encodings(["deflate", "compress"])[0]).toBe("deflate")
    })
  })
  whenAccept("gzip;q=0.8, deflate", (n: N) => {
    it("should return most client-preferred encoding", () => {
      expect(n.encodings(["gzip"])[0]).toBe("gzip")
      expect(n.encodings(["deflate"])[0]).toBe("deflate")
      expect(n.encodings(["deflate", "gzip"])[0]).toBe("deflate")
    })
  })
  whenAccept("gzip;q=0.8, identity;q=0.5, *;q=0.3", (n: N) => {
    it("should return most client-preferred encoding2", () => {
      expect(n.encodings(["gzip"])[0]).toBe("gzip")
      expect(n.encodings(["compress", "identity"])[0]).toBe("identity")
    })
  })
})
describe("negotiator.encodings()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return identity", () => {
      expect(n.encodings()).toEqual(["identity"])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return *", () => {
      expect(n.encodings()).toEqual(["*"])
    })
  })
  whenAccept("*, gzip", (n: N) => {
    it("should prefer gzip", () => {
      expect(n.encodings()).toEqual(["*", "gzip"])
    })
  })
  whenAccept("*, gzip;q=0", (n: N) => {
    it("should return *2", () => {
      expect(n.encodings()).toEqual(["*"])
    })
  })
  whenAccept("*;q=0", (n: N) => {
    it("should return an empty list", () => {
      expect(n.encodings()).toEqual([])
    })
  })
  whenAccept("*;q=0, identity;q=1", (n: N) => {
    it("should return identity2", () => {
      expect(n.encodings()).toEqual(["identity"])
    })
  })
  whenAccept("identity", (n: N) => {
    it("should return identity3", () => {
      expect(n.encodings()).toEqual(["identity"])
    })
  })
  whenAccept("identity;q=0", (n: N) => {
    it("should return an empty list2", () => {
      expect(n.encodings()).toEqual([])
    })
  })
  whenAccept("gzip", (n: N) => {
    it("should return gzip, identity", () => {
      expect(n.encodings()).toEqual(["gzip", "identity"])
    })
  })
  whenAccept("gzip, compress;q=0", (n: N) => {
    it("should not return compress", () => {
      expect(n.encodings()).toEqual(["gzip", "identity"])
    })
  })
  whenAccept("gzip, deflate", (n: N) => {
    it("should return client-preferred encodings", () => {
      expect(n.encodings()).toEqual(["gzip", "deflate", "identity"])
    })
  })
  whenAccept("gzip;q=0.8, deflate", (n: N) => {
    it("should return client-preferred encodings2", () => {
      expect(n.encodings()).toEqual(["deflate", "gzip", "identity"])
    })
  })
  whenAccept("gzip;foo=bar;q=1, deflate;q=1", (n: N) => {
    it("should return client-preferred encodings3", () => {
      expect(n.encodings()).toEqual(["gzip", "deflate", "identity"])
    })
  })
  whenAccept("gzip;q=0.8, identity;q=0.5, *;q=0.3", (n: N) => {
    it("should return client-preferred encodings4", () => {
      expect(n.encodings()).toEqual(["gzip", "identity", "*"])
    })
  })
})
describe("negotiator.encodings(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return empty list for empty list", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should only match identity", () => {
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("*", (n: N) => {
    it("should return empty list for empty list2", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should return original list", () => {
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["gzip", "identity"])).toEqual(["gzip", "identity"])
    })
  })
  whenAccept("*, gzip", (n: N) => {
    it("should prefer gzip", () => {
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["compress", "gzip"])).toEqual(["gzip", "compress"])
    })
  })
  whenAccept("*, gzip;q=0", (n: N) => {
    it("should exclude gzip", () => {
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual([])
      expect(n.encodings(["gzip", "compress"])).toEqual(["compress"])
    })
  })
  whenAccept("*;q=0", (n: N) => {
    it("should always return empty list", () => {
      expect(n.encodings([])).toEqual([])
      expect(n.encodings(["identity"])).toEqual([])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("*;q=0, identity;q=1", (n: N) => {
    it("should still match identity", () => {
      expect(n.encodings([])).toEqual([])
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("identity", (n: N) => {
    it("should return empty list for empty list3", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should only match identity2", () => {
      expect(n.encodings(["identity"])).toEqual(["identity"])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("identity;q=0", (n: N) => {
    it("should always return empty list2", () => {
      expect(n.encodings([])).toEqual([])
      expect(n.encodings(["identity"])).toEqual([])
      expect(n.encodings(["gzip"])).toEqual([])
    })
  })
  whenAccept("gzip", (n: N) => {
    it("should return empty list for empty list4", () => {
      expect(n.encodings([])).toEqual([])
    })
    it("should be case insensitive, returning provided casing", () => {
      expect(n.encodings(["GZIP"])).toEqual(["GZIP"])
      expect(n.encodings(["gzip", "GZIP"])).toEqual(["gzip", "GZIP"])
      expect(n.encodings(["GZIP", "gzip"])).toEqual(["GZIP", "gzip"])
    })
    it("should return client-preferred encodings", () => {
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["gzip", "identity"])).toEqual(["gzip", "identity"])
      expect(n.encodings(["identity", "gzip"])).toEqual(["gzip", "identity"])
      expect(n.encodings(["identity"])).toEqual(["identity"])
    })
  })
  whenAccept("gzip, compress;q=0", (n: N) => {
    it("should not return compress", () => {
      expect(n.encodings(["gzip", "compress"])).toEqual(["gzip"])
    })
  })
  whenAccept("gzip, deflate", (n: N) => {
    it("should return client-preferred encodings2", () => {
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["gzip", "identity"])).toEqual(["gzip", "identity"])
      expect(n.encodings(["deflate", "gzip"])).toEqual(["gzip", "deflate"])
      expect(n.encodings(["identity"])).toEqual(["identity"])
    })
  })
  whenAccept("gzip;q=0.8, deflate", (n: N) => {
    it("should return client-preferred encodings3", () => {
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["deflate"])).toEqual(["deflate"])
      expect(n.encodings(["deflate", "gzip"])).toEqual(["deflate", "gzip"])
    })
  })
  whenAccept("gzip;q=0.8, identity;q=0.5, *;q=0.3", (n: N) => {
    it("should return client-preferred encodings4", () => {
      expect(n.encodings(["gzip"])).toEqual(["gzip"])
      expect(n.encodings(["identity", "gzip", "compress"])).toEqual([
        "gzip",
        "identity",
        "compress",
      ])
    })
  })
})
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
describe("negotiator.mediaType()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return */*", () => {
      expect(n.types()[0]).toBe("*/*")
    })
  })
  whenAccept("*/*", (n: N) => {
    it("should return */*2", () => {
      expect(n.types()[0]).toBe("*/*")
    })
  })
  whenAccept("application/json", (n: N) => {
    it("should return application/json", () => {
      expect(n.types()[0]).toBe("application/json")
    })
  })
  whenAccept("application/json;q=0", (n: N) => {
    it("should return undefined", () => {
      expect(n.types()).toEqual([])
    })
  })
  whenAccept("application/json;q=0.2, text/html", (n: N) => {
    it("should return text/html", () => {
      expect(n.types()[0]).toBe("text/html")
    })
  })
  whenAccept("text/*", (n: N) => {
    it("should return text/*", () => {
      expect(n.types()[0]).toBe("text/*")
    })
  })
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, */*;q=0.1",
    (n: N) => {
      it("should return text/plain", () => {
        expect(n.types()[0]).toBe("text/plain")
      })
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, text/xml, text/yaml, text/javascript, text/csv, text/css, text/rtf, text/markdown, application/octet-stream;q=0.2, */*;q=0.1",
    (n: N) => {
      it("should return text/plain2", () => {
        expect(n.types()[0]).toBe("text/plain")
      })
    }
  )
})
describe("negotiator.mediaType(array)", () => {
  whenAccept(undefined, (n: N) => {
    it("should return first item in list", () => {
      expect(n.types(["text/html"])[0]).toBe("text/html")
      expect(n.types(["text/html", "application/json"])[0]).toBe("text/html")
      expect(n.types(["application/json", "text/html"])[0]).toBe(
        "application/json"
      )
    })
  })
  whenAccept("*/*", (n: N) => {
    it("should return first item in list2", () => {
      expect(n.types(["text/html"])[0]).toBe("text/html")
      expect(n.types(["text/html", "application/json"])[0]).toBe("text/html")
      expect(n.types(["application/json", "text/html"])[0]).toBe(
        "application/json"
      )
    })
  })
  whenAccept("application/json", (n: N) => {
    it("should be case insensitive", () => {
      expect(n.types(["application/JSON"])[0]).toBe("application/JSON")
    })
    it("should only return application/json", () => {
      expect(n.types(["text/html"])).toEqual([])
      expect(n.types(["text/html", "application/json"])[0]).toBe(
        "application/json"
      )
    })
  })
  whenAccept("application/json;q=0", (n: N) => {
    it("should return undefined", () => {
      expect(n.types()).toEqual([])
    })
  })
  whenAccept("application/json;q=0.2, text/html", (n: N) => {
    it("should prefer text/html over application/json", () => {
      expect(n.types(["application/json"])[0]).toBe("application/json")
      expect(n.types(["application/json", "text/html"])[0]).toBe("text/html")
      expect(n.types(["text/html", "application/json"])[0]).toBe("text/html")
    })
  })
  whenAccept("text/*", (n: N) => {
    it("should prefer text media types", () => {
      expect(n.types(["application/json"])).toEqual([])
      expect(n.types(["application/json", "text/html"])[0]).toBe("text/html")
      expect(n.types(["text/html", "application/json"])[0]).toBe("text/html")
    })
  })
  whenAccept("text/*, text/plain;q=0", (n: N) => {
    it("should prefer text media types2", () => {
      expect(n.types(["application/json"])).toEqual([])
      expect(n.types(["application/json", "text/html"])[0]).toBe("text/html")
      expect(n.types(["text/html", "application/json"])[0]).toBe("text/html")
    })
  })
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, */*;q=0.1",
    (n: N) => {
      it("should return in preferred order", () => {
        expect(
          n.types(["application/json", "text/plain", "text/html"])[0]
        ).toBe("text/plain")
        expect(n.types(["image/jpeg", "text/html"])[0]).toBe("text/html")
        expect(n.types(["image/jpeg", "image/gif"])[0]).toBe("image/jpeg")
      })
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, text/xml, text/yaml, text/javascript, text/csv, text/css, text/rtf, text/markdown, application/octet-stream;q=0.2, */*;q=0.1",
    (n: N) => {
      it("should return the client-preferred order", () => {
        expect(
          n.types([
            "text/plain",
            "text/html",
            "text/xml",
            "text/yaml",
            "text/javascript",
            "text/csv",
            "text/css",
            "text/rtf",
            "text/markdown",
            "application/json",
            "application/octet-stream",
          ])[0]
        ).toBe("text/plain")
      })
    }
  )
})
describe("negotiator.mediaTypes()", () => {
  whenAccept(undefined, (n: N) => {
    it("should return */*", () => {
      expect(n.types()).toEqual(["*/*"])
    })
  })
  whenAccept("*/*", (n: N) => {
    it("should return */*2", preferred(n, ["*/*"]))
  })
  whenAccept("application/json", (n: N) => {
    it("should return application/json", () => {
      expect(n.types()).toEqual(["application/json"])
    })
  })
  whenAccept("application/json;q=0", (n: N) => {
    it("should return empty list", () => {
      expect(n.types()).toEqual([])
    })
  })
  whenAccept("application/json;q=0.2, text/html", (n: N) => {
    it("should return text/html, application/json", () => {
      expect(n.types()).toEqual(["text/html", "application/json"])
    })
  })
  whenAccept("text/*", (n: N) => {
    it("should return text/*", () => {
      expect(n.types()).toEqual(["text/*"])
    })
  })
  whenAccept("text/*, text/plain;q=0", (n: N) => {
    it("should return text/*2", () => {
      expect(n.types()).toEqual(["text/*"])
    })
  })
  whenAccept("text/html;LEVEL=1", (n: N) => {
    it("should return text/html;LEVEL=1", () => {
      expect(n.types()).toEqual(["text/html"])
    })
  })
  whenAccept(
    'text/html;foo="bar,text/css;";fizz="buzz,5", text/plain',
    (n: N) => {
      it("should return text/html, text/plain", () => {
        expect(n.types()).toEqual(["text/html", "text/plain"])
      })
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, */*;q=0.1",
    (n: N) => {
      it("should return text/plain, text/html, application/json, */*", () => {
        expect(n.types()).toEqual([
          "text/plain",
          "text/html",
          "application/json",
          "*/*",
        ])
      })
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, text/xml, text/yaml, text/javascript, text/csv, text/css, text/rtf, text/markdown, application/octet-stream;q=0.2, */*;q=0.1",
    (n: N) => {
      it("should return the client-preferred order", () => {
        expect(n.types()).toEqual([
          "text/plain",
          "text/html",
          "text/xml",
          "text/yaml",
          "text/javascript",
          "text/csv",
          "text/css",
          "text/rtf",
          "text/markdown",
          "application/json",
          "application/octet-stream",
          "*/*",
        ])
      })
    }
  )
})
describe("negotiator.mediaTypes(array)", () => {
  whenAccept(undefined, (n: N) => {
    it(
      "should return return original list",
      negotiated(
        n,
        ["application/json", "text/plain"],
        ["application/json", "text/plain"]
      )
    )
  })
  whenAccept("*/*", (n: N) => {
    it(
      "should return return original list2",
      negotiated(
        n,
        ["application/json", "text/plain"],
        ["application/json", "text/plain"]
      )
    )
  })
  whenAccept("*/*;q=0.8, text/*, image/*", (n: N) => {
    it(
      "should return return stable-sorted list",
      negotiated(
        n,
        [
          "application/json",
          "text/html",
          "text/plain",
          "text/xml",
          "application/xml",
          "image/gif",
          "image/jpeg",
          "image/png",
          "audio/mp3",
          "application/javascript",
          "text/javascript",
        ],
        [
          "text/html",
          "text/plain",
          "text/xml",
          "text/javascript",
          "image/gif",
          "image/jpeg",
          "image/png",
          "application/json",
          "application/xml",
          "audio/mp3",
          "application/javascript",
        ]
      )
    )
  })
  whenAccept("application/json", (n: N) => {
    it(
      "should accept application/json",
      negotiated(n, ["application/json"], ["application/json"])
    )
    it(
      "should be case insensitive",
      negotiated(n, ["application/JSON"], ["application/JSON"])
    )
    it(
      "should only return application/json",
      negotiated(n, ["text/html", "application/json"], ["application/json"])
    )
    it(
      "should ignore invalid types",
      negotiated(n, ["boom", "application/json"], ["application/json"])
    )
  })
  whenAccept("application/json;q=0", (n: N) => {
    it(
      "should not accept application/json",
      negotiated(n, ["application/json"], [])
    )
    it(
      "should not accept other media types",
      negotiated(n, ["application/json", "text/html", "image/jpeg"], [])
    )
  })
  whenAccept("application/json;q=0.2, text/html", (n: N) => {
    it(
      "should prefer text/html over application/json",
      negotiated(
        n,
        ["application/json", "text/html"],
        ["text/html", "application/json"]
      )
    )
  })
  whenAccept(
    "application/json;q=0.9, text/html;q=0.8, application/json;q=0.7",
    (n: N) => {
      it(
        "should prefer application/json over text/html",
        negotiated(
          n,
          ["text/html", "application/json"],
          ["application/json", "text/html"]
        )
      )
    }
  )
  whenAccept("application/json, */*;q=0.1", (n: N) => {
    it(
      "should prefer application/json over text/html2",
      negotiated(
        n,
        ["text/html", "application/json"],
        ["application/json", "text/html"]
      )
    )
  })
  whenAccept(
    'application/xhtml+xml;profile="http://www.wapforum.org/xhtml"',
    (n: N) => {
      it(
        'should accept application/xhtml+xml;profile="http://www.wapforum.org/xhtml"',
        negotiated(
          n,
          ['application/xhtml+xml;profile="http://www.wapforum.org/xhtml"'],
          ['application/xhtml+xml;profile="http://www.wapforum.org/xhtml"']
        )
      )
    }
  )
  whenAccept("text/*", (n: N) => {
    it(
      "should prefer text media types",
      negotiated(
        n,
        ["text/html", "application/json", "text/plain"],
        ["text/html", "text/plain"]
      )
    )
  })
  whenAccept("text/*, text/html;level", (n: N) => {
    it("should accept text/html", negotiated(n, ["text/html"], ["text/html"]))
  })
  whenAccept("text/*, text/plain;q=0", (n: N) => {
    it(
      "should prefer text media types except text/plain",
      negotiated(n, ["text/html", "text/plain"], ["text/html"])
    )
  })
  whenAccept("text/*, text/plain;q=0.5", (n: N) => {
    it(
      "should prefer text/plain below other text types",
      negotiated(
        n,
        ["text/html", "text/plain", "text/xml"],
        ["text/html", "text/xml", "text/plain"]
      )
    )
  })
  whenAccept("text/html;level=1", (n: N) => {
    it(
      "should accept text/html;level=1",
      negotiated(n, ["text/html;level=1"], ["text/html;level=1"])
    )
    it(
      "should accept text/html;Level=1",
      negotiated(n, ["text/html;Level=1"], ["text/html;Level=1"])
    )
    it(
      "should not accept text/html;level=2",
      negotiated(n, ["text/html;level=2"], [])
    )
    it("should not accept text/html", negotiated(n, ["text/html"], []))
    it(
      "should accept text/html;level=1;foo=bar",
      negotiated(
        n,
        ["text/html;level=1;foo=bar"],
        ["text/html;level=1;foo=bar"]
      )
    )
  })
  whenAccept("text/html;level=1;foo=bar", (n: N) => {
    it(
      "should not accept text/html;level=1",
      negotiated(n, ["text/html;level=1"], [])
    )
    it(
      "should accept text/html;level=1;foo=bar2",
      negotiated(
        n,
        ["text/html;level=1;foo=bar"],
        ["text/html;level=1;foo=bar"]
      )
    )
    it(
      "should accept text/html;foo=bar;level=1",
      negotiated(
        n,
        ["text/html;foo=bar;level=1"],
        ["text/html;foo=bar;level=1"]
      )
    )
  })
  whenAccept('text/html;level=1;foo="bar"', (n: N) => {
    it(
      "should accept text/html;level=1;foo=bar3",
      negotiated(
        n,
        ["text/html;level=1;foo=bar"],
        ["text/html;level=1;foo=bar"]
      )
    )
    it(
      'should accept text/html;level=1;foo="bar"',
      negotiated(
        n,
        ['text/html;level=1;foo="bar"'],
        ['text/html;level=1;foo="bar"']
      )
    )
  })
  whenAccept('text/html;foo=";level=2;"', (n: N) => {
    it(
      "should not accept text/html;level=22",
      negotiated(n, ["text/html;level=2"], [])
    )
    it(
      'should accept text/html;foo=";level=2;"',
      negotiated(
        n,
        ['text/html;foo=";level=2;"'],
        ['text/html;foo=";level=2;"']
      )
    )
  })
  whenAccept("text/html;LEVEL=1", (n: N) => {
    it(
      "should accept text/html;level=12",
      negotiated(n, ["text/html;level=1"], ["text/html;level=1"])
    )
    it(
      "should accept text/html;Level=12",
      negotiated(n, ["text/html;Level=1"], ["text/html;Level=1"])
    )
  })
  whenAccept("text/html;LEVEL=1;level=2", (n: N) => {
    it(
      "should accept text/html;level=2",
      negotiated(n, ["text/html;level=2"], ["text/html;level=2"])
    )
    it(
      "should not accept text/html;level=12",
      negotiated(n, ["text/html;level=1"], [])
    )
  })
  whenAccept("text/html;level=2", (n: N) => {
    it(
      "should not accept text/html;level=13",
      negotiated(n, ["text/html;level=1"], [])
    )
  })
  whenAccept("text/html;level=2, text/html", (n: N) => {
    it(
      "should prefer text/html;level=2 over text/html",
      negotiated(
        n,
        ["text/html", "text/html;level=2"],
        ["text/html;level=2", "text/html"]
      )
    )
  })
  whenAccept("text/html;level=2;q=0.1, text/html", (n: N) => {
    it(
      "should prefer text/html over text/html;level=2",
      negotiated(
        n,
        ["text/html;level=2", "text/html"],
        ["text/html", "text/html;level=2"]
      )
    )
  })
  whenAccept("text/html;level=2;q=0.1;level=1", (n: N) => {
    it(
      "should not accept text/html;level=14",
      negotiated(n, ["text/html;level=1"], [])
    )
  })
  whenAccept(
    "text/html;level=2;q=0.1, text/html;level=1, text/html;q=0.5",
    (n: N) => {
      it(
        "should prefer text/html;level=1, text/html, text/html;level=2",
        negotiated(
          n,
          ["text/html;level=1", "text/html;level=2", "text/html"],
          ["text/html;level=1", "text/html", "text/html;level=2"]
        )
      )
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, */*;q=0.1",
    (n: N) => {
      it(
        "should prefer text/plain over text/html",
        negotiated(n, ["text/html", "text/plain"], ["text/plain", "text/html"])
      )
      it(
        "should prefer application/json after text",
        negotiated(
          n,
          ["application/json", "text/html", "text/plain"],
          ["text/plain", "text/html", "application/json"]
        )
      )
      it(
        "should prefer image/jpeg after text",
        negotiated(
          n,
          ["image/jpeg", "text/html", "text/plain"],
          ["text/plain", "text/html", "image/jpeg"]
        )
      )
    }
  )
  whenAccept(
    "text/plain, application/json;q=0.5, text/html, text/xml, text/yaml, text/javascript, text/csv, text/css, text/rtf, text/markdown, application/octet-stream;q=0.2, */*;q=0.1",
    (n: N) => {
      it(
        "should return the client-preferred order",
        negotiated(
          n,
          [
            "text/plain",
            "text/html",
            "text/xml",
            "text/yaml",
            "text/javascript",
            "text/csv",
            "text/css",
            "text/rtf",
            "text/markdown",
            "application/json",
            "application/octet-stream",
          ],
          [
            "text/plain",
            "text/html",
            "text/xml",
            "text/yaml",
            "text/javascript",
            "text/csv",
            "text/css",
            "text/rtf",
            "text/markdown",
            "application/json",
            "application/octet-stream",
          ]
        )
      )
    }
  )
})
