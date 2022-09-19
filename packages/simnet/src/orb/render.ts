import { ZoomTransform, zoomIdentity } from 'd3-zoom';
import { IPosition, IRectangle } from '../../common';
import { INode, INodeBase, isNode } from '../../models/node';
import { IEdge, IEdgeBase } from '../../models/edge';
import { IGraph } from '../../models/graph';
import { drawEdge, IEdgeDrawOptions } from './edge';
import { drawNode, INodeDrawOptions } from './node';
import { Emitter } from '../../utils/emitter.utils';
import {
  DEFAULT_RENDERER_HEIGHT,
  DEFAULT_RENDERER_SETTINGS,
  DEFAULT_RENDERER_WIDTH,
  IRenderer,
  IRendererSettings,
  RendererEvents,
  RenderEventType,
} from '../shared';

const DEBUG = false;
const DEBUG_RED = '#FF5733';
const DEBUG_GREEN = '#3CFF33';
const DEBUG_BLUE = '#3383FF';
const DEBUG_PINK = '#F333FF';

export class CanvasRenderer extends Emitter<RendererEvents> implements IRenderer {
  // Contains the HTML5 Canvas element which is used for drawing nodes and edges.
  private readonly _context: CanvasRenderingContext2D;

  // Width and height of the canvas. Used for clearing
  public width: number;
  public height: number;
  public settings: IRendererSettings;

  // Includes translation (pan) in the x and y direction
  // as well as scaling (level of zoom).
  public transform: ZoomTransform;

  // Translates (0, 0) coordinates to (width/2, height/2).
  private _isOriginCentered = false;

  // False if renderer never rendered on canvas, otherwise true
  private _isInitiallyRendered = false;

  constructor(context: CanvasRenderingContext2D, settings?: Partial<IRendererSettings>) {
    super();
    this._context = context;
    this.width = DEFAULT_RENDERER_WIDTH;
    this.height = DEFAULT_RENDERER_HEIGHT;
    this.transform = zoomIdentity;
    this.settings = {
      ...DEFAULT_RENDERER_SETTINGS,
      ...settings,
    };
  }

  get isInitiallyRendered(): boolean {
    return this._isInitiallyRendered;
  }

  render<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>) {
    if (!graph.getNodeCount()) {
      return;
    }

    this.emit(RenderEventType.RENDER_START, undefined);
    const renderStartedAt = Date.now();

    // Clear drawing.
    this._context.clearRect(0, 0, this.width, this.height);
    this._context.save();

    if (DEBUG) {
      this._context.lineWidth = 3;
      this._context.fillStyle = DEBUG_RED;
      this._context.fillRect(0, 0, this.width, this.height);
    }

    // Apply any scaling (zoom) or translation (pan) transformations.
    this._context.translate(this.transform.x, this.transform.y);
    if (DEBUG) {
      this._context.fillStyle = DEBUG_BLUE;
      this._context.fillRect(0, 0, this.width, this.height);
    }

    this._context.scale(this.transform.k, this.transform.k);
    if (DEBUG) {
      this._context.fillStyle = DEBUG_GREEN;
      this._context.fillRect(0, 0, this.width, this.height);
    }

    // Move coordinates (0, 0) to canvas center.
    // Used in D3 graph, Map graph doesn't need centering.
    // This is only for display purposes, the simulation coordinates are still
    // relative to (0, 0), so any source mouse event position needs to take this
    // offset into account. (Handled in getMousePos())
    if (this._isOriginCentered) {
      this._context.translate(this.width / 2, this.height / 2);
    }
    if (DEBUG) {
      this._context.fillStyle = DEBUG_PINK;
      this._context.fillRect(0, 0, this.width, this.height);
    }

    this.drawObjects<N, E>(graph.getEdges());
    this.drawObjects<N, E>(graph.getNodes());

    this._context.restore();
    this.emit(RenderEventType.RENDER_END, { durationMs: Date.now() - renderStartedAt });
    this._isInitiallyRendered = true;
  }

  private drawObjects<N extends INodeBase, E extends IEdgeBase>(objects: (INode<N, E> | IEdge<N, E>)[]) {
    if (objects.length === 0) {
      return;
    }

    const selectedObjects: (INode<N, E> | IEdge<N, E>)[] = [];
    const hoveredObjects: (INode<N, E> | IEdge<N, E>)[] = [];

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.isSelected()) {
        selectedObjects.push(obj);
      }
      if (obj.isHovered()) {
        hoveredObjects.push(obj);
      }
    }
    const hasStateChangedShapes = selectedObjects.length || hoveredObjects.length;

    if (this.settings.contextAlphaOnEventIsEnabled && hasStateChangedShapes) {
      this._context.globalAlpha = this.settings.contextAlphaOnEvent;
    }

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj.isSelected() && !obj.isHovered()) {
        this.drawObject(obj, {
          isLabelEnabled: this.settings.labelsIsEnabled,
          isShadowEnabled: this.settings.shadowIsEnabled,
        });
      }
    }

    if (this.settings.contextAlphaOnEventIsEnabled && hasStateChangedShapes) {
      this._context.globalAlpha = 1;
    }

    for (let i = 0; i < selectedObjects.length; i++) {
      this.drawObject(selectedObjects[i], {
        isLabelEnabled: this.settings.labelsOnEventIsEnabled,
        isShadowEnabled: this.settings.shadowOnEventIsEnabled,
      });
    }
    for (let i = 0; i < hoveredObjects.length; i++) {
      this.drawObject(hoveredObjects[i], {
        isLabelEnabled: this.settings.labelsOnEventIsEnabled,
        isShadowEnabled: this.settings.shadowOnEventIsEnabled,
      });
    }
  }

  private drawObject<N extends INodeBase, E extends IEdgeBase>(
    obj: INode<N, E> | IEdge<N, E>,
    options?: Partial<INodeDrawOptions> | Partial<IEdgeDrawOptions>,
  ) {
    if (isNode(obj)) {
      drawNode(this._context, obj, options);
    } else {
      drawEdge(this._context, obj, options);
    }
  }

  reset() {
    this.transform = zoomIdentity;

    // Clear drawing.
    this._context.clearRect(0, 0, this.width, this.height);
    this._context.save();
  }

  getFitZoomTransform<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): ZoomTransform {
    // Graph view is a bounding box of the graph nodes that takes into
    // account node positions (x, y) and node sizes (style: size + border width)
    const graphView = graph.getBoundingBox();
    const graphMiddleX = graphView.x + graphView.width / 2;
    const graphMiddleY = graphView.y + graphView.height / 2;

    // Simulation view is actually a renderer view (canvas) but in the coordinate system of
    // the simulator: node position (x, y). We want to fit a graph view into a simulation view.
    const simulationView = this.getSimulationViewRectangle();

    const heightScale = simulationView.height / (graphView.height * (1 + this.settings.fitZoomMargin));
    const widthScale = simulationView.width / (graphView.width * (1 + this.settings.fitZoomMargin));
    // The scale of the translation and the zoom needed to fit a graph view
    // into a simulation view (renderer canvas)
    const scale = Math.min(heightScale, widthScale);

    const previousZoom = this.transform.k;
    const newZoom = Math.max(Math.min(scale * previousZoom, this.settings.maxZoom), this.settings.minZoom);
    // Translation is done in the following way for both coordinates:
    // - M = expected movement to the middle of the view (simulation width or height / 2)
    // - Z(-1) = previous zoom level
    // - S = scale to fit the graph view into simulation view
    // - Z(0) = new zoom level / Z(0) := S * Z(-1)
    // - GM = current middle coordinate of the graph view
    // Formula:
    // X/Y := M * Z(-1) - M * Z(-1) * Z(0) - GM * Z(0)
    // X/Y := M * Z(-1) * (1 - Z(0)) - GM * Z(0)
    const newX = (simulationView.width / 2) * previousZoom * (1 - newZoom) - graphMiddleX * newZoom;
    const newY = (simulationView.height / 2) * previousZoom * (1 - newZoom) - graphMiddleY * newZoom;

    return zoomIdentity.translate(newX, newY).scale(newZoom);
  }

  getSimulationPosition(canvasPoint: IPosition): IPosition {
    // By default, the canvas is translated by (width/2, height/2) to center the graph.
    // The simulation is not, it's starting coordinates are at (0, 0).
    // So any mouse click (C) needs to subtract that translation to match the
    // simulation coordinates (O) when dragging and hovering nodes.
    const [x, y] = this.transform.invert([canvasPoint.x, canvasPoint.y]);
    return {
      x: x - this.width / 2,
      y: y - this.height / 2,
    };
  }

  /**
   * Returns the visible rectangle view in the simulation coordinates.
   *
   * @return {IRectangle} Visible view in teh simulation coordinates
   */
  getSimulationViewRectangle(): IRectangle {
    const topLeftPosition = this.getSimulationPosition({ x: 0, y: 0 });
    const bottomRightPosition = this.getSimulationPosition({ x: this.width, y: this.height });
    return {
      x: topLeftPosition.x,
      y: topLeftPosition.y,
      width: bottomRightPosition.x - topLeftPosition.x,
      height: bottomRightPosition.y - topLeftPosition.y,
    };
  }

  translateOriginToCenter() {
    this._isOriginCentered = true;
  }
}
import { INodeBase } from '../../../models/node';
import { IEdge, EdgeCurved, EdgeLoopback, EdgeStraight, IEdgeBase } from '../../../models/edge';
import { IPosition } from '../../../common';
import { drawLabel, Label, LabelTextBaseline } from '../label';
import { drawCurvedLine, getCurvedArrowShape } from './types/edge-curved';
import { drawLoopbackLine, getLoopbackArrowShape } from './types/edge-loopback';
import { drawStraightLine, getStraightArrowShape } from './types/edge-straight';
import { IEdgeArrow } from './shared';

