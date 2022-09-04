import { fireEvent, render } from "@testing-library/react"
import { Header, Offcanvas, Title, Navbar, Toggle } from "../src/Offcanvas.jsx"
import { Manager } from "../src/base/Manager.js"
import * as qh from "../src/hooks.js"
import * as qr from "react"

describe("<Offcanvas>", () => {
  it("Should render the modal content", () => {
    const { getByTestId } = render(
      <Offcanvas show onHide={qh.noop}>
        <strong data-testid="test">Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("strong")
    expect(y.textContent!).toEqual("Message")
  })
  it("Should set `visibility: visible` to `offcanvas`", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" show>
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("div")
    expect(y.classList.contains("offcanvas")).toBe(true)
    expect(y.style.visibility!).toEqual("visible")
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
    const y: any = document.getElementsByClassName("btn-close")[0]
    expect(y.classList.contains("btn-close")).toBe(true)
    fireEvent.click(y)
  })
  it("Should pass className to the offcanvas", () => {
    const { getByTestId } = render(
      <Offcanvas
        show
        className="myoffcanvas"
        onHide={qh.noop}
        data-testid="test"
      >
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("myoffcanvas")).toBe(true)
  })
  it("Should pass backdropClassName to the backdrop", () => {
    render(
      <Offcanvas show backdropClassName="custom-backdrop" onHide={qh.noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const y: any = document.getElementsByClassName("offcanvas-backdrop")[0]
    expect(y.classList.contains("custom-backdrop")).toBe(true)
  })
  it("Should pass style to the offcanvas", () => {
    const { getByTestId } = render(
      <Offcanvas
        show
        style={{ color: "red" }}
        onHide={qh.noop}
        data-testid="test"
      >
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.style.color).toEqual("red")
  })
  it("Should pass transition callbacks to Transition", done => {
    const mock = jest.fn()
    const Elem = () => {
      const [show, setShow] = qr.useState(true)
      return (
        <Offcanvas
          show={show}
          onHide={qh.noop}
          onExit={mock}
          onExiting={mock}
          onExited={() => {
            mock()
            expect(mock.mock.calls.length).toEqual(6)
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
    const y = document.getElementsByClassName("offcanvas-backdrop")[0]
    fireEvent.click(y!)
    expect(mock).toHaveBeenCalled()
  })
  it("Should not close when static backdrop is clicked", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={mock} backdrop="static">
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = document.getElementsByClassName("offcanvas-backdrop")[0]
    fireEvent.click(y!)
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
    const y = getByTestId("test")
    fireEvent.click(y)
    expect(mock).not.toHaveBeenCalled()
  })
  it('Should set aria-labelledby to the role="dialog" element if aria-labelledby set', () => {
    const { getByTestId } = render(
      <Offcanvas
        show
        onHide={qh.noop}
        aria-labelledby="offcanvas-title"
        data-testid="test"
      >
        <Header closeButton>
          <Title id="offcanvas-title">Offcanvas heading</Title>
        </Header>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("show")).toBe(true)
    expect(y.getAttribute("role")!).toEqual("dialog")
    expect(y.getAttribute("aria-labelledby")!).toEqual("offcanvas-title")
  })
  it("Should call onEscapeKeyDown when keyboard is true", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={qh.noop} keyboard onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Offcanvas>
    )
    fireEvent.keyDown(document, { key: "Escape", code: "Escape", keyCode: 27 })
    expect(mock).toHaveBeenCalled()
  })
  it("Should not call onEscapeKeyDown when keyboard is false", () => {
    const mock = jest.fn()
    render(
      <Offcanvas show onHide={qh.noop} keyboard={false} onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Offcanvas>
    )
    fireEvent.keyDown(document, { key: "Escape", code: "Escape", keyCode: 27 })
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should use custom props manager if specified", done => {
    class Mgr extends Manager {
      override add() {
        done()
        return 0
      }
    }
    const ref = qr.createRef<any>()
    ;(ref as any).current = new Mgr()
    render(
      <Offcanvas show onHide={qh.noop} manager={ref.current}>
        <strong>Message</strong>
      </Offcanvas>
    )
  })
  it("Should not change overflow style when scroll=true", () => {
    const ref = qr.createRef<any>()
    render(
      <div ref={ref} style={{ height: "2000px", overflow: "scroll" }}>
        <Offcanvas show onHide={qh.noop} container={ref} scroll>
          <strong>Message</strong>
        </Offcanvas>
      </div>
    )
    expect(ref.current.style.overflow).toEqual("scroll")
  })
  it("Should set responsive class", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" responsive="lg" show onHide={qh.noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("offcanvas-lg")).toBe(true)
  })
  it("Should render offcanvas when show=false", () => {
    const { getByTestId } = render(
      <Offcanvas data-testid="test" responsive="lg" onHide={qh.noop}>
        <strong>Message</strong>
      </Offcanvas>
    )
    const y = getByTestId("test")
    expect(y.getAttribute("role")).not.toBeTruthy()
  })
  it("Should not mount, unmount and mount content on show", () => {
    const InnerComponent = ({
      onMount,
      onUnmount,
    }: {
      onMount: any
      onUnmount: any
    }) => {
      qr.useEffect(() => {
        onMount()
        return () => {
          onUnmount()
        }
      })
      return <div>Content</div>
    }
    const mock = jest.fn()
    const mock2 = jest.fn()
    render(
      <Offcanvas data-testid="test" onHide={qh.noop} show>
        <InnerComponent onMount={mock} onUnmount={mock2} />
      </Offcanvas>
    )
    expect(mock.mock.calls.length).toEqual(1)
    mock2()
    expect(mock2.mock.calls.length).toEqual(1)
  })
})
describe("<NavbarOffcanvas>", () => {
  it("Should should open the offcanvas", () => {
    const { getByTestId } = render(
      <Navbar>
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">hello</Offcanvas>
      </Navbar>
    )
    fireEvent.click(getByTestId("toggle"))
    expect(getByTestId("offcanvas").classList.contains("show")).toBe(true)
  })
  it("Should close the offcanvas on header close button click", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Navbar onToggle={mock} expanded>
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">
          <Header closeButton>header</Header>
        </Offcanvas>
      </Navbar>
    )
    fireEvent.click(getByLabelText("Close"))
    expect(mock).toHaveBeenCalledWith(false)
  })
  it("Should render nav items with expand prop", () => {
    const { getByText } = render(
      <Navbar expand="sm">
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">hello</Offcanvas>
      </Navbar>
    )
    expect(getByText("hello")).toBeTruthy()
  })
})
