import { expectExactType, expectUnknown } from "./helpers"
import { IsUnknown } from "@internal/tsHelpers"
import type { AnyAction } from "redux"
import type { SerializedError } from "../../src"
import {
  createAction,
  createAsyncThunk,
  isAllOf,
  isAnyOf,
  isAsyncThunkAction,
  isFulfilled,
  isPending,
  isRejected,
  isRejectedWithValue,
} from "../../src"
function isAnyOfActionTest(action: AnyAction) {
  const actionA = createAction("a", () => {
    return {
      payload: {
        prop1: 1,
        prop3: 2,
      },
    }
  })
  const actionB = createAction("b", () => {
    return {
      payload: {
        prop1: 1,
        prop2: 2,
      },
    }
  })
  if (isAnyOf(actionA, actionB)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
    }
  }
}
function isAnyOfThunkTest(action: AnyAction) {
  const asyncThunk1 = createAsyncThunk<{ prop1: number; prop3: number }>("asyncThunk1", async () => {
    return {
      prop1: 1,
      prop3: 3,
    }
  })
  const asyncThunk2 = createAsyncThunk<{ prop1: number; prop2: number }>("asyncThunk2", async () => {
    return {
      prop1: 1,
      prop2: 2,
    }
  })
  if (isAnyOf(asyncThunk1.fulfilled, asyncThunk2.fulfilled)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
    }
  }
}
function isAnyOfTypeGuardTest(action: AnyAction) {
  interface ActionA {
    type: "a"
    payload: {
      prop1: 1
      prop3: 2
    }
  }
  interface ActionB {
    type: "b"
    payload: {
      prop1: 1
      prop2: 2
    }
  }
  const guardA = (v: any): v is ActionA => {
    return v.type === "a"
  }
  const guardB = (v: any): v is ActionB => {
    return v.type === "b"
  }
  if (isAnyOf(guardA, guardB)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
    }
  }
}
interface SpecialAction {
  payload: {
    special: boolean
  }
}
const isSpecialAction = (v: any): v is SpecialAction => {
  return v.meta.isSpecial
}
function isAllOfActionTest(action: AnyAction) {
  const actionA = createAction("a", () => {
    return {
      payload: {
        prop1: 1,
        prop3: 2,
      },
    }
  })
  if (isAllOf(actionA, isSpecialAction)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
      special: action.payload.special,
    }
  }
}
function isAllOfThunkTest(action: AnyAction) {
  const asyncThunk1 = createAsyncThunk<{ prop1: number; prop3: number }>("asyncThunk1", async () => {
    return {
      prop1: 1,
      prop3: 3,
    }
  })
  if (isAllOf(asyncThunk1.fulfilled, isSpecialAction)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
      special: action.payload.special,
    }
  }
}
function isAllOfTypeGuardTest(action: AnyAction) {
  interface ActionA {
    type: "a"
    payload: {
      prop1: 1
      prop3: 2
    }
  }
  const guardA = (v: any): v is ActionA => {
    return v.type === "a"
  }
  if (isAllOf(guardA, isSpecialAction)(action)) {
    return {
      prop1: action.payload.prop1,
      prop2: action.payload.prop2,
      prop3: action.payload.prop3,
      special: action.payload.special,
    }
  }
}
function isPendingTest(action: AnyAction) {
  if (isPending(action)) {
    expectExactType<undefined>(action.payload)
    action.error
  }
  const thunk = createAsyncThunk<string>("a", () => "result")
  if (isPending(thunk)(action)) {
    expectExactType<undefined>(action.payload)
    action.error
  }
}
function isRejectedTest(action: AnyAction) {
  if (isRejected(action)) {
    expectUnknown(action.payload)
    expectExactType<SerializedError>(action.error)
  }
  const thunk = createAsyncThunk<string>("a", () => "result")
  if (isRejected(thunk)(action)) {
    expectUnknown(action.payload)
    expectExactType<SerializedError>(action.error)
  }
}
function isFulfilledTest(action: AnyAction) {
  if (isFulfilled(action)) {
    expectUnknown(action.payload)
    action.error
  }
  const thunk = createAsyncThunk<string>("a", () => "result")
  if (isFulfilled(thunk)(action)) {
    expectExactType("" as string)(action.payload)
    action.error
  }
}
function isAsyncThunkActionTest(action: AnyAction) {
  if (isAsyncThunkAction(action)) {
    expectUnknown(action.payload)
    action.error
  }
  const thunk = createAsyncThunk<string>("a", () => "result")
  if (isAsyncThunkAction(thunk)(action)) {
    expectUnknown(action.payload)
    action.error
  }
}
function isRejectedWithValueTest(action: AnyAction) {
  if (isRejectedWithValue(action)) {
    expectUnknown(action.payload)
    expectExactType<SerializedError>(action.error)
  }
  const thunk = createAsyncThunk<string, void, { rejectValue: { message: string } }>("a", () => "result")
  if (isRejectedWithValue(thunk)(action)) {
    expectExactType({ message: "" as string })(action.payload)
    expectExactType<SerializedError>(action.error)
  }
}
