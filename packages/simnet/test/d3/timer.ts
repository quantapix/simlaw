import assert from "assert"

export function assertInRange(actual, expectedMin, expectedMax) {
  assert(
    expectedMin <= actual && actual <= expectedMax,
    `${actual} should be in range of [${expectedMin}, ${expectedMax}]`
  )
}
import assert from "assert"
import { interval, now, timer } from "../src/index.js"
import { assertInRange } from "./asserts.js"

it("interval(callback) invokes the callback about every 17ms", end => {
  const then = now()
  let count = 0
  const t = interval(function () {
    if (++count > 10) {
      t.stop()
      assertInRange(now() - then, (17 - 5) * count, (17 + 5) * count)
      end()
    }
  })
})

it("interval(callback) invokes the callback until the timer is stopped", end => {
  let count = 0
  const t = interval(function () {
    if (++count > 2) {
      t.stop()
      end()
    }
  })
})

it("interval(callback, delay) invokes the callback about every delay milliseconds", end => {
  const then = now(),
    delay = 50,
    nows = [then]
  const t = interval(function () {
    if (nows.push(now()) > 10) {
      t.stop()
      nows.forEach(function (now, i) {
        assertInRange(now - then, delay * i - 20, delay * i + 20)
      })
      end()
    }
  }, delay)
})

it("interval(callback, delay, time) invokes the callback repeatedly after the specified delay relative to the given time", end => {
  const then = now() + 50,
    delay = 50
  const t = interval(
    function () {
      assertInRange(now() - then, delay - 10, delay + 10)
      t.stop()
      end()
    },
    delay,
    then
  )
})

it("interval(callback) uses the undefined context for the callback", end => {
  const t = interval(function () {
    assert.strictEqual(this, undefined)
    t.stop()
    end()
  })
})

it("interval(callback) passes the callback the elapsed time", end => {
  const then = now()
  const t = interval(function (elapsed) {
    assert.strictEqual(elapsed, now() - then)
    t.stop()
    end()
  }, 100)
})

it("interval(callback) returns a timer", end => {
  let count = 0
  const t = interval(function () {
    ++count
  })
  assert.strictEqual(t instanceof timer, true)
  t.stop()
  setTimeout(function () {
    assert.strictEqual(count, 0)
    end()
  }, 100)
})

it("interval(callback).restart restarts as an interval", end => {
  const then = now(),
    delay = 50,
    nows = [then]
  const callback = function () {
    if (nows.push(now()) > 10) {
      t.stop()
      nows.forEach(function (now, i) {
        assertInRange(now - then, delay * i - 20, delay * i + 20)
      })
      end()
    }
  }
  const t = interval(callback, delay)
  t.stop()
  t.restart(callback, delay)
})
import assert from "assert"
import { now } from "../src/index.js"
import { assertInRange } from "./asserts.js"

it("now() returns the same time when called repeatedly", end => {
  const then = now()
  assert(then > 0)
  assert.strictEqual(now(), then)
  end()
})

it("now() returns a different time when called after a timeout", end => {
  const then = now()
  assert(then > 0)
  setTimeout(() => {
    assertInRange(now() - then, 50 - 10, 50 + 10)
    end()
  }, 50)
})
import assert from "assert"
import { now, timeout, timer } from "../src/index.js"
import { assertInRange } from "./asserts.js"

it("timeout(callback) invokes the callback once", end => {
  let count = 0
  timeout(function () {
    assert.strictEqual(++count, 1)
    end()
  })
})

it("timeout(callback, delay) invokes the callback once after the specified delay", end => {
  const then = now(),
    delay = 50
  timeout(function () {
    assertInRange(now() - then, delay - 10, delay + 10)
    end()
  }, delay)
})

it("timeout(callback, delay, time) invokes the callback once after the specified delay relative to the given time", end => {
  const then = now() + 50,
    delay = 50
  timeout(
    function () {
      assertInRange(now() - then, delay - 10, delay + 10)
      end()
    },
    delay,
    then
  )
})

it("timeout(callback) uses the undefined context for the callback", end => {
  timeout(function () {
    assert.strictEqual(this, undefined)
    end()
  })
})

