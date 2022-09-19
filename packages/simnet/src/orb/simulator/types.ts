export { WebWorkerSimulator } from "./web-worker-simulator/simulator.js"

import { IPosition } from "../../../../common"
import { ISimulationNode, ISimulationEdge } from "../../../shared"
import { ID3SimulatorEngineSettingsUpdate } from "../../../engine/d3-simulator-engine"
import { IWorkerPayload } from "./worker-payload"

// Messages are objects going into the simulation worker.
// They can be thought of similar to requests.
// (not quite as there is no immediate response to a request)

export enum WorkerInputType {
  // Set node and edge data without simulating
  SetData = "Set Data",
  AddData = "Add Data",
  UpdateData = "Update Data",
  ClearData = "Clear Data",

  // Simulation message types
  Simulate = "Simulate",
  ActivateSimulation = "Activate Simulation",
  StartSimulation = "Start Simulation",
  UpdateSimulation = "Update Simulation",
  StopSimulation = "Stop Simulation",

  // Node dragging message types
  StartDragNode = "Start Drag Node",
  DragNode = "Drag Node",
  EndDragNode = "End Drag Node",
  FixNodes = "Fix Nodes",
  ReleaseNodes = "Release Nodes",

  // Settings and special params
  SetSettings = "Set Settings",
}

type IWorkerInputSetDataPayload = IWorkerPayload<
  WorkerInputType.SetData,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerInputAddDataPayload = IWorkerPayload<
  WorkerInputType.AddData,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerInputUpdateDataPayload = IWorkerPayload<
  WorkerInputType.UpdateData,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerInputClearDataPayload = IWorkerPayload<WorkerInputType.ClearData>

type IWorkerInputSimulatePayload = IWorkerPayload<WorkerInputType.Simulate>

type IWorkerInputActivateSimulationPayload =
  IWorkerPayload<WorkerInputType.ActivateSimulation>

type IWorkerInputStartSimulationPayload = IWorkerPayload<
  WorkerInputType.StartSimulation,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerInputUpdateSimulationPayload = IWorkerPayload<
  WorkerInputType.UpdateSimulation,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerInputStopSimulationPayload =
  IWorkerPayload<WorkerInputType.StopSimulation>

type IWorkerInputStartDragNodePayload =
  IWorkerPayload<WorkerInputType.StartDragNode>

type IWorkerInputDragNodePayload = IWorkerPayload<
  WorkerInputType.DragNode,
  { id: number } & IPosition
>

type IWorkerInputEndDragNodePayload = IWorkerPayload<
  WorkerInputType.EndDragNode,
  {
    id: number
  }
>

type IWorkerInputFixNodesPayload = IWorkerPayload<
  WorkerInputType.FixNodes,
  {
    nodes: ISimulationNode[] | undefined
  }
>

type IWorkerInputReleaseNodesPayload = IWorkerPayload<
  WorkerInputType.ReleaseNodes,
  {
    nodes: ISimulationNode[] | undefined
  }
>

type IWorkerInputSetSettingsPayload = IWorkerPayload<
  WorkerInputType.SetSettings,
  ID3SimulatorEngineSettingsUpdate
>

export type IWorkerInputPayload =
  | IWorkerInputSetDataPayload
  | IWorkerInputAddDataPayload
  | IWorkerInputUpdateDataPayload
  | IWorkerInputClearDataPayload
  | IWorkerInputSimulatePayload
  | IWorkerInputActivateSimulationPayload
  | IWorkerInputStartSimulationPayload
  | IWorkerInputUpdateSimulationPayload
  | IWorkerInputStopSimulationPayload
  | IWorkerInputStartDragNodePayload
  | IWorkerInputDragNodePayload
  | IWorkerInputFixNodesPayload
  | IWorkerInputReleaseNodesPayload
  | IWorkerInputEndDragNodePayload
  | IWorkerInputSetSettingsPayload

