export const copyArray = <T>(array: Array<T>): Array<T> => {
  const newArray = new Array<T>(array.length)
  for (let i = 0; i < array.length; i++) {
    newArray[i] = array[i]
  }
  return newArray
}

export type IEventMap = Record<string, any>

type IEventKey<T extends IEventMap> = string & keyof T
type IEventReceiver<T> = (params: T) => void

export interface IEmitter<T extends IEventMap> {
  once<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T>
  on<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T>
  off<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T>
  emit<K extends IEventKey<T>>(eventName: K, params: T[K]): boolean
  eventNames<K extends IEventKey<T>>(): K[]
  listenerCount<K extends IEventKey<T>>(eventName: K): number
  listeners<K extends IEventKey<T>>(eventName: K): IEventReceiver<T[K]>[]
  addListener<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T>
  removeListener<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T>
  removeAllListeners<K extends IEventKey<T>>(eventName?: K): IEmitter<T>
}

interface IEmmiterListener<T extends IEventMap> {
  callable: IEventReceiver<T[any]>
  isOnce?: boolean
}

export class Emitter<T extends IEventMap> implements IEmitter<T> {
  private readonly _listeners = new Map<IEventKey<T>, IEmmiterListener<T>[]>()
  once<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T> {
    const newListener: IEmmiterListener<T> = {
      callable: func,
      isOnce: true,
    }

    const listeners = this._listeners.get(eventName)
    if (listeners) {
      listeners.push(newListener)
    } else {
      this._listeners.set(eventName, [newListener])
    }

    return this
  }

  on<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T> {
    const newListener: IEmmiterListener<T> = {
      callable: func,
    }

    const listeners = this._listeners.get(eventName)
    if (listeners) {
      listeners.push(newListener)
    } else {
      this._listeners.set(eventName, [newListener])
    }

    return this
  }

  off<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T> {
    const listeners = this._listeners.get(eventName)
    if (listeners) {
      const filteredListeners = listeners.filter(
        listener => listener.callable !== func
      )
      this._listeners.set(eventName, filteredListeners)
    }

    return this
  }

  emit<K extends IEventKey<T>>(eventName: K, params: T[K]): boolean {
    const listeners = this._listeners.get(eventName)
    if (!listeners || listeners.length === 0) {
      return false
    }

    let hasOnceListener = false
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].isOnce) {
        hasOnceListener = true
      }
      listeners[i].callable(params)
    }

    if (hasOnceListener) {
      const filteredListeners = listeners.filter(listener => !listener.isOnce)
      this._listeners.set(eventName, filteredListeners)
    }
    return true
  }

  eventNames<K extends IEventKey<T>>(): K[] {
    return [...this._listeners.keys()] as K[]
  }

  listenerCount<K extends IEventKey<T>>(eventName: K): number {
    const listeners = this._listeners.get(eventName)
    return listeners ? listeners.length : 0
  }

  listeners<K extends IEventKey<T>>(eventName: K): IEventReceiver<T[K]>[] {
    const listeners = this._listeners.get(eventName)
    if (!listeners) {
      return []
    }
    return listeners.map(listener => listener.callable)
  }

  addListener<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T> {
    return this.on<K>(eventName, func)
  }

  removeListener<K extends IEventKey<T>>(
    eventName: K,
    func: IEventReceiver<T[K]>
  ): IEmitter<T> {
    return this.off<K>(eventName, func)
  }

  removeAllListeners<K extends IEventKey<T>>(eventName?: K): IEmitter<T> {
    if (eventName) {
      this._listeners.delete(eventName)
    } else {
      this._listeners.clear()
    }

    return this
  }
}

export const copyObject = <T extends any[] | any>(obj: T): T => {
  if (isDate(obj)) {
    return copyDate(obj) as T
  }

  if (isArray(obj)) {
    return copyArray(obj) as T
  }

  if (isPlainObject(obj)) {
    return copyPlainObject(obj) as T
  }

  return obj
}

export const isObjectEqual = (obj1: any, obj2: any): boolean => {
  const isDate1 = isDate(obj1)
  const isDate2 = isDate(obj2)

  if ((isDate1 && !isDate2) || (!isDate1 && isDate2)) {
    return false
  }

  if (isDate1 && isDate2) {
    return obj1.getTime() === obj2.getTime()
  }

  const isArray1 = isArray(obj1)
  const isArray2 = isArray(obj2)

  if ((isArray1 && !isArray2) || (!isArray1 && isArray2)) {
    return false
  }

  if (isArray1 && isArray2) {
    if (obj1.length !== obj2.length) {
      return false
    }

    return obj1.every((value: any, index: number) => {
      return isObjectEqual(value, obj2[index])
    })
  }

  const isObject1 = isPlainObject(obj1)
  const isObject2 = isPlainObject(obj2)

  if ((isObject1 && !isObject2) || (!isObject1 && isObject2)) {
    return false
  }

  if (isObject1 && isObject2) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (!isObjectEqual(keys1, keys2)) {
      return false
    }

    return keys1.every(key => {
      return isObjectEqual(obj1[key], obj2[key])
    })
  }

  return obj1 === obj2
}

const copyDate = (date: Date): Date => {
  return new Date(date)
}

export const copyArray = <T>(array: T[]): T[] => {
  return array.map(value => copyObject(value))
}

const copyPlainObject = <T>(obj: Record<string, T>): Record<string, T> => {
  const newObject: Record<string, T> = {}
  Object.keys(obj).forEach(key => {
    newObject[key] = copyObject(obj[key])
  })
  return newObject
}

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T

export const isString = (value: any): value is string => {
  return typeof value === "string"
}

export const isNumber = (value: any): value is number => {
  return typeof value === "number"
}

export const isBoolean = (value: any): value is boolean => {
  return typeof value === "boolean"
}

export const isDate = (value: any): value is Date => {
  return value instanceof Date
}

export const isArray = (value: any): value is Array<any> => {
  return Array.isArray(value)
}

export const isPlainObject = (value: any): value is Record<string, any> => {
  return (
    value !== null &&
    typeof value === "object" &&
    value.constructor.name === "Object"
  )
}

export const isNull = (value: any): value is null => {
  return value === null
}

export const isFunction = (value: any): value is Function => {
  return typeof value === "function"
}
