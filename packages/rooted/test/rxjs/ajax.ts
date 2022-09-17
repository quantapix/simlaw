import * as index from "rxjs/ajax"
import {
  ajax,
  AjaxConfig,
  AjaxResponse,
  AjaxError,
  AjaxTimeoutError,
} from "rxjs/ajax"
import { TestScheduler } from "rxjs/testing"
import { noop } from "rxjs"
import * as nodeFormData from "form-data"
const root: any =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof self !== "undefined" && self) ||
  global
if (typeof root.FormData === "undefined") {
  root.FormData = nodeFormData as any
}
describe("index", () => {
  it("should export static ajax observable creator functions", () => {
    expect(index.ajax).to.exist
  })
  it("should export Ajax data classes", () => {
    expect(index.AjaxError).to.exist
    expect(index.AjaxTimeoutError).to.exist
    // Interfaces can be checked by creating a variable of that type
    let ajaxRequest: index.AjaxRequest
    let ajaxResponse: index.AjaxResponse<object>
  })
})
/** @test {ajax} */
describe("ajax", () => {
  let rXHR: XMLHttpRequest
  let sandbox: sinon.SinonSandbox
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    rXHR = root.XMLHttpRequest
    root.XMLHttpRequest = MockXMLHttpRequest
  })
  afterEach(() => {
    sandbox.restore()
    MockXMLHttpRequest.clearRequest()
    root.XMLHttpRequest = rXHR
    root.XDomainRequest = null
    root.ActiveXObject = null
  })
  it("should create default XMLHttpRequest for non CORS", () => {
    const obj: AjaxConfig = {
      url: "/",
      method: "",
    }
    ajax(obj).subscribe()
    expect(MockXMLHttpRequest.mostRecent.withCredentials).to.be.false
  })
  it("should raise an error if not able to create XMLHttpRequest", () => {
    root.XMLHttpRequest = null
    root.ActiveXObject = null
    const obj: AjaxConfig = {
      url: "/",
      method: "",
    }
    ajax(obj).subscribe({ error: err => expect(err).to.exist })
  })
  it("should create XMLHttpRequest for CORS", () => {
    const obj: AjaxConfig = {
      url: "/",
      method: "",
      crossDomain: true,
      withCredentials: true,
    }
    ajax(obj).subscribe()
    expect(MockXMLHttpRequest.mostRecent.withCredentials).to.be.true
  })
  it("should raise an error if not able to create CORS request", () => {
    root.XMLHttpRequest = null
    root.XDomainRequest = null
    const obj: AjaxConfig = {
      url: "/",
      method: "",
      crossDomain: true,
      withCredentials: true,
    }
    ajax(obj).subscribe({
      error: err => expect(err).to.exist,
    })
  })
  it("should set headers", () => {
    const obj: AjaxConfig = {
      url: "/talk-to-me-goose",
      headers: {
        "Content-Type": "kenny/loggins",
        "Fly-Into-The": "Dangah Zone!",
        "Take-A-Ride-Into-The": "Danger ZoooOoone!",
      },
      method: "",
    }
    ajax(obj).subscribe()
    const request = MockXMLHttpRequest.mostRecent
    expect(request.url).to.equal("/talk-to-me-goose")
    expect(request.requestHeaders).to.deep.equal({
      "content-type": "kenny/loggins",
      "fly-into-the": "Dangah Zone!",
      "take-a-ride-into-the": "Danger ZoooOoone!",
      "x-requested-with": "XMLHttpRequest",
    })
    // Did not mutate the headers passed
    expect(obj.headers).to.deep.equal({
      "Content-Type": "kenny/loggins",
      "Fly-Into-The": "Dangah Zone!",
      "Take-A-Ride-Into-The": "Danger ZoooOoone!",
    })
  })
  describe("ajax XSRF cookie in custom header", () => {
    beforeEach(() => {
      ;(global as any).document = {
        cookie: "foo=bar",
      } as Document
    })
    afterEach(() => {
      delete (global as any).document
    })
    it("should send the cookie with a custom header to the same domain", () => {
      const obj: AjaxConfig = {
        url: "/some/path",
        xsrfCookieName: "foo",
        xsrfHeaderName: "Custom-Header-Name",
      }
      ajax(obj).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("/some/path")
      expect(request.requestHeaders).to.deep.equal({
        "Custom-Header-Name": "bar",
        "x-requested-with": "XMLHttpRequest",
      })
    })
    it("should send the cookie cross-domain with a custom header when withCredentials is set", () => {
      const obj: AjaxConfig = {
        url: "https://some.subresouce.net/some/page",
        xsrfCookieName: "foo",
        xsrfHeaderName: "Custom-Header-Name",
        crossDomain: true,
        withCredentials: true,
      }
      ajax(obj).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("https://some.subresouce.net/some/page")
      expect(request.requestHeaders).to.deep.equal({
        "Custom-Header-Name": "bar",
      })
    })
    it("should not send the cookie cross-domain with a custom header when withCredentials is not set", () => {
      const obj: AjaxConfig = {
        url: "https://some.subresouce.net/some/page",
        xsrfCookieName: "foo",
        xsrfHeaderName: "Custom-Header-Name",
        crossDomain: true,
      }
      ajax(obj).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("https://some.subresouce.net/some/page")
      expect(request.requestHeaders).to.deep.equal({})
    })
    it("should not send the cookie if there is no xsrfHeaderName option", () => {
      const obj: AjaxConfig = {
        url: "/some/page",
        xsrfCookieName: "foo",
      }
      ajax(obj).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("/some/page")
      expect(request.requestHeaders).to.deep.equal({
        "x-requested-with": "XMLHttpRequest",
      })
    })
  })
  it("should set the X-Requested-With if crossDomain is false", () => {
    ajax({
      url: "/test/monkey",
      method: "GET",
      crossDomain: false,
    }).subscribe()
    const request = MockXMLHttpRequest.mostRecent
    expect(request.requestHeaders).to.deep.equal({
      "x-requested-with": "XMLHttpRequest",
    })
  })
  it("should NOT set the X-Requested-With if crossDomain is true", () => {
    ajax({
      url: "/test/monkey",
      method: "GET",
      crossDomain: true,
    }).subscribe()
    const request = MockXMLHttpRequest.mostRecent
    expect(request.requestHeaders).to.not.have.key("x-requested-with")
  })
  it("should not alter user-provided X-Requested-With header, even if crossDomain is true", () => {
    ajax({
      url: "/test/monkey",
      method: "GET",
      crossDomain: true,
      headers: {
        "x-requested-with": "Custom-XMLHttpRequest",
      },
    }).subscribe()
    const request = MockXMLHttpRequest.mostRecent
    expect(request.requestHeaders["x-requested-with"]).to.equal(
      "Custom-XMLHttpRequest"
    )
  })
  it("should not set default Content-Type header when no body is sent", () => {
    const obj: AjaxConfig = {
      url: "/talk-to-me-goose",
      method: "GET",
    }
    ajax(obj).subscribe()
    const request = MockXMLHttpRequest.mostRecent
    expect(request.url).to.equal("/talk-to-me-goose")
    expect(request.requestHeaders).to.not.have.keys("Content-Type")
  })
  it("should error if createXHR throws", () => {
    let error
    ajax({
      url: "/flibbertyJibbet",
      responseType: "text",
      createXHR: () => {
        throw new Error("wokka wokka")
      },
    }).subscribe({
      next: () => {
        throw new Error("should not next")
      },
      error: (err: any) => {
        error = err
      },
      complete: () => {
        throw new Error("should not complete")
      },
    })
    expect(error).to.be.an("error", "wokka wokka")
  })
  it("should error if send request throws", done => {
    const expected = new Error("xhr send failure")
    ajax({
      url: "/flibbertyJibbet",
      responseType: "text",
      method: "",
      createXHR: () => {
        const ret = new MockXMLHttpRequest()
        ret.send = () => {
          throw expected
        }
        return ret as any
      },
    }).subscribe({
      next: () => {
        done(new Error("should not be called"))
      },
      error: (e: Error) => {
        expect(e).to.be.equal(expected)
        done()
      },
      complete: () => {
        done(new Error("should not be called"))
      },
    })
  })
  it("should succeed on 200", () => {
    const expected = { foo: "bar" }
    let result: AjaxResponse<any>
    let complete = false
    ajax({
      url: "/flibbertyJibbet",
      method: "",
    }).subscribe({
      next: (x: any) => {
        result = x
      },
      complete: () => {
        complete = true
      },
    })
    expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 200,
      responseText: JSON.stringify(expected),
    })
    expect(result!.xhr).exist
    expect(result!.response).to.deep.equal({ foo: "bar" })
    expect(complete).to.be.true
  })
  it("should fail if fails to parse response in older IE", () => {
    let error: any
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      method: "",
    }
    // No `response` property on the object (for older IE).
    MockXMLHttpRequest.noResponseProp = true
    ajax(obj).subscribe({
      next: () => {
        throw new Error("should not next")
      },
      error: (err: any) => {
        error = err
      },
      complete: () => {
        throw new Error("should not complete")
      },
    })
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 207,
      responseText: "Wee! I am text, but should be valid JSON!",
    })
    expect(error instanceof SyntaxError).to.be.true
    expect(error.message).to.equal("Unexpected token W in JSON at position 0")
  })
  it("should fail on 404", () => {
    let error: any
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "text",
      method: "",
    }
    ajax(obj).subscribe({
      next: () => {
        throw new Error("should not next")
      },
      error: (err: any) => {
        error = err
      },
      complete: () => {
        throw new Error("should not complete")
      },
    })
    expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 404,
      responseText: "Wee! I am text!",
    })
    expect(error instanceof AjaxError).to.be.true
    expect(error.name).to.equal("AjaxError")
    expect(error.message).to.equal("ajax error 404")
    expect(error.status).to.equal(404)
  })
  it("should succeed on 300", () => {
    let result: AjaxResponse<any>
    let complete = false
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "text",
      method: "",
    }
    ajax(obj).subscribe({
      next: (x: any) => {
        result = x
      },
      complete: () => {
        complete = true
      },
    })
    expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 300,
      responseText: "Wee! I am text!",
    })
    expect(result!.xhr).exist
    expect(result!.response).to.deep.equal("Wee! I am text!")
    expect(complete).to.be.true
  })
  it("should not fail if fails to parse error response", () => {
    let error: any
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "json",
      method: "",
    }
    ajax(obj).subscribe({
      next: () => {
        throw new Error("should not next")
      },
      error: (err: any) => {
        error = err
      },
      complete: () => {
        throw new Error("should not complete")
      },
    })
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 404,
      responseText: "Unparsable as json",
    })
    expect(error instanceof AjaxError).to.be.true
    // The default behavior of XHR if you get something back that you can't
    // parse as JSON, but you have a requestType of "json" is to
    // have `response` set to `null`.
    expect(error.response).to.be.null
  })
  it("should succeed no settings", () => {
    const expected = JSON.stringify({ foo: "bar" })
    ajax("/flibbertyJibbet").subscribe({
      next: (x: any) => {
        expect(x.status).to.equal(200)
        expect(x.xhr.method).to.equal("GET")
        expect(x.xhr.responseText).to.equal(expected)
      },
      error: () => {
        throw "should not have been called"
      },
    })
    expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 200,
      responseText: expected,
    })
  })
  it("should fail no settings", () => {
    const expected = JSON.stringify({ foo: "bar" })
    ajax("/flibbertyJibbet").subscribe({
      next: () => {
        throw "should not have been called"
      },
      error: (x: any) => {
        expect(x.status).to.equal(500)
        expect(x.xhr.method).to.equal("GET")
        expect(x.xhr.responseText).to.equal(expected)
      },
      complete: () => {
        throw "should not have been called"
      },
    })
    expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
    MockXMLHttpRequest.mostRecent.respondWith({
      status: 500,
      responseText: expected,
    })
  })
  it("should create an asynchronous request", () => {
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "text",
      timeout: 10,
    }
    ajax(obj).subscribe({
      next: (x: any) => {
        expect(x.status).to.equal(200)
        expect(x.xhr.method).to.equal("GET")
        expect(x.xhr.async).to.equal(true)
        expect(x.xhr.timeout).to.equal(10)
        expect(x.xhr.responseType).to.equal("text")
      },
      error: () => {
        throw "should not have been called"
      },
    })
    const request = MockXMLHttpRequest.mostRecent
    expect(request.url).to.equal("/flibbertyJibbet")
    request.respondWith({
      status: 200,
      responseText: "Wee! I am text!",
    })
  })
  it("should error on timeout of asynchronous request", () => {
    const rxTestScheduler = new TestScheduler(noop)
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "text",
      timeout: 10,
    }
    ajax(obj).subscribe({
      next: () => {
        throw "should not have been called"
      },
      error: e => {
        expect(e.status).to.equal(0)
        expect(e.xhr.method).to.equal("GET")
        expect(e.xhr.async).to.equal(true)
        expect(e.xhr.timeout).to.equal(10)
        expect(e.xhr.responseType).to.equal("text")
      },
    })
    const request = MockXMLHttpRequest.mostRecent
    expect(request.url).to.equal("/flibbertyJibbet")
    rxTestScheduler.schedule(() => {
      request.respondWith({
        status: 200,
        responseText: "Wee! I am text!",
      })
    }, 1000)
    rxTestScheduler.flush()
  })
  it("should create a synchronous request", () => {
    const obj: AjaxConfig = {
      url: "/flibbertyJibbet",
      responseType: "text",
      timeout: 10,
      async: false,
    }
    ajax(obj).subscribe()
    const mockXHR = MockXMLHttpRequest.mostRecent
    expect(mockXHR.url).to.equal("/flibbertyJibbet")
    // Open was called with async `false`.
    expect(mockXHR.async).to.be.false
    mockXHR.respondWith({
      status: 200,
      responseText: "Wee! I am text!",
    })
  })
  describe("ajax request body", () => {
    it("can take string body", () => {
      const obj = {
        url: "/flibbertyJibbet",
        method: "POST",
        body: "foobar",
      }
      ajax(obj).subscribe()
      expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
      expect(MockXMLHttpRequest.mostRecent.data).to.equal("foobar")
    })
    it("can take FormData body", () => {
      const body = new root.FormData()
      const obj = {
        url: "/flibbertyJibbet",
        method: "POST",
        body: body,
      }
      ajax(obj).subscribe()
      expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
      expect(MockXMLHttpRequest.mostRecent.data).to.equal(body)
      expect(MockXMLHttpRequest.mostRecent.requestHeaders).to.deep.equal({
        "x-requested-with": "XMLHttpRequest",
      })
    })
    it("should send the URLSearchParams straight through to the body", () => {
      const body = new URLSearchParams({
        "🌟": "🚀",
      })
      const obj = {
        url: "/flibbertyJibbet",
        method: "POST",
        body: body,
      }
      ajax(obj).subscribe()
      expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
      expect(MockXMLHttpRequest.mostRecent.data).to.equal(body)
    })
    it("should send by JSON", () => {
      const body = {
        "🌟": "🚀",
      }
      const obj = {
        url: "/flibbertyJibbet",
        method: "POST",
        body: body,
      }
      ajax(obj).subscribe()
      expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
      expect(MockXMLHttpRequest.mostRecent.data).to.equal('{"🌟":"🚀"}')
    })
    it("should send json body not mattered on case-sensitivity of HTTP headers", () => {
      const body = {
        hello: "world",
      }
      const requestObj = {
        url: "/flibbertyJibbet",
        method: "",
        body: body,
        headers: {
          "cOnTeNt-TyPe": "application/json;charset=UTF-8",
        },
      }
      ajax(requestObj).subscribe()
      expect(MockXMLHttpRequest.mostRecent.url).to.equal("/flibbertyJibbet")
      expect(MockXMLHttpRequest.mostRecent.data).to.equal('{"hello":"world"}')
    })
    it("should error if send request throws", done => {
      const expected = new Error("xhr send failure")
      const obj: AjaxConfig = {
        url: "/flibbertyJibbet",
        responseType: "text",
        method: "",
        body: "foobar",
        createXHR: () => {
          const ret = new MockXMLHttpRequest()
          ret.send = () => {
            throw expected
          }
          return ret as any
        },
      }
      ajax(obj).subscribe({
        next: () => {
          done(new Error("should not be called"))
        },
        error: (e: Error) => {
          expect(e).to.be.equal(expected)
          done()
        },
        complete: () => {
          done(new Error("should not be called"))
        },
      })
    })
  })
  describe("ajax.get", () => {
    it("should succeed on 200", () => {
      const expected = { foo: "bar" }
      let result
      let complete = false
      ajax.get("/flibbertyJibbet").subscribe({
        next: x => {
          result = x.response
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("/flibbertyJibbet")
      request.respondWith({
        status: 200,
        responseText: JSON.stringify(expected),
      })
      expect(result).to.deep.equal(expected)
      expect(complete).to.be.true
    })
    it("should succeed on 204 No Content", () => {
      let result
      let complete = false
      ajax.get("/flibbertyJibbet").subscribe({
        next: x => {
          result = x.response
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("/flibbertyJibbet")
      request.respondWith({
        status: 204,
        responseText: "",
      })
      // Response will get set to null by the browser XHR
      // This is sort of arbitrarily determined by our test harness
      // but we want to be as accurate as possible.
      expect(result).to.be.null
      expect(complete).to.be.true
    })
    it("should able to select json response via getJSON", () => {
      const expected = { foo: "bar" }
      let result
      let complete = false
      ajax.getJSON("/flibbertyJibbet").subscribe({
        next: x => {
          result = x
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.url).to.equal("/flibbertyJibbet")
      request.respondWith({
        status: 200,
        responseText: JSON.stringify(expected),
      })
      expect(result).to.deep.equal(expected)
      expect(complete).to.be.true
    })
  })
  describe("ajax.post", () => {
    it("should succeed on 200", () => {
      const expected = { foo: "bar", hi: "there you" }
      let result: AjaxResponse<any>
      let complete = false
      ajax.post("/flibbertyJibbet", expected).subscribe({
        next: x => {
          result = x
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.method).to.equal("POST")
      expect(request.url).to.equal("/flibbertyJibbet")
      expect(request.requestHeaders).to.deep.equal({
        "content-type": "application/json;charset=utf-8",
        "x-requested-with": "XMLHttpRequest",
      })
      request.respondWith({
        status: 200,
        responseText: JSON.stringify(expected),
      })
      expect(request.data).to.equal(JSON.stringify(expected))
      expect(result!.response).to.deep.equal(expected)
      expect(complete).to.be.true
    })
    it("should succeed on 204 No Content", () => {
      let result: AjaxResponse<any>
      let complete = false
      ajax.post("/flibbertyJibbet", undefined).subscribe({
        next: x => {
          result = x
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.method).to.equal("POST")
      expect(request.url).to.equal("/flibbertyJibbet")
      expect(request.requestHeaders).to.deep.equal({
        "x-requested-with": "XMLHttpRequest",
      })
      request.respondWith({
        status: 204,
        responseText: "",
      })
      // Since the default setting for `responseType` is "json",
      // and our `responseText` is an empty string (which isn't parsable as JSON),
      // response should be `null` here.
      expect(result!.response).to.be.null
      expect(complete).to.be.true
    })
    it("should allow partial progressSubscriber ", function () {
      const spy = sinon.spy()
      const progressSubscriber: any = {
        next: spy,
      }
      ajax({
        url: "/flibbertyJibbet",
        progressSubscriber,
      }).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      request.respondWith(
        {
          status: 200,
          responseText: JSON.stringify({}),
        },
        { uploadProgressTimes: 3 }
      )
      expect(spy).to.be.called.callCount(4)
    })
    it("should emit progress event when progressSubscriber is specified", function () {
      const spy = sinon.spy()
      const progressSubscriber = <any>{
        next: spy,
        error: () => {
          // noop
        },
        complete: () => {
          // noop
        },
      }
      ajax({
        url: "/flibbertyJibbet",
        progressSubscriber,
      }).subscribe()
      const request = MockXMLHttpRequest.mostRecent
      request.respondWith(
        {
          status: 200,
          responseText: JSON.stringify({}),
        },
        { uploadProgressTimes: 3 }
      )
      expect(spy).to.be.called.callCount(4)
    })
  })
  describe("ajax.patch", () => {
    it("should create an AjaxObservable with correct options", () => {
      const expected = { foo: "bar", hi: "there you" }
      let result: AjaxResponse<any>
      let complete = false
      ajax.patch("/flibbertyJibbet", expected).subscribe({
        next: x => {
          result = x
        },
        complete: () => {
          complete = true
        },
      })
      const request = MockXMLHttpRequest.mostRecent
      expect(request.method).to.equal("PATCH")
      expect(request.url).to.equal("/flibbertyJibbet")
      expect(request.requestHeaders).to.deep.equal({
        "content-type": "application/json;charset=utf-8",
        "x-requested-with": "XMLHttpRequest",
      })
      request.respondWith({
        status: 200,
        responseText: JSON.stringify(expected),
      })
      expect(request.data).to.equal(JSON.stringify(expected))
      expect(result!.response).to.deep.equal(expected)
      expect(complete).to.be.true
    })
  })
  describe("ajax error classes", () => {
    describe("AjaxError", () => {
      it("should extend Error class", () => {
        const error = new AjaxError("Test error", new XMLHttpRequest(), {
          url: "/",
          method: "GET",
          responseType: "json",
          headers: {},
          withCredentials: false,
          async: true,
          timeout: 0,
          crossDomain: false,
        })
        expect(error).to.be.an.instanceOf(Error)
      })
    })
    describe("AjaxTimeoutError", () => {
      it("should extend Error class", () => {
        const error = new AjaxTimeoutError(new XMLHttpRequest(), {
          url: "/",
          method: "GET",
          responseType: "json",
          headers: {},
          withCredentials: false,
          async: true,
          timeout: 0,
          crossDomain: false,
        })
        expect(error).to.be.an.instanceOf(Error)
      })
      it("should extend AjaxError class", () => {
        const error = new AjaxTimeoutError(new XMLHttpRequest(), {
          url: "/",
          method: "GET",
          responseType: "json",
          headers: {},
          withCredentials: false,
          async: true,
          timeout: 0,
          crossDomain: false,
        })
        expect(error).to.be.an.instanceOf(AjaxError)
      })
    })
  })
  it("should error if aborted early", () => {
    let thrown: any = null
    ajax({
      method: "GET",
      url: "/flibbertyJibbett",
    }).subscribe({
      next: () => {
        throw new Error("should not be called")
      },
      error: err => {
        thrown = err
      },
    })
    const mockXHR = MockXMLHttpRequest.mostRecent
    expect(thrown).to.be.null
    mockXHR.triggerEvent("abort", { type: "abort" })
    expect(thrown).to.be.an.instanceOf(AjaxError)
    expect(thrown.message).to.equal("aborted")
  })
  describe("with includeDownloadProgress", () => {
    it("should emit download progress", () => {
      const results: any[] = []
      ajax({
        method: "GET",
        url: "/flibbertyJibbett",
        includeDownloadProgress: true,
      }).subscribe({
        next: value => results.push(value),
        complete: () => results.push("done"),
      })
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith(
        {
          status: 200,
          total: 5,
          loaded: 5,
          responseText: JSON.stringify({ boo: "I am a ghost" }),
        },
        { uploadProgressTimes: 5, downloadProgressTimes: 5 }
      )
      const request = {
        async: true,
        body: undefined,
        crossDomain: false,
        headers: {
          "x-requested-with": "XMLHttpRequest",
        },
        includeDownloadProgress: true,
        method: "GET",
        responseType: "json",
        timeout: 0,
        url: "/flibbertyJibbett",
        withCredentials: false,
      }
      expect(results).to.deep.equal([
        {
          type: "download_loadstart",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 0,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "loadstart", loaded: 0, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 1,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 1, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 2,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 2, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 3,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 3, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 4,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 4, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 5,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 5, total: 5 },
        },
        {
          type: "download_load",
          loaded: 5,
          total: 5,
          request,
          originalEvent: { type: "load", loaded: 5, total: 5 },
          xhr: mockXHR,
          response: { boo: "I am a ghost" },
          responseHeaders: {},
          responseType: "json",
          status: 200,
        },
        "done", // from completion.
      ])
    })
    it("should emit upload and download progress", () => {
      const results: any[] = []
      ajax({
        method: "GET",
        url: "/flibbertyJibbett",
        includeUploadProgress: true,
        includeDownloadProgress: true,
      }).subscribe({
        next: value => results.push(value),
        complete: () => results.push("done"),
      })
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith(
        {
          status: 200,
          total: 5,
          loaded: 5,
          responseText: JSON.stringify({ boo: "I am a ghost" }),
        },
        { uploadProgressTimes: 5, downloadProgressTimes: 5 }
      )
      const request = {
        async: true,
        body: undefined,
        crossDomain: false,
        headers: {
          "x-requested-with": "XMLHttpRequest",
        },
        includeUploadProgress: true,
        includeDownloadProgress: true,
        method: "GET",
        responseType: "json",
        timeout: 0,
        url: "/flibbertyJibbett",
        withCredentials: false,
      }
      expect(results).to.deep.equal([
        {
          type: "upload_loadstart",
          loaded: 0,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "loadstart", loaded: 0, total: 5 },
        },
        {
          type: "upload_progress",
          loaded: 1,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 1, total: 5 },
        },
        {
          type: "upload_progress",
          loaded: 2,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 2, total: 5 },
        },
        {
          type: "upload_progress",
          loaded: 3,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 3, total: 5 },
        },
        {
          type: "upload_progress",
          loaded: 4,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 4, total: 5 },
        },
        {
          type: "upload_progress",
          loaded: 5,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 5, total: 5 },
        },
        {
          type: "upload_load",
          loaded: 5,
          total: 5,
          request,
          status: 0,
          response: undefined,
          responseHeaders: {},
          responseType: "json",
          xhr: mockXHR,
          originalEvent: { type: "load", loaded: 5, total: 5 },
        },
        {
          type: "download_loadstart",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 0,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "loadstart", loaded: 0, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 1,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 1, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 2,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 2, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 3,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 3, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 4,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 4, total: 5 },
        },
        {
          type: "download_progress",
          responseHeaders: {},
          responseType: "json",
          response: undefined,
          loaded: 5,
          total: 5,
          request,
          status: 0,
          xhr: mockXHR,
          originalEvent: { type: "progress", loaded: 5, total: 5 },
        },
        {
          type: "download_load",
          loaded: 5,
          total: 5,
          request,
          originalEvent: { type: "load", loaded: 5, total: 5 },
          xhr: mockXHR,
          response: { boo: "I am a ghost" },
          responseHeaders: {},
          responseType: "json",
          status: 200,
        },
        "done", // from completion.
      ])
    })
  })
  it("should return an object that allows access to response headers", () => {
    const sentResponseHeaders = {
      "content-type": "application/json",
      "x-custom-header": "test",
      "x-headers-are-fun": '<whatever/> {"weird": "things"}',
    }
    ajax({
      method: "GET",
      url: "/whatever",
    }).subscribe(response => {
      expect(response.responseHeaders).to.deep.equal(sentResponseHeaders)
    })
    const mockXHR = MockXMLHttpRequest.mostRecent
    mockXHR.respondWith({
      status: 200,
      headers: sentResponseHeaders,
      responseText: JSON.stringify({
        iam: "tired",
        and: "should go to bed",
        but: "I am doing open source for no good reason",
      }),
    })
    expect(mockXHR.getAllResponseHeaders()).to
      .equal(`content-type: application/json
x-custom-header: test
x-headers-are-fun: <whatever/> {"weird": "things"}`)
  })
  describe("with queryParams", () => {
    it("should allow passing of search queryParams as a dictionary", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: { foo: "bar", whatever: "123" },
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal("/whatever?foo=bar&whatever=123")
    })
    it("should allow passing of search queryParams as an entries array", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: [
          ["foo", "bar"],
          ["whatever", "123"],
        ],
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal("/whatever?foo=bar&whatever=123")
    })
    it("should allow passing of search queryParams as a string", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: "?foo=bar&whatever=123",
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal("/whatever?foo=bar&whatever=123")
    })
    it("should allow passing of search queryParams as a URLSearchParams object", () => {
      const queryParams = new URLSearchParams()
      queryParams.set("foo", "bar")
      queryParams.set("whatever", "123")
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams,
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal("/whatever?foo=bar&whatever=123")
    })
    it("should not screw things up if there is an existing search string in the url passed", () => {
      ajax({
        method: "GET",
        url: "/whatever?jays_face=is+a+param&lol=haha",
        queryParams: { foo: "bar", whatever: "123" },
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal(
        "/whatever?jays_face=is+a+param&lol=haha&foo=bar&whatever=123"
      )
    })
    it("should overwrite existing args from existing search strings in the url passed", () => {
      ajax({
        method: "GET",
        url: "/whatever?terminator=2&uncle_bob=huh",
        queryParams: { uncle_bob: "...okayyyyyyy", movie_quote: "yes" },
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal(
        "/whatever?terminator=2&uncle_bob=...okayyyyyyy&movie_quote=yes"
      )
    })
    it("should properly encode values", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: {
          "this is a weird param name": "?#* value here rofl !!!",
        },
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal(
        "/whatever?this+is+a+weird+param+name=%3F%23*+value+here+rofl+%21%21%21"
      )
    })
    it("should handle dictionaries that have numbers, booleans, and arrays of numbers, strings or booleans", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: {
          a: 123,
          b: true,
          c: ["one", "two", "three"],
          d: [1, 3, 3, 7],
          e: [true, false, true],
        },
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal(
        "/whatever?a=123&b=true&c=one%2Ctwo%2Cthree&d=1%2C3%2C3%2C7&e=true%2Cfalse%2Ctrue"
      )
    })
    it("should handle entries that have numbers, booleans, and arrays of numbers, strings or booleans", () => {
      ajax({
        method: "GET",
        url: "/whatever",
        queryParams: [
          ["a", 123],
          ["b", true],
          ["c", ["one", "two", "three"]],
          ["d", [1, 3, 3, 7]],
          ["e", [true, false, true]],
        ],
      }).subscribe()
      const mockXHR = MockXMLHttpRequest.mostRecent
      mockXHR.respondWith({
        status: 200,
        responseText: JSON.stringify({ whatever: "I want" }),
      })
      expect(mockXHR.url).to.equal(
        "/whatever?a=123&b=true&c=one%2Ctwo%2Cthree&d=1%2C3%2C3%2C7&e=true%2Cfalse%2Ctrue"
      )
    })
  })
})
// Some of the older versions of node we test on don't have EventTarget.
class MockXHREventTarget {
  private registry = new Map<string, Set<(e: ProgressEvent) => void>>()
  addEventListener(type: string, handler: (e: ProgressEvent) => void) {
    let handlers = this.registry.get(type)
    if (!handlers) {
      this.registry.set(type, (handlers = new Set()))
    }
    handlers.add(handler)
  }
  removeEventListener(type: string, handler: (e: ProgressEvent) => void) {
    this.registry.get(type)?.delete(handler)
  }
  dispatchEvent(event: ProgressEvent) {
    const { type } = event
    const handlers = this.registry.get(type)
    if (handlers) {
      for (const handler of handlers) {
        handler(event)
      }
    }
  }
}
class MockXMLHttpRequest extends MockXHREventTarget {
  static readonly DONE = 4
  /**
   * Set to `true` to test IE code paths.
   */
  static noResponseProp = false
  private static requests: Array<MockXMLHttpRequest> = []
  private static recentRequest: MockXMLHttpRequest
  static get mostRecent(): MockXMLHttpRequest {
    return MockXMLHttpRequest.recentRequest
  }
  static get allRequests(): Array<MockXMLHttpRequest> {
    return MockXMLHttpRequest.requests
  }
  static clearRequest(): void {
    MockXMLHttpRequest.noResponseProp = false
    MockXMLHttpRequest.requests.length = 0
    MockXMLHttpRequest.recentRequest = null!
  }
  protected responseType: string = ""
  private readyState: number = 0
  /**
   * Used to test if `open` was called with `async` true or false.
   */
  public async: boolean = true
  protected status: any
  // @ts-ignore: Property has no initializer and is not definitely assigned
  protected responseText: string | undefined
  protected response: any = undefined
  url: any
  method: any
  data: any
  requestHeaders: any = {}
  withCredentials: boolean = false
  // @ts-ignore: Property has no initializer and is not definitely assigned
  onreadystatechange: (e: ProgressEvent) => any
  // @ts-ignore: Property has no initializer and is not definitely assigned
  onerror: (e: ErrorEvent) => any
  // @ts-ignore: Property has no initializer and is not definitely assigned
  onprogress: (e: ProgressEvent) => any
  // @ts-ignore: Property has no initializer and is not definitely assigned
  ontimeout: (e: ProgressEvent) => any
  upload: XMLHttpRequestUpload = new MockXHREventTarget() as any
  constructor() {
    super()
    MockXMLHttpRequest.recentRequest = this
    MockXMLHttpRequest.requests.push(this)
    if (MockXMLHttpRequest.noResponseProp) {
      delete this["response"]
    }
  }
  // @ts-ignore: Property has no initializer and is not definitely assigned
  timeout: number
  send(data: any): void {
    this.data = data
    if (this.timeout && this.timeout > 0) {
      setTimeout(() => {
        if (this.readyState != 4) {
          this.readyState = 4
          this.status = 0
          this.triggerEvent("readystatechange")
          this.triggerEvent("timeout")
        }
      }, this.timeout)
    }
  }
  abort() {
    // noop
  }
  open(method: any, url: any, async: any): void {
    this.method = method
    this.url = url
    this.async = async
    this.readyState = 1
    this.triggerEvent("readystatechange")
    const originalProgressHandler = this.upload.onprogress
    Object.defineProperty(this.upload, "progress", {
      get() {
        return originalProgressHandler
      },
    })
  }
  setRequestHeader(key: any, value: any): void {
    this.requestHeaders[key] = value
  }
  private _responseHeaders: any
  getAllResponseHeaders() {
    return this._responseHeaders
      ? Object.entries(this._responseHeaders)
          .map(entryParts => entryParts.join(": "))
          .join("\n")
      : ""
  }
  respondWith(
    response: {
      status?: number
      headers?: any
      responseText?: string | undefined
      total?: number
      loaded?: number
    },
    config?: { uploadProgressTimes?: number; downloadProgressTimes?: number }
  ): void {
    const { uploadProgressTimes = 0, downloadProgressTimes = 0 } = config ?? {}
    // Fake our upload progress first, if requested by the test.
    if (uploadProgressTimes) {
      this.triggerUploadEvent("loadstart", {
        type: "loadstart",
        total: uploadProgressTimes,
        loaded: 0,
      })
      for (let i = 1; i <= uploadProgressTimes; i++) {
        this.triggerUploadEvent("progress", {
          type: "progress",
          total: uploadProgressTimes,
          loaded: i,
        })
      }
      this.triggerUploadEvent("load", {
        type: "load",
        total: uploadProgressTimes,
        loaded: uploadProgressTimes,
      })
    }
    // Fake our download progress
    if (downloadProgressTimes) {
      this.triggerEvent("loadstart", {
        type: "loadstart",
        total: downloadProgressTimes,
        loaded: 0,
      })
      for (let i = 1; i <= downloadProgressTimes; i++) {
        this.triggerEvent("progress", {
          type: "progress",
          total: downloadProgressTimes,
          loaded: i,
        })
      }
    }
    // Store our headers locally. This is used in `getAllResponseHeaders` mock impl.
    this._responseHeaders = response.headers
    // Set the readyState to DONE (4)
    this.readyState = 4
    // Default to OK
    this.status = response.status || 200
    this.responseText = response.responseText
    switch (this.responseType) {
      case "json":
        try {
          this.response = JSON.parse(response.responseText!)
        } catch (err) {
          // Ignore this is for testing if we get an invalid server
          // response somehow, where responseType is "json" but the responseText
          // is not JSON. In truth, we need to invert these tests to just use
          // response, because `responseText` is a legacy path.
          this.response = null
        }
        break
      case "arraybuffer":
      case "document":
      case "blob":
        throw new Error(
          "Test harness does not support the responseType: " + this.responseType
        )
      case "text":
      case "":
      default:
        this.response = response.responseText
        break
    }
    // We're testing old IE, forget all of that response property stuff.
    if (MockXMLHttpRequest.noResponseProp) {
      delete this["response"]
    }
    this.triggerEvent("load", {
      type: "load",
      total: response.total ?? 0,
      loaded: response.loaded ?? 0,
    })
    this.triggerEvent("readystatechange", { type: "readystatechange" })
  }
  triggerEvent(this: any, name: any, eventObj?: any): void {
    // TODO: create a better default event
    const e: any = eventObj || { type: name }
    this.dispatchEvent({ type: name, ...eventObj })
    if (this["on" + name]) {
      this["on" + name](e)
    }
  }
  triggerUploadEvent(this: any, name: any, eventObj?: any): void {
    // TODO: create a better default event
    const e: any = eventObj || {}
    this.upload.dispatchEvent({ type: name, ...eventObj })
    if (this.upload["on" + name]) {
      this.upload["on" + name](e)
    }
  }
}
/** @prettier */
import { expect } from "chai"
import * as sinon from "sinon"
import { animationFrames } from "rxjs"
import { mergeMapTo, take, takeUntil } from "rxjs/operators"
import { TestScheduler } from "rxjs/testing"
import { observableMatcher } from "../../helpers/observableMatcher"
import { animationFrameProvider } from "rxjs/internal/scheduler/animationFrameProvider"
describe("animationFrames", () => {
  let testScheduler: TestScheduler
  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher)
  })
  it("should animate", function () {
    testScheduler.run(({ animate, cold, expectObservable, time }) => {
      animate("            ---x---x---x")
      const mapped = cold("-m          ")
      const tm = time("    -|          ")
      const ta = time("    ---|        ")
      const tb = time("    -------|    ")
      const tc = time("    -----------|")
      const expected = "   ---a---b---c"
      const subs = "       ^----------!"
      const result = mapped.pipe(mergeMapTo(animationFrames()))
      expectObservable(result, subs).toBe(expected, {
        a: { elapsed: ta - tm, timestamp: ta },
        b: { elapsed: tb - tm, timestamp: tb },
        c: { elapsed: tc - tm, timestamp: tc },
      })
    })
  })
  it("should use any passed timestampProvider", () => {
    let i = 0
    const timestampProvider = {
      now: sinon.stub().callsFake(() => {
        return [50, 100, 200, 300][i++]
      }),
    }
    testScheduler.run(({ animate, cold, expectObservable }) => {
      animate("            ---x---x---x")
      const mapped = cold("-m          ")
      const expected = "   ---a---b---c"
      const subs = "       ^----------!"
      const result = mapped.pipe(mergeMapTo(animationFrames(timestampProvider)))
      expectObservable(result, subs).toBe(expected, {
        a: { elapsed: 50, timestamp: 100 },
        b: { elapsed: 150, timestamp: 200 },
        c: { elapsed: 250, timestamp: 300 },
      })
    })
  })
  it("should compose with take", () => {
    testScheduler.run(({ animate, cold, expectObservable, time }) => {
      const requestSpy = sinon.spy(
        animationFrameProvider.delegate!,
        "requestAnimationFrame"
      )
      const cancelSpy = sinon.spy(
        animationFrameProvider.delegate!,
        "cancelAnimationFrame"
      )
      animate("            ---x---x---x")
      const mapped = cold("-m          ")
      const tm = time("    -|          ")
      const ta = time("    ---|        ")
      const tb = time("    -------|    ")
      const expected = "   ---a---b    "
      const result = mapped.pipe(mergeMapTo(animationFrames().pipe(take(2))))
      expectObservable(result).toBe(expected, {
        a: { elapsed: ta - tm, timestamp: ta },
        b: { elapsed: tb - tm, timestamp: tb },
      })
      testScheduler.flush()
      // Requests are made at times tm and ta
      expect(requestSpy.callCount).to.equal(2)
      // No request cancellation is effected, as unsubscription occurs before rescheduling
      expect(cancelSpy.callCount).to.equal(0)
    })
  })
  it("should compose with takeUntil", () => {
    testScheduler.run(({ animate, cold, expectObservable, hot, time }) => {
      const requestSpy = sinon.spy(
        animationFrameProvider.delegate!,
        "requestAnimationFrame"
      )
      const cancelSpy = sinon.spy(
        animationFrameProvider.delegate!,
        "cancelAnimationFrame"
      )
      animate("            ---x---x---x")
      const mapped = cold("-m          ")
      const tm = time("    -|          ")
      const ta = time("    ---|        ")
      const tb = time("    -------|    ")
      const signal = hot(" ^--------s--")
      const expected = "   ---a---b    "
      const result = mapped.pipe(
        mergeMapTo(animationFrames().pipe(takeUntil(signal)))
      )
      expectObservable(result).toBe(expected, {
        a: { elapsed: ta - tm, timestamp: ta },
        b: { elapsed: tb - tm, timestamp: tb },
      })
      testScheduler.flush()
      // Requests are made at times tm and ta and tb
      expect(requestSpy.callCount).to.equal(3)
      // Unsubscription effects request cancellation when signalled
      expect(cancelSpy.callCount).to.equal(1)
    })
  })
})
import { fromFetch } from "rxjs/fetch"
import { expect } from "chai"
const root: any =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof self !== "undefined" && self) ||
  global
