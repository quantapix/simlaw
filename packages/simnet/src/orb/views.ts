import { copyObject } from "./utils.js"
import { D3DragEvent, drag } from "d3-drag"
import { D3ZoomEvent, zoom, ZoomBehavior } from "d3-zoom"
import { easeLinear } from "d3-ease"
import { ID3SimulatorEngineSettingsUpdate } from "../simulator/engine/d3-simulator-engine"
import { IEdgeBase, isEdge } from "../models/edge"
import { IEventStrategy } from "../models/strategy"
import { IGraph } from "../models/graph"
import { INode, INodeBase, isNode } from "../models/node"
import { INodeBase } from "../models/node"
import { IOrbView, IOrbViewContext } from "./shared"
import { IPosition, isEqualPosition } from "./base.js"
import { ISimulator, SimulatorFactory } from "../simulator"
import { OrbEmitter, OrbEventType } from "../events"
import { RendererFactory } from "../renderer/factory"
import { select } from "d3-selection"
import * as L from "leaflet"
import transition from "d3-transition"
import {
  IRenderer,
  IRendererSettings,
  IRendererSettingsInit,
  RendererType,
  RenderEventType,
} from "../renderer/shared"

export interface IDefaultViewSettings<
  N extends INodeBase,
  E extends IEdgeBase
> {
  getPosition?(node: INode<N, E>): IPosition | undefined
  simulation: ID3SimulatorEngineSettingsUpdate
  render: Partial<IRendererSettings>
  zoomFitTransitionMs: number
  isOutOfBoundsDragEnabled: boolean
  areCoordinatesRounded: boolean
  isSimulationAnimated: boolean
}

export type IDefaultViewSettingsInit<
  N extends INodeBase,
  E extends IEdgeBase
> = Omit<Partial<IDefaultViewSettings<N, E>>, "render"> & {
  render?: Partial<IRendererSettingsInit>
}

