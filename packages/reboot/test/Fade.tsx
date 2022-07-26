import { Fade, Props } from "../src/Fade.js"
import { render } from "@testing-library/react"
import * as qr from "react"
import type { Transition } from "react-transition-group"

describe("Fade", () => {
  class Component extends qr.Component<
    qr.PropsWithChildren<Omit<Props, "children">>
  > {
    fade: Transition<HTMLElement> | null = null
    override render() {
      const { children, ...props } = this.props
      return (
        <Fade
          ref={r => (this.fade = r)}
          data-testid="fade-component"
          {...props}
          {...this.state}
        >
          <div>
            <span data-testid={props.in ? "status-show" : "status-hide"} />
            {children}
          </div>
        </Fade>
      )
    }
  }
  it("should not throw an error with StrictMode", () => {
    render(
      <qr.StrictMode>
        <Component in>Panel content</Component>
      </qr.StrictMode>
    )
  })
  it("should work with a class component as children", () => {
    const mock = jest.fn()
    class InnerComponent extends qr.Component {
      override render() {
        return <div {...this.props}>test</div>
      }
    }
    const { getByTestId } = render(
      <Fade in onEntering={mock} data-testid="test">
        <InnerComponent />
      </Fade>
    )
    const node = getByTestId("test")
    expect(node.classList.contains("fade")).toBe(true)
    expect(node.classList.contains("show")).toBe(true)
  })
  it("should default to hidden", () => {
    const { getByTestId } = render(<Component>Panel content</Component>)
    expect(getByTestId("status-hide")).toBeTruthy()
  })
  it('Should always have the "fade" class', () => {
    const { getByTestId } = render(<Component>Panel content</Component>)
    expect(getByTestId("status-hide")).toBeTruthy()
    expect(getByTestId("fade-component").classList.contains("fade")).toBe(true)
  })
  it('Should add "in" class when entering', done => {
    const { getByTestId, rerender } = render(
      <Component>Panel content</Component>
    )
    expect(getByTestId("status-hide")).toBeTruthy()
    rerender(
      <Component
        in
        onEntering={() => {
          const node = getByTestId("fade-component")
          expect(node.classList.contains("fade")).toBe(true)
          expect(node.classList.contains("show")).toBe(true)
          done()
        }}
      >
        Panel content
      </Component>
    )
  })
  it('Should remove "in" class when exiting', done => {
    const { getByTestId, rerender } = render(
      <Component in>Panel content</Component>
    )
    const node = getByTestId("fade-component")
    expect(node.classList.contains("fade")).toBe(true)
    expect(node.classList.contains("show")).toBe(true)
    rerender(
      <Component
        in={false}
        onExiting={() => {
          expect(node.classList.contains("fade")).toBe(true)
          expect(node.classList.contains("show")).toBe(false)
          done()
        }}
      >
        Panel content
      </Component>
    )
  })
})