const DEFAULT_IS_SHADOW_DRAW_ENABLED = true;
const DEFAULT_IS_LABEL_DRAW_ENABLED = true;

export interface IEdgeDrawOptions {
  isShadowEnabled: boolean;
  isLabelEnabled: boolean;
}

export const drawEdge = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: IEdge<N, E>,
  options?: Partial<IEdgeDrawOptions>,
) => {
  if (!edge.getWidth()) {
    return;
  }

  const isShadowEnabled = options?.isShadowEnabled ?? DEFAULT_IS_SHADOW_DRAW_ENABLED;
  const isLabelEnabled = options?.isLabelEnabled ?? DEFAULT_IS_LABEL_DRAW_ENABLED;
  const hasShadow = edge.hasShadow();

  setupCanvas(context, edge);
  if (isShadowEnabled && hasShadow) {
    setupShadow(context, edge);
  }
  drawArrow(context, edge);
  drawLine(context, edge);
  if (isShadowEnabled && hasShadow) {
    clearShadow(context, edge);
  }

  if (isLabelEnabled) {
    drawEdgeLabel(context, edge);
  }
};

const drawEdgeLabel = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: IEdge<N, E>,
) => {
  const edgeLabel = edge.getLabel();
  if (!edgeLabel) {
    return;
  }

  const label = new Label(edgeLabel, {
    position: edge.getCenter(),
    textBaseline: LabelTextBaseline.MIDDLE,
    properties: {
      fontBackgroundColor: edge.style.fontBackgroundColor,
      fontColor: edge.style.fontColor,
      fontFamily: edge.style.fontFamily,
      fontSize: edge.style.fontSize,
    },
  });
  drawLabel(context, label);
};

const drawLine = <N extends INodeBase, E extends IEdgeBase>(context: CanvasRenderingContext2D, edge: IEdge<N, E>) => {
  if (edge instanceof EdgeStraight) {
    return drawStraightLine(context, edge);
  }
  if (edge instanceof EdgeCurved) {
    return drawCurvedLine(context, edge);
  }
  if (edge instanceof EdgeLoopback) {
    return drawLoopbackLine(context, edge);
  }

  throw new Error('Failed to draw unsupported edge type');
};

