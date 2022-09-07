/* eslint-disable @typescript-eslint/no-namespace */
import { ArrayExt } from "./algorithm.js"
export type ElementAttrNames =
  | "abbr"
  | "accept"
  | "accept-charset"
  | "accesskey"
  | "action"
  | "allowfullscreen"
  | "alt"
  | "autocomplete"
  | "autofocus"
  | "autoplay"
  | "autosave"
  | "checked"
  | "cite"
  | "cols"
  | "colspan"
  | "contenteditable"
  | "controls"
  | "coords"
  | "crossorigin"
  | "data"
  | "datetime"
  | "default"
  | "dir"
  | "dirname"
  | "disabled"
  | "download"
  | "draggable"
  | "dropzone"
  | "enctype"
  | "form"
  | "formaction"
  | "formenctype"
  | "formmethod"
  | "formnovalidate"
  | "formtarget"
  | "headers"
  | "height"
  | "hidden"
  | "high"
  | "href"
  | "hreflang"
  | "id"
  | "inputmode"
  | "integrity"
  | "ismap"
  | "kind"
  | "label"
  | "lang"
  | "list"
  | "loop"
  | "low"
  | "max"
  | "maxlength"
  | "media"
  | "mediagroup"
  | "method"
  | "min"
  | "minlength"
  | "multiple"
  | "muted"
  | "name"
  | "novalidate"
  | "optimum"
  | "pattern"
  | "placeholder"
  | "poster"
  | "preload"
  | "readonly"
  | "rel"
  | "required"
  | "reversed"
  | "rows"
  | "rowspan"
  | "sandbox"
  | "scope"
  | "selected"
  | "shape"
  | "size"
  | "sizes"
  | "span"
  | "spellcheck"
  | "src"
  | "srcdoc"
  | "srclang"
  | "srcset"
  | "start"
  | "step"
  | "tabindex"
  | "target"
  | "title"
  | "type"
  | "typemustmatch"
  | "usemap"
  | "value"
  | "width"
  | "wrap"
export type ARIAAttrNames =
  | "aria-activedescendant"
  | "aria-atomic"
  | "aria-autocomplete"
  | "aria-busy"
  | "aria-checked"
  | "aria-colcount"
  | "aria-colindex"
  | "aria-colspan"
  | "aria-controls"
  | "aria-current"
  | "aria-describedby"
  | "aria-details"
  | "aria-dialog"
  | "aria-disabled"
  | "aria-dropeffect"
  | "aria-errormessage"
  | "aria-expanded"
  | "aria-flowto"
  | "aria-grabbed"
  | "aria-haspopup"
  | "aria-hidden"
  | "aria-invalid"
  | "aria-keyshortcuts"
  | "aria-label"
  | "aria-labelledby"
  | "aria-level"
  | "aria-live"
  | "aria-multiline"
  | "aria-multiselectable"
  | "aria-orientation"
  | "aria-owns"
  | "aria-placeholder"
  | "aria-posinset"
  | "aria-pressed"
  | "aria-readonly"
  | "aria-relevant"
  | "aria-required"
  | "aria-roledescription"
  | "aria-rowcount"
  | "aria-rowindex"
  | "aria-rowspan"
  | "aria-selected"
  | "aria-setsize"
  | "aria-sort"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "aria-valuetext"
  | "role"
