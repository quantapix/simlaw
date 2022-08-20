import * as React from "react"
import { fireEvent, render } from "@testing-library/react"
import ModalManager from "../src/base/ModalManager.js"
import { Body, Header, Footer, Modal, Props, Title } from "../src/Modal.jsx"

describe("<Modal>", () => {
  test("Should forward ref to BaseModal", () => {
    const ref = React.createRef<Props>()
    render(
      <Modal show animation={false} ref={ref}>
        <strong>Message</strong>
      </Modal>
    )
    ref.current!.dialog.should.exist
  })
  test("Should render the modal content", () => {
    const { getByTestId } = render(
      <Modal show animation={false} data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    expect(getByTestId("modal").querySelector("strong")!.textContent).to.equal(
      "Message"
    )
  })
  test("Should sets `display: block` to `div.modal` when animation is false", () => {
    const ref = React.createRef<Props>()
    render(
      <Modal show animation={false} ref={ref}>
        <strong>Message</strong>
      </Modal>
    )
    expect(ref.current!.dialog.style.display).to.equal("block")
  })
  test("Should close the modal when the modal dialog is clicked", done => {
    const doneOp = () => {
      done()
    }
    const { getByRole } = render(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>
    )
    // the modal-dialog element is pointer-events: none;
    fireEvent.click(getByRole("dialog"))
  })
  test('Should not close the modal when the "static" dialog is clicked', () => {
    const onHideSpy = sinon.spy()
    const { getByTestId } = render(
      <Modal show onHide={onHideSpy} backdrop="static" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByTestId("modal"))
    onHideSpy.should.not.have.been.called
  })
  test('Should show "static" dialog animation when backdrop is clicked', () => {
    const { getByRole } = render(
      <Modal show backdrop="static">
        <strong>Message</strong>
      </Modal>
    )
    const modalDialog = getByRole("dialog")
    fireEvent.click(modalDialog)
    getByRole("dialog").classList.contains("modal-static").should.be.true
  })
  test('Should show "static" dialog animation when esc pressed and keyboard is false', () => {
    const { getByRole } = render(
      <Modal show backdrop="static" keyboard={false}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    getByRole("dialog").classList.contains("modal-static").should.be.true
  })
  test('Should not show "static" dialog animation when esc pressed and keyboard is true', () => {
    const { getByRole } = render(
      <Modal show backdrop="static" keyboard>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    getByRole("dialog").classList.contains("modal-static").should.be.false
  })
  test('Should not show "static" dialog animation modal backdrop is not "static"', () => {
    const { getByTestId, getByRole } = render(
      <Modal show backdrop data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByTestId("modal"))
    getByRole("dialog").classList.contains("modal-static").should.be.false
  })
  test("Should close the modal when the modal close button is clicked", done => {
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
  test("Should pass className to the dialog", () => {
    const { getByRole } = render(
      <Modal show className="mymodal">
        <strong>Message</strong>
      </Modal>
    )
    getByRole("dialog").classList.contains("mymodal").should.be.true
  })
  test("Should use backdropClassName to add classes to the backdrop", () => {
    render(
      <Modal show backdropClassName="my-modal-backdrop">
        <strong>Message</strong>
      </Modal>
    )
    document
      .querySelector(".modal-backdrop")!
      .classList.contains("my-modal-backdrop").should.be.true
  })
  test("Should pass size to the dialog", () => {
    const { getByTestId } = render(
      <Modal show size="sm" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-sm").should.be.true
  })
  test("Should pass fullscreen as bool to the dialog", () => {
    const { getByTestId } = render(
      <Modal show fullscreen data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-fullscreen").should.be.true
  })
  test("Should pass fullscreen as string to the dialog", () => {
    const { getByTestId } = render(
      <Modal show fullscreen="sm-down" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-fullscreen-sm-down").should
      .be.true
  })
  test("Should allow custom breakpoints for fullscreen", () => {
    const { getByTestId } = render(
      <Modal show fullscreen="custom-down" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-fullscreen-custom-down")
      .should.be.true
  })
  test("Should pass centered to the dialog", () => {
    const { getByTestId } = render(
      <Modal show centered data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-dialog-centered").should.be
      .true
  })
  test("Should pass scrollable to the dialog", () => {
    const { getByTestId } = render(
      <Modal show scrollable data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("modal-dialog-scrollable").should.be
      .true
  })
  test("Should pass dialog style to the dialog", () => {
    const { getByRole } = render(
      <Modal show style={{ color: "red" }}>
        <strong>Message</strong>
      </Modal>
    )
    getByRole("dialog").style.color.should.equal("red")
  })
  test("Should pass dialogClassName to the dialog", () => {
    const { getByTestId } = render(
      <Modal show dialogClassName="my-dialog" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    getByTestId("modal").classList.contains("my-dialog").should.be.true
  })
  test("Should pass contentClassName to .modal-content", () => {
    const { getByTestId } = render(
      <Modal show contentClassName="my-content" data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    const modalContent = getByTestId("modal").querySelector(".modal-content")!
    modalContent.classList.contains("my-content").should.be.true
  })
  test("Should use dialogAs", () => {
    function CustomDialog() {
      return <div className="custom-dialog" tabIndex={-1} />
    }
    render(
      <Modal show dialogAs={CustomDialog}>
        <strong>Message</strong>
      </Modal>
    )
    document.querySelector(".custom-dialog")!.should.exist
  })
  test("Should pass transition callbacks to Transition", done => {
    const increment = sinon.spy()
    const Elem = () => {
      const [show, setShow] = React.useState(true)
      return (
        <Modal
          show={show}
          onEnter={increment}
          onEntering={increment}
          onEntered={() => {
            increment()
            setShow(false)
          }}
          onExit={increment}
          onExiting={increment}
          onExited={() => {
            increment()
            expect(increment.callCount).to.equal(6)
            done()
          }}
        >
          <strong>Message</strong>
        </Modal>
      )
    }
    render(<Elem />)
  })
  test("should call `transitionend` before `exited`", done => {
    const increment = sinon.spy()
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
    modal.addEventListener("transitionend", increment)
    rerender(
      <Modal
        show={false}
        onExited={() => {
          expect(increment.callCount).to.equal(1)
          modal.removeEventListener("transitionend", increment)
          done()
        }}
      >
        Foo
      </Modal>
    )
  })
  describe("cleanup", () => {
    let offSpy
    beforeEach(() => {
      offSpy = sinon.spy(window, "removeEventListener")
    })
    afterEach(() => {
      offSpy.restore()
    })
    test("should remove resize listener when unmounted", () => {
      class Component extends React.Component {
        state = {
          show: true,
        }

        render() {
          if (!this.state.show) {
            return null
          }
          return <Modal show>Foo</Modal>
        }
      }
      const { rerender } = render(<Component />)
      rerender(<Modal show={false}>Foo</Modal>)
      offSpy.should.have.been.calledWith("resize")
    })
  })
  test("Should close once it was clicked outside of the Modal", () => {
    const onHideSpy = sinon.spy()
    const { getByRole } = render(
      <Modal show onHide={onHideSpy}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.click(getByRole("dialog"))
    onHideSpy.should.have.been.called
  })
  test("Should not call onHide if the click target comes from inside the dialog", () => {
    const onHideSpy = sinon.spy()
    const { getByTestId, getByRole } = render(
      <Modal show onHide={onHideSpy} data-testid="modal">
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.mouseDown(getByTestId("modal"))
    fireEvent.mouseUp(getByRole("dialog"))
    fireEvent.click(getByRole("dialog"))
    onHideSpy.should.not.have.been.called
  })
  test('Should set aria-labelledby to the role="dialog" element if aria-labelledby set', () => {
    const { getByRole } = render(
      <Modal show aria-labelledby="modal-title">
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-labelledby")).to.equal(
      "modal-title"
    )
  })
  test('Should set aria-describedby to the role="dialog" element if aria-describedby set', () => {
    const { getByRole } = render(
      <Modal show aria-describedby="modal-title">
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-describedby")).to.equal(
      "modal-title"
    )
  })
  test('Should set aria-label to the role="dialog" element if aria-label set', () => {
    const labelValue = "modal-label"
    const { getByRole } = render(
      <Modal show aria-label={labelValue}>
        <Header closeButton>
          <Title id="modal-title">Modal heading</Title>
        </Header>
      </Modal>
    )
    expect(getByRole("dialog").getAttribute("aria-label")).to.equal(labelValue)
  })
  test("Should call onEscapeKeyDown when keyboard is true", () => {
    const onEscapeKeyDownSpy = sinon.spy()
    const { getByRole } = render(
      <Modal show keyboard onEscapeKeyDown={onEscapeKeyDownSpy}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    onEscapeKeyDownSpy.should.have.been.called
  })
  test("Should not call onEscapeKeyDown when keyboard is false", () => {
    const onEscapeKeyDownSpy = sinon.spy()
    const { getByRole } = render(
      <Modal show keyboard={false} onEscapeKeyDown={onEscapeKeyDownSpy}>
        <strong>Message</strong>
      </Modal>
    )
    fireEvent.keyDown(getByRole("dialog"), {
      keyCode: 27,
    })
    onEscapeKeyDownSpy.should.not.have.been.called
  })
  test("Should use custom props manager if specified", done => {
    class MyModalManager extends ModalManager {
      // @ts-ignore
      add() {
        done()
      }
    }
    const managerRef = React.createRef<ModalManager | null>()
    // @ts-ignore
    managerRef.current = new MyModalManager()
    render(
      <Modal show manager={managerRef.current as any}>
        <strong>Message</strong>
      </Modal>
    )
  })
})

describe("Header", () => {
  test('uses "div" by default', () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Header>
    )
    getByTestId("test-modal").tagName.toLowerCase().should.equal("div")
    getByTestId("test-modal").classList.contains("modal-header").should.be.true
    getByTestId("test-modal").classList.contains("custom-class").should.be.true
    getByTestId("test-modal")
      .querySelector("strong")!
      .textContent!.should.equal("Content")
  })
  test("has closeButton without a containing Modal and renders", () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton />
    )
    getByTestId("test-modal").tagName.toLowerCase().should.equal("div")
    getByTestId("test-modal").querySelector("button")!.should.exist
  })
  test("Should trigger onHide when modal is closed", () => {
    const onHideSpy = sinon.spy()
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton onHide={onHideSpy} />
    )
    fireEvent.click(getByTestId("test-modal").querySelector("button")!)
    onHideSpy.should.be.calledOnce
  })
  test("should render close button variant", () => {
    const { getByTestId } = render(
      <Header data-testid="test-modal" closeButton closeVariant="white" />
    )
    const button = getByTestId("test-modal").querySelector("button")!
    button.should.exist
    button.classList.contains("btn-close-white").should.be.true
  })
})

describe("Body", () => {
  test('uses "div" by default', () => {
    const { getByTestId } = render(
      <Body data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Body>
    )
    const elem = getByTestId("test-modal")
    elem.tagName.toLowerCase().should.equal("div")
    elem.classList.contains("modal-body").should.be.true
    elem.classList.contains("custom-class").should.be.true
    elem.querySelector("strong")!.textContent!.should.equal("Content")
  })
  test('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Body data-testid="test-modal" as="section">
        <strong>Content</strong>
      </Body>
    )
    getByTestId("test-modal").classList.contains("modal-body").should.be.true
    getByTestId("test-modal").tagName.toLowerCase().should.equal("section")
  })
})

describe("Footer", () => {
  test('uses "div" by default', () => {
    const { getByTestId } = render(
      <Footer data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Footer>
    )
    const elem = getByTestId("test-modal")
    elem.tagName.toLowerCase().should.equal("div")
    elem.classList.contains("modal-footer").should.be.true
    elem.classList.contains("custom-class").should.be.true
    elem.querySelector("strong")!.textContent!.should.equal("Content")
  })
  test('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Footer data-testid="test-modal" as="section">
        <strong>Content</strong>
      </Footer>
    )
    getByTestId("test-modal").classList.contains("modal-footer").should.be.true
    getByTestId("test-modal").tagName.toLowerCase().should.equal("section")
  })
})

describe("Title", () => {
  test('uses "div" by default', () => {
    const { getByTestId } = render(
      <Title data-testid="test-modal" className="custom-class">
        <strong>Content</strong>
      </Title>
    )
    const elem = getByTestId("test-modal")
    elem.tagName.toLowerCase().should.equal("div")
    elem.classList.contains("h4").should.be.true
    elem.classList.contains("modal-title").should.be.true
    elem.classList.contains("custom-class").should.be.true
    elem.querySelector("strong")!.textContent!.should.equal("Content")
  })
  test('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(
      <Title data-testid="test-modal" as="h4">
        <strong>Content</strong>
      </Title>
    )
    getByTestId("test-modal").classList.contains("modal-title").should.be.true
    getByTestId("test-modal").tagName.toLowerCase().should.equal("h4")
  })
})
