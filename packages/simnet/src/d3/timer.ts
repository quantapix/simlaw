let head: any
let tail: any

export class Timer {
  _call: any = null
  _time: any = null
  _next: any = null
  restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function")
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay)
    if (!this._next && tail !== this) {
      if (tail) tail._next = this
      else head = this
      tail = this
    }
    this._call = callback
    this._time = time
    sleep()
  }
  stop() {
    if (this._call) {
      this._call = null
      this._time = Infinity
      sleep()
    }
  }
}

export function interval(callback, delay, time) {
  let t = new Timer(),
    total = delay
  if (delay == null) return t.restart(callback, delay, time), t
  t._restart = t.restart
  t.restart = function (callback, delay, time) {
    ;(delay = +delay), (time = time == null ? now() : +time)
    t._restart(
      function tick(x) {
        x += total
        t._restart(tick, (total += delay), time)
        callback(x)
      },
      delay,
      time
    )
  }
  t.restart(callback, delay, time)
  return t
}

export function timeout(callback, delay, time) {
  const t = new Timer()
  delay = delay == null ? 0 : +delay
  t.restart(
    x => {
      t.stop()
      callback(x + delay)
    },
    delay,
    time
  )
  return t
}

const pokeDelay = 1000,
  clock = typeof performance === "object" ? performance : Date,
  setFrame =
    typeof window === "object" && window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : function (f) {
          setTimeout(f, 17)
        }
let frame = 0,
  clockTimeout: any = 0,
  clockInterval: any = 0,
  clockLast = 0,
  clockNow = 0,
  clockSkew = 0

export function now() {
  return clockNow || (setFrame(clearNow), (clockNow = clock.now() + clockSkew))
}

function clearNow() {
  clockNow = 0
}

export function timer(callback, delay, time) {
  const t = new Timer()
  t.restart(callback, delay, time)
  return t
}

export function timerFlush() {
  now()
  ++frame
  let t = head,
    e
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e)
    t = t._next
  }
  --frame
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew
  frame = clockTimeout = 0
  try {
    timerFlush()
  } finally {
    frame = 0
    nap()
    clockNow = 0
  }
}

function poke() {
  const now = clock.now(),
    delay = now - clockLast
  if (delay > pokeDelay) (clockSkew -= delay), (clockLast = now)
}

function nap() {
  let t0,
    t1 = head,
    t2,
    time = Infinity
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time
      ;(t0 = t1), (t1 = t1._next)
    } else {
      ;(t2 = t1._next), (t1._next = null)
      t1 = t0 ? (t0._next = t2) : (head = t2)
    }
  }
  tail = t0
  sleep(time)
}

function sleep(time?) {
  if (frame) return
  if (clockTimeout) clockTimeout = clearTimeout(clockTimeout)
  const delay = time - clockNow
  if (delay > 24) {
    if (time < Infinity) clockTimeout = setTimeout(wake, time - clock.now() - clockSkew)
    if (clockInterval) clockInterval = clearInterval(clockInterval)
  } else {
    if (!interval) (clockLast = clock.now()), (clockInterval = setInterval(poke, pokeDelay))
    ;(frame = 1), setFrame(wake)
  }
}
