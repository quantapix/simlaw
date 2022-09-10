import type {
  EntityAdapter,
  ActionCreatorWithPayload,
  ActionCreatorWithoutPayload,
  EntityStateAdapter,
  EntityId,
  Update,
} from "@reduxjs/toolkit"
import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { expectType } from "./helpers"
function extractReducers<T>(
  adapter: EntityAdapter<T>
): Omit<EntityStateAdapter<T>, "map"> {
  const { selectId, sortComparer, getInitialState, getSelectors, ...rest } =
    adapter
  return rest
}
{
  type Entity = {
    value: string
  }
  const adapter = createEntityAdapter<Entity>()
  const slice = createSlice({
    name: "test",
    initialState: adapter.getInitialState(),
    reducers: {
      ...extractReducers(adapter),
    },
  })
  expectType<ActionCreatorWithPayload<Entity>>(slice.actions.addOne)
  expectType<
    ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.addMany)
  expectType<
    ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.setAll)
  expectType<ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
    slice.actions.addMany
  )
  expectType<ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
    slice.actions.setAll
  )
  expectType<ActionCreatorWithPayload<EntityId>>(slice.actions.removeOne)
  expectType<ActionCreatorWithPayload<ReadonlyArray<EntityId>>>(
    slice.actions.removeMany
  )
  expectType<ActionCreatorWithPayload<EntityId[]>>(slice.actions.removeMany)
  expectType<ActionCreatorWithoutPayload>(slice.actions.removeAll)
  expectType<ActionCreatorWithPayload<Update<Entity>>>(slice.actions.updateOne)
  expectType<ActionCreatorWithPayload<Update<Entity>[]>>(
    slice.actions.updateMany
  )
  expectType<ActionCreatorWithPayload<ReadonlyArray<Update<Entity>>>>(
    slice.actions.updateMany
  )
  expectType<ActionCreatorWithPayload<Entity>>(slice.actions.upsertOne)
  expectType<
    ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.upsertMany)
  expectType<ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
    slice.actions.upsertMany
  )
}
{
  type Entity = {
    value: string
  }
  type Entity2 = {
    value2: string
  }
  const adapter = createEntityAdapter<Entity>()
  const adapter2 = createEntityAdapter<Entity2>()
  createSlice({
    name: "test",
    initialState: adapter.getInitialState(),
    reducers: {
      addOne: adapter.addOne,
      addOne2: adapter2.addOne,
    },
  })
}
{
  type Entity = {
    value: string
  }
  const adapter = createEntityAdapter<Entity>()
  createSlice({
    name: "test",
    initialState: adapter.getInitialState({ extraData: "test" }),
    reducers: {
      addOne: adapter.addOne,
    },
  })
}
{
  type Entity = {
    value: string
  }
  const adapter = createEntityAdapter<Entity>()
  createSlice({
    name: "test",
    initialState: { somethingElse: "" },
    reducers: {
      addOne: adapter.addOne,
    },
  })
}