const drawArrow = <N extends INodeBase, E extends IEdgeBase>(context: CanvasRenderingContext2D, edge: IEdge<N, E>) => {
  if (edge.style.arrowSize === 0) {
    return;
  }

  const arrowShape = getArrowShape(edge);

  // Normalized points of closed path, in the order that they should be drawn.
  // (0, 0) is the attachment point, and the point around which should be rotated
  const keyPoints: IPosition[] = [
    { x: 0, y: 0 },
    { x: -1, y: 0.4 },
    // { x: -0.9, y: 0 },
    { x: -1, y: -0.4 },
  ];

  const points = transformArrowPoints(keyPoints, arrowShape);

  context.beginPath();
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0) {
      context.moveTo(point.x, point.y);
      continue;
    }
    context.lineTo(point.x, point.y);
  }
  context.closePath();
  context.fill();
};

const getArrowShape = <N extends INodeBase, E extends IEdgeBase>(edge: IEdge<N, E>): IEdgeArrow => {
  if (edge instanceof EdgeStraight) {
    return getStraightArrowShape(edge);
  }
  if (edge instanceof EdgeCurved) {
    return getCurvedArrowShape(edge);
  }
  if (edge instanceof EdgeLoopback) {
    return getLoopbackArrowShape(edge);
  }

  throw new Error('Failed to draw unsupported edge type');
};

const setupCanvas = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: IEdge<N, E>,
) => {
  const width = edge.getWidth();
  if (width > 0) {
    context.lineWidth = width;
  }

  const color = edge.getColor();
  // context.fillStyle is set for the sake of arrow colors
  if (color) {
    context.strokeStyle = color.toString();
    context.fillStyle = color.toString();
  }
};

const setupShadow = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: IEdge<N, E>,
) => {
  if (edge.style.shadowColor) {
    context.shadowColor = edge.style.shadowColor.toString();
  }
  if (edge.style.shadowSize) {
    context.shadowBlur = edge.style.shadowSize;
  }
  if (edge.style.shadowOffsetX) {
    context.shadowOffsetX = edge.style.shadowOffsetX;
  }
  if (edge.style.shadowOffsetY) {
    context.shadowOffsetY = edge.style.shadowOffsetY;
  }
};

const clearShadow = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: IEdge<N, E>,
) => {
  if (edge.style.shadowColor) {
    context.shadowColor = 'rgba(0,0,0,0)';
  }
  if (edge.style.shadowSize) {
    context.shadowBlur = 0;
  }
  if (edge.style.shadowOffsetX) {
    context.shadowOffsetX = 0;
  }
  if (edge.style.shadowOffsetY) {
    context.shadowOffsetY = 0;
  }
};

/**
 * Apply transformation on points for display.
 *
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/edges/util/end-points.ts}
 *
 * The following is done:
 * - rotate by the specified angle
 * - multiply the (normalized) coordinates by the passed length
 * - offset by the target coordinates
 *
 * @param {IPosition[]} points Arrow points
 * @param {IEdgeArrow} arrow Angle and length of the arrow shape
 * @return {IPosition[]} Transformed arrow points
 */
const transformArrowPoints = (points: IPosition[], arrow: IEdgeArrow): IPosition[] => {
  const x = arrow.point.x;
  const y = arrow.point.y;
  const angle = arrow.angle;
  const length = arrow.length;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const xt = p.x * Math.cos(angle) - p.y * Math.sin(angle);
    const yt = p.x * Math.sin(angle) + p.y * Math.cos(angle);

    p.x = x + length * xt;
    p.y = y + length * yt;
  }

  return points;
};
export { drawEdge, IEdgeDrawOptions } from './base';
import { IPosition } from '../../../common';

export interface IBorderPosition extends IPosition {
  t: number;
}

export interface IEdgeArrow {
  point: IBorderPosition;
  core: IPosition;
  angle: number;
  length: number;
}
import { INode, INodeBase } from '../../../../models/node';
import { EdgeCurved, IEdgeBase } from '../../../../models/edge';
import { IBorderPosition, IEdgeArrow } from '../shared';
import { IPosition } from '../../../../common';

export const drawCurvedLine = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: EdgeCurved<N, E>,
) => {
  const sourcePoint = edge.startNode.getCenter();
  const targetPoint = edge.endNode.getCenter();
  if (!sourcePoint || !targetPoint) {
    return;
  }

  const controlPoint = edge.getCurvedControlPoint();

  context.beginPath();
  context.moveTo(sourcePoint.x, sourcePoint.y);
  context.quadraticCurveTo(controlPoint.x, controlPoint.y, targetPoint.x, targetPoint.y);
  context.stroke();
};

/**
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/Edge.js}
 *
 * @param {EdgeCurved} edge Edge
 * @return {IEdgeArrow} Arrow shape
 */
export const getCurvedArrowShape = <N extends INodeBase, E extends IEdgeBase>(edge: EdgeCurved<N, E>): IEdgeArrow => {
  const scaleFactor = edge.style.arrowSize ?? 1;
  const lineWidth = edge.getWidth() ?? 1;
  const guideOffset = -0.1;
  // const source = this.data.source;
  const target = edge.endNode;

  const controlPoint = edge.getCurvedControlPoint();
  const arrowPoint = findBorderPoint(edge, target);
  const guidePos = getPointBrezier(edge, Math.max(0.0, Math.min(1.0, arrowPoint.t + guideOffset)), controlPoint);
  const angle = Math.atan2(arrowPoint.y - guidePos.y, arrowPoint.x - guidePos.x);

  const length = 1.5 * scaleFactor + 3 * lineWidth; // 3* lineWidth is the width of the edge.

  const xi = arrowPoint.x - length * 0.9 * Math.cos(angle);
  const yi = arrowPoint.y - length * 0.9 * Math.sin(angle);
  const arrowCore = { x: xi, y: yi };

  return { point: arrowPoint, core: arrowCore, angle, length };
};

/**
 * Combined function of pointOnLine and pointOnBezier. This gives the coordinates of a
 * point on the line at a certain percentage of the way
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/edges/util/bezier-edge-base.ts}
 *
 * @param {EdgeCurved} edge Edge
 * @param {number} percentage Percentage of the line to get position from
 * @param {IPosition} viaNode Brezier node on the curved line
 * @return {IPosition} Position on the line
 */
