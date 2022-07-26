import { Button, Group } from "../src/Toggle.js"
import { render, fireEvent } from "@testing-library/react"
import * as qr from "react"

describe("Button", () => {
  it("should forward refs to the label", () => {
    const ref = qr.createRef<HTMLLabelElement>()
    render(
      <Button id="id" ref={ref} value={1}>
        Option
      </Button>
    )
    expect(ref.current!.tagName).toEqual("LABEL")
  })
  it("should add an inputRef", () => {
    const ref = qr.createRef<HTMLInputElement>()
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
    const { container: c, getByLabelText } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(1)
    expect(c.firstElementChild!.classList.contains("btn-group")).toBe(true)
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
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(1)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
  })
  it("should render checkboxes vertically and small", () => {
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(2)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
    expect(c.firstElementChild!.classList.contains("btn-group-sm")).toBe(true)
  })
  it("should render checkboxes vertically and large", () => {
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(2)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
    expect(c.firstElementChild!.classList.contains("btn-group-lg")).toBe(true)
  })
  it("should render radios", () => {
    const { container: c, getByLabelText } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(1)
    expect(c.firstElementChild!.classList.contains("btn-group")).toBe(true)
    expect(getByLabelText("Option 1")!.getAttribute("type")!).toEqual("radio")
    expect(getByLabelText("Option 2")!.getAttribute("type")!).toEqual("radio")
    expect(getByLabelText("Option 3")!.getAttribute("type")!).toEqual("radio")
  })
  it("should render radios vertically", () => {
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(1)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
  })
  it("should render radios vertically and small", () => {
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(2)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
    expect(c.firstElementChild!.classList.contains("btn-group-sm")).toBe(true)
  })
  it("should render radios vertically and large", () => {
    const { container: c } = render(
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
    expect(c.firstElementChild!.classList.length).toEqual(2)
    expect(c.firstElementChild!.classList.contains("btn-group-vertical")).toBe(
      true
    )
    expect(c.firstElementChild!.classList.contains("btn-group-lg")).toBe(true)
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
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Group type="checkbox" onChange={mock}>
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
    expect(mock).toHaveBeenCalledWith([2])
  })
  it("should return a single value", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Group type="radio" name="items" onChange={mock}>
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
    expect(mock).toHaveBeenCalledWith(2)
  })
  it("should filter out value when deselected", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Group type="checkbox" name="items" defaultValue={[1, 2]} onChange={mock}>
        <Button id="id1" data-testid="id1" value={1}>
          Option 1
        </Button>
        <Button id="id2" data-testid="id2" value={2}>
          Option 2
        </Button>
      </Group>
    )
    fireEvent.click(getByLabelText("Option 1"))
    expect(mock).toHaveBeenCalledWith([2])
  })
})
