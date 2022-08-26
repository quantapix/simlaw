import deprecated from "prop-types-extra/lib/deprecated"
import Util from "util"
import Enzyme, { ShallowWrapper, ReactWrapper } from "enzyme"
import Adapter from "enzyme-adapter-react-16"
Enzyme.configure({ adapter: new Adapter() })
function assertLength(length) {
  return function $assertLength(selector) {
    let result = this.find(selector)
    expect(
      result,
      `Expected to find ${length} match but found ${
        result.length
      } for selector "${selector}" on element: \n\n${this.debug()}`
    ).toHaveLength(length)
    return result
  }
}
ReactWrapper.prototype.assertSingle = assertLength(1)
ShallowWrapper.prototype.assertSingle = assertLength(1)
ReactWrapper.prototype.assertNone = assertLength(0)
ShallowWrapper.prototype.assertNone = assertLength(0)
beforeEach(() => {
  sinon.stub(console, "error").callsFake((msg, ...args) => {
    let expected = false
    let formattedStr = msg
    if (args.length) {
      formattedStr = Util.format(msg, ...args)
    }
    console.error.expected.forEach(about => {
      if (formattedStr.indexOf(about) !== -1) {
        console.error.warned[about] = true
        expected = true
      }
    })
    if (expected) {
      return
    }
    console.error.threw = true
    throw new Error(formattedStr)
  })
  console.error.expected = []
  console.error.warned = Object.create(null)
  console.error.threw = false
})
afterEach(() => {
  if (!console.error.threw && console.error.expected.length) {
    expect(console.error.warned).to.have.keys(console.error.expected)
  }
  console.error.restore()
  deprecated._resetWarned()
})
describe("Process environment for tests", () => {
  it("should not be production for React console warnings", () => {
    expect(process.env.NODE_ENV).to.not.equal("production")
  })
})
const srcContext = require.context("../src", true, /.*\.js$/)
srcContext.keys().forEach(srcContext)
const testsContext = require.context(".", true, /Spec$/)
testsContext.keys().forEach(testsContext)