const getPointBrezier = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeCurved<N, E>,
  percentage: number,
  viaNode: IPosition,
): IPosition => {
  const sourcePoint = edge.startNode.getCenter();
  const targetPoint = edge.endNode.getCenter();
  if (!sourcePoint || !targetPoint) {
    return { x: 0, y: 0 };
  }

  const t = percentage;
  const x = Math.pow(1 - t, 2) * sourcePoint.x + 2 * t * (1 - t) * viaNode.x + Math.pow(t, 2) * targetPoint.x;
  const y = Math.pow(1 - t, 2) * sourcePoint.y + 2 * t * (1 - t) * viaNode.y + Math.pow(t, 2) * targetPoint.y;

  return { x: x, y: y };
};

/**
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/edges/util/bezier-edge-base.ts}
 *
 * @param {EdgeCurved} edge Edge
 * @param {INode} nearNode Node close to the edge
 * @return {IBorderPosition} Position on the border of the node
 */
const findBorderPoint = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeCurved<N, E>,
  nearNode: INode<N, E>,
): IBorderPosition => {
  const maxIterations = 10;
  let iteration = 0;
  let low = 0;
  let high = 1;
  let pos: IBorderPosition = { x: 0, y: 0, t: 0 };
  // let angle;
  let distanceToBorder;
  let distanceToPoint;
  let difference;
  const threshold = 0.2;
  const viaNode = edge.getCurvedControlPoint();
  let node = edge.endNode;
  let from = false;
  if (nearNode.id === edge.startNode.id) {
    node = edge.startNode;
    from = true;
  }

  const nodePoints = node.getCenter();

  let middle;
  while (low <= high && iteration < maxIterations) {
    middle = (low + high) * 0.5;

    pos = { ...getPointBrezier(edge, middle, viaNode), t: 0 };
    // angle = Math.atan2(nodePoints.y - pos.y, nodePoints.x - pos.x);
    // distanceToBorder = node.getDistanceToBorder(angle);
    distanceToBorder = node.getDistanceToBorder();
    distanceToPoint = Math.sqrt(Math.pow(pos.x - nodePoints.x, 2) + Math.pow(pos.y - nodePoints.y, 2));
    difference = distanceToBorder - distanceToPoint;
    if (Math.abs(difference) < threshold) {
      break; // found
    }

    // distance to nodes is larger than distance to border --> t needs to be bigger if we're looking at the to node.
    if (difference < 0) {
      if (from === false) {
        low = middle;
      } else {
        high = middle;
      }
    } else {
      if (from === false) {
        high = middle;
      } else {
        low = middle;
      }
    }

    iteration++;
  }
  pos.t = middle ?? 0;

  return pos;
};
import { INode, INodeBase } from '../../../../models/node';
import { EdgeLoopback, IEdgeBase } from '../../../../models/edge';
import { IBorderPosition, IEdgeArrow } from '../shared';
import { ICircle, IPosition } from '../../../../common';

export const drawLoopbackLine = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: EdgeLoopback<N, E>,
) => {
  // Draw line from a node to the same node!
  const { x, y, radius } = edge.getCircularData();

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.closePath();
  context.stroke();
};

/**
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/Edge.js}
 *
 * @param {EdgeLoopback} edge Edge
 * @return {IEdgeArrow} Arrow shape
 */
export const getLoopbackArrowShape = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeLoopback<N, E>,
): IEdgeArrow => {
  const scaleFactor = edge.style.arrowSize ?? 1;
  const lineWidth = edge.getWidth() ?? 1;
  const source = edge.startNode;
  // const target = this.data.target;

  const arrowPoint = findBorderPoint(edge, source);
  const angle = arrowPoint.t * -2 * Math.PI + 0.45 * Math.PI;

  const length = 1.5 * scaleFactor + 3 * lineWidth; // 3* lineWidth is the width of the edge.

  const xi = arrowPoint.x - length * 0.9 * Math.cos(angle);
  const yi = arrowPoint.y - length * 0.9 * Math.sin(angle);
  const arrowCore = { x: xi, y: yi };

  return { point: arrowPoint, core: arrowCore, angle, length };
};

/**
 * Get a point on a circle
 * @param {ICircle} circle
 * @param {number} percentage - Value between 0 (line start) and 1 (line end)
 * @return {IPosition} Position on the circle
 * @private
 */
const pointOnCircle = (circle: ICircle, percentage: number): IPosition => {
  const angle = percentage * 2 * Math.PI;
  return {
    x: circle.x + circle.radius * Math.cos(angle),
    y: circle.y - circle.radius * Math.sin(angle),
  };
};

const findBorderPoint = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeLoopback<N, E>,
  nearNode: INode<N, E>,
): IBorderPosition => {
  const circle = edge.getCircularData();
  const options = { low: 0.6, high: 1.0, direction: 1 };

  let low = options.low;
  let high = options.high;
  const direction = options.direction;

  const maxIterations = 10;
  let iteration = 0;
  let pos: IBorderPosition = { x: 0, y: 0, t: 0 };
  // let angle;
  let distanceToBorder;
  let distanceToPoint;
  let difference;
  const threshold = 0.05;
  let middle = (low + high) * 0.5;

  const nearNodePoint = nearNode.getCenter();

  while (low <= high && iteration < maxIterations) {
    middle = (low + high) * 0.5;

    pos = { ...pointOnCircle(circle, middle), t: 0 };
    // angle = Math.atan2(nearNodePoint.y - pos.y, nearNodePoint.x - pos.x);
    // distanceToBorder = nearNode.getDistanceToBorder(angle);
    distanceToBorder = nearNode.getDistanceToBorder();
    distanceToPoint = Math.sqrt(Math.pow(pos.x - nearNodePoint.x, 2) + Math.pow(pos.y - nearNodePoint.y, 2));
    difference = distanceToBorder - distanceToPoint;
    if (Math.abs(difference) < threshold) {
      break; // found
    }
    // distance to nodes is larger than distance to border --> t needs to be bigger if we're looking at the to node.
    if (difference > 0) {
      if (direction > 0) {
        low = middle;
      } else {
        high = middle;
      }
    } else {
      if (direction > 0) {
        high = middle;
      } else {
        low = middle;
      }
    }
    iteration++;
  }
  pos.t = middle ?? 0;

  return pos;
};
import { INodeBase, INode } from '../../../../models/node';
import { EdgeStraight, IEdgeBase } from '../../../../models/edge';
import { IBorderPosition, IEdgeArrow } from '../shared';

