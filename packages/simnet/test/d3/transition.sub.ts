import assert from "assert"
import { easeCubic } from "d3-ease"
import { interpolateNumber, interpolateRgb, interpolateString } from "d3-interpolate"
import { select, selectAll } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.attr(name, value) creates an tween to the specified value", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).attr("fill", "red")
  s.transition().attr("fill", "blue")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("fill"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) creates a namespaced tween to the specified value", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).attr("svg:fill", "red")
  s.transition().attr("svg:fill", "blue")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(
        root.getAttributeNS("http://www.w3.org/2000/svg", "fill"),
        interpolate(ease(elapsed / duration))
      )
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) creates an tween to the value returned by the specified function", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).attr("fill", "red")
  s.transition().attr("fill", function () {
    return "blue"
  })
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("fill"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) creates a namespaced tween to the value returned by the specified function", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).attr("svg:fill", "red")
  s.transition().attr("svg:fill", function () {
    return "blue"
  })
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(
        root.getAttributeNS("http://www.w3.org/2000/svg", "fill"),
        interpolate(ease(elapsed / duration))
      )
      resolve()
    }, 125)
  )
})

it("transition.attr(name, constant) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const s = select(root).attr("foo", 1)
  s.transition().attr("foo", 1)
  timeout(() => root.setAttribute("foo", 2), 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttribute("foo"), "2")
      resolve()
    }, 250)
  )
})

it("transition.attr(ns:name, constant) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const s = select(root).attr("svg:foo", 1)
  s.transition().attr("svg:foo", 1)
  timeout(() => root.setAttributeNS("http://www.w3.org/2000/svg", "foo", 2), 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttributeNS("http://www.w3.org/2000/svg", "foo"), "2")
      resolve()
    }, 250)
  )
})

it("transition.attr(name, function) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const s = select(root).attr("foo", 1)
  s.transition().attr("foo", function () {
    return 1
  })
  timeout(() => root.setAttribute("foo", 2), 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttribute("foo"), "2")
      resolve()
    }, 250)
  )
})

it("transition.attr(ns:name, function) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const s = select(root).attr("svg:foo", 1)
  s.transition().attr("svg:foo", function () {
    return 1
  })
  timeout(() => root.setAttributeNS("http://www.w3.org/2000/svg", "foo", 2), 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttributeNS("http://www.w3.org/2000/svg", "foo"), "2")
      resolve()
    }, 250)
  )
})

it("transition.attr(name, constant) uses interpolateNumber if value is a number", async () => {
  const root = document.documentElement
  const s = select(root).attr("foo", "15px")
  s.transition().attr("foo", 10)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttribute("foo"), "NaN")
      resolve()
    }, 125)
  )
})

it("transition.attr(name, function) uses interpolateNumber if value is a number", async () => {
  const root = document.documentElement
  const s = select(root).attr("foo", "15px")
  s.transition().attr("foo", () => 10)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.getAttribute("foo"), "NaN")
      resolve()
    }, 125)
  )
})

it(
  "transition.attr(name, value) immediately evaluates the specified function with the expected context and arguments",
  "<h1 id='one' fill='cyan'></h1><h1 id='two' fill='magenta'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const ease = easeCubic
    const duration = 250
    const interpolate1 = interpolateRgb("cyan", "red")
    const interpolate2 = interpolateRgb("magenta", "green")
    const s = selectAll([one, two]).data(["red", "green"])
    const result = []
    s.transition().attr("fill", function (d, i, nodes) {
      result.push([d, i, nodes, this])
      return d
    })
    assert.deepStrictEqual(result, [
      ["red", 0, [one, two], one],
      ["green", 1, [one, two], two],
    ])
    await new Promise(resolve =>
      timeout(elapsed => {
        assert.strictEqual(one.getAttribute("fill"), interpolate1(ease(elapsed / duration)))
        assert.strictEqual(two.getAttribute("fill"), interpolate2(ease(elapsed / duration)))
        resolve()
      }, 125)
    )
  }
)

it("transition.attr(name, value) constructs an interpolator using the current value on start", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root)
  s.transition()
    .on("start", function () {
      s.attr("fill", "red")
    })
    .attr("fill", function () {
      return "blue"
    })
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("fill"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.attr(name, null) creates an tween which removes the specified attribute post-start", async () => {
  const root = document.documentElement
  const s = select(root).attr("fill", "red")
  const started = () => assert.strictEqual(root.getAttribute("fill"), "red")
  s.transition().attr("fill", null).on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.hasAttribute("fill"), false)
      resolve()
    })
  )
})

it("transition.attr(name, null) creates an tween which removes the specified namespaced attribute post-start", async () => {
  const root = document.documentElement
  const s = select(root).attr("svg:fill", "red")
  const started = () => assert.strictEqual(root.getAttributeNS("http://www.w3.org/2000/svg", "fill"), "red")
  s.transition().attr("svg:fill", null).on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.hasAttributeNS("http://www.w3.org/2000/svg", "fill"), false)
      resolve()
    })
  )
})

it("transition.attr(name, value) creates an tween which removes the specified attribute post-start if the specified function returns null", async () => {
  const root = document.documentElement
  const s = select(root).attr("fill", "red")
  const started = () => assert.strictEqual(root.getAttribute("fill"), "red")
  s.transition()
    .attr("fill", function () {})
    .on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.hasAttribute("fill"), false)
      resolve()
    })
  )
})

it("transition.attr(name, value) creates an tween which removes the specified namespaced attribute post-start if the specified function returns null", async () => {
  const root = document.documentElement
  const s = select(root).attr("svg:fill", "red")
  const started = () => assert.strictEqual(root.getAttributeNS("http://www.w3.org/2000/svg", "fill"), "red")
  s.transition()
    .attr("svg:fill", function () {})
    .on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.hasAttributeNS("http://www.w3.org/2000/svg", "fill"), false)
      resolve()
    })
  )
})

