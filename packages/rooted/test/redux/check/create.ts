/* eslint-disable no-lone-blocks */
import type { Action, AnyAction, ActionCreator } from "redux"
import type {
  PayloadAction,
  PayloadActionCreator,
  ActionCreatorWithoutPayload,
  ActionCreatorWithOptionalPayload,
  ActionCreatorWithPayload,
  ActionCreatorWithNonInferrablePayload,
  ActionCreatorWithPreparedPayload,
} from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import type { IsAny } from "@internal/tsHelpers"
import { expectType } from "./helpers"
import type { AnyAction, SerializedError, AsyncThunk } from "@reduxjs/toolkit"
import { createAsyncThunk, createReducer, unwrapResult } from "@reduxjs/toolkit"
import type { ThunkDispatch } from "redux-thunk"
import type { AxiosError } from "axios"
import apiRequest from "axios"
import type { IsAny, IsUnknown } from "@internal/tsHelpers"
import { expectType } from "./helpers"
import type {
  AsyncThunkFulfilledActionCreator,
  AsyncThunkRejectedActionCreator,
} from "@internal/createAsyncThunk"
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
import type { Reducer } from "redux"
import type { ActionReducerMapBuilder } from "@reduxjs/toolkit"
import { createReducer, createAction } from "@reduxjs/toolkit"
import { expectType } from "./helpers"
import type { Action, AnyAction, Reducer } from "redux"
import type {
  ActionCreatorWithNonInferrablePayload,
  ActionCreatorWithOptionalPayload,
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  ActionCreatorWithPreparedPayload,
  ActionReducerMapBuilder,
  PayloadAction,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
} from "@reduxjs/toolkit"
import { createAction, createSlice } from "@reduxjs/toolkit"
import { expectType } from "./helpers"
import { getDefaultMiddleware, configureStore } from "@reduxjs/toolkit"
import type { Middleware } from "redux"
import type { SerializedError } from "@internal/createAsyncThunk"
import { createAsyncThunk } from "@internal/createAsyncThunk"
import { executeReducerBuilderCallback } from "@internal/mapBuilders"
import type { AnyAction } from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import { expectExactType, expectType } from "./helpers"

