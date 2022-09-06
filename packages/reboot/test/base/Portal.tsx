import { act } from "react-dom/test-utils"
import { mount } from "enzyme"
import { Portal } from "../../src/base/Portal.js"
import * as qr from "react"
import ReactDOM from "react-dom"

describe("Portal", () => {
  it("Should render overlay into container (document)", () => {
    class Container extends qr.Component {
      override componentDidMount(this: any) {
        expect(this.div).toBeTruthy()
      }
      override render(this: any) {
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
  it("Should render overlay into container (DOMNode)", () => {
    const container = document.createElement("div")
    class Container extends qr.Component {
      override componentDidMount(this: any) {
        expect(this.div).toBeTruthy()
      }
      override render(this: any) {
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
  it("Should render overlay into container (ReactComponent)", () => {
    class Container extends qr.Component {
      container = qr.createRef()
      override componentDidMount(this: any) {
        expect(this.div).not.toBeTruthy()
      }
      override render(this: any) {
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
    let y: any
    act(() => {
      y = mount(<Container />).instance()
    })
    expect(y.div).toBeTruthy()
    expect(
      (ReactDOM.findDOMNode(y) as any).querySelectorAll("#test1")
    ).toHaveLength(1)
  })
  it("Should not fail to render a null overlay", () => {
    class Container extends qr.Component {
      container = qr.createRef<HTMLDivElement>()
      override render() {
        return (
          <div ref={this.container}>
            <Portal container={this.container} />
          </div>
        )
      }
    }
    const y = mount(<Container />).getDOMNode().childNodes
    expect(y).toHaveLength(0)
  })
  it("Should unmount when parent unmounts", () => {
    class Parent extends qr.Component {
      override state = { show: true }
      override render() {
        return <div>{(this.state.show && <Child />) || null}</div>
      }
    }
    class Child extends qr.Component {
      override render(this: any) {
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
