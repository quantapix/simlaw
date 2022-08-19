import { act } from "react-dom/test-utils"
import { ReactWrapper, mount } from "enzyme"
//import { renderHook, act } from "@testing-library/react-hooks"
import { renderToString } from "react-dom/server"
import { useEffect, useState, useLayoutEffect } from "react"
import React from "react"
import * as qh from "../src/hooks.js"

interface Props {
  breakpoint: qh.DefaultBreakpointMap
}

export function renderHook<T extends (props: P) => any, P = any>(
  fn: T,
  initialProps?: P
): [ReturnType<T>, ReactWrapper<P>] {
  const result = Array(2) as any
  function Wrapper(props: any) {
    result[0] = fn(props)
    return <span />
  }
  result[1] = mount(<Wrapper {...initialProps} />)
  return result
}

describe("useAnimationFrame", () => {
  let rafSpy, rafCancelSpy
  beforeAll(() => {
    rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(cb => {
        return setTimeout(() => cb(1)) as any
      })
    rafCancelSpy = jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(handle => {
        clearTimeout(handle)
      })
  })
  afterAll(() => {
    rafSpy.mockRestore()
    rafCancelSpy.mockRestore()
  })
  it("should requestAnimationFrame", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    const { result } = renderHook(qh.useAnimationFrame)
    act(() => result.current!.request(spy))
    expect(spy).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it("should cancel a request", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    const { result } = renderHook(qh.useAnimationFrame)
    act(() => {
      result.current.request(spy)
      result.current.cancel()
    })
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(0)
  })
  it("should cancel a request on unmount", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    const { result, unmount } = renderHook(qh.useAnimationFrame)
    act(() => result.current!.request(spy))
    unmount()
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(0)
  })
})
describe("useBreakpoint (ssr)", () => {
  it("should match immediately if possible", () => {
    let matches
    const Wrapper = () => {
      matches = qh.useBreakpoint("md")
      return null
    }
    renderToString(<Wrapper />)
    expect(matches).toEqual(false)
  })
})
describe("useBreakpoint", () => {
  let matchMediaSpy: jest.SpyInstance<MediaQueryList, [string]>
  beforeEach(() => {
    matchMediaSpy = jest.spyOn(window, "matchMedia")
    window.resizeTo(1024, window.innerHeight)
  })
  afterEach(() => {
    matchMediaSpy.mockRestore()
  })
  it.each`
    width   | expected | config
    ${1024} | ${false} | ${{ md: "down", sm: "up" }}
    ${600}  | ${true}  | ${{ md: "down", sm: "up" }}
    ${991}  | ${true}  | ${{ md: "down" }}
    ${992}  | ${false} | ${{ md: "down" }}
    ${768}  | ${true}  | ${{ md: "up" }}
    ${576}  | ${false} | ${{ xs: "down" }}
    ${576}  | ${false} | ${{ md: true }}
    ${800}  | ${true}  | ${{ md: true }}
    ${1000} | ${false} | ${{ md: true }}
    ${576}  | ${false} | ${"md"}
    ${800}  | ${true}  | ${"md"}
    ${1000} | ${false} | ${"md"}
    ${500}  | ${true}  | ${{ xs: "down" }}
    ${0}    | ${true}  | ${{ xs: "up" }}
  `(
    "should match: $expected with config: $config at window width: $width",
    ({ width, expected, config }) => {
      window.resizeTo(width, window.innerHeight)
      const { result, unmount } = renderHook(() => qh.useBreakpoint(config))
      expect(result.current).toEqual(expected)
      unmount()
    }
  )
  it("should assume pixels for number values", () => {
    const useCustomBreakpoint = qh.createBreakpointHook({
      xs: 0,
      sm: 400,
      md: 700,
    })
    renderHook(() => useCustomBreakpoint("sm"))
    expect(matchMediaSpy).toBeCalled()
    expect(matchMediaSpy.mock.calls[0][0]).toEqual(
      "(min-width: 400px) and (max-width: 699.8px)"
    )
  })
  it("should use calc for string values", () => {
    const useCustomBreakpoint = qh.createBreakpointHook({
      xs: 0,
      sm: "40rem",
      md: "70rem",
    })
    renderHook(() => useCustomBreakpoint("sm"))
    expect(matchMediaSpy).toBeCalled()
    expect(matchMediaSpy.mock.calls[0][0]).toEqual(
      "(min-width: 40rem) and (max-width: calc(70rem - 0.2px))"
    )
  })
  it("should flatten media", () => {
    const useCustomBreakpoint = qh.createBreakpointHook({
      sm: 400,
      md: 400,
    })
    renderHook(() => useCustomBreakpoint({ sm: "up", md: "up" }))
    expect(matchMediaSpy.mock.calls[0][0]).toEqual("(min-width: 400px)")
  })
})
describe("useCallbackRef", () => {
  it("should update value and be fresh in an effect", () => {
    const effectSpy = jest.fn()
    function Wrapper({ toggle }) {
      const [ref, attachRef] = qh.useCallbackRef<
        HTMLDivElement | HTMLSpanElement
      >()
      useEffect(() => {
        effectSpy(ref)
      }, [ref])
      return toggle ? <div ref={attachRef} /> : <span ref={attachRef} />
    }
    const wrapper = mount(<Wrapper toggle={false} />)
    expect(wrapper.children().type()).toEqual("span")
    expect(effectSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ tagName: "SPAN" })
    )
    act(() => {
      wrapper.setProps({ toggle: true })
    })
    expect(wrapper.children().type()).toEqual("div")
    expect(effectSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ tagName: "DIV" })
    )
  })
})
describe("useCommittedRef", () => {
  it("should use fresh value", () => {
    function Foo({ fn }) {
      const fnRef = qh.useCommittedRef(fn)
      useEffect(() => {
        fnRef.current()
      })
      return null
    }
    const spyA = jest.fn()
    const spyB = jest.fn()
    const { rerender } = renderHook(
      fn => {
        const fnRef = qh.useCommittedRef<any>(fn)
        useEffect(() => {
          fnRef.current()
        })
      },
      { initialProps: spyA }
    )
    rerender(spyB)
    expect(spyA).toHaveBeenCalledTimes(1)
    expect(spyB).toHaveBeenCalledTimes(1)
  })
})
describe("useCustomEffect", () => {
  it("should run custom isEqual logic", () => {
    const teardown = jest.fn()
    const spy = jest.fn().mockImplementation(() => teardown)
    const isEqual = jest.fn((next, prev) => next[0].foo === prev[0].foo)
    const [, wrapper] = renderHook(
      ({ value }) => {
        qh.useCustomEffect(spy, [value], isEqual)
      },
      { value: { foo: true } }
    )
    expect(spy).toHaveBeenCalledTimes(1)
    // matches isEqual
    wrapper.setProps({ value: { foo: true } })
    expect(spy).toHaveBeenCalledTimes(1)
    // update that should trigger
    wrapper.setProps({ value: { foo: false } })
    expect(spy).toHaveBeenCalledTimes(2)
    expect(isEqual).toHaveBeenCalledTimes(2)
    expect(teardown).toBeCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    expect(teardown).toBeCalledTimes(2)
  })
  it("should accept different hooks", () => {
    const spy = jest.fn()
    const hookSpy = jest.fn().mockImplementation(qh.useImmediateUpdateEffect)
    renderHook(
      ({ value }) => {
        qh.useCustomEffect(spy, [value], {
          isEqual: (next, prev) => next[0].foo === prev[0].foo,
          effectHook: hookSpy,
        })
      },
      { value: { foo: true } }
    )
    // the update and unmount hook setup
    expect(hookSpy).toHaveBeenCalledTimes(1)
    // not called b/c useImmediateUpdateEffect doesn't run on initial render
    expect(spy).toHaveBeenCalledTimes(0)
  })
})
describe("useDebouncedCallback", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    const spy = jest.fn()
    let debouncedFn
    function Wrapper() {
      debouncedFn = qh.useDebouncedCallback(spy, 500)
      return <span />
    }
    mount(<Wrapper />)
    debouncedFn(1)
    debouncedFn(2)
    debouncedFn(3)
    expect(spy).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(3)
  })
})
describe("useDebouncedState", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    let outerSetValue
    function Wrapper() {
      const [value, setValue] = qh.useDebouncedState(0, 500)
      outerSetValue = setValue
      return <span>{value}</span>
    }
    const wrapper = mount(<Wrapper />)
    expect(wrapper.text()).toBe("0")
    outerSetValue((cur: number) => cur + 1)
    outerSetValue((cur: number) => cur + 1)
    outerSetValue((cur: number) => cur + 1)
    outerSetValue((cur: number) => cur + 1)
    outerSetValue((cur: number) => cur + 1)
    expect(wrapper.text()).toBe("0")
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(wrapper.text()).toBe("1")
  })
})
describe("useDebouncedValue", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    let count = 0
    function Wrapper({ value }) {
      const debouncedValue = qh.useDebouncedValue(value, 500)
      useEffect(() => {
        count++
      }, [debouncedValue])
      return <span>{debouncedValue}</span>
    }
    act(() => {
      const wrapper = mount(<Wrapper value={0} />)
      expect(wrapper.text()).toBe("0")
      wrapper.setProps({ value: 1 })
      wrapper.setProps({ value: 2 })
      wrapper.setProps({ value: 3 })
      wrapper.setProps({ value: 4 })
      wrapper.setProps({ value: 5 })
      expect(wrapper.text()).toBe("0")
      jest.runAllTimers()
      expect(wrapper.text()).toBe("5")
      expect(count).toBe(2)
    })
  })
})
describe("useForceUpdate", () => {
  it("should return a function that returns mount state", () => {
    let count = 0
    const [forceUpdate] = renderHook(() => {
      count++
      return qh.useForceUpdate()
    })
    expect(count).toEqual(1)
    act(() => {
      forceUpdate()
    })
    expect(count).toEqual(2)
  })
})
describe("useImmediateUpdateEffect", () => {
  it("should run update after value changes", () => {
    const teardown = jest.fn()
    const spy = jest.fn().mockImplementation(() => teardown)
    const [, wrapper] = renderHook(
      ({ value }) => {
        qh.useImmediateUpdateEffect(spy, [value])
      },
      { value: 1, other: false }
    )
    expect(spy).not.toHaveBeenCalled()
    wrapper.setProps({ value: 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    // update that doesn't change the deps Array
    wrapper.setProps({ value: 2, other: true })
    expect(spy).toHaveBeenCalledTimes(1)
    // second update
    wrapper.setProps({ value: 4, other: true })
    expect(teardown).toBeCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    expect(teardown).toBeCalledTimes(2)
  })
})
describe("useIntersectionObserver", () => {
  let observers: any[] = []
  beforeEach(() => {
    ;(window as any).IntersectionObserver = class IntersectionObserverMock {
      observe: jest.Mock<any, any>
      unobserve: jest.Mock<any, any>
      args: [IntersectionObserverCallback, IntersectionObserverEntryInit]
      constructor(handler: any, init: any) {
        this.args = [handler, init]
        this.observe = jest.fn()
        this.unobserve = jest.fn()
        observers.push(this)
      }
    }
  })
  afterEach(() => {
    observers = []
  })
  it("should observe element", async () => {
    const element = document.createElement("span")
    const { result } = renderHook(() => qh.useIntersectionObserver(element))
    const entry = {}
    expect(result.current).toEqual([])
    act(() => {
      observers[0].args[0]([entry])
    })
    expect(result.current[0]).toStrictEqual(entry)
  })
  it("should wait for element", async () => {
    const element = document.createElement("span")
    const { result, rerender, unmount } = renderHook(
      ({ element }) => qh.useIntersectionObserver(element),
      { initialProps: { element: null as any } }
    )
    expect(result.current).toEqual([])
    expect(observers[0].observe).not.toBeCalled()
    rerender({ element })
    expect(observers[0].observe).toBeCalledTimes(1)
    unmount()
    expect(observers[0].unobserve).toBeCalledTimes(1)
  })
  it("should wait for root to set up observer", async () => {
    const root = document.createElement("div")
    const element = document.createElement("span")
    const { result, rerender } = renderHook(
      (root: any) => qh.useIntersectionObserver(element, { root }),
      { initialProps: null }
    )
    expect(observers).toHaveLength(0)
    rerender(root)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toBeCalledTimes(1)
  })
  it("should accept a callback", async () => {
    const spy = jest.fn()
    const element = document.createElement("span")
    const { result } = renderHook(() =>
      qh.useIntersectionObserver(element, spy)
    )
    expect(result.current).toEqual(undefined)
    const entry = {}
    act(() => {
      observers[0].args[0]([entry, observers[0]])
    })
    expect(spy).toBeCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith([entry, observers[0]])
  })
})
describe("useTimeout", () => {
  it("should set an interval", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    function Wrapper() {
      qh.useInterval(spy, 100)
      return <span />
    }
    renderHook(() => qh.useInterval(spy, 100))
    expect(spy).not.toHaveBeenCalled()
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(spy).toHaveBeenCalledTimes(1)
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })
  it("should run immediately when argument is set", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    renderHook(() => qh.useInterval(spy, 100, false, true))
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it("should not run when paused", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    renderHook(() => qh.useInterval(spy, 100, true))
    jest.runOnlyPendingTimers()
    expect(spy).not.toHaveBeenCalled()
  })
  it("should stop running on unmount", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    const { unmount } = renderHook(() => qh.useInterval(spy, 100))
    unmount()
    jest.runOnlyPendingTimers()
    expect(spy).not.toHaveBeenCalled()
  })
})
describe("useIsomorphicEffect (ssr)", () => {
  it("should not run or warn", () => {
    let spy = jest.fn()
    expect(qh.useIsomorphicEffect).toEqual(useEffect)
    const Wrapper = () => {
      qh.useIsomorphicEffect(spy)
      return null
    }
    renderToString(<Wrapper />)
    expect(spy).not.toBeCalled()
  })
})
describe("useIsomorphicEffect", () => {
  it("should not run or warn", () => {
    let spy = jest.fn()
    expect(qh.useIsomorphicEffect).toEqual(useLayoutEffect)
    const Wrapper = () => {
      qh.useIsomorphicEffect(spy)
      return null
    }
    mount(<Wrapper />)
    expect(spy).toBeCalled()
  })
})
describe("useMap", () => {
  describe("ObservableMap", () => {
    it("should implement a Map", () => {
      const map = new qh.ObservableMap(() => {}, [["baz", false]])
      expect(map.size).toEqual(1)
      map.clear()
      expect(map.size).toEqual(0)
      expect(map.set("foo", true)).toEqual(map)
      expect(map.get("foo")).toEqual(true)
      expect(map.size).toEqual(1)
      for (const item of map) {
        expect(item[0]).toEqual("foo")
        expect(item[1]).toEqual(true)
      }
      map.set("bar", false)
      expect(Array.from(map.values())).toEqual([true, false])
      expect(Array.from(map.keys())).toEqual(["foo", "bar"])
      expect(map[Symbol.iterator]).toBeDefined()
      expect(map.delete("bar")).toEqual(true)
      expect(map.size).toEqual(1)
      map.clear()
      expect(map.size).toEqual(0)
    })
    it("should be observable", () => {
      const spy = jest.fn()
      const map = new qh.ObservableMap(spy)
      map.set("foo", true)
      expect(spy).toHaveBeenCalledTimes(1)
      map.set("baz", 3)
      expect(spy).toHaveBeenCalledTimes(2)
      map.delete("baz")
      expect(spy).toHaveBeenCalledTimes(3)
      map.clear()
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })
  it("should rerender when the map is updated", () => {
    let map
    function Wrapper() {
      map = qh.useMap()
      return <span>{JSON.stringify(Array.from(map.entries()))}</span>
    }
    const wrapper = mount(<Wrapper />)
    act(() => {
      map.set("foo", true)
    })
    expect(wrapper.text()).toEqual('[["foo",true]]')
    act(() => {
      map.set("bar", true)
    })
    expect(wrapper.text()).toEqual('[["foo",true],["bar",true]]')
    act(() => {
      map.clear()
    })
    expect(wrapper.text()).toEqual("[]")
  })
})
describe("useMediaQuery (ssr)", () => {
  it("should match immediately if possible", () => {
    let matches
    const Wrapper = ({ media }) => {
      matches = qh.useMediaQuery(media)
      return null
    }
    renderToString(<Wrapper media="min-width: 100px" />)
    expect(matches).toEqual(false)
  })
})
describe("useMediaQuery", () => {
  it("should match immediately if possible", () => {
    let matches
    const Wrapper = ({ media }) => {
      matches = qh.useMediaQuery(media)
      return null
    }
    const wrapper = mount(<Wrapper media="min-width: 100px" />)
    expect(window.innerWidth).toBeGreaterThanOrEqual(100)
    expect(matches).toEqual(true)
    wrapper.setProps({ media: "min-width: 2000px" })
    expect(window.innerWidth).toBeLessThanOrEqual(2000)
    expect(matches).toEqual(false)
  })
  it("should clear if no media is passed", () => {
    let matches
    const Wrapper = ({ media }) => {
      matches = qh.useMediaQuery(media)
      return null
    }
    const wrapper = mount(<Wrapper media={null} />)
    expect(matches).toEqual(false)
    wrapper.setProps({ media: "" })
    expect(matches).toEqual(false)
  })
})
describe("useMergeStateFromProps", () => {
  it("should adjust state when props change", () => {
    const updates = [] as Array<{ props: any; state: any }>
    const getDerivedStateFromProps = (
      nextProps: { foo: any },
      prevState: { lastFoo: any }
    ) => {
      if (nextProps.foo === prevState.lastFoo) return null
      return { bar: 3, lastFoo: nextProps.foo }
    }
    function Foo(props: { foo: any }) {
      const [state] = qh.useMergeStateFromProps(
        props,
        getDerivedStateFromProps,
        {
          lastFoo: props.foo,
        }
      )
      updates.push({ props, state })
      return <div>{JSON.stringify(state)}</div>
    }
    const wrapper = mount(<Foo foo={1} />)
    expect(updates[0].state).toEqual({ lastFoo: 1 })
    wrapper.setProps({ foo: 2 })
    // render with new props, rerender with state change
    expect(updates).toHaveLength(3)
    expect(updates[2].state).toEqual({ lastFoo: 2, bar: 3 })
    wrapper.setProps({ foo: 2, biz: true })
    // render with props, no update
    expect(updates).toHaveLength(4)
    wrapper.setProps({ foo: 3 })
    // render with new props, rerender with state change
    expect(updates).toHaveLength(6)
  })
  it("should adjust state when props change", () => {
    type Props = { foo: number }
    type State = { lastFoo: number }
    const updates = []
    function Foo(props: { foo: any }) {
      const [state, setState] = qh.useMergeStateFromProps<Props, State>(
        props,
        (nextProps, prevState, prevProps: any) => {
          if (nextProps.foo === prevState.lastFoo) return null
          return { bar: 3, lastFoo: nextProps.foo }
        },
        { lastFoo: props.foo }
      )
      updates.push({ props, state })
      return <div>{JSON.stringify(state)}</div>
    }
    const wrapper = mount(<Foo foo={1} />)
    wrapper.setProps({ foo: 2 })
  })
})
describe("useMergedRefs", () => {
  it("should return a function that returns mount state", () => {
    let innerRef: HTMLButtonElement
    const outerRef = React.createRef<HTMLButtonElement>()
    const Button = React.forwardRef((props, ref) => {
      const [buttonEl, attachRef] = qh.useCallbackRef<HTMLButtonElement>()
      innerRef = buttonEl!
      const mergedRef = qh.useMergedRefs(ref, attachRef)
      return <button ref={mergedRef} {...props} />
    })
    // enzyme swallows the ref
    function Wrapper() {
      return <Button ref={outerRef} />
    }
    mount(<Wrapper />)
    expect(innerRef!.tagName).toEqual("BUTTON")
    expect(outerRef.current!.tagName).toEqual("BUTTON")
  })
})
describe("useMountEffect", () => {
  it("should run update only on mount", () => {
    const teardown = jest.fn()
    const spy = jest.fn(() => teardown)
    const [, wrapper] = renderHook(
      () => {
        qh.useMountEffect(spy)
      },
      { value: 1, other: false }
    )
    expect(spy).toHaveBeenCalledTimes(1)
    wrapper.setProps({ value: 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    wrapper.setProps({ value: 2, other: true })
    expect(spy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(teardown).toHaveBeenCalledTimes(1)
  })
})
describe("useMounted", () => {
  it("should return a function that returns mount state", () => {
    let isMounted
    function Wrapper() {
      isMounted = qh.useMounted()
      return <span />
    }
    const wrapper = mount(<Wrapper />)
    expect(isMounted()).toEqual(true)
    wrapper.unmount()
    expect(isMounted()).toEqual(false)
  })
})
describe("useMutationObserver", () => {
  it("should add a mutation observer", async () => {
    const teardown = jest.fn()
    const spy = jest.fn(() => teardown)
    function Wrapper(props) {
      const [el, attachRef] = qh.useCallbackRef<HTMLElement>()
      qh.useMutationObserver(el, { attributes: true }, spy)
      return <div ref={attachRef} {...props} />
    }
    const wrapper = mount(<Wrapper />)
    expect(spy).toHaveBeenCalledTimes(0)
    wrapper.setProps({ role: "button" })
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: "attributes",
          attributeName: "role",
        }),
      ],
      expect.anything()
    )
    // coverage on the teardown
    wrapper.unmount()
  })
  let disconnentSpy: jest.SpyInstance<void, []>
  afterEach(() => {
    disconnentSpy?.mockRestore()
  })
  it("should update config", async () => {
    const teardown = jest.fn()
    const spy = jest.fn(() => teardown)
    disconnentSpy = jest.spyOn(MutationObserver.prototype, "disconnect")
    function Wrapper({ attributeFilter, ...props }) {
      const [el, attachRef] = qh.useCallbackRef<HTMLElement>()
      qh.useMutationObserver(el, { attributes: true, attributeFilter }, spy)
      return <div ref={attachRef} {...props} />
    }
    const wrapper = mount(<Wrapper attributeFilter={["data-name"]} />)
    wrapper.setProps({ role: "presentation" })
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(0)
    wrapper.setProps({ attributeFilter: undefined, role: "button" })
    await Promise.resolve()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          type: "attributes",
          attributeName: "role",
        }),
      ],
      expect.anything()
    )
    expect(disconnentSpy).toBeCalledTimes(1)
    wrapper.unmount()
    expect(disconnentSpy).toBeCalledTimes(2)
  })
})
describe("usePrevious", () => {
  it("should return a function that returns mount state", () => {
    let prevFoo
    function Wrapper({ foo }) {
      prevFoo = qh.usePrevious(foo)
      return <span />
    }
    const wrapper = mount(<Wrapper foo={true} />)
    expect(prevFoo).toEqual(null)
    wrapper.setProps({ foo: false })
    expect(prevFoo).toEqual(true)
  })
})
describe("useRefWithInitialValueFactory", () => {
  it("should set a ref value using factory once", () => {
    const spy = jest.fn((v: number) => v)
    const [ref, wrapper] = renderHook(
      ({ value }) => {
        return qh.useRefWithInitialValueFactory(() => spy(value))
      },
      { value: 2 }
    )
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(2)
    expect(ref.current).toEqual(2)
    wrapper.setProps({ value: 1 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(ref.current).toEqual(2)
  })
})
describe("useSafeState", () => {
  it("should work transparently", () => {
    let state
    function Wrapper() {
      state = qh.useSafeState(useState(false))
      return null
    }
    const wrapper = mount(<Wrapper />)
    expect(state[0]).toEqual(false)
    act(() => {
      state[1](true)
    })
    expect(state[0]).toEqual(true)
    wrapper.unmount()
    act(() => {
      state[1](false)
    })
    expect(state[0]).toEqual(true)
  })
  it("should work with async setState", async () => {
    let state
    function Wrapper() {
      state = qh.useSafeState(qh.useStateAsync(false))
      return null
    }
    const wrapper = mount(<Wrapper />)
    expect(state[0]).toEqual(false)
    await act(async () => {
      await state[1](true)
    })
    expect(state[0]).toEqual(true)
    wrapper.unmount()
    await act(async () => {
      await state[1](true)
    })
    expect(state[0]).toEqual(true)
  })
})
describe("useSet", () => {
  describe("ObservableSet", () => {
    it("should implement a Set", () => {
      const set = new qh.ObservableSet(() => {}, ["baz"])
      expect(set.size).toEqual(1)
      set.clear()
      expect(set.size).toEqual(0)
      expect(set.add("foo")).toEqual(set)
      expect(set.has("foo")).toEqual(true)
      expect(set.size).toEqual(1)
      for (const item of set) {
        expect(item).toEqual("foo")
      }
      set.add("bar")
      expect(Array.from(set.values())).toEqual(["foo", "bar"])
      expect(Array.from(set.keys())).toEqual(["foo", "bar"])
      expect(set[Symbol.iterator]).toBeDefined()
      expect(set.delete("bar")).toEqual(true)
      expect(set.size).toEqual(1)
      set.clear()
      expect(set.size).toEqual(0)
    })
    it("should be observable", () => {
      const spy = jest.fn()
      const set = new qh.ObservableSet(spy)
      set.add("foo")
      expect(spy).toHaveBeenCalledTimes(1)
      set.add("baz")
      expect(spy).toHaveBeenCalledTimes(2)
      set.delete("baz")
      expect(spy).toHaveBeenCalledTimes(3)
      set.clear()
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })
  it("should rerender when the set is updated", () => {
    let set
    function Wrapper() {
      set = qh.useSet()
      return <span>{JSON.stringify(Array.from(set))}</span>
    }
    const wrapper = mount(<Wrapper />)
    act(() => {
      set.add("foo")
    })
    expect(wrapper.text()).toEqual('["foo"]')
    act(() => {
      set.add("bar")
    })
    expect(wrapper.text()).toEqual('["foo","bar"]')
    act(() => {
      set.clear()
    })
    expect(wrapper.text()).toEqual("[]")
  })
})
describe("useStateAsync", () => {
  it("should increment counter", async () => {
    let asyncState: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      asyncState = qh.useStateAsync<number>(0)
      return null
    }
    mount(<Wrapper />)
    expect.assertions(4)
    const incrementAsync = async () => {
      await act(() => asyncState[1](prev => prev + 1))
    }
    expect(asyncState![0]).toEqual(0)
    await incrementAsync()
    expect(asyncState![0]).toEqual(1)
    await incrementAsync()
    expect(asyncState![0]).toEqual(2)
    await incrementAsync()
    expect(asyncState![0]).toEqual(3)
  })
  it("should reject on error", async () => {
    let asyncState: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      asyncState = qh.useStateAsync<number>(1)
      return null
    }
    class CatchError extends React.Component {
      static getDerivedStateFromError() {}
      componentDidCatch() {}
      render() {
        return this.props.children
      }
    }
    mount(
      <CatchError>
        <Wrapper />
      </CatchError>
    )
    // @ts-ignore
    expect.errors(1)
    await act(async () => {
      const p = asyncState[1](() => {
        throw new Error("yo")
      })
      return expect(p).rejects.toThrow("yo")
    })
  })
  it("should resolve even if no update happens", async () => {
    let asyncState: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      asyncState = qh.useStateAsync<number>(1)
      return null
    }
    mount(<Wrapper />)
    expect.assertions(3)
    expect(asyncState![0]).toEqual(1)
    await act(() => expect(asyncState[1](1)).resolves.toEqual(1))
    expect(asyncState![0]).toEqual(1)
  })
  it("should resolve after update if already pending", async () => {
    let asyncState: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      asyncState = qh.useStateAsync<number>(0)
      return null
    }
    mount(<Wrapper />)
    expect.assertions(5)
    expect(asyncState![0]).toEqual(0)
    const setAndAssert = async (n: number) =>
      expect(asyncState[1](n)).resolves.toEqual(2)
    await act(() =>
      Promise.all([setAndAssert(1), setAndAssert(1), setAndAssert(2)])
    )
    expect(asyncState![0]).toEqual(2)
  })
})
describe("useThrottledEventHandler", () => {
  it("should throttle and use return the most recent event", done => {
    const spy = jest.fn()
    const [handler, wrapper] = renderHook(() =>
      qh.useThrottledEventHandler<MouseEvent>(spy)
    )
    const events = [
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
    ]
    events.forEach(handler)
    expect(spy).not.toHaveBeenCalled()
    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(events[events.length - 1])
      wrapper.unmount()
      handler(new MouseEvent("pointermove"))
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1)
        done()
      }, 20)
    }, 20)
  })
  it("should clear pending handler calls", done => {
    const spy = jest.fn()
    const [handler, wrapper] = renderHook(() =>
      qh.useThrottledEventHandler<MouseEvent>(spy)
    )
    ;[
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
    ].forEach(handler)
    expect(spy).not.toHaveBeenCalled()
    handler.clear()
    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(0)
      done()
    }, 20)
  })
})
describe("useTimeout", () => {
  it("should set a timeout", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    let timeout: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      timeout = qh.useTimeout()
      return <span />
    }
    mount(<Wrapper />)
    timeout!.set(spy, 100)
    expect(spy).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it("should clear a timeout", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    let timeout: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      timeout = qh.useTimeout()
      return <span />
    }
    mount(<Wrapper />)
    timeout!.set(spy, 100)
    timeout!.clear()
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(0)
  })
  it("should clear a timeout on unmount", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    let timeout: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      timeout = qh.useTimeout()
      return <span />
    }
    const wrapper = mount(<Wrapper />)
    timeout!.set(spy, 100)
    wrapper.unmount()
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(0)
  })
  it("should handle very large timeouts", () => {
    jest.useFakeTimers()
    let spy = jest.fn()
    let timeout: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      timeout = qh.useTimeout()
      return <span />
    }
    mount(<Wrapper />)
    const MAX = 2 ** 31 - 1
    timeout!.set(spy, MAX + 100)
    // some time to check that it didn't overflow and fire immediately
    jest.runTimersToTime(100)
    expect(spy).toHaveBeenCalledTimes(0)
    jest.runAllTimers()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
describe("useToggleState", () => {
  it("should toggle", () => {
    let toggleState: ReturnType<typeof qh.useToggleState>
    function Wrapper({ initial }: { initial?: boolean }) {
      toggleState = qh.useToggleState(initial)
      return <span />
    }
    const wrapper = mount(<Wrapper />)
    expect(toggleState![0]).toEqual(false)
    act(() => toggleState[1]())
    expect(toggleState![0]).toEqual(true)
    act(() => toggleState[1](true))
    expect(toggleState![0]).toEqual(true)
    act(() => toggleState[1]())
    expect(toggleState![0]).toEqual(false)
  })
})
describe("useUpdateEffect", () => {
  it("should run update after value changes", () => {
    const teardown = jest.fn()
    const spy = jest.fn(() => teardown)
    const [, wrapper] = renderHook(
      ({ value }) => {
        qh.useUpdateEffect(spy, [value])
      },
      { value: 1, other: false }
    )
    expect(spy).not.toHaveBeenCalled()
    expect(teardown).not.toHaveBeenCalled()
    wrapper.setProps({ value: 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(teardown).not.toHaveBeenCalled()
    // unrelated render
    wrapper.setProps({ value: 2, other: true })
    expect(spy).toHaveBeenCalledTimes(1)
    wrapper.setProps({ value: 3, other: true })
    expect(spy).toHaveBeenCalledTimes(2)
    expect(teardown).toHaveBeenCalledTimes(1)
  })
})
describe("useUpdateLayoutEffect", () => {
  it("should run update after value changes", () => {
    const teardown = jest.fn()
    const spy = jest.fn(() => teardown)
    const [, wrapper] = renderHook(
      ({ value }) => {
        qh.useUpdateLayoutEffect(spy, [value])
      },
      { value: 1, other: false }
    )
    expect(spy).not.toHaveBeenCalled()
    expect(teardown).not.toHaveBeenCalled()
    wrapper.setProps({ value: 2 })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(teardown).not.toHaveBeenCalled()
    // unrelated render
    wrapper.setProps({ value: 2, other: true })
    expect(spy).toHaveBeenCalledTimes(1)
    wrapper.setProps({ value: 3, other: true })
    expect(spy).toHaveBeenCalledTimes(2)
    expect(teardown).toHaveBeenCalledTimes(1)
  })
})
describe("useWillUnmount", () => {
  it("should return a function that returns mount state", () => {
    let spy = jest.fn()
    function Wrapper() {
      qh.useWillUnmount(spy)
      return <span />
    }
    const wrapper = mount(<Wrapper />)
    expect(spy).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
