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
export interface Bin<Datum, Value extends number | Date | undefined> extends Array<Datum> {
  x0: Value | undefined
  x1: Value | undefined
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
export interface HistogramCommon<Datum, Value extends number | Date | undefined> {
  (data: ArrayLike<Datum>): Array<Bin<Datum, Value>>
  value(): (d: Datum, i: number, data: ArrayLike<Datum>) => Value
  value(valueAccessor: (d: Datum, i: number, data: ArrayLike<Datum>) => Value): this
}
export interface HistogramGeneratorDate<Datum, Value extends Date | undefined> extends HistogramCommon<Datum, Date> {
  domain(): (xs: ArrayLike<Value>) => [Date, Date]
  domain(domain: [Date, Date] | ((xs: ArrayLike<Value>) => [Date, Date])): this
  thresholds(): ThresholdDateArrayGenerator<Value>
  thresholds(thresholds: ArrayLike<Value> | ThresholdDateArrayGenerator<Value>): this
}
export interface HistogramGeneratorNumber<Datum, Value extends number | undefined>
  extends HistogramCommon<Datum, Value> {
  domain(): (xs: Iterable<Value>) => [number, number] | [undefined, undefined]
  domain(domain: [number, number] | ((xs: Iterable<Value>) => [number, number] | [undefined, undefined])): this
  thresholds(): ThresholdCountGenerator<Value> | ThresholdNumberArrayGenerator<Value>
  thresholds(count: number | ThresholdCountGenerator<Value>): this
  thresholds(thresholds: ArrayLike<Value> | ThresholdNumberArrayGenerator<Value>): this
}
export function histogram(): HistogramGeneratorNumber<number, number>
export function histogram<Datum, Value extends number | undefined>(): HistogramGeneratorNumber<Datum, Value>
export function histogram<Datum, Value extends Date | undefined>(): HistogramGeneratorDate<Datum, Value>
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
  ticks(arg0: any, ...args: any[]): this
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
  (group: Selection<SVGGElement, T, any, any>, ...args: any[]): void
  move(
    group: Selection<SVGGElement, T, any, any> | TransitionLike<SVGGElement, T>,
    selection: null | BrushSelection | ValueFn<SVGGElement, T, BrushSelection>,
    event?: Event
  ): void
  clear(group: Selection<SVGGElement, T, any, any>, event?: Event): void
  extent(): ValueFn<SVGGElement, T, [[number, number], [number, number]]>
  extent(extent: [[number, number], [number, number]]): this
  extent(extent: ValueFn<SVGGElement, T, [[number, number], [number, number]]>): this
  filter(): (this: SVGGElement, event: any, d: T) => boolean
  filter(filterFn: (this: SVGGElement, event: any, d: T) => boolean): this
  touchable(): ValueFn<SVGGElement, T, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<SVGGElement, T, boolean>): this
  keyModifiers(): boolean
  keyModifiers(modifiers: boolean): this
  handleSize(): number
  handleSize(size: number): this
  on(typenames: string): ((this: SVGGElement, event: any, d: T) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: SVGGElement, event: any, d: T) => void): this
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
export function chord(): ChordLayout
export function chordDirected(): ChordLayout
export function chordTranspose(): ChordLayout
export interface RibbonSubgroup {
  startAngle: number
  endAngle: number
  radius: number
}
export interface Ribbon {
  source: RibbonSubgroup
  target: RibbonSubgroup
}
export interface RibbonGenerator<This, RibbonDatum, RibbonSubgroupDatum> {
  (this: This, d: RibbonDatum, ...args: any[]): void
  (this: This, d: RibbonDatum, ...args: any[]): string | null
  source(): (this: This, d: RibbonDatum, ...args: any[]) => RibbonSubgroupDatum
  source(source: (this: This, d: RibbonDatum, ...args: any[]) => RibbonSubgroupDatum): this
  target(): (this: This, d: RibbonDatum, ...args: any[]) => RibbonSubgroupDatum
  target(target: (this: This, d: RibbonDatum, ...args: any[]) => RibbonSubgroupDatum): this
  radius(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  radius(radius: number): this
  radius(radius: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  sourceRadius(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  sourceRadius(radius: number): this
  sourceRadius(radius: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  targetRadius(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  targetRadius(radius: number): this
  targetRadius(radius: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  startAngle(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  endAngle(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  padAngle(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  padAngle(angle: number): this
  padAngle(angle: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export interface RibbonArrowGenerator<This, RibbonDatum, RibbonSubgroupDatum>
  extends RibbonGenerator<This, RibbonDatum, RibbonSubgroupDatum> {
  headRadius(): (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number
  headRadius(radius: number): this
  headRadius(radius: (this: This, d: RibbonSubgroupDatum, ...args: any[]) => number): this
}
export function ribbon(): RibbonGenerator<any, Ribbon, RibbonSubgroup>
export function ribbon<Datum, SubgroupDatum>(): RibbonGenerator<any, Datum, SubgroupDatum>
export function ribbon<This, Datum, SubgroupDatum>(): RibbonGenerator<This, Datum, SubgroupDatum>
export function ribbonArrow(): RibbonArrowGenerator<any, Ribbon, RibbonSubgroup>
export function ribbonArrow<Datum, SubgroupDatum>(): RibbonArrowGenerator<any, Datum, SubgroupDatum>
export function ribbonArrow<This, Datum, SubgroupDatum>(): RibbonArrowGenerator<This, Datum, SubgroupDatum>
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
export function contours(): Contours
export interface ContourDensity<Datum = [number, number]> {
  (data: Datum[]): ContourMultiPolygon[]
  x(): (d: Datum) => number
  x(x: (d: Datum) => number): this
  y(): (d: Datum) => number
  y(y: (d: Datum) => number): this
  weight(): (d: Datum) => number
  weight(weight: (d: Datum) => number): this
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
export function contourDensity<Datum = [number, number]>(): ContourDensity<Datum>
export class Delaunay<P> {
  constructor(points: ArrayLike<number>)
  static from(points: ArrayLike<Delaunay.Point> | Iterable<Delaunay.Point>): Delaunay<Delaunay.Point>
  static from<P>(
    points: ArrayLike<P> | Iterable<P>,
    getX: Delaunay.GetCoordinate<P, ArrayLike<P> | Iterable<P>>,
    getY: Delaunay.GetCoordinate<P, ArrayLike<P> | Iterable<P>>,
    that?: any
  ): Delaunay<P>
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
  voronoi(bounds?: Delaunay.Bounds): Voronoi<P>
}
export namespace Delaunay {
  type Point = [number, number]
  type Triangle = Point[]
  type Polygon = Point[]
  type Bounds = [number, number, number, number]
  type GetCoordinate<P, PS> = (point: P, i: number, points: PS) => number
  interface RectContext {
    rect(x: number, y: number, width: number, height: number): void
  }
  interface MoveContext {
    moveTo(x: number, y: number): void
  }
  interface LineContext {
    lineTo(x: number, y: number): void
  }
  interface ArcContext {
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
  }
  interface ClosableContext {
    closePath(): void
  }
}
export class Voronoi<P> {
  delaunay: Delaunay<P>
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
  call(type: string, that?: T, ...args: any[]): void
  copy(): Dispatch<T>
  on(typenames: string): ((this: T, ...args: any[]) => void) | undefined
  on(typenames: string, callback: null | ((this: T, ...args: any[]) => void)): this
}
export function dispatch<T extends object>(...types: string[]): Dispatch<T>
export type DraggedElementBaseType = Element
export type DragContainerElement = HTMLElement | SVGSVGElement | SVGGElement
export interface SubjectPosition {
  x: number
  y: number
}
export interface DragBehavior<GElement extends DraggedElementBaseType, Datum, Subject> extends Function {
  (selection: Selection<GElement, Datum, any, any>, ...args: any[]): void
  container(): ValueFn<GElement, Datum, DragContainerElement>
  container(accessor: ValueFn<GElement, Datum, DragContainerElement>): this
  container(container: DragContainerElement): this
  filter(): (this: GElement, event: any, d: Datum) => boolean
  filter(filterFn: (this: GElement, event: any, d: Datum) => boolean): this
  touchable(): ValueFn<GElement, Datum, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<GElement, Datum, boolean>): this
  subject(): (this: GElement, event: any, d: Datum) => Subject
  subject(accessor: (this: GElement, event: any, d: Datum) => Subject): this
  clickDistance(): number
  clickDistance(distance: number): this
  on(typenames: string): ((this: GElement, event: any, d: Datum) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: GElement, event: any, d: Datum) => void): this
}
export function drag<GElement extends DraggedElementBaseType, Datum>(): DragBehavior<
  GElement,
  Datum,
  Datum | SubjectPosition
>
export function drag<GElement extends DraggedElementBaseType, Datum, Subject>(): DragBehavior<GElement, Datum, Subject>
export interface D3DragEvent<GElement extends DraggedElementBaseType, Datum, Subject> {
  target: DragBehavior<GElement, Datum, Subject>
  type: "start" | "drag" | "end" | string
  subject: Subject
  x: number
  y: number
  dx: number
  dy: number
  identifier: "mouse" | number
  active: number
  sourceEvent: any
  on(typenames: string): ((this: GElement, event: any, d: Datum) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: GElement, event: any, d: Datum) => void): this
}
export function dragDisable(window: Window): void
export function dragEnable(window: Window, noClick?: boolean): void
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
export function csvParse<Columns extends string>(csvString: string): DSVRowArray<Columns>
export function csvParse<ParsedRow extends object, Columns extends string>(
  csvString: string,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): DSVParsedArray<ParsedRow>
export function csvParseRows(csvString: string): string[][]
export function csvParseRows<ParsedRow extends object>(
  csvString: string,
  row: (rawRow: string[], i: number) => ParsedRow | undefined | null
): ParsedRow[]
export function csvFormat<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function csvFormatBody<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function csvFormatRows(rows: readonly string[][]): string
export function csvFormatRow(row: readonly string[]): string
export function csvFormatValue(value: string): string
export function tsvParse<Columns extends string>(tsvString: string): DSVRowArray<Columns>
export function tsvParse<ParsedRow extends object, Columns extends string>(
  tsvString: string,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): DSVParsedArray<ParsedRow>
export function tsvParseRows(tsvString: string): string[][]
export function tsvParseRows<ParsedRow extends object>(
  tsvString: string,
  row: (rawRow: string[], i: number) => ParsedRow | undefined | null
): ParsedRow[]
export function tsvFormat<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function tsvFormatBody<T extends object>(rows: readonly T[], columns?: ReadonlyArray<keyof T>): string
export function tsvFormatRows(rows: readonly string[][]): string
export function tsvFormatRow(row: readonly string[]): string
export function tsvFormatValue(value: string): string
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
export function dsvFormat(delimiter: string): DSV
export function autoType<ParsedRow extends object | undefined | null, Columns extends string>(
  object: DSVRowString<Columns> | readonly string[]
): ParsedRow

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

export function blob(url: string, init?: RequestInit): Promise<Blob>
export function buffer(url: string, init?: RequestInit): Promise<ArrayBuffer>
export function csv<Columns extends string>(url: string, init?: RequestInit): Promise<DSVRowArray<Columns>>
export function csv<ParsedRow extends object, Columns extends string = string>(
  url: string,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function csv<ParsedRow extends object, Columns extends string = string>(
  url: string,
  init: RequestInit,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function dsv<Columns extends string>(
  delimiter: string,
  url: string,
  init?: RequestInit
): Promise<DSVRowArray<Columns>>
export function dsv<ParsedRow extends object, Columns extends string = string>(
  delimiter: string,
  url: string,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function dsv<ParsedRow extends object, Columns extends string = string>(
  delimiter: string,
  url: string,
  init: RequestInit,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function html(url: string, init?: RequestInit): Promise<Document>
export function image(url: string, init?: Partial<HTMLImageElement>): Promise<HTMLImageElement>
export function json<ParsedJSONObject>(url: string, init?: RequestInit): Promise<ParsedJSONObject | undefined>
export function svg(url: string, init?: RequestInit): Promise<Document>
export function text(url: string, init?: RequestInit): Promise<string>
export function tsv<Columns extends string>(url: string, init?: RequestInit): Promise<DSVRowArray<Columns>>
export function tsv<ParsedRow extends object, Columns extends string = string>(
  url: string,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function tsv<ParsedRow extends object, Columns extends string = string>(
  url: string,
  init: RequestInit,
  row: (rawRow: DSVRowString<Columns>, i: number, columns: Columns[]) => ParsedRow | undefined | null
): Promise<DSVParsedArray<ParsedRow>>
export function xml(url: string, init?: RequestInit): Promise<XMLDocument>
export interface SimulationNodeDatum {
  index?: number | undefined
  x?: number | undefined
  y?: number | undefined
  vx?: number | undefined
  vy?: number | undefined
  fx?: number | null | undefined
  fy?: number | null | undefined
}
export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
  source: NodeDatum | string | number
  target: NodeDatum | string | number
  index?: number | undefined
}
export interface Simulation<
  NodeDatum extends SimulationNodeDatum,
  LinkDatum extends SimulationLinkDatum<NodeDatum> | undefined
> {
  restart(): this
  stop(): this
  tick(iterations?: number): this
  nodes(): NodeDatum[]
  nodes(nodesData: NodeDatum[]): this
  alpha(): number
  alpha(alpha: number): this
  alphaMin(): number
  alphaMin(min: number): this
  alphaDecay(): number
  alphaDecay(decay: number): this
  alphaTarget(): number
  alphaTarget(target: number): this
  velocityDecay(): number
  velocityDecay(decay: number): this
  force<F extends Force<NodeDatum, LinkDatum>>(name: string): F | undefined
  force(name: string, force: null | Force<NodeDatum, LinkDatum>): this
  find(x: number, y: number, radius?: number): NodeDatum | undefined
  randomSource(): () => number
  randomSource(source: () => number): this
  on(typenames: "tick" | "end" | string): ((this: Simulation<NodeDatum, LinkDatum>) => void) | undefined
  on(typenames: "tick" | "end" | string, listener: null | ((this: this) => void)): this
}
export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
  nodesData?: NodeDatum[]
): Simulation<NodeDatum, undefined>
export function forceSimulation<
  NodeDatum extends SimulationNodeDatum,
  LinkDatum extends SimulationLinkDatum<NodeDatum>
>(nodesData?: NodeDatum[]): Simulation<NodeDatum, LinkDatum>
export interface Force<
  NodeDatum extends SimulationNodeDatum,
  LinkDatum extends SimulationLinkDatum<NodeDatum> | undefined
> {
  (alpha: number): void
  initialize?(nodes: NodeDatum[], random: () => number): void
}
export interface ForceCenter<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  x(): number
  x(x: number): this
  y(): number
  y(y: number): this
  strength(): number
  strength(strength: number): this
}
export function forceCenter<NodeDatum extends SimulationNodeDatum>(x?: number, y?: number): ForceCenter<NodeDatum>
export interface ForceCollide<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  radius(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number
  radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this
  strength(): number
  strength(strength: number): this
  iterations(): number
  iterations(iterations: number): this
}
export function forceCollide<NodeDatum extends SimulationNodeDatum>(
  radius?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
): ForceCollide<NodeDatum>
export interface ForceLink<NodeDatum extends SimulationNodeDatum, LinkDatum extends SimulationLinkDatum<NodeDatum>>
  extends Force<NodeDatum, LinkDatum> {
  initialize(nodes: NodeDatum[], random: () => number): void
  links(): LinkDatum[]
  links(links: LinkDatum[]): this
  id(): (node: NodeDatum, i: number, nodesData: NodeDatum[]) => string | number
  id(id: (node: NodeDatum, i: number, nodesData: NodeDatum[]) => string | number): this
  distance(): (link: LinkDatum, i: number, links: LinkDatum[]) => number
  distance(distance: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): this
  strength(): (link: LinkDatum, i: number, links: LinkDatum[]) => number
  strength(strength: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): this
  iterations(): number
  iterations(iterations: number): this
}
export function forceLink<NodeDatum extends SimulationNodeDatum, LinksDatum extends SimulationLinkDatum<NodeDatum>>(
  links?: LinksDatum[]
): ForceLink<NodeDatum, LinksDatum>
export interface ForceManyBody<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  strength(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  strength(strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  theta(): number
  theta(theta: number): this
  distanceMin(): number
  distanceMin(distance: number): this
  distanceMax(): number
  distanceMax(distance: number): this
}
export function forceManyBody<NodeDatum extends SimulationNodeDatum>(): ForceManyBody<NodeDatum>
export interface ForceX<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  strength(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  strength(strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  x(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  x(x: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
}
export function forceX<NodeDatum extends SimulationNodeDatum>(
  x?: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
): ForceX<NodeDatum>
export interface ForceY<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  strength(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  strength(strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  y(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  y(y: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
}
export function forceY<NodeDatum extends SimulationNodeDatum>(
  y?: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
): ForceY<NodeDatum>
export interface ForceRadial<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, any> {
  initialize(nodes: NodeDatum[], random: () => number): void
  strength(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  strength(strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  radius(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  radius(radius: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  x(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  x(x: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
  y(): (d: NodeDatum, i: number, data: NodeDatum[]) => number
  y(y: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
}
export function forceRadial<NodeDatum extends SimulationNodeDatum>(
  radius: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number),
  x?: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number),
  y?: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
): ForceRadial<NodeDatum>
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
export function formatLocale(locale: FormatLocaleDefinition): FormatLocaleObject
export function formatDefaultLocale(defaultLocale: FormatLocaleDefinition): FormatLocaleObject
export function format(specifier: string): (n: number | { valueOf(): number }) => string
export function formatPrefix(specifier: string, value: number): (n: number | { valueOf(): number }) => string
export class FormatSpecifier {
  constructor(specifier: FormatSpecifierObject)
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
export function formatSpecifier(specifier: string): FormatSpecifier
export function precisionFixed(step: number): number
export function precisionPrefix(step: number, value: number): number
export function precisionRound(step: number, max: number): number
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
export interface GeoCircleGenerator<This = any, Datum = any> {
  (this: This, d?: Datum, ...args: any[]): GeoJSON.Polygon
  center(): (this: This, d: Datum, ...args: any[]) => [number, number]
  center(center: [number, number] | ((this: This, d: Datum, ...args: any[]) => [number, number])): this
  radius(): (this: This, d: Datum, ...args: any[]) => number
  radius(radius: number | ((this: This, d: Datum, ...args: any[]) => number)): this
  precision(): (this: This, d: Datum, ...args: any[]) => number
  precision(precision: number | ((this: This, d: Datum, ...args: any[]) => number)): this
}
export function geoCircle(): GeoCircleGenerator
export function geoCircle<Datum>(): GeoCircleGenerator<any, Datum>
export function geoCircle<This, Datum>(): GeoCircleGenerator<This, Datum>
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
export interface GeoPath<This = any, DatumObject extends GeoPermissibleObjects = GeoPermissibleObjects> {
  (this: This, object: DatumObject, ...args: any[]): string | null
  (this: This, object: DatumObject, ...args: any[]): void
  area(object: DatumObject): number
  bounds(object: DatumObject): [[number, number], [number, number]]
  centroid(object: DatumObject): [number, number]
  measure(object: DatumObject): number
  context<C extends GeoContext | null>(): C
  context(context: null | GeoContext): this
  projection<P extends GeoConicProjection | GeoProjection | GeoStreamWrapper | null>(): P
  projection(projection: null | GeoProjection | GeoStreamWrapper): this
  pointRadius(): ((this: This, object: DatumObject, ...args: any[]) => number) | number
  pointRadius(value: number | ((this: This, object: DatumObject, ...args: any[]) => number)): this
}
export function geoPath(projection?: GeoProjection | GeoStreamWrapper | null, context?: GeoContext | null): GeoPath
export function geoPath<DatumObject extends GeoPermissibleObjects>(
  projection?: GeoProjection | GeoStreamWrapper | null,
  context?: GeoContext | null
): GeoPath<any, DatumObject>
export function geoPath<This, DatumObject extends GeoPermissibleObjects>(
  projection?: GeoProjection | GeoStreamWrapper | null,
  context?: GeoContext | null
): GeoPath<This, DatumObject>
export function geoProjection(project: GeoRawProjection): GeoProjection
export function geoProjectionMutator(factory: (...args: any[]) => GeoRawProjection): () => GeoProjection
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
export interface HierarchyLink<Datum> {
  source: HierarchyNode<Datum>
  target: HierarchyNode<Datum>
}
export interface HierarchyNode<Datum> {
  data: Datum
  readonly depth: number
  readonly height: number
  parent: this | null
  children?: this[] | undefined
  readonly value?: number | undefined
  readonly id?: string | undefined
  ancestors(): this[]
  descendants(): this[]
  leaves(): this[]
  find(filter: (node: this) => boolean): this | undefined
  path(target: this): this[]
  links(): Array<HierarchyLink<Datum>>
  sum(value: (d: Datum) => number): this
  count(): this
  sort(compare: (a: this, b: this) => number): this
  [Symbol.iterator](): Iterator<this>
  each<T = undefined>(func: (this: T, node: this, i: number, thisNode: this) => void, that?: T): this
  eachAfter<T = undefined>(func: (this: T, node: this, i: number, thisNode: this) => void, that?: T): this
  eachBefore<T = undefined>(func: (this: T, node: this, i: number, thisNode: this) => void, that?: T): this
  copy(): this
}
export function hierarchy<Datum>(
  data: Datum,
  children?: (d: Datum) => Iterable<Datum> | null | undefined
): HierarchyNode<Datum>
export interface StratifyOperator<Datum> {
  (data: Datum[]): HierarchyNode<Datum>
  id(): (d: Datum, i: number, data: Datum[]) => string | null | "" | undefined
  id(id: (d: Datum, i: number, data: Datum[]) => string | null | "" | undefined): this
  parentId(): (d: Datum, i: number, data: Datum[]) => string | null | "" | undefined
  parentId(parentId: (d: Datum, i: number, data: Datum[]) => string | null | "" | undefined): this
  path(): ((d: Datum, i: number, data: Datum[]) => string) | null | undefined
  path(path: ((d: Datum, i: number, data: Datum[]) => string) | null | undefined): this
}
export function stratify<Datum>(): StratifyOperator<Datum>
export interface HierarchyPointLink<Datum> {
  source: HierarchyPointNode<Datum>
  target: HierarchyPointNode<Datum>
}
export interface HierarchyPointNode<Datum> extends HierarchyNode<Datum> {
  x: number
  y: number
  links(): Array<HierarchyPointLink<Datum>>
}
export interface ClusterLayout<Datum> {
  (root: HierarchyNode<Datum>): HierarchyPointNode<Datum>
  size(): [number, number] | null
  size(size: [number, number]): this
  nodeSize(): [number, number] | null
  nodeSize(size: [number, number]): this
  separation(): (a: HierarchyPointNode<Datum>, b: HierarchyPointNode<Datum>) => number
  separation(separation: (a: HierarchyPointNode<Datum>, b: HierarchyPointNode<Datum>) => number): this
}
export function cluster<Datum>(): ClusterLayout<Datum>
export interface TreeLayout<Datum> {
  (root: HierarchyNode<Datum>): HierarchyPointNode<Datum>
  size(): [number, number] | null
  size(size: [number, number]): this
  nodeSize(): [number, number] | null
  nodeSize(size: [number, number]): this
  separation(): (a: HierarchyPointNode<Datum>, b: HierarchyPointNode<Datum>) => number
  separation(separation: (a: HierarchyPointNode<Datum>, b: HierarchyPointNode<Datum>) => number): this
}
export function tree<Datum>(): TreeLayout<Datum>
export interface HierarchyRectangularLink<Datum> {
  source: HierarchyRectangularNode<Datum>
  target: HierarchyRectangularNode<Datum>
}
export interface HierarchyRectangularNode<Datum> extends HierarchyNode<Datum> {
  x0: number
  y0: number
  x1: number
  y1: number
  links(): Array<HierarchyRectangularLink<Datum>>
}
export interface TreemapLayout<Datum> {
  (root: HierarchyNode<Datum>): HierarchyRectangularNode<Datum>
  tile(): (node: HierarchyRectangularNode<Datum>, x0: number, y0: number, x1: number, y1: number) => void
  tile(tile: (node: HierarchyRectangularNode<Datum>, x0: number, y0: number, x1: number, y1: number) => void): this
  size(): [number, number]
  size(size: [number, number]): this
  round(): boolean
  round(round: boolean): this
  padding(): (node: HierarchyRectangularNode<Datum>) => number
  padding(padding: number): this
  padding(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingInner(): (node: HierarchyRectangularNode<Datum>) => number
  paddingInner(padding: number): this
  paddingInner(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingOuter(): (node: HierarchyRectangularNode<Datum>) => number
  paddingOuter(padding: number): this
  paddingOuter(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingTop(): (node: HierarchyRectangularNode<Datum>) => number
  paddingTop(padding: number): this
  paddingTop(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingRight(): (node: HierarchyRectangularNode<Datum>) => number
  paddingRight(padding: number): this
  paddingRight(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingBottom(): (node: HierarchyRectangularNode<Datum>) => number
  paddingBottom(padding: number): this
  paddingBottom(padding: (node: HierarchyRectangularNode<Datum>) => number): this
  paddingLeft(): (node: HierarchyRectangularNode<Datum>) => number
  paddingLeft(padding: number): this
  paddingLeft(padding: (node: HierarchyRectangularNode<Datum>) => number): this
}
export function treemap<Datum>(): TreemapLayout<Datum>
export function treemapBinary(node: HierarchyRectangularNode<any>, x0: number, y0: number, x1: number, y1: number): void
export function treemapDice(node: HierarchyRectangularNode<any>, x0: number, y0: number, x1: number, y1: number): void
export function treemapSlice(node: HierarchyRectangularNode<any>, x0: number, y0: number, x1: number, y1: number): void
export function treemapSliceDice(
  node: HierarchyRectangularNode<any>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void
export interface RatioSquarifyTilingFactory {
  (node: HierarchyRectangularNode<any>, x0: number, y0: number, x1: number, y1: number): void
  ratio(ratio: number): RatioSquarifyTilingFactory
}
export const treemapSquarify: RatioSquarifyTilingFactory
export const treemapResquarify: RatioSquarifyTilingFactory
export interface PartitionLayout<Datum> {
  (root: HierarchyNode<Datum>): HierarchyRectangularNode<Datum>
  size(): [number, number]
  size(size: [number, number]): this
  round(): boolean
  round(round: boolean): this
  padding(): number
  padding(padding: number): this
}
export function partition<Datum>(): PartitionLayout<Datum>
export interface HierarchyCircularLink<Datum> {
  source: HierarchyCircularNode<Datum>
  target: HierarchyCircularNode<Datum>
}
export interface HierarchyCircularNode<Datum> extends HierarchyNode<Datum> {
  x: number
  y: number
  r: number
  links(): Array<HierarchyCircularLink<Datum>>
}
export interface PackLayout<Datum> {
  (root: HierarchyNode<Datum>): HierarchyCircularNode<Datum>
  radius(): null | ((node: HierarchyCircularNode<Datum>) => number)
  radius(radius: null | ((node: HierarchyCircularNode<Datum>) => number)): this
  size(): [number, number]
  size(size: [number, number]): this
  padding(): (node: HierarchyCircularNode<Datum>) => number
  padding(padding: number): this
  padding(padding: (node: HierarchyCircularNode<Datum>) => number): this
}
export function pack<Datum>(): PackLayout<Datum>
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
export function packSiblings<Datum extends PackRadius>(circles: Datum[]): Array<Datum & PackCircle>
export function packEnclose<Datum extends PackCircle>(circles: Datum[]): PackCircle
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
export function interpolate(a: any, b: null): (t: number) => null
export function interpolate(a: any, b: boolean): (t: number) => boolean
export function interpolate(a: string | ColorCommonInstance, b: ColorCommonInstance): (t: number) => string
export function interpolate(a: Date, b: Date): (t: number) => Date
export function interpolate(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (t: number) => number
export function interpolate<T extends NumberArray>(a: NumberArray | number[], b: T): (t: number) => T
export function interpolate(a: string | { toString(): string }, b: string): (t: number) => string
export function interpolate<U extends any[]>(a: any[], b: U): (t: number) => U
export function interpolate<U extends object>(a: any, b: U): (t: number) => U
export function interpolateNumber(
  a: number | { valueOf(): number },
  b: number | { valueOf(): number }
): (t: number) => number
export function interpolateRound(
  a: number | { valueOf(): number },
  b: number | { valueOf(): number }
): (t: number) => number
export function interpolateString(
  a: string | { toString(): string },
  b: string | { toString(): string }
): (t: number) => string
export function interpolateDate(a: Date, b: Date): (t: number) => Date
export type ArrayInterpolator<A extends any[]> = (t: number) => A
export function interpolateArray<A extends any[]>(a: any[], b: A): ArrayInterpolator<A>
export function interpolateArray<T extends NumberArray>(a: NumberArray | number[], b: T): (t: number) => T
export function interpolateNumberArray<T extends NumberArray | number[]>(
  a: NumberArray | number[],
  b: T
): (t: number) => T
export function interpolateObject<U extends object>(a: any, b: U): (t: number) => U
export function interpolateTransformCss(a: string, b: string): (t: number) => string
export function interpolateTransformSvg(a: string, b: string): (t: number) => string
export function interpolateZoom(a: ZoomView, b: ZoomView): ZoomInterpolator
export function interpolateDiscrete<T>(values: T[]): (t: number) => T
export function quantize<T>(interpolator: (t: number) => T, n: number): T[]
export const interpolateRgb: ColorGammaInterpolationFactory
export function interpolateRgbBasis(colors: Array<string | ColorCommonInstance>): (t: number) => string
export function interpolateRgbBasisClosed(colors: Array<string | ColorCommonInstance>): (t: number) => string
export function interpolateHsl(a: string | ColorCommonInstance, b: string | ColorCommonInstance): (t: number) => string
export function interpolateHslLong(
  a: string | ColorCommonInstance,
  b: string | ColorCommonInstance
): (t: number) => string
export function interpolateLab(a: string | ColorCommonInstance, b: string | ColorCommonInstance): (t: number) => string
export function interpolateHcl(a: string | ColorCommonInstance, b: string | ColorCommonInstance): (t: number) => string
export function interpolateHclLong(
  a: string | ColorCommonInstance,
  b: string | ColorCommonInstance
): (t: number) => string
export const interpolateCubehelix: ColorGammaInterpolationFactory
export const interpolateCubehelixLong: ColorGammaInterpolationFactory
export function interpolateHue(a: number, b: number): (t: number) => number
export function interpolateBasis(splineNodes: number[]): (t: number) => number
export function interpolateBasisClosed(splineNodes: number[]): (t: number) => number
export function piecewise(values: ZoomView[]): ZoomInterpolator
export function piecewise(
  interpolate: (a: ZoomView, b: ZoomView) => ZoomInterpolator,
  values: ZoomView[]
): ZoomInterpolator
export function piecewise<A extends any[]>(values: A[]): ArrayInterpolator<A>
export function piecewise<A extends any[]>(
  interpolate: (a: any[], b: A) => ArrayInterpolator<A>,
  values: A[]
): ArrayInterpolator<A>
export function piecewise(values: unknown[]): (t: number) => any
export function piecewise<TData>(interpolate: (a: TData, b: TData) => unknown, values: TData[]): (t: number) => any
export interface Path {
  moveTo(x: number, y: number): void
  closePath(): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  bezierCurveTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number): void
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void
  rect(x: number, y: number, w: number, h: number): void
  toString(): string
}
export function path(): Path
export function polygonArea(polygon: Array<[number, number]>): number
export function polygonCentroid(polygon: Array<[number, number]>): [number, number]
export function polygonHull(points: Array<[number, number]>): Array<[number, number]> | null
export function polygonContains(polygon: Array<[number, number]>, point: [number, number]): boolean
export function polygonLength(polygon: Array<[number, number]>): number
export interface QuadtreeLeaf<T> {
  data: T
  next?: QuadtreeLeaf<T> | undefined
  length?: undefined
}
export interface QuadtreeInternalNode<T> extends Array<QuadtreeInternalNode<T> | QuadtreeLeaf<T> | undefined> {
  length: 4
}
export interface Quadtree<T> {
  x(): (d: T) => number
  x(x: (d: T) => number): this
  y(): (d: T) => number
  y(y: (d: T) => number): this
  extent(): [[number, number], [number, number]] | undefined
  extent(extend: [[number, number], [number, number]]): this
  cover(x: number, y: number): this
  add(x: T): this
  addAll(data: T[]): this
  remove(x: T): this
  removeAll(data: T[]): this
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
export function quadtree<T = [number, number]>(data?: T[]): Quadtree<T>
export function quadtree<T = [number, number]>(data: T[], x: (d: T) => number, y: (d: T) => number): Quadtree<T>
export interface RandomNumberGenerationSource {
  source(source: () => number): this
}
export interface RandomUniform extends RandomNumberGenerationSource {
  (max?: number): () => number
  (min: number, max: number): () => number
}
export const randomUniform: RandomUniform
export interface RandomInt extends RandomNumberGenerationSource {
  (max: number): () => number
  (min: number, max: number): () => number
}
export const randomInt: RandomInt
export interface RandomNormal extends RandomNumberGenerationSource {
  (mu?: number, sigma?: number): () => number
}
export const randomNormal: RandomNormal
export interface RandomLogNormal extends RandomNumberGenerationSource {
  (mu?: number, sigma?: number): () => number
}
export const randomLogNormal: RandomLogNormal
export interface RandomBates extends RandomNumberGenerationSource {
  (n: number): () => number
}
export const randomBates: RandomBates
export interface RandomIrwinHall extends RandomNumberGenerationSource {
  (n: number): () => number
}
export const randomIrwinHall: RandomIrwinHall
export interface RandomExponential extends RandomNumberGenerationSource {
  (lambda: number): () => number
}
export const randomExponential: RandomExponential
export interface RandomPareto extends RandomNumberGenerationSource {
  (alpha: number): () => number
}
export const randomPareto: RandomPareto
export interface RandomBernoulli extends RandomNumberGenerationSource {
  (p: number): () => number
}
export const randomBernoulli: RandomBernoulli
export interface RandomGeometric extends RandomNumberGenerationSource {
  (p: number): () => number
}
export const randomGeometric: RandomGeometric
export interface RandomBinomial extends RandomNumberGenerationSource {
  (p: number): () => number
}
export const randomBinomial: RandomBinomial
export interface RandomGamma extends RandomNumberGenerationSource {
  (k: number, theta?: number): () => number
}
export const randomGamma: RandomGamma
export interface RandomBeta extends RandomNumberGenerationSource {
  (alpha: number, beta: number): () => number
}
export const randomBeta: RandomBeta
export interface RandomWeibull extends RandomNumberGenerationSource {
  (k: number, a?: number, b?: number): () => number
}
export const randomWeibull: RandomWeibull
export interface RandomCauchy extends RandomNumberGenerationSource {
  (a?: number, b?: number): () => number
}
export const randomCauchy: RandomCauchy
export interface RandomLogistic extends RandomNumberGenerationSource {
  (a?: number, b?: number): () => number
}
export const randomLogistic: RandomLogistic
export interface RandomPoisson extends RandomNumberGenerationSource {
  (lambda: number): () => number
}
export const randomPoisson: RandomPoisson
export function randomLcg(seed?: number): () => number
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
export const schemeCategory10: ReadonlyArray<string>
export const schemeAccent: ReadonlyArray<string>
export const schemeDark2: ReadonlyArray<string>
export const schemePaired: ReadonlyArray<string>
export const schemePastel1: ReadonlyArray<string>
export const schemePastel2: ReadonlyArray<string>
export const schemeSet1: ReadonlyArray<string>
export const schemeSet2: ReadonlyArray<string>
export const schemeSet3: ReadonlyArray<string>
export const schemeTableau10: ReadonlyArray<string>
export function interpolateBrBG(t: number): string
export const schemeBrBG: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePRGn(t: number): string
export const schemePRGn: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePiYG(t: number): string
export const schemePiYG: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePuOr(t: number): string
export const schemePuOr: ReadonlyArray<ReadonlyArray<string>>
export function interpolateRdBu(t: number): string
export const schemeRdBu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateRdGy(t: number): string
export const schemeRdGy: ReadonlyArray<ReadonlyArray<string>>
export function interpolateRdYlBu(t: number): string
export const schemeRdYlBu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateRdYlGn(t: number): string
export const schemeRdYlGn: ReadonlyArray<ReadonlyArray<string>>
export function interpolateSpectral(t: number): string
export const schemeSpectral: ReadonlyArray<ReadonlyArray<string>>
export function interpolateBlues(t: number): string
export const schemeBlues: ReadonlyArray<ReadonlyArray<string>>
export function interpolateGreens(t: number): string
export const schemeGreens: ReadonlyArray<ReadonlyArray<string>>
export function interpolateGreys(t: number): string
export const schemeGreys: ReadonlyArray<ReadonlyArray<string>>
export function interpolateOranges(t: number): string
export const schemeOranges: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePurples(t: number): string
export const schemePurples: ReadonlyArray<ReadonlyArray<string>>
export function interpolateReds(t: number): string
export const schemeReds: ReadonlyArray<ReadonlyArray<string>>
export function interpolateTurbo(t: number): string
export function interpolateViridis(t: number): string
export function interpolateInferno(t: number): string
export function interpolateMagma(t: number): string
export function interpolatePlasma(t: number): string
export function interpolateCividis(t: number): string
export function interpolateWarm(t: number): string
export function interpolateCool(t: number): string
export function interpolateRainbow(t: number): string
export function interpolateSinebow(t: number): string
export function interpolateCubehelixDefault(t: number): string
export function interpolateBuGn(t: number): string
export const schemeBuGn: ReadonlyArray<ReadonlyArray<string>>
export function interpolateBuPu(t: number): string
export const schemeBuPu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateGnBu(t: number): string
export const schemeGnBu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateOrRd(t: number): string
export const schemeOrRd: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePuBuGn(t: number): string
export const schemePuBuGn: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePuBu(t: number): string
export const schemePuBu: ReadonlyArray<ReadonlyArray<string>>
export function interpolatePuRd(t: number): string
export const schemePuRd: ReadonlyArray<ReadonlyArray<string>>
export function interpolateRdPu(t: number): string
export const schemeRdPu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateYlGnBu(t: number): string
export const schemeYlGnBu: ReadonlyArray<ReadonlyArray<string>>
export function interpolateYlGn(t: number): string
export const schemeYlGn: ReadonlyArray<ReadonlyArray<string>>
export function interpolateYlOrBr(t: number): string
export const schemeYlOrBr: ReadonlyArray<ReadonlyArray<string>>
export function interpolateYlOrRd(t: number): string
export const schemeYlOrRd: ReadonlyArray<ReadonlyArray<string>>
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
export type ValueFn<T extends BaseType, Datum, Result> = (
  this: T,
  datum: Datum,
  i: number,
  groups: T[] | ArrayLike<T>
) => Result
export interface TransitionLike<GElement extends BaseType, Datum> {
  selection(): Selection<GElement, Datum, any, any>
  on(type: string, listener: null): TransitionLike<GElement, Datum>
  on(type: string, listener: ValueFn<GElement, Datum, void>): TransitionLike<GElement, Datum>
  tween(name: string, tweenFn: null): TransitionLike<GElement, Datum>
  tween(name: string, tweenFn: ValueFn<GElement, Datum, (t: number) => void>): TransitionLike<GElement, Datum>
}
export function select<GElement extends BaseType, OldDatum>(
  selector: string
): Selection<GElement, OldDatum, HTMLElement, any>
export function select<GElement extends BaseType, OldDatum>(
  node: GElement
): Selection<GElement, OldDatum, null, undefined>
export function selectAll(selector?: null): Selection<null, undefined, null, undefined>
export function selectAll<GElement extends BaseType, OldDatum>(
  selector: string
): Selection<GElement, OldDatum, HTMLElement, any>
export function selectAll<GElement extends BaseType, OldDatum>(
  nodes: GElement[] | ArrayLike<GElement> | Iterable<GElement>
): Selection<GElement, OldDatum, null, undefined>
export interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
  select<DescElement extends BaseType>(selector: string): Selection<DescElement, Datum, PElement, PDatum>
  select<DescElement extends BaseType>(selector: null): Selection<null, undefined, PElement, PDatum>
  select<DescElement extends BaseType>(
    selector: ValueFn<GElement, Datum, DescElement>
  ): Selection<DescElement, Datum, PElement, PDatum>
  selectAll(selector?: null): Selection<null, undefined, GElement, Datum>
  selectAll<DescElement extends BaseType, OldDatum>(selector: string): Selection<DescElement, OldDatum, GElement, Datum>
  selectAll<DescElement extends BaseType, OldDatum>(
    selector: ValueFn<GElement, Datum, DescElement[] | ArrayLike<DescElement> | Iterable<DescElement>>
  ): Selection<DescElement, OldDatum, GElement, Datum>
  filter(selector: string): Selection<GElement, Datum, PElement, PDatum>
  filter<FilteredElement extends BaseType>(selector: string): Selection<FilteredElement, Datum, PElement, PDatum>
  filter(selector: ValueFn<GElement, Datum, boolean>): Selection<GElement, Datum, PElement, PDatum>
  filter<FilteredElement extends BaseType>(
    selector: ValueFn<GElement, Datum, boolean>
  ): Selection<FilteredElement, Datum, PElement, PDatum>
  merge(
    other: Selection<GElement, Datum, PElement, PDatum> | TransitionLike<GElement, Datum>
  ): Selection<GElement, Datum, PElement, PDatum>
  selectChild<DescElement extends BaseType>(selector?: string): Selection<DescElement, Datum, PElement, PDatum>
  selectChild<ResultElement extends BaseType, ChildElement extends BaseType>(
    selector: (child: ChildElement, i: number, children: ChildElement[]) => boolean
  ): Selection<ResultElement, Datum, PElement, PDatum>
  selectChildren<DescElement extends BaseType, OldDatum>(
    selector?: string
  ): Selection<DescElement, OldDatum, GElement, Datum>
  selectChildren<ResultElement extends BaseType, ResultDatum, ChildElement extends BaseType>(
    selector: (child: ChildElement, i: number, children: ChildElement[]) => boolean
  ): Selection<ResultElement, ResultDatum, GElement, Datum>
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
      | ValueFn<GElement, Datum, null | string | number | boolean | ReadonlyArray<string | number>>
  ): this
  classed(names: string): boolean
  classed(names: string, value: boolean): this
  classed(names: string, value: ValueFn<GElement, Datum, boolean>): this
  style(name: string): string
  style(name: string, value: null): this
  style(name: string, value: string | number | boolean, priority?: null | "important"): this
  style(
    name: string,
    value: ValueFn<GElement, Datum, string | number | boolean | null>,
    priority?: null | "important"
  ): this
  property(name: string): any
  property<T>(name: Local<T>): T | undefined
  property(name: string, value: ValueFn<GElement, Datum, any> | null): this
  property(name: string, value: any): this
  property<T>(name: Local<T>, value: ValueFn<GElement, Datum, T>): this
  property<T>(name: Local<T>, value: T): this
  text(): string
  text(value: null | string | number | boolean | ValueFn<GElement, Datum, string | number | boolean | null>): this
  html(): string
  html(value: null | string | ValueFn<GElement, Datum, string | null>): this
  append<K extends keyof ElementTagNameMap>(type: K): Selection<ElementTagNameMap[K], Datum, PElement, PDatum>
  append<ChildElement extends BaseType>(type: string): Selection<ChildElement, Datum, PElement, PDatum>
  append<ChildElement extends BaseType>(
    type: ValueFn<GElement, Datum, ChildElement>
  ): Selection<ChildElement, Datum, PElement, PDatum>
  insert<K extends keyof ElementTagNameMap>(
    type: K,
    before?: string | ValueFn<GElement, Datum, BaseType>
  ): Selection<ElementTagNameMap[K], Datum, PElement, PDatum>
  insert<ChildElement extends BaseType>(
    type: string | ValueFn<GElement, Datum, ChildElement>,
    before?: string | ValueFn<GElement, Datum, BaseType>
  ): Selection<ChildElement, Datum, PElement, PDatum>
  remove(): this
  clone(deep?: boolean): Selection<GElement, Datum, PElement, PDatum>
  sort(comparator?: (a: Datum, b: Datum) => number): this
  order(): this
  raise(): this
  lower(): this
  data(): Datum[]
  data<NewDatum>(
    data: NewDatum[] | Iterable<NewDatum> | ValueFn<PElement, PDatum, NewDatum[] | Iterable<NewDatum>>,
    key?: ValueFn<GElement | PElement, Datum | NewDatum, KeyType>
  ): Selection<GElement, NewDatum, PElement, PDatum>
  join<K extends keyof ElementTagNameMap, OldDatum = Datum>(
    enter: K,
    update?: (
      elem: Selection<GElement, Datum, PElement, PDatum>
    ) => Selection<GElement, Datum, PElement, PDatum> | TransitionLike<GElement, Datum> | undefined,
    exit?: (elem: Selection<GElement, OldDatum, PElement, PDatum>) => void
  ): Selection<GElement | ElementTagNameMap[K], Datum, PElement, PDatum>
  join<ChildElement extends BaseType, OldDatum = Datum>(
    enter:
      | string
      | ((
          elem: Selection<EnterElement, Datum, PElement, PDatum>
        ) => Selection<ChildElement, Datum, PElement, PDatum> | TransitionLike<GElement, Datum>),
    update?: (
      elem: Selection<GElement, Datum, PElement, PDatum>
    ) => Selection<GElement, Datum, PElement, PDatum> | TransitionLike<GElement, Datum> | undefined,
    exit?: (elem: Selection<GElement, OldDatum, PElement, PDatum>) => void
  ): Selection<ChildElement | GElement, Datum, PElement, PDatum>
  enter(): Selection<EnterElement, Datum, PElement, PDatum>
  exit<OldDatum>(): Selection<GElement, OldDatum, PElement, PDatum>
  datum(): Datum
  datum(value: null): Selection<GElement, undefined, PElement, PDatum>
  datum<NewDatum>(value: ValueFn<GElement, Datum, NewDatum>): Selection<GElement, NewDatum, PElement, PDatum>
  datum<NewDatum>(value: NewDatum): Selection<GElement, NewDatum, PElement, PDatum>
  on(typenames: string): ((this: GElement, event: any, d: Datum) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: GElement, event: any, d: Datum) => void, options?: any): this
  dispatch(type: string, parameters?: CustomEventParameters): this
  dispatch(type: string, parameters?: ValueFn<GElement, Datum, CustomEventParameters>): this
  each(func: ValueFn<GElement, Datum, void>): this
  call(func: (selection: Selection<GElement, Datum, PElement, PDatum>, ...args: any[]) => void, ...args: any[]): this
  empty(): boolean
  nodes(): GElement[]
  node(): GElement | null
  size(): number
  [Symbol.iterator](): Iterator<GElement>
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
  interface CanvasRenderingContext2D {} // tslint:disable-line no-empty-interface
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
export interface Arc<This, Datum> {
  (this: This, d: Datum, ...args: any[]): string | null
  (this: This, d: Datum, ...args: any[]): void
  centroid(d: Datum, ...args: any[]): [number, number]
  innerRadius(): (this: This, d: Datum, ...args: any[]) => number
  innerRadius(radius: number): this
  innerRadius(radius: (this: This, d: Datum, ...args: any[]) => number): this
  outerRadius(): (this: This, d: Datum, ...args: any[]) => number
  outerRadius(radius: number): this
  outerRadius(radius: (this: This, d: Datum, ...args: any[]) => number): this
  cornerRadius(): (this: This, d: Datum, ...args: any[]) => number
  cornerRadius(radius: number): this
  cornerRadius(radius: (this: This, d: Datum, ...args: any[]) => number): this
  startAngle(): (this: This, d: Datum, ...args: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, d: Datum, ...args: any[]) => number): this
  endAngle(): (this: This, d: Datum, ...args: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, d: Datum, ...args: any[]) => number): this
  padAngle(): (this: This, d: Datum, ...args: any[]) => number | undefined
  padAngle(angle: number | undefined): this
  padAngle(angle: (this: This, d: Datum, ...args: any[]) => number | undefined): this
  padRadius(): ((this: This, d: Datum, ...args: any[]) => number) | null
  padRadius(radius: null | number | ((this: This, d: Datum, ...args: any[]) => number)): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export function arc(): Arc<any, DefaultArcObject>
export function arc<Datum>(): Arc<any, Datum>
export function arc<This, Datum>(): Arc<This, Datum>
export interface PieArcDatum<T> {
  data: T
  value: number
  i: number
  startAngle: number
  endAngle: number
  padAngle: number
}
export interface Pie<This, Datum> {
  (this: This, data: Datum[], ...args: any[]): Array<PieArcDatum<Datum>>
  value(): (d: Datum, i: number, data: Datum[]) => number
  value(value: number): this
  value(value: (d: Datum, i: number, data: Datum[]) => number): this
  sort(): ((a: Datum, b: Datum) => number) | null
  sort(comparator: (a: Datum, b: Datum) => number): this
  sort(comparator: null): this
  sortValues(): ((a: number, b: number) => number) | null
  sortValues(comparator: ((a: number, b: number) => number) | null): this
  startAngle(): (this: This, data: Datum[], ...args: any[]) => number
  startAngle(angle: number): this
  startAngle(angle: (this: This, data: Datum[], ...args: any[]) => number): this
  endAngle(): (this: This, data: Datum[], ...args: any[]) => number
  endAngle(angle: number): this
  endAngle(angle: (this: This, data: Datum[], ...args: any[]) => number): this
  padAngle(): (this: This, data: Datum[], ...args: any[]) => number
  padAngle(angle: number): this
  padAngle(angle: (this: This, data: Datum[], ...args: any[]) => number): this
}
export function pie(): Pie<any, number | { valueOf(): number }>
export function pie<Datum>(): Pie<any, Datum>
export function pie<This, Datum>(): Pie<This, Datum>
export interface Line<Datum> {
  (data: Iterable<Datum> | Datum[]): string | null
  (data: Iterable<Datum> | Datum[]): void
  x(): (d: Datum, i: number, data: Datum[]) => number
  x(x: number): this
  x(x: (d: Datum, i: number, data: Datum[]) => number): this
  y(): (d: Datum, i: number, data: Datum[]) => number
  y(y: number): this
  y(y: (d: Datum, i: number, data: Datum[]) => number): this
  defined(): (d: Datum, i: number, data: Datum[]) => boolean
  defined(defined: boolean): this
  defined(defined: (d: Datum, i: number, data: Datum[]) => boolean): this
  curve(): CurveFactory | CurveFactoryLineOnly
  curve<C extends CurveFactory | CurveFactoryLineOnly>(): C
  curve(curve: CurveFactory | CurveFactoryLineOnly): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export function line<Datum = [number, number]>(
  x?: number | ((d: Datum, i: number, data: Datum[]) => number),
  y?: number | ((d: Datum, i: number, data: Datum[]) => number)
): Line<Datum>
export interface LineRadial<Datum> {
  (data: Iterable<Datum> | Datum[]): string | null
  (data: Iterable<Datum> | Datum[]): void
  angle(): (d: Datum, i: number, data: Datum[]) => number
  angle(angle: number): this
  angle(angle: (d: Datum, i: number, data: Datum[]) => number): this
  radius(): (d: Datum, i: number, data: Datum[]) => number
  radius(radius: number): this
  radius(radius: (d: Datum, i: number, data: Datum[]) => number): this
  defined(): (d: Datum, i: number, data: Datum[]) => boolean
  defined(defined: boolean): this
  defined(defined: (d: Datum, i: number, data: Datum[]) => boolean): this
  curve(): CurveFactory | CurveFactoryLineOnly
  curve<C extends CurveFactory | CurveFactoryLineOnly>(): C
  curve(curve: CurveFactory | CurveFactoryLineOnly): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export function lineRadial(): LineRadial<[number, number]>
export function lineRadial<Datum>(): LineRadial<Datum>
export type RadialLine<Datum> = LineRadial<Datum>
export function radialLine(): RadialLine<[number, number]>
export function radialLine<Datum>(): RadialLine<Datum>
export interface Area<Datum> {
  (data: Iterable<Datum> | Datum[]): string | null
  (data: Iterable<Datum> | Datum[]): void
  x(): (d: Datum, i: number, data: Datum[]) => number
  x(x: number): this
  x(x: (d: Datum, i: number, data: Datum[]) => number): this
  x0(): (d: Datum, i: number, data: Datum[]) => number
  x0(x: number): this
  x0(x: (d: Datum, i: number, data: Datum[]) => number): this
  x1(): ((d: Datum, i: number, data: Datum[]) => number) | null
  x1(x: null | number): this
  x1(x: (d: Datum, i: number, data: Datum[]) => number): this
  y(): (d: Datum, i: number, data: Datum[]) => number
  y(y: number): this
  y(y: (d: Datum, i: number, data: Datum[]) => number): this
  y0(): (d: Datum, i: number, data: Datum[]) => number
  y0(y: number): this
  y0(y: (d: Datum, i: number, data: Datum[]) => number): this
  y1(): ((d: Datum, i: number, data: Datum[]) => number) | null
  y1(y: null | number): this
  y1(y: (d: Datum, i: number, data: Datum[]) => number): this
  defined(): (d: Datum, i: number, data: Datum[]) => boolean
  defined(defined: boolean): this
  defined(defined: (d: Datum, i: number, data: Datum[]) => boolean): this
  curve(): CurveFactory
  curve<C extends CurveFactory>(): C
  curve(curve: CurveFactory): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
  lineX0(): Line<Datum>
  lineY0(): Line<Datum>
  lineX1(): Line<Datum>
  lineY1(): Line<Datum>
}
export function area<Datum = [number, number]>(
  x?: number | ((d: Datum, i: number, data: Datum[]) => number),
  y0?: number | ((d: Datum, i: number, data: Datum[]) => number),
  y1?: number | ((d: Datum, i: number, data: Datum[]) => number)
): Area<Datum>
export interface AreaRadial<Datum> {
  (data: Iterable<Datum> | Datum[]): string | null
  (data: Iterable<Datum> | Datum[]): void
  angle(): (d: Datum, i: number, data: Datum[]) => number
  angle(angle: number): this
  angle(angle: (d: Datum, i: number, data: Datum[]) => number): this
  startAngle(): (d: Datum, i: number, data: Datum[]) => number
  startAngle(angle: number): this
  startAngle(angle: (d: Datum, i: number, data: Datum[]) => number): this
  endAngle(): ((d: Datum, i: number, data: Datum[]) => number) | null
  endAngle(angle: null | number): this
  endAngle(angle: (d: Datum, i: number, data: Datum[]) => number): this
  radius(): (d: Datum, i: number, data: Datum[]) => number
  radius(radius: number): this
  radius(radius: (d: Datum, i: number, data: Datum[]) => number): this
  innerRadius(): (d: Datum, i: number, data: Datum[]) => number
  innerRadius(radius: number): this
  innerRadius(radius: (d: Datum, i: number, data: Datum[]) => number): this
  outerRadius(): ((d: Datum, i: number, data: Datum[]) => number) | null
  outerRadius(radius: null | number): this
  outerRadius(radius: (d: Datum, i: number, data: Datum[]) => number): this
  defined(): (d: Datum, i: number, data: Datum[]) => boolean
  defined(defined: boolean): this
  defined(defined: (d: Datum, i: number, data: Datum[]) => boolean): this
  curve(): CurveFactory
  curve<C extends CurveFactory>(): C
  curve(curve: CurveFactory): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
  lineStartAngle(): LineRadial<Datum>
  lineInnerRadius(): LineRadial<Datum>
  lineEndAngle(): LineRadial<Datum>
  lineOuterRadius(): LineRadial<Datum>
}
export function areaRadial(): AreaRadial<[number, number]>
export function areaRadial<Datum>(): AreaRadial<Datum>
export type RadialArea<Datum> = AreaRadial<Datum>
export function radialArea(): RadialArea<[number, number]>
export function radialArea<Datum>(): RadialArea<Datum>
export interface CurveGeneratorLineOnly {
  lineStart(): void
  lineEnd(): void
  point(x: number, y: number): void
}
export type CurveFactoryLineOnly = (context: CanvasRenderingContext2D | Path) => CurveGeneratorLineOnly
export interface CurveGenerator extends CurveGeneratorLineOnly {
  areaStart(): void
  areaEnd(): void
}
export type CurveFactory = (context: CanvasRenderingContext2D | Path) => CurveGenerator
export const curveBasis: CurveFactory
export const curveBasisClosed: CurveFactory
export const curveBasisOpen: CurveFactory
export const curveBumpX: CurveFactory
export const curveBumpY: CurveFactory
export interface CurveBundleFactory extends CurveFactoryLineOnly {
  beta(beta: number): this
}
export const curveBundle: CurveBundleFactory
export interface CurveCardinalFactory extends CurveFactory {
  tension(tension: number): this
}
export const curveCardinal: CurveCardinalFactory
export const curveCardinalClosed: CurveCardinalFactory
export const curveCardinalOpen: CurveCardinalFactory
export interface CurveCatmullRomFactory extends CurveFactory {
  alpha(alpha: number): this
}
export const curveCatmullRom: CurveCatmullRomFactory
export const curveCatmullRomClosed: CurveCatmullRomFactory
export const curveCatmullRomOpen: CurveCatmullRomFactory
export const curveLinear: CurveFactory
export const curveLinearClosed: CurveFactory
export const curveMonotoneX: CurveFactory
export const curveMonotoneY: CurveFactory
export const curveNatural: CurveFactory
export const curveStep: CurveFactory
export const curveStepAfter: CurveFactory
export const curveStepBefore: CurveFactory
export interface DefaultLinkObject {
  source: [number, number]
  target: [number, number]
}
export interface Link<This, LinkDatum, NodeDatum> {
  (this: This, d: LinkDatum, ...args: any[]): string | null
  (this: This, d: LinkDatum, ...args: any[]): void
  source(): (this: This, d: LinkDatum, ...args: any[]) => NodeDatum
  source(source: (this: This, d: LinkDatum, ...args: any[]) => NodeDatum): this
  target(): (this: This, d: LinkDatum, ...args: any[]) => NodeDatum
  target(target: (this: This, d: LinkDatum, ...args: any[]) => NodeDatum): this
  x(): (this: This, node: NodeDatum, ...args: any[]) => number
  x(x: (this: This, node: NodeDatum, ...args: any[]) => number): this
  y(): (this: This, node: NodeDatum, ...args: any[]) => number
  y(y: (this: This, node: NodeDatum, ...args: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export function link(curve: CurveFactory): Link<any, DefaultLinkObject, [number, number]>
export function link<LinkDatum, NodeDatum>(curve: CurveFactory): Link<any, LinkDatum, NodeDatum>
export function link<This, LinkDatum, NodeDatum>(curve: CurveFactory): Link<This, LinkDatum, NodeDatum>
export function linkHorizontal(): Link<any, DefaultLinkObject, [number, number]>
export function linkHorizontal<LinkDatum, NodeDatum>(): Link<any, LinkDatum, NodeDatum>
export function linkHorizontal<This, LinkDatum, NodeDatum>(): Link<This, LinkDatum, NodeDatum>
export function linkVertical(): Link<any, DefaultLinkObject, [number, number]>
export function linkVertical<LinkDatum, NodeDatum>(): Link<any, LinkDatum, NodeDatum>
export function linkVertical<This, LinkDatum, NodeDatum>(): Link<This, LinkDatum, NodeDatum>
export interface LinkRadial<This, LinkDatum, NodeDatum> {
  (this: This, d: LinkDatum, ...args: any[]): string | null
  (this: This, d: LinkDatum, ...args: any[]): void
  source(): (this: This, d: LinkDatum, ...args: any[]) => NodeDatum
  source(source: (this: This, d: LinkDatum, ...args: any[]) => NodeDatum): this
  target(): (this: This, d: LinkDatum, ...args: any[]) => NodeDatum
  target(target: (this: This, d: LinkDatum, ...args: any[]) => NodeDatum): this
  angle(): (this: This, node: NodeDatum, ...args: any[]) => number
  angle(angle: (this: This, node: NodeDatum, ...args: any[]) => number): this
  radius(): (this: This, node: NodeDatum, ...args: any[]) => number
  radius(radius: (this: This, node: NodeDatum, ...args: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export type RadialLink<This, LinkDatum, NodeDatum> = LinkRadial<This, LinkDatum, NodeDatum>
export function linkRadial(): LinkRadial<any, DefaultLinkObject, [number, number]>
export function linkRadial<LinkDatum, NodeDatum>(): LinkRadial<any, LinkDatum, NodeDatum>
export function linkRadial<This, LinkDatum, NodeDatum>(): LinkRadial<This, LinkDatum, NodeDatum>
export interface SymbolType {
  draw(context: CanvasPath_D3Shape, size: number): void
}
export interface Symbol<This, Datum> {
  (this: This, d?: Datum, ...args: any[]): string | null
  (this: This, d?: Datum, ...args: any[]): void
  size(): (this: This, d: Datum, ...args: any[]) => number
  size(size: number): this
  size(size: (this: This, d: Datum, ...args: any[]) => number): this
  type(): (this: This, d: Datum, ...args: any[]) => SymbolType
  type(type: SymbolType): this
  type(type: (this: This, d: Datum, ...args: any[]) => SymbolType): this
  context(): CanvasRenderingContext2D | null
  context(context: CanvasRenderingContext2D | null): this
}
export function symbol<Datum = any>(
  type?: SymbolType | ((this: any, d: Datum, ...args: any[]) => SymbolType),
  size?: number | ((this: any, d: Datum, ...args: any[]) => number)
): Symbol<any, Datum>
export function symbol<This, Datum>(
  type?: SymbolType | ((this: This, d: Datum, ...args: any[]) => SymbolType),
  size?: number | ((this: This, d: Datum, ...args: any[]) => number)
): Symbol<This, Datum>
export const symbolsFill: SymbolType[]
export const symbolsStroke: SymbolType[]
export const symbols: SymbolType[]
export const symbolAsterisk: SymbolType
export const symbolCircle: SymbolType
export const symbolCross: SymbolType
export const symbolDiamond: SymbolType
export const symbolDiamond2: SymbolType
export const symbolPlus: SymbolType
export const symbolSquare: SymbolType
export const symbolSquare2: SymbolType
export const symbolStar: SymbolType
export const symbolTriangle: SymbolType
export const symbolTriangle2: SymbolType
export const symbolWye: SymbolType
export const symbolX: SymbolType
export function pointRadial(angle: number, radius: number): [number, number]
export interface SeriesPoint<Datum> extends Array<number> {
  0: number
  1: number
  data: Datum
}
export interface Series<Datum, Key> extends Array<SeriesPoint<Datum>> {
  key: Key
  i: number
}
export interface Stack<This, Datum, Key> {
  (data: Iterable<Datum>, ...args: any[]): Array<Series<Datum, Key>>
  keys(): (this: This, data: Datum[], ...args: any[]) => Key[]
  keys(keys: Iterable<Key> | ((this: This, data: Datum[], ...args: any[]) => Key[])): this
  value(): (d: Datum, key: Key, i: number, data: Datum[]) => number
  value(value: number): this
  value(value: (d: Datum, key: Key, i: number, data: Datum[]) => number): this
  order(): (series: Series<Datum, Key>) => Iterable<number>
  order(order: null | Iterable<number>): this
  order(order: (series: Series<Datum, Key>) => Iterable<number>): this
  offset(): (series: Series<Datum, Key>, order: number[]) => void
  offset(offset: null): this
  offset(offset: (series: Series<Datum, Key>, order: number[]) => void): this
}
export function stack(): Stack<any, { [key: string]: number }, string>
export function stack<Datum>(): Stack<any, Datum, string>
export function stack<Datum, Key>(): Stack<any, Datum, Key>
export function stack<This, Datum, Key>(): Stack<This, Datum, Key>
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
export function timeInterval(floor: (date: Date) => void, offset: (date: Date, step: number) => void): TimeInterval
export function timeInterval(
  floor: (date: Date) => void,
  offset: (date: Date, step: number) => void,
  count: (start: Date, end: Date) => number,
  field?: (date: Date) => number
): CountableTimeInterval
export const timeMillisecond: CountableTimeInterval
export function timeMilliseconds(start: Date, stop: Date, step?: number): Date[]
export const timeSecond: CountableTimeInterval
export function timeSeconds(start: Date, stop: Date, step?: number): Date[]
export const timeMinute: CountableTimeInterval
export function timeMinutes(start: Date, stop: Date, step?: number): Date[]
export const timeHour: CountableTimeInterval
export function timeHours(start: Date, stop: Date, step?: number): Date[]
export const timeDay: CountableTimeInterval
export function timeDays(start: Date, stop: Date, step?: number): Date[]
export const timeWeek: CountableTimeInterval
export function timeWeeks(start: Date, stop: Date, step?: number): Date[]
export const timeSunday: CountableTimeInterval
export function timeSundays(start: Date, stop: Date, step?: number): Date[]
export const timeMonday: CountableTimeInterval
export function timeMondays(start: Date, stop: Date, step?: number): Date[]
export const timeTuesday: CountableTimeInterval
export function timeTuesdays(start: Date, stop: Date, step?: number): Date[]
export const timeWednesday: CountableTimeInterval
export function timeWednesdays(start: Date, stop: Date, step?: number): Date[]
export const timeThursday: CountableTimeInterval
export function timeThursdays(start: Date, stop: Date, step?: number): Date[]
export const timeFriday: CountableTimeInterval
export function timeFridays(start: Date, stop: Date, step?: number): Date[]
export const timeSaturday: CountableTimeInterval
export function timeSaturdays(start: Date, stop: Date, step?: number): Date[]
export const timeMonth: CountableTimeInterval
export function timeMonths(start: Date, stop: Date, step?: number): Date[]
export const timeYear: CountableTimeInterval
export function timeYears(start: Date, stop: Date, step?: number): Date[]
export const utcMillisecond: CountableTimeInterval
export function utcMilliseconds(start: Date, stop: Date, step?: number): Date[]
export const utcSecond: CountableTimeInterval
export function utcSeconds(start: Date, stop: Date, step?: number): Date[]
export const utcMinute: CountableTimeInterval
export function utcMinutes(start: Date, stop: Date, step?: number): Date[]
export const utcHour: CountableTimeInterval
export function utcHours(start: Date, stop: Date, step?: number): Date[]
export const utcDay: CountableTimeInterval
export function utcDays(start: Date, stop: Date, step?: number): Date[]
export const utcWeek: CountableTimeInterval
export function utcWeeks(start: Date, stop: Date, step?: number): Date[]
export const utcSunday: CountableTimeInterval
export function utcSundays(start: Date, stop: Date, step?: number): Date[]
export const utcMonday: CountableTimeInterval
export function utcMondays(start: Date, stop: Date, step?: number): Date[]
export const utcTuesday: CountableTimeInterval
export function utcTuesdays(start: Date, stop: Date, step?: number): Date[]
export const utcWednesday: CountableTimeInterval
export function utcWednesdays(start: Date, stop: Date, step?: number): Date[]
export const utcThursday: CountableTimeInterval
export function utcThursdays(start: Date, stop: Date, step?: number): Date[]
export const utcFriday: CountableTimeInterval
export function utcFridays(start: Date, stop: Date, step?: number): Date[]
export const utcSaturday: CountableTimeInterval
export function utcSaturdays(start: Date, stop: Date, step?: number): Date[]
export const utcMonth: CountableTimeInterval
export function utcMonths(start: Date, stop: Date, step?: number): Date[]
export const utcYear: CountableTimeInterval
export function utcYears(start: Date, stop: Date, step?: number): Date[]
export function timeTicks(start: Date, stop: Date, count: number): Date[]
export function timeTickInterval(start: Date, stop: Date, count: number): TimeInterval | null
export function utcTicks(start: Date, stop: Date, count: number): Date[]
export function utcTickInterval(start: Date, stop: Date, count: number): TimeInterval | null
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
export function timeFormatLocale(definition: TimeLocaleDefinition): TimeLocaleObject
export function timeFormatDefaultLocale(definition: TimeLocaleDefinition): TimeLocaleObject
export function timeFormat(specifier: string): (date: Date) => string
export function timeParse(specifier: string): (dateString: string) => Date | null
export function utcFormat(specifier: string): (date: Date) => string
export function utcParse(specifier: string): (dateString: string) => Date | null
export function isoFormat(date: Date): string
export function isoParse(dateString: string): Date | null
export function now(): number
export interface Timer {
  restart(callbackFn: (elapsed: number) => void, delay?: number, time?: number): void
  stop(): void
}
export function timer(callback: (elapsed: number) => void, delay?: number, time?: number): Timer
export function timerFlush(): void
export function timeout(callback: (elapsed: number) => void, delay?: number, time?: number): Timer
export function interval(callback: (elapsed: number) => void, delay?: number, time?: number): Timer
declare module "d3-selection" {
  interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
    interrupt(name?: string): this
    transition(name?: string): Transition<GElement, Datum, PElement, PDatum>
    transition(transition: Transition<BaseType, any, any, any>): Transition<GElement, Datum, PElement, PDatum>
  }
}
export function active<GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(
  node: GElement,
  name?: string
): Transition<GElement, Datum, PElement, PDatum> | null
export function interrupt(node: BaseType, name?: string): void
export interface Transition<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
  select<DescElement extends BaseType>(selector: string): Transition<DescElement, Datum, PElement, PDatum>
  select<DescElement extends BaseType>(
    selector: ValueFn<GElement, Datum, DescElement>
  ): Transition<DescElement, Datum, PElement, PDatum>
  selectAll<DescElement extends BaseType, OldDatum>(
    selector: string
  ): Transition<DescElement, OldDatum, GElement, Datum>
  selectAll<DescElement extends BaseType, OldDatum>(
    selector: ValueFn<GElement, Datum, DescElement[] | ArrayLike<DescElement>>
  ): Transition<DescElement, OldDatum, GElement, Datum>
  selectChild<DescElement extends BaseType, OldDatum>(
    selector?: string | ValueFn<GElement, Datum, DescElement>
  ): Transition<DescElement, OldDatum, GElement, Datum>
  selectChildren<DescElement extends BaseType, OldDatum>(
    selector?: string | ValueFn<GElement, Datum, DescElement>
  ): Transition<DescElement, OldDatum, GElement, Datum>
  selection(): Selection<GElement, Datum, PElement, PDatum>
  transition(): Transition<GElement, Datum, PElement, PDatum>
  attr(name: string, value: null | string | number | boolean): this
  attr(name: string, value: ValueFn<GElement, Datum, string | number | boolean | null>): this
  attrTween(name: string): ValueFn<GElement, Datum, (this: GElement, t: number) => string> | undefined
  attrTween(name: string, factory: null): this
  attrTween(name: string, factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string>): this
  style(name: string, value: null): this
  style(name: string, value: string | number | boolean, priority?: null | "important"): this
  style(
    name: string,
    value: ValueFn<GElement, Datum, string | number | boolean | null>,
    priority?: null | "important"
  ): this
  styleTween(name: string): ValueFn<GElement, Datum, (this: GElement, t: number) => string> | undefined
  styleTween(name: string, factory: null): this
  styleTween(
    name: string,
    factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string>,
    priority?: null | "important"
  ): this
  text(value: null | string | number | boolean): this
  text(value: ValueFn<GElement, Datum, string | number | boolean>): this
  textTween(): ValueFn<GElement, Datum, (this: GElement, t: number) => string> | undefined
  textTween(factory: null): this
  textTween(factory: ValueFn<GElement, Datum, (this: GElement, t: number) => string>): this
  remove(): this
  tween(name: string): ValueFn<GElement, Datum, (this: GElement, t: number) => void> | undefined
  tween(name: string, tweenFn: null): this
  tween(name: string, tweenFn: ValueFn<GElement, Datum, (this: GElement, t: number) => void>): this
  merge(other: Transition<GElement, Datum, PElement, PDatum>): Transition<GElement, Datum, PElement, PDatum>
  filter(filter: string): Transition<GElement, Datum, PElement, PDatum>
  filter<FilteredElement extends BaseType>(filter: string): Transition<FilteredElement, Datum, PElement, PDatum>
  filter(filter: ValueFn<GElement, Datum, boolean>): Transition<GElement, Datum, PElement, PDatum>
  filter<FilteredElement extends BaseType>(
    filter: ValueFn<GElement, Datum, boolean>
  ): Transition<FilteredElement, Datum, PElement, PDatum>
  on(typenames: string): ValueFn<GElement, Datum, void> | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: ValueFn<GElement, Datum, void>): this
  end(): Promise<void>
  each(func: ValueFn<GElement, Datum, void>): this
  call(func: (transition: Transition<GElement, Datum, PElement, PDatum>, ...args: any[]) => any, ...args: any[]): this
  empty(): boolean
  node(): GElement | null
  nodes(): GElement[]
  size(): number
  delay(): number
  delay(milliseconds: number): this
  delay(milliseconds: ValueFn<GElement, Datum, number>): this
  duration(): number
  duration(milliseconds: number): this
  duration(milliseconds: ValueFn<GElement, Datum, number>): this
  ease(): (normalizedTime: number) => number
  ease(easingFn: (normalizedTime: number) => number): this
  easeVarying(factory: ValueFn<GElement, Datum, (normalizedTime: number) => number>): this
}
export type SelectionOrTransition<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> =
  | Selection<GElement, Datum, PElement, PDatum>
  | Transition<GElement, Datum, PElement, PDatum>
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
export interface ZoomBehavior<ZoomRefElement extends ZoomedElementBaseType, Datum> extends Function {
  (selection: Selection<ZoomRefElement, Datum, any, any>, ...args: any[]): void
  transform(
    selection: Selection<ZoomRefElement, Datum, any, any> | TransitionLike<ZoomRefElement, Datum>,
    transform: ZoomTransform | ((this: ZoomRefElement, event: any, d: Datum) => ZoomTransform),
    point?: [number, number] | ((this: ZoomRefElement, event: any, d: Datum) => [number, number])
  ): void
  translateBy(
    selection: Selection<ZoomRefElement, Datum, any, any> | TransitionLike<ZoomRefElement, Datum>,
    x: number | ValueFn<ZoomRefElement, Datum, number>,
    y: number | ValueFn<ZoomRefElement, Datum, number>
  ): void
  translateTo(
    selection: Selection<ZoomRefElement, Datum, any, any> | TransitionLike<ZoomRefElement, Datum>,
    x: number | ValueFn<ZoomRefElement, Datum, number>,
    y: number | ValueFn<ZoomRefElement, Datum, number>,
    p?: [number, number] | ValueFn<ZoomRefElement, Datum, [number, number]>
  ): void
  scaleBy(
    selection: Selection<ZoomRefElement, Datum, any, any> | TransitionLike<ZoomRefElement, Datum>,
    k: number | ValueFn<ZoomRefElement, Datum, number>,
    p?: [number, number] | ValueFn<ZoomRefElement, Datum, [number, number]>
  ): void
  scaleTo(
    selection: Selection<ZoomRefElement, Datum, any, any> | TransitionLike<ZoomRefElement, Datum>,
    k: number | ValueFn<ZoomRefElement, Datum, number>,
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
  filter(): (this: ZoomRefElement, event: any, datum: Datum) => boolean
  filter(filter: (this: ZoomRefElement, event: any, datum: Datum) => boolean): this
  touchable(): ValueFn<ZoomRefElement, Datum, boolean>
  touchable(touchable: boolean): this
  touchable(touchable: ValueFn<ZoomRefElement, Datum, boolean>): this
  wheelDelta(): ValueFn<ZoomRefElement, Datum, number>
  wheelDelta(delta: ((event: WheelEvent) => number) | number): this
  extent(): (this: ZoomRefElement, datum: Datum) => [[number, number], [number, number]]
  extent(extent: [[number, number], [number, number]]): this
  extent(extent: (this: ZoomRefElement, datum: Datum) => [[number, number], [number, number]]): this
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
  on(typenames: string): ((this: ZoomRefElement, event: any, d: Datum) => void) | undefined
  on(typenames: string, listener: null): this
  on(typenames: string, listener: (this: ZoomRefElement, event: any, d: Datum) => void): this
}
export function zoom<ZoomRefElement extends ZoomedElementBaseType, Datum>(): ZoomBehavior<ZoomRefElement, Datum>
export interface D3ZoomEvent<ZoomRefElement extends ZoomedElementBaseType, Datum> {
  target: ZoomBehavior<ZoomRefElement, Datum>
  type: "start" | "zoom" | "end" | string
  transform: ZoomTransform
  sourceEvent: any
}
export class ZoomTransform {
  constructor(k: number, x: number, y: number)
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
export function zoomTransform(node: ZoomedElementBaseType): ZoomTransform
export const zoomIdentity: ZoomTransform
