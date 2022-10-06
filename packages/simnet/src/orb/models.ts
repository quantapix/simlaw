import { INodeBase, INode } from "./node"
import { GraphObjectState } from "./state"
import { Color, IPosition, ICircle, getDistanceToLine } from "../common"

const CURVED_CONTROL_POINT_OFFSET_MIN_SIZE = 4
const CURVED_CONTROL_POINT_OFFSET_MULTIPLIER = 4

/**
 * Edge baseline object with required fields
 * that user needs to define for an edge.
 */
export interface IEdgeBase {
  id: any
  start: any
  end: any
}

/**
 * Edge position for the graph simulations. Edge position
 * is determined by source (start) and target (end) nodes.
 */
export interface IEdgePosition {
  id: any
  source: any
  target: any
}

/**
 * Edge style properties used to style the edge (color, width, label, etc.).
 */
export type IEdgeStyle = Partial<{
  arrowSize: number
  color: Color | string
  colorHover: Color | string
  colorSelected: Color | string
  fontBackgroundColor: Color | string
  fontColor: Color | string
  fontFamily: string
  fontSize: number
  label: string
  shadowColor: Color | string
  shadowSize: number
  shadowOffsetX: number
  shadowOffsetY: number
  width: number
  widthHover: number
  widthSelected: number
}>

export interface IEdgeData<N extends INodeBase, E extends IEdgeBase> {
  data: E
  // Offset is used to mark curved or straight lines
  // For straight lines, it is 0, for curved it is +N or -N
  offset?: number
  // Edge doesn't exist without nodes
  startNode: INode<N, E>
  endNode: INode<N, E>
}

export enum EdgeType {
  STRAIGHT = "straight",
  LOOPBACK = "loopback",
  CURVED = "curved",
}

export interface IEdge<N extends INodeBase, E extends IEdgeBase> {
  data: E
  position: IEdgePosition
  style: IEdgeStyle
  state: number
  readonly id: any
  readonly offset: number
  readonly start: any
  readonly startNode: INode<N, E>
  readonly end: any
  readonly endNode: INode<N, E>
  readonly type: EdgeType
  hasStyle(): boolean
  isSelected(): boolean
  isHovered(): boolean
  clearState(): void
  isLoopback(): boolean
  isStraight(): boolean
  isCurved(): boolean
  getCenter(): IPosition
  getDistance(point: IPosition): number
  getLabel(): string | undefined
  hasShadow(): boolean
  getWidth(): number
  getColor(): Color | string | undefined
}

export class EdgeFactory {
  static create<N extends INodeBase, E extends IEdgeBase>(data: IEdgeData<N, E>): IEdge<N, E> {
    const type = getEdgeType(data)
    switch (type) {
      case EdgeType.STRAIGHT:
        return new EdgeStraight(data)
      case EdgeType.LOOPBACK:
        return new EdgeLoopback(data)
      case EdgeType.CURVED:
        return new EdgeCurved(data)
      default:
        return new EdgeStraight(data)
    }
  }

  static copy<N extends INodeBase, E extends IEdgeBase>(
    edge: IEdge<N, E>,
    data?: Omit<IEdgeData<N, E>, "data" | "startNode" | "endNode">
  ): IEdge<N, E> {
    const newEdge = EdgeFactory.create<N, E>({
      data: edge.data,
      offset: data?.offset !== undefined ? data.offset : edge.offset,
      startNode: edge.startNode,
      endNode: edge.endNode,
    })
    newEdge.state = edge.state
    newEdge.style = edge.style

    return newEdge
  }
}

export const isEdge = <N extends INodeBase, E extends IEdgeBase>(obj: any): obj is IEdge<N, E> => {
  return obj instanceof EdgeStraight || obj instanceof EdgeCurved || obj instanceof EdgeLoopback
}

abstract class Edge<N extends INodeBase, E extends IEdgeBase> implements IEdge<N, E> {
  public data: E

  public readonly id: number
  public readonly offset: number
  public readonly startNode: INode<N, E>
  public readonly endNode: INode<N, E>

  public style: IEdgeStyle = {}
  public state = GraphObjectState.NONE
  public position: IEdgePosition

  private _type: EdgeType = EdgeType.STRAIGHT

  constructor(data: IEdgeData<N, E>) {
    this.id = data.data.id
    this.data = data.data
    this.offset = data.offset ?? 0
    this.startNode = data.startNode
    this.endNode = data.endNode
    this._type = getEdgeType(data)

    this.position = { id: this.id, source: this.startNode.id, target: this.endNode.id }
    this.startNode.addEdge(this)
    this.endNode.addEdge(this)
  }

  get type(): EdgeType {
    return this._type
  }

  get start(): number {
    return this.data.start
  }

  get end(): number {
    return this.data.end
  }

  hasStyle(): boolean {
    return this.style && Object.keys(this.style).length > 0
  }

  isSelected(): boolean {
    return this.state === GraphObjectState.SELECTED
  }

  isHovered(): boolean {
    return this.state === GraphObjectState.HOVERED
  }

  clearState(): void {
    this.state = GraphObjectState.NONE
  }

  isLoopback(): boolean {
    return this._type === EdgeType.LOOPBACK
  }

  isStraight(): boolean {
    return this._type === EdgeType.STRAIGHT
  }

  isCurved(): boolean {
    return this._type === EdgeType.CURVED
  }

  getCenter(): IPosition {
    const startPoint = this.startNode?.getCenter()
    const endPoint = this.endNode?.getCenter()
    if (!startPoint || !endPoint) {
      return { x: 0, y: 0 }
    }

    return {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    }
  }

  getDistance(point: IPosition): number {
    const startPoint = this.startNode.getCenter()
    const endPoint = this.endNode.getCenter()
    if (!startPoint || !endPoint) {
      return 0
    }

    return getDistanceToLine(startPoint, endPoint, point)
  }

  getLabel(): string | undefined {
    return this.style.label
  }

  hasShadow(): boolean {
    return (
      (this.style.shadowSize ?? 0) > 0 || (this.style.shadowOffsetX ?? 0) > 0 || (this.style.shadowOffsetY ?? 0) > 0
    )
  }

