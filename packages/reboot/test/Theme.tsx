import { Button } from "../src/Button.js"
import { render } from "@testing-library/react"
import { Theme, createComponent } from "../src/Theme.js"
import * as qr from "react"

describe("<Theme>", () => {
  const hocValue = "foo"
  const Foo = createComponent(
    class Foo extends qr.Component<{ bsPrefix: string }, any> {
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
  it("Should use HOC value", () => {
    const { getByText } = render(
      <div>
        <Foo />
      </div>
    )
    const y = getByText("foo val")
    expect(y.classList.contains(hocValue)).toBe(true)
    expect(y.tagName.toLowerCase()).toEqual("p")
  })
  it("Should provide bsPrefix overrides", () => {
    const { getByText } = render(
      <Theme prefixes={{ btn: "my-btn", foo: "global-foo" }}>
        <div>
          <Button variant="primary">My label</Button>
          <Foo />
        </div>
      </Theme>
    )
    const y = getByText("My label")
    expect(y.tagName.toLowerCase()).toEqual("button")
    expect(y.classList.contains("my-btn")).toBe(true)
    expect(y.classList.contains("my-btn-primary")).toBe(true)
    const y2 = getByText("foo val")
    expect(y2.tagName.toLowerCase()).toEqual("p")
    expect(y2.classList.contains("global-foo")).toBe(true)
  })
  it("Should use prop bsPrefix first", () => {
    const { getByText } = render(
      <Theme prefixes={{ foo: "global-foo" }}>
        <div>
          <Foo bsPrefix="my-foo" />
        </div>
      </Theme>
    )
    const y = getByText("foo val")
    expect(y.tagName.toLowerCase()).toEqual("p")
    expect(y.classList.contains("my-foo")).toBe(true)
  })
  it("Should forward ref", () => {
    let ref: any
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
