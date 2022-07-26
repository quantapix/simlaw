import * as React from "react"
import {
  createApi,
  fetchBaseQuery,
  QueryStatus,
  skipToken,
  SerializedError,
  createSelector,
  configureStore,
  createSlice,
  SubscriptionOptions,
  AnyAction,
} from "@reduxjs/toolkit/query/react"
import { act, fireEvent, render, screen, waitFor, renderHook } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { rest } from "msw"
import {
  actionsReducer,
  ANY,
  expectExactType,
  expectType,
  setupApiStore,
  useRenderCounter,
  waitMs,
  withProvider,
} from "./helpers.js"
import { server } from "./mocks/server.js"
import type { BaseQueryApi } from "../baseQueryTypes"

test("handles a non-async baseQuery without error", async () => {
  const baseQuery = (args?: any) => ({ data: args })
  const api = createApi({
    baseQuery,
    endpoints: build => ({
      getUser: build.query<unknown, number>({
        query(id) {
          return { url: `user/${id}` }
        },
      }),
    }),
  })
  const { getUser } = api.endpoints
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: gDM => gDM().concat(api.middleware),
  })
  const promise = store.dispatch(getUser.initiate(1))
  const { data } = await promise
  expect(data).toEqual({
    url: "user/1",
  })
  const storeResult = getUser.select(1)(store.getState())
  expect(storeResult).toEqual({
    data: {
      url: "user/1",
    },
    endpointName: "getUser",
    isError: false,
    isLoading: false,
    isSuccess: true,
    isUninitialized: false,
    originalArgs: 1,
    requestId: expect.any(String),
    status: "fulfilled",
    startedTimeStamp: expect.any(Number),
    fulfilledTimeStamp: expect.any(Number),
  })
})
test("passes the extraArgument property to the baseQueryApi", async () => {
  const baseQuery = (_args: any, api: BaseQueryApi) => ({ data: api.extra })
  const api = createApi({
    baseQuery,
    endpoints: build => ({
      getUser: build.query<unknown, void>({
        query: () => "",
      }),
    }),
  })
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: gDM => gDM({ thunk: { extraArgument: "cakes" } }).concat(api.middleware),
  })
  const { getUser } = api.endpoints
  const { data } = await store.dispatch(getUser.initiate())
  expect(data).toBe("cakes")
})
describe("re-triggering behavior on arg change", () => {
  const api = createApi({
    baseQuery: () => ({ data: null }),
    endpoints: build => ({
      getUser: build.query<any, any>({
        query: obj => obj,
      }),
    }),
  })
  const { getUser } = api.endpoints
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: gDM => gDM().concat(api.middleware),
  })
  const spy = jest.spyOn(getUser, "initiate")
  beforeEach(() => void spy.mockClear())
  it("re-trigger on literal value change", async () => {
    const { result, rerender } = renderHook(props => getUser.useQuery(props), {
      wrapper: withProvider(store),
      initialProps: 5,
    })
    await waitFor(() => {
      expect(result.current.status).not.toBe("pending")
    })

    expect(spy).toHaveBeenCalledTimes(1)
    for (let x = 1; x < 3; x++) {
      rerender(6)
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(2)
    }
    for (let x = 1; x < 3; x++) {
      rerender(7)
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(3)
    }
  })
  it("only re-trigger on shallow-equal arg change", async () => {
    const { result, rerender } = renderHook(props => getUser.useQuery(props), {
      wrapper: withProvider(store),
      initialProps: { name: "Bob", likes: "iceCream" },
    })
    await waitFor(() => {
      expect(result.current.status).not.toBe("pending")
    })
    expect(spy).toHaveBeenCalledTimes(1)
    for (let x = 1; x < 3; x++) {
      rerender({ name: "Bob", likes: "waffles" })
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(2)
    }
    for (let x = 1; x < 3; x++) {
      rerender({ name: "Alice", likes: "waffles" })
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(3)
    }
  })
  it("re-triggers every time on deeper value changes", async () => {
    const name = "Tim"
    const { result, rerender } = renderHook(props => getUser.useQuery(props), {
      wrapper: withProvider(store),
      initialProps: { person: { name } },
    })
    await waitFor(() => {
      expect(result.current.status).not.toBe("pending")
    })
    expect(spy).toHaveBeenCalledTimes(1)
    for (let x = 1; x < 3; x++) {
      rerender({ person: { name: name + x } })
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(x + 1)
    }
  })
  it("do not re-trigger if the order of keys change while maintaining the same values", async () => {
    const { result, rerender } = renderHook(props => getUser.useQuery(props), {
      wrapper: withProvider(store),
      initialProps: { name: "Tim", likes: "Bananas" },
    })
    await waitFor(() => {
      expect(result.current.status).not.toBe("pending")
    })
    expect(spy).toHaveBeenCalledTimes(1)
    for (let x = 1; x < 3; x++) {
      rerender({ likes: "Bananas", name: "Tim" })
      await waitFor(() => {
        expect(result.current.status).not.toBe("pending")
      })
      expect(spy).toHaveBeenCalledTimes(1)
    }
  })
})

describe("buildSelector", () => {
  test.skip("buildSelector typetest", () => {
    interface Todo {
      userId: number
      id: number
      title: string
      completed: boolean
    }
    type Todos = Array<Todo>
    const exampleApi = createApi({
      reducerPath: "api",
      baseQuery: fetchBaseQuery({
        baseUrl: "https://jsonplaceholder.typicode.com",
      }),
      endpoints: build => ({
        getTodos: build.query<Todos, string>({
          query: () => "/todos",
        }),
      }),
    })
    const exampleQuerySelector = exampleApi.endpoints.getTodos.select("/")
    const todosSelector = createSelector([exampleQuerySelector], queryState => {
      return queryState?.data?.[0] ?? ({} as Todo)
    })
    const firstTodoTitleSelector = createSelector([todosSelector], todo => todo?.title)
    const store = configureStore({
      reducer: {
        [exampleApi.reducerPath]: exampleApi.reducer,
        other: () => 1,
      },
    })
    const todoTitle = firstTodoTitleSelector(store.getState())
    const upperTitle = todoTitle.toUpperCase()
    expectExactType<string>(upperTitle)
  })
})
const baseQuery = (args?: any) => ({ data: args })
const api = createApi({
  baseQuery,
  endpoints: build => ({
    getUser: build.query<unknown, number>({
      query(id) {
        return { url: `user/${id}` }
      },
    }),
  }),
})
const { getUser } = api.endpoints
const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: "1234",
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload
    },
  },
})
const storeRef = setupApiStore(api, { auth: authSlice.reducer })
it("only resets the api state when resetApiState is dispatched", async () => {
  storeRef.store.dispatch({ type: "unrelated" }) // trigger "registered middleware" into place
  const initialState = storeRef.store.getState()
  await storeRef.store.dispatch(getUser.initiate(1, { subscriptionOptions: { pollingInterval: 10 } }))
  expect(storeRef.store.getState()).toEqual({
    api: {
      config: {
        focused: true,
        keepUnusedDataFor: 60,
        middlewareRegistered: true,
        online: true,
        reducerPath: "api",
        refetchOnFocus: false,
        refetchOnMountOrArgChange: false,
        refetchOnReconnect: false,
      },
      mutations: {},
      provided: {},
      queries: {
        "getUser(1)": {
          data: {
            url: "user/1",
          },
          endpointName: "getUser",
          fulfilledTimeStamp: expect.any(Number),
          originalArgs: 1,
          requestId: expect.any(String),
          startedTimeStamp: expect.any(Number),
          status: "fulfilled",
        },
      },
      subscriptions: {
        "getUser(1)": expect.any(Object),
      },
    },
    auth: {
      token: "1234",
    },
  })
  storeRef.store.dispatch(api.util.resetApiState())
  expect(storeRef.store.getState()).toEqual(initialState)
})

