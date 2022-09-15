import { EMPTY, of, throwError } from "./observable.js"
import * as qu from "./utils.js"
import type { Observable } from "./observable.js"
import type * as qt from "./types.js"

export enum Kind {
  NEXT = "N",
  ERROR = "E",
  COMPLETE = "C",
}

export class Note<T> {
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
  observe(observer: qt.PartialObserver<T>): void {
    return observeNote(this as qt.ObservableNote<T>, observer)
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
  accept(observer: qt.PartialObserver<T>): void
  accept(
    nextOrObserver: qt.PartialObserver<T> | ((value: T) => void),
    error?: (err: any) => void,
    complete?: () => void
  ) {
    return qu.isFunction((nextOrObserver as any)?.next)
      ? this.observe(nextOrObserver as qt.PartialObserver<T>)
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
      throw new TypeError(`Unexpected note kind ${kind}`)
    }
    return result
  }
  private static completeNote = new Note("C") as Note<never> & qt.CompleteNote
  static createNext<T>(value: T) {
    return new Note("N", value) as Note<T> & qt.NextNote<T>
  }
  static createError(err?: any) {
    return new Note("E", undefined, err) as Note<never> & qt.ErrorNote
  }
  static createComplete(): Note<never> & qt.CompleteNote {
    return Note.completeNote
  }
}

export const COMPLETE_NOTE = (() =>
  createNote("C", undefined, undefined) as qt.CompleteNote)()

export function createNote(kind: "N" | "E" | "C", value: any, error: any) {
  return {
    kind,
    value,
    error,
  }
}

export function nextNote<T>(value: T) {
  return createNote("N", value, undefined) as qt.NextNote<T>
}

export function errorNote(error: any): qt.ErrorNote {
  return createNote("E", undefined, error) as any
}

export function observeNote<T>(
  note: qt.ObservableNote<T>,
  observer: qt.PartialObserver<T>
) {
  const { kind, value, error } = note as any
  if (typeof kind !== "string") {
    throw new TypeError('Invalid note, missing "kind"')
  }
  kind === "N"
    ? observer.next?.(value!)
    : kind === "E"
    ? observer.error?.(error)
    : observer.complete?.()
}
