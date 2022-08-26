import { Button } from "../../src/base/Button.jsx"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { Context, Panel, useTabPanel } from "../../src/base/Tab.jsx"
import { Nav, Item, useNavItem } from "../../src/base/Nav.jsx"
import { Tabs } from "../../src/base/Tabs.jsx"
import { Transition } from "react-transition-group"
import React from "react"

describe("<Tabs>", () => {
  it("should not propagate context past TabPanels", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Tabs id="custom-id" onSelect={mock}>
        <Nav>
          <Item eventKey="1">One</Item>
        </Nav>
        <div>
          <Panel eventKey="1">
            <Nav>
              <Item eventKey="2">Two</Item>
            </Nav>
          </Panel>
        </div>
      </Tabs>
    )
    const nestedNavItem = getByText("Two")
    fireEvent.click(nestedNavItem)
    expect(mock).not.toHaveBeenCalled()
    const topNavItem = getByText("One")
    fireEvent.click(topNavItem)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should let generateChildId function create id", () => {
    const mock = jest.fn(() => "test-id")
    const { getByRole } = render(
      <Tabs generateChildId={mock}>
        <div>
          <Nav>
            <Item eventKey="1">One</Item>
          </Nav>
          <div>
            <Panel eventKey="1" />
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
            <Item eventKey="1" data-testid="nav-item">
              One
            </Item>
          </Nav>
          <div>
            <Panel eventKey="1" data-testid="tab-panel" />
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
            <Item eventKey="1">One</Item>
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
            <Item eventKey="1">One</Item>
          </Nav>
        </div>
      </Tabs>
    )
    expect(getByRole("navigation")).toBeTruthy()
    expect(getByRole("button").getAttribute("role")).not.toBeTruthy()
  })
  it("Should show the correct tab when selected", () => {
    const { getByText } = render(
      <Tabs defaultActiveKey={1}>
        <Nav>
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
        </Nav>
        <div>
          <Panel eventKey="1">Tab 1</Panel>
          <Panel eventKey="2">Tab 2</Panel>
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
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
        </Nav>
        <div>
          <Panel eventKey="1">Tab 1</Panel>
          <Panel eventKey="2">Tab 2</Panel>
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
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
        </Nav>
        <div>
          <Panel eventKey="1">Tab 1</Panel>
          <Panel eventKey="2">Tab 2</Panel>
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
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
        </Nav>
        <div>
          <Panel eventKey="1">Tab 1</Panel>
          <Panel eventKey="2">Tab 2</Panel>
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
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
        </Nav>
        <div>
          <Panel eventKey="1">Tab 1</Panel>
          <Panel eventKey="2">Tab 2</Panel>
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
describe("<TabPanel>", () => {
  it("should render a TabPanel", () => {
    const { getByText } = render(<Panel active>test</Panel>)
    expect(getByText("test")).toBeTruthy()
  })
  it("should render a TabPanel with role tabpanel", () => {
    const { getByRole } = render(<Panel active>test</Panel>)
    expect(getByRole("tabpanel")).toBeTruthy()
  })
  it("should not render if not active and mountOnEnter=true", () => {
    const { queryByText } = render(<Panel mountOnEnter>test</Panel>)
    expect(queryByText("test")).not.toBeTruthy()
  })
  it("should not unmount if rendered already", () => {
    const { getByText, rerender } = render(<Panel active>test</Panel>)
    expect(getByText("test")).toBeTruthy()
    rerender(<Panel>test</Panel>)
    expect(getByText("test")).toBeTruthy()
  })
  it("should unmount", () => {
    const { getByText, queryByText, rerender } = render(
      <Panel active unmountOnExit>
        test
      </Panel>
    )
    expect(getByText("test")).toBeTruthy()
    rerender(<Panel unmountOnExit>test</Panel>)
    expect(queryByText("test")).not.toBeTruthy()
  })
  it("should call getControlledId for id", () => {
    const mock = jest.fn()
    render(
      <Context.Provider
        value={{
          onSelect: jest.fn(),
          mountOnEnter: false,
          unmountOnExit: false,
          getControlledId: mock,
          getControllerId: jest.fn(),
        }}
      >
        <Panel active eventKey="mykey">
          test
        </Panel>
      </Context.Provider>
    )
    expect(mock).toHaveBeenCalledWith("mykey")
  })
  it("should fire transition events", async () => {
    const mock = jest.fn()
    const FADE_DURATION = 200
    const fadeStyles = {
      entering: "show",
      entered: "show",
    }
    const Fade = ({ children, ...props }: any) => (
      <Transition {...props} timeout={FADE_DURATION}>
        {(status: keyof typeof fadeStyles, innerProps: any) =>
          React.cloneElement(children, {
            ...innerProps,
            className: `fade ${fadeStyles[status]} ${children.props.className}`,
          })
        }
      </Transition>
    )
    function Tab({ eventKey, ...props }: any) {
      const [navItemProps, _] = useNavItem({
        key: eventKey,
      })
      return <Button {...props} {...navItemProps} />
    }
    const { getByText } = render(
      <Tabs defaultActiveKey="2">
        <Nav className="flex border-b">
          <Tab eventKey="1">Tab 1</Tab>
          <Tab eventKey="2">Tab 2</Tab>
        </Nav>
        <Panel
          transition={Fade}
          eventKey="1"
          onEnter={mock}
          onEntering={mock}
          onEntered={mock}
          onExit={mock}
          onExiting={mock}
          onExited={mock}
        >
          Tab 1 content
        </Panel>
        <Panel title="Tab 2" eventKey="2">
          Tab 2 content
        </Panel>
      </Tabs>
    )
    fireEvent.click(getByText("Tab 1"))
    expect(await waitFor(() => mock)).toHaveBeenCalledTimes(3)
    fireEvent.click(getByText("Tab 2"))
    expect(await waitFor(() => mock.callCount)).toEqual(6)
  })
  it("should derive active state from context", () => {
    const { getByText } = render(
      <Context.Provider
        value={{
          activeKey: "mykey",
          onSelect: jest.fn(),
          mountOnEnter: false,
          unmountOnExit: false,
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <Panel eventKey="mykey">test</Panel>
      </Context.Provider>
    )
    const node = getByText("test")
    expect(node).toBeTruthy()
    expect(node.getAttribute("aria-hidden")).toEqual("false")
  })
  describe("useTabPanel", () => {
    it("should have role set to tabpanel", () => {
      let props: any
      function Wrapper(wrapperProps: any) {
        const [_props] = useTabPanel(wrapperProps)
        props = _props
        return null
      }
      render(<Wrapper />)
      expect(props.role).toEqual("tabpanel")
    })
    it("should have role tabpanel also within a context", () => {
      let props: any
      function Wrapper(wrapperProps: any) {
        const [_props] = useTabPanel(wrapperProps)
        props = _props
        return null
      }
      render(
        <Context.Provider
          value={{
            onSelect: jest.fn(),
            mountOnEnter: true,
            unmountOnExit: false,
            getControlledId: jest.fn(),
            getControllerId: jest.fn(),
          }}
        >
          <Wrapper />
        </Context.Provider>
      )
      expect(props.role).toEqual("tabpanel")
    })
    it("should use mountOnEnter from props if provided", () => {
      let meta: any
      function Wrapper(wrapperProps: any) {
        const [_, m] = useTabPanel(wrapperProps)
        meta = m
        return null
      }
      render(
        <Context.Provider
          value={{
            onSelect: jest.fn(),
            mountOnEnter: true,
            unmountOnExit: false,
            getControlledId: jest.fn(),
            getControllerId: jest.fn(),
          }}
        >
          <Wrapper mountOnEnter={false} />
        </Context.Provider>
      )
      expect(meta.mountOnEnter).toEqual(false)
    })
    it("should use unmountOnExit from props if provided", () => {
      let meta: any
      function Wrapper(wrapperProps: any) {
        const [_, m] = useTabPanel(wrapperProps)
        meta = m
        return null
      }
      render(
        <Context.Provider
          value={{
            onSelect: jest.fn(),
            mountOnEnter: false,
            unmountOnExit: true,
            getControlledId: jest.fn(),
            getControllerId: jest.fn(),
          }}
        >
          <Wrapper unmountOnExit={false} />
        </Context.Provider>
      )
      expect(meta.unmountOnExit).toEqual(false)
    })
  })
})
