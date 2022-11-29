import type { MultiPolygon } from "geojson"

export type Base = Element | EnterElem | Document | Window | null
export type Container = HTMLElement | SVGSVGElement | SVGGElement
export type Primitive = number | string | boolean | Date
export type Pair<T = number> = [T, T]
export type Point = Pair<number>
export type Span = Pair<number>

export type Value<S extends Base, T, R> = (this: S, x: T, i: number, xs: S[] | ArrayLike<S>) => R
export type CB<T extends object> = (this: T, ...xs: any[]) => void

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
export type Threshold<T extends number | undefined = number | undefined> = (
  xs: ArrayLike<T>,
  min: number,
  max: number
) => number
export type ThresholdDates<T extends Date | undefined> = (xs: ArrayLike<T>, min: Date, max: Date) => T[]
export type ThresholdNums<T extends number | undefined> = (xs: ArrayLike<T>, min: number, max: number) => T[]
export interface Histo<T, U extends number | Date | undefined> {
  (xs: ArrayLike<T>): Array<Bin<T, U>>
  value(): (x: T, i: number, xs: ArrayLike<T>) => U
  value(f: (x: T, i: number, xs: ArrayLike<T>) => U): this
}
export namespace Histo {
  export interface Dates<T, U extends Date | undefined> extends Histo<T, Date> {
    domain(): (xs: ArrayLike<U>) => [Date, Date]
    domain(x: [Date, Date] | ((xs: ArrayLike<U>) => [Date, Date])): this
    thresholds(): ThresholdDates<U>
    thresholds(xs: ArrayLike<U> | ThresholdDates<U>): this
  }
  export interface Nums<T, U extends number | undefined> extends Histo<T, U> {
    domain(): (xs: Iterable<U>) => Pair | Pair<undefined>
    domain(x: Pair | ((xs: Iterable<U>) => Pair | Pair<undefined>)): this
    thresholds(): Threshold<U> | ThresholdNums<U>
    thresholds(n: number | Threshold<U>): this
    thresholds(xs: ArrayLike<U> | ThresholdNums<U>): this
  }
}
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
  scale(x: Axis.Scale<T>): this
  scale<A extends Axis.Scale<T>>(): A
  tickArgs(): any[]
  tickArgs(xs: any[]): this
  tickFormat(): ((x: T, i: number) => string) | null
  tickFormat(f: (x: T, i: number) => string): this
  tickFormat(x: null): this
  tickPadding(): number
  tickPadding(x: number): this
  ticks(n: number, spec?: string): this
  ticks(x: any, ...xs: any[]): this
  ticks(x: Axis.Interval, spec?: string): this
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
export namespace Axis {
  export type Container = SVGSVGElement | SVGGElement
  export type Domain = number | string | Date | { valueOf(): number }
  export interface Interval {
    range(start: Date, stop: Date, step?: number): Date[]
  }
  export interface Scale<T> {
    (x: T): number | undefined
    bandwidth?(): number
    copy(): this
    domain(): T[]
    range(): number[]
  }
}
export interface Brush<T> {
  (x: Selection<SVGGElement, T, any, any>, ...xs: any[]): void
  clear(x: Selection<SVGGElement, T, any, any>, e?: Event): void
  extent(): Value<SVGGElement, T, [Point, Point]>
  extent(f: Value<SVGGElement, T, [Point, Point]>): this
  extent(x: [Point, Point]): this
  filter(): (this: SVGGElement, e: any, x: T) => boolean
  filter(f: (this: SVGGElement, e: any, x: T) => boolean): this
  handleSize(): number
  handleSize(x: number): this
  keyModifiers(): boolean
  keyModifiers(x: boolean): this
  move(
    group: Selection<SVGGElement, T, any, any> | TransitionLike<SVGGElement, T>,
    selection: null | Brush.Selection | Value<SVGGElement, T, Brush.Selection>,
    e?: Event
  ): void
  on(n: string, f: (this: SVGGElement, e: any, x: T) => void): this
  on(n: string, x: null): this
  on(n: string): ((this: SVGGElement, e: any, x: T) => void) | undefined
  touchable(): Value<SVGGElement, T, boolean>
  touchable(f: Value<SVGGElement, T, boolean>): this
  touchable(x: boolean): this
}
export namespace Brush {
  export type Selection = [Point, Point] | Point
}
export interface Chord {
  src: Chord.Subgroup
  tgt: Chord.Subgroup
}
export namespace Chord {
  export interface Group {
    endAngle: number
    i: number
    startAngle: number
    value: number
  }
  export interface Subgroup {
    endAngle: number
    i: number
    startAngle: number
    value: number
  }
  export interface Layout {
    (xs: number[][]): Chords
    padAngle(): number
    padAngle(x: number): this
    sortGroups(): ((a: number, b: number) => number) | null
    sortGroups(f: null | ((a: number, b: number) => number)): this
    sortSubgroups(): ((a: number, b: number) => number) | null
    sortSubgroups(f: null | ((a: number, b: number) => number)): this
    sortChords(): ((a: number, b: number) => number) | null
    sortChords(f: null | ((a: number, b: number) => number)): this
  }
}
export interface Chords extends Array<Chord> {
  groups: Chord.Group[]
}
export interface Ribbon {
  src: Ribbon.Subgroup
  tgt: Ribbon.Subgroup
}
export namespace Ribbon {
  export interface Subgroup {
    endAngle: number
    radius: number
    startAngle: number
  }
  export interface Gen<This, T, S> {
    (this: This, x: T, ...xs: any[]): void
    (this: This, x: T, ...xs: any[]): string | null
    source(): (this: This, x: T, ...xs: any[]) => S
    source(f: (this: This, x: T, ...xs: any[]) => S): this
    target(): (this: This, x: T, ...xs: any[]) => S
    target(f: (this: This, x: T, ...xs: any[]) => S): this
    radius(): (this: This, d: S, ...xs: any[]) => number
    radius(x: number): this
    radius(f: (this: This, d: S, ...xs: any[]) => number): this
    sourceRadius(): (this: This, d: S, ...xs: any[]) => number
    sourceRadius(x: number): this
    sourceRadius(f: (this: This, d: S, ...xs: any[]) => number): this
    targetRadius(): (this: This, d: S, ...xs: any[]) => number
    targetRadius(x: number): this
    targetRadius(f: (this: This, d: S, ...xs: any[]) => number): this
    startAngle(): (this: This, d: S, ...xs: any[]) => number
    startAngle(x: number): this
    startAngle(f: (this: This, d: S, ...xs: any[]) => number): this
    endAngle(): (this: This, d: S, ...xs: any[]) => number
    endAngle(x: number): this
    endAngle(f: (this: This, d: S, ...xs: any[]) => number): this
    padAngle(): (this: This, d: S, ...xs: any[]) => number
    padAngle(x: number): this
    padAngle(f: (this: This, d: S, ...xs: any[]) => number): this
    context(): CanvasRenderingContext2D | null
    context(x: CanvasRenderingContext2D | null): this
  }
  export interface ArrowGen<This, T, S> extends Ribbon.Gen<This, T, S> {
    headRadius(): (this: This, d: S, ...xs: any[]) => number
    headRadius(x: number): this
    headRadius(f: (this: This, d: S, ...xs: any[]) => number): this
  }
}
export interface Color {
  alpha: number
  brighter(k?: number): Color
  darker(k?: number): Color
  displayable(): boolean
  formatHex(): string
  formatHex8(): string
  formatHsl(): string
  formatRgb(): string
  rgb(): Color.RGB
  toString(): string
}
export namespace Color {
  export interface RGB extends Color {
    r: number
    g: number
    b: number
    clamp(): Color
    copy(x?: {
      r?: number | undefined
      g?: number | undefined
      b?: number | undefined
      alpha?: number | undefined
    }): this
  }
  export interface HSL extends Color {
    h: number
    s: number
    l: number
    clamp(): Color
    copy(x?: {
      h?: number | undefined
      s?: number | undefined
      l?: number | undefined
      alpha?: number | undefined
    }): this
  }
  export interface LAB extends Color {
    l: number
    a: number
    b: number
    copy(x?: {
      l?: number | undefined
      a?: number | undefined
      b?: number | undefined
      alpha?: number | undefined
    }): this
  }
  export interface HCL extends Color {
    h: number
    c: number
    l: number
    copy(x?: {
      h?: number | undefined
      c?: number | undefined
      l?: number | undefined
      alpha?: number | undefined
    }): this
  }
  export interface Cubehelix extends Color {
    h: number
    s: number
    l: number
    copy(x?: {
      h?: number | undefined
      s?: number | undefined
      l?: number | undefined
      alpha?: number | undefined
    }): this
  }
}
export interface Contour extends MultiPolygon {
  value: number
}
export interface Contours {
  (xs: number[]): Contour[]
  contour(xs: number[], threshold: number): Contour
  size(): Span
  size(x: Span): this
  smooth(): boolean
  smooth(x: boolean): this
  thresholds(): Threshold<number> | ThresholdNums<number>
  thresholds(x: number | number[] | Threshold<number> | ThresholdNums<number>): this
}
export interface Density<T = Point> {
  (xs: T[]): Contour[]
  bandwidth(): number
  bandwidth(x: number): this
  cellSize(): number
  cellSize(x: number): this
  size(): Span
  size(x: Span): this
  thresholds(): Threshold<number> | ThresholdNums<number>
  thresholds(x: number | number[] | Threshold<number> | ThresholdNums<number>): this
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
  neighbors(x: number): IterableIterator<number>
  render(): string
  render(x: Delaunay.MoveContext & Delaunay.LineContext): void
  renderHull(): string
  renderHull(x: Delaunay.MoveContext & Delaunay.LineContext): void
  renderTriangle(x: number): string
  renderTriangle(x: number, context: Delaunay.MoveContext & Delaunay.LineContext & Delaunay.ClosableContext): void
  renderPoints(): string
  renderPoints(x: undefined, radius: number): string
  renderPoints(x: Delaunay.MoveContext & Delaunay.ArcContext, radius?: number): void
  hullPolygon(): Delaunay.Polygon
  trianglePolygon(x: number): Delaunay.Triangle
  trianglePolygons(): IterableIterator<Delaunay.Triangle>
  update(): this
  voronoi(x?: Delaunay.Bounds): Voronoi<T>
}
export namespace Delaunay {
  export type Triangle = Point[]
  export type Polygon = Point[]
  export type Bounds = [number, number, number, number]
  export type GetCoordinate<P, PS> = (x: P, i: number, xs: PS) => number
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
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, ccw?: boolean): void
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
  render(x: Delaunay.MoveContext & Delaunay.LineContext): void
  renderBounds(): string
  renderBounds(x: Delaunay.RectContext): void
  renderCell(x: number): string
  renderCell(x: number, c: Delaunay.MoveContext & Delaunay.LineContext & Delaunay.ClosableContext): void
  cellPolygons(): IterableIterator<Delaunay.Polygon & { i: number }>
  cellPolygon(x: number): Delaunay.Polygon
  update(): this
}
export interface Dispatch<T extends object> {
  apply(n: string, x?: T, ...xs: any[]): void
  call(n: string, x?: T, ...xs: any[]): void
  copy(): Dispatch<T>
  on(n: string, f?: CB<T>): this
  on(n: string): CB<T> | undefined
}
export type Dragged = Element
export interface Drag<D extends Dragged, T, Subject> extends Function {
  (x: Selection<D, T, any, any>, ...xs: any[]): void
  clickDistance(): number
  clickDistance(x: number): this
  container(): Value<D, T, Drag.Container>
  container(f: Value<D, T, Drag.Container>): this
  container(x: Drag.Container): this
  filter(): (this: D, e: any, x: T) => boolean
  filter(f: (this: D, e: any, x: T) => boolean): this
  on(n: string, f: (this: D, e: any, x: T) => void): this
  on(n: string, x: null): this
  on(n: string): ((this: D, e: any, x: T) => void) | undefined
  subject(): (this: D, e: any, x: T) => Subject
  subject(f: (this: D, e: any, x: T) => Subject): this
  touchable(): Value<D, T, boolean>
  touchable(f: Value<D, T, boolean>): this
  touchable(x: boolean): this
}
export namespace Drag {
  export type Container = HTMLElement | SVGSVGElement | SVGGElement
  export interface Position {
    x: number
    y: number
  }
}
export interface DSV {
  format<T extends object>(rs: readonly T[], cs?: ReadonlyArray<keyof T>): string
  formatBody<T extends object>(rs: readonly T[], cs?: ReadonlyArray<keyof T>): string
  formatRow(x: readonly string[]): string
  formatRows(xs: readonly string[][]): string
  formatValue(x: string): string
  parse<C extends string>(x: string): DSV.RowArray<C>
  parse<R extends object, C extends string>(
    x: string,
    f: (x: DSV.Row<C>, i: number, xs: C[]) => R | undefined | null
  ): DSV.Parsed<R>
  parseRows(x: string): string[][]
  parseRows<R extends object>(x: string, f: (x: string[], i: number) => R | undefined | null): R[]
}
export namespace DSV {
  export type Row<C extends string = string> = {
    [k in C]: string | undefined
  }
  export type Raw<T extends object> = {
    [k in keyof T]: string | undefined
  }
  export interface RowAny {
    [k: string]: any
  }
  export interface RowArray<C extends string = string> extends Array<DSV.Row<C>> {
    columns: C[]
  }
  export interface Parsed<C> extends Array<C> {
    columns: Array<keyof C>
  }
}

