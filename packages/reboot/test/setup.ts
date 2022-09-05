//import Enzyme from "enzyme"
//import Adapter from "enzyme-adapter-react-16"
//import matchMediaPolyfill from "mq-polyfill"

/*
Enzyme.configure({ adapter: new Adapter() })
if (typeof window !== "undefined") {
  //matchMediaPolyfill(window)
  window.resizeTo = function resizeTo(width, height) {
    Object.assign(this, {
      innerWidth: width,
      innerHeight: height,
      outerWidth: width,
      outerHeight: height,
    }).dispatchEvent(new this.Event("resize"))
  }
}
*/
let expected = 0
let actual = 0
function onError(x: any) {
  if (expected) x.preventDefault()
  actual += 1
}
expect.assertions = (x: any) => {
  expected = x
}
beforeEach(() => {
  expected = 0
  actual = 0
  if (typeof window !== "undefined") {
    window.addEventListener("error", onError)
  }
})
afterEach(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("error", onError)
  }
  if (expected) expect(actual).toBe(expected)
  expected = 0
})
