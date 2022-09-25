export class Nothing {
  static readonly _: unique symbol
}

export const nothing: Nothing = Symbol.for("immer-nothing")
export const immerable: unique symbol = Symbol.for("immer-draftable")
export const DRAFT_STATE: unique symbol = Symbol.for("immer-state")

export const enum QType {
  Obj,
  Array,
  Map,
  Set,
}

export const enum ProxyType {
  Obj,
  Array,
  Map,
  Set,
}

export type AnyObj = { [k: string]: any }
export type AnyArray = Array<any>
export type AnySet = Set<any>
export type AnyMap = Map<any, any>

export type Objectish = AnyObj | AnyArray | AnyMap | AnySet
export type ObjectishNoSet = AnyObj | AnyArray | AnyMap

type AnyFunc = (...xs: any[]) => any
type Primitive = number | string | boolean
type Atomic = AnyFunc | Promise<any> | Date | RegExp
type Weaks = WeakMap<any, any> | WeakSet<any>

export type Draft<T> = T extends Primitive
  ? T
  : T extends Atomic
  ? T
  : T extends ReadonlyMap<infer K, infer V>
  ? Map<Draft<K>, Draft<V>>
  : T extends ReadonlySet<infer V>
  ? Set<Draft<V>>
  : T extends Weaks
  ? T
  : T extends object
  ? Mutable<T>
  : T

export type Mutable<T> = { -readonly [K in keyof T]: Draft<T[K]> }

export type Immutable<T> = T extends Primitive
  ? T
  : T extends Atomic
  ? T
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<Immutable<K>, Immutable<V>>
  : T extends ReadonlySet<infer V>
  ? ReadonlySet<Immutable<V>>
  : T extends Weaks
  ? T
  : T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T

export interface Patch {
  op: "replace" | "remove" | "add"
  path: (string | number)[]
  value?: any
}

export type Listener = (xs: Patch[], inverses: Patch[]) => void

type FromNothing<T> = T extends Nothing ? undefined : T

export type Produced<X, Y> = Y extends void
  ? X
  : Y extends Promise<infer T>
  ? Promise<T extends void ? X : FromNothing<T>>
  : FromNothing<Y>

type PatchesTuple<T> = readonly [T, Patch[], Patch[]]

type RecipeReturn<T> = T | void | undefined | (T extends undefined ? Nothing : never)

type ReturnOrPromise<T> = RecipeReturn<T> | Promise<RecipeReturn<T>>

type PromisifyReturn<T, Recipe extends AnyFunc, UsePatches extends boolean> = ReturnType<Recipe> extends Promise<any>
  ? Promise<UsePatches extends true ? PatchesTuple<T> : T>
  : UsePatches extends true
  ? PatchesTuple<T>
  : T

type RecipeFromCurried<T> = T extends (x: infer X, ...xs: infer Xs) => any
  ? ReturnType<T> extends X
    ? (x: Draft<X>, ...xs: Xs) => RecipeReturn<Draft<X>>
    : never
  : never

type StateFromCurried<T> = T extends (x: infer X, ...xs: any[]) => any ? X : never

type CurriedFromRecipe<R, UsePatches extends boolean> = R extends (x: infer X, ...xs: infer Xs) => any
  ? ReturnType<R> extends ReturnOrPromise<X>
    ? (x: Immutable<X>, ...xs: Xs) => PromisifyReturn<X, R, UsePatches>
    : never
  : never

type CurriedFromState<S, R, UsePatches extends boolean> = R extends (s: Draft<S>, ...xs: infer Xs) => ReturnOrPromise<S>
  ? (s?: S | undefined, ...xs: Xs) => PromisifyReturn<S, R, UsePatches>
  : never

export interface Produce {
  <R extends AnyFunc>(recipe: R): CurriedFromRecipe<R, false>

  <S, R extends AnyFunc>(recipe: R, s0: S): CurriedFromState<S, R, false>

  <X>(recipe: (x: Draft<X>, x0: X) => RecipeReturn<X>): (x?: X) => X

  <T>(recipe: RecipeFromCurried<T>, s0?: StateFromCurried<T>): T

  <X, Xs extends any[]>(recipe: (x: Draft<X>, ...xs: Xs) => RecipeReturn<X>, x0: X): (x?: X, ...xs: Xs) => X

  <X>(recipe: (x: Draft<X>) => RecipeReturn<X>): (x: X) => X

  <X, Xs extends any[]>(recipe: (x: Draft<X>, ...xs: Xs) => RecipeReturn<X>): (x: X, ...xs: Xs) => X

  <X, D = Draft<X>>(x: X, recipe: (d: D) => RecipeReturn<D>, listener?: Listener): X

  <X, D = Draft<X>>(x: X, recipe: (d: D) => Promise<RecipeReturn<D>>, listener?: Listener): Promise<X>
}

export interface ProduceWithPatches {
  <R extends AnyFunc>(recipe: R): CurriedFromRecipe<R, true>

  <S, R extends AnyFunc>(recipe: R, s0: S): CurriedFromState<S, R, true>

  <X, D = Draft<X>>(x: X, recipe: (d: D) => RecipeReturn<D>, listener?: Listener): PatchesTuple<X>

  <X, D = Draft<X>>(x: X, recipe: (d: D) => Promise<RecipeReturn<D>>, listener?: Listener): Promise<PatchesTuple<X>>
}

export interface Immer {
  autoFreeze: boolean
  produce: Produce
  produceWithPatches: ProduceWithPatches
}

export interface Scope {
  canAutoFreeze: boolean
  drafts: any[]
  immer: Immer
  inverses?: Patch[]
  listener?: Listener
  parent?: Scope | undefined
  patches?: Patch[]
  unfinalized: number
}

export interface BaseState {
  finalized: boolean
  manual: boolean
  modified: boolean
  parent?: State | undefined
  scope: Scope
}

interface ProxyBase extends BaseState {
  assigned: { [k: string]: boolean }
  parent?: State | undefined
  revoke(): void
}

export interface ProxyObj extends ProxyBase {
  base: any
  copy: any
  draft: Drafted<AnyObj, ProxyObj>
  type: ProxyType.Obj
}

export interface ProxyArray extends ProxyBase {
  base: AnyArray
  copy: AnyArray | null
  draft: Drafted<AnyArray, ProxyArray>
  type: ProxyType.Array
}

export type ProxyState = ProxyObj | ProxyArray
export type State = ProxyObj | ProxyArray | MapState | SetState

export type Drafted<Base = any, T extends State = State> = {
  [DRAFT_STATE]: T
} & Base

export interface MapState extends BaseState {
  assigned: Map<any, boolean> | undefined
  base: AnyMap
  copy: AnyMap | undefined
  draft: Drafted<AnyMap, MapState>
  revoked: boolean
  type: ProxyType.Map
}

export interface SetState extends BaseState {
  base: AnySet
  copy: AnySet | undefined
  draft: Drafted<AnySet, SetState>
  drafts: Map<any, Drafted>
  revoked: boolean
  type: ProxyType.Set
}

export type PatchPath = (string | number)[]
