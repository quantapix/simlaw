import * as React from "react"
import { useEffect } from "react"
import { Manager } from "../src/base/Manager.js"
import { fireEvent, render } from "@testing-library/react"
import { Header, Offcanvas, Title } from "../src/Offcanvas.jsx"
import { noop } from "../src/hooks.js"

describe("<Offcanvas>", () => {
  it("Should render the modal content", () => {
    const { getByTestId } = render(
      <Offcanvas show onHide={noop}>
        <strong data-testid="test">Message</strong>
      </Offcanvas>
    )
    const strongElem = getByTestId("test")
    expect(strongElem.tagName.toLowerCase()).toEqual("strong")
    expect(strongElem.textContent!).toEqual("Message")
  })
  it("Should set `visibility: visible` to `offcanvas`", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" show>
        <strong>Message</strong>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.tagName.toLowerCase()).toEqual("div")
    expect(offcanvasElem.classList.contains("offcanvas")).toBe(true)
    expect(offcanvasElem.style.visibility!).toEqual("visible")
  })
  it("Should close the offcanvas when the modal close button is clicked", done => {
    const doneOp = () => {
      done()
    }
    render(
      <Offcanvas show onHide={doneOp}>
        <Header closeButton />
        <strong>Message</strong>
      </Offcanvas>
    )
    const buttonElem = document.getElementsByClassName("btn-close")[0]
    expect(buttonElem.classList.contains("btn-close")).toBe(true)
    fireEvent.click(buttonElem)
  })
  it("Should pass className to the offcanvas", () => {
    const { getByTestId } = render(
      <Offcanvas show className="myoffcanvas" onHide={noop} data-testid="test">
        <strong>Message</strong>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.classList.contains("myoffcanvas")).toBe(true)
  })
  it("Should pass backdropClassName to the backdrop", () => {
    render(
      <Offcanvas show backdropClassName="custom-backdrop" onHide={noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const backdropElem =
      document.getElementsByClassName("offcanvas-backdrop")[0]
    expect(backdropElem.classList.contains("custom-backdrop")).toBe(true)
  })
  it("Should pass style to the offcanvas", () => {
    const { getByTestId } = render(
      <Offcanvas show style={{ color: "red" }} onHide={noop} data-testid="test">
        <strong>Message</strong>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.style.color).toEqual("red")
  })
  it("Should pass transition callbacks to Transition", done => {
    const mock = jest.fn()
    const Elem = () => {
      const [show, setShow] = React.useState(true)
      return (
        <Offcanvas
          show={show}
          onHide={noop}
          onExit={mock}
          onExiting={mock}
          onExited={() => {
            mock()
            expect(mock.callCount).toEqual(6)
            done()
          }}
          onEnter={mock}
          onEntering={mock}
          onEntered={() => {
            mock()
            setShow(false)
          }}
        >
          <strong>Message</strong>
        </Offcanvas>
      )
    }
    render(<Elem />)
  })
  it("Should close when backdrop clicked", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={mock}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const backdropElem =
      document.getElementsByClassName("offcanvas-backdrop")[0]
    fireEvent.click(backdropElem)
    expect(mock).toHaveBeenCalled()
  })
  it("Should not close when static backdrop is clicked", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={mock} backdrop="static">
        <strong>Message</strong>
      </Offcanvas>
    )
    const backdropElem =
      document.getElementsByClassName("offcanvas-backdrop")[0]
    fireEvent.click(backdropElem)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should not call onHide if the click target comes from inside the offcanvas", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <>
        <Offcanvas show onHide={mock} data-testid="test">
          <strong>Message</strong>
        </Offcanvas>
        <div id="outside">outside</div>
      </>
    )
    const offcanvasElem = getByTestId("test")
    fireEvent.click(offcanvasElem)
    expect(mock).not.toHaveBeenCalled()
  })
  it('Should set aria-labelledby to the role="dialog" element if aria-labelledby set', () => {
    const { getByTestId } = render(
      <Offcanvas
        show
        onHide={noop}
        aria-labelledby="offcanvas-title"
        data-testid="test"
      >
        <Header closeButton>
          <Title id="offcanvas-title">Offcanvas heading</Title>
        </Header>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.classList.contains("show")).toBe(true)
    expect(offcanvasElem.getAttribute("role")!).toEqual("dialog")
    expect(offcanvasElem.getAttribute("aria-labelledby")!).toEqual(
      "offcanvas-title"
    )
  })
  it("Should call onEscapeKeyDown when keyboard is true", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={noop} keyboard onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Offcanvas>
    )
    fireEvent.keyDown(document, { key: "Escape", code: "Escape", keyCode: 27 })
    expect(mock).toHaveBeenCalled()
  })
  it("Should not call onEscapeKeyDown when keyboard is false", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={noop} keyboard={false} onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Offcanvas>
    )
    fireEvent.keyDown(document, { key: "Escape", code: "Escape", keyCode: 27 })
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should use custom props manager if specified", done => {
    class MyModalManager extends Manager {
      add() {
        done()
        return 0
      }
    }
    const managerRef = React.createRef<any>()
    ;(managerRef as any).current = new MyModalManager()
    render(
      <Offcanvas show onHide={noop} manager={managerRef.current}>
        <strong>Message</strong>
      </Offcanvas>
    )
  })
  it("Should not change overflow style when scroll=true", () => {
    const containerRef = React.createRef<any>()
    render(
      <div ref={containerRef} style={{ height: "2000px", overflow: "scroll" }}>
        <Offcanvas show onHide={noop} container={containerRef} scroll>
          <strong>Message</strong>
        </Offcanvas>
      </div>
    )
    expect(containerRef.current.style.overflow).toEqual("scroll")
  })
  it("Should set responsive class", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" responsive="lg" show onHide={noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.classList.contains("offcanvas-lg")).toBe(true)
  })
  it("Should render offcanvas when show=false", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" responsive="lg" onHide={noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const offcanvasElem = getByTestId("test")
    expect(offcanvasElem.getAttribute("role")).not.toBeTruthy()
  })
  it("Should not mount, unmount and mount content on show", () => {
    const InnerComponent = ({ onMount, onUnmount }) => {
      useEffect(() => {
        onMount()
        return () => {
          onUnmount()
        }
      })
      return <div>Content</div>
    }
    const mount = jest.fn()
    const unmount = jest.fn()
    const { unmount } = render(
      <Offcanvas data-testid="test" onHide={noop} show>
        <InnerComponent onMount={mount} onUnmount={unmount} />
      </Offcanvas>
    )
    expect(mount.callCount).toEqual(1)
    unmount()
    expect(unmount.callCount).toEqual(1)
  })
})
