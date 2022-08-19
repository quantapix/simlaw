import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import { Button, Group } from "../src/Toggle.jsx"

describe("Button", () => {
  test("should forward refs to the label", () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(
      <Button id="id" ref={ref} value={1}>
        Option
      </Button>
    )
    ref.current!.tagName.should.equal("LABEL")
  })
  test("should add an inputRef", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(
      <Button id="id" inputRef={ref} value={1}>
        Option
      </Button>
    )
    ref.current!.tagName.should.equal("INPUT")
  })
  test("should not have a role on the label button", () => {
    const { getByText } = render(
      <Button id="id" value={1}>
        Option
      </Button>
    )
    expect(getByText("Option").getAttribute("role")).to.not.exist
  })
})
describe("Group", () => {
  test("should render checkboxes", () => {
    const { container, getByLabelText } = render(
      <Group type="checkbox">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(1)
    container.firstElementChild!.classList.contains("btn-group").should.be.true
    getByLabelText("Option 1")!.getAttribute("type")!.should.equal("checkbox")
    getByLabelText("Option 2")!.getAttribute("type")!.should.equal("checkbox")
    getByLabelText("Option 3")!.getAttribute("type")!.should.equal("checkbox")
  })
  test("should render checkboxes vertically", () => {
    const { container } = render(
      <Group type="checkbox" vertical>
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(1)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
  })
  test("should render checkboxes vertically and small", () => {
    const { container } = render(
      <Group type="checkbox" vertical size="sm">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(2)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
    container.firstElementChild!.classList.contains("btn-group-sm").should.be
      .true
  })
  test("should render checkboxes vertically and large", () => {
    const { container } = render(
      <Group type="checkbox" vertical size="lg">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(2)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
    container.firstElementChild!.classList.contains("btn-group-lg").should.be
      .true
  })
  test("should render radios", () => {
    const { container, getByLabelText } = render(
      <Group type="radio" name="items">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(1)
    container.firstElementChild!.classList.contains("btn-group").should.be.true
    getByLabelText("Option 1")!.getAttribute("type")!.should.equal("radio")
    getByLabelText("Option 2")!.getAttribute("type")!.should.equal("radio")
    getByLabelText("Option 3")!.getAttribute("type")!.should.equal("radio")
  })
  test("should render radios vertically", () => {
    const { container } = render(
      <Group type="radio" name="items" vertical>
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(1)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
  })
  test("should render radios vertically and small", () => {
    const { container } = render(
      <Group type="radio" name="items" vertical size="sm">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(2)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
    container.firstElementChild!.classList.contains("btn-group-sm").should.be
      .true
  })
  test("should render radios vertically and large", () => {
    const { container } = render(
      <Group type="radio" name="items" vertical size="lg">
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    container.firstElementChild!.classList.length.should.equal(2)
    container.firstElementChild!.classList.contains("btn-group-vertical").should
      .be.true
    container.firstElementChild!.classList.contains("btn-group-lg").should.be
      .true
  })
  test("should select initial values", () => {
    const { getByLabelText } = render(
      <Group type="checkbox" defaultValue={[1, 3]}>
        <Button id="id1" data-testid="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" data-testid="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" data-testid="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    ;(getByLabelText("Option 1") as HTMLInputElement)!.checked.should.be.true
    ;(getByLabelText("Option 2") as HTMLInputElement)!.checked.should.be.false
    ;(getByLabelText("Option 3") as HTMLInputElement)!.checked.should.be.true
  })
  test("should disable radios", () => {
    const { getByText, getByLabelText } = render(
      <Group type="radio" name="items">
        <Button id="id1" value={1} disabled>
          Option 1
        </Button>
        <Button id="id2" value={2} disabled>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    ;(getByLabelText("Option 1") as HTMLInputElement)!.disabled.should.be.true
    ;(getByLabelText("Option 2") as HTMLInputElement)!.disabled.should.be.true
    ;(getByLabelText("Option 3") as HTMLInputElement)!.disabled.should.be.false
    getByText("Option 1").classList.contains("disabled").should.be.true
    getByText("Option 2").classList.contains("disabled").should.be.true
    getByText("Option 3").classList.contains("disabled").should.be.false
  })
  test("should return an array of values", () => {
    const spy = sinon.spy()
    const { getByLabelText } = render(
      <Group type="checkbox" onChange={spy}>
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    fireEvent.click(getByLabelText("Option 2"))
    spy.should.have.been.calledWith([2])
  })
  test("should return a single value", () => {
    const spy = sinon.spy()
    const { getByLabelText } = render(
      <Group type="radio" name="items" onChange={spy}>
        <Button id="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" value={2}>
          Option 2
        </Button>
        <Button id="id3" value={3}>
          Option 3
        </Button>
      </Group>
    )
    fireEvent.click(getByLabelText("Option 2"))
    spy.should.have.been.calledWith(2)
  })
  test("should filter out value when deselected", () => {
    const spy = sinon.spy()
    const { getByLabelText } = render(
      <Group type="checkbox" name="items" defaultValue={[1, 2]} onChange={spy}>
        <Button id="id1" data-testid="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" data-testid="id2" value={2}>
          Option 2
        </Button>
      </Group>
    )
    fireEvent.click(getByLabelText("Option 1"))
    spy.should.have.been.calledWith([2])
  })
})
