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
    f(newNegotiator(request({ "Accept-Encoding": x })))
  })
}
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