it("transition.attr(name, value) interpolates numbers", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateNumber(1, 2)
  const s = select(root).attr("foo", 1)
  s.transition().attr("foo", 2)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("foo"), interpolate(ease(elapsed / duration)) + "")
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) interpolates strings", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateString("1px", "2px")
  const s = select(root).attr("foo", "1px")
  s.transition().attr("foo", "2px")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("foo"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) interpolates colors", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("#f00", "#00f")
  const s = select(root).attr("foo", "#f00")
  s.transition().attr("foo", "#00f")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("foo"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.attr(name, value) creates an attrTween with the specified name", async () => {
  const root = document.documentElement
  const s = select(root).attr("fill", "red")
  const t = s.transition().attr("fill", "blue")
  assert.strictEqual(t.attrTween("fill").call(root).call(root, 0.5), "rgb(128, 0, 128)")
})

it('transition.attr(name, value) creates a tween with the name "attr.name"', async () => {
  const root = document.documentElement
  const s = select(root).attr("fill", "red")
  const t = s.transition().attr("fill", "blue")
  t.tween("attr.fill").call(root).call(root, 0.5)
  assert.strictEqual(root.getAttribute("fill"), "rgb(128, 0, 128)")
})
import assert from "assert"
import { easeCubic } from "d3-ease"
import { interpolateHcl } from "d3-interpolate"
import { select, selectAll } from "d3-selection"
import { timeout, now } from "d3-timer"
import "../../src/index.js"
import { ENDING } from "../../src/transition/schedule.js"
import it from "../jsdom.js"

it("transition.attrTween(name, value) defines an attribute tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  select(root)
    .transition()
    .attrTween("foo", () => interpolate)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("foo"), interpolate(easeCubic(elapsed / 250)))
      resolve()
    }, 125)
  )
})

it(
  "transition.attrTween(name, value) invokes the value function with the expected context and arguments",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const result = []
    selectAll([one, two])
      .data(["one", "two"])
      .transition()
      .attrTween("foo", function (d, i, nodes) {
        result.push([d, i, nodes, this])
      })
    await new Promise(resolve => timeout(resolve))
    assert.deepStrictEqual(result, [
      ["one", 0, [one, two], one],
      ["two", 1, [one, two], two],
    ])
  }
)

it("transition.attrTween(name, value) passes the eased time to the interpolator", async () => {
  const root = document.documentElement
  const then = now()
  const duration = 250
  const ease = easeCubic
  const t = select(root)
    .transition()
    .attrTween("foo", () => interpolate)
  const schedule = root.__transition[t._id]
  function interpolate(t) {
    assert.strictEqual(this, root)
    assert.strictEqual(t, schedule.state === ENDING ? 1 : ease((now() - then) / duration))
  }
  await t.end()
})

it("transition.attrTween(name, value) allows the specified function to return null for a noop", async () => {
  const root = document.documentElement
  const s = select(root).attr("foo", "42").attr("svg:bar", "43")
  s.transition()
    .attrTween("foo", () => {})
    .attrTween("svg:bar", () => {})
  await new Promise(resolve => timeout(resolve, 125))
  assert.strictEqual(root.getAttribute("foo"), "42")
  assert.strictEqual(root.getAttributeNS("http://www.w3.org/2000/svg", "bar"), "43")
})

it("transition.attrTween(name, value) defines a namespaced attribute tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  select(root)
    .transition()
    .attrTween("svg:foo", () => interpolate)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(
        root.getAttributeNS("http://www.w3.org/2000/svg", "foo"),
        interpolate(easeCubic(elapsed / 250))
      )
      resolve()
    }, 125)
  )
})

it("transition.attrTween(name, value) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  select(root)
    .transition()
    .attrTween(
      {
        toString() {
          return "foo"
        },
      },
      () => interpolate
    )
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.getAttribute("foo"), interpolate(easeCubic(elapsed / 250)))
      resolve()
    }, 125)
  )
})

it("transition.attrTween(name, value) throws an error if value is not null and not a function", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.attrTween("foo", 42)
  })
})

it("transition.attrTween(name, null) removes the specified attribute tween", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const t = select(root)
    .transition()
    .attrTween("foo", () => interpolate)
    .attrTween("foo", null)
  assert.strictEqual(t.attrTween("foo"), null)
  assert.strictEqual(t.tween("attr.foo"), null)
  await new Promise(resolve => timeout(resolve, 125))
  assert.strictEqual(root.hasAttribute("foo"), false)
})

it("transition.attrTween(name) returns the attribute tween with the specified name", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const tween = () => interpolate
  const started = () => assert.strictEqual(t.attrTween("foo"), tween)
  const ended = () => assert.strictEqual(t.attrTween("foo"), tween)
  const t = select(root).transition().attrTween("foo", tween).on("start", started).on("end", ended)
  assert.strictEqual(t.attrTween("foo"), tween)
  assert.strictEqual(t.attrTween("bar"), null)
  await t.end()
})

it("transition.attrTween(name) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const tween = () => {}
  const t = select(root).transition().attrTween("color", tween)
  assert.strictEqual(
    t.attrTween({
      toString() {
        return "color"
      },
    }),
    tween
  )
})
import assert from "assert"
import { selection } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition.call is the same as selection.call", () => {
  assert.strictEqual(transition.prototype.call, selection.prototype.call)
})
import assert from "assert"
import { select, selectAll } from "d3-selection"
import it from "../jsdom.js"
import "../../src/index.js"

it("transition.delay() returns the delay for the first non-null node", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const t1 = select(one).transition()
  const t2 = select(two).transition().delay(50)
  assert.strictEqual(one.__transition[t1._id].delay, 0)
  assert.strictEqual(two.__transition[t2._id].delay, 50)
  assert.strictEqual(t1.delay(), 0)
  assert.strictEqual(t2.delay(), 50)
  assert.strictEqual(select(one).transition(t1).delay(), 0)
  assert.strictEqual(select(two).transition(t2).delay(), 50)
  assert.strictEqual(selectAll([null, one]).transition(t1).delay(), 0)
  assert.strictEqual(selectAll([null, two]).transition(t2).delay(), 50)
})

it(
  "transition.delay(number) sets the delay for each selected element to the specified number",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two]).transition().delay(50)
    assert.strictEqual(one.__transition[t._id].delay, 50)
    assert.strictEqual(two.__transition[t._id].delay, 50)
  }
)

it("transition.delay(value) coerces the specified value to a number", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const t = selectAll([one, two]).transition().delay("50")
  assert.strictEqual(one.__transition[t._id].delay, 50)
  assert.strictEqual(two.__transition[t._id].delay, 50)
})

