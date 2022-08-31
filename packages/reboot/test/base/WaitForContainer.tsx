import { act } from "react-dom/test-utils"
import { mount } from "enzyme"
import { useRef } from "react"
import { useWaitForDOMRef } from "../../src/base/use.js"
import * as React from "react"

describe("useWaitForDOMRef", () => {
  it("Should resolve on first render if possible (element)", () => {
    let n = 0
    const container = document.createElement("div")
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      n++
      return null
    }
    const mock = jest.fn(resolved => {
      expect(resolved).toEqual(container)
    })
    act(() => {
      mount(<Test container={container} onResolved={mock} />)
    })
    expect(n).toEqual(1)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should resolve on first render if possible (ref)", () => {
    let renderCount = 0
    const container = React.createRef()
    container.current = document.createElement("div")
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const mock = jest.fn(resolved => {
      expect(resolved).toEqual(container.current)
    })
    act(() => {
      mount(<Test container={container} onResolved={mock} />)
    })
    expect(renderCount).toEqual(1)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should resolve on first render if possible (function)", () => {
    const div = document.createElement("div")
    const container = () => div
    let renderCount = 0
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const mock = jest.fn(resolved => {
      expect(resolved).toEqual(div)
    })
    act(() => {
      mount(<Test container={container} onResolved={mock} />)
    })
    expect(renderCount).toEqual(1)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should resolve after if required", () => {
    let renderCount = 0
    function Test({ container, onResolved }) {
      useWaitForDOMRef(container, onResolved)
      renderCount++
      return null
    }
    const mock = jest.fn(resolved => {
      expect(resolved.tagName).toEqual("DIV")
    })
    function Wrapper() {
      const container = useRef(null)
      return (
        <>
          <Test container={container} onResolved={mock} />
          <div ref={container} />
        </>
      )
    }
    act(() => {
      mount(<Wrapper onResolved={mock} />).update()
    })
    expect(renderCount).toEqual(2)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
