import { fireEvent, render } from "@testing-library/react"
import { SplitButton } from "../src/SplitButton.js"
import { Item } from "../src/Dropdown.js"

describe("SplitButton", () => {
  const simple = (
    <SplitButton data-testid="test-wrapper" title="Title" id="test-id">
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
      <Item>Item 4</Item>
    </SplitButton>
  )
  it("should open the menu when dropdown button is clicked", () => {
    const { getByTestId } = render(simple)
    const y = getByTestId("test-wrapper")
    expect(y.classList.contains("show")).toBe(false)
    fireEvent.click(y.children[1]!)
    expect(y.classList.contains("show")).toBe(true)
  })
  it("should not open the menu when other button is clicked", () => {
    const { getByTestId } = render(simple)
    const y = getByTestId("test-wrapper")
    expect(y.classList.contains("show")).toBe(false)
    fireEvent.click(y.children[0]!)
    expect(y.classList.contains("show")).toBe(false)
  })
  it("should invoke onClick when SplitButton.Button is clicked (prop)", done => {
    const { getByTestId } = render(
      <SplitButton
        data-testid="test-wrapper"
        title="Title"
        id="test-id"
        onClick={() => done()}
      >
        <Item>Item 1</Item>
      </SplitButton>
    )
    const y = getByTestId("test-wrapper")
    fireEvent.click(y.firstElementChild!)
  })
  it("should not invoke onClick when SplitButton.Toggle is clicked (prop)", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <SplitButton
        data-testid="test-wrapper"
        title="Title"
        id="test-id"
        onClick={mock}
      >
        <Item>Item 1</Item>
      </SplitButton>
    )
    const y = getByTestId("test-wrapper")
    fireEvent.click(y.children[1]!)
    expect(mock).not.toHaveBeenCalled()
  })
  it("should pass disabled to both buttons", () => {
    const { getByTestId } = render(
      <SplitButton
        data-testid="test-wrapper"
        title="Title"
        id="test-id"
        disabled
      >
        <Item>Item 1</Item>
      </SplitButton>
    )
    const y = getByTestId("test-wrapper")
    expect(y.getAttribute("disabled")!).toBeTruthy()
    expect(y.children[0]!.getAttribute("disabled")!).toBeTruthy()
    expect(y.children[1]!.getAttribute("disabled")!).toBeTruthy()
  })
  it("should set target attribute on anchor", () => {
    const { getByTestId } = render(
      <SplitButton
        title="Title"
        id="test-id"
        data-testid="test-wrapper"
        href="/some/unique-thing/"
        target="_blank"
      >
        <Item eventKey="1">Item 1 content</Item>
      </SplitButton>
    )
    const y = getByTestId("test-wrapper")
    expect(y.firstElementChild!.tagName.toLowerCase()).toEqual("a")
    expect(y.firstElementChild!.getAttribute("href")!).toEqual(
      "/some/unique-thing/"
    )
    expect(y.firstElementChild!.getAttribute("target")!).toEqual("_blank")
  })
  it("should set accessible label on toggle", () => {
    const { getByText } = render(simple)
    const y = getByText("Toggle dropdown")
    expect(y.classList.contains("visually-hidden")).toBe(true)
  })
  it("should set aria-label on toggle from toggleLabel", () => {
    const { getByText } = render(
      <SplitButton title="Title" id="test-id" toggleLabel="Label">
        <Item>Item 1</Item>
      </SplitButton>
    )
    const y = getByText("Label")
    expect(y.classList.contains("visually-hidden")).toBe(true)
  })
  it("should set type attribute from type", () => {
    const { getByTestId } = render(
      <SplitButton
        data-testid="test-wrapper"
        title="Title"
        id="test-id"
        type="submit"
      >
        <Item>Item 1</Item>
      </SplitButton>
    )
    const y = getByTestId("test-wrapper")
    expect(y.firstElementChild!.getAttribute("type")!).toEqual("submit")
  })
})
