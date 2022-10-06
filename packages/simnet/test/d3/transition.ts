import assert from "assert";
import {select} from "d3-selection";
import {timeout} from "d3-timer";
import {active} from "../src/index.js";
import it from "./jsdom.js";

it("active(node) returns null if the specified node has no active transition with the null name", async () => {
  const root = document.documentElement;
  const s = select(root);

  // No transitions pending.
  assert.strictEqual(active(root), null);

  // Two transitions created.
  s.transition().delay(50).duration(50);
  s.transition("foo").duration(50);
  assert.strictEqual(active(root), null);

  // One transition scheduled; one active with a different name.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root), null);
    resolve();
  }));

  // No transitions remaining after the transition ends.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root), null);
    resolve();
  }, 100));
});

it("active(node, null) returns null if the specified node has no active transition with the null name", async () => {
  const root = document.documentElement;
  const s = select(root);

  // No transitions pending.
  assert.strictEqual(active(root, null), null);

  // Two transitions created.
  s.transition().delay(50).duration(50);
  s.transition("foo").duration(50);
  assert.strictEqual(active(root, null), null);

  // One transition scheduled; one active with a different name.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, null), null);
    resolve();
  }));

  // No transitions remaining after the transition ends.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, null), null);
    resolve();
  }, 100));
});

it("active(node, undefined) returns null if the specified node has no active transition with the null name", async () => {
  const root = document.documentElement;
  const s = select(root);

  // No transitions pending.
  assert.strictEqual(active(root, undefined), null);

  // Two transitions created.
  s.transition().delay(50).duration(50);
  s.transition("foo").duration(50);
  assert.strictEqual(active(root, undefined), null);

  // One transition scheduled; one active with a different name.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, undefined), null);
    resolve();
  }));

  // No transitions remaining after the transition ends.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, undefined), null);
    resolve();
  }, 100));
});

it("active(node, name) returns null if the specified node has no active transition with the specified name", async () => {
  const root = document.documentElement;
  const s = select(root);

  // No transitions pending.
  assert.strictEqual(active(root, "foo"), null);

  // Two transitions created.
  s.transition("foo").delay(50).duration(50);
  s.transition().duration(50);
  assert.strictEqual(active(root, null), null);

  // One transition scheduled; one active with a different name.
  assert.strictEqual(active(root, "foo"), null);

  // One transition scheduled.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, "foo"), null);
    resolve();
  }));

  // No transitions remaining after the transition ends.
  await new Promise(resolve => timeout(() => {
    assert.strictEqual(active(root, "foo"), null);
    resolve();
  }, 100));
});

it("active(node) returns the active transition on the specified node with the null name", async () => {
  const root = document.documentElement;
  const s = select(root);
  const t = s.transition().on("start", check).tween("tween", tweened).on("end", check);

  function check() {
    const a = active(root);
    assert.deepStrictEqual(a._groups, [[root]]);
    assert.deepStrictEqual(a._parents, [null]);
    assert.strictEqual(a._name, null);
    assert.strictEqual(a._id, t._id);
  }

  function tweened() {
    check();
    return t => {
      if (t >= 1) check();
    };
  }

  await t.end();
});

it("active(node, name) returns the active transition on the specified node with the specified name", async () => {
  const root = document.documentElement;
  const s = select(root);
  const t = s.transition("foo").on("start", check).tween("tween", tweened).on("end", check);

  function check() {
    const a = active(root, "foo");
    assert.deepStrictEqual(a._groups, [[root]]);
    assert.deepStrictEqual(a._parents, [null]);
    assert.strictEqual(a._name, "foo");
    assert.strictEqual(a._id, t._id);
  }

  function tweened() {
    check();
    return t => {
      if (t >= 1) check();
    };
  }

  await t.end();
});
import assert from "assert";
import {select} from "d3-selection";
import {timeout} from "d3-timer";
import "../src/index.js";
import it from "./jsdom.js";

describe("with an uncaught error", () => {
  let listeners;

  beforeEach(() => {
    listeners = process.listeners("uncaughtException");
    process.removeAllListeners("uncaughtException");
    process.once("uncaughtException", () => {});
  });

  afterEach(() => {
    for (const listener of listeners) {
      process.on("uncaughtException", listener);
    }
  });

  it("transition.on(\"start\", error) terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().on("start", () => { throw new Error; });
    await new Promise(resolve => timeout(resolve));
    assert.strictEqual(root.__transition, undefined);
  });

  it("transition.on(\"start\", error) with delay terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().delay(50).on("start", () => { throw new Error; });
    await new Promise(resolve => timeout(resolve, 50));
    assert.strictEqual(root.__transition, undefined);
  });

  it("transition.tween(\"foo\", error) terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().tween("foo", () => { throw new Error; });
    await new Promise(resolve => timeout(resolve));
    assert.strictEqual(root.__transition, undefined);
  });

  it("transition.tween(\"foo\", error) with delay terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().delay(50).tween("foo", () => { throw new Error; });
    await new Promise(resolve => timeout(resolve, 50));
    assert.strictEqual(root.__transition, undefined);
  });

  it("transition.tween(\"foo\", deferredError) terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().duration(50).tween("foo", () => { return function(t) { if (t === 1) throw new Error; }; });
    await new Promise(resolve => timeout(resolve, 50));
    assert.strictEqual(root.__transition, undefined);
  });

  it("transition.on(\"end\", error) terminates the transition", async () => {
    const root = document.documentElement;
    const s = select(root);
    s.transition().delay(50).duration(50).on("end", () => { throw new Error; });
    await new Promise(resolve => timeout(resolve, 100));
    assert.strictEqual(root.__transition, undefined);
  });
});
import assert from "assert";
import {select} from "d3-selection";
import {interrupt} from "../src/index.js";
import it from "./jsdom.js";

it("interrupt(node) cancels any pending transitions on the specified node", () => {
  const root = document.documentElement;
  const s = select(root);
  const t1 = s.transition();
  const t2 = t1.transition();
  assert.strictEqual(t1._id in root.__transition, true);
  assert.strictEqual(t2._id in root.__transition, true);
  interrupt(root);
  assert.strictEqual(root.__transition, undefined);
});

it("selection.interrupt(name) only cancels pending transitions with the specified name", () => {
  const root = document.documentElement;
  const s = select(root);
  const t1 = s.transition("foo");
  const t2 = s.transition();
  assert.strictEqual(t1._id in root.__transition, true);
  assert.strictEqual(t2._id in root.__transition, true);
  interrupt(root, "foo");
  assert.strictEqual(t1._id in root.__transition, false);
  assert.strictEqual(t2._id in root.__transition, true);
});
import {JSDOM} from "jsdom";

export default function jsdomit(message, html, run) {
  if (arguments.length < 3) run = html, html = "";
  return it(message, async () => {
    try {
      const dom = new JSDOM(html);
      global.window = dom.window;
      global.document = dom.window.document;
      await run();
    } finally {
      delete global.window;
      delete global.document;
    }
  });
}
