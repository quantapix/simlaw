import type {
  ActionFromMatcher,
  Matcher,
  UnionToIntersection,
} from "./tsHelpers"
import { hasMatchFunction } from "./tsHelpers"
import type {
  AsyncThunk,
  AsyncThunkFulfilledActionCreator,
  AsyncThunkPendingActionCreator,
  AsyncThunkRejectedActionCreator,
} from "./createAsyncThunk"

export type ActionMatchingAnyOf<
  Matchers extends [Matcher<any>, ...Matcher<any>[]]
> = ActionFromMatcher<Matchers[number]>

export type ActionMatchingAllOf<
  Matchers extends [Matcher<any>, ...Matcher<any>[]]
> = UnionToIntersection<ActionMatchingAnyOf<Matchers>>

const matches = (matcher: Matcher<any>, action: any) => {
  if (hasMatchFunction(matcher)) {
    return matcher.match(action)
  } else {
    return matcher(action)
  }
}

export function isAnyOf<Matchers extends [Matcher<any>, ...Matcher<any>[]]>(
  ...matchers: Matchers
) {
  return (action: any): action is ActionMatchingAnyOf<Matchers> => {
    return matchers.some(matcher => matches(matcher, action))
  }
}

export function isAllOf<Matchers extends [Matcher<any>, ...Matcher<any>[]]>(
  ...matchers: Matchers
) {
  return (action: any): action is ActionMatchingAllOf<Matchers> => {
    return matchers.every(matcher => matches(matcher, action))
  }
}

export function hasExpectedRequestMetadata(
  action: any,
  validStatus: readonly string[]
) {
  if (!action || !action.meta) return false

  const hasValidRequestId = typeof action.meta.requestId === "string"
  const hasValidRequestStatus =
    validStatus.indexOf(action.meta.requestStatus) > -1

  return hasValidRequestId && hasValidRequestStatus
}

function isAsyncThunkArray(a: [any] | AnyAsyncThunk[]): a is AnyAsyncThunk[] {
  return (
    typeof a[0] === "function" &&
    "pending" in a[0] &&
    "fulfilled" in a[0] &&
    "rejected" in a[0]
  )
}

export type UnknownAsyncThunkPendingAction = ReturnType<
  AsyncThunkPendingActionCreator<unknown>
>

export type PendingActionFromAsyncThunk<T extends AnyAsyncThunk> =
  ActionFromMatcher<T["pending"]>

export function isPending(): (
  action: any
) => action is UnknownAsyncThunkPendingAction

export function isPending<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(
  ...asyncThunks: AsyncThunks
): (action: any) => action is PendingActionFromAsyncThunk<AsyncThunks[number]>

export function isPending(action: any): action is UnknownAsyncThunkPendingAction
export function isPending<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(...asyncThunks: AsyncThunks | [any]) {
  if (asyncThunks.length === 0) {
    return (action: any) => hasExpectedRequestMetadata(action, ["pending"])
  }

  if (!isAsyncThunkArray(asyncThunks)) {
    return isPending()(asyncThunks[0])
  }

  return (
    action: any
  ): action is PendingActionFromAsyncThunk<AsyncThunks[number]> => {
    // note: this type will be correct because we have at least 1 asyncThunk
    const matchers: [Matcher<any>, ...Matcher<any>[]] = asyncThunks.map(
      asyncThunk => asyncThunk.pending
    ) as any

    const combinedMatcher = isAnyOf(...matchers)

    return combinedMatcher(action)
  }
}

export type UnknownAsyncThunkRejectedAction = ReturnType<
  AsyncThunkRejectedActionCreator<unknown, unknown>
>

export type RejectedActionFromAsyncThunk<T extends AnyAsyncThunk> =
  ActionFromMatcher<T["rejected"]>

export function isRejected(): (
  action: any
) => action is UnknownAsyncThunkRejectedAction

export function isRejected<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(
  ...asyncThunks: AsyncThunks
): (action: any) => action is RejectedActionFromAsyncThunk<AsyncThunks[number]>

export function isRejected(
  action: any
): action is UnknownAsyncThunkRejectedAction
export function isRejected<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(...asyncThunks: AsyncThunks | [any]) {
  if (asyncThunks.length === 0) {
    return (action: any) => hasExpectedRequestMetadata(action, ["rejected"])
  }

  if (!isAsyncThunkArray(asyncThunks)) {
    return isRejected()(asyncThunks[0])
  }

  return (
    action: any
  ): action is RejectedActionFromAsyncThunk<AsyncThunks[number]> => {
    // note: this type will be correct because we have at least 1 asyncThunk
    const matchers: [Matcher<any>, ...Matcher<any>[]] = asyncThunks.map(
      asyncThunk => asyncThunk.rejected
    ) as any

    const combinedMatcher = isAnyOf(...matchers)

    return combinedMatcher(action)
  }
}

export type UnknownAsyncThunkRejectedWithValueAction = ReturnType<
  AsyncThunkRejectedActionCreator<unknown, unknown>
