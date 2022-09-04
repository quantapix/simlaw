import { Button, Close, Group, Toolbar } from "../src/Button.jsx"
import { fireEvent, render } from "@testing-library/react"
import * as qr from "react"

describe("<Button>", () => {
  it("Should output a button", () => {
    const { getByRole } = render(<Button>Title</Button>)
    expect(getByRole("button")).toBeTruthy()
  })
  it("Should have type=button by default", () => {
    const { getByRole } = render(<Button>Title</Button>)
    expect(getByRole("button").getAttribute("type")).toEqual("button")
  })
  it("Should show the type if passed one", () => {
    const { getByRole } = render(<Button type="submit">Title</Button>)
    expect(getByRole("button").getAttribute("type")).toEqual("submit")
  })
  it('Should show the type if explicitly passed in when "as" is used', () => {
    const { getByTestId } = render(
      <Button as="div" type="submit" data-testid="test">
        Title
      </Button>
    )
    expect(getByTestId("test").getAttribute("type")).toEqual("submit")
  })
  it('Should not have default type=button when "as" is used', () => {
    const { getByTestId } = render(
      <Button as="div" data-testid="test">
        Title
      </Button>
    )
    expect(getByTestId("test").getAttribute("type")).toBeNull()
  })
  it("Should forward refs to the button", () => {
    const ref = qr.createRef<HTMLButtonElement>()
    render(
      <div>
        <Button ref={ref}>Yo</Button>
      </div>
    )
    expect(ref.current?.tagName).toEqual("BUTTON")
    render(
      <div>
        <Button ref={ref} href="a">
          Yo
        </Button>
      </div>
    )
    expect(ref.current?.tagName).toEqual("A")
  })
  it("Should output an anchor if called with a href", () => {
    const href = "/url"
    const { getByRole } = render(<Button href={href}>Title</Button>)
    expect(getByRole("button").getAttribute("href")).toEqual(href)
  })
  it("Should call onClick callback", () => {
    const mock = jest.fn()
    const { getByRole } = render(<Button onClick={mock}>Title</Button>)
    fireEvent.click(getByRole("button"))
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should be disabled", () => {
    const { getByRole } = render(<Button disabled>Title</Button>)
    expect(getByRole("button").matches("[disabled]")).toBe(true)
  })
  it("Should be disabled link", () => {
    const { getByRole } = render(
      <Button disabled href="#">
        Title
      </Button>
    )
    expect(getByRole("button").classList.contains("disabled")).toBe(true)
  })
  it("Should apply variant class", () => {
    const { getByRole } = render(<Button variant="danger">Title</Button>)
    expect(getByRole("button").classList.contains("btn-danger")).toBe(true)
  })
  it("Should have size class", () => {
    const { getByRole } = render(<Button size="lg">Title</Button>)
    expect(getByRole("button").classList.contains("btn-lg")).toBe(true)
  })
  it("Should honour additional classes passed in, adding not overriding", () => {
    const { getByRole } = render(
      <Button className="bob" variant="danger">
        Title
      </Button>
    )
    const y = getByRole("button")
    expect(y.classList.contains("bob")).toBe(true)
    expect(y.classList.contains("btn-danger")).toBe(true)
  })
  it('Should default to variant="primary"', () => {
    const { getByRole } = render(<Button>Title</Button>)
    expect(getByRole("button").classList.contains("btn-primary")).toBe(true)
  })
  it("Should remove default variant", () => {
    const { getByRole } = render(<Button variant={null as any}>Title</Button>)
    expect(getByRole("button").classList.contains("btn-primary")).toBe(false)
  })
  it("Should not output null variant", () => {
    const { getByRole } = render(<Button variant="">Title</Button>)
    expect(getByRole("button").classList.contains("btn-null")).toBe(false)
  })
  it("Should not output empty variant", () => {
    const { getByRole } = render(<Button variant="">Title</Button>)
    expect(getByRole("button").classList.contains("btn-")).toBe(false)
  })
  it("Should be active", () => {
    const { getByRole } = render(<Button active>Title</Button>)
    expect(getByRole("button").classList.contains("active")).toBe(true)
  })
  it("Should allow a custom prefix", () => {
    const { getByRole } = render(
      <Button bsPrefix="my-btn" variant="danger">
        Title
      </Button>
    )
    const y = getByRole("button")
    expect(y.classList.contains("my-btn")).toBe(true)
    expect(y.classList.contains("my-btn-danger")).toBe(true)
  })
})
describe("Group", () => {
  it("Should output a button group", () => {
    const { getByRole } = render(
      <Group>
        <Button>Title</Button>
      </Group>
    )
    expect(getByRole("group")).toBeTruthy()
  })
  it("Should add size", () => {
    const { getByRole } = render(
      <Group size="lg">
        <Button>Title</Button>
      </Group>
    )
    expect(getByRole("group").classList.contains("btn-group-lg")).toBe(true)
  })
  it("Should add vertical variation", () => {
    const { getByRole } = render(
      <Group vertical>
        <Button>Title</Button>
      </Group>
    )
    const y = getByRole("group")
    expect(y.classList.contains("btn-group-vertical")).toBe(true)
    expect(y.classList.contains("btn-group")).toBe(false)
  })
  it("Should have div as default component", () => {
    const { getByRole } = render(<Group />)
    expect(getByRole("group").tagName.toLowerCase()).toEqual("div")
  })
  it("Should allow component tag customization", () => {
    const { getByRole } = render(<Group as="article" />)
    expect(getByRole("group").tagName.toLowerCase()).toEqual("article")
  })
})
describe("Toolbar", () => {
  it("Should output a button toolbar", () => {
    const { getByRole } = render(
      <Toolbar>
        <Button>Title</Button>
      </Toolbar>
    )
    expect(getByRole("toolbar").classList.contains("btn-toolbar")).toBe(true)
  })
  it("Should allow a custom prefix", () => {
    const { getByRole } = render(
      <Toolbar bsPrefix="my-custom-toolbar">
        <Button>Title</Button>
      </Toolbar>
    )
    const y = getByRole("toolbar")
    expect(y.classList.contains("my-custom-toolbar")).toBe(true)
    expect(y.classList.contains("btn-toolbar")).toBe(false)
  })
})
describe("<Close>", () => {
  it("Should output a button", () => {
    const { getAllByRole } = render(<Close />)
    expect(getAllByRole("button")).toHaveLength(1)
  })
  it("Should have type=button by default", () => {
    const { getByRole } = render(<Close />)
    expect(getByRole("button").getAttribute("type")).toEqual("button")
  })
  it("Should have class .btn-close", () => {
    const { getByRole } = render(<Close />)
    getByRole("button").classList.contains("btn-close")
  })
  it("Should call onClick callback", () => {
    const mock = jest.fn()
    const { getByRole } = render(<Close onClick={mock} />)
    fireEvent.click(getByRole("button"))
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it('Should have a aria-label defaulted to "Close"', () => {
    const { getByLabelText } = render(<Close />)
    expect(getByLabelText("Close", { selector: "[aria-label]" })).toBeTruthy()
  })
  it("Should allow override of aria-label", () => {
    const { getByLabelText } = render(<Close aria-label="My Close" />)
    expect(
      getByLabelText("My Close", { selector: "[aria-label]" })
    ).toBeTruthy()
  })
})