export const drawStraightLine = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  edge: EdgeStraight<N, E>,
) => {
  // Default line is the straight line
  const sourcePoint = edge.startNode.getCenter();
  const targetPoint = edge.endNode.getCenter();
  // TODO @toni: make getCenter to return undefined?!
  if (!sourcePoint || !targetPoint) {
    return;
  }

  context.beginPath();
  context.moveTo(sourcePoint.x, sourcePoint.y);
  context.lineTo(targetPoint.x, targetPoint.y);
  context.stroke();
};

/**
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/Edge.js}
 *
 * @param {EdgeStraight} edge Edge
 * @return {IEdgeArrow} Arrow shape
 */
export const getStraightArrowShape = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeStraight<N, E>,
): IEdgeArrow => {
  const scaleFactor = edge.style.arrowSize ?? 1;
  const lineWidth = edge.getWidth() ?? 1;
  const sourcePoint = edge.startNode.getCenter();
  const targetPoint = edge.endNode.getCenter();

  const angle = Math.atan2(targetPoint.y - sourcePoint.y, targetPoint.x - sourcePoint.x);
  const arrowPoint = findBorderPoint(edge, edge.endNode);

  const length = 1.5 * scaleFactor + 3 * lineWidth; // 3* lineWidth is the width of the edge.

  const xi = arrowPoint.x - length * 0.9 * Math.cos(angle);
  const yi = arrowPoint.y - length * 0.9 * Math.sin(angle);
  const arrowCore = { x: xi, y: yi };

  return { point: arrowPoint, core: arrowCore, angle, length };
};

/**
 * @see {@link https://github.com/visjs/vis-network/blob/master/lib/network/modules/components/edges/straight-edge.ts}
 *
 * @param {EdgeStraight} edge Edge
 * @param {INode} nearNode Node close to the edge
 * @return {IBorderPosition} Position on the border of the node
 */
const findBorderPoint = <N extends INodeBase, E extends IEdgeBase>(
  edge: EdgeStraight<N, E>,
  nearNode: INode<N, E>,
): IBorderPosition => {
  let endNode = edge.endNode;
  let startNode = edge.startNode;
  if (nearNode.id === edge.startNode.id) {
    endNode = edge.startNode;
    startNode = edge.endNode;
  }

  const endNodePoints = endNode.getCenter();
  const startNodePoints = startNode.getCenter();

  // const angle = Math.atan2(endNodePoints.y - startNodePoints.y, endNodePoints.x - startNodePoints.x);
  const dx = endNodePoints.x - startNodePoints.x;
  const dy = endNodePoints.y - startNodePoints.y;
  const edgeSegmentLength = Math.sqrt(dx * dx + dy * dy);
  // const toBorderDist = nearNode.getDistanceToBorder(angle);
  const toBorderDist = nearNode.getDistanceToBorder();
  const toBorderPoint = (edgeSegmentLength - toBorderDist) / edgeSegmentLength;

  return {
    x: (1 - toBorderPoint) * startNodePoints.x + toBorderPoint * endNodePoints.x,
    y: (1 - toBorderPoint) * startNodePoints.y + toBorderPoint * endNodePoints.y,
    t: 0,
  };
};
import { IPosition, Color } from '../../common';

const DEFAULT_FONT_FAMILY = 'Roboto, sans-serif';
const DEFAULT_FONT_SIZE = 4;
const DEFAULT_FONT_COLOR = '#000000';

const FONT_BACKGROUND_MARGIN = 0.12;
const FONT_LINE_SPACING = 1.2;

export enum LabelTextBaseline {
  TOP = 'top',
  MIDDLE = 'middle',
}

export interface ILabelProperties {
  fontBackgroundColor: Color | string;
  fontColor: Color | string;
  fontFamily: string;
  fontSize: number;
}

export interface ILabelData {
  textBaseline: LabelTextBaseline;
  position: IPosition;
  properties: Partial<ILabelProperties>;
}

export class Label {
  public readonly text: string;
  public readonly textLines: string[] = [];
  public readonly position: IPosition;
  public readonly properties: Partial<ILabelProperties>;
  public readonly fontSize: number = DEFAULT_FONT_SIZE;
  public readonly fontFamily: string = getFontFamily(DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY);
  public readonly textBaseline: LabelTextBaseline;

  constructor(text: string, data: ILabelData) {
    this.text = `${text === undefined ? '' : text}`;
    this.textLines = splitTextLines(this.text);
    this.position = data.position;
    this.properties = data.properties;
    this.textBaseline = data.textBaseline;

    if (this.properties.fontSize !== undefined || this.properties.fontFamily) {
      this.fontSize = Math.max(this.properties.fontSize ?? 0, 0);
      this.fontFamily = getFontFamily(this.fontSize, this.properties.fontFamily ?? DEFAULT_FONT_FAMILY);
    }

    this._fixPosition();
  }

  private _fixPosition() {
    if (this.textBaseline === LabelTextBaseline.MIDDLE && this.textLines.length) {
      const halfLineSpacingCount = Math.floor(this.textLines.length / 2);
      const halfLineCount = (this.textLines.length - 1) / 2;
      this.position.y -= halfLineCount * this.fontSize - halfLineSpacingCount * (FONT_LINE_SPACING - 1);
    }
  }
}

export const drawLabel = (context: CanvasRenderingContext2D, label: Label) => {
  const isDrawable = label.textLines.length > 0 && label.fontSize > 0;
  if (!isDrawable || !label.position) {
    return;
  }

  drawTextBackground(context, label);
  drawText(context, label);
};

