import * as React from "react"
import { fireEvent, render } from "@testing-library/react"
import { Body, Container, Header, Position, Toast } from "../src/Toast.jsx"

const getToast = ({
  delay = 500,
  onCloseSpy,
  autohide = true,
  show = true,
}) => (
  <Toast delay={delay} onClose={onCloseSpy} show={show} autohide={autohide}>
    <Header>header-content</Header>
    <Body>body-content</Body>
  </Toast>
)
describe("<Toast>", () => {
  let clock
  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })
  afterEach(() => {
    clock.restore()
  })
  it("should apply bg prop", () => {
    const { container } = render(<Toast bg="primary">Card</Toast>)
    expect(container.firstElementChild!.classList.contains("bg-primary")).toBe(
      true
    )
    expect(container.firstElementChild!.classList.contains("toast")).toBe(true)
  })
  it("should render an entire toast", () => {
    const { container } = render(
      <Toast>
        <Header />
        <Body />
      </Toast>
    )
    ;["fade", "toast", "show"].map(className =>
      expect(container.firstElementChild!.classList.contains(className)).toBe(
        true
      )
    )
    ;(
      [
        ["role", "alert"],
        ["aria-live", "assertive"],
        ["aria-atomic", true],
      ] as const
    ).map(([attrName, attrVal]) =>
      expect(
        container.firstElementChild!.attributes.getNamedItem(attrName)!
          .textContent === `${attrVal}`
      ).toBe(true)
    )
  })
  it("should render without transition if animation is false", () => {
    const { container } = render(
      <Toast animation={false}>
        <Header />
        <Body />
      </Toast>
    )
    ;["toast", "show"].map(className =>
      expect(container.firstElementChild!.classList.contains(className)).toBe(
        true
      )
    )
  })
  it("should trigger the onClose event after clicking on the close button", () => {
    const onCloseSpy = jest.fn()
    const { container } = render(
      <Toast onClose={onCloseSpy}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    fireEvent.click(
      container.firstElementChild!.getElementsByTagName("button")[0]
    )
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })
  it("should trigger the onClose event after the autohide delay", () => {
    const onCloseSpy = jest.fn()
    render(
      <Toast onClose={onCloseSpy} delay={500} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    clock.tick(1000)
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })
  it("should not trigger the onClose event if autohide is not set", () => {
    const onCloseSpy = jest.fn()
    render(
      <Toast onClose={onCloseSpy}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    clock.tick(3000)
    expect(onCloseSpy).not.toHaveBeenCalled()
  })
  it("should clearTimeout after unmount", () => {
    const onCloseSpy = jest.fn()
    const { unmount } = render(
      <Toast delay={500} onClose={onCloseSpy} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    unmount()
    clock.tick(1000)
    expect(onCloseSpy).not.toHaveBeenCalled()
  })
  it("should not reset autohide timer when element re-renders with same props", () => {
    const onCloseSpy = jest.fn()
    const toast = getToast({ onCloseSpy })
    const { rerender } = render(toast)
    clock.tick(250)
    rerender(toast)
    clock.tick(300)
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })
  it("should not reset autohide timer when delay is changed", () => {
    const onCloseSpy = jest.fn()
    const { rerender } = render(getToast({ delay: 500, onCloseSpy }))
    clock.tick(250)
    rerender(getToast({ delay: 10000, onCloseSpy }))
    clock.tick(300)
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })
  it("should not reset autohide timer when onClosed is changed", () => {
    const onCloseSpy = jest.fn()
    const onCloseSpy2 = jest.fn()
    const { rerender } = render(getToast({ onCloseSpy }))
    clock.tick(250)
    rerender(getToast({ onCloseSpy: onCloseSpy2 }))
    clock.tick(300)
    expect(onCloseSpy).not.toHaveBeenCalled()
    expect(onCloseSpy2).toHaveBeenCalledTimes(1)
  })
  it("should not call onClose if autohide is changed from true to false", () => {
    const onCloseSpy = jest.fn()
    const { rerender } = render(getToast({ onCloseSpy, autohide: true }))
    clock.tick(250)
    rerender(getToast({ onCloseSpy, autohide: false }))
    clock.tick(300)
    expect(onCloseSpy).not.toHaveBeenCalled()
  })
  it("should not call onClose if show is changed from true to false", () => {
    const onCloseSpy = jest.fn()
    const { rerender } = render(getToast({ show: true, onCloseSpy }))
    clock.tick(100)
    rerender(getToast({ show: false, onCloseSpy }))
    clock.tick(300)
    expect(onCloseSpy).not.toHaveBeenCalled()
  })
  it("should render with bsPrefix", () => {
    const { container } = render(
      <Toast bsPrefix="my-toast">
        <Header />
        <Body />
      </Toast>
    )
    expect(container.firstElementChild!.tagName.toLowerCase()).toEqual("div")
    container.firstElementChild!.classList.contains("my-toast")
  })
})

describe("Header", () => {
  it("will pass all props to the created div and renders its children", () => {
    const { container } = render(
      <Header>
        <strong>content</strong>
      </Header>
    )
    expect(container.firstElementChild!.tagName.toLowerCase()).toEqual("div")
    expect(
      container.firstElementChild!.firstElementChild!.tagName.toLowerCase()
    ).toEqual("strong")
    expect(
      container.firstElementChild!.classList.contains("toast-header")
    ).toBe(true)
  })
  it("should render close button variant", () => {
    const { container } = render(
      <Header closeButton closeVariant="white">
        <strong>content</strong>
      </Header>
    )
    expect(
      container
        .firstElementChild!.getElementsByTagName("button")[0]!
        .classList.contains("btn-close-white")
    ).toBe(true)
  })
})

describe("Body", () => {
  it("will pass all props to the created div and renders its children", () => {
    const content = <strong>Content</strong>
    const { container } = render(
      <Body className="custom-class">{content}</Body>
    )
    expect(
      container.firstElementChild!.classList.contains("custom-class")
    ).toBe(true)
    expect(container.firstElementChild!.classList.contains("toast-body")).toBe(
      true
    )
  })
})

const expectedClassesWithoutPosition: Record<Position, Array<string>> = {
  "top-start": ["top-0", "start-0"],
  "top-center": ["top-0", "start-50", "translate-middle-x"],
  "top-end": ["top-0", "end-0"],
  "middle-start": ["top-50", "start-0", "translate-middle-y"],
  "middle-center": ["top-50", "start-50", "translate-middle"],
  "middle-end": ["top-50", "end-0", "translate-middle-y"],
  "bottom-start": ["bottom-0", "start-0"],
  "bottom-center": ["bottom-0", "start-50", "translate-middle-x"],
  "bottom-end": ["bottom-0", "end-0"],
}
const createExpectedClasses = (containerPosition = "absolute") =>
  Object.fromEntries(
    Object.entries(expectedClassesWithoutPosition).map(([key, value]) => [
      key,
      containerPosition ? [`position-${containerPosition}`, ...value] : value,
    ])
  )
describe("Container", () => {
  it("should render a basic toast container", () => {
    const { container } = render(<Container />)
    expect(
      container.firstElementChild!.classList.contains("toast-container")
    ).toBe(true)
  })
  describe("without containerPosition", () => {
    const expectedClasses = createExpectedClasses()
    Object.keys(expectedClasses).forEach((position: Position) => {
      it(`should render classes for position=${position} with position-absolute`, () => {
        const { container } = render(<Container position={position} />)
        expectedClasses[position].map(className =>
          expect(
            container.firstElementChild!.classList.contains(className)
          ).toBe(true)
        )
      })
    })
  })
  describe('with containerPosition = "" (empty string)', () => {
    const expectedClasses = createExpectedClasses("")
    Object.keys(expectedClasses).forEach((position: Position) => {
      it(`should render classes for position=${position} without position-*`, () => {
        const { container } = render(<Container position={position} />)
        expectedClasses[position].map(className =>
          expect(
            container.firstElementChild!.classList.contains(className)
          ).toBe(true)
        )
      })
    })
  })
  ;["absolute", "fixed", "relative", "sticky", "custom"].forEach(
    containerPosition => {
      describe(`with containerPosition=${containerPosition}`, () => {
        const expectedClasses = createExpectedClasses(containerPosition)
        Object.keys(expectedClasses).forEach((position: Position) => {
          it(`should render classes for position=${position} with position-${containerPosition}`, () => {
            const { container } = render(
              <Container
                position={position}
                containerPosition={containerPosition}
              />
            )
            expectedClasses[position].map(className =>
              expect(
                container.firstElementChild!.classList.contains(className)
              ).toBe(true)
            )
          })
        })
      })
    }
  )
})
