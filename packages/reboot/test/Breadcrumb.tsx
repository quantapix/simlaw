import { render, fireEvent } from "@testing-library/react"
import { Breadcrumb, Item } from "../src/Breadcrumb.jsx"
import { Button } from "../src/Button.jsx"

describe("<Breadcrumb>", () => {
  test("Should apply id to the wrapper ol element", () => {
    const { container } = render(<Breadcrumb id="custom-id" />)
    container.querySelectorAll("#custom-id").length.should.equal(1)
  })
  test("Should have breadcrumb class inside ol", () => {
    const { getByRole } = render(<Breadcrumb />)
    getByRole("list").classList.contains("breadcrumb").should.be.true
  })
  test("Should have custom classes", () => {
    const { getByTestId } = render(
      <Breadcrumb className="custom-one custom-two" data-testid="test" />
    )
    const breadcrumb = getByTestId("test")
    breadcrumb.classList.contains("custom-one").should.be.true
    breadcrumb.classList.contains("custom-two").should.be.true
  })
  test("Should not have a navigation role", () => {
    const { container } = render(
      <Breadcrumb className="custom-one custom-two" />
    )
    container.querySelectorAll('ol[role="navigation"]').length.should.equal(0)
  })
  test("Should have an aria-label in ol", () => {
    const { getByLabelText } = render(
      <Breadcrumb className="custom-one custom-two" />
    )
    getByLabelText("breadcrumb").should.exist
  })
  test("Should have nav as default component", () => {
    const { getByTestId } = render(<Breadcrumb data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("nav")
  })
})
describe("<Item>", () => {
  test("Should render `a` as inner element when is not active", () => {
    const { container } = render(<Item href="#">Crumb</Item>)
    container.querySelectorAll("button.active").length.should.equal(0)
  })
  test("Should render `li` with no children as inner element when active.", () => {
    const { queryAllByRole, getByText } = render(
      <Item active>Active Crumb</Item>
    )
    queryAllByRole("listitem").length.should.equal(1)
    getByText("Active Crumb").should.exist
  })
  test("Should render `li` with no children as inner element when active and has href", () => {
    const { queryAllByRole, getByText } = render(
      <Item href="#" active>
        Active Crumb
      </Item>
    )
    queryAllByRole("listitem").length.should.equal(1)
    getByText("Active Crumb").should.exist
  })
  test("Should add custom classes onto `li` wrapper element", () => {
    const { getByTestId } = render(
      <Item className="custom-one custom-two" data-testid="test">
        a
      </Item>
    )
    const item = getByTestId("test")
    item.classList.contains("custom-one").should.be.true
    item.classList.contains("custom-two").should.be.true
  })
  test("Should add aria-current to active element", () => {
    const { queryAllByRole } = render(<Item active>Active Crumb</Item>)
    queryAllByRole("listitem", { current: "page" }).length.should.equal(1)
  })
  test("Should spread additional props onto inner element", () => {
    const handleClick = sinon.spy()
    const { getByRole } = render(
      <Item href="#" onClick={handleClick}>
        Crumb
      </Item>
    )
    fireEvent.click(getByRole("button"))
    handleClick.should.have.been.calledOnce
  })
  test("Should apply id onto the li element", () => {
    const { container } = render(
      <Item href="#" id="test-link-id">
        Crumb
      </Item>
    )
    container.querySelectorAll("#test-link-id").length.should.equal(1)
  })
  test("Should apply `href` property onto `a` inner element", () => {
    const { getByRole } = render(
      <Item href="http://getbootstrap.com/components/#breadcrumbs">Crumb</Item>
    )
    const href = getByRole("link").getAttribute("href") || ""
    href.should.equal("http://getbootstrap.com/components/#breadcrumbs")
  })
  test("Should apply `title` property onto `a` inner element", () => {
    const { getByTitle } = render(
      <Item
        title="test-title"
        href="http://getbootstrap.com/components/#breadcrumbs"
      >
        Crumb
      </Item>
    )
    getByTitle("test-title").should.exist
  })
  test("Should not apply properties for inner `anchor` onto `li` wrapper element", () => {
    const { container } = render(
      <Item title="test-title" href="/hi" data-testid>
        Crumb
      </Item>
    )
    container.querySelectorAll('li[href="/hi"]').length.should.equal(0)
    container.querySelectorAll('li[title="test-title"]').length.should.equal(0)
  })
  test("Should set `target` attribute on `anchor`", () => {
    const { getByRole } = render(
      <Item
        target="_blank"
        href="http://getbootstrap.com/components/#breadcrumbs"
      >
        Crumb
      </Item>
    )
    expect(getByRole("link").getAttribute("target")).to.be.equal("_blank")
  })
  test("Should have li as default component", () => {
    const { getByTestId } = render(<Item data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("li")
  })
  test("Should be able to customize inner link element", () => {
    const { container } = render(<Item linkAs={Button} />)
    container.querySelectorAll("a").length.should.equal(0)
    container.querySelectorAll("button").length.should.equal(1)
  })
  test("Should be able to pass props to the customized inner link element", () => {
    const { getByRole } = render(
      <Item linkAs={Button} linkProps={{ type: "submit" }} />
    )
    expect(getByRole("button").getAttribute("type")).to.be.equal("submit")
  })
  test("Should be able to pass attributes to the link element", () => {
    const { getByRole } = render(<Item linkProps={{ foo: "bar" }}>Crumb</Item>)
    expect(getByRole("button").getAttribute("foo")).to.be.equal("bar")
  })
  test("Should be able to pass attributes to the li element", () => {
    const { getByRole } = render(<Item data-foo="bar">Crumb</Item>)
    expect(getByRole("listitem").getAttribute("data-foo")).to.be.equal("bar")
  })
})