it(
  "transition.delay(function) passes the expected arguments and context to the function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const result = []
    const s = selectAll([one, two]).data(["one", "two"])
    const t = s.transition().delay(function (d, i, nodes) {
      result.push([d, i, nodes, this])
    })
    assert.deepStrictEqual(result, [
      ["one", 0, t._groups[0], one],
      ["two", 1, t._groups[0], two],
    ])
  }
)

it(
  "transition.delay(function) sets the delay for each selected element to the number returned by the specified function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two])
      .transition()
      .delay(function (d, i) {
        return i * 20
      })
    assert.strictEqual(one.__transition[t._id].delay, 0)
    assert.strictEqual(two.__transition[t._id].delay, 20)
  }
)

it(
  "transition.delay(function) coerces the value returned by the specified function to a number",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two])
      .transition()
      .delay(function (d, i) {
        return i * 20 + ""
      })
    assert.strictEqual(one.__transition[t._id].delay, 0)
    assert.strictEqual(two.__transition[t._id].delay, 20)
  }
)
import assert from "assert"
import { select, selectAll } from "d3-selection"
import "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.duration() returns the duration for the first non-null node",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = select(one).transition()
    const t2 = select(two).transition().duration(50)
    assert.strictEqual(one.__transition[t1._id].duration, 250)
    assert.strictEqual(two.__transition[t2._id].duration, 50)
    assert.strictEqual(t1.duration(), 250)
    assert.strictEqual(t2.duration(), 50)
    assert.strictEqual(select(one).transition(t1).duration(), 250)
    assert.strictEqual(select(two).transition(t2).duration(), 50)
    assert.strictEqual(selectAll([null, one]).transition(t1).duration(), 250)
    assert.strictEqual(selectAll([null, two]).transition(t2).duration(), 50)
  }
)

it(
  "transition.duration(number) sets the duration for each selected element to the specified number",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two]).transition().duration(50)
    assert.strictEqual(one.__transition[t._id].duration, 50)
    assert.strictEqual(two.__transition[t._id].duration, 50)
  }
)

it("transition.duration(value) coerces the specified value to a number", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const t = selectAll([one, two]).transition().duration("50")
  assert.strictEqual(one.__transition[t._id].duration, 50)
  assert.strictEqual(two.__transition[t._id].duration, 50)
})

it(
  "transition.duration(function) passes the expected arguments and context to the function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const result = []
    const s = selectAll([one, two]).data(["one", "two"])
    const t = s.transition().duration(function (d, i, nodes) {
      result.push([d, i, nodes, this])
    })
    assert.deepStrictEqual(result, [
      ["one", 0, t._groups[0], one],
      ["two", 1, t._groups[0], two],
    ])
  }
)

it(
  "transition.duration(function) sets the duration for each selected element to the number returned by the specified function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two])
      .transition()
      .duration(function (d, i) {
        return i * 20
      })
    assert.strictEqual(one.__transition[t._id].duration, 0)
    assert.strictEqual(two.__transition[t._id].duration, 20)
  }
)

it(
  "transition.duration(function) coerces the value returned by the specified function to a number",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two])
      .transition()
      .duration(function (d, i) {
        return i * 20 + ""
      })
    assert.strictEqual(one.__transition[t._id].duration, 0)
    assert.strictEqual(two.__transition[t._id].duration, 20)
  }
)
import assert from "assert"
import { select, selectAll, selection } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition.each is the same as selection.each", () => {
  assert.strictEqual(transition.prototype.each, selection.prototype.each)
})

it("transition.each() runs as expected", () => {
  const root = document.documentElement
  let a = 0
  select(root)
    .transition()
    .each(() => {
      ++a
    })
  assert.strictEqual(a, 1)
  a = 0
  selectAll([null, root])
    .transition()
    .each(() => {
      ++a
    })
  assert.strictEqual(a, 1)
})
import assert from "assert"
import { easeBounce, easeCubic } from "d3-ease"
import { select, selectAll } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import { ENDING, RUNNING } from "../../src/transition/schedule.js"
import it from "../jsdom.js"

it(
  "transition.ease() returns the easing function for the first non-null node",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = select(one).transition()
    const t2 = select(two).transition().ease(easeBounce)
    assert.strictEqual(one.__transition[t1._id].ease, easeCubic)
    assert.strictEqual(two.__transition[t2._id].ease, easeBounce)
    assert.strictEqual(t1.ease(), easeCubic)
    assert.strictEqual(t2.ease(), easeBounce)
    assert.strictEqual(select(one).transition(t1).ease(), easeCubic)
    assert.strictEqual(select(two).transition(t2).ease(), easeBounce)
    assert.strictEqual(selectAll([null, one]).transition(t1).ease(), easeCubic)
    assert.strictEqual(selectAll([null, two]).transition(t2).ease(), easeBounce)
  }
)

it("transition.ease(ease) throws an error if ease is not a function", () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.ease(42)
  })
  assert.throws(() => {
    t.ease(null)
  })
})

it(
  "transition.ease(ease) sets the easing function for each selected element to the specified function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two]).transition().ease(easeBounce)
    assert.strictEqual(one.__transition[t._id].ease, easeBounce)
    assert.strictEqual(two.__transition[t._id].ease, easeBounce)
  }
)

it("transition.ease(ease) passes the easing function the normalized time in [0, 1]", async () => {
  let actual
  const root = document.documentElement
  const ease = t => {
    actual = t
    return t
  }

  select(root).transition().ease(ease)

  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(actual, elapsed / 250)
      resolve()
    }, 100)
  )
})

it("transition.ease(ease) does not invoke the easing function on the last frame", async () => {
  const root = document.documentElement
  const ease = t => {
    assert.strictEqual(schedule.state, RUNNING)
    return t
  }
  const t = select(root).transition().ease(ease)
  const schedule = root.__transition[t._id]
  await t.end()
})

it("transition.ease(ease) observes the eased time returned by the easing function", async () => {
  const root = document.documentElement
  let expected
  const ease = () => {
    return (expected = Math.random() * 2 - 0.5)
  }
  const tween = () => {
    return t => {
      assert.strictEqual(t, schedule.state === ENDING ? 1 : expected)
    }
  }
  const t = select(root).transition().ease(ease).tween("tween", tween)
  const schedule = root.__transition[t._id]
  await t.end()
})
import assert from "assert"
import { easePolyIn } from "d3-ease"
import { select } from "d3-selection"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.easeVarying(factory) accepts an easing function factory", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const t = select(document)
    .selectAll("h1")
    .data([{ exponent: 3 }, { exponent: 4 }])
    .transition()
  t.easeVarying(d => easePolyIn.exponent(d.exponent))
  assert.strictEqual(t.ease()(0.5), easePolyIn.exponent(3)(0.5))
})

