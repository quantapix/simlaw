import { mount } from "enzyme"
import { Popover } from "../src/Popover.js"
import { render } from "@testing-library/react"
import { Tooltip } from "../src/Tooltip.js"
import { useOffset } from "../src/use.js"
import * as qr from "react"
import type { Offset } from "../src/base/popper.js"

describe("useOffset", () => {
  const Wrapper = qr.forwardRef<
    any,
    qr.PropsWithChildren<{ customOffset?: Offset }>
  >((ps, outer) => {
    const [ref, modifiers] = useOffset(ps.customOffset)
    qr.useImperativeHandle(outer, () => ({
      modifiers,
    }))
    return qr.cloneElement(ps.children as qr.ReactElement, {
      ref,
    })
  })
  it("Should have offset of [0s, 8] for Popovers", () => {
    const ref = qr.createRef<any>()
    render(
      <Wrapper ref={ref}>
        <Popover id="test-popover" />
      </Wrapper>
    )
    const y = ref.current.modifiers[0].options.offset()
    expect(y).toEqual([0, 8])
  })
  it("Should apply custom offset", () => {
    const ref = qr.createRef<any>()
    render(
      <Wrapper ref={ref} customOffset={[200, 200]}>
        <Popover id="test-popover" />
      </Wrapper>
    )
    const y = ref.current.modifiers[0].options.offset()
    expect(y).toEqual([200, 200])
  })
  it("Should have offset of [0, 0] for Tooltips", () => {
    const ref = qr.createRef<any>()
    mount(
      <Wrapper ref={ref}>
        <Tooltip id="test-tooltip" />
      </Wrapper>
    )
    const y = ref.current.modifiers[0].options.offset()
    expect(y).toEqual([0, 0])
  })
  it("Should have offset of [0, 0] for any overlay", () => {
    const ref = qr.createRef<any>()
    mount(
      <Wrapper ref={ref}>
        <div>test</div>
      </Wrapper>
    )
    const y = ref.current.modifiers[0].options.offset()
    expect(y).toEqual([0, 0])
  })
})
