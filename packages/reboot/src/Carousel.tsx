import * as React from "react"
import useEventCallback from "@restart/hooks/useEventCallback"
import useUpdateEffect from "@restart/hooks/useUpdateEffect"
import useCommittedRef from "@restart/hooks/useCommittedRef"
import useTimeout from "@restart/hooks/useTimeout"
import Anchor from "@restart/ui/Anchor"
import { TransitionStatus } from "react-transition-group/Transition"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useUncontrolled } from "./use.jsx"
import { map, forEach, triggerReflow, withBs, endListener } from "./utils.jsx"
import { useBs, useIsRTL } from "./Theme.jsx"
import { classNames, BsProps, BsRefComp } from "./helpers.js"
import { Wrapper } from "./Transition.jsx"

export const Caption = withBs("carousel-caption")

export interface ItemProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  interval?: number
}

export const Item: BsRefComp<"div", ItemProps> = React.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: X = "div", bsPrefix, className, ...ps }, ref) => {
  const n = classNames(className, useBs(bsPrefix, "carousel-item"))
  return <X ref={ref} {...ps} className={n} />
})
Item.displayName = "CarouselItem"

export type Variant = "dark" | string

export interface Ref {
  element?: HTMLElement
  prev: (e?: React.SyntheticEvent) => void
  next: (e?: React.SyntheticEvent) => void
}

export interface Props
  extends BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  slide?: boolean
  fade?: boolean
  controls?: boolean
  indicators?: boolean
  indicatorLabels?: string[]
  activeIndex?: number
  onSelect?: (eventKey: number, event: Record<string, unknown> | null) => void
  defaultActiveIndex?: number
  onSlide?: (eventKey: number, direction: "start" | "end") => void
  onSlid?: (eventKey: number, direction: "start" | "end") => void
  interval?: number | null
  keyboard?: boolean
  pause?: "hover" | false
  wrap?: boolean
  touch?: boolean
  prevIcon?: React.ReactNode
  prevLabel?: React.ReactNode
  nextIcon?: React.ReactNode
  nextLabel?: React.ReactNode
  ref?: React.Ref<Ref>
  variant?: Variant
}

const SWIPE_THRESHOLD = 40

