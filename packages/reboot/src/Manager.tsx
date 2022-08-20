import { addClass, css, qsa, removeClass } from "./base/utils.js"
import { Manager as Base, State, Opts } from "./base/Manager.js"

const Selector = {
  FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
  STICKY_CONTENT: ".sticky-top",
  NAVBAR_TOGGLER: ".navbar-toggler",
}

export class Manager extends Base {
  private adjustAndStore<T extends keyof CSSStyleDeclaration>(
    prop: T,
    element: HTMLElement,
    adjust: number
  ) {
    const actual = element.style[prop]
    element.dataset[prop] = actual
    css(element, {
      [prop]: `${parseFloat(css(element, prop as any)) + adjust}px`,
    })
  }
  private restore<T extends keyof CSSStyleDeclaration>(
    prop: T,
    element: HTMLElement
  ) {
    const value = element.dataset[prop]
    if (value !== undefined) {
      delete element.dataset[prop]
      css(element, { [prop]: value })
    }
  }
  override setContainerStyle(s: State) {
    super.setContainerStyle(s)
    const container = this.getElement()
    addClass(container, "modal-open")
    if (!s.scrollBarWidth) return
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight"
    const marginProp = this.isRTL ? "marginLeft" : "marginRight"
    qsa(container, Selector.FIXED_CONTENT).forEach(x =>
      this.adjustAndStore(paddingProp, x, s.scrollBarWidth)
    )
    qsa(container, Selector.STICKY_CONTENT).forEach(x =>
      this.adjustAndStore(marginProp, x, -s.scrollBarWidth)
    )
    qsa(container, Selector.NAVBAR_TOGGLER).forEach(x =>
      this.adjustAndStore(marginProp, x, s.scrollBarWidth)
    )
  }
  override removeContainerStyle(s: State) {
    super.removeContainerStyle(s)
    const container = this.getElement()
    removeClass(container, "modal-open")
    const padding = this.isRTL ? "paddingLeft" : "paddingRight"
    const margin = this.isRTL ? "marginLeft" : "marginRight"
    qsa(container, Selector.FIXED_CONTENT).forEach(x =>
      this.restore(padding, x)
    )
    qsa(container, Selector.STICKY_CONTENT).forEach(x =>
      this.restore(margin, x)
    )
    qsa(container, Selector.NAVBAR_TOGGLER).forEach(x =>
      this.restore(margin, x)
    )
  }
}

let sharedManager: Manager | undefined
export function getSharedManager(xs?: Opts) {
  if (!sharedManager) sharedManager = new Manager(xs)
  return sharedManager
}
