import { fireEvent, render } from "@testing-library/react"
import { Navbar, Offcanvas, Toggle } from "../src/Navbar.jsx"
import { Header } from "../src/Offcanvas.jsx"

describe("<NavbarOffcanvas>", () => {
  it("should should open the offcanvas", () => {
    const { getByTestId } = render(
      <Navbar>
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">hello</Offcanvas>
      </Navbar>
    )
    fireEvent.click(getByTestId("toggle"))
    expect(getByTestId("offcanvas").classList.contains("show")).toBe(true)
  })
  it("should close the offcanvas on header close button click", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Navbar onToggle={mock} expanded>
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">
          <Header closeButton>header</Header>
        </Offcanvas>
      </Navbar>
    )
    fireEvent.click(getByLabelText("Close"))
    expect(mock).toHaveBeenCalledWith(false)
  })
  it("should render nav items with expand prop", () => {
    const { getByText } = render(
      <Navbar expand="sm">
        <Toggle data-testid="toggle" />
        <Offcanvas data-testid="offcanvas">hello</Offcanvas>
      </Navbar>
    )
    expect(getByText("hello")).toBeTruthy()
  })
})