{
  const action: PayloadAction<number> = { type: "", payload: 5 }
  const numberPayload: number = action.payload
  const stringPayload: string = action.payload
}
{
  const action: PayloadAction = { type: "", payload: 5 }
  const numberPayload: number = action.payload
  const stringPayload: string = action.payload
}
{
  const action: PayloadAction<number> = { type: "", payload: 5 }
  const action2: PayloadAction = { type: 1, payload: 5 }
}
{
  const action: PayloadAction<number> = { type: "", payload: 5 }
  const stringAction: Action<string> = action
}
{
  const actionCreator = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload,
    }),
    { type: "action" }
  ) as PayloadActionCreator<number | undefined>
  expectType<PayloadAction<number | undefined>>(actionCreator(1))
  expectType<PayloadAction<number | undefined>>(actionCreator())
  expectType<PayloadAction<number | undefined>>(actionCreator(undefined))
  expectType<PayloadAction<number>>(actionCreator())
  expectType<PayloadAction<undefined>>(actionCreator(1))
}
{
  const payloadActionCreator = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload,
    }),
    { type: "action" }
  ) as PayloadActionCreator
  const actionCreator: ActionCreator<AnyAction> = payloadActionCreator
  const payloadActionCreator2 = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload: payload || 1,
    }),
    { type: "action" }
  ) as PayloadActionCreator<number>
  const actionCreator2: ActionCreator<PayloadAction<number>> =
    payloadActionCreator2
}
{
  const increment = createAction<number, "increment">("increment")
  const n: number = increment(1).payload
  increment("").payload
}
{
  const increment = createAction("increment")
  const n: number = increment(1).payload
}
{
  const increment = createAction<number, "increment">("increment")
  const n: string = increment(1).type
  const s: "increment" = increment(1).type
  const r: "other" = increment(1).type
  const q: number = increment(1).type
}
{
  const strLenAction = createAction("strLen", (payload: string) => ({
    payload: payload.length,
  }))
  expectType<string>(strLenAction("test").type)
}
{
  const strLenAction = createAction("strLen", (payload: string) => ({
    payload: payload.length,
  }))
  expectType<number>(strLenAction("test").payload)
  expectType<string>(strLenAction("test").payload)
  const error: any = strLenAction("test").error
}
{
  const strLenMetaAction = createAction("strLenMeta", (payload: string) => ({
    payload,
    meta: payload.length,
  }))
  expectType<number>(strLenMetaAction("test").meta)
  expectType<string>(strLenMetaAction("test").meta)
  const error: any = strLenMetaAction("test").error
}
{
  const boolErrorAction = createAction("boolError", (payload: string) => ({
    payload,
    error: true,
  }))
  expectType<boolean>(boolErrorAction("test").error)
  expectType<string>(boolErrorAction("test").error)
}
{
  const strErrorAction = createAction("strError", (payload: string) => ({
    payload,
    error: "this is an error",
  }))
  expectType<string>(strErrorAction("test").error)
  expectType<boolean>(strErrorAction("test").error)
}
{
  const action = createAction<{ input?: string }>("ACTION")
  const t: string | undefined = action({ input: "" }).payload.input
  const u: number = action({ input: "" }).payload.input
  const v: number = action({ input: 3 }).payload.input
}
{
  const oops = createAction("oops", (x: any) => ({
    payload: x,
    error: x,
    meta: x,
  }))
  type Ret = ReturnType<typeof oops>
  const payload: IsAny<Ret["payload"], true, false> = true
  const error: IsAny<Ret["error"], true, false> = true
  const meta: IsAny<Ret["meta"], true, false> = true
  const payloadNotAny: IsAny<Ret["payload"], true, false> = false
  const errorNotAny: IsAny<Ret["error"], true, false> = false
  const metaNotAny: IsAny<Ret["meta"], true, false> = false
}
{
  {
    const actionCreator = createAction<string, "test">("test")
    const x: Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<string>(x.payload)
    } else {
      expectType<"test">(x.type)
      expectType<any>(x.payload)
    }
  }
  {
    const actionCreator = createAction<string | undefined, "test">("test")
    const x: Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<string | undefined>(x.payload)
    }
  }
  {
    const actionCreator = createAction("test")
    const x: Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<{}>(x.payload)
    }
  }
  {
    const actionCreator = createAction("test", () => ({
      payload: "",
      meta: "",
      error: false,
    }))
    const x: Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<string>(x.payload)
      expectType<string>(x.meta)
      expectType<boolean>(x.error)
      expectType<number>(x.payload)
      expectType<number>(x.meta)
      expectType<number>(x.error)
    }
  }
  {
    const actionCreator = createAction<string, "test">("test")
    const x: Array<Action<unknown>> = []
    expectType<Array<PayloadAction<string, "test">>>(
      x.filter(actionCreator.match)
    )
    expectType<Array<PayloadAction<number, "test">>>(
      x.filter(actionCreator.match)
    )
  }
}
{
  expectType<ActionCreatorWithOptionalPayload<string | undefined>>(
    createAction<string | undefined>("")
  )
  expectType<ActionCreatorWithoutPayload>(createAction<void>(""))
  expectType<ActionCreatorWithNonInferrablePayload>(createAction(""))
  expectType<ActionCreatorWithPayload<string>>(createAction<string>(""))
  expectType<ActionCreatorWithPreparedPayload<[0], 1, "", 2, 3>>(
    createAction("", (_: 0) => ({
      payload: 1 as 1,
      error: 2 as 2,
      meta: 3 as 3,
    }))
  )
  const anyCreator = createAction<any>("")
  expectType<ActionCreatorWithPayload<any>>(anyCreator)
  type AnyPayload = ReturnType<typeof anyCreator>["payload"]
  expectType<IsAny<AnyPayload, true, false>>(true)
}

