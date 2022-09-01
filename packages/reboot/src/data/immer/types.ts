export class Nothing {
  private _!: unique symbol
}

export const NOTHING = Symbol.for("immer-nothing")
export const DRAFTABLE: unique symbol = Symbol.for("immer-draftable")
export const DRAFT_STATE: unique symbol = Symbol.for("immer-state")

export type AnyObj = { [k: string]: any }
export type AnyArray = Array<any>
export type AnySet = Set<any>
export type AnyMap = Map<any, any>

type AnyFunc = (...xs: any[]) => any
type Primitive = number | string | boolean
type Atomic = AnyFunc | Promise<any> | Date | RegExp

export type Objectish = AnyObj | AnyArray | AnyMap | AnySet
export type ObjectishNoSet = AnyObj | AnyArray | AnyMap

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

export type IfAvailable<T, Fallback = void> = true | false extends (
  T extends never ? true : false
)
  ? Fallback
  : keyof T extends never
  ? Fallback
  : T

type WeakReferences = IfAvailable<WeakMap<any, any>> | IfAvailable<WeakSet<any>>

export type WritableDraft<T> = { -readonly [K in keyof T]: Draft<T[K]> }

export type Draft<T> = T extends Primitive
  ? T
  : T extends Atomic
  ? T
  : T extends IfAvailable<ReadonlyMap<infer K, infer V>>
  ? Map<Draft<K>, Draft<V>>
  : T extends IfAvailable<ReadonlySet<infer V>>
  ? Set<Draft<V>>
  : T extends WeakReferences
  ? T
  : T extends object
  ? WritableDraft<T>
  : T

export type Immutable<T> = T extends Primitive
  ? T
  : T extends Atomic
  ? T
  : T extends IfAvailable<ReadonlyMap<infer K, infer V>>
  ? ReadonlyMap<Immutable<K>, Immutable<V>>
  : T extends IfAvailable<ReadonlySet<infer V>>
  ? ReadonlySet<Immutable<V>>
  : T extends WeakReferences
  ? T
  : T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T

export interface Patch {
  op: "replace" | "remove" | "add"
  path: (string | number)[]
  value?: any
}

export type PatchListener = (xs: Patch[], inverses: Patch[]) => void

type FromNothing<T> = T extends Nothing ? undefined : T

export type Produced<Base, Return> = Return extends void
  ? Base
  : Return extends Promise<infer Result>
  ? Promise<Result extends void ? Base : FromNothing<Result>>
  : FromNothing<Return>

type PatchesTuple<T> = readonly [T, Patch[], Patch[]]

type ValidRecipeReturnType<State> =
  | State
  | void
  | undefined
  | (State extends undefined ? Nothing : never)

type ValidRecipeReturnTypePossiblyPromise<State> =
  | ValidRecipeReturnType<State>
  | Promise<ValidRecipeReturnType<State>>

type PromisifyReturnIfNeeded<
  State,
  Recipe extends AnyFunc,
  UsePatches extends boolean
> = ReturnType<Recipe> extends Promise<any>
  ? Promise<UsePatches extends true ? PatchesTuple<State> : State>
  : UsePatches extends true
  ? PatchesTuple<State>
  : State

type InferRecipeFromCurried<Curried> = Curried extends (
  base: infer State,
  ...rest: infer Args
) => any
  ? ReturnType<Curried> extends State
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
    listener?: PatchListener
  ): Base

  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => Promise<ValidRecipeReturnType<D>>,
    listener?: PatchListener
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
    listener?: PatchListener
  ): PatchesTuple<Base>
  <Base, D = Draft<Base>>(
    base: Base,
    recipe: (draft: D) => Promise<ValidRecipeReturnType<D>>,
    listener?: PatchListener
  ): Promise<PatchesTuple<Base>>
}

export function never_used() {}

export interface Scope {
  patches_?: Patch[]
  inversePatches_?: Patch[]
  canAutoFreeze_: boolean
  drafts_: any[]
  parent_?: Scope | undefined
  patchListener_?: PatchListener
  immer_: Immer
  unfinalizedDrafts_: number
}

export interface BaseState {
  parent_?: State
  scope_: Scope
  modified_: boolean
  finalized_: boolean
  isManual_: boolean
}

interface ProxyBase extends BaseState {
  assigned_: {
    [property: string]: boolean
  }
  parent_?: State
  revoke_(): void
}

export interface ProxyObject extends ProxyBase {
  type_: ProxyType.Obj
  base_: any
  copy_: any
  draft_: Drafted<AnyObj, ProxyObject>
}

export interface ProxyArray extends ProxyBase {
  type_: ProxyType.Array
  base_: AnyArray
  copy_: AnyArray | null
  draft_: Drafted<AnyArray, ProxyArray>
}

export type ProxyState = ProxyObject | ProxyArray

export type State = ProxyObject | ProxyArray | MapState | SetState

export type Drafted<Base = any, T extends State = State> = {
  [DRAFT_STATE]: T
} & Base

export interface MapState extends BaseState {
  type_: ProxyType.Map
  copy_: AnyMap | undefined
  assigned_: Map<any, boolean> | undefined
  base_: AnyMap
  revoked_: boolean
  draft_: Drafted<AnyMap, MapState>
}

export interface SetState extends BaseState {
  type_: ProxyType.Set
  copy_: AnySet | undefined
  base_: AnySet
  drafts_: Map<any, Drafted>
  revoked_: boolean
  draft_: Drafted<AnySet, SetState>
}

export type PatchPath = (string | number)[]
