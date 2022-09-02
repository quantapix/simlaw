export class Unknown {
  static readonly _: unique symbol
}

export const NOTHING: unique symbol = Symbol.for("immer-nothing")
export const DRAFTABLE: unique symbol = Symbol.for("immer-draftable")
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

export type WritableDraft<T> = { -readonly [K in keyof T]: Draft<T[K]> }

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
  ? WritableDraft<T>
  : T

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

type FromUnknown<T> = T extends Unknown ? undefined : T

export type Produced<T, R> = R extends void
  ? T
  : R extends Promise<infer R>
  ? Promise<R extends void ? T : FromUnknown<R>>
  : FromUnknown<R>

type PatchesTuple<T> = readonly [T, Patch[], Patch[]]

type ValidRecipeReturnType<T> =
  | T
  | void
  | undefined
  | (T extends undefined ? Unknown : never)

type ValidRecipeReturnTypePossiblyPromise<T> =
  | ValidRecipeReturnType<T>
  | Promise<ValidRecipeReturnType<T>>

type PromisifyReturnIfNeeded<
  T,
  Recipe extends AnyFunc,
  UsePatches extends boolean
> = ReturnType<Recipe> extends Promise<any>
  ? Promise<UsePatches extends true ? PatchesTuple<T> : T>
  : UsePatches extends true
  ? PatchesTuple<T>
  : T

type InferRecipeFromCurried<T> = T extends (
  base: infer State,
  ...rest: infer Args
) => any
  ? ReturnType<T> extends State
    ? (
        draft: Draft<State>,
        ...rest: Args
      ) => ValidRecipeReturnType<Draft<State>>
    : never
  : never

type InferInitialStateFromCurried<Curried> = Curried extends (
  base: infer State,
  ...rest: any[]
) => any
  ? State
  : never

type InferCurriedFromRecipe<
  Recipe,
  UsePatches extends boolean
> = Recipe extends (draft: infer DraftState, ...args: infer RestArgs) => any // verify return type
  ? ReturnType<Recipe> extends ValidRecipeReturnTypePossiblyPromise<DraftState>
    ? (
        base: Immutable<DraftState>,
        ...args: RestArgs
      ) => PromisifyReturnIfNeeded<DraftState, Recipe, UsePatches> // N.b. we return mutable draftstate, in case the recipe's first arg isn't read only, and that isn't expected as output either
    : never
  : never

type InferCurriedFromInitialStateAndRecipe<
  State,
  Recipe,
  UsePatches extends boolean
> = Recipe extends (
  draft: Draft<State>,
  ...rest: infer RestArgs
) => ValidRecipeReturnTypePossiblyPromise<State>
  ? (
      base?: State | undefined,
      ...args: RestArgs
    ) => PromisifyReturnIfNeeded<State, Recipe, UsePatches>
  : never

export interface IProduce {
  <Curried>(
    recipe: InferRecipeFromCurried<Curried>,
    initialState?: InferInitialStateFromCurried<Curried>
  ): Curried

  <Recipe extends AnyFunc>(recipe: Recipe): InferCurriedFromRecipe<
    Recipe,
    false
  >
  <State>(
    recipe: (
      state: Draft<State>,
      initialState: State
    ) => ValidRecipeReturnType<State>
  ): (state?: State) => State

  <State, Args extends any[]>(
    recipe: (
      state: Draft<State>,
      ...args: Args
    ) => ValidRecipeReturnType<State>,
    initialState: State
  ): (state?: State, ...args: Args) => State

  <State>(recipe: (state: Draft<State>) => ValidRecipeReturnType<State>): (
    state: State
  ) => State

  <State, Args extends any[]>(
    recipe: (state: Draft<State>, ...args: Args) => ValidRecipeReturnType<State>
  ): (state: State, ...args: Args) => State

  <State, Recipe extends AnyFunc>(
    recipe: Recipe,
    initialState: State
  ): InferCurriedFromInitialStateAndRecipe<State, Recipe, false>

  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => ValidRecipeReturnType<D>,
    listener?: Listener
  ): Base

  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => Promise<ValidRecipeReturnType<D>>,
    listener?: Listener
  ): Promise<Base>
}

export interface IProduceWithPatches {
  <Recipe extends AnyFunc>(recipe: Recipe): InferCurriedFromRecipe<Recipe, true>
  <State, Recipe extends AnyFunc>(
    recipe: Recipe,
    initialState: State
  ): InferCurriedFromInitialStateAndRecipe<State, Recipe, true>
  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => ValidRecipeReturnType<D>,
    listener?: Listener
  ): PatchesTuple<Base>
  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => Promise<ValidRecipeReturnType<D>>,
    listener?: Listener
  ): Promise<PatchesTuple<Base>>
}

export function never_used() {}

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
  parent?: State
  scope: Scope
  modified: boolean
  finalized: boolean
  manual: boolean
}

interface ProxyBase extends BaseState {
  assigned: { [k: string]: boolean }
  parent?: State
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
