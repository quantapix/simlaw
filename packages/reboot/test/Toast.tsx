import { Body, Container, Header, Position, Toast } from "../src/Toast.jsx"
import { fireEvent, render } from "@testing-library/react"

const getToast = ({
  delay = 500,
  mock,
  autohide = true,
  show = true,
}: {
  delay?: number
  mock: any
  autohide?: boolean
  show?: boolean
}) => (
  <Toast delay={delay} onClose={mock} show={show} autohide={autohide}>
    <Header>header-content</Header>
    <Body>body-content</Body>
  </Toast>
)
describe("<Toast>", () => {
  // let clock
  beforeEach(() => {
    // clock = sinon.useFakeTimers()
  })
  afterEach(() => {
    // clock.restore()
  })
  it("Should apply bg prop", () => {
    const { container: c } = render(<Toast bg="primary">Card</Toast>)
    expect(c.firstElementChild!.classList.contains("bg-primary")).toBe(true)
    expect(c.firstElementChild!.classList.contains("toast")).toBe(true)
  })
  it("Should render an entire toast", () => {
    const { container: c } = render(
      <Toast>
        <Header />
        <Body />
      </Toast>
    )
    ;["fade", "toast", "show"].map(className =>
      expect(c.firstElementChild!.classList.contains(className)).toBe(true)
    )
    ;(
      [
        ["role", "alert"],
        ["aria-live", "assertive"],
        ["aria-atomic", true],
      ] as const
    ).map(([attrName, attrVal]) =>
      expect(
        c.firstElementChild!.attributes.getNamedItem(attrName)!.textContent ===
          `${attrVal}`
      ).toBe(true)
    )
  })
  it("Should render without transition if animation is false", () => {
    const { container: c } = render(
      <Toast animation={false}>
        <Header />
        <Body />
      </Toast>
    )
    ;["toast", "show"].map(className =>
      expect(c.firstElementChild!.classList.contains(className)).toBe(true)
    )
  })
  it("Should trigger the onClose event after clicking on the close button", () => {
    const mock = jest.fn()
    const { container: c } = render(
      <Toast onClose={mock}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    fireEvent.click(c.firstElementChild!.getElementsByTagName("button")[0]!)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should trigger the onClose event after the autohide delay", () => {
    const mock = jest.fn()
    render(
      <Toast onClose={mock} delay={500} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    jest.advanceTimersByTime(1000)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should not trigger the onClose event if autohide is not set", () => {
    const mock = jest.fn()
    render(
      <Toast onClose={mock}>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    jest.advanceTimersByTime(3000)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should clearTimeout after unmount", () => {
    const mock = jest.fn()
    const { unmount } = render(
      <Toast delay={500} onClose={mock} show autohide>
        <Header>header-content</Header>
        <Body>body-content</Body>
      </Toast>
    )
    unmount()
    jest.advanceTimersByTime(1000)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should not reset autohide timer when element re-renders with same props", () => {
    const mock = jest.fn()
    const y = getToast({ mock })
    const { rerender } = render(y)
    jest.advanceTimersByTime(250)
    rerender(y)
    jest.advanceTimersByTime(300)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should not reset autohide timer when delay is changed", () => {
    const mock = jest.fn()
    const { rerender } = render(getToast({ delay: 500, mock }))
    jest.advanceTimersByTime(250)
    rerender(getToast({ delay: 10000, mock }))
    jest.advanceTimersByTime(300)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("Should not reset autohide timer when onClosed is changed", () => {
    const mock = jest.fn()
    const mock2 = jest.fn()
    const { rerender } = render(getToast({ mock }))
    jest.advanceTimersByTime(250)
    rerender(getToast({ mock: mock2 }))
    jest.advanceTimersByTime(300)
    expect(mock).not.toHaveBeenCalled()
    expect(mock2).toHaveBeenCalledTimes(1)
  })
  it("Should not call onClose if autohide is changed from true to false", () => {
    const mock = jest.fn()
    const { rerender } = render(getToast({ mock, autohide: true }))
    jest.advanceTimersByTime(250)
    rerender(getToast({ mock, autohide: false }))
    jest.advanceTimersByTime(300)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should not call onClose if show is changed from true to false", () => {
    const mock = jest.fn()
    const { rerender } = render(getToast({ show: true, mock }))
    jest.advanceTimersByTime(100)
    rerender(getToast({ show: false, mock }))
    jest.advanceTimersByTime(300)
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should render with bsPrefix", () => {
    const { container: c } = render(
      <Toast bsPrefix="my-toast">
        <Header />
        <Body />
      </Toast>
    )
    expect(c.firstElementChild!.tagName.toLowerCase()).toEqual("div")
    c.firstElementChild!.classList.contains("my-toast")
  })
})

describe("Header", () => {
  it("will pass all props to the created div and renders its children", () => {
    const { container: c } = render(
      <Header>
        <strong>content</strong>
      </Header>
    )
    expect(c.firstElementChild!.tagName.toLowerCase()).toEqual("div")
    expect(
      c.firstElementChild!.firstElementChild!.tagName.toLowerCase()
    ).toEqual("strong")
    expect(c.firstElementChild!.classList.contains("toast-header")).toBe(true)
  })
  it("Should render close button variant", () => {
    const { container: c } = render(
      <Header closeButton closeVariant="white">
        <strong>content</strong>
      </Header>
    )
    expect(
      c
        .firstElementChild!.getElementsByTagName("button")[0]!
        .classList.contains("btn-close-white")
    ).toBe(true)
  })
})

describe("Body", () => {
  it("will pass all props to the created div and renders its children", () => {
    const content = <strong>Content</strong>
    const { container: c } = render(
      <Body className="custom-class">{content}</Body>
    )
    expect(c.firstElementChild!.classList.contains("custom-class")).toBe(true)
    expect(c.firstElementChild!.classList.contains("toast-body")).toBe(true)
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
const createExpectedClasses = (pos = "absolute") =>
  Object.fromEntries(
    Object.entries(expectedClassesWithoutPosition).map(([k, v]) => [
      k,
      pos ? [`position-${pos}`, ...v] : v,
    ])
  )
describe("Container", () => {
  it("Should render a basic toast container", () => {
    const { container: c } = render(<Container />)
    expect(c.firstElementChild!.classList.contains("toast-container")).toBe(
      true
    )
  })
  describe("without containerPosition", () => {
    const cs = createExpectedClasses()
    Object.keys(cs).forEach(x => {
      it(`Should render classes for position=${x} with position-absolute`, () => {
        const { container: c } = render(<Container position={x as Position} />)
        cs[x]?.map(n =>
          expect(c.firstElementChild!.classList.contains(n)).toBe(true)
        )
      })
    })
  })
  describe('with containerPosition = "" (empty string)', () => {
    const cs = createExpectedClasses("")
    Object.keys(cs).forEach(x => {
      it(`Should render classes for position=${x} without position-*`, () => {
        const { container } = render(<Container position={x as Position} />)
        cs[x]?.map(n =>
          expect(container.firstElementChild!.classList.contains(n)).toBe(true)
        )
      })
    })
  })
  ;["absolute", "fixed", "relative", "sticky", "custom"].forEach(x => {
    describe(`with containerPosition=${x}`, () => {
      const cs = createExpectedClasses(x)
      Object.keys(cs).forEach(p => {
        it(`Should render classes for position=${p} with position-${x}`, () => {
          const { container: c } = render(
            <Container position={p as Position} containerPosition={x} />
          )
          cs[p]?.map(n =>
            expect(c.firstElementChild!.classList.contains(n)).toBe(true)
          )
        })
      })
    })
  })
})
