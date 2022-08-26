import { render } from "@testing-library/react"
import { Image } from "../src/Image.jsx"

describe("Image", () => {
  it("should be an image", () => {
    const { getByTestId } = render(<Image data-testid="test-image" />)
    expect(getByTestId("test-image").tagName.toLowerCase()).toEqual("img")
  })
  it("should provide src and alt prop", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" src="image.jpg" alt="this is alt" />
    )
    expect(getByTestId("test-image").getAttribute("src")!).toEqual("image.jpg")
    expect(getByTestId("test-image").getAttribute("alt")!).toEqual(
      "this is alt"
    )
  })
  it("should have correct class when fluid prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" fluid />)
    expect(getByTestId("test-image").classList.contains("img-fluid")).toBe(true)
  })
  it("should not override class when rounded prop is set", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" fluid rounded />
    )
    expect(getByTestId("test-image").classList.contains("img-fluid")).toBe(true)
    expect(getByTestId("test-image").classList.contains("rounded")).toBe(true)
  })
  it("should have correct class when rounded prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" rounded />)
    expect(getByTestId("test-image").classList.contains("rounded")).toBe(true)
  })
  it("should have correct class when roundedCircle prop is set", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" roundedCircle />
    )
    expect(getByTestId("test-image").classList.contains("rounded-circle")).to.be
      .true
  })
  it("should have correct class when thumbnail prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" thumbnail />)
    expect(getByTestId("test-image").classList.contains("img-thumbnail")).to.be
      .true
  })
})
