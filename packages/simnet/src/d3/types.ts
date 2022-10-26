import type { MultiPolygon } from "geojson"

export type Primitive = number | string | boolean | Date
export interface Numeric {
  valueOf(): number
}
export interface Adder {
  add(x: number): Adder
  valueOf(): number
}
export interface Bisector<T, U> {
  left(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
  right(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
  center(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
}
export interface Bin<T, V extends number | Date | undefined> extends Array<T> {
  x0: V | undefined
  x1: V | undefined
}
export type ThresholdCountGenerator<Value extends number | undefined = number | undefined> = (
  xs: ArrayLike<Value>,
  min: number,
  max: number
) => number
export type ThresholdNumberArrayGenerator<Value extends number | undefined> = (
  xs: ArrayLike<Value>,
  min: number,
  max: number
) => Value[]
export type ThresholdDateArrayGenerator<Value extends Date | undefined> = (
  xs: ArrayLike<Value>,
  min: Date,
  max: Date
) => Value[]
export interface HistogramCommon<T, V extends number | Date | undefined> {
  (data: ArrayLike<T>): Array<Bin<T, V>>
  value(): (x: T, i: number, data: ArrayLike<T>) => V
  value(valueAccessor: (x: T, i: number, data: ArrayLike<T>) => V): this
}
export interface HistogramGeneratorDate<T, V extends Date | undefined> extends HistogramCommon<T, Date> {
  domain(): (xs: ArrayLike<V>) => [Date, Date]
  domain(domain: [Date, Date] | ((xs: ArrayLike<V>) => [Date, Date])): this
  thresholds(): ThresholdDateArrayGenerator<V>
  thresholds(thresholds: ArrayLike<V> | ThresholdDateArrayGenerator<V>): this
}
export interface HistogramGeneratorNumber<T, V extends number | undefined> extends HistogramCommon<T, V> {
  domain(): (xs: Iterable<V>) => [number, number] | [undefined, undefined]
  domain(domain: [number, number] | ((xs: Iterable<V>) => [number, number] | [undefined, undefined])): this
  thresholds(): ThresholdCountGenerator<V> | ThresholdNumberArrayGenerator<V>
  thresholds(count: number | ThresholdCountGenerator<V>): this
  thresholds(thresholds: ArrayLike<V> | ThresholdNumberArrayGenerator<V>): this
}
export class InternMap<K = any, V = any> extends Map<K, V> {}
export class InternSet<T = any> extends Set<T> {}
export type AxisDomain = number | string | Date | { valueOf(): number }
export interface AxisTimeInterval {
  range(start: Date, stop: Date, step?: number): Date[]
}
export interface AxisScale<T> {
  (x: T): number | undefined
  domain(): T[]
  range(): number[]
  copy(): this
  bandwidth?(): number
}
export type AxisContainerElement = SVGSVGElement | SVGGElement
export interface Axis<T> {
  (
    context:
      | Selection<SVGSVGElement, any, any, any>
      | Selection<SVGGElement, any, any, any>
      | TransitionLike<SVGSVGElement, any>
      | TransitionLike<SVGGElement, any>
  ): void
  scale<A extends AxisScale<T>>(): A
  scale(scale: AxisScale<T>): this
  ticks(count: number, specifier?: string): this
  ticks(interval: AxisTimeInterval, specifier?: string): this
  ticks(arg0: any, ...xs: any[]): this
  tickArguments(): any[]
  tickArguments(args: any[]): this
  tickValues(): T[] | null
  tickValues(xs: Iterable<T>): this
  tickValues(values: null): this
  tickFormat(): ((domainValue: T, i: number) => string) | null
  tickFormat(format: (domainValue: T, i: number) => string): this
  tickFormat(format: null): this
  tickSize(): number
  tickSize(size: number): this
  tickSizeInner(): number
  tickSizeInner(size: number): this
  tickSizeOuter(): number
  tickSizeOuter(size: number): this
  tickPadding(): number
  tickPadding(padding: number): this
  offset(): number
  offset(offset: number): this
}
export type BrushSelection = [[number, number], [number, number]] | [number, number]
export interface BrushBehavior<T> {
  (group: Selection<SVGGElement, T, any, any>, ...xs: any[]): void
  move(
    group: Selection<SVGGElement, T, any, any> | TransitionLike<SVGGElement, T>,
    selection: null | BrushSelection | ValueFn<SVGGElement, T, BrushSelection>,
    event?: Event
  ): void
  clear(group: Selection<SVGGElement, T, any, any>, event?: Event): void
  extent(): ValueFn<SVGGElement, T, [[number, number], [number, number]]>
  extent(extent: [[number, number], [number, number]]): this
  extent(extent: ValueFn<SVGGElement, T, [[number, number], [number, number]]>): this
  filter(): (this: SVGGElement, event: any, x: T) => boolean
  filter(filterFn: (this: SVGGElement, event: any, x: T) => boolean): this
  touchable(): ValueFn<SVGGElement, T, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<SVGGElement, T, boolean>): this
  keyModifiers(): boolean
  keyModifiers(modifiers: boolean): this
  handleSize(): number
  handleSize(size: number): this
  on(typenames: string): ((this: SVGGElement, event: any, x: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: SVGGElement, event: any, x: T) => void): this
}
export interface D3BrushEvent<T> {
  target: BrushBehavior<T>
  type: "start" | "brush" | "end" | string
  selection: BrushSelection | null
  sourceEvent: any
  mode: "drag" | "space" | "handle" | "center"
}
export interface ChordSubgroup {
  startAngle: number
  endAngle: number
  value: number
  i: number
}
export interface Chord {
  source: ChordSubgroup
  target: ChordSubgroup
}
export interface ChordGroup {
  startAngle: number
  endAngle: number
  value: number
  i: number
}
export interface Chords extends Array<Chord> {
  groups: ChordGroup[]
}
export interface ChordLayout {
  (matrix: number[][]): Chords
  padAngle(): number
  padAngle(angle: number): this
  sortGroups(): ((a: number, b: number) => number) | null
  sortGroups(compare: null | ((a: number, b: number) => number)): this
  sortSubgroups(): ((a: number, b: number) => number) | null
  sortSubgroups(compare: null | ((a: number, b: number) => number)): this
  sortChords(): ((a: number, b: number) => number) | null
  sortChords(compare: null | ((a: number, b: number) => number)): this
}
export interface RibbonSubgroup {
  startAngle: number
  endAngle: number
  radius: number
}
export interface Ribbon {
  source: RibbonSubgroup
  target: RibbonSubgroup
}
export interface RibbonGenerator<This, T, S> {
  (this: This, x: T, ...xs: any[]): void
  (this: This, x: T, ...xs: any[]): string | null
  source(): (this: This, x: T, ...xs: any[]) => S
  source(source: (this: This, x: T, ...xs: any[]) => S): this
  target(): (this: This, x: T, ...xs: any[]) => S
  target(target: (this: This, x: T, ...xs: any[]) => S): this
  radius(): (this: This, d: S, ...xs: any[]) => number
  radius(radius: number): this
  radius(radius: (this: This, d: S, ...xs: any[]) => number): this
  sourceRadius(): (this: This, d: S, ...xs: any[]) => number
  sourceRadius(radius: number): this
  sourceRadius(radius: (this: This, d: S, ...xs: any[]) => number): this
  targetRadius(): (this: This, d: S, ...xs: any[]) => number
  targetRadius(radius: number): this
  targetRadius(radius: (this: This, d: S, ...xs: any[]) => number): this
  startAngle(): (this: This, d: S, ...xs: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, d: S, ...xs: any[]) => number): this
  endAngle(): (this: This, d: S, ...xs: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, d: S, ...xs: any[]) => number): this
  padAngle(): (this: This, d: S, ...xs: any[]) => number
  padAngle(angle: number): this
  padAngle(angle: (this: This, d: S, ...xs: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export interface RibbonArrowGenerator<This, T, S> extends RibbonGenerator<This, T, S> {
  headRadius(): (this: This, d: S, ...xs: any[]) => number
  headRadius(radius: number): this
  headRadius(radius: (this: This, d: S, ...xs: any[]) => number): this
}
export type ColorSpaceObject = RGBColor | HSLColor | LabColor | HCLColor | CubehelixColor
export interface ColorCommonInstance {
  displayable(): boolean
  toString(): string
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): RGBColor
  hex(): string
}
export interface Color {
  displayable(): boolean
  toString(): string
  formatHex(): string
  formatHex8(): string
  formatHsl(): string
  formatRgb(): string
  hex(): string
}
export interface ColorFactory extends Function {
  (cssColorSpecifier: string): RGBColor | HSLColor | null
  (color: ColorSpaceObject | ColorCommonInstance): RGBColor | HSLColor
  readonly prototype: Color
}
export interface RGBColor extends Color {
  r: number
  g: number
  b: number
  opacity: number
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): this
  copy(values?: {
    r?: number | undefined
    g?: number | undefined
    b?: number | undefined
    opacity?: number | undefined
  }): this
  clamp(): this
}
export interface RGBColorFactory extends Function {
  (r: number, g: number, b: number, opacity?: number): RGBColor
  (cssColorSpecifier: string): RGBColor
  (color: ColorSpaceObject | ColorCommonInstance): RGBColor
  readonly prototype: RGBColor
}
export interface HSLColor extends Color {
  h: number
  s: number
  l: number
  opacity: number
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): RGBColor
  copy(values?: {
    h?: number | undefined
    s?: number | undefined
    l?: number | undefined
    opacity?: number | undefined
  }): this
  clamp(): this
}
export interface HSLColorFactory extends Function {
  (h: number, s: number, l: number, opacity?: number): HSLColor
  (cssColorSpecifier: string): HSLColor
  (color: ColorSpaceObject | ColorCommonInstance): HSLColor
  readonly prototype: HSLColor
}
export interface LabColor extends Color {
  l: number
  a: number
  b: number
  opacity: number
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): RGBColor
  copy(values?: {
    l?: number | undefined
    a?: number | undefined
    b?: number | undefined
    opacity?: number | undefined
  }): this
}
export interface LabColorFactory extends Function {
  (l: number, a: number, b: number, opacity?: number): LabColor
  (cssColorSpecifier: string): LabColor
  (color: ColorSpaceObject | ColorCommonInstance): LabColor
  readonly prototype: LabColor
}
export type GrayColorFactory = (l: number, opacity?: number) => LabColor
export interface HCLColor extends Color {
  h: number
  c: number
  l: number
  opacity: number
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): RGBColor
  copy(values?: {
    h?: number | undefined
    c?: number | undefined
    l?: number | undefined
    opacity?: number | undefined
  }): this
}
export interface HCLColorFactory extends Function {
  (h: number, c: number, l: number, opacity?: number): HCLColor
  (cssColorSpecifier: string): HCLColor
  (color: ColorSpaceObject | ColorCommonInstance): HCLColor
  readonly prototype: HCLColor
}
export interface LCHColorFactory {
  (l: number, c: number, h: number, opacity?: number): HCLColor
  (cssColorSpecifier: string): HCLColor
  (color: ColorSpaceObject | ColorCommonInstance): HCLColor
}
export interface CubehelixColor extends Color {
  h: number
  s: number
  l: number
  opacity: number
  brighter(k?: number): this
  darker(k?: number): this
  rgb(): RGBColor
  copy(values?: {
    h?: number | undefined
    s?: number | undefined
    l?: number | undefined
    opacity?: number | undefined
  }): this
}
export interface CubehelixColorFactory extends Function {
  (h: number, s: number, l: number, opacity?: number): CubehelixColor
  (cssColorSpecifier: string): CubehelixColor
  (color: ColorSpaceObject | ColorCommonInstance): CubehelixColor
  readonly prototype: CubehelixColor
}
export const color: ColorFactory
export const rgb: RGBColorFactory
export const hsl: HSLColorFactory
export const lab: LabColorFactory
export const gray: GrayColorFactory
export const hcl: HCLColorFactory
export const lch: LCHColorFactory
export const cubehelix: CubehelixColorFactory
export interface ContourMultiPolygon extends MultiPolygon {
  value: number
}
export interface Contours {
  (values: number[]): ContourMultiPolygon[]
  contour(values: number[], threshold: number): ContourMultiPolygon
  size(): [number, number]
  size(size: [number, number]): this
  smooth(): boolean
  smooth(smooth: boolean): this
  thresholds(): ThresholdCountGenerator<number> | ThresholdNumberArrayGenerator<number>
  thresholds(
    thresholds: number | number[] | ThresholdCountGenerator<number> | ThresholdNumberArrayGenerator<number>
  ): this
}
export interface ContourDensity<T = [number, number]> {
  (data: T[]): ContourMultiPolygon[]
  x(): (x: T) => number
  x(x: (x: T) => number): this
  y(): (x: T) => number
  y(y: (x: T) => number): this
  weight(): (x: T) => number
  weight(weight: (x: T) => number): this
  size(): [number, number]
  size(size: [number, number]): this
  cellSize(): number
  cellSize(cellSize: number): this
  thresholds(): ThresholdCountGenerator<number> | ThresholdNumberArrayGenerator<number>
  thresholds(
    thresholds: number | number[] | ThresholdCountGenerator<number> | ThresholdNumberArrayGenerator<number>
  ): this
  bandwidth(): number
  bandwidth(bandwidth: number): this
}
export interface Delaunay<T> {
  points: ArrayLike<number>
  halfedges: Int32Array
  hull: Uint32Array
  triangles: Uint32Array
  inedges: Int32Array
  find(x: number, y: number, i?: number): number
  neighbors(i: number): IterableIterator<number>
  render(): string
  render(context: Delaunay.MoveContext & Delaunay.LineContext): void
  renderHull(): string
  renderHull(context: Delaunay.MoveContext & Delaunay.LineContext): void
  renderTriangle(i: number): string
  renderTriangle(i: number, context: Delaunay.MoveContext & Delaunay.LineContext & Delaunay.ClosableContext): void
  renderPoints(): string
  renderPoints(context: undefined, radius: number): string
  renderPoints(context: Delaunay.MoveContext & Delaunay.ArcContext, radius?: number): void
  hullPolygon(): Delaunay.Polygon
  trianglePolygon(i: number): Delaunay.Triangle
  trianglePolygons(): IterableIterator<Delaunay.Triangle>
  update(): this
  voronoi(bounds?: Delaunay.Bounds): Voronoi<T>
}
export namespace Delaunay {
  export type Point = [number, number]
  export type Triangle = Point[]
  export type Polygon = Point[]
  export type Bounds = [number, number, number, number]
  export type GetCoordinate<P, PS> = (point: P, i: number, points: PS) => number
  export interface RectContext {
    rect(x: number, y: number, width: number, height: number): void
  }
  export interface MoveContext {
    moveTo(x: number, y: number): void
  }
  export interface LineContext {
    lineTo(x: number, y: number): void
  }
  export interface ArcContext {
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
  }
  export interface ClosableContext {
    closePath(): void
  }
}
export interface Voronoi<T> {
  delaunay: Delaunay<T>
  circumcenters: Float64Array
  vectors: Float64Array
  xmin: number
  ymin: number
  xmax: number
  ymax: number
  contains(i: number, x: number, y: number): boolean
  neighbors(i: number): Iterable<number>
  render(): string
  render(context: Delaunay.MoveContext & Delaunay.LineContext): void
  renderBounds(): string
  renderBounds(context: Delaunay.RectContext): void
  renderCell(i: number): string
  renderCell(i: number, context: Delaunay.MoveContext & Delaunay.LineContext & Delaunay.ClosableContext): void
  cellPolygons(): IterableIterator<Delaunay.Polygon & { i: number }>
  cellPolygon(i: number): Delaunay.Polygon
  update(): this
}
export interface Dispatch<T extends object> {
  apply(type: string, that?: T, args?: any[]): void
  call(type: string, that?: T, ...xs: any[]): void
  copy(): Dispatch<T>
  on(typenames: string): ((this: T, ...xs: any[]) => void) | undefined
  on(typenames: string, callback: null | ((this: T, ...xs: any[]) => void)): this
}
export type DraggedElementBaseType = Element
export type DragContainerElement = HTMLElement | SVGSVGElement | SVGGElement
export interface SubjectPosition {
  x: number
  y: number
}
export interface DragBehavior<B extends DraggedElementBaseType, T, Subject> extends Function {
  (selection: Selection<B, T, any, any>, ...xs: any[]): void
  container(): ValueFn<B, T, DragContainerElement>
  container(accessor: ValueFn<B, T, DragContainerElement>): this
  container(container: DragContainerElement): this
  filter(): (this: B, event: any, x: T) => boolean
  filter(filterFn: (this: B, event: any, x: T) => boolean): this
  touchable(): ValueFn<B, T, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<B, T, boolean>): this
  subject(): (this: B, event: any, x: T) => Subject
  subject(accessor: (this: B, event: any, x: T) => Subject): this
  clickDistance(): number
  clickDistance(distance: number): this
  on(typenames: string): ((this: B, event: any, x: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: B, event: any, x: T) => void): this
}
export interface D3DragEvent<B extends DraggedElementBaseType, T, Subject> {
  target: DragBehavior<B, T, Subject>
  type: "start" | "drag" | "end" | string
  subject: Subject
  x: number
  y: number
  dx: number
  dy: number
  identifier: "mouse" | number
  active: number
  sourceEvent: any
  on(typenames: string): ((this: B, event: any, x: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: B, event: any, x: T) => void): this
}
export type DSVRowString<Columns extends string = string> = {
  [key in Columns]: string | undefined
}
export type DSVRaw<T extends object> = {
  [key in keyof T]: string | undefined
}
export interface DSVRowAny {
  [key: string]: any
}
export interface DSVRowArray<Columns extends string = string> extends Array<DSVRowString<Columns>> {
  columns: Columns[]
}
export interface DSVParsedArray<T> extends Array<T> {
  columns: Array<keyof T>
}
export interface DSV {
  parse<Columns extends string>(dsvString: string): DSVRowArray<Columns>
  parse<ParsedRow extends object, Columns extends string>(
    dsvString: string,
    row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
  ): DSVParsedArray<ParsedRow>
  parseRows(dsvString: string): string[][]
  parseRows<ParsedRow extends object>(
    dsvString: string,
    row: (rawRow: string[], i: number) => ParsedRow | undefined | null
  ): ParsedRow[]
  format<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
  formatBody<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
  formatRows(rows: readonly string[][]): string
  formatRow(row: readonly string[]): string
  formatValue(value: string): string
}

