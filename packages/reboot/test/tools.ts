export function shouldWarn(x: any) {
  console.error(x)
}

let style: any
let seen: any = []

export function injectCss(xs: any) {
  if (seen.indexOf(xs) !== -1) return
  style =
    style ||
    (function iife() {
      const _style = document.createElement("style")
      _style.appendChild(document.createTextNode(""))
      document.head.appendChild(_style)
      return _style
    })()
  seen.push(xs)
  style.innerHTML += `\n${xs}`
}

injectCss.reset = () => {
  if (style) document.head.removeChild(style)
  style = null
  seen = []
}