  getWidth(): number {
    let width = 0
    if (this.style.width !== undefined) {
      width = this.style.width
    }
    if (this.isHovered() && this.style.widthHover !== undefined) {
      width = this.style.widthHover
    }
    if (this.isSelected() && this.style.widthSelected !== undefined) {
      width = this.style.widthSelected
    }
    return width
  }

  getColor(): Color | string | undefined {
    let color: Color | string | undefined = undefined

    if (this.style.color) {
      color = this.style.color
    }
    if (this.isHovered() && this.style.colorHover) {
      color = this.style.colorHover
    }
    if (this.isSelected() && this.style.colorSelected) {
      color = this.style.colorSelected
    }

    return color
  }
}

const getEdgeType = <N extends INodeBase, E extends IEdgeBase>(data: IEdgeData<N, E>): EdgeType => {
  if (data.startNode.id === data.endNode.id) {
    return EdgeType.LOOPBACK
  }
  return (data.offset ?? 0) === 0 ? EdgeType.STRAIGHT : EdgeType.CURVED
}

export class EdgeStraight<N extends INodeBase, E extends IEdgeBase> extends Edge<N, E> {
  override getCenter(): IPosition {
    const startPoint = this.startNode?.getCenter()
    const endPoint = this.endNode?.getCenter()
    if (!startPoint || !endPoint) {
      return { x: 0, y: 0 }
    }

    return {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    }
  }

  override getDistance(point: IPosition): number {
    const startPoint = this.startNode?.getCenter()
    const endPoint = this.endNode?.getCenter()
    if (!startPoint || !endPoint) {
      return 0
    }

    return getDistanceToLine(startPoint, endPoint, point)
  }
}

export class EdgeCurved<N extends INodeBase, E extends IEdgeBase> extends Edge<N, E> {
  override getCenter(): IPosition {
    return this.getCurvedControlPoint(CURVED_CONTROL_POINT_OFFSET_MULTIPLIER / 2)
  }

  /**
   * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/edges/util/bezier-edge-base.ts}
   *
   * @param {IPosition} point Point
   * @return {number} Distance to the point
   */
  override getDistance(point: IPosition): number {
    const sourcePoint = this.startNode?.getCenter()
    const targetPoint = this.endNode?.getCenter()
    if (!sourcePoint || !targetPoint) {
      return 0
    }

    const controlPoint = this.getCurvedControlPoint()

    let minDistance = 1e9
    let distance
    let i
    let t
    let x
    let y
    let lastX = sourcePoint.x
    let lastY = sourcePoint.y
    for (i = 1; i < 10; i++) {
      t = 0.1 * i
      x = Math.pow(1 - t, 2) * sourcePoint.x + 2 * t * (1 - t) * controlPoint.x + Math.pow(t, 2) * targetPoint.x
      y = Math.pow(1 - t, 2) * sourcePoint.y + 2 * t * (1 - t) * controlPoint.y + Math.pow(t, 2) * targetPoint.y
      if (i > 0) {
        distance = getDistanceToLine({ x: lastX, y: lastY }, { x, y }, point)
        minDistance = distance < minDistance ? distance : minDistance
      }
      lastX = x
      lastY = y
    }

    return minDistance
  }

  getCurvedControlPoint(offsetMultiplier = CURVED_CONTROL_POINT_OFFSET_MULTIPLIER): IPosition {
    if (!this.startNode || !this.endNode) {
      return { x: 0, y: 0 }
    }
    const sourcePoint = this.startNode.getCenter()
    const targetPoint = this.endNode.getCenter()
    const sourceSize = this.startNode.getRadius()
    const targetSize = this.endNode.getRadius()

    const middleX = (sourcePoint.x + targetPoint.x) / 2
    const middleY = (sourcePoint.y + targetPoint.y) / 2

    const dx = targetPoint.x - sourcePoint.x
    const dy = targetPoint.y - sourcePoint.y
    const length = Math.sqrt(dx * dx + dy * dy)

    const offsetSize = Math.max(sourceSize, targetSize, CURVED_CONTROL_POINT_OFFSET_MIN_SIZE)
    const offset = (this.offset ?? 1) * offsetSize * offsetMultiplier

    // TODO: Check for faster smooth quadratic curve
    // https://docs.microsoft.com/en-us/xamarin/xamarin-forms/user-interface/graphics/skiasharp/curves/path-data
    return {
      x: middleX + offset * (dy / length),
      y: middleY - offset * (dx / length),
    }
  }
}

export class EdgeLoopback<N extends INodeBase, E extends IEdgeBase> extends Edge<N, E> {
  override getCenter(): IPosition {
    const offset = Math.abs(this.offset ?? 1)
    const circle = this.getCircularData()
    return {
      x: circle.x + circle.radius,
      y: circle.y - offset * 5,
    }
  }

  override getDistance(point: IPosition): number {
    const circle = this.getCircularData()
    const dx = circle.x - point.x
    const dy = circle.y - point.y
    return Math.abs(Math.sqrt(dx * dx + dy * dy) - circle.radius)
  }

  getCircularData(): ICircle {
    if (!this.startNode) {
      return { x: 0, y: 0, radius: 0 }
    }

    const nodeCenter = this.startNode.getCenter()
    const nodeRadius = this.startNode.getBorderedRadius()

    const offset = Math.abs(this.offset ?? 1)
    const radius = nodeRadius * 1.5 * offset
    const nodeSize = nodeRadius

    const x = nodeCenter.x + radius
    const y = nodeCenter.y - nodeSize * 0.5

    return { x, y, radius }
  }
}
import { INode, INodeBase, INodePosition, NodeFactory } from "./node"
import { IEdge, EdgeFactory, IEdgeBase, IEdgePosition } from "./edge"
import { IPosition, IRectangle } from "../common"
import { IGraphStyle } from "./style"
import { ImageHandler } from "../services/images"
import { getEdgeOffsets } from "./topology"

export interface IGraphData<N extends INodeBase, E extends IEdgeBase> {
  nodes: N[]
  edges: E[]
}