export interface PolyEasingFactory {
  (normalizedTime: number): number
  exponent(e: number): PolyEasingFactory
}
export interface BackEasingFactory {
  (normalizedTime: number): number
  overshoot(s: number): BackEasingFactory
}
export interface ElasticEasingFactory {
  (normalizedTime: number): number
  amplitude(a: number): ElasticEasingFactory
  period(p: number): ElasticEasingFactory
}

export interface SimNode {
  idx?: number | undefined
  x?: number | undefined
  y?: number | undefined
  vx?: number | undefined
  vy?: number | undefined
  fx?: number | null | undefined
  fy?: number | null | undefined
}
export interface SimLink<T extends SimNode> {
  src: T | string | number
  tgt: T | string | number
  idx?: number | undefined
}
export interface Sim<N extends SimNode, L extends SimLink<N> | undefined> {
  alpha(): number
  alpha(x: number): this
  alphaDecay(): number
  alphaDecay(x: number): this
  alphaMin(): number
  alphaMin(x: number): this
  alphaTarget(): number
  alphaTarget(x: number): this
  find(x: number, y: number, radius?: number): N | undefined
  force(x: string, f: null | Force<N, L>): this
  force<T extends Force<N, L>>(x: string): T | undefined
  nodes(): N[]
  nodes(xs: N[]): this
  on(x: "tick" | "end" | string, f: null | ((this: this) => void)): this
  on(x: "tick" | "end" | string): ((this: Sim<N, L>) => void) | undefined
  randomSource(): () => number
  randomSource(f: () => number): this
  restart(): this
  stop(): this
  tick(n?: number): this
  velocityDecay(): number
  velocityDecay(x: number): this
}

export interface Force<N extends SimNode, L extends SimLink<N> | undefined> {
  (alpha?: number): void
  init?(xs: N[], f: () => number): void
}
export interface ForceCenter<T extends SimNode> extends Force<T, any> {
  init(xs: T[], f: () => number): void
  strength(): number
  strength(x: number): this
  x(): number
  x(x: number): this
  y(): number
  y(x: number): this
}
export interface ForceCollide<T extends SimNode> extends Force<T, any> {
  init(xs: T[], f: () => number): void
  iterations(): number
  iterations(x: number): this
  radius(): (x: T, i: number, xs: T[]) => number
  radius(x: number | ((x: T, i: number, xs: T[]) => number)): this
  strength(): number
  strength(x: number): this
}
export interface ForceLink<N extends SimNode, L extends SimLink<N>> extends Force<N, L> {
  distance(): (x: L, i: number, xs: L[]) => number
  distance(x: number | ((x: L, i: number, xs: L[]) => number)): this
  id(): (x: N, i: number, xs: N[]) => string | number
  id(f: (x: N, i: number, xs: N[]) => string | number): this
  init(xs: N[], f: () => number): void
  iterations(): number
  iterations(x: number): this
  links(): L[]
  links(xs: L[]): this
  strength(): (x: L, i: number, xs: L[]) => number
  strength(s: number | ((x: L, i: number, xs: L[]) => number)): this
}
export interface ForceManyBody<T extends SimNode> extends Force<T, any> {
  distanceMax(): number
  distanceMax(x: number): this
  distanceMin(): number
  distanceMin(x: number): this
  init(xs: T[], f: () => number): void
  strength(): (x: T, i: number, xs: T[]) => number
  strength(x: number | ((x: T, i: number, xs: T[]) => number)): this
  theta(): number
  theta(x: number): this
}
export interface ForceX<T extends SimNode> extends Force<T, any> {
  init(xs: T[], f: () => number): void
  strength(): (x: T, i: number, xs: T[]) => number
  strength(x: number | ((x: T, i: number, xs: T[]) => number)): this
  x(): (x: T, i: number, xs: T[]) => number
  x(x: number | ((x: T, i: number, xs: T[]) => number)): this
}
export interface ForceY<T extends SimNode> extends Force<T, any> {
  init(xs: T[], f: () => number): void
  strength(): (x: T, i: number, xs: T[]) => number
  strength(x: number | ((x: T, i: number, xs: T[]) => number)): this
  y(): (x: T, i: number, xs: T[]) => number
  y(x: number | ((x: T, i: number, xs: T[]) => number)): this
}
export interface ForceRadial<T extends SimNode> extends Force<T, any> {
  init(xs: T[], f: () => number): void
  strength(): (x: T, i: number, xs: T[]) => number
  strength(x: number | ((x: T, i: number, xs: T[]) => number)): this
  radius(): (x: T, i: number, xs: T[]) => number
  radius(x: number | ((x: T, i: number, xs: T[]) => number)): this
  x(): (x: T, i: number, xs: T[]) => number
  x(x: number | ((x: T, i: number, xs: T[]) => number)): this
  y(): (x: T, i: number, xs: T[]) => number
  y(x: number | ((x: T, i: number, xs: T[]) => number)): this
}

