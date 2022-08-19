/* eslint-disable @typescript-eslint/no-explicit-any */
import addClass from "dom-helpers/esm/addClass.js"
import css from "dom-helpers/esm/css.js"
import qsa from "dom-helpers/esm/querySelectorAll.js"
import removeClass from "dom-helpers/esm/removeClass.js"
import ModalManager, {
  ContainerState,
  ModalManagerOptions,
} from "@restart/ui/esm/ModalManager.jsx"

const Selector = {
  FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
  STICKY_CONTENT: ".sticky-top",
  NAVBAR_TOGGLER: ".navbar-toggler",
}

export class Manager extends ModalManager {
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

  setContainerStyle(containerState: ContainerState) {
    super.setContainerStyle(containerState)
    const container = this.getElement()
    addClass(container, "modal-open")
    if (!containerState.scrollBarWidth) return
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight"
    const marginProp = this.isRTL ? "marginLeft" : "marginRight"
    qsa(container, Selector.FIXED_CONTENT).forEach(x =>
      this.adjustAndStore(paddingProp, x, containerState.scrollBarWidth)
    )
    qsa(container, Selector.STICKY_CONTENT).forEach(x =>
      this.adjustAndStore(marginProp, x, -containerState.scrollBarWidth)
    )
    qsa(container, Selector.NAVBAR_TOGGLER).forEach(x =>
      this.adjustAndStore(marginProp, x, containerState.scrollBarWidth)
    )
  }

  removeContainerStyle(containerState: ContainerState) {
    super.removeContainerStyle(containerState)
    const container = this.getElement()
    removeClass(container, "modal-open")
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight"
    const marginProp = this.isRTL ? "marginLeft" : "marginRight"
    qsa(container, Selector.FIXED_CONTENT).forEach(x =>
      this.restore(paddingProp, x)
    )
    qsa(container, Selector.STICKY_CONTENT).forEach(x =>
      this.restore(marginProp, x)
    )
    qsa(container, Selector.NAVBAR_TOGGLER).forEach(x =>
      this.restore(marginProp, x)
    )
  }
}

let sharedManager: Manager | undefined
export function getSharedManager(options?: ModalManagerOptions) {
  if (!sharedManager) sharedManager = new Manager(options)
  return sharedManager
}