export type IEdgeFilter<N extends INodeBase, E extends IEdgeBase> = (edge: IEdge<N, E>) => boolean

export type INodeFilter<N extends INodeBase, E extends IEdgeBase> = (node: INode<N, E>) => boolean

export interface IGraph<N extends INodeBase, E extends IEdgeBase> {
  getNodes(filterBy?: INodeFilter<N, E>): INode<N, E>[]
  getEdges(filterBy?: IEdgeFilter<N, E>): IEdge<N, E>[]
  getNodeCount(): number
  getEdgeCount(): number
  getNodeById(id: any): INode<N, E> | undefined
  getEdgeById(id: any): IEdge<N, E> | undefined
  getNodePositions(): INodePosition[]
  setNodePositions(positions: INodePosition[]): void
  getEdgePositions(): IEdgePosition[]
  setDefaultStyle(style: Partial<IGraphStyle<N, E>>): void
  setup(data: Partial<IGraphData<N, E>>): void
  clearPositions(): void
  merge(data: Partial<IGraphData<N, E>>): void
  remove(data: Partial<{ nodeIds: number[]; edgeIds: number[] }>): void
  isEqual<T extends INodeBase, K extends IEdgeBase>(graph: Graph<T, K>): boolean
  getBoundingBox(): IRectangle
  getNearestNode(point: IPosition): INode<N, E> | undefined
  getNearestEdge(point: IPosition, minDistance?: number): IEdge<N, E> | undefined
}

// TODO: Move this to node events when image listening will be on node level
// TODO: Add global events user can listen for: images-load-start, images-load-end
export interface IGraphSettings {
  onLoadedImages: () => void
}

export class Graph<N extends INodeBase, E extends IEdgeBase> implements IGraph<N, E> {
  private _nodeById: { [id: number]: INode<N, E> } = {}
  private _edgeById: { [id: number]: IEdge<N, E> } = {}
  private _defaultStyle?: Partial<IGraphStyle<N, E>>
  private _onLoadedImages?: () => void

  constructor(data?: Partial<IGraphData<N, E>>, settings?: Partial<IGraphSettings>) {
    this._onLoadedImages = settings?.onLoadedImages
    const nodes = data?.nodes ?? []
    const edges = data?.edges ?? []
    this.setup({ nodes, edges })
  }

  /**
   * Returns a list of nodes.
   *
   * @param {INodeFilter} filterBy Filter function for nodes
   * @return {INode[]} List of nodes
   */
  getNodes(filterBy?: INodeFilter<N, E>): INode<N, E>[] {
    const nodes = Object.values(this._nodeById)
    if (!filterBy) {
      return nodes
    }

    const filteredNodes: INode<N, E>[] = []
    for (let i = 0; i < nodes.length; i++) {
      if (filterBy(nodes[i])) {
        filteredNodes.push(nodes[i])
      }
    }
    return filteredNodes
  }

  /**
   * Returns a list of edges.
   *
   * @param {IEdgeFilter} filterBy Filter function for edges
   * @return {IEdge[]} List of edges
   */
  getEdges(filterBy?: IEdgeFilter<N, E>): IEdge<N, E>[] {
    const edges = Object.values(this._edgeById)
    if (!filterBy) {
      return edges
    }

    const filteredEdges: IEdge<N, E>[] = []
    for (let i = 0; i < edges.length; i++) {
      if (filterBy(edges[i])) {
        filteredEdges.push(edges[i])
      }
    }
    return filteredEdges
  }

  /**
   * Returns the total node count.
   *
   * @return {number} Total node count
   */
  getNodeCount(): number {
    return Object.keys(this._nodeById).length
  }

  /**
   * Returns the total edge count.
   *
   * @return {number} Total edge count
   */
  getEdgeCount(): number {
    return Object.keys(this._edgeById).length
  }

  /**
   * Returns node by node id.
   *
   * @param {any} id Node id
   * @return {Node | undefined} Node or undefined
   */
  getNodeById(id: any): INode<N, E> | undefined {
    return this._nodeById[id]
  }

  /**
   * Returns edge by edge id.
   *
   * @param {any} id Edge id
   * @return {IEdge | undefined} Edge or undefined
   */
  getEdgeById(id: any): IEdge<N, E> | undefined {
    return this._edgeById[id]
  }

  /**
   * Returns a list of current node positions (x, y).
   *
   * @return {INodePosition[]} List of node positions
   */
  getNodePositions(): INodePosition[] {
    const nodes = this.getNodes()
    const positions: INodePosition[] = new Array<INodePosition>(nodes.length)
    for (let i = 0; i < nodes.length; i++) {
      positions[i] = nodes[i].position
    }
    return positions
  }

  /**
   * Sets new node positions (x, y).
   *
   * @param {INodePosition} positions Node positions
   */
  setNodePositions(positions: INodePosition[]) {
    for (let i = 0; i < positions.length; i++) {
      const node = this._nodeById[positions[i].id]
      if (node) {
        node.position = positions[i]
      }
    }
  }

  /**
   * Returns a list of current edge positions. Edge positions do not have
   * (x, y) but a link to the source and target node ids.
   *
   * @return {IEdgePosition[]} List of edge positions
   */
  getEdgePositions(): IEdgePosition[] {
    const edges = this.getEdges()
    const positions: IEdgePosition[] = new Array<IEdgePosition>(edges.length)
    for (let i = 0; i < edges.length; i++) {
      positions[i] = edges[i].position
    }
    return positions
  }

  /**
   * Sets default style to new nodes and edges. The applied style will be used
   * for all future nodes and edges added with `.merge` function.
   *
   * @param {IGraphStyle} style Style definition
   */
  setDefaultStyle(style: Partial<IGraphStyle<N, E>>) {
    this._defaultStyle = style
    this._applyStyle()
  }

  setup(data: Partial<IGraphData<N, E>>) {
    this._nodeById = {}
    this._edgeById = {}

    const nodes = data?.nodes ?? []
    const edges = data?.edges ?? []

    this._insertNodes(nodes)
    this._insertEdges(edges)

    this._applyEdgeOffsets()
    this._applyStyle()
  }

