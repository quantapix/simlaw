import { Image } from "../src/Image.jsx"
import { render } from "@testing-library/react"

describe("Image", () => {
  it("Should be an image", () => {
    const { getByTestId } = render(<Image data-testid="test-image" />)
    expect(getByTestId("test-image").tagName.toLowerCase()).toEqual("img")
  })
  it("Should provide src and alt prop", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" src="image.jpg" alt="this is alt" />
    )
    expect(getByTestId("test-image").getAttribute("src")!).toEqual("image.jpg")
    expect(getByTestId("test-image").getAttribute("alt")!).toEqual(
      "this is alt"
    )
  })
  it("Should have correct class when fluid prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" fluid />)
    expect(getByTestId("test-image").classList.contains("img-fluid")).toBe(true)
  })
  it("Should not override class when rounded prop is set", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" fluid rounded />
    )
    expect(getByTestId("test-image").classList.contains("img-fluid")).toBe(true)
    expect(getByTestId("test-image").classList.contains("rounded")).toBe(true)
  })
  it("Should have correct class when rounded prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" rounded />)
    expect(getByTestId("test-image").classList.contains("rounded")).toBe(true)
  })
  it("Should have correct class when roundedCircle prop is set", () => {
    const { getByTestId } = render(
      <Image data-testid="test-image" roundedCircle />
    )
    expect(getByTestId("test-image").classList.contains("rounded-circle")).toBe(
      true
    )
  })
  it("Should have correct class when thumbnail prop is set", () => {
    const { getByTestId } = render(<Image data-testid="test-image" thumbnail />)
    expect(getByTestId("test-image").classList.contains("img-thumbnail")).toBe(
      true
    )
  })
})
