import { topologicSort } from "./algorithm.js"
import { CommandRegistry } from "./commands.js"
import { PromiseDelegate, Token } from "./utils.js"
import { ContextMenu, Menu, Widget } from "./widgets.js"
export interface IPlugin<T extends Application, U> {
  id: string
  autoStart?: boolean
  requires?: Token<any>[]
  optional?: Token<any>[]
  provides?: Token<U> | null
  activate: (app: T, ...args: any[]) => U | Promise<U>
  deactivate?: ((app: T, ...args: any[]) => void | Promise<void>) | null
}
export class Application<T extends Widget = Widget> {
  constructor(options: Application.IOptions<T>) {
    this.commands = new CommandRegistry()
    this.contextMenu = new ContextMenu({
      commands: this.commands,
      renderer: options.contextMenuRenderer,
    })
    this.shell = options.shell
  }
  readonly commands: CommandRegistry
  readonly contextMenu: ContextMenu
  readonly shell: T
  get started(): Promise<void> {
    return this._delegate.promise
  }
  hasPlugin(id: string): boolean {
    return this._plugins.has(id)
  }
  isPluginActivated(id: string): boolean {
    return this._plugins.get(id)?.activated ?? false
  }
  listPlugins(): string[] {
    return Array.from(this._plugins.keys())
  }
  registerPlugin(plugin: IPlugin<this, any>): void {
    if (this._plugins.has(plugin.id)) {
      throw new TypeError(`Plugin '${plugin.id}' is already registered.`)
    }
    const data = Private.createPluginData(plugin)
    Private.ensureNoCycle(data, this._plugins, this._services)
    if (data.provides) {
      this._services.set(data.provides, data.id)
    }
    this._plugins.set(data.id, data)
  }
  registerPlugins(plugins: IPlugin<this, any>[]): void {
    for (const plugin of plugins) {
      this.registerPlugin(plugin)
    }
  }
  deregisterPlugin(id: string, force?: boolean): void {
    const plugin = this._plugins.get(id)
    if (!plugin) {
      return
    }
    if (plugin.activated && !force) {
      throw new Error(`Plugin '${id}' is still active.`)
    }
    this._plugins.delete(id)
  }
  async activatePlugin(id: string): Promise<void> {
    const plugin = this._plugins.get(id)
    if (!plugin) {
      throw new ReferenceError(`Plugin '${id}' is not registered.`)
    }
    if (plugin.activated) {
      return
    }
    if (plugin.promise) {
      return plugin.promise
    }
    const required = plugin.requires.map(t => this.resolveRequiredService(t))
    const optional = plugin.optional.map(t => this.resolveOptionalService(t))
    plugin.promise = Promise.all([...required, ...optional])
      .then(services => plugin!.activate.apply(undefined, [this, ...services]))
      .then(service => {
        plugin!.service = service
        plugin!.activated = true
        plugin!.promise = null
      })
      .catch(error => {
        plugin!.promise = null
        throw error
      })
    return plugin.promise
  }
  async deactivatePlugin(id: string): Promise<string[]> {
    const plugin = this._plugins.get(id)
    if (!plugin) {
      throw new ReferenceError(`Plugin '${id}' is not registered.`)
    }
    if (!plugin.activated) {
      return []
    }
    if (!plugin.deactivate) {
      throw new TypeError(`Plugin '${id}'#deactivate() method missing`)
    }
    const manifest = Private.findDependents(id, this._plugins, this._services)
    const downstream = manifest.map(id => this._plugins.get(id)!)
    for (const plugin of downstream) {
      if (!plugin.deactivate) {
        throw new TypeError(
          `Plugin ${plugin.id}#deactivate() method missing (depends on ${id})`
        )
      }
    }
    for (const plugin of downstream) {
      const services = [...plugin.requires, ...plugin.optional].map(service => {
        const id = this._services.get(service)
        return id ? this._plugins.get(id)!.service : null
      })
      await plugin.deactivate!(this, ...services)
      plugin.service = null
      plugin.activated = false
    }
    manifest.pop()
    return manifest
  }
  async resolveRequiredService<U>(token: Token<U>): Promise<U> {
    const id = this._services.get(token)
    if (!id) {
      throw new TypeError(`No provider for: ${token.name}.`)
    }
    const plugin = this._plugins.get(id)!
    if (!plugin.activated) {
      await this.activatePlugin(id)
    }
    return plugin.service
  }
  async resolveOptionalService<U>(token: Token<U>): Promise<U | null> {
    const id = this._services.get(token)
    if (!id) {
      return null
    }
    const plugin = this._plugins.get(id)!
    if (!plugin.activated) {
      try {
        await this.activatePlugin(id)
      } catch (reason) {
        console.error(reason)
        return null
      }
    }
    return plugin.service
  }
  start(options: Application.IStartOptions = {}): Promise<void> {
    if (this._started) {
      return this._delegate.promise
    }
    this._started = true
    const hostID = options.hostID || ""
    const startups = Private.collectStartupPlugins(this._plugins, options)
    const promises = startups.map(id => {
      return this.activatePlugin(id).catch(error => {
        console.error(`Plugin '${id}' failed to activate.`)
        console.error(error)
      })
    })
    Promise.all(promises).then(() => {
      this.attachShell(hostID)
      this.addEventListeners()
      this._delegate.resolve()
    })
    return this._delegate.promise
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "resize":
        this.evtResize(event)
        break
      case "keydown":
        this.evtKeydown(event as KeyboardEvent)
        break
      case "contextmenu":
        this.evtContextMenu(event as PointerEvent)
        break
    }
  }
  protected attachShell(id: string): void {
    Widget.attach(
      this.shell,
      (id && document.getElementById(id)) || document.body
    )
  }
  protected addEventListeners(): void {
    document.addEventListener("contextmenu", this)
    document.addEventListener("keydown", this, true)
    window.addEventListener("resize", this)
  }
  protected evtKeydown(event: KeyboardEvent): void {
    this.commands.processKeydownEvent(event)
  }
  protected evtContextMenu(event: PointerEvent): void {
    if (event.shiftKey) {
      return
    }
    if (this.contextMenu.open(event)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  protected evtResize(event: Event): void {
    this.shell.update()
  }
  private _delegate = new PromiseDelegate<void>()
  private _plugins = new Map<string, Private.IPluginData>()
  private _services = new Map<Token<any>, string>()
  private _started = false
}
export interface IOptions<T extends Widget> {
  shell: T
  contextMenuRenderer?: Menu.IRenderer
}
export interface IStartOptions {
  hostID?: string
  startPlugins?: string[]
  ignorePlugins?: string[]
}
export interface IPluginData {
  readonly id: string
  readonly autoStart: boolean
  readonly requires: Token<any>[]
  readonly optional: Token<any>[]
  readonly provides: Token<any> | null
  readonly activate: (app: Application, ...args: any[]) => any
  readonly deactivate:
    | ((app: Application, ...args: any[]) => void | Promise<void>)
    | null
  activated: boolean
  service: any | null
  promise: Promise<void> | null
}
export function createPluginData(plugin: IPlugin<any, any>): IPluginData {
  return {
    id: plugin.id,
    service: null,
    promise: null,
    activated: false,
    activate: plugin.activate,
    deactivate: plugin.deactivate ?? null,
    provides: plugin.provides ?? null,
    autoStart: plugin.autoStart ?? false,
    requires: plugin.requires ? plugin.requires.slice() : [],
    optional: plugin.optional ? plugin.optional.slice() : [],
  }
}
export function ensureNoCycle(
  plugin: IPluginData,
  plugins: Map<string, IPluginData>,
  services: Map<Token<any>, string>
): void {
  const dependencies = [...plugin.requires, ...plugin.optional]
  const visit = (token: Token<any>): boolean => {
    if (token === plugin.provides) {
      return true
    }
    const id = services.get(token)
    if (!id) {
      return false
    }
    const visited = plugins.get(id)!
    const dependencies = [...visited.requires, ...visited.optional]
    if (dependencies.length === 0) {
      return false
    }
    trace.push(id)
    if (dependencies.some(visit)) {
      return true
    }
    trace.pop()
    return false
  }
  if (!plugin.provides || dependencies.length === 0) {
    return
  }
  const trace = [plugin.id]
  if (dependencies.some(visit)) {
    throw new ReferenceError(`Cycle detected: ${trace.join(" -> ")}.`)
  }
}
export function findDependents(
  id: string,
  plugins: Map<string, IPluginData>,
  services: Map<Token<any>, string>
): string[] {
  const edges = new Array<[string, string]>()
  const add = (id: string): void => {
    const plugin = plugins.get(id)!
    const dependencies = [...plugin.requires, ...plugin.optional]
    edges.push(
      ...dependencies.reduce<[string, string][]>((acc, dep) => {
        const service = services.get(dep)
        if (service) {
          acc.push([id, service])
        }
        return acc
      }, [])
    )
  }
  for (const id of plugins.keys()) {
    add(id)
  }
  const sorted = topologicSort(edges)
  const index = sorted.findIndex(candidate => candidate === id)
  if (index === -1) {
    return [id]
  }
  return sorted.slice(0, index + 1)
}
export function collectStartupPlugins(
  plugins: Map<string, IPluginData>,
  options: Application.IStartOptions
): string[] {
  const collection = new Map<string, boolean>()
  for (const id of plugins.keys()) {
    if (plugins.get(id)!.autoStart) {
      collection.set(id, true)
    }
  }
  if (options.startPlugins) {
    for (const id of options.startPlugins) {
      collection.set(id, true)
    }
  }
  if (options.ignorePlugins) {
    for (const id of options.ignorePlugins) {
      collection.delete(id)
    }
  }
  return Array.from(collection.keys())
}