  clearPositions() {
    const nodes = this.getNodes()
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].clearPosition()
    }
  }

  merge(data: Partial<IGraphData<N, E>>) {
    const nodes = data.nodes ?? []
    const edges = data.edges ?? []

    this._upsertNodes(nodes)
    this._upsertEdges(edges)

    this._applyEdgeOffsets()
    this._applyStyle()
  }

  remove(data: Partial<{ nodeIds: number[]; edgeIds: number[] }>) {
    const nodeIds = data.nodeIds ?? []
    const edgeIds = data.edgeIds ?? []

    this._removeNodes(nodeIds)
    this._removeEdges(edgeIds)

    this._applyEdgeOffsets()
    // this._applyStyle();
  }

  isEqual<T extends INodeBase, K extends IEdgeBase>(graph: Graph<T, K>): boolean {
    if (this.getNodeCount() !== graph.getNodeCount()) {
      return false
    }

    if (this.getEdgeCount() !== graph.getEdgeCount()) {
      return false
    }

    const nodes = this.getNodes()
    for (let i = 0; i < nodes.length; i++) {
      if (!graph.getNodeById(nodes[i].id)) {
        return false
      }
    }

    const edges = this.getEdges()
    for (let i = 0; i < edges.length; i++) {
      if (!graph.getEdgeById(edges[i].id)) {
        return false
      }
    }

    return true
  }

  getBoundingBox(): IRectangle {
    const nodes = this.getNodes()
    const minPoint: IPosition = { x: 0, y: 0 }
    const maxPoint: IPosition = { x: 0, y: 0 }

    for (let i = 0; i < nodes.length; i++) {
      const { x, y } = nodes[i].getCenter()

      if (x === undefined || y === undefined) {
        continue
      }

      const size = nodes[i].getBorderedRadius()

      if (i === 0) {
        minPoint.x = x - size
        maxPoint.x = x + size
        minPoint.y = y - size
        maxPoint.y = y + size
        continue
      }

      if (x + size > maxPoint.x) {
        maxPoint.x = x + size
      }
      if (x - size < minPoint.x) {
        minPoint.x = x - size
      }
      if (y + size > maxPoint.y) {
        maxPoint.y = y + size
      }
      if (y - size < minPoint.y) {
        minPoint.y = y - size
      }
    }

    return {
      x: minPoint.x,
      y: minPoint.y,
      width: Math.abs(maxPoint.x - minPoint.x),
      height: Math.abs(maxPoint.y - minPoint.y),
    }
  }

  getNearestNode(point: IPosition): INode<N, E> | undefined {
    // Reverse is needed to check from the top drawn to the bottom drawn node
    const nodes = this.getNodes()
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].includesPoint(point)) {
        return nodes[i]
      }
    }
  }

  getNearestEdge(point: IPosition, minDistance = 3): IEdge<N, E> | undefined {
    let nearestEdge: IEdge<N, E> | undefined
    let nearestDistance = minDistance

    const edges = this.getEdges()
    for (let i = 0; i < edges.length; i++) {
      const distance = edges[i].getDistance(point)
      if (distance <= nearestDistance) {
        nearestDistance = distance
        nearestEdge = edges[i]
      }
    }
    return nearestEdge
  }

  private _insertNodes(nodes: N[]) {
    for (let i = 0; i < nodes.length; i++) {
      const node = NodeFactory.create<N, E>({ data: nodes[i] }, { onLoadedImage: () => this._onLoadedImages?.() })
      this._nodeById[node.id] = node
    }
  }

  private _insertEdges(edges: E[]) {
    for (let i = 0; i < edges.length; i++) {
      const startNode = this.getNodeById(edges[i].start)
      const endNode = this.getNodeById(edges[i].end)

      if (startNode && endNode) {
        const edge = EdgeFactory.create<N, E>({
          data: edges[i],
          startNode,
          endNode,
        })
        this._edgeById[edge.id] = edge
      }
    }
  }

  private _upsertNodes(nodes: N[]) {
    for (let i = 0; i < nodes.length; i++) {
      const existingNode = this.getNodeById(nodes[i].id)
      if (existingNode) {
        existingNode.data = nodes[i]
        continue
      }

      const node = NodeFactory.create<N, E>({ data: nodes[i] }, { onLoadedImage: () => this._onLoadedImages?.() })
      this._nodeById[node.id] = node
    }
  }

  private _upsertEdges(edges: E[]) {
    for (let i = 0; i < edges.length; i++) {
      const newEdgeData = edges[i]
      const existingEdge = this.getEdgeById(newEdgeData.id)

      // New edge
      if (!existingEdge) {
        const startNode = this.getNodeById(newEdgeData.start)
        const endNode = this.getNodeById(newEdgeData.end)

        if (startNode && endNode) {
          const edge = EdgeFactory.create<N, E>({
            data: newEdgeData,
            startNode,
            endNode,
          })
          this._edgeById[edge.id] = edge
        }
        continue
      }

      // The connection of the edge stays the same, but the data has changed
      if (existingEdge.start === newEdgeData.start && existingEdge.end === newEdgeData.end) {
        existingEdge.data = newEdgeData
        continue
      }

      // Edge connection (start or end node) has changed
      existingEdge.startNode.removeEdge(existingEdge)
      existingEdge.endNode.removeEdge(existingEdge)
      delete this._edgeById[existingEdge.id]

      const startNode = this.getNodeById(newEdgeData.start)
      const endNode = this.getNodeById(newEdgeData.end)

      if (startNode && endNode) {
        const edge = EdgeFactory.create<N, E>({
          data: newEdgeData,
          offset: existingEdge.offset,
          startNode,
          endNode,
        })
        edge.state = existingEdge.state
        edge.style = existingEdge.style
        this._edgeById[existingEdge.id] = edge
      }
    }
  }

  private _removeNodes(nodeIds: number[]) {
    for (let i = 0; i < nodeIds.length; i++) {
      const node = this.getNodeById(nodeIds[i])
      if (!node) {
        continue
      }

      const edges = node.getEdges()
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i]
        edge.startNode.removeEdge(edge)
        edge.endNode.removeEdge(edge)
        delete this._edgeById[edge.id]
      }

      delete this._nodeById[node.id]
    }
  }

  private _removeEdges(edgeIds: number[]) {
    for (let i = 0; i < edgeIds.length; i++) {
      const edge = this.getEdgeById(edgeIds[i])
      if (!edge) {
        continue
      }

      edge.startNode.removeEdge(edge)
      edge.endNode.removeEdge(edge)
      delete this._edgeById[edge.id]
    }
  }

  private _applyEdgeOffsets() {
    const graphEdges = this.getEdges()
    const edgeOffsets = getEdgeOffsets<N, E>(graphEdges)
    for (let i = 0; i < edgeOffsets.length; i++) {
      const edge = graphEdges[i]
      const edgeOffset = edgeOffsets[i]
      this._edgeById[edge.id] = EdgeFactory.copy(edge, { offset: edgeOffset })
    }
  }

  private _applyStyle() {
    const styleImageUrls: Set<string> = new Set<string>()

    if (this._defaultStyle?.getNodeStyle) {
      const newNodes = this.getNodes()
      for (let i = 0; i < newNodes.length; i++) {
        if (newNodes[i].hasStyle()) {
          continue
        }

        const style = this._defaultStyle.getNodeStyle(newNodes[i])
        if (style) {
          newNodes[i].style = style
          // TODO Add these checks to node property setup
          if (style.imageUrl) {
            styleImageUrls.add(style.imageUrl)
          }
          if (style.imageUrlSelected) {
            styleImageUrls.add(style.imageUrlSelected)
          }
        }
      }
    }

    if (this._defaultStyle?.getEdgeStyle) {
      const newEdges = this.getEdges()
      for (let i = 0; i < newEdges.length; i++) {
        if (newEdges[i].hasStyle()) {
          continue
        }

        const style = this._defaultStyle.getEdgeStyle(newEdges[i])
        if (style) {
          newEdges[i].style = style
        }
      }
    }

    if (styleImageUrls.size) {
      ImageHandler.getInstance().loadImages(Array.from(styleImageUrls), () => {
        this._onLoadedImages?.()
      })
    }
  }
}
import { IEdge, IEdgeBase } from "./edge"
import { Color, IPosition, IRectangle, isPointInRectangle } from "../common"
import { ImageHandler } from "../services/images"
import { GraphObjectState } from "./state"

