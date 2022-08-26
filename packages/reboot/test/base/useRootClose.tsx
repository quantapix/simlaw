import { useRef } from "react"
import ReactDOM from "react-dom"
import simulant from "simulant"
import { mount } from "enzyme"
import useRootClose from "../src/useRootClose"
const escapeKeyCode = 27
describe("useRootClose", () => {
  let attachTo
  beforeEach(() => {
    attachTo = document.createElement("div")
    document.body.appendChild(attachTo)
  })
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(attachTo)
    document.body.removeChild(attachTo)
  })
  describe("using default event", () => {
    shouldCloseOn(undefined, "click")
  })
  describe("using click event", () => {
    shouldCloseOn("click", "click")
  })
  describe("using mousedown event", () => {
    shouldCloseOn("mousedown", "mousedown")
  })
  function shouldCloseOn(clickTrigger, eventName) {
    function Wrapper({ onRootClose, disabled }) {
      const ref = useRef()
      useRootClose(ref, onRootClose, {
        disabled,
        clickTrigger,
      })
      return (
        <div ref={ref} id="my-div">
          hello there
        </div>
      )
    }
    it("should close when clicked outside", () => {
      let spy = jest.fn()
      mount(<Wrapper onRootClose={spy} />, { attachTo })
      simulant.fire(document.getElementById("my-div"), eventName)
      expect(spy).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0].args[0].type).to.be.oneOf(["click", "mousedown"])
    })
    it("should not close when right-clicked outside", () => {
      let spy = jest.fn()
      mount(<Wrapper onRootClose={spy} />, { attachTo })
      simulant.fire(document.getElementById("my-div"), eventName, {
        button: 1,
      })
      expect(spy).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName, { button: 1 })
      expect(spy).not.toHaveBeenCalled()
    })
    it("should not close when disabled", () => {
      let spy = jest.fn()
      mount(<Wrapper onRootClose={spy} disabled />, { attachTo })
      simulant.fire(document.getElementById("my-div"), eventName)
      expect(spy).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName)
      expect(spy).not.toHaveBeenCalled()
    })
    it("should close when inside another RootCloseWrapper", () => {
      let outerSpy = jest.fn()
      let innerSpy = jest.fn()
      function Inner() {
        const ref = useRef()
        useRootClose(ref, innerSpy, { clickTrigger })
        return (
          <div ref={ref} id="my-other-div">
            hello there
          </div>
        )
      }
      function Outer() {
        const ref = useRef()
        useRootClose(ref, outerSpy, { clickTrigger })
        return (
          <div ref={ref}>
            <div id="my-div">hello there</div>
            <Inner />
          </div>
        )
      }
      mount(<Outer />, { attachTo })
      simulant.fire(document.getElementById("my-div"), eventName)
      expect(outerSpy).not.toHaveBeenCalled()
      expect(innerSpy).toHaveBeenCalledTimes(1)
      expect(innerSpy.mock.calls[0].args[0].type).to.be.oneOf([
        "click",
        "mousedown",
      ])
    })
  }
  describe("using keyup event", () => {
    function Wrapper({ children, onRootClose, event: clickTrigger }) {
      const ref = useRef()
      useRootClose(ref, onRootClose, { clickTrigger })
      return (
        <div ref={ref} id="my-div">
          {children}
        </div>
      )
    }
    it("should close when escape keyup", () => {
      let spy = jest.fn()
      mount(
        <Wrapper onRootClose={spy}>
          <div id="my-div">hello there</div>
        </Wrapper>
      )
      expect(spy).not.toHaveBeenCalled()
      simulant.fire(document.body, "keyup", { keyCode: escapeKeyCode })
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0].args.length).toEqual(1)
      expect(spy.mock.calls[0].args[0].keyCode).toEqual(escapeKeyCode)
      expect(spy.mock.calls[0].args[0].type).toEqual("keyup")
    })
    it("should close when inside another RootCloseWrapper", () => {
      let outerSpy = jest.fn()
      let innerSpy = jest.fn()
      mount(
        <Wrapper onRootClose={outerSpy}>
          <div>
            <div id="my-div">hello there</div>
            <Wrapper onRootClose={innerSpy}>
              <div id="my-other-div">hello there</div>
            </Wrapper>
          </div>
        </Wrapper>
      )
      simulant.fire(document.body, "keyup", { keyCode: escapeKeyCode })
      // TODO: Update to match expectations.
      // expect(outerSpy).not.toHaveBeenCalled();
      expect(innerSpy).toHaveBeenCalledTimes(1)
      expect(innerSpy.mock.calls[0].args.length).toEqual(1)
      expect(innerSpy.mock.calls[0].args[0].keyCode).toEqual(escapeKeyCode)
      expect(innerSpy.mock.calls[0].args[0].type).toEqual("keyup")
    })
  })
})
