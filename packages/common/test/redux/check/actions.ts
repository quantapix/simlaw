import type * as qx from "../../../src/redux/types.js"

export namespace N1 {
  interface A<P> extends qx.Action {
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
  interface A extends qx.Action {
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
  interface A extends qx.Action {
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
  interface A extends qx.Action {
    type: AT
  }
  const action: A = {
    type: AT.A,
  }
  const type: AT = action.type
  type
}