/**
 * Node baseline object with required fields
 * that user needs to define for a node.
 */
export interface INodeBase {
  id: any
}

/**
 * Node position for the graph simulations. Node position
 * is determined by x and y coordinates.
 */
export interface INodePosition {
  id: any
  x?: number
  y?: number
}

export enum NodeShapeType {
  CIRCLE = "circle",
  DOT = "dot",
  SQUARE = "square",
  DIAMOND = "diamond",
  TRIANGLE = "triangle",
  TRIANGLE_DOWN = "triangleDown",
  STAR = "star",
  HEXAGON = "hexagon",
}

/**
 * Node style properties used to style the node (color, width, label, etc.).
 */
export type INodeStyle = Partial<{
  borderColor: Color | string
  borderColorHover: Color | string
  borderColorSelected: Color | string
  borderWidth: number
  borderWidthSelected: number
  color: Color | string
  colorHover: Color | string
  colorSelected: Color | string
  fontBackgroundColor: Color | string
  fontColor: Color | string
  fontFamily: string
  fontSize: number
  imageUrl: string
  imageUrlSelected: string
  label: string
  shadowColor: Color | string
  shadowSize: number
  shadowOffsetX: number
  shadowOffsetY: number
  shape: NodeShapeType
  size: number
  mass: number
}>

export interface INodeData<N extends INodeBase> {
  data: N
}

export interface INode<N extends INodeBase, E extends IEdgeBase> {
  data: N
  position: INodePosition
  style: INodeStyle
  state: number
  readonly id: any
  clearPosition(): void
  getCenter(): IPosition
  getRadius(): number
  getBorderedRadius(): number
  getBoundingBox(): IRectangle
  getInEdges(): IEdge<N, E>[]
  getOutEdges(): IEdge<N, E>[]
  getEdges(): IEdge<N, E>[]
  getAdjacentNodes(): INode<N, E>[]
  hasStyle(): boolean
  addEdge(edge: IEdge<N, E>): void
  removeEdge(edge: IEdge<N, E>): void
  isSelected(): boolean
  isHovered(): boolean
  clearState(): void
  getDistanceToBorder(): number
  includesPoint(point: IPosition): boolean
  hasShadow(): boolean
  hasBorder(): boolean
  getLabel(): string | undefined
  getColor(): Color | string | undefined
  getBorderWidth(): number
  getBorderColor(): Color | string | undefined
  getBackgroundImage(): HTMLImageElement | undefined
}

// TODO: Dirty solution: Find another way to listen for global images, maybe through
//  events that user can listen for: images-load-start, images-load-end
export interface INodeSettings {
  onLoadedImage: () => void
}

export class NodeFactory {
  static create<N extends INodeBase, E extends IEdgeBase>(
    data: INodeData<N>,
    settings?: Partial<INodeSettings>
  ): INode<N, E> {
    return new Node<N, E>(data, settings)
  }
}

export const isNode = <N extends INodeBase, E extends IEdgeBase>(obj: any): obj is INode<N, E> => {
  return obj instanceof Node
}

export class Node<N extends INodeBase, E extends IEdgeBase> implements INode<N, E> {
  public readonly id: number
  public data: N
  public position: INodePosition
  public style: INodeStyle = {}
  public state = GraphObjectState.NONE

  private readonly _inEdgesById: { [id: number]: IEdge<N, E> } = {}
  private readonly _outEdgesById: { [id: number]: IEdge<N, E> } = {}
  private readonly _onLoadedImage?: () => void

  constructor(data: INodeData<N>, settings?: Partial<INodeSettings>) {
    this.id = data.data.id
    this.data = data.data
    this.position = { id: this.id }
    this._onLoadedImage = settings?.onLoadedImage
  }

