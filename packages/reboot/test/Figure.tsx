import { render } from "@testing-library/react"
import { Caption, Figure, Image } from "../src/Figure.jsx"

describe("Figure", () => {
  describe("General", () => {
    test("should be a Figure", () => {
      const { getByTestId } = render(<Figure data-testid="test" />)
      getByTestId("test").tagName.toLowerCase().should.equal("figure")
    })
  })
  describe("Image", () => {
    test("should be an image", () => {
      const { getByTestId } = render(<Image data-testid="test" />)
      getByTestId("test").tagName.toLowerCase().should.equal("img")
    })
    test("should provide src and alt prop", () => {
      const { getByTestId } = render(
        <Image src="image.jpg" alt="this is alt" data-testid="test" />
      )
      const image = getByTestId("test")
      expect(image.getAttribute("src")).to.be.equal("image.jpg")
      expect(image.getAttribute("alt")).to.be.equal("this is alt")
    })
    test("should have correct class when fluid prop is set", () => {
      const { getByTestId } = render(<Image fluid data-testid="test" />)
      getByTestId("test").classList.contains("img-fluid").should.be.true
    })
    test("should not override class when rounded prop is set", () => {
      const { getByTestId } = render(<Image rounded fluid data-testid="test" />)
      const image = getByTestId("test")
      image.classList.contains("figure-img").should.be.true
      image.classList.contains("img-fluid").should.be.true
      image.classList.contains("rounded").should.be.true
    })
    test("should have correct class when rounded prop is set", () => {
      const { getByTestId } = render(<Image rounded data-testid="test" />)
      getByTestId("test").classList.contains("rounded").should.be.true
    })
    test("should have correct class when roundedCircle prop is set", () => {
      const { getByTestId } = render(<Image roundedCircle data-testid="test" />)
      getByTestId("test").classList.contains("rounded-circle").should.be.true
    })
    test("should have correct class when thumbnail prop is set", () => {
      const { getByTestId } = render(<Image thumbnail data-testid="test" />)
      getByTestId("test").classList.contains("img-thumbnail").should.be.true
    })
  })
})

describe("<Caption>", () => {
  test('uses "figcaption" by default', () => {
    const { getByTestId } = render(
      <Figure>
        <Caption data-testid="test-figure">Caption</Caption>
      </Figure>
    )
    getByTestId("test-figure").tagName.toLowerCase().should.equal("figcaption")
  })
  test('has "figure-caption" class', () => {
    const { getByTestId } = render(
      <Caption data-testid="test-figure">Caption</Caption>
    )
    getByTestId("test-figure").classList.contains("figure-caption").should.be
      .true
  })
  test("Should merge additional classes passed in", () => {
    const { getByTestId } = render(
      <Caption className="bob" data-testid="test-figure">
        Caption
      </Caption>
    )
    getByTestId("test-figure").classList.contains("bob").should.be.true
    getByTestId("test-figure").classList.contains("figure-caption").should.be
      .true
  })
  test('allows custom elements instead of "figcaption"', () => {
    const { getByTestId } = render(
      <Caption as="section" data-testid="test-figure">
        Caption
      </Caption>
    )
    getByTestId("test-figure").tagName.toLowerCase().should.equal("section")
  })
})
