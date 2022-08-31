import { useRef } from "react"
import ReactDOM from "react-dom"
import simulant from "simulant"
import { mount } from "enzyme"
import { useRootClose } from "../../src/base/use.js"
const escapeKeyCode = 27

describe("useRootClose", () => {
  let attachTo: any
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
    it("Should close when clicked outside", () => {
      const mock = jest.fn()
      mount(<Wrapper onRootClose={mock} />, { attachTo })
      simulant.fire(document.getElementById("my-div")!, eventName)
      expect(mock).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock.mock.calls[0].args[0].type).to.be.oneOf([
        "click",
        "mousedown",
      ])
    })
    it("Should not close when right-clicked outside", () => {
      const mock = jest.fn()
      mount(<Wrapper onRootClose={mock} />, { attachTo })
      simulant.fire(document.getElementById("my-div")!, eventName, {
        button: 1,
      })
      expect(mock).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName, { button: 1 })
      expect(mock).not.toHaveBeenCalled()
    })
    it("Should not close when disabled", () => {
      const mock = jest.fn()
      mount(<Wrapper onRootClose={mock} disabled />, { attachTo })
      simulant.fire(document.getElementById("my-div")!, eventName)
      expect(mock).not.toHaveBeenCalled()
      simulant.fire(document.body, eventName)
      expect(mock).not.toHaveBeenCalled()
    })
    it("Should close when inside another RootCloseWrapper", () => {
      const outer = jest.fn()
      const inner = jest.fn()
      function Inner() {
        const ref = useRef()
        useRootClose(ref, inner, { clickTrigger })
        return (
          <div ref={ref} id="my-other-div">
            hello there
          </div>
        )
      }
      function Outer() {
        const ref = useRef()
        useRootClose(ref, outer, { clickTrigger })
        return (
          <div ref={ref}>
            <div id="my-div">hello there</div>
            <Inner />
          </div>
        )
      }
      mount(<Outer />, { attachTo })
      simulant.fire(document.getElementById("my-div")!, eventName)
      expect(outer).not.toHaveBeenCalled()
      expect(inner).toHaveBeenCalledTimes(1)
      expect(inner.mock.calls[0].args[0].type).to.be.oneOf([
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
    it("Should close when escape keyup", () => {
      const spy = jest.fn()
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
    it("Should close when inside another RootCloseWrapper", () => {
      const outer = jest.fn()
      const inner = jest.fn()
      mount(
        <Wrapper onRootClose={outer}>
          <div>
            <div id="my-div">hello there</div>
            <Wrapper onRootClose={inner}>
              <div id="my-other-div">hello there</div>
            </Wrapper>
          </div>
        </Wrapper>
      )
      simulant.fire(document.body, "keyup", { keyCode: escapeKeyCode })
      expect(inner).toHaveBeenCalledTimes(1)
      expect(inner.mock.calls[0].args.length).toEqual(1)
      expect(inner.mock.calls[0].args[0].keyCode).toEqual(escapeKeyCode)
      expect(inner.mock.calls[0].args[0].type).toEqual("keyup")
    })
  })
})
