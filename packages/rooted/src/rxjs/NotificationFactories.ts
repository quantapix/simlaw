import {
  CompleteNotification,
  NextNotification,
  ErrorNotification,
} from "./types"

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