import { ISimulationNode, ISimulationEdge } from "../../../shared"
import { IWorkerPayload } from "./worker-payload"
import { ID3SimulatorEngineSettings } from "../../../engine/d3-simulator-engine"

export enum WorkerOutputType {
  StabilizationStarted = "Stabilization Started",
  StabilizationProgress = "Stabilization Progress",
  StabilizationEnded = "Stabilization Ended",
  NodeDragged = "Node Dragged",
  NodeDragEnded = "Node Drag Ended",
  SettingsUpdated = "Settings Updated",
}

type IWorkerOutputStabilizationStartedPayload =
  IWorkerPayload<WorkerOutputType.StabilizationStarted>

type IWorkerOutputStabilizationProgressPayload = IWorkerPayload<
  WorkerOutputType.StabilizationProgress,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
    progress: number
  }
>

type IWorkerOutputStabilizationEndedPayload = IWorkerPayload<
  WorkerOutputType.StabilizationEnded,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerOutputNodeDraggedPayload = IWorkerPayload<
  WorkerOutputType.NodeDragged,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerOutputNodeDragEndedPayload = IWorkerPayload<
  WorkerOutputType.NodeDragEnded,
  {
    nodes: ISimulationNode[]
    edges: ISimulationEdge[]
  }
>

type IWorkerOutputSettingsUpdatedPayload = IWorkerPayload<
  WorkerOutputType.SettingsUpdated,
  {
    settings: ID3SimulatorEngineSettings
  }
>

export type IWorkerOutputPayload =
  | IWorkerOutputStabilizationStartedPayload
  | IWorkerOutputStabilizationProgressPayload
  | IWorkerOutputStabilizationEndedPayload
  | IWorkerOutputNodeDraggedPayload
  | IWorkerOutputNodeDragEndedPayload
  | IWorkerOutputSettingsUpdatedPayload

export type IWorkerPayload<T, K = void> = K extends void
  ? { type: T }
  : { type: T; data: K }

// / <reference lib="webworker" />
import { D3SimulatorEngine, D3SimulatorEngineEventType } from "./d3-engine.js"
import { IWorkerInputPayload, WorkerInputType } from "./message/worker-input"
import { IWorkerOutputPayload, WorkerOutputType } from "./message/worker-output"

const simulator = new D3SimulatorEngine()

const emitToMain = (message: IWorkerOutputPayload) => {
  // @ts-ignore Web worker postMessage is a global function
  postMessage(message)
}

simulator.on(D3SimulatorEngineEventType.TICK, data => {
  emitToMain({ type: WorkerOutputType.NodeDragged, data })
})

simulator.on(D3SimulatorEngineEventType.END, data => {
  emitToMain({ type: WorkerOutputType.NodeDragEnded, data })
})

simulator.on(D3SimulatorEngineEventType.STABILIZATION_STARTED, () => {
  emitToMain({ type: WorkerOutputType.StabilizationStarted })
})

simulator.on(D3SimulatorEngineEventType.STABILIZATION_PROGRESS, data => {
  emitToMain({ type: WorkerOutputType.StabilizationProgress, data })
})

simulator.on(D3SimulatorEngineEventType.STABILIZATION_ENDED, data => {
  emitToMain({ type: WorkerOutputType.StabilizationEnded, data })
})

simulator.on(D3SimulatorEngineEventType.NODE_DRAGGED, data => {
  // Notify the client that the node position changed.
  // This is otherwise handled by the simulation tick if physics is enabled.
  emitToMain({ type: WorkerOutputType.NodeDragged, data })
})

simulator.on(D3SimulatorEngineEventType.SETTINGS_UPDATED, data => {
  emitToMain({ type: WorkerOutputType.SettingsUpdated, data })
})