it("timeout(callback) passes the callback the elapsed time", end => {
  const then = now()
  timeout(function (elapsed) {
    assert.strictEqual(elapsed, now() - then)
    end()
  })
})

it("timeout(callback) returns a timer", end => {
  let count = 0
  const t = timeout(function () {
    ++count
  })
  assert.strictEqual(t instanceof timer, true)
  t.stop()
  setTimeout(function () {
    assert.strictEqual(count, 0)
    end()
  }, 100)
})
import assert from "assert"
import { now, timer, timerFlush } from "../src/index.js"
import { assertInRange } from "./asserts.js"

it("timer(callback) returns an instanceof timer", end => {
  const t = timer(() => {})
  assert.strictEqual(t instanceof timer, true)
  t.stop()
  end()
})

it("timer(callback) verifies that callback is a function", end => {
  assert.throws(() => {
    timer()
  }, TypeError)
  assert.throws(() => {
    timer("42")
  }, TypeError)
  assert.throws(() => {
    timer(null)
  }, TypeError)
  end()
})

it("timer(callback) invokes the callback about every 17ms", end => {
  const then = now()
  let count = 0
  const t = timer(function () {
    if (++count > 10) {
      t.stop()
      assertInRange(now() - then, (17 - 5) * count, (17 + 5) * count)
      end()
    }
  })
})

it("timer(callback) invokes the callback until the timer is stopped", end => {
  let count = 0
  const t = timer(function () {
    if (++count > 2) {
      t.stop()
      end()
    }
  })
})

it("timer(callback) uses the undefined context for the callback", end => {
  const t = timer(function () {
    assert.strictEqual(this, undefined)
    t.stop()
    end()
  })
})

it("timer(callback) passes the callback the elapsed time", end => {
  const then = now()
  let count = 0
  const t = timer(function (elapsed) {
    ++count
    assert.strictEqual(elapsed, now() - then)
    if (count > 10) {
      t.stop()
      end()
    }
  })
})

it("timer(callback, delay) first invokes the callback after the specified delay", end => {
  const then = now(),
    delay = 150
  const t = timer(function () {
    t.stop()
    assertInRange(now() - then, delay - 10, delay + 10)
    end()
  }, delay)
})

it("timer(callback, delay) computes the elapsed time relative to the delay", end => {
  const delay = 150
  const t = timer(function (elapsed) {
    t.stop()
    assertInRange(elapsed, 0, 10)
    end()
  }, delay)
})

it("timer(callback, delay, time) computes the effective delay relative to the specified time", end => {
  const delay = 150,
    skew = 200
  const t = timer(
    function (elapsed) {
      t.stop()
      assertInRange(elapsed, skew - delay + 17 - 10, skew - delay + 17 + 10)
      end()
    },
    delay,
    now() - skew
  )
})

it("timer(callback) invokes callbacks in scheduling order during synchronous flush", end => {
  const results = []
  const t0 = timer(function () {
    results.push(1)
    t0.stop()
  })
  const t1 = timer(function () {
    results.push(2)
    t1.stop()
  })
  const t2 = timer(function () {
    results.push(3)
    t2.stop()
  })
  timerFlush()
  assert.deepStrictEqual(results, [1, 2, 3])
  end()
})

it("timer(callback) invokes callbacks in scheduling order during asynchronous flush", end => {
  const results = []
  const t0 = timer(function () {
    results.push(1)
    t0.stop()
  })
  const t1 = timer(function () {
    results.push(2)
    t1.stop()
  })
  const t2 = timer(function () {
    results.push(3)
    t2.stop()
  })
  const t3 = timer(function () {
    t3.stop()
    assert.deepStrictEqual(results, [1, 2, 3])
    end()
  })
})

it("timer(callback, delay) invokes callbacks in scheduling order during asynchronous flush", end => {
  const then = now()
  let results
  const t0 = timer(
    function () {
      results = [1]
      t0.stop()
    },
    60,
    then
  )
  const t1 = timer(
    function () {
      if (results) results.push(2), t1.stop()
    },
    40,
    then
  )
  const t2 = timer(
    function () {
      if (results) results.push(3), t2.stop()
    },
    80,
    then
  )
  const t3 = timer(
    function () {
      t3.stop()
      assert.deepStrictEqual(results, [1, 2, 3])
      end()
    },
    100,
    then
  )
})

