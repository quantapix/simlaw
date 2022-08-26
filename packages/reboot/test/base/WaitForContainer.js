import { useRef } from "react"
import * as React from "react"
import { act } from "react-dom/test-utils"
import { mount } from "enzyme"
import { useWaitForDOMRef } from "../../src/base/use.js"
describe("useWaitForDOMRef", () => {
  it("should resolve on first render if possible (element)", () => {
    let renderCount = 0
    const container = document.createElement("div")
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const onResolved = sinon.spy(resolved => {
      expect(resolved).toEqual(container)
    })
    act(() => {
      mount(<Test container={container} onResolved={onResolved} />)
    })
    expect(renderCount).toEqual(1)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })
  it("should resolve on first render if possible (ref)", () => {
    let renderCount = 0
    const container = React.createRef()
    container.current = document.createElement("div")
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const onResolved = sinon.spy(resolved => {
      expect(resolved).toEqual(container.current)
    })
    act(() => {
      mount(<Test container={container} onResolved={onResolved} />)
    })
    expect(renderCount).toEqual(1)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })
  it("should resolve on first render if possible (function)", () => {
    const div = document.createElement("div")
    const container = () => div
    let renderCount = 0
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const onResolved = sinon.spy(resolved => {
      expect(resolved).toEqual(div)
    })
    act(() => {
      mount(<Test container={container} onResolved={onResolved} />)
    })
    expect(renderCount).toEqual(1)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })
  it("should resolve after if required", () => {
    let renderCount = 0
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const onResolved = sinon.spy(resolved => {
      expect(resolved.tagName).toEqual("DIV")
    })
    function Wrapper() {
      const container = useRef(null)
      return (
        <>
          <Test container={container} onResolved={onResolved} />
          <div ref={container} />
        </>
      )
    }
    act(() => {
      mount(<Wrapper onResolved={onResolved} />).update()
    })
    expect(renderCount).toEqual(2)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })
})