it(
  "transition.easeVarying(factory) passes factory datum, index, group with the node as this",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const t = select(document)
      .selectAll("h1")
      .data([{ exponent: 3 }, { exponent: 4 }])
      .transition()
    const results = []
    t.easeVarying(function (d, i, e) {
      results.push([d, i, e, this])
      return t => t
    })
    assert.deepStrictEqual(results, [
      [{ exponent: 3 }, 0, [...t], document.querySelector("#one")],
      [{ exponent: 4 }, 1, [...t], document.querySelector("#two")],
    ])
  }
)

it(
  "transition.easeVarying() throws an error if the argument is not a function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const t = select(document)
      .selectAll("h1")
      .data([{ exponent: 3 }, { exponent: 4 }])
      .transition()
    assert.throws(() => {
      t.easeVarying()
    })
    assert.throws(() => {
      t.easeVarying("a")
    })
  }
)
import assert from "assert"
import { selection } from "d3-selection"
import { transition } from "../../src/index.js"

it("transition.empty is the same as selection.empty", () => {
  assert.strictEqual(transition.prototype.empty, selection.prototype.empty)
})
import assert from "assert"
import { selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.filter(selector) retains the elements matching the specified selector",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.filter("#two")
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[two]])
    assert.strictEqual(t2._parents, t1._parents)
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
  }
)

it(
  "transition.filter(function) retains the elements for which the specified function returns true",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.filter(function () {
      return this === two
    })
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[two]])
    assert.strictEqual(t2._parents, t1._parents)
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
  }
)
import assert from "assert"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition() returns a transition on the document element with the null name", () => {
  const root = document.documentElement
  const t = transition()
  const schedule = root.__transition[t._id]
  assert.strictEqual(t.node(), root)
  assert.strictEqual(schedule.name, null)
})

it("transition(null) returns a transition on the document element with the null name", () => {
  const root = document.documentElement
  const t = transition(null)
  const schedule = root.__transition[t._id]
  assert.strictEqual(t.node(), root)
  assert.strictEqual(schedule.name, null)
})

it("transition(undefined) returns a transition on the document element with the null name", () => {
  const root = document.documentElement
  const t = transition(undefined)
  const schedule = root.__transition[t._id]
  assert.strictEqual(t.node(), root)
  assert.strictEqual(schedule.name, null)
})

it("transition(name) returns a transition on the document element with the specified name", () => {
  const root = document.documentElement
  const t = transition("foo")
  const schedule = root.__transition[t._id]
  assert.strictEqual(t.node(), root)
  assert.strictEqual(schedule.name, "foo")
})

it("transition.prototype can be extended", () => {
  try {
    let pass = 0
    transition.prototype.test = () => {
      return ++pass
    }
    assert.strictEqual(transition().test(), 1)
    assert.strictEqual(pass, 1)
  } finally {
    delete transition.prototype.test
  }
})

it("transitions are instanceof transition", () => {
  assert.strictEqual(transition() instanceof transition, true)
})
import assert from "assert"
import { select, selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.merge(other) merges elements from the specified other transition for null elements in this transition",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t0 = select(document.documentElement).transition()
    const t1 = selectAll([null, two]).transition(t0)
    const t2 = selectAll([one, null]).transition(t0)
    const t3 = t1.merge(t2)
    assert.strictEqual(t3 instanceof transition, true)
    assert.deepStrictEqual(t3._groups, [[one, two]])
    assert.strictEqual(t3._parents, t1._parents)
    assert.strictEqual(t3._name, t1._name)
    assert.strictEqual(t3._id, t1._id)
  }
)

it(
  "transition.merge(other) throws an error if the other transition has a different id",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([null, two]).transition()
    const t2 = selectAll([one, null]).transition()
    assert.throws(() => {
      t1.merge(t2)
    })
  }
)
import assert from "assert"
import { selection } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition.node is the same as selection.node", () => {
  assert.strictEqual(transition.prototype.node, selection.prototype.node)
})
import assert from "assert"
import { selection } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition.nodes is the same as selection.nodes", () => {
  assert.strictEqual(transition.prototype.nodes, selection.prototype.nodes)
})
import assert from "assert"
import { select, selectAll } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import { ENDED, ENDING, STARTING } from "../../src/transition/schedule.js"
import it from "../jsdom.js"

it("transition.on(type, listener) throws an error if listener is not a function", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.on("start", 42)
  })
})

it("transition.on(typename) returns the listener with the specified typename, if any", async () => {
  const root = document.documentElement
  const foo = () => {}
  const bar = () => {}
  const t = select(root).transition().on("start", foo).on("start.bar", bar)
  assert.strictEqual(t.on("start"), foo)
  assert.strictEqual(t.on("start.foo"), undefined)
  assert.strictEqual(t.on("start.bar"), bar)
  assert.strictEqual(t.on("end"), undefined)
})

it("transition.on(typename) throws an error if the specified type is not supported", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.on("foo")
  })
})

it("transition.on(typename, listener) throws an error if the specified type is not supported", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.on("foo", () => {})
  })
})

it("transition.on(typename, listener) throws an error if the specified listener is not a function", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.on("foo", 42)
  })
})

it("transition.on(typename, null) removes the listener with the specified typename, if any", async () => {
  const root = document.documentElement
  let starts = 0
  const t = select(root)
    .transition()
    .on("start.foo", () => {
      ++starts
    })
  const schedule = root.__transition[t._id]
  assert.strictEqual(t.on("start.foo", null), t)
  assert.strictEqual(t.on("start.foo"), undefined)
  assert.strictEqual(schedule.on.on("start.foo"), undefined)
  await new Promise(resolve => timeout(resolve))
  assert.strictEqual(starts, 0)
})

