/* eslint-disable @typescript-eslint/no-namespace */
import { ArrayExt, every, retro, some } from "./algorithm.js"
import { LinkedList } from "./collections.js"
export class Message {
  constructor(type: string) {
    this.type = type
  }
  readonly type: string
  get isConflatable(): boolean {
    return false
  }
  conflate(other: Message): boolean {
    return false
  }
}
export class ConflatableMessage extends Message {
  get isConflatable(): boolean {
    return true
  }
  conflate(other: ConflatableMessage): boolean {
    return true
  }
}
export interface IMessageHandler {
  processMessage(msg: Message): void
}
export interface IMessageHook {
  messageHook(handler: IMessageHandler, msg: Message): boolean
}
export type MessageHook =
  | IMessageHook
  | ((handler: IMessageHandler, msg: Message) => boolean)
export namespace MessageLoop {
  export function sendMessage(handler: IMessageHandler, msg: Message): void {
    const hooks = messageHooks.get(handler)
    if (!hooks || hooks.length === 0) {
      invokeHandler(handler, msg)
      return
    }
    const passed = every(retro(hooks), hook => {
      return hook ? invokeHook(hook, handler, msg) : true
    })
    if (passed) {
      invokeHandler(handler, msg)
    }
  }
  export function postMessage(handler: IMessageHandler, msg: Message): void {
    if (!msg.isConflatable) {
      enqueueMessage(handler, msg)
      return
    }
    const conflated = some(messageQueue, posted => {
      if (posted.handler !== handler) {
        return false
      }
      if (!posted.msg) {
        return false
      }
      if (posted.msg.type !== msg.type) {
        return false
      }
      if (!posted.msg.isConflatable) {
        return false
      }
      return posted.msg.conflate(msg)
    })
    if (!conflated) {
      enqueueMessage(handler, msg)
    }
  }
  export function installMessageHook(
    handler: IMessageHandler,
    hook: MessageHook
  ): void {
    const hooks = messageHooks.get(handler)
    if (hooks && hooks.indexOf(hook) !== -1) {
      return
    }
    if (!hooks) {
      messageHooks.set(handler, [hook])
    } else {
      hooks.push(hook)
    }
  }
  export function removeMessageHook(
    handler: IMessageHandler,
    hook: MessageHook
  ): void {
    const hooks = messageHooks.get(handler)
    if (!hooks) {
      return
    }
    const i = hooks.indexOf(hook)
    if (i === -1) {
      return
    }
    hooks[i] = null
    scheduleCleanup(hooks)
  }
  export function clearData(handler: IMessageHandler): void {
    const hooks = messageHooks.get(handler)
    if (hooks && hooks.length > 0) {
      ArrayExt.fill(hooks, null)
      scheduleCleanup(hooks)
    }
    for (const posted of messageQueue) {
      if (posted.handler === handler) {
        posted.handler = null
        posted.msg = null
      }
    }
  }
  export function flush(): void {
    if (flushGuard || loopTaskID === 0) {
      return
    }
    unschedule(loopTaskID)
    flushGuard = true
    runMessageLoop()
    flushGuard = false
  }
  export type ExceptionHandler = (err: Error) => void
  export function getExceptionHandler(): ExceptionHandler {
    return exceptionHandler
  }
  export function setExceptionHandler(
    handler: ExceptionHandler
  ): ExceptionHandler {
    const old = exceptionHandler
    exceptionHandler = handler
    return old
  }
  type PostedMessage = { handler: IMessageHandler | null; msg: Message | null }
  const messageQueue = new LinkedList<PostedMessage>()
  const messageHooks = new WeakMap<IMessageHandler, Array<MessageHook | null>>()
  const dirtySet = new Set<Array<MessageHook | null>>()
  let exceptionHandler: ExceptionHandler = (err: Error) => {
    console.error(err)
  }
  type ScheduleHandle = number | any
  let loopTaskID: ScheduleHandle = 0
  let flushGuard = false
  const schedule = ((): ScheduleHandle => {
    const ok = typeof requestAnimationFrame === "function"
    return ok ? requestAnimationFrame : setImmediate
  })()
  const unschedule = (() => {
    const ok = typeof cancelAnimationFrame === "function"
    return ok ? cancelAnimationFrame : clearImmediate
  })()
  function invokeHook(
    hook: MessageHook,
    handler: IMessageHandler,
    msg: Message
  ): boolean {
    let result = true
    try {
      if (typeof hook === "function") {
        result = hook(handler, msg)
      } else {
        result = hook.messageHook(handler, msg)
      }
    } catch (err) {
      exceptionHandler(err)
    }
    return result
  }
  function invokeHandler(handler: IMessageHandler, msg: Message): void {
    try {
      handler.processMessage(msg)
    } catch (err) {
      exceptionHandler(err)
    }
  }
  function enqueueMessage(handler: IMessageHandler, msg: Message): void {
    messageQueue.addLast({ handler, msg })
    if (loopTaskID !== 0) {
      return
    }
    loopTaskID = schedule(runMessageLoop)
  }
  function runMessageLoop(): void {
    loopTaskID = 0
    if (messageQueue.isEmpty) {
      return
    }
    const sentinel: PostedMessage = { handler: null, msg: null }
    messageQueue.addLast(sentinel)
    while (true) {
      const posted = messageQueue.removeFirst()!
      if (posted === sentinel) {
        return
      }
      if (posted.handler && posted.msg) {
        sendMessage(posted.handler, posted.msg)
      }
    }
  }
  function scheduleCleanup(hooks: Array<MessageHook | null>): void {
    if (dirtySet.size === 0) {
      schedule(cleanupDirtySet)
    }
    dirtySet.add(hooks)
  }
  function cleanupDirtySet(): void {
    dirtySet.forEach(cleanupHooks)
    dirtySet.clear()
  }
  function cleanupHooks(hooks: Array<MessageHook | null>): void {
    ArrayExt.removeAllWhere(hooks, isNull)
  }
  function isNull<T>(value: T | null): boolean {
    return value === null
  }
}