  clearPosition() {
    this.position.x = undefined
    this.position.y = undefined
  }

  getCenter(): IPosition {
    // This should not be called in the render because nodes without position will be
    // filtered out
    if (this.position.x === undefined || this.position.y === undefined) {
      return { x: 0, y: 0 }
    }
    return { x: this.position.x, y: this.position.y }
  }

  getRadius(): number {
    return this.style.size ?? 0
  }

  getBorderedRadius(): number {
    return this.getRadius() + this.getBorderWidth() / 2
  }

  getBoundingBox(): IRectangle {
    const center = this.getCenter()
    const radius = this.getBorderedRadius()
    return {
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2,
    }
  }

  getInEdges(): IEdge<N, E>[] {
    return Object.values(this._inEdgesById)
  }

  getOutEdges(): IEdge<N, E>[] {
    return Object.values(this._outEdgesById)
  }

  getEdges(): IEdge<N, E>[] {
    const edgeById: { [id: number]: IEdge<N, E> } = {}

    const outEdges = this.getOutEdges()
    for (let i = 0; i < outEdges.length; i++) {
      const outEdge = outEdges[i]
      edgeById[outEdge.id] = outEdge
    }

    const inEdges = this.getInEdges()
    for (let i = 0; i < inEdges.length; i++) {
      const inEdge = inEdges[i]
      edgeById[inEdge.id] = inEdge
    }

    return Object.values(edgeById)
  }

  getAdjacentNodes(): INode<N, E>[] {
    const adjacentNodeById: { [id: number]: INode<N, E> } = {}

    const outEdges = this.getOutEdges()
    for (let i = 0; i < outEdges.length; i++) {
      const adjacentNode = outEdges[i].endNode
      if (adjacentNode) {
        adjacentNodeById[adjacentNode.id] = adjacentNode
      }
    }

    const inEdges = this.getInEdges()
    for (let i = 0; i < inEdges.length; i++) {
      const adjacentNode = inEdges[i].startNode
      if (adjacentNode) {
        adjacentNodeById[adjacentNode.id] = adjacentNode
      }
    }

    return Object.values(adjacentNodeById)
  }

  hasStyle(): boolean {
    return this.style && Object.keys(this.style).length > 0
  }

  addEdge(edge: IEdge<N, E>) {
    if (edge.start === this.id) {
      this._outEdgesById[edge.id] = edge
    }
    if (edge.end === this.id) {
      this._inEdgesById[edge.id] = edge
    }
  }

  removeEdge(edge: IEdge<N, E>) {
    delete this._outEdgesById[edge.id]
    delete this._inEdgesById[edge.id]
  }

  isSelected(): boolean {
    return this.state === GraphObjectState.SELECTED
  }

  isHovered(): boolean {
    return this.state === GraphObjectState.HOVERED
  }

  clearState(): void {
    this.state = GraphObjectState.NONE
  }

  getDistanceToBorder(): number {
    // TODO: Add "getDistanceToBorder(angle: number)" for each node shape type because this covers only circles
    return this.getBorderedRadius()
  }

  includesPoint(point: IPosition): boolean {
    const isInBoundingBox = this._isPointInBoundingBox(point)
    if (!isInBoundingBox) {
      return false
    }

    // For square type, we don't need to check the circle
    if (this.style.shape === NodeShapeType.SQUARE) {
      return isInBoundingBox
    }

    // TODO: Add better "includePoint" checks for stars, triangles, hexagons, etc.
    const center = this.getCenter()
    const borderedRadius = this.getBorderedRadius()

    const dx = point.x - center.x
    const dy = point.y - center.y
    return Math.sqrt(dx * dx + dy * dy) <= borderedRadius
  }

  hasShadow(): boolean {
    return (
      (this.style.shadowSize ?? 0) > 0 || (this.style.shadowOffsetX ?? 0) > 0 || (this.style.shadowOffsetY ?? 0) > 0
    )
  }

  hasBorder(): boolean {
    const hasBorderWidth = (this.style.borderWidth ?? 0) > 0
    const hasBorderWidthSelected = (this.style.borderWidthSelected ?? 0) > 0
    return hasBorderWidth || (this.isSelected() && hasBorderWidthSelected)
  }

  getLabel(): string | undefined {
    return this.style.label
  }

  getColor(): Color | string | undefined {
    let color: Color | string | undefined = undefined

    if (this.style.color) {
      color = this.style.color
    }
    if (this.isHovered() && this.style.colorHover) {
      color = this.style.colorHover
    }
    if (this.isSelected() && this.style.colorSelected) {
      color = this.style.colorSelected
    }

    return color
  }

  getBorderWidth(): number {
    let borderWidth = 0
    if (this.style.borderWidth && this.style.borderWidth > 0) {
      borderWidth = this.style.borderWidth
    }
    if (this.isSelected() && this.style.borderWidthSelected && this.style.borderWidthSelected > 0) {
      borderWidth = this.style.borderWidthSelected
    }
    return borderWidth
  }

  getBorderColor(): Color | string | undefined {
    if (!this.hasBorder()) {
      return undefined
    }

    let borderColor: Color | string | undefined = undefined

    if (this.style.borderColor) {
      borderColor = this.style.borderColor
    }
    if (this.isHovered() && this.style.borderColorHover) {
      borderColor = this.style.borderColorHover
    }
    if (this.isSelected() && this.style.borderColorSelected) {
      borderColor = this.style.borderColorSelected.toString()
    }

    return borderColor
  }

  getBackgroundImage(): HTMLImageElement | undefined {
    if ((this.style.size ?? 0) <= 0) {
      return
    }

    let imageUrl

    if (this.style.imageUrl) {
      imageUrl = this.style.imageUrl
    }
    if (this.isSelected() && this.style.imageUrlSelected) {
      imageUrl = this.style.imageUrlSelected
    }

    if (!imageUrl) {
      return
    }

    const image = ImageHandler.getInstance().getImage(imageUrl)
    if (image) {
      return image
    }

    return ImageHandler.getInstance().loadImage(imageUrl, error => {
      if (!error) {
        this._onLoadedImage?.()
      }
    })
  }