const drawTextBackground = (context: CanvasRenderingContext2D, label: Label) => {
  if (!label.properties.fontBackgroundColor || !label.position) {
    return;
  }

  context.fillStyle = label.properties.fontBackgroundColor.toString();
  const margin = label.fontSize * FONT_BACKGROUND_MARGIN;
  const height = label.fontSize + 2 * margin;
  const lineHeight = label.fontSize * FONT_LINE_SPACING;
  const baselineHeight = label.textBaseline === LabelTextBaseline.MIDDLE ? label.fontSize / 2 : 0;

  for (let i = 0; i < label.textLines.length; i++) {
    const line = label.textLines[i];
    const width = context.measureText(line).width + 2 * margin;
    context.fillRect(
      label.position.x - width / 2,
      label.position.y - baselineHeight - margin + i * lineHeight,
      width,
      height,
    );
  }
};

const drawText = (context: CanvasRenderingContext2D, label: Label) => {
  if (!label.position) {
    return;
  }

  context.fillStyle = (label.properties.fontColor ?? DEFAULT_FONT_COLOR).toString();
  context.font = label.fontFamily;
  context.textBaseline = label.textBaseline;
  context.textAlign = 'center';
  const lineHeight = label.fontSize * FONT_LINE_SPACING;

  for (let i = 0; i < label.textLines.length; i++) {
    const line = label.textLines[i];
    context.fillText(line, label.position.x, label.position.y + i * lineHeight);
  }
};

const getFontFamily = (fontSize: number, fontFamily: string): string => {
  return `${fontSize}px ${fontFamily}`;
};

const splitTextLines = (text: string): string[] => {
  const lines = text.split('\n');
  const trimmedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimLine = lines[i].trim();
    trimmedLines.push(trimLine);
  }

  return trimmedLines;
};
import { INodeBase, INode, NodeShapeType } from '../../models/node';
import { IEdgeBase } from '../../models/edge';
import { drawDiamond, drawHexagon, drawSquare, drawStar, drawTriangleDown, drawTriangleUp, drawCircle } from './shapes';
import { drawLabel, Label, LabelTextBaseline } from './label';

// The label will be `X` of the size below the Node
const DEFAULT_LABEL_DISTANCE_SIZE_FROM_NODE = 0.2;
const DEFAULT_IS_SHADOW_DRAW_ENABLED = true;
const DEFAULT_IS_LABEL_DRAW_ENABLED = true;

export interface INodeDrawOptions {
  isShadowEnabled: boolean;
  isLabelEnabled: boolean;
}

export const drawNode = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
  options?: Partial<INodeDrawOptions>,
) => {
  const isShadowEnabled = options?.isShadowEnabled ?? DEFAULT_IS_SHADOW_DRAW_ENABLED;
  const isLabelEnabled = options?.isLabelEnabled ?? DEFAULT_IS_LABEL_DRAW_ENABLED;
  const hasShadow = node.hasShadow();

  setupCanvas(context, node);
  if (isShadowEnabled && hasShadow) {
    setupShadow(context, node);
  }

  drawShape(context, node);
  context.fill();

  const image = node.getBackgroundImage();
  if (image) {
    drawImage(context, node, image);
  }

  if (isShadowEnabled && hasShadow) {
    clearShadow(context, node);
  }

  if (node.hasBorder()) {
    context.stroke();
  }

  if (isLabelEnabled) {
    drawNodeLabel(context, node);
  }
};

const drawShape = <N extends INodeBase, E extends IEdgeBase>(context: CanvasRenderingContext2D, node: INode<N, E>) => {
  // Default shape is the circle
  const center = node.getCenter();
  const radius = node.getRadius();

  switch (node.style.shape) {
    case NodeShapeType.SQUARE: {
      drawSquare(context, center.x, center.y, radius);
      break;
    }
    case NodeShapeType.DIAMOND: {
      drawDiamond(context, center.x, center.y, radius);
      break;
    }
    case NodeShapeType.TRIANGLE: {
      drawTriangleUp(context, center.x, center.y, radius);
      break;
    }
    case NodeShapeType.TRIANGLE_DOWN: {
      drawTriangleDown(context, center.x, center.y, radius);
      break;
    }
    case NodeShapeType.STAR: {
      drawStar(context, center.x, center.y, radius);
      break;
    }
    case NodeShapeType.HEXAGON: {
      drawHexagon(context, center.x, center.y, radius);
      break;
    }
    default: {
      drawCircle(context, center.x, center.y, radius);
      break;
    }
  }
};

const drawNodeLabel = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
) => {
  const nodeLabel = node.getLabel();
  if (!nodeLabel) {
    return;
  }

  const center = node.getCenter();
  const distance = node.getBorderedRadius() * (1 + DEFAULT_LABEL_DISTANCE_SIZE_FROM_NODE);

  const label = new Label(nodeLabel, {
    position: { x: center.x, y: center.y + distance },
    textBaseline: LabelTextBaseline.TOP,
    properties: {
      fontBackgroundColor: node.style.fontBackgroundColor,
      fontColor: node.style.fontColor,
      fontFamily: node.style.fontFamily,
      fontSize: node.style.fontSize,
    },
  });
  drawLabel(context, label);
};

const drawImage = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
  image: HTMLImageElement,
) => {
  if (!image.width || !image.height) {
    return;
  }

  const center = node.getCenter();
  const radius = node.getRadius();

  const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
  const height = image.height * scale;
  const width = image.width * scale;

  context.save();
  context.clip();
  context.drawImage(image, center.x - width / 2, center.y - height / 2, width, height);
  context.restore();
};

const setupCanvas = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
) => {
  const hasBorder = node.hasBorder();

  if (hasBorder) {
    context.lineWidth = node.getBorderWidth();
    const borderColor = node.getBorderColor();
    if (borderColor) {
      context.strokeStyle = borderColor.toString();
    }
  }

  const color = node.getColor();
  if (color) {
    context.fillStyle = color.toString();
  }
};