const OK_RESPONSE = {
  ok: true,
} as Response
function mockFetchImpl(
  input: string | Request,
  init?: RequestInit
): Promise<Response> {
  ;(mockFetchImpl as MockFetch).calls.push({ input, init })
  return new Promise<any>((resolve, reject) => {
    if (init) {
      if (init.signal) {
        if (init.signal.aborted) {
          reject(new MockDOMException())
          return
        }
        init.signal.addEventListener("abort", () => {
          reject(new MockDOMException())
        })
      }
    }
    Promise.resolve(null).then(() => {
      resolve((mockFetchImpl as any).respondWith)
    })
  })
}
;(mockFetchImpl as MockFetch).reset = function (this: any) {
  this.calls = [] as any[]
  this.respondWith = OK_RESPONSE
}
;(mockFetchImpl as MockFetch).reset()
const mockFetch: MockFetch = mockFetchImpl as MockFetch
class MockDOMException {}
class MockAbortController {
  readonly signal = new MockAbortSignal()
  abort() {
    this.signal._signal()
  }
  constructor() {
    MockAbortController.created++
  }
  static created = 0
  static reset() {
    MockAbortController.created = 0
  }
}
class MockAbortSignal {
  private _listeners: Function[] = []
  aborted = false
  addEventListener(name: "abort", handler: Function) {
    this._listeners.push(handler)
  }
  removeEventListener(name: "abort", handler: Function) {
    const index = this._listeners.indexOf(handler)
    if (index >= 0) {
      this._listeners.splice(index, 1)
    }
  }
  _signal() {
    this.aborted = true
    while (this._listeners.length > 0) {
      this._listeners.shift()!()
    }
  }
}
interface MockFetch {
  (input: string | Request, init?: RequestInit): Promise<Response>
  calls: { input: string | Request; init: RequestInit | undefined }[]
  reset(): void
  respondWith: Response
}
describe("fromFetch", () => {
  let _fetch: typeof fetch
  let _AbortController: AbortController
  beforeEach(() => {
    mockFetch.reset()
    if (root.fetch) {
      _fetch = root.fetch
    }
    root.fetch = mockFetch
    MockAbortController.reset()
    if (root.AbortController) {
      _AbortController = root.AbortController
    }
    root.AbortController = MockAbortController
  })
  afterEach(() => {
    root.fetch = _fetch
    root.AbortController = _AbortController
  })
  it("should exist", () => {
    expect(fromFetch).to.be.a("function")
  })
  it("should fetch", done => {
    const fetch$ = fromFetch("/foo")
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    fetch$.subscribe({
      next: response => {
        expect(response).to.equal(OK_RESPONSE)
      },
      error: done,
      complete: () => {
        // Wait until the complete and the subsequent unsubscribe are finished
        // before testing these expectations:
        setTimeout(() => {
          expect(MockAbortController.created).to.equal(1)
          expect(mockFetch.calls.length).to.equal(1)
          expect(mockFetch.calls[0].input).to.equal("/foo")
          expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
          expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
          done()
        }, 0)
      },
    })
  })
  it("should handle Response that is not `ok`", done => {
    mockFetch.respondWith = {
      ok: false,
      status: 400,
      body: "Bad stuff here",
    } as any as Response
    const fetch$ = fromFetch("/foo")
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    fetch$.subscribe({
      next: response => {
        expect(response).to.equal(mockFetch.respondWith)
      },
      complete: done,
      error: done,
    })
    expect(MockAbortController.created).to.equal(1)
    expect(mockFetch.calls.length).to.equal(1)
    expect(mockFetch.calls[0].input).to.equal("/foo")
    expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
  })
  it("should abort when unsubscribed", () => {
    const fetch$ = fromFetch("/foo")
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    const subscription = fetch$.subscribe()
    expect(MockAbortController.created).to.equal(1)
    expect(mockFetch.calls.length).to.equal(1)
    expect(mockFetch.calls[0].input).to.equal("/foo")
    expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
    subscription.unsubscribe()
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.true
  })
  it("should not immediately abort repeat subscribers", () => {
    const fetch$ = fromFetch("/foo")
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    let subscription = fetch$.subscribe()
    expect(MockAbortController.created).to.equal(1)
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
    subscription.unsubscribe()
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.true
    subscription = fetch$.subscribe()
    expect(MockAbortController.created).to.equal(2)
    expect(mockFetch.calls[1].init!.signal!.aborted).to.be.false
    subscription.unsubscribe()
    expect(mockFetch.calls[1].init!.signal!.aborted).to.be.true
  })
  it("should allow passing of init object", done => {
    const fetch$ = fromFetch("/foo", { method: "HEAD" })
    fetch$.subscribe({
      error: done,
      complete: done,
    })
    expect(mockFetch.calls[0].init!.method).to.equal("HEAD")
  })
  it("should add a signal to internal init object without mutating the passed init object", done => {
    const myInit = { method: "DELETE" }
    const fetch$ = fromFetch("/bar", myInit)
    fetch$.subscribe({
      error: done,
      complete: done,
    })
    expect(mockFetch.calls[0].init!.method).to.equal(myInit.method)
    expect(mockFetch.calls[0].init).not.to.equal(myInit)
    expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
  })
  it("should treat passed signals as a cancellation token which triggers an error", done => {
    const controller = new MockAbortController()
    const signal = controller.signal as any
    const fetch$ = fromFetch("/foo", { signal })
    const subscription = fetch$.subscribe({
      error: err => {
        expect(err).to.be.instanceof(MockDOMException)
        done()
      },
    })
    controller.abort()
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.true
    // The subscription will not be closed until the error fires when the promise resolves.
    expect(subscription.closed).to.be.false
  })
  it("should treat passed already aborted signals as a cancellation token which triggers an error", done => {
    const controller = new MockAbortController()
    controller.abort()
    const signal = controller.signal as any
    const fetch$ = fromFetch("/foo", { signal })
    const subscription = fetch$.subscribe({
      error: err => {
        expect(err).to.be.instanceof(MockDOMException)
        done()
      },
    })
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.true
    // The subscription will not be closed until the error fires when the promise resolves.
    expect(subscription.closed).to.be.false
  })
  it("should not leak listeners added to the passed in signal", done => {
    const controller = new MockAbortController()
    const signal = controller.signal as any
    const fetch$ = fromFetch("/foo", { signal })
    const subscription = fetch$.subscribe()
    subscription.add(() => {
      try {
        expect(signal._listeners).to.be.empty
        done()
      } catch (error) {
        done(error)
      }
    })
  })
  it("should support a selector", done => {
    mockFetch.respondWith = {
      ...OK_RESPONSE,
      text: () => Promise.resolve("bar"),
    }
    const fetch$ = fromFetch("/foo", {
      selector: response => response.text(),
    })
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    fetch$.subscribe({
      next: text => {
        expect(text).to.equal("bar")
      },
      error: done,
      complete: () => {
        // Wait until the complete and the subsequent unsubscribe are finished
        // before testing these expectations:
        setTimeout(() => {
          expect(MockAbortController.created).to.equal(1)
          expect(mockFetch.calls.length).to.equal(1)
          expect(mockFetch.calls[0].input).to.equal("/foo")
          expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
          expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
          done()
        }, 0)
      },
    })
  })
  it("should abort when unsubscribed and a selector is specified", () => {
    mockFetch.respondWith = {
      ...OK_RESPONSE,
      text: () => Promise.resolve("bar"),
    }
    const fetch$ = fromFetch("/foo", {
      selector: response => response.text(),
    })
    expect(mockFetch.calls.length).to.equal(0)
    expect(MockAbortController.created).to.equal(0)
    const subscription = fetch$.subscribe()
    expect(MockAbortController.created).to.equal(1)
    expect(mockFetch.calls.length).to.equal(1)
    expect(mockFetch.calls[0].input).to.equal("/foo")
    expect(mockFetch.calls[0].init!.signal).not.to.be.undefined
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.false
    subscription.unsubscribe()
    expect(mockFetch.calls[0].init!.signal!.aborted).to.be.true
  })
})
import { expect } from "chai"
import * as sinon from "sinon"
import { webSocket } from "rxjs/webSocket"
import { map, retry, take, repeat, takeWhile } from "rxjs/operators"
const root: any =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof self !== "undefined" && self) ||
  global
enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
/** @test {webSocket}  */
describe("webSocket", () => {
  let __ws: any
  function setupMockWebSocket() {
    __ws = root.WebSocket
    root.WebSocket = MockWebSocket
  }
  function teardownMockWebSocket() {
    root.WebSocket = __ws
    MockWebSocket.clearSockets()
  }
  describe("basic behavior", () => {
    beforeEach(() => {
      setupMockWebSocket()
    })
    afterEach(() => {
      teardownMockWebSocket()
    })
    it("should send and receive messages", () => {
      let messageReceived = false
      const subject = webSocket<string>("ws://mysocket")
      subject.next("ping")
      subject.subscribe(x => {
        expect(x).to.equal("pong")
        messageReceived = true
      })
      const socket = MockWebSocket.lastSocket
      expect(socket.url).to.equal("ws://mysocket")
      socket.open()
      expect(socket.lastMessageSent).to.equal(JSON.stringify("ping"))
      socket.triggerMessage(JSON.stringify("pong"))
      expect(messageReceived).to.be.true
      subject.unsubscribe()
    })
    it("should allow use of operators and subscribe", () => {
      const subject = webSocket<string>("ws://mysocket")
      const results: any[] = []
      subject.pipe(map(x => x + "!")).subscribe(x => results.push(x))
      MockWebSocket.lastSocket.triggerMessage(JSON.stringify("ngconf 2018 bug"))
      expect(results).to.deep.equal(["ngconf 2018 bug!"])
    })
    it("receive multiple messages", () => {
      const expected = [
        "what",
        "do",
        "you",
        "do",
        "with",
        "a",
        "drunken",
        "sailor?",
      ]
      const results: string[] = []
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe(x => {
        results.push(x)
      })
      const socket = MockWebSocket.lastSocket
      socket.open()
      expected.forEach(x => {
        socket.triggerMessage(JSON.stringify(x))
      })
      expect(results).to.deep.equal(expected)
      subject.unsubscribe()
    })
    it("should queue messages prior to subscription", () => {
      const expected = ["make", "him", "walk", "the", "plank"]
      const subject = webSocket<string>("ws://mysocket")
      expected.forEach(x => {
        subject.next(x)
      })
      let socket = MockWebSocket.lastSocket
      expect(socket).not.exist
      subject.subscribe()
      socket = MockWebSocket.lastSocket
      expect(socket.sent.length).to.equal(0)
      socket.open()
      expect(socket.sent.length).to.equal(expected.length)
      subject.unsubscribe()
    })
    it("should send messages immediately if already open", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      socket.open()
      subject.next("avast!")
      expect(socket.lastMessageSent).to.equal(JSON.stringify("avast!"))
      subject.next("ye swab!")
      expect(socket.lastMessageSent).to.equal(JSON.stringify("ye swab!"))
      subject.unsubscribe()
    })
    it("should close the socket when completed", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      socket.open()
      expect(socket.readyState).to.equal(WebSocketState.OPEN)
      sinon.spy(socket, "close")
      expect(socket.close).not.have.been.called
      subject.complete()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      socket.triggerClose({ wasClean: true })
      expect(socket.readyState).to.equal(WebSocketState.CLOSED)
      subject.unsubscribe()
      ;(<any>socket.close).restore()
    })
    it("should close the socket when unsubscribed before socket open", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      subject.unsubscribe()
      const socket = MockWebSocket.lastSocket
      sinon.spy(socket, "close")
      socket.open()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      ;(<any>socket.close).restore()
    })
    it("should close the socket when subscription is cancelled before socket open", () => {
      const subject = webSocket<string>("ws://mysocket")
      const subscription = subject.subscribe()
      subscription.unsubscribe()
      const socket = MockWebSocket.lastSocket
      sinon.spy(socket, "close")
      socket.open()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      ;(<any>socket.close).restore()
    })
    it("should close the socket when unsubscribed while connecting", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      sinon.spy(socket, "close")
      subject.unsubscribe()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      ;(<any>socket.close).restore()
    })
    it("should close the socket when subscription is cancelled while connecting", () => {
      const subject = webSocket<string>("ws://mysocket")
      const subscription = subject.subscribe()
      const socket = MockWebSocket.lastSocket
      sinon.spy(socket, "close")
      subscription.unsubscribe()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      ;(<any>socket.close).restore()
    })
    it("should close a socket that opens before the previous socket has closed", () => {
      const subject = webSocket<string>("ws://mysocket")
      const subscription = subject.subscribe()
      const socket = MockWebSocket.lastSocket
      sinon.spy(socket, "close")
      subscription.unsubscribe()
      expect(socket.close).have.been.called
      expect(socket.readyState).to.equal(WebSocketState.CLOSING)
      const subscription2 = subject.subscribe()
      const socket2 = MockWebSocket.lastSocket
      sinon.spy(socket2, "close")
      // Close socket after socket2 has opened
      socket2.open()
      expect(socket2.readyState).to.equal(WebSocketState.OPEN)
      socket.triggerClose({ wasClean: true })
      expect(socket.readyState).to.equal(WebSocketState.CLOSED)
      expect(socket2.close).have.not.been.called
      subscription2.unsubscribe()
      expect(socket2.close).have.been.called
      expect(socket2.readyState).to.equal(WebSocketState.CLOSING)
      ;(<any>socket.close).restore()
    })
    it("should close the socket with a code and a reason when errored", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      socket.open()
      sinon.spy(socket, "close")
      expect(socket.close).not.have.been.called
      subject.error({ code: 1337, reason: "Too bad, so sad :(" })
      expect(socket.close).have.been.calledWith(1337, "Too bad, so sad :(")
      subject.unsubscribe()
      ;(<any>socket.close).restore()
    })
    it("should allow resubscription after closure via complete", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket1 = MockWebSocket.lastSocket
      socket1.open()
      subject.complete()
      subject.next("a mariner yer not. yarrr.")
      subject.subscribe()
      const socket2 = MockWebSocket.lastSocket
      socket2.open()
      expect(socket2).not.to.equal(socket1)
      expect(socket2.lastMessageSent).to.equal(
        JSON.stringify("a mariner yer not. yarrr.")
      )
      subject.unsubscribe()
    })
    it("should allow resubscription after closure via error", () => {
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe()
      const socket1 = MockWebSocket.lastSocket
      socket1.open()
      subject.error({ code: 1337 })
      subject.next("yo-ho! yo-ho!")
      subject.subscribe()
      const socket2 = MockWebSocket.lastSocket
      socket2.open()
      expect(socket2).not.to.equal(socket1)
      expect(socket2.lastMessageSent).to.equal(JSON.stringify("yo-ho! yo-ho!"))
      subject.unsubscribe()
    })
    it("should have a default resultSelector that parses message data as JSON", () => {
      let result
      const expected = { mork: "shazbot!" }
      const subject = webSocket<string>("ws://mysocket")
      subject.subscribe((x: any) => {
        result = x
      })
      const socket = MockWebSocket.lastSocket
      socket.open()
      socket.triggerMessage(JSON.stringify(expected))
      expect(result).to.deep.equal(expected)
      subject.unsubscribe()
    })
  })
  describe("with a config object", () => {
    beforeEach(() => {
      setupMockWebSocket()
    })
    afterEach(() => {
      teardownMockWebSocket()
    })
    it("should send and receive messages", () => {
      let messageReceived = false
      const subject = webSocket<string>({ url: "ws://mysocket" })
      subject.next("ping")
      subject.subscribe(x => {
        expect(x).to.equal("pong")
        messageReceived = true
      })
      const socket = MockWebSocket.lastSocket
      expect(socket.url).to.equal("ws://mysocket")
      socket.open()
      expect(socket.lastMessageSent).to.equal(JSON.stringify("ping"))
      socket.triggerMessage(JSON.stringify("pong"))
      expect(messageReceived).to.be.true
      subject.unsubscribe()
    })
    it("should take a protocol and set it properly on the web socket", () => {
      const subject = webSocket<string>({
        url: "ws://mysocket",
        protocol: "someprotocol",
      })
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      expect(socket.protocol).to.equal("someprotocol")
      subject.unsubscribe()
    })
    it("should take a binaryType and set it properly on the web socket", () => {
      const subject = webSocket<string>({
        url: "ws://mysocket",
        binaryType: "blob",
      })
      subject.subscribe()
      const socket = MockWebSocket.lastSocket
      expect(socket.binaryType).to.equal("blob")
      subject.unsubscribe()
    })
    it("should take a deserializer", () => {
      const results = [] as string[]
      const subject = webSocket<string>({
        url: "ws://mysocket",
        deserializer: (e: any) => {
          return e.data + "!"
        },
      })
      subject.subscribe((x: any) => {
        results.push(x)
      })
      const socket = MockWebSocket.lastSocket
      socket.open()
      ;["ahoy", "yarr", "shove off"].forEach((x: any) => {
        socket.triggerMessage(x)
      })
      expect(results).to.deep.equal(["ahoy!", "yarr!", "shove off!"])
      subject.unsubscribe()
    })
    it("if the deserializer fails it should go down the error path", () => {
      const subject = webSocket<string>({
        url: "ws://mysocket",
        deserializer: (e: any) => {
          throw new Error("I am a bad error")
        },
      })
      subject.subscribe({
        next: (x: any) => {
          expect(x).to.equal("this should not happen")
        },
        error: (err: any) => {
          expect(err).to.be.an("error", "I am a bad error")
        },
      })
      const socket = MockWebSocket.lastSocket
      socket.open()
      socket.triggerMessage("weee!")
      subject.unsubscribe()
    })
    it("should accept a closingObserver", () => {
      let calls = 0
      const subject = webSocket<string>(<any>{
        url: "ws://mysocket",
        closingObserver: {
          next(x: any) {
            calls++
            expect(x).to.be.an("undefined")
          },
        },
      })
      subject.subscribe()
      let socket = MockWebSocket.lastSocket
      socket.open()
      expect(calls).to.equal(0)
      subject.complete()
      expect(calls).to.equal(1)
      subject.subscribe()
      socket = MockWebSocket.lastSocket
      socket.open()
      subject.error({ code: 1337 })
      expect(calls).to.equal(2)
      subject.unsubscribe()
    })
    it("should accept a closeObserver", () => {
      const expected = [{ wasClean: true }, { wasClean: false }]
      const closes = [] as any[]
      const subject = webSocket<string>(<any>{
        url: "ws://mysocket",
        closeObserver: {
          next(e: any) {
            closes.push(e)
          },
        },
      })
      subject.subscribe()
      let socket = MockWebSocket.lastSocket
      socket.open()
      expect(closes.length).to.equal(0)
      socket.triggerClose(expected[0])
      expect(closes.length).to.equal(1)
      subject.subscribe({
        error: function (err) {
          expect(err).to.equal(expected[1])
        },
      })
      socket = MockWebSocket.lastSocket
      socket.open()
      socket.triggerClose(expected[1])
      expect(closes.length).to.equal(2)
      expect(closes[0]).to.equal(expected[0])
      expect(closes[1]).to.equal(expected[1])
      subject.unsubscribe()
    })
    it("should handle constructor errors", () => {
      const subject = webSocket<string>(<any>{
        url: "bad_url",
        WebSocketCtor: (
          url: string,
          protocol?: string | string[]
        ): WebSocket => {
          throw new Error(`connection refused`)
        },
      })
      subject.subscribe({
        next: (x: any) => {
          expect(x).to.equal("this should not happen")
        },
        error: (err: any) => {
          expect(err).to.be.an("error", "connection refused")
        },
      })
      subject.unsubscribe()
    })
  })
  describe("multiplex", () => {
    beforeEach(() => {
      setupMockWebSocket()
    })
    afterEach(() => {
      teardownMockWebSocket()
    })
    it("should be retryable", () => {
      const results = [] as string[]
      const subject = webSocket<{ name: string; value: string }>(
        "ws://websocket"
      )
      const source = subject.multiplex(
        () => ({ sub: "foo" }),
        () => ({ unsub: "foo" }),
        value => value.name === "foo"
      )
      source
        .pipe(
          retry(1),
          map(x => x.value),
          take(2)
        )
        .subscribe(x => {
          results.push(x)
        })
      const socket = MockWebSocket.lastSocket
      socket.open()
      expect(socket.lastMessageSent).to.deep.equal(
        JSON.stringify({ sub: "foo" })
      )
      socket.triggerClose({ wasClean: false }) // Bad connection
      const socket2 = MockWebSocket.lastSocket
      expect(socket2).not.to.equal(socket)
      socket2.open()
      expect(socket2.lastMessageSent).to.deep.equal(
        JSON.stringify({ sub: "foo" })
      )
      socket2.triggerMessage(JSON.stringify({ name: "foo", value: "test" }))
      socket2.triggerMessage(JSON.stringify({ name: "foo", value: "this" }))
      expect(results).to.deep.equal(["test", "this"])
    })
    it("should be repeatable", () => {
      const results = [] as string[]
      const subject = webSocket<{ name: string; value: string }>(
        "ws://websocket"
      )
      const source = subject.multiplex(
        () => ({ sub: "foo" }),
        () => ({ unsub: "foo" }),
        value => value.name === "foo"
      )
      source
        .pipe(
          repeat(2),
          map(x => x.value)
        )
        .subscribe(x => {
          results.push(x)
        })
      const socket = MockWebSocket.lastSocket
      socket.open()
      expect(socket.lastMessageSent).to.deep.equal(
        JSON.stringify({ sub: "foo" }),
        "first multiplexed sub"
      )
      socket.triggerMessage(JSON.stringify({ name: "foo", value: "test" }))
      socket.triggerMessage(JSON.stringify({ name: "foo", value: "this" }))
      socket.triggerClose({ wasClean: true })
      const socket2 = MockWebSocket.lastSocket
      expect(socket2).not.to.equal(socket, "a new socket was not created")
      socket2.open()
      expect(socket2.lastMessageSent).to.deep.equal(
        JSON.stringify({ sub: "foo" }),
        "second multiplexed sub"
      )
      socket2.triggerMessage(JSON.stringify({ name: "foo", value: "test" }))
      socket2.triggerMessage(JSON.stringify({ name: "foo", value: "this" }))
      socket2.triggerClose({ wasClean: true })
      expect(results).to.deep.equal(
        ["test", "this", "test", "this"],
        "results were not equal"
      )
    })
    it("should multiplex over the webSocket", () => {
      const results = [] as Array<{ value: number; name: string }>
      const subject = webSocket<{ value: number; name: string }>(
        "ws://websocket"
      )
      const source = subject.multiplex(
        () => ({ sub: "foo" }),
        () => ({ unsub: "foo" }),
        value => value.name === "foo"
      )
      const sub = source.subscribe(function (x: any) {
        results.push(x.value)
      })
      const socket = MockWebSocket.lastSocket
      socket.open()
      expect(socket.lastMessageSent).to.deep.equal(
        JSON.stringify({ sub: "foo" })
      )
      ;[1, 2, 3, 4, 5]
        .map((x: number) => {
          return {
            name: x % 3 === 0 ? "bar" : "foo",
            value: x,
          }
        })
        .forEach((x: any) => {
          socket.triggerMessage(JSON.stringify(x))
        })
      expect(results).to.deep.equal([1, 2, 4, 5])
      sinon.spy(socket, "close")
      sub.unsubscribe()
      expect(socket.lastMessageSent).to.deep.equal(
        JSON.stringify({ unsub: "foo" })
      )
      expect(socket.close).have.been.called
      ;(<any>socket.close).restore()
    })
    it("should keep the same socket for multiple multiplex subscriptions", () => {
      const socketSubject = webSocket<string>({ url: "ws://mysocket" })
      const results = [] as string[]
      const socketMessages = [
        { id: "A" },
        { id: "B" },
        { id: "A" },
        { id: "B" },
        { id: "B" },
      ]
      const sub1 = socketSubject
        .multiplex(
          () => "no-op",
          () => results.push("A unsub"),
          (req: any) => req.id === "A"
        )
        .pipe(takeWhile((req: any) => !req.complete))
        .subscribe({
          next: () => results.push("A next"),
          error: e => results.push("A error " + e),
          complete: () => results.push("A complete"),
        })
      socketSubject
        .multiplex(
          () => "no-op",
          () => results.push("B unsub"),
          (req: any) => req.id === "B"
        )
        .subscribe({
          next: () => results.push("B next"),
          error: e => results.push("B error " + e),
          complete: () => results.push("B complete"),
        })
      // Setup socket and send messages
      let socket = MockWebSocket.lastSocket
      socket.open()
      socketMessages.forEach((msg, i) => {
        if (i === 1) {
          sub1.unsubscribe()
          expect((socketSubject as any)._socket).to.equal(socket)
        }
        socket.triggerMessage(JSON.stringify(msg))
      })
      socket.triggerClose({ wasClean: true })
      expect(results).to.deep.equal([
        "A next",
        "A unsub",
        "B next",
        "B next",
        "B next",
        "B complete",
        "B unsub",
      ])
    })
    it("should not close the socket until all subscriptions complete", () => {
      const socketSubject = webSocket<{ id: string; complete: boolean }>({
        url: "ws://mysocket",
      })
      const results = [] as string[]
      const socketMessages = [
        { id: "A" },
        { id: "B" },
        { id: "A", complete: true },
        { id: "B" },
        { id: "B", complete: true },
      ]
      socketSubject
        .multiplex(
          () => "no-op",
          () => results.push("A unsub"),
          req => req.id === "A"
        )
        .pipe(takeWhile(req => !req.complete))
        .subscribe({
          next: () => results.push("A next"),
          error: e => results.push("A error " + e),
          complete: () => results.push("A complete"),
        })
      socketSubject
        .multiplex(
          () => "no-op",
          () => results.push("B unsub"),
          req => req.id === "B"
        )
        .pipe(takeWhile(req => !req.complete))
        .subscribe({
          next: () => results.push("B next"),
          error: e => results.push("B error " + e),
          complete: () => results.push("B complete"),
        })
      // Setup socket and send messages
      let socket = MockWebSocket.lastSocket
      socket.open()
      socketMessages.forEach(msg => {
        socket.triggerMessage(JSON.stringify(msg))
      })
      expect(results).to.deep.equal([
        "A next",
        "B next",
        "A complete",
        "A unsub",
        "B next",
        "B complete",
        "B unsub",
      ])
    })
  })
  describe("node constructor", () => {
    it("should send and receive messages", () => {
      let messageReceived = false
      const subject = webSocket<string>(<any>{
        url: "ws://mysocket",
        WebSocketCtor: MockWebSocket,
      })
      subject.next("ping")
      subject.subscribe(x => {
        expect(x).to.equal("pong")
        messageReceived = true
      })
      const socket = MockWebSocket.lastSocket
      expect(socket.url).to.equal("ws://mysocket")
      socket.open()
      expect(socket.lastMessageSent).to.equal(JSON.stringify("ping"))
      socket.triggerMessage(JSON.stringify("pong"))
      expect(messageReceived).to.be.true
      subject.unsubscribe()
    })
    it("should handle constructor errors if no WebSocketCtor", () => {
      expect(() => {
        const subject = webSocket<string>(<any>{
          url: "ws://mysocket",
        })
      }).to.throw("no WebSocket constructor can be found")
    })
  })
})
class MockWebSocket {
  static sockets: Array<MockWebSocket> = []
  static get lastSocket(): MockWebSocket {
    const socket = MockWebSocket.sockets
    const length = socket.length
    return length > 0 ? socket[length - 1] : undefined!
  }
  static clearSockets(): void {
    MockWebSocket.sockets.length = 0
  }
  sent: string[] = []
  handlers: any = {}
  readyState: WebSocketState = WebSocketState.CONNECTING
  closeCode: any
  closeReason: any
  binaryType?: string
  constructor(public url: string, public protocol: string) {
    MockWebSocket.sockets.push(this)
  }
  send(data: string): void {
    this.sent.push(data)
  }
  get lastMessageSent(): string {
    const sent = this.sent
    const length = sent.length
    return length > 0 ? sent[length - 1] : undefined!
  }
  triggerClose(e: Partial<CloseEvent>): void {
    this.readyState = WebSocketState.CLOSED
    this.trigger("close", e)
  }
  triggerMessage(data: any): void {
    const messageEvent = {
      data: data,
      origin: "mockorigin",
      ports: undefined as any,
      source: root,
    }
    this.trigger("message", messageEvent)
  }
  open(): void {
    this.readyState = WebSocketState.OPEN
    this.trigger("open", {})
  }
  close(code: any, reason: any): void {
    if (this.readyState < WebSocketState.CLOSING) {
      this.readyState = WebSocketState.CLOSING
      this.closeCode = code
      this.closeReason = reason
    }
  }
  trigger(this: any, name: string, e: any) {
    if (this["on" + name]) {
      this["on" + name](e)
    }
    const lookup = this.handlers[name]
    if (lookup) {
      for (let i = 0; i < lookup.length; i++) {
        lookup[i](e)
      }
    }
  }
}
