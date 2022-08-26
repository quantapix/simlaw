import * as React from "react"
import ReactDOM from "react-dom"
import { act } from "react-dom/test-utils"
import Transition from "react-transition-group/Transition"
import simulant from "simulant"
import { render } from "@testing-library/react"
import { mount } from "enzyme"
import Modal from "../src/Modal"
import { OPEN_DATA_ATTRIBUTE } from "../src/ModalManager"
describe("<Modal>", () => {
  let attachTo
  let wrapper
  const mountWithRef = (el, options) => {
    const ref = React.createRef()
    const Why = props => React.cloneElement(el, { ...props, ref })
    wrapper = mount(<Why />, options)
    return ref
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
  it("should render the modal content", () => {
    const ref = mountWithRef(
      <Modal show>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(ref.current.dialog.querySelectorAll("strong")).toHaveLength(1)
  })
  it("should disable scrolling on the modal container while open", done => {
    const modal = React.createRef()
    class Container extends React.Component {
      ref = React.createRef()
      state = {
        modalOpen: true,
      }
      handleCloseModal = () => {
        this.setState({ modalOpen: false })
      }
      render() {
        return (
          <div ref={this.ref}>
            <Modal
              ref={modal}
              show={this.state.modalOpen}
              onHide={this.handleCloseModal}
              renderBackdrop={p => <div data-backdrop {...p} />}
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
      const backdrop = modal.current.backdrop
      expect(container.style.overflow).toEqual("hidden")
      backdrop.click()
      expect(container.style.overflow).to.not.equal("hidden")
      done()
    })
  })
  it("should fire backdrop click callback", () => {
    const mock = jest.fn()
    const ref = mountWithRef(
      <Modal show onBackdropClick={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const backdrop = ref.current.backdrop
    backdrop.click()
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should close the modal when the backdrop is clicked", done => {
    const doneOp = () => {
      done()
    }
    const ref = mountWithRef(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const backdrop = ref.current.backdrop
    backdrop.click()
  })
  it('should not close the modal when the "static" backdrop is clicked', () => {
    const mock = jest.fn()
    const ref = mountWithRef(
      <Modal show onHide={mock} backdrop="static">
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const { backdrop } = ref.current
    backdrop.click()
    expect(mock).not.toHaveBeenCalled()
  })
  it("should close the modal when the esc key is pressed", done => {
    const doneOp = () => {
      done()
    }
    const ref = mountWithRef(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const { backdrop } = ref.current
    simulant.fire(backdrop, "keydown", { keyCode: 27 })
  })
  it("should not trigger onHide if e.preventDefault() called", () => {
    const mock = jest.fn()
    const onEscapeKeyDown = e => {
      e.preventDefault()
    }
    const ref = mountWithRef(
      <Modal show onHide={mock} onEscapeKeyDown={onEscapeKeyDown}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    const { backdrop } = ref.current
    simulant.fire(backdrop, "keydown", { keyCode: 27 })
    expect(mock).not.toHaveBeenCalled()
  })
  it("should add role to child", () => {
    let dialog
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
  it("should allow custom rendering", () => {
    let dialog
    wrapper = mount(
      <Modal
        show
        renderDialog={props => (
          <strong
            {...props}
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
  it("should unbind listeners when unmounted", () => {
    const { rerender } = render(
      <div>
        <Modal show>
          <strong>Foo bar</strong>
        </Modal>
      </div>,
      { attachTo }
    )
    expect(document.body.hasAttribute(OPEN_DATA_ATTRIBUTE)).toEqual(true)
    rerender(null)
    expect(document.body.hasAttribute(OPEN_DATA_ATTRIBUTE)).toEqual(false)
  })
  it("should pass transition callbacks to Transition", done => {
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
  it("should fire show callback on mount", () => {
    const mock = jest.fn()
    mount(
      <Modal show onShow={mock}>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should fire show callback on update", () => {
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
  it("should fire onEscapeKeyDown callback on escape close", () => {
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
  it("should accept role on the Modal", () => {
    const ref = mountWithRef(
      <Modal role="alertdialog" show>
        <strong>Message</strong>
      </Modal>,
      { attachTo }
    )
    expect(ref.current.dialog.getAttribute("role")).toEqual("alertdialog")
  })
  it("should accept the `aria-describedby` property on the Modal", () => {
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
    let focusableContainer = null
    beforeEach(() => {
      focusableContainer = document.createElement("div")
      focusableContainer.tabIndex = 0
      focusableContainer.className = "focus-container"
      document.body.appendChild(focusableContainer)
      focusableContainer.focus()
    })
    afterEach(() => {
      ReactDOM.unmountComponentAtNode(focusableContainer)
      document.body.removeChild(focusableContainer)
    })
    it("should focus on the Modal when it is opened", () => {
      expect(document.activeElement).toEqual(focusableContainer)
      wrapper = mount(
        <Modal show className="modal">
          <strong>Message</strong>
        </Modal>,
        { attachTo: focusableContainer }
      )
      expect(document.activeElement.className).toContain("modal")
      wrapper.setProps({ show: false })
      expect(document.activeElement).toEqual(focusableContainer)
    })
    it("should not focus on the Modal when autoFocus is false", () => {
      mount(
        <Modal show autoFocus={false}>
          <strong>Message</strong>
        </Modal>,
        { attachTo: focusableContainer }
      )
      expect(document.activeElement).toEqual(focusableContainer)
    })
    it("should not focus Modal when child has focus", () => {
      expect(document.activeElement).toEqual(focusableContainer)
      mount(
        <Modal show className="modal">
          <div>
            <input autoFocus />
          </div>
        </Modal>,
        { attachTo: focusableContainer }
      )
      const input = document.getElementsByTagName("input")[0]
      expect(document.activeElement).toEqual(input)
    })
    it("should return focus to the modal", done => {
      expect(document.activeElement).toEqual(focusableContainer)
      mount(
        <Modal show className="modal">
          <div>
            <input autoFocus />
          </div>
        </Modal>,
        { attachTo: focusableContainer }
      )
      focusableContainer.focus()
      // focus reset runs in a timeout
      setTimeout(() => {
        expect(document.activeElement.className).toContain("modal")
        done()
      }, 50)
    })
    it("should not attempt to focus nonexistent children", () => {
      const Dialog = React.forwardRef((_, __) => null)
      mount(
        <Modal show>
          <Dialog />
        </Modal>,
        { attachTo: focusableContainer }
      )
    })
  })
})
