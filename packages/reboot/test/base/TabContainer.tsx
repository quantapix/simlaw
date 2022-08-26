import { render, fireEvent } from "@testing-library/react"
import Nav from "../../src/base/Nav.jsx"
import NavItem from "../../src/base/NavItem.jsx"
import TabPanel from "../../src/base/Tab.jsx"
import Tabs from "../../src/base/Tabs,jsx"
describe("<Tabs>", () => {
  it("should not propagate context past TabPanels", () => {
    const onSelect = sinon.spy()
    const { getByText } = render(
      <Tabs id="custom-id" onSelect={onSelect}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">
            <Nav>
              <NavItem eventKey="2">Two</NavItem>
            </Nav>
          </TabPanel>
        </div>
      </Tabs>
    )
    const nestedNavItem = getByText("Two")
    fireEvent.click(nestedNavItem)
    expect(onSelect).not.toHaveBeenCalled()
    const topNavItem = getByText("One")
    fireEvent.click(topNavItem)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
  it("should let generateChildId function create id", () => {
    const generateChildIdSpy = sinon.spy(() => "test-id")
    const { getByRole } = render(
      <Tabs generateChildId={generateChildIdSpy}>
        <div>
          <Nav>
            <NavItem eventKey="1">One</NavItem>
          </Nav>
          <div>
            <TabPanel eventKey="1" />
          </div>
        </div>
      </Tabs>
    )
    const navItem = getByRole("tab")
    expect(navItem.getAttribute("id")).toEqual("test-id")
  })
  it("should match up ids", () => {
    const { getByTestId } = render(
      <Tabs>
        <div>
          <Nav>
            <NavItem eventKey="1" data-testid="nav-item">
              One
            </NavItem>
          </Nav>
          <div>
            <TabPanel eventKey="1" data-testid="tab-panel" />
          </div>
        </div>
      </Tabs>
    )
    const tabPanel = getByTestId("tab-panel")
    const tabPanelID = tabPanel.getAttribute("id")
    const navItem = getByTestId("nav-item")
    const navItemID = navItem.getAttribute("id")
    expect(navItemID).toBeTruthy()
    expect(tabPanelID).toBeTruthy()
    expect(tabPanel.getAttribute("aria-labelledby")).toEqual(navItemID)
    expect(navItem.getAttribute("aria-controls")).toEqual(tabPanelID)
  })
  it("should default Nav role to tablist", () => {
    const { getByRole, getByText } = render(
      <Tabs>
        <div>
          <Nav>
            <NavItem eventKey="1">One</NavItem>
          </Nav>
        </div>
      </Tabs>
    )
    expect(getByRole("tablist")).toBeTruthy()
    expect(getByText("One").getAttribute("role")).toEqual("tab")
  })
  it("should use explicit Nav role", () => {
    const { getByRole } = render(
      <Tabs>
        <div>
          <Nav role="navigation">
            <NavItem eventKey="1">One</NavItem>
          </Nav>
        </div>
      </Tabs>
    )
    expect(getByRole("navigation")).toBeTruthy()
    // make sure it's not passed to the NavItem
    expect(getByRole("button").getAttribute("role")).not.toBeTruthy()
  })
  it("Should show the correct tab when selected", () => {
    const { getByText } = render(
      <Tabs defaultActiveKey={1}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">Tab 1</TabPanel>
          <TabPanel eventKey="2">Tab 2</TabPanel>
        </div>
      </Tabs>
    )
    expect(getByText("Tab 1").getAttribute("aria-hidden")).toEqual("false")
    expect(getByText("Tab 2").getAttribute("aria-hidden")).toEqual("true")
    expect(getByText("One").getAttribute("aria-selected")).toEqual("true")
    expect(getByText("Two").getAttribute("aria-selected")).toEqual("false")
    fireEvent.click(getByText("Two"))
    expect(getByText("Tab 1").getAttribute("aria-hidden")).toEqual("true")
    expect(getByText("Tab 2").getAttribute("aria-hidden")).toEqual("false")
    expect(getByText("One").getAttribute("aria-selected")).toEqual("false")
    expect(getByText("Two").getAttribute("aria-selected")).toEqual("true")
  })
  it("Should mount and unmount tabs when set", () => {
    const { queryByText, getByText } = render(
      <Tabs mountOnEnter unmountOnExit defaultActiveKey={1}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">Tab 1</TabPanel>
          <TabPanel eventKey="2">Tab 2</TabPanel>
        </div>
      </Tabs>
    )
    expect(queryByText("Tab 1")).toBeTruthy()
    expect(queryByText("Tab 2")).not.toBeTruthy()
    fireEvent.click(getByText("Two"))
    expect(queryByText("Tab 1")).not.toBeTruthy()
    expect(queryByText("Tab 2")).toBeTruthy()
  })
  it('Should include "aria-controls" matching rendered TabPanel', () => {
    const { queryByText, getByText } = render(
      <Tabs defaultActiveKey={1}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">Tab 1</TabPanel>
          <TabPanel eventKey="2">Tab 2</TabPanel>
        </div>
      </Tabs>
    )
    expect(queryByText("Tab 1")).toBeTruthy()
    expect(queryByText("Tab 2")).toBeTruthy()
    expect(getByText("One").getAttribute("aria-controls")).toBeTruthy()
    expect(getByText("Two").getAttribute("aria-controls")).toBeTruthy()
  })
  it('Should include "aria-controls" only for rendered tabs when unmountOnExit is true', () => {
    const { queryByText, getByText } = render(
      <Tabs unmountOnExit defaultActiveKey={1}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">Tab 1</TabPanel>
          <TabPanel eventKey="2">Tab 2</TabPanel>
        </div>
      </Tabs>
    )
    expect(queryByText("Tab 1")).toBeTruthy()
    expect(queryByText("Tab 2")).not.toBeTruthy()
    expect(getByText("One").getAttribute("aria-controls")).toBeTruthy()
    expect(getByText("Two").getAttribute("aria-controls")).not.toBeTruthy()
    fireEvent.click(getByText("Two"))
    expect(queryByText("Tab 1")).not.toBeTruthy()
    expect(queryByText("Tab 2")).toBeTruthy()
    expect(getByText("One").getAttribute("aria-controls")).not.toBeTruthy()
    expect(getByText("Two").getAttribute("aria-controls")).toBeTruthy()
  })
  it('Should include "aria-controls" only for the active tab, when mountOnEnter is true', () => {
    const { queryByText, getByText } = render(
      <Tabs mountOnEnter defaultActiveKey={1}>
        <Nav>
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
        </Nav>
        <div>
          <TabPanel eventKey="1">Tab 1</TabPanel>
          <TabPanel eventKey="2">Tab 2</TabPanel>
        </div>
      </Tabs>
    )
    expect(queryByText("Tab 1")).toBeTruthy()
    expect(queryByText("Tab 2")).not.toBeTruthy()
    expect(getByText("One").getAttribute("aria-controls")).toBeTruthy()
    expect(getByText("Two").getAttribute("aria-controls")).not.toBeTruthy()
    fireEvent.click(getByText("Two"))
    expect(queryByText("Tab 1")).toBeTruthy()
    expect(queryByText("Tab 2")).toBeTruthy()
    expect(getByText("One").getAttribute("aria-controls")).not.toBeTruthy()
    expect(getByText("Two").getAttribute("aria-controls")).toBeTruthy()
  })
})
