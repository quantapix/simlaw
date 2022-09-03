import * as qi from "../../../src/data/immer/index.js"

qi.enableAllPlugins()

describe("readme example", () => {
  it("works", () => {
    const baseState = [
      {
        todo: "Learn typescript",
        done: true,
      },
      {
        todo: "Try immer",
        done: false,
      },
    ]
    const y = qi.produce(baseState, x => {
      x.push({ todo: "Tweet about it" })
      x[1].done = true
    })
    expect(baseState.length).toBe(2)
    expect(y.length).toBe(3)
    expect(baseState[1].done).toBe(false)
    expect(y[1].done).toBe(true)
    expect(y[0]).toBe(baseState[0])
    expect(y[1]).not.toBe(baseState[1])
  })
  it("patches", () => {
    let base = { name: "Micheal", age: 32 }
    let fork = base
    const ps: any = []
    const invs: any = []
    fork = qi.produce(
      fork,
      x => {
        x.age = 33
      },
      (ps2, invs2) => {
        ps.push(...ps2)
        invs.push(...invs2)
      }
    )
    base = qi.produce(base, x => {
      x.name = "Michel"
    })
    base = qi.applyPatches(base, ps)
    expect(base).toEqual({ name: "Michel", age: 33 })
    base = qi.applyPatches(base, invs)
    expect(base).toEqual({ name: "Michel", age: 32 })
  })
  it("can update set", () => {
    const base = { title: "hello", tokenSet: new Set() }
    const y = qi.produce(base, x => {
      x.title = x.title.toUpperCase()
      x.tokenSet.add("c1342")
    })
    expect(base).toEqual({ title: "hello", tokenSet: new Set() })
    expect(y).toEqual({ title: "HELLO", tokenSet: new Set(["c1342"]) })
  })
  it("can deep update map", () => {
    const base = { users: new Map([["michel", { name: "miche", age: 27 }]]) }
    const y = qi.produce(base, x => {
      x.users.get("michel")!.name = "michel"
    })
    expect(base).toEqual({
      users: new Map([["michel", { name: "miche", age: 27 }]]),
    })
    expect(y).toEqual({
      users: new Map([["michel", { name: "michel", age: 27 }]]),
    })
  })
  it("supports immerable", () => {
    class Clock {
      constructor(public hours = 0, public minutes = 0) {
        this.hours = hours
        this.minutes = minutes
      }
      increment(hours: number, minutes = 0) {
        return qi.produce(this, d => {
          d.hours += hours
          d.minutes += minutes
        })
      }
      toString() {
        return `${("" + this.hours).padStart(2, 0)}:${(
          "" + this.minutes
        ).padStart(2, 0)}`
      }
    }
    ;(Clock as any)[qi.immerable] = true
    const midnight = new Clock()
    const lunch = midnight.increment(12, 30)
    expect(midnight).not.toBe(lunch)
    expect(lunch).toBeInstanceOf(Clock)
    expect(midnight.toString()).toBe("00:00")
    expect(lunch.toString()).toBe("12:30")
    const diner = lunch.increment(6)
    expect(diner).not.toBe(lunch)
    expect(lunch).toBeInstanceOf(Clock)
    expect(diner.toString()).toBe("18:30")
  })
  test("produceWithPatches", () => {
    const result = qi.produceWithPatches({ age: 33 }, x => {
      x.age++
    })
    expect(result).toEqual([
      { age: 34 },
      [{ op: "replace", path: ["age"], value: 34 }],
      [{ op: "replace", path: ["age"], value: 33 }],
    ])
  })
})
test("Producers can update Maps", () => {
  qi.setAutoFreeze(true)
  const base = new Map()
  const y = qi.produce(base, draft => {
    draft.set("michel", { name: "Michel Weststrate", country: "NL" })
  })
  const y2 = qi.produce(y, draft => {
    draft.get("michel").country = "UK"
  })
  expect(y).not.toBe(base)
  expect(y2).not.toBe(y)
  expect(base).toMatchInlineSnapshot(`Map {}`)
  expect(y).toMatchInlineSnapshot(`
		Map {
		  "michel" => Object {
		    "country": "NL",
		    "name": "Michel Weststrate",
		  },
		}
	`)
  expect(y2).toMatchInlineSnapshot(`
		Map {
		  "michel" => Object {
		    "country": "UK",
		    "name": "Michel Weststrate",
		  },
		}
	`)
  expect(base.size).toBe(0)
  expect(() => y2.clear()).toThrowErrorMatchingSnapshot()
})
test("clock class", () => {
  class Clock {
    [qi.immerable] = true
    constructor(public hour: number, public minute: number) {
      this.hour = hour
      this.minute = minute
    }
    get time() {
      return `${this.hour}:${this.minute}`
    }
    tick() {
      return qi.produce(this, draft => {
        draft.minute++
      })
    }
  }
  const clock1 = new Clock(12, 10)
  const clock2 = clock1.tick()
  expect(clock1.time).toEqual("12:10")
  expect(clock2.time).toEqual("12:11")
  expect(clock2).toBeInstanceOf(Clock)
})
