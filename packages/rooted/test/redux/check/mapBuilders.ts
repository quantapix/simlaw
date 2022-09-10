import type { SerializedError } from "@internal/createAsyncThunk"
import { createAsyncThunk } from "@internal/createAsyncThunk"
import { executeReducerBuilderCallback } from "@internal/mapBuilders"
import type { AnyAction } from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import { expectExactType, expectType } from "./helpers"
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
