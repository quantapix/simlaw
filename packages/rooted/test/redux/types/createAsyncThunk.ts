/* eslint-disable no-lone-blocks */
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
