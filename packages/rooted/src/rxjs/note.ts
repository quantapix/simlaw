import { EMPTY, of, throwError } from "./observable.js"
import * as qu from "./utils.js"
import type { Observable } from "./observable.js"
import type * as qt from "./types.js"

export enum Kind {
  NEXT = "N",
  ERROR = "E",
  DONE = "D",
}

export class Note<T> {
  static createNext<T>(x: T) {
    return new Note("N", x) as Note<T> & qt.NextNote<T>
  }
  static createError(x?: any) {
    return new Note("E", undefined, x) as Note<never> & qt.ErrNote
  }
  private static doneNote = new Note("D") as Note<never> & qt.DoneNote
  static createDone(): Note<never> & qt.DoneNote {
    return Note.doneNote
  }

  readonly hasVal: boolean
  constructor(kind: "N", val?: T)
  constructor(kind: "E", val: undefined, err: any)
  constructor(kind: "D")
  constructor(
    public readonly kind: "N" | "E" | "D",
    public readonly val?: T,
    public readonly err?: any
  ) {
    this.hasVal = kind === "N"
  }

  observe(x: qt.PartialObserver<T>): void {
    observeNote(this as qt.ObsNote<T>, x)
  }

  do(next: (x: T) => void, error: (x: any) => void, done: () => void): void
  do(next: (x: T) => void, error: (x: any) => void): void
  do(next: (x: T) => void): void
  do(next: (x: T) => void, error?: (x: any) => void, done?: () => void): void {
    const { kind, val, err } = this
    return kind === "N" ? next?.(val!) : kind === "E" ? error?.(err) : done?.()
  }

  accept(next: (x: T) => void, error: (x: any) => void, done: () => void): void
  accept(next: (x: T) => void, error: (x: any) => void): void
  accept(next: (x: T) => void): void
  accept(x: qt.PartialObserver<T>): void
  accept(
    next: qt.PartialObserver<T> | ((x: T) => void),
    error?: (x: any) => void,
    done?: () => void
  ) {
    return qu.isFunction((next as any)?.next)
      ? this.observe(next as qt.PartialObserver<T>)
      : this.do(next as (x: T) => void, error as any, done as any)
  }

  toObservable(): Observable<T> {
    const { kind, val, err } = this
    const y =
      kind === "N"
        ? of(val!)
        : kind === "E"
        ? throwError(() => err)
        : kind === "D"
        ? EMPTY
        : 0
    if (!y) throw new TypeError(`Unexpected note kind ${kind}`)
    return y
  }
}

export function createNote(kind: "N" | "E" | "D", val: any, err: any) {
  return { kind, val, err }
}

export function nextNote<T>(val: T) {
  return createNote("N", val, undefined) as qt.NextNote<T>
}

export function errNote(err: any): qt.ErrNote {
  return createNote("E", undefined, err) as any
}

export const DONE_NOTE = (() =>
  createNote("D", undefined, undefined) as qt.DoneNote)()

export function observeNote<T>(x: qt.ObsNote<T>, o: qt.PartialObserver<T>) {
  const { kind, val, err } = x as any
  if (typeof kind !== "string") throw new TypeError("Invalid note")
  kind === "N" ? o.next?.(val) : kind === "E" ? o.error?.(err) : o.done?.()
}
