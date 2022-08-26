import * as React from "react"
import { render } from "@testing-library/react"
import { Theme, createComponent } from "../src/Theme.jsx"
import { Button } from "../src/Button.jsx"

describe("<Theme>", () => {
  const hocValue = "foo"
  const Foo = createComponent(
    class Foo extends React.Component<{ bsPrefix: string }, any> {
      override render() {
        return (
          <p className={`${this.props.bsPrefix} ${this.props.bsPrefix}-bar`}>
            foo val
          </p>
        )
      }
    },
    hocValue
  )
  it("should use HOC value", () => {
    const { getByText } = render(
      <div>
        <Foo />
      </div>
    )
    const fooElem = getByText("foo val")
    expect(fooElem.classList.contains(hocValue)).toBe(true)
    expect(fooElem.tagName.toLowerCase()).toEqual("p")
  })
  it("should provide bsPrefix overrides", () => {
    const { getByText } = render(
      <Theme prefixes={{ btn: "my-btn", foo: "global-foo" }}>
        <div>
          <Button variant="primary">My label</Button>
          <Foo />
        </div>
      </Theme>
    )
    const buttonElem = getByText("My label")
    expect(buttonElem.tagName.toLowerCase()).toEqual("button")
    expect(buttonElem.classList.contains("my-btn")).toBe(true)
    expect(buttonElem.classList.contains("my-btn-primary")).toBe(true)
    const fooElem = getByText("foo val")
    expect(fooElem.tagName.toLowerCase()).toEqual("p")
    expect(fooElem.classList.contains("global-foo")).toBe(true)
  })
  it("should use prop bsPrefix first", () => {
    const { getByText } = render(
      <Theme prefixes={{ foo: "global-foo" }}>
        <div>
          <Foo bsPrefix="my-foo" />
        </div>
      </Theme>
    )
    const fooElem = getByText("foo val")
    expect(fooElem.tagName.toLowerCase()).toEqual("p")
    expect(fooElem.classList.contains("my-foo")).toBe(true)
  })
  it("should forward ref", () => {
    let ref
    const { getByText } = render(
      <div>
        <Foo bsPrefix="my-foo" ref={r => (ref = r)} />
      </div>
    )
    expect(getByText("foo val").className.includes(ref.props.bsPrefix)).toBe(
      true
    )
  })
})
