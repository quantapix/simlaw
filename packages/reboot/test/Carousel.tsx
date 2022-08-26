import * as React from "react"
import { Simulate } from "react-dom/test-utils"
import { fireEvent, render, RenderResult } from "@testing-library/react"
import { Carousel, Item, Ref, Caption } from "../src/Carousel.jsx"
import { Theme } from "../src/Theme.jsx"

describe("<Carousel>", () => {
  const CarouselItemTestId = "carousel-item-test"
  const items = [
    <Item key={1} data-testid={CarouselItemTestId}>
      Item 1 content
    </Item>,
    <Item key={2} data-testid={CarouselItemTestId}>
      Item 2 content
    </Item>,
    <Item key={3} data-testid={CarouselItemTestId}>
      Item 3 content
    </Item>,
  ]
  it("should not throw an error with StrictMode", () => {
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
  it("should show the first item by default and render all", () => {
    const { getAllByTestId, container } = render(<Carousel>{items}</Carousel>)
    const carouselItems = getAllByTestId(CarouselItemTestId)
    expect(carouselItems[0].classList.contains("active")).toBe(true)
    expect(carouselItems[1].classList.contains("active")).toBe(false)
    expect(
      container.querySelectorAll(".carousel-indicators > button")
    ).toHaveLength(items.length)
  })
  it("should show the correct item with defaultActiveIndex", () => {
    const { getAllByTestId } = render(
      <Carousel defaultActiveIndex={1}>{items}</Carousel>
    )
    const carouselItems = getAllByTestId(CarouselItemTestId)
    expect(carouselItems[0].classList.contains("active")).toBe(false)
    expect(carouselItems[1].classList.contains("active")).toBe(true)
  })
  it("should handle falsy children", () => {
    const { getAllByTestId, container } = render(
      <Carousel>
        {null}
        <Item data-testid={CarouselItemTestId}>Item 1 content</Item>
        {false}
        {undefined}
        <Item data-testid={CarouselItemTestId}>Item 2 content</Item>
      </Carousel>
    )
    const carouselItems = getAllByTestId(CarouselItemTestId)
    expect(carouselItems[0].classList.contains("active")).toBe(true)
    expect(carouselItems[0].innerText).toEqual("Item 1 content")
    expect(
      container.querySelectorAll(".carousel-indicators > button")
    ).toHaveLength(2)
  })
  it("should call onSelect when indicator selected", () => {
    const onSelect = jest.fn()
    const { getByLabelText } = render(
      <Carousel activeIndex={1} onSelect={onSelect} interval={null}>
        {items}
      </Carousel>
    )
    fireEvent.click(getByLabelText("Slide 1"))
    expect(onSelect).to.be.calledOnceWith(0)
  })
  it("should render custom indicator labels", () => {
    const indicatorLabels = ["custom1", "custom2", "custom3"]
    const { getByLabelText } = render(
      <Carousel
        activeIndex={1}
        interval={null}
        indicatorLabels={indicatorLabels}
      >
        {items}
      </Carousel>
    )
    for (let i = 0; i < indicatorLabels.length; i++) {
      expect(
        getByLabelText(indicatorLabels[i]!, { selector: "[aria-label]" })
      ).toBeTruthy()
    }
  })
  it("should render variant", () => {
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
    const carousel = getByTestId("test")
    expect(carousel.classList.contains("carousel")).toBe(true)
    expect(carousel.classList.contains("carousel-dark")).toBe(true)
  })
  describe("ref testing", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should allow refs to be attached and expose next, prev functions", () => {
      const ref = React.createRef<Ref>()
      const onSelectSpy = jest.fn()
      render(
        <Carousel ref={ref} onSelect={onSelectSpy} defaultActiveIndex={1}>
          {items}
        </Carousel>
      )
      expect(ref.current!).to.have.property("next")
      expect(ref.current!).to.have.property("prev")
      expect(ref.current!)
        .to.have.property("element")
        .and.instanceOf(HTMLElement)
      ref.current!.next()
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
      ref.current!.prev()
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(2)
    })
  })
  ;["onSlide", "onSlid"].forEach(eventName => {
    it(`should call ${eventName} with previous index and direction`, done => {
      function onEvent(index, direction) {
        expect(index).toEqual(0)
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
    it(`should call ${eventName} with next index and direction`, done => {
      function onEvent(index, direction) {
        const lastPossibleIndex = items.length - 1
        expect(index).toEqual(lastPossibleIndex)
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
    it("should show back button control on the first image if wrap is true", () => {
      const { container } = render(
        <Carousel controls wrap>
          {items}
        </Carousel>
      )
      expect(
        container.querySelectorAll("a.carousel-control-prev")
      ).toHaveLength(1)
    })
    it("should show next button control on the last image if wrap is true", () => {
      const lastElementIndex = items.length - 1
      const { container } = render(
        <Carousel defaultActiveIndex={lastElementIndex} controls wrap>
          {items}
        </Carousel>
      )
      expect(
        container.querySelectorAll("a.carousel-control-next")
      ).toHaveLength(1)
    })
    it("should not show the prev button on the first image if wrap is false", () => {
      const { container } = render(
        <Carousel controls wrap={false}>
          {items}
        </Carousel>
      )
      expect(
        container.querySelectorAll("a.carousel-control-prev")
      ).toHaveLength(0)
    })
    it("should not show the next button on the last image if wrap is false", () => {
      const lastElementIndex = items.length - 1
      const { container } = render(
        <Carousel defaultActiveIndex={lastElementIndex} controls wrap={false}>
          {items}
        </Carousel>
      )
      expect(
        container.querySelectorAll("a.carousel-control-next")
      ).toHaveLength(0)
    })
  })
  it("should allow the user to specify a previous and next icon", () => {
    const { getByTestId } = render(
      <Carousel
        controls
        defaultActiveIndex={1}
        prevIcon={<span className="ficon ficon-left" data-testid="prev-icon" />}
        nextIcon={
          <span className="ficon ficon-right" data-testid="next-icon" />
        }
      >
        {items}
      </Carousel>
    )
    expect(getByTestId("prev-icon").classList.contains("ficon-left")).toBe(true)
    expect(getByTestId("next-icon").classList.contains("ficon-right")).toBe(
      true
    )
  })
  it("should allow user to specify a previous and next SR label", () => {
    const { container } = render(
      <Carousel
        controls
        defaultActiveIndex={1}
        prevLabel="Previous awesomeness"
        nextLabel="Next awesomeness"
      >
        {items}
      </Carousel>
    )
    const labels = container.querySelectorAll<HTMLElement>(".visually-hidden")
    expect(labels).toHaveLength(2)
    expect(labels[0]!.innerText).toContain("Previous awesomeness")
    expect(labels[1]!.innerText).toContain("Next awesomeness")
  })
  it("should not render labels when values are null or undefined", () => {
    // undefined (as in nothing passed) renders default labels
    ;[null, ""].forEach(falsyValue => {
      const { container } = render(
        <Carousel
          controls
          defaultActiveIndex={1}
          prevLabel={falsyValue}
          nextLabel={falsyValue}
        >
          {items}
        </Carousel>
      )
      expect(container.querySelectorAll(".visually-hidden")).toHaveLength(
        0,
        `should not render labels for value ${falsyValue}`
      )
    })
  })
  it("should transition properly when slide animation is disabled", () => {
    const spy = jest.fn()
    const { container } = render(
      <Carousel slide={false} onSelect={spy}>
        {items}
      </Carousel>
    )
    fireEvent.click(
      container.querySelector<HTMLElement>("a.carousel-control-next")!
    )
    expect(spy).toHaveBeenCalledTimes(1)
    fireEvent.click(
      container.querySelector<HTMLElement>("a.carousel-control-prev")!
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it("should render on update, active item > new child length", () => {
    const { queryAllByLabelText, queryAllByText, rerender } = render(
      <Carousel defaultActiveIndex={items.length - 1}>{items}</Carousel>
    )
    expect(
      queryAllByLabelText(/Slide/, {
        selector: ".carousel-indicators > button",
      })
    ).toHaveLength(items.length)
    const fewerItems = items.slice(2)
    rerender(
      <Carousel defaultActiveIndex={items.length - 1}>{fewerItems}</Carousel>
    )
    expect(
      queryAllByLabelText(/Slide/, {
        selector: ".carousel-indicators > button",
      })
    ).toHaveLength(fewerItems.length)
    expect(
      queryAllByText(/Item \d content/, {
        selector: "div.carousel-item",
      })
    ).toHaveLength(fewerItems.length)
  })
  it("should render correctly when fade is set", () => {
    const { getByTestId } = render(
      <Carousel defaultActiveIndex={1} fade data-testid="test">
        {items}
      </Carousel>
    )
    expect(getByTestId("test").classList.contains("carousel-fade")).toBe(true)
  })
  describe("automatic traversal", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should go through the items after given seconds", () => {
      const onSelectSpy = jest.fn()
      const interval = 500
      render(
        <Carousel interval={interval} onSelect={onSelectSpy}>
          {items}
        </Carousel>
      )
      clock.tick(interval * 1.5)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
    })
    it("should go through the items given the specified intervals", () => {
      const onSelectSpy = jest.fn()
      render(
        <Carousel interval={5000} onSelect={onSelectSpy}>
          <Item interval={1000}>Item 1 content</Item>
          <Item>Item 2 content</Item>
        </Carousel>
      )
      // should be long enough to handle false positive issues
      // but short enough to not trigger auto-play to occur twice
      // (since the interval for the second item should be `5000`)
      clock.tick(1100)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(1)
    })
    it("should stop going through items on hover and continue afterwards", () => {
      const onSelectSpy = jest.fn()
      const interval = 500
      const { getByTestId } = render(
        <Carousel interval={interval} onSelect={onSelectSpy} data-testid="test">
          {items}
        </Carousel>
      )
      const carousel = getByTestId("test")
      fireEvent.mouseOver(carousel)
      clock.tick(interval * 1.5)
      expect(onSelectSpy).not.toHaveBeenCalled()
      fireEvent.mouseOut(carousel)
      clock.tick(interval * 1.5)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
    })
    it("should ignore hover if the prop is passed", () => {
      const onSelectSpy = jest.fn()
      const interval = 500
      const { getByTestId } = render(
        <Carousel
          interval={interval}
          onSelect={onSelectSpy}
          pause={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.mouseOver(getByTestId("test"))
      clock.tick(interval * 1.5)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
    })
    it("should stop going through the items after unmounting", () => {
      const onSelectSpy = jest.fn()
      const interval = 500
      const { unmount } = render(
        <Carousel interval={interval} onSelect={onSelectSpy}>
          {items}
        </Carousel>
      )
      unmount()
      clock.tick(interval * 1.5)
      expect(onSelectSpy).not.toHaveBeenCalled()
    })
  })
  describe("wrapping", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should wrap to last from first", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={0} onSelect={onSelectSpy} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowLeft",
      })
      clock.tick(50)
      expect(onSelectSpy)
        .toHaveBeenCalledTimes(1)
        .With(items.length - 1)
    })
    it("should wrap from first to last", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel
          activeIndex={items.length - 1}
          onSelect={onSelectSpy}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowRight",
      })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(0)
    })
    ;[
      {
        caseName: "previous at first",
        activeIndex: 0,
        eventPayload: {
          key: "ArrowLeft",
        },
      },
      {
        caseName: "next at last",
        activeIndex: items.length - 1,
        eventPayload: {
          key: "ArrowRight",
        },
      },
    ].forEach(({ caseName, activeIndex, eventPayload }) => {
      it(`should not wrap with wrap unset for ${caseName}`, () => {
        const onSelectSpy = jest.fn()
        const { getByTestId, getAllByTestId } = render(
          <Carousel
            activeIndex={activeIndex}
            wrap={false}
            onSelect={onSelectSpy}
            data-testid="test"
          >
            {items}
          </Carousel>
        )
        const carousel = getByTestId("test")
        fireEvent.keyDown(carousel, eventPayload)
        clock.tick(50)
        const carouselItems = getAllByTestId(CarouselItemTestId)
        expect(carouselItems[activeIndex].classList.contains("active")).toBe(
          true
        )
        expect(onSelectSpy).not.toHaveBeenCalled()
      })
    })
  })
  describe("keyboard events", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should go back for the keyboard event ArrowLeft", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onSelect={onSelectSpy} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowLeft",
      })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(0)
    })
    it("should go forward for the keyboard event ArrowRight", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onSelect={onSelectSpy} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowRight",
      })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(2)
    })
    it("should ignore keyEvents when the keyboard is disabled", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel
          activeIndex={1}
          onSelect={onSelectSpy}
          keyboard={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowRight",
      })
      clock.tick(50)
      expect(onSelectSpy).not.toHaveBeenCalled()
    })
    it("should handle a defined custom key event", () => {
      const onKeyDownSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onKeyDown={onKeyDownSpy} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowUp",
      })
      clock.tick(50)
      expect(onKeyDownSpy).toHaveBeenCalledTimes(1)
    })
    ;["ArrowUp", "ArrowRightLeft", "Onwards"].forEach(key => {
      it("should do nothing for non left or right keys", () => {
        const onSelectSpy = jest.fn()
        const { getByTestId } = render(
          <Carousel activeIndex={1} onSelect={onSelectSpy} data-testid="test">
            {items}
          </Carousel>
        )
        fireEvent.keyDown(getByTestId("test"), {
          key,
        })
        clock.tick(50)
        sinon.assert.notCalled(onSelectSpy)
      })
    })
  })
  describe("mouse events", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should handle a defined mouse over event", () => {
      const onMouseOverSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel
          activeIndex={1}
          onMouseOver={onMouseOverSpy}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      fireEvent.mouseOver(getByTestId("test"))
      clock.tick(1500)
      expect(onMouseOverSpy).toHaveBeenCalledTimes(1)
    })
    it("should handle a defined mouse out event", () => {
      const onMouseOutSpy = jest.fn()
      const { getByTestId } = render(
        <Carousel activeIndex={1} onMouseOut={onMouseOutSpy} data-testid="test">
          {items}
        </Carousel>
      )
      fireEvent.mouseOut(getByTestId("test"))
      clock.tick(50)
      expect(onMouseOutSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe("touch events", () => {
    let clock: sinon.SinonFakeTimers,
      renderResult: RenderResult,
      carousel: HTMLElement,
      onSelectSpy: sinon.SinonSpy,
      onTouchStartSpy: sinon.SinonSpy,
      onTouchMoveSpy: sinon.SinonSpy,
      onTouchEndSpy: sinon.SinonSpy
    beforeEach(() => {
      onSelectSpy = jest.fn()
      onTouchStartSpy = jest.fn()
      onTouchMoveSpy = jest.fn()
      onTouchEndSpy = jest.fn()
      renderResult = render(
        <Carousel
          activeIndex={1}
          interval={null}
          onSelect={onSelectSpy}
          onTouchStart={onTouchStartSpy}
          onTouchMove={onTouchMoveSpy}
          onTouchEnd={onTouchEndSpy}
          touch
          data-testid="carousel-test"
        >
          {items}
        </Carousel>
      )
      carousel = renderResult.getByTestId("carousel-test")
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    function generateTouchEvents(params: {
      target: HTMLElement
      startX: number
      endX: number
    }): void {
      const { target, startX, endX } = params
      /**
       * Below code is not working on Firefox due to Touch is not defined error.
       * Maybe related to {@link https://bugzilla.mozilla.org/show_bug.cgi?id=1693172}?
       *
       * To avoid issue we are going to use {@link import('react-dom').Simulate} (used by enzyme internally)
       */
      // fireEvent.touchStart(target, {
      //   touches: [new Touch({ identifier: 1, target, clientX: startX })],
      // });
      // fireEvent.touchMove(target, {
      //   touches: [new Touch({ identifier: 1, target, clientX: endX })],
      // });
      // fireEvent.touchEnd(target);
      Simulate.touchStart(target, {
        touches: [{ identifier: 1, target, clientX: startX }] as never,
      })
      Simulate.touchMove(target, {
        touches: [{ identifier: 1, target, clientX: endX }] as never,
      })
      Simulate.touchEnd(target)
    }
    it("should swipe right", () => {
      generateTouchEvents({ target: carousel, startX: 50, endX: 0 })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(2)
    })
    it("should swipe left", () => {
      generateTouchEvents({ target: carousel, startX: 0, endX: 50 })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(0)
    })
    it("should not swipe if swipe detected is under the swipe threshold", () => {
      generateTouchEvents({ target: carousel, startX: 0, endX: 35 })
      clock.tick(50)
      expect(onSelectSpy).not.toHaveBeenCalled()
    })
    it("should handle a custom touch start and end event", () => {
      generateTouchEvents({ target: carousel, startX: 50, endX: 0 })
      clock.tick(50)
      expect(onTouchStartSpy).toHaveBeenCalledTimes(1)
      expect(onTouchMoveSpy).toHaveBeenCalledTimes(1)
      expect(onTouchEndSpy).toHaveBeenCalledTimes(1)
    })
    it("should handle a custom multi-touch move event", () => {
      /** @see generateTouchEvents */
      // fireEvent.touchMove(carousel, {
      //   touches: [
      //     new Touch({ identifier: 1, target: carousel, clientX: 0 }),
      //     new Touch({ identifier: 1, target: carousel, clientX: 50 }),
      //   ],
      // });
      Simulate.touchMove(carousel, {
        touches: [
          { identifier: 1, target: carousel, clientX: 0 },
          { identifier: 1, target: carousel, clientX: 50 },
        ] as never,
      })
      clock.tick(50)
      expect(onTouchMoveSpy).toHaveBeenCalledTimes(1)
    })
    it("should do nothing with disabled touch right", () => {
      const { getByTestId, container } = render(
        <Carousel
          activeIndex={1}
          interval={null}
          onSelect={onSelectSpy}
          touch={false}
          data-testid="test"
        >
          {items}
        </Carousel>
      )
      const noTouchCarousel = getByTestId("test")
      generateTouchEvents({ target: noTouchCarousel, startX: 50, endX: 0 })
      clock.tick(50)
      expect(onSelectSpy).not.toHaveBeenCalled()
      const carouselItems = container.querySelectorAll(".carousel-item")
      expect(carouselItems).toHaveLength(3)
      expect(carouselItems[1]!.classList.contains("active")).toBe(true)
    })
  })
  describe("callback tests", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should call onSlide when slide animation is disabled", () => {
      const onSlideSpy = jest.fn()
      const onSelectSpy = jest.fn()
      const { container } = render(
        <Carousel slide={false} onSelect={onSelectSpy} onSlide={onSlideSpy}>
          {items}
        </Carousel>
      )
      fireEvent.click(
        container.querySelector<HTMLElement>("a.carousel-control-next")!
      )
      clock.tick(150)
      expect(onSlideSpy).toHaveBeenCalledTimes(1)
      fireEvent.click(
        container.querySelector<HTMLElement>("a.carousel-control-prev")!
      )
      clock.tick(150)
      expect(onSlideSpy).toHaveBeenCalledTimes(2)
    })
    it("should call onSlid when slide animation is disabled", () => {
      const onSlidSpy = jest.fn()
      const onSelectSpy = jest.fn()
      const { container } = render(
        <Carousel slide={false} onSelect={onSelectSpy} onSlid={onSlidSpy}>
          {items}
        </Carousel>
      )
      fireEvent.click(
        container.querySelector<HTMLElement>("a.carousel-control-next")!
      )
      clock.tick(150)
      expect(onSlidSpy).toHaveBeenCalledTimes(1)
      fireEvent.click(
        container.querySelector<HTMLElement>("a.carousel-control-prev")!
      )
      clock.tick(150)
      expect(onSlidSpy).toHaveBeenCalledTimes(2)
    })
    it("should transition/call onSelect once if previous arrow double clicked", () => {
      const onSelectSpy = jest.fn()
      const { container } = render(
        <Carousel onSelect={onSelectSpy}>{items}</Carousel>
      )
      const prev = container.querySelector<HTMLElement>(
        "a.carousel-control-prev"
      )!
      fireEvent.click(prev)
      fireEvent.click(prev)
      clock.tick(1000)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
    })
    it("should transition/call onSelect once if next arrow double clicked", () => {
      const onSelectSpy = jest.fn()
      const { container } = render(
        <Carousel onSelect={onSelectSpy}>{items}</Carousel>
      )
      const next = container.querySelector<HTMLElement>(
        "a.carousel-control-next"
      )!
      fireEvent.click(next)
      fireEvent.click(next)
      clock.tick(1000)
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe("RTL", () => {
    let clock: sinon.SinonFakeTimers
    beforeEach(() => {
      clock = sinon.useFakeTimers()
    })
    afterEach(() => {
      clock.restore()
    })
    it("should slide in correct direction on ArrowLeft when dir=rtl", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={onSelectSpy} data-testid="test">
            {items}
          </Carousel>
        </Theme>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowLeft",
      })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(2)
    })
    it("should slide in correct direction on ArrowLeft when dir=rtl", () => {
      const onSelectSpy = jest.fn()
      const { getByTestId } = render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={onSelectSpy} data-testid="test">
            {items}
          </Carousel>
        </Theme>
      )
      fireEvent.keyDown(getByTestId("test"), {
        key: "ArrowRight",
      })
      clock.tick(50)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(0)
    })
    it("should slide in correct direction automatically when dir=rtl", () => {
      const onSelectSpy = jest.fn()
      const interval = 300
      render(
        <Theme dir="rtl">
          <Carousel activeIndex={1} onSelect={onSelectSpy} interval={interval}>
            {items}
          </Carousel>
        </Theme>
      )
      clock.tick(interval * 1.5)
      expect(onSelectSpy).toHaveBeenCalledTimes(1).With(0)
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
    const captionWrapper = getByTestId("test")
    expect(captionWrapper.tagName.toLowerCase()).toEqual("div")
    expect(captionWrapper.classList.contains("carousel-caption")).toBe(true)
    expect(captionWrapper.classList.contains("custom-class")).toBe(true)
    const content = getByText("Children")
    expect(content.tagName.toLowerCase()).toEqual("strong")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(<Caption as="section" data-testid="test" />)
    const caption = getByTestId("test")
    expect(caption.tagName.toLowerCase()).toEqual("section")
    expect(caption.classList.contains("carousel-caption")).toBe(true)
  })
})
