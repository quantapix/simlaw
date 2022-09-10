/* eslint-disable @typescript-eslint/no-namespace */
import type { Action as ReduxAction } from "../../../../src/redux/types.js"

export namespace N1 {
  interface A<P> extends ReduxAction {
    payload: P
  }
  const action: A<string> = {
    type: "ACTION_TYPE",
    payload: "test",
  }
  const payload: string = action.payload
  payload
}
export namespace N2 {
  interface A extends ReduxAction {
    [key: string]: any
  }
  const action: A = {
    type: "ACTION_TYPE",
    text: "test",
  }
  const text: string = action["text"]
  text
}
export namespace N3 {
  type AT = "A" | "B" | "C"
  interface A extends ReduxAction {
    type: AT
  }
  const action: A = {
    type: "A",
  }
  const type: AT = action.type
  type
}
export namespace N4 {
  enum AT {
    A,
    B,
    C,
  }
  interface A extends ReduxAction {
    type: AT
  }
  const action: A = {
    type: AT.A,
  }
  const type: AT = action.type
  type
}
