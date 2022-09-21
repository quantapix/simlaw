/* eslint-disable no-lone-blocks */
import * as qi from "../../../src/immer/index.js"
import * as qx from "../../../src/redux/index.js"
import { expectExactType, expectNotAny, expectType } from "../helpers.js"
import type { AxiosError } from "axios"
import apiRequest from "axios"

{
  const action: qx.PayloadAction<number> = { type: "", payload: 5 }
  const numberPayload: number = action.payload
  const stringPayload: string = action.payload
}
{
  const action: qx.PayloadAction = { type: "", payload: 5 }
  const numberPayload: number = action.payload
  const stringPayload: string = action.payload
}
{
  const action: qx.PayloadAction<number> = { type: "", payload: 5 }
  const action2: qx.PayloadAction = { type: 1, payload: 5 }
}
{
  const action: qx.PayloadAction<number> = { type: "", payload: 5 }
  const stringAction: qx.Action<string> = action
}
{
  const actionCreator = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload,
    }),
    { type: "action" }
  ) as qx.PayloadActionCreator<number | undefined>
  expectType<qx.PayloadAction<number | undefined>>(actionCreator(1))
  expectType<qx.PayloadAction<number | undefined>>(actionCreator())
  expectType<qx.PayloadAction<number | undefined>>(actionCreator(undefined))
  expectType<qx.PayloadAction<number>>(actionCreator())
  expectType<qx.PayloadAction<undefined>>(actionCreator(1))
}
{
  const payloadActionCreator = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload,
    }),
    { type: "action" }
  ) as qx.PayloadActionCreator
  const actionCreator: qx.ActionCreator<qx.AnyAction> = payloadActionCreator
  const payloadActionCreator2 = Object.assign(
    (payload?: number) => ({
      type: "action",
      payload: payload || 1,
    }),
    { type: "action" }
  ) as qx.PayloadActionCreator<number>
  const actionCreator2: qx.ActionCreator<qx.PayloadAction<number>> =
    payloadActionCreator2
}
{
  const increment = qx.createAction<number, "increment">("increment")
  const n: number = increment(1).payload
  increment("").payload
}
{
  const increment = qx.createAction("increment")
  const n: number = increment(1).payload
}
{
  const increment = qx.createAction<number, "increment">("increment")
  const n: string = increment(1).type
  const s: "increment" = increment(1).type
  const r: "other" = increment(1).type
  const q: number = increment(1).type
}
{
  const strLenAction = qx.createAction("strLen", (payload: string) => ({
    payload: payload.length,
  }))
  expectType<string>(strLenAction("test").type)
}
{
  const strLenAction = qx.createAction("strLen", (payload: string) => ({
    payload: payload.length,
  }))
  expectType<number>(strLenAction("test").payload)
  expectType<string>(strLenAction("test").payload)
  const error: any = strLenAction("test").error
}
{
  const strLenMetaAction = qx.createAction("strLenMeta", (payload: string) => ({
    payload,
    meta: payload.length,
  }))
  expectType<number>(strLenMetaAction("test").meta)
  expectType<string>(strLenMetaAction("test").meta)
  const error: any = strLenMetaAction("test").error
}
{
  const boolErrorAction = qx.createAction("boolError", (payload: string) => ({
    payload,
    error: true,
  }))
  expectType<boolean>(boolErrorAction("test").error)
  expectType<string>(boolErrorAction("test").error)
}
{
  const strErrorAction = qx.createAction("strError", (payload: string) => ({
    payload,
    error: "this is an error",
  }))
  expectType<string>(strErrorAction("test").error)
  expectType<boolean>(strErrorAction("test").error)
}
{
  const action = qx.createAction<{ input?: string }>("ACTION")
  const t: string | undefined = action({ input: "" }).payload.input
  const u: number = action({ input: "" }).payload.input
  const v: number = action({ input: 3 }).payload.input
}
{
  const oops = qx.createAction("oops", (x: any) => ({
    payload: x,
    error: x,
    meta: x,
  }))
  type Ret = ReturnType<typeof oops>
  const payload: qx.IsAny<Ret["payload"], true, false> = true
  const error: qx.IsAny<Ret["error"], true, false> = true
  const meta: qx.IsAny<Ret["meta"], true, false> = true
  const payloadNotAny: qx.IsAny<Ret["payload"], true, false> = false
  const errorNotAny: qx.IsAny<Ret["error"], true, false> = false
  const metaNotAny: qx.IsAny<Ret["meta"], true, false> = false
}
{
  {
    const actionCreator = qx.createAction<string, "test">("test")
    const x: qx.Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<string>(x.payload)
    } else {
      expectType<"test">(x.type)
      expectType<any>(x.payload)
    }
  }
  {
    const actionCreator = qx.createAction<string | undefined, "test">("test")
    const x: qx.Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<string | undefined>(x.payload)
    }
  }
  {
    const actionCreator = qx.createAction("test")
    const x: qx.Action<unknown> = {} as any
    if (actionCreator.match(x)) {
      expectType<"test">(x.type)
      expectType<{}>(x.payload)
    }
  }
  {
    const actionCreator = qx.createAction("test", () => ({
      payload: "",
      meta: "",
      error: false,
    }))
    const x: qx.Action<unknown> = {} as any
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
    const actionCreator = qx.createAction<string, "test">("test")
    const x: Array<qx.Action<unknown>> = []
    expectType<Array<qx.PayloadAction<string, "test">>>(
      x.filter(actionCreator.match)
    )
    expectType<Array<qx.PayloadAction<number, "test">>>(
      x.filter(actionCreator.match)
    )
  }
}
{
  expectType<qx.ActionCreatorWithOptionalPayload<string | undefined>>(
    qx.createAction<string | undefined>("")
  )
  expectType<qx.ActionCreatorWithoutPayload>(qx.createAction<void>(""))
  expectType<qx.ActionCreatorWithNonInferrablePayload>(qx.createAction(""))
  expectType<qx.ActionCreatorWithPayload<string>>(qx.createAction<string>(""))
  expectType<qx.ActionCreatorWithPreparedPayload<[0], 1, "", 2, 3>>(
    qx.createAction("", (_: 0) => ({
      payload: 1 as 1,
      error: 2 as 2,
      meta: 3 as 3,
    }))
  )
  const anyCreator = qx.createAction<any>("")
  expectType<qx.ActionCreatorWithPayload<any>>(anyCreator)
  type AnyPayload = ReturnType<typeof anyCreator>["payload"]
  expectType<qx.IsAny<AnyPayload, true, false>>(true)
}

