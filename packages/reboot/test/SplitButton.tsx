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
  test("should open the menu when dropdown button is clicked", () => {
    const { getByTestId } = render(simple)
    const splitButtonElem = getByTestId("test-wrapper")
    splitButtonElem.classList.contains("show").should.be.false
    fireEvent.click(splitButtonElem.children[1])
    splitButtonElem.classList.contains("show").should.be.true
  })
  test("should not open the menu when other button is clicked", () => {
    const { getByTestId } = render(simple)
    const splitButtonElem = getByTestId("test-wrapper")
    splitButtonElem.classList.contains("show").should.be.false
    fireEvent.click(splitButtonElem.children[0])
    splitButtonElem.classList.contains("show").should.be.false
  })
  test("should invoke onClick when SplitButton.Button is clicked (prop)", done => {
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
  test("should not invoke onClick when SplitButton.Toggle is clicked (prop)", () => {
    const onClickSpy = sinon.spy()
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
    onClickSpy.should.not.have.been.called
  })
  test("Should pass disabled to both buttons", () => {
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
    splitButtonElem.getAttribute("disabled")!.should.exist
    splitButtonElem.children[0].getAttribute("disabled")!.should.exist
    splitButtonElem.children[1].getAttribute("disabled")!.should.exist
  })
  test("Should set target attribute on anchor", () => {
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
    splitButtonElem.firstElementChild!.tagName.toLowerCase().should.equal("a")
    splitButtonElem
      .firstElementChild!.getAttribute("href")!
      .should.equal("/some/unique-thing/")
    splitButtonElem
      .firstElementChild!.getAttribute("target")!
      .should.equal("_blank")
  })
  test("should set accessible label on toggle", () => {
    const { getByText } = render(simple)
    const toggleLabelElem = getByText("Toggle dropdown")
    toggleLabelElem.classList.contains("visually-hidden").should.be.true
  })
  test("should set aria-label on toggle from toggleLabel", () => {
    const { getByText } = render(
      <SplitButton title="Title" id="test-id" toggleLabel="Label">
        <Item>Item 1</Item>
      </SplitButton>
    )
    const labelElem = getByText("Label")
    labelElem.classList.contains("visually-hidden").should.be.true
  })
  test("should set type attribute from type", () => {
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
    splitButtonElem
      .firstElementChild!.getAttribute("type")!
      .should.equal("submit")
  })
})