>

export type RejectedWithValueActionFromAsyncThunk<T extends AnyAsyncThunk> =
  ActionFromMatcher<T["rejected"]> &
    (T extends AsyncThunk<any, any, { rejectValue: infer RejectedValue }>
      ? { payload: RejectedValue }
      : unknown)

export function isRejectedWithValue(): (
  action: any
) => action is UnknownAsyncThunkRejectedAction

export function isRejectedWithValue<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(
  ...asyncThunks: AsyncThunks
): (
  action: any
) => action is RejectedWithValueActionFromAsyncThunk<AsyncThunks[number]>

export function isRejectedWithValue(
  action: any
): action is UnknownAsyncThunkRejectedAction
export function isRejectedWithValue<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(...asyncThunks: AsyncThunks | [any]) {
  const hasFlag = (action: any): action is any => {
    return action && action.meta && action.meta.rejectedWithValue
  }

  if (asyncThunks.length === 0) {
    return (action: any) => {
      const combinedMatcher = isAllOf(isRejected(...asyncThunks), hasFlag)

      return combinedMatcher(action)
    }
  }

  if (!isAsyncThunkArray(asyncThunks)) {
    return isRejectedWithValue()(asyncThunks[0])
  }

  return (
    action: any
  ): action is RejectedActionFromAsyncThunk<AsyncThunks[number]> => {
    const combinedMatcher = isAllOf(isRejected(...asyncThunks), hasFlag)

    return combinedMatcher(action)
  }
}

export type UnknownAsyncThunkFulfilledAction = ReturnType<
  AsyncThunkFulfilledActionCreator<unknown, unknown>
>

export type FulfilledActionFromAsyncThunk<T extends AnyAsyncThunk> =
  ActionFromMatcher<T["fulfilled"]>

export function isFulfilled(): (
  action: any
) => action is UnknownAsyncThunkFulfilledAction

export function isFulfilled<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(
  ...asyncThunks: AsyncThunks
): (action: any) => action is FulfilledActionFromAsyncThunk<AsyncThunks[number]>

export function isFulfilled(
  action: any
): action is UnknownAsyncThunkFulfilledAction
export function isFulfilled<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(...asyncThunks: AsyncThunks | [any]) {
  if (asyncThunks.length === 0) {
    return (action: any) => hasExpectedRequestMetadata(action, ["fulfilled"])
  }

  if (!isAsyncThunkArray(asyncThunks)) {
    return isFulfilled()(asyncThunks[0])
  }

  return (
    action: any
  ): action is FulfilledActionFromAsyncThunk<AsyncThunks[number]> => {
    // note: this type will be correct because we have at least 1 asyncThunk
    const matchers: [Matcher<any>, ...Matcher<any>[]] = asyncThunks.map(
      asyncThunk => asyncThunk.fulfilled
    ) as any

    const combinedMatcher = isAnyOf(...matchers)

    return combinedMatcher(action)
  }
}

export type UnknownAsyncThunkAction =
  | UnknownAsyncThunkPendingAction
  | UnknownAsyncThunkRejectedAction
  | UnknownAsyncThunkFulfilledAction

export type AnyAsyncThunk = {
  pending: { match: (action: any) => action is any }
  fulfilled: { match: (action: any) => action is any }
  rejected: { match: (action: any) => action is any }
}

export type ActionsFromAsyncThunk<T extends AnyAsyncThunk> =
  | ActionFromMatcher<T["pending"]>
  | ActionFromMatcher<T["fulfilled"]>
  | ActionFromMatcher<T["rejected"]>

export function isAsyncThunkAction(): (
  action: any
) => action is UnknownAsyncThunkAction

export function isAsyncThunkAction<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(
  ...asyncThunks: AsyncThunks
): (action: any) => action is ActionsFromAsyncThunk<AsyncThunks[number]>

export function isAsyncThunkAction(
  action: any
): action is UnknownAsyncThunkAction
export function isAsyncThunkAction<
  AsyncThunks extends [AnyAsyncThunk, ...AnyAsyncThunk[]]
>(...asyncThunks: AsyncThunks | [any]) {
  if (asyncThunks.length === 0) {
    return (action: any) =>
      hasExpectedRequestMetadata(action, ["pending", "fulfilled", "rejected"])
  }

  if (!isAsyncThunkArray(asyncThunks)) {
    return isAsyncThunkAction()(asyncThunks[0])
  }

  return (
    action: any
  ): action is ActionsFromAsyncThunk<AsyncThunks[number]> => {
    // note: this type will be correct because we have at least 1 asyncThunk
    const matchers: [Matcher<any>, ...Matcher<any>[]] = [] as any

    for (const asyncThunk of asyncThunks) {
      matchers.push(
        asyncThunk.pending,
        asyncThunk.rejected,
        asyncThunk.fulfilled
      )
    }

    const combinedMatcher = isAnyOf(...matchers)

    return combinedMatcher(action)
  }
}