it('transition.on("start", listener) registers a listener for the start event', async () => {
  const root = document.documentElement
  const t = select(root).transition()
  const schedule = root.__transition[t._id]
  await new Promise(resolve =>
    t.on("start", () => {
      assert.strictEqual(schedule.state, STARTING)
      resolve()
    })
  )
})

it('transition.on("interrupt", listener) registers a listener for the interrupt event (during start)', async () => {
  const root = document.documentElement
  const s = select(root)
  const t = s.transition()
  const schedule = root.__transition[t._id]
  timeout(() => s.interrupt())
  await new Promise(resolve =>
    t.on("interrupt", () => {
      assert.strictEqual(schedule.state, ENDED)
      resolve()
    })
  )
})

it('transition.on("interrupt", listener) registers a listener for the interrupt event (during run)', async () => {
  const root = document.documentElement
  const s = select(root)
  const t = s.transition()
  const schedule = root.__transition[t._id]
  timeout(() => s.interrupt(), 50)
  await new Promise(resolve =>
    t.on("interrupt", () => {
      assert.strictEqual(schedule.state, ENDED)
      resolve()
    })
  )
})

it('transition.on("end", listener) registers a listener for the end event', async () => {
  const root = document.documentElement
  const t = select(root).transition().duration(50)
  const schedule = root.__transition[t._id]
  await new Promise(resolve =>
    t.on("end", () => {
      assert.strictEqual(schedule.state, ENDING)
      resolve()
    })
  )
})

it(
  "transition.on(typename, listener) uses copy-on-write to apply changes",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const foo = () => {}
    const bar = () => {}
    const t = selectAll([one, two]).transition()
    const schedule1 = one.__transition[t._id]
    const schedule2 = two.__transition[t._id]
    t.on("start", foo)
    assert.strictEqual(schedule1.on.on("start"), foo)
    assert.strictEqual(schedule2.on, schedule1.on)
    t.on("start", bar)
    assert.strictEqual(schedule1.on.on("start"), bar)
    assert.strictEqual(schedule2.on, schedule1.on)
    select(two).transition(t).on("start", foo)
    assert.strictEqual(schedule1.on.on("start"), bar)
    assert.strictEqual(schedule2.on.on("start"), foo)
  }
)
import assert from "assert"
import { select } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.remove() creates an end listener to remove the element", async () => {
  const root = document.documentElement
  const body = document.body
  const s = select(body)
  const t = s.transition().remove().on("start", started).on("end", ended)
  const end = t.end()

  function started() {
    assert.strictEqual(body.parentNode, root)
  }

  function ended() {
    assert.strictEqual(body.parentNode, null)
  }

  await new Promise(resolve => timeout(resolve))
  assert.strictEqual(body.parentNode, root)
  await end
})

it("transition.remove() creates an end listener named end.remove", async () => {
  const root = document.documentElement
  const body = document.body
  const s = select(body)
  const t = s.transition().remove().on("start", started).on("end", ended)
  const end = t.end()

  function started() {
    assert.strictEqual(body.parentNode, root)
  }

  function ended() {
    assert.strictEqual(body.parentNode, root)
  }

  t.on("end.remove").call(body)
  assert.strictEqual(body.parentNode, null)
  t.on("end.remove", null)
  root.appendChild(body)
  await end
})
import assert from "assert"
import { selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.select(selector) selects the descendants matching the specified selector, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.select("child")
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[one.firstChild, two.firstChild]])
    assert.strictEqual(t2._parents, t1._parents)
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual(one.firstChild.__data__, 1)
    assert.strictEqual(two.firstChild.__data__, 2)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)

it(
  "transition.select(function) selects the descendants returned by the specified function, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.select(function () {
      return this.firstChild
    })
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[one.firstChild, two.firstChild]])
    assert.strictEqual(t2._parents, t1._parents)
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual(one.firstChild.__data__, 1)
    assert.strictEqual(two.firstChild.__data__, 2)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)
import assert from "assert"
import { selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.selectAll(selector) selects the descendants matching the specified selector, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.selectAll("child")
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(
      t2._groups.map(group => Array.from(group)),
      [[one.firstChild], [two.firstChild]]
    )
    assert.deepStrictEqual(t2._parents, [one, two])
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual("__data__" in one.firstChild, false)
    assert.strictEqual("__data__" in two.firstChild, false)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)

it(
  "transition.selectAll(function) selects the descendants returned by the specified function, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.selectAll(function () {
      return [this.firstChild]
    })
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[one.firstChild], [two.firstChild]])
    assert.deepStrictEqual(t2._parents, [one, two])
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual("__data__" in one.firstChild, false)
    assert.strictEqual("__data__" in two.firstChild, false)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)
import assert from "assert"
import { selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.selectChild(selector) selects the child matching the specified selector, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.selectChild("child")
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(t2._groups, [[one.firstChild, two.firstChild]])
    assert.strictEqual(t2._parents, t1._parents)
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual(one.firstChild.__data__, 1)
    assert.strictEqual(two.firstChild.__data__, 2)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)
import assert from "assert"
import { selectAll } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "transition.selectChildren(selector) selects the children matching the specified selector, then derives a transition",
  "<h1 id='one'><child/></h1><h1 id='two'><child/></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t1 = selectAll([one, two])
      .data([1, 2])
      .transition()
      .delay(function (d) {
        return d * 10
      })
    const t2 = t1.selectChildren("child")
    assert.strictEqual(t2 instanceof transition, true)
    assert.deepStrictEqual(
      t2._groups.map(group => Array.from(group)),
      [[one.firstChild], [two.firstChild]]
    )
    assert.deepStrictEqual(t2._parents, [one, two])
    assert.strictEqual(t2._name, t1._name)
    assert.strictEqual(t2._id, t1._id)
    assert.strictEqual("__data__" in one.firstChild, false)
    assert.strictEqual("__data__" in two.firstChild, false)
    assert.strictEqual(one.firstChild.__transition[t1._id].delay, 10)
    assert.strictEqual(two.firstChild.__transition[t1._id].delay, 20)
  }
)
import assert from "assert"
import { select, selection } from "d3-selection"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.selection() returns the transition’s selection", "<h1 id='one'>one</h1><h1 id='two'>two</h1>", () => {
  const s0 = select(document.body).selectAll("h1")
  const t = s0.transition()
  const s1 = t.selection()
  assert(s1 instanceof selection)
  assert.strictEqual(s1._groups, s0._groups)
  assert.strictEqual(s1._parents, s0._parents)
})
import assert from "assert"
import { select, selectAll, selection } from "d3-selection"
import { transition } from "../../src/index.js"
import it from "../jsdom.js"

