import { fireEvent, render } from "@testing-library/react"
import { Navbar } from "../src/Navbar.jsx"
import { Offcanvas } from "../src/Offcanvas.jsx"

describe("<NavbarOffcanvas>", () => {
  it("should should open the offcanvas", () => {
    const { getByTestId } = render(
      <Navbar>
        <Navbar.Toggle data-testid="toggle" />
        <Navbar.Offcanvas data-testid="offcanvas">hello</Navbar.Offcanvas>
      </Navbar>
    )

    fireEvent.click(getByTestId("toggle"))
    expect(getByTestId("offcanvas").classList.contains("show")).toBe(true)
  })

  it("should close the offcanvas on header close button click", () => {
    const onToggleSpy = sinon.spy()
    const { getByLabelText } = render(
      <Navbar onToggle={onToggleSpy} expanded>
        <Navbar.Toggle data-testid="toggle" />
        <Navbar.Offcanvas data-testid="offcanvas">
          <Offcanvas.Header closeButton>header</Offcanvas.Header>
        </Navbar.Offcanvas>
      </Navbar>
    )

    fireEvent.click(getByLabelText("Close"))
    expect(onToggleSpy).toHaveBeenCalledWith(false)
  })

  it("should render nav items with expand prop", () => {
    const { getByText } = render(
      <Navbar expand="sm">
        <Navbar.Toggle data-testid="toggle" />
        <Navbar.Offcanvas data-testid="offcanvas">hello</Navbar.Offcanvas>
      </Navbar>
    )

    expect(getByText("hello")).toBeTruthy()
  })
})
