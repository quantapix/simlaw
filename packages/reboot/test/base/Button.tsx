import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import { Button } from "../../src/base/Button.jsx"
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
  it("should forward refs to the button", () => {
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
    // .assertSingle(`a[href="${href}"]`);
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
    const clickSpy = jest.fn()
    const { container } = render(
      <Button disabled href="#foo" onClick={clickSpy}>
        Title
      </Button>
    )
    expect(container.querySelector(`a[disabled]`)).not.toBeTruthy()
    const anchor = container.querySelector(`a[role="button"][aria-disabled]`)!
    expect(anchor).toBeTruthy()
    fireEvent.click(anchor)
    expect(clickSpy).not.toHaveBeenCalled()
  })
  ;["#", ""].forEach(href => {
    it(`should prevent default on trivial href="${href}" clicks`, () => {
      const clickSpy = jest.fn()
      const { getByText } = render(
        <div onClick={clickSpy}>
          <Button href={href}>Title</Button>
        </div>
      )
      const button = getByText("Title")
      expect(button).toBeTruthy()
      fireEvent.click(button)
      expect(clickSpy).toHaveBeenCalled()
      const event = clickSpy.mock.calls[0].args[0]
      expect(event.defaultPrevented).toEqual(true)
    })
  })
  it(`should not prevent default on button clicks`, () => {
    const clickSpy = jest.fn()
    const { getByText } = render(
      <div onClick={clickSpy}>
        <Button>Title</Button>
      </div>
    )
    const button = getByText("Title")
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(clickSpy).toHaveBeenCalled()
    const event = clickSpy.mock.calls[0].args[0]
    expect(event.defaultPrevented).toEqual(false)
  })
  it("Should be disabled link", () => {
    const clickSpy = jest.fn()
    const { container } = render(
      <Button disabled as="a" onClick={clickSpy}>
        Title
      </Button>
    )
    const anchor = container.querySelector(`a[role="button"][aria-disabled]`)!
    expect(anchor).toBeTruthy()
    fireEvent.click(anchor)
    expect(clickSpy).not.toHaveBeenCalled()
  })
  it("should render an anchor with # if href not provided", () => {
    const { container } = render(<Button as="a">Title</Button>)
    expect(container.firstElementChild!.getAttribute("href")!).toEqual("#")
  })
})
