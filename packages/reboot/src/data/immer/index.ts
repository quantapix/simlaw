export * from "./utils.js"
export * from "./types.js"
export * from "./plugins.js"
export * from "./immer.js"

import {
  current,
  Draft,
  DRAFTABLE as immerable,
  freeze,
  Immer,
  Immutable,
  IProduce,
  IProduceWithPatches,
  isDraft,
  isDraftable,
  NOTHING as nothing,
  original,
  Patch,
  PatchListener,
} from "./utils.js"

const immer = new Immer()

export const produce: IProduce = immer.produce
export default produce

export const produceWithPatches: IProduceWithPatches =
  immer.produceWithPatches.bind(immer)

export const setAutoFreeze = immer.setAutoFreeze.bind(immer)
export const setUseProxies = immer.setUseProxies.bind(immer)

export const applyPatches = immer.applyPatches.bind(immer)

export const createDraft = immer.createDraft.bind(immer)

export const finishDraft = immer.finishDraft.bind(immer)

export function castDraft<T>(value: T): Draft<T> {
  return value as any
}

export function castImmutable<T>(value: T): Immutable<T> {
  return value as any
}

export { Immer }

export { enableES5 } from "../plugins/es5.js"
export { enablePatches } from "../plugins/patches.js"
export { enableMapSet } from "../plugins/mapset.js"
export { enableAllPlugins } from "./plugins.js"