it("transition.size is the same as selection.size", () => {
  assert.strictEqual(transition.prototype.size, selection.prototype.size)
})

it("transition.size() returns the expected value", () => {
  const root = document.documentElement
  assert.strictEqual(select(root).transition().size(), 1)
  assert.strictEqual(selectAll([null, root]).transition().size(), 1)
})
import assert from "assert"
import { easeCubic } from "d3-ease"
import { interpolateNumber, interpolateRgb, interpolateString } from "d3-interpolate"
import { select, selectAll } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.style(name, value) creates an tween to the specified value", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).style("color", "red")
  s.transition().style("color", "blue")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.style(name, value) creates an tween to the value returned by the specified function", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root).style("color", "red")
  s.transition().style("color", () => "blue")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it(
  "transition.style(name, value) immediately evaluates the specified function with the expected context and arguments",
  "<h1 id='one' style='color:#0ff;'></h1><h1 id='two' style='color:#f0f;'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const ease = easeCubic
    const duration = 250
    const interpolate1 = interpolateRgb("cyan", "red")
    const interpolate2 = interpolateRgb("magenta", "green")
    const t = selectAll([one, two]).data(["red", "green"])
    const result = []
    t.transition().style("color", function (d, i, nodes) {
      result.push([d, i, nodes, this])
      return d
    })
    assert.deepStrictEqual(result, [
      ["red", 0, [one, two], one],
      ["green", 1, [one, two], two],
    ])
    await new Promise(resolve =>
      timeout(elapsed => {
        assert.strictEqual(one.style.getPropertyValue("color"), interpolate1(ease(elapsed / duration)))
        assert.strictEqual(two.style.getPropertyValue("color"), interpolate2(ease(elapsed / duration)))
        resolve()
      }, 125)
    )
  }
)

it(
  "transition.style(name, value) recycles tweens ",
  "<h1 id='one' style='color:#f0f;'></h1><h1 id='two' style='color:#f0f;'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const t = selectAll([one, two]).transition().style("color", "red")
    assert.strictEqual(one.__transition[t._id].tween, two.__transition[t._id].tween)
  }
)

it("transition.style(name, value) constructs an interpolator using the current value on start", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("red", "blue")
  const s = select(root)
  s.transition()
    .on("start", () => {
      s.style("color", "red")
    })
    .style("color", () => "blue")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.style(name, null) creates an tween which removes the specified style post-start", async () => {
  const root = document.documentElement
  const started = () => assert.strictEqual(root.style.getPropertyValue("color"), "red")
  const s = select(root).style("color", "red")
  s.transition().style("color", null).on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("color"), "")
      resolve()
    })
  )
})

it("transition.style(name, null) creates an tween which removes the specified style post-start", async () => {
  const root = document.documentElement
  const started = () => assert.strictEqual(root.style.getPropertyValue("color"), "red")
  const selection = select(root).style("color", "red")
  selection
    .transition()
    .style("color", () => null)
    .on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("color"), "")
      resolve()
    })
  )
})

it("transition.style(name, value) creates an tween which removes the specified style post-start if the specified function returns null", async () => {
  const root = document.documentElement
  const started = () => assert.strictEqual(root.style.getPropertyValue("color"), "red")
  const selection = select(root).style("color", "red")
  selection
    .transition()
    .style("color", function () {})
    .on("start", started)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("color"), "")
      resolve()
    })
  )
})

it("transition.style(name, constant) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const selection = select(root).style("opacity", 1)
  selection.transition().style("opacity", 1)
  timeout(() => {
    root.style.opacity = 0.5
  }, 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("opacity"), "0.5")
      resolve()
    }, 250)
  )
})

it("transition.style(name, function) is a noop if the string-coerced value matches the current value on tween initialization", async () => {
  const root = document.documentElement
  const selection = select(root).style("opacity", 1)
  selection.transition().style("opacity", function () {
    return 1
  })
  timeout(() => {
    root.style.opacity = 0.5
  }, 125)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("opacity"), "0.5")
      resolve()
    }, 250)
  )
})

it("transition.style(name, value) interpolates numbers", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateNumber(0, 1)
  const s = select(root).style("opacity", 0)
  s.transition().style("opacity", 1)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("opacity"), interpolate(ease(elapsed / duration)) + "")
      resolve()
    }, 125)
  )
})

it("transition.style(name, constant) uses interpolateNumber if value is a number", async () => {
  const root = document.documentElement
  const s = select(root).style("font-size", "15px")
  s.transition().style("font-size", 10)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("font-size"), "15px") // ignores NaN
      resolve()
    }, 125)
  )
})

it("transition.style(name, function) uses interpolateNumber if value is a number", async () => {
  const root = document.documentElement
  const s = select(root).style("font-size", "15px")
  s.transition().style("font-size", () => 10)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("font-size"), "15px") // ignores NaN
      resolve()
    }, 125)
  )
})

it("transition.style(name, value) interpolates strings", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateString("1px", "2px")
  const s = select(root).style("font-size", "1px")
  s.transition().style("font-size", "2px")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("font-size"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.style(name, value) interpolates colors", async () => {
  const root = document.documentElement
  const ease = easeCubic
  const duration = 250
  const interpolate = interpolateRgb("#f00", "#00f")
  const s = select(root).style("color", "#f00")
  s.transition().style("color", "#00f")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / duration)))
      resolve()
    }, 125)
  )
})

it("transition.style(name, value) creates an styleTween with the specified name", async () => {
  const root = document.documentElement
  const s = select(root).style("color", "red")
  const t = s.transition().style("color", "blue")
  assert.strictEqual(t.styleTween("color").call(root).call(root, 0.5), "rgb(128, 0, 128)")
})

it('transition.style(name, value) creates a tween with the name "style.name"', async () => {
  const root = document.documentElement
  const s = select(root).style("color", "red")
  const t = s.transition().style("color", "blue")
  t.tween("style.color").call(root).call(root, 0.5)
  assert.strictEqual(root.style.getPropertyValue("color"), "rgb(128, 0, 128)")
})
import assert from "assert"
import { easeCubic } from "d3-ease"
import { interpolateHcl } from "d3-interpolate"
import { select, selectAll } from "d3-selection"
import { now, timeout } from "d3-timer"
import "../../src/index.js"
import { ENDING } from "../../src/transition/schedule.js"
import it from "../jsdom.js"

