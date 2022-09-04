import { Content, Tab } from "../src/Tab.jsx"
import { fireEvent, render } from "@testing-library/react"
import { shouldWarn } from "./tools.js"
import { Tabs } from "../src/Tabs.jsx"

const check = (x: Element, k: string | number) =>
  x.getAttribute("data-rr-ui-event-key") === `${k}` &&
  x.getAttribute("id") === `test-tab-${k}` &&
  x.getAttribute("aria-controls") === `test-tabpane-${k}`

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
    const b1 = getByText("Tab 1 title")
    const c1 = getByText("Tab 1 content")
    const b2 = getByText("Tab 2 title")
    expect(b1.tagName.toLowerCase()).toEqual("button")
    expect(b1.classList.contains("active")).toBe(true)
    expect(c1.classList.contains("active")).toBe(true)
    expect(b2.classList.contains("active")).toBe(false)
    expect(b2.tagName.toLowerCase()).toEqual("button")
    expect(check(b1, 1)).toBe(true)
    expect(check(b2, 2)).toBe(true)
  })
  it("Should get defaultActiveKey (if null) from first child tab with eventKey", () => {
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
    const b1 = getByText("Tab 1 title")
    const c1 = getByText("Tab 1 content")
    const b2 = getByText("Tab 2 title")
    expect(b1.tagName.toLowerCase()).toEqual("button")
    expect(b1.classList.contains("active")).toBe(true)
    expect(c1.classList.contains("active")).toBe(true)
    expect(b2.classList.contains("active")).toBe(false)
    expect(b2.tagName.toLowerCase()).toEqual("button")
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
    expect(getByText("React Tab 2").classList.contains("special-tab")).toBe(
      true
    )
  })
  it("Should call onSelect when tab is selected", () => {
    const onSelect = (k: any) => {
      expect(k).toEqual("2")
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
    const c1 = getByText("Tab 1 content")
    const c2 = getByText("Tab 2 content")
    const t1 = getByText("Tab 1")
    const t2 = getByText("Tab 2")
    expect(c1.classList.contains("custom")).toBe(true)
    expect(c2.classList.contains("tcustom")).toBe(false)
    expect(t1.classList.contains("custom")).toBe(false)
    expect(t2.classList.contains("tcustom")).toBe(true)
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
    const onSelect = (k: any) => k
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
    const t2 = getByText("Tab 2")
    expect(t2.classList.contains("disabled")).toBe(true)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should not render a Tab without a title", () => {
    shouldWarn("Failed prop")
    const { getByTestId } = render(
      <Tabs data-testid="testid" id="test" defaultActiveKey={1}>
        {/* */}
        <Tab title="Tab 1" eventKey={1}>
          Tab 1 content
        </Tab>
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
  it("Should have fade animation by default", () => {
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
    const c1 = getByText("Tab 1 content")
    const c2 = getByText("Tab 2 content")
    expect(c1.classList.contains("fade")).toBe(false)
    expect(c2.classList.contains("fade")).toBe(true)
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
