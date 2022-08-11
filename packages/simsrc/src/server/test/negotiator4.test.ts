import { Headers, newNegotiator } from "../server"
import * as qt from "../types"

type N = ReturnType<typeof newNegotiator>
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
    f(newNegotiator(request({ Accept: x })))
  })
}
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
