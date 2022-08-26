import { act } from "react-dom/test-utils"
import { mount } from "enzyme"
import { Portal } from "../../src/base/Portal.jsx"
import * as React from "react"
import ReactDOM from "react-dom"

describe("Portal", () => {
  it("should render overlay into container (document)", () => {
    class Container extends React.Component {
      override componentDidMount() {
        expect(this.div).toBeTruthy()
      }
      override render() {
        return (
          <Portal>
            <div
              ref={c => {
                this.div = c
              }}
              id="test1"
            />
          </Portal>
        )
      }
    }
    mount(<Container />)
    expect(document.querySelectorAll("#test1")).toHaveLength(1)
  })
  it("should render overlay into container (DOMNode)", () => {
    const container = document.createElement("div")
    class Container extends React.Component {
      override componentDidMount() {
        expect(this.div).toBeTruthy()
      }
      override render() {
        return (
          <Portal container={container}>
            <div
              ref={c => {
                this.div = c
              }}
              id="test1"
            />
          </Portal>
        )
      }
    }
    mount(<Container />)
    expect(container.querySelectorAll("#test1")).toHaveLength(1)
  })
  it("should render overlay into container (ReactComponent)", () => {
    class Container extends React.Component {
      container = React.createRef()
      override componentDidMount() {
        expect(this.div).not.toBeTruthy()
      }
      override render() {
        return (
          <div ref={this.container}>
            <Portal container={this.container}>
              <div
                ref={c => {
                  this.div = c
                }}
                id="test1"
              />
            </Portal>
          </div>
        )
      }
    }
    let instance
    act(() => {
      instance = mount(<Container />).instance()
    })
    expect(instance.div).toBeTruthy()
    expect(
      ReactDOM.findDOMNode(instance).querySelectorAll("#test1")
    ).toHaveLength(1)
  })
  it("should not fail to render a null overlay", () => {
    class Container extends React.Component {
      container = React.createRef()
      override render() {
        return (
          <div ref={this.container}>
            <Portal container={this.container} />
          </div>
        )
      }
    }
    const nodes = mount(<Container />).getDOMNode().childNodes
    expect(nodes).to.be.empty
  })
  it("should unmount when parent unmounts", () => {
    class Parent extends React.Component {
      override state = { show: true }
      override render() {
        return <div>{(this.state.show && <Child />) || null}</div>
      }
    }
    class Child extends React.Component {
      override render() {
        return (
          <div>
            <div
              ref={c => {
                this.container = c
              }}
            />
            <Portal container={() => this.container}>
              <div id="test1" />
            </Portal>
          </div>
        )
      }
    }
    const instance = mount(<Parent />)
    instance.setState({ show: false })
  })
})
