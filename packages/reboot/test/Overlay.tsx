import { fireEvent, render } from "@testing-library/react"
import { Overlay, Trigger } from "../src/Overlay.js"
import { Popover } from "../src/Popover.js"
import { Tooltip } from "../src/Tooltip.js"
import * as qr from "react"

describe("<Overlay>", () => {
  it("Should forward ref to the overlay", () => {
    const ref = qr.createRef<any>()
    render(
      <Overlay ref={ref} show target={ref.current}>
        <Popover id="my-overlay">test</Popover>
      </Overlay>
    )
    expect(ref.current.id).toEqual("my-overlay")
  })
  it("Should use Fade internally if transition=true", () => {
    const ref = qr.createRef<any>()
    const { getByTestId } = render(
      <Overlay show transition ref={ref} target={ref.current}>
        <Popover id="my-overlay" data-testid="test">
          test
        </Popover>
      </Overlay>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("fade")).toBe(true)
  })
  it("Should not use Fade if transition=false", () => {
    const ref = qr.createRef<any>()
    const { getByTestId } = render(
      <Overlay show transition={false} ref={ref} target={ref.current}>
        <Popover id="my-overlay" data-testid="test">
          test
        </Popover>
      </Overlay>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("fade")).toBe(false)
  })
})
describe("<Trigger>", () => {
  const TemplateDiv = qr.forwardRef(
    ({ className = "", children }: any, ref: any) => (
      <div
        ref={ref}
        className={className}
        role="tooltip"
        id="test-tooltip"
        data-testid="test-overlay"
      >
        {children}
      </div>
    )
  )
  it("Should not throw an error with StrictMode", () => {
    const { getByTestId } = render(
      <qr.StrictMode>
        <Trigger overlay={<TemplateDiv>test</TemplateDiv>}>
          <button type="button" data-testid="test-button">
            button
          </button>
        </Trigger>
      </qr.StrictMode>
    )
    const y = getByTestId("test-button")
    fireEvent.click(y)
  })
  it("Should render Trigger element", () => {
    const { getByTestId } = render(
      <Trigger overlay={<TemplateDiv>test</TemplateDiv>}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-button")
    expect(y).toBeTruthy()
  })
  it("Should show after click trigger", () => {
    const { queryByTestId, getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let y = queryByTestId("test-overlay")
    const y2 = getByTestId("test-button")
    expect(y).toBeNull()
    fireEvent.click(y2)
    y = queryByTestId("test-overlay")
    expect(y).not.toBeNull()
  })
  it("Should accept a function as an overlay render prop", () => {
    const overlay = () => <TemplateDiv />
    const { queryByTestId, getByTestId } = render(
      <Trigger trigger="click" overlay={overlay}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let y = queryByTestId("test-overlay")
    const y2 = getByTestId("test-button")
    expect(y).toBeNull()
    fireEvent.click(y2)
    y = queryByTestId("test-overlay")
    expect(y).not.toBeNull()
  })
  it("Should show the tooltip when transitions are disabled", () => {
    const overlay = ({ className }: any) => (
      <TemplateDiv className={`${className} test`} />
    )
    const { getByTestId, queryByTestId } = render(
      <Trigger
        transition={false}
        trigger={["hover", "focus"]}
        overlay={overlay}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let y = queryByTestId("test-overlay")
    const y2 = getByTestId("test-button")
    expect(y).toBeNull()
    fireEvent.focus(y2)
    y = queryByTestId("test-overlay")
    expect(y).not.toBeNull()
    expect(y!.classList.contains("show")).toBe(true)
  })
  it("Should call Trigger onClick prop to child", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Trigger overlay={<TemplateDiv>test</TemplateDiv>} trigger="click">
        <button type="button" onClick={mock} data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-button")
    fireEvent.click(y)
    expect(mock).toHaveBeenCalled()
  })
  it("Should be controllable", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Trigger
        show
        trigger="click"
        onToggle={mock}
        overlay={<TemplateDiv className="test" />}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-overlay")
    const y2 = getByTestId("test-button")
    expect(y.classList.contains("show")).toBe(true)
    fireEvent.click(y2)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(false)
  })
  it("Should show after mouseover trigger", done => {
    // const clock = sinon.useFakeTimers()
    const { getByTestId, queryByTestId } = render(
      <Trigger overlay={<TemplateDiv />}>
        <span data-testid="test-hover">hover me</span>
      </Trigger>
    )
    let y = queryByTestId("test-overlay")
    const y2 = getByTestId("test-hover")
    expect(y).toBeNull()
    fireEvent.mouseOver(y2)
    y = queryByTestId("test-overlay")
    expect(y).not.toBeNull()
    fireEvent.mouseOut(y2)
    jest.advanceTimersByTime(50)
    y = queryByTestId("test-overlay")
    expect(y).toBeNull()
    // clock.restore()
    done()
  })
  it("Should not set aria-describedby if the state is not show", () => {
    const { getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-button")
    expect(y.getAttribute("aria-describedby")).toBeNull()
  })
  it("Should set aria-describedby for tooltips if the state is show", done => {
    const { getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let y = getByTestId("test-button")
    fireEvent.click(y)
    y = getByTestId("test-button")
    setTimeout(() => {
      expect(y.getAttribute("aria-describedby")!).toEqual("test-tooltip")
      done()
    })
  })
  describe("trigger handlers", () => {
    it("Should keep trigger handlers", done => {
      const { getByTestId } = render(
        <div>
          <Trigger trigger="click" overlay={<TemplateDiv>test</TemplateDiv>}>
            <button
              type="button"
              data-testid="test-button"
              onClick={() => done()}
            >
              button
            </button>
          </Trigger>
          <input id="target" />
        </div>
      )
      const y = getByTestId("test-button")
      fireEvent.click(y)
    })
  })
  it("Should maintain overlay classname", () => {
    const { getByTestId, queryByTestId } = render(
      <Trigger
        trigger="click"
        overlay={<TemplateDiv className="test-overlay">test</TemplateDiv>}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-button")
    fireEvent.click(y)
    const y2 = queryByTestId("test-overlay")
    expect(y2!).not.toBeNull()
    expect(y2!.classList.contains("test-overlay")).toBe(true)
  })
  it("Should pass transition callbacks to Transition", done => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Trigger
        trigger="click"
        overlay={<TemplateDiv>test</TemplateDiv>}
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
          const buttonElem = getByTestId("test-button")
          fireEvent.click(buttonElem)
        }}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const y = getByTestId("test-button")
    fireEvent.click(y)
  })
  it("Should forward requested context", () => {
    const mock = jest.fn()
    class ContextReader extends qr.Component {
      override render(this: any) {
        mock(this.context.key)
        return <div />
      }
    }
    class ContextHolder extends qr.Component {
      getChildContext() {
        return { key: "value" }
      }
      override render() {
        return (
          <Trigger trigger="click" overlay={<ContextReader />}>
            <button type="button" data-testid="test-button">
              button
            </button>
          </Trigger>
        )
      }
    }
    const { getByTestId } = render(<ContextHolder />)
    const y = getByTestId("test-button")
    fireEvent.click(y)
    expect(mock).toHaveBeenCalledWith("value")
  })
  describe("overlay types", () => {
    ;[
      { name: "Popover", overlay: <Popover id="test-popover">test</Popover> },
      { name: "Tooltip", overlay: <Tooltip id="test-tooltip">test</Tooltip> },
    ].forEach(x => {
      describe(x.name, () => {
        it("Should handle trigger without warnings", done => {
          const { getByTestId } = render(
            <Trigger trigger="click" overlay={x.overlay}>
              <button type="button" data-testid="test-button">
                button
              </button>
            </Trigger>
          )
          const y = getByTestId("test-button")
          fireEvent.click(y)
          setTimeout(done, 10)
        })
      })
    })
  })
  describe("rootClose", () => {
    ;[
      {
        label: "true",
        rootClose: true,
        shownAfterClick: false,
      },
      {
        label: "default (false)",
        rootClose: undefined,
        shownAfterClick: true,
      },
    ].forEach(x => {
      describe(x.label, () => {
        it("Should have correct show state", () => {
          const { getByTestId } = render(
            <Trigger
              overlay={<TemplateDiv>test</TemplateDiv>}
              trigger="click"
              rootClose={x.rootClose!}
            >
              <button type="button" data-testid="test-button">
                button
              </button>
            </Trigger>
          )
          const y = getByTestId("test-button")
          fireEvent.click(y)
          const y2 = getByTestId("test-overlay")
          expect(y2.classList.contains("show")).toBe(true)
          document.documentElement.click()
          expect(y2.classList.contains("show")).toEqual(x.shownAfterClick)
        })
      })
    })
    describe("clicking on trigger to hide", () => {
      it("Should hide after clicking on trigger", () => {
        const { getByTestId } = render(
          <Trigger
            overlay={<TemplateDiv>test</TemplateDiv>}
            trigger="click"
            rootClose
          >
            <button type="button" data-testid="test-button">
              button
            </button>
          </Trigger>
        )
        const y = getByTestId("test-button")
        fireEvent.click(y)
        let y2 = getByTestId("test-overlay")
        expect(y2.classList.contains("show")).toBe(true)
        fireEvent.click(y)
        y2 = getByTestId("test-overlay")
        expect(y2.classList.contains("show")).toBe(false)
      })
    })
    describe("replaced overlay", () => {
      it("Should still be shown", () => {
        const ReplacedOverlay = qr.forwardRef(
          ({ className = "" }: any, ref: any) => {
            const [state, setState] = qr.useState(false)
            const doClick = () => {
              setState(true)
            }
            if (state) {
              return (
                <div
                  data-testid="test-replaced"
                  className={className}
                  ref={ref}
                >
                  replaced
                </div>
              )
            }
            return (
              <div>
                <a
                  id="replace-overlay"
                  onClick={doClick}
                  data-testid="test-not-replaced"
                  className={className}
                  ref={ref}
                >
                  original
                </a>
              </div>
            )
          }
        )
        const { getByTestId } = render(
          <Trigger overlay={<ReplacedOverlay />} trigger="click" rootClose>
            <button type="button" data-testid="test-button">
              button
            </button>
          </Trigger>
        )
        const y = getByTestId("test-button")
        fireEvent.click(y)
        const y2 = getByTestId("test-not-replaced")
        fireEvent.click(y2)
        const y3 = getByTestId("test-replaced")
        expect(y3.classList.contains("show")).toBe(true)
      })
    })
  })
})