export class DefaultView<N extends INodeBase, E extends IEdgeBase>
  implements IOrbView<IDefaultViewSettings<N, E>>
{
  private _container: HTMLElement
  private _graph: IGraph<N, E>
  private _events: OrbEmitter<N, E>
  private _strategy: IEventStrategy<N, E>
  private _settings: IDefaultViewSettings<N, E>
  private _canvas: HTMLCanvasElement

  private readonly _renderer: IRenderer
  private readonly _simulator: ISimulator

  private _isSimulating = false
  private _onSimulationEnd: (() => void) | undefined
  private _simulationStartedAt = Date.now()
  private _d3Zoom: ZoomBehavior<HTMLCanvasElement, any>
  private _dragStartPosition: IPosition | undefined

  constructor(
    context: IOrbViewContext<N, E>,
    settings?: Partial<IDefaultViewSettingsInit<N, E>>
  ) {
    this._container = context.container
    this._graph = context.graph
    this._events = context.events
    this._strategy = context.strategy

    this._settings = {
      getPosition: settings?.getPosition,
      zoomFitTransitionMs: 200,
      isOutOfBoundsDragEnabled: false,
      areCoordinatesRounded: true,
      isSimulationAnimated: true,
      ...settings,
      simulation: {
        isPhysicsEnabled: false,
        ...settings?.simulation,
      },
      render: {
        ...settings?.render,
      },
    }

    this._container.textContent = ""
    this._canvas = document.createElement("canvas")
    this._canvas.style.position = "absolute"
    this._container.appendChild(this._canvas)

    try {
      this._renderer = RendererFactory.getRenderer(
        this._canvas,
        settings?.render?.type,
        this._settings.render
      )
    } catch (error: any) {
      this._container.textContent = error.message
      throw error
    }
    this._renderer.on(RenderEventType.RENDER_START, () => {
      this._events.emit(OrbEventType.RENDER_START, undefined)
    })
    this._renderer.on(RenderEventType.RENDER_END, data => {
      this._events.emit(OrbEventType.RENDER_END, data)
    })
    this._renderer.translateOriginToCenter()
    this._settings.render = this._renderer.settings

    const resizeObs = new ResizeObserver(() => this._handleResize())
    resizeObs.observe(this._container)
    this._handleResize()

    this._d3Zoom = zoom<HTMLCanvasElement, any>()
      .scaleExtent([
        this._renderer.settings.minZoom,
        this._renderer.settings.maxZoom,
      ])
      .on("zoom", this.zoomed)

    select<HTMLCanvasElement, any>(this._canvas)
      .call(
        drag<HTMLCanvasElement, any>()
          .container(this._canvas)
          .subject(this.dragSubject)
          .on("start", this.dragStarted)
          .on("drag", this.dragged)
          .on("end", this.dragEnded)
      )
      .call(this._d3Zoom)
      .on("click", this.mouseClicked)
      .on("mousemove", this.mouseMoved)

    this._simulator = SimulatorFactory.getSimulator({
      onStabilizationStart: () => {
        this._isSimulating = true
        this._simulationStartedAt = Date.now()
        this._events.emit(OrbEventType.SIMULATION_START, undefined)
      },
      onStabilizationProgress: data => {
        this._graph.setNodePositions(data.nodes)
        this._events.emit(OrbEventType.SIMULATION_STEP, {
          progress: data.progress,
        })
        if (this._settings.isSimulationAnimated) {
          this._renderer.render(this._graph)
        }
      },
      onStabilizationEnd: data => {
        this._graph.setNodePositions(data.nodes)
        this._renderer.render(this._graph)
        this._isSimulating = false
        this._onSimulationEnd?.()
        this._events.emit(OrbEventType.SIMULATION_END, {
          durationMs: Date.now() - this._simulationStartedAt,
        })
      },
      onNodeDrag: data => {
        this._graph.setNodePositions(data.nodes)
        this._renderer.render(this._graph)
      },
      onSettingsUpdate: data => {
        this._settings.simulation = data.settings
      },
    })

    this._simulator.setSettings(this._settings.simulation)
  }

  isInitiallyRendered(): boolean {
    return this._renderer.isInitiallyRendered
  }

  getSettings(): IDefaultViewSettings<N, E> {
    return copyObject(this._settings)
  }

  setSettings(settings: Partial<IDefaultViewSettings<N, E>>) {
    if (settings.getPosition) {
      this._settings.getPosition = settings.getPosition
    }

    if (settings.simulation) {
      this._settings.simulation = {
        ...this._settings.simulation,
        ...settings.simulation,
      }
      this._simulator.setSettings(this._settings.simulation)
    }

    if (settings.render) {
      this._renderer.settings = {
        ...this._renderer.settings,
        ...settings.render,
      }
      this._settings.render = this._renderer.settings
    }
  }

  render(onRendered?: () => void) {
    if (this._isSimulating) {
      this._renderer.render(this._graph)
      onRendered?.()
      return
    }

    if (this._settings.getPosition) {
      const nodes = this._graph.getNodes()
      for (let i = 0; i < nodes.length; i++) {
        const position = this._settings.getPosition(nodes[i])
        if (position) {
          nodes[i].position = { id: nodes[i].id, ...position }
        }
      }
    }

    this._isSimulating = true
    this._onSimulationEnd = onRendered
    this._startSimulation()
  }

  recenter(onRendered?: () => void) {
    const fitZoomTransform = this._renderer.getFitZoomTransform(this._graph)

    select(this._canvas)
      .transition()
      .duration(this._settings.zoomFitTransitionMs)
      .ease(easeLinear)
      .call(this._d3Zoom.transform, fitZoomTransform)
      .call(() => {
        this._renderer.render(this._graph)
        onRendered?.()
      })
  }

  destroy() {
    this._renderer.removeAllListeners()
    this._container.textContent = ""
  }

  dragSubject = (event: D3DragEvent<any, MouseEvent, INode<N, E>>) => {
    const mousePoint = this.getCanvasMousePosition(event.sourceEvent)
    const simulationPoint = this._renderer?.getSimulationPosition(mousePoint)
    return this._graph.getNearestNode(simulationPoint)
  }

  dragStarted = (event: D3DragEvent<any, any, INode<N, E>>) => {
    const mousePoint = this.getCanvasMousePosition(event.sourceEvent)
    const simulationPoint = this._renderer.getSimulationPosition(mousePoint)

    this._events.emit(OrbEventType.NODE_DRAG_START, {
      node: event.subject,
      event: event.sourceEvent,
      localPoint: simulationPoint,
      globalPoint: mousePoint,
    })
    this._dragStartPosition = mousePoint
  }

  dragged = (event: D3DragEvent<any, any, INode<N, E>>) => {
    const mousePoint = this.getCanvasMousePosition(event.sourceEvent)
    const simulationPoint = this._renderer.getSimulationPosition(mousePoint)

    if (!isEqualPosition(this._dragStartPosition, mousePoint)) {
      // this.selectedShape_.next(null);
      // this.selectedShapePosition_.next(null);
      this._dragStartPosition = undefined
    }

    this._simulator.dragNode(event.subject.id, simulationPoint)
    this._events.emit(OrbEventType.NODE_DRAG, {
      node: event.subject,
      event: event.sourceEvent,
      localPoint: simulationPoint,
      globalPoint: mousePoint,
    })
  }

  dragEnded = (event: D3DragEvent<any, any, INode<N, E>>) => {
    const mousePoint = this.getCanvasMousePosition(event.sourceEvent)
    const simulationPoint = this._renderer.getSimulationPosition(mousePoint)

    if (!isEqualPosition(this._dragStartPosition, mousePoint)) {
      this._simulator.endDragNode(event.subject.id)
    }

    this._events.emit(OrbEventType.NODE_DRAG_END, {
      node: event.subject,
      event: event.sourceEvent,
      localPoint: simulationPoint,
      globalPoint: mousePoint,
    })
  }

  zoomed = (event: D3ZoomEvent<any, any>) => {
    this._renderer.transform = event.transform
    setTimeout(() => {
      this._renderer.render(this._graph)
      this._events.emit(OrbEventType.TRANSFORM, { transform: event.transform })
    }, 1)
  }

  getCanvasMousePosition(event: MouseEvent): IPosition {
    const rect = this._canvas.getBoundingClientRect()
    let x = event.clientX ?? event.pageX ?? event.x
    let y = event.clientY ?? event.pageY ?? event.y

    x = x - rect.left
    y = y - rect.top

    if (this._settings.areCoordinatesRounded) {
      x = Math.floor(x)
      y = Math.floor(y)
    }

    if (!this._settings.isOutOfBoundsDragEnabled) {
      x = Math.max(0, Math.min(this._renderer.width, x))
      y = Math.max(0, Math.min(this._renderer.height, y))
    }

    return { x, y }
  }

  mouseMoved = (event: MouseEvent) => {
    const mousePoint = this.getCanvasMousePosition(event)
    const simulationPoint = this._renderer.getSimulationPosition(mousePoint)

    if (this._strategy.onMouseMove) {
      const response = this._strategy.onMouseMove(this._graph, simulationPoint)
      const subject = response.changedSubject

      if (subject) {
        if (isNode(subject)) {
          this._events.emit(OrbEventType.NODE_HOVER, {
            node: subject,
            event,
            localPoint: simulationPoint,
            globalPoint: mousePoint,
          })
        }
        if (isEdge(subject)) {
          this._events.emit(OrbEventType.EDGE_HOVER, {
            edge: subject,
            event,
            localPoint: simulationPoint,
            globalPoint: mousePoint,
          })
        }
      }

      this._events.emit(OrbEventType.MOUSE_MOVE, {
        subject,
        event,
        localPoint: simulationPoint,
        globalPoint: mousePoint,
      })

      if (response.isStateChanged || response.changedSubject) {
        // TODO: Add throttle render
        this._renderer.render(this._graph)
      }
    }
  }

  mouseClicked = (event: PointerEvent) => {
    const mousePoint = this.getCanvasMousePosition(event)
    const simulationPoint = this._renderer.getSimulationPosition(mousePoint)

    if (this._strategy.onMouseClick) {
      const response = this._strategy.onMouseClick(this._graph, simulationPoint)
      const subject = response.changedSubject

      if (subject) {
        if (isNode(subject)) {
          this._events.emit(OrbEventType.NODE_CLICK, {
            node: subject,
            event,
            localPoint: simulationPoint,
            globalPoint: mousePoint,
          })
        }
        if (isEdge(subject)) {
          this._events.emit(OrbEventType.EDGE_CLICK, {
            edge: subject,
            event,
            localPoint: simulationPoint,
            globalPoint: mousePoint,
          })
        }
      }

      this._events.emit(OrbEventType.MOUSE_CLICK, {
        subject,
        event,
        localPoint: simulationPoint,
        globalPoint: mousePoint,
      })

      if (response.isStateChanged || response.changedSubject) {
        this._renderer.render(this._graph)
      }
    }
  }

  private _handleResize() {
    const containerSize = this._container.getBoundingClientRect()
    this._canvas.width = containerSize.width
    this._canvas.height = containerSize.height
    this._renderer.width = containerSize.width
    this._renderer.height = containerSize.height
    if (this._renderer.isInitiallyRendered) {
      this._renderer.render(this._graph)
    }
  }

  private _startSimulation() {
    const nodePositions = this._graph.getNodePositions()
    const edgePositions = this._graph.getEdgePositions()

    this._simulator.updateData(nodePositions, edgePositions)
    this._simulator.simulate()
  }

  // TODO: Do we keep these
  fixNodes() {
    this._simulator.fixNodes()
  }

  // TODO: Do we keep these
  releaseNodes() {
    this._simulator.releaseNodes()
  }
}

