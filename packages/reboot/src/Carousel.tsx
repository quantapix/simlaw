import { Anchor } from "./base/Anchor.js"
import { useBs, useIsRTL } from "./Theme.js"
import { Wrapper } from "./Wrapper.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { TransitionStatus } from "react-transition-group"

export const Caption = qu.withBs("carousel-caption")

export interface ItemProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  interval?: number
}

export const Item: qt.BsRef<"div", ItemProps> = qr.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: X = "div", bsPrefix, className, ...ps }, ref) => {
  const n = qt.classNames(className, useBs(bsPrefix, "carousel-item"))
  return <X ref={ref} {...ps} className={n} />
})
Item.displayName = "CarouselItem"

export type Variant = "dark" | string

export interface Ref {
  element?: HTMLElement | undefined
  prev: (e?: qr.SyntheticEvent) => void
  next: (e?: qr.SyntheticEvent) => void
}

export interface Props
  extends qt.BsProps,
    Omit<qr.HTMLAttributes<HTMLElement>, "onSelect"> {
  slide?: boolean
  fade?: boolean
  controls?: boolean
  indicators?: boolean
  indicatorLabels?: string[]
  activeIndex?: number
  onSelect?: (eventKey: number, e: Record<string, unknown> | null) => void
  defaultActiveIndex?: number
  onSlide?: (eventKey: number, direction: "start" | "end") => void
  onSlid?: (eventKey: number, direction: "start" | "end") => void
  interval?: number | null
  keyboard?: boolean
  pause?: "hover" | false | undefined
  wrap?: boolean
  touch?: boolean
  prevIcon?: qr.ReactNode
  prevLabel?: qr.ReactNode
  nextIcon?: qr.ReactNode
  nextLabel?: qr.ReactNode
  ref?: qr.Ref<Ref> | undefined
  variant?: Variant
}

const SWIPE_THRESHOLD = 40

function isVisible(x: any) {
  if (!x || !x.style || !x.parentNode || !x.parentNode.style) {
    return false
  }
  const s = getComputedStyle(x)
  return (
    s.display !== "none" &&
    s.visibility !== "hidden" &&
    getComputedStyle(x.parentNode).display !== "none"
  )
}

