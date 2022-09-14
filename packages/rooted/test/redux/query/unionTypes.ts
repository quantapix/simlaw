import type { SerializedError } from "@reduxjs/toolkit"
import type {
  FetchBaseQueryError,
  TypedUseQueryHookResult,
  TypedUseQueryStateResult,
  TypedUseQuerySubscriptionResult,
  TypedUseMutationResult,
} from "@reduxjs/toolkit/query/react"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { expectExactType, expectType } from "./helpers.js"

const baseQuery = fetchBaseQuery()
const api = createApi({
  baseQuery,
  endpoints: build => ({
    test: build.query<string, void>({ query: () => "" }),
    mutation: build.mutation<string, void>({ query: () => "" }),
  }),
})
describe.skip("TS only tests", () => {
  it("query selector union", () => {
    const result = api.endpoints.test.select()({} as any)
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isLoading) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("useQuery union", () => {
    const result = api.endpoints.test.useQuery()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isLoading) {
      expectExactType(undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isFetching)
    }
    if (result.isFetching) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isError)
    }
    expectExactType("" as string | undefined)(result.currentData)
    expectExactType("" as string)(result.currentData)
    if (result.isSuccess) {
      if (!result.isFetching) {
        expectExactType("" as string)(result.currentData)
      } else {
        expectExactType("" as string | undefined)(result.currentData)
        expectExactType("" as string)(result.currentData)
      }
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("useQuery TS4.1 union", () => {
    const result = api.useTestQuery()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isLoading) {
      expectExactType(undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isFetching)
    }
    if (result.isFetching) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("useLazyQuery union", () => {
    const [_trigger, result] = api.endpoints.test.useLazyQuery()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isLoading) {
      expectExactType(undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isFetching)
    }
    if (result.isFetching) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("useLazyQuery TS4.1 union", () => {
    const [_trigger, result] = api.useLazyTestQuery()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isLoading) {
      expectExactType(undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isFetching)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isFetching)
    }
    if (result.isFetching) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("queryHookResult (without selector) union", () => {
    const useQueryStateResult = api.endpoints.test.useQueryState()
    const useQueryResult = api.endpoints.test.useQuery()
    const useQueryStateWithSelectFromResult = api.endpoints.test.useQueryState(
      undefined,
      {
        selectFromResult: () => ({ x: true }),
      }
    )
    const { refetch: _omit, ...useQueryResultWithoutMethods } = useQueryResult
    expectExactType(useQueryStateResult)(useQueryResultWithoutMethods)
    expectExactType(useQueryStateWithSelectFromResult)(
      useQueryResultWithoutMethods
    )
  })
  it("useQueryState (with selectFromResult)", () => {
    const result = api.endpoints.test.useQueryState(undefined, {
      selectFromResult({
        data,
        isLoading,
        isFetching,
        isError,
        isSuccess,
        isUninitialized,
      }) {
        return {
          data: data ?? 1,
          isLoading,
          isFetching,
          isError,
          isSuccess,
          isUninitialized,
        }
      },
    })
    expectExactType({
      data: "" as string | number,
      isUninitialized: false,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isError: false,
    })(result)
  })
  it("useQuery (with selectFromResult)", () => {
    const result = api.endpoints.test.useQuery(undefined, {
      selectFromResult({
        data,
        isLoading,
        isFetching,
        isError,
        isSuccess,
        isUninitialized,
      }) {
        return {
          data: data ?? 1,
          isLoading,
          isFetching,
          isError,
          isSuccess,
          isUninitialized,
        }
      },
    })
    expectExactType({
      data: "" as string | number,
      isUninitialized: false,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isError: false,
      refetch: () => {},
    })(result)
  })
  it("useMutation union", () => {
    const [_trigger, result] = api.endpoints.mutation.useMutation()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isLoading) {
      expectExactType(undefined as undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  it("useMutation (with selectFromResult)", () => {
    const [_trigger, result] = api.endpoints.mutation.useMutation({
      selectFromResult({
        data,
        isLoading,
        isError,
        isSuccess,
        isUninitialized,
      }) {
        return {
          data: data ?? "hi",
          isLoading,
          isError,
          isSuccess,
          isUninitialized,
        }
      },
    })
    expectExactType({
      data: "" as string,
      isUninitialized: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
      reset: () => {},
    })(result)
  })
  it("useMutation TS4.1 union", () => {
    const [_trigger, result] = api.useMutationMutation()
    if (result.isUninitialized) {
      expectExactType(undefined)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isLoading) {
      expectExactType(undefined as undefined)(result.data)
      expectExactType(
        undefined as SerializedError | FetchBaseQueryError | undefined
      )(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isError)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isError) {
      expectExactType("" as string | undefined)(result.data)
      expectExactType({} as SerializedError | FetchBaseQueryError)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isSuccess)
    }
    if (result.isSuccess) {
      expectExactType("" as string)(result.data)
      expectExactType(undefined)(result.error)
      expectExactType(false)(result.isUninitialized)
      expectExactType(false)(result.isLoading)
      expectExactType(false)(result.isError)
    }
    expectType<never>(result)
    if (
      !result.isUninitialized &&
      !result.isLoading &&
      !result.isError &&
      !result.isSuccess
    ) {
      expectType<never>(result)
    }
  })
  test('"Typed" helper types', () => {
    {
      const result = api.endpoints.test.useQuery()
      expectType<TypedUseQueryHookResult<string, void, typeof baseQuery>>(
        result
      )
    }
    {
      const result = api.endpoints.test.useQuery(undefined, {
        selectFromResult: () => ({ x: true }),
      })
      expectType<
        TypedUseQueryHookResult<string, void, typeof baseQuery, { x: boolean }>
      >(result)
    }
    {
      const result = api.endpoints.test.useQueryState()
      expectType<TypedUseQueryStateResult<string, void, typeof baseQuery>>(
        result
      )
    }
    {
      const result = api.endpoints.test.useQueryState(undefined, {
        selectFromResult: () => ({ x: true }),
      })
      expectType<
        TypedUseQueryStateResult<string, void, typeof baseQuery, { x: boolean }>
      >(result)
    }
    {
      const result = api.endpoints.test.useQuerySubscription()
      expectType<
        TypedUseQuerySubscriptionResult<string, void, typeof baseQuery>
      >(result)
    }
    {
      const [trigger, result] = api.endpoints.mutation.useMutation()
      expectType<TypedUseMutationResult<string, void, typeof baseQuery>>(result)
    }
  })
})