import * as React from "react"
import { useImperativeHandle } from "react"
import { mount } from "enzyme"
import { render } from "@testing-library/react"
import { Offset } from "@restart/ui/esm/usePopper.js"
import { Popover } from "../src/Popover.jsx"
import { Tooltip } from "../src/Tooltip.jsx"
import useOverlayOffset from "../src/useOverlayOffset"

describe("useOverlayOffset", () => {
  const Wrapper = React.forwardRef<
    any,
    React.PropsWithChildren<{ customOffset?: Offset }>
  >((props, outerRef) => {
    const [ref, modifiers] = useOverlayOffset(props.customOffset)

    useImperativeHandle(outerRef, () => ({
      modifiers,
    }))

    return React.cloneElement(props.children as React.ReactElement, {
      ref,
    })
  })

  test("should have offset of [0s, 8] for Popovers", () => {
    const ref = React.createRef<any>()

    render(
      <Wrapper ref={ref}>
        <Popover id="test-popover" />
      </Wrapper>
    )

    const offset = ref.current.modifiers[0].options.offset()
    expect(offset).to.eql([0, 8])
  })

  test("should apply custom offset", () => {
    const ref = React.createRef<any>()

    render(
      <Wrapper ref={ref} customOffset={[200, 200]}>
        <Popover id="test-popover" />
      </Wrapper>
    )

    const offset = ref.current.modifiers[0].options.offset()
    expect(offset).to.eql([200, 200])
  })

  test("should have offset of [0, 0] for Tooltips", () => {
    const ref = React.createRef<any>()

    mount(
      <Wrapper ref={ref}>
        <Tooltip id="test-tooltip" />
      </Wrapper>
    )

    const offset = ref.current.modifiers[0].options.offset()
    expect(offset).to.eql([0, 0])
  })

  test("should have offset of [0, 0] for any overlay", () => {
    const ref = React.createRef<any>()

    mount(
      <Wrapper ref={ref}>
        <div>test</div>
      </Wrapper>
    )

    const offset = ref.current.modifiers[0].options.offset()
    expect(offset).to.eql([0, 0])
  })
})