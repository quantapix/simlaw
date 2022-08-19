import * as React from "react"
import { fireEvent, render } from "@testing-library/react"
import { Overlay, Trigger } from "../src/Overlay.jsx"
import { Popover } from "../src/Popover.jsx"
import { Tooltip } from "../src/Tooltip.jsx"

describe("<Overlay>", () => {
  test("should forward ref to the overlay", () => {
    const ref = React.createRef<any>()
    render(
      <Overlay ref={ref} show target={ref.current}>
        <Popover id="my-overlay">test</Popover>
      </Overlay>
    )
    ref.current.id.should.equal("my-overlay")
  })
  test("should use Fade internally if transition=true", () => {
    const ref = React.createRef<any>()
    const { getByTestId } = render(
      <Overlay show transition ref={ref} target={ref.current}>
        <Popover id="my-overlay" data-testid="test">
          test
        </Popover>
      </Overlay>
    )
    const popoverElem = getByTestId("test")
    popoverElem.classList.contains("fade").should.be.true
  })
  test("should not use Fade if transition=false", () => {
    const ref = React.createRef<any>()
    const { getByTestId } = render(
      <Overlay show transition={false} ref={ref} target={ref.current}>
        <Popover id="my-overlay" data-testid="test">
          test
        </Popover>
      </Overlay>
    )
    const popoverElem = getByTestId("test")
    popoverElem.classList.contains("fade").should.be.false
  })
})