  protected _isPointInBoundingBox(point: IPosition): boolean {
    return isPointInRectangle(this.getBoundingBox(), point)
  }
}
// Enum is dismissed so user can define custom additional events (numbers)
export const GraphObjectState = {
  NONE: 0,
  SELECTED: 1,
  HOVERED: 2,
}
import { INode, INodeBase } from "./node"
import { IEdge, IEdgeBase } from "./edge"
import { IGraph } from "./graph"
import { IPosition } from "../common"
import { GraphObjectState } from "./state"

export interface IEventStrategyResponse<N extends INodeBase, E extends IEdgeBase> {
  isStateChanged: boolean
  changedSubject?: INode<N, E> | IEdge<N, E>
}

export interface IEventStrategy<N extends INodeBase, E extends IEdgeBase> {
  onMouseClick: ((graph: IGraph<N, E>, point: IPosition) => IEventStrategyResponse<N, E>) | null
  onMouseMove: ((graph: IGraph<N, E>, point: IPosition) => IEventStrategyResponse<N, E>) | null
}

export const getDefaultEventStrategy = <N extends INodeBase, E extends IEdgeBase>(): IEventStrategy<N, E> => {
  return new DefaultEventStrategy<N, E>()
  // return {
  //   onMouseClick: (graph: IGraph<N, E>, point: IPosition): IEventStrategyResponse<N, E> => {
  //     const node = graph.getNearestNode(point);
  //     if (node) {
  //       selectNode(graph, node);
  //       return {
  //         isStateChanged: true,
  //         changedSubject: node,
  //       };
  //     }
  //
  //     const edge = graph.getNearestEdge(point);
  //     if (edge) {
  //       selectEdge(graph, edge);
  //       return {
  //         isStateChanged: true,
  //         changedSubject: edge,
  //       };
  //     }
  //
  //     const { changedCount } = unselectAll(graph);
  //     return {
  //       isStateChanged: changedCount > 0,
  //     };
  //   },
  //   onMouseMove: (graph: IGraph<N, E>, point: IPosition): IEventStrategyResponse<N, E> => {
  //     // From map view
  //     const node = graph.getNearestNode(point);
  //     if (node && !node.isSelected()) {
  //       hoverNode(graph, node);
  //       return {
  //         isStateChanged: true,
  //         changedSubject: node,
  //       };
  //     }
  //
  //     if (!node) {
  //       const { changedCount } = unhoverAll(graph);
  //       return {
  //         isStateChanged: changedCount > 0,
  //       };
  //     }
  //
  //     return { isStateChanged: false };
  //   },
  // };
}

class DefaultEventStrategy<N extends INodeBase, E extends IEdgeBase> implements IEventStrategy<N, E> {
  lastHoveredNode?: INode<N, E>

  onMouseClick(graph: IGraph<N, E>, point: IPosition): IEventStrategyResponse<N, E> {
    const node = graph.getNearestNode(point)
    if (node) {
      selectNode(graph, node)
      return {
        isStateChanged: true,
        changedSubject: node,
      }
    }

    const edge = graph.getNearestEdge(point)
    if (edge) {
      selectEdge(graph, edge)
      return {
        isStateChanged: true,
        changedSubject: edge,
      }
    }

    const { changedCount } = unselectAll(graph)
    return {
      isStateChanged: changedCount > 0,
    }
  }

  onMouseMove(graph: IGraph<N, E>, point: IPosition): IEventStrategyResponse<N, E> {
    const node = graph.getNearestNode(point)
    if (node && !node.isSelected()) {
      if (node === this.lastHoveredNode) {
        return {
          isStateChanged: false,
        }
      }

      hoverNode(graph, node)
      this.lastHoveredNode = node
      return {
        isStateChanged: true,
        changedSubject: node,
      }
    }

    this.lastHoveredNode = undefined
    if (!node) {
      const { changedCount } = unhoverAll(graph)
      return {
        isStateChanged: changedCount > 0,
      }
    }

    return { isStateChanged: false }
  }
}

const selectNode = <N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>, node: INode<N, E>) => {
  unselectAll(graph)
  setNodeState(node, GraphObjectState.SELECTED, { isStateOverride: true })
}

const selectEdge = <N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>, edge: IEdge<N, E>) => {
  unselectAll(graph)
  setEdgeState(edge, GraphObjectState.SELECTED, { isStateOverride: true })
}

const unselectAll = <N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): { changedCount: number } => {
  const selectedNodes = graph.getNodes(node => node.isSelected())
  for (let i = 0; i < selectedNodes.length; i++) {
    selectedNodes[i].clearState()
  }

  const selectedEdges = graph.getEdges(edge => edge.isSelected())
  for (let i = 0; i < selectedEdges.length; i++) {
    selectedEdges[i].clearState()
  }

  return { changedCount: selectedNodes.length + selectedEdges.length }
}

const hoverNode = <N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>, node: INode<N, E>) => {
  unhoverAll(graph)
  setNodeState(node, GraphObjectState.HOVERED)
}

// const hoverEdge = <N extends INodeBase, E extends IEdgeBase>(graph: Graph<N, E>, edge: Edge<N, E>) => {
//   unhoverAll(graph);
//   setEdgeState(edge, GraphObjectState.HOVERED);
// };

const unhoverAll = <N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): { changedCount: number } => {
  const hoveredNodes = graph.getNodes(node => node.isHovered())
  for (let i = 0; i < hoveredNodes.length; i++) {
    hoveredNodes[i].clearState()
  }

  const hoveredEdges = graph.getEdges(edge => edge.isHovered())
  for (let i = 0; i < hoveredEdges.length; i++) {
    hoveredEdges[i].clearState()
  }

  return { changedCount: hoveredNodes.length + hoveredEdges.length }
}

interface ISetShapeStateOptions {
  isStateOverride: boolean
}