it("transition.styleTween(name, value) defines a style tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const ease = easeCubic
  select(root)
    .transition()
    .styleTween("color", () => interpolate)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.deepStrictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / 250)))
      assert.deepStrictEqual(root.style.getPropertyPriority("color"), "")
      resolve()
    }, 125)
  )
})

it("transition.styleTween(name, value, priority) defines a style tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const ease = easeCubic
  select(root)
    .transition()
    .styleTween("color", () => interpolate, "important")
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.deepStrictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / 250)))
      assert.deepStrictEqual(root.style.getPropertyPriority("color"), "important")
      resolve()
    }, 125)
  )
})

it(
  "transition.styleTween(name, value) invokes the value function with the expected context and arguments",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const result = []
    selectAll([one, two])
      .data(["one", "two"])
      .transition()
      .styleTween("color", function (d, i, nodes) {
        result.push([d, i, nodes, this])
      })
    await new Promise(resolve => timeout(resolve))
    assert.deepStrictEqual(result, [
      ["one", 0, [one, two], one],
      ["two", 1, [one, two], two],
    ])
  }
)

it("transition.styleTween(name, value) passes the eased time to the interpolator", async () => {
  const root = document.documentElement
  const then = now()
  const duration = 250
  const ease = easeCubic
  const t = select(root)
    .transition()
    .styleTween("color", () => interpolate)
  const schedule = root.__transition[t._id]
  function interpolate(t) {
    assert.strictEqual(this, root)
    assert.strictEqual(t, schedule.state === ENDING ? 1 : ease((now() - then) / duration))
  }
  await t.end()
})

it("transition.styleTween(name, value) allows the specified function to return null for a noop", async () => {
  const root = document.documentElement
  const s = select(root).style("color", "red")
  s.transition().styleTween("color", () => {})
  await new Promise(resolve =>
    timeout(() => {
      assert.deepStrictEqual(root.style.getPropertyValue("color"), "red")
      resolve()
    }, 125)
  )
})

it("transition.styleTween(name, value) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const ease = easeCubic
  select(root)
    .transition()
    .styleTween(
      {
        toString() {
          return "color"
        },
      },
      () => interpolate
    )
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.deepStrictEqual(root.style.getPropertyValue("color"), interpolate(ease(elapsed / 250)))
      resolve()
    }, 125)
  )
})

it("transition.styleTween(name, value) throws an error if value is not null and not a function", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.styleTween("color", 42)
  })
})

it("transition.styleTween(name, null) removes the specified style tween", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const t = select(root)
    .transition()
    .styleTween("color", () => interpolate)
    .styleTween("color", null)
  assert.strictEqual(t.styleTween("color"), null)
  assert.strictEqual(t.tween("style.color"), null)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(root.style.getPropertyValue("color"), "")
      resolve()
    }, 125)
  )
})

it("transition.styleTween(name) returns the style tween with the specified name", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const tween = () => interpolate
  const started = () => {
    assert.strictEqual(t.styleTween("color"), tween)
  }
  const ended = () => {
    assert.strictEqual(t.styleTween("color"), tween)
  }
  const t = select(root).transition().styleTween("color", tween).on("start", started).on("end", ended)
  assert.strictEqual(t.styleTween("color"), tween)
  assert.strictEqual(t.styleTween("bar"), null)
  await t.end()
})

it("transition.styleTween(name) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const tween = () => {}
  const t = select(root).transition().styleTween("color", tween)
  assert.strictEqual(
    t.styleTween({
      toString() {
        return "color"
      },
    }),
    tween
  )
})
import assert from "assert"
import { select, selectAll } from "d3-selection"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.text(value) creates a tween to set the text content to the specified value post-start", async () => {
  const root = document.documentElement
  const s = select(root)
  const t = s.transition().text("hello")

  await new Promise(resolve =>
    t.on("start", () => {
      assert.strictEqual(root.textContent, "")
      resolve()
    })
  )

  assert.strictEqual(root.textContent, "hello")
})

it("transition.text(value) creates a tween to set the text content to the value returned by the specified function post-start", async () => {
  const root = document.documentElement
  const s = select(root)
  const t = s.transition().text(() => "hello")

  await new Promise(resolve =>
    t.on("start", () => {
      assert.strictEqual(root.textContent, "")
      resolve()
    })
  )

  assert.strictEqual(root.textContent, "hello")
})

it(
  "transition.text(value) immediately evaluates the specified function with the expected context and arguments",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).data(["red", "green"])
    const result = []
    const t = s.transition().text(function (d, i, nodes) {
      result.push([d, i, nodes, this])
      return d
    })

    assert.deepStrictEqual(result, [
      ["red", 0, [one, two], one],
      ["green", 1, [one, two], two],
    ])

    await new Promise(resolve => t.on("start", resolve))
    assert.strictEqual(one.textContent, "red")
    assert.strictEqual(two.textContent, "green")
  }
)

it('transition.text(value) creates a tween with the name "text"', () => {
  const root = document.documentElement
  const s = select(root)
  const t = s.transition().text("hello")
  assert.strictEqual(t.tween("text").call(root), undefined)
  assert.strictEqual(root.textContent, "hello")
})
import assert from "assert"
import { easeCubic } from "d3-ease"
import { interpolateHcl } from "d3-interpolate"
import { select } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.textTween(value) defines a text tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  const interpolate = interpolateHcl("red", "blue")
  const ease = easeCubic
  select(root)
    .transition()
    .textTween(() => interpolate)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.deepStrictEqual(root.textContent, interpolate(ease(elapsed / 250)))
      resolve()
    }, 125)
  )
})

it("transition.textTween() returns the existing text tween", () => {
  const root = document.documentElement
  const factory = () => {}
  const t = select(root).transition().textTween(factory)
  assert.strictEqual(t.textTween(), factory)
})

