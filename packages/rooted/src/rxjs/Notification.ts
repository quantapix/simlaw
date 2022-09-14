import type {
  CompleteNotification,
  ErrorNotification,
  NextNotification,
  ObservableNotification,
  PartialObserver,
} from "./types"
import { Observable } from "./Observable"
import { EMPTY } from "./observable/empty"
import { of } from "./observable/of"
import { throwError } from "./observable/throwError"
import { isFunction } from "./util/isFunction"

export enum NotificationKind {
  NEXT = "N",
  ERROR = "E",
  COMPLETE = "C",
}
export class Notification<T> {
  readonly hasValue: boolean
  constructor(kind: "N", value?: T)
  constructor(kind: "E", value: undefined, error: any)
  constructor(kind: "C")
  constructor(
    public readonly kind: "N" | "E" | "C",
    public readonly value?: T,
    public readonly error?: any
  ) {
    this.hasValue = kind === "N"
  }
  observe(observer: PartialObserver<T>): void {
    return observeNotification(this as ObservableNotification<T>, observer)
  }
  do(
    next: (value: T) => void,
    error: (err: any) => void,
    complete: () => void
  ): void
  do(next: (value: T) => void, error: (err: any) => void): void
  do(next: (value: T) => void): void
  do(
    nextHandler: (value: T) => void,
    errorHandler?: (err: any) => void,
    completeHandler?: () => void
  ): void {
    const { kind, value, error } = this
    return kind === "N"
      ? nextHandler?.(value!)
      : kind === "E"
      ? errorHandler?.(error)
      : completeHandler?.()
  }
  accept(
    next: (value: T) => void,
    error: (err: any) => void,
    complete: () => void
  ): void
  accept(next: (value: T) => void, error: (err: any) => void): void
  accept(next: (value: T) => void): void
  accept(observer: PartialObserver<T>): void
  accept(
    nextOrObserver: PartialObserver<T> | ((value: T) => void),
    error?: (err: any) => void,
    complete?: () => void
  ) {
    return isFunction((nextOrObserver as any)?.next)
      ? this.observe(nextOrObserver as PartialObserver<T>)
      : this.do(
          nextOrObserver as (value: T) => void,
          error as any,
          complete as any
        )
  }
  toObservable(): Observable<T> {
    const { kind, value, error } = this
    const result =
      kind === "N"
        ? of(value!)
        : kind === "E"
        ? throwError(() => error)
        : kind === "C"
        ? EMPTY
        : 0
    if (!result) {
      throw new TypeError(`Unexpected notification kind ${kind}`)
    }
    return result
  }
  private static completeNotification = new Notification(
    "C"
  ) as Notification<never> & CompleteNotification
  static createNext<T>(value: T) {
    return new Notification("N", value) as Notification<T> & NextNotification<T>
  }
  static createError(err?: any) {
    return new Notification("E", undefined, err) as Notification<never> &
      ErrorNotification
  }
  static createComplete(): Notification<never> & CompleteNotification {
    return Notification.completeNotification
  }
}
export function observeNotification<T>(
  notification: ObservableNotification<T>,
  observer: PartialObserver<T>
) {
  const { kind, value, error } = notification as any
  if (typeof kind !== "string") {
    throw new TypeError('Invalid notification, missing "kind"')
  }
  kind === "N"
    ? observer.next?.(value!)
    : kind === "E"
    ? observer.error?.(error)
    : observer.complete?.()
}

export const COMPLETE_NOTIFICATION = (() =>
  createNotification("C", undefined, undefined) as CompleteNotification)()
export function errorNotification(error: any): ErrorNotification {
  return createNotification("E", undefined, error) as any
}
export function nextNotification<T>(value: T) {
  return createNotification("N", value, undefined) as NextNotification<T>
}
export function createNotification(
  kind: "N" | "E" | "C",
  value: any,
  error: any
) {
  return {
    kind,
    value,
    error,
  }
}