export const Carousel: qt.BsRef<"div", Props> = qr.forwardRef<Ref, Props>(
  (xs: Props, ref) => {
    const {
      activeIndex,
      as: X = "div",
      bsPrefix,
      children,
      className,
      controls,
      fade,
      indicatorLabels,
      indicators,
      interval,
      keyboard,
      nextIcon,
      nextLabel,
      onKeyDown,
      onMouseOut,
      onMouseOver,
      onSelect,
      onSlid,
      onSlide,
      onTouchEnd,
      onTouchMove,
      onTouchStart,
      pause,
      prevIcon,
      prevLabel,
      slide,
      touch,
      variant,
      wrap,
      ...ps
    } = qh.useUncontrolled(xs, { activeIndex: "onSelect" })
    const bs = useBs(bsPrefix, "carousel")
    const isRTL = useIsRTL()
    const nextRef = qr.useRef<string | null>(null)
    const [direction, setDirection] = qr.useState("next")
    const [paused, setPaused] = qr.useState(false)
    const [isSliding, setIsSliding] = qr.useState(false)
    const [renderedIdx, setRenderedIdx] = qr.useState<number>(activeIndex || 0)
    qr.useEffect(() => {
      if (!isSliding && activeIndex !== renderedIdx) {
        if (nextRef.current) {
          setDirection(nextRef.current)
        } else {
          setDirection((activeIndex || 0) > renderedIdx ? "next" : "prev")
        }
        if (slide) {
          setIsSliding(true)
        }
        setRenderedIdx(activeIndex || 0)
      }
    }, [activeIndex, isSliding, renderedIdx, slide])
    qr.useEffect(() => {
      if (nextRef.current) {
        nextRef.current = null
      }
    })
    let n = 0
    let activeInterval: number | undefined
    qu.forEach(children, (x, i) => {
      ++n
      if (i === activeIndex) {
        activeInterval = x.props.interval as number | undefined
      }
    })
    const activeChildIntervalRef = qh.useCommittedRef(activeInterval)
    const doPrev = qr.useCallback(
      (e?: any) => {
        if (isSliding) {
          return
        }
        let i = renderedIdx - 1
        if (i < 0) {
          if (!wrap) {
            return
          }
          i = n - 1
        }
        nextRef.current = "prev"
        onSelect?.(i, e)
      },
      [isSliding, renderedIdx, onSelect, wrap, n]
    )
    const doNext = qh.useEventCB((e?) => {
      if (isSliding) {
        return
      }
      let i = renderedIdx + 1
      if (i >= n) {
        if (!wrap) {
          return
        }
        i = 0
      }
      nextRef.current = "next"
      onSelect?.(i, e)
    })
    const elementRef = qr.useRef<HTMLElement>()
    qr.useImperativeHandle(ref, () => ({
      element: elementRef.current,
      prev: doPrev,
      next: doNext,
    }))
    const doNextWhenVisible = qh.useEventCB(() => {
      if (!document.hidden && isVisible(elementRef.current)) {
        if (isRTL) {
          doPrev()
        } else {
          doNext()
        }
      }
    })
    const slideDirection = direction === "next" ? "start" : "end"
    qh.useUpdateEffect(() => {
      if (slide) {
        return
      }
      onSlide?.(renderedIdx, slideDirection)
      onSlid?.(renderedIdx, slideDirection)
    }, [renderedIdx])
    const orderClassName = `${bs}-item-${direction}`
    const directionalClassName = `${bs}-item-${slideDirection}`
    const doEnter = qr.useCallback(
      (x: HTMLElement) => {
        qu.triggerReflow(x)
        onSlide?.(renderedIdx, slideDirection)
      },
      [onSlide, renderedIdx, slideDirection]
    )
    const doEntered = qr.useCallback(() => {
      setIsSliding(false)
      onSlid?.(renderedIdx, slideDirection)
    }, [onSlid, renderedIdx, slideDirection])
    const doKeyDown = qr.useCallback(
      (e: any) => {
        if (keyboard && !/input|textarea/i.test(e.target.tagName)) {
          switch (e.key) {
            case "ArrowLeft":
              e.preventDefault()
              if (isRTL) {
                doNext(e)
              } else {
                doPrev(e)
              }
              return
            case "ArrowRight":
              e.preventDefault()
              if (isRTL) {
                doPrev(e)
              } else {
                doNext(e)
              }
              return
            default:
          }
        }
        onKeyDown?.(e)
      },
      [keyboard, onKeyDown, doPrev, doNext, isRTL]
    )
    const doMouseOver = qr.useCallback(
      (e: any) => {
        if (pause === "hover") {
          setPaused(true)
        }
        onMouseOver?.(e)
      },
      [pause, onMouseOver]
    )
    const doMouseOut = qr.useCallback(
      (e: any) => {
        setPaused(false)
        onMouseOut?.(e)
      },
      [onMouseOut]
    )
    const touchStartXRef = qr.useRef(0)
    const touchDeltaXRef = qr.useRef(0)
    const touchUnpauseTimeout = qh.useTimeout()
    const doTouchStart = qr.useCallback(
      (e: any) => {
        touchStartXRef.current = e.touches[0].clientX
        touchDeltaXRef.current = 0
        if (pause === "hover") {
          setPaused(true)
        }
        onTouchStart?.(e)
      },
      [pause, onTouchStart]
    )
    const doTouchMove = qr.useCallback(
      (e: any) => {
        if (e.touches && e.touches.length > 1) {
          touchDeltaXRef.current = 0
        } else {
          touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current
        }
        onTouchMove?.(e)
      },
      [onTouchMove]
    )
    const doTouchEnd = qr.useCallback(
      (e: any) => {
        if (touch) {
          const touchDeltaX = touchDeltaXRef.current
          if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
            if (touchDeltaX > 0) {
              doPrev(e)
            } else {
              doNext(e)
            }
          }
        }
        if (pause === "hover") {
          touchUnpauseTimeout.set(() => {
            setPaused(false)
          }, interval || undefined)
        }
        onTouchEnd?.(e)
      },
      [touch, pause, doPrev, doNext, touchUnpauseTimeout, interval, onTouchEnd]
    )
    const shouldPlay = interval != null && !paused && !isSliding
    const intervalHandleRef = qr.useRef<number | null>()
    qr.useEffect(() => {
      if (!shouldPlay) {
        return undefined
      }
      const nextFunc = isRTL ? doPrev : doNext
      intervalHandleRef.current = window.setInterval(
        document.visibilityState ? doNextWhenVisible : nextFunc,
        activeChildIntervalRef.current ?? interval ?? undefined
      )
      return () => {
        if (intervalHandleRef.current !== null) {
          clearInterval(intervalHandleRef.current)
        }
      }
    }, [
      shouldPlay,
      doPrev,
      doNext,
      activeChildIntervalRef,
      interval,
      doNextWhenVisible,
      isRTL,
    ])
    const onClicks = qr.useMemo(
      () =>
        indicators &&
        Array.from({ length: n }, (_, index) => (e: any) => {
          onSelect?.(index, e)
        }),
      [indicators, n, onSelect]
    )
    return (
      <X
        ref={elementRef}
        {...ps}
        onKeyDown={doKeyDown}
        onMouseOver={doMouseOver}
        onMouseOut={doMouseOut}
        onTouchStart={doTouchStart}
        onTouchMove={doTouchMove}
        onTouchEnd={doTouchEnd}
        className={qt.classNames(
          className,
          bs,
          slide && "slide",
          fade && `${bs}-fade`,
          variant && `${bs}-${variant}`
        )}
      >
        {indicators && (
          <div className={`${bs}-indicators`}>
            {qu.map(children, (_, i) => (
              <button
                key={i}
                type="button"
                data-bs-target=""
                aria-label={
                  indicatorLabels?.length
                    ? indicatorLabels[i]
                    : `Slide ${i + 1}`
                }
                className={i === renderedIdx ? "active" : undefined}
                onClick={onClicks ? onClicks[i] : undefined}
                aria-current={i === renderedIdx}
              />
            ))}
          </div>
        )}
        <div className={`${bs}-inner`}>
          {qu.map(children, (x, i) => {
            const isActive = i === renderedIdx
            return slide ? (
              <Wrapper
                in={isActive}
                onEnter={isActive ? doEnter : undefined}
                onEntered={isActive ? doEntered : undefined}
                addEndListener={qu.endListener}
              >
                {(status: TransitionStatus, ps2: Record<string, unknown>) =>
                  qr.cloneElement(x, {
                    ...ps2,
                    className: qt.classNames(
                      x.props.className,
                      isActive && status !== "entered" && orderClassName,
                      (status === "entered" || status === "exiting") &&
                        "active",
                      (status === "entering" || status === "exiting") &&
                        directionalClassName
                    ),
                  })
                }
              </Wrapper>
            ) : (
              qr.cloneElement(x, {
                className: qt.classNames(
                  x.props.className,
                  isActive && "active"
                ),
              })
            )
          })}
        </div>
        {controls && (
          <>
            {(wrap || activeIndex !== 0) && (
              <Anchor className={`${bs}-control-prev`} onClick={doPrev}>
                {prevIcon}
                {prevLabel && (
                  <span className="visually-hidden">{prevLabel}</span>
                )}
              </Anchor>
            )}
            {(wrap || activeIndex !== n - 1) && (
              <Anchor className={`${bs}-control-next`} onClick={doNext}>
                {nextIcon}
                {nextLabel && (
                  <span className="visually-hidden">{nextLabel}</span>
                )}
              </Anchor>
            )}
          </>
        )}
      </X>
    )
  }
)
Carousel.displayName = "Carousel"
Carousel.defaultProps = {
  slide: true,
  fade: false,
  controls: true,
  indicators: true,
  indicatorLabels: [],
  defaultActiveIndex: 0,
  interval: 5000,
  keyboard: true,
  pause: "hover" as Props["pause"],
  wrap: true,
  touch: true,
  prevIcon: <span aria-hidden="true" className="carousel-control-prev-icon" />,
  prevLabel: "Previous",
  nextIcon: <span aria-hidden="true" className="carousel-control-next-icon" />,
  nextLabel: "Next",
}