const baseQuery = (args?: any) => ({ data: args })
const api = createApi({
  baseQuery,
  tagTypes: ["Banana", "Bread"],
  endpoints: build => ({
    getBanana: build.query<unknown, number>({
      query(id) {
        return { url: `banana/${id}` }
      },
      providesTags: ["Banana"],
    }),
    getBananas: build.query<unknown, void>({
      query() {
        return { url: "bananas" }
      },
      providesTags: ["Banana"],
    }),
    getBread: build.query<unknown, number>({
      query(id) {
        return { url: `bread/${id}` }
      },
      providesTags: ["Bread"],
    }),
  }),
})
const { getBanana, getBread } = api.endpoints
const storeRef = setupApiStore(api, {
  ...actionsReducer,
})
it("invalidates the specified tags", async () => {
  await storeRef.store.dispatch(getBanana.initiate(1))
  expect(storeRef.store.getState().actions).toMatchSequence(
    api.internalActions.middlewareRegistered.match,
    getBanana.matchPending,
    getBanana.matchFulfilled
  )
  await storeRef.store.dispatch(api.util.invalidateTags(["Banana", "Bread"]))
  await waitMs(20)
  const firstSequence = [
    api.internalActions.middlewareRegistered.match,
    getBanana.matchPending,
    getBanana.matchFulfilled,
    api.util.invalidateTags.match,
    getBanana.matchPending,
    getBanana.matchFulfilled,
  ]
  expect(storeRef.store.getState().actions).toMatchSequence(...firstSequence)
  await storeRef.store.dispatch(getBread.initiate(1))
  await storeRef.store.dispatch(api.util.invalidateTags([{ type: "Bread" }]))
  await waitMs(20)
  expect(storeRef.store.getState().actions).toMatchSequence(
    ...firstSequence,
    getBread.matchPending,
    getBread.matchFulfilled,
    api.util.invalidateTags.match,
    getBread.matchPending,
    getBread.matchFulfilled
  )
})
describe.skip("TS only tests", () => {
  it("should allow for an array of string TagTypes", () => {
    api.util.invalidateTags(["Banana", "Bread"])
  })
  it("should allow for an array of full TagTypes descriptions", () => {
    api.util.invalidateTags([{ type: "Banana" }, { type: "Bread", id: 1 }])
  })
  it("should allow for a mix of full descriptions as well as plain strings", () => {
    api.util.invalidateTags(["Banana", { type: "Bread", id: 1 }])
  })
  it("should error when using non-existing TagTypes", () => {
    api.util.invalidateTags(["Missing Tag"])
  })
  it("should error when using non-existing TagTypes in the full format", () => {
    api.util.invalidateTags([{ type: "Missing" }])
  })
  it("should allow pre-fetching for an endpoint that takes an arg", () => {
    api.util.prefetch("getBanana", 5, { force: true })
    api.util.prefetch("getBanana", 5, { force: false })
    api.util.prefetch("getBanana", 5, { ifOlderThan: false })
    api.util.prefetch("getBanana", 5, { ifOlderThan: 30 })
    api.util.prefetch("getBanana", 5, {})
  })
  it("should error when pre-fetching with the incorrect arg type", () => {
    api.util.prefetch("getBanana", "5", { force: true })
  })
  it("should allow pre-fetching for an endpoint with a void arg", () => {
    api.util.prefetch("getBananas", undefined, { force: true })
    api.util.prefetch("getBananas", undefined, { force: false })
    api.util.prefetch("getBananas", undefined, { ifOlderThan: false })
    api.util.prefetch("getBananas", undefined, { ifOlderThan: 30 })
    api.util.prefetch("getBananas", undefined, {})
  })
  it("should error when pre-fetching with a defined arg when expecting void", () => {
    api.util.prefetch("getBananas", 5, { force: true })
  })
  it("should error when pre-fetching for an incorrect endpoint name", () => {
    api.util.prefetch("getPomegranates", undefined, { force: true })
  })
})

