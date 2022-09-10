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