export interface ILeafletMapTile {
  instance: L.TileLayer
  attribution: string
}

interface ILeafletEvent<T extends Event> {
  containerPoint: { x: number; y: number }
  latlng: { lat: number; lng: number }
  layerPoint: { x: number; y: number }
  originalEvent: T
  sourceTarget: any
  target: any
  type: string
}

const osmAttribution =
  '<a href="https://leafletjs.com/" target="_blank" >Leaflet</a> | ' +
  'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'

const DEFAULT_MAP_TILE: ILeafletMapTile = {
  instance: new L.TileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  ),
  attribution: osmAttribution,
}

const DEFAULT_ZOOM_LEVEL = 2

export interface IMapSettings {
  zoomLevel: number
  tile: ILeafletMapTile
}

export interface IMapViewSettings<N extends INodeBase, E extends IEdgeBase> {
  getGeoPosition(node: INode<N, E>): { lat: number; lng: number } | undefined
  map: IMapSettings
  render: Partial<IRendererSettings>
}

export interface IMapViewSettingsInit<
  N extends INodeBase,
  E extends IEdgeBase
> {
  getGeoPosition(node: INode<N, E>): { lat: number; lng: number } | undefined
  map?: Partial<IMapSettings>
  render?: Partial<IRendererSettingsInit>
}

