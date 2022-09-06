import { Breadcrumb, Item } from "../src/Breadcrumb.js"
import { Button } from "../src/Button.js"
import { render, fireEvent } from "@testing-library/react"

describe("<Breadcrumb>", () => {
  it("Should apply id to the wrapper ol element", () => {
    const { container } = render(<Breadcrumb id="custom-id" />)
    expect(container.querySelectorAll("#custom-id").length).toEqual(1)
  })
  it("Should have breadcrumb class inside ol", () => {
    const { getByRole } = render(<Breadcrumb />)
    const y = getByRole("list")
    expect(y.classList.contains("breadcrumb")).toBe(true)
  })
  it("Should have custom classes", () => {
    const { getByTestId } = render(
      <Breadcrumb className="custom-one custom-two" data-testid="test" />
    )
    const y = getByTestId("test")
    expect(y.classList.contains("custom-one")).toBe(true)
    expect(y.classList.contains("custom-two")).toBe(true)
  })
  it("Should not have a navigation role", () => {
    const { container: c } = render(
      <Breadcrumb className="custom-one custom-two" />
    )
    expect(c.querySelectorAll('ol[role="navigation"]').length).toEqual(0)
  })
  it("Should have an aria-label in ol", () => {
    const { getByLabelText } = render(
      <Breadcrumb className="custom-one custom-two" />
    )
    expect(getByLabelText("breadcrumb")).toBeTruthy()
  })
  it("Should have nav as default component", () => {
    const { getByTestId } = render(<Breadcrumb data-testid="test" />)
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("nav")
  })
})
describe("<Item>", () => {
  it("Should render `a` as inner element when is not active", () => {
    const { container: c } = render(<Item href="#">Crumb</Item>)
    expect(c.querySelectorAll("button.active").length).toEqual(0)
  })
  it("Should render `li` with no children as inner element when active.", () => {
    const { queryAllByRole, getByText } = render(
      <Item active>Active Crumb</Item>
    )
    expect(queryAllByRole("listitem").length).toEqual(1)
    expect(getByText("Active Crumb")).toBeTruthy()
  })
  it("Should render `li` with no children as inner element when active and has href", () => {
    const { queryAllByRole, getByText } = render(
      <Item href="#" active>
        Active Crumb
      </Item>
    )
    expect(queryAllByRole("listitem").length).toEqual(1)
    expect(getByText("Active Crumb")).toBeTruthy()
  })
  it("Should add custom classes onto `li` wrapper element", () => {
    const { getByTestId } = render(
      <Item className="custom-one custom-two" data-testid="test">
        a
      </Item>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("custom-one")).toBe(true)
    expect(y.classList.contains("custom-two")).toBe(true)
  })
  it("Should add aria-current to active element", () => {
    const { queryAllByRole } = render(<Item active>Active Crumb</Item>)
    expect(queryAllByRole("listitem", { current: "page" }).length).toEqual(1)
  })
  it("Should spread additional props onto inner element", () => {
    const mock = jest.fn()
    const { getByRole } = render(
      <Item href="#" onClick={mock}>
        Crumb
      </Item>
    )
    fireEvent.click(getByRole("button"))
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should apply id onto the li element", () => {
    const { container: c } = render(
      <Item href="#" id="test-link-id">
        Crumb
      </Item>
    )
    expect(c.querySelectorAll("#test-link-id").length).toEqual(1)
  })
  it("Should apply `href` property onto `a` inner element", () => {
    const { getByRole } = render(
      <Item href="http://getbootstrap.com/components/#breadcrumbs">Crumb</Item>
    )
    const y = getByRole("link").getAttribute("href") || ""
    expect(y).toEqual("http://getbootstrap.com/components/#breadcrumbs")
  })
  it("Should apply `title` property onto `a` inner element", () => {
    const { getByTitle } = render(
      <Item
        title="test-title"
        href="http://getbootstrap.com/components/#breadcrumbs"
      >
        Crumb
      </Item>
    )
    expect(getByTitle("test-title")).toBeTruthy()
  })
  it("Should not apply properties for inner `anchor` onto `li` wrapper element", () => {
    const { container: c } = render(
      <Item title="test-title" href="/hi" data-testid>
        Crumb
      </Item>
    )
    expect(c.querySelectorAll('li[href="/hi"]').length).toEqual(0)
    expect(c.querySelectorAll('li[title="test-title"]').length).toEqual(0)
  })
  it("Should set `target` attribute on `anchor`", () => {
    const { getByRole } = render(
      <Item
        target="_blank"
        href="http://getbootstrap.com/components/#breadcrumbs"
      >
        Crumb
      </Item>
    )
    const y = getByRole("link")
    expect(y.getAttribute("target")).toEqual("_blank")
  })
  it("Should have li as default component", () => {
    const { getByTestId } = render(<Item data-testid="test" />)
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("li")
  })
  it("Should be able to customize inner link element", () => {
    const { container: c } = render(<Item linkAs={Button} />)
    expect(c.querySelectorAll("a").length).toEqual(0)
    expect(c.querySelectorAll("button").length).toEqual(1)
  })
  it("Should be able to pass props to the customized inner link element", () => {
    const { getByRole } = render(
      <Item linkAs={Button} linkProps={{ type: "submit" }} />
    )
    const y = getByRole("button")
    expect(y.getAttribute("type")).toEqual("submit")
  })
  it("Should be able to pass attributes to the link element", () => {
    const { getByRole } = render(<Item linkProps={{ foo: "bar" }}>Crumb</Item>)
    const y = getByRole("button")
    expect(y.getAttribute("foo")).toEqual("bar")
  })
  it("Should be able to pass attributes to the li element", () => {
    const { getByRole } = render(<Item data-foo="bar">Crumb</Item>)
    const y = getByRole("listitem")
    expect(y.getAttribute("data-foo")).toEqual("bar")
  })
})