it("timer(callback) within a frame invokes the callback at the end of the same frame", end => {
  const then = now()
  const t0 = timer(function (elapsed1, now1) {
    const delay = now() - then
    const t1 = timer(
      function (elapsed2, now2) {
        t1.stop()
        assert.strictEqual(elapsed2, 0)
        assert.strictEqual(now2, now1)
        assertInRange(now() - then, delay, delay + 3)
        end()
      },
      0,
      now1
    )
    t0.stop()
  })
})

it("timer(callback, delay) within a timerFlush() does not request duplicate frames", end => {
  setTimeout(() => {
    const setTimeout0 = setTimeout
    let frames = 0

    now()

    setTimeout = function () {
      ++frames
      return setTimeout0.apply(this, arguments)
    }

    const t0 = timer(function () {
      assert.strictEqual(frames, 1)

      t0.stop()

      assert.strictEqual(frames, 1)

      const t1 = timer(function () {
        assert.strictEqual(frames, 1)

        t1.stop()

        assert.strictEqual(frames, 1)

        setTimeout0(function () {
          assert.strictEqual(frames, 1)

          setTimeout = setTimeout0
          end()
        }, 50)
      }, 1)

      assert.strictEqual(frames, 1)
    })

    assert.strictEqual(frames, 1)

    timerFlush()

    assert.strictEqual(frames, 1)
  }, 100)
})

it("timer(callback) switches to setTimeout for long delays", end => {
  setTimeout(() => {
    const setTimeout0 = setTimeout
    let frames = 0,
      timeouts = 0

    now()

    setTimeout = function (callback, delay) {
      delay === 17 ? ++frames : ++timeouts
      return setTimeout0.apply(this, arguments)
    }

    const t0 = timer(function () {
      assert.strictEqual(frames, 1)
      assert.strictEqual(timeouts, 1)

      t0.stop()

      assert.strictEqual(frames, 1)
      assert.strictEqual(timeouts, 1)

      const t1 = timer(function () {
        assert.strictEqual(frames, 2)
        assert.strictEqual(timeouts, 1)

        t1.stop()

        assert.strictEqual(frames, 2)
        assert.strictEqual(timeouts, 1)

        setTimeout0(function () {
          assert.strictEqual(frames, 2)
          assert.strictEqual(timeouts, 1)

          setTimeout = setTimeout0
          end()
        }, 50)
      }, 1)

      assert.strictEqual(frames, 1)
      assert.strictEqual(timeouts, 1)
    }, 100)

    assert.strictEqual(frames, 1)
    assert.strictEqual(timeouts, 0)
  }, 100)
})

it("timer.stop() immediately stops the timer", end => {
  let count = 0
  const t = timer(function () {
    ++count
  })
  setTimeout(function () {
    t.stop()
    assert.strictEqual(count, 1)
    end()
  }, 24)
})

it("timer.stop() recomputes the new wake time after one frame", end => {
  setTimeout(() => {
    const setTimeout0 = setTimeout
    const delays = []

    now()

    setTimeout = function (callback, delay) {
      delays.push(delay)
      return setTimeout0.apply(this, arguments)
    }

    const t0 = timer(function () {}, 1000)
    const t1 = timer(function () {}, 500)
    setTimeout0(function () {
      assert.strictEqual(delays.length, 2)
      assert.strictEqual(delays[0], 17)
      assertInRange(delays[1], 500 - 17 - 10, 500 - 17 + 10)

      t1.stop()

      assert.strictEqual(delays.length, 3)
      assert.strictEqual(delays[2], 17)

      setTimeout0(function () {
        assert.strictEqual(delays.length, 4)
        assertInRange(delays[3], 1000 - 100 - 17 * 1.5 - 10, 1000 - 100 - 17 * 1.5 + 10)

        t0.stop()

        setTimeout0(function () {
          assert.strictEqual(delays.length, 5)
          assert.strictEqual(delays[4], 17)

          setTimeout = setTimeout0
          end()
        }, 100)
      }, 100)
    }, 100)
  }, 100)
})

