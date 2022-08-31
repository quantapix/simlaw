import { css, getBodyScrollbarWidth } from "./utils.js"
import * as qt from "./types.jsx"

export interface Instance {
  dialog?: Element
  backdrop?: Element
}

export interface Opts {
  ownerDocument?: Document | undefined
  handleContainerOverflow?: boolean
  isRTL?: boolean
}

export type State = {
  scrollBarWidth: number
  style: Record<string, any>
  [key: string]: any
}

export const OPEN_DATA_ATTRIBUTE = qt.dataAttr("modal-open")

export class Manager {
  readonly handleContainerOverflow: boolean
  readonly isRTL: boolean
  readonly modals: Instance[]
  protected state!: State
  protected ownerDocument: Document | undefined
  constructor({
    ownerDocument,
    handleContainerOverflow = true,
    isRTL = false,
  }: Opts = {}) {
    this.handleContainerOverflow = handleContainerOverflow
    this.isRTL = isRTL
    this.modals = []
    this.ownerDocument = ownerDocument
  }
  getScrollbarWidth() {
    return getBodyScrollbarWidth(this.ownerDocument)
  }
  getElement() {
    return (this.ownerDocument || document).body
  }
  setModalAttributes(_: Instance) {}
  removeModalAttributes(_: Instance) {}
  setContainerStyle(s: State) {
    const style: Partial<CSSStyleDeclaration> = { overflow: "hidden" }
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight"
    const container = this.getElement()
    s.style = {
      overflow: container.style.overflow,
      [paddingProp]: container.style[paddingProp],
    }
    if (s.scrollBarWidth) {
      style[paddingProp] = `${
        parseInt(css(container, paddingProp) || "0", 10) + s.scrollBarWidth
      }px`
    }
    container.setAttribute(OPEN_DATA_ATTRIBUTE, "")
    css(container, style as any)
  }
  reset() {
    ;[...this.modals].forEach(x => this.remove(x))
  }
  removeContainerStyle(s: State) {
    const container = this.getElement()
    container.removeAttribute(OPEN_DATA_ATTRIBUTE)
    Object.assign(container.style, s.style)
  }
  add(x: Instance) {
    let i = this.modals.indexOf(x)
    if (i !== -1) {
      return i
    }
    i = this.modals.length
    this.modals.push(x)
    this.setModalAttributes(x)
    if (i !== 0) {
      return i
    }
    this.state = {
      scrollBarWidth: this.getScrollbarWidth(),
      style: {},
    }
    if (this.handleContainerOverflow) {
      this.setContainerStyle(this.state)
    }
    return i
  }
  remove(x: Instance) {
    const i = this.modals.indexOf(x)
    if (i === -1) {
      return
    }
    this.modals.splice(i, 1)
    if (!this.modals.length && this.handleContainerOverflow) {
      this.removeContainerStyle(this.state)
    }
    this.removeModalAttributes(x)
  }
  isTopModal(x: Instance) {
    return !!this.modals.length && this.modals[this.modals.length - 1] === x
  }
}
