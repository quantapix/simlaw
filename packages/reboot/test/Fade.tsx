import * as React from "react"
import type { Transition } from "react-transition-group"
import { render } from "@testing-library/react"
import { Fade, Props } from "../src/Fade.jsx"
describe("Fade", () => {
  class Component extends React.Component<
    React.PropsWithChildren<Omit<Props, "children">>
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
      <React.StrictMode>
        <Component in>Panel content</Component>
      </React.StrictMode>
    )
  })
  it("should work with a class component as children", () => {
    const onEnteringSpy = jest.fn()
    class InnerComponent extends React.Component {
      override render() {
        return <div {...this.props}>test</div>
      }
    }
    const { getByTestId } = render(
      <Fade in onEntering={onEnteringSpy} data-testid="test">
        <InnerComponent />
      </Fade>
    )
    const node = getByTestId("test")
    expect(node.classList.contains("fade")).toBe(true)
    expect(node.classList.contains("show")).toBe(true)
  })
  it("Should default to hidden", () => {
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