export type CSSPropertyNames =
  | "alignContent"
  | "alignItems"
  | "alignSelf"
  | "alignmentBaseline"
  | "animation"
  | "animationDelay"
  | "animationDirection"
  | "animationDuration"
  | "animationFillMode"
  | "animationIterationCount"
  | "animationName"
  | "animationPlayState"
  | "animationTimingFunction"
  | "backfaceVisibility"
  | "background"
  | "backgroundAttachment"
  | "backgroundClip"
  | "backgroundColor"
  | "backgroundImage"
  | "backgroundOrigin"
  | "backgroundPosition"
  | "backgroundPositionX"
  | "backgroundPositionY"
  | "backgroundRepeat"
  | "backgroundSize"
  | "baselineShift"
  | "border"
  | "borderBottom"
  | "borderBottomColor"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius"
  | "borderBottomStyle"
  | "borderBottomWidth"
  | "borderCollapse"
  | "borderColor"
  | "borderImage"
  | "borderImageOutset"
  | "borderImageRepeat"
  | "borderImageSlice"
  | "borderImageSource"
  | "borderImageWidth"
  | "borderLeft"
  | "borderLeftColor"
  | "borderLeftStyle"
  | "borderLeftWidth"
  | "borderRadius"
  | "borderRight"
  | "borderRightColor"
  | "borderRightStyle"
  | "borderRightWidth"
  | "borderSpacing"
  | "borderStyle"
  | "borderTop"
  | "borderTopColor"
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderTopStyle"
  | "borderTopWidth"
  | "borderWidth"
  | "bottom"
  | "boxShadow"
  | "boxSizing"
  | "breakAfter"
  | "breakBefore"
  | "breakInside"
  | "captionSide"
  | "clear"
  | "clip"
  | "clipPath"
  | "clipRule"
  | "color"
  | "colorInterpolationFilters"
  | "columnCount"
  | "columnFill"
  | "columnGap"
  | "columnRule"
  | "columnRuleColor"
  | "columnRuleStyle"
  | "columnRuleWidth"
  | "columnSpan"
  | "columnWidth"
  | "columns"
  | "content"
  | "counterIncrement"
  | "counterReset"
  | "cssFloat"
  | "cssText"
  | "cursor"
  | "direction"
  | "display"
  | "dominantBaseline"
  | "emptyCells"
  | "enableBackground"
  | "fill"
  | "fillOpacity"
  | "fillRule"
  | "filter"
  | "flex"
  | "flexBasis"
  | "flexDirection"
  | "flexFlow"
  | "flexGrow"
  | "flexShrink"
  | "flexWrap"
  | "floodColor"
  | "floodOpacity"
  | "font"
  | "fontFamily"
  | "fontFeatureSettings"
  | "fontSize"
  | "fontSizeAdjust"
  | "fontStretch"
  | "fontStyle"
  | "fontVariant"
  | "fontWeight"
  | "glyphOrientationHorizontal"
  | "glyphOrientationVertical"
  | "height"
  | "imeMode"
  | "justifyContent"
  | "kerning"
  | "left"
  | "letterSpacing"
  | "lightingColor"
  | "lineHeight"
  | "listStyle"
  | "listStyleImage"
  | "listStylePosition"
  | "listStyleType"
  | "margin"
  | "marginBottom"
  | "marginLeft"
  | "marginRight"
  | "marginTop"
  | "marker"
  | "markerEnd"
  | "markerMid"
  | "markerStart"
  | "mask"
  | "maxHeight"
  | "maxWidth"
  | "minHeight"
  | "minWidth"
  | "msContentZoomChaining"
  | "msContentZoomLimit"
  | "msContentZoomLimitMax"
  | "msContentZoomLimitMin"
  | "msContentZoomSnap"
  | "msContentZoomSnapPoints"
  | "msContentZoomSnapType"
  | "msContentZooming"
  | "msFlowFrom"
  | "msFlowInto"
  | "msFontFeatureSettings"
  | "msGridColumn"
  | "msGridColumnAlign"
  | "msGridColumnSpan"
  | "msGridColumns"
  | "msGridRow"
  | "msGridRowAlign"
  | "msGridRowSpan"
  | "msGridRows"
  | "msHighContrastAdjust"
  | "msHyphenateLimitChars"
  | "msHyphenateLimitLines"
  | "msHyphenateLimitZone"
  | "msHyphens"
  | "msImeAlign"
  | "msOverflowStyle"
  | "msScrollChaining"
  | "msScrollLimit"
  | "msScrollLimitXMax"
  | "msScrollLimitXMin"
  | "msScrollLimitYMax"
  | "msScrollLimitYMin"
  | "msScrollRails"
  | "msScrollSnapPointsX"
  | "msScrollSnapPointsY"
  | "msScrollSnapType"
  | "msScrollSnapX"
  | "msScrollSnapY"
  | "msScrollTranslation"
  | "msTextCombineHorizontal"
  | "msTextSizeAdjust"
  | "msTouchAction"
  | "msTouchSelect"
  | "msUserSelect"
  | "msWrapFlow"
  | "msWrapMargin"
  | "msWrapThrough"
  | "opacity"
  | "order"
  | "orphans"
  | "outline"
  | "outlineColor"
  | "outlineStyle"
  | "outlineWidth"
  | "overflow"
  | "overflowX"
  | "overflowY"
  | "padding"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingRight"
  | "paddingTop"
  | "pageBreakAfter"
  | "pageBreakBefore"
  | "pageBreakInside"
  | "perspective"
  | "perspectiveOrigin"
  | "pointerEvents"
  | "position"
  | "quotes"
  | "resize"
  | "right"
  | "rubyAlign"
  | "rubyOverhang"
  | "rubyPosition"
  | "stopColor"
  | "stopOpacity"
  | "stroke"
  | "strokeDasharray"
  | "strokeDashoffset"
  | "strokeLinecap"
  | "strokeLinejoin"
  | "strokeMiterlimit"
  | "strokeOpacity"
  | "strokeWidth"
  | "tableLayout"
  | "textAlign"
  | "textAlignLast"
  | "textAnchor"
  | "textDecoration"
  | "textIndent"
  | "textJustify"
  | "textKashida"
  | "textKashidaSpace"
  | "textOverflow"
  | "textShadow"
  | "textTransform"
  | "textUnderlinePosition"
  | "top"
  | "touchAction"
  | "transform"
  | "transformOrigin"
  | "transformStyle"
  | "transition"
  | "transitionDelay"
  | "transitionDuration"
  | "transitionProperty"
  | "transitionTimingFunction"
  | "unicodeBidi"
  | "verticalAlign"
  | "visibility"
  | "webkitAlignContent"
  | "webkitAlignItems"
  | "webkitAlignSelf"
  | "webkitAnimation"
  | "webkitAnimationDelay"
  | "webkitAnimationDirection"
  | "webkitAnimationDuration"
  | "webkitAnimationFillMode"
  | "webkitAnimationIterationCount"
  | "webkitAnimationName"
  | "webkitAnimationPlayState"
  | "webkitAnimationTimingFunction"
  | "webkitAppearance"
  | "webkitBackfaceVisibility"
  | "webkitBackgroundClip"
  | "webkitBackgroundOrigin"
  | "webkitBackgroundSize"
  | "webkitBorderBottomLeftRadius"
  | "webkitBorderBottomRightRadius"
  | "webkitBorderImage"
  | "webkitBorderRadius"
  | "webkitBorderTopLeftRadius"
  | "webkitBorderTopRightRadius"
  | "webkitBoxAlign"
  | "webkitBoxDirection"
  | "webkitBoxFlex"
  | "webkitBoxOrdinalGroup"
  | "webkitBoxOrient"
  | "webkitBoxPack"
  | "webkitBoxSizing"
  | "webkitColumnBreakAfter"
  | "webkitColumnBreakBefore"
  | "webkitColumnBreakInside"
  | "webkitColumnCount"
  | "webkitColumnGap"
  | "webkitColumnRule"
  | "webkitColumnRuleColor"
  | "webkitColumnRuleStyle"
  | "webkitColumnRuleWidth"
  | "webkitColumnSpan"
  | "webkitColumnWidth"
  | "webkitColumns"
  | "webkitFilter"
  | "webkitFlex"
  | "webkitFlexBasis"
  | "webkitFlexDirection"
  | "webkitFlexFlow"
  | "webkitFlexGrow"
  | "webkitFlexShrink"
  | "webkitFlexWrap"
  | "webkitJustifyContent"
  | "webkitOrder"
  | "webkitPerspective"
  | "webkitPerspectiveOrigin"
  | "webkitTapHighlightColor"
  | "webkitTextFillColor"
  | "webkitTextSizeAdjust"
  | "webkitTransform"
  | "webkitTransformOrigin"
  | "webkitTransformStyle"
  | "webkitTransition"
  | "webkitTransitionDelay"
  | "webkitTransitionDuration"
  | "webkitTransitionProperty"
  | "webkitTransitionTimingFunction"
  | "webkitUserModify"
  | "webkitUserSelect"
  | "webkitWritingMode"
  | "whiteSpace"
  | "widows"
  | "width"
  | "wordBreak"
  | "wordSpacing"
  | "wordWrap"
  | "writingMode"
  | "zIndex"
  | "zoom"
