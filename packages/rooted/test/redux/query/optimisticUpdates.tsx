import { createApi } from "@reduxjs/toolkit/query/react"
import { actionsReducer, hookWaitFor, setupApiStore, waitMs } from "./helpers"
import { renderHook, act } from "@testing-library/react"
interface Post {
  id: string
  title: string
  contents: string
}
const baseQuery = jest.fn()
beforeEach(() => baseQuery.mockReset())
const api = createApi({
  baseQuery: (...args: any[]) => {
    const result = baseQuery(...args)
    if (typeof result === "object" && "then" in result)
      return result
        .then((data: any) => ({ data, meta: "meta" }))
        .catch((e: any) => ({ error: e }))
    return { data: result, meta: "meta" }
  },
  tagTypes: ["Post"],
  endpoints: build => ({
    post: build.query<Post, string>({
      query: id => `post/${id}`,
      providesTags: ["Post"],
    }),
    updatePost: build.mutation<void, Pick<Post, "id"> & Partial<Post>>({
      query: ({ id, ...patch }) => ({
        url: `post/${id}`,
        method: "PATCH",
        body: patch,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const { undo } = dispatch(
          api.util.updateQueryData("post", id, draft => {
            Object.assign(draft, patch)
          })
        )
        queryFulfilled.catch(undo)
      },
      invalidatesTags: result => (result ? ["Post"] : []),
    }),
  }),
})
const storeRef = setupApiStore(api, {
  ...actionsReducer,
})
describe("basic lifecycle", () => {
  let onStart = jest.fn(),
    onError = jest.fn(),
    onSuccess = jest.fn()
  const extendedApi = api.injectEndpoints({
    endpoints: build => ({
      test: build.mutation({
        query: x => x,
        async onQueryStarted(arg, api) {
          onStart(arg)
          try {
            const result = await api.queryFulfilled
            onSuccess(result)
          } catch (e) {
            onError(e)
          }
        },
      }),
    }),
    overrideExisting: true,
  })
  beforeEach(() => {
    onStart.mockReset()
    onError.mockReset()
    onSuccess.mockReset()
  })
  it("success", async () => {
    const { result } = renderHook(
      () => extendedApi.endpoints.test.useMutation(),
      {
        wrapper: storeRef.wrapper,
      }
    )
    baseQuery.mockResolvedValue("success")
    expect(onStart).not.toHaveBeenCalled()
    expect(baseQuery).not.toHaveBeenCalled()
    act(() => void result.current[0]("arg"))
    expect(onStart).toHaveBeenCalledWith("arg")
    expect(baseQuery).toHaveBeenCalledWith("arg", expect.any(Object), undefined)
    expect(onError).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    await act(() => waitMs(5))
    expect(onError).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledWith({ data: "success", meta: "meta" })
  })
  it("error", async () => {
    const { result } = renderHook(
      () => extendedApi.endpoints.test.useMutation(),
      {
        wrapper: storeRef.wrapper,
      }
    )
    baseQuery.mockRejectedValue("error")
    expect(onStart).not.toHaveBeenCalled()
    expect(baseQuery).not.toHaveBeenCalled()
    act(() => void result.current[0]("arg"))
    expect(onStart).toHaveBeenCalledWith("arg")
    expect(baseQuery).toHaveBeenCalledWith("arg", expect.any(Object), undefined)
    expect(onError).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    await act(() => waitMs(5))
    expect(onError).toHaveBeenCalledWith({
      error: "error",
      isUnhandledError: false,
      meta: undefined,
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
describe("updateQueryData", () => {
  it("updates cache values, can apply inverse patch", async () => {
    baseQuery
      .mockResolvedValueOnce({
        id: "3",
        title: "All about cheese.",
        contents: "TODO",
      })
      .mockResolvedValueOnce(42)
    const { result } = renderHook(() => api.endpoints.post.useQuery("3"), {
      wrapper: storeRef.wrapper,
    })
    await hookWaitFor(() => expect(result.current.isSuccess).toBeTruthy())
    const dataBefore = result.current.data
    expect(dataBefore).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "TODO",
    })
    let returnValue!: ReturnType<ReturnType<typeof api.util.updateQueryData>>
    act(() => {
      returnValue = storeRef.store.dispatch(
        api.util.updateQueryData("post", "3", draft => {
          draft.contents = "I love cheese!"
        })
      )
    })
    expect(result.current.data).not.toBe(dataBefore)
    expect(result.current.data).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "I love cheese!",
    })
    expect(returnValue).toEqual({
      inversePatches: [{ op: "replace", path: ["contents"], value: "TODO" }],
      patches: [{ op: "replace", path: ["contents"], value: "I love cheese!" }],
      undo: expect.any(Function),
    })
    act(() => {
      storeRef.store.dispatch(
        api.util.patchQueryData("post", "3", returnValue.inversePatches)
      )
    })
    expect(result.current.data).toEqual(dataBefore)
  })
  it("does not update non-existing values", async () => {
    baseQuery
      .mockImplementationOnce(async () => ({
        id: "3",
        title: "All about cheese.",
        contents: "TODO",
      }))
      .mockResolvedValueOnce(42)
    const { result } = renderHook(() => api.endpoints.post.useQuery("3"), {
      wrapper: storeRef.wrapper,
    })
    await hookWaitFor(() => expect(result.current.isSuccess).toBeTruthy())
    const dataBefore = result.current.data
    expect(dataBefore).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "TODO",
    })
    let returnValue!: ReturnType<ReturnType<typeof api.util.updateQueryData>>
    act(() => {
      returnValue = storeRef.store.dispatch(
        api.util.updateQueryData("post", "4", draft => {
          draft.contents = "I love cheese!"
        })
      )
    })
    expect(result.current.data).toBe(dataBefore)
    expect(returnValue).toEqual({
      inversePatches: [],
      patches: [],
      undo: expect.any(Function),
    })
  })
})
describe("full integration", () => {
  it("success case", async () => {
    baseQuery
      .mockResolvedValueOnce({
        id: "3",
        title: "All about cheese.",
        contents: "TODO",
      })
      .mockResolvedValueOnce({
        id: "3",
        title: "Meanwhile, this changed server-side.",
        contents: "Delicious cheese!",
      })
      .mockResolvedValueOnce({
        id: "3",
        title: "Meanwhile, this changed server-side.",
        contents: "Delicious cheese!",
      })
      .mockResolvedValueOnce(42)
    const { result } = renderHook(
      () => ({
        query: api.endpoints.post.useQuery("3"),
        mutation: api.endpoints.updatePost.useMutation(),
      }),
      {
        wrapper: storeRef.wrapper,
      }
    )
    await hookWaitFor(() => expect(result.current.query.isSuccess).toBeTruthy())
    expect(result.current.query.data).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "TODO",
    })
    act(() => {
      result.current.mutation[0]({ id: "3", contents: "Delicious cheese!" })
    })
    expect(result.current.query.data).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "Delicious cheese!",
    })
    await hookWaitFor(() =>
      expect(result.current.query.data).toEqual({
        id: "3",
        title: "Meanwhile, this changed server-side.",
        contents: "Delicious cheese!",
      })
    )
  })
  it("error case", async () => {
    baseQuery
      .mockResolvedValueOnce({
        id: "3",
        title: "All about cheese.",
        contents: "TODO",
      })
      .mockRejectedValueOnce("some error!")
      .mockResolvedValueOnce({
        id: "3",
        title: "Meanwhile, this changed server-side.",
        contents: "TODO",
      })
      .mockResolvedValueOnce(42)
    const { result } = renderHook(
      () => ({
        query: api.endpoints.post.useQuery("3"),
        mutation: api.endpoints.updatePost.useMutation(),
      }),
      {
        wrapper: storeRef.wrapper,
      }
    )
    await hookWaitFor(() => expect(result.current.query.isSuccess).toBeTruthy())
    expect(result.current.query.data).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "TODO",
    })
    act(() => {
      result.current.mutation[0]({ id: "3", contents: "Delicious cheese!" })
    })
    expect(result.current.query.data).toEqual({
      id: "3",
      title: "All about cheese.",
      contents: "Delicious cheese!",
    })
    await hookWaitFor(() =>
      expect(result.current.query.data).toEqual({
        id: "3",
        title: "All about cheese.",
        contents: "TODO",
      })
    )
    await expect(() =>
      hookWaitFor(
        () =>
          expect(result.current.query.data).toEqual({
            id: "3",
            title: "Meanwhile, this changed server-side.",
            contents: "TODO",
          }),
        50
      )
    ).rejects.toBeTruthy()
    act(() => void result.current.query.refetch())
    await hookWaitFor(
      () =>
        expect(result.current.query.data).toEqual({
          id: "3",
          title: "Meanwhile, this changed server-side.",
          contents: "TODO",
        }),
      50
    )
  })
})