import { PayloadAction, isFSA, createDraftSafeSelector } from "./create.js"
import type { IsAny } from "./types.js"
import * as qi from "../immer/index.js"
import type { Selector } from "reselect"

export function createEntityAdapter<T>(
  options: {
    selectId?: IdSelector<T>
    sortComparer?: false | Comparer<T>
  } = {}
): EntityAdapter<T> {
  const { selectId, sortComparer }: EntityDefinition<T> = {
    sortComparer: false,
    selectId: (instance: any) => instance.id,
    ...options,
  }
  const stateFactory = createInitialStateFactory<T>()
  const selectorsFactory = createSelectorsFactory<T>()
  const stateAdapter = sortComparer
    ? createSortedStateAdapter(selectId, sortComparer)
    : createUnsortedStateAdapter(selectId)
  return {
    selectId,
    sortComparer,
    ...stateFactory,
    ...selectorsFactory,
    ...stateAdapter,
  }
}
export function getInitialEntityState<V>(): EntityState<V> {
  return {
    ids: [],
    entities: {},
  }
}
export function createInitialStateFactory<V>() {
  function getInitialState(): EntityState<V>
  function getInitialState<S extends object>(
    additionalState: S
  ): EntityState<V> & S
  function getInitialState(additionalState: any = {}): any {
    return Object.assign(getInitialEntityState(), additionalState)
  }
  return { getInitialState }
}
export type EntityId = number | string
export type Comparer<T> = (a: T, b: T) => number
export type IdSelector<T> = (model: T) => EntityId
export interface DictionaryNum<T> {
  [id: number]: T | undefined
}
export interface Dictionary<T> extends DictionaryNum<T> {
  [id: string]: T | undefined
}
export type Update<T> = { id: EntityId; changes: Partial<T> }
export interface EntityState<T> {
  ids: EntityId[]
  entities: Dictionary<T>
}
export interface EntityDefinition<T> {
  selectId: IdSelector<T>
  sortComparer: false | Comparer<T>
}
export type PreventAny<S, T> = IsAny<S, EntityState<T>, S>
export interface EntityStateAdapter<T> {
  addOne<S extends EntityState<T>>(state: PreventAny<S, T>, entity: T): S
  addOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    action: PayloadAction<T>
  ): S
  addMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S
  addMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S
  setOne<S extends EntityState<T>>(state: PreventAny<S, T>, entity: T): S
  setOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    action: PayloadAction<T>
  ): S
  setMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S
  setMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S
  setAll<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S
  setAll<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S
  removeOne<S extends EntityState<T>>(state: PreventAny<S, T>, key: EntityId): S
  removeOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    key: PayloadAction<EntityId>
  ): S
  removeMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    keys: readonly EntityId[]
  ): S
  removeMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    keys: PayloadAction<readonly EntityId[]>
  ): S
  removeAll<S extends EntityState<T>>(state: PreventAny<S, T>): S
  updateOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    update: Update<T>
  ): S
  updateOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    update: PayloadAction<Update<T>>
  ): S
  updateMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    updates: ReadonlyArray<Update<T>>
  ): S
  updateMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    updates: PayloadAction<ReadonlyArray<Update<T>>>
  ): S
  upsertOne<S extends EntityState<T>>(state: PreventAny<S, T>, entity: T): S
  upsertOne<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entity: PayloadAction<T>
  ): S
  upsertMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S
  upsertMany<S extends EntityState<T>>(
    state: PreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S
}
export interface EntitySelectors<T, V> {
  selectIds: (state: V) => EntityId[]
  selectEntities: (state: V) => Dictionary<T>
  selectAll: (state: V) => T[]
  selectTotal: (state: V) => number
  selectById: (state: V, id: EntityId) => T | undefined
}
export interface EntityAdapter<T> extends EntityStateAdapter<T> {
  selectId: IdSelector<T>
  sortComparer: false | Comparer<T>
  getInitialState(): EntityState<T>
  getInitialState<S extends object>(state: S): EntityState<T> & S
  getSelectors(): EntitySelectors<T, EntityState<T>>
  getSelectors<V>(
    selectState: (state: V) => EntityState<T>
  ): EntitySelectors<T, V>
}
export function createSortedStateAdapter<T>(
  selectId: IdSelector<T>,
  sort: Comparer<T>
): EntityStateAdapter<T> {
  type R = EntityState<T>
  const { removeOne, removeMany, removeAll } =
    createUnsortedStateAdapter(selectId)
  function addOneMutably(entity: T, state: R): void {
    return addManyMutably([entity], state)
  }
  function addManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    const models = newEntities.filter(
      model => !(selectIdValue(model, selectId) in state.entities)
    )
    if (models.length !== 0) {
      merge(models, state)
    }
  }
  function setOneMutably(entity: T, state: R): void {
    return setManyMutably([entity], state)
  }
  function setManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    if (newEntities.length !== 0) {
      merge(newEntities, state)
    }
  }
  function setAllMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    state.entities = {}
    state.ids = []
    addManyMutably(newEntities, state)
  }
  function updateOneMutably(update: Update<T>, state: R): void {
    return updateManyMutably([update], state)
  }
  function updateManyMutably(
    updates: ReadonlyArray<Update<T>>,
    state: R
  ): void {
    let appliedUpdates = false
    for (const update of updates) {
      const entity = state.entities[update.id]
      if (!entity) {
        continue
      }
      appliedUpdates = true
      Object.assign(entity, update.changes)
      const newId = selectId(entity)
      if (update.id !== newId) {
        delete state.entities[update.id]
        state.entities[newId] = entity
      }
    }
    if (appliedUpdates) {
      resortEntities(state)
    }
  }
  function upsertOneMutably(entity: T, state: R): void {
    return upsertManyMutably([entity], state)
  }
  function upsertManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    const [added, updated] = splitAddedUpdatedEntities<T>(
      newEntities,
      selectId,
      state
    )
    updateManyMutably(updated, state)
    addManyMutably(added, state)
  }
  function areArraysEqual(a: readonly unknown[], b: readonly unknown[]) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length && i < b.length; i++) {
      if (a[i] === b[i]) {
        continue
      }
      return false
    }
    return true
  }
  function merge(models: readonly T[], state: R): void {
    models.forEach(model => {
      state.entities[selectId(model)] = model
    })
    resortEntities(state)
  }
  function resortEntities(state: R) {
    const allEntities = Object.values(state.entities) as T[]
    allEntities.sort(sort)
    const newSortedIds = allEntities.map(selectId)
    const { ids } = state
    if (!areArraysEqual(ids, newSortedIds)) {
      state.ids = newSortedIds
    }
  }
  return {
    removeOne,
    removeMany,
    removeAll,
    addOne: createStateOperator(addOneMutably),
    updateOne: createStateOperator(updateOneMutably),
    upsertOne: createStateOperator(upsertOneMutably),
    setOne: createStateOperator(setOneMutably),
    setMany: createStateOperator(setManyMutably),
    setAll: createStateOperator(setAllMutably),
    addMany: createStateOperator(addManyMutably),
    updateMany: createStateOperator(updateManyMutably),
    upsertMany: createStateOperator(upsertManyMutably),
  }
}
export function createSingleArgumentStateOperator<V>(
  mutator: (state: EntityState<V>) => void
) {
  const operator = createStateOperator((_: undefined, state: EntityState<V>) =>
    mutator(state)
  )
  return function operation<S extends EntityState<V>>(
    state: PreventAny<S, V>
  ): S {
    return operator(state as S, undefined)
  }
}
export function createStateOperator<V, R>(
  mutator: (arg: R, state: EntityState<V>) => void
) {
  return function operation<S extends EntityState<V>>(
    state: S,
    arg: R | PayloadAction<R>
  ): S {
    function isPayloadActionArgument(
      arg: R | PayloadAction<R>
    ): arg is PayloadAction<R> {
      return isFSA(arg)
    }
    const runMutator = (draft: EntityState<V>) => {
      if (isPayloadActionArgument(arg)) {
        mutator(arg.payload, draft)
      } else {
        mutator(arg, draft)
      }
    }
    if (qi.isDraft(state)) {
      runMutator(state)
      return state
    } else {
      return qi.produce(state, runMutator)
    }
  }
}
export function createSelectorsFactory<T>() {
  function getSelectors(): EntitySelectors<T, EntityState<T>>
  function getSelectors<V>(
    selectState: (state: V) => EntityState<T>
  ): EntitySelectors<T, V>
  function getSelectors<V>(
    selectState?: (state: V) => EntityState<T>
  ): EntitySelectors<T, any> {
    const selectIds = (state: EntityState<T>) => state.ids
    const selectEntities = (state: EntityState<T>) => state.entities
    const selectAll = createDraftSafeSelector(
      selectIds,
      selectEntities,
      (ids: any, entities: any): T[] => ids.map((id: any) => entities[id]!)
    )
    const selectId = (_: unknown, id: EntityId) => id
    const selectById = (entities: Dictionary<T>, id: EntityId) => entities[id]
    const selectTotal = createDraftSafeSelector(
      selectIds,
      (ids: any) => ids.length
    )
    if (!selectState) {
      return {
        selectIds,
        selectEntities,
        selectAll,
        selectTotal,
        selectById: createDraftSafeSelector(
          selectEntities,
          selectId,
          selectById
        ),
      }
    }
    const selectGlobalizedEntities = createDraftSafeSelector(
      selectState as Selector<V, EntityState<T>>,
      selectEntities
    )
    return {
      selectIds: createDraftSafeSelector(selectState, selectIds),
      selectEntities: selectGlobalizedEntities,
      selectAll: createDraftSafeSelector(selectState, selectAll),
      selectTotal: createDraftSafeSelector(selectState, selectTotal),
      selectById: createDraftSafeSelector(
        selectGlobalizedEntities,
        selectId,
        selectById
      ),
    }
  }
  return { getSelectors }
}
export function createUnsortedStateAdapter<T>(
  selectId: IdSelector<T>
): EntityStateAdapter<T> {
  type R = EntityState<T>
  function addOneMutably(entity: T, state: R): void {
    const key = selectIdValue(entity, selectId)
    if (key in state.entities) {
      return
    }
    state.ids.push(key)
    state.entities[key] = entity
  }
  function addManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    for (const entity of newEntities) {
      addOneMutably(entity, state)
    }
  }
  function setOneMutably(entity: T, state: R): void {
    const key = selectIdValue(entity, selectId)
    if (!(key in state.entities)) {
      state.ids.push(key)
    }
    state.entities[key] = entity
  }
  function setManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    for (const entity of newEntities) {
      setOneMutably(entity, state)
    }
  }
  function setAllMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities)
    state.ids = []
    state.entities = {}
    addManyMutably(newEntities, state)
  }
  function removeOneMutably(key: EntityId, state: R): void {
    return removeManyMutably([key], state)
  }
  function removeManyMutably(keys: readonly EntityId[], state: R): void {
    let didMutate = false
    keys.forEach(key => {
      if (key in state.entities) {
        delete state.entities[key]
        didMutate = true
      }
    })
    if (didMutate) {
      state.ids = state.ids.filter(id => id in state.entities)
    }
  }
  function removeAllMutably(state: R): void {
    Object.assign(state, {
      ids: [],
      entities: {},
    })
  }
  function takeNewKey(
    keys: { [id: string]: EntityId },
    update: Update<T>,
    state: R
  ): boolean {
    const original = state.entities[update.id]
    const updated: T = Object.assign({}, original, update.changes)
    const newKey = selectIdValue(updated, selectId)
    const hasNewKey = newKey !== update.id
    if (hasNewKey) {
      keys[update.id] = newKey
      delete state.entities[update.id]
    }
    state.entities[newKey] = updated
    return hasNewKey
  }
  function updateOneMutably(update: Update<T>, state: R): void {
    return updateManyMutably([update], state)
  }
  function updateManyMutably(
    updates: ReadonlyArray<Update<T>>,
    state: R
  ): void {
    const newKeys: { [id: string]: EntityId } = {}
    const updatesPerEntity: { [id: string]: Update<T> } = {}
    updates.forEach(update => {
      if (update.id in state.entities) {
        updatesPerEntity[update.id] = {
          id: update.id,
          changes: {
            ...(updatesPerEntity[update.id]
              ? updatesPerEntity[update.id]?.changes
              : null),
            ...update.changes,
          },
        }
      }
    })
    updates = Object.values(updatesPerEntity)
    const didMutateEntities = updates.length > 0
    if (didMutateEntities) {
      const didMutateIds =
        updates.filter(update => takeNewKey(newKeys, update, state)).length > 0
      if (didMutateIds) {
        state.ids = Object.keys(state.entities)
      }
    }
  }
  function upsertOneMutably(entity: T, state: R): void {
    return upsertManyMutably([entity], state)
  }
  function upsertManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    const [added, updated] = splitAddedUpdatedEntities<T>(
      newEntities,
      selectId,
      state
    )
    updateManyMutably(updated, state)
    addManyMutably(added, state)
  }
  return {
    removeAll: createSingleArgumentStateOperator(removeAllMutably),
    addOne: createStateOperator(addOneMutably),
    addMany: createStateOperator(addManyMutably),
    setOne: createStateOperator(setOneMutably),
    setMany: createStateOperator(setManyMutably),
    setAll: createStateOperator(setAllMutably),
    updateOne: createStateOperator(updateOneMutably),
    updateMany: createStateOperator(updateManyMutably),
    upsertOne: createStateOperator(upsertOneMutably),
    upsertMany: createStateOperator(upsertManyMutably),
    removeOne: createStateOperator(removeOneMutably),
    removeMany: createStateOperator(removeManyMutably),
  }
}
export function selectIdValue<T>(entity: T, selectId: IdSelector<T>) {
  const key = selectId(entity)
  if (process.env["NODE_ENV"] !== "production" && key === undefined) {
    console.warn(
      "The entity passed to the `selectId` implementation returned undefined.",
      "You should probably provide your own `selectId` implementation.",
      "The entity that was passed:",
      entity,
      "The `selectId` implementation:",
      selectId.toString()
    )
  }
  return key
}
export function ensureEntitiesArray<T>(
  entities: readonly T[] | Record<EntityId, T>
): readonly T[] {
  if (!Array.isArray(entities)) {
    entities = Object.values(entities)
  }
  return entities
}
export function splitAddedUpdatedEntities<T>(
  newEntities: readonly T[] | Record<EntityId, T>,
  selectId: IdSelector<T>,
  state: EntityState<T>
): [T[], Update<T>[]] {
  newEntities = ensureEntitiesArray(newEntities)
  const added: T[] = []
  const updated: Update<T>[] = []
  for (const entity of newEntities) {
    const id = selectIdValue(entity, selectId)
    if (id in state.entities) {
      updated.push({ id, changes: entity })
    } else {
      added.push(entity)
    }
  }
  return [added, updated]
}