const setupShadow = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
) => {
  if (node.style.shadowColor) {
    context.shadowColor = node.style.shadowColor.toString();
  }
  if (node.style.shadowSize) {
    context.shadowBlur = node.style.shadowSize;
  }
  if (node.style.shadowOffsetX) {
    context.shadowOffsetX = node.style.shadowOffsetX;
  }
  if (node.style.shadowOffsetY) {
    context.shadowOffsetY = node.style.shadowOffsetY;
  }
};

const clearShadow = <N extends INodeBase, E extends IEdgeBase>(
  context: CanvasRenderingContext2D,
  node: INode<N, E>,
) => {
  if (node.style.shadowColor) {
    context.shadowColor = 'rgba(0,0,0,0)';
  }
  if (node.style.shadowSize) {
    context.shadowBlur = 0;
  }
  if (node.style.shadowOffsetX) {
    context.shadowOffsetX = 0;
  }
  if (node.style.shadowOffsetY) {
    context.shadowOffsetY = 0;
  }
};
/**
 * Draws a circle shape.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Radius
 */
export const drawCircle = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.closePath();
};

/**
 * Draws a square shape.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Size (width and height) of the square
 */
export const drawSquare = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  context.beginPath();
  context.rect(x - r, y - r, r * 2, r * 2);
  context.closePath();
};

/**
 * Draws a triangle shape.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Radius, half the length of the sides of the triangle
 */
export const drawTriangleUp = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  // http://en.wikipedia.org/wiki/Equilateral_triangle
  context.beginPath();

  // the change in radius and the offset is here to center the shape
  r *= 1.15;
  y += 0.275 * r;

  const diameter = r * 2;
  const innerRadius = (Math.sqrt(3) * diameter) / 6;
  const height = Math.sqrt(diameter * diameter - r * r);

  context.moveTo(x, y - (height - innerRadius));
  context.lineTo(x + r, y + innerRadius);
  context.lineTo(x - r, y + innerRadius);
  context.lineTo(x, y - (height - innerRadius));
  context.closePath();
};

/**
 * Draws a triangle shape in downward orientation.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Radius, half the length of the sides of the triangle
 */
export const drawTriangleDown = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  // http://en.wikipedia.org/wiki/Equilateral_triangle
  context.beginPath();

  // the change in radius and the offset is here to center the shape
  r *= 1.15;
  y -= 0.275 * r;

  const diameter = r * 2;
  const innerRadius = (Math.sqrt(3) * diameter) / 6;
  const height = Math.sqrt(diameter * diameter - r * r);

  context.moveTo(x, y + (height - innerRadius));
  context.lineTo(x + r, y - innerRadius);
  context.lineTo(x - r, y - innerRadius);
  context.lineTo(x, y + (height - innerRadius));
  context.closePath();
};

/**
 * Draw a star shape, a star with 5 points.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Radius, half the length of the sides of the triangle
 */
export const drawStar = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  // http://www.html5canvastutorials.com/labs/html5-canvas-star-spinner/
  context.beginPath();

  // the change in radius and the offset is here to center the shape
  r *= 0.82;
  y += 0.1 * r;

  for (let n = 0; n < 10; n++) {
    const radius = r * (n % 2 === 0 ? 1.3 : 0.5);
    const newx = x + radius * Math.sin((n * 2 * Math.PI) / 10);
    const newy = y - radius * Math.cos((n * 2 * Math.PI) / 10);
    context.lineTo(newx, newy);
  }

  context.closePath();
};

/**
 * Draws a Diamond shape.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} r Radius, half the length of the sides of the triangle
 */
export const drawDiamond = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  // http://www.html5canvastutorials.com/labs/html5-canvas-star-spinner/
  context.beginPath();

  context.lineTo(x, y + r);
  context.lineTo(x + r, y);
  context.lineTo(x, y - r);
  context.lineTo(x - r, y);

  context.closePath();
};

/**
 * Draws a rounded rectangle.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 * @see {@link http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} w Width
 * @param {number} h Height
 * @param {number} r Border radius
 */
export const drawRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const r2d = Math.PI / 180;

  // ensure that the radius isn't too large for x
  if (w - 2 * r < 0) {
    r = w / 2;
  }

  // ensure that the radius isn't too large for y
  if (h - 2 * r < 0) {
    r = h / 2;
  }

  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.arc(x + w - r, y + r, r, r2d * 270, r2d * 360, false);
  context.lineTo(x + w, y + h - r);
  context.arc(x + w - r, y + h - r, r, 0, r2d * 90, false);
  context.lineTo(x + r, y + h);
  context.arc(x + r, y + h - r, r, r2d * 90, r2d * 180, false);
  context.lineTo(x, y + r);
  context.arc(x + r, y + r, r, r2d * 180, r2d * 270, false);
  context.closePath();
};

/**
 * Draws an ellipse.
 * @see {@link https://github.com/almende/vis/blob/master/lib/network/shapes.js}
 * @see {@link http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas}
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {number} x Horizontal center
 * @param {number} y Vertical center
 * @param {number} w Width
 * @param {number} h Height
 */
export const drawEllipse = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const kappa = 0.5522848;
  const ox = (w / 2) * kappa; // control point offset horizontal
  const oy = (h / 2) * kappa; // control point offset vertical
  const xend = x + w;
  const yend = y + h;
  const xmiddle = x + w / 2;
  const ymiddle = y + h / 2;

  context.beginPath();
  context.moveTo(x, ymiddle);
  context.bezierCurveTo(x, ymiddle - oy, xmiddle - ox, y, xmiddle, y);
  context.bezierCurveTo(xmiddle + ox, y, xend, ymiddle - oy, xend, ymiddle);
  context.bezierCurveTo(xend, ymiddle + oy, xmiddle + ox, yend, xmiddle, yend);
  context.bezierCurveTo(xmiddle - ox, yend, x, ymiddle + oy, x, ymiddle);
  context.closePath();
};

/**
 * Draws a Hexagon shape with 6 sides.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {Number} x Horizontal center
 * @param {Number} y Vertical center
 * @param {Number} r Radius
 */
export const drawHexagon = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  drawNgon(context, x, y, r, 6);
};

