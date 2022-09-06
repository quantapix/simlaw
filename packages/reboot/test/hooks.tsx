import { render } from "@testing-library/react"
import { renderHook, act } from "@testing-library/react-hooks"
import { renderToString } from "react-dom/server"
import * as qe from "enzyme"
import * as qh from "../src/hooks.js"
import * as qr from "react"

export function testHook<F extends (ps: P) => any, P = any>(
  f: F,
  ps0?: P
): [ReturnType<F>, qe.ReactWrapper<P>] {
  const y = Array(2) as any
  function Wrapper(xs: any) {
    y[0] = f(xs)
    return <span />
  }
  y[1] = qe.mount(<Wrapper {...ps0} />)
  return y
}

describe("useAnimationFrame", () => {
  let raf: any, rafCancel: any
  beforeAll(() => {
    raf = jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
      return setTimeout(() => cb(1)) as any
    })
    rafCancel = jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(x => {
        clearTimeout(x)
      })
  })
  afterAll(() => {
    raf.mockRestore()
    rafCancel.mockRestore()
  })
  it("should requestAnimationFrame", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    const { result: y } = renderHook(qh.useAnimationFrame)
    act(() => y.current.request(mock))
    expect(mock).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should cancel a request", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    const { result: y } = renderHook(qh.useAnimationFrame)
    act(() => {
      y.current.request(mock)
      y.current.cancel()
    })
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(0)
  })
  it("should cancel a request on unmount", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    const { result: y, unmount } = renderHook(qh.useAnimationFrame)
    act(() => y.current.request(mock))
    unmount()
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(0)
  })
})
describe("useBreakpoint (ssr)", () => {
  it("should match immediately if possible", () => {
    let y
    const Wrapper = () => {
      y = qh.useBreakpoint("md")
      return null
    }
    renderToString(<Wrapper />)
    expect(y).toEqual(false)
  })
})
describe("useBreakpoint", () => {
  let spy: jest.SpyInstance<MediaQueryList, [string]>
  beforeEach(() => {
    spy = jest.spyOn(window, "matchMedia")
    window.resizeTo(1024, window.innerHeight)
  })
  afterEach(() => {
    spy.mockRestore()
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
      const { result: y, unmount } = renderHook(() => qh.useBreakpoint(config))
      expect(y).toEqual(expected)
      unmount()
    }
  )
  it("should assume pixels for number values", () => {
    const bp = qh.createBreakHook({ xs: 0, sm: 400, md: 700 })
    renderHook(() => bp("sm"))
    expect(spy).toBeCalled()
    expect(spy.mock.calls[0]?.[0]).toEqual(
      "(min-width: 400px) and (max-width: 699.8px)"
    )
  })
  it("should use calc for string values", () => {
    const bp = qh.createBreakHook({ xs: 0, sm: "40rem", md: "70rem" })
    renderHook(() => bp("sm"))
    expect(spy).toBeCalled()
    expect(spy.mock.calls[0]?.[0]).toEqual(
      "(min-width: 40rem) and (max-width: calc(70rem - 0.2px))"
    )
  })
  it("should flatten media", () => {
    const bp = qh.createBreakHook({ sm: 400, md: 400 })
    renderHook(() => bp({ sm: "up", md: "up" }))
    expect(spy.mock.calls[0]?.[0]).toEqual("(min-width: 400px)")
  })
})
describe("useCallbackRef", () => {
  it("should update value and be fresh in an effect", () => {
    const mock = jest.fn()
    function Wrapper({ toggle }: { toggle: any }) {
      const [ref, attach] = qh.useCallbackRef<
        HTMLDivElement | HTMLSpanElement
      >()
      qr.useEffect(() => {
        mock(ref)
      }, [ref])
      return toggle ? <div ref={attach} /> : <span ref={attach} />
    }
    const w = qe.mount(<Wrapper toggle={false} />)
    expect(w.children().type()).toEqual("span")
    expect(mock).toHaveBeenLastCalledWith(
      expect.objectContaining({ tagName: "SPAN" })
    )
    act(() => {
      w.setProps({ toggle: true })
    })
    expect(w.children().type()).toEqual("div")
    expect(mock).toHaveBeenLastCalledWith(
      expect.objectContaining({ tagName: "DIV" })
    )
  })
})
describe("useCommittedRef", () => {
  it("should use fresh value", () => {
    const mockA = jest.fn()
    const mockB = jest.fn()
    const { rerender } = renderHook(
      x => {
        const ref = qh.useCommittedRef<any>(x)
        qr.useEffect(() => ref.current())
        return null
      },
      { initialProps: mockA }
    )
    rerender(mockB)
    expect(mockA).toHaveBeenCalledTimes(1)
    expect(mockB).toHaveBeenCalledTimes(1)
  })
})
describe("useCustomEffect", () => {
  it("should run custom isEqual logic", () => {
    const unmock = jest.fn()
    const mock = jest.fn().mockImplementation(() => unmock)
    const isEqual = jest.fn((a, b) => a[0].foo === b[0].foo)
    const [, w] = testHook(
      ({ value }) => {
        qh.useCustomEffect(mock, [value], isEqual)
      },
      { value: { foo: true } }
    )
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: { foo: true } })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: { foo: false } })
    expect(mock).toHaveBeenCalledTimes(2)
    expect(isEqual).toHaveBeenCalledTimes(2)
    expect(unmock).toBeCalledTimes(1)
    expect(mock).toHaveBeenCalledTimes(2)
    w.unmount()
    expect(unmock).toBeCalledTimes(2)
  })
  it("should accept different hooks", () => {
    const mock = jest.fn()
    const hook = jest.fn().mockImplementation(qh.useUpdateImmediateEffect)
    testHook(
      ({ value }) => {
        qh.useCustomEffect(mock, [value], {
          isEqual: (a, b) => a[0]?.foo === b[0]?.foo,
          hook: hook,
        })
      },
      { value: { foo: true } }
    )
    expect(hook).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledTimes(0)
  })
})
describe("useDebouncedCallback", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    let cb: any
    function Wrapper() {
      cb = qh.useDebounced(mock, 500)
      return <span />
    }
    render(<Wrapper />)
    cb(1)
    cb(2)
    cb(3)
    expect(mock).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(3)
  })
})
describe("useDebouncedState", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    let y: any
    function Wrapper() {
      const [value, setValue] = qh.useDebouncedState(0, 500)
      y = setValue
      return <span>{value}</span>
    }
    const w = qe.mount(<Wrapper />)
    expect(w.text()).toBe("0")
    y((x: number) => x + 1)
    y((x: number) => x + 1)
    y((x: number) => x + 1)
    y((x: number) => x + 1)
    y((x: number) => x + 1)
    expect(w.text()).toBe("0")
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(w.text()).toBe("1")
  })
})
describe("useDebouncedValue", () => {
  it("should return a function that debounces input callback", () => {
    jest.useFakeTimers()
    let n = 0
    function Wrapper({ value }: { value: any }) {
      const y = qh.useDebouncedValue(value, 500)
      qr.useEffect(() => {
        n++
      }, [y])
      return <span>{y}</span>
    }
    act(() => {
      const w = qe.mount(<Wrapper value={0} />)
      expect(w.text()).toBe("0")
      w.setProps({ value: 1 })
      w.setProps({ value: 2 })
      w.setProps({ value: 3 })
      w.setProps({ value: 4 })
      w.setProps({ value: 5 })
      expect(w.text()).toBe("0")
      jest.runAllTimers()
      expect(w.text()).toBe("5")
      expect(n).toBe(2)
    })
  })
})
describe("useForceUpdate", () => {
  it("should return a function that returns mount state", () => {
    let n = 0
    const [y] = testHook(() => {
      n++
      return qh.useForceUpdate()
    })
    expect(n).toEqual(1)
    act(() => {
      y()
    })
    expect(n).toEqual(2)
  })
})
describe("useUpdateImmediateEffect", () => {
  it("should run update after value changes", () => {
    const unmock = jest.fn()
    const mock = jest.fn().mockImplementation(() => unmock)
    const [, w] = testHook(
      ({ value }) => {
        qh.useUpdateImmediateEffect(mock, [value])
      },
      { value: 1, other: false }
    )
    expect(mock).not.toHaveBeenCalled()
    w.setProps({ value: 2 })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 2, other: true })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 4, other: true })
    expect(unmock).toBeCalledTimes(1)
    expect(mock).toHaveBeenCalledTimes(2)
    w.unmount()
    expect(unmock).toBeCalledTimes(2)
  })
})
describe("useIntersectionObserver", () => {
  let observers: any[] = []
  beforeEach(() => {
    ;(window as any).IntersectionObserver = class IntersectionObserverMock {
      observe: jest.Mock<any, any>
      unobserve: jest.Mock<any, any>
      args: [IntersectionObserverCallback, IntersectionObserverEntryInit]
      constructor(x: any, init: any) {
        this.args = [x, init]
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
    const e = document.createElement("span")
    const { result: y } = renderHook(() => qh.useIntersectionObserver(e))
    const entry = {}
    expect(y).toEqual([])
    act(() => {
      observers[0].args[0]([entry])
    })
    expect(y.current[0]).toStrictEqual(entry)
  })
  it("should wait for element", async () => {
    const element = document.createElement("span")
    const {
      result: y,
      rerender,
      unmount,
    } = renderHook(({ element }) => qh.useIntersectionObserver(element), {
      initialProps: { element: null as any },
    })
    expect(y).toEqual([])
    expect(observers[0].observe).not.toBeCalled()
    rerender({ element })
    expect(observers[0].observe).toBeCalledTimes(1)
    unmount()
    expect(observers[0].unobserve).toBeCalledTimes(1)
  })
  it("should wait for root to set up observer", async () => {
    const div = document.createElement("div")
    const span = document.createElement("span")
    const { rerender } = renderHook(
      (root: any) => qh.useIntersectionObserver(span, { root }),
      { initialProps: null }
    )
    expect(observers).toHaveLength(0)
    rerender(div as any)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toBeCalledTimes(1)
  })
  it("should accept a callback", async () => {
    const mock = jest.fn()
    const span = document.createElement("span")
    const { result: y } = renderHook(() =>
      qh.useIntersectionObserver(span, mock)
    )
    expect(y).toEqual(undefined)
    const entry = {}
    act(() => {
      observers[0].args[0]([entry, observers[0]])
    })
    expect(mock).toBeCalledTimes(1)
    expect(mock).toHaveBeenLastCalledWith([entry, observers[0]])
  })
})
describe("useTimeout", () => {
  it("should set an interval", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    renderHook(() => qh.useInterval(mock, 100))
    expect(mock).not.toHaveBeenCalled()
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(mock).toHaveBeenCalledTimes(1)
    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(mock).toHaveBeenCalledTimes(2)
  })
  it("should run immediately when argument is set", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    renderHook(() => qh.useInterval(mock, 100, false, true))
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should not run when paused", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    renderHook(() => qh.useInterval(mock, 100, true))
    jest.runOnlyPendingTimers()
    expect(mock).not.toHaveBeenCalled()
  })
  it("should stop running on unmount", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    const { unmount } = renderHook(() => qh.useInterval(mock, 100))
    unmount()
    jest.runOnlyPendingTimers()
    expect(mock).not.toHaveBeenCalled()
  })
})
describe("useIsomorphicEffect (ssr)", () => {
  it("should not run or warn", () => {
    const mock = jest.fn()
    expect(qh.useIsomorphicEffect).toEqual(qr.useEffect)
    const Wrapper = () => {
      qh.useIsomorphicEffect(mock)
      return null
    }
    renderToString(<Wrapper />)
    expect(mock).not.toBeCalled()
  })
})
describe("useIsomorphicEffect", () => {
  it("should not run or warn", () => {
    const mock = jest.fn()
    expect(qh.useIsomorphicEffect).toEqual(qr.useLayoutEffect)
    const Wrapper = () => {
      qh.useIsomorphicEffect(mock)
      return null
    }
    render(<Wrapper />)
    expect(mock).toBeCalled()
  })
})
describe("useMap", () => {
  describe("ObservableMap", () => {
    it("should implement a Map", () => {
      const y = new qh.ObservableMap(() => {}, [["baz", false]])
      expect(y.size).toEqual(1)
      y.clear()
      expect(y.size).toEqual(0)
      expect(y.set("foo", true)).toEqual(y)
      expect(y.get("foo")).toEqual(true)
      expect(y.size).toEqual(1)
      for (const item of y) {
        expect(item[0]).toEqual("foo")
        expect(item[1]).toEqual(true)
      }
      y.set("bar", false)
      expect(Array.from(y.values())).toEqual([true, false])
      expect(Array.from(y.keys())).toEqual(["foo", "bar"])
      expect(y[Symbol.iterator]).toBeDefined()
      expect(y.delete("bar")).toEqual(true)
      expect(y.size).toEqual(1)
      y.clear()
      expect(y.size).toEqual(0)
    })
    it("should be observable", () => {
      const mock = jest.fn()
      const y = new qh.ObservableMap(mock)
      y.set("foo", true)
      expect(mock).toHaveBeenCalledTimes(1)
      y.set("baz", 3)
      expect(mock).toHaveBeenCalledTimes(2)
      y.delete("baz")
      expect(mock).toHaveBeenCalledTimes(3)
      y.clear()
      expect(mock).toHaveBeenCalledTimes(4)
    })
  })
  it("should rerender when the map is updated", () => {
    let y: any
    function Wrapper() {
      y = qh.useMap()
      return <span>{JSON.stringify(Array.from(y.entries()))}</span>
    }
    const w = qe.mount(<Wrapper />)
    act(() => {
      y.set("foo", true)
    })
    expect(w.text()).toEqual('[["foo",true]]')
    act(() => {
      y.set("bar", true)
    })
    expect(w.text()).toEqual('[["foo",true],["bar",true]]')
    act(() => {
      y.clear()
    })
    expect(w.text()).toEqual("[]")
  })
})
describe("useMediaQuery (ssr)", () => {
  it("should match immediately if possible", () => {
    let y
    const Wrapper = ({ media }: { media: any }) => {
      y = qh.useMediaQuery(media)
      return null
    }
    renderToString(<Wrapper media="min-width: 100px" />)
    expect(y).toEqual(false)
  })
})
describe("useMediaQuery", () => {
  it("should match immediately if possible", () => {
    let y
    const Wrapper = ({ media }: { media: any }) => {
      y = qh.useMediaQuery(media)
      return null
    }
    const w = qe.mount(<Wrapper media="min-width: 100px" />)
    expect(window.innerWidth).toBeGreaterThanOrEqual(100)
    expect(y).toEqual(true)
    w.setProps({ media: "min-width: 2000px" })
    expect(window.innerWidth).toBeLessThanOrEqual(2000)
    expect(y).toEqual(false)
  })
  it("should clear if no media is passed", () => {
    let matches
    const Wrapper = ({ media }: { media: any }) => {
      matches = qh.useMediaQuery(media)
      return null
    }
    const y = qe.mount(<Wrapper media={null} />)
    expect(matches).toEqual(false)
    y.setProps({ media: "" })
    expect(matches).toEqual(false)
  })
})
describe("useMergeStateFromProps", () => {
  it("should adjust state when props change", () => {
    const y = [] as Array<{ ps: any; state: any }>
    const derive = (next: { foo: any }, prev: { last: any }) => {
      if (next.foo === prev.last) return null
      return { bar: 3, last: next.foo }
    }
    function Foo(ps: { foo: any }) {
      const [state] = qh.useMergeStateFromProps(ps, derive, { last: ps.foo })
      y.push({ ps, state })
      return <div>{JSON.stringify(state)}</div>
    }
    const w = qe.mount(<Foo foo={1} />)
    expect(y[0]?.state).toEqual({ lastFoo: 1 })
    w.setProps({ foo: 2 })
    expect(y).toHaveLength(3)
    expect(y[2]?.state).toEqual({ lastFoo: 2, bar: 3 })
    w.setProps({ foo: 2, biz: true })
    expect(y).toHaveLength(4)
    w.setProps({ foo: 3 })
    expect(y).toHaveLength(6)
  })
  it("should adjust state when props change", () => {
    type Ps = { foo: number }
    type State = { last: number }
    const y = []
    function Foo(ps: { foo: any }) {
      const [state, _] = qh.useMergeStateFromProps<Ps, State>(
        ps,
        (next, prev) => {
          if (next.foo === prev.last) return null
          return { bar: 3, last: next.foo }
        },
        { last: ps.foo }
      )
      y.push({ ps, state })
      return <div>{JSON.stringify(state)}</div>
    }
    const w = qe.mount(<Foo foo={1} />)
    w.setProps({ foo: 2 })
  })
})
describe("useMergedRefs", () => {
  it("should return a function that returns mount state", () => {
    let inner: HTMLButtonElement
    const outer = qr.createRef<HTMLButtonElement>()
    const Button = qr.forwardRef<HTMLButtonElement>((ps, ref) => {
      const [x, attach] = qh.useCallbackRef<HTMLButtonElement>()
      inner = x!
      const mergedRef = qh.useMergedRefs<HTMLButtonElement>(ref, attach)
      return <button ref={mergedRef} {...ps} />
    })
    function Wrapper() {
      return <Button ref={outer} />
    }
    render(<Wrapper />)
    expect(inner!.tagName).toEqual("BUTTON")
    expect(outer.current!.tagName).toEqual("BUTTON")
  })
})
describe("useMountEffect", () => {
  it("should run update only on mount", () => {
    const unmock = jest.fn()
    const mock = jest.fn(() => unmock)
    const [, w] = testHook(
      () => {
        qh.useMountEffect(mock)
      },
      { value: 1, other: false }
    )
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 2 })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 2, other: true })
    expect(mock).toHaveBeenCalledTimes(1)
    w.unmount()
    expect(unmock).toHaveBeenCalledTimes(1)
  })
})
describe("useMounted", () => {
  it("should return a function that returns mount state", () => {
    let y: any
    function Wrapper() {
      y = qh.useMounted()
      return <span />
    }
    const w = qe.mount(<Wrapper />)
    expect(y()).toEqual(true)
    w.unmount()
    expect(y()).toEqual(false)
  })
})
describe("useMutationObserver", () => {
  it("should add a mutation observer", async () => {
    const unmock = jest.fn()
    const mock = jest.fn(() => unmock)
    function Wrapper(ps: any) {
      const [x, attach] = qh.useCallbackRef<HTMLElement>()
      qh.useMutationObserver(x, { attributes: true }, mock)
      return <div ref={attach} {...ps} />
    }
    const w = qe.mount(<Wrapper />)
    expect(mock).toHaveBeenCalledTimes(0)
    w.setProps({ role: "button" })
    await Promise.resolve()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      [expect.objectContaining({ type: "attributes", attributeName: "role" })],
      expect.anything()
    )
    w.unmount()
  })
  let spy: jest.SpyInstance<void, []>
  afterEach(() => {
    spy?.mockRestore()
  })
  it("should update config", async () => {
    const unmock = jest.fn()
    const mock = jest.fn(() => unmock)
    spy = jest.spyOn(MutationObserver.prototype, "disconnect")
    function Wrapper({ attributeFilter, ...ps }: { attributeFilter: any }) {
      const [x, attach] = qh.useCallbackRef<HTMLElement>()
      qh.useMutationObserver(x, { attributes: true, attributeFilter }, mock)
      return <div ref={attach} {...ps} />
    }
    const w = qe.mount(<Wrapper attributeFilter={["data-name"]} />)
    w.setProps({ role: "presentation" })
    await Promise.resolve()
    expect(mock).toHaveBeenCalledTimes(0)
    w.setProps({ attributeFilter: undefined, role: "button" })
    await Promise.resolve()
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      [expect.objectContaining({ type: "attributes", attributeName: "role" })],
      expect.anything()
    )
    expect(spy).toBeCalledTimes(1)
    w.unmount()
    expect(spy).toBeCalledTimes(2)
  })
})
describe("usePrevious", () => {
  it("should return a function that returns mount state", () => {
    let y
    function Wrapper({ foo }: { foo: any }) {
      y = qh.usePrevious(foo)
      return <span />
    }
    const w = qe.mount(<Wrapper foo={true} />)
    expect(y).toEqual(null)
    w.setProps({ foo: false })
    expect(y).toEqual(true)
  })
})
describe("useRefWithInitialValueFactory", () => {
  it("should set a ref value using factory once", () => {
    const mock = jest.fn((v: number) => v)
    const [y, w] = testHook(
      ({ value }) => {
        return qh.useRefWithInitialValueFactory(() => mock(value))
      },
      { value: 2 }
    )
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(2)
    expect(y.current).toEqual(2)
    w.setProps({ value: 1 })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(y.current).toEqual(2)
  })
})
describe("useSafeState", () => {
  it("should work transparently", () => {
    let y: any
    function Wrapper() {
      y = qh.useSafeState(qr.useState(false))
      return null
    }
    const w = qe.mount(<Wrapper />)
    expect(y[0]).toEqual(false)
    act(() => {
      y[1](true)
    })
    expect(y[0]).toEqual(true)
    w.unmount()
    act(() => {
      y[1](false)
    })
    expect(y[0]).toEqual(true)
  })
  it("should work with async setState", async () => {
    let y: any
    function Wrapper() {
      y = qh.useSafeState(qh.useStateAsync(false))
      return null
    }
    const w = qe.mount(<Wrapper />)
    expect(y[0]).toEqual(false)
    await act(async () => {
      await y[1](true)
    })
    expect(y[0]).toEqual(true)
    w.unmount()
    await act(async () => {
      await y[1](true)
    })
    expect(y[0]).toEqual(true)
  })
})
describe("useSet", () => {
  describe("ObservableSet", () => {
    it("should implement a Set", () => {
      const y = new qh.ObservableSet(() => {}, ["baz"])
      expect(y.size).toEqual(1)
      y.clear()
      expect(y.size).toEqual(0)
      expect(y.add("foo")).toEqual(y)
      expect(y.has("foo")).toEqual(true)
      expect(y.size).toEqual(1)
      for (const item of y) {
        expect(item).toEqual("foo")
      }
      y.add("bar")
      expect(Array.from(y.values())).toEqual(["foo", "bar"])
      expect(Array.from(y.keys())).toEqual(["foo", "bar"])
      expect(y[Symbol.iterator]).toBeDefined()
      expect(y.delete("bar")).toEqual(true)
      expect(y.size).toEqual(1)
      y.clear()
      expect(y.size).toEqual(0)
    })
    it("should be observable", () => {
      const mock = jest.fn()
      const y = new qh.ObservableSet(mock)
      y.add("foo")
      expect(mock).toHaveBeenCalledTimes(1)
      y.add("baz")
      expect(mock).toHaveBeenCalledTimes(2)
      y.delete("baz")
      expect(mock).toHaveBeenCalledTimes(3)
      y.clear()
      expect(mock).toHaveBeenCalledTimes(4)
    })
  })
  it("should rerender when the set is updated", () => {
    let y: any
    function Wrapper() {
      y = qh.useSet()
      return <span>{JSON.stringify(Array.from(y))}</span>
    }
    const w = qe.mount(<Wrapper />)
    act(() => {
      y.add("foo")
    })
    expect(w.text()).toEqual('["foo"]')
    act(() => {
      y.add("bar")
    })
    expect(w.text()).toEqual('["foo","bar"]')
    act(() => {
      y.clear()
    })
    expect(w.text()).toEqual("[]")
  })
})
describe("useStateAsync", () => {
  it("should increment counter", async () => {
    let y: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      y = qh.useStateAsync<number>(0)
      return null
    }
    render(<Wrapper />)
    expect.assertions(4)
    const inc = async () =>
      act(() => {
        y[1](x => x + 1)
      })
    expect(y![0]).toEqual(0)
    await inc()
    expect(y![0]).toEqual(1)
    await inc()
    expect(y![0]).toEqual(2)
    await inc()
    expect(y![0]).toEqual(3)
  })
  it("should reject on error", async () => {
    let y: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      y = qh.useStateAsync<number>(1)
      return null
    }
    class CatchError extends qr.Component {
      static getDerivedStateFromError() {}
      override componentDidCatch() {}
      override render() {
        return (this.props as any).children
      }
    }
    render(
      <CatchError>
        <Wrapper />
      </CatchError>
    )
    expect.assertions(1)
    await act(async () => {
      const p = y[1](() => {
        throw new Error("yo")
      })
      return expect(p).rejects.toThrow("yo")
    })
  })
  it("should resolve even if no update happens", async () => {
    let y: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      y = qh.useStateAsync<number>(1)
      return null
    }
    render(<Wrapper />)
    expect.assertions(3)
    expect(y![0]).toEqual(1)
    await act(() => expect(y[1](1)).resolves.toEqual(1))
    expect(y![0]).toEqual(1)
  })
  it("should resolve after update if already pending", async () => {
    let y: [number, qh.AsyncSetState<number>]
    function Wrapper() {
      y = qh.useStateAsync<number>(0)
      return null
    }
    render(<Wrapper />)
    expect.assertions(5)
    expect(y![0]).toEqual(0)
    const f = async (n: number) => expect(y[1](n)).resolves.toEqual(2)
    act(() => {
      Promise.all([f(1), f(1), f(2)])
    })
    expect(y![0]).toEqual(2)
  })
})
describe("useThrottledEventHandler", () => {
  it("should throttle and use return the most recent event", done => {
    const mock = jest.fn()
    const [y, w] = testHook(() => qh.useThrottledEventHandler<MouseEvent>(mock))
    const events = [
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
    ]
    events.forEach(y)
    expect(mock).not.toHaveBeenCalled()
    setTimeout(() => {
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(events[events.length - 1])
      w.unmount()
      y(new MouseEvent("pointermove"))
      setTimeout(() => {
        expect(mock).toHaveBeenCalledTimes(1)
        done()
      }, 20)
    }, 20)
  })
  it("should clear pending handler calls", done => {
    const mock = jest.fn()
    const [y] = testHook(() => qh.useThrottledEventHandler<MouseEvent>(mock))
    ;[
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
      new MouseEvent("pointermove"),
    ].forEach(y)
    expect(mock).not.toHaveBeenCalled()
    y.clear()
    setTimeout(() => {
      expect(mock).toHaveBeenCalledTimes(0)
      done()
    }, 20)
  })
})
describe("useTimeout", () => {
  it("should set a timeout", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    let y: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      y = qh.useTimeout()
      return <span />
    }
    render(<Wrapper />)
    y!.set(mock, 100)
    expect(mock).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should clear a timeout", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    let y: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      y = qh.useTimeout()
      return <span />
    }
    render(<Wrapper />)
    y!.set(mock, 100)
    y!.clear()
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(0)
  })
  it("should clear a timeout on unmount", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    let y: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      y = qh.useTimeout()
      return <span />
    }
    const w = qe.mount(<Wrapper />)
    y!.set(mock, 100)
    w.unmount()
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(0)
  })
  it("should handle very large timeouts", () => {
    jest.useFakeTimers()
    const mock = jest.fn()
    let y: ReturnType<typeof qh.useTimeout>
    function Wrapper() {
      y = qh.useTimeout()
      return <span />
    }
    render(<Wrapper />)
    const MAX = 2 ** 31 - 1
    y!.set(mock, MAX + 100)
    //jest.runTimersToTime(100)
    expect(mock).toHaveBeenCalledTimes(0)
    jest.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
describe("useToggleState", () => {
  it("should toggle", () => {
    let y: ReturnType<typeof qh.useToggleState>
    function Wrapper({ initial }: { initial?: boolean }) {
      y = qh.useToggleState(initial)
      return <span />
    }
    render(<Wrapper />)
    expect(y![0]).toEqual(false)
    act(() => y[1]())
    expect(y![0]).toEqual(true)
    act(() => y[1](true))
    expect(y![0]).toEqual(true)
    act(() => y[1]())
    expect(y![0]).toEqual(false)
  })
})
describe("useUpdateEffect", () => {
  it("should run update after value changes", () => {
    const unmock = jest.fn()
    const mock = jest.fn(() => unmock)
    const [, w] = testHook(
      ({ value }) => {
        qh.useUpdateEffect(mock, [value])
      },
      { value: 1, other: false }
    )
    expect(mock).not.toHaveBeenCalled()
    expect(unmock).not.toHaveBeenCalled()
    w.setProps({ value: 2 })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(unmock).not.toHaveBeenCalled()
    w.setProps({ value: 2, other: true })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 3, other: true })
    expect(mock).toHaveBeenCalledTimes(2)
    expect(unmock).toHaveBeenCalledTimes(1)
  })
})
describe("useUpdateLayoutEffect", () => {
  it("should run update after value changes", () => {
    const unmock = jest.fn()
    const mock = jest.fn(() => unmock)
    const [, w] = testHook(
      ({ value }) => {
        qh.useUpdateLayoutEffect(mock, [value])
      },
      { value: 1, other: false }
    )
    expect(mock).not.toHaveBeenCalled()
    expect(unmock).not.toHaveBeenCalled()
    w.setProps({ value: 2 })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(unmock).not.toHaveBeenCalled()
    w.setProps({ value: 2, other: true })
    expect(mock).toHaveBeenCalledTimes(1)
    w.setProps({ value: 3, other: true })
    expect(mock).toHaveBeenCalledTimes(2)
    expect(unmock).toHaveBeenCalledTimes(1)
  })
})
describe("useWillUnmount", () => {
  it("should return a function that returns mount state", () => {
    const mock = jest.fn()
    function Wrapper() {
      qh.useWillUnmount(mock)
      return <span />
    }
    const w = qe.mount(<Wrapper />)
    expect(mock).not.toHaveBeenCalled()
    w.unmount()
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
