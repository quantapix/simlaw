import type { MultiPolygon } from "geojson"

export type Pair<T = number> = [T, T]

export type Primitive = number | string | boolean | Date
export interface Numeric {
  valueOf(): number
}
export interface Adder extends Numeric {
  add(x: number): Adder
}
export interface Bisector<T, U> {
  left(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
  right(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
  center(xs: ArrayLike<T>, x: U, lo?: number, hi?: number): number
}
export interface Bin<T, U extends number | Date | undefined> extends Array<T> {
  x0: U | undefined
  x1: U | undefined
}
export type ThresholdGen<T extends number | undefined = number | undefined> = (
  xs: ArrayLike<T>,
  min: number,
  max: number
) => number
export type ThresholdDatesGen<T extends Date | undefined> = (xs: ArrayLike<T>, min: Date, max: Date) => T[]
export type ThresholdNumsGen<T extends number | undefined> = (xs: ArrayLike<T>, min: number, max: number) => T[]
export interface HistogramCommon<T, U extends number | Date | undefined> {
  (xs: ArrayLike<T>): Array<Bin<T, U>>
  value(): (x: T, i: number, xs: ArrayLike<T>) => U
  value(f: (x: T, i: number, xs: ArrayLike<T>) => U): this
}
export interface HistogramGeneratorDate<T, U extends Date | undefined> extends HistogramCommon<T, Date> {
  domain(): (xs: ArrayLike<U>) => [Date, Date]
  domain(x: [Date, Date] | ((xs: ArrayLike<U>) => [Date, Date])): this
  thresholds(): ThresholdDatesGen<U>
  thresholds(xs: ArrayLike<U> | ThresholdDatesGen<U>): this
}
export interface HistogramGeneratorNumber<T, U extends number | undefined> extends HistogramCommon<T, U> {
  domain(): (xs: Iterable<U>) => Pair | Pair<undefined>
  domain(x: Pair | ((xs: Iterable<U>) => Pair | Pair<undefined>)): this
  thresholds(): ThresholdGen<U> | ThresholdNumsGen<U>
  thresholds(n: number | ThresholdGen<U>): this
  thresholds(xs: ArrayLike<U> | ThresholdNumsGen<U>): this
}

export type AxisDomain = number | string | Date | { valueOf(): number }
export interface AxisTimeInterval {
  range(start: Date, stop: Date, step?: number): Date[]
}
export interface AxisScale<T> {
  (x: T): number | undefined
  bandwidth?(): number
  copy(): this
  domain(): T[]
  range(): number[]
}
export type AxisContainerElement = SVGSVGElement | SVGGElement
export interface Axis<T> {
  (
    x:
      | Selection<SVGSVGElement, any, any, any>
      | Selection<SVGGElement, any, any, any>
      | TransitionLike<SVGSVGElement, any>
      | TransitionLike<SVGGElement, any>
  ): void
  offset(): number
  offset(x: number): this
  scale(x: AxisScale<T>): this
  scale<A extends AxisScale<T>>(): A
  tickArgs(): any[]
  tickArgs(xs: any[]): this
  tickFormat(): ((x: T, i: number) => string) | null
  tickFormat(f: (x: T, i: number) => string): this
  tickFormat(x: null): this
  tickPadding(): number
  tickPadding(x: number): this
  ticks(n: number, spec?: string): this
  ticks(x: any, ...xs: any[]): this
  ticks(x: AxisTimeInterval, spec?: string): this
  tickSize(): number
  tickSize(x: number): this
  tickSizeInner(): number
  tickSizeInner(x: number): this
  tickSizeOuter(): number
  tickSizeOuter(x: number): this
  tickValues(): T[] | null
  tickValues(x: null): this
  tickValues(xs: Iterable<T>): this
}
export type BrushSelection = [Point, Point] | Point
export interface BrushBehavior<T> {
  (x: Selection<SVGGElement, T, any, any>, ...xs: any[]): void
  clear(x: Selection<SVGGElement, T, any, any>, event?: Event): void
  extent(): ValueFn<SVGGElement, T, [Point, Point]>
  extent(f: ValueFn<SVGGElement, T, [Point, Point]>): this
  extent(x: [Point, Point]): this
  filter(): (this: SVGGElement, event: any, x: T) => boolean
  filter(f: (this: SVGGElement, event: any, x: T) => boolean): this
  handleSize(): number
  handleSize(x: number): this
  keyModifiers(): boolean
  keyModifiers(x: boolean): this
  move(
    group: Selection<SVGGElement, T, any, any> | TransitionLike<SVGGElement, T>,
    selection: null | BrushSelection | ValueFn<SVGGElement, T, BrushSelection>,
    e?: Event
  ): void
  on(types: string, f: (this: SVGGElement, event: any, x: T) => void): this
  on(types: string, x: null): this
  on(types: string): ((this: SVGGElement, event: any, x: T) => void) | undefined
  touchable(): ValueFn<SVGGElement, T, boolean>
  touchable(f: ValueFn<SVGGElement, T, boolean>): this
  touchable(x: boolean): this
}
export interface BrushEvent<T> {
  mode: "drag" | "space" | "handle" | "center"
  selection: BrushSelection | null
  sourceEvent: any
  target: BrushBehavior<T>
  type: "start" | "brush" | "end" | string
}
export interface ChordSubgroup {
  endAngle: number
  i: number
  startAngle: number
  value: number
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
  (xs: number[][]): Chords
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
  brighter(k?: number): this
  darker(k?: number): this
  displayable(): boolean
  hex(): string
  rgb(): RGBColor
  toString(): string
}
export interface Color {
  displayable(): boolean
  formatHex(): string
  formatHex8(): string
  formatHsl(): string
  formatRgb(): string
  hex(): string
  toString(): string
}
export interface ColorFactory extends Function {
  (spec: string): RGBColor | HSLColor | null
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
  (spec: string): RGBColor
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
  (spec: string): HSLColor
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
  (spec: string): LabColor
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
  (spec: string): HCLColor
  (color: ColorSpaceObject | ColorCommonInstance): HCLColor
  readonly prototype: HCLColor
}
export interface LCHColorFactory {
  (l: number, c: number, h: number, opacity?: number): HCLColor
  (spec: string): HCLColor
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
  (spec: string): CubehelixColor
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

export interface ContourPoly extends MultiPolygon {
  value: number
}
export interface Contours {
  (xs: number[]): ContourPoly[]
  contour(xs: number[], threshold: number): ContourPoly
  size(): Span
  size(x: Span): this
  smooth(): boolean
  smooth(x: boolean): this
  thresholds(): ThresholdGen<number> | ThresholdNumsGen<number>
  thresholds(x: number | number[] | ThresholdGen<number> | ThresholdNumsGen<number>): this
}
export interface Density<T = Point> {
  (xs: T[]): ContourPoly[]
  bandwidth(): number
  bandwidth(x: number): this
  cellSize(): number
  cellSize(x: number): this
  size(): Span
  size(x: Span): this
  thresholds(): ThresholdGen<number> | ThresholdNumsGen<number>
  thresholds(x: number | number[] | ThresholdGen<number> | ThresholdNumsGen<number>): this
  weight(): (x: T) => number
  weight(weight: (x: T) => number): this
  x(): (x: T) => number
  x(x: (x: T) => number): this
  y(): (x: T) => number
  y(y: (x: T) => number): this
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
export type Point = Pair<number>
export type Span = Pair<number>
export namespace Delaunay {
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

export type DispatchCB<T extends object> = (this: T, ...xs: any[]) => void

export interface Dispatch<T extends object> {
  apply(k: string, x?: T, ...xs: any[]): void
  call(k: string, x?: T, ...xs: any[]): void
  copy(): Dispatch<T>
  on(k: string, f?: DispatchCB<T>): this
  on(k: string): DispatchCB<T> | undefined
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
  idx: number
  x: number
  y: number
  vx: number
  vy: number
  fx?: number | undefined
  fy?: number | undefined
}
export interface SimLink<T extends SimNode> {
  idx: number
  src: T | string | number
  tgt: T | string | number
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
  find(x: number, y: number, r?: number): N | undefined
  force(x: string, f: Force<N, L> | null): this
  force<T extends Force<N, L>>(x: string): T | undefined
  nodes(): N[]
  nodes(xs: N[]): this
  on(x: "tick" | "end" | string, f: ((this: this) => void) | null): this
  on(x: "tick" | "end" | string): ((this: Sim<N, L>) => void) | undefined
  randomSource(): () => number
  randomSource(f: () => number): this
  restart(): this
  stop(): this
  tick(n?: number): this
  veloDecay(): number
  veloDecay(x: number): this
}

export interface Force<N extends SimNode, L extends SimLink<N> | undefined> {
  (alpha?: number): void
  init?(xs: N[], f: () => number): void
}
export type Op<T, R = number> = (x: T, i: number, xs: T[]) => R
export namespace Force {
  export interface Center<N extends SimNode> extends Force<N, any> {
    init(xs: N[], f: () => number): void
    strength(): number
    strength(x: number): this
    x(): number
    x(x: number): this
    y(): number
    y(x: number): this
  }
  export interface Collide<N extends SimNode> extends Force<N, any> {
    init(xs: N[], f: () => number): void
    iters(): number
    iters(x: number): this
    radius(): Op<N>
    radius(x: number | Op<N>): this
    strength(): number
    strength(x: number): this
  }
  export interface Radial<N extends SimNode> extends Force<N, any> {
    init(xs: N[], f: () => number): void
    strength(): Op<N>
    strength(x: number | Op<N>): this
    radius(): Op<N>
    radius(x: number | Op<N>): this
    x(): Op<N>
    x(x: number | Op<N>): this
    y(): Op<N>
    y(x: number | Op<N>): this
  }
  export interface PosX<N extends SimNode> extends Force<N, any> {
    init(xs: N[], f: () => number): void
    strength(): Op<N>
    strength(x: number | Op<N>): this
    x(): Op<N>
    x(x: number | Op<N>): this
  }
  export interface PosY<N extends SimNode> extends Force<N, any> {
    init(xs: N[], f: () => number): void
    strength(): Op<N>
    strength(x: number | Op<N>): this
    y(): Op<N>
    y(x: number | Op<N>): this
  }
  export interface Many<N extends SimNode> extends Force<N, any> {
    distanceMax(): number
    distanceMax(x: number): this
    distanceMin(): number
    distanceMin(x: number): this
    init(xs: N[], f: () => number): void
    strength(): Op<N>
    strength(x: number | Op<N>): this
    theta(): number
    theta(x: number): this
  }
  export interface Link<N extends SimNode, L extends SimLink<N>> extends Force<N, L> {
    distance(): Op<L>
    distance(x: number | Op<L>): this
    id(): Op<N, number | string>
    id(x: Op<N, number | string>): this
    init(xs: N[], f: () => number): void
    iters(): number
    iters(x: number): this
    links(): L[]
    links(xs: L[]): this
    strength(): Op<L>
    strength(x: number | Op<L>): this
  }
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
  format(spec: string): (n: number | { valueOf(): number }) => string
  formatPrefix(spec: string, value: number): (n: number | { valueOf(): number }) => string
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
export interface GeoRotation {
  (x: Point): Point
  invert(x: Point): Point
}
export interface GeoCircleGenerator<This = any, T = any> {
  (this: This, d?: T, ...xs: any[]): GeoJSON.Polygon
  center(): (this: This, x: T, ...xs: any[]) => Point
  center(center: Point | ((this: This, x: T, ...xs: any[]) => Point)): this
  radius(): (this: This, x: T, ...xs: any[]) => number
  radius(radius: number | ((this: This, x: T, ...xs: any[]) => number)): this
  precision(): (this: This, x: T, ...xs: any[]) => number
  precision(precision: number | ((this: This, x: T, ...xs: any[]) => number)): this
}
export interface GeoGraticuleGenerator {
  (): GeoJSON.MultiLineString
  lines(): GeoJSON.LineString[]
  outline(): GeoJSON.Polygon
  extent(): [Point, Point]
  extent(extent: [Point, Point]): this
  extentMajor(): [Point, Point]
  extentMajor(extent: [Point, Point]): this
  extentMinor(): [Point, Point]
  extentMinor(extent: [Point, Point]): this
  step(): Point
  step(step: Point): this
  stepMajor(): Point
  stepMajor(step: Point): this
  stepMinor(): Point
  stepMinor(step: Point): this
  precision(): number
  precision(angle: number): this
}
export interface GeoStream {
  lineEnd(): void
  lineStart(): void
  point(x: number, y: number, z?: number): void
  polygonEnd(): void
  polygonStart(): void
  sphere?(): void
}
export interface GeoRawProjection {
  (lambda: number, phi: number): Point
  invert?(x: number, y: number): Point
}
export interface GeoStreamWrapper {
  stream(stream: GeoStream): GeoStream
}
export interface GeoProjection extends GeoStreamWrapper {
  (point: Point): Point | null
  invert?(point: Point): Point | null
  preclip(): (stream: GeoStream) => GeoStream
  preclip(preclip: (stream: GeoStream) => GeoStream): this
  postclip(): (stream: GeoStream) => GeoStream
  postclip(postclip: (stream: GeoStream) => GeoStream): this
  clipAngle(): number | null
  clipAngle(angle: null | number): this
  clipExtent(): [Point, Point] | null
  clipExtent(extent: null | [Point, Point]): this
  scale(): number
  scale(scale: number): this
  translate(): Point
  translate(point: Point): this
  center(): Point
  center(point: Point): this
  angle(): number
  angle(angle: number): this
  reflectX(): boolean
  reflectX(reflect: boolean): this
  reflectY(): boolean
  reflectY(reflect: boolean): this
  rotate(): [number, number, number]
  rotate(angles: Point | [number, number, number]): this
  precision(): number
  precision(precision: number): this
  fitExtent(
    extent: [Point, Point],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitSize(
    size: Point,
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
  parallels(): Point
  parallels(value: Point): this
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
  bounds(object: T): [Point, Point]
  centroid(object: T): Point
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
  (point: Point): Point | null
  invert(point: Point): Point | null
  postclip(): (stream: GeoStream) => GeoStream
  postclip(postclip: (stream: GeoStream) => GeoStream): this
  scale(): number
  scale(scale: number): this
  translate(): Point
  translate(point: Point): this
  angle(): number
  angle(angle: number): this
  fitExtent(
    extent: [Point, Point],
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  fitSize(
    size: Point,
    object: ExtendedFeature | ExtendedFeatureCollection | GeoGeometryObjects | ExtendedGeometryCollection
  ): this
  clipExtent(): [Point, Point] | null
  clipExtent(extent: null | [Point, Point]): this
  reflectX(): boolean
  reflectX(reflect: boolean): this
  reflectY(): boolean
  reflectY(reflect: boolean): this
}
export const geoClipAntimeridian: (stream: GeoStream) => GeoStream
export function geoClipCircle(angle: number): (stream: GeoStream) => GeoStream
export function geoClipRectangle(x0: number, y0: number, x1: number, y1: number): (stream: GeoStream) => GeoStream

export namespace hierarchy {
  export interface Link<T> {
    src: Node<T>
    tgt: Node<T>
  }
  export interface Node<T> {
    [Symbol.iterator](): Iterator<this>
    children?: this[] | undefined
    data: T
    parent: this | null
    readonly depth: number
    readonly height: number
    readonly id?: string | undefined
    readonly value?: number | undefined
    ancestors(): this[]
    copy(): this
    count(): this
    descendants(): this[]
    each<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
    eachAfter<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
    eachBefore<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
    find(f: (x: this) => boolean): this | undefined
    leaves(): this[]
    links(): Array<Link<T>>
    path(x: this): this[]
    sort(f: (a: this, b: this) => number): this
    sum(f: (x: T) => number): this
  }
  export interface StratifyOp<T> {
    (xs: T[]): Node<T>
    id(): Op<T, string | null | "" | undefined>
    id(f: Op<T, string | null | "" | undefined>): this
    parentId(): Op<T, string | null | "" | undefined>
    parentId(f: Op<T, string | null | "" | undefined>): this
    path(): Op<T, string> | null | undefined
    path(f: Op<T, string> | null | undefined): this
  }
  export interface PointLink<T> {
    src: PointNode<T>
    tgt: PointNode<T>
  }
  export interface PointNode<T> extends Node<T> {
    x: number
    y: number
    links(): Array<PointLink<T>>
  }
  export interface RectLink<T> {
    src: RectNode<T>
    tgt: RectNode<T>
  }
  export interface RectNode<T> extends Node<T> {
    x0: number
    y0: number
    x1: number
    y1: number
    links(): Array<RectLink<T>>
  }
  export interface CircLink<T> {
    src: CircNode<T>
    tgt: CircNode<T>
  }
  export interface CircNode<T> extends Node<T> {
    x: number
    y: number
    r: number
    links(): Array<CircLink<T>>
  }
  export interface Cluster<T> {
    (x: Node<T>): PointNode<T>
    nodeSize(): Point | null
    nodeSize(x: Point): this
    separation(): (a: PointNode<T>, b: PointNode<T>) => number
    separation(f: (a: PointNode<T>, b: PointNode<T>) => number): this
    size(): Point | null
    size(x: Point): this
  }
  export interface Tree<T> {
    (x: Node<T>): PointNode<T>
    nodeSize(): Point | null
    nodeSize(x: Point): this
    separation(): (a: PointNode<T>, b: PointNode<T>) => number
    separation(f: (a: PointNode<T>, b: PointNode<T>) => number): this
    size(): Point | null
    size(x: Point): this
  }
  export interface Treemap<T> {
    (x: Node<T>): RectNode<T>
    padBottom(): (x: RectNode<T>) => number
    padBottom(f: (x: RectNode<T>) => number): this
    padBottom(x: number): this
    padding(): (x: RectNode<T>) => number
    padding(f: (x: RectNode<T>) => number): this
    padding(x: number): this
    padInner(): (x: RectNode<T>) => number
    padInner(f: (x: RectNode<T>) => number): this
    padInner(x: number): this
    padLeft(): (x: RectNode<T>) => number
    padLeft(f: (x: RectNode<T>) => number): this
    padLeft(x: number): this
    padOuter(): (x: RectNode<T>) => number
    padOuter(x: (x: RectNode<T>) => number): this
    padOuter(x: number): this
    padRight(): (x: RectNode<T>) => number
    padRight(f: (x: RectNode<T>) => number): this
    padRight(x: number): this
    padTop(): (x: RectNode<T>) => number
    padTop(f: (x: RectNode<T>) => number): this
    padTop(x: number): this
    round(): boolean
    round(x: boolean): this
    size(): Point
    size(x: Point): this
    tile(): (x: RectNode<T>, x0: number, y0: number, x1: number, y1: number) => void
    tile(f: (x: RectNode<T>, x0: number, y0: number, x1: number, y1: number) => void): this
  }
  export interface RatioFac {
    (x: RectNode<any>, x0: number, y0: number, x1: number, y1: number): void
    ratio(x: number): RatioFac
  }
  export interface Partition<T> {
    (x: Node<T>): RectNode<T>
    padding(): number
    padding(x: number): this
    round(): boolean
    round(x: boolean): this
    size(): Point
    size(x: Point): this
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
  export interface Pack<T> {
    (x: Node<T>): CircNode<T>
    padding(): (x: CircNode<T>) => number
    padding(f: (x: CircNode<T>) => number): this
    padding(x: number): this
    radius(): null | ((x: CircNode<T>) => number)
    radius(f: null | ((x: CircNode<T>) => number)): this
    size(): Point
    size(x: Point): this
  }
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
  bezierTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number): void
  close(): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
  quadraticTo(cpx: number, cpy: number, x: number, y: number): void
  rect(x: number, y: number, w: number, h: number): void
  toString(): string
}

export interface QuadLeaf<T> {
  data: T
  next?: QuadLeaf<T> | undefined
  length?: undefined
}
export interface QuadNode<T> extends Array<QuadNode<T> | QuadLeaf<T> | undefined> {
  length: 4
}
export interface Quadtree<T> {
  add(t: T): this
  addAll(ts: T[]): this
  copy(): Quadtree<T>
  cover(x: number, y: number): this
  data(): T[]
  extent(): Pair<Point> | undefined
  extent(x: Pair<Point>): this
  find(x: number, y: number, r?: number): T | undefined
  remove(t: T): this
  removeAll(ts: T[]): this
  root(): QuadNode<T> | QuadLeaf<T> | undefined
  size(): number
  visit(f: (n: QuadNode<T> | QuadLeaf<T>, x0: number, y0: number, x1: number, y1: number) => void | boolean): this
  visitAfter(f: (n: QuadNode<T> | QuadLeaf<T>, x0: number, y0: number, x1: number, y1: number) => void): this
  x(): (t: T) => number
  x(x: (t: T) => number): this
  y(): (t: T) => number
  y(y: (t: T) => number): this
}

export interface RandomSrc {
  source(f: () => number): this
}
export interface RandIrwinHall extends RandomSrc {
  (n: number): () => number
}
export interface RandBates extends RandomSrc {
  (n: number): () => number
}
export interface RandBernoulli extends RandomSrc {
  (p: number): () => number
}
export interface RandNormal extends RandomSrc {
  (mu?: number, sigma?: number): () => number
}
export interface RandGamma extends RandomSrc {
  (k: number, theta?: number): () => number
}
export interface RandBeta extends RandomSrc {
  (alpha: number, beta: number): () => number
}
export interface RandGeometric extends RandomSrc {
  (p: number): () => number
}
export interface RandBinomial extends RandomSrc {
  (n: number, p: number): () => number
}
export interface RandCauchy extends RandomSrc {
  (a?: number, b?: number): () => number
}
export interface RandExponential extends RandomSrc {
  (lambda: number): () => number
}
export interface RandInt extends RandomSrc {
  (max: number): () => number
  (min: number, max: number): () => number
}
export interface RandLogNormal extends RandomSrc {
  (mu?: number, sigma?: number): () => number
}
export interface RandLogistic extends RandomSrc {
  (a?: number, b?: number): () => number
}
export interface RandPareto extends RandomSrc {
  (alpha: number): () => number
}
export interface RandPoisson extends RandomSrc {
  (lambda: number): () => number
}
export interface RandUniform extends RandomSrc {
  (max?: number): () => number
  (min: number, max: number): () => number
}
export interface RandWeibull extends RandomSrc {
  (k: number, a?: number, b?: number): () => number
}

export interface InterpolatorFactory<T, U> {
  (a: T, b: T): (x: number) => U
}

export type NumVal = number | { valueOf(): number }
export type UnknownReturn<U, U0> = [U] extends [never] ? U0 : U

export namespace Scale {
  export interface Identity<U = never> {
    (x: NumVal): number | U
    copy(): this
    domain(): number[]
    domain(x: Iterable<NumVal>): this
    invert(x: NumVal): number
    nice(n?: number): this
    range(): number[]
    range(x: Iterable<NumVal>): this
    tickFormat(n?: number, spec?: string): (x: NumVal) => string
    ticks(n?: number): number[]
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Identity<U2>
  }

  export interface Time<Range, Out, U = never> {
    (x: Date | NumVal): Out | U
    clamp(): boolean
    clamp(x: boolean): this
    copy(): this
    domain(): Date[]
    domain(x: Iterable<Date | NumVal>): this
    interpolate(): InterpolatorFactory<any, any>
    interpolate(f: InterpolatorFactory<Range, Out>): this
    interpolate<O2>(f: InterpolatorFactory<Range, O2>): Time<Range, O2, U>
    invert(x: NumVal): Date
    nice(n?: number): this
    nice(x: CountableTimeInterval): this
    range(): Range[]
    range(x: Iterable<Range>): this
    rangeRound(x: Iterable<NumVal>): this
    tickFormat(n?: number, spec?: string): (x: Date) => string
    tickFormat(x: TimeInterval, spec?: string): (x: Date) => string
    ticks(n?: number): Date[]
    ticks(x: TimeInterval): Date[]
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Time<Range, Out, U2>
  }

  export interface Diverging<Out, U = never> {
    (x: NumVal): Out | U
    domain(): [number, number, number]
    domain(x: Iterable<NumVal>): this
    clamp(): boolean
    clamp(x: boolean): this
    interpolator(): (x: number) => Out
    interpolator(f?: (x: number) => Out): this
    range(): () => [Out, Out, Out]
    range(x: Iterable<Out>): this
    rangeRound(x: Iterable<NumVal>): this
    copy(): this
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Diverging<Out, U2>
  }

  export interface Quantize<Range, U = never> {
    (x: NumVal): Range | U
    copy(): this
    domain(): Pair
    domain(x: Iterable<NumVal>): this
    invertExtent(x: Range): Span
    nice(n?: number): this
    range(): Range[]
    range(x: Iterable<Range>): this
    thresholds(): number[]
    tickFormat(n?: number, spec?: string): (x: NumVal) => string
    ticks(n?: number): number[]
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Quantize<Range, U2>
  }

  export interface Quantile<Range, U = never> {
    (x: NumVal): Range | U
    copy(): this
    domain(): number[]
    domain(x: Iterable<NumVal | null | undefined>): this
    invertExtent(x: Range): Span
    quantiles(): number[]
    range(): Range[]
    range(x: Iterable<Range>): this
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Quantile<Range, U2>
  }

  export interface Ordinal<T extends { toString(): string }, Range, U = never> {
    (x: T): Range | U
    copy(): this
    domain(): T[]
    domain(x: Iterable<T>): this
    range(): Range[]
    range(x: Iterable<Range>): this
    unknown(): UnknownReturn<U, { name: "implicit" }>
    unknown<U2>(x: U2): U2 extends { name: "implicit" } ? Ordinal<T, Range> : Ordinal<T, Range, U2>
  }

  export interface Band<T extends { toString(): string }> {
    (x: T): number | undefined
    align(): number
    align(x: number): this
    bandwidth(): number
    copy(): this
    domain(): T[]
    domain(x: Iterable<T>): this
    padding(): number
    padding(x: number): this
    paddingInner(): number
    paddingInner(x: number): this
    paddingOuter(): number
    paddingOuter(x: number): this
    range(): Span
    range(x: Iterable<NumVal>): this
    rangeRound(x: Iterable<NumVal>): this
    round(): boolean
    round(x: boolean): this
    step(): number
  }

  export interface Point<Domain extends { toString(): string }> {
    (x: Domain): number | undefined
    domain(): Domain[]
    domain(domain: Iterable<Domain>): this
    range(): Span
    range(range: Iterable<NumVal>): this
    rangeRound(range: Iterable<NumVal>): this
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

  export interface Threshold<T extends number | string | Date, Range, U = never> {
    (x: T): Range | U
    copy(): this
    domain(): T[]
    domain(x: Iterable<T>): this
    invertExtent(x: Range): [T | undefined, T | undefined]
    range(): Range[]
    range(x: Iterable<Range>): this
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Threshold<T, Range, U2>
  }

  export interface Smooth<Range, Out, U = never> {
    (x: NumVal): Out | U
    clamp(): boolean
    clamp(x: boolean): this
    copy(): this
    domain(): number[]
    domain(x: Iterable<NumVal>): this
    invert(x: NumVal): number
    nice(n?: number): this
    range(): Range[]
    range(x: Iterable<Range>): this
    rangeRound(x: Iterable<NumVal>): this
    tickFormat(n?: number, spec?: string): (x: NumVal) => string
    ticks(n?: number): number[]
  }
  export interface Linear<Range, Out, U = never> extends Smooth<Range, Out, U> {
    interpolate(): InterpolatorFactory<any, any>
    interpolate(f: InterpolatorFactory<Range, Out>): this
    interpolate<O2>(f: InterpolatorFactory<Range, O2>): Linear<Range, O2, U>
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Linear<Range, Out, U2>
  }
  export interface Pow<Range, Out, U = never> extends Smooth<Range, Out, U> {
    exponent(): number
    exponent(x: number): this
    interpolate(): InterpolatorFactory<any, any>
    interpolate(f: InterpolatorFactory<Range, Out>): this
    interpolate<O2>(f: InterpolatorFactory<Range, O2>): Pow<Range, O2, U>
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Pow<Range, Out, U2>
  }
  export interface Log<Range, Out, U = never> extends Smooth<Range, Out, U> {
    base(): number
    base(x: number): this
    domain(): number[]
    domain(x: Iterable<NumVal>): this
    interpolate(): InterpolatorFactory<any, any>
    interpolate(f: InterpolatorFactory<Range, Out>): this
    interpolate<O2>(f: InterpolatorFactory<Range, O2>): Log<Range, O2, U>
    nice(): this
    tickFormat(n?: number, spec?: string): (d: NumVal) => string
    ticks(n?: number): number[]
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Log<Range, Out, U2>
  }
  export interface SymLog<Range, Out, U = never> extends Smooth<Range, Out, U> {
    constant(): number
    constant(x: number): this
    tickFormat(n?: number, spec?: string): (d: NumVal) => string
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): SymLog<Range, Out, U2>
  }
  export interface Radial<Range, Out, U = never> extends Smooth<Range, Out, U> {
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Radial<Range, Out, U2>
  }

  export interface Seq<Out, U = never> {
    (x: NumVal): Out | U
    clamp(): boolean
    clamp(x: boolean): this
    copy(): this
    domain(): Pair
    domain(x: Iterable<NumVal>): this
    range(): () => [Out, Out]
    range(x: Iterable<Out>): this
    rangeRound(x: Iterable<NumVal>): this
  }
  export interface Sequential<Out, U = never> extends Seq<Out, U> {
    interpolator(): (x: number) => Out
    interpolator(f: (x: number) => Out): this
    interpolator<O2>(f: (x: number) => O2): Sequential<O2, U>
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Sequential<Out, U2>
  }
  export interface SeqQuantile<Out, U = never> extends Seq<Out, U> {
    interpolator(): (x: number) => Out
    interpolator(f: (x: number) => Out): this
    interpolator<O2>(f: (x: number) => O2): SeqQuantile<O2, U>
    quantiles(): number[]
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): SeqQuantile<Out, U2>
  }
}

export type BaseType = Element | EnterElem | Document | Window | null
export type KeyType = string | number

export interface ArrayLike<T> {
  length: number
  item(i: number): T | null
  [i: number]: T
}
export interface EnterElem {
  ownerDocument: Document
  namespaceURI: string
  appendChild(x: Node): Node
  insertBefore(x: Node, next: Node): Node
  querySelector(x: string): Element
  querySelectorAll(x: string): NodeListOf<Element>
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
export type ValueFn<B extends BaseType, T, R> = (this: B, x: T, i: number, groups: B[] | ArrayLike<B>) => R

export interface TransitionLike<B extends BaseType, T> {
  selection(): Selection<B, T, any, any>
  on(type: string, x: null): TransitionLike<B, T>
  on(type: string, f: ValueFn<B, T, void>): TransitionLike<B, T>
  tween(name: string, x: null): TransitionLike<B, T>
  tween(name: string, f: ValueFn<B, T, (t: number) => void>): TransitionLike<B, T>
}

export interface Selection<B extends BaseType, T, PElement extends BaseType, P> {
  select<DescElement extends BaseType>(x: string): Selection<DescElement, T, PElement, P>
  select<DescElement extends BaseType>(x: null): Selection<null, undefined, PElement, P>
  select<DescElement extends BaseType>(f: ValueFn<B, T, DescElement>): Selection<DescElement, T, PElement, P>
  selectAll(x?: null): Selection<null, undefined, B, T>
  selectAll<DescElement extends BaseType, O>(x: string): Selection<DescElement, O, B, T>
  selectAll<DescElement extends BaseType, O>(
    f: ValueFn<B, T, DescElement[] | ArrayLike<DescElement> | Iterable<DescElement>>
  ): Selection<DescElement, O, B, T>
  filter(x: string): Selection<B, T, PElement, P>
  filter<FilteredElement extends BaseType>(x: string): Selection<FilteredElement, T, PElement, P>
  filter(f: ValueFn<B, T, boolean>): Selection<B, T, PElement, P>
  filter<FilteredElement extends BaseType>(f: ValueFn<B, T, boolean>): Selection<FilteredElement, T, PElement, P>
  merge(other: Selection<B, T, PElement, P> | TransitionLike<B, T>): Selection<B, T, PElement, P>
  selectChild<DescElement extends BaseType>(x?: string): Selection<DescElement, T, PElement, P>
  selectChild<ResultElement extends BaseType, ChildElement extends BaseType>(
    selector: (child: ChildElement, i: number, children: ChildElement[]) => boolean
  ): Selection<ResultElement, T, PElement, P>
  selectChildren<DescElement extends BaseType, O>(x?: string): Selection<DescElement, O, B, T>
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
  classed(k: string): boolean
  classed(k: string, v: boolean): this
  classed(k: string, f: ValueFn<B, T, boolean>): this
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
          elem: Selection<EnterElem, T, PElement, P>
        ) => Selection<ChildElement, T, PElement, P> | TransitionLike<B, T>),
    update?: (elem: Selection<B, T, PElement, P>) => Selection<B, T, PElement, P> | TransitionLike<B, T> | undefined,
    exit?: (elem: Selection<B, OldDatum, PElement, P>) => void
  ): Selection<ChildElement | B, T, PElement, P>
  enter(): Selection<EnterElem, T, PElement, P>
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
  interrupt(name?: string): this
  transition(name?: string): Transition<B, T, PElement, P>
  transition(transition: Transition<BaseType, any, any, any>): Transition<B, T, PElement, P>
}
export type SelectionFn = () => Selection<HTMLElement, any, null, undefined>

export interface Local<T> {
  get(x: Element): T | undefined
  remove(x: Element): boolean
  set(x: Element, v: T): T
  toString(): string
}
export interface NamespaceLocalObject {
  space: string
  local: string
}
export interface NamespaceMap {
  [k: string]: string
}
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
  centroid(x: T, ...xs: any[]): Point
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
  x(): Op<T>
  x(f: Op<T>): this
  x(x: number): this
  x0(): Op<T>
  x0(f: Op<T>): this
  x0(x: number): this
  x1(): Op<T> | null
  x1(f: Op<T>): this
  x1(x: null | number): this
  y(): Op<T>
  y(f: Op<T>): this
  y(y: number): this
  y0(): Op<T>
  y0(f: Op<T>): this
  y0(y: number): this
  y1(): Op<T> | null
  y1(f: Op<T>): this
  y1(y: null | number): this
}
export interface AreaRadial<T> {
  (xs: Iterable<T> | T[]): string | null
  (xs: Iterable<T> | T[]): void
  angle(): Op<T>
  angle(f: Op<T>): this
  angle(x: number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFactory
  curve(x: CurveFactory): this
  curve<C extends CurveFactory>(): C
  defined(): (x: T, i: number, xs: T[]) => boolean
  defined(f: (x: T, i: number, xs: T[]) => boolean): this
  defined(x: boolean): this
  endAngle(): Op<T> | null
  endAngle(f: Op<T>): this
  endAngle(x: null | number): this
  innerRadius(): Op<T>
  innerRadius(f: Op<T>): this
  innerRadius(x: number): this
  lineEndAngle(): LineRadial<T>
  lineInnerRadius(): LineRadial<T>
  lineOuterRadius(): LineRadial<T>
  lineStartAngle(): LineRadial<T>
  outerRadius(): Op<T> | null
  outerRadius(f: Op<T>): this
  outerRadius(x: null | number): this
  radius(): Op<T>
  radius(f: Op<T>): this
  radius(x: number): this
  startAngle(): Op<T>
  startAngle(f: Op<T>): this
  startAngle(x: number): this
}

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
  source: Point
  target: Point
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
  format(spec: string): (date: Date) => string
  parse(spec: string): (dateString: string) => Date | null
  utcFormat(spec: string): (date: Date) => string
  utcParse(spec: string): (dateString: string) => Date | null
}
export interface Timer {
  restart(cb: (x: number) => void, delay?: number, time?: number): void
  stop(): void
}

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
    point?: Point | ((this: B, event: any, x: T) => Point)
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
    p?: Point | ValueFn<B, T, Point>
  ): void
  scaleBy(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    k: number | ValueFn<B, T, number>,
    p?: Point | ValueFn<B, T, Point>
  ): void
  scaleTo(
    selection: Selection<B, T, any, any> | TransitionLike<B, T>,
    k: number | ValueFn<B, T, number>,
    p?: Point
  ): void
  constrain(): (transform: ZoomTransform, extent: [Point, Span], translateExtent: [Point, Span]) => ZoomTransform
  constrain(
    constraint: (transform: ZoomTransform, extent: [Point, Span], translateExtent: [Point, Span]) => ZoomTransform
  ): this
  filter(): (this: B, event: any, x: T) => boolean
  filter(filter: (this: B, event: any, x: T) => boolean): this
  touchable(): ValueFn<B, T, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<B, T, boolean>): this
  wheelDelta(): ValueFn<B, T, number>
  wheelDelta(delta: ((event: WheelEvent) => number) | number): this
  extent(): (this: B, x: T) => [Point, Span]
  extent(x: [Point, Span]): this
  extent(f: (this: B, x: T) => [Point, Span]): this
  scaleExtent(): Span
  scaleExtent(x: Span): this
  translateExtent(): [Point, Span]
  translateExtent(x: [Point, Span]): this
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
  apply(point: Point): Point
  applyX(x: number): number
  applyY(y: number): number
  invert(point: Point): Point
  invertX(x: number): number
  invertY(y: number): number
  rescaleX<S extends ZoomScale>(xScale: S): S
  rescaleY<S extends ZoomScale>(yScale: S): S
  scale(k: number): ZoomTransform
  toString(): string
  translate(x: number, y: number): ZoomTransform
}