/**
 * Draws a N-gon shape with N sides.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context
 * @param {Number} x Horizontal center
 * @param {Number} y Vertical center
 * @param {Number} r Radius
 * @param {Number} sides Number of sides
 */
export const drawNgon = (context: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number) => {
  context.beginPath();
  context.moveTo(x + r, y);

  const arcSide = (Math.PI * 2) / sides;
  for (let i = 1; i < sides; i++) {
    context.lineTo(x + r * Math.cos(arcSide * i), y + r * Math.sin(arcSide * i));
  }

  context.closePath();
};
import { CanvasRenderer } from './canvas/canvas-renderer';
import { IRenderer, IRendererSettings, RendererType } from './shared';
import { WebGLRenderer } from './webgl/webgl-renderer';
import { OrbError } from '../exceptions';

export class RendererFactory {
  static getRenderer(
    canvas: HTMLCanvasElement,
    type: RendererType = RendererType.CANVAS,
    settings?: Partial<IRendererSettings>,
  ): IRenderer {
    if (type === RendererType.WEBGL) {
      const context = canvas.getContext('webgl2');
      if (!context) {
        throw new OrbError('Failed to create WebGL context.');
      }
      return new WebGLRenderer(context, settings);
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new OrbError('Failed to create Canvas context.');
    }
    return new CanvasRenderer(context, settings);
  }
}
import { ZoomTransform } from 'd3-zoom';
import { IPosition, IRectangle } from '../common';
import { INodeBase } from '../models/node';
import { IEdgeBase } from '../models/edge';
import { IGraph } from '../models/graph';
import { IEmitter } from '../utils/emitter.utils';

export enum RendererType {
  CANVAS = 'canvas',
  WEBGL = 'webgl',
}

export enum RenderEventType {
  RENDER_START = 'render-start',
  RENDER_END = 'render-end',
}

export interface IRendererSettings {
  minZoom: number;
  maxZoom: number;
  fitZoomMargin: number;
  labelsIsEnabled: boolean;
  labelsOnEventIsEnabled: boolean;
  shadowIsEnabled: boolean;
  shadowOnEventIsEnabled: boolean;
  contextAlphaOnEvent: number;
  contextAlphaOnEventIsEnabled: boolean;
}

export interface IRendererSettingsInit extends IRendererSettings {
  type: RendererType;
}

export interface IRenderer
  extends IEmitter<{
    [RenderEventType.RENDER_START]: undefined;
    [RenderEventType.RENDER_END]: { durationMs: number };
  }> {
  // Width and height of the canvas. Used for clearing.
  width: number;
  height: number;
  settings: IRendererSettings;

  // Includes translation (pan) in the x and y direction
  // as well as scaling (level of zoom).
  transform: ZoomTransform;

  get isInitiallyRendered(): boolean;

  render<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): void;

  reset(): void;

  getFitZoomTransform<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): ZoomTransform;

  getSimulationPosition(canvasPoint: IPosition): IPosition;

  /**
   * Returns the visible rectangle view in the simulation coordinates.
   *
   * @return {IRectangle} Visible view in teh simulation coordinates
   */
  getSimulationViewRectangle(): IRectangle;

  translateOriginToCenter(): void;
}

export const DEFAULT_RENDERER_SETTINGS: IRendererSettings = {
  minZoom: 0.25,
  maxZoom: 8,
  fitZoomMargin: 0.2,
  labelsIsEnabled: true,
  labelsOnEventIsEnabled: true,
  shadowIsEnabled: true,
  shadowOnEventIsEnabled: true,
  contextAlphaOnEvent: 0.3,
  contextAlphaOnEventIsEnabled: true,
};

export const DEFAULT_RENDERER_WIDTH = 640;
export const DEFAULT_RENDERER_HEIGHT = 480;

export type RendererEvents = {
  [RenderEventType.RENDER_START]: undefined;
  [RenderEventType.RENDER_END]: { durationMs: number };
};
import { zoomIdentity, ZoomTransform } from 'd3-zoom';
import { INodeBase } from '../../models/node';
import { IEdgeBase } from '../../models/edge';
import { IGraph } from '../../models/graph';
import { IPosition, IRectangle } from '../../common';
import { Emitter } from '../../utils/emitter.utils';
import { RendererEvents } from '../shared';
import {
  DEFAULT_RENDERER_HEIGHT,
  DEFAULT_RENDERER_SETTINGS,
  DEFAULT_RENDERER_WIDTH,
  IRenderer,
  IRendererSettings,
} from '../shared';

// STUB
export class WebGLRenderer extends Emitter<RendererEvents> implements IRenderer {
  // Contains the HTML5 Canvas element which is used for drawing nodes and edges.
  private readonly _context: WebGL2RenderingContext;

  width: number;
  height: number;
  settings: IRendererSettings;
  transform: ZoomTransform;

  constructor(context: WebGL2RenderingContext, settings?: Partial<IRendererSettings>) {
    super();
    this._context = context;
    console.log('context', this._context);

    this.width = DEFAULT_RENDERER_WIDTH;
    this.height = DEFAULT_RENDERER_HEIGHT;
    this.transform = zoomIdentity;
    this.settings = {
      ...DEFAULT_RENDERER_SETTINGS,
      ...settings,
    };
  }

  get isInitiallyRendered(): boolean {
    throw new Error('Method not implemented.');
  }
  render<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): void {
    console.log('graph:', graph);
    throw new Error('Method not implemented.');
  }
  reset(): void {
    throw new Error('Method not implemented.');
  }
  getFitZoomTransform<N extends INodeBase, E extends IEdgeBase>(graph: IGraph<N, E>): ZoomTransform {
    console.log('graph:', graph);
    throw new Error('Method not implemented.');
  }
  getSimulationPosition(canvasPoint: IPosition): IPosition {
    console.log('canvasPoint:', canvasPoint);
    throw new Error('Method not implemented.');
  }
  getSimulationViewRectangle(): IRectangle {
    throw new Error('Method not implemented.');
  }
  translateOriginToCenter(): void {
    throw new Error('Method not implemented.');
  }
}
