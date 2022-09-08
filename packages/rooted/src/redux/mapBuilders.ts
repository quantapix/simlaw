import type { Action, AnyAction } from "redux"
import type {
  CaseReducer,
  CaseReducers,
  ActionMatcherDescriptionCollection,
} from "./create.js"
import type { TypeGuard } from "./types.js"

export interface TypedActionCreator<Type extends string> {
  (...args: any[]): Action<Type>
  type: Type
}

export interface ActionReducerMapBuilder<State> {
  addCase<ActionCreator extends TypedActionCreator<string>>(
    actionCreator: ActionCreator,
    reducer: CaseReducer<State, ReturnType<ActionCreator>>
  ): ActionReducerMapBuilder<State>
  addCase<Type extends string, A extends Action<Type>>(
    type: Type,
    reducer: CaseReducer<State, A>
  ): ActionReducerMapBuilder<State>

  addMatcher<A>(
    matcher: TypeGuard<A> | ((action: any) => boolean),
    reducer: CaseReducer<State, A extends AnyAction ? A : A & AnyAction>
  ): Omit<ActionReducerMapBuilder<State>, "addCase">

  addDefaultCase(reducer: CaseReducer<State, AnyAction>): {}
}

export function executeReducerBuilderCallback<S>(
  builderCallback: (builder: ActionReducerMapBuilder<S>) => void
): [
  CaseReducers<S, any>,
  ActionMatcherDescriptionCollection<S>,
  CaseReducer<S, AnyAction> | undefined
] {
  const actionsMap: CaseReducers<S, any> = {}
  const actionMatchers: ActionMatcherDescriptionCollection<S> = []
  let defaultCaseReducer: CaseReducer<S, AnyAction> | undefined
  const builder = {
    addCase(
      typeOrActionCreator: string | TypedActionCreator<any>,
      reducer: CaseReducer<S>
    ) {
      if (process.env.NODE_ENV !== "production") {
        if (actionMatchers.length > 0) {
          throw new Error(
            "`builder.addCase` should only be called before calling `builder.addMatcher`"
          )
        }
        if (defaultCaseReducer) {
          throw new Error(
            "`builder.addCase` should only be called before calling `builder.addDefaultCase`"
          )
        }
      }
      const type =
        typeof typeOrActionCreator === "string"
          ? typeOrActionCreator
          : typeOrActionCreator.type
      if (type in actionsMap) {
        throw new Error(
          "addCase cannot be called with two reducers for the same action type"
        )
      }
      actionsMap[type] = reducer
      return builder
    },
    addMatcher<A>(
      matcher: TypeGuard<A>,
      reducer: CaseReducer<S, A extends AnyAction ? A : A & AnyAction>
    ) {
      if (process.env.NODE_ENV !== "production") {
        if (defaultCaseReducer) {
          throw new Error(
            "`builder.addMatcher` should only be called before calling `builder.addDefaultCase`"
          )
        }
      }
      actionMatchers.push({ matcher, reducer })
      return builder
    },
    addDefaultCase(reducer: CaseReducer<S, AnyAction>) {
      if (process.env.NODE_ENV !== "production") {
        if (defaultCaseReducer) {
          throw new Error("`builder.addDefaultCase` can only be called once")
        }
      }
      defaultCaseReducer = reducer
      return builder
    },
  }
  builderCallback(builder)
  return [actionsMap, actionMatchers, defaultCaseReducer]
}
