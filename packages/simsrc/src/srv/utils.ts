type Item = { value: unknown; expired: number }
type Ops = { maxAge: number }

export class Cache {
  items = new Map<string, Item>()
  _old = new Map<string, Item>()
  constructor(private max: number, private size = 0) {}
  get(k: string, ops?: Ops) {
    let x = this.items.get(k)
    const age = ops && ops.maxAge
    let now: number
    const getNow = () => (now = now || Date.now())
    if (x) {
      if (x.expired && getNow() > x.expired) {
        x.expired = 0
        x.value = undefined
      } else {
        if (age !== undefined) x.expired = age ? getNow() + age : 0
      }
      return x.value
    }
    x = this._old.get(k)
    if (x) {
      if (x.expired && getNow() > x.expired) {
        x.expired = 0
        x.value = undefined
      } else {
        this.update(k, x)
        if (age !== undefined) x.expired = age ? getNow() + age : 0
      }
      return x.value
    }
  }
  set(k: string, value: unknown, ops?: Ops) {
    const age = ops && ops.maxAge
    const expired = age ? Date.now() + age : 0
    const x = this.items.get(k)
    if (x) {
      x.expired = expired
      x.value = value
    } else this.update(k, { value, expired })
  }
  keys() {
    const ys = new Set()
    const now = Date.now()
    const check = (x: [string, Item]) => {
      const k = x[0]
      const e = x[1]
      if ((e.value && !e.expired) || e.expired >= now) ys.add(k)
    }
    for (const x of this.items.entries()) {
      check(x)
    }
    for (const x of this._old.entries()) {
      check(x)
    }
    return Array.from(ys.keys())
  }
  update(k: string, e: Item) {
    this.items.set(k, e)
    this.size++
    if (this.size >= this.max) {
      this.size = 0
      this._old = this.items
      this.items = new Map<string, Item>()
    }
  }
}
