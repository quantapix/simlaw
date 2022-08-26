import { Dropdown, Toggle, Menu, Item as Ditem } from "../src/Dropdown.js"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { ListGroup, Item as Litem } from "../src/ListGroup.js"
import { Nav, Item as Nitem, Link } from "../src/Nav.js"
import {
  Accordion,
  Collapse,
  Item,
  Header,
  Body,
  Button,
} from "../src/Accordion.js"

describe("<Accordion>", () => {
  it("Should output a div", () => {
    const { getByTestId } = render(<Accordion data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("Should render flush prop", () => {
    const { getByTestId } = render(<Accordion flush data-testid="test" />)
    const y = getByTestId("test")
    expect(y.classList.contains("accordion")).toBe(true)
    expect(y.classList.contains("accordion-flush")).toBe(true)
  })
  it("Should output a h1", () => {
    const { getByTestId } = render(
      <Accordion>
        <Button>Hi</Button>
        <Collapse as="h1" eventKey="0" data-testid="test">
          <span>hidden Data</span>
        </Collapse>
      </Accordion>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("h1")
  })
  it("Should only have second item collapsed", () => {
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
  it("Should expand next item and collapse current item on click", async () => {
    const mock = jest.fn()
    const { getByTestId, getByText } = render(
      <Accordion>
        <Item eventKey="0" data-testid="item-0">
          <Header onClick={mock} />
          <Body>body text</Body>
        </Item>
        <Item eventKey="1" data-testid="item-1">
          <Header onClick={mock} data-testid="item-1-button">
            Button item 1
          </Header>
          <Body>body text</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Button item 1"))
    expect(mock).toHaveReturnedTimes(1)
    expect(getByTestId("item-0").querySelector(".collapse")).toBeTruthy()
    const item1 = getByTestId("item-1")
    expect(item1.querySelector(".collapsing")).toBeTruthy()
    await waitFor(() => expect(item1.querySelector(".show")).toBeTruthy(), {
      container: item1,
    })
  })
  it("Should collapse current item on click", async () => {
    const mock = jest.fn()
    const { getByTestId, getByText } = render(
      <Accordion defaultActiveKey="0">
        <Item eventKey="0" data-testid="item-0">
          <Header onClick={mock}>Button item 0</Header>
          <Body>body text</Body>
        </Item>
        <Item eventKey="1" data-testid="item-1">
          <Header onClick={mock} />
          <Body>body text</Body>
        </Item>
      </Accordion>
    )
    fireEvent.click(getByText("Button item 0"))
    expect(mock).toHaveReturnedTimes(1)
    expect(getByTestId("item-1").querySelector(".collapse")).toBeTruthy()
    const item0 = getByTestId("item-0")
    expect(item0.querySelector(".collapsing")).toBeTruthy()
    await waitFor(() => expect(item0.querySelector(".show")).not.toBeTruthy(), {
      container: item0,
    })
  })
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
    const y = getByTestId("item-0")
    expect(y.querySelector(".accordion-collapse.show")).not.toBeNull()
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
    const y = getByTestId("item-0")
    expect(y.querySelector(".accordion-collapse.show")).not.toBeNull()
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
    const y = getByTestId("item-0")
    expect(y.querySelector(".accordion-collapse.show")).not.toBeNull()
  })
  it("Should allow multiple items to stay open", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Accordion onSelect={mock} alwaysOpen>
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
    expect(mock).toHaveBeenCalledWith(["0", "1"])
  })
  it("Should remove only one of the active indices", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Accordion onSelect={mock} defaultActiveKey={["0", "1"]} alwaysOpen>
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
    expect(mock).toHaveBeenCalledWith(["0"])
  })
})
describe("<AccordionButton>", () => {
  it("Should have button as default component", () => {
    const { getByTestId } = render(<Button data-testid="test" />)
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("button")
    expect(y.getAttribute("type")!).toEqual("button")
  })
  it("Should allow rendering as different component", () => {
    const { getByTestId } = render(<Button data-testid="test" as="div" />)
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("div")
  })
  it("Should call onClick", () => {
    const mock = jest.fn()
    const { getByTestId } = render(<Button data-testid="btn" onClick={mock} />)
    fireEvent.click(getByTestId("btn"))
    expect(mock).toHaveReturnedTimes(1)
  })
})
