import * as qt from "../types"
import { compose } from "../server"

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms || 1))
}
describe("compose", () => {
  it("should work", async () => {
    const stack: qt.Plugin[] = []
    const ys: number[] = []
    stack.push(async (_, next) => {
      ys.push(1)
      await wait(1)
      await next()
      await wait(1)
      ys.push(6)
    })
    stack.push(async (_, next) => {
      ys.push(2)
      await wait(1)
      await next()
      await wait(1)
      ys.push(5)
    })
    stack.push(async (_, next) => {
      ys.push(3)
      await wait(1)
      await next()
      await wait(1)
      ys.push(4)
    })
    await compose(stack)({} as qt.Context)
    expect(ys).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]))
  })
  it("should be callable twice", async () => {
    type S = qt.State
    type C = { ys: number[] }
    const stack: qt.Plugin<S, C>[] = []
    stack.push(async (ctx, next) => {
      ctx.ys.push(1)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(6)
    })
    stack.push(async (ctx, next) => {
      ctx.ys.push(2)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(5)
    })
    stack.push(async (ctx, next) => {
      ctx.ys.push(3)
      await wait(1)
      await next()
      await wait(1)
      ctx.ys.push(4)
    })
    const p = compose(stack)
    const ctx1: C = { ys: [] }
    const ctx2: C = { ys: [] }
    const ys = [1, 2, 3, 4, 5, 6]
    await p(ctx1 as qt.Context<S, C>)
    expect(ctx1.ys).toEqual(ys)
    await p(ctx2 as qt.Context<S, C>)
    expect(ctx2.ys).toEqual(ys)
  })
  it("should only accept an array", () => {
    let y
    try {
      expect(compose()).toThrow()
    } catch (e) {
      y = e
    }
    return expect(y).toBeInstanceOf(TypeError)
  })
  it("should create nexts to return a Promise", () => {
    const stack: qt.Plugin[] = []
    const ys: Promise<any>[] = []
    for (let i = 0; i < 5; i++) {
      stack.push((_, next) => {
        ys.push(next())
      })
    }
    compose(stack)({} as qt.Context)
    for (const y of ys) {
      expect(typeof y.then).toBe("function")
    }
  })
  it("should work with 0 plugins", () => {
    return compose([])({})
  })
  it("should only accept functions", () => {
    let y
    try {
      expect(compose([{} as qt.Servlet])).toThrow()
    } catch (e) {
      y = e
    }
    return expect(y).toBeInstanceOf(TypeError)
  })
  it("should work when yielding at the end of the stack", async () => {
    const stack: qt.Plugin[] = []
    var y = false
    stack.push(async (_, next) => {
      await next()
      y = true
    })
    await compose(stack)({} as qt.Context)
    expect(y).toBe(true)
  })
  it("should reject on errors in plugin", async () => {
    const stack: qt.Plugin[] = []
    stack.push(() => {
      throw new Error()
    })
    try {
      await compose(stack)({} as qt.Context)
      throw new Error("promise was not rejected")
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
  it("should work when yielding at the end of the stack with yield*", () => {
    const stack: qt.Plugin[] = []
    stack.push(async (_, next) => {
      await next
    })
    return compose(stack)({} as qt.Context)
  })
  it("should keep the context", () => {
    const stack: qt.Plugin[] = []
    const y = {} as qt.Context
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    stack.push(async (x, next) => {
      await next()
      expect(x).toEqual(y)
    })
    return compose(stack)(y)
  })
  it("should catch downstream errors", async () => {
    const stack: qt.Plugin[] = []
    const ys: number[] = []
    stack.push(async (_, next) => {
      ys.push(1)
      try {
        ys.push(6)
        await next()
        ys.push(7)
      } catch (err) {
        ys.push(2)
      }
      ys.push(3)
    })
    stack.push(async _ => {
      ys.push(4)
      throw new Error()
    })
    await compose(stack)({} as qt.Context)
    expect(ys).toEqual([1, 6, 4, 2, 3])
  })
  it("should compose w/ next", async () => {
    let y = false
    await compose([])({}, async () => {
      y = true
    })
    expect(y).toBe(true)
  })
  it("should handle errors in wrapped non-async functions", async () => {
    const stack: qt.Plugin[] = []
    stack.push(() => {
      throw new Error()
    })
    try {
      await compose(stack)({} as qt.Context)
      throw new Error("promise was not rejected")
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
  it("should compose w/ other compositions", () => {
    const ys: number[] = []
    return compose([
      compose([
        (_, next) => {
          ys.push(1)
          return next()
        },
        (_, next) => {
          ys.push(2)
          return next()
        },
      ]),
      (_, next) => {
        ys.push(3)
        return next()
      },
    ])({} as qt.Context, async () => {}).then(() => expect(ys).toEqual([1, 2, 3]))
  })
  it("should throw if next() is called multiple times", () => {
    return compose([
      async (_, next) => {
        await next()
        await next()
      },
    ])({}).then(
      () => {
        throw new Error("boom")
      },
      err => {
        expect(/multiple times/.test(err.message)).toBe(true)
      }
    )
  })
  it("should return a valid plugin", () => {
    let y = 0
    return compose([
      compose([
        (_, next) => {
          y++
          return next()
        },
        (_, next) => {
          y++
          return next()
        },
      ]),
      (_, next) => {
        y++
        return next()
      },
    ])({} as qt.Context, async () => {}).then(() => {
      expect(y).toEqual(3)
    })
  })
  it("should return last return value", async () => {
    const stack: qt.Plugin[] = []
    stack.push(async (_, next) => {
      var y = await next()
      expect(y).toEqual(2)
      return 1
    })
    stack.push(async (_, next) => {
      const y = await next()
      expect(y).toEqual(0)
      return 2
    })
    const y = await compose(stack)({} as qt.Context, async () => 0)
    expect(y).toEqual(1)
  })
  it("should not affect the original plugin array", () => {
    const stack: qt.Plugin[] = []
    const p: qt.Plugin = (_, next) => {
      return next()
    }
    stack.push(p)
    for (const x of stack) {
      expect(x).toBe(p)
    }
    compose(stack)
    for (const x of stack) {
      expect(x).toBe(p)
    }
  })
  it("should not get stuck on the passed in next", async () => {
    type S = qt.State
    type C = { count: number; next: number }
    const stack: qt.Plugin<S, C>[] = [
      (ctx, next) => {
        ctx.count++
        return next()
      },
    ]
    const y = {
      count: 0,
      next: 0,
    }
    await compose(stack)(y as qt.Context<S, C>, (ctx, next: qt.Next) => {
      ctx.next++
      return next()
    })
    expect(y).toEqual({ count: 1, next: 1 })
  })
})