export type ElementEventMap = {
  onabort: UIEvent
  onauxclick: MouseEvent
  onblur: FocusEvent
  oncanplay: Event
  oncanplaythrough: Event
  onchange: Event
  onclick: MouseEvent
  oncontextmenu: PointerEvent
  oncopy: ClipboardEvent
  oncuechange: Event
  oncut: ClipboardEvent
  ondblclick: MouseEvent
  ondrag: DragEvent
  ondragend: DragEvent
  ondragenter: DragEvent
  ondragexit: DragEvent
  ondragleave: DragEvent
  ondragover: DragEvent
  ondragstart: DragEvent
  ondrop: DragEvent
  ondurationchange: Event
  onemptied: Event
  onended: ErrorEvent
  onerror: ErrorEvent
  onfocus: FocusEvent
  oninput: Event
  oninvalid: Event
  onkeydown: KeyboardEvent
  onkeypress: KeyboardEvent
  onkeyup: KeyboardEvent
  onload: Event
  onloadeddata: Event
  onloadedmetadata: Event
  onloadend: Event
  onloadstart: Event
  onmousedown: MouseEvent
  onmouseenter: MouseEvent
  onmouseleave: MouseEvent
  onmousemove: MouseEvent
  onmouseout: MouseEvent
  onmouseover: MouseEvent
  onmouseup: MouseEvent
  onmousewheel: WheelEvent
  onpaste: ClipboardEvent
  onpause: Event
  onplay: Event
  onplaying: Event
  onpointercancel: PointerEvent
  onpointerdown: PointerEvent
  onpointerenter: PointerEvent
  onpointerleave: PointerEvent
  onpointermove: PointerEvent
  onpointerout: PointerEvent
  onpointerover: PointerEvent
  onpointerup: PointerEvent
  onprogress: ProgressEvent
  onratechange: Event
  onreset: Event
  onscroll: UIEvent
  onseeked: Event
  onseeking: Event
  onselect: UIEvent
  onselectstart: Event
  onstalled: Event
  onsubmit: Event
  onsuspend: Event
  ontimeupdate: Event
  onvolumechange: Event
  onwaiting: Event
}
export type ElementDataset = {
  readonly [name: string]: string
}
export type ElementInlineStyle = {
  readonly [T in CSSPropertyNames]?: string
}
export type ElementARIAAttrs = {
  readonly [T in ARIAAttrNames]?: string
}
export type ElementBaseAttrs = {
  readonly [T in ElementAttrNames]?: string
}
export type ElementEventAttrs = {
  readonly [T in keyof ElementEventMap]?: (
    this: HTMLElement,
    event: ElementEventMap[T]
  ) => any
}
export type ElementSpecialAttrs = {
  readonly key?: string
  readonly className?: string
  readonly htmlFor?: string
  readonly dataset?: ElementDataset
  readonly style?: ElementInlineStyle
}
export type ElementAttrs = ElementBaseAttrs &
  ElementARIAAttrs &
  ElementEventAttrs &
  ElementSpecialAttrs
