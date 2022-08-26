import { fireEvent, render } from "@testing-library/react"
import { Content, Tab } from "../src/Tab.jsx"
import { Tabs } from "../src/Tabs.jsx"
import { shouldWarn } from "./tools.js"

const checkEventKey = (elem: Element, eventKey: string | number) =>
  elem.getAttribute("data-rr-ui-event-key") === `${eventKey}` &&
  elem.getAttribute("id") === `test-tab-${eventKey}` &&
  elem.getAttribute("aria-controls") === `test-tabpane-${eventKey}`
describe("<Tabs>", () => {
  it("Should show the correct tab and assign correct eventKeys", () => {
    const { getByText } = render(
      <Tabs id="test" defaultActiveKey={1}>
        <Tab title="Tab 1 title" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2 title" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const firstTabButton = getByText("Tab 1 title")
    const firstTabContent = getByText("Tab 1 content")
    const secondTabButton = getByText("Tab 2 title")
    expect(firstTabButton.tagName.toLowerCase()).toEqual("button")
    expect(firstTabButton.classList.contains("active")).toBe(true)
    expect(firstTabContent.classList.contains("active")).toBe(true)
    expect(secondTabButton.classList.contains("active")).toBe(false)
    expect(secondTabButton.tagName.toLowerCase()).toEqual("button")
    expect(checkEventKey(firstTabButton, 1)).toBe(true)
    expect(checkEventKey(secondTabButton, 2)).toBe(true)
  })
  it("should get defaultActiveKey (if null) from first child tab with eventKey", () => {
    const { getByText } = render(
      <Tabs id="test" data-testid="test-id">
        <Tab title="Tab 1 title" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2 title" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const firstTabButton = getByText("Tab 1 title")
    const firstTabContent = getByText("Tab 1 content")
    const secondTabButton = getByText("Tab 2 title")
    expect(firstTabButton.tagName.toLowerCase()).toEqual("button")
    expect(firstTabButton.classList.contains("active")).toBe(true)
    expect(firstTabContent.classList.contains("active")).toBe(true)
    expect(secondTabButton.classList.contains("active")).toBe(false)
    expect(secondTabButton.tagName.toLowerCase()).toEqual("button")
  })
  it("Should allow tab title to have React components", () => {
    const tabTitle = <strong className="special-tab">React Tab 2</strong>
    const { getByText } = render(
      <Tabs id="test" defaultActiveKey={2}>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title={tabTitle} eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    expect(getByText("React Tab 2").classList.contains("special-tab")).to.be
      .true
  })
  it("Should call onSelect when tab is selected", () => {
    const onSelect = key => {
      expect(key).toEqual("2")
    }
    const mock = jest.fn(onSelect)
    const { getByText } = render(
      <Tabs id="test" onSelect={mock} activeKey={1}>
        <Tab title="Tab 1" eventKey="1">
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" eventKey="2">
          Tab 2 content
        </Tab>
      </Tabs>
    )
    fireEvent.click(getByText("Tab 2"))
    expect(mock).toHaveBeenCalled()
  })
  it("Should have children with the correct DOM properties", () => {
    const { getByText } = render(
      <Tabs id="test" defaultActiveKey={1}>
        <Tab title="Tab 1" className="custom" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" tabClassName="tcustom" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const firstTabContent = getByText("Tab 1 content")
    const secondTabContent = getByText("Tab 2 content")
    const firstTabTitle = getByText("Tab 1")
    const secondTabTitle = getByText("Tab 2")
    expect(firstTabContent.classList.contains("custom")).toBe(true)
    expect(secondTabContent.classList.contains("tcustom")).toBe(false)
    expect(firstTabTitle.classList.contains("custom")).toBe(false)
    expect(secondTabTitle.classList.contains("tcustom")).toBe(true)
  })
  it("Should pass variant to Nav", () => {
    const { getByTestId } = render(
      <Tabs
        data-testid="test"
        variant="pills"
        defaultActiveKey={1}
        transition={false}
      >
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    expect(getByTestId("test").classList.contains("nav-pills")).toBe(true)
  })
  it("Should pass disabled to Nav", () => {
    const onSelect = e => e
    const mock = jest.fn(onSelect)
    const { getByText } = render(
      <Tabs id="test" defaultActiveKey={1} onSelect={mock}>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" eventKey={2} disabled>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const secondTabTitle = getByText("Tab 2")
    expect(secondTabTitle.classList.contains("disabled")).toBe(true)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should not render a Tab without a title", () => {
    shouldWarn("Failed prop")
    const { getByTestId } = render(
      <Tabs data-testid="testid" id="test" defaultActiveKey={1}>
        {/* */}
        <Tab eventKey={1}>Tab 1 content</Tab>
        <Tab title="Tab 2" eventKey={2} disabled>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const tabs = getByTestId("testid")
    expect(tabs.children).toHaveLength(1)
  })
  it('Should render TabPane with role="tabpanel"', () => {
    const { getAllByRole } = render(
      <Tabs data-testid="testid" id="test" defaultActiveKey={1}>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
      </Tabs>
    )
    expect(getAllByRole("tabpanel")).toHaveLength(1)
  })
  it("should have fade animation by default", () => {
    const { getByRole } = render(
      <Tabs id="test" defaultActiveKey={1}>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
      </Tabs>
    )
    expect(getByRole("tabpanel").classList.contains("fade")).toBe(true)
  })
  it("Should omit Transition in TabPane if prop is false ", () => {
    const { getByText } = render(
      <Tabs id="test" defaultActiveKey={1}>
        <Tab title="Tab 1" className="custom" eventKey={1} transition={false}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" tabClassName="tcustom" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    const firstTabContent = getByText("Tab 1 content")
    const secondTabContent = getByText("Tab 2 content")
    expect(firstTabContent.classList.contains("fade")).toBe(false)
    expect(secondTabContent.classList.contains("fade")).toBe(true)
  })
  it("Should pass fill to Nav", () => {
    const { getByTestId } = render(
      <Tabs data-testid="test" defaultActiveKey={1} transition={false} fill>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    expect(getByTestId("test").classList.contains("nav-fill")).toBe(true)
  })
  it("Should pass justified to Nav", () => {
    const { getByTestId } = render(
      <Tabs data-testid="test" defaultActiveKey={1} transition={false} justify>
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
        <Tab title="Tab 2" eventKey={2}>
          Tab 2 content
        </Tab>
      </Tabs>
    )
    expect(getByTestId("test").classList.contains("nav-justified")).toBe(true)
  })
})

describe("<Content>", () => {
  it("Should have div as default component", () => {
    const { container } = render(<Content />)

    expect(container.tagName.toLowerCase()).toEqual("div")
  })
})
