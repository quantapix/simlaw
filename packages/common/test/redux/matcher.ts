import * as qx from "../../src/redux/index.js"

const thunk: qx.ThunkAction<any, any, any, qx.AnyAction> = () => {}
describe("isAnyOf", () => {
  it("returns true only if any matchers match (match function)", () => {
    const actionA = qx.createAction<string>("a")
    const actionB = qx.createAction<number>("b")
    const trueAction = {
      type: "a",
      payload: "payload",
    }
    expect(qx.isAnyOf(actionA, actionB)(trueAction)).toEqual(true)
    const falseAction = {
      type: "c",
      payload: "payload",
    }
    expect(qx.isAnyOf(actionA, actionB)(falseAction)).toEqual(false)
  })
  it("returns true only if any type guards match", () => {
    const actionA = qx.createAction<string>("a")
    const actionB = qx.createAction<number>("b")
    const isActionA = actionA.match
    const isActionB = actionB.match
    const trueAction = {
      type: "a",
      payload: "payload",
    }
    expect(qx.isAnyOf(isActionA, isActionB)(trueAction)).toEqual(true)
    const falseAction = {
      type: "c",
      payload: "payload",
    }
    expect(qx.isAnyOf(isActionA, isActionB)(falseAction)).toEqual(false)
  })
  it("returns true only if any matchers match (thunk action creators)", () => {
    const thunkA = qx.createAsyncThunk<string>("a", () => {
      return "noop"
    })
    const thunkB = qx.createAsyncThunk<number>("b", () => {
      return 0
    })
    const action = thunkA.fulfilled("fakeRequestId", "test")
    expect(qx.isAnyOf(thunkA.fulfilled, thunkB.fulfilled)(action)).toEqual(true)
    expect(qx.isAnyOf(thunkA.pending, thunkA.rejected, thunkB.fulfilled)(action)).toEqual(false)
  })
  it("works with reducers", () => {
    const actionA = qx.createAction<string>("a")
    const actionB = qx.createAction<number>("b")
    const trueAction = {
      type: "a",
      payload: "payload",
    }
    const initialState = { value: false }
    const reducer = qx.createReducer(initialState, builder => {
      builder.addMatcher(qx.isAnyOf(actionA, actionB), state => {
        return { ...state, value: true }
      })
    })
    expect(reducer(initialState, trueAction)).toEqual({ value: true })
    const falseAction = {
      type: "c",
      payload: "payload",
    }
    expect(reducer(initialState, falseAction)).toEqual(initialState)
  })
})
describe("isAllOf", () => {
  it("returns true only if all matchers match", () => {
    const actionA = qx.createAction<string>("a")
    interface SpecialAction {
      payload: "SPECIAL"
    }
    const isActionSpecial = (action: any): action is SpecialAction => {
      return action.payload === "SPECIAL"
    }
    const trueAction = {
      type: "a",
      payload: "SPECIAL",
    }
    expect(qx.isAllOf(actionA, isActionSpecial)(trueAction)).toEqual(true)
    const falseAction = {
      type: "a",
      payload: "ORDINARY",
    }
    expect(qx.isAllOf(actionA, isActionSpecial)(falseAction)).toEqual(false)
    const thunkA = qx.createAsyncThunk<string>("a", () => "result")
    const specialThunkAction = thunkA.fulfilled("SPECIAL", "fakeRequestId")
    expect(qx.isAllOf(thunkA.fulfilled, isActionSpecial)(specialThunkAction)).toBe(true)
    const ordinaryThunkAction = thunkA.fulfilled("ORDINARY", "fakeRequestId")
    expect(qx.isAllOf(thunkA.fulfilled, isActionSpecial)(ordinaryThunkAction)).toBe(false)
  })
})
describe("isPending", () => {
  it("should return false for a regular action", () => {
    const action = qx.createAction<string>("action/type")("testPayload")
    expect(qx.isPending()(action)).toBe(false)
    expect(qx.isPending(action)).toBe(false)
    expect(qx.isPending(thunk)).toBe(false)
  })
  it("should return true only for pending async thunk actions", () => {
    const thunk = qx.createAsyncThunk<string>("a", () => "result")
    const pendingAction = thunk.pending("fakeRequestId")
    expect(qx.isPending()(pendingAction)).toBe(true)
    expect(qx.isPending(pendingAction)).toBe(true)
    const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
    expect(qx.isPending()(rejectedAction)).toBe(false)
    const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
    expect(qx.isPending()(fulfilledAction)).toBe(false)
  })
  it("should return true only for thunks provided as arguments", () => {
    const thunkA = qx.createAsyncThunk<string>("a", () => "result")
    const thunkB = qx.createAsyncThunk<string>("b", () => "result")
    const thunkC = qx.createAsyncThunk<string>("c", () => "result")
    const matchAC = qx.isPending(thunkA, thunkC)
    const matchB = qx.isPending(thunkB)
    function testPendingAction(thunk: typeof thunkA | typeof thunkB | typeof thunkC, expected: boolean) {
      const pendingAction = thunk.pending("fakeRequestId")
      expect(matchAC(pendingAction)).toBe(expected)
      expect(matchB(pendingAction)).toBe(!expected)
      const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
      expect(matchAC(rejectedAction)).toBe(false)
      const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
      expect(matchAC(fulfilledAction)).toBe(false)
    }
    testPendingAction(thunkA, true)
    testPendingAction(thunkC, true)
    testPendingAction(thunkB, false)
  })
})
describe("isRejected", () => {
  it("should return false for a regular action", () => {
    const action = qx.createAction<string>("action/type")("testPayload")
    expect(qx.isRejected()(action)).toBe(false)
    expect(qx.isRejected(action)).toBe(false)
    expect(qx.isRejected(thunk)).toBe(false)
  })
  it("should return true only for rejected async thunk actions", () => {
    const thunk = qx.createAsyncThunk<string>("a", () => "result")
    const pendingAction = thunk.pending("fakeRequestId")
    expect(qx.isRejected()(pendingAction)).toBe(false)
    const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
    expect(qx.isRejected()(rejectedAction)).toBe(true)
    expect(qx.isRejected(rejectedAction)).toBe(true)
    const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
    expect(qx.isRejected()(fulfilledAction)).toBe(false)
  })
  it("should return true only for thunks provided as arguments", () => {
    const thunkA = qx.createAsyncThunk<string>("a", () => "result")
    const thunkB = qx.createAsyncThunk<string>("b", () => "result")
    const thunkC = qx.createAsyncThunk<string>("c", () => "result")
    const matchAC = qx.isRejected(thunkA, thunkC)
    const matchB = qx.isRejected(thunkB)
    function testRejectedAction(thunk: typeof thunkA | typeof thunkB | typeof thunkC, expected: boolean) {
      const pendingAction = thunk.pending("fakeRequestId")
      expect(matchAC(pendingAction)).toBe(false)
      const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
      expect(matchAC(rejectedAction)).toBe(expected)
      expect(matchB(rejectedAction)).toBe(!expected)
      const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
      expect(matchAC(fulfilledAction)).toBe(false)
    }
    testRejectedAction(thunkA, true)
    testRejectedAction(thunkC, true)
    testRejectedAction(thunkB, false)
  })
})
describe("isRejectedWithValue", () => {
  it("should return false for a regular action", () => {
    const action = qx.createAction<string>("action/type")("testPayload")
    expect(qx.isRejectedWithValue()(action)).toBe(false)
    expect(qx.isRejectedWithValue(action)).toBe(false)
    expect(qx.isRejectedWithValue(thunk)).toBe(false)
  })
  it("should return true only for rejected-with-value async thunk actions", async () => {
    const thunk = qx.createAsyncThunk<string>("a", (_, { rejectWithValue }) => {
      return rejectWithValue("rejectWithValue!")
    })
    const pendingAction = thunk.pending("fakeRequestId")
    expect(qx.isRejectedWithValue()(pendingAction)).toBe(false)
    const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
    expect(qx.isRejectedWithValue()(rejectedAction)).toBe(false)
    const getState = jest.fn(() => ({}))
    const dispatch = jest.fn((x: any) => x)
    const extra = {}
    const rejectedWithValueAction = await thunk()(dispatch, getState, extra)
    expect(qx.isRejectedWithValue()(rejectedWithValueAction)).toBe(true)
    const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
    expect(qx.isRejectedWithValue()(fulfilledAction)).toBe(false)
  })
  it("should return true only for thunks provided as arguments", async () => {
    const payloadCreator = (_: any, { rejectWithValue }: any) => {
      return rejectWithValue("rejectWithValue!")
    }
    const thunkA = qx.createAsyncThunk<string>("a", payloadCreator)
    const thunkB = qx.createAsyncThunk<string>("b", payloadCreator)
    const thunkC = qx.createAsyncThunk<string>("c", payloadCreator)
    const matchAC = qx.isRejectedWithValue(thunkA, thunkC)
    const matchB = qx.isRejectedWithValue(thunkB)
    async function testRejectedAction(thunk: typeof thunkA | typeof thunkB | typeof thunkC, expected: boolean) {
      const pendingAction = thunk.pending("fakeRequestId")
      expect(matchAC(pendingAction)).toBe(false)
      const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
      expect(matchAC(rejectedAction)).toBe(false)
      const getState = jest.fn(() => ({}))
      const dispatch = jest.fn((x: any) => x)
      const extra = {}
      const rejectedWithValueAction = await thunk()(dispatch, getState, extra)
      expect(matchAC(rejectedWithValueAction)).toBe(expected)
      expect(matchB(rejectedWithValueAction)).toBe(!expected)
      const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
      expect(matchAC(fulfilledAction)).toBe(false)
    }
    await testRejectedAction(thunkA, true)
    await testRejectedAction(thunkC, true)
    await testRejectedAction(thunkB, false)
  })
})
describe("isFulfilled", () => {
  it("should return false for a regular action", () => {
    const action = qx.createAction<string>("action/type")("testPayload")
    expect(qx.isFulfilled()(action)).toBe(false)
    expect(qx.isFulfilled(action)).toBe(false)
    expect(qx.isFulfilled(thunk)).toBe(false)
  })
  it("should return true only for fulfilled async thunk actions", () => {
    const thunk = qx.createAsyncThunk<string>("a", () => "result")
    const pendingAction = thunk.pending("fakeRequestId")
    expect(qx.isFulfilled()(pendingAction)).toBe(false)
    const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
    expect(qx.isFulfilled()(rejectedAction)).toBe(false)
    const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
    expect(qx.isFulfilled()(fulfilledAction)).toBe(true)
    expect(qx.isFulfilled(fulfilledAction)).toBe(true)
  })
  it("should return true only for thunks provided as arguments", () => {
    const thunkA = qx.createAsyncThunk<string>("a", () => "result")
    const thunkB = qx.createAsyncThunk<string>("b", () => "result")
    const thunkC = qx.createAsyncThunk<string>("c", () => "result")
    const matchAC = qx.isFulfilled(thunkA, thunkC)
    const matchB = qx.isFulfilled(thunkB)
    function testFulfilledAction(thunk: typeof thunkA | typeof thunkB | typeof thunkC, expected: boolean) {
      const pendingAction = thunk.pending("fakeRequestId")
      expect(matchAC(pendingAction)).toBe(false)
      const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
      expect(matchAC(rejectedAction)).toBe(false)
      const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
      expect(matchAC(fulfilledAction)).toBe(expected)
      expect(matchB(fulfilledAction)).toBe(!expected)
    }
    testFulfilledAction(thunkA, true)
    testFulfilledAction(thunkC, true)
    testFulfilledAction(thunkB, false)
  })
})
describe("isAsyncThunkAction", () => {
  it("should return false for a regular action", () => {
    const action = qx.createAction<string>("action/type")("testPayload")
    expect(qx.isAsyncThunkAction()(action)).toBe(false)
    expect(qx.isAsyncThunkAction(action)).toBe(false)
    expect(qx.isAsyncThunkAction(thunk)).toBe(false)
  })
  it("should return true for any async thunk action if no arguments were provided", () => {
    const thunk = qx.createAsyncThunk<string>("a", () => "result")
    const matcher = qx.isAsyncThunkAction()
    const pendingAction = thunk.pending("fakeRequestId")
    expect(matcher(pendingAction)).toBe(true)
    const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
    expect(matcher(rejectedAction)).toBe(true)
    const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
    expect(matcher(fulfilledAction)).toBe(true)
  })
  it("should return true only for thunks provided as arguments", () => {
    const thunkA = qx.createAsyncThunk<string>("a", () => "result")
    const thunkB = qx.createAsyncThunk<string>("b", () => "result")
    const thunkC = qx.createAsyncThunk<string>("c", () => "result")
    const matchAC = qx.isAsyncThunkAction(thunkA, thunkC)
    const matchB = qx.isAsyncThunkAction(thunkB)
    function testAllActions(thunk: typeof thunkA | typeof thunkB | typeof thunkC, expected: boolean) {
      const pendingAction = thunk.pending("fakeRequestId")
      expect(matchAC(pendingAction)).toBe(expected)
      expect(matchB(pendingAction)).toBe(!expected)
      const rejectedAction = thunk.rejected(new Error("rejected"), "fakeRequestId")
      expect(matchAC(rejectedAction)).toBe(expected)
      expect(matchB(rejectedAction)).toBe(!expected)
      const fulfilledAction = thunk.fulfilled("result", "fakeRequestId")
      expect(matchAC(fulfilledAction)).toBe(expected)
      expect(matchB(fulfilledAction)).toBe(!expected)
    }
    testAllActions(thunkA, true)
    testAllActions(thunkC, true)
    testAllActions(thunkB, false)
  })
})
