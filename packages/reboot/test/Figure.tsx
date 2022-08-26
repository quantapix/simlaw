import { Caption, Figure, Image } from "../src/Figure.jsx"
import { render } from "@testing-library/react"

describe("Figure", () => {
  describe("General", () => {
    it("should be a Figure", () => {
      const { getByTestId } = render(<Figure data-testid="test" />)
      expect(getByTestId("test").tagName.toLowerCase()).toEqual("figure")
    })
  })
  describe("Image", () => {
    it("should be an image", () => {
      const { getByTestId } = render(<Image data-testid="test" />)
      expect(getByTestId("test").tagName.toLowerCase()).toEqual("img")
    })
    it("should provide src and alt prop", () => {
      const { getByTestId } = render(
        <Image src="image.jpg" alt="this is alt" data-testid="test" />
      )
      const image = getByTestId("test")
      expect(image.getAttribute("src")).toEqual("image.jpg")
      expect(image.getAttribute("alt")).toEqual("this is alt")
    })
    it("should have correct class when fluid prop is set", () => {
      const { getByTestId } = render(<Image fluid data-testid="test" />)
      expect(getByTestId("test").classList.contains("img-fluid")).toBe(true)
    })
    it("should not override class when rounded prop is set", () => {
      const { getByTestId } = render(<Image rounded fluid data-testid="test" />)
      const image = getByTestId("test")
      expect(image.classList.contains("figure-img")).toBe(true)
      expect(image.classList.contains("img-fluid")).toBe(true)
      expect(image.classList.contains("rounded")).toBe(true)
    })
    it("should have correct class when rounded prop is set", () => {
      const { getByTestId } = render(<Image rounded data-testid="test" />)
      expect(getByTestId("test").classList.contains("rounded")).toBe(true)
    })
    it("should have correct class when roundedCircle prop is set", () => {
      const { getByTestId } = render(<Image roundedCircle data-testid="test" />)
      expect(getByTestId("test").classList.contains("rounded-circle")).toBe(
        true
      )
    })
    it("should have correct class when thumbnail prop is set", () => {
      const { getByTestId } = render(<Image thumbnail data-testid="test" />)
      expect(getByTestId("test").classList.contains("img-thumbnail")).toBe(true)
    })
  })
})
describe("<Caption>", () => {
  it('uses "figcaption" by default', () => {
    const { getByTestId } = render(
      <Figure>
        <Caption data-testid="test-figure">Caption</Caption>
      </Figure>
    )
    expect(getByTestId("test-figure").tagName.toLowerCase()).toEqual(
      "figcaption"
    )
  })
  it('has "figure-caption" class', () => {
    const { getByTestId } = render(
      <Caption data-testid="test-figure">Caption</Caption>
    )
    expect(
      getByTestId("test-figure").classList.contains("figure-caption")
    ).toBe(true)
  })
  it("Should merge additional classes passed in", () => {
    const { getByTestId } = render(
      <Caption className="bob" data-testid="test-figure">
        Caption
      </Caption>
    )
    expect(getByTestId("test-figure").classList.contains("bob")).toBe(true)
    expect(
      getByTestId("test-figure").classList.contains("figure-caption")
    ).toBe(true)
  })
  it('allows custom elements instead of "figcaption"', () => {
    const { getByTestId } = render(
      <Caption as="section" data-testid="test-figure">
        Caption
      </Caption>
    )
    expect(getByTestId("test-figure").tagName.toLowerCase()).toEqual("section")
  })
})