const defaultDispatch = (() => {}) as qx.ThunkDispatch<{}, any, qx.AnyAction>
const anyAction = { type: "foo" } as qx.AnyAction
;(async function () {
  const async = qx.createAsyncThunk("test", (id: number) =>
    Promise.resolve(id * 2)
  )
  const reducer = qx.createReducer({}, builder =>
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
    .then(qx.unwrapResult)
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
  const correctDispatch = (() => {}) as qx.ThunkDispatch<
    BookModel[],
    { userAPI: Function },
    qx.AnyAction
  >
  const fetchBooksTAC = qx.createAsyncThunk<
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
  const fetchBooksTAC = qx.createAsyncThunk<
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
  expectType<ReturnValue>(qx.unwrapResult(returned))
  expectType<RejectValue>(qx.unwrapResult(returned))
})()
;(async () => {
  const fn = qx.createAsyncThunk("session/isAdmin", async () => {
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
  const thunk = qx.createAsyncThunk("thunk", async (args, thunkAPI) => {
    try {
      const result = await demoPromise()
      return result
    } catch (error) {
      return thunkAPI.rejectWithValue(error)
    }
  })
  qx.createReducer({}, builder =>
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
  const fetchLiveCallsError = qx.createAsyncThunk<
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
        expectType<qx.SerializedError>(result.error)
        expectType<qx.IsAny<typeof result["error"], true, false>>(true)
      }
    }
    defaultDispatch(fetchLiveCallsError("asd"))
      .then(result => {
        expectType<Item[] | ErrorFromServer | undefined>(result.payload)
        expectType<Item[]>(unwrapped)
        return result
      })
      .then(qx.unwrapResult)
      .then(unwrapped => {
        expectType<Item[]>(unwrapped)
        expectType<ErrorFromServer>(qx.unwrapResult(unwrapped))
      })
  })
}
{
  {
    const asyncThunk = qx.createAsyncThunk("test", () => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: undefined) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: void) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg?: number) => 0)
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = qx.createAsyncThunk(
      "test",
      (arg: number | undefined) => 0
    )
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: number | void) => 0)
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: any) => 0)
    expectType<qx.IsAny<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: unknown) => 0)
    expectType<qx.IsUnknown<Parameters<typeof asyncThunk>[0], true, false>>(
      true
    )
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: number) => 0)
    expectType<(arg: number) => any>(asyncThunk)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = qx.createAsyncThunk(
      "test",
      (arg: undefined, thunkApi) => 0
    )
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: void, thunkApi) => 0)
    expectType<() => any>(asyncThunk)
    asyncThunk(0 as any)
  }
  {
    const asyncThunk = qx.createAsyncThunk(
      "test",
      (arg: number | undefined, thunkApi) => 0
    )
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = qx.createAsyncThunk(
      "test",
      (arg: number | void, thunkApi) => 0
    )
    expectType<(arg?: number) => any>(asyncThunk)
    asyncThunk()
    asyncThunk(5)
    asyncThunk("string")
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: any, thunkApi) => 0)
    expectType<qx.IsAny<Parameters<typeof asyncThunk>[0], true, false>>(true)
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = qx.createAsyncThunk(
      "test",
      (arg: unknown, thunkApi) => 0
    )
    expectType<qx.IsUnknown<Parameters<typeof asyncThunk>[0], true, false>>(
      true
    )
    asyncThunk(5)
    asyncThunk()
  }
  {
    const asyncThunk = qx.createAsyncThunk("test", (arg: number, thunkApi) => 0)
    expectType<(arg: number) => any>(asyncThunk)
    asyncThunk(5)
    asyncThunk()
  }
}
{
  const thunk = qx.createAsyncThunk("test", () => {
    return "ret" as const
  })
  expectType<qx.AsyncThunk<"ret", void, {}>>(thunk)
}
{
  const thunk = qx.createAsyncThunk("test", (_: void, api) => {
    console.log(api)
    return "ret" as const
  })
  expectType<qx.AsyncThunk<"ret", void, {}>>(thunk)
}
{
  const asyncThunk = qx.createAsyncThunk(
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
        expectType<
          ReturnType<qx.AsyncThunkFulfilledActionCreator<boolean, void>>
        >(result)
        expectType<boolean>(result.payload)
        expectType<any>(result.error)
      } else {
        expectType<
          ReturnType<qx.AsyncThunkRejectedActionCreator<unknown, void>>
        >(result)
        expectType<qx.SerializedError>(result.error)
        expectType<unknown>(result.payload)
      }
      return result
    })
    .then(qx.unwrapResult)
    .then(unwrapped => {
      expectType<boolean>(unwrapped)
    })
}
{
  type Funky = { somethingElse: "Funky!" }
  function funkySerializeError(err: any): Funky {
    return { somethingElse: "Funky!" }
  }
  const shouldFail = qx.createAsyncThunk("without generics", () => {}, {
    serializeError: funkySerializeError,
  })
  const shouldWork = qx.createAsyncThunk<
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
  const shouldFailNumWithArgs = qx.createAsyncThunk("foo", () => {}, {
    idGenerator: returnsNumWithArgs,
  })
  const returnsNumWithoutArgs = () => 100
  const shouldFailNumWithoutArgs = qx.createAsyncThunk("foo", () => {}, {
    idGenerator: returnsNumWithoutArgs,
  })
  const returnsStrWithNumberArg = (foo: number) => "foo"
  const shouldFailWrongArgs = qx.createAsyncThunk("foo", (arg: string) => {}, {
    idGenerator: returnsStrWithNumberArg,
  })
  const returnsStrWithStringArg = (foo: string) => "foo"
  const shoulducceedCorrectArgs = qx.createAsyncThunk(
    "foo",
    (arg: string) => {},
    {
      idGenerator: returnsStrWithStringArg,
    }
  )
  const returnsStrWithoutArgs = () => "foo"
  const shouldSucceed = qx.createAsyncThunk("foo", () => {}, {
    idGenerator: returnsStrWithoutArgs,
  })
}
{
  qx.createAsyncThunk<"ret", void, {}>("test", (_, api) => "ret" as const)
  qx.createAsyncThunk<"ret", void, {}>("test", async (_, api) => "ret" as const)
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    (_, api) => api.fulfillWithValue("ret" as const, "")
  )
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    async (_, api) => api.fulfillWithValue("ret" as const, "")
  )
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    (_, api) => "ret" as const
  )
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test",
    async (_, api) => "ret" as const
  )
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test", // @ts-expect-error should only allow returning with 'test'
    (_, api) => api.fulfillWithValue(5, "")
  )
  qx.createAsyncThunk<"ret", void, { fulfilledMeta: string }>(
    "test", // @ts-expect-error should only allow returning with 'test'
    async (_, api) => api.fulfillWithValue(5, "")
  )
  qx.createAsyncThunk<"ret", void, { rejectValue: string }>("test", (_, api) =>
    api.rejectWithValue("ret")
  )
  qx.createAsyncThunk<"ret", void, { rejectValue: string }>(
    "test",
    async (_, api) => api.rejectWithValue("ret")
  )
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", (_, api) => api.rejectWithValue("ret", 5))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", async (_, api) => api.rejectWithValue("ret", 5))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", (_, api) => api.rejectWithValue("ret", 5))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", (_, api) => api.rejectWithValue("ret", ""))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", async (_, api) => api.rejectWithValue("ret", ""))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", (_, api) => api.rejectWithValue(5, ""))
  qx.createAsyncThunk<
    "ret",
    void,
    { rejectValue: string; rejectedMeta: number }
  >("test", async (_, api) => api.rejectWithValue(5, ""))
}

