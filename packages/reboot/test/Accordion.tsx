import { fireEvent, render, waitFor } from "@testing-library/react"
import {
  Accordion,
  Collapse,
  Item,
  Header,
  Body,
  Button,
} from "../src/Accordion.js"
import { Dropdown, Toggle, Menu, Item as Ditem } from "../src/Dropdown.js"
import { ListGroup, Item as Litem } from "../src/ListGroup.js"
import { Nav, Item as Nitem, Link } from "../src/Nav.js"

describe("<Accordion>", () => {
  it("should output a div", () => {
    const { getByTestId } = render(<Accordion data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("should render flush prop", () => {
    const { getByTestId } = render(<Accordion flush data-testid="test" />)
    const node = getByTestId("test")
    expect(node.classList.contains("accordion")).toBe(true)
    expect(node.classList.contains("accordion-flush")).toBe(true)
  })
  it("should output a h1", () => {
    const { getByTestId } = render(
      <Accordion>
        <Button>Hi</Button>
        <Collapse as="h1" eventKey="0" data-testid="test-collapse">
          <span>hidden Data</span>
        </Collapse>
      </Accordion>
    )
    expect(getByTestId("test-collapse").tagName.toLowerCase()).toEqual("h1")
  })
  it("should only have second item collapsed", () => {
    const { getByTestId } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header />
          <Body>body text</Body>
        </Item>
        <Item eventKey="1" data-testid="item-1">
          <Header />
          <Body>body text</Body>
        </Item>
      </Accordion>
    )
    expect(getByTestId("item-0").querySelector(".show")).toBeTruthy()
    expect(getByTestId("item-1").querySelector(".collapse")).toBeTruthy()
  })
  it("should expand next item and collapse current item on click", async () => {
    const onClickSpy = jest.fn()
    const { getByTestId, getByText } = render(
      <Accordion>
        <Item eventKey="0" data-testid="item-0">
          <Header onClick={onClickSpy} />
          <Body>body text</Body>
        </Item>
        <Item eventKey="1" data-testid="item-1">
          <Header onClick={onClickSpy} data-testid="item-1-button">
            Button item 1
          </Header>
          <Body>body text</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Button item 1"))
    expect(onClickSpy).to.be.calledOnce
    expect(getByTestId("item-0").querySelector(".collapse")).toBeTruthy()
    const item1 = getByTestId("item-1")
    expect(item1.querySelector(".collapsing")).toBeTruthy()
    await waitFor(() => expect(item1.querySelector(".show")).toBeTruthy(), {
      container: item1,
    })
  })
  it("should collapse current item on click", async () => {
    const onClickSpy = jest.fn()
    const { getByTestId, getByText } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header onClick={onClickSpy}>Button item 0</Header>
          <Body>body text</Body>
        </Item>
        <Item eventKey="1" data-testid="item-1">
          <Header onClick={onClickSpy} />
          <Body>body text</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Button item 0"))
    expect(onClickSpy).to.be.calledOnce
    expect(getByTestId("item-1").querySelector(".collapse")).toBeTruthy()
    const item0 = getByTestId("item-0")
    expect(item0.querySelector(".collapsing")).toBeTruthy()
    await waitFor(() => expect(item0.querySelector(".show")).not.toBeTruthy(), {
      container: item0,
    })
  })
  // https://github.com/react-bootstrap/react-bootstrap/issues/4176
  it("Should not close accordion when child dropdown clicked", () => {
    const { getByTestId, getByText } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header />
          <Body>
            <Dropdown show>
              <Toggle id="dropdown-test">Dropdown Toggle</Toggle>
              <Menu>
                <Ditem href="#">Dropdown Action</Ditem>
              </Menu>
            </Dropdown>
          </Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Dropdown Action"))
    expect(getByTestId("item-0").querySelector(".accordion-collapse.show")).to
      .exist
  })
  it("Should not close accordion when child ListGroup clicked", () => {
    const { getByTestId, getByText } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header />
          <Body>
            <ListGroup defaultActiveKey="#link1">
              <Litem action href="#link1">
                List Group Item 1
              </Litem>
            </ListGroup>
          </Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("List Group Item 1"))
    expect(getByTestId("item-0").querySelector(".accordion-collapse.show")).to
      .exist
  })
  it("Should not close accordion when child Nav clicked", () => {
    const { getByTestId, getByText } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header />
          <Body>
            <Nav activeKey="/home">
              <Nitem>
                <Link href="#">Nav Link Item 0</Link>
              </Nitem>
            </Nav>
          </Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Nav Link Item 0"))
    expect(getByTestId("item-0").querySelector(".accordion-collapse.show")).to
      .exist
  })
  it("should allow multiple items to stay open", () => {
    const onSelectSpy = jest.fn()
    const { getByText } = render(
      <Accordion onSelect={onSelectSpy} alwaysOpen>
        <Item eventKey="0">
          <Header>header0</Header>
          <Body>body</Body>
        </Item>
        <Item eventKey="1">
          <Header>header1</Header>
          <Body>body</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("header0"))
    fireEvent.click(getByText("header1"))
    expect(onSelectSpy).to.be.calledWith(["0", "1"])
  })
  it("should remove only one of the active indices", () => {
    const onSelectSpy = jest.fn()
    const { getByText } = render(
      <Accordion
        onSelect={onSelectSpy}
        defaultActiveKey={["0", "1"]}
        alwaysOpen
      >
        <Item eventKey="0">
          <Header>header0</Header>
          <Body>body</Body>
        </Item>
        <Item eventKey="1">
          <Header>header1</Header>
          <Body>body</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("header1"))
    expect(onSelectSpy).to.be.calledWith(["0"])
  })
})
describe("<AccordionButton>", () => {
  it("Should have button as default component", () => {
    const { getByTestId } = render(
      <Button data-testid="test-accordion-button" />
    )
    expect(getByTestId("test-accordion-button").tagName.toLowerCase()).toEqual(
      "button"
    )
    expect(getByTestId("test-accordion-button").getAttribute("type")!).toEqual(
      "button"
    )
  })
  it("Should allow rendering as different component", () => {
    const { getByTestId } = render(
      <Button data-testid="test-accordion-button" as="div" />
    )
    expect(getByTestId("test-accordion-button").tagName.toLowerCase()).toEqual(
      "div"
    )
  })
  it("Should call onClick", () => {
    const onClickSpy = jest.fn()
    const { getByTestId } = render(
      <Button data-testid="btn" onClick={onClickSpy} />
    )
    fireEvent.click(getByTestId("btn"))
    expect(onClickSpy).to.be.calledOnce
  })
})