it("transition.textTween(null) removes an existing text tween", () => {
  const root = document.documentElement
  const factory = () => {}
  const t = select(root).transition().textTween(factory)
  t.textTween(undefined)
  assert.strictEqual(t.textTween(), null)
})
import assert from "assert"
import { select } from "d3-selection"
import { timeout } from "d3-timer"
import "../../src/index.js"
import it from "../jsdom.js"

it("transition.transition() allows preceeding transitions with zero duration to end naturally", async () => {
  let end0 = false
  let end1 = false
  let end2 = false
  const s = select(document.documentElement)
  const t = s
    .transition()
    .duration(0)
    .on("end", () => {
      end0 = true
    })
  s.transition()
    .duration(0)
    .on("end", () => {
      end1 = true
    })
  t.transition()
    .duration(0)
    .on("end", () => {
      end2 = true
    })
  await new Promise(resolve => timeout(resolve, 50))
  assert.strictEqual(end0, true)
  assert.strictEqual(end1, true)
  assert.strictEqual(end2, true)
})
import assert from "assert"
import { easeCubic } from "d3-ease"
import { select, selectAll } from "d3-selection"
import { now, timeout } from "d3-timer"
import "../../src/index.js"
import { ENDING } from "../../src/transition/schedule.js"
import it from "../jsdom.js"

it("transition.tween(name, value) defines an tween using the interpolator returned by the specified function", async () => {
  const root = document.documentElement
  let value
  const interpolate = t => {
    value = t
  }
  select(root)
    .transition()
    .tween("foo", () => interpolate)
  await new Promise(resolve =>
    timeout(elapsed => {
      assert.strictEqual(value, easeCubic(elapsed / 250))
      resolve()
    }, 125)
  )
})

it(
  "transition.tween(name, value) invokes the value function with the expected context and arguments",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const result = []
    selectAll([one, two])
      .data(["one", "two"])
      .transition()
      .tween("foo", function (d, i, nodes) {
        result.push([d, i, nodes, this])
      })
    await new Promise(resolve => timeout(resolve))
    assert.deepStrictEqual(result, [
      ["one", 0, [one, two], one],
      ["two", 1, [one, two], two],
    ])
  }
)

it("transition.tween(name, value) passes the eased time to the interpolator", async () => {
  const root = document.documentElement
  const then = now()
  const duration = 250
  const ease = easeCubic
  const t = select(root)
    .transition()
    .tween("foo", () => interpolate)
  const schedule = root.__transition[t._id]
  function interpolate(t) {
    assert.strictEqual(this, root)
    assert.strictEqual(t, schedule.state === ENDING ? 1 : ease((now() - then) / duration))
  }
  await t.end()
})

it("transition.tween(name, value) allows the specified function to return null for a noop", async () => {
  const root = document.documentElement
  const s = select(root)
  s.transition().tween("foo", () => {})
})

it(
  "transition.tween(name, value) uses copy-on-write to apply changes",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const foo = () => {}
    const bar = () => {}
    const t = selectAll([one, two]).transition()
    const schedule1 = one.__transition[t._id]
    const schedule2 = two.__transition[t._id]
    t.tween("foo", foo)
    assert.deepStrictEqual(schedule1.tween, [{ name: "foo", value: foo }])
    assert.strictEqual(schedule2.tween, schedule1.tween)
    t.tween("foo", bar)
    assert.deepStrictEqual(schedule1.tween, [{ name: "foo", value: bar }])
    assert.strictEqual(schedule2.tween, schedule1.tween)
    select(two).transition(t).tween("foo", foo)
    assert.deepStrictEqual(schedule1.tween, [{ name: "foo", value: bar }])
    assert.deepStrictEqual(schedule2.tween, [{ name: "foo", value: foo }])
  }
)

it(
  "transition.tween(name, value) uses copy-on-write to apply removals",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  async () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const foo = () => {}
    const t = selectAll([one, two]).transition()
    const schedule1 = one.__transition[t._id]
    const schedule2 = two.__transition[t._id]
    t.tween("foo", foo)
    assert.deepStrictEqual(schedule1.tween, [{ name: "foo", value: foo }])
    assert.strictEqual(schedule2.tween, schedule1.tween)
    t.tween("bar", null)
    assert.deepStrictEqual(schedule1.tween, [{ name: "foo", value: foo }])
    assert.strictEqual(schedule2.tween, schedule1.tween)
    t.tween("foo", null)
    assert.deepStrictEqual(schedule1.tween, [])
    assert.strictEqual(schedule2.tween, schedule1.tween)
    select(two).transition(t).tween("foo", foo)
    assert.deepStrictEqual(schedule1.tween, [])
    assert.deepStrictEqual(schedule2.tween, [{ name: "foo", value: foo }])
  }
)

it("transition.tween(name, value) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const tween = () => {}
  const t = select(root)
    .transition()
    .tween(
      {
        toString() {
          return "foo"
        },
      },
      tween
    )
  assert.strictEqual(t.tween("foo"), tween)
})

it("transition.tween(name) coerces the specified name to a string", async () => {
  const root = document.documentElement
  const tween = () => {}
  const t = select(root).transition().tween("foo", tween)
  assert.strictEqual(
    t.tween({
      toString() {
        return "foo"
      },
    }),
    tween
  )
})

it("transition.tween(name, value) throws an error if value is not null and not a function", async () => {
  const root = document.documentElement
  const t = select(root).transition()
  assert.throws(() => {
    t.tween("foo", 42)
  })
})

it("transition.tween(name, null) removes the specified tween", async () => {
  const root = document.documentElement
  let frames = 0
  const interpolate = () => {
    ++frames
  }
  const t = select(root)
    .transition()
    .tween("foo", () => interpolate)
    .tween("foo", null)
  assert.strictEqual(t.tween("foo"), null)
  await new Promise(resolve =>
    timeout(() => {
      assert.strictEqual(frames, 0)
      resolve()
    }, 125)
  )
})

it("transition.tween(name) returns the tween with the specified name", async () => {
  const root = document.documentElement
  const tween = () => {}
  const started = () => {
    assert.strictEqual(t.tween("foo"), tween)
  }
  const ended = () => {
    assert.strictEqual(t.tween("foo"), tween)
  }
  const t = select(root).transition().tween("foo", tween).on("start", started).on("end", ended)
  assert.strictEqual(t.tween("foo"), tween)
  assert.strictEqual(t.tween("bar"), null)
  await t.end()
})