export type IMapViewSettingsUpdate<
  N extends INodeBase,
  E extends IEdgeBase
> = Partial<IMapViewSettingsInit<N, E>>

export class MapView<N extends INodeBase, E extends IEdgeBase>
  implements IOrbView<IMapViewSettings<N, E>>
{
  private _container: HTMLElement
  private _graph: IGraph<N, E>
  private _events: OrbEmitter<N, E>
  private _strategy: IEventStrategy<N, E>

  private _settings: IMapViewSettings<N, E>

  private _canvas: HTMLCanvasElement
  private _map: HTMLDivElement

  private readonly _renderer: IRenderer
  private readonly _leaflet: L.Map

  constructor(
    context: IOrbViewContext<N, E>,
    settings: IMapViewSettingsInit<N, E>
  ) {
    this._container = context.container
    this._graph = context.graph
    this._events = context.events
    this._strategy = context.strategy

    this._settings = {
      ...settings,
      map: {
        zoomLevel: settings.map?.zoomLevel ?? DEFAULT_ZOOM_LEVEL,
        tile: settings.map?.tile ?? DEFAULT_MAP_TILE,
      },
      render: {
        type: RendererType.CANVAS,
        ...settings.render,
      },
    }

    // Check for more details here: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    this._container.textContent = ""
    this._canvas = this._initCanvas()
    this._map = this._initMap()

    try {
      this._renderer = RendererFactory.getRenderer(
        this._canvas,
        settings?.render?.type,
        this._settings.render
      )
    } catch (error: any) {
      this._container.textContent = error.message
      throw error
    }
    this._renderer.on(RenderEventType.RENDER_END, data => {
      this._events.emit(OrbEventType.RENDER_END, data)
    })
    this._settings.render = {
      ...this._renderer.settings,
    }
    // Resize the canvas based on the dimensions of it's parent container <div>.
    const resizeObs = new ResizeObserver(() => this._handleResize())
    resizeObs.observe(this._container)
    this._handleResize()

    this._leaflet = this._initLeaflet()
    // Setting up leaflet map tile
    this._handleTileChange()
  }

  get leaflet(): L.Map {
    return this._leaflet
  }

  isInitiallyRendered(): boolean {
    return this._renderer.isInitiallyRendered
  }

  getSettings(): IMapViewSettings<N, E> {
    return copyObject(this._settings)
  }

  setSettings(settings: IMapViewSettingsUpdate<N, E>) {
    if (settings.getGeoPosition) {
      this._settings.getGeoPosition = settings.getGeoPosition
      this._updateGraphPositions()
    }

    if (settings.map) {
      if (typeof settings.map.zoomLevel === "number") {
        this._settings.map.zoomLevel = settings.map.zoomLevel
        this._leaflet.setZoom(settings.map.zoomLevel)
      }

      if (settings.map.tile) {
        this._settings.map.tile = settings.map.tile
        this._handleTileChange()
      }
    }

    if (settings.render) {
      this._renderer.settings = {
        ...this._renderer.settings,
        ...settings.render,
      }
      this._settings.render = {
        ...this._renderer.settings,
      }
    }
  }

  render(onRendered?: () => void) {
    this._updateGraphPositions()
    this._renderer.render(this._graph)
    onRendered?.()
  }

  recenter(onRendered?: () => void) {
    const view = this._graph.getBoundingBox()
    const topRightCoordinate = this._leaflet.layerPointToLatLng([
      view.x,
      view.y,
    ])
    const bottomLeftCoordinate = this._leaflet.layerPointToLatLng([
      view.x + view.width,
      view.y + view.height,
    ])
    this._leaflet.fitBounds(
      L.latLngBounds(topRightCoordinate, bottomLeftCoordinate)
    )
    onRendered?.()
  }

  destroy() {
    this._renderer.removeAllListeners()
    this._leaflet.off()
    this._leaflet.remove()
    this._container.textContent = ""
  }

  private _initCanvas() {
    const canvas = document.createElement("canvas")
    canvas.style.position = "absolute"
    canvas.style.width = "100%"
    canvas.style.zIndex = "2"
    canvas.style.pointerEvents = "none"

    this._container.appendChild(canvas)
    return canvas
  }

  private _initMap() {
    const map = document.createElement("div")
    map.style.position = "absolute"
    map.style.width = "100%"
    map.style.height = "100%"
    map.style.zIndex = "1"
    map.style.cursor = "default"

    this._container.appendChild(map)
    return map
  }

  private _initLeaflet() {
    const leaflet = L.map(this._map).setView(
      [0, 0],
      this._settings.map.zoomLevel
    )

    leaflet.on("zoomstart", () => {
      this._renderer.reset()
    })

    leaflet.on("zoom", event => {
      this._updateGraphPositions()
      this._renderer.render(this._graph)
      const transform = {
        ...event.target._mapPane._leaflet_pos,
        k: event.target._zoom,
      }
      this._events.emit(OrbEventType.TRANSFORM, { transform })
    })

    leaflet.on("mousemove", (event: ILeafletEvent<MouseEvent>) => {
      const point: IPosition = { x: event.layerPoint.x, y: event.layerPoint.y }
      const containerPoint: IPosition = {
        x: event.containerPoint.x,
        y: event.containerPoint.y,
      }
      // TODO: Add throttle
      if (this._strategy.onMouseMove) {
        const response = this._strategy.onMouseMove(this._graph, point)
        const subject = response.changedSubject

        if (subject) {
          if (isNode(subject)) {
            this._events.emit(OrbEventType.NODE_HOVER, {
              node: subject,
              event: event.originalEvent,
              localPoint: point,
              globalPoint: containerPoint,
            })
          }
          if (isEdge(subject)) {
            this._events.emit(OrbEventType.EDGE_HOVER, {
              edge: subject,
              event: event.originalEvent,
              localPoint: point,
              globalPoint: containerPoint,
            })
          }
        }

        this._events.emit(OrbEventType.MOUSE_MOVE, {
          subject,
          event: event.originalEvent,
          localPoint: point,
          globalPoint: containerPoint,
        })

        if (response.isStateChanged || response.changedSubject) {
          this._renderer.render(this._graph)
        }
      }
    })

    leaflet.on("click", (event: ILeafletEvent<PointerEvent>) => {
      const point: IPosition = { x: event.layerPoint.x, y: event.layerPoint.y }
      const containerPoint: IPosition = {
        x: event.containerPoint.x,
        y: event.containerPoint.y,
      }

      if (this._strategy.onMouseClick) {
        const response = this._strategy.onMouseClick(this._graph, point)
        const subject = response.changedSubject

        if (subject) {
          if (isNode(subject)) {
            this._events.emit(OrbEventType.NODE_CLICK, {
              node: subject,
              event: event.originalEvent,
              localPoint: point,
              globalPoint: containerPoint,
            })
          }
          if (isEdge(subject)) {
            this._events.emit(OrbEventType.EDGE_CLICK, {
              edge: subject,
              event: event.originalEvent,
              localPoint: point,
              globalPoint: containerPoint,
            })
          }
        }

        this._events.emit(OrbEventType.MOUSE_CLICK, {
          subject,
          event: event.originalEvent,
          localPoint: point,
          globalPoint: containerPoint,
        })

        if (response.isStateChanged || response.changedSubject) {
          this._renderer.render(this._graph)
        }
      }
    })

    leaflet.on("moveend", event => {
      const leafletPos = event.target._mapPane._leaflet_pos
      this._renderer.transform = { ...leafletPos, k: 1 }
      this._renderer.render(this._graph)
    })

    leaflet.on("drag", event => {
      const leafletPos = event.target._mapPane._leaflet_pos
      this._renderer.transform = { ...leafletPos, k: 1 }
      this._renderer.render(this._graph)
      const transform = { ...leafletPos, k: event.target._zoom }
      this._events.emit(OrbEventType.TRANSFORM, { transform })
    })

    return leaflet
  }

  private _updateGraphPositions() {
    const nodes = this._graph.getNodes()

    for (let i = 0; i < nodes.length; i++) {
      const coordinates = this._settings.getGeoPosition(nodes[i])
      if (!coordinates) {
        continue
      }
      if (
        typeof coordinates.lat !== "number" ||
        typeof coordinates.lng !== "number"
      ) {
        continue
      }

      const layerPoint = this._leaflet.latLngToLayerPoint([
        coordinates.lat,
        coordinates.lng,
      ])
      nodes[i].position.x = layerPoint.x
      nodes[i].position.y = layerPoint.y
    }
  }

  private _handleResize() {
    const containerSize = this._container.getBoundingClientRect()
    this._canvas.width = containerSize.width
    this._canvas.height = containerSize.height
    this._renderer.width = containerSize.width
    this._renderer.height = containerSize.height
    if (this._renderer.isInitiallyRendered) {
      this._leaflet.invalidateSize(false)
      this._renderer.render(this._graph)
    }
  }

  private _handleTileChange() {
    const newTile: ILeafletMapTile = this._settings.map.tile

    this._leaflet.whenReady(() => {
      this._leaflet.attributionControl.setPrefix(newTile.attribution)
      this._leaflet.eachLayer(layer => this._leaflet.removeLayer(layer))
      newTile.instance.addTo(this._leaflet)
    })
  }
}

export interface IOrbView<S> {
  isInitiallyRendered(): boolean
  getSettings(): S
  setSettings(settings: Partial<S>): void
  render(onRendered?: () => void): void
  recenter(onRendered?: () => void): void
  destroy(): void
}

export interface IOrbViewContext<N extends INodeBase, E extends IEdgeBase> {
  container: HTMLElement
  graph: IGraph<N, E>
  events: OrbEmitter<N, E>
  strategy: IEventStrategy<N, E>
}

export type IOrbViewFactory<N extends INodeBase, E extends IEdgeBase, S> = (
  context: IOrbViewContext<N, E>
) => IOrbView<S>
