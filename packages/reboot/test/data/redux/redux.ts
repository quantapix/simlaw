import { assert, _ } from "../../../src/data/spec.js"
import * as qi from "../../../src/data/immer/index.js"
import * as redux from "redux"

{
  interface State {
    counter: number
  }
  interface Action {
    type: string
    payload: number
  }
  const initialState: State = {
    counter: 0,
  }
  const reduceCounterProducer = (state: State = initialState, action: Action) =>
    qi.produce(state, draftState => {
      switch (action.type) {
        case "ADD_TO_COUNTER":
          draftState.counter += action.payload
          break
        case "SUB_FROM_COUNTER":
          draftState.counter -= action.payload
          break
      }
    })
  const reduceCounterCurriedProducer = qi.produce(
    (draftState: State, action: Action) => {
      switch (action.type) {
        case "ADD_TO_COUNTER":
          draftState.counter += action.payload
          break
        case "SUB_FROM_COUNTER":
          draftState.counter -= action.payload
          break
      }
    },
    initialState
  )
  const reduce = redux.combineReducers({
    counterReducer: reduceCounterProducer,
  })
  const curredReduce = redux.combineReducers({
    counterReducer: reduceCounterCurriedProducer,
  })
  const store = redux.createStore(reduce)
  const curriedStore = redux.createStore(curredReduce)
  it("#470 works with Redux combine reducers", () => {
    assert(
      store.getState().counterReducer,
      _ as {
        counter: number
      }
    )
    assert(
      curriedStore.getState().counterReducer,
      _ as {
        counter: number
      }
    )
  })
}
{
  {
    interface State {
      readonly counter: number
    }
    interface Action {
      readonly type: string
      readonly payload: number
    }
    const initialState: State = {
      counter: 0,
    }
    const reduceCounterProducer = (
      state: State = initialState,
      action: Action
    ) =>
      qi.produce(state, draftState => {
        switch (action.type) {
          case "ADD_TO_COUNTER":
            draftState.counter += action.payload
            break
          case "SUB_FROM_COUNTER":
            draftState.counter -= action.payload
            break
        }
      })
    const reduceCounterCurriedProducer = qi.produce(
      (draftState: qi.Draft<State>, action: Action) => {
        switch (action.type) {
          case "ADD_TO_COUNTER":
            draftState.counter += action.payload
            break
          case "SUB_FROM_COUNTER":
            draftState.counter -= action.payload
            break
        }
      },
      initialState
    )
    const reduce = redux.combineReducers({
      counterReducer: reduceCounterProducer,
    })
    const curredReduce = redux.combineReducers({
      counterReducer: reduceCounterCurriedProducer,
    })
    const store = redux.createStore(reduce)
    const curriedStore = redux.createStore(curredReduce)
    it("#470 works with Redux combine readonly reducers", () => {
      assert(
        store.getState().counterReducer,
        _ as {
          readonly counter: number
        }
      )
      assert(
        curriedStore.getState().counterReducer,
        _ as {
          readonly counter: number
        }
      )
    })
  }
}
it("works with inferred curried reducer", () => {
  type State = {
    count: number
  }
  type Action = {
    type: "inc"
    count: number
  }
  const defaultState = {
    count: 3,
  }
  const store = redux.createStore(
    qi.produce((state: State, action: Action) => {
      if (action.type === "inc") state.count += action.count
      state.count2
    }, defaultState)
  )
  assert(store.getState(), _ as State)
  store.dispatch({
    type: "inc",
    count: 2,
  })
  store.dispatch({
    type: "inc2",
    count: 2,
  })
})
it("works with inferred curried reducer - readonly", () => {
  type State = {
    readonly count: number
  }
  type Action = {
    readonly type: "inc"
    readonly count: number
  }
  const defaultState: State = {
    count: 3,
  }
  const store = redux.createStore(
    qi.produce((state: qi.Draft<State>, action: Action) => {
      if (action.type === "inc") state.count += action.count
      state.count2
    }, defaultState)
  )
  assert(store.getState(), _ as State)
  store.dispatch({
    type: "inc",
    count: 2,
  })
  store.dispatch({
    type: "inc2",
    count: 2,
  })
})