const setNodeState = <N extends INodeBase, E extends IEdgeBase>(
  node: INode<N, E>,
  state: number,
  options?: ISetShapeStateOptions
): void => {
  if (isStateChangeable(node, options)) {
    node.state = state
  }

  node.getInEdges().forEach(edge => {
    if (edge && isStateChangeable(edge, options)) {
      edge.state = state
    }
    if (edge.startNode && isStateChangeable(edge.startNode, options)) {
      edge.startNode.state = state
    }
  })

  node.getOutEdges().forEach(edge => {
    if (edge && isStateChangeable(edge, options)) {
      edge.state = state
    }
    if (edge.endNode && isStateChangeable(edge.endNode, options)) {
      edge.endNode.state = state
    }
  })
}

const setEdgeState = <N extends INodeBase, E extends IEdgeBase>(
  edge: IEdge<N, E>,
  state: number,
  options?: ISetShapeStateOptions
): void => {
  if (isStateChangeable(edge, options)) {
    edge.state = state
  }

  if (edge.startNode && isStateChangeable(edge.startNode, options)) {
    edge.startNode.state = state
  }

  if (edge.endNode && isStateChangeable(edge.endNode, options)) {
    edge.endNode.state = state
  }
}

const isStateChangeable = <N extends INodeBase, E extends IEdgeBase>(
  graphObject: INode<N, E> | IEdge<N, E>,
  options?: ISetShapeStateOptions
): boolean => {
  const isOverride = options?.isStateOverride
  return isOverride || (!isOverride && !graphObject.state)
}
import { IEdge, IEdgeBase, IEdgeStyle } from "./edge"
import { INode, INodeBase, INodeStyle } from "./node"
import { Color } from "../common"

const LABEL_PROPERTY_NAMES = ["label", "name"]

export const DEFAULT_NODE_STYLE: INodeStyle = {
  size: 5,
  color: new Color("#1d87c9"),
}

export const DEFAULT_EDGE_STYLE: IEdgeStyle = {
  color: new Color("#ababab"),
  width: 0.3,
}

export interface IGraphStyle<N extends INodeBase, E extends IEdgeBase> {
  getNodeStyle(node: INode<N, E>): INodeStyle | undefined
  getEdgeStyle(edge: IEdge<N, E>): IEdgeStyle | undefined
}

export const getDefaultGraphStyle = <N extends INodeBase, E extends IEdgeBase>(): IGraphStyle<N, E> => {
  return {
    getNodeStyle(node: INode<N, E>): INodeStyle {
      return { ...DEFAULT_NODE_STYLE, label: getPredefinedLabel(node) }
    },
    getEdgeStyle(edge: IEdge<N, E>): IEdgeStyle {
      return { ...DEFAULT_EDGE_STYLE, label: getPredefinedLabel(edge) }
    },
  }
}

const getPredefinedLabel = <N extends INodeBase, E extends IEdgeBase>(
  obj: INode<N, E> | IEdge<N, E>
): string | undefined => {
  for (let i = 0; i < LABEL_PROPERTY_NAMES.length; i++) {
    const value = (obj.data as any)[LABEL_PROPERTY_NAMES[i]]
    if (value !== undefined && value !== null) {
      return `${value}`
    }
  }
}
import { INodeBase } from "./node"
import { IEdge, IEdgeBase } from "./edge"

export const getEdgeOffsets = <N extends INodeBase, E extends IEdgeBase>(edges: IEdge<N, E>[]): number[] => {
  const edgeOffsets = new Array<number>(edges.length)
  const edgeOffsetsByUniqueKey = getEdgeOffsetsByUniqueKey(edges)

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]
    let offset = 0

    const uniqueKey = getUniqueEdgeKey(edge)
    const edgeOffsetsByKey = edgeOffsetsByUniqueKey[uniqueKey]
    if (edgeOffsetsByKey && edgeOffsetsByKey.length) {
      // Pull the first offset
      offset = edgeOffsetsByKey.shift() ?? 0

      const isEdgeReverseDirection = edge.end < edge.start
      if (isEdgeReverseDirection) {
        offset = -1 * offset
      }
    }

    edgeOffsets[i] = offset
  }

  return edgeOffsets
}

const getUniqueEdgeKey = <E extends IEdgeBase>(edge: E): string => {
  const sid = edge.start
  const tid = edge.end
  return sid < tid ? `${sid}-${tid}` : `${tid}-${sid}`
}

const getEdgeOffsetsByUniqueKey = <N extends INodeBase, E extends IEdgeBase>(
  edges: IEdge<N, E>[]
): Record<string, number[]> => {
  const edgeCountByUniqueKey: Record<string, number> = {}
  const loopbackUniqueKeys: Set<string> = new Set<string>()

  // Count the number of edges that are between the same nodes
  for (let i = 0; i < edges.length; i++) {
    const uniqueKey = getUniqueEdgeKey(edges[i])
    if (edges[i].start === edges[i].end) {
      loopbackUniqueKeys.add(uniqueKey)
    }
    edgeCountByUniqueKey[uniqueKey] = (edgeCountByUniqueKey[uniqueKey] ?? 0) + 1
  }

  const edgeOffsetsByUniqueKey: Record<string, number[]> = {}
  const uniqueKeys = Object.keys(edgeCountByUniqueKey)

  for (let i = 0; i < uniqueKeys.length; i++) {
    const uniqueKey = uniqueKeys[i]
    const edgeCount = edgeCountByUniqueKey[uniqueKey]

    // Loopback offsets should be 1, 2, 3, ...
    if (loopbackUniqueKeys.has(uniqueKey)) {
      edgeOffsetsByUniqueKey[uniqueKey] = Array.from({ length: edgeCount }, (_, i) => i + 1)
      continue
    }

    if (edgeCount <= 1) {
      continue
    }

    const edgeOffsets: number[] = []

    // 0 means straight line. There will be a straight line between two nodes
    // when there are 1 edge, 3 edges, 5 edges, ...
    if (edgeCount % 2 !== 0) {
      edgeOffsets.push(0)
    }

    for (let i = 2; i <= edgeCount; i += 2) {
      edgeOffsets.push(i / 2)
      edgeOffsets.push((i / 2) * -1)
    }

    edgeOffsetsByUniqueKey[uniqueKey] = edgeOffsets
  }

  return edgeOffsetsByUniqueKey
}
