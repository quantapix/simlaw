import { Card, Img } from "../src/Card.jsx"
import { render } from "@testing-library/react"

describe("<Card>", () => {
  it("Should output a div", () => {
    const { getByText } = render(<Card>Card</Card>)
    expect(getByText("Card").tagName.toLowerCase()).toEqual("div")
    expect(getByText("Card").classList.contains("card")).toBe(true)
  })
  it("Should have additional classes", () => {
    const { getByText } = render(<Card className="custom-class">Card</Card>)
    expect(getByText("Card").classList.contains("custom-class")).toBe(true)
  })
  it("accepts a bg prop", () => {
    const { getByText } = render(<Card bg="primary">Card</Card>)
    expect(getByText("Card").classList.contains("bg-primary")).toBe(true)
  })
  it("accepts a text prop", () => {
    const { getByText } = render(<Card text="success">Card</Card>)
    expect(getByText("Card").classList.contains("text-success")).toBe(true)
  })
  it("accepts a border prop", () => {
    const { getByText } = render(<Card border="danger">Card</Card>)
    expect(getByText("Card").classList.contains("border-danger")).toBe(true)
  })
  it("Should render children", () => {
    const { getByTestId } = render(
      <Card data-testid="test">
        <p>hello</p>
      </Card>
    )
    const y = getByTestId("test")
    expect(y.children.length).toEqual(1)
    expect(y.children[0]!.tagName.toLowerCase()).toEqual("p")
  })
  it("accepts as prop", () => {
    const { getByText } = render(<Card as="section">body</Card>)
    expect(getByText("body").tagName.toLowerCase()).toEqual("section")
  })
  it("allows for the body shorthand", () => {
    const { getByText } = render(<Card body>test</Card>)
    expect(getByText("test").classList.contains("card-body")).toBe(true)
  })
  it("Should have div as default component", () => {
    const { getByTestId } = render(<Card data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
})
describe("<Img>", () => {
  it("Should output an img", () => {
    const { getByRole } = render(<Img src="#" />)
    expect(getByRole("img")).toBeTruthy()
  })
  it("Should pass down src to img", () => {
    const url = "http://fakeurl.com/pic.jpg"
    const { getByRole } = render(<Img src={url} />)
    expect(getByRole("img").getAttribute("src")).toEqual(url)
  })
  it("Should have img as default component", () => {
    const { getByRole } = render(<Img />)
    expect(getByRole("img")).toBeTruthy()
  })
  it("accepts as prop", () => {
    const { getByRole } = render(<Img as="figure">img</Img>)
    const y = getByRole("figure")
    expect(y.tagName.toLowerCase()).toEqual("figure")
    expect(y.classList.contains("card-img")).toEqual(true)
  })
  describe("variants", () => {
    it("null", () => {
      const { getByRole } = render(<Img />)
      expect(getByRole("img").classList.contains("card-img")).toBe(true)
    })
    it("top", () => {
      const { getByRole } = render(<Img variant="top" />)
      expect(getByRole("img").classList.contains("card-img-top")).toBe(true)
    })
    it("bottom", () => {
      const { getByRole } = render(<Img variant="bottom" />)
      expect(getByRole("img").classList.contains("card-img-bottom")).toBe(true)
    })
  })
})
