/* eslint-disable @typescript-eslint/no-namespace */
import { ArrayExt } from "./algorithm.js"
import {
  JSONExt,
  ReadonlyJSONObject,
  ReadonlyPartialJSONObject,
} from "./utils.js"
import { DisposableDelegate, IDisposable } from "./disposable.js"
import { Platform, Selector } from "./domutils.js"
import { getKeyboardLayout } from "./keyboard.js"
import { ISignal, Signal } from "./signaling.js"
import type { VirtualElement } from "./virtualdom.js"
export class CommandRegistry {
  get commandChanged(): ISignal<this, CommandRegistry.ICommandChangedArgs> {
    return this._commandChanged
  }
  get commandExecuted(): ISignal<this, CommandRegistry.ICommandExecutedArgs> {
    return this._commandExecuted
  }
  get keyBindingChanged(): ISignal<
    this,
    CommandRegistry.IKeyBindingChangedArgs
  > {
    return this._keyBindingChanged
  }
  get keyBindings(): ReadonlyArray<CommandRegistry.IKeyBinding> {
    return this._keyBindings
  }
  listCommands(): string[] {
    return Array.from(this._commands.keys())
  }
  hasCommand(id: string): boolean {
    return this._commands.has(id)
  }
  addCommand(
    id: string,
    options: CommandRegistry.ICommandOptions
  ): IDisposable {
    if (this._commands.has(id)) {
      throw new Error(`Command '${id}' already registered.`)
    }
    this._commands.set(id, Private.createCommand(options))
    this._commandChanged.emit({ id, type: "added" })
    return new DisposableDelegate(() => {
      this._commands.delete(id)
      this._commandChanged.emit({ id, type: "removed" })
    })
  }
  notifyCommandChanged(id?: string): void {
    if (id !== undefined && !this._commands.has(id)) {
      throw new Error(`Command '${id}' is not registered.`)
    }
    this._commandChanged.emit({ id, type: id ? "changed" : "many-changed" })
  }
  describedBy(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): Promise<CommandRegistry.Description> {
    const cmd = this._commands.get(id)
    return Promise.resolve(
      cmd?.describedBy.call(undefined, args) ?? { args: null }
    )
  }
  label(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd?.label.call(undefined, args) ?? ""
  }
  mnemonic(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): number {
    const cmd = this._commands.get(id)
    return cmd ? cmd.mnemonic.call(undefined, args) : -1
  }
  icon(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): VirtualElement.IRenderer | undefined {
    return this._commands.get(id)?.icon.call(undefined, args)
  }
  iconClass(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd ? cmd.iconClass.call(undefined, args) : ""
  }
  iconLabel(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd ? cmd.iconLabel.call(undefined, args) : ""
  }
  caption(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd ? cmd.caption.call(undefined, args) : ""
  }
  usage(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd ? cmd.usage.call(undefined, args) : ""
  }
  className(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): string {
    const cmd = this._commands.get(id)
    return cmd ? cmd.className.call(undefined, args) : ""
  }
  dataset(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): CommandRegistry.Dataset {
    const cmd = this._commands.get(id)
    return cmd ? cmd.dataset.call(undefined, args) : {}
  }
  isEnabled(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): boolean {
    const cmd = this._commands.get(id)
    return cmd ? cmd.isEnabled.call(undefined, args) : false
  }
  isToggled(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): boolean {
    const cmd = this._commands.get(id)
    return cmd ? cmd.isToggled.call(undefined, args) : false
  }
  isToggleable(
    id: string,
    args: ReadonlyJSONObject = JSONExt.emptyObject
  ): boolean {
    const cmd = this._commands.get(id)
    return cmd ? cmd.isToggleable : false
  }
  isVisible(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): boolean {
    const cmd = this._commands.get(id)
    return cmd ? cmd.isVisible.call(undefined, args) : false
  }
  execute(
    id: string,
    args: ReadonlyPartialJSONObject = JSONExt.emptyObject
  ): Promise<any> {
    const cmd = this._commands.get(id)
    if (!cmd) {
      return Promise.reject(new Error(`Command '${id}' not registered.`))
    }
    let value: any
    try {
      value = cmd.execute.call(undefined, args)
    } catch (err) {
      value = Promise.reject(err)
    }
    const result = Promise.resolve(value)
    this._commandExecuted.emit({ id, args, result })
    return result
  }
  addKeyBinding(options: CommandRegistry.IKeyBindingOptions): IDisposable {
    const binding = Private.createKeyBinding(options)
    this._keyBindings.push(binding)
    this._keyBindingChanged.emit({ binding, type: "added" })
    return new DisposableDelegate(() => {
      ArrayExt.removeFirstOf(this._keyBindings, binding)
      this._keyBindingChanged.emit({ binding, type: "removed" })
    })
  }
  processKeydownEvent(event: KeyboardEvent): void {
    if (this._replaying || CommandRegistry.isModifierKeyPressed(event)) {
      return
    }
    const keystroke = CommandRegistry.keystrokeForKeydownEvent(event)
    if (!keystroke) {
      this._replayKeydownEvents()
      this._clearPendingState()
      return
    }
    this._keystrokes.push(keystroke)
    const { exact, partial } = Private.matchKeyBinding(
      this._keyBindings,
      this._keystrokes,
      event
    )
    if (!exact && !partial) {
      this._replayKeydownEvents()
      this._clearPendingState()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (exact && !partial) {
      this._executeKeyBinding(exact)
      this._clearPendingState()
      return
    }
    if (exact) {
      this._exactKeyMatch = exact
    }
    this._keydownEvents.push(event)
    this._startTimer()
  }
  private _startTimer(): void {
    this._clearTimer()
    this._timerID = window.setTimeout(() => {
      this._onPendingTimeout()
    }, Private.CHORD_TIMEOUT)
  }
  private _clearTimer(): void {
    if (this._timerID !== 0) {
      clearTimeout(this._timerID)
      this._timerID = 0
    }
  }
  private _replayKeydownEvents(): void {
    if (this._keydownEvents.length === 0) {
      return
    }
    this._replaying = true
    this._keydownEvents.forEach(Private.replayKeyEvent)
    this._replaying = false
  }
  private _executeKeyBinding(binding: CommandRegistry.IKeyBinding): void {
    const { command, args } = binding
    if (!this.hasCommand(command) || !this.isEnabled(command, args)) {
      const word = this.hasCommand(command) ? "enabled" : "registered"
      const keys = binding.keys.join(", ")
      const msg1 = `Cannot execute key binding '${keys}':`
      const msg2 = `command '${command}' is not ${word}.`
      console.warn(`${msg1} ${msg2}`)
      return
    }
    this.execute(command, args)
  }
  private _clearPendingState(): void {
    this._clearTimer()
    this._exactKeyMatch = null
    this._keystrokes.length = 0
    this._keydownEvents.length = 0
  }
  private _onPendingTimeout(): void {
    this._timerID = 0
    if (this._exactKeyMatch) {
      this._executeKeyBinding(this._exactKeyMatch)
    } else {
      this._replayKeydownEvents()
    }
    this._clearPendingState()
  }
  private _timerID = 0
  private _replaying = false
  private _keystrokes: string[] = []
  private _keydownEvents: KeyboardEvent[] = []
  private _keyBindings: CommandRegistry.IKeyBinding[] = []
  private _exactKeyMatch: CommandRegistry.IKeyBinding | null = null
  private _commands = new Map<string, Private.ICommand>()
  private _commandChanged = new Signal<
    this,
    CommandRegistry.ICommandChangedArgs
  >(this)
  private _commandExecuted = new Signal<
    this,
    CommandRegistry.ICommandExecutedArgs
  >(this)
  private _keyBindingChanged = new Signal<
    this,
    CommandRegistry.IKeyBindingChangedArgs
  >(this)
}
export namespace CommandRegistry {
  export type CommandFunc<T> = (args: ReadonlyPartialJSONObject) => T
  export type Dataset = { readonly [key: string]: string }
  export type Description = { args: ReadonlyJSONObject | null }
  export interface ICommandOptions {
    execute: CommandFunc<any | Promise<any>>
    describedBy?:
      | Partial<Description>
      | CommandFunc<Partial<Description> | Promise<Partial<Description>>>
    label?: string | CommandFunc<string>
    mnemonic?: number | CommandFunc<number>
    icon?:
      | VirtualElement.IRenderer
      | undefined
      | CommandFunc<VirtualElement.IRenderer | undefined>
    iconClass?: string | CommandFunc<string>
    iconLabel?: string | CommandFunc<string>
    caption?: string | CommandFunc<string>
    usage?: string | CommandFunc<string>
    className?: string | CommandFunc<string>
    dataset?: Dataset | CommandFunc<Dataset>
    isEnabled?: CommandFunc<boolean>
    isToggled?: CommandFunc<boolean>
    isToggleable?: boolean
    isVisible?: CommandFunc<boolean>
  }
  export interface ICommandChangedArgs {
    readonly id: string | undefined
    readonly type: "added" | "removed" | "changed" | "many-changed"
  }
  export interface ICommandExecutedArgs {
    readonly id: string
    readonly args: ReadonlyPartialJSONObject
    readonly result: Promise<any>
  }
  export interface IKeyBindingOptions {
    keys: string[]
    selector: string
    command: string
    args?: ReadonlyPartialJSONObject
    winKeys?: string[]
    macKeys?: string[]
    linuxKeys?: string[]
  }
  export interface IKeyBinding {
    readonly keys: ReadonlyArray<string>
    readonly selector: string
    readonly command: string
    readonly args: ReadonlyPartialJSONObject
  }
  export interface IKeyBindingChangedArgs {
    readonly binding: IKeyBinding
    readonly type: "added" | "removed"
  }
  export interface IKeystrokeParts {
    cmd: boolean
    ctrl: boolean
    alt: boolean
    shift: boolean
    key: string
  }
  export function parseKeystroke(keystroke: string): IKeystrokeParts {
    let key = ""
    let alt = false
    let cmd = false
    let ctrl = false
    let shift = false
    for (const token of keystroke.split(/\s+/)) {
      if (token === "Accel") {
        if (Platform.IS_MAC) {
          cmd = true
        } else {
          ctrl = true
        }
      } else if (token === "Alt") {
        alt = true
      } else if (token === "Cmd") {
        cmd = true
      } else if (token === "Ctrl") {
        ctrl = true
      } else if (token === "Shift") {
        shift = true
      } else if (token.length > 0) {
        key = token
      }
    }
    return { cmd, ctrl, alt, shift, key }
  }
  export function normalizeKeystroke(keystroke: string): string {
    let mods = ""
    const parts = parseKeystroke(keystroke)
    if (parts.ctrl) {
      mods += "Ctrl "
    }
    if (parts.alt) {
      mods += "Alt "
    }
    if (parts.shift) {
      mods += "Shift "
    }
    if (parts.cmd && Platform.IS_MAC) {
      mods += "Cmd "
    }
    return mods + parts.key
  }
  export function normalizeKeys(options: IKeyBindingOptions): string[] {
    let keys: string[]
    if (Platform.IS_WIN) {
      keys = options.winKeys || options.keys
    } else if (Platform.IS_MAC) {
      keys = options.macKeys || options.keys
    } else {
      keys = options.linuxKeys || options.keys
    }
    return keys.map(normalizeKeystroke)
  }
  export function formatKeystroke(keystroke: string): string {
    const mods = []
    const separator = Platform.IS_MAC ? " " : "+"
    const parts = parseKeystroke(keystroke)
    if (parts.ctrl) {
      mods.push("Ctrl")
    }
    if (parts.alt) {
      mods.push("Alt")
    }
    if (parts.shift) {
      mods.push("Shift")
    }
    if (Platform.IS_MAC && parts.cmd) {
      mods.push("Cmd")
    }
    mods.push(parts.key)
    return mods.map(Private.formatKey).join(separator)
  }
  export function isModifierKeyPressed(event: KeyboardEvent): boolean {
    const layout = getKeyboardLayout()
    const key = layout.keyForKeydownEvent(event)
    return layout.isModifierKey(key)
  }
  export function keystrokeForKeydownEvent(event: KeyboardEvent): string {
    const layout = getKeyboardLayout()
    const key = layout.keyForKeydownEvent(event)
    if (!key || layout.isModifierKey(key)) {
      return ""
    }
    const mods = []
    if (event.ctrlKey) {
      mods.push("Ctrl")
    }
    if (event.altKey) {
      mods.push("Alt")
    }
    if (event.shiftKey) {
      mods.push("Shift")
    }
    if (event.metaKey && Platform.IS_MAC) {
      mods.push("Cmd")
    }
    mods.push(key)
    return mods.join(" ")
  }
}
export const CHORD_TIMEOUT = 1000
export type CommandFunc<T> = CommandRegistry.CommandFunc<T>
export type Dataset = CommandRegistry.Dataset
export interface ICommand {
  readonly execute: CommandFunc<any>
  readonly describedBy: CommandFunc<
    CommandRegistry.Description | Promise<CommandRegistry.Description>
  >
  readonly label: CommandFunc<string>
  readonly mnemonic: CommandFunc<number>
  readonly icon: CommandFunc<VirtualElement.IRenderer | undefined>
  readonly iconClass: CommandFunc<string>
  readonly iconLabel: CommandFunc<string>
  readonly caption: CommandFunc<string>
  readonly usage: CommandFunc<string>
  readonly className: CommandFunc<string>
  readonly dataset: CommandFunc<Dataset>
  readonly isEnabled: CommandFunc<boolean>
  readonly isToggled: CommandFunc<boolean>
  readonly isToggleable: boolean
  readonly isVisible: CommandFunc<boolean>
}
export function createCommand(
  options: CommandRegistry.ICommandOptions
): ICommand {
  return {
    execute: options.execute,
    describedBy: asFunc<
      CommandRegistry.Description | Promise<CommandRegistry.Description>
    >(
      typeof options.describedBy === "function"
        ? (options.describedBy as CommandFunc<
            CommandRegistry.Description | Promise<CommandRegistry.Description>
          >)
        : { args: null, ...options.describedBy },
      () => {
        return { args: null }
      }
    ),
    label: asFunc(options.label, emptyStringFunc),
    mnemonic: asFunc(options.mnemonic, negativeOneFunc),
    icon: asFunc(options.icon, undefinedFunc),
    iconClass: asFunc(options.iconClass, emptyStringFunc),
    iconLabel: asFunc(options.iconLabel, emptyStringFunc),
    caption: asFunc(options.caption, emptyStringFunc),
    usage: asFunc(options.usage, emptyStringFunc),
    className: asFunc(options.className, emptyStringFunc),
    dataset: asFunc(options.dataset, emptyDatasetFunc),
    isEnabled: options.isEnabled || trueFunc,
    isToggled: options.isToggled || falseFunc,
    isToggleable: options.isToggleable || !!options.isToggled,
    isVisible: options.isVisible || trueFunc,
  }
}
export function createKeyBinding(
  options: CommandRegistry.IKeyBindingOptions
): CommandRegistry.IKeyBinding {
  return {
    keys: CommandRegistry.normalizeKeys(options),
    selector: validateSelector(options),
    command: options.command,
    args: options.args || JSONExt.emptyObject,
  }
}
export interface IMatchResult {
  exact: CommandRegistry.IKeyBinding | null
  partial: boolean
}
export function matchKeyBinding(
  bindings: ReadonlyArray<CommandRegistry.IKeyBinding>,
  keys: ReadonlyArray<string>,
  event: KeyboardEvent
): IMatchResult {
  let exact: CommandRegistry.IKeyBinding | null = null
  let partial = false
  let distance = Infinity
  let specificity = 0
  for (let i = 0, n = bindings.length; i < n; ++i) {
    const binding = bindings[i]
    const sqm = matchSequence(binding.keys, keys)
    if (sqm === SequenceMatch.None) {
      continue
    }
    if (sqm === SequenceMatch.Partial) {
      if (!partial && targetDistance(binding.selector, event) !== -1) {
        partial = true
      }
      continue
    }
    const td = targetDistance(binding.selector, event)
    if (td === -1 || td > distance) {
      continue
    }
    const sp = Selector.calculateSpecificity(binding.selector)
    if (!exact || td < distance || sp >= specificity) {
      exact = binding
      distance = td
      specificity = sp
    }
  }
  return { exact, partial }
}
export function replayKeyEvent(event: KeyboardEvent): void {
  event.target!.dispatchEvent(cloneKeyboardEvent(event))
}
export function formatKey(key: string): string {
  if (Platform.IS_MAC) {
    return MAC_DISPLAY.hasOwnProperty(key) ? MAC_DISPLAY[key] : key
  } else {
    return WIN_DISPLAY.hasOwnProperty(key) ? WIN_DISPLAY[key] : key
  }
}
const MAC_DISPLAY: { [key: string]: string } = {
  Backspace: "⌫",
  Tab: "⇥",
  Enter: "↩",
  Shift: "⇧",
  Ctrl: "⌃",
  Alt: "⌥",
  Escape: "⎋",
  PageUp: "⇞",
  PageDown: "⇟",
  End: "↘",
  Home: "↖",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowRight: "→",
  ArrowDown: "↓",
  Delete: "⌦",
  Cmd: "⌘",
}
const WIN_DISPLAY: { [key: string]: string } = {
  Escape: "Esc",
  PageUp: "Page Up",
  PageDown: "Page Down",
  ArrowLeft: "Left",
  ArrowUp: "Up",
  ArrowRight: "Right",
  ArrowDown: "Down",
  Delete: "Del",
}
const emptyStringFunc = () => ""
const negativeOneFunc = () => -1
const trueFunc = () => true
const falseFunc = () => false
const emptyDatasetFunc = () => ({})
const undefinedFunc = () => undefined
function asFunc<T>(
  value: undefined | T | CommandFunc<T>,
  dfault: CommandFunc<T>
): CommandFunc<T> {
  if (value === undefined) {
    return dfault
  }
  if (typeof value === "function") {
    return value as CommandFunc<T>
  }
  return () => value
}
function validateSelector(options: CommandRegistry.IKeyBindingOptions): string {
  if (options.selector.indexOf(",") !== -1) {
    throw new Error(`Selector cannot contain commas: ${options.selector}`)
  }
  if (!Selector.isValid(options.selector)) {
    throw new Error(`Invalid selector: ${options.selector}`)
  }
  return options.selector
}
const enum SequenceMatch {
  None,
  Exact,
  Partial,
}
function matchSequence(
  bindKeys: ReadonlyArray<string>,
  userKeys: ReadonlyArray<string>
): SequenceMatch {
  if (bindKeys.length < userKeys.length) {
    return SequenceMatch.None
  }
  for (let i = 0, n = userKeys.length; i < n; ++i) {
    if (bindKeys[i] !== userKeys[i]) {
      return SequenceMatch.None
    }
  }
  if (bindKeys.length > userKeys.length) {
    return SequenceMatch.Partial
  }
  return SequenceMatch.Exact
}
function targetDistance(selector: string, event: KeyboardEvent): number {
  let targ = event.target as Element | null
  const curr = event.currentTarget as Element | null
  for (let dist = 0; targ !== null; targ = targ.parentElement, ++dist) {
    if (targ.hasAttribute("data-lm-suppress-shortcuts")) {
      return -1
    }
    if (Selector.matches(targ, selector)) {
      return dist
    }
    if (targ === curr) {
      return -1
    }
  }
  return -1
}
function cloneKeyboardEvent(event: KeyboardEvent): KeyboardEvent {
  const clone = document.createEvent("Event") as any
  const bubbles = event.bubbles || true
  const cancelable = event.cancelable || true
  clone.initEvent(event.type || "keydown", bubbles, cancelable)
  clone.key = event.key || ""
  clone.keyCode = event.keyCode || 0
  clone.which = event.keyCode || 0
  clone.ctrlKey = event.ctrlKey || false
  clone.altKey = event.altKey || false
  clone.shiftKey = event.shiftKey || false
  clone.metaKey = event.metaKey || false
  clone.view = event.view || window
  return clone as KeyboardEvent
}
