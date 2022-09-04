import { act } from "react-dom/test-utils"
import { Modal } from "../../src/base/Modal.jsx"
import { mount } from "enzyme"
import { OPEN_DATA_ATTRIBUTE } from "../../src/base/Manager.jsx"
import { render } from "@testing-library/react"
import { Transition } from "react-transition-group"
import * as qr from "react"
import ReactDOM from "react-dom"
import simulant from "simulant"

describe("Modal", () => {
  let attachTo: any
  let wrapper: any
  const mountWithRef = (x: any, xs: any) => {
    const y = qr.createRef<any>()
    const Why = (ps: any) => qr.cloneElement(x, { ...ps, ref: y })
    wrapper = mount(<Why />, xs)
    return y
  }
  beforeEach(() => {
    attachTo = document.createElement("div")
    document.body.appendChild(attachTo)
  })
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    attachTo.remove()
  })
  it("Should render the modal content", () => {
    const ref = mountWithRef(
      <Modal show>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(ref.current.dialog.querySelectorAll("strong")).toHaveLength(1)
  })
  it("Should disable scrolling on the modal container while open", done => {
    const modal = qr.createRef<any>()
    class Container extends qr.Component {
      ref = qr.createRef<any>()
      override state = { modalOpen: true }
      handleCloseModal = () => {
        this.setState({ modalOpen: false })
      }
      override render() {
        return (
          <div ref={this.ref}>
            <Modal
              ref={modal}
              show={this.state.modalOpen}
              onHide={this.handleCloseModal}
              renderBackdrop={x => <div data-backdrop {...x} />}
              container={this.ref}
            >
              <strong>Message</strong>
            </Modal>
          </div>
        )
      }
    }
    render(<Container />, { container: attachTo })
    setTimeout(() => {
      const container = document.body
      const y = modal.current.backdrop
      expect(container.style.overflow).toEqual("hidden")
      y.click()
      expect(container.style.overflow).not.toEqual("hidden")
      done()
    })
  })
  it("Should fire backdrop click callback", () => {
    const mock = jest.fn()
    const ref = mountWithRef(
      <Modal show onBackdropClick={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const y = ref.current.backdrop
    y.click()
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should close the modal when the backdrop is clicked", done => {
    const doneOp = () => {
      done()
    }
    const ref = mountWithRef(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const y = ref.current.backdrop
    y.click()
  })
  it('should not close the modal when the "static" backdrop is clicked', () => {
    const mock = jest.fn()
    const ref = mountWithRef(
      <Modal show onHide={mock} backdrop="static">
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const y = ref.current.backdrop
    y.click()
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should close the modal when the esc key is pressed", done => {
    const doneOp = () => {
      done()
    }
    const ref = mountWithRef(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const y = ref.current.backydrop
    simulant.fire(y, "keydown", { keyCode: 27 })
  })
  it("Should not trigger onHide if e.preventDefault() called", () => {
    const mock = jest.fn()
    const onEscapeKeyDown = (e: any) => {
      e.preventDefault()
    }
    const ref = mountWithRef(
      <Modal show onHide={mock} onEscapeKeyDown={onEscapeKeyDown}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const y = ref.current.backdrop
    simulant.fire(y, "keydown", { keyCode: 27 })
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should add role to child", () => {
    let dialog: any
    wrapper = mount(
      <Modal show>
        <strong
          ref={r => {
            dialog = r
          }}
        >
          Message
        </strong>
      </Modal>,
      { attachTo }
    )
    expect(dialog.getAttribute("role")).toEqual("document")
  })
  it("Should allow custom rendering", () => {
    let dialog: any
    wrapper = mount(
      <Modal
        show
        renderDialog={ps => (
          <strong
            {...ps}
            role="group"
            ref={r => {
              dialog = r
            }}
          >
            Message
          </strong>
        )}
      />,
      { attachTo }
    )
    expect(dialog.getAttribute("role")).toEqual("group")
  })
  it("Should unbind listeners when unmounted", () => {
    /* const { rerender } = */ render(
      <div>
        <Modal show>
          <strong>Foo bar</strong>
        </Modal>
      </div>
      // { attachTo }
    )
    expect(document.body.hasAttribute(OPEN_DATA_ATTRIBUTE)).toEqual(true)
    // rerender(null)
    expect(document.body.hasAttribute(OPEN_DATA_ATTRIBUTE)).toEqual(false)
  })
  it("Should pass transition callbacks to Transition", done => {
    let count = 0
    const increment = () => count++
    wrapper = mount(
      <Modal
        show
        transition={p => <Transition {...p} timeout={0} />}
        onExit={increment}
        onExiting={increment}
        onExited={() => {
          increment()
          expect(count).toEqual(6)
          done()
        }}
        onEnter={increment}
        onEntering={increment}
        onEntered={() => {
          increment()
          wrapper.setProps({ show: false })
        }}
      >
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
  })
  it("Should fire show callback on mount", () => {
    const mock = jest.fn()
    mount(
      <Modal show onShow={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should fire show callback on update", () => {
    const mock = jest.fn()
    wrapper = mount(
      <Modal onShow={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    wrapper.setProps({ show: true })
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should fire onEscapeKeyDown callback on escape close", () => {
    const mock = jest.fn()
    const ref = mountWithRef(
      <Modal onEscapeKeyDown={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    wrapper.setProps({ show: true })
    act(() => {
      simulant.fire(ref.current.backdrop, "keydown", { keyCode: 27 })
    })
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should accept role on the Modal", () => {
    const ref = mountWithRef(
      <Modal role="alertdialog" show>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(ref.current.dialog.getAttribute("role")).toEqual("alertdialog")
  })
  it("Should accept the `aria-describedby` property on the Modal", () => {
    const ref = mountWithRef(
      <Modal aria-describedby="modal-description" show>
        <strong id="modal-description">Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(ref.current.dialog.getAttribute("aria-describedby")).toEqual(
      "modal-description"
    )
  })
  describe("Focused state", () => {
    let y: any = null
    beforeEach(() => {
      y = document.createElement("div")
      y.tabIndex = 0
      y.className = "focus-container"
      document.body.appendChild(y)
      y.focus()
    })
    afterEach(() => {
      ReactDOM.unmountComponentAtNode(y)
      document.body.removeChild(y)
    })
    it("Should focus on the Modal when it is opened", () => {
      expect(document.activeElement).toEqual(y)
      wrapper = mount(
        <Modal show className="modal">
          <strong>Message</strong>
        </Modal>,
        { attachTo: y }
      )
      expect(document.activeElement?.className).toContain("modal")
      wrapper.setProps({ show: false })
      expect(document.activeElement).toEqual(y)
    })
    it("Should not focus on the Modal when autoFocus is false", () => {
      mount(
        <Modal show autoFocus={false}>
          <strong>Message</strong>
        </Modal>,
        { attachTo: y }
      )
      expect(document.activeElement).toEqual(y)
    })
    it("Should not focus Modal when child has focus", () => {
      expect(document.activeElement).toEqual(y)
      mount(
        <Modal show className="modal">
          <div>
            <input autoFocus />
          </div>
        </Modal>,
        { attachTo: y }
      )
      const input = document.getElementsByTagName("input")[0]
      expect(document.activeElement).toEqual(input)
    })
    it("Should return focus to the modal", done => {
      expect(document.activeElement).toEqual(y)
      mount(
        <Modal show className="modal">
          <div>
            <input autoFocus />
          </div>
        </Modal>,
        { attachTo: y }
      )
      y.focus()
      setTimeout(() => {
        expect(document.activeElement?.className).toContain("modal")
        done()
      }, 50)
    })
    it("Should not attempt to focus nonexistent children", () => {
      const Dialog = qr.forwardRef((_, __) => null)
      mount(
        <Modal show>
          <Dialog />
        </Modal>,
        { attachTo: y }
      )
    })
  })
})
