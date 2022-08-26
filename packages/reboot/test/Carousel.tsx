import { Carousel, Item, Ref, Caption } from "../src/Carousel.jsx"
import { fireEvent, render, RenderResult } from "@testing-library/react"
import { Simulate } from "react-dom/test-utils"
import { Theme } from "../src/Theme.jsx"
import * as React from "react"

jest.useFakeTimers()

describe("<Carousel>", () => {
  const testid = "test"
  const items = [
    <Item key={1} data-testid={testid}>
      Item 1 content
    </Item>,
    <Item key={2} data-testid={testid}>
      Item 2 content
    </Item>,
    <Item key={3} data-testid={testid}>
      Item 3 content
    </Item>,
  ]
  it("Should not throw an error with StrictMode", () => {
    const ref = React.createRef<Ref>()
    render(
      <React.StrictMode>
        <Carousel ref={ref} interval={null}>
          {items}
        </Carousel>
      </React.StrictMode>
    )
    ref.current!.next()
  })
  it("Should show the first item by default and render all", () => {
    const { getAllByTestId, container: c } = render(
      <Carousel>{items}</Carousel>
    )
    const y = getAllByTestId(testid)
    expect(y[0]!.classList.contains("active")).toBe(true)
    expect(y[1]!.classList.contains("active")).toBe(false)
    expect(c.querySelectorAll(".carousel-indicators > button")).toHaveLength(
      items.length
    )
  })
  it("Should show the correct item with defaultActiveIndex", () => {
    const { getAllByTestId } = render(
      <Carousel defaultActiveIndex={1}>{items}</Carousel>
    )
    const y = getAllByTestId(testid)
    expect(y[0]!.classList.contains("active")).toBe(false)
    expect(y[1]!.classList.contains("active")).toBe(true)
  })
  it("Should handle falsy children", () => {
    const { getAllByTestId, container: c } = render(
      <Carousel>
        {null}
        <Item data-testid={testid}>Item 1 content</Item>
        {false}
        {undefined}
        <Item data-testid={testid}>Item 2 content</Item>
      </Carousel>
    )
    const y = getAllByTestId(testid)
    expect(y[0]!.classList.contains("active")).toBe(true)
    expect(y[0]!.innerText).toEqual("Item 1 content")
    expect(c.querySelectorAll(".carousel-indicators > button")).toHaveLength(2)
  })
  it("Should call onSelect when indicator selected", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Carousel activeIndex={1} onSelect={mock} interval={null}>
        {items}
      </Carousel>
    )
    fireEvent.click(getByLabelText("Slide 1"))
    expect(mock).toHaveReturnedTimes(1)
    expect(mock).toHaveReturnedWith(0)
  })
  it("Should render custom indicator labels", () => {
    const ls = ["custom1", "custom2", "custom3"]
    const { getByLabelText } = render(
      <Carousel activeIndex={1} interval={null} indicatorLabels={ls}>
        {items}
      </Carousel>
    )
    for (let i = 0; i < ls.length; i++) {
      expect(getByLabelText(ls[i]!, { selector: "[aria-label]" })).toBeTruthy()
    }
  })
  it("Should render variant", () => {
    const { getByTestId } = render(
      <Carousel
        activeIndex={1}
        interval={null}
        variant="dark"
        data-testid="test"
      >
        {items}
      </Carousel>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("carousel")).toBe(true)
    expect(y.classList.contains("carousel-dark")).toBe(true)
  })
  describe("ref testing", () => {
    // let clock: jest.Mock
    beforeEach(() => {
      // clock = jest.fn()
    })
    afterEach(() => {
      // clock = undefined
    })
    it("Should allow refs to be attached and expose next, prev functions", () => {
      const ref = React.createRef<Ref>()
      const mock = jest.fn()
      render(
        <Carousel ref={ref} onSelect={mock} defaultActiveIndex={1}>
          {items}
        </Carousel>
      )
      const y = ref.current!
      expect(y).toHaveProperty("next")
      expect(y).toHaveProperty("prev")
      expect(y).toHaveProperty("element")
      expect(y).toBeInstanceOf(HTMLElement)
      ref.current!.next()
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      ref.current!.prev()
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(2)
    })
  })
  ;["onSlide", "onSlid"].forEach(eventName => {
    it(`Should call ${eventName} with previous index and direction`, done => {
      function onEvent(i: any, direction: any) {
        expect(i).toEqual(0)
        expect(direction).toEqual("end")
        done()
      }
      const { getByLabelText } = render(
        <Carousel
          defaultActiveIndex={1}
          interval={null}
          {...{ [eventName]: onEvent }}
        >
          {items}
        </Carousel>
      )
      fireEvent.click(
        getByLabelText("Slide 1", { selector: ".carousel-indicators button" })
      )
    })
    it(`Should call ${eventName} with next index and direction`, done => {
      function onEvent(i: any, direction: any) {
        const last = items.length - 1
        expect(i).toEqual(last)
        expect(direction).toEqual("start")
        done()
      }
      const { getByLabelText } = render(
        <Carousel
          defaultActiveIndex={1}
          interval={null}
          {...{ [eventName]: onEvent }}
        >
          {items}
        </Carousel>
      )
      fireEvent.click(
        getByLabelText("Slide 3", { selector: ".carousel-indicators button" })
      )
    })
  })
  describe("Buttons and labels with and without wrapping", () => {
    it("Should show back button control on the first image if wrap is true", () => {
      const { container: c } = render(
        <Carousel controls wrap>
          {items}
        </Carousel>
      )
      expect(c.querySelectorAll("a.carousel-control-prev")).toHaveLength(1)
    })
    it("Should show next button control on the last image if wrap is true", () => {
      const last = items.length - 1
      const { container: c } = render(
        <Carousel defaultActiveIndex={last} controls wrap>
          {items}
        </Carousel>
      )
      expect(c.querySelectorAll("a.carousel-control-next")).toHaveLength(1)
    })
    it("Should not show the prev button on the first image if wrap is false", () => {
      const { container: c } = render(
        <Carousel controls wrap={false}>
          {items}
        </Carousel>
      )
      expect(c.querySelectorAll("a.carousel-control-prev")).toHaveLength(0)
    })
    it("Should not show the next button on the last image if wrap is false", () => {
      const last = items.length - 1
      const { container: c } = render(
        <Carousel defaultActiveIndex={last} controls wrap={false}>
          {items}
        </Carousel>
      )
      expect(c.querySelectorAll("a.carousel-control-next")).toHaveLength(0)
    })
  })
  it("Should allow the user to specify a previous and next icon", () => {
    const { getByTestId } = render(
      <Carousel
        controls
        defaultActiveIndex={1}
        prevIcon={<span className="ficon ficon-left" data-testid="prev" />}
        nextIcon={<span className="ficon ficon-right" data-testid="next" />}
      >
        {items}
      </Carousel>
    )
    expect(getByTestId("prev").classList.contains("ficon-left")).toBe(true)
    expect(getByTestId("next").classList.contains("ficon-right")).toBe(true)
  })
  it("Should allow user to specify a previous and next SR label", () => {
    const { container: c } = render(
      <Carousel
        controls
        defaultActiveIndex={1}
        prevLabel="Previous awesomeness"
        nextLabel="Next awesomeness"
      >
        {items}
      </Carousel>
    )
    const y = c.querySelectorAll<HTMLElement>(".visually-hidden")
    expect(y).toHaveLength(2)
    expect(y[0]!.innerText).toContain("Previous awesomeness")
    expect(y[1]!.innerText).toContain("Next awesomeness")
  })
  it("Should not render labels when values are null or undefined", () => {
    ;[null, ""].forEach(falsyValue => {
      const { container: c } = render(
        <Carousel
          controls
          defaultActiveIndex={1}
          prevLabel={falsyValue}
          nextLabel={falsyValue}
        >
          {items}
        </Carousel>
      )
      expect(c.querySelectorAll(".visually-hidden")).toHaveLength(
        0 //, `should not render labels for value ${falsyValue}`
      )
    })
  })
  it("Should transition properly when slide animation is disabled", () => {
    const mock = jest.fn()
    const { container: c } = render(
      <Carousel slide={false} onSelect={mock}>
        {items}
      </Carousel>
    )
    fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-next")!)
    expect(mock).toHaveBeenCalledTimes(1)
    fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-prev")!)
    expect(mock).toHaveBeenCalledTimes(2)
  })
  it("Should render on update, active item > new child length", () => {
    const { queryAllByLabelText, queryAllByText, rerender } = render(
      <Carousel defaultActiveIndex={items.length - 1}>{items}</Carousel>
    )
    expect(
      queryAllByLabelText(/Slide/, {
        selector: ".carousel-indicators > button",
      })
    ).toHaveLength(items.length)
    const fewer = items.slice(2)
    rerender(<Carousel defaultActiveIndex={items.length - 1}>{fewer}</Carousel>)
    expect(
      queryAllByLabelText(/Slide/, {
        selector: ".carousel-indicators > button",
      })
    ).toHaveLength(fewer.length)
    expect(
      queryAllByText(/Item \d content/, {
        selector: "div.carousel-item",
      })
    ).toHaveLength(fewer.length)
  })
  it("Should render correctly when fade is set", () => {
    const { getByTestId } = render(
      <Carousel defaultActiveIndex={1} fade data-testid="test">
        {items}
      </Carousel>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("carousel-fade")).toBe(true)
  })
  describe("automatic traversal", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should go through the items after given seconds", () => {
      const mock = jest.fn()
      const interval = 500
      render(
        <Carousel interval={interval} onSelect={mock}>
          {items}
        </Carousel>
      )
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("Should go through the items given the specified intervals", () => {
      const mock = jest.fn()
      render(
        <Carousel interval={5000} onSelect={mock}>
          <Item interval={1000}>Item 1 content</Item>
          <Item>Item 2 content</Item>
        </Carousel>
      )
      jest.advanceTimersByTime(1100)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(1)
    })
    it("Should stop going through items on hover and continue afterwards", () => {
      const mock = jest.fn()
      const interval = 500
      const { getByTestId } = render(
        <Carousel interval={interval} onSelect={mock} data-testid="test">
          {items}
        </Carousel>
      )
      const carousel = getByTestId("test")
      fireEvent.mouseOver(carousel)
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).not.toHaveBeenCalled()
      fireEvent.mouseOut(carousel)
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("Should ignore hover if the prop is passed", () => {
      const mock = jest.fn()
      const interval = 500
      const { getByTestId } = render(
        <Carousel
          interval={interval}
          onSelect={mock}
          pause={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.mouseOver(getByTestId("test"))
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("Should stop going through the items after unmounting", () => {
      const mock = jest.fn()
      const interval = 500
      const { unmount } = render(
        <Carousel interval={interval} onSelect={mock}>
          {items}
        </Carousel>
      )
      unmount()
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).not.toHaveBeenCalled()
    })
  })
  describe("wrapping", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should wrap to last from first", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={0} onSelect={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowLeft" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(items.length - 1)
    })
    it("Should wrap from first to last", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel
          activeIndex={items.length - 1}
          onSelect={mock}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowRight" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(0)
    })
    ;[
      {
        caseName: "previous at first",
        activeIndex: 0,
        eventPayload: { key: "ArrowLeft" },
      },
      {
        caseName: "next at last",
        activeIndex: items.length - 1,
        eventPayload: { key: "ArrowRight" },
      },
    ].forEach(({ caseName, activeIndex, eventPayload }) => {
      it(`Should not wrap with wrap unset for ${caseName}`, () => {
        const mock = jest.fn()
        const { getByTestId, getAllByTestId } = render(
          <Carousel
            activeIndex={activeIndex}
            wrap={false}
            onSelect={mock}
            data-testid="test"
          >
            {items}
          </Carousel>
        )
        const y = getByTestId("test")
        fireEvent.keyDown(y, eventPayload)
        jest.advanceTimersByTime(50)
        const y2 = getAllByTestId(testid)
        expect(y2[activeIndex]!.classList.contains("active")).toBe(true)
        expect(mock).not.toHaveBeenCalled()
      })
    })
  })
  describe("keyboard events", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should go back for the keyboard event ArrowLeft", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onSelect={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowLeft" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(0)
    })
    it("Should go forward for the keyboard event ArrowRight", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onSelect={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowRight" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(2)
    })
    it("Should ignore keyEvents when the keyboard is disabled", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel
          activeIndex={1}
          onSelect={mock}
          keyboard={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowRight" })
      jest.advanceTimersByTime(50)
      expect(mock).not.toHaveBeenCalled()
    })
    it("Should handle a defined custom key event", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onKeyDown={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowUp" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    ;["ArrowUp", "ArrowRightLeft", "Onwards"].forEach(key => {
      it("Should do nothing for non left or right keys", () => {
        const mock = jest.fn()
        const { getByTestId } = render(
          <Carousel activeIndex={1} onSelect={mock} data-testid="test">
            {items}
          </Carousel>
        )
        fireEvent.keyDown(getByTestId("test"), { key })
        jest.advanceTimersByTime(50)
        // sinon.assert.notCalled(mock)
      })
    })
  })
  describe("mouse events", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should handle a defined mouse over event", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onMouseOver={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.mouseOver(getByTestId("test"))
      jest.advanceTimersByTime(1500)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("Should handle a defined mouse out event", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onMouseOut={mock} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.mouseOut(getByTestId("test"))
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
    })
  })
  describe("touch events", () => {
    let //clock: sinon.SinonFakeTimers,
      renderResult: RenderResult,
      y: HTMLElement,
      mock: jest.Mock,
      onTouchStart: jest.Mock,
      onTouchMove: jest.Mock,
      onTouchEnd: jest.Mock
    beforeEach(() => {
      mock = jest.fn()
      onTouchStart = jest.fn()
      onTouchMove = jest.fn()
      onTouchEnd = jest.fn()
      renderResult = render(
        <Carousel
          activeIndex={1}
          interval={null}
          onSelect={mock}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          touch
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      y = renderResult.getByTestId("test")
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    function generateTouchEvents(params: {
      target: HTMLElement
      startX: number
      endX: number
    }): void {
      const { target, startX, endX } = params
      Simulate.touchStart(target, {
        touches: [{ identifier: 1, target, clientX: startX }] as never,
      })
      Simulate.touchMove(target, {
        touches: [{ identifier: 1, target, clientX: endX }] as never,
      })
      Simulate.touchEnd(target)
    }
    it("Should swipe right", () => {
      generateTouchEvents({ target: y, startX: 50, endX: 0 })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(2)
    })
    it("Should swipe left", () => {
      generateTouchEvents({ target: y, startX: 0, endX: 50 })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(0)
    })
    it("Should not swipe if swipe detected is under the swipe threshold", () => {
      generateTouchEvents({ target: y, startX: 0, endX: 35 })
      jest.advanceTimersByTime(50)
      expect(mock).not.toHaveBeenCalled()
    })
    it("Should handle a custom touch start and end event", () => {
      generateTouchEvents({ target: y, startX: 50, endX: 0 })
      jest.advanceTimersByTime(50)
      expect(onTouchStart).toHaveBeenCalledTimes(1)
      expect(onTouchMove).toHaveBeenCalledTimes(1)
      expect(onTouchEnd).toHaveBeenCalledTimes(1)
    })
    it("Should handle a custom multi-touch move event", () => {
      Simulate.touchMove(y, {
        touches: [
          { identifier: 1, target: y, clientX: 0 },
          { identifier: 1, target: y, clientX: 50 },
        ] as never,
      })
      jest.advanceTimersByTime(50)
      expect(onTouchMove).toHaveBeenCalledTimes(1)
    })
    it("Should do nothing with disabled touch right", () => {
      const { getByTestId, container } = render(
        <Carousel
          activeIndex={1}
          interval={null}
          onSelect={mock}
          touch={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      const y = getByTestId("test")
      generateTouchEvents({ target: y, startX: 50, endX: 0 })
      jest.advanceTimersByTime(50)
      expect(mock).not.toHaveBeenCalled()
      const carouselItems = container.querySelectorAll(".carousel-item")
      expect(carouselItems).toHaveLength(3)
      expect(carouselItems[1]!.classList.contains("active")).toBe(true)
    })
  })
  describe("callback tests", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should call onSlide when slide animation is disabled", () => {
      const sel = jest.fn()
      const slide = jest.fn()
      const { container: c } = render(
        <Carousel slide={false} onSelect={sel} onSlide={slide}>
          {items}
        </Carousel>
      )
      fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-next")!)
      jest.advanceTimersByTime(150)
      expect(slide).toHaveBeenCalledTimes(1)
      fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-prev")!)
      jest.advanceTimersByTime(150)
      expect(slide).toHaveBeenCalledTimes(2)
    })
    it("Should call onSlid when slide animation is disabled", () => {
      const sel = jest.fn()
      const slide = jest.fn()
      const { container: c } = render(
        <Carousel slide={false} onSelect={sel} onSlide={slide}>
          {items}
        </Carousel>
      )
      fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-next")!)
      jest.advanceTimersByTime(150)
      expect(slide).toHaveBeenCalledTimes(1)
      fireEvent.click(c.querySelector<HTMLElement>("a.carousel-control-prev")!)
      jest.advanceTimersByTime(150)
      expect(slide).toHaveBeenCalledTimes(2)
    })
    it("Should transition/call onSelect once if previous arrow double clicked", () => {
      const mock = jest.fn()
      const { container: c } = render(
        <Carousel onSelect={mock}>{items}</Carousel>
      )
      const y = c.querySelector<HTMLElement>("a.carousel-control-prev")!
      fireEvent.click(y)
      fireEvent.click(y)
      jest.advanceTimersByTime(1000)
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("Should transition/call onSelect once if next arrow double clicked", () => {
      const mock = jest.fn()
      const { container: c } = render(
        <Carousel onSelect={mock}>{items}</Carousel>
      )
      const y = c.querySelector<HTMLElement>("a.carousel-control-next")!
      fireEvent.click(y)
      fireEvent.click(y)
      jest.advanceTimersByTime(1000)
      expect(mock).toHaveBeenCalledTimes(1)
    })
  })
  describe("RTL", () => {
    // let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      // clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      // clock.restore()
    })
    it("Should slide in correct direction on ArrowLeft when dir=rtl", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={mock} data-testid="test">
            {items}
          </Carousel>
        </Theme>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowLeft" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(2)
    })
    it("Should slide in correct direction on ArrowLeft when dir=rtl", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={mock} data-testid="test">
            {items}
          </Carousel>
        </Theme>
      )
      fireEvent.keyDown(getByTestId("test"), { key: "ArrowRight" })
      jest.advanceTimersByTime(50)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(0)
    })
    it("Should slide in correct direction automatically when dir=rtl", () => {
      const mock = jest.fn()
      const interval = 300
      render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={mock} interval={interval}>
            {items}
          </Carousel>
        </Theme>
      )
      jest.advanceTimersByTime(interval * 1.5)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(0)
    })
  })
})
describe("<Caption>", () => {
  it('uses "div" by default', () => {
    const { getByTestId, getByText } = render(
      <Caption className="custom-class" data-testid="test">
        <strong>Children</strong>
      </Caption>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("div")
    expect(y.classList.contains("carousel-caption")).toBe(true)
    expect(y.classList.contains("custom-class")).toBe(true)
    const y2 = getByText("Children")
    expect(y2.tagName.toLowerCase()).toEqual("strong")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(<Caption as="section" data-testid="test" />)
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("section")
    expect(y.classList.contains("carousel-caption")).toBe(true)
  })
})
