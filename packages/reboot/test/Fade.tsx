import * as React from "react"
import { Transition } from "react-transition-group"
import { render } from "@testing-library/react"
import { Fade, Props } from "../src/Fade.jsx"

describe("Fade", () => {
  class Component extends React.Component<
    React.PropsWithChildren<Omit<Props, "children">>
  > {
    fade: Transition<HTMLElement> | null = null

    render() {
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
  test("should not throw an error with StrictMode", () => {
    render(
      <React.StrictMode>
        <Component in>Panel content</Component>
      </React.StrictMode>
    )
  })
  test("should work with a class component as children", () => {
    const onEnteringSpy = sinon.spy()
    class InnerComponent extends React.Component {
      render() {
        return <div {...this.props}>test</div>
      }
    }
    const { getByTestId } = render(
      <Fade in onEntering={onEnteringSpy} data-testid="test">
        <InnerComponent />
      </Fade>
    )
    const node = getByTestId("test")
    node.classList.contains("fade").should.be.true
    node.classList.contains("show").should.be.true
  })
  test("Should default to hidden", () => {
    const { getByTestId } = render(<Component>Panel content</Component>)
    getByTestId("status-hide").should.exist
  })
  test('Should always have the "fade" class', () => {
    const { getByTestId } = render(<Component>Panel content</Component>)
    getByTestId("status-hide").should.exist
    getByTestId("fade-component").classList.contains("fade").should.be.true
  })
  test('Should add "in" class when entering', done => {
    const { getByTestId, rerender } = render(
      <Component>Panel content</Component>
    )
    getByTestId("status-hide").should.exist
    rerender(
      <Component
        in
        onEntering={() => {
          const node = getByTestId("fade-component")
          node.classList.contains("fade").should.be.true
          node.classList.contains("show").should.be.true
          done()
        }}
      >
        Panel content
      </Component>
    )
  })
  test('Should remove "in" class when exiting', done => {
    const { getByTestId, rerender } = render(
      <Component in>Panel content</Component>
    )
    const node = getByTestId("fade-component")
    node.classList.contains("fade").should.be.true
    node.classList.contains("show").should.be.true
    rerender(
      <Component
        in={false}
        onExiting={() => {
          node.classList.contains("fade").should.be.true
          node.classList.contains("show").should.be.false
          done()
        }}
      >
        Panel content
      </Component>
    )
  })
})
