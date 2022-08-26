import { Body, Header, Footer, Modal, Props, Title } from "../src/Modal.jsx"
import { fireEvent, render } from "@testing-library/react"
import { Manager } from "../src/base/Manager.js"
import * as React from "react"

describe("<Modal>", () => {
  it("Should forward ref to BaseModal", () => {
    const ref = React.createRef<Props>()
    render(
      <Modal show animation={false} ref={ref}>
        <strong>Message</strong>
      </Modal>
    )
    expect(ref.current!["dialog"]).toBeTruthy()
  })
  it("Should render the modal content", () => {
    const { getByTestId } = render(
      <Modal show animation={false} data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByTestId("modal").querySelector("strong")!.textContent).toEqual(
      "Message"
    )
  })
  it("Should sets `display: block` to `div.modal` when animation is false", () => {
    const ref = React.createRef<Props>()
    render(
      <Modal show animation={false} ref={ref}>
        <strong>Message</strong>
      </Modal>
    )
    expect(ref.current!["dialog"].style.display).toEqual("block")
  })
  it("Should close the modal when the modal dialog is clicked", done => {
    const doneOp = () => {
      done()
    }
    const { getByRole } = render(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByRole("dialog"))
  })
  it('Should not close the modal when the "static" dialog is clicked', () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Modal show onHide={mock} backdrop="static" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByTestId("modal"))
    expect(mock).not.toHaveBeenCalled()
  })
  it('Should show "static" dialog animation when backdrop is clicked', () => {
    const { getByRole } = render(
      <Modal show backdrop="static">
        <strong>Message</strong>
      </Modal>
    )
    const modalDialog = getByRole("dialog")
    fireEvent.click(modalDialog)
    expect(getByRole("dialog").classList.contains("modal-static")).toBe(true)
  })
  it('Should show "static" dialog animation when esc pressed and keyboard is false', () => {
    const { getByRole } = render(
      <Modal show backdrop="static" keyboard={false}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    expect(getByRole("dialog").classList.contains("modal-static")).toBe(true)
  })
  it('Should not show "static" dialog animation when esc pressed and keyboard is true', () => {
    const { getByRole } = render(
      <Modal show backdrop="static" keyboard>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    expect(getByRole("dialog").classList.contains("modal-static")).toBe(false)
  })
  it('Should not show "static" dialog animation modal backdrop is not "static"', () => {
    const { getByTestId, getByRole } = render(
      <Modal show backdrop data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByTestId("modal"))
    expect(getByRole("dialog").classList.contains("modal-static")).toBe(false)
  })
  it("Should close the modal when the modal close button is clicked", done => {
    const doneOp = () => {
      done()
    }
    const { getByTestId } = render(
      <Modal show onHide={doneOp}>
        <Header closeButton data-testid="close-btn" />
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByTestId("close-btn").querySelector("button")!)
  })
  it("Should pass className to the dialog", () => {
    const { getByRole } = render(
      <Modal show className="mymodal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByRole("dialog").classList.contains("mymodal")).toBe(true)
  })
  it("Should use backdropClassName to add classes to the backdrop", () => {
    render(
      <Modal show backdropClassName="my-modal-backdrop">
        <strong>Message</strong>
      </Modal>
    )
    expect(
      document
        .querySelector(".modal-backdrop")!
        .classList.contains("my-modal-backdrop")
    ).toBe(true)
  })
  it("Should pass size to the dialog", () => {
    const { getByTestId } = render(
      <Modal show size="sm" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByTestId("modal").classList.contains("modal-sm")).toBe(true)
  })
  it("Should pass fullscreen as bool to the dialog", () => {
    const { getByTestId } = render(
      <Modal show fullscreen data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByTestId("modal").classList.contains("modal-fullscreen")).toBe(
      true
    )
  })
  it("Should pass fullscreen as string to the dialog", () => {
    const { getByTestId } = render(
      <Modal show fullscreen="sm-down" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(
      getByTestId("modal").classList.contains("modal-fullscreen-sm-down")
    ).toBe(true)
  })
  it("Should allow custom breakpoints for fullscreen", () => {
    const { getByTestId } = render(
      <Modal show fullscreen="custom-down" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(
      getByTestId("modal").classList.contains("modal-fullscreen-custom-down")
    ).toBe(true)
  })
  it("Should pass centered to the dialog", () => {
    const { getByTestId } = render(
      <Modal show centered data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(
      getByTestId("modal").classList.contains("modal-dialog-centered")
    ).toBe(true)
  })
  it("Should pass scrollable to the dialog", () => {
    const { getByTestId } = render(
      <Modal show scrollable data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(
      getByTestId("modal").classList.contains("modal-dialog-scrollable")
    ).toBe(true)
  })
  it("Should pass dialog style to the dialog", () => {
    const { getByRole } = render(
      <Modal show style={{ color: "red" }}>
        <strong>Message</strong>
      </Modal>
    )
    expect(getByRole("dialog").style.color).toEqual("red")
  })
  it("Should pass dialogClassName to the dialog", () => {
    const { getByTestId } = render(
      <Modal show dialogClassName="my-dialog" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByTestId("modal").classList.contains("my-dialog")).toBe(true)
  })
  it("Should pass contentClassName to .modal-content", () => {
    const { getByTestId } = render(
      <Modal show contentClassName="my-content" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    const modalContent = getByTestId("modal").querySelector(".modal-content")!
    expect(modalContent.classList.contains("my-content")).toBe(true)
  })
  it("Should use dialogAs", () => {
    function CustomDialog() {
      return <div className="custom-dialog" tabIndex={-1} />
    }
    render(
      <Modal show dialogAs={CustomDialog}>
        <strong>Message</strong>
      </Modal>
    )
    expect(document.querySelector(".custom-dialog")!).toBeTruthy()
  })
  it("Should pass transition callbacks to Transition", done => {
    const mock = jest.fn()
    const Elem = () => {
      const [show, setShow] = React.useState(true)
      return (
        <Modal
          show={show}
          onEnter={mock}
          onEntering={mock}
          onEntered={() => {
            mock()
            setShow(false)
          }}
          onExit={mock}
          onExiting={mock}
          onExited={() => {
            mock()
            expect(mock.callCount).toEqual(6)
            done()
          }}
        >
          <strong>Message</strong>
        </Modal>
      )
    }
    render(<Elem />)
  })
  it("Should call `transitionend` before `exited`", done => {
    const mock = jest.fn()
    const { getByRole, rerender } = render(
      <Modal
        show
        data-testid="modal"
        style={{ transition: "opacity 1s linear" }}
      >
        <strong>Message</strong>
      </Modal>
    )
    const modal = getByRole("dialog")
    modal.addEventListener("transitionend", mock)
    rerender(
      <Modal
        show={false}
        onExited={() => {
          expect(mock.callCount).toEqual(1)
          modal.removeEventListener("transitionend", mock)
          done()
        }}
      >
        Foo
      </Modal>
    )
  })
  describe("cleanup", () => {
    let mock
    beforeEach(() => {
      mock = jest.fn(window, "removeEventListener")
    })
    afterEach(() => {
      mock.restore()
    })
    it("Should remove resize listener when unmounted", () => {
      class Component extends React.Component {
        override state = {
          show: true,
        }
        override render() {
          if (!this.state.show) {
            return null
          }
          return <Modal show>Foo</Modal>
        }
      }
      const { rerender } = render(<Component />)
      rerender(<Modal show={false}>Foo</Modal>)
      expect(mock).toHaveBeenCalledWith("resize")
    })
  })
  it("Should close once it was clicked outside of the Modal", () => {
    const mock = jest.fn()
    const { getByRole } = render(
      <Modal show onHide={mock}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByRole("dialog"))
    expect(mock).toHaveBeenCalled()
  })
  it("Should not call onHide if the click target comes from inside the dialog", () => {
    const mock = jest.fn()
    const { getByTestId, getByRole } = render(
      <Modal show onHide={mock} data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.mouseDown(getByTestId("modal"))
    fireEvent.mouseUp(getByRole("dialog"))
    fireEvent.click(getByRole("dialog"))
    expect(mock).not.toHaveBeenCalled()
  })
  it('Should set aria-labelledby to the role="dialog" element if aria-labelledby set', () => {
    const { getByRole } = render(
      <Modal show aria-labelledby="modal-title">
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-labelledby")).toEqual(
      "modal-title"
    )
  })
  it('Should set aria-describedby to the role="dialog" element if aria-describedby set', () => {
    const { getByRole } = render(
      <Modal show aria-describedby="modal-title">
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-describedby")).toEqual(
      "modal-title"
    )
  })
  it('Should set aria-label to the role="dialog" element if aria-label set', () => {
    const labelValue = "modal-label"
    const { getByRole } = render(
      <Modal show aria-label={labelValue}>
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-label")).toEqual(labelValue)
  })
  it("Should call onEscapeKeyDown when keyboard is true", () => {
    const mock = jest.fn()
    const { getByRole } = render(
      <Modal show keyboard onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    expect(mock).toHaveBeenCalled()
  })
  it("Should not call onEscapeKeyDown when keyboard is false", () => {
    const mock = jest.fn()
    const { getByRole } = render(
      <Modal show keyboard={false} onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should use custom props manager if specified", done => {
    class MyModalManager extends Manager {
      override add() {
        done()
      }
    }
    const managerRef = React.createRef<Manager | null>()
    managerRef.current = new MyModalManager()
    render(
      <Modal show manager={managerRef.current as any}>
        <strong>Message</strong>
      </Modal>
    )
  })
})
describe("Header", () => {
  it('uses "div" by default', () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Header>
    )
    expect(getByTestId("test-modal").tagName.toLowerCase()).toEqual("div")
    expect(getByTestId("test-modal").classList.contains("modal-header")).toBe(
      true
    )
    expect(getByTestId("test-modal").classList.contains("custom-class")).toBe(
      true
    )
    expect(
      getByTestId("test-modal").querySelector("strong")!.textContent!
    ).toEqual("Content")
  })
  it("has closeButton without a containing Modal and renders", () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton />
    )
    expect(getByTestId("test-modal").tagName.toLowerCase()).toEqual("div")
    expect(getByTestId("test-modal").querySelector("button")!).toBeTruthy()
  })
  it("Should trigger onHide when modal is closed", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton onHide={mock} />
    )
    fireEvent.click(getByTestId("test-modal").querySelector("button")!)
    expect(mock).toHaveReturnedTimes(1)
  })
  it("Should render close button variant", () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton closeVariant="white" />
    )
    const button = getByTestId("test-modal").querySelector("button")!
    expect(button).toBeTruthy()
    expect(button.classList.contains("btn-close-white")).toBe(true)
  })
})
describe("Body", () => {
  it('uses "div" by default', () => {
    const { getByTestId } = render(
      <Body data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Body>
    )
    const elem = getByTestId("test-modal")
    expect(elem.tagName.toLowerCase()).toEqual("div")
    expect(elem.classList.contains("modal-body")).toBe(true)
    expect(elem.classList.contains("custom-class")).toBe(true)
    expect(elem.querySelector("strong")!.textContent!).toEqual("Content")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Body data-testid="test-modal" as="section">
        <strong>Content</strong>
      </Body>
    )
    expect(getByTestId("test-modal").classList.contains("modal-body")).toBe(
      true
    )
    expect(getByTestId("test-modal").tagName.toLowerCase()).toEqual("section")
  })
})
describe("Footer", () => {
  it('uses "div" by default', () => {
    const { getByTestId } = render(
      <Footer data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Footer>
    )
    const elem = getByTestId("test-modal")
    expect(elem.tagName.toLowerCase()).toEqual("div")
    expect(elem.classList.contains("modal-footer")).toBe(true)
    expect(elem.classList.contains("custom-class")).toBe(true)
    expect(elem.querySelector("strong")!.textContent!).toEqual("Content")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Footer data-testid="test-modal" as="section">
        <strong>Content</strong>
      </Footer>
    )
    expect(getByTestId("test-modal").classList.contains("modal-footer")).toBe(
      true
    )
    expect(getByTestId("test-modal").tagName.toLowerCase()).toEqual("section")
  })
})
describe("Title", () => {
  it('uses "div" by default', () => {
    const { getByTestId } = render(
      <Title data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Title>
    )
    const elem = getByTestId("test-modal")
    expect(elem.tagName.toLowerCase()).toEqual("div")
    expect(elem.classList.contains("h4")).toBe(true)
    expect(elem.classList.contains("modal-title")).toBe(true)
    expect(elem.classList.contains("custom-class")).toBe(true)
    expect(elem.querySelector("strong")!.textContent!).toEqual("Content")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Title data-testid="test-modal" as="h4">
        <strong>Content</strong>
      </Title>
    )
    expect(getByTestId("test-modal").classList.contains("modal-title")).toBe(
      true
    )
    expect(getByTestId("test-modal").tagName.toLowerCase()).toEqual("h4")
  })
})
