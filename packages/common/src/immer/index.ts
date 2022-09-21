import type * as qt from "./types.js"
import { Immer } from "./main.js"

export * from "./utils.js"
export * from "./types.js"
export * from "./plugins.js"
export * from "./main.js"
export * from "./use.js"
export { Immer } from "./main.js"

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
