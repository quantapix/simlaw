import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Subscription implements qt.Subscription {
  public static EMPTY = (() => {
    const y = new Subscription()
    y.closed = true
    return y
  })()
  public closed = false
  private parents: Subscription[] | Subscription | null = null
  private finalizers: Exclude<qt.Teardown, void>[] | null = null
  constructor(private teardown?: () => void) {}
  unsubscribe(): void {
    let es: any[] | undefined
    if (!this.closed) {
      this.closed = true
      const { parents } = this
      if (parents) {
        this.parents = null
        if (Array.isArray(parents)) {
          for (const p of parents) {
            p.remove(this)
          }
        } else parents.remove(this)
      }
      const { teardown } = this
      if (qu.isFunction(teardown)) {
        try {
          teardown()
        } catch (e: any) {
          es = e instanceof qu.UnsubscriptionError ? e.errors : [e]
        }
      }
      const { finalizers } = this
      if (finalizers) {
        this.finalizers = null
        for (const f of finalizers) {
          try {
            runFinalizer(f)
          } catch (e: any) {
            es = es ?? []
            if (e instanceof qu.UnsubscriptionError) es = [...es, ...e.errors]
            else es.push(e)
          }
        }
      }
      if (es) throw new qu.UnsubscriptionError(es)
    }
  }
  add(x: qt.Teardown): void {
    if (x && x !== this) {
      if (this.closed) runFinalizer(x)
      else {
        if (x instanceof Subscription) {
          if (x.closed || x.hasParent(this)) return
          x.addParent(this)
        }
        ;(this.finalizers = this.finalizers ?? []).push(x)
      }
    }
  }
  remove(x: Exclude<qt.Teardown, void>): void {
    const { finalizers } = this
    finalizers && qu.arrRemove(finalizers, x)
    if (x instanceof Subscription) x.removeParent(this)
  }
  private hasParent(x: Subscription) {
    const { parents } = this
    return parents === x || (Array.isArray(parents) && parents.includes(x))
  }
  private addParent(x: Subscription) {
    const { parents } = this
    this.parents = Array.isArray(parents) ? (parents.push(x), parents) : parents ? [parents, x] : x
  }
  private removeParent(x: Subscription) {
    const { parents } = this
    if (parents === x) this.parents = null
    else if (Array.isArray(parents)) qu.arrRemove(parents, x)
  }
}

export function isSubscription(x: any): x is Subscription {
  return (
    x instanceof Subscription ||
    (x && "closed" in x && qu.isFunction(x.add) && qu.isFunction(x.remove) && qu.isFunction(x.unsubscribe))
  )
}

function runFinalizer(x: qt.Unsubscribable | (() => void)) {
  if (qu.isFunction(x)) x()
  else x.unsubscribe()
}