export interface FormatLocaleDefinition {
  decimal: string
  thousands: string
  grouping: number[]
  currency: [string, string]
  numerals?: string[] | undefined
  percent?: string | undefined
  minus?: string | undefined
  nan?: string | undefined
}
export interface FormatLocaleObject {
  format(specifier: string): (n: number | { valueOf(): number }) => string
  formatPrefix(specifier: string, value: number): (n: number | { valueOf(): number }) => string
}
export interface FormatSpecifierObject {
  fill?: string | undefined
  align?: string | undefined
  sign?: string | undefined
  symbol?: string | undefined
  zero?: string | undefined
  width?: string | undefined
  comma?: string | undefined
  precision?: string | undefined
  trim?: string | undefined
  type?: string | undefined
}
export interface FormatSpecifier {
  fill: string
  align: ">" | "<" | "^" | "="
  sign: "-" | "+" | "(" | " "
  symbol: "$" | "#" | ""
  zero: boolean
  width: number | undefined
  comma: boolean
  precision: number | undefined
  trim: boolean
  type: "e" | "f" | "g" | "r" | "s" | "%" | "p" | "b" | "o" | "d" | "x" | "X" | "c" | "" | "n"
  toString(): string
}

export interface GeoSphere {
  type: "Sphere"
}
export type GeoGeometryObjects = GeoJSON.GeometryObject | GeoSphere
export interface ExtendedGeometryCollection<GeometryType extends GeoGeometryObjects = GeoGeometryObjects> {
  type: string
  bbox?: number[] | undefined
  crs?:
    | {
        type: string
        properties: any
      }
    | undefined
  geometries: GeometryType[]
}
export interface ExtendedFeature<
  GeometryType extends GeoGeometryObjects | null = GeoGeometryObjects | null,
  Properties extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties
> extends GeoJSON.GeoJsonObject {
  geometry: GeometryType
  properties: Properties
  id?: string | number | undefined
}
export interface ExtendedFeatureCollection<FeatureType extends ExtendedFeature = ExtendedFeature>
  extends GeoJSON.GeoJsonObject {
  features: FeatureType[]
}
export type GeoPermissibleObjects =
  | GeoGeometryObjects
  | ExtendedGeometryCollection
  | ExtendedFeature
  | ExtendedFeatureCollection