describe("<Trigger>", () => {
  const TemplateDiv = React.forwardRef(
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
  test("should not throw an error with StrictMode", () => {
    const { getByTestId } = render(
      <React.StrictMode>
        <Trigger overlay={<TemplateDiv>test</TemplateDiv>}>
          <button type="button" data-testid="test-button">
            button
          </button>
        </Trigger>
      </React.StrictMode>
    )
    const buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
  })
  test("Should render Trigger element", () => {
    const { getByTestId } = render(
      <Trigger overlay={<TemplateDiv>test</TemplateDiv>}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const buttonElem = getByTestId("test-button")
    buttonElem.should.exist
  })
  test("Should show after click trigger", () => {
    const { queryByTestId, getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let overlayElem = queryByTestId("test-overlay")
    const buttonElem = getByTestId("test-button")
    expect(overlayElem).to.be.null
    fireEvent.click(buttonElem)
    overlayElem = queryByTestId("test-overlay")
    expect(overlayElem).to.not.be.null
  })
  test("Should accept a function as an overlay render prop", () => {
    const overlay = () => <TemplateDiv />
    const { queryByTestId, getByTestId } = render(
      <Trigger trigger="click" overlay={overlay}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let overlayElem = queryByTestId("test-overlay")
    const buttonElem = getByTestId("test-button")
    expect(overlayElem).to.be.null
    fireEvent.click(buttonElem)
    overlayElem = queryByTestId("test-overlay")
    expect(overlayElem).to.not.be.null
  })
  test("Should show the tooltip when transitions are disabled", () => {
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
    let overlayElem = queryByTestId("test-overlay")
    const buttonElem = getByTestId("test-button")
    expect(overlayElem).to.be.null
    fireEvent.focus(buttonElem)
    overlayElem = queryByTestId("test-overlay")
    expect(overlayElem).to.not.be.null
    overlayElem!.classList.contains("show").should.be.true
  })
  test("Should call Trigger onClick prop to child", () => {
    const callback = sinon.spy()
    const { getByTestId } = render(
      <Trigger overlay={<TemplateDiv>test</TemplateDiv>} trigger="click">
        <button type="button" onClick={callback} data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
    callback.should.have.been.called
  })
  test("Should be controllable", () => {
    const callback = sinon.spy()
    const { getByTestId } = render(
      <Trigger
        show
        trigger="click"
        onToggle={callback}
        overlay={<TemplateDiv className="test" />}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const overlayElem = getByTestId("test-overlay")
    const buttonElem = getByTestId("test-button")
    overlayElem.classList.contains("show").should.be.true
    fireEvent.click(buttonElem)
    callback.should.have.been.calledOnce.and.calledWith(false)
  })
  test("Should show after mouseover trigger", done => {
    const clock = sinon.useFakeTimers()
    const { getByTestId, queryByTestId } = render(
      <Trigger overlay={<TemplateDiv />}>
        <span data-testid="test-hover">hover me</span>
      </Trigger>
    )
    let overlayElem = queryByTestId("test-overlay")
    const hoverElem = getByTestId("test-hover")
    expect(overlayElem).to.be.null
    fireEvent.mouseOver(hoverElem)
    overlayElem = queryByTestId("test-overlay")
    expect(overlayElem).to.not.be.null
    fireEvent.mouseOut(hoverElem)
    clock.tick(50)
    overlayElem = queryByTestId("test-overlay")
    expect(overlayElem).to.be.null
    clock.restore()
    done()
  })
  test("Should not set aria-describedby if the state is not show", () => {
    const { getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const buttonElem = getByTestId("test-button")
    expect(buttonElem.getAttribute("aria-describedby")).to.be.null
  })
  test("Should set aria-describedby for tooltips if the state is show", done => {
    const { getByTestId } = render(
      <Trigger trigger="click" overlay={<TemplateDiv />}>
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    let buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
    buttonElem = getByTestId("test-button")
    // aria-describedby gets assigned after a slight delay
    setTimeout(() => {
      buttonElem.getAttribute("aria-describedby")!.should.equal("test-tooltip")
      done()
    })
  })
  describe("trigger handlers", () => {
    test("Should keep trigger handlers", done => {
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
      const buttonElem = getByTestId("test-button")
      fireEvent.click(buttonElem)
    })
  })
  test("Should maintain overlay classname", () => {
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
    const buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
    const overlayElem = queryByTestId("test-overlay")
    overlayElem!.should.not.be.null
    overlayElem!.classList.contains("test-overlay").should.be.true
  })
  test("Should pass transition callbacks to Transition", done => {
    const increment = sinon.spy()
    const { getByTestId } = render(
      <Trigger
        trigger="click"
        overlay={<TemplateDiv>test</TemplateDiv>}
        onExit={increment}
        onExiting={increment}
        onExited={() => {
          increment()
          increment.callCount.should.equal(6)
          done()
        }}
        onEnter={increment}
        onEntering={increment}
        onEntered={() => {
          increment()
          const buttonElem = getByTestId("test-button")
          fireEvent.click(buttonElem)
        }}
      >
        <button type="button" data-testid="test-button">
          button
        </button>
      </Trigger>
    )
    const buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
  })
  test("Should forward requested context", () => {
    const contextSpy = sinon.spy()
    class ContextReader extends React.Component {
      render() {
        contextSpy(this.context.key)
        return <div />
      }
    }
    class ContextHolder extends React.Component {
      getChildContext() {
        return { key: "value" }
      }

      render() {
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
    const buttonElem = getByTestId("test-button")
    fireEvent.click(buttonElem)
    contextSpy.calledWith("value").should.be.true
  })
  describe("overlay types", () => {
    ;[
      {
        name: "Popover",
        overlay: <Popover id="test-popover">test</Popover>,
      },
      {
        name: "Tooltip",
        overlay: <Tooltip id="test-tooltip">test</Tooltip>,
      },
    ].forEach(testCase => {
      describe(testCase.name, () => {
        test("Should handle trigger without warnings", done => {
          const { getByTestId } = render(
            <Trigger trigger="click" overlay={testCase.overlay}>
              <button type="button" data-testid="test-button">
                button
              </button>
            </Trigger>
          )
          const buttonElem = getByTestId("test-button")
          fireEvent.click(buttonElem)
          // The use of Popper means that errors above will show up
          //  asynchronously.
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
    ].forEach(testCase => {
      describe(testCase.label, () => {
        test("Should have correct show state", () => {
          const { getByTestId } = render(
            <Trigger
              overlay={<TemplateDiv>test</TemplateDiv>}
              trigger="click"
              rootClose={testCase.rootClose}
            >
              <button type="button" data-testid="test-button">
                button
              </button>
            </Trigger>
          )
          const buttonElem = getByTestId("test-button")
          fireEvent.click(buttonElem)
          const overlayElem = getByTestId("test-overlay")
          overlayElem.classList.contains("show").should.be.true
          // Need to click this way for it to propagate to document element.
          document.documentElement.click()
          overlayElem.classList
            .contains("show")
            .should.equal(testCase.shownAfterClick)
        })
      })
    })
    describe("clicking on trigger to hide", () => {
      test("should hide after clicking on trigger", () => {
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
        const buttonElem = getByTestId("test-button")
        fireEvent.click(buttonElem)
        let overlayElem = getByTestId("test-overlay")
        overlayElem.classList.contains("show").should.be.true
        // Need to click this way for it to propagate to document element.
        fireEvent.click(buttonElem)
        overlayElem = getByTestId("test-overlay")
        overlayElem.classList.contains("show").should.be.false
      })
    })
    describe("replaced overlay", () => {
      test("Should still be shown", () => {
        const ReplacedOverlay = React.forwardRef(
          ({ className = "" }: any, ref: any) => {
            const [state, setState] = React.useState(false)
            const handleClick = () => {
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
                  onClick={handleClick}
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
        const buttonElem = getByTestId("test-button")
        fireEvent.click(buttonElem)
        const toBeReplacedElem = getByTestId("test-not-replaced")
        fireEvent.click(toBeReplacedElem)
        const replacedElem = getByTestId("test-replaced")
        replacedElem.classList.contains("show").should.be.true
      })
    })
  })
})
