import type * as qt from "./types.js"
import { Immer } from "./immer.js"

export * from "./utils.js"
export * from "./types.js"
export * from "./plugins.js"
export * from "./immer.js"
export * from "./use.js"
export { Immer } from "./immer.js"

const immer = new Immer()

export const produce: qt.Produce = immer.produce
export const produceWithPatches: qt.ProduceWithPatches =
  immer.produceWithPatches.bind(immer)

export const setAutoFreeze = immer.setAutoFreeze.bind(immer)
export const applyPatches = immer.applyPatches.bind(immer)
export const createDraft = immer.createDraft.bind(immer)
export const finishDraft = immer.finishDraft.bind(immer)

export function castDraft<T>(x: T): qt.Draft<T> {
  return x as any
}

export function castImmutable<T>(x: T): qt.Immutable<T> {
  return x as any
}