export function geoArea(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
): number
export function geoBounds(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
): [[number, number], [number, number]]
export function geoCentroid(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
): [number, number]
export function geoContains(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection,
  point: [number, number]
): boolean
export function geoDistance(a: [number, number], b: [number, number]): number
export function geoLength(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
): number
export function geoInterpolate(a: [number, number], b: [number, number]): (t: number) => [number, number]
export interface GeoRotation {
  (point: [number, number]): [number, number]
  invert(point: [number, number]): [number, number]
}
export function geoRotation(angles: [number, number] | [number, number, number]): GeoRotation
export interface GeoCircleGenerator<This = any, T = any> {
  (this: This, d?: T, ...xs: any[]): GeoJSON.Polygon
  center(): (this: This, x: T, ...xs: any[]) => [number, number]
  center(center: [number, number] | ((this: This, x: T, ...xs: any[]) => [number, number])): this
  radius(): (this: This, x: T, ...xs: any[]) => number
  radius(radius: number | ((this: This, x: T, ...xs: any[]) => number)): this
  precision(): (this: This, x: T, ...xs: any[]) => number
  precision(precision: number | ((this: This, x: T, ...xs: any[]) => number)): this
}
export function geoCircle(): GeoCircleGenerator
export function geoCircle<T>(): GeoCircleGenerator<any, T>
export function geoCircle<This, T>(): GeoCircleGenerator<This, T>
export interface GeoGraticuleGenerator {
  (): GeoJSON.MultiLineString
  lines(): GeoJSON.LineString[]
  outline(): GeoJSON.Polygon
  extent(): [[number, number], [number, number]]
  extent(extent: [[number, number], [number, number]]): this
  extentMajor(): [[number, number], [number, number]]
  extentMajor(extent: [[number, number], [number, number]]): this
  extentMinor(): [[number, number], [number, number]]
  extentMinor(extent: [[number, number], [number, number]]): this
  step(): [number, number]
  step(step: [number, number]): this
  stepMajor(): [number, number]
  stepMajor(step: [number, number]): this
  stepMinor(): [number, number]
  stepMinor(step: [number, number]): this
  precision(): number
  precision(angle: number): this
}
export function geoGraticule(): GeoGraticuleGenerator
export function geoGraticule10(): GeoJSON.MultiLineString
export interface GeoStream {
  lineEnd(): void
  lineStart(): void
  point(x: number, y: number, z?: number): void
  polygonEnd(): void
  polygonStart(): void
  sphere?(): void
}
export function geoStream(
  object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection,
  stream: GeoStream
): void
export interface GeoRawProjection {
  (lambda: number, phi: number): [number, number]
  invert?(x: number, y: number): [number, number]
}
export interface GeoStreamWrapper {
  stream(stream: GeoStream): GeoStream
}
export interface GeoProjection extends GeoStreamWrapper {
  (point: [number, number]): [number, number] | null
  invert?(point: [number, number]): [number, number] | null
  preclip(): (stream: GeoStream) => GeoStream
  preclip(preclip: (stream: GeoStream) => GeoStream): this
  postclip(): (stream: GeoStream) => GeoStream
  postclip(postclip: (stream: GeoStream) => GeoStream): this
  clipAngle(): number | null
  clipAngle(angle: null | number): this
  clipExtent(): [[number, number], [number, number]] | null
  clipExtent(extent: null | [[number, number], [number, number]]): this
  scale(): number
  scale(scale: number): this
  translate(): [number, number]
  translate(point: [number, number]): this
  center(): [number, number]
  center(point: [number, number]): this
  angle(): number
  angle(angle: number): this
  reflectX(): boolean
  reflectX(reflect: boolean): this
  reflectY(): boolean
  reflectY(reflect: boolean): this
  rotate(): [number, number, number]
  rotate(angles: [number, number] | [number, number, number]): this
  precision(): number
  precision(precision: number): this
  fitExtent(
    extent: [[number, number], [number, number]],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitSize(
    size: [number, number],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitWidth(
    width: number,
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitHeight(
    height: number,
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
}
export interface GeoConicProjection extends GeoProjection {
  parallels(): [number, number]
  parallels(value: [number, number]): this
}
export interface GeoContext {
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void
  beginPath(): void
  closePath(): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
}
export interface GeoPath<This = any, T extends GeoPermissibleObjects = GeoPermissibleObjects> {
  (this: This, object: T, ...xs: any[]): string | null
  (this: This, object: T, ...xs: any[]): void
  area(object: T): number
  bounds(object: T): [[number, number], [number, number]]
  centroid(object: T): [number, number]
  measure(object: T): number
  context<C extends GeoContext | null>(): C
  context(context: null | GeoContext): this
  projection<P extends GeoConicProjection | GeoProjection | GeoStreamWrapper | null>(): P
  projection(projection: null | GeoProjection | GeoStreamWrapper): this
  pointRadius(): ((this: This, object: T, ...xs: any[]) => number) | number
  pointRadius(value: number | ((this: This, object: T, ...xs: any[]) => number)): this
}
export function geoPath(projection?: GeoProjection | GeoStreamWrapper | null, context?: GeoContext | null): GeoPath
export function geoPath<T extends GeoPermissibleObjects>(
  projection?: GeoProjection | GeoStreamWrapper | null,
  context?: GeoContext | null
): GeoPath<any, T>
export function geoPath<This, T extends GeoPermissibleObjects>(
  projection?: GeoProjection | GeoStreamWrapper | null,
  context?: GeoContext | null
): GeoPath<This, T>
export function geoProjection(project: GeoRawProjection): GeoProjection
export function geoProjectionMutator(factory: (...xs: any[]) => GeoRawProjection): () => GeoProjection
export function geoAzimuthalEqualArea(): GeoProjection
export function geoAzimuthalEqualAreaRaw(): GeoRawProjection
export function geoAzimuthalEquidistant(): GeoProjection
export function geoAzimuthalEquidistantRaw(): GeoRawProjection
export function geoGnomonic(): GeoProjection
export function geoGnomonicRaw(): GeoRawProjection
export function geoOrthographic(): GeoProjection
export function geoOrthographicRaw(): GeoRawProjection
export function geoStereographic(): GeoProjection
export function geoStereographicRaw(): GeoRawProjection
export function geoEqualEarth(): GeoProjection
export function geoEqualEarthRaw(): GeoRawProjection
export function geoAlbersUsa(): GeoProjection
export function geoAlbers(): GeoConicProjection
export function geoConicConformal(): GeoConicProjection
export function geoConicConformalRaw(phi0: number, phi1: number): GeoRawProjection
export function geoConicEqualArea(): GeoConicProjection
export function geoConicEqualAreaRaw(phi0: number, phi1: number): GeoRawProjection
export function geoConicEquidistant(): GeoConicProjection
export function geoConicEquidistantRaw(phi0: number, phi1: number): GeoRawProjection
export function geoEquirectangular(): GeoProjection
export function geoEquirectangularRaw(): GeoRawProjection
export function geoMercator(): GeoProjection
export function geoMercatorRaw(): GeoRawProjection
export function geoTransverseMercator(): GeoProjection
export function geoTransverseMercatorRaw(): GeoRawProjection
export function geoNaturalEarth1(): GeoProjection
export function geoNaturalEarth1Raw(): GeoRawProjection
export interface GeoTransformPrototype {
  lineEnd?(this: this & { stream: GeoStream }): void
  lineStart?(this: this & { stream: GeoStream }): void
  point?(this: this & { stream: GeoStream }, x: number, y: number, z?: number): void
  polygonEnd?(this: this & { stream: GeoStream }): void
  polygonStart?(this: this & { stream: GeoStream }): void
  sphere?(this: this & { stream: GeoStream }): void
}
export function geoTransform<T extends GeoTransformPrototype>(methods: T): { stream(s: GeoStream): T & GeoStream }
export type GeoIdentityTranform = GeoIdentityTransform
export interface GeoIdentityTransform extends GeoStreamWrapper {
  (point: [number, number]): [number, number] | null
  invert(point: [number, number]): [number, number] | null
  postclip(): (stream: GeoStream) => GeoStream
  postclip(postclip: (stream: GeoStream) => GeoStream): this
  scale(): number
  scale(scale: number): this
  translate(): [number, number]
  translate(point: [number, number]): this
  angle(): number
  angle(angle: number): this
  fitExtent(
    extent: [[number, number], [number, number]],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitSize(
    size: [number, number],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  clipExtent(): [[number, number], [number, number]] | null
  clipExtent(extent: null | [[number, number], [number, number]]): this
  reflectX(): boolean
  reflectX(reflect: boolean): this
  reflectY(): boolean
  reflectY(reflect: boolean): this
}
export function geoIdentity(): GeoIdentityTransform
export const geoClipAntimeridian: (stream: GeoStream) => GeoStream
export function geoClipCircle(angle: number): (stream: GeoStream) => GeoStream
export function geoClipRectangle(x0: number, y0: number, x1: number, y1: number): (stream: GeoStream) => GeoStream

export interface HierarchyLink<T> {
  source: HierarchyNode<T>
  target: HierarchyNode<T>
}
export interface HierarchyNode<T> {
  children?: this[] | undefined
  data: T
  parent: this | null
  readonly depth: number
  readonly height: number
  readonly id?: string | undefined
  readonly value?: number | undefined
  [Symbol.iterator](): Iterator<this>
  ancestors(): this[]
  copy(): this
  count(): this
  descendants(): this[]
  each<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachAfter<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachBefore<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  find(f: (x: this) => boolean): this | undefined
  leaves(): this[]
  links(): Array<HierarchyLink<T>>
  path(x: this): this[]
  sort(f: (a: this, b: this) => number): this
  sum(f: (x: T) => number): this
}
export interface StratifyOperator<T> {
  (xs: T[]): HierarchyNode<T>
  id(): (x: T, i: number, xs: T[]) => string | null | "" | undefined
  id(f: (x: T, i: number, xs: T[]) => string | null | "" | undefined): this
  parentId(): (x: T, i: number, xs: T[]) => string | null | "" | undefined
  parentId(f: (x: T, i: number, xs: T[]) => string | null | "" | undefined): this
  path(): ((x: T, i: number, xs: T[]) => string) | null | undefined
  path(f: ((x: T, i: number, xs: T[]) => string) | null | undefined): this
}

export interface HierarchyPointLink<T> {
  source: HierarchyPointNode<T>
  target: HierarchyPointNode<T>
}
export interface HierarchyPointNode<T> extends HierarchyNode<T> {
  x: number
  y: number
  links(): Array<HierarchyPointLink<T>>
}

export interface ClusterLayout<T> {
  (x: HierarchyNode<T>): HierarchyPointNode<T>
  nodeSize(): [number, number] | null
  nodeSize(x: [number, number]): this
  separation(): (a: HierarchyPointNode<T>, b: HierarchyPointNode<T>) => number
  separation(f: (a: HierarchyPointNode<T>, b: HierarchyPointNode<T>) => number): this
  size(): [number, number] | null
  size(x: [number, number]): this
}

export interface TreeLayout<T> {
  (x: HierarchyNode<T>): HierarchyPointNode<T>
  nodeSize(): [number, number] | null
  nodeSize(x: [number, number]): this
  separation(): (a: HierarchyPointNode<T>, b: HierarchyPointNode<T>) => number
  separation(f: (a: HierarchyPointNode<T>, b: HierarchyPointNode<T>) => number): this
  size(): [number, number] | null
  size(x: [number, number]): this
}
export interface HierarchyRectangularLink<T> {
  source: HierarchyRectangularNode<T>
  target: HierarchyRectangularNode<T>
}
export interface HierarchyRectangularNode<T> extends HierarchyNode<T> {
  x0: number
  y0: number
  x1: number
  y1: number
  links(): Array<HierarchyRectangularLink<T>>
}
export interface TreemapLayout<T> {
  (x: HierarchyNode<T>): HierarchyRectangularNode<T>
  tile(): (x: HierarchyRectangularNode<T>, x0: number, y0: number, x1: number, y1: number) => void
  tile(tile: (x: HierarchyRectangularNode<T>, x0: number, y0: number, x1: number, y1: number) => void): this
  size(): [number, number]
  size(x: [number, number]): this
  round(): boolean
  round(x: boolean): this
  padding(): (x: HierarchyRectangularNode<T>) => number
  padding(x: number): this
  padding(f: (x: HierarchyRectangularNode<T>) => number): this
  paddingInner(): (x: HierarchyRectangularNode<T>) => number
  paddingInner(x: number): this
  paddingInner(f: (x: HierarchyRectangularNode<T>) => number): this
  paddingOuter(): (x: HierarchyRectangularNode<T>) => number
  paddingOuter(x: number): this
  paddingOuter(x: (x: HierarchyRectangularNode<T>) => number): this
  paddingTop(): (x: HierarchyRectangularNode<T>) => number
  paddingTop(x: number): this
  paddingTop(f: (x: HierarchyRectangularNode<T>) => number): this
  paddingRight(): (x: HierarchyRectangularNode<T>) => number
  paddingRight(x: number): this
  paddingRight(f: (x: HierarchyRectangularNode<T>) => number): this
  paddingBottom(): (x: HierarchyRectangularNode<T>) => number
  paddingBottom(x: number): this
  paddingBottom(f: (x: HierarchyRectangularNode<T>) => number): this
  paddingLeft(): (x: HierarchyRectangularNode<T>) => number
  paddingLeft(x: number): this
  paddingLeft(f: (x: HierarchyRectangularNode<T>) => number): this
}
export interface RatioSquarifyTilingFactory {
  (x: HierarchyRectangularNode<any>, x0: number, y0: number, x1: number, y1: number): void
  ratio(x: number): RatioSquarifyTilingFactory
}
export interface PartitionLayout<T> {
  (x: HierarchyNode<T>): HierarchyRectangularNode<T>
  padding(): number
  padding(x: number): this
  round(): boolean
  round(x: boolean): this
  size(): [number, number]
  size(x: [number, number]): this
}
export interface HierarchyCircularLink<T> {
  source: HierarchyCircularNode<T>
  target: HierarchyCircularNode<T>
}
export interface HierarchyCircularNode<T> extends HierarchyNode<T> {
  x: number
  y: number
  r: number
  links(): Array<HierarchyCircularLink<T>>
}
export interface PackLayout<T> {
  (x: HierarchyNode<T>): HierarchyCircularNode<T>
  padding(): (x: HierarchyCircularNode<T>) => number
  padding(f: (x: HierarchyCircularNode<T>) => number): this
  padding(x: number): this
  radius(): null | ((x: HierarchyCircularNode<T>) => number)
  radius(f: null | ((x: HierarchyCircularNode<T>) => number)): this
  size(): [number, number]
  size(x: [number, number]): this
}
export interface PackRadius {
  r: number
  x?: number | undefined
  y?: number | undefined
}
export interface PackCircle {
  r: number
  x: number
  y: number
}
export interface ZoomInterpolator extends Function {
  (t: number): ZoomView
  duration: number
  rho(rho: number): this
}
export interface ColorGammaInterpolationFactory extends Function {
  (a: string | ColorCommonInstance, b: string | ColorCommonInstance): (t: number) => string
  gamma(g: number): ColorGammaInterpolationFactory
}
export type ZoomView = [number, number, number]
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
export type NumberArray = TypedArray | DataView

export type ArrayInterpolator<A extends any[]> = (t: number) => A

export interface Path {
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void
  bezierCurveTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number): void
  closePath(): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  rect(x: number, y: number, w: number, h: number): void
  toString(): string
}

export interface QuadtreeLeaf<T> {
  data: T
  next?: QuadtreeLeaf<T> | undefined
  length?: undefined
}
export interface QuadtreeInternalNode<T> extends Array<QuadtreeInternalNode<T> | QuadtreeLeaf<T> | undefined> {
  length: 4
}
export interface Quadtree<T> {
  x(): (x: T) => number
  x(x: (x: T) => number): this
  y(): (x: T) => number
  y(y: (x: T) => number): this
  extent(): [[number, number], [number, number]] | undefined
  extent(extend: [[number, number], [number, number]]): this
  cover(x: number, y: number): this
  add(x: T): this
  addAll(xs: T[]): this
  remove(x: T): this
  removeAll(xs: T[]): this
  copy(): Quadtree<T>
  root(): QuadtreeInternalNode<T> | QuadtreeLeaf<T>
  data(): T[]
  size(): number
  find(x: number, y: number, radius?: number): T | undefined
  visit(
    callback: (
      node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>,
      x0: number,
      y0: number,
      x1: number,
      y1: number
    ) => void | boolean
  ): this
  visitAfter(
    callback: (node: QuadtreeInternalNode<T> | QuadtreeLeaf<T>, x0: number, y0: number, x1: number, y1: number) => void
  ): this
}
export function quadtree<T = [number, number]>(xs?: T[]): Quadtree<T>
export function quadtree<T = [number, number]>(xs: T[], x: (x: T) => number, y: (x: T) => number): Quadtree<T>

export interface RandomNumberGenerationSource {
  source(source: () => number): this
}
export interface RandomUniform extends RandomNumberGenerationSource {
  (max?: number): () => number
  (min: number, max: number): () => number
}
export interface RandomInt extends RandomNumberGenerationSource {
  (max: number): () => number
  (min: number, max: number): () => number
}
export interface RandomNormal extends RandomNumberGenerationSource {
  (mu?: number, sigma?: number): () => number
}
export interface RandomLogNormal extends RandomNumberGenerationSource {
  (mu?: number, sigma?: number): () => number
}
export interface RandomBates extends RandomNumberGenerationSource {
  (n: number): () => number
}
export interface RandomIrwinHall extends RandomNumberGenerationSource {
  (n: number): () => number
}
export interface RandomExponential extends RandomNumberGenerationSource {
  (lambda: number): () => number
}
export interface RandomPareto extends RandomNumberGenerationSource {
  (alpha: number): () => number
}
export interface RandomBernoulli extends RandomNumberGenerationSource {
  (p: number): () => number
}
export interface RandomGeometric extends RandomNumberGenerationSource {
  (p: number): () => number
}
export interface RandomBinomial extends RandomNumberGenerationSource {
  (p: number): () => number
}
export interface RandomGamma extends RandomNumberGenerationSource {
  (k: number, theta?: number): () => number
}
export interface RandomBeta extends RandomNumberGenerationSource {
  (alpha: number, beta: number): () => number
}
export interface RandomWeibull extends RandomNumberGenerationSource {
  (k: number, a?: number, b?: number): () => number
}
export interface RandomCauchy extends RandomNumberGenerationSource {
  (a?: number, b?: number): () => number
}
export interface RandomLogistic extends RandomNumberGenerationSource {
  (a?: number, b?: number): () => number
}
export interface RandomPoisson extends RandomNumberGenerationSource {
  (lambda: number): () => number
}

export interface InterpolatorFactory<T, U> {
  (a: T, b: T): (t: number) => U
}
export type NumberValue = number | { valueOf(): number }
export type UnknownReturnType<Unknown, DefaultUnknown> = [Unknown] extends [never] ? DefaultUnknown : Unknown
export interface ScaleContinuousNumeric<Range, Output, Unknown = never> {
  (value: NumberValue): Output | Unknown
  invert(value: NumberValue): number
  domain(): number[]
  domain(domain: Iterable<NumberValue>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  rangeRound(range: Iterable<NumberValue>): this
  clamp(): boolean
  clamp(clamp: boolean): this
  ticks(count?: number): number[]
  tickFormat(count?: number, specifier?: string): (d: NumberValue) => string
  nice(count?: number): this
  copy(): this
}
export function tickFormat(start: number, stop: number, count: number, specifier?: string): (d: NumberValue) => string
export interface ScaleLinear<Range, Output, Unknown = never> extends ScaleContinuousNumeric<Range, Output, Unknown> {
  interpolate(): InterpolatorFactory<any, any>
  interpolate(interpolate: InterpolatorFactory<Range, Output>): this
  interpolate<NewOutput>(interpolate: InterpolatorFactory<Range, NewOutput>): ScaleLinear<Range, NewOutput, Unknown>
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleLinear<Range, Output, NewUnknown>
}
export function scaleLinear<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleLinear<Range, Output, Unknown>
export function scaleLinear<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleLinear<Range, Output, Unknown>
export interface ScalePower<Range, Output, Unknown = never> extends ScaleContinuousNumeric<Range, Output, Unknown> {
  interpolate(): InterpolatorFactory<any, any>
  interpolate(interpolate: InterpolatorFactory<Range, Output>): this
  interpolate<NewOutput>(interpolate: InterpolatorFactory<Range, NewOutput>): ScalePower<Range, NewOutput, Unknown>
  exponent(): number
  exponent(exponent: number): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScalePower<Range, Output, NewUnknown>
}
export function scalePow<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScalePower<Range, Output, Unknown>
export function scalePow<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScalePower<Range, Output, Unknown>
export function scaleSqrt<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScalePower<Range, Output, Unknown>
export function scaleSqrt<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScalePower<Range, Output, Unknown>
export interface ScaleLogarithmic<Range, Output, Unknown = never>
  extends ScaleContinuousNumeric<Range, Output, Unknown> {
  domain(): number[]
  domain(domain: Iterable<NumberValue>): this
  interpolate(): InterpolatorFactory<any, any>
  interpolate(interpolate: InterpolatorFactory<Range, Output>): this
  interpolate<NewOutput>(
    interpolate: InterpolatorFactory<Range, NewOutput>
  ): ScaleLogarithmic<Range, NewOutput, Unknown>
  ticks(count?: number): number[]
  tickFormat(count?: number, specifier?: string): (d: NumberValue) => string
  nice(): this
  base(): number
  base(base: number): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleLogarithmic<Range, Output, NewUnknown>
}
export function scaleLog<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleLogarithmic<Range, Output, Unknown>
export function scaleLog<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleLogarithmic<Range, Output, Unknown>
export interface ScaleSymLog<Range, Output, Unknown = never> extends ScaleContinuousNumeric<Range, Output, Unknown> {
  tickFormat(count?: number, specifier?: string): (d: NumberValue) => string
  constant(): number
  constant(constant: number): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleSymLog<Range, Output, NewUnknown>
}
export function scaleSymlog<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleSymLog<Range, Output, Unknown>
export function scaleSymlog<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleSymLog<Range, Output, Unknown>
export interface ScaleIdentity<Unknown = never> {
  (value: NumberValue): number | Unknown
  invert(value: NumberValue): number
  domain(): number[]
  domain(domain: Iterable<NumberValue>): this
  range(): number[]
  range(range: Iterable<NumberValue>): this
  ticks(count?: number): number[]
  tickFormat(count?: number, specifier?: string): (d: NumberValue) => string
  nice(count?: number): this
  copy(): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleIdentity<NewUnknown>
}
export function scaleIdentity<Unknown = never>(range?: Iterable<NumberValue>): ScaleIdentity<Unknown>
export interface ScaleRadial<Range, Output, Unknown = never> extends ScaleContinuousNumeric<Range, Output, Unknown> {
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleRadial<Range, Output, NewUnknown>
}
export function scaleRadial<Range = number, Unknown = never>(
  range?: Iterable<Range>
): ScaleRadial<Range, Range, Unknown>
export function scaleRadial<Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleRadial<Range, Range, Unknown>
export interface ScaleTime<Range, Output, Unknown = never> {
  (value: Date | NumberValue): Output | Unknown
  invert(value: NumberValue): Date
  domain(): Date[]
  domain(domain: Iterable<Date | NumberValue>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  rangeRound(range: Iterable<NumberValue>): this
  clamp(): boolean
  clamp(clamp: boolean): this
  interpolate(): InterpolatorFactory<any, any>
  interpolate(interpolate: InterpolatorFactory<Range, Output>): this
  interpolate<NewOutput>(interpolate: InterpolatorFactory<Range, NewOutput>): ScaleTime<Range, NewOutput, Unknown>
  ticks(count?: number): Date[]
  ticks(interval: TimeInterval): Date[]
  tickFormat(count?: number, specifier?: string): (d: Date) => string
  tickFormat(interval: TimeInterval, specifier?: string): (d: Date) => string
  nice(count?: number): this
  nice(interval: CountableTimeInterval): this
  copy(): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleTime<Range, Output, NewUnknown>
}
export function scaleTime<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleTime<Range, Output, Unknown>
export function scaleTime<Range, Output = Range, Unknown = never>(
  domain: Iterable<Date | NumberValue>,
  range: Iterable<Range>
): ScaleTime<Range, Output, Unknown>
export function scaleUtc<Range = number, Output = Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleTime<Range, Output, Unknown>
export function scaleUtc<Range, Output = Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleTime<Range, Output, Unknown>
export interface ScaleSequentialBase<Output, Unknown = never> {
  (value: NumberValue): Output | Unknown
  domain(): [number, number]
  domain(domain: Iterable<NumberValue>): this
  clamp(): boolean
  clamp(clamp: boolean): this
  range(): () => [Output, Output]
  range(range: Iterable<Output>): this
  rangeRound(range: Iterable<NumberValue>): this
  copy(): this
}
export interface ScaleSequential<Output, Unknown = never> extends ScaleSequentialBase<Output, Unknown> {
  interpolator(): (t: number) => Output
  interpolator(interpolator: (t: number) => Output): this
  interpolator<NewOutput>(interpolator: (t: number) => NewOutput): ScaleSequential<NewOutput, Unknown>
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleSequential<Output, NewUnknown>
}
export function scaleSequential<Output = number, Unknown = never>(
  interpolator?: ((t: number) => Output) | Iterable<Output>
): ScaleSequential<Output, Unknown>
export function scaleSequential<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: ((t: number) => Output) | Iterable<Output>
): ScaleSequential<Output, Unknown>
export function scaleSequentialLog<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialLog<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialPow<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialPow<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialSqrt<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialSqrt<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialSymlog<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleSequential<Output, Unknown>
export function scaleSequentialSymlog<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleSequential<Output, Unknown>
export interface ScaleSequentialQuantile<Output, Unknown = never> extends ScaleSequentialBase<Output, Unknown> {
  quantiles(): number[]
  interpolator(): (t: number) => Output
  interpolator(interpolator: (t: number) => Output): this
  interpolator<NewOutput>(interpolator: (t: number) => NewOutput): ScaleSequentialQuantile<NewOutput, Unknown>
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleSequentialQuantile<Output, NewUnknown>
}
export function scaleSequentialQuantile<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleSequentialQuantile<Output, Unknown>
export function scaleSequentialQuantile<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleSequentialQuantile<Output, Unknown>
export interface ScaleDiverging<Output, Unknown = never> {
  (value: NumberValue): Output | Unknown
  domain(): [number, number, number]
  domain(domain: Iterable<NumberValue>): this
  clamp(): boolean
  clamp(clamp: boolean): this
  interpolator(): (t: number) => Output
  interpolator(interpolator?: (t: number) => Output): this
  range(): () => [Output, Output, Output]
  range(range: Iterable<Output>): this
  rangeRound(range: Iterable<NumberValue>): this
  copy(): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleDiverging<Output, NewUnknown>
}
export function scaleDiverging<Output = number, Unknown = never>(
  interpolator?: ((t: number) => Output) | Iterable<Output>
): ScaleDiverging<Output, Unknown>
export function scaleDiverging<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: ((t: number) => Output) | Iterable<Output>
): ScaleDiverging<Output, Unknown>
export function scaleDivergingLog<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingLog<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingPow<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingPow<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingSqrt<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingSqrt<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingSymlog<Output = number, Unknown = never>(
  interpolator?: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export function scaleDivergingSymlog<Output, Unknown = never>(
  domain: Iterable<NumberValue>,
  interpolator: (t: number) => Output
): ScaleDiverging<Output, Unknown>
export interface ScaleQuantize<Range, Unknown = never> {
  (value: NumberValue): Range | Unknown
  invertExtent(value: Range): [number, number]
  domain(): [number, number]
  domain(domain: Iterable<NumberValue>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  ticks(count?: number): number[]
  tickFormat(count?: number, specifier?: string): (d: NumberValue) => string
  nice(count?: number): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleQuantize<Range, NewUnknown>
  thresholds(): number[]
  copy(): this
}
export function scaleQuantize<Range = number, Unknown = never>(range?: Iterable<Range>): ScaleQuantize<Range, Unknown>
export function scaleQuantize<Range, Unknown = never>(
  domain: Iterable<NumberValue>,
  range: Iterable<Range>
): ScaleQuantize<Range, Unknown>
export interface ScaleQuantile<Range, Unknown = never> {
  (value: NumberValue): Range | Unknown
  invertExtent(value: Range): [number, number]
  domain(): number[]
  domain(domain: Iterable<NumberValue | null | undefined>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  quantiles(): number[]
  copy(): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleQuantile<Range, NewUnknown>
}
export function scaleQuantile<Range = number, Unknown = never>(range?: Iterable<Range>): ScaleQuantile<Range, Unknown>
export function scaleQuantile<Range, Unknown = never>(
  domain: Iterable<NumberValue | null | undefined>,
  range: Iterable<Range>
): ScaleQuantile<Range, Unknown>
export interface ScaleThreshold<Domain extends number | string | Date, Range, Unknown = never> {
  (value: Domain): Range | Unknown
  invertExtent(value: Range): [Domain | undefined, Domain | undefined]
  domain(): Domain[]
  domain(domain: Iterable<Domain>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  copy(): this
  unknown(): UnknownReturnType<Unknown, undefined>
  unknown<NewUnknown>(value: NewUnknown): ScaleThreshold<Domain, Range, NewUnknown>
}
export function scaleThreshold<Domain extends number | string | Date = number, Range = number, Unknown = never>(
  range?: Iterable<Range>
): ScaleThreshold<Domain, Range, Unknown>
export function scaleThreshold<Domain extends number | string | Date, Range, Unknown = never>(
  domain: Iterable<Domain>,
  range: Iterable<Range>
): ScaleThreshold<Domain, Range, Unknown>
export interface ScaleOrdinal<Domain extends { toString(): string }, Range, Unknown = never> {
  (x: Domain): Range | Unknown
  domain(): Domain[]
  domain(domain: Iterable<Domain>): this
  range(): Range[]
  range(range: Iterable<Range>): this
  unknown(): UnknownReturnType<Unknown, { name: "implicit" }>
  unknown<NewUnknown>(
    value: NewUnknown
  ): NewUnknown extends { name: "implicit" } ? ScaleOrdinal<Domain, Range> : ScaleOrdinal<Domain, Range, NewUnknown>
  copy(): this
}
export function scaleOrdinal<Range>(range?: Iterable<Range>): ScaleOrdinal<string, Range>
export function scaleOrdinal<Domain extends { toString(): string }, Range, Unknown = never>(
  range?: Iterable<Range>
): ScaleOrdinal<Domain, Range, Unknown>
export function scaleOrdinal<Domain extends { toString(): string }, Range, Unknown = never>(
  domain: Iterable<Domain>,
  range: Iterable<Range>
): ScaleOrdinal<Domain, Range, Unknown>
export const scaleImplicit: { name: "implicit" }
export interface ScaleBand<Domain extends { toString(): string }> {
  (x: Domain): number | undefined
  domain(): Domain[]
  domain(domain: Iterable<Domain>): this
  range(): [number, number]
  range(range: Iterable<NumberValue>): this
  rangeRound(range: Iterable<NumberValue>): this
  round(): boolean
  round(round: boolean): this
  paddingInner(): number
  paddingInner(padding: number): this
  paddingOuter(): number
  paddingOuter(padding: number): this
  padding(): number
  padding(padding: number): this
  align(): number
  align(align: number): this
  bandwidth(): number
  step(): number
  copy(): this
}
export function scaleBand<Domain extends { toString(): string } = string>(
  range?: Iterable<NumberValue>
): ScaleBand<Domain>
export function scaleBand<Domain extends { toString(): string }>(
  domain: Iterable<Domain>,
  range: Iterable<NumberValue>
): ScaleBand<Domain>
export interface ScalePoint<Domain extends { toString(): string }> {
  (x: Domain): number | undefined
  domain(): Domain[]
  domain(domain: Iterable<Domain>): this
  range(): [number, number]
  range(range: Iterable<NumberValue>): this
  rangeRound(range: Iterable<NumberValue>): this
  round(): boolean
  round(round: boolean): this
  padding(): number
  padding(padding: number): this
  align(): number
  align(align: number): this
  bandwidth(): number
  step(): number
  copy(): this
}
export function scalePoint<Domain extends { toString(): string } = string>(
  range?: Iterable<NumberValue>
): ScalePoint<Domain>
export function scalePoint<Domain extends { toString(): string }>(
  domain: Iterable<Domain>,
  range: Iterable<NumberValue>
): ScalePoint<Domain>

export type BaseType = Element | EnterElement | Document | Window | null
export type KeyType = string | number
export interface ArrayLike<T> {
  length: number
  item(i: number): T | null
  [i: number]: T
}
export interface EnterElement {
  ownerDocument: Document
  namespaceURI: string
  appendChild(newChild: Node): Node
  insertBefore(newChild: Node, refChild: Node): Node
  querySelector(selectors: string): Element
  querySelectorAll(selectors: string): NodeListOf<Element>
}
export type ContainerElement = HTMLElement | SVGSVGElement | SVGGElement
export interface ClientPointEvent {
  clientX: number
  clientY: number
}
export interface CustomEventParameters {
  bubbles: boolean
  cancelable: boolean
  detail: any
}
export type ValueFn<B extends BaseType, T, Result> = (this: B, x: T, i: number, groups: B[] | ArrayLike<B>) => Result
export interface TransitionLike<B extends BaseType, T> {
  selection(): Selection<B, T, any, any>
  on(type: string, listener: null): TransitionLike<B, T>
  on(type: string, listener: ValueFn<B, T, void>): TransitionLike<B, T>
  tween(name: string, tweenFn: null): TransitionLike<B, T>
  tween(name: string, tweenFn: ValueFn<B, T, (t: number) => void>): TransitionLike<B, T>
}
export function select<B extends BaseType, T>(selector: string): Selection<B, T, HTMLElement, any>
export function select<B extends BaseType, T>(node: B): Selection<B, T, null, undefined>
export function selectAll(selector?: null): Selection<null, undefined, null, undefined>
export function selectAll<B extends BaseType, T>(selector: string): Selection<B, T, HTMLElement, any>
export function selectAll<B extends BaseType, T>(
  nodes: B[] | ArrayLike<B> | Iterable<B>
): Selection<B, T, null, undefined>

export interface Selection<B extends BaseType, T, PElement extends BaseType, P> {
  select<DescElement extends BaseType>(selector: string): Selection<DescElement, T, PElement, P>
  select<DescElement extends BaseType>(selector: null): Selection<null, undefined, PElement, P>
  select<DescElement extends BaseType>(selector: ValueFn<B, T, DescElement>): Selection<DescElement, T, PElement, P>
  selectAll(selector?: null): Selection<null, undefined, B, T>
  selectAll<DescElement extends BaseType, O>(selector: string): Selection<DescElement, O, B, T>
  selectAll<DescElement extends BaseType, O>(
    selector: ValueFn<B, T, DescElement[] | ArrayLike<DescElement> | Iterable<DescElement>>
  ): Selection<DescElement, O, B, T>
  filter(selector: string): Selection<B, T, PElement, P>
  filter<FilteredElement extends BaseType>(selector: string): Selection<FilteredElement, T, PElement, P>
  filter(selector: ValueFn<B, T, boolean>): Selection<B, T, PElement, P>
  filter<FilteredElement extends BaseType>(selector: ValueFn<B, T, boolean>): Selection<FilteredElement, T, PElement, P>
  merge(other: Selection<B, T, PElement, P> | TransitionLike<B, T>): Selection<B, T, PElement, P>
  selectChild<DescElement extends BaseType>(selector?: string): Selection<DescElement, T, PElement, P>
  selectChild<ResultElement extends BaseType, ChildElement extends BaseType>(
    selector: (child: ChildElement, i: number, children: ChildElement[]) => boolean
  ): Selection<ResultElement, T, PElement, P>
  selectChildren<DescElement extends BaseType, O>(selector?: string): Selection<DescElement, O, B, T>
  selectChildren<ResultElement extends BaseType, ResultDatum, ChildElement extends BaseType>(
    selector: (child: ChildElement, i: number, children: ChildElement[]) => boolean
  ): Selection<ResultElement, ResultDatum, B, T>
  selection(): this
  attr(name: string): string
  attr(
    name: string,
    value:
      | null
      | string
      | number
      | boolean
      | ReadonlyArray<string | number>
      | ValueFn<B, T, null | string | number | boolean | ReadonlyArray<string | number>>
  ): this
  classed(names: string): boolean
  classed(names: string, value: boolean): this
  classed(names: string, value: ValueFn<B, T, boolean>): this
  style(name: string): string
  style(name: string, value: null): this
  style(name: string, value: string | number | boolean, priority?: null | "important"): this
  style(name: string, value: ValueFn<B, T, string | number | boolean | null>, priority?: null | "important"): this
  property(name: string): any
  property<T>(name: Local<T>): T | undefined
  property(name: string, value: ValueFn<B, T, any> | null): this
  property(name: string, value: any): this
  property<T>(name: Local<T>, value: ValueFn<B, T, T>): this
  property<T>(name: Local<T>, value: T): this
  text(): string
  text(value: null | string | number | boolean | ValueFn<B, T, string | number | boolean | null>): this
  html(): string
  html(value: null | string | ValueFn<B, T, string | null>): this
  append<K extends keyof ElementTagNameMap>(type: K): Selection<ElementTagNameMap[K], T, PElement, P>
  append<ChildElement extends BaseType>(type: string): Selection<ChildElement, T, PElement, P>
  append<ChildElement extends BaseType>(type: ValueFn<B, T, ChildElement>): Selection<ChildElement, T, PElement, P>
  insert<K extends keyof ElementTagNameMap>(
    type: K,
    before?: string | ValueFn<B, T, BaseType>
  ): Selection<ElementTagNameMap[K], T, PElement, P>
  insert<ChildElement extends BaseType>(
    type: string | ValueFn<B, T, ChildElement>,
    before?: string | ValueFn<B, T, BaseType>
  ): Selection<ChildElement, T, PElement, P>
  remove(): this
  clone(deep?: boolean): Selection<B, T, PElement, P>
  sort(comparator?: (a: T, b: T) => number): this
  order(): this
  raise(): this
  lower(): this
  data(): T[]
  data<NewDatum>(
    data: NewDatum[] | Iterable<NewDatum> | ValueFn<PElement, P, NewDatum[] | Iterable<NewDatum>>,
    key?: ValueFn<B | PElement, T | NewDatum, KeyType>
  ): Selection<B, NewDatum, PElement, P>
  join<K extends keyof ElementTagNameMap, OldDatum = T>(
    enter: K,
    update?: (elem: Selection<B, T, PElement, P>) => Selection<B, T, PElement, P> | TransitionLike<B, T> | undefined,
    exit?: (elem: Selection<B, OldDatum, PElement, P>) => void
  ): Selection<B | ElementTagNameMap[K], T, PElement, P>
  join<ChildElement extends BaseType, OldDatum = T>(
    enter:
      | string
      | ((
          elem: Selection<EnterElement, T, PElement, P>
        ) => Selection<ChildElement, T, PElement, P> | TransitionLike<B, T>),
    update?: (elem: Selection<B, T, PElement, P>) => Selection<B, T, PElement, P> | TransitionLike<B, T> | undefined,
    exit?: (elem: Selection<B, OldDatum, PElement, P>) => void
  ): Selection<ChildElement | B, T, PElement, P>
  enter(): Selection<EnterElement, T, PElement, P>
  exit<OldDatum>(): Selection<B, OldDatum, PElement, P>
  datum(): T
  datum(value: null): Selection<B, undefined, PElement, P>
  datum<NewDatum>(value: ValueFn<B, T, NewDatum>): Selection<B, NewDatum, PElement, P>
  datum<NewDatum>(value: NewDatum): Selection<B, NewDatum, PElement, P>
  on(typenames: string): ((this: B, event: any, x: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: B, event: any, x: T) => void, options?: any): this
  dispatch(type: string, parameters?: CustomEventParameters): this
  dispatch(type: string, parameters?: ValueFn<B, T, CustomEventParameters>): this
  each(func: ValueFn<B, T, void>): this
  call(func: (selection: Selection<B, T, PElement, P>, ...xs: any[]) => void, ...xs: any[]): this
  empty(): boolean
  nodes(): B[]
  node(): B | null
  size(): number
  [Symbol.iterator](): Iterator<B>
}
export type SelectionFn = () => Selection<HTMLElement, any, null, undefined>
export const selection: SelectionFn
export function pointer(event: any, target?: any): [number, number]
export function pointers(event: any, target?: any): Array<[number, number]>
export function style(node: Element, name: string): string
export interface Local<T> {
  get(node: Element): T | undefined
  remove(node: Element): boolean
  set(node: Element, value: T): T
  toString(): string
}
export function local<T>(): Local<T>
export interface NamespaceLocalObject {
  space: string
  local: string
}
export function namespace(prefixedLocal: string): NamespaceLocalObject | string
export interface NamespaceMap {
  [prefix: string]: string
}
export const namespaces: NamespaceMap
export function window(DOMNode: Window | Document | Element): Window
export function create<K extends keyof ElementTagNameMap>(
  name: K
): Selection<ElementTagNameMap[K], undefined, null, undefined>
export function create<NewGElement extends Element>(name: string): Selection<NewGElement, undefined, null, undefined>
export function creator<K extends keyof ElementTagNameMap>(name: K): (this: BaseType) => ElementTagNameMap[K]
export function creator<NewGElement extends Element>(name: string): (this: BaseType) => NewGElement
export function matcher(selector: string): (this: BaseType) => boolean
export function selector<DescElement extends Element>(selector: string): (this: BaseType) => DescElement
export function selectorAll<DescElement extends Element>(selector: string): (this: BaseType) => NodeListOf<DescElement>
declare global {
  interface CanvasRenderingContext2D {}
}
export interface CanvasPath_D3Shape {
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
  closePath(): void
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  rect(x: number, y: number, w: number, h: number): void
}
export interface DefaultArcObject {
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  padAngle?: number | undefined
}
export interface Arc<This, T> {
  (this: This, x: T, ...xs: any[]): string | null
  (this: This, x: T, ...xs: any[]): void
  centroid(x: T, ...xs: any[]): [number, number]
  innerRadius(): (this: This, x: T, ...xs: any[]) => number
  innerRadius(radius: number): this
  innerRadius(radius: (this: This, x: T, ...xs: any[]) => number): this
  outerRadius(): (this: This, x: T, ...xs: any[]) => number
  outerRadius(radius: number): this
  outerRadius(radius: (this: This, x: T, ...xs: any[]) => number): this
  cornerRadius(): (this: This, x: T, ...xs: any[]) => number
  cornerRadius(radius: number): this
  cornerRadius(radius: (this: This, x: T, ...xs: any[]) => number): this
  startAngle(): (this: This, x: T, ...xs: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, x: T, ...xs: any[]) => number): this
  endAngle(): (this: This, x: T, ...xs: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, x: T, ...xs: any[]) => number): this
  padAngle(): (this: This, x: T, ...xs: any[]) => number | undefined
  padAngle(angle: number | undefined): this
  padAngle(angle: (this: This, x: T, ...xs: any[]) => number | undefined): this
  padRadius(): ((this: This, x: T, ...xs: any[]) => number) | null
  padRadius(radius: null | number | ((this: This, x: T, ...xs: any[]) => number)): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export interface PieArcDatum<T> {
  data: T
  value: number
  i: number
  startAngle: number
  endAngle: number
  padAngle: number
}
export interface Pie<This, T> {
  (this: This, data: T[], ...xs: any[]): Array<PieArcDatum<T>>
  value(): (x: T, i: number, data: T[]) => number
  value(value: number): this
  value(value: (x: T, i: number, data: T[]) => number): this
  sort(): ((a: T, b: T) => number) | null
  sort(comparator: (a: T, b: T) => number): this
  sort(comparator: null): this
  sortValues(): ((a: number, b: number) => number) | null
  sortValues(comparator: ((a: number, b: number) => number) | null): this
  startAngle(): (this: This, data: T[], ...xs: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, data: T[], ...xs: any[]) => number): this
  endAngle(): (this: This, data: T[], ...xs: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, data: T[], ...xs: any[]) => number): this
  padAngle(): (this: This, data: T[], ...xs: any[]) => number
  padAngle(angle: number): this
  padAngle(angle: (this: This, data: T[], ...xs: any[]) => number): this
}
export interface Line<T> {
  (data: Iterable<T> | T[]): string | null
  (data: Iterable<T> | T[]): void
  x(): (x: T, i: number, data: T[]) => number
  x(x: number): this
  x(x: (x: T, i: number, data: T[]) => number): this
  y(): (x: T, i: number, data: T[]) => number
  y(y: number): this
  y(y: (x: T, i: number, data: T[]) => number): this
  defined(): (x: T, i: number, data: T[]) => boolean
  defined(defined: boolean): this
  defined(defined: (x: T, i: number, data: T[]) => boolean): this
  curve(): CurveFactory | CurveFactoryLineOnly
  curve<C extends CurveFactory | CurveFactoryLineOnly>(): C
  curve(curve: CurveFactory | CurveFactoryLineOnly): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export interface LineRadial<T> {
  (data: Iterable<T> | T[]): string | null
  (data: Iterable<T> | T[]): void
  angle(): (x: T, i: number, data: T[]) => number
  angle(angle: number): this
  angle(angle: (x: T, i: number, data: T[]) => number): this
  radius(): (x: T, i: number, data: T[]) => number
  radius(radius: number): this
  radius(radius: (x: T, i: number, data: T[]) => number): this
  defined(): (x: T, i: number, data: T[]) => boolean
  defined(defined: boolean): this
  defined(defined: (x: T, i: number, data: T[]) => boolean): this
  curve(): CurveFactory | CurveFactoryLineOnly
  curve<C extends CurveFactory | CurveFactoryLineOnly>(): C
  curve(curve: CurveFactory | CurveFactoryLineOnly): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export type RadialLine<T> = LineRadial<T>
export function radialLine(): RadialLine<[number, number]>
export function radialLine<T>(): RadialLine<T>

export interface Area<T> {
  (xs: Iterable<T> | T[]): string | null
  (xs: Iterable<T> | T[]): void
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFactory
  curve(x: CurveFactory): this
  curve<C extends CurveFactory>(): C
  defined(): (x: T, i: number, xs: T[]) => boolean
  defined(f: (x: T, i: number, xs: T[]) => boolean): this
  defined(x: boolean): this
  lineX0(): Line<T>
  lineX1(): Line<T>
  lineY0(): Line<T>
  lineY1(): Line<T>
  x(): (x: T, i: number, xs: T[]) => number
  x(f: (x: T, i: number, xs: T[]) => number): this
  x(x: number): this
  x0(): (x: T, i: number, xs: T[]) => number
  x0(f: (x: T, i: number, xs: T[]) => number): this
  x0(x: number): this
  x1(): ((x: T, i: number, xs: T[]) => number) | null
  x1(f: (x: T, i: number, xs: T[]) => number): this
  x1(x: null | number): this
  y(): (x: T, i: number, xs: T[]) => number
  y(f: (x: T, i: number, xs: T[]) => number): this
  y(y: number): this
  y0(): (x: T, i: number, xs: T[]) => number
  y0(f: (x: T, i: number, xs: T[]) => number): this
  y0(y: number): this
  y1(): ((x: T, i: number, xs: T[]) => number) | null
  y1(f: (x: T, i: number, xs: T[]) => number): this
  y1(y: null | number): this
}
export interface AreaRadial<T> {
  (xs: Iterable<T> | T[]): string | null
  (xs: Iterable<T> | T[]): void
  angle(): (x: T, i: number, xs: T[]) => number
  angle(f: (x: T, i: number, xs: T[]) => number): this
  angle(x: number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFactory
  curve(x: CurveFactory): this
  curve<C extends CurveFactory>(): C
  defined(): (x: T, i: number, xs: T[]) => boolean
  defined(f: (x: T, i: number, xs: T[]) => boolean): this
  defined(x: boolean): this
  endAngle(): ((x: T, i: number, xs: T[]) => number) | null
  endAngle(f: (x: T, i: number, xs: T[]) => number): this
  endAngle(x: null | number): this
  innerRadius(): (x: T, i: number, xs: T[]) => number
  innerRadius(f: (x: T, i: number, xs: T[]) => number): this
  innerRadius(x: number): this
  lineEndAngle(): LineRadial<T>
  lineInnerRadius(): LineRadial<T>
  lineOuterRadius(): LineRadial<T>
  lineStartAngle(): LineRadial<T>
  outerRadius(): ((x: T, i: number, xs: T[]) => number) | null
  outerRadius(f: (x: T, i: number, xs: T[]) => number): this
  outerRadius(x: null | number): this
  radius(): (x: T, i: number, xs: T[]) => number
  radius(f: (x: T, i: number, xs: T[]) => number): this
  radius(x: number): this
  startAngle(): (x: T, i: number, xs: T[]) => number
  startAngle(f: (x: T, i: number, xs: T[]) => number): this
  startAngle(x: number): this
}
export type RadialArea<T> = AreaRadial<T>
export function radialArea(): RadialArea<[number, number]>
export function radialArea<T>(): RadialArea<T>

export interface CurveGeneratorLineOnly {
  lineStart(): void
  lineEnd(): void
  point(x: number, y: number): void
}
export interface CurveGenerator extends CurveGeneratorLineOnly {
  areaStart(): void
  areaEnd(): void
}
export type CurveFactoryLineOnly = (x: CanvasRenderingContext2D | Path) => CurveGeneratorLineOnly
export type CurveFactory = (x: CanvasRenderingContext2D | Path) => CurveGenerator

export interface CurveBundleFactory extends CurveFactoryLineOnly {
  beta(x: number): this
}
export interface CurveCardinalFactory extends CurveFactory {
  tension(x: number): this
}
export interface CurveCatmullRomFactory extends CurveFactory {
  alpha(x: number): this
}
export interface DefaultLinkObject {
  source: [number, number]
  target: [number, number]
}
export interface Link<This, L, N> {
  (this: This, d: L, ...xs: any[]): string | null
  (this: This, d: L, ...xs: any[]): void
  source(): (this: This, d: L, ...xs: any[]) => N
  source(source: (this: This, d: L, ...xs: any[]) => N): this
  target(): (this: This, d: L, ...xs: any[]) => N
  target(target: (this: This, d: L, ...xs: any[]) => N): this
  x(): (this: This, node: N, ...xs: any[]) => number
  x(x: (this: This, node: N, ...xs: any[]) => number): this
  y(): (this: This, node: N, ...xs: any[]) => number
  y(y: (this: This, node: N, ...xs: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export interface LinkRadial<This, L, N> {
  (this: This, d: L, ...xs: any[]): string | null
  (this: This, d: L, ...xs: any[]): void
  source(): (this: This, d: L, ...xs: any[]) => N
  source(source: (this: This, d: L, ...xs: any[]) => N): this
  target(): (this: This, d: L, ...xs: any[]) => N
  target(target: (this: This, d: L, ...xs: any[]) => N): this
  angle(): (this: This, node: N, ...xs: any[]) => number
  angle(angle: (this: This, node: N, ...xs: any[]) => number): this
  radius(): (this: This, node: N, ...xs: any[]) => number
  radius(radius: (this: This, node: N, ...xs: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export type RadialLink<This, L, N> = LinkRadial<This, L, N>

export interface SymbolType {
  draw(path: CanvasPath_D3Shape, size: number): void
}
export interface Symbol<This, T> {
  (this: This, x?: T, ...xs: any[]): string | null
  (this: This, x?: T, ...xs: any[]): void
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  size(): (this: This, x: T, ...xs: any[]) => number
  size(f: (this: This, x: T, ...xs: any[]) => number): this
  size(size: number): this
  type(): (this: This, x: T, ...xs: any[]) => SymbolType
  type(f: (this: This, x: T, ...xs: any[]) => SymbolType): this
  type(x: SymbolType): this
}

export interface SeriesPoint<T> extends Array<number> {
  0: number
  1: number
  data: T
}
export interface Series<T, K> extends Array<SeriesPoint<T>> {
  key: K
  i: number
}
export interface Stack<This, T, K> {
  (data: Iterable<T>, ...xs: any[]): Array<Series<T, K>>
  keys(): (this: This, data: T[], ...xs: any[]) => K[]
  keys(keys: Iterable<K> | ((this: This, data: T[], ...xs: any[]) => K[])): this
  value(): (x: T, key: K, i: number, data: T[]) => number
  value(value: number): this
  value(value: (x: T, key: K, i: number, data: T[]) => number): this
  order(): (series: Series<T, K>) => Iterable<number>
  order(order: null | Iterable<number>): this
  order(order: (series: Series<T, K>) => Iterable<number>): this
  offset(): (series: Series<T, K>, order: number[]) => void
  offset(offset: null): this
  offset(offset: (series: Series<T, K>, order: number[]) => void): this
}
export function stackOrderAppearance(series: Series<any, any>): number[]
export function stackOrderAscending(series: Series<any, any>): number[]
export function stackOrderDescending(series: Series<any, any>): number[]
export function stackOrderInsideOut(series: Series<any, any>): number[]
export function stackOrderNone(series: Series<any, any>): number[]
export function stackOrderReverse(series: Series<any, any>): number[]
export function stackOffsetExpand(series: Series<any, any>, order: Iterable<number>): void
export function stackOffsetDiverging(series: Series<any, any>, order: Iterable<number>): void
export function stackOffsetNone(series: Series<any, any>, order: Iterable<number>): void
export function stackOffsetSilhouette(series: Series<any, any>, order: Iterable<number>): void
export function stackOffsetWiggle(series: Series<any, any>, order: Iterable<number>): void

export interface TimeInterval {
  (date?: Date): Date
  floor(date: Date): Date
  round(date: Date): Date
  ceil(date: Date): Date
  offset(date: Date, step?: number): Date
  range(start: Date, stop: Date, step?: number): Date[]
  filter(test: (date: Date) => boolean): TimeInterval
}
export interface CountableTimeInterval extends TimeInterval {
  count(start: Date, end: Date): number
  every(step: number): TimeInterval | null
}
export interface TimeLocaleDefinition {
  dateTime: string
  date: string
  time: string
  periods: [string, string]
  days: [string, string, string, string, string, string, string]
  shortDays: [string, string, string, string, string, string, string]
  months: [string, string, string, string, string, string, string, string, string, string, string, string]
  shortMonths: [string, string, string, string, string, string, string, string, string, string, string, string]
}
export interface TimeLocaleObject {
  format(specifier: string): (date: Date) => string
  parse(specifier: string): (dateString: string) => Date | null
  utcFormat(specifier: string): (date: Date) => string
  utcParse(specifier: string): (dateString: string) => Date | null
}
export interface Timer {
  restart(cb: (x: number) => void, delay?: number, time?: number): void
  stop(): void
}
declare module "d3-selection" {
  interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
    interrupt(name?: string): this
    transition(name?: string): Transition<GElement, Datum, PElement, PDatum>
    transition(transition: Transition<BaseType, any, any, any>): Transition<GElement, Datum, PElement, PDatum>
  }
}
export function active<B extends BaseType, T, PElement extends BaseType, PDatum>(
  node: B,
  name?: string
): Transition<B, T, PElement, PDatum> | null
export function interrupt(node: BaseType, name?: string): void
export interface Transition<B extends BaseType, T, PElement extends BaseType, PDatum> {
  select<DescElement extends BaseType>(selector: string): Transition<DescElement, T, PElement, PDatum>
  select<DescElement extends BaseType>(
    selector: ValueFn<B, T, DescElement>
  ): Transition<DescElement, T, PElement, PDatum>
  selectAll<DescElement extends BaseType, OldDatum>(selector: string): Transition<DescElement, OldDatum, B, T>
  selectAll<DescElement extends BaseType, OldDatum>(
    selector: ValueFn<B, T, DescElement[] | ArrayLike<DescElement>>
  ): Transition<DescElement, OldDatum, B, T>
  selectChild<DescElement extends BaseType, OldDatum>(
    selector?: string | ValueFn<B, T, DescElement>
  ): Transition<DescElement, OldDatum, B, T>
  selectChildren<DescElement extends BaseType, OldDatum>(
    selector?: string | ValueFn<B, T, DescElement>
  ): Transition<DescElement, OldDatum, B, T>
  selection(): Selection<B, T, PElement, PDatum>
  transition(): Transition<B, T, PElement, PDatum>
  attr(name: string, value: null | string | number | boolean): this
  attr(name: string, value: ValueFn<B, T, string | number | boolean | null>): this
  attrTween(name: string): ValueFn<B, T, (this: B, t: number) => string> | undefined
  attrTween(name: string, factory: null): this
  attrTween(name: string, factory: ValueFn<B, T, (this: B, t: number) => string>): this
  style(name: string, value: null): this
  style(name: string, value: string | number | boolean, priority?: null | "important"): this
  style(name: string, value: ValueFn<B, T, string | number | boolean | null>, priority?: null | "important"): this
  styleTween(name: string): ValueFn<B, T, (this: B, t: number) => string> | undefined
  styleTween(name: string, factory: null): this
  styleTween(name: string, factory: ValueFn<B, T, (this: B, t: number) => string>, priority?: null | "important"): this
  text(value: null | string | number | boolean): this
  text(value: ValueFn<B, T, string | number | boolean>): this
  textTween(): ValueFn<B, T, (this: B, t: number) => string> | undefined
  textTween(factory: null): this
  textTween(factory: ValueFn<B, T, (this: B, t: number) => string>): this
  remove(): this
  tween(name: string): ValueFn<B, T, (this: B, t: number) => void> | undefined
  tween(name: string, tweenFn: null): this
  tween(name: string, tweenFn: ValueFn<B, T, (this: B, t: number) => void>): this
  merge(other: Transition<B, T, PElement, PDatum>): Transition<B, T, PElement, PDatum>
  filter(filter: string): Transition<B, T, PElement, PDatum>
  filter<FilteredElement extends BaseType>(filter: string): Transition<FilteredElement, T, PElement, PDatum>
  filter(filter: ValueFn<B, T, boolean>): Transition<B, T, PElement, PDatum>
  filter<FilteredElement extends BaseType>(
    filter: ValueFn<B, T, boolean>
  ): Transition<FilteredElement, T, PElement, PDatum>
  on(typenames: string): ValueFn<B, T, void> | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: ValueFn<B, T, void>): this
  end(): Promise<void>
  each(func: ValueFn<B, T, void>): this
  call(func: (transition: Transition<B, T, PElement, PDatum>, ...xs: any[]) => any, ...xs: any[]): this
  empty(): boolean
  node(): B | null
  nodes(): B[]
  size(): number
  delay(): number
  delay(milliseconds: number): this
  delay(milliseconds: ValueFn<B, T, number>): this
  duration(): number
  duration(milliseconds: number): this
  duration(milliseconds: ValueFn<B, T, number>): this
  ease(): (normalizedTime: number) => number
  ease(easingFn: (normalizedTime: number) => number): this
  easeVarying(factory: ValueFn<B, T, (normalizedTime: number) => number>): this
}
export type SelectionOrTransition<B extends BaseType, T, PElement extends BaseType, PDatum> =
  | Selection<B, T, PElement, PDatum>
  | Transition<B, T, PElement, PDatum>
export function transition<OldDatum>(name?: string): Transition<BaseType, OldDatum, null, undefined>
export function transition<OldDatum>(
  transition: Transition<BaseType, any, BaseType, any>
): Transition<BaseType, OldDatum, null, undefined>

export type ZoomedElementBaseType = Element
export interface ZoomScale {
  domain(): number[] | Date[]
  domain(domain: Array<Date | number>): this
  range(): number[]
  range(range: number[]): this
  copy(): ZoomScale
  invert(value: number): number | Date
}
export interface ZoomBehavior<B extends ZoomedElementBaseType, T> extends Function {
  (selection: Selection<B, T, any, any>, ...xs: any[]): void
  transform(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    transform: ZoomTransform | ((this: B, event: any, x: T) => ZoomTransform),
    point?: [number, number] | ((this: B, event: any, x: T) => [number, number])
  ): void
  translateBy(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    x: number | ValueFn<B, T, number>,
    y: number | ValueFn<B, T, number>
  ): void
  translateTo(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    x: number | ValueFn<B, T, number>,
    y: number | ValueFn<B, T, number>,
    p?: [number, number] | ValueFn<B, T, [number, number]>
  ): void
  scaleBy(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    k: number | ValueFn<B, T, number>,
    p?: [number, number] | ValueFn<B, T, [number, number]>
  ): void
  scaleTo(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    k: number | ValueFn<B, T, number>,
    p?: [number, number]
  ): void
  constrain(): (
    transform: ZoomTransform,
    extent: [[number, number], [number, number]],
    translateExtent: [[number, number], [number, number]]
  ) => ZoomTransform
  constrain(
    constraint: (
      transform: ZoomTransform,
      extent: [[number, number], [number, number]],
      translateExtent: [[number, number], [number, number]]
    ) => ZoomTransform
  ): this
  filter(): (this: B, event: any, x: T) => boolean
  filter(filter: (this: B, event: any, x: T) => boolean): this
  touchable(): ValueFn<B, T, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<B, T, boolean>): this
  wheelDelta(): ValueFn<B, T, number>
  wheelDelta(delta: ((event: WheelEvent) => number) | number): this
  extent(): (this: B, x: T) => [[number, number], [number, number]]
  extent(extent: [[number, number], [number, number]]): this
  extent(extent: (this: B, x: T) => [[number, number], [number, number]]): this
  scaleExtent(): [number, number]
  scaleExtent(extent: [number, number]): this
  translateExtent(): [[number, number], [number, number]]
  translateExtent(extent: [[number, number], [number, number]]): this
  clickDistance(): number
  clickDistance(distance: number): this
  tapDistance(): number
  tapDistance(distance: number): this
  duration(): number
  duration(duration: number): this
  interpolate<
    InterpolationFactory extends (a: ZoomView, b: ZoomView) => (t: number) => ZoomView
  >(): InterpolationFactory
  interpolate(interpolatorFactory: (a: ZoomView, b: ZoomView) => (t: number) => ZoomView): this
  on(typenames: string): ((this: B, event: any, x: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: B, event: any, x: T) => void): this
}
export interface D3ZoomEvent<ZoomRefElement extends ZoomedElementBaseType, Datum> {
  target: ZoomBehavior<ZoomRefElement, Datum>
  type: "start" | "zoom" | "end" | string
  transform: ZoomTransform
  sourceEvent: any
}
export interface ZoomTransform {
  readonly x: number
  readonly y: number
  readonly k: number
  apply(point: [number, number]): [number, number]
  applyX(x: number): number
  applyY(y: number): number
  invert(point: [number, number]): [number, number]
  invertX(x: number): number
  invertY(y: number): number
  rescaleX<S extends ZoomScale>(xScale: S): S
  rescaleY<S extends ZoomScale>(yScale: S): S
  scale(k: number): ZoomTransform
  toString(): string
  translate(x: number, y: number): ZoomTransform
}