let amount = 0
const api = createApi({
  baseQuery: async (arg: any) => {
    await waitMs()
    if (arg?.body && "amount" in arg.body) {
      amount += 1
    }
    if (arg?.body && "forceError" in arg.body) {
      return {
        error: {
          status: 500,
          data: null,
        },
      }
    }
    return {
      data: arg?.body ? { ...arg.body, ...(amount ? { amount } : {}) } : {},
    }
  },
  endpoints: build => ({
    getUser: build.query<{ name: string }, number>({
      query: () => ({
        body: { name: "Timmy" },
      }),
    }),
    getUserAndForceError: build.query<{ name: string }, number>({
      query: () => ({
        body: {
          forceError: true,
        },
      }),
    }),
    getIncrementedAmount: build.query<any, void>({
      query: () => ({
        url: "",
        body: {
          amount,
        },
      }),
    }),
    updateUser: build.mutation<{ name: string }, { name: string }>({
      query: update => ({ body: update }),
    }),
    getError: build.query({
      query: query => "/error",
    }),
  }),
})
const storeRef = setupApiStore(api, {
  actions(state: AnyAction[] = [], action: AnyAction) {
    return [...state, action]
  },
})
afterEach(() => {
  amount = 0
})
let getRenderCount: () => number = () => 0
describe("hooks tests", () => {
  describe("useQuery", () => {
    it("useQuery hook basic render count assumptions", async () => {
      function User() {
        const { isFetching } = api.endpoints.getUser.useQuery(1)
        getRenderCount = useRenderCounter()
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(2) // By the time this runs, the initial render will happen, and the query will start immediately running by the time we can expect this
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(3)
    })
    it("useQuery hook sets isFetching=true whenever a request is in flight", async () => {
      function User() {
        const [value, setValue] = React.useState(0)
        const { isFetching } = api.endpoints.getUser.useQuery(1, {
          skip: value < 1,
        })
        getRenderCount = useRenderCounter()
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onClick={() => setValue(val => val + 1)}>Increment value</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1)
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      fireEvent.click(screen.getByText("Increment value")) // setState = 1, perform request = 2
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(4)
      fireEvent.click(screen.getByText("Increment value"))
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      expect(getRenderCount()).toBe(5) // even though there was no request, the button click updates the state so this is an expected render
    })
    it("useQuery hook sets isLoading=true only on initial request", async () => {
      let refetch: any, isLoading: boolean, isFetching: boolean
      function User() {
        const [value, setValue] = React.useState(0)
        ;({ isLoading, isFetching, refetch } = api.endpoints.getUser.useQuery(2, {
          skip: value < 1,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onClick={() => setValue(val => val + 1)}>Increment value</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      fireEvent.click(screen.getByText("Increment value"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false")) // Make sure the original loading has completed.
      fireEvent.click(screen.getByText("Increment value"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      act(() => refetch())
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      expect(screen.getByTestId("isLoading").textContent).toBe("false")
    })
    it("useQuery hook sets isLoading and isFetching to the correct states", async () => {
      let refetchMe: () => void = () => {}
      function User() {
        const [value, setValue] = React.useState(0)
        getRenderCount = useRenderCounter()
        const { isLoading, isFetching, refetch } = api.endpoints.getUser.useQuery(22, { skip: value < 1 })
        refetchMe = refetch
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <button onClick={() => setValue(val => val + 1)}>Increment value</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1)
      expect(screen.getByTestId("isLoading").textContent).toBe("false")
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      fireEvent.click(screen.getByText("Increment value")) // renders: set state = 1, perform request = 2
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("true")
        expect(screen.getByTestId("isFetching").textContent).toBe("true")
      })
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false")
        expect(screen.getByTestId("isFetching").textContent).toBe("false")
      })
      expect(getRenderCount()).toBe(4)
      fireEvent.click(screen.getByText("Increment value"))
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false")
        expect(screen.getByTestId("isFetching").textContent).toBe("false")
      })
      expect(getRenderCount()).toBe(5)
      act(() => refetchMe())
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false")
        expect(screen.getByTestId("isFetching").textContent).toBe("true")
      })
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false")
        expect(screen.getByTestId("isFetching").textContent).toBe("false")
      })
      expect(getRenderCount()).toBe(7)
    })
    it("`isLoading` does not jump back to true, while `isFetching` does", async () => {
      const loadingHist: boolean[] = [],
        fetchingHist: boolean[] = []
      function User({ id }: { id: number }) {
        const { isLoading, isFetching, status } = api.endpoints.getUser.useQuery(id)
        React.useEffect(() => {
          loadingHist.push(isLoading)
        }, [isLoading])
        React.useEffect(() => {
          fetchingHist.push(isFetching)
        }, [isFetching])
        return <div data-testid="status">{status === QueryStatus.fulfilled && id}</div>
      }
      let { rerender } = render(<User id={1} />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("1"))
      rerender(<User id={2} />)
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("2"))
      expect(loadingHist).toEqual([true, false])
      expect(fetchingHist).toEqual([true, false, true, false])
    })
    it("useQuery hook respects refetchOnMountOrArgChange: true", async () => {
      let data, isLoading, isFetching
      function User() {
        ;({ data, isLoading, isFetching } = api.endpoints.getIncrementedAmount.useQuery(undefined, {
          refetchOnMountOrArgChange: true,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="amount">{String(data?.amount)}</div>
          </div>
        )
      }
      const { unmount } = render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
      unmount()
      render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.getByTestId("isLoading").textContent).toBe("false")
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("2"))
    })
    it("useQuery does not refetch when refetchOnMountOrArgChange: NUMBER condition is not met", async () => {
      let data, isLoading, isFetching
      function User() {
        ;({ data, isLoading, isFetching } = api.endpoints.getIncrementedAmount.useQuery(undefined, {
          refetchOnMountOrArgChange: 10,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="amount">{String(data?.amount)}</div>
          </div>
        )
      }
      const { unmount } = render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
      unmount()
      render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
    })
    it("useQuery refetches when refetchOnMountOrArgChange: NUMBER condition is met", async () => {
      let data, isLoading, isFetching
      function User() {
        ;({ data, isLoading, isFetching } = api.endpoints.getIncrementedAmount.useQuery(undefined, {
          refetchOnMountOrArgChange: 0.5,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="amount">{String(data?.amount)}</div>
          </div>
        )
      }
      const { unmount } = render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
      unmount()
      await waitMs(510)
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("2"))
    })
    it("refetchOnMountOrArgChange works as expected when changing skip from false->true", async () => {
      let data, isLoading, isFetching
      function User() {
        const [skip, setSkip] = React.useState(true)
        ;({ data, isLoading, isFetching } = api.endpoints.getIncrementedAmount.useQuery(undefined, {
          refetchOnMountOrArgChange: 0.5,
          skip,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="amount">{String(data?.amount)}</div>
            <button onClick={() => setSkip(prev => !prev)}>change skip</button>;
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.getByTestId("isLoading").textContent).toBe("false")
      expect(screen.getByTestId("amount").textContent).toBe("undefined")
      fireEvent.click(screen.getByText("change skip"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
    })
    it("refetchOnMountOrArgChange works as expected when changing skip from false->true with a cached query", async () => {
      let data, isLoading, isFetching
      function User() {
        const [skip, setSkip] = React.useState(true)
        ;({ data, isLoading, isFetching } = api.endpoints.getIncrementedAmount.useQuery(undefined, {
          skip,
          refetchOnMountOrArgChange: 0.5,
        }))
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <div data-testid="amount">{String(data?.amount)}</div>
            <button onClick={() => setSkip(prev => !prev)}>change skip</button>;
          </div>
        )
      }
      let { unmount } = render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      fireEvent.click(screen.getByText("change skip"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => {
        expect(screen.getByTestId("amount").textContent).toBe("1")
        expect(screen.getByTestId("isFetching").textContent).toBe("false")
      })
      unmount()
      await waitMs(100)
      ;({ unmount } = render(<User />, {
        wrapper: storeRef.wrapper,
      }))
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      expect(screen.getByTestId("amount").textContent).toBe("undefined")
      fireEvent.click(screen.getByText("change skip"))
      expect(screen.getByTestId("isFetching").textContent).toBe("false")
      expect(screen.getByTestId("amount").textContent).toBe("1")
      unmount()
      await waitMs(500)
      ;({ unmount } = render(<User />, {
        wrapper: storeRef.wrapper,
      }))
      fireEvent.click(screen.getByText("change skip"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("2"))
    })
    describe("api.util.resetApiState resets hook", () => {
      it("without `selectFromResult`", async () => {
        const { result } = renderHook(() => api.endpoints.getUser.useQuery(5), {
          wrapper: storeRef.wrapper,
        })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        act(() => void storeRef.store.dispatch(api.util.resetApiState()))
        expect(result.current).toEqual(
          expect.objectContaining({
            isError: false,
            isFetching: true,
            isLoading: true,
            isSuccess: false,
            isUninitialized: false,
            refetch: expect.any(Function),
            status: "pending",
          })
        )
      })
      it("with `selectFromResult`", async () => {
        const selectFromResult = jest.fn(x => x)
        const { result } = renderHook(() => api.endpoints.getUser.useQuery(5, { selectFromResult }), {
          wrapper: storeRef.wrapper,
        })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        selectFromResult.mockClear()
        act(() => void storeRef.store.dispatch(api.util.resetApiState()))
        expect(selectFromResult).toHaveBeenNthCalledWith(1, {
          isError: false,
          isFetching: false,
          isLoading: false,
          isSuccess: false,
          isUninitialized: true,
          status: "uninitialized",
        })
      })
    })
  })
  describe("useLazyQuery", () => {
    let data: any
    afterEach(() => {
      data = undefined
    })
    let getRenderCount: () => number = () => 0
    it("useLazyQuery does not automatically fetch when mounted and has undefined data", async () => {
      function User() {
        const [fetchUser, { data: hookData, isFetching, isUninitialized }] = api.endpoints.getUser.useLazyQuery()
        getRenderCount = useRenderCounter()
        data = hookData
        return (
          <div>
            <div data-testid="isUninitialized">{String(isUninitialized)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button data-testid="fetchButton" onClick={() => fetchUser(1)}>
              fetchUser
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1)
      await waitFor(() => expect(screen.getByTestId("isUninitialized").textContent).toBe("true"))
      await waitFor(() => expect(data).toBeUndefined())
      fireEvent.click(screen.getByTestId("fetchButton"))
      expect(getRenderCount()).toBe(2)
      await waitFor(() => expect(screen.getByTestId("isUninitialized").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(3)
      fireEvent.click(screen.getByTestId("fetchButton"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(5)
    })
    it("useLazyQuery accepts updated subscription options and only dispatches updateSubscriptionOptions when values are updated", async () => {
      let interval = 1000
      function User() {
        const [options, setOptions] = React.useState<SubscriptionOptions>()
        const [fetchUser, { data: hookData, isFetching, isUninitialized }] = api.endpoints.getUser.useLazyQuery(options)
        getRenderCount = useRenderCounter()
        data = hookData
        return (
          <div>
            <div data-testid="isUninitialized">{String(isUninitialized)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button data-testid="fetchButton" onClick={() => fetchUser(1)}>
              fetchUser
            </button>
            <button
              data-testid="updateOptions"
              onClick={() =>
                setOptions({
                  pollingInterval: interval,
                })
              }
            >
              updateOptions
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1) // hook mount
      await waitFor(() => expect(screen.getByTestId("isUninitialized").textContent).toBe("true"))
      await waitFor(() => expect(data).toBeUndefined())
      fireEvent.click(screen.getByTestId("fetchButton"))
      expect(getRenderCount()).toBe(2)
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(3)
      fireEvent.click(screen.getByTestId("updateOptions")) // setState = 1
      expect(getRenderCount()).toBe(4)
      fireEvent.click(screen.getByTestId("fetchButton")) // perform new request = 2
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(6)
      interval = 1000
      fireEvent.click(screen.getByTestId("updateOptions")) // setState = 1
      expect(getRenderCount()).toBe(7)
      fireEvent.click(screen.getByTestId("fetchButton"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(getRenderCount()).toBe(9)
      expect(
        storeRef.store.getState().actions.filter(api.internalActions.updateSubscriptionOptions.match)
      ).toHaveLength(1)
    })
    it("useLazyQuery accepts updated args and unsubscribes the original query", async () => {
      function User() {
        const [fetchUser, { data: hookData, isFetching, isUninitialized }] = api.endpoints.getUser.useLazyQuery()
        data = hookData
        return (
          <div>
            <div data-testid="isUninitialized">{String(isUninitialized)}</div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button data-testid="fetchUser1" onClick={() => fetchUser(1)}>
              fetchUser1
            </button>
            <button data-testid="fetchUser2" onClick={() => fetchUser(2)}>
              fetchUser2
            </button>
          </div>
        )
      }
      const { unmount } = render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isUninitialized").textContent).toBe("true"))
      await waitFor(() => expect(data).toBeUndefined())
      fireEvent.click(screen.getByTestId("fetchUser1"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(storeRef.store.getState().actions.filter(api.internalActions.unsubscribeQueryResult.match)).toHaveLength(0)
      fireEvent.click(screen.getByTestId("fetchUser2"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(storeRef.store.getState().actions.filter(api.internalActions.unsubscribeQueryResult.match)).toHaveLength(1)
      fireEvent.click(screen.getByTestId("fetchUser1"))
      expect(storeRef.store.getState().actions.filter(api.internalActions.unsubscribeQueryResult.match)).toHaveLength(2)
      fireEvent.click(screen.getByTestId("fetchUser1"))
      expect(storeRef.store.getState().actions.filter(api.internalActions.unsubscribeQueryResult.match)).toHaveLength(3)
      unmount()
      expect(storeRef.store.getState().actions.filter(api.internalActions.unsubscribeQueryResult.match)).toHaveLength(4)
    })
    it("useLazyQuery hook callback returns various properties to handle the result", async () => {
      function User() {
        const [getUser] = api.endpoints.getUser.useLazyQuery()
        const [{ successMsg, errMsg, isAborted }, setValues] = React.useState({
          successMsg: "",
          errMsg: "",
          isAborted: false,
        })
        const handleClick = (abort: boolean) => async () => {
          const res = getUser(1)
          res.then(result => {
            if (result.isSuccess) {
              expectType<{
                data: {
                  name: string
                }
              }>(result)
            }
            if (result.isError) {
              expectType<{
                error: { status: number; data: unknown } | SerializedError
              }>(result)
            }
          })
          expectType<number>(res.arg)
          expectType<string>(res.requestId)
          expectType<() => void>(res.abort)
          expectType<() => Promise<{ name: string }>>(res.unwrap)
          expectType<() => void>(res.unsubscribe)
          expectType<(options: SubscriptionOptions) => void>(res.updateSubscriptionOptions)
          expectType<() => void>(res.refetch)
          if (abort) res.abort()
          res
            .unwrap()
            .then(result => {
              expectType<{ name: string }>(result)
              setValues({
                successMsg: `Successfully fetched user ${result.name}`,
                errMsg: "",
                isAborted: false,
              })
            })
            .catch(err => {
              setValues({
                successMsg: "",
                errMsg: `An error has occurred fetching userId: ${res.arg}`,
                isAborted: err.name === "AbortError",
              })
            })
        }
        return (
          <div>
            <button onClick={handleClick(false)}>Fetch User successfully</button>
            <button onClick={handleClick(true)}>Fetch User and abort</button>
            <div>{successMsg}</div>
            <div>{errMsg}</div>
            <div>{isAborted ? "Request was aborted" : ""}</div>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.queryByText(/An error has occurred/i)).toBeNull()
      expect(screen.queryByText(/Successfully fetched user/i)).toBeNull()
      expect(screen.queryByText("Request was aborted")).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "Fetch User and abort" }))
      await screen.findByText("An error has occurred fetching userId: 1")
      expect(screen.queryByText(/Successfully fetched user/i)).toBeNull()
      screen.getByText("Request was aborted")
      fireEvent.click(screen.getByRole("button", { name: "Fetch User successfully" }))
      await screen.findByText("Successfully fetched user Timmy")
      expect(screen.queryByText(/An error has occurred/i)).toBeNull()
      expect(screen.queryByText("Request was aborted")).toBeNull()
    })
    it("unwrapping the useLazyQuery trigger result does not throw on ConditionError and instead returns the aggregate error", async () => {
      function User() {
        const [getUser, { data, error }] = api.endpoints.getUserAndForceError.useLazyQuery()
        const [unwrappedError, setUnwrappedError] = React.useState<any>()
        const handleClick = async () => {
          const res = getUser(1)
          try {
            await res.unwrap()
          } catch (error) {
            setUnwrappedError(error)
          }
        }
        return (
          <div>
            <button onClick={handleClick}>Fetch User</button>
            <div data-testid="result">{JSON.stringify(data)}</div>
            <div data-testid="error">{JSON.stringify(error)}</div>
            <div data-testid="unwrappedError">{JSON.stringify(unwrappedError)}</div>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      const fetchButton = screen.getByRole("button", { name: "Fetch User" })
      fireEvent.click(fetchButton)
      fireEvent.click(fetchButton) // This technically dispatches a ConditionError, but we don't want to see that here. We want the real error to resolve.
      await waitFor(() => {
        const errorResult = screen.getByTestId("error")?.textContent
        const unwrappedErrorResult = screen.getByTestId("unwrappedError")?.textContent
        if (errorResult && unwrappedErrorResult) {
          expect(JSON.parse(errorResult)).toMatchObject({
            status: 500,
            data: null,
          })
          expect(JSON.parse(unwrappedErrorResult)).toMatchObject(JSON.parse(errorResult))
        }
      })
      expect(screen.getByTestId("result").textContent).toBe("")
    })
    it("useLazyQuery does not throw on ConditionError and instead returns the aggregate result", async () => {
      function User() {
        const [getUser, { data, error }] = api.endpoints.getUser.useLazyQuery()
        const [unwrappedResult, setUnwrappedResult] = React.useState<undefined | { name: string }>()
        const handleClick = async () => {
          const res = getUser(1)
          const result = await res.unwrap()
          setUnwrappedResult(result)
        }
        return (
          <div>
            <button onClick={handleClick}>Fetch User</button>
            <div data-testid="result">{JSON.stringify(data)}</div>
            <div data-testid="error">{JSON.stringify(error)}</div>
            <div data-testid="unwrappedResult">{JSON.stringify(unwrappedResult)}</div>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      const fetchButton = screen.getByRole("button", { name: "Fetch User" })
      fireEvent.click(fetchButton)
      fireEvent.click(fetchButton) // This technically dispatches a ConditionError, but we don't want to see that here. We want the real result to resolve and ignore the error.
      await waitFor(() => {
        const dataResult = screen.getByTestId("error")?.textContent
        const unwrappedDataResult = screen.getByTestId("unwrappedResult")?.textContent
        if (dataResult && unwrappedDataResult) {
          expect(JSON.parse(dataResult)).toMatchObject({
            name: "Timmy",
          })
          expect(JSON.parse(unwrappedDataResult)).toMatchObject(JSON.parse(dataResult))
        }
      })
      expect(screen.getByTestId("error").textContent).toBe("")
    })
  })
  describe("useMutation", () => {
    it("useMutation hook sets and unsets the isLoading flag when running", async () => {
      function User() {
        const [updateUser, { isLoading }] = api.endpoints.updateUser.useMutation()
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <button onClick={() => updateUser({ name: "Banana" })}>Update User</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      fireEvent.click(screen.getByText("Update User"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
    })
    it("useMutation hook sets data to the resolved response on success", async () => {
      const result = { name: "Banana" }
      function User() {
        const [updateUser, { data }] = api.endpoints.updateUser.useMutation()
        return (
          <div>
            <div data-testid="result">{JSON.stringify(data)}</div>
            <button onClick={() => updateUser({ name: "Banana" })}>Update User</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      fireEvent.click(screen.getByText("Update User"))
      await waitFor(() => expect(screen.getByTestId("result").textContent).toBe(JSON.stringify(result)))
    })
    it("useMutation hook callback returns various properties to handle the result", async () => {
      function User() {
        const [updateUser] = api.endpoints.updateUser.useMutation()
        const [successMsg, setSuccessMsg] = React.useState("")
        const [errMsg, setErrMsg] = React.useState("")
        const [isAborted, setIsAborted] = React.useState(false)
        const handleClick = async () => {
          const res = updateUser({ name: "Banana" })
          res.then(result => {
            expectType<
              | {
                  error: { status: number; data: unknown } | SerializedError
                }
              | {
                  data: {
                    name: string
                  }
                }
            >(result)
          })
          expectType<{
            endpointName: string
            originalArgs: { name: string }
            track?: boolean
          }>(res.arg)
          expectType<string>(res.requestId)
          expectType<() => void>(res.abort)
          expectType<() => Promise<{ name: string }>>(res.unwrap)
          expectType<() => void>(res.reset)
          expectType<() => void>(res.unsubscribe)
          res.abort()
          res
            .unwrap()
            .then(result => {
              expectType<{ name: string }>(result)
              setSuccessMsg(`Successfully updated user ${result.name}`)
            })
            .catch(err => {
              setErrMsg(`An error has occurred updating user ${res.arg.originalArgs.name}`)
              if (err.name === "AbortError") {
                setIsAborted(true)
              }
            })
        }
        return (
          <div>
            <button onClick={handleClick}>Update User and abort</button>
            <div>{successMsg}</div>
            <div>{errMsg}</div>
            <div>{isAborted ? "Request was aborted" : ""}</div>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      expect(screen.queryByText(/An error has occurred/i)).toBeNull()
      expect(screen.queryByText(/Successfully updated user/i)).toBeNull()
      expect(screen.queryByText("Request was aborted")).toBeNull()
      fireEvent.click(screen.getByRole("button", { name: "Update User and abort" }))
      await screen.findByText("An error has occurred updating user Banana")
      expect(screen.queryByText(/Successfully updated user/i)).toBeNull()
      screen.getByText("Request was aborted")
    })
    it("useMutation return value contains originalArgs", async () => {
      const { result } = renderHook(() => api.endpoints.updateUser.useMutation(), {
        wrapper: storeRef.wrapper,
      })
      const arg = { name: "Foo" }
      const firstRenderResult = result.current
      expect(firstRenderResult[1].originalArgs).toBe(undefined)
      act(() => void firstRenderResult[0](arg))
      const secondRenderResult = result.current
      expect(firstRenderResult[1].originalArgs).toBe(undefined)
      expect(secondRenderResult[1].originalArgs).toBe(arg)
    })
    it("`reset` sets state back to original state", async () => {
      function User() {
        const [updateUser, result] = api.endpoints.updateUser.useMutation()
        return (
          <>
            <span>{result.isUninitialized ? "isUninitialized" : result.isSuccess ? "isSuccess" : "other"}</span>
            <span>{result.originalArgs?.name}</span>
            <button onClick={() => updateUser({ name: "Yay" })}>trigger</button>
            <button onClick={result.reset}>reset</button>
          </>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await screen.findByText(/isUninitialized/i)
      expect(screen.queryByText("Yay")).toBeNull()
      expect(Object.keys(storeRef.store.getState().api.mutations).length).toBe(0)
      userEvent.click(screen.getByRole("button", { name: "trigger" }))
      await screen.findByText(/isSuccess/i)
      expect(screen.queryByText("Yay")).not.toBeNull()
      expect(Object.keys(storeRef.store.getState().api.mutations).length).toBe(1)
      userEvent.click(screen.getByRole("button", { name: "reset" }))
      await screen.findByText(/isUninitialized/i)
      expect(screen.queryByText("Yay")).toBeNull()
      expect(Object.keys(storeRef.store.getState().api.mutations).length).toBe(0)
    })
  })
  describe("usePrefetch", () => {
    it("usePrefetch respects force arg", async () => {
      const { usePrefetch } = api
      const USER_ID = 4
      function User() {
        const { isFetching } = api.endpoints.getUser.useQuery(USER_ID)
        const prefetchUser = usePrefetch("getUser", { force: true })
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onMouseEnter={() => prefetchUser(USER_ID, { force: true })} data-testid="highPriority">
              High priority action intent
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      userEvent.hover(screen.getByTestId("highPriority"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        error: undefined,
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: true,
        isSuccess: false,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.pending,
      })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: false,
        isSuccess: true,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.fulfilled,
      })
    })
    it("usePrefetch does not make an additional request if already in the cache and force=false", async () => {
      const { usePrefetch } = api
      const USER_ID = 2
      function User() {
        const { isFetching } = api.endpoints.getUser.useQuery(USER_ID)
        const prefetchUser = usePrefetch("getUser", { force: false })
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onMouseEnter={() => prefetchUser(USER_ID)} data-testid="lowPriority">
              Low priority user action intent
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      userEvent.hover(screen.getByTestId("lowPriority"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: false,
        isSuccess: true,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.fulfilled,
      })
      await waitMs()
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: false,
        isSuccess: true,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.fulfilled,
      })
    })
    it("usePrefetch respects ifOlderThan when it evaluates to true", async () => {
      const { usePrefetch } = api
      const USER_ID = 47
      function User() {
        const { isFetching } = api.endpoints.getUser.useQuery(USER_ID)
        const prefetchUser = usePrefetch("getUser", { ifOlderThan: 0.2 })
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onMouseEnter={() => prefetchUser(USER_ID)} data-testid="lowPriority">
              Low priority user action intent
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitMs(400)
      userEvent.hover(screen.getByTestId("lowPriority"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: true,
        isSuccess: false,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.pending,
      })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        data: { name: "Timmy" },
        endpointName: "getUser",
        fulfilledTimeStamp: expect.any(Number),
        isError: false,
        isLoading: false,
        isSuccess: true,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: QueryStatus.fulfilled,
      })
    })
    it("usePrefetch returns the last success result when ifOlderThan evalutes to false", async () => {
      const { usePrefetch } = api
      const USER_ID = 2
      function User() {
        const { isFetching } = api.endpoints.getUser.useQuery(USER_ID)
        const prefetchUser = usePrefetch("getUser", { ifOlderThan: 10 })
        return (
          <div>
            <div data-testid="isFetching">{String(isFetching)}</div>
            <button onMouseEnter={() => prefetchUser(USER_ID)} data-testid="lowPriority">
              Low priority user action intent
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
      await waitMs()
      const latestQueryData = api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)
      userEvent.hover(screen.getByTestId("lowPriority"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual(latestQueryData)
    })
    it("usePrefetch executes a query even if conditions fail when the cache is empty", async () => {
      const { usePrefetch } = api
      const USER_ID = 2
      function User() {
        const prefetchUser = usePrefetch("getUser", { ifOlderThan: 10 })
        return (
          <div>
            <button onMouseEnter={() => prefetchUser(USER_ID)} data-testid="lowPriority">
              Low priority user action intent
            </button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      userEvent.hover(screen.getByTestId("lowPriority"))
      expect(api.endpoints.getUser.select(USER_ID)(storeRef.store.getState() as any)).toEqual({
        endpointName: "getUser",
        isError: false,
        isLoading: true,
        isSuccess: false,
        isUninitialized: false,
        originalArgs: USER_ID,
        requestId: expect.any(String),
        startedTimeStamp: expect.any(Number),
        status: "pending",
      })
    })
  })
  describe("useQuery and useMutation invalidation behavior", () => {
    const api = createApi({
      baseQuery: fetchBaseQuery({ baseUrl: "https://example.com" }),
      tagTypes: ["User"],
      endpoints: build => ({
        checkSession: build.query<any, void>({
          query: () => "/me",
          providesTags: ["User"],
        }),
        login: build.mutation<any, any>({
          query: () => ({ url: "/login", method: "POST" }),
          invalidatesTags: ["User"],
        }),
      }),
    })
    const storeRef = setupApiStore(api, {
      actions(state: AnyAction[] = [], action: AnyAction) {
        return [...state, action]
      },
    })
    it("initially failed useQueries that provide an tag will refetch after a mutation invalidates it", async () => {
      const checkSessionData = { name: "matt" }
      server.use(
        rest.get("https://example.com/me", (req, res, ctx) => {
          return res.once(ctx.status(500))
        }),
        rest.get("https://example.com/me", (req, res, ctx) => {
          return res(ctx.json(checkSessionData))
        }),
        rest.post("https://example.com/login", (req, res, ctx) => {
          return res(ctx.status(200))
        })
      )
      let data, isLoading, isError
      function User() {
        ;({ data, isError, isLoading } = api.endpoints.checkSession.useQuery())
        const [login, { isLoading: loginLoading }] = api.endpoints.login.useMutation()
        return (
          <div>
            <div data-testid="isLoading">{String(isLoading)}</div>
            <div data-testid="isError">{String(isError)}</div>
            <div data-testid="user">{JSON.stringify(data)}</div>
            <div data-testid="loginLoading">{String(loginLoading)}</div>
            <button onClick={() => login(null)}>Login</button>
          </div>
        )
      }
      render(<User />, { wrapper: storeRef.wrapper })
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("isError").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("user").textContent).toBe(""))
      fireEvent.click(screen.getByRole("button", { name: /Login/i }))
      await waitFor(() => expect(screen.getByTestId("loginLoading").textContent).toBe("true"))
      await waitFor(() => expect(screen.getByTestId("loginLoading").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("isError").textContent).toBe("false"))
      await waitFor(() => expect(screen.getByTestId("user").textContent).toBe(JSON.stringify(checkSessionData)))
      const { checkSession, login } = api.endpoints
      expect(storeRef.store.getState().actions).toMatchSequence(
        api.internalActions.middlewareRegistered.match,
        checkSession.matchPending,
        checkSession.matchRejected,
        login.matchPending,
        login.matchFulfilled,
        checkSession.matchPending,
        checkSession.matchFulfilled
      )
    })
  })
})
describe("hooks with createApi defaults set", () => {
  const defaultApi = createApi({
    baseQuery: async (arg: any) => {
      await waitMs()
      if ("amount" in arg?.body) {
        amount += 1
      }
      return {
        data: arg?.body ? { ...arg.body, ...(amount ? { amount } : {}) } : undefined,
      }
    },
    endpoints: build => ({
      getIncrementedAmount: build.query<any, void>({
        query: () => ({
          url: "",
          body: {
            amount,
          },
        }),
      }),
    }),
    refetchOnMountOrArgChange: true,
  })
  const storeRef = setupApiStore(defaultApi)
  it("useQuery hook respects refetchOnMountOrArgChange: true when set in createApi options", async () => {
    let data, isLoading, isFetching
    function User() {
      ;({ data, isLoading } = defaultApi.endpoints.getIncrementedAmount.useQuery())
      return (
        <div>
          <div data-testid="isLoading">{String(isLoading)}</div>
          <div data-testid="amount">{String(data?.amount)}</div>
        </div>
      )
    }
    const { unmount } = render(<User />, { wrapper: storeRef.wrapper })
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
    await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
    unmount()
    function OtherUser() {
      ;({ data, isFetching } = defaultApi.endpoints.getIncrementedAmount.useQuery(undefined, {
        refetchOnMountOrArgChange: true,
      }))
      return (
        <div>
          <div data-testid="isFetching">{String(isFetching)}</div>
          <div data-testid="amount">{String(data?.amount)}</div>
        </div>
      )
    }
    render(<OtherUser />, { wrapper: storeRef.wrapper })
    await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("true"))
    await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
    await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("2"))
  })
  it("useQuery hook overrides default refetchOnMountOrArgChange: false that was set by createApi", async () => {
    let data, isLoading, isFetching
    function User() {
      ;({ data, isLoading } = defaultApi.endpoints.getIncrementedAmount.useQuery())
      return (
        <div>
          <div data-testid="isLoading">{String(isLoading)}</div>
          <div data-testid="amount">{String(data?.amount)}</div>
        </div>
      )
    }
    let { unmount } = render(<User />, { wrapper: storeRef.wrapper })
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("true"))
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"))
    await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
    unmount()
    function OtherUser() {
      ;({ data, isFetching } = defaultApi.endpoints.getIncrementedAmount.useQuery(undefined, {
        refetchOnMountOrArgChange: false,
      }))
      return (
        <div>
          <div data-testid="isFetching">{String(isFetching)}</div>
          <div data-testid="amount">{String(data?.amount)}</div>
        </div>
      )
    }
    render(<OtherUser />, { wrapper: storeRef.wrapper })
    await waitFor(() => expect(screen.getByTestId("isFetching").textContent).toBe("false"))
    await waitFor(() => expect(screen.getByTestId("amount").textContent).toBe("1"))
  })
  describe("selectFromResult (query) behaviors", () => {
    let startingId = 3
    const initialPosts = [
      { id: 1, name: "A sample post", fetched_at: new Date().toUTCString() },
      {
        id: 2,
        name: "A post about rtk-query",
        fetched_at: new Date().toUTCString(),
      },
    ]
    let posts = [] as typeof initialPosts
    beforeEach(() => {
      startingId = 3
      posts = [...initialPosts]
      const handlers = [
        rest.get("https://example.com/posts", (req, res, ctx) => {
          return res(ctx.json(posts))
        }),
        rest.put<Partial<Post>>("https://example.com/post/:id", (req, res, ctx) => {
          const id = Number(req.params.id)
          const idx = posts.findIndex(post => post.id === id)
          const newPosts = posts.map((post, index) =>
            index !== idx
              ? post
              : {
                  ...req.body,
                  id,
                  name: req.body.name || post.name,
                  fetched_at: new Date().toUTCString(),
                }
          )
          posts = [...newPosts]
          return res(ctx.json(posts))
        }),
        rest.post("https://example.com/post", (req, res, ctx) => {
          let post = req.body as Omit<Post, "id">
          startingId += 1
          posts.concat({
            ...post,
            fetched_at: new Date().toISOString(),
            id: startingId,
          })
          return res(ctx.json(posts))
        }),
      ]
      server.use(...handlers)
    })
    interface Post {
      id: number
      name: string
      fetched_at: string
    }
    type PostsResponse = Post[]
    const api = createApi({
      baseQuery: fetchBaseQuery({ baseUrl: "https://example.com/" }),
      tagTypes: ["Posts"],
      endpoints: build => ({
        getPosts: build.query<PostsResponse, void>({
          query: () => ({ url: "posts" }),
          providesTags: result => (result ? result.map(({ id }) => ({ type: "Posts", id })) : []),
        }),
        updatePost: build.mutation<Post, Partial<Post>>({
          query: ({ id, ...body }) => ({
            url: `post/${id}`,
            method: "PUT",
            body,
          }),
          invalidatesTags: (result, error, { id }) => [{ type: "Posts", id }],
        }),
        addPost: build.mutation<Post, Partial<Post>>({
          query: body => ({
            url: `post`,
            method: "POST",
            body,
          }),
          invalidatesTags: ["Posts"],
        }),
      }),
    })
    const storeRef = setupApiStore(api)
    expectExactType(api.useGetPostsQuery)(api.endpoints.getPosts.useQuery)
    expectExactType(api.useUpdatePostMutation)(api.endpoints.updatePost.useMutation)
    expectExactType(api.useAddPostMutation)(api.endpoints.addPost.useMutation)
    it("useQueryState serves a deeply memoized value and does not rerender unnecessarily", async () => {
      function Posts() {
        const { data: posts } = api.endpoints.getPosts.useQuery()
        const [addPost] = api.endpoints.addPost.useMutation()
        return (
          <div>
            <button data-testid="addPost" onClick={() => addPost({ name: `some text ${posts?.length}` })}>
              Add random post
            </button>
          </div>
        )
      }
      function SelectedPost() {
        const { post } = api.endpoints.getPosts.useQueryState(undefined, {
          selectFromResult: ({ data }) => ({
            post: data?.find(post => post.id === 1),
          }),
        })
        getRenderCount = useRenderCounter()
        return <div />
      }
      render(
        <div>
          <Posts />
          <SelectedPost />
        </div>,
        { wrapper: storeRef.wrapper }
      )
      expect(getRenderCount()).toBe(1)
      const addBtn = screen.getByTestId("addPost")
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
    })
    it("useQuery with selectFromResult with all flags destructured rerenders like the default useQuery behavior", async () => {
      function Posts() {
        const { data: posts } = api.endpoints.getPosts.useQuery()
        const [addPost] = api.endpoints.addPost.useMutation()
        getRenderCount = useRenderCounter()
        return (
          <div>
            <button
              data-testid="addPost"
              onClick={() =>
                addPost({
                  name: `some text ${posts?.length}`,
                  fetched_at: new Date().toISOString(),
                })
              }
            >
              Add random post
            </button>
          </div>
        )
      }
      function SelectedPost() {
        getRenderCount = useRenderCounter()
        const { post } = api.endpoints.getPosts.useQuery(undefined, {
          selectFromResult: ({ data, isUninitialized, isLoading, isFetching, isSuccess, isError }) => ({
            post: data?.find(post => post.id === 1),
            isUninitialized,
            isLoading,
            isFetching,
            isSuccess,
            isError,
          }),
        })
        return <div />
      }
      render(
        <div>
          <Posts />
          <SelectedPost />
        </div>,
        { wrapper: storeRef.wrapper }
      )
      expect(getRenderCount()).toBe(2)
      const addBtn = screen.getByTestId("addPost")
      await waitFor(() => expect(getRenderCount()).toBe(3))
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(5))
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(7))
    })
    it("useQuery with selectFromResult option serves a deeply memoized value and does not rerender unnecessarily", async () => {
      function Posts() {
        const { data: posts } = api.endpoints.getPosts.useQuery()
        const [addPost] = api.endpoints.addPost.useMutation()
        return (
          <div>
            <button
              data-testid="addPost"
              onClick={() =>
                addPost({
                  name: `some text ${posts?.length}`,
                  fetched_at: new Date().toISOString(),
                })
              }
            >
              Add random post
            </button>
          </div>
        )
      }
      function SelectedPost() {
        getRenderCount = useRenderCounter()
        const { post } = api.endpoints.getPosts.useQuery(undefined, {
          selectFromResult: ({ data }) => ({
            post: data?.find(post => post.id === 1),
          }),
        })
        return <div />
      }
      render(
        <div>
          <Posts />
          <SelectedPost />
        </div>,
        { wrapper: storeRef.wrapper }
      )
      expect(getRenderCount()).toBe(1)
      const addBtn = screen.getByTestId("addPost")
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
    })
    it("useQuery with selectFromResult option serves a deeply memoized value, then ONLY updates when the underlying data changes", async () => {
      let expectablePost: Post | undefined
      function Posts() {
        const { data: posts } = api.endpoints.getPosts.useQuery()
        const [addPost] = api.endpoints.addPost.useMutation()
        const [updatePost] = api.endpoints.updatePost.useMutation()
        return (
          <div>
            <button
              data-testid="addPost"
              onClick={() =>
                addPost({
                  name: `some text ${posts?.length}`,
                  fetched_at: new Date().toISOString(),
                })
              }
            >
              Add random post
            </button>
            <button data-testid="updatePost" onClick={() => updatePost({ id: 1, name: "supercoooll!" })}>
              Update post
            </button>
          </div>
        )
      }
      function SelectedPost() {
        const { post } = api.endpoints.getPosts.useQuery(undefined, {
          selectFromResult: ({ data }) => ({
            post: data?.find(post => post.id === 1),
          }),
        })
        getRenderCount = useRenderCounter()
        React.useEffect(() => {
          expectablePost = post
        }, [post])
        return (
          <div>
            <div data-testid="postName">{post?.name}</div>
          </div>
        )
      }
      render(
        <div>
          <Posts />
          <SelectedPost />
        </div>,
        { wrapper: storeRef.wrapper }
      )
      expect(getRenderCount()).toBe(1)
      const addBtn = screen.getByTestId("addPost")
      const updateBtn = screen.getByTestId("updatePost")
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(2))
      fireEvent.click(updateBtn)
      await waitFor(() => expect(getRenderCount()).toBe(3))
      expect(expectablePost?.name).toBe("supercoooll!")
      fireEvent.click(addBtn)
      await waitFor(() => expect(getRenderCount()).toBe(3))
    })
    it("useQuery with selectFromResult option has a type error if the result is not an object", async () => {
      function SelectedPost() {
        const _res1 = api.endpoints.getPosts.useQuery(undefined, {
          selectFromResult: ({ data }) => data?.length ?? 0,
        })
        const res2 = api.endpoints.getPosts.useQuery(undefined, {
          selectFromResult: ({ data }) => ({ size: data?.length ?? 0 }),
        })
        return (
          <div>
            <div data-testid="size2">{res2.size}</div>
          </div>
        )
      }
      render(
        <div>
          <SelectedPost />
        </div>,
        { wrapper: storeRef.wrapper }
      )
      expect(screen.getByTestId("size2").textContent).toBe("0")
    })
  })
  describe("selectFromResult (mutation) behavior", () => {
    const api = createApi({
      baseQuery: async (arg: any) => {
        await waitMs()
        if ("amount" in arg?.body) {
          amount += 1
        }
        return {
          data: arg?.body ? { ...arg.body, ...(amount ? { amount } : {}) } : undefined,
        }
      },
      endpoints: build => ({
        increment: build.mutation<{ amount: number }, number>({
          query: amount => ({
            url: "",
            method: "POST",
            body: {
              amount,
            },
          }),
        }),
      }),
    })
    const storeRef = setupApiStore(api, {
      ...actionsReducer,
    })
    it("causes no more than one rerender when using selectFromResult with an empty object", async () => {
      function Counter() {
        const [increment] = api.endpoints.increment.useMutation({
          selectFromResult: () => ({}),
        })
        getRenderCount = useRenderCounter()
        return (
          <div>
            <button data-testid="incrementButton" onClick={() => increment(1)}></button>
          </div>
        )
      }
      render(<Counter />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1)
      fireEvent.click(screen.getByTestId("incrementButton"))
      await waitMs(200) // give our baseQuery a chance to return
      expect(getRenderCount()).toBe(2)
      fireEvent.click(screen.getByTestId("incrementButton"))
      await waitMs(200)
      expect(getRenderCount()).toBe(3)
      const { increment } = api.endpoints
      expect(storeRef.store.getState().actions).toMatchSequence(
        api.internalActions.middlewareRegistered.match,
        increment.matchPending,
        increment.matchFulfilled,
        increment.matchPending,
        api.internalActions.removeMutationResult.match,
        increment.matchFulfilled
      )
    })
    it("causes rerenders when only selected data changes", async () => {
      function Counter() {
        const [increment, { data }] = api.endpoints.increment.useMutation({
          selectFromResult: ({ data }) => ({ data }),
        })
        getRenderCount = useRenderCounter()
        return (
          <div>
            <button data-testid="incrementButton" onClick={() => increment(1)}></button>
            <div data-testid="data">{JSON.stringify(data)}</div>
          </div>
        )
      }
      render(<Counter />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1)
      fireEvent.click(screen.getByTestId("incrementButton"))
      await waitFor(() => expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ amount: 1 })))
      expect(getRenderCount()).toBe(3)
      fireEvent.click(screen.getByTestId("incrementButton"))
      await waitFor(() => expect(screen.getByTestId("data").textContent).toBe(JSON.stringify({ amount: 2 })))
      expect(getRenderCount()).toBe(5)
    })
    it("causes the expected # of rerenders when NOT using selectFromResult", async () => {
      function Counter() {
        const [increment, data] = api.endpoints.increment.useMutation()
        getRenderCount = useRenderCounter()
        return (
          <div>
            <button data-testid="incrementButton" onClick={() => increment(1)}></button>
            <div data-testid="status">{String(data.status)}</div>
          </div>
        )
      }
      render(<Counter />, { wrapper: storeRef.wrapper })
      expect(getRenderCount()).toBe(1) // mount, uninitialized status in substate
      fireEvent.click(screen.getByTestId("incrementButton"))
      expect(getRenderCount()).toBe(2) // will be pending, isLoading: true,
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("pending"))
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("fulfilled"))
      expect(getRenderCount()).toBe(3)
      fireEvent.click(screen.getByTestId("incrementButton"))
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("pending"))
      await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("fulfilled"))
      expect(getRenderCount()).toBe(5)
    })
    it("useMutation with selectFromResult option has a type error if the result is not an object", async () => {
      function Counter() {
        const [increment] = api.endpoints.increment.useMutation({
          selectFromResult: () => 42,
        })
        return (
          <div>
            <button data-testid="incrementButton" onClick={() => increment(1)}></button>
          </div>
        )
      }
      render(<Counter />, { wrapper: storeRef.wrapper })
    })
  })
})
describe("skip behaviour", () => {
  const uninitialized = {
    status: QueryStatus.uninitialized,
    refetch: expect.any(Function),
    data: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: false,
    isUninitialized: true,
  }
  function subscriptionCount(key: string) {
    return Object.keys(storeRef.store.getState().api.subscriptions[key] || {}).length
  }
  it("normal skip", async () => {
    const { result, rerender } = renderHook(
      ([arg, options]: Parameters<typeof api.endpoints.getUser.useQuery>) =>
        api.endpoints.getUser.useQuery(arg, options),
      {
        wrapper: storeRef.wrapper,
        initialProps: [1, { skip: true }],
      }
    )
    expect(result.current).toEqual(uninitialized)
    expect(subscriptionCount("getUser(1)")).toBe(0)
    rerender([1])
    expect(result.current).toMatchObject({ status: QueryStatus.pending })
    expect(subscriptionCount("getUser(1)")).toBe(1)
    rerender([1, { skip: true }])
    expect(result.current).toEqual(uninitialized)
    expect(subscriptionCount("getUser(1)")).toBe(0)
  })
  it("skipToken", async () => {
    const { result, rerender } = renderHook(
      ([arg, options]: Parameters<typeof api.endpoints.getUser.useQuery>) =>
        api.endpoints.getUser.useQuery(arg, options),
      {
        wrapper: storeRef.wrapper,
        initialProps: [skipToken],
      }
    )
    expect(result.current).toEqual(uninitialized)
    expect(subscriptionCount("getUser(1)")).toBe(0)
    expect(storeRef.store.getState().api.subscriptions).toEqual({})
    rerender([1])
    expect(result.current).toMatchObject({ status: QueryStatus.pending })
    expect(subscriptionCount("getUser(1)")).toBe(1)
    expect(storeRef.store.getState().api.subscriptions).not.toEqual({})
    rerender([skipToken])
    expect(result.current).toEqual(uninitialized)
    expect(subscriptionCount("getUser(1)")).toBe(0)
  })
})