addEventListener("message", ({ data }: MessageEvent<IWorkerInputPayload>) => {
  switch (data.type) {
    case WorkerInputType.ActivateSimulation: {
      simulator.activateSimulation()
      break
    }

    case WorkerInputType.SetData: {
      simulator.setData(data.data)
      break
    }

    case WorkerInputType.AddData: {
      simulator.addData(data.data)
      break
    }

    case WorkerInputType.UpdateData: {
      simulator.updateData(data.data)
      break
    }

    case WorkerInputType.ClearData: {
      simulator.clearData()
      break
    }

    case WorkerInputType.Simulate: {
      simulator.simulate()
      break
    }

    case WorkerInputType.StartSimulation: {
      simulator.startSimulation(data.data)
      break
    }

    case WorkerInputType.UpdateSimulation: {
      simulator.updateSimulation(data.data)
      break
    }

    case WorkerInputType.StopSimulation: {
      simulator.stopSimulation()
      break
    }

    case WorkerInputType.StartDragNode: {
      simulator.startDragNode()
      break
    }

    case WorkerInputType.DragNode: {
      simulator.dragNode(data.data)
      break
    }

    case WorkerInputType.FixNodes: {
      simulator.fixNodes(data.data.nodes)
      break
    }

    case WorkerInputType.ReleaseNodes: {
      simulator.releaseNodes(data.data.nodes)
      break
    }

    case WorkerInputType.EndDragNode: {
      simulator.endDragNode(data.data)
      break
    }

    case WorkerInputType.SetSettings: {
      simulator.setSettings(data.data)
      break
    }
  }
})

import { IPosition } from "../../../common"
import {
  ISimulator,
  ISimulatorEvents,
  ISimulationNode,
  ISimulationEdge,
} from "./utils.js"
import { ID3SimulatorEngineSettingsUpdate } from "./d3-engine.js"
import { IWorkerInputPayload, WorkerInputType } from "./message/worker-input"
import { IWorkerOutputPayload, WorkerOutputType } from "./message/worker-output"

export class WebWorkerSimulator implements ISimulator {
  protected readonly worker: Worker

  constructor(events: Partial<ISimulatorEvents>) {
    this.worker = new Worker(
      new URL(
        /* webpackChunkName: 'process.worker' */
        "./process.worker",
        import.meta.url
      )
    )

    this.worker.onmessage = ({ data }: MessageEvent<IWorkerOutputPayload>) => {
      switch (data.type) {
        case WorkerOutputType.StabilizationStarted: {
          events.onStabilizationStart?.()
          break
        }
        case WorkerOutputType.StabilizationProgress: {
          events.onStabilizationProgress?.(data.data)
          break
        }
        case WorkerOutputType.StabilizationEnded: {
          events.onStabilizationEnd?.(data.data)
          break
        }
        case WorkerOutputType.NodeDragged: {
          events.onNodeDrag?.(data.data)
          break
        }
        case WorkerOutputType.NodeDragEnded: {
          events.onNodeDragEnd?.(data.data)
          break
        }
        case WorkerOutputType.SettingsUpdated: {
          events.onSettingsUpdate?.(data.data)
          break
        }
      }
    }
  }

  setData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.emitToWorker({ type: WorkerInputType.SetData, data: { nodes, edges } })
  }

  addData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.emitToWorker({ type: WorkerInputType.AddData, data: { nodes, edges } })
  }

  updateData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.emitToWorker({
      type: WorkerInputType.UpdateData,
      data: { nodes, edges },
    })
  }

  clearData() {
    this.emitToWorker({ type: WorkerInputType.ClearData })
  }

  simulate() {
    this.emitToWorker({ type: WorkerInputType.Simulate })
  }

  activateSimulation() {
    this.emitToWorker({ type: WorkerInputType.ActivateSimulation })
  }

  startSimulation(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.emitToWorker({
      type: WorkerInputType.StartSimulation,
      data: { nodes, edges },
    })
  }

  updateSimulation(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.emitToWorker({
      type: WorkerInputType.UpdateSimulation,
      data: { nodes, edges },
    })
  }

  stopSimulation() {
    this.emitToWorker({ type: WorkerInputType.StopSimulation })
  }

  startDragNode() {
    this.emitToWorker({ type: WorkerInputType.StartDragNode })
  }

  dragNode(nodeId: number, position: IPosition) {
    this.emitToWorker({
      type: WorkerInputType.DragNode,
      data: { id: nodeId, ...position },
    })
  }

  endDragNode(nodeId: number) {
    this.emitToWorker({
      type: WorkerInputType.EndDragNode,
      data: { id: nodeId },
    })
  }

  fixNodes(nodes?: ISimulationNode[]) {
    this.emitToWorker({ type: WorkerInputType.FixNodes, data: { nodes } })
  }

  releaseNodes(nodes?: ISimulationNode[]): void {
    this.emitToWorker({ type: WorkerInputType.ReleaseNodes, data: { nodes } })
  }

  setSettings(settings: ID3SimulatorEngineSettingsUpdate) {
    this.emitToWorker({ type: WorkerInputType.SetSettings, data: settings })
  }

  terminate() {
    this.worker.terminate()
  }

  protected emitToWorker(message: IWorkerInputPayload) {
    this.worker.postMessage(message)
  }
}