const defaultDispatch = (() => {}) as ThunkDispatch<{}, any, AnyAction>
const anyAction = { type: "foo" } as AnyAction
;(async function () {
  const async = createAsyncThunk("test", (id: number) =>
    Promise.resolve(id * 2)
  )
  const reducer = createReducer({}, builder =>
    builder
      .addCase(async.pending, (_, action) => {
        expectType<ReturnType<typeof async["pending"]>>(action)
      })
      .addCase(async.fulfilled, (_, action) => {
        expectType<ReturnType<typeof async["fulfilled"]>>(action)
        expectType<number>(action.payload)
      })
      .addCase(async.rejected, (_, action) => {
        expectType<ReturnType<typeof async["rejected"]>>(action)
        expectType<Partial<Error> | undefined>(action.error)
      })
  )
  const promise = defaultDispatch(async(3))
  expectType<string>(promise.requestId)
  expectType<number>(promise.arg)
  expectType<(reason?: string) => void>(promise.abort)
  const result = await promise
  if (async.fulfilled.match(result)) {
    expectType<ReturnType<typeof async["fulfilled"]>>(result)
    expectType<ReturnType<typeof async["rejected"]>>(result)
  } else {
    expectType<ReturnType<typeof async["rejected"]>>(result)
    expectType<ReturnType<typeof async["fulfilled"]>>(result)
  }
  promise
    .then(unwrapResult)
    .then(result => {
      expectType<number>(result)
      expectType<Error>(result)
    })
    .catch(error => {})
})()
;(async function () {
  interface BookModel {
    id: string
    title: string
  }
  type BooksState = BookModel[]
  const fakeBooks: BookModel[] = [
    { id: "b", title: "Second" },
    { id: "a", title: "First" },
  ]
  const correctDispatch = (() => {}) as ThunkDispatch<
    BookModel[],
    { userAPI: Function },
    AnyAction
  >
  const fetchBooksTAC = createAsyncThunk<
    BookModel[],
    number,
    {
      state: BooksState
      extra: { userAPI: Function }
    }
  >(
    "books/fetch",
    async (arg, { getState, dispatch, extra, requestId, signal }) => {
      const state = getState()
      expectType<number>(arg)
      expectType<BookModel[]>(state)
      expectType<{ userAPI: Function }>(extra)
      return fakeBooks
    }
  )
  correctDispatch(fetchBooksTAC(1))
  defaultDispatch(fetchBooksTAC(1))
})()
;(async () => {
  type ReturnValue = { data: "success" }
  type RejectValue = { data: "error" }
  const fetchBooksTAC = createAsyncThunk<
    ReturnValue,
    number,
    {
      rejectValue: RejectValue
    }
  >("books/fetch", async (arg, { rejectWithValue }) => {
    return rejectWithValue({ data: "error" })
  })
  const returned = await defaultDispatch(fetchBooksTAC(1))
  if (fetchBooksTAC.rejected.match(returned)) {
    expectType<undefined | RejectValue>(returned.payload)
    expectType<RejectValue>(returned.payload!)
  } else {
    expectType<ReturnValue>(returned.payload)
  }
  expectType<ReturnValue>(unwrapResult(returned))
  expectType<RejectValue>(unwrapResult(returned))
})()
;(async () => {
  const fn = createAsyncThunk("session/isAdmin", async () => {
    const response: boolean = false
    return response
  })
})()
;(async () => {
  type ResultType = {
    text: string
  }
  const demoPromise = async (): Promise<ResultType> =>
    new Promise((resolve, _) => resolve({ text: "" }))
  const thunk = createAsyncThunk("thunk", async (args, thunkAPI) => {
    try {
      const result = await demoPromise()
      return result
    } catch (error) {
      return thunkAPI.rejectWithValue(error)
    }
  })
  createReducer({}, builder =>
    builder.addCase(thunk.fulfilled, (s, action) => {
      expectType<ResultType>(action.payload)
    })
  )
})()
{
  interface Item {
    name: string
  }
  interface ErrorFromServer {
    error: string
  }
  interface CallsResponse {
    data: Item[]
  }
  const fetchLiveCallsError = createAsyncThunk<
    Item[],
    string,
    {
      rejectValue: ErrorFromServer
    }
  >("calls/fetchLiveCalls", async (organizationId, { rejectWithValue }) => {
    try {
      const result = await apiRequest.get<CallsResponse>(
        `organizations/${organizationId}/calls/live/iwill404`
      )
      return result.data.data
    } catch (err) {
      let error: AxiosError<ErrorFromServer> = err as any // cast for access to AxiosError properties
      if (!error.response) {
        throw err
      }
      return rejectWithValue(error.response && error.response.data)
    }
  })
  defaultDispatch(fetchLiveCallsError("asd")).then(result => {
    if (fetchLiveCallsError.fulfilled.match(result)) {
      expectType<ReturnType<typeof fetchLiveCallsError["fulfilled"]>>(result)
      expectType<Item[]>(result.payload)
    } else {
      expectType<ReturnType<typeof fetchLiveCallsError["rejected"]>>(result)
      if (result.payload) {
        expectType<ErrorFromServer>(result.payload)
      } else {
        expectType<undefined>(result.payload)
        expectType<SerializedError>(result.error)
        expectType<IsAny<typeof result["error"], true, false>>(true)
      }
    }
    defaultDispatch(fetchLiveCallsError("asd"))
      .then(result => {
        expectType<Item[] | ErrorFromServer | undefined>(result.payload)
        expectType<Item[]>(unwrapped)
        return result
      })
      .then(unwrapResult)
      .then(unwrapped => {
        expectType<Item[]>(unwrapped)
        expectType<ErrorFromServer>(unwrapResult(unwrapped))
      })
  })
}
{
  {
    const asyncThunk = createAsyncThunk("test", () => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: undefined) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: void) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg?: number) => 0)
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: number | undefined) => 0)
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: number | void) => 0)
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: any) => 0)
    expectType<IsAny<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: unknown) => 0)
    expectType<IsUnknown<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: number) => 0)
    expectType<(arg: number) => any>(asyncThunk)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: undefined, thunkApi) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: void, thunkApi) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = createAsyncThunk(
      "test",
      (arg: number | undefined, thunkApi) => 0
    )
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = createAsyncThunk(
      "test",
      (arg: number | void, thunkApi) => 0
    )
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: any, thunkApi) => 0)
    expectType<IsAny<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: unknown, thunkApi) => 0)
    expectType<IsUnknown<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = createAsyncThunk("test", (arg: number, thunkApi) => 0)
    expectType<(arg: number) => any>(asyncThunk)
    asyncThunk(5)
    asyncThunk()
  }
}
{
  const thunk = createAsyncThunk("test", () => {
    return "ret" as const
  })
  expectType<AsyncThunk<"ret", void, {}>>(thunk)
}
{
  const thunk = createAsyncThunk("test", (_: void, api) => {
    console.log(api)
    return "ret" as const
  })
  expectType<AsyncThunk<"ret", void, {}>>(thunk)
}
{
  const asyncThunk = createAsyncThunk(
    "test",
    (_: void, { rejectWithValue }) => {
      try {
        return Promise.resolve(true)
      } catch (e) {
        return rejectWithValue(e)
      }
    }
  )
  defaultDispatch(asyncThunk())
    .then(result => {
      if (asyncThunk.fulfilled.match(result)) {
        expectType<ReturnType<AsyncThunkFulfilledActionCreator<boolean, void>>>(
          result
        )
        expectType<boolean>(result.payload)
        expectType<any>(result.error)
      } else {
        expectType<ReturnType<AsyncThunkRejectedActionCreator<unknown, void>>>(
          result
        )
        expectType<SerializedError>(result.error)
        expectType<unknown>(result.payload)
      }
      return result
    })
    .then(unwrapResult)
    .then(unwrapped => {
      expectType<boolean>(unwrapped)
    })
}
{
  type Funky = { somethingElse: "Funky!" }
  function funkySerializeError(err: any): Funky {
    return { somethingElse: "Funky!" }
  }
  const shouldFail = createAsyncThunk("without generics", () => {}, {
    serializeError: funkySerializeError,
  })
  const shouldWork = createAsyncThunk<
    any,
    void,
    { serializedErrorType: Funky }
  >("with generics", () => {}, {
    serializeError: funkySerializeError,
  })
  if (shouldWork.rejected.match(anyAction)) {
    expectType<Funky>(anyAction.error)
  }
}
{
  const returnsNumWithArgs = (foo: any) => 100
  const shouldFailNumWithArgs = createAsyncThunk("foo", () => {}, {
    idGenerator: returnsNumWithArgs,
  })
  const returnsNumWithoutArgs = () => 100
  const shouldFailNumWithoutArgs = createAsyncThunk("foo", () => {}, {
    idGenerator: returnsNumWithoutArgs,
  })
  const returnsStrWithNumberArg = (foo: number) => "foo"
  const shouldFailWrongArgs = createAsyncThunk("foo", (arg: string) => {}, {
    idGenerator: returnsStrWithNumberArg,
  })
  const returnsStrWithStringArg = (foo: string) => "foo"
  const shoulducceedCorrectArgs = createAsyncThunk("foo", (arg: string) => {}, {
    idGenerator: returnsStrWithStringArg,
  })
  const returnsStrWithoutArgs = () => "foo"
  const shouldSucceed = createAsyncThunk("foo", () => {}, {
    idGenerator: returnsStrWithoutArgs,
  })
}
{
  createAsyncThunk<"ret", void, {}>("test", (_, api) => "ret" as const)
  createAsyncThunk<"ret", void, {}>("test", async (_, api) => "ret" as const)
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>("test", (_, api) =>
    api.fulfillWithValue("ret" as const, "")
  )
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    async (_, api) => api.fulfillWithValue("ret" as const, "")
  )
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    (_, api) => "ret" as const
  )
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    async (_, api) => "ret" as const
  )
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test", // @ts-expect-error should only allow returning with 'test'
    (_, api) => api.fulfillWithValue(5, "")
  )
  createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test", // @ts-expect-error should only allow returning with 'test'
    async (_, api) => api.fulfillWithValue(5, "")
  )
  createAsyncThunk<"ret", void, { rejectValue: string }>("test", (_, api) =>
    api.rejectWithValue("ret")
  )
  createAsyncThunk<"ret", void, { rejectValue: string }>(
    "test",
    async (_, api) => api.rejectWithValue("ret")
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    (_, api) => api.rejectWithValue("ret", 5)
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    async (_, api) => api.rejectWithValue("ret", 5)
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    (_, api) => api.rejectWithValue("ret", 5)
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    (_, api) => api.rejectWithValue("ret", "")
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    async (_, api) => api.rejectWithValue("ret", "")
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    (_, api) => api.rejectWithValue(5, "")
  )
  createAsyncThunk<"ret", void, { rejectValue: string; rejectedMeta: number }>(
    "test",
    async (_, api) => api.rejectWithValue(5, "")
  )
}

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