it("timer.restart(callback) verifies that callback is a function", end => {
  const t = timer(function () {})
  assert.throws(function () {
    t.restart()
  }, TypeError)
  assert.throws(function () {
    t.restart(null)
  }, TypeError)
  assert.throws(function () {
    t.restart("42")
  }, TypeError)
  t.stop()
  end()
})

it("timer.restart(callback) implicitly uses zero delay and the current time", end => {
  const t = timer(function () {}, 1000)
  t.restart(function (elapsed) {
    assertInRange(elapsed, 17 - 10, 17 + 10)
    t.stop()
    end()
  })
})

it("timer.restart(callback, delay, time) recomputes the new wake time after one frame", end => {
  setTimeout(() => {
    const then = now()
    const setTimeout0 = setTimeout
    const delays = []

    setTimeout = function (callback, delay) {
      delays.push(delay)
      return setTimeout0.apply(this, arguments)
    }

    const t = timer(function () {}, 500, then)
    setTimeout0(function () {
      assert.strictEqual(delays.length, 2)
      assert.strictEqual(delays[0], 17)
      assertInRange(delays[1], 500 - 17 - 10, 500 - 17 + 10)

      t.restart(function () {}, 1000, then)

      assert.strictEqual(delays.length, 3)
      assert.strictEqual(delays[2], 17)

      setTimeout0(function () {
        assert.strictEqual(delays.length, 4)
        assertInRange(delays[3], 1000 - 100 - 17 * 1.5 - 10, 1000 - 100 - 17 * 1.5 + 10)

        t.stop()

        setTimeout0(function () {
          assert.strictEqual(delays.length, 5)
          assert.strictEqual(delays[4], 17)

          setTimeout = setTimeout0
          end()
        }, 100)
      }, 100)
    }, 100)
  }, 100)
})

it("timer.stop() immediately followed by restart() doesn’t cause an infinite loop", end => {
  const t = timer(function () {})
  let last
  t.stop()
  t.restart(function (elapsed) {
    if (!last) return (last = elapsed)
    if (elapsed === last) assert.fail("repeated invocation")
    t.stop()
  })
  end()
})

it("timer.stop() immediately followed by restart() doesn’t cause an infinite loop (2)", end => {
  const t0 = timer(function () {}),
    t1 = timer(function () {})
  let last
  t0.stop()
  t0.restart(function (elapsed) {
    if (!last) return (last = elapsed)
    if (elapsed === last) assert.fail("repeated invocation")
    t0.stop()
  })
  t1.stop()
  end()
})

it("timer.stop() clears the internal _next field after a timeout", end => {
  const t0 = timer(function () {}),
    t1 = timer(function () {})
  t0.stop()
  setTimeout(function () {
    assert.strictEqual(!t0._next, true)
    t1.stop()
    end()
  }, 100)
})
import assert from "assert"
import { now, timer, timerFlush } from "../src/index.js"

it("timerFlush() immediately invokes any eligible timers", end => {
  let count = 0
  const t = timer(function () {
    ++count
    t.stop()
  })
  timerFlush()
  timerFlush()
  assert.strictEqual(count, 1)
  end()
})

it("timerFlush() within timerFlush() still executes all eligible timers", end => {
  let count = 0
  const t = timer(function () {
    if (++count >= 3) t.stop()
    timerFlush()
  })
  timerFlush()
  assert.strictEqual(count, 3)
  end()
})

it("timerFlush() observes the current time", end => {
  const start = now()
  let foos = 0,
    bars = 0,
    bazs = 0
  const foo = timer(
    function () {
      ++foos
      foo.stop()
    },
    0,
    start + 1
  )
  const bar = timer(
    function () {
      ++bars
      bar.stop()
    },
    0,
    start
  )
  const baz = timer(
    function () {
      ++bazs
      baz.stop()
    },
    0,
    start - 1
  )
  timerFlush()
  assert.strictEqual(foos, 0)
  assert.strictEqual(bars, 1)
  assert.strictEqual(bazs, 1)
  end()
})
