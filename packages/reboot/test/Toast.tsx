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
  test("should apply bg prop", () => {
    const { container } = render(<Toast bg="primary">Card</Toast>)
    container.firstElementChild!.classList.contains("bg-primary").should.be.true
    container.firstElementChild!.classList.contains("toast").should.be.true
  })
  test("should render an entire toast", () => {
    const { container } = render(
      <Toast>
        <Header />
        <Body />
      </Toast>
    )
    ;["fade", "toast", "show"].map(
      className =>
        container.firstElementChild!.classList.contains(className).should.be
          .true
    )
    ;(
      [
        ["role", "alert"],
        ["aria-live", "assertive"],
        ["aria-atomic", true],
      ] as const
    ).map(
      ([attrName, attrVal]) =>
        (
          container.firstElementChild!.attributes.getNamedItem(attrName)!
            .textContent === `${attrVal}`
        ).should.be.true
    )
  })
  test("should render without transition if animation is false", () => {
    const { container } = render(
      <Toast animation={false}>
        <Header />
        <Body />
      </Toast>
    )
    ;["toast", "show"].map(
      className =>
        container.firstElementChild!.classList.contains(className).should.be
          .true
    )
  })
  test("should trigger the onClose event after clicking on the close button", () => {
    const onCloseSpy = sinon.spy()
    const { container } = render(
      <Toast onClose={onCloseSpy}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    fireEvent.click(
      container.firstElementChild!.getElementsByTagName("button")[0]
    )
    onCloseSpy.should.have.been.calledOnce
  })
  test("should trigger the onClose event after the autohide delay", () => {
    const onCloseSpy = sinon.spy()
    render(
      <Toast onClose={onCloseSpy} delay={500} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    clock.tick(1000)
    onCloseSpy.should.have.been.calledOnce
  })
  test("should not trigger the onClose event if autohide is not set", () => {
    const onCloseSpy = sinon.spy()
    render(
      <Toast onClose={onCloseSpy}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    clock.tick(3000)
    onCloseSpy.should.not.to.have.been.called
  })
  test("should clearTimeout after unmount", () => {
    const onCloseSpy = sinon.spy()
    const { unmount } = render(
      <Toast delay={500} onClose={onCloseSpy} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    unmount()
    clock.tick(1000)
    onCloseSpy.should.not.to.have.been.called
  })
  test("should not reset autohide timer when element re-renders with same props", () => {
    const onCloseSpy = sinon.spy()
    const toast = getToast({ onCloseSpy })
    const { rerender } = render(toast)
    clock.tick(250)
    // Trigger render with no props changes.
    rerender(toast)
    clock.tick(300)
    onCloseSpy.should.have.been.calledOnce
  })
  test("should not reset autohide timer when delay is changed", () => {
    const onCloseSpy = sinon.spy()
    const { rerender } = render(getToast({ delay: 500, onCloseSpy }))
    clock.tick(250)
    rerender(getToast({ delay: 10000, onCloseSpy }))
    clock.tick(300)
    onCloseSpy.should.have.been.calledOnce
  })
  test("should not reset autohide timer when onClosed is changed", () => {
    const onCloseSpy = sinon.spy()
    const onCloseSpy2 = sinon.spy()
    const { rerender } = render(getToast({ onCloseSpy }))
    clock.tick(250)
    rerender(getToast({ onCloseSpy: onCloseSpy2 }))
    clock.tick(300)
    onCloseSpy.should.not.to.have.been.called
    onCloseSpy2.should.have.been.calledOnce
  })
  test("should not call onClose if autohide is changed from true to false", () => {
    const onCloseSpy = sinon.spy()
    const { rerender } = render(getToast({ onCloseSpy, autohide: true }))
    clock.tick(250)
    rerender(getToast({ onCloseSpy, autohide: false }))
    clock.tick(300)
    onCloseSpy.should.not.to.have.been.called
  })
  test("should not call onClose if show is changed from true to false", () => {
    const onCloseSpy = sinon.spy()
    const { rerender } = render(getToast({ show: true, onCloseSpy }))
    clock.tick(100)
    rerender(getToast({ show: false, onCloseSpy }))
    clock.tick(300)
    onCloseSpy.should.not.to.have.been.called
  })
  test("should render with bsPrefix", () => {
    const { container } = render(
      <Toast bsPrefix="my-toast">
        <Header />
        <Body />
      </Toast>
    )
    container.firstElementChild!.tagName.toLowerCase().should.equal("div")
    container.firstElementChild!.classList.contains("my-toast")
  })
})

describe("Header", () => {
  test("will pass all props to the created div and renders its children", () => {
    const { container } = render(
      <Header>
        <strong>content</strong>
      </Header>
    )
    container.firstElementChild!.tagName.toLowerCase().should.equal("div")
    container
      .firstElementChild!.firstElementChild!.tagName.toLowerCase()
      .should.equal("strong")
    container.firstElementChild!.classList.contains("toast-header").should.be
      .true
  })
  test("should render close button variant", () => {
    const { container } = render(
      <Header closeButton closeVariant="white">
        <strong>content</strong>
      </Header>
    )
    container
      .firstElementChild!.getElementsByTagName("button")[0]
      .classList.contains("btn-close-white").should.be.true
  })
})

describe("Body", () => {
  test("will pass all props to the created div and renders its children", () => {
    const content = <strong>Content</strong>
    const { container } = render(
      <Body className="custom-class">{content}</Body>
    )
    container.firstElementChild!.classList.contains("custom-class").should.be
      .true
    container.firstElementChild!.classList.contains("toast-body").should.be.true
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
  test("should render a basic toast container", () => {
    const { container } = render(<Container />)
    container.firstElementChild!.classList.contains("toast-container").should.be
      .true
  })
  describe("without containerPosition", () => {
    const expectedClasses = createExpectedClasses()
    Object.keys(expectedClasses).forEach((position: Position) => {
      test(`should render classes for position=${position} with position-absolute`, () => {
        const { container } = render(<Container position={position} />)
        expectedClasses[position].map(
          className =>
            container.firstElementChild!.classList.contains(className).should.be
              .true
        )
      })
    })
  })
  describe('with containerPosition = "" (empty string)', () => {
    const expectedClasses = createExpectedClasses("")
    Object.keys(expectedClasses).forEach((position: Position) => {
      test(`should render classes for position=${position} without position-*`, () => {
        const { container } = render(<Container position={position} />)
        expectedClasses[position].map(
          className =>
            container.firstElementChild!.classList.contains(className).should.be
              .true
        )
      })
    })
  })
  ;["absolute", "fixed", "relative", "sticky", "custom"].forEach(
    containerPosition => {
      describe(`with containerPosition=${containerPosition}`, () => {
        const expectedClasses = createExpectedClasses(containerPosition)
        Object.keys(expectedClasses).forEach((position: Position) => {
          test(`should render classes for position=${position} with position-${containerPosition}`, () => {
            const { container } = render(
              <Container
                position={position}
                containerPosition={containerPosition}
              />
            )
            expectedClasses[position].map(
              className =>
                container.firstElementChild!.classList.contains(className)
                  .should.be.true
            )
          })
        })
      })
    }
  )
})
