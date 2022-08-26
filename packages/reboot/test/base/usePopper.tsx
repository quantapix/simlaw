import { mount } from "enzyme"
import { usePopper } from "../../src/base/popper.jsx"

describe("usePopper", () => {
  function renderHook(fn, initialProps) {
    const result = { current: null }
    function Wrapper(props) {
      result.current = fn(props)
      return null
    }
    result.mount = mount(<Wrapper {...initialProps} />)
    result.update = props => result.mount.setProps(props)
    return result
  }
  const elements = {}
  beforeEach(() => {
    elements.mount = document.createElement("div")
    elements.reference = document.createElement("div")
    elements.popper = document.createElement("div")
    elements.mount.appendChild(elements.reference)
    elements.mount.appendChild(elements.popper)
    document.body.appendChild(elements.mount)
  })
  afterEach(() => {
    elements.mount.parentNode.removeChild(elements.mount)
  })
  it("Should return state", done => {
    const result = renderHook(() =>
      usePopper(elements.reference, elements.popper, {
        eventsEnabled: true,
      })
    )
    setTimeout(() => {
      expect(result.current.update).to.be.a("function")
      expect(result.current.forceUpdate).to.be.a("function")
      expect(result.current.styles).to.have.any.key("popper")
      expect(result.current.attributes).to.have.any.key("popper")
      done()
    })
  })
  it("Should add aria-describedBy for tooltips", done => {
    elements.popper.setAttribute("role", "tooltip")
    elements.popper.setAttribute("id", "example123")
    const result = renderHook(() =>
      usePopper(elements.reference, elements.popper)
    )
    setTimeout(() => {
      expect(document.querySelector('[aria-describedby="example123"]')).toEqual(
        elements.reference
      )
      result.mount.unmount()
      setTimeout(() => {
        expect(
          document.querySelector('[aria-describedby="example123"]')
        ).toEqual(null)
      })
      done()
    })
  })
  it("Should add to existing describedBy", done => {
    elements.popper.setAttribute("role", "tooltip")
    elements.popper.setAttribute("id", "example123")
    elements.reference.setAttribute("aria-describedby", "foo, bar , baz ")
    const result = renderHook(() =>
      usePopper(elements.reference, elements.popper)
    )
    setTimeout(() => {
      expect(
        document.querySelector(
          '[aria-describedby="foo, bar , baz ,example123"]'
        )
      ).toEqual(elements.reference)
      result.mount.unmount()
      setTimeout(() => {
        expect(
          document.querySelector('[aria-describedby="foo, bar , baz "]')
        ).toEqual(elements.reference)
        done()
      })
    })
  })
  it("Should not aria-describedBy any other role", done => {
    renderHook(() => usePopper(elements.reference, elements.popper))
    setTimeout(() => {
      expect(document.querySelector('[aria-describedby="example123"]')).toEqual(
        null
      )
      done()
    })
  })
  it("Should not add add duplicates to aria-describedby", done => {
    elements.popper.setAttribute("role", "tooltip")
    elements.popper.setAttribute("id", "example123")
    elements.reference.setAttribute("aria-describedby", "foo")
    const result = renderHook(() =>
      usePopper(elements.reference, elements.popper)
    )
    window.dispatchEvent(new Event("resize"))
    setTimeout(() => {
      expect(
        document.querySelector('[aria-describedby="foo,example123"]')
      ).toEqual(elements.reference)
      result.mount.unmount()
      setTimeout(() => {
        expect(document.querySelector('[aria-describedby="foo"]')).toEqual(
          elements.reference
        )
        done()
      })
    })
  })
})