export class VirtualText {
  readonly content: string
  readonly type: "text" = "text"
  constructor(content: string) {
    this.content = content
  }
}
export class VirtualElement {
  readonly tag: string
  readonly attrs: ElementAttrs
  readonly children: ReadonlyArray<VirtualNode>
  readonly renderer: VirtualElement.IRenderer | undefined
  readonly type: "element" = "element"
  constructor(
    tag: string,
    attrs: ElementAttrs,
    children: ReadonlyArray<VirtualNode>,
    renderer?: VirtualElement.IRenderer
  ) {
    this.tag = tag
    this.attrs = attrs
    this.children = children
    this.renderer = renderer
  }
}
export namespace VirtualElement {
  export type IRenderer = {
    render: (
      host: HTMLElement,
      options?: { attrs?: ElementAttrs; children?: ReadonlyArray<VirtualNode> }
    ) => void
    unrender?: (
      host: HTMLElement,
      options?: { attrs?: ElementAttrs; children?: ReadonlyArray<VirtualNode> }
    ) => void
  }
}
export class VirtualElementPass extends VirtualElement {
  constructor(
    tag: string,
    attrs: ElementAttrs,
    renderer: VirtualElementPass.IRenderer | null
  ) {
    super(tag, attrs, [], renderer || undefined)
  }
}
export namespace VirtualElementPass {
  export type IRenderer = VirtualElement.IRenderer
}
export type VirtualNode = VirtualElement | VirtualText
export function h(tag: string, ...children: h.Child[]): VirtualElement
export function h(
  tag: string,
  attrs: ElementAttrs,
  ...children: h.Child[]
): VirtualElement
export function h(
  tag: string,
  renderer: VirtualElement.IRenderer,
  ...children: h.Child[]
): VirtualElement
export function h(
  tag: string,
  attrs: ElementAttrs,
  renderer: VirtualElement.IRenderer,
  ...children: h.Child[]
): VirtualElement
export function h(tag: string): VirtualElement {
  let attrs: ElementAttrs = {}
  let renderer: VirtualElement.IRenderer | undefined
  const children: VirtualNode[] = []
  for (let i = 1, n = arguments.length; i < n; ++i) {
    const arg = arguments[i]
    if (typeof arg === "string") {
      children.push(new VirtualText(arg))
    } else if (arg instanceof VirtualText) {
      children.push(arg)
    } else if (arg instanceof VirtualElement) {
      children.push(arg)
    } else if (arg instanceof Array) {
      extend(children, arg)
    } else if ((i === 1 || i === 2) && arg && typeof arg === "object") {
      if ("render" in arg) {
        renderer = arg
      } else {
        attrs = arg
      }
    }
  }
  return new VirtualElement(tag, attrs, children, renderer)
  function extend(array: VirtualNode[], values: h.Child[]): void {
    for (const child of values) {
      if (typeof child === "string") {
        array.push(new VirtualText(child))
      } else if (child instanceof VirtualText) {
        array.push(child)
      } else if (child instanceof VirtualElement) {
        array.push(child)
      }
    }
  }
}
export namespace h {
  export type Child =
    | (string | VirtualNode | null)
    | Array<string | VirtualNode | null>
  export interface IFactory {
    (...children: Child[]): VirtualElement
    (attrs: ElementAttrs, ...children: Child[]): VirtualElement
    (renderer: VirtualElement.IRenderer, ...children: h.Child[]): VirtualElement
    (
      attrs: ElementAttrs,
      renderer: VirtualElement.IRenderer,
      ...children: h.Child[]
    ): VirtualElement
  }
  export const a: IFactory = h.bind(undefined, "a")
  export const abbr: IFactory = h.bind(undefined, "abbr")
  export const address: IFactory = h.bind(undefined, "address")
  export const area: IFactory = h.bind(undefined, "area")
  export const article: IFactory = h.bind(undefined, "article")
  export const aside: IFactory = h.bind(undefined, "aside")
  export const audio: IFactory = h.bind(undefined, "audio")
  export const b: IFactory = h.bind(undefined, "b")
  export const bdi: IFactory = h.bind(undefined, "bdi")
  export const bdo: IFactory = h.bind(undefined, "bdo")
  export const blockquote: IFactory = h.bind(undefined, "blockquote")
  export const br: IFactory = h.bind(undefined, "br")
  export const button: IFactory = h.bind(undefined, "button")
  export const canvas: IFactory = h.bind(undefined, "canvas")
  export const caption: IFactory = h.bind(undefined, "caption")
  export const cite: IFactory = h.bind(undefined, "cite")
  export const code: IFactory = h.bind(undefined, "code")
  export const col: IFactory = h.bind(undefined, "col")
  export const colgroup: IFactory = h.bind(undefined, "colgroup")
  export const data: IFactory = h.bind(undefined, "data")
  export const datalist: IFactory = h.bind(undefined, "datalist")
  export const dd: IFactory = h.bind(undefined, "dd")
  export const del: IFactory = h.bind(undefined, "del")
  export const dfn: IFactory = h.bind(undefined, "dfn")
  export const div: IFactory = h.bind(undefined, "div")
  export const dl: IFactory = h.bind(undefined, "dl")
  export const dt: IFactory = h.bind(undefined, "dt")
  export const em: IFactory = h.bind(undefined, "em")
  export const embed: IFactory = h.bind(undefined, "embed")
  export const fieldset: IFactory = h.bind(undefined, "fieldset")
  export const figcaption: IFactory = h.bind(undefined, "figcaption")
  export const figure: IFactory = h.bind(undefined, "figure")
  export const footer: IFactory = h.bind(undefined, "footer")
  export const form: IFactory = h.bind(undefined, "form")
  export const h1: IFactory = h.bind(undefined, "h1")
  export const h2: IFactory = h.bind(undefined, "h2")
  export const h3: IFactory = h.bind(undefined, "h3")
  export const h4: IFactory = h.bind(undefined, "h4")
  export const h5: IFactory = h.bind(undefined, "h5")
  export const h6: IFactory = h.bind(undefined, "h6")
  export const header: IFactory = h.bind(undefined, "header")
  export const hr: IFactory = h.bind(undefined, "hr")
  export const i: IFactory = h.bind(undefined, "i")
  export const iframe: IFactory = h.bind(undefined, "iframe")
  export const img: IFactory = h.bind(undefined, "img")
  export const input: IFactory = h.bind(undefined, "input")
  export const ins: IFactory = h.bind(undefined, "ins")
  export const kbd: IFactory = h.bind(undefined, "kbd")
  export const label: IFactory = h.bind(undefined, "label")
  export const legend: IFactory = h.bind(undefined, "legend")
  export const li: IFactory = h.bind(undefined, "li")
  export const main: IFactory = h.bind(undefined, "main")
  export const map: IFactory = h.bind(undefined, "map")
  export const mark: IFactory = h.bind(undefined, "mark")
  export const meter: IFactory = h.bind(undefined, "meter")
  export const nav: IFactory = h.bind(undefined, "nav")
  export const noscript: IFactory = h.bind(undefined, "noscript")
  export const object: IFactory = h.bind(undefined, "object")
  export const ol: IFactory = h.bind(undefined, "ol")
  export const optgroup: IFactory = h.bind(undefined, "optgroup")
  export const option: IFactory = h.bind(undefined, "option")
  export const output: IFactory = h.bind(undefined, "output")
  export const p: IFactory = h.bind(undefined, "p")
  export const param: IFactory = h.bind(undefined, "param")
  export const pre: IFactory = h.bind(undefined, "pre")
  export const progress: IFactory = h.bind(undefined, "progress")
  export const q: IFactory = h.bind(undefined, "q")
  export const rp: IFactory = h.bind(undefined, "rp")
  export const rt: IFactory = h.bind(undefined, "rt")
  export const ruby: IFactory = h.bind(undefined, "ruby")
  export const s: IFactory = h.bind(undefined, "s")
  export const samp: IFactory = h.bind(undefined, "samp")
  export const section: IFactory = h.bind(undefined, "section")
  export const select: IFactory = h.bind(undefined, "select")
  export const small: IFactory = h.bind(undefined, "small")
  export const source: IFactory = h.bind(undefined, "source")
  export const span: IFactory = h.bind(undefined, "span")
  export const strong: IFactory = h.bind(undefined, "strong")
  export const sub: IFactory = h.bind(undefined, "sub")
  export const summary: IFactory = h.bind(undefined, "summary")
  export const sup: IFactory = h.bind(undefined, "sup")
  export const table: IFactory = h.bind(undefined, "table")
  export const tbody: IFactory = h.bind(undefined, "tbody")
  export const td: IFactory = h.bind(undefined, "td")
  export const textarea: IFactory = h.bind(undefined, "textarea")
  export const tfoot: IFactory = h.bind(undefined, "tfoot")
  export const th: IFactory = h.bind(undefined, "th")
  export const thead: IFactory = h.bind(undefined, "thead")
  export const time: IFactory = h.bind(undefined, "time")
  export const title: IFactory = h.bind(undefined, "title")
  export const tr: IFactory = h.bind(undefined, "tr")
  export const track: IFactory = h.bind(undefined, "track")
  export const u: IFactory = h.bind(undefined, "u")
  export const ul: IFactory = h.bind(undefined, "ul")
  export const var_: IFactory = h.bind(undefined, "var")
  export const video: IFactory = h.bind(undefined, "video")
  export const wbr: IFactory = h.bind(undefined, "wbr")
}
export function hpass(
  tag: string,
  renderer?: VirtualElementPass.IRenderer
): VirtualElementPass
export function hpass(
  tag: string,
  attrs: ElementAttrs,
  renderer?: VirtualElementPass.IRenderer
): VirtualElementPass
export function hpass(tag: string): VirtualElementPass {
  let attrs: ElementAttrs = {}
  let renderer: VirtualElementPass.IRenderer | null = null
  if (arguments.length === 2) {
    const arg = arguments[1]
    if ("render" in arg) {
      renderer = arg
    } else {
      attrs = arg
    }
  } else if (arguments.length === 3) {
    attrs = arguments[1]
    renderer = arguments[2]
  } else if (arguments.length > 3) {
    throw new Error("hpass() should be called with 1, 2, or 3 arguments")
  }
  return new VirtualElementPass(tag, attrs, renderer)
}
export namespace VirtualDOM {
  export function realize(node: VirtualText): Text
  export function realize(node: VirtualElement): HTMLElement
  export function realize(node: VirtualNode): HTMLElement | Text {
    return Private.createDOMNode(node)
  }
  export function render(
    content: VirtualNode | ReadonlyArray<VirtualNode> | null,
    host: HTMLElement
  ): void {
    const oldContent = Private.hostMap.get(host) || []
    const newContent = Private.asContentArray(content)
    Private.hostMap.set(host, newContent)
    Private.updateContent(host, oldContent, newContent)
  }
}
namespace Private {
  export const hostMap = new WeakMap<HTMLElement, ReadonlyArray<VirtualNode>>()
  export function asContentArray(
    value: VirtualNode | ReadonlyArray<VirtualNode> | null
  ): ReadonlyArray<VirtualNode> {
    if (!value) {
      return []
    }
    if (value instanceof Array) {
      return value as ReadonlyArray<VirtualNode>
    }
    return [value as VirtualNode]
  }
  export function createDOMNode(node: VirtualText): Text
  export function createDOMNode(node: VirtualElement): HTMLElement
  export function createDOMNode(node: VirtualNode): HTMLElement | Text
  export function createDOMNode(
    node: VirtualNode,
    host: HTMLElement | null
  ): HTMLElement | Text
  export function createDOMNode(
    node: VirtualNode,
    host: HTMLElement | null,
    before: Node | null
  ): HTMLElement | Text
  export function createDOMNode(node: VirtualNode): HTMLElement | Text {
    let host = arguments[1] || null
    const before = arguments[2] || null
    if (host) {
      host.insertBefore(createDOMNode(node), before)
    } else {
      if (node.type === "text") {
        return document.createTextNode(node.content)
      }
      host = document.createElement(node.tag)
      addAttrs(host, node.attrs)
      if (node.renderer) {
        node.renderer.render(host, {
          attrs: node.attrs,
          children: node.children,
        })
        return host
      }
      for (let i = 0, n = node.children.length; i < n; ++i) {
        createDOMNode(node.children[i], host)
      }
    }
    return host
  }
  export function updateContent(
    host: HTMLElement,
    oldContent: ReadonlyArray<VirtualNode>,
    newContent: ReadonlyArray<VirtualNode>
  ): void {
    if (oldContent === newContent) {
      return
    }
    const oldKeyed = collectKeys(host, oldContent)
    const oldCopy = oldContent.slice()
    let currElem = host.firstChild
    const newCount = newContent.length
    for (let i = 0; i < newCount; ++i) {
      if (i >= oldCopy.length) {
        createDOMNode(newContent[i], host)
        continue
      }
      let oldVNode = oldCopy[i]
      const newVNode = newContent[i]
      if (oldVNode === newVNode) {
        currElem = currElem!.nextSibling
        continue
      }
      if (oldVNode.type === "text" && newVNode.type === "text") {
        currElem!.textContent = newVNode.content
        currElem = currElem!.nextSibling
        continue
      }
      if (oldVNode.type === "text" || newVNode.type === "text") {
        ArrayExt.insert(oldCopy, i, newVNode)
        createDOMNode(newVNode, host, currElem)
        continue
      }
      if (!oldVNode.renderer != !newVNode.renderer) {
        ArrayExt.insert(oldCopy, i, newVNode)
        createDOMNode(newVNode, host, currElem)
        continue
      }
      const newKey = newVNode.attrs.key
      if (newKey && newKey in oldKeyed) {
        const pair = oldKeyed[newKey]
        if (pair.vNode !== oldVNode) {
          ArrayExt.move(oldCopy, oldCopy.indexOf(pair.vNode, i + 1), i)
          host.insertBefore(pair.element, currElem)
          oldVNode = pair.vNode
          currElem = pair.element
        }
      }
      if (oldVNode === newVNode) {
        currElem = currElem!.nextSibling
        continue
      }
      const oldKey = oldVNode.attrs.key
      if (oldKey && oldKey !== newKey) {
        ArrayExt.insert(oldCopy, i, newVNode)
        createDOMNode(newVNode, host, currElem)
        continue
      }
      if (oldVNode.tag !== newVNode.tag) {
        ArrayExt.insert(oldCopy, i, newVNode)
        createDOMNode(newVNode, host, currElem)
        continue
      }
      updateAttrs(currElem as HTMLElement, oldVNode.attrs, newVNode.attrs)
      if (newVNode.renderer) {
        newVNode.renderer.render(currElem as HTMLElement, {
          attrs: newVNode.attrs,
          children: newVNode.children,
        })
      } else {
        updateContent(
          currElem as HTMLElement,
          oldVNode.children,
          newVNode.children
        )
      }
      currElem = currElem!.nextSibling
    }
    removeContent(host, oldCopy, newCount, true)
  }
  function removeContent(
    host: HTMLElement,
    oldContent: ReadonlyArray<VirtualNode>,
    newCount: number,
    _sentinel: boolean
  ) {
    for (let i = oldContent.length - 1; i >= newCount; --i) {
      const oldNode = oldContent[i]
      const child = (
        _sentinel ? host.lastChild : host.childNodes[i]
      ) as HTMLElement
      if (oldNode.type === "text") {
      } else if (oldNode.renderer && oldNode.renderer.unrender) {
        oldNode.renderer.unrender(child!, {
          attrs: oldNode.attrs,
          children: oldNode.children,
        })
      } else {
        removeContent(child!, oldNode.children, 0, false)
      }
      if (_sentinel) {
        host.removeChild(child!)
      }
    }
  }
  const specialAttrs = {
    key: true,
    className: true,
    htmlFor: true,
    dataset: true,
    style: true,
  }
  function addAttrs(element: HTMLElement, attrs: ElementAttrs): void {
    for (const name in attrs) {
      if (name in specialAttrs) {
        continue
      }
      if (name.substr(0, 2) === "on") {
        ;(element as any)[name] = (attrs as any)[name]
      } else {
        element.setAttribute(name, (attrs as any)[name])
      }
    }
    if (attrs.className !== undefined) {
      element.setAttribute("class", attrs.className)
    }
    if (attrs.htmlFor !== undefined) {
      element.setAttribute("for", attrs.htmlFor)
    }
    if (attrs.dataset) {
      addDataset(element, attrs.dataset)
    }
    if (attrs.style) {
      addStyle(element, attrs.style)
    }
  }
  function updateAttrs(
    element: HTMLElement,
    oldAttrs: ElementAttrs,
    newAttrs: ElementAttrs
  ): void {
    if (oldAttrs === newAttrs) {
      return
    }
    let name: keyof ElementAttrs
    for (name in oldAttrs) {
      if (name in specialAttrs || name in newAttrs) {
        continue
      }
      if (name.substr(0, 2) === "on") {
        ;(element as any)[name] = null
      } else {
        element.removeAttribute(name)
      }
    }
    for (name in newAttrs) {
      if (name in specialAttrs || oldAttrs[name] === newAttrs[name]) {
        continue
      }
      if (name.substr(0, 2) === "on") {
        ;(element as any)[name] = (newAttrs as any)[name]
      } else {
        element.setAttribute(name, (newAttrs as any)[name])
      }
    }
    if (oldAttrs.className !== newAttrs.className) {
      if (newAttrs.className !== undefined) {
        element.setAttribute("class", newAttrs.className)
      } else {
        element.removeAttribute("class")
      }
    }
    if (oldAttrs.htmlFor !== newAttrs.htmlFor) {
      if (newAttrs.htmlFor !== undefined) {
        element.setAttribute("for", newAttrs.htmlFor)
      } else {
        element.removeAttribute("for")
      }
    }
    if (oldAttrs.dataset !== newAttrs.dataset) {
      updateDataset(element, oldAttrs.dataset || {}, newAttrs.dataset || {})
    }
    if (oldAttrs.style !== newAttrs.style) {
      updateStyle(element, oldAttrs.style || {}, newAttrs.style || {})
    }
  }
  function addDataset(element: HTMLElement, dataset: ElementDataset): void {
    for (const name in dataset) {
      element.setAttribute(`data-${name}`, dataset[name])
    }
  }
  function updateDataset(
    element: HTMLElement,
    oldDataset: ElementDataset,
    newDataset: ElementDataset
  ): void {
    for (const name in oldDataset) {
      if (!(name in newDataset)) {
        element.removeAttribute(`data-${name}`)
      }
    }
    for (const name in newDataset) {
      if (oldDataset[name] !== newDataset[name]) {
        element.setAttribute(`data-${name}`, newDataset[name])
      }
    }
  }
  function addStyle(element: HTMLElement, style: ElementInlineStyle): void {
    const elemStyle = element.style
    let name: keyof ElementInlineStyle
    for (name in style) {
      ;(elemStyle as any)[name] = style[name]
    }
  }
  function updateStyle(
    element: HTMLElement,
    oldStyle: ElementInlineStyle,
    newStyle: ElementInlineStyle
  ): void {
    const elemStyle = element.style
    let name: keyof ElementInlineStyle
    for (name in oldStyle) {
      if (!(name in newStyle)) {
        ;(elemStyle as any)[name] = ""
      }
    }
    for (name in newStyle) {
      if (oldStyle[name] !== newStyle[name]) {
        ;(elemStyle as any)[name] = newStyle[name]
      }
    }
  }
  type KeyMap = {
    [key: string]: { vNode: VirtualElement; element: HTMLElement }
  }
  function collectKeys(
    host: HTMLElement,
    content: ReadonlyArray<VirtualNode>
  ): KeyMap {
    let node = host.firstChild
    const keyMap: KeyMap = Object.create(null)
    for (const vNode of content) {
      if (vNode.type === "element" && vNode.attrs.key) {
        keyMap[vNode.attrs.key] = { vNode, element: node as HTMLElement }
      }
      node = node!.nextSibling
    }
    return keyMap
  }
}
