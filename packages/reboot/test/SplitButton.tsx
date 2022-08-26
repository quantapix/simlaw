import { fireEvent, render } from "@testing-library/react"
import { SplitButton } from "../src/SplitButton.jsx"
import { Item } from "../src/Dropdown.jsx"

describe("<SplitButton>", () => {
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
    const splitButtonElem = getByTestId("test-wrapper")
    expect(splitButtonElem.classList.contains("show")).toBe(false)
    fireEvent.click(splitButtonElem.children[1])
    expect(splitButtonElem.classList.contains("show")).toBe(true)
  })
  it("should not open the menu when other button is clicked", () => {
    const { getByTestId } = render(simple)
    const splitButtonElem = getByTestId("test-wrapper")
    expect(splitButtonElem.classList.contains("show")).toBe(false)
    fireEvent.click(splitButtonElem.children[0])
    expect(splitButtonElem.classList.contains("show")).toBe(false)
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
    const splitButtonElem = getByTestId("test-wrapper")
    fireEvent.click(splitButtonElem.firstElementChild!)
  })
  it("should not invoke onClick when SplitButton.Toggle is clicked (prop)", () => {
    const onClickSpy = jest.fn()
    const { getByTestId } = render(
      <SplitButton
        data-testid="test-wrapper"
        title="Title"
        id="test-id"
        onClick={onClickSpy}
      >
        <Item>Item 1</Item>
      </SplitButton>
    )
    const splitButtonElem = getByTestId("test-wrapper")
    fireEvent.click(splitButtonElem.children[1])
    expect(onClickSpy).not.toHaveBeenCalled()
  })
  it("Should pass disabled to both buttons", () => {
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
    const splitButtonElem = getByTestId("test-wrapper")
    expect(splitButtonElem.getAttribute("disabled")!).toBeTruthy()
    expect(splitButtonElem.children[0]!.getAttribute("disabled")!).toBeTruthy()
    expect(splitButtonElem.children[1]!.getAttribute("disabled")!).toBeTruthy()
  })
  it("Should set target attribute on anchor", () => {
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
    const splitButtonElem = getByTestId("test-wrapper")
    expect(splitButtonElem.firstElementChild!.tagName.toLowerCase()).toEqual(
      "a"
    )
    expect(splitButtonElem.firstElementChild!.getAttribute("href")!).toEqual(
      "/some/unique-thing/"
    )
    expect(splitButtonElem.firstElementChild!.getAttribute("target")!).toEqual(
      "_blank"
    )
  })
  it("should set accessible label on toggle", () => {
    const { getByText } = render(simple)
    const toggleLabelElem = getByText("Toggle dropdown")
    expect(toggleLabelElem.classList.contains("visually-hidden")).toBe(true)
  })
  it("should set aria-label on toggle from toggleLabel", () => {
    const { getByText } = render(
      <SplitButton title="Title" id="test-id" toggleLabel="Label">
        <Item>Item 1</Item>
      </SplitButton>
    )
    const labelElem = getByText("Label")
    expect(labelElem.classList.contains("visually-hidden")).toBe(true)
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
    const splitButtonElem = getByTestId("test-wrapper")
    expect(splitButtonElem.firstElementChild!.getAttribute("type")!).toEqual(
      "submit"
    )
  })
})
