export interface ICircle {
  x: number
  y: number
  radius: number
}
export interface IColorRGB {
  r: number
  g: number
  b: number
}

const IS_VALID_HEX = /^#[a-fA-F0-9]{6}$/
const DEFAULT_HEX = "#000000"

export class Color {
  public readonly hex: string
  public readonly rgb: IColorRGB

  constructor(hex: string) {
    this.hex = IS_VALID_HEX.test(hex ?? "") ? hex : DEFAULT_HEX
    this.rgb = hexToRgb(hex)
  }

  toString(): string {
    return this.hex
  }

  getDarkerColor(factor = 0.3): Color {
    return Color.getColorFromRGB({
      r: this.rgb.r - factor * this.rgb.r,
      g: this.rgb.g - factor * this.rgb.g,
      b: this.rgb.b - factor * this.rgb.b,
    })
  }

  getLighterColor(factor = 0.3): Color {
    return Color.getColorFromRGB({
      r: this.rgb.r + factor * (255 - this.rgb.r),
      g: this.rgb.g + factor * (255 - this.rgb.g),
      b: this.rgb.b + factor * (255 - this.rgb.b),
    })
  }

  getMixedColor(color: Color): Color {
    return Color.getColorFromRGB({
      r: (this.rgb.r + color.rgb.r) / 2,
      g: (this.rgb.g + color.rgb.g) / 2,
      b: (this.rgb.b + color.rgb.b) / 2,
    })
  }

  isEqual(color: Color): boolean {
    return (
      this.rgb.r === color.rgb.r &&
      this.rgb.g === color.rgb.g &&
      this.rgb.b === color.rgb.b
    )
  }

  static getColorFromRGB(rgb: IColorRGB): Color {
    const r = Math.round(Math.max(Math.min(rgb.r, 255), 0))
    const g = Math.round(Math.max(Math.min(rgb.g, 255), 0))
    const b = Math.round(Math.max(Math.min(rgb.b, 255), 0))

    return new Color(rgbToHex({ r, g, b }))
  }

  static getRandomColor(): Color {
    return Color.getColorFromRGB({
      r: Math.round(255 * Math.random()),
      g: Math.round(255 * Math.random()),
      b: Math.round(255 * Math.random()),
    })
  }
}

const hexToRgb = (hex: string): IColorRGB => {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(6, 7), 16),
  }
}

const rgbToHex = (rgb: IColorRGB): string => {
  return (
    "#" +
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)
  )
}

export const getDistanceToLine = (
  startLinePoint: IPosition,
  endLinePoint: IPosition,
  point: IPosition
): number => {
  const dx = endLinePoint.x - startLinePoint.x
  const dy = endLinePoint.y - startLinePoint.y
  let lineSegment =
    ((point.x - startLinePoint.x) * dx + (point.y - startLinePoint.y) * dy) /
    (dx * dx + dy * dy)
  if (lineSegment > 1) {
    lineSegment = 1
  }
  if (lineSegment < 0) {
    lineSegment = 0
  }
  const newLinePointX = startLinePoint.x + lineSegment * dx
  const newLinePointY = startLinePoint.y + lineSegment * dy
  const pdx = newLinePointX - point.x
  const pdy = newLinePointY - point.y

  return Math.sqrt(pdx * pdx + pdy * pdy)
}

export interface IPosition {
  x: number
  y: number
}

export const isEqualPosition = (
  position1?: IPosition,
  position2?: IPosition
): boolean => {
  return (
    !!position1 &&
    !!position2 &&
    position1.x === position2.x &&
    position1.y === position2.y
  )
}

export interface IRectangle {
  x: number
  y: number
  width: number
  height: number
}

export const isPointInRectangle = (
  rectangle: IRectangle,
  point: IPosition
): boolean => {
  const endX = rectangle.x + rectangle.width
  const endY = rectangle.y + rectangle.height
  return (
    point.x >= rectangle.x &&
    point.x <= endX &&
    point.y >= rectangle.y &&
    point.y <= endY
  )
}