import {
  ISimulationEdge,
  ISimulationNode,
  ISimulator,
  ISimulatorEvents,
} from "./utils.js"
import { IPosition } from "../../common"
import {
  D3SimulatorEngine,
  D3SimulatorEngineEventType,
  ID3SimulatorEngineSettingsUpdate,
} from "./d3-engine.js"

export class MainThreadSimulator implements ISimulator {
  protected readonly simulator: D3SimulatorEngine

  constructor(events: Partial<ISimulatorEvents>) {
    this.simulator = new D3SimulatorEngine()
    this.simulator.on(D3SimulatorEngineEventType.TICK, data => {
      events.onNodeDrag?.(data)
    })
    this.simulator.on(D3SimulatorEngineEventType.END, data => {
      events.onNodeDragEnd?.(data)
    })
    this.simulator.on(D3SimulatorEngineEventType.STABILIZATION_STARTED, () => {
      events.onStabilizationStart?.()
    })
    this.simulator.on(
      D3SimulatorEngineEventType.STABILIZATION_PROGRESS,
      data => {
        events.onStabilizationProgress?.(data)
      }
    )
    this.simulator.on(D3SimulatorEngineEventType.STABILIZATION_ENDED, data => {
      events.onStabilizationEnd?.(data)
    })
    this.simulator.on(D3SimulatorEngineEventType.NODE_DRAGGED, data => {
      events.onNodeDrag?.(data)
    })
    this.simulator.on(D3SimulatorEngineEventType.SETTINGS_UPDATED, data => {
      events.onSettingsUpdate?.(data)
    })
  }

  setData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.simulator.setData({ nodes, edges })
  }

  addData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.simulator.addData({ nodes, edges })
  }

  updateData(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.simulator.updateData({ nodes, edges })
  }

  clearData() {
    this.simulator.clearData()
  }

  simulate() {
    this.simulator.simulate()
  }

  activateSimulation() {
    this.simulator.activateSimulation()
  }

  startSimulation(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.simulator.startSimulation({ nodes, edges })
  }

  updateSimulation(nodes: ISimulationNode[], edges: ISimulationEdge[]) {
    this.simulator.updateSimulation({ nodes, edges })
  }

  stopSimulation() {
    this.simulator.stopSimulation()
  }

  startDragNode() {
    this.simulator.startDragNode()
  }

  dragNode(nodeId: number, position: IPosition) {
    this.simulator.dragNode({ id: nodeId, ...position })
  }

  endDragNode(nodeId: number) {
    this.simulator.endDragNode({ id: nodeId })
  }

  fixNodes(nodes: ISimulationNode[]) {
    this.simulator.fixNodes(nodes)
  }

  releaseNodes(nodes?: ISimulationNode[] | undefined): void {
    this.simulator.releaseNodes(nodes)
  }

  setSettings(settings: ID3SimulatorEngineSettingsUpdate) {
    this.simulator.setSettings(settings)
  }

  terminate() {
    // Do nothing
  }
}