{
  type CounterAction =
    | { type: "increment"; payload: number }
    | { type: "decrement"; payload: number }
  const incrementHandler = (state: number, action: CounterAction) => state + 1
  const decrementHandler = (state: number, action: CounterAction) => state - 1
  const reducer = createReducer(0 as number, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  const numberReducer: Reducer<number> = reducer
  const stringReducer: Reducer<string> = reducer
}
{
  type CounterAction =
    | { type: "increment"; payload: number }
    | { type: "decrement"; payload: number }
  const incrementHandler = (state: number, action: CounterAction) =>
    state + action.payload
  const decrementHandler = (state: number, action: CounterAction) =>
    state - action.payload
  createReducer<number>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  createReducer<string>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
}
{
  const initialState: { readonly counter: number } = { counter: 0 }
  createReducer(initialState, {
    increment: state => {
      state.counter += 1
    },
  })
}
{
  const increment = createAction<number, "increment">("increment")
  const reducer = createReducer(0, builder =>
    expectType<ActionReducerMapBuilder<number>>(builder)
  )
  expectType<number>(reducer(0, increment(5)))
  expectType<string>(reducer(0, increment(5)))
}

const counterSlice = createSlice({
  name: "counter",
  initialState: 0,
  reducers: {
    increment: (state: number, action) => state + action.payload,
    decrement: (state: number, action) => state - action.payload,
  },
})
const uiSlice = createSlice({
  name: "ui",
  initialState: 0,
  reducers: {
    goToNext: (state: number, action) => state + action.payload,
    goToPrevious: (state: number, action) => state - action.payload,
  },
})
const actionCreators = {
  [counterSlice.name]: { ...counterSlice.actions },
  [uiSlice.name]: { ...uiSlice.actions },
}
expectType<typeof counterSlice.actions>(actionCreators.counter)
expectType<typeof uiSlice.actions>(actionCreators.ui)
const value = actionCreators.anyKey
{
  const firstAction = createAction<{ count: number }>("FIRST_ACTION")
  const slice = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: (state: number, action) => state + action.payload,
      decrement: (state: number, action) => state - action.payload,
    },
    extraReducers: {
      [firstAction.type]: (state: number, action) =>
        state + action.payload.count,
    },
  })
  const reducer: Reducer<number, PayloadAction> = slice.reducer
  const stringReducer: Reducer<string, PayloadAction> = slice.reducer
  const anyActionReducer: Reducer<string, AnyAction> = slice.reducer
  slice.actions.increment(1)
  slice.actions.decrement(1)
  slice.actions.other(1)
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: (state, { payload = 1 }: PayloadAction<number | undefined>) =>
        state - payload,
      multiply: (state, { payload }: PayloadAction<number | number[]>) =>
        Array.isArray(payload)
          ? payload.reduce((acc, val) => acc * val, state)
          : state * payload,
      addTwo: {
        reducer: (s, { payload }: PayloadAction<number>) => s + payload,
        prepare: (a: number, b: number) => ({
          payload: a + b,
        }),
      },
    },
  })
  expectType<ActionCreatorWithoutPayload>(counter.actions.increment)
  counter.actions.increment()
  expectType<ActionCreatorWithOptionalPayload<number | undefined>>(
    counter.actions.decrement
  )
  counter.actions.decrement()
  counter.actions.decrement(2)
  expectType<ActionCreatorWithPayload<number | number[]>>(
    counter.actions.multiply
  )
  counter.actions.multiply(2)
  counter.actions.multiply([2, 3, 4])
  expectType<ActionCreatorWithPreparedPayload<[number, number], number>>(
    counter.actions.addTwo
  )
  counter.actions.addTwo(1, 2)
  counter.actions.multiply()
  counter.actions.multiply("2")
  counter.actions.addTwo(1)
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: state => state - 1,
      multiply: (state, { payload }: PayloadAction<number | number[]>) =>
        Array.isArray(payload)
          ? payload.reduce((acc, val) => acc * val, state)
          : state * payload,
    },
  })
  const s: string = counter.actions.increment.type
  const t: string = counter.actions.decrement.type
  const u: string = counter.actions.multiply.type
  const x: "counter/increment" = counter.actions.increment.type
  const y: "increment" = counter.actions.increment.type
}
{
  const counter = createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      incrementByStrLen: {
        reducer: (state, action: PayloadAction<number>) => {
          state.counter += action.payload
        },
        prepare: (payload: string) => ({
          payload: payload.length,
        }),
      },
      concatMetaStrLen: {
        reducer: (state, action: PayloadAction<string>) => {
          state.concat += action.payload
        },
        prepare: (payload: string) => ({
          payload,
          meta: payload.length,
        }),
      },
    },
  })
  expectType<string>(counter.actions.incrementByStrLen("test").type)
  expectType<number>(counter.actions.incrementByStrLen("test").payload)
  expectType<string>(counter.actions.concatMetaStrLen("test").payload)
  expectType<number>(counter.actions.concatMetaStrLen("test").meta)
  expectType<string>(counter.actions.incrementByStrLen("test").payload)
  expectType<string>(counter.actions.concatMetaStrLen("test").meta)
}
{
  const counter = createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      testDefaultMetaAndError: {
        reducer(_, action: PayloadAction<number, string>) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testUnknownMetaAndError: {
        reducer(_, action: PayloadAction<number, string, unknown, unknown>) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testMetaAndError: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testErroneousMeta: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: 1,
          error: "error" as "error",
        }),
      },
      testErroneousError: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: 1,
        }),
      },
    },
  })
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment(state, action: PayloadAction<number>) {
        return state + action.payload
      },
      decrement: {
        reducer(state, action: PayloadAction<number>) {
          return state - action.payload
        },
        prepare(amount: number) {
          return { payload: amount }
        },
      },
    },
  })
  expectType<(state: number, action: PayloadAction<number>) => number | void>(
    counter.caseReducers.increment
  )
  expectType<(state: number, action: PayloadAction<number>) => number | void>(
    counter.caseReducers.decrement
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.increment
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.decrement
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.someThingNonExistant
  )
}
{
  const counter = createSlice({
    name: "counter",
    initialState: { counter: 0 },
    reducers: {
      increment: {
        reducer(state, action: PayloadAction<string>) {
          state.counter += action.payload.length
        },
        prepare(x: string) {
          return {
            payload: 6,
          }
        },
      },
    },
  })
}
{
  const initialState = {
    name: null,
  }
  const mySlice = createSlice({
    name: "name",
    initialState,
    reducers: {
      setName: (state, action) => {
        state.name = action.payload
      },
    },
  })
  expectType<ActionCreatorWithNonInferrablePayload>(mySlice.actions.setName)
  const x = mySlice.actions.setName
  mySlice.actions.setName(null)
  mySlice.actions.setName("asd")
  mySlice.actions.setName(5)
}
{
  const mySlice = createSlice({
    name: "name",
    initialState: { name: "test" },
    reducers: {
      setName: (state, action: PayloadAction<string>) => {
        state.name = action.payload
      },
    },
  })
  const x: Action<unknown> = {} as any
  if (mySlice.actions.setName.match(x)) {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  } else {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  }
}
{
  createSlice({
    name: "test",
    initialState: 0,
    reducers: {},
    extraReducers: builder => {
      expectType<ActionReducerMapBuilder<number>>(builder)
    },
  })
}
{
  interface GenericState<T> {
    data?: T
    status: "loading" | "finished" | "error"
  }
  const createGenericSlice = <
    T,
    Reducers extends SliceCaseReducers<GenericState<T>>
  >({
    name = "",
    initialState,
    reducers,
  }: {
    name: string
    initialState: GenericState<T>
    reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>
  }) => {
    return createSlice({
      name,
      initialState,
      reducers: {
        start(state) {
          state.status = "loading"
        },
        success(state: GenericState<T>, action: PayloadAction<T>) {
          state.data = action.payload
          state.status = "finished"
        },
        ...reducers,
      },
    })
  }
  const wrappedSlice = createGenericSlice({
    name: "test",
    initialState: { status: "loading" } as GenericState<string>,
    reducers: {
      magic(state) {
        expectType<GenericState<string>>(state)
        expectType<GenericState<number>>(state)
        state.status = "finished"
        state.data = "hocus pocus"
      },
    },
  })
  expectType<ActionCreatorWithPayload<string>>(wrappedSlice.actions.success)
  expectType<ActionCreatorWithoutPayload<string>>(wrappedSlice.actions.magic)
}
{
  interface GenericState<T> {
    data: T | null
  }
  function createDataSlice<
    T,
    Reducers extends SliceCaseReducers<GenericState<T>>
  >(
    name: string,
    reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>,
    initialState: GenericState<T>
  ) {
    const doNothing = createAction<undefined>("doNothing")
    const setData = createAction<T>("setData")
    const slice = createSlice({
      name,
      initialState,
      reducers,
      extraReducers: builder => {
        builder.addCase(doNothing, state => {
          return { ...state }
        })
        builder.addCase(setData, (state, { payload }) => {
          return {
            ...state,
            data: payload,
          }
        })
      },
    })
    return { doNothing, setData, slice }
  }
}

