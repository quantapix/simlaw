import { isFunction } from "./util/isFunction"
import { UnsubscriptionError } from "./util/UnsubscriptionError"
import { SubscriptionLike, TeardownLogic, Unsubscribable } from "./types"
import { arrRemove } from "./util/arrRemove"

export class Subscription implements SubscriptionLike {
  public static EMPTY = (() => {
    const empty = new Subscription()
    empty.closed = true
    return empty
  })()
  public closed = false
  private _parentage: Subscription[] | Subscription | null = null
  private _finalizers: Exclude<TeardownLogic, void>[] | null = null
  constructor(private initialTeardown?: () => void) {}
  unsubscribe(): void {
    let errors: any[] | undefined
    if (!this.closed) {
      this.closed = true

      const { _parentage } = this
      if (_parentage) {
        this._parentage = null
        if (Array.isArray(_parentage)) {
          for (const parent of _parentage) {
            parent.remove(this)
          }
        } else {
          _parentage.remove(this)
        }
      }
      const { initialTeardown: initialFinalizer } = this
      if (isFunction(initialFinalizer)) {
        try {
          initialFinalizer()
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e]
        }
      }
      const { _finalizers } = this
      if (_finalizers) {
        this._finalizers = null
        for (const finalizer of _finalizers) {
          try {
            execFinalizer(finalizer)
          } catch (err) {
            errors = errors ?? []
            if (err instanceof UnsubscriptionError) {
              errors = [...errors, ...err.errors]
            } else {
              errors.push(err)
            }
          }
        }
      }
      if (errors) {
        throw new UnsubscriptionError(errors)
      }
    }
  }
  add(teardown: TeardownLogic): void {
    if (teardown && teardown !== this) {
      if (this.closed) {
        execFinalizer(teardown)
      } else {
        if (teardown instanceof Subscription) {
          if (teardown.closed || teardown._hasParent(this)) {
            return
          }
          teardown._addParent(this)
        }
        ;(this._finalizers = this._finalizers ?? []).push(teardown)
      }
    }
  }
  private _hasParent(parent: Subscription) {
    const { _parentage } = this
    return (
      _parentage === parent ||
      (Array.isArray(_parentage) && _parentage.includes(parent))
    )
  }
  private _addParent(parent: Subscription) {
    const { _parentage } = this
    this._parentage = Array.isArray(_parentage)
      ? (_parentage.push(parent), _parentage)
      : _parentage
      ? [_parentage, parent]
      : parent
  }
  private _removeParent(parent: Subscription) {
    const { _parentage } = this
    if (_parentage === parent) {
      this._parentage = null
    } else if (Array.isArray(_parentage)) {
      arrRemove(_parentage, parent)
    }
  }
  remove(teardown: Exclude<TeardownLogic, void>): void {
    const { _finalizers } = this
    _finalizers && arrRemove(_finalizers, teardown)
    if (teardown instanceof Subscription) {
      teardown._removeParent(this)
    }
  }
}
export const EMPTY_SUBSCRIPTION = Subscription.EMPTY
export function isSubscription(value: any): value is Subscription {
  return (
    value instanceof Subscription ||
    (value &&
      "closed" in value &&
      isFunction(value.remove) &&
      isFunction(value.add) &&
      isFunction(value.unsubscribe))
  )
}
function execFinalizer(finalizer: Unsubscribable | (() => void)) {
  if (isFunction(finalizer)) {
    finalizer()
  } else {
    finalizer.unsubscribe()
  }
}
