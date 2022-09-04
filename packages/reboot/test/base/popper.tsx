import { mount } from "enzyme"
import { usePopper } from "../../src/base/popper.js"

describe("usePopper", () => {
  function renderHook(f: any, ps?: any) {
    const y: { current?: any; mount?: any; update?: any } = {}
    function Wrapper(xs: any) {
      y.current = f(xs)
      return null
    }
    y.mount = mount(<Wrapper {...ps} />)
    y.update = (xs: any) => y.mount.setProps(xs)
    return y
  }
  const elems: { reference?: any; mount?: any; popper?: any } = {}
  beforeEach(() => {
    elems.mount = document.createElement("div")
    elems.reference = document.createElement("div")
    elems.popper = document.createElement("div")
    elems.mount.appendChild(elems.reference)
    elems.mount.appendChild(elems.popper)
    document.body.appendChild(elems.mount)
  })
  afterEach(() => {
    elems.mount.parentNode.removeChild(elems.mount)
  })
  it("Should return state", done => {
    const y = renderHook(() =>
      usePopper(elems.reference, elems.popper, {
        //eventsEnabled: true,
      })
    )
    setTimeout(() => {
      expect(y.current.update).toBe("function")
      expect(y.current.forceUpdate).toBe("function")
      expect(y.current.styles).toHaveProperty("popper")
      expect(y.current.attributes).toHaveProperty("popper")
      done()
    })
  })
  it("Should add aria-describedBy for tooltips", done => {
    elems.popper.setAttribute("role", "tooltip")
    elems.popper.setAttribute("id", "example123")
    const y = renderHook(() => usePopper(elems.reference, elems.popper))
    setTimeout(() => {
      expect(document.querySelector('[aria-describedby="example123"]')).toEqual(
        elems.reference
      )
      y.mount.unmount()
      setTimeout(() => {
        expect(
          document.querySelector('[aria-describedby="example123"]')
        ).toEqual(null)
      })
      done()
    })
  })
  it("Should add to existing describedBy", done => {
    elems.popper.setAttribute("role", "tooltip")
    elems.popper.setAttribute("id", "example123")
    elems.reference.setAttribute("aria-describedby", "foo, bar , baz ")
    const y = renderHook(() => usePopper(elems.reference, elems.popper))
    setTimeout(() => {
      expect(
        document.querySelector(
          '[aria-describedby="foo, bar , baz ,example123"]'
        )
      ).toEqual(elems.reference)
      y.mount.unmount()
      setTimeout(() => {
        expect(
          document.querySelector('[aria-describedby="foo, bar , baz "]')
        ).toEqual(elems.reference)
        done()
      })
    })
  })
  it("Should not aria-describedBy any other role", done => {
    renderHook(() => usePopper(elems.reference, elems.popper))
    setTimeout(() => {
      expect(document.querySelector('[aria-describedby="example123"]')).toEqual(
        null
      )
      done()
    })
  })
  it("Should not add add duplicates to aria-describedby", done => {
    elems.popper.setAttribute("role", "tooltip")
    elems.popper.setAttribute("id", "example123")
    elems.reference.setAttribute("aria-describedby", "foo")
    const result = renderHook(() => usePopper(elems.reference, elems.popper))
    window.dispatchEvent(new Event("resize"))
    setTimeout(() => {
      expect(
        document.querySelector('[aria-describedby="foo,example123"]')
      ).toEqual(elems.reference)
      result.mount.unmount()
      setTimeout(() => {
        expect(document.querySelector('[aria-describedby="foo"]')).toEqual(
          elems.reference
        )
        done()
      })
    })
  })
})
