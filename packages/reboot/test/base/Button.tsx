import { Button } from "../../src/base/Button.jsx"
import { render, fireEvent } from "@testing-library/react"
import * as React from "react"

describe("<Button>", () => {
  it("Should output a button", () => {
    const { container } = render(<Button>Title</Button>)
    expect(container.firstElementChild!.tagName).toEqual("BUTTON")
  })
  it("Should have type=button by default", () => {
    const { container } = render(<Button>Title</Button>)
    expect(container.firstElementChild!.getAttribute("type")!).toEqual("button")
  })
  it("Should show the type if passed one", () => {
    const { container } = render(<Button type="submit">Title</Button>)
    expect(container.firstElementChild!.getAttribute("type")!).toEqual("submit")
  })
  it('Should show the type if explicitly passed in when "as" is used', () => {
    const { container } = render(
      <Button as="div" type="submit">
        Title
      </Button>
    )
    expect(container.firstElementChild!.getAttribute("type")!).toEqual("submit")
  })
  it('Should not have default type=button when "as" is used', () => {
    const { container } = render(<Button as="div">Title</Button>)
    expect(container.firstElementChild!.getAttribute("type")).toBeNull()
  })
  it("Should forward refs to the button", () => {
    const ref = React.createRef<any>()
    const { rerender } = render(
      <div>
        <Button ref={ref}>Yo</Button>
      </div>
    )
    expect(ref.current!.tagName).toEqual("BUTTON")
    rerender(
      <div>
        <Button ref={ref} href="a">
          Yo
        </Button>
      </div>
    )
    expect(ref.current.tagName).toEqual("A")
  })
  it("Should output an anchor if called with a href", () => {
    const href = "/url"
    const { container } = render(<Button href={href}>Title</Button>)
    expect(container.querySelector(`a[href="${href}"]`)).toBeTruthy()
  })
  it("Should call onClick callback", done => {
    const { container } = render(<Button onClick={() => done()}>Title</Button>)
    fireEvent.click(container.firstElementChild!)
  })
  it("Should be disabled button", () => {
    const { container } = render(<Button disabled>Title</Button>)
    expect(container.querySelector(`button[disabled]`)).toBeTruthy()
  })
  it("Should be inferred disabled link", () => {
    const mock = jest.fn()
    const { container } = render(
      <Button disabled href="#foo" onClick={mock}>
        Title
      </Button>
    )
    expect(container.querySelector(`a[disabled]`)).not.toBeTruthy()
    const anchor = container.querySelector(`a[role="button"][aria-disabled]`)!
    expect(anchor).toBeTruthy()
    fireEvent.click(anchor)
    expect(mock).not.toHaveBeenCalled()
  })
  ;["#", ""].forEach(href => {
    it(`Should prevent default on trivial href="${href}" clicks`, () => {
      const mock = jest.fn()
      const { getByText } = render(
        <div onClick={mock}>
          <Button href={href}>Title</Button>
        </div>
      )
      const button = getByText("Title")
      expect(button).toBeTruthy()
      fireEvent.click(button)
      expect(mock).toHaveBeenCalled()
      const event = mock.mock.calls[0].args[0]
      expect(event.defaultPrevented).toEqual(true)
    })
  })
  it(`Should not prevent default on button clicks`, () => {
    const mock = jest.fn()
    const { getByText } = render(
      <div onClick={mock}>
        <Button>Title</Button>
      </div>
    )
    const button = getByText("Title")
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(mock).toHaveBeenCalled()
    const event = mock.mock.calls[0].args[0]
    expect(event.defaultPrevented).toEqual(false)
  })
  it("Should be disabled link", () => {
    const mock = jest.fn()
    const { container } = render(
      <Button disabled as="a" onClick={mock}>
        Title
      </Button>
    )
    const anchor = container.querySelector(`a[role="button"][aria-disabled]`)!
    expect(anchor).toBeTruthy()
    fireEvent.click(anchor)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should render an anchor with # if href not provided", () => {
    const { container } = render(<Button as="a">Title</Button>)
    expect(container.firstElementChild!.getAttribute("href")!).toEqual("#")
  })
})
