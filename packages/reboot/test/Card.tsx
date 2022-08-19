import { render } from "@testing-library/react"
import { Card, Img } from "../src/Card.jsx"

describe("<Card>", () => {
  test("should output a div", () => {
    const { getByText } = render(<Card>Card</Card>)
    getByText("Card").tagName.toLowerCase().should.equal("div")
    getByText("Card").classList.contains("card").should.be.true
  })
  test("should have additional classes", () => {
    const { getByText } = render(<Card className="custom-class">Card</Card>)
    getByText("Card").classList.contains("custom-class").should.be.true
  })
  test("accepts a bg prop", () => {
    const { getByText } = render(<Card bg="primary">Card</Card>)
    getByText("Card").classList.contains("bg-primary").should.be.true
  })
  test("accepts a text prop", () => {
    const { getByText } = render(<Card text="success">Card</Card>)
    getByText("Card").classList.contains("text-success").should.be.true
  })
  test("accepts a border prop", () => {
    const { getByText } = render(<Card border="danger">Card</Card>)
    getByText("Card").classList.contains("border-danger").should.be.true
  })
  test("should render children", () => {
    const { getByTestId } = render(
      <Card data-testid="test-card">
        <p>hello</p>
      </Card>
    )
    getByTestId("test-card").children.length.should.equal(1)
    getByTestId("test-card").children[0].tagName.toLowerCase().should.equal("p")
  })
  test("accepts as prop", () => {
    const { getByText } = render(<Card as="section">body</Card>)
    getByText("body").tagName.toLowerCase().should.equal("section")
  })
  test("allows for the body shorthand", () => {
    const { getByText } = render(<Card body>test</Card>)
    getByText("test").classList.contains("card-body").should.be.true
  })
  test("Should have div as default component", () => {
    const { getByTestId } = render(<Card data-testid="default-test" />)
    getByTestId("default-test").tagName.toLowerCase().should.equal("div")
  })
})
describe("<Img>", () => {
  test("should output an img", () => {
    const { getByRole } = render(<Img src="#" />)
    getByRole("img").should.exist
  })
  test("should pass down src to img", () => {
    const url = "http://fakeurl.com/pic.jpg"
    const { getByRole } = render(<Img src={url} />)
    expect(getByRole("img").getAttribute("src")).to.be.equal(url)
  })
  test("Should have img as default component", () => {
    const { getByRole } = render(<Img />)
    getByRole("img").should.exist
  })
  test("accepts as prop", () => {
    const { getByRole } = render(<Img as="figure">img</Img>)
    const card = getByRole("figure")
    card.tagName.toLowerCase().should.equal("figure")
    card.classList.contains("card-img").should.equal(true)
  })
  describe("variants", () => {
    test("null", () => {
      const { getByRole } = render(<Img />)
      getByRole("img").classList.contains("card-img").should.be.true
    })
    test("top", () => {
      const { getByRole } = render(<Img variant="top" />)
      getByRole("img").classList.contains("card-img-top").should.be.true
    })
    test("bottom", () => {
      const { getByRole } = render(<Img variant="bottom" />)
      getByRole("img").classList.contains("card-img-bottom").should.be.true
    })
  })
})