declare const expectType: <T>(t: T) => T
declare const middleware1: Middleware<{
  (_: string): number
}>
declare const middleware2: Middleware<{
  (_: number): string
}>
type ThunkReturn = Promise<"thunk">
declare const thunkCreator: () => () => ThunkReturn
{
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend(middleware1),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend(middleware1, middleware2),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend([middleware1, middleware2] as const),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat(middleware1),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat(middleware1, middleware2),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat([middleware1, middleware2] as const),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat(middleware1).prepend(middleware2),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
}

{
  const increment = createAction<number, "increment">("increment")
  const decrement = createAction<number, "decrement">("decrement")
  executeReducerBuilderCallback<number>(builder => {
    builder.addCase(increment, (state, action) => {
      expectType<number>(state)
      expectType<{ type: "increment"; payload: number }>(action)
      expectType<string>(state)
      expectType<{ type: "increment"; payload: string }>(action)
      expectType<{ type: "decrement"; payload: number }>(action)
    })
    builder.addCase("increment", (state, action) => {
      expectType<number>(state)
      expectType<{ type: "increment" }>(action)
      expectType<{ type: "decrement" }>(action)
      expectType<{ type: "increment"; payload: number }>(action)
    })
    builder.addCase(
      increment,
      (state, action: ReturnType<typeof increment>) => state
    )
    builder.addCase(
      increment,
      (state, action: ReturnType<typeof decrement>) => state
    )
    builder.addCase(
      "increment",
      (state, action: ReturnType<typeof increment>) => state
    )
    builder.addCase(
      "decrement",
      (state, action: ReturnType<typeof increment>) => state
    )
    builder.addMatcher(increment.match, (state, action) => {
      expectType<ReturnType<typeof increment>>(action)
    })
    {
      type PredicateWithoutTypeProperty = {
        payload: number
      }
      builder.addMatcher(
        (action): action is PredicateWithoutTypeProperty => true,
        (state, action) => {
          expectType<PredicateWithoutTypeProperty>(action)
          expectType<AnyAction>(action)
        }
      )
    }
    builder.addMatcher(
      () => true,
      (state, action) => {
        expectExactType({} as AnyAction)(action)
      }
    )
    builder.addMatcher<{ foo: boolean }>(
      () => true,
      (state, action) => {
        expectType<{ foo: boolean }>(action)
        expectType<AnyAction>(action)
      }
    )
    builder
      .addCase(
        "increment",
        (state, action: ReturnType<typeof increment>) => state
      )
      .addMatcher(decrement.match, (state, action) => {
        expectType<ReturnType<typeof decrement>>(action)
      })
    builder
      .addCase(
        "increment",
        (state, action: ReturnType<typeof increment>) => state
      )
      .addDefaultCase((state, action) => {
        expectType<AnyAction>(action)
      })
    {
      const b = builder.addMatcher(increment.match, () => {})
      b.addCase(increment, () => {})
      b.addMatcher(increment.match, () => {})
      b.addDefaultCase(() => {})
    }
    {
      const b = builder.addDefaultCase(() => {})
      b.addCase(increment, () => {})
      b.addMatcher(increment.match, () => {})
      b.addDefaultCase(() => {})
    }
    {
      {
        const thunk = createAsyncThunk("test", () => {
          return "ret" as const
        })
        builder.addCase(thunk.pending, (_, action) => {
          expectType<{
            payload: undefined
            meta: {
              arg: void
              requestId: string
              requestStatus: "pending"
            }
          }>(action)
        })
        builder.addCase(thunk.rejected, (_, action) => {
          expectType<{
            payload: unknown
            error: SerializedError
            meta: {
              arg: void
              requestId: string
              requestStatus: "rejected"
              aborted: boolean
              condition: boolean
              rejectedWithValue: boolean
            }
          }>(action)
        })
        builder.addCase(thunk.fulfilled, (_, action) => {
          expectType<{
            payload: "ret"
            meta: {
              arg: void
              requestId: string
              requestStatus: "fulfilled"
            }
          }>(action)
        })
      }
    }
    {
      const thunk = createAsyncThunk<
        "ret",
        void,
        {
          pendingMeta: { startedTimeStamp: number }
          fulfilledMeta: {
            fulfilledTimeStamp: number
            baseQueryMeta: "meta!"
          }
          rejectedMeta: {
            baseQueryMeta: "meta!"
          }
        }
      >(
        "test",
        (_, api) => {
          return api.fulfillWithValue("ret" as const, {
            fulfilledTimeStamp: 5,
            baseQueryMeta: "meta!",
          })
        },
        {
          getPendingMeta() {
            return { startedTimeStamp: 0 }
          },
        }
      )
      builder.addCase(thunk.pending, (_, action) => {
        expectType<{
          payload: undefined
          meta: {
            arg: void
            requestId: string
            requestStatus: "pending"
            startedTimeStamp: number
          }
        }>(action)
      })
      builder.addCase(thunk.rejected, (_, action) => {
        expectType<{
          payload: unknown
          error: SerializedError
          meta: {
            arg: void
            requestId: string
            requestStatus: "rejected"
            aborted: boolean
            condition: boolean
            rejectedWithValue: boolean
            baseQueryMeta?: "meta!"
          }
        }>(action)
        if (action.meta.rejectedWithValue) {
          expectType<"meta!">(action.meta.baseQueryMeta)
        }
      })
      builder.addCase(thunk.fulfilled, (_, action) => {
        expectType<{
          payload: "ret"
          meta: {
            arg: void
            requestId: string
            requestStatus: "fulfilled"
            baseQueryMeta: "meta!"
          }
        }>(action)
      })
    }
  })
}