function extractReducers<T>(
  adapter: qx.EntityAdapter<T>
): Omit<qx.EntityStateAdapter<T>, "map"> {
  const { selectId, sortComparer, getInitialState, getSelectors, ...rest } =
    adapter
  return rest
}
{
  type Entity = {
    value: string
  }
  const adapter = qx.createEntityAdapter<Entity>()
  const slice = qx.createSlice({
    name: "test",
    initialState: adapter.getInitialState(),
    reducers: {
      ...extractReducers(adapter),
    },
  })
  expectType<qx.ActionCreatorWithPayload<Entity>>(slice.actions.addOne)
  expectType<
    qx.ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.addMany)
  expectType<
    qx.ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.setAll)
  expectType<qx.ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
    slice.actions.addMany
  )
  expectType<qx.ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
    slice.actions.setAll
  )
  expectType<qx.ActionCreatorWithPayload<qx.EntityId>>(slice.actions.removeOne)
  expectType<qx.ActionCreatorWithPayload<ReadonlyArray<qx.EntityId>>>(
    slice.actions.removeMany
  )
  expectType<qx.ActionCreatorWithPayload<qx.EntityId[]>>(
    slice.actions.removeMany
  )
  expectType<qx.ActionCreatorWithoutPayload>(slice.actions.removeAll)
  expectType<qx.ActionCreatorWithPayload<qx.Update<Entity>>>(
    slice.actions.updateOne
  )
  expectType<qx.ActionCreatorWithPayload<qx.Update<Entity>[]>>(
    slice.actions.updateMany
  )
  expectType<qx.ActionCreatorWithPayload<ReadonlyArray<qx.Update<Entity>>>>(
    slice.actions.updateMany
  )
  expectType<qx.ActionCreatorWithPayload<Entity>>(slice.actions.upsertOne)
  expectType<
    qx.ActionCreatorWithPayload<ReadonlyArray<Entity> | Record<string, Entity>>
  >(slice.actions.upsertMany)
  expectType<qx.ActionCreatorWithPayload<Entity[] | Record<string, Entity>>>(
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
  const adapter = qx.createEntityAdapter<Entity>()
  const adapter2 = qx.createEntityAdapter<Entity2>()
  qx.createSlice({
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
  const adapter = qx.createEntityAdapter<Entity>()
  qx.createSlice({
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
  const adapter = qx.createEntityAdapter<Entity>()
  qx.createSlice({
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
  const reducer = qx.createReducer(0 as number, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  const numberReducer: qx.Reducer<number> = reducer
  const stringReducer: qx.Reducer<string> = reducer
}
{
  type CounterAction =
    | { type: "increment"; payload: number }
    | { type: "decrement"; payload: number }
  const incrementHandler = (state: number, action: CounterAction) =>
    state + action.payload
  const decrementHandler = (state: number, action: CounterAction) =>
    state - action.payload
  qx.createReducer<number>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  qx.createReducer<string>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
}
{
  const initialState: { readonly counter: number } = { counter: 0 }
  qx.createReducer(initialState, {
    increment: state => {
      state.counter += 1
    },
  })
}
{
  const increment = qx.createAction<number, "increment">("increment")
  const reducer = qx.createReducer(0, builder =>
    expectType<qx.ActionReducerMapBuilder<number>>(builder)
  )
  expectType<number>(reducer(0, increment(5)))
  expectType<string>(reducer(0, increment(5)))
}

const counterSlice = qx.createSlice({
  name: "counter",
  initialState: 0,
  reducers: {
    increment: (state: number, action) => state + action.payload,
    decrement: (state: number, action) => state - action.payload,
  },
})
const uiSlice = qx.createSlice({
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
  const firstAction = qx.createAction<{ count: number }>("FIRST_ACTION")
  const slice = qx.createSlice({
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
  const reducer: qx.Reducer<number, qx.PayloadAction> = slice.reducer
  const stringReducer: qx.Reducer<string, qx.PayloadAction> = slice.reducer
  const anyActionReducer: qx.Reducer<string, qx.AnyAction> = slice.reducer
  slice.actions.increment(1)
  slice.actions.decrement(1)
  slice.actions.other(1)
}
{
  const counter = qx.createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: (
        state,
        { payload = 1 }: qx.PayloadAction<number | undefined>
      ) => state - payload,
      multiply: (state, { payload }: qx.PayloadAction<number | number[]>) =>
        Array.isArray(payload)
          ? payload.reduce((acc, val) => acc * val, state)
          : state * payload,
      addTwo: {
        reducer: (s, { payload }: qx.PayloadAction<number>) => s + payload,
        prepare: (a: number, b: number) => ({
          payload: a + b,
        }),
      },
    },
  })
  expectType<qx.ActionCreatorWithoutPayload>(counter.actions.increment)
  counter.actions.increment()
  expectType<qx.ActionCreatorWithOptionalPayload<number | undefined>>(
    counter.actions.decrement
  )
  counter.actions.decrement()
  counter.actions.decrement(2)
  expectType<qx.ActionCreatorWithPayload<number | number[]>>(
    counter.actions.multiply
  )
  counter.actions.multiply(2)
  counter.actions.multiply([2, 3, 4])
  expectType<qx.ActionCreatorWithPreparedPayload<[number, number], number>>(
    counter.actions.addTwo
  )
  counter.actions.addTwo(1, 2)
  counter.actions.multiply()
  counter.actions.multiply("2")
  counter.actions.addTwo(1)
}
{
  const counter = qx.createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: state => state - 1,
      multiply: (state, { payload }: qx.PayloadAction<number | number[]>) =>
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
  const counter = qx.createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      incrementByStrLen: {
        reducer: (state, action: qx.PayloadAction<number>) => {
          state.counter += action.payload
        },
        prepare: (payload: string) => ({
          payload: payload.length,
        }),
      },
      concatMetaStrLen: {
        reducer: (state, action: qx.PayloadAction<string>) => {
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
  const counter = qx.createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      testDefaultMetaAndError: {
        reducer(_, action: qx.PayloadAction<number, string>) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testUnknownMetaAndError: {
        reducer(
          _,
          action: qx.PayloadAction<number, string, unknown, unknown>
        ) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testMetaAndError: {
        reducer(
          _,
          action: qx.PayloadAction<number, string, "meta", "error">
        ) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testErroneousMeta: {
        reducer(
          _,
          action: qx.PayloadAction<number, string, "meta", "error">
        ) {},
        prepare: (payload: number) => ({
          payload,
          meta: 1,
          error: "error" as "error",
        }),
      },
      testErroneousError: {
        reducer(
          _,
          action: qx.PayloadAction<number, string, "meta", "error">
        ) {},
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
  const counter = qx.createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment(state, action: qx.PayloadAction<number>) {
        return state + action.payload
      },
      decrement: {
        reducer(state, action: qx.PayloadAction<number>) {
          return state - action.payload
        },
        prepare(amount: number) {
          return { payload: amount }
        },
      },
    },
  })
  expectType<
    (state: number, action: qx.PayloadAction<number>) => number | void
  >(counter.caseReducers.increment)
  expectType<
    (state: number, action: qx.PayloadAction<number>) => number | void
  >(counter.caseReducers.decrement)
  expectType<
    (state: number, action: qx.PayloadAction<string>) => number | void
  >(counter.caseReducers.increment)
  expectType<
    (state: number, action: qx.PayloadAction<string>) => number | void
  >(counter.caseReducers.decrement)
  expectType<
    (state: number, action: qx.PayloadAction<string>) => number | void
  >(counter.caseReducers.someThingNonExistant)
}
{
  const counter = qx.createSlice({
    name: "counter",
    initialState: { counter: 0 },
    reducers: {
      increment: {
        reducer(state, action: qx.PayloadAction<string>) {
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
  const mySlice = qx.createSlice({
    name: "name",
    initialState,
    reducers: {
      setName: (state, action) => {
        state.name = action.payload
      },
    },
  })
  expectType<qx.ActionCreatorWithNonInferrablePayload>(mySlice.actions.setName)
  const x = mySlice.actions.setName
  mySlice.actions.setName(null)
  mySlice.actions.setName("asd")
  mySlice.actions.setName(5)
}
{
  const mySlice = qx.createSlice({
    name: "name",
    initialState: { name: "test" },
    reducers: {
      setName: (state, action: qx.PayloadAction<string>) => {
        state.name = action.payload
      },
    },
  })
  const x: qx.Action<unknown> = {} as any
  if (mySlice.actions.setName.match(x)) {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  } else {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  }
}
{
  qx.createSlice({
    name: "test",
    initialState: 0,
    reducers: {},
    extraReducers: builder => {
      expectType<qx.ActionReducerMapBuilder<number>>(builder)
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
    Reducers extends qx.SliceCaseReducers<GenericState<T>>
  >({
    name = "",
    initialState,
    reducers,
  }: {
    name: string
    initialState: GenericState<T>
    reducers: qx.ValidateSliceCaseReducers<GenericState<T>, Reducers>
  }) => {
    return qx.createSlice({
      name,
      initialState,
      reducers: {
        start(state) {
          state.status = "loading"
        },
        success(state: GenericState<T>, action: qx.PayloadAction<T>) {
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
  expectType<qx.ActionCreatorWithPayload<string>>(wrappedSlice.actions.success)
  expectType<qx.ActionCreatorWithoutPayload<string>>(wrappedSlice.actions.magic)
}
{
  interface GenericState<T> {
    data: T | null
  }
  function createDataSlice<
    T,
    Reducers extends qx.SliceCaseReducers<GenericState<T>>
  >(
    name: string,
    reducers: qx.ValidateSliceCaseReducers<GenericState<T>, Reducers>,
    initialState: GenericState<T>
  ) {
    const doNothing = qx.createAction<undefined>("doNothing")
    const setData = qx.createAction<T>("setData")
    const slice = qx.createSlice({
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

declare const middleware1: qx.Middleware<{
  (_: string): number
}>
declare const middleware2: qx.Middleware<{
  (_: number): string
}>
type ThunkReturn = Promise<"thunk">
declare const thunkCreator: () => () => ThunkReturn
{
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend(middleware1),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend(middleware1, middleware2),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().prepend([middleware1, middleware2] as const),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat(middleware1),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat(middleware1, middleware2),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
      reducer: () => 0,
      middleware: gDM => gDM().concat([middleware1, middleware2] as const),
    })
    expectType<number>(store.dispatch("foo"))
    expectType<string>(store.dispatch(5))
    expectType<ThunkReturn>(store.dispatch(thunkCreator()))
    expectType<string>(store.dispatch("foo"))
  }
  {
    const store = qx.configureStore({
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
  const increment = qx.createAction<number, "increment">("increment")
  const decrement = qx.createAction<number, "decrement">("decrement")
  qx.executeReducerBuilderCallback<number>(builder => {
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
          expectType<qx.AnyAction>(action)
        }
      )
    }
    builder.addMatcher(
      () => true,
      (state, action) => {
        expectExactType({} as qx.AnyAction)(action)
      }
    )
    builder.addMatcher<{ foo: boolean }>(
      () => true,
      (state, action) => {
        expectType<{ foo: boolean }>(action)
        expectType<qx.AnyAction>(action)
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
        expectType<qx.AnyAction>(action)
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
        const thunk = qx.createAsyncThunk("test", () => {
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
            error: qx.SerializedError
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
      const thunk = qx.createAsyncThunk<
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
          error: qx.SerializedError
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
const _anyMiddleware: any = () => () => () => {}
{
  qx.configureStore({
    reducer: (state, action) => 0,
  })
  qx.configureStore({
    reducer: {
      counter1: () => 0,
      counter2: () => 1,
    },
  })
  qx.configureStore({ reducer: "not a reducer" })
  qx.configureStore({ reducer: { a: "not a reducer" } })
  qx.configureStore({})
}
{
  const reducer: qx.Reducer<number> = () => 0
  const store = qx.configureStore({ reducer })
  const numberStore: qx.Store<number, qx.AnyAction> = store
  const stringStore: qx.Store<string, qx.AnyAction> = store
}
{
  const reducer: qx.Reducer<number, qx.PayloadAction<number>> = () => 0
  const store = qx.configureStore({ reducer })
  const numberStore: qx.Store<number, qx.PayloadAction<number>> = store
  const stringStore: qx.Store<number, qx.PayloadAction<string>> = store
}
{
  const middleware: qx.Middleware = store => next => next
  qx.configureStore({
    reducer: () => 0,
    middleware: [middleware],
  })
  qx.configureStore({
    reducer: () => 0,
    middleware: ["not middleware"],
  })
}
{
  qx.configureStore({
    reducer: () => 0,
    devTools: true,
  })
  qx.configureStore({
    reducer: () => 0,
    devTools: "true",
  })
}
{
  qx.configureStore({
    reducer: () => 0,
    devTools: { name: "myApp" },
  })
  qx.configureStore({
    reducer: () => 0,
    devTools: { appname: "myApp" },
  })
}
{
  qx.configureStore({
    reducer: () => 0,
    preloadedState: 0,
  })
  qx.configureStore({
    reducer: () => 0,
    preloadedState: "non-matching state type",
  })
}
{
  qx.configureStore({
    reducer: () => 0,
    enhancers: [qx.applyMiddleware(store => next => next)],
  })
  qx.configureStore({
    reducer: () => 0,
    enhancers: ["not a store enhancer"],
  })
}
{
  const counterReducer1: qx.Reducer<number> = () => 0
  const counterReducer2: qx.Reducer<number> = () => 0
  const store = qx.configureStore({
    reducer: {
      counter1: counterReducer1,
      counter2: counterReducer2,
    },
    preloadedState: {
      counter1: 0,
    },
  })
  const counter1: number = store.getState().counter1
  const counter2: number = store.getState().counter2
}
{
  type StateA = number
  const reducerA = () => 0
  function thunkA() {
    return (() => {}) as any as qx.ThunkAction<Promise<"A">, StateA, any, any>
  }
  type StateB = string
  function thunkB() {
    return (dispatch: qx.Dispatch, getState: () => StateB) => {}
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
    const res = store.dispatch((dispatch, getState) => {
      return 42
    })
    const action = store.dispatch({ type: "foo" })
  }
  {
    const slice = qx.createSlice({
      name: "counter",
      initialState: {
        value: 0,
      },
      reducers: {
        incrementByAmount: (state, action: qx.PayloadAction<number>) => {
          state.value += action.payload
        },
      },
    })
    const store = qx.configureStore({
      reducer: {
        counter: slice.reducer,
      },
    })
    const action = slice.actions.incrementByAmount(2)
    const dispatchResult = store.dispatch(action)
    expectType<{ type: string; payload: number }>(dispatchResult)
    const promiseResult = store.dispatch(async dispatch => {
      return 42
    })
    expectType<Promise<number>>(promiseResult)
    const store2 = qx.configureStore({
      reducer: {
        counter: slice.reducer,
      },
      middleware: gDM =>
        gDM({
          thunk: {
            extraArgument: 42,
          },
        }),
    })
    const dispatchResult2 = store2.dispatch(action)
    expectType<{ type: string; payload: number }>(dispatchResult2)
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: [],
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: [qx.thunkMiddleware] as [qx.ThunkMiddleware<StateA>],
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: qx.getDefaultMiddleware<StateA>(),
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: [] as any as [qx.Middleware<(a: StateA) => boolean, StateA>],
    })
    const result: boolean = store.dispatch(5)
    const result2: string = store.dispatch(5)
  }
  {
    const middleware = [] as any as [
      qx.Middleware<(a: "a") => "A", StateA>,
      qx.Middleware<(b: "b") => "B", StateA>,
      qx.ThunkMiddleware<StateA>
    ]
    const store = qx.configureStore({
      reducer: reducerA,
      middleware,
    })
    const result: "A" = store.dispatch("a")
    const result2: "B" = store.dispatch("b")
    const result3: Promise<"A"> = store.dispatch(thunkA())
  }
  {
    const store = qx.configureStore({ reducer: {} })
    store.dispatch(function () {} as qx.ThunkAction<
      void,
      {},
      undefined,
      qx.AnyAction
    >)
    store.dispatch(function () {} as qx.ThunkAction<
      void,
      {},
      null,
      qx.AnyAction
    >)
    store.dispatch(function () {} as qx.ThunkAction<
      void,
      {},
      unknown,
      qx.AnyAction
    >)
    store.dispatch(function () {} as qx.ThunkAction<
      void,
      {},
      boolean,
      qx.AnyAction
    >)
  }
  {
    const middleware = qx
      .getDefaultMiddleware<StateA>()
      .prepend((() => {}) as any as qx.Middleware<(a: "a") => "A", StateA>)
    const store = qx.configureStore({
      reducer: reducerA,
      middleware,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qx.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const concatenated = qx
      .getDefaultMiddleware<StateA>()
      .prepend(otherMiddleware)
    expectType<
      ReadonlyArray<
        typeof otherMiddleware | qx.ThunkMiddleware | qx.Middleware<{}>
      >
    >(concatenated)
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: concatenated,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qx.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const concatenated = qx
      .getDefaultMiddleware<StateA>()
      .concat(otherMiddleware)
    expectType<
      ReadonlyArray<
        typeof otherMiddleware | qx.ThunkMiddleware | qx.Middleware<{}>
      >
    >(concatenated)
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: concatenated,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().prepend((() => {}) as any as qx.Middleware<
          (a: "a") => "A",
          StateA
        >),
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qx.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const otherMiddleware2: qx.Middleware<(a: "b") => "B", StateA> =
      _anyMiddleware
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware()
          .concat(otherMiddleware)
          .prepend(otherMiddleware2),
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    const result3: "B" = store.dispatch("b")
    store.dispatch(thunkB())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ thunk: false }).prepend(
          (() => {}) as any as qx.Middleware<(a: "a") => "A", StateA>
        ),
    })
    const result1: "A" = store.dispatch("a")
    store.dispatch(thunkA())
  }
  {
    const store = qx.configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(_anyMiddleware as qx.Middleware<any>),
    })
    expectNotAny(store.dispatch)
  }
  {
    interface CounterState {
      value: number
    }
    const counterSlice = qx.createSlice({
      name: "counter",
      initialState: { value: 0 } as CounterState,
      reducers: {
        increment(state) {
          state.value += 1
        },
        decrement(state) {
          state.value -= 1
        },
        incrementByAmount: (state, action: qx.PayloadAction<number>) => {
          state.value += action.payload
        },
      },
    })
    type Unsubscribe = () => void
    const dummyMiddleware: qx.Middleware<
      {
        (action: qx.Action<"actionListenerMiddleware/add">): Unsubscribe
      },
      CounterState
    > = storeApi => next => action => {}
    const store = qx.configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(dummyMiddleware),
    })
    expectType<
      ((action: qx.Action<"actionListenerMiddleware/add">) => Unsubscribe) &
        qx.ThunkDispatch<CounterState, undefined, qx.AnyAction> &
        qx.Dispatch<qx.AnyAction>
    >(store.dispatch)
    const unsubscribe = store.dispatch({
      type: "actionListenerMiddleware/add",
    } as const)
    expectType<Unsubscribe>(unsubscribe)
  }
}
