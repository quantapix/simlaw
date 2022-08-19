import { fireEvent, render } from "@testing-library/react"
import { Navbar } from "../src/Navbar.jsx"
import { Offcanvas } from "../src/Offcanvas.jsx"

describe("<NavbarOffcanvas>", () => {
  test("should should open the offcanvas", () => {
    const { getByTestId } = render(
      <Navbar>
        <Navbar.Toggle data-testid="toggle" />
        <Navbar.Offcanvas data-testid="offcanvas">hello</Navbar.Offcanvas>
      </Navbar>
    )

    fireEvent.click(getByTestId("toggle"))
    getByTestId("offcanvas").classList.contains("show").should.be.true
  })

  test("should close the offcanvas on header close button click", () => {
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
    onToggleSpy.should.have.been.calledWith(false)
  })

  test("should render nav items with expand prop", () => {
    const { getByText } = render(
      <Navbar expand="sm">
        <Navbar.Toggle data-testid="toggle" />
        <Navbar.Offcanvas data-testid="offcanvas">hello</Navbar.Offcanvas>
      </Navbar>
    )

    getByText("hello").should.exist
  })
})
