import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import { Button, Group } from "../src/Toggle.jsx"

describe("Button", () => {
  it("should forward refs to the label", () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(
      <Button id="id" ref={ref} value={1}>
        Option
      </Button>
    )
    expect(ref.current!.tagName).toEqual("LABEL")
  })
  it("should add an inputRef", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(
      <Button id="id" inputRef={ref} value={1}>
        Option
      </Button>
    )
    expect(ref.current!.tagName).toEqual("INPUT")
  })
  it("should not have a role on the label button", () => {
    const { getByText } = render(
      <Button id="id" value={1}>
        Option
      </Button>
    )
    expect(getByText("Option").getAttribute("role")).not.toBeTruthy()
  })
})
describe("Group", () => {
  it("should render checkboxes", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(1)
    expect(container.firstElementChild!.classList.contains("btn-group")).toBe(
      true
    )
    expect(getByLabelText("Option 1")!.getAttribute("type")!).toEqual(
      "checkbox"
    )
    expect(getByLabelText("Option 2")!.getAttribute("type")!).toEqual(
      "checkbox"
    )
    expect(getByLabelText("Option 3")!.getAttribute("type")!).toEqual(
      "checkbox"
    )
  })
  it("should render checkboxes vertically", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(1)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
  })
  it("should render checkboxes vertically and small", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(2)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
    expect(
      container.firstElementChild!.classList.contains("btn-group-sm")
    ).toBe(true)
  })
  it("should render checkboxes vertically and large", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(2)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
    expect(
      container.firstElementChild!.classList.contains("btn-group-lg")
    ).toBe(true)
  })
  it("should render radios", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(1)
    expect(container.firstElementChild!.classList.contains("btn-group")).toBe(
      true
    )
    expect(getByLabelText("Option 1")!.getAttribute("type")!).toEqual("radio")
    expect(getByLabelText("Option 2")!.getAttribute("type")!).toEqual("radio")
    expect(getByLabelText("Option 3")!.getAttribute("type")!).toEqual("radio")
  })
  it("should render radios vertically", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(1)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
  })
  it("should render radios vertically and small", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(2)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
    expect(
      container.firstElementChild!.classList.contains("btn-group-sm")
    ).toBe(true)
  })
  it("should render radios vertically and large", () => {
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
    expect(container.firstElementChild!.classList.length).toEqual(2)
    expect(
      container.firstElementChild!.classList.contains("btn-group-vertical")
    ).toBe(true)
    expect(
      container.firstElementChild!.classList.contains("btn-group-lg")
    ).toBe(true)
  })
  it("should select initial values", () => {
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
    expect((getByLabelText("Option 1") as HTMLInputElement)!.checked).toBe(true)
    expect((getByLabelText("Option 2") as HTMLInputElement)!.checked).toBe(
      false
    )
    expect((getByLabelText("Option 3") as HTMLInputElement)!.checked).toBe(true)
  })
  it("should disable radios", () => {
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
    expect((getByLabelText("Option 1") as HTMLInputElement)!.disabled).toBe(
      true
    )
    expect((getByLabelText("Option 2") as HTMLInputElement)!.disabled).toBe(
      true
    )
    expect((getByLabelText("Option 3") as HTMLInputElement)!.disabled).toBe(
      false
    )
    expect(getByText("Option 1").classList.contains("disabled")).toBe(true)
    expect(getByText("Option 2").classList.contains("disabled")).toBe(true)
    expect(getByText("Option 3").classList.contains("disabled")).toBe(false)
  })
  it("should return an array of values", () => {
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
    expect(spy).toHaveBeenCalledWith([2])
  })
  it("should return a single value", () => {
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
    expect(spy).toHaveBeenCalledWith(2)
  })
  it("should filter out value when deselected", () => {
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
    expect(spy).toHaveBeenCalledWith([2])
  })
})
