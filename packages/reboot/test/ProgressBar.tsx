import { render } from "@testing-library/react"
import { ProgressBar } from "../src/ProgressBar.js"
import { shouldWarn } from "./tools.js"

describe("ProgressBar", () => {
  it("should output a progress bar with wrapper", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={0} />
    )
    const y = getByTestId("test")
    const y2 = y.firstElementChild!
    expect(y.classList.contains("progress")).toBe(true)
    expect(y2.classList.contains("progress-bar")).toBe(true)
    expect(y2.getAttribute("role")!).toEqual("progressbar")
  })
  ;["success", "warning", "info", "danger"].forEach(variant => {
    it(`Should have the variant="${variant}" class`, () => {
      const { getByTestId } = render(
        <ProgressBar
          data-testid="test"
          min={0}
          max={10}
          now={0}
          variant={variant}
        />
      )
      const y = getByTestId("test").firstElementChild!
      y.classList.contains(`bg-${variant}`)
    })
  })
  it("should default to min:0, max:100", () => {
    const { getByTestId } = render(<ProgressBar data-testid="test" now={5} />)
    const y = getByTestId("test").firstElementChild!
    expect(y.getAttribute("aria-valuemin")!).toEqual("0")
    expect(y.getAttribute("aria-valuemax")!).toEqual("100")
  })
  it("should have 0% computed width", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={0} />
    )
    const y = getByTestId("test").firstElementChild!
    expect((y as HTMLElement).style.width).toEqual("0%")
  })
  it("should have 10% computed width", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={1} />
    )
    const y = getByTestId("test").firstElementChild!
    expect((y as HTMLElement).style.width).toEqual("10%")
  })
  it("should have 100% computed width", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={10} />
    )
    const y = getByTestId("test").firstElementChild!
    expect((y as HTMLElement).style.width).toEqual("100%")
  })
  it("should have 50% computed width with non-zero min", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={1} max={11} now={6} />
    )
    const y = getByTestId("test").firstElementChild!
    expect((y as HTMLElement).style.width).toEqual("50%")
  })
  it("should not have label", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={5} />
    )
    const y = getByTestId("test").firstElementChild!
    expect(y.textContent!).toEqual("")
  })
  it("should have label", () => {
    const { getByTestId } = render(
      <ProgressBar
        data-testid="test"
        min={0}
        max={10}
        now={5}
        variant="success"
        label="progress bar label"
      />
    )
    const y = getByTestId("test").firstElementChild!
    expect(y.textContent!).toEqual("progress bar label")
  })
  it("should have screen reader only label", () => {
    const { getByTestId } = render(
      <ProgressBar
        data-testid="test"
        min={0}
        max={10}
        now={5}
        visuallyHidden
        variant="success"
        label="progress bar label"
      />
    )
    const y = getByTestId("test").firstElementChild!
    y.classList.contains("visually-hidden")
    expect(y.textContent!).toEqual("progress bar label")
  })
  it("should have a label that is a React component", () => {
    const label = <strong className="special-label">My label</strong>
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={0} max={10} now={5} label={label} />
    )
    const y = getByTestId("test").firstElementChild!
    expect(y.firstElementChild!.classList.contains("special-label")).toBe(true)
  })
  it("should have screen reader only label that wraps a React component", () => {
    const label = <strong className="special-label">My label</strong>
    const { getByTestId } = render(
      <ProgressBar
        data-testid="test"
        min={0}
        max={10}
        now={5}
        label={label}
        visuallyHidden
      />
    )
    const y = getByTestId("test").firstElementChild!
    expect(y.firstElementChild!.classList.contains("visually-hidden")).toBe(
      true
    )
    expect(
      y.firstElementChild!.firstElementChild!.classList.contains(
        "special-label"
      )
    ).toBe(true)
  })
  it("should show striped bar", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={1} max={11} now={6} striped />
    )
    const y = getByTestId("test").firstElementChild!
    y.classList.contains("progress-bar-striped")
  })
  it("should show animated striped bar", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test" min={1} max={11} now={6} animated />
    )
    const y = getByTestId("test").firstElementChild!
    y.classList.contains("progress-bar-striped")
    y.classList.contains("progress-bar-animated")
  })
  it("should show stacked bars", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test">
        <ProgressBar key={1} now={50} />
        <ProgressBar key={2} now={30} />
      </ProgressBar>
    )
    const y = getByTestId("test")
    const y1 = y.firstElementChild!
    const y2 = y.lastElementChild!
    expect(y1.classList.contains("progress-bar")).toBe(true)
    expect((y1 as HTMLElement).style.width).toEqual("50%")
    expect(y2.classList.contains("progress-bar")).toBe(true)
    expect((y2 as HTMLElement).style.width).toEqual("30%")
  })
  it("should render animated and striped children in stacked bar too", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test">
        <ProgressBar animated key={1} now={50} />
        <ProgressBar striped key={2} now={30} />
      </ProgressBar>
    )
    const y = getByTestId("test")
    const y1 = y.firstElementChild!
    const y2 = y.lastElementChild!
    expect(y1.classList.contains("progress-bar")).toBe(true)
    expect(y1.classList.contains("progress-bar-striped")).toBe(true)
    expect(y1.classList.contains("progress-bar-animated")).toBe(true)
    expect(y2.classList.contains("progress-bar")).toBe(true)
    expect(y2.classList.contains("progress-bar-striped")).toBe(true)
    expect(y2.classList.contains("progress-bar-animated")).toBe(false)
  })
  it("should forward className and style to nested bars", () => {
    const { getByTestId } = render(
      <ProgressBar data-testid="test">
        <ProgressBar now={1} className="bar1" />
        <ProgressBar now={2} style={{ minWidth: 10 }} />
      </ProgressBar>
    )
    const y = getByTestId("test")
    const y1 = y.firstElementChild!
    const y2 = y.lastElementChild!
    expect(y1.classList.contains("progress-bar")).toBe(true)
    expect((y2 as HTMLElement).style.minWidth).toEqual("10px")
  })
  it("allows only ProgressBar in children", () => {
    shouldWarn("Failed prop")
    function NotProgressBar() {
      return null
    }
    function NotProgressBar2() {
      return <div>asdf</div>
    }
    render(
      <ProgressBar>
        <ProgressBar key={1} />
        <NotProgressBar />
        foo
        <NotProgressBar2 />
        <ProgressBar key={2} />
      </ProgressBar>
    )
  })
})