export interface PolyEasing {
  (time: number): number
  exponent(x: number): PolyEasing
}
export interface BackEasing {
  (time: number): number
  overshoot(x: number): BackEasing
}
export interface ElasticEasing {
  (time: number): number
  amplitude(x: number): ElasticEasing
  period(x: number): ElasticEasing
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

export namespace Format {
  export interface Definition {
    decimal: string
    thousands: string
    grouping: number[]
    currency: [string, string]
    numerals?: string[] | undefined
    percent?: string | undefined
    minus?: string | undefined
    nan?: string | undefined
  }
  export interface Locale {
    format(spec: string): (x: number | { valueOf(): number }) => string
    formatPrefix(spec: string, value: number): (x: number | { valueOf(): number }) => string
  }
  export interface Specifier {
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
  export interface Spec {
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
}

export namespace Geo {
  export interface Circle<This = any, T = any> {
    (this: This, d?: T, ...xs: any[]): GeoJSON.Polygon
    center(): (this: This, x: T, ...xs: any[]) => Point
    center(center: Point | ((this: This, x: T, ...xs: any[]) => Point)): this
    precision(): (this: This, x: T, ...xs: any[]) => number
    precision(precision: number | ((this: This, x: T, ...xs: any[]) => number)): this
    radius(): (this: This, x: T, ...xs: any[]) => number
    radius(radius: number | ((this: This, x: T, ...xs: any[]) => number)): this
  }
  export interface Graticule {
    (): GeoJSON.MultiLineString
    extent(): [Point, Point]
    extent(extent: [Point, Point]): this
    extentMajor(): [Point, Point]
    extentMajor(extent: [Point, Point]): this
    extentMinor(): [Point, Point]
    extentMinor(extent: [Point, Point]): this
    lines(): GeoJSON.LineString[]
    outline(): GeoJSON.Polygon
    precision(): number
    precision(angle: number): this
    step(): Point
    step(step: Point): this
    stepMajor(): Point
    stepMajor(step: Point): this
    stepMinor(): Point
    stepMinor(step: Point): this
  }
  export interface Stream {
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
  export interface StreamWrapper {
    stream(x: Stream): Stream
  }
  export interface Projection extends StreamWrapper {
    (point: Point): Point | null
    angle(): number
    angle(angle: number): this
    center(): Point
    center(point: Point): this
    clipAngle(): number | null
    clipAngle(angle: null | number): this
    clipExtent(): [Point, Point] | null
    clipExtent(extent: null | [Point, Point]): this
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
    invert?(point: Point): Point | null
    postclip(): (stream: Geo.Stream) => Geo.Stream
    postclip(postclip: (stream: Geo.Stream) => Geo.Stream): this
    precision(): number
    precision(precision: number): this
    preclip(): (stream: Geo.Stream) => Geo.Stream
    preclip(preclip: (stream: Geo.Stream) => Geo.Stream): this
    reflectX(): boolean
    reflectX(reflect: boolean): this
    reflectY(): boolean
    reflectY(reflect: boolean): this
    rotate(): [number, number, number]
    rotate(angles: Point | [number, number, number]): this
    scale(): number
    scale(scale: number): this
    translate(): Point
    translate(point: Point): this
  }
  export interface Conic extends Projection {
    parallels(): Point
    parallels(x: Point): this
  }
  export interface Context {
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void
    beginPath(): void
    closePath(): void
    lineTo(x: number, y: number): void
    moveTo(x: number, y: number): void
  }
  export interface Path<This = any, T extends GeoPermissibleObjects = GeoPermissibleObjects> {
    (this: This, object: T, ...xs: any[]): string | null
    (this: This, object: T, ...xs: any[]): void
    area(object: T): number
    bounds(object: T): [Point, Point]
    centroid(object: T): Point
    context(context: null | Context): this
    context<C extends Context | null>(): C
    measure(object: T): number
    pointRadius(): ((this: This, object: T, ...xs: any[]) => number) | number
    pointRadius(value: number | ((this: This, object: T, ...xs: any[]) => number)): this
    projection(projection: null | Geo.Projection | Geo.StreamWrapper): this
    projection<P extends Geo.Conic | Geo.Projection | Geo.StreamWrapper | null>(): P
  }
  export interface Sphere {
    type: "Sphere"
  }
  export interface Rotation {
    (x: Point): Point
    invert(x: Point): Point
  }
}
export type GeoGeometryObjects = GeoJSON.GeometryObject | Geo.Sphere
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
export function geoPath(projection?: Geo.Projection | Geo.StreamWrapper | null, context?: Geo.Context | null): Geo.Path
export function geoPath<T extends GeoPermissibleObjects>(
  projection?: Geo.Projection | Geo.StreamWrapper | null,
  context?: Geo.Context | null
): Geo.Path<any, T>
export function geoPath<This, T extends GeoPermissibleObjects>(
  projection?: Geo.Projection | Geo.StreamWrapper | null,
  context?: Geo.Context | null
): Geo.Path<This, T>
export interface GeoTransformPrototype {
  lineEnd?(this: this & { stream: Geo.Stream }): void
  lineStart?(this: this & { stream: Geo.Stream }): void
  point?(this: this & { stream: Geo.Stream }, x: number, y: number, z?: number): void
  polygonEnd?(this: this & { stream: Geo.Stream }): void
  polygonStart?(this: this & { stream: Geo.Stream }): void
  sphere?(this: this & { stream: Geo.Stream }): void
}
export function geoTransform<T extends GeoTransformPrototype>(methods: T): { stream(s: Geo.Stream): T & Geo.Stream }
export interface GeoIdentityTransform extends Geo.StreamWrapper {
  (point: Point): Point | null
  invert(point: Point): Point | null
  postclip(): (stream: Geo.Stream) => Geo.Stream
  postclip(postclip: (stream: Geo.Stream) => Geo.Stream): this
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
export const geoClipAntimeridian: (stream: Geo.Stream) => Geo.Stream
export function geoClipCircle(angle: number): (stream: Geo.Stream) => Geo.Stream
export function geoClipRectangle(x0: number, y0: number, x1: number, y1: number): (stream: Geo.Stream) => Geo.Stream

export namespace Hierarchy {
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
export type NumArray = TypedArray | DataView

export type ArrayIpolator<T extends any[]> = (x: number) => T

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

export namespace Quad {
  export interface Leaf<T> {
    data: T
    next?: Leaf<T> | undefined
    length?: undefined
  }
  export interface Node<T> extends Array<Node<T> | Leaf<T> | undefined> {
    length: 4
  }
  export interface Tree<T> {
    add(t: T): this
    addAll(ts: T[]): this
    copy(): Tree<T>
    cover(x: number, y: number): this
    data(): T[]
    extent(): Pair<Point> | undefined
    extent(x: Pair<Point>): this
    find(x: number, y: number, r?: number): T | undefined
    remove(t: T): this
    removeAll(ts: T[]): this
    root(): Node<T> | Leaf<T> | undefined
    size(): number
    visit(f: (n: Node<T> | Leaf<T>, x0: number, y0: number, x1: number, y1: number) => void | boolean): this
    visitAfter(f: (n: Node<T> | Leaf<T>, x0: number, y0: number, x1: number, y1: number) => void): this
    x(): (t: T) => number
    x(x: (t: T) => number): this
    y(): (t: T) => number
    y(y: (t: T) => number): this
  }
}

export namespace Random {
  export interface Src {
    source(f: () => number): this
  }
  export interface IrwinHall extends Src {
    (n: number): () => number
  }
  export interface Bates extends Src {
    (n: number): () => number
  }
  export interface Bernoulli extends Src {
    (p: number): () => number
  }
  export interface Normal extends Src {
    (mu?: number, sigma?: number): () => number
  }
  export interface Gamma extends Src {
    (k: number, theta?: number): () => number
  }
  export interface Beta extends Src {
    (alpha: number, beta: number): () => number
  }
  export interface Geometric extends Src {
    (p: number): () => number
  }
  export interface Binomial extends Src {
    (n: number, p: number): () => number
  }
  export interface Cauchy extends Src {
    (a?: number, b?: number): () => number
  }
  export interface Exponential extends Src {
    (lambda: number): () => number
  }
  export interface Int extends Src {
    (max: number): () => number
    (min: number, max: number): () => number
  }
  export interface LogNormal extends Src {
    (mu?: number, sigma?: number): () => number
  }
  export interface Logistic extends Src {
    (a?: number, b?: number): () => number
  }
  export interface Pareto extends Src {
    (alpha: number): () => number
  }
  export interface Poisson extends Src {
    (lambda: number): () => number
  }
  export interface Uniform extends Src {
    (max?: number): () => number
    (min: number, max: number): () => number
  }
  export interface Weibull extends Src {
    (k: number, a?: number, b?: number): () => number
  }
}

export interface Interpolator<T, U> {
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
    interpolate(): Interpolator<any, any>
    interpolate(f: Interpolator<Range, Out>): this
    interpolate<O2>(f: Interpolator<Range, O2>): Time<Range, O2, U>
    invert(x: NumVal): Date
    nice(n?: number): this
    nice(x: Time.Countable): this
    range(): Range[]
    range(x: Iterable<Range>): this
    rangeRound(x: Iterable<NumVal>): this
    tickFormat(n?: number, spec?: string): (x: Date) => string
    tickFormat(x: Time.Interval, spec?: string): (x: Date) => string
    ticks(n?: number): Date[]
    ticks(x: Time.Interval): Date[]
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
    interpolate(): Interpolator<any, any>
    interpolate(f: Interpolator<Range, Out>): this
    interpolate<O2>(f: Interpolator<Range, O2>): Linear<Range, O2, U>
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Linear<Range, Out, U2>
  }
  export interface Pow<Range, Out, U = never> extends Smooth<Range, Out, U> {
    exponent(): number
    exponent(x: number): this
    interpolate(): Interpolator<any, any>
    interpolate(f: Interpolator<Range, Out>): this
    interpolate<O2>(f: Interpolator<Range, O2>): Pow<Range, O2, U>
    unknown(): UnknownReturn<U, undefined>
    unknown<U2>(x: U2): Pow<Range, Out, U2>
  }
  export interface Log<Range, Out, U = never> extends Smooth<Range, Out, U> {
    base(): number
    base(x: number): this
    domain(): number[]
    domain(x: Iterable<NumVal>): this
    interpolate(): Interpolator<any, any>
    interpolate(f: Interpolator<Range, Out>): this
    interpolate<O2>(f: Interpolator<Range, O2>): Log<Range, O2, U>
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

export interface ArrayLike<T> {
  length: number
  item(i: number): T | null
  [i: number]: T
}
export interface EnterElem extends Element {
  ownerDocument: Document
  namespaceURI: string
  appendChild<T extends Node>(x: T): T
  insertBefore<T extends Node>(x: T, next: Node | null): T
  querySelector(x: string): Element
  querySelectorAll(x: string): NodeListOf<Element>
}
export interface ClientPointEvent {
  clientX: number
  clientY: number
}
export interface CustomEventParameters {
  bubbles: boolean
  cancelable: boolean
  detail: any
}

export interface TransitionLike<S extends Base, T> {
  selection(): Selection<S, T, any, any>
  on(n: string, x: null): TransitionLike<S, T>
  on(n: string, f: Value<S, T, void>): TransitionLike<S, T>
  tween(n: string, x: null): TransitionLike<S, T>
  tween(n: string, f: Value<S, T, (x: number) => void>): TransitionLike<S, T>
}

export type TM = ElementTagNameMap
export type Values = null | string | number | boolean | ReadonlyArray<string | number>

export interface Local<T> {
  get(x: Element): T | undefined
  remove(x: Element): boolean
  set(x: Element, v: T): T
  toString(): string
}

// S type of selected elements
// T type of selected datum
// P type of parent elements
// U type of parent datum
// D type of descendent element
// O type of old selected elements
// C type of child elements

export interface Selection<S extends Base, T, P extends Base, U> {
  [Symbol.iterator](): Iterator<S>
  append<C extends Base>(f: Value<S, T, C>): Selection<C, T, P, U>
  append<C extends Base>(x: string): Selection<C, T, P, U>
  append<K extends keyof TM>(x: K): Selection<TM[K], T, P, U>
  attr(n: string, v: Values | Value<S, T, Values>): this
  attr(n: string): string
  call(f: (x: Selection<S, T, P, U>, ...xs: any[]) => void, ...xs: any[]): this
  classed(n: string, f: Value<S, T, boolean>): this
  classed(n: string, v: boolean): this
  classed(n: string): boolean
  clone(deep?: boolean): Selection<S, T, P, U>
  data(): T[]
  data<T2>(
    x: T2[] | Iterable<T2> | Value<P, U, T2[] | Iterable<T2>>,
    f?: Value<S | P, T | T2, string | number>
  ): Selection<S, T2, P, U>
  datum(): T
  datum(x: null): Selection<S, undefined, P, U>
  datum<T2>(f: Value<S, T, T2>): Selection<S, T2, P, U>
  datum<T2>(x: T2): Selection<S, T2, P, U>
  dispatch(t: string, f?: Value<S, T, CustomEventParameters>): this
  dispatch(t: string, ps?: CustomEventParameters): this
  each(f: Value<S, T, void>): this
  empty(): boolean
  enter(): Selection<EnterElem, T, P, U>
  exit<O>(): Selection<S, O, P, U>
  filter(f: Value<S, T, boolean>): Selection<S, T, P, U>
  filter(x: string): Selection<S, T, P, U>
  filter<D extends Base>(f: Value<S, T, boolean>): Selection<D, T, P, U>
  filter<D extends Base>(x: string): Selection<D, T, P, U>
  html(): string
  html(x: null | string | Value<S, T, string | null>): this
  insert<C extends Base>(n: string | Value<S, T, C>, before?: string | Value<S, T, Base>): Selection<C, T, P, U>
  insert<K extends keyof TM>(k: K, before?: string | Value<S, T, Base>): Selection<TM[K], T, P, U>
  interrupt(n?: string): this
  join<K extends keyof TM, O = T>(
    enter: K,
    update?: (x: Selection<S, T, P, U>) => Selection<S, T, P, U> | TransitionLike<S, T> | undefined,
    exit?: (x: Selection<S, O, P, U>) => void
  ): Selection<S | TM[K], T, P, U>
  join<C extends Base, O = T>(
    enter: string | ((x: Selection<EnterElem, T, P, U>) => Selection<C, T, P, U> | TransitionLike<S, T>),
    update?: (x: Selection<S, T, P, U>) => Selection<S, T, P, U> | TransitionLike<S, T> | undefined,
    exit?: (x: Selection<S, O, P, U>) => void
  ): Selection<C | S, T, P, U>
  lower(): this
  merge(x: Selection<S, T, P, U> | TransitionLike<S, T>): Selection<S, T, P, U>
  node(): S | null
  nodes(): S[]
  on(t: string, f: (this: S, event: any, x: T) => void, xs?: any): this
  on(t: string, x: null): this
  on(t: string): ((this: S, event: any, x: T) => void) | undefined
  order(): this
  property(n: string, f: Value<S, T, any> | null): this
  property(n: string, x: any): this
  property(n: string): any
  property<T2>(n: Local<T2>, f: Value<S, T2, T2>): this
  property<T2>(n: Local<T2>, x: T2): this
  property<T2>(n: Local<T2>): T2 | undefined
  raise(): this
  remove(): this
  select<D extends Base>(f: Value<S, T, D>): Selection<D, T, P, U>
  select<D extends Base>(x: null): Selection<null, undefined, P, U>
  select<D extends Base>(x: string): Selection<D, T, P, U>
  selectAll(x?: null): Selection<null, undefined, S, T>
  selectAll<D extends Base, O>(f: Value<S, T, D[] | ArrayLike<D> | Iterable<D>>): Selection<D, O, S, T>
  selectAll<D extends Base, O>(x: string): Selection<D, O, S, T>
  selectChild<D extends Base, C extends Base>(f: (x: C, i: number, xs: C[]) => boolean): Selection<D, T, P, U>
  selectChild<D extends Base>(x?: string): Selection<D, T, P, U>
  selectChildren<D extends Base, O>(x?: string): Selection<D, O, S, T>
  selectChildren<D extends Base, R, C extends Base>(f: (x: C, i: number, xs: C[]) => boolean): Selection<D, R, S, T>
  selection(): this
  size(): number
  sort(f?: (a: T, b: T) => number): this
  style(n: string, f: Value<S, T, string | number | boolean | null>, priority?: null | "important"): this
  style(n: string, x: null): this
  style(n: string, x: string | number | boolean, priority?: null | "important"): this
  style(n: string): string
  text(): string
  text(x: null | string | number | boolean | Value<S, T, string | number | boolean | null>): this
  transition(n?: string): Transition<S, T, P, U>
  transition(x: Transition<Base, any, any, any>): Transition<S, T, P, U>
}

export interface Transition<S extends Base, T, P extends Base, U> {
  attr(n: string, f: Value<S, T, string | number | boolean | null>): this
  attr(n: string, x: null | string | number | boolean): this
  attrTween(n: string, f: Value<S, T, (this: S, x: number) => string>): this
  attrTween(n: string, x: null): this
  attrTween(n: string): Value<S, T, (this: S, x: number) => string> | undefined
  call(f: (x: Transition<S, T, P, U>, ...xs: any[]) => any, ...xs: any[]): this
  delay(): number
  delay(f: Value<S, T, number>): this
  delay(x: number): this
  duration(): number
  duration(f: Value<S, T, number>): this
  duration(x: number): this
  each(f: Value<S, T, void>): this
  ease(): (x: number) => number
  ease(f: (x: number) => number): this
  easeVarying(f: Value<S, T, (x: number) => number>): this
  empty(): boolean
  end(): Promise<void>
  filter(f: Value<S, T, boolean>): Transition<S, T, P, U>
  filter(x: string): Transition<S, T, P, U>
  filter<D extends Base>(f: Value<S, T, boolean>): Transition<D, T, P, U>
  filter<D extends Base>(x: string): Transition<D, T, P, U>
  merge(x: Transition<S, T, P, U>): Transition<S, T, P, U>
  node(): S | null
  nodes(): S[]
  on(t: string, f: Value<S, T, void>): this
  on(t: string, x: null): this
  on(t: string): Value<S, T, void> | undefined
  remove(): this
  select<D extends Base>(f: Value<S, T, D>): Transition<D, T, P, U>
  select<D extends Base>(x: string): Transition<D, T, P, U>
  selectAll<D extends Base, O>(f: Value<S, T, D[] | ArrayLike<D>>): Transition<D, O, S, T>
  selectAll<D extends Base, O>(x: string): Transition<D, O, S, T>
  selectChild<D extends Base, O>(x?: string | Value<S, T, D>): Transition<D, O, S, T>
  selectChildren<D extends Base, O>(x?: string | Value<S, T, D>): Transition<D, O, S, T>
  selection(): Selection<S, T, P, U>
  size(): number
  style(n: string, f: Value<S, T, string | number | boolean | null>, priority?: null | "important"): this
  style(n: string, x: null): this
  style(n: string, x: string | number | boolean, priority?: null | "important"): this
  styleTween(n: string, f: Value<S, T, (this: S, x: number) => string>, priority?: null | "important"): this
  styleTween(n: string, x: null): this
  styleTween(n: string): Value<S, T, (this: S, x: number) => string> | undefined
  text(f: Value<S, T, string | number | boolean>): this
  text(x: null | string | number | boolean): this
  textTween(): Value<S, T, (this: S, x: number) => string> | undefined
  textTween(f: Value<S, T, (this: S, x: number) => string>): this
  textTween(x: null): this
  transition(): Transition<S, T, P, U>
  tween(n: string, f: Value<S, T, (this: S, x: number) => void>): this
  tween(n: string, x: null): this
  tween(n: string): Value<S, T, (this: S, x: number) => void> | undefined
}
export type SelectionOrTransition<S extends Base, T, P extends Base, U> = Selection<S, T, P, U> | Transition<S, T, P, U>

export interface NS {
  space: string
  local: string
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
export interface BaseArc {
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
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  cornerRadius(): (this: This, x: T, ...xs: any[]) => number
  cornerRadius(f: (this: This, x: T, ...xs: any[]) => number): this
  cornerRadius(x: number): this
  endAngle(): (this: This, x: T, ...xs: any[]) => number
  endAngle(f: (this: This, x: T, ...xs: any[]) => number): this
  endAngle(x: number): this
  innerRadius(): (this: This, x: T, ...xs: any[]) => number
  innerRadius(f: (this: This, x: T, ...xs: any[]) => number): this
  innerRadius(x: number): this
  outerRadius(): (this: This, x: T, ...xs: any[]) => number
  outerRadius(f: (this: This, x: T, ...xs: any[]) => number): this
  outerRadius(x: number): this
  padAngle(): (this: This, x: T, ...xs: any[]) => number | undefined
  padAngle(f: (this: This, x: T, ...xs: any[]) => number | undefined): this
  padAngle(x: number | undefined): this
  padRadius(): ((this: This, x: T, ...xs: any[]) => number) | null
  padRadius(x: null | number | ((this: This, x: T, ...xs: any[]) => number)): this
  startAngle(): (this: This, x: T, ...xs: any[]) => number
  startAngle(f: (this: This, x: T, ...xs: any[]) => number): this
  startAngle(x: number): this
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
  endAngle(): (this: This, data: T[], ...xs: any[]) => number
  endAngle(f: (this: This, data: T[], ...xs: any[]) => number): this
  endAngle(x: number): this
  padAngle(): (this: This, data: T[], ...xs: any[]) => number
  padAngle(f: (this: This, data: T[], ...xs: any[]) => number): this
  padAngle(x: number): this
  sort(): ((a: T, b: T) => number) | null
  sort(f: (a: T, b: T) => number): this
  sort(x: null): this
  sortValues(): ((a: number, b: number) => number) | null
  sortValues(f: ((a: number, b: number) => number) | null): this
  startAngle(): (this: This, data: T[], ...xs: any[]) => number
  startAngle(f: (this: This, data: T[], ...xs: any[]) => number): this
  startAngle(x: number): this
  value(): (x: T, i: number, data: T[]) => number
  value(f: (x: T, i: number, data: T[]) => number): this
  value(x: number): this
}
export interface Line<T> {
  (data: Iterable<T> | T[]): string | null
  (data: Iterable<T> | T[]): void
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFac | LineOnlyFac
  curve(f: CurveFac | LineOnlyFac): this
  curve<C extends CurveFac | LineOnlyFac>(): C
  defined(): (x: T, i: number, data: T[]) => boolean
  defined(f: (x: T, i: number, data: T[]) => boolean): this
  defined(x: boolean): this
  x(): (x: T, i: number, data: T[]) => number
  x(f: (x: T, i: number, data: T[]) => number): this
  x(x: number): this
  y(): (x: T, i: number, data: T[]) => number
  y(f: (x: T, i: number, data: T[]) => number): this
  y(x: number): this
}
export interface LineRadial<T> {
  (data: Iterable<T> | T[]): string | null
  (data: Iterable<T> | T[]): void
  angle(): (x: T, i: number, data: T[]) => number
  angle(f: (x: T, i: number, data: T[]) => number): this
  angle(x: number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFac | LineOnlyFac
  curve(f: CurveFac | LineOnlyFac): this
  curve<C extends CurveFac | LineOnlyFac>(): C
  defined(): (x: T, i: number, data: T[]) => boolean
  defined(f: (x: T, i: number, data: T[]) => boolean): this
  defined(x: boolean): this
  radius(): (x: T, i: number, data: T[]) => number
  radius(f: (x: T, i: number, data: T[]) => number): this
  radius(x: number): this
}

export interface Area<T> {
  (xs: Iterable<T> | T[]): string | null
  (xs: Iterable<T> | T[]): void
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFac
  curve(x: CurveFac): this
  curve<C extends CurveFac>(): C
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
  y(x: number): this
  y0(): Op<T>
  y0(f: Op<T>): this
  y0(x: number): this
  y1(): Op<T> | null
  y1(f: Op<T>): this
  y1(x: null | number): this
}
export interface AreaRadial<T> {
  (xs: Iterable<T> | T[]): string | null
  (xs: Iterable<T> | T[]): void
  angle(): Op<T>
  angle(f: Op<T>): this
  angle(x: number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
  curve(): CurveFac
  curve(x: CurveFac): this
  curve<C extends CurveFac>(): C
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

export interface LineOnlyGen {
  lineStart(): void
  lineEnd(): void
  point(x: number, y: number): void
}
export interface CurveGen extends LineOnlyGen {
  areaStart(): void
  areaEnd(): void
}
export type LineOnlyFac = (x: CanvasRenderingContext2D | Path) => LineOnlyGen
export type CurveFac = (x: CanvasRenderingContext2D | Path) => CurveGen

export interface BundleFac extends LineOnlyFac {
  beta(x: number): this
}
export interface CardinalFac extends CurveFac {
  tension(x: number): this
}
export interface CatmullRomFac extends CurveFac {
  alpha(x: number): this
}
export interface DefaultLinkObject {
  src: Point
  tgt: Point
}
export interface Link<This, L, N> {
  (this: This, d: L, ...xs: any[]): string | null
  (this: This, d: L, ...xs: any[]): void
  source(): (this: This, d: L, ...xs: any[]) => N
  source(f: (this: This, d: L, ...xs: any[]) => N): this
  target(): (this: This, d: L, ...xs: any[]) => N
  target(f: (this: This, d: L, ...xs: any[]) => N): this
  x(): (this: This, node: N, ...xs: any[]) => number
  x(x: (this: This, node: N, ...xs: any[]) => number): this
  y(): (this: This, node: N, ...xs: any[]) => number
  y(y: (this: This, node: N, ...xs: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
}
export interface LinkRadial<This, L, N> {
  (this: This, d: L, ...xs: any[]): string | null
  (this: This, d: L, ...xs: any[]): void
  source(): (this: This, d: L, ...xs: any[]) => N
  source(f: (this: This, d: L, ...xs: any[]) => N): this
  target(): (this: This, d: L, ...xs: any[]) => N
  target(f: (this: This, d: L, ...xs: any[]) => N): this
  angle(): (this: This, node: N, ...xs: any[]) => number
  angle(f: (this: This, node: N, ...xs: any[]) => number): this
  radius(): (this: This, node: N, ...xs: any[]) => number
  radius(f: (this: This, node: N, ...xs: any[]) => number): this
  context(): CanvasRenderingContext2D | null
  context(x: CanvasRenderingContext2D | null): this
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
  size(x: number): this
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

export namespace Time {
  export interface Interval {
    (x?: Date): Date
    ceil(x: Date): Date
    filter(f: (x: Date) => boolean): Interval
    floor(x: Date): Date
    offset(x: Date, step?: number): Date
    range(start: Date, stop: Date, step?: number): Date[]
    round(x: Date): Date
  }
  export interface Countable extends Interval {
    count(start: Date, end: Date): number
    every(x: number): Interval | null
  }
  export interface Definition {
    dateTime: string
    date: string
    time: string
    periods: [string, string]
    days: [string, string, string, string, string, string, string]
    shortDays: [string, string, string, string, string, string, string]
    months: [string, string, string, string, string, string, string, string, string, string, string, string]
    shortMonths: [string, string, string, string, string, string, string, string, string, string, string, string]
  }
  export interface Locale {
    format(x: string): (x: Date) => string
    parse(x: string): (x: string) => Date | null
    utcFormat(x: string): (x: Date) => string
    utcParse(x: string): (x: string) => Date | null
  }
}
export interface Timer {
  restart(f: (x: number) => void, delay?: number, time?: number): void
  stop(): void
}

export type Zoomed = Element
export interface Zoom<Z extends Zoomed, T> extends Function {
  (x: Selection<Z, T, any, any>, ...xs: any[]): void
  clickDistance(): number
  clickDistance(x: number): this
  constrain(): (t: Zoom.Transform, ext: [Point, Span], tExt: [Point, Span]) => Zoom.Transform
  constrain(f: (t: Zoom.Transform, ext: [Point, Span], tExt: [Point, Span]) => Zoom.Transform): this
  duration(): number
  duration(x: number): this
  extent(): (this: Z, x: T) => [Point, Span]
  extent(f: (this: Z, x: T) => [Point, Span]): this
  extent(x: [Point, Span]): this
  filter(): (this: Z, e: any, x: T) => boolean
  filter(filter: (this: Z, e: any, x: T) => boolean): this
  interpolate(f: (a: Zoom.View, b: Zoom.View) => (x: number) => Zoom.View): this
  interpolate<F extends (a: Zoom.View, b: Zoom.View) => (x: number) => Zoom.View>(): F
  on(n: string, f: (this: Z, e: any, x: T) => void): this
  on(n: string, x: null): this
  on(n: string): ((this: Z, e: any, x: T) => void) | undefined
  scaleBy(
    s: Selection<Z, T, any, any> | TransitionLike<Z, T>,
    k: number | Value<Z, T, number>,
    p?: Point | Value<Z, T, Point>
  ): void
  scaleExtent(): Span
  scaleExtent(x: Span): this
  scaleTo(s: Selection<Z, T, any, any> | TransitionLike<Z, T>, k: number | Value<Z, T, number>, p?: Point): void
  tapDistance(): number
  tapDistance(x: number): this
  touchable(): Value<Z, T, boolean>
  touchable(f: Value<Z, T, boolean>): this
  touchable(x: boolean): this
  transform(
    x: Selection<Z, T, any, any> | TransitionLike<Z, T>,
    t: Zoom.Transform | ((this: Z, e: any, x: T) => Zoom.Transform),
    p?: Point | ((this: Z, e: any, x: T) => Point)
  ): void
  translateBy(
    s: Selection<Z, T, any, any> | TransitionLike<Z, T>,
    x: number | Value<Z, T, number>,
    y: number | Value<Z, T, number>
  ): void
  translateExtent(): [Point, Span]
  translateExtent(x: [Point, Span]): this
  translateTo(
    s: Selection<Z, T, any, any> | TransitionLike<Z, T>,
    x: number | Value<Z, T, number>,
    y: number | Value<Z, T, number>,
    p?: Point | Value<Z, T, Point>
  ): void
  wheelDelta(): Value<Z, T, number>
  wheelDelta(x: ((e: WheelEvent) => number) | number): this
}
export namespace Zoom {
  export type View = [number, number, number]
  export interface Interpolator extends Function {
    (x: number): Zoom.View
    duration: number
    rho(x: number): this
  }
  export interface Scale {
    copy(): Scale
    domain(): number[] | Date[]
    domain(x: Array<Date | number>): this
    invert(x: number): number | Date
    range(): number[]
    range(x: number[]): this
  }
  export interface Transform {
    readonly x: number
    readonly y: number
    readonly k: number
    apply(x: Point): Point
    applyX(x: number): number
    applyY(y: number): number
    invert(x: Point): Point
    invertX(x: number): number
    invertY(y: number): number
    rescaleX<S extends Zoom.Scale>(x: S): S
    rescaleY<S extends Zoom.Scale>(x: S): S
    scale(k: number): Transform
    toString(): string
    translate(x: number, y: number): Transform
  }
}