function isVisible(x) {
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

export const Carousel: BsRefComp<"div", Props> = React.forwardRef<Ref, Props>(
  (xs, ref) => {
    const {
      as: X = "div",
      bsPrefix,
      slide,
      fade,
      controls,
      indicators,
      indicatorLabels,
      activeIndex,
      onSelect,
      onSlide,
      onSlid,
      interval,
      keyboard,
      onKeyDown,
      pause,
      onMouseOver,
      onMouseOut,
      wrap,
      touch,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      prevIcon,
      prevLabel,
      nextIcon,
      nextLabel,
      variant,
      className,
      children,
      ...ps
    } = useUncontrolled(xs, {
      activeIndex: "onSelect",
    })
    const bs = useBs(bsPrefix, "carousel")
    const isRTL = useIsRTL()
    const nextRef = useRef<string | null>(null)
    const [direction, setDirection] = useState("next")
    const [paused, setPaused] = useState(false)
    const [isSliding, setIsSliding] = useState(false)
    const [renderedIdx, setRenderedIdx] = useState<number>(activeIndex || 0)
    useEffect(() => {
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
    useEffect(() => {
      if (nextRef.current) {
        nextRef.current = null
      }
    })
    let numChildren = 0
    let activeChildInterval: number | undefined
    forEach(children, (x, i) => {
      ++numChildren
      if (i === activeIndex) {
        activeChildInterval = x.props.interval as number | undefined
      }
    })
    const activeChildIntervalRef = useCommittedRef(activeChildInterval)
    const prev = useCallback(
      (event?) => {
        if (isSliding) {
          return
        }
        let nextActiveIndex = renderedIdx - 1
        if (nextActiveIndex < 0) {
          if (!wrap) {
            return
          }
          nextActiveIndex = numChildren - 1
        }
        nextRef.current = "prev"
        onSelect?.(nextActiveIndex, event)
      },
      [isSliding, renderedIdx, onSelect, wrap, numChildren]
    )
    const next = useEventCallback((event?) => {
      if (isSliding) {
        return
      }
      let nextActiveIndex = renderedIdx + 1
      if (nextActiveIndex >= numChildren) {
        if (!wrap) {
          return
        }
        nextActiveIndex = 0
      }
      nextRef.current = "next"
      onSelect?.(nextActiveIndex, event)
    })
    const elementRef = useRef<HTMLElement>()
    useImperativeHandle(ref, () => ({
      element: elementRef.current,
      prev,
      next,
    }))
    const nextWhenVisible = useEventCallback(() => {
      if (!document.hidden && isVisible(elementRef.current)) {
        if (isRTL) {
          prev()
        } else {
          next()
        }
      }
    })
    const slideDirection = direction === "next" ? "start" : "end"
    useUpdateEffect(() => {
      if (slide) {
        return
      }
      onSlide?.(renderedIdx, slideDirection)
      onSlid?.(renderedIdx, slideDirection)
    }, [renderedIdx])
    const orderClassName = `${bs}-item-${direction}`
    const directionalClassName = `${bs}-item-${slideDirection}`
    const enter = useCallback(
      node => {
        triggerReflow(node)
        onSlide?.(renderedIdx, slideDirection)
      },
      [onSlide, renderedIdx, slideDirection]
    )
    const entered = useCallback(() => {
      setIsSliding(false)
      onSlid?.(renderedIdx, slideDirection)
    }, [onSlid, renderedIdx, slideDirection])
    const keyDown = useCallback(
      event => {
        if (keyboard && !/input|textarea/i.test(event.target.tagName)) {
          switch (event.key) {
            case "ArrowLeft":
              event.preventDefault()
              if (isRTL) {
                next(event)
              } else {
                prev(event)
              }
              return
            case "ArrowRight":
              event.preventDefault()
              if (isRTL) {
                prev(event)
              } else {
                next(event)
              }
              return
            default:
          }
        }
        onKeyDown?.(event)
      },
      [keyboard, onKeyDown, prev, next, isRTL]
    )
    const mouseOver = useCallback(
      e => {
        if (pause === "hover") {
          setPaused(true)
        }
        onMouseOver?.(e)
      },
      [pause, onMouseOver]
    )
    const mouseOut = useCallback(
      e => {
        setPaused(false)
        onMouseOut?.(e)
      },
      [onMouseOut]
    )
    const touchStartXRef = useRef(0)
    const touchDeltaXRef = useRef(0)
    const touchUnpauseTimeout = useTimeout()
    const touchStart = useCallback(
      e => {
        touchStartXRef.current = e.touches[0].clientX
        touchDeltaXRef.current = 0
        if (pause === "hover") {
          setPaused(true)
        }
        onTouchStart?.(e)
      },
      [pause, onTouchStart]
    )
    const touchMove = useCallback(
      e => {
        if (e.touches && e.touches.length > 1) {
          touchDeltaXRef.current = 0
        } else {
          touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current
        }
        onTouchMove?.(e)
      },
      [onTouchMove]
    )
    const touchEnd = useCallback(
      e => {
        if (touch) {
          const touchDeltaX = touchDeltaXRef.current
          if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
            if (touchDeltaX > 0) {
              prev(e)
            } else {
              next(e)
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
      [touch, pause, prev, next, touchUnpauseTimeout, interval, onTouchEnd]
    )
    const shouldPlay = interval != null && !paused && !isSliding
    const intervalHandleRef = useRef<number | null>()
    useEffect(() => {
      if (!shouldPlay) {
        return undefined
      }
      const nextFunc = isRTL ? prev : next
      intervalHandleRef.current = window.setInterval(
        document.visibilityState ? nextWhenVisible : nextFunc,
        activeChildIntervalRef.current ?? interval ?? undefined
      )
      return () => {
        if (intervalHandleRef.current !== null) {
          clearInterval(intervalHandleRef.current)
        }
      }
    }, [
      shouldPlay,
      prev,
      next,
      activeChildIntervalRef,
      interval,
      nextWhenVisible,
      isRTL,
    ])
    const onClicks = useMemo(
      () =>
        indicators &&
        Array.from({ length: numChildren }, (_, index) => event => {
          onSelect?.(index, event)
        }),
      [indicators, numChildren, onSelect]
    )
    return (
      <X
        ref={elementRef}
        {...ps}
        onKeyDown={keyDown}
        onMouseOver={mouseOver}
        onMouseOut={mouseOut}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
        className={classNames(
          className,
          bs,
          slide && "slide",
          fade && `${bs}-fade`,
          variant && `${bs}-${variant}`
        )}
      >
        {indicators && (
          <div className={`${bs}-indicators`}>
            {map(children, (_, i) => (
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
          {map(children, (x, i) => {
            const isActive = i === renderedIdx
            return slide ? (
              <Wrapper
                in={isActive}
                onEnter={isActive ? enter : undefined}
                onEntered={isActive ? entered : undefined}
                addEndListener={endListener}
              >
                {(
                  status: TransitionStatus,
                  innerProps: Record<string, unknown>
                ) =>
                  React.cloneElement(x, {
                    ...innerProps,
                    className: classNames(
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
              React.cloneElement(x, {
                className: classNames(x.props.className, isActive && "active"),
              })
            )
          })}
        </div>
        {controls && (
          <>
            {(wrap || activeIndex !== 0) && (
              <Anchor className={`${bs}-control-prev`} onClick={prev}>
                {prevIcon}
                {prevLabel && (
                  <span className="visually-hidden">{prevLabel}</span>
                )}
              </Anchor>
            )}
            {(wrap || activeIndex !== numChildren - 1) && (
              <Anchor className={`${bs}-control-next`} onClick={next}>
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
