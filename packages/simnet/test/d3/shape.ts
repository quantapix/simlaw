import assert from "assert";
import {arc} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("arc().innerRadius(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().innerRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().outerRadius(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().outerRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().cornerRadius(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().outerRadius(100).cornerRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().startAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().startAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().endAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().endAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().padAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().outerRadius(100).startAngle(Math.PI / 2).padAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().padRadius(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().outerRadius(100).startAngle(Math.PI / 2).padAngle(0.1).padRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().centroid(…) computes the midpoint of the center line of the arc", () => {
  const a = arc(), round = function(x) { return Math.round(x * 1e6) / 1e6; };
  assert.deepStrictEqual(a.centroid({innerRadius: 0, outerRadius: 100, startAngle: 0, endAngle: Math.PI}).map(round), [50, 0]);
  assert.deepStrictEqual(a.centroid({innerRadius: 0, outerRadius: 100, startAngle: 0, endAngle: Math.PI / 2}).map(round), [35.355339, -35.355339]);
  assert.deepStrictEqual(a.centroid({innerRadius: 50, outerRadius: 100, startAngle: 0, endAngle: -Math.PI}).map(round), [-75, -0]);
  assert.deepStrictEqual(a.centroid({innerRadius: 50, outerRadius: 100, startAngle: 0, endAngle: -Math.PI / 2}).map(round), [-53.033009, -53.033009]);
});

it("arc().innerRadius(f).centroid(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().innerRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).centroid.apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().outerRadius(f).centroid(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().outerRadius(function() { actual = {that: this, args: [].slice.call(arguments)}; }).centroid.apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().startAngle(f).centroid(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().startAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).centroid.apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().endAngle(f).centroid(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  arc().endAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).centroid.apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("arc().innerRadius(0).outerRadius(0) renders a point", () => {
  const a = arc().innerRadius(0).outerRadius(0);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,0Z");
  assertPathEqual(a.startAngle(0).endAngle(0)(), "M0,0Z");
});

it("a negative angle span proceeds anticlockwise", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-Math.PI/2)(), "M0,-100A100,100,0,0,0,-100,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders a clockwise circle if r > 0 and θ₁ - θ₀ ≥ τ", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100Z");
  assertPathEqual(a.startAngle(-3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders an anticlockwise circle if r > 0 and θ₀ - θ₁ ≥ τ", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-2 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100Z");
  assertPathEqual(a.startAngle(3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100Z");
});

// Note: The outer ring starts and ends at θ₀, but the inner ring starts and ends at θ₁.
// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders a clockwise annulus if r₀ > 0, r₁ > 0 and θ₀ - θ₁ ≥ τ", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,50A50,50,0,1,0,0,-50A50,50,0,1,0,0,50Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100M0,50A50,50,0,1,0,0,-50A50,50,0,1,0,0,50Z");
  assertPathEqual(a.startAngle(-3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
});

// Note: The outer ring starts and ends at θ₀, but the inner ring starts and ends at θ₁.
// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders an anticlockwise annulus if r₀ > 0, r₁ > 0 and θ₁ - θ₀ ≥ τ", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-2 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,50A50,50,0,1,1,0,-50A50,50,0,1,1,0,50Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100M0,50A50,50,0,1,1,0,-50A50,50,0,1,1,0,50Z");
  assertPathEqual(a.startAngle(3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders a small clockwise sector if r > 0 and π > θ₁ - θ₀ ≥ 0", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(Math.PI / 2)(), "M0,-100A100,100,0,0,1,100,0L0,0Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(5 * Math.PI / 2)(), "M0,-100A100,100,0,0,1,100,0L0,0Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(-Math.PI / 2)(), "M0,100A100,100,0,0,1,-100,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders a small anticlockwise sector if r > 0 and π > θ₀ - θ₁ ≥ 0", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-Math.PI / 2)(), "M0,-100A100,100,0,0,0,-100,0L0,0Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-5 * Math.PI / 2)(), "M0,-100A100,100,0,0,0,-100,0L0,0Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(Math.PI / 2)(), "M0,100A100,100,0,0,0,100,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders a large clockwise sector if r > 0 and τ > θ₁ - θ₀ ≥ π", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI / 2)(), "M0,-100A100,100,0,1,1,-100,0L0,0Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(7 * Math.PI / 2)(), "M0,-100A100,100,0,1,1,-100,0L0,0Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI / 2)(), "M0,100A100,100,0,1,1,100,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁) renders a large anticlockwise sector if r > 0 and τ > θ₀ - θ₁ ≥ π", () => {
  const a = arc().innerRadius(0).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI / 2)(), "M0,-100A100,100,0,1,0,100,0L0,0Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-7 * Math.PI / 2)(), "M0,-100A100,100,0,1,0,100,0L0,0Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI / 2)(), "M0,100A100,100,0,1,0,-100,0L0,0Z");
});

// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders a small clockwise annular sector if r₀ > 0, r₁ > 0 and π > θ₁ - θ₀ ≥ 0", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(Math.PI / 2)(), "M0,-100A100,100,0,0,1,100,0L50,0A50,50,0,0,0,0,-50Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(5 * Math.PI / 2)(), "M0,-100A100,100,0,0,1,100,0L50,0A50,50,0,0,0,0,-50Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(-Math.PI / 2)(), "M0,100A100,100,0,0,1,-100,0L-50,0A50,50,0,0,0,0,50Z");
});

// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders a small anticlockwise annular sector if r₀ > 0, r₁ > 0 and π > θ₀ - θ₁ ≥ 0", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-Math.PI / 2)(), "M0,-100A100,100,0,0,0,-100,0L-50,0A50,50,0,0,1,0,-50Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-5 * Math.PI / 2)(), "M0,-100A100,100,0,0,0,-100,0L-50,0A50,50,0,0,1,0,-50Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(Math.PI / 2)(), "M0,100A100,100,0,0,0,100,0L50,0A50,50,0,0,1,0,50Z");
});

// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders a large clockwise annular sector if r₀ > 0, r₁ > 0 and τ > θ₁ - θ₀ ≥ π", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI / 2)(), "M0,-100A100,100,0,1,1,-100,0L-50,0A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(7 * Math.PI / 2)(), "M0,-100A100,100,0,1,1,-100,0L-50,0A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI / 2)(), "M0,100A100,100,0,1,1,100,0L50,0A50,50,0,1,0,0,50Z");
});

// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁) renders a large anticlockwise annular sector if r₀ > 0, r₁ > 0 and τ > θ₀ - θ₁ ≥ π", () => {
  const a = arc().innerRadius(50).outerRadius(100);
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI / 2)(), "M0,-100A100,100,0,1,0,100,0L50,0A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-7 * Math.PI / 2)(), "M0,-100A100,100,0,1,0,100,0L50,0A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI / 2)(), "M0,100A100,100,0,1,0,-100,0L-50,0A50,50,0,1,1,0,50Z");
});

it("arc().innerRadius(0).outerRadius(0).cornerRadius(r) renders a point", () => {
  const a = arc().innerRadius(0).outerRadius(0).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,0Z");
  assertPathEqual(a.startAngle(0).endAngle(0)(), "M0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a clockwise circle if r > 0 and θ₁ - θ₀ ≥ τ", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100Z");
  assertPathEqual(a.startAngle(-3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders an anticlockwise circle if r > 0 and θ₀ - θ₁ ≥ τ", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-2 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100Z");
  assertPathEqual(a.startAngle(3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100Z");
});

// Note: The outer ring starts and ends at θ₀, but the inner ring starts and ends at θ₁.
// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a clockwise annulus if r₀ > 0, r₁ > 0 and θ₀ - θ₁ ≥ τ", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(2 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,50A50,50,0,1,0,0,-50A50,50,0,1,0,0,50Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100M0,50A50,50,0,1,0,0,-50A50,50,0,1,0,0,50Z");
  assertPathEqual(a.startAngle(-3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,1,0,-100A100,100,0,1,1,0,100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
});

// Note: The outer ring starts and ends at θ₀, but the inner ring starts and ends at θ₁.
// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders an anticlockwise annulus if r₀ > 0, r₁ > 0 and θ₁ - θ₀ ≥ τ", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-2 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,50A50,50,0,1,1,0,-50A50,50,0,1,1,0,50Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(0)(), "M0,-100A100,100,0,1,0,0,100A100,100,0,1,0,0,-100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100M0,50A50,50,0,1,1,0,-50A50,50,0,1,1,0,50Z");
  assertPathEqual(a.startAngle(3 * Math.PI).endAngle(0)(), "M0,100A100,100,0,1,0,0,-100A100,100,0,1,0,0,100M0,-50A50,50,0,1,1,0,50A50,50,0,1,1,0,-50Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a small clockwise sector if r > 0 and π > θ₁ - θ₀ ≥ 0", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(5 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(-Math.PI / 2)(), "M0,94.868330A5,5,0,0,1,-5.263158,99.861400A100,100,0,0,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a small anticlockwise sector if r > 0 and π > θ₀ - θ₁ ≥ 0", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,0,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-5 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,0,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(Math.PI / 2)(), "M0,94.868330A5,5,0,0,0,5.263158,99.861400A100,100,0,0,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a large clockwise sector if r > 0 and τ > θ₁ - θ₀ ≥ π", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,1,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(7 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,1,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI / 2)(), "M0,94.868330A5,5,0,0,1,-5.263158,99.861400A100,100,0,1,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a large anticlockwise sector if r > 0 and τ > θ₀ - θ₁ ≥ π", () => {
  const a = arc().innerRadius(0).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,1,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-7 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,1,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L0,0Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI / 2)(), "M0,94.868330A5,5,0,0,0,5.263158,99.861400A100,100,0,1,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L0,0Z");
});

// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a small clockwise annular sector if r₀ > 0, r₁ > 0 and π > θ₁ - θ₀ ≥ 0", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L54.772256,0A5,5,0,0,1,49.792960,-4.545455A50,50,0,0,0,4.545455,-49.792960A5,5,0,0,1,0,-54.772256Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(5 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L54.772256,0A5,5,0,0,1,49.792960,-4.545455A50,50,0,0,0,4.545455,-49.792960A5,5,0,0,1,0,-54.772256Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(-Math.PI / 2)(), "M0,94.868330A5,5,0,0,1,-5.263158,99.861400A100,100,0,0,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L-54.772256,0A5,5,0,0,1,-49.792960,4.545455A50,50,0,0,0,-4.545455,49.792960A5,5,0,0,1,0,54.772256Z");
});

// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a small anticlockwise annular sector if r₀ > 0, r₁ > 0 and π > θ₀ - θ₁ ≥ 0", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,0,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L-54.772256,0A5,5,0,0,0,-49.792960,-4.545455A50,50,0,0,1,-4.545455,-49.792960A5,5,0,0,0,0,-54.772256Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-5 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,0,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L-54.772256,0A5,5,0,0,0,-49.792960,-4.545455A50,50,0,0,1,-4.545455,-49.792960A5,5,0,0,0,0,-54.772256Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(Math.PI / 2)(), "M0,94.868330A5,5,0,0,0,5.263158,99.861400A100,100,0,0,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L54.772256,0A5,5,0,0,0,49.792960,4.545455A50,50,0,0,1,4.545455,49.792960A5,5,0,0,0,0,54.772256Z");
});

// Note: The outer ring is clockwise, but the inner ring is anticlockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a large clockwise annular sector if r₀ > 0, r₁ > 0 and τ > θ₁ - θ₀ ≥ π", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(3 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,1,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L-54.772256,0A5,5,0,0,1,-49.792960,4.545455A50,50,0,1,0,4.545455,-49.792960A5,5,0,0,1,0,-54.772256Z");
  assertPathEqual(a.startAngle(2 * Math.PI).endAngle(7 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,1,1,-99.861400,5.263158A5,5,0,0,1,-94.868330,0L-54.772256,0A5,5,0,0,1,-49.792960,4.545455A50,50,0,1,0,4.545455,-49.792960A5,5,0,0,1,0,-54.772256Z");
  assertPathEqual(a.startAngle(-Math.PI).endAngle(Math.PI / 2)(), "M0,94.868330A5,5,0,0,1,-5.263158,99.861400A100,100,0,1,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L54.772256,0A5,5,0,0,1,49.792960,-4.545455A50,50,0,1,0,-4.545455,49.792960A5,5,0,0,1,0,54.772256Z");
});

// Note: The outer ring is anticlockwise, but the inner ring is clockwise.
it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).cornerRadius(rᵧ) renders a large anticlockwise annular sector if r₀ > 0, r₁ > 0 and τ > θ₀ - θ₁ ≥ π", () => {
  const a = arc().innerRadius(50).outerRadius(100).cornerRadius(5);
  assertPathEqual(a.startAngle(0).endAngle(-3 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,1,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L54.772256,0A5,5,0,0,0,49.792960,4.545455A50,50,0,1,1,-4.545455,-49.792960A5,5,0,0,0,0,-54.772256Z");
  assertPathEqual(a.startAngle(-2 * Math.PI).endAngle(-7 * Math.PI / 2)(), "M0,-94.868330A5,5,0,0,0,-5.263158,-99.861400A100,100,0,1,0,99.861400,5.263158A5,5,0,0,0,94.868330,0L54.772256,0A5,5,0,0,0,49.792960,4.545455A50,50,0,1,1,-4.545455,-49.792960A5,5,0,0,0,0,-54.772256Z");
  assertPathEqual(a.startAngle(Math.PI).endAngle(-Math.PI / 2)(), "M0,94.868330A5,5,0,0,0,5.263158,99.861400A100,100,0,1,0,-99.861400,-5.263158A5,5,0,0,0,-94.868330,0L-54.772256,0A5,5,0,0,0,-49.792960,-4.545455A50,50,0,1,1,4.545455,49.792960A5,5,0,0,0,0,54.772256Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).cornerRadius(rᵧ) restricts rᵧ to |r₁ - r₀| / 2", () => {
  const a = arc().cornerRadius(Infinity).startAngle(0).endAngle(Math.PI / 2);
  assertPathEqual(a.innerRadius(90).outerRadius(100)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L94.868330,0A5,5,0,0,1,89.875260,-4.736842A90,90,0,0,0,4.736842,-89.875260A5,5,0,0,1,0,-94.868330Z");
  assertPathEqual(a.innerRadius(100).outerRadius(90)(), "M0,-94.868330A5,5,0,0,1,5.263158,-99.861400A100,100,0,0,1,99.861400,-5.263158A5,5,0,0,1,94.868330,0L94.868330,0A5,5,0,0,1,89.875260,-4.736842A90,90,0,0,0,4.736842,-89.875260A5,5,0,0,1,0,-94.868330Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).cornerRadius(rᵧ) merges adjacent corners when rᵧ is relatively large", () => {
  const a = arc().cornerRadius(Infinity).startAngle(0).endAngle(Math.PI / 2);
  assertPathEqual(a.innerRadius(10).outerRadius(100)(), "M0,-41.421356A41.421356,41.421356,0,1,1,41.421356,0L24.142136,0A24.142136,24.142136,0,0,1,0,-24.142136Z");
  assertPathEqual(a.innerRadius(100).outerRadius(10)(), "M0,-41.421356A41.421356,41.421356,0,1,1,41.421356,0L24.142136,0A24.142136,24.142136,0,0,1,0,-24.142136Z");
});

it("arc().innerRadius(0).outerRadius(0).startAngle(0).endAngle(τ).padAngle(δ) does not pad a point", () => {
  const a = arc().innerRadius(0).outerRadius(0).startAngle(0).endAngle(2 * Math.PI).padAngle(0.1);
  assertPathEqual(a(), "M0,0Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(0).endAngle(τ).padAngle(δ) does not pad a circle", () => {
  const a = arc().innerRadius(0).outerRadius(100).startAngle(0).endAngle(2 * Math.PI).padAngle(0.1);
  assertPathEqual(a(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(0).endAngle(τ).padAngle(δ) does not pad an annulus", () => {
  const a = arc().innerRadius(50).outerRadius(100).startAngle(0).endAngle(2 * Math.PI).padAngle(0.1);
  assertPathEqual(a(), "M0,-100A100,100,0,1,1,0,100A100,100,0,1,1,0,-100M0,-50A50,50,0,1,0,0,50A50,50,0,1,0,0,-50Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).padAngle(δ) pads the outside of a circular sector", () => {
  const a = arc().innerRadius(0).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.1);
  assertPathEqual(a(), "M4.997917,-99.875026A100,100,0,0,1,99.875026,-4.997917L0,0Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).padAngle(δ) pads an annular sector", () => {
  const a = arc().innerRadius(50).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.1);
  assertPathEqual(a(), "M5.587841,-99.843758A100,100,0,0,1,99.843758,-5.587841L49.686779,-5.587841A50,50,0,0,0,5.587841,-49.686779Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).padAngle(δ) may collapse the inside of an annular sector", () => {
  const a = arc().innerRadius(10).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.2);
  assertPathEqual(a(), "M10.033134,-99.495408A100,100,0,0,1,99.495408,-10.033134L7.071068,-7.071068Z");
});

it("arc().innerRadius(0).outerRadius(r).startAngle(θ₀).endAngle(θ₁).padAngle(δ).cornerRadius(rᵧ) rounds and pads a circular sector", () => {
  const a = arc().innerRadius(0).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.1).cornerRadius(10);
  assertPathEqual(a(), "M4.470273,-89.330939A10,10,0,0,1,16.064195,-98.701275A100,100,0,0,1,98.701275,-16.064195A10,10,0,0,1,89.330939,-4.470273L0,0Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).padAngle(δ).cornerRadius(rᵧ) rounds and pads an annular sector", () => {
  const a = arc().innerRadius(50).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.1).cornerRadius(10);
  assertPathEqual(a(), "M5.587841,-88.639829A10,10,0,0,1,17.319823,-98.488698A100,100,0,0,1,98.488698,-17.319823A10,10,0,0,1,88.639829,-5.587841L57.939790,-5.587841A10,10,0,0,1,48.283158,-12.989867A50,50,0,0,0,12.989867,-48.283158A10,10,0,0,1,5.587841,-57.939790Z");
});

it("arc().innerRadius(r₀).outerRadius(r₁).startAngle(θ₀).endAngle(θ₁).padAngle(δ).cornerRadius(rᵧ) rounds and pads a collapsed annular sector", () => {
  const a = arc().innerRadius(10).outerRadius(100).startAngle(0).endAngle(Math.PI / 2).padAngle(0.2).cornerRadius(10);
  assertPathEqual(a(), "M9.669396,-88.145811A10,10,0,0,1,21.849183,-97.583878A100,100,0,0,1,97.583878,-21.849183A10,10,0,0,1,88.145811,-9.669396L7.071068,-7.071068Z");
});
import assert from "assert";
import {area, curveCardinal, curveLinear} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("area() returns a default area shape", () => {
  const a = area();
  assert.strictEqual(a.x0()([42, 34]), 42);
  assert.strictEqual(a.x1(), null);
  assert.strictEqual(a.y0()([42, 34]), 0);
  assert.strictEqual(a.y1()([42, 34]), 34);
  assert.strictEqual(a.defined()([42, 34]), true);
  assert.strictEqual(a.curve(), curveLinear);
  assert.strictEqual(a.context(), null);
  assertPathEqual(a([[0, 1], [2, 3], [4, 5]]), "M0,1L2,3L4,5L4,0L2,0L0,0Z");
});

it("area(x, y0, y1) sets x0, y0 and y1", () => {
  const x = function() {}, y = function() {};
  assert.strictEqual(area(x).x0(), x);
  assert.strictEqual(area(x, y).y0(), y);
  assert.strictEqual(area(x, 0, y).y1(), y);
  assert.strictEqual(area(3, 2, 1).x0()("aa"), 3);
  assert.strictEqual(area(3, 2, 1).y0()("aa"), 2);
  assert.strictEqual(area(3, 2, 1).y1()("aa"), 1);
});

it("area.x(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().x(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.x0(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().x0(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.x1(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().x1(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.y(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().y(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.y0(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().y0(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.y1(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().y1(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.defined(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  area().defined(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("area.x(x)(data) observes the specified function", () => {
  const x = function(d) { return d.x; };
  const a = area().x(x);
  assert.strictEqual(a.x(), x);
  assert.strictEqual(a.x0(), x);
  assert.strictEqual(a.x1(), null);
  assertPathEqual(a([{x: 0, 1: 1}, {x: 2, 1: 3}, {x: 4, 1: 5}]), "M0,1L2,3L4,5L4,0L2,0L0,0Z");
});

it("area.x(x)(data) observes the specified constant", () => {
  const x = 0;
  const a = area().x(x);
  assert.strictEqual(a.x()(), 0);
  assert.strictEqual(a.x0()(), 0);
  assert.strictEqual(a.x1(), null);
  assertPathEqual(a([{1: 1}, {1: 3}, {1: 5}]), "M0,1L0,3L0,5L0,0L0,0L0,0Z");
});

it("area.y(y)(data) observes the specified function", () => {
  const y = function(d) { return d.y; };
  const a = area().y(y);
  assert.strictEqual(a.y(), y);
  assert.strictEqual(a.y0(), y);
  assert.strictEqual(a.y1(), null);
  assertPathEqual(a([{0: 0, y: 1}, {0: 2, y: 3}, {0: 4, y: 5}]), "M0,1L2,3L4,5L4,5L2,3L0,1Z");
});

it("area.y(y)(data) observes the specified constant", () => {
  const a = area().y(0);
  assert.strictEqual(a.y()(), 0);
  assert.strictEqual(a.y0()(), 0);
  assert.strictEqual(a.y1(), null);
  assertPathEqual(a([{0: 0}, {0: 2}, {0: 4}]), "M0,0L2,0L4,0L4,0L2,0L0,0Z");
});

it("area.curve(curve) sets the curve method", () => {
  const a = area().curve(curveCardinal);
  assertPathEqual(a([[0, 1], [1, 3], [2, 1], [3, 3]]), "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3L3,0C3,0,2.333333,0,2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0,0,0,0Z");
});

it("area.curve(curveCardinal.tension(tension)) sets the cardinal spline tension", () => {
  const a = area().curve(curveCardinal.tension(0.1));
  assert.strictEqual(a([]), null);
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z");
  assertPathEqual(a([[0, 1], [1, 3]]), "M0,1L1,3L1,0L0,0Z");
  assertPathEqual(a([[0, 1], [1, 3], [2, 1]]), "M0,1C0,1,0.700000,3,1,3C1.300000,3,2,1,2,1L2,0C2,0,1.300000,0,1,0C0.700000,0,0,0,0,0Z");
  assertPathEqual(a([[0, 1], [1, 3], [2, 1], [3, 3]]), "M0,1C0,1,0.700000,3,1,3C1.300000,3,1.700000,1,2,1C2.300000,1,3,3,3,3L3,0C3,0,2.300000,0,2,0C1.700000,0,1.300000,0,1,0C0.700000,0,0,0,0,0Z");
});

it("area.curve(curveCardinal.tension(tension)) coerces the specified tension to a number", () => {
  const a = area().curve(curveCardinal.tension("0.1"));
  assert.strictEqual(a([]), null);
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z");
  assertPathEqual(a([[0, 1], [1, 3]]), "M0,1L1,3L1,0L0,0Z");
  assertPathEqual(a([[0, 1], [1, 3], [2, 1]]), "M0,1C0,1,0.700000,3,1,3C1.300000,3,2,1,2,1L2,0C2,0,1.300000,0,1,0C0.700000,0,0,0,0,0Z");
  assertPathEqual(a([[0, 1], [1, 3], [2, 1], [3, 3]]), "M0,1C0,1,0.700000,3,1,3C1.300000,3,1.700000,1,2,1C2.300000,1,3,3,3,3L3,0C3,0,2.300000,0,2,0C1.700000,0,1.300000,0,1,0C0.700000,0,0,0,0,0Z");
});

it("area.lineX0() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const x0 = function() {};
  const x1 = function() {};
  const y = function() {};
  const a = area().defined(defined).curve(curve).context(context).y(y).x0(x0).x1(x1);
  const l = a.lineX0();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.x(), x0);
  assert.strictEqual(l.y(), y);
});

it("area.lineX1() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const x0 = function() {};
  const x1 = function() {};
  const y = function() {};
  const a = area().defined(defined).curve(curve).context(context).y(y).x0(x0).x1(x1);
  const l = a.lineX1();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.x(), x1);
  assert.strictEqual(l.y(), y);
});

it("area.lineY0() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const x = function() {};
  const y0 = function() {};
  const y1 = function() {};
  const a = area().defined(defined).curve(curve).context(context).x(x).y0(y0).y1(y1);
  const l = a.lineY0();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.x(), x);
  assert.strictEqual(l.y(), y0);
});

it("area.lineY1() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const x = function() {};
  const y0 = function() {};
  const y1 = function() {};
  const a = area().defined(defined).curve(curve).context(context).x(x).y0(y0).y1(y1);
  const l = a.lineY1();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.x(), x);
  assert.strictEqual(l.y(), y1);
});
import assert from "assert";
import {areaRadial, curveCardinal, curveLinear} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("areaRadial() returns a default radial area shape", () => {
  const a = areaRadial();
  assert.strictEqual(a.startAngle()([42, 34]), 42);
  assert.strictEqual(a.endAngle(), null);
  assert.strictEqual(a.innerRadius()([42, 34]), 0);
  assert.strictEqual(a.outerRadius()([42, 34]), 34);
  assert.strictEqual(a.defined()([42, 34]), true);
  assert.strictEqual(a.curve(), curveLinear);
  assert.strictEqual(a.context(), null);
  assertPathEqual(a([[0, 1], [2, 3], [4, 5]]), "M0,-1L2.727892,1.248441L-3.784012,3.268218L0,0L0,0L0,0Z");
});

it("areaRadial.lineStartAngle() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const startAngle = function() {};
  const endAngle = function() {};
  const radius = function() {};
  const a = areaRadial().defined(defined).curve(curve).context(context).radius(radius).startAngle(startAngle).endAngle(endAngle);
  const l = a.lineStartAngle();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.angle(), startAngle);
  assert.strictEqual(l.radius(), radius);
});

it("areaRadial.lineEndAngle() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const startAngle = function() {};
  const endAngle = function() {};
  const radius = function() {};
  const a = areaRadial().defined(defined).curve(curve).context(context).radius(radius).startAngle(startAngle).endAngle(endAngle);
  const l = a.lineEndAngle();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.angle(), endAngle);
  assert.strictEqual(l.radius(), radius);
});

it("areaRadial.lineInnerRadius() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const angle = function() {};
  const innerRadius = function() {};
  const outerRadius = function() {};
  const a = areaRadial().defined(defined).curve(curve).context(context).angle(angle).innerRadius(innerRadius).outerRadius(outerRadius);
  const l = a.lineInnerRadius();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.angle(), angle);
  assert.strictEqual(l.radius(), innerRadius);
});

it("areaRadial.lineOuterRadius() returns a line derived from the area", () => {
  const defined = function() { return true; };
  const curve = curveCardinal;
  const context = {};
  const angle = function() {};
  const innerRadius = function() {};
  const outerRadius = function() {};
  const a = areaRadial().defined(defined).curve(curve).context(context).angle(angle).innerRadius(innerRadius).outerRadius(outerRadius);
  const l = a.lineOuterRadius();
  assert.strictEqual(l.defined(), defined);
  assert.strictEqual(l.curve(), curve);
  assert.strictEqual(l.context(), context);
  assert.strictEqual(l.angle(), angle);
  assert.strictEqual(l.radius(), outerRadius);
});
import assert from "assert";

export function assertPathEqual(actual, expected) {
  assert.strictEqual(normalizePath(actual + ""), normalizePath(expected + ""));
}

const reNumber = /[-+]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][-]?\d+)?/g;

function normalizePath(path) {
  return path.replace(reNumber, formatNumber);
}

function formatNumber(s) {
  return Math.abs((s = +s) - Math.round(s)) < 1e-6 ? Math.round(s) : s.toFixed(6);
}

export function assertInDelta(actual, expected, delta) {
  delta = delta || 1e-6;
  assert(inDelta(actual, expected, delta),
    `${actual} should be within ${delta} of ${expected}`);
}

function inDelta(actual, expected, delta) {
  return (Array.isArray(expected) ? inDeltaArray
      : typeof expected === "object" ? inDeltaObject
      : inDeltaNumber)(actual, expected, delta);
}

function inDeltaArray(actual, expected, delta) {
  let n = expected.length, i = -1;
  if (actual.length !== n) return false;
  while (++i < n) if (!inDelta(actual[i], expected[i], delta)) return false;
  return true;
}

function inDeltaObject(actual, expected, delta) {
  for (let i in expected) if (!inDelta(actual[i], expected[i], delta)) return false;
  for (let i in actual) if (!(i in expected)) return false;
  return true;
}

function inDeltaNumber(actual, expected, delta) {
  return actual >= expected - delta && actual <= expected + delta;
}
import assert from "assert";
import {line, curveLinear, curveLinearClosed} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("line() returns a default line shape", () => {
  const l = line();
  assert.strictEqual(l.x()([42, 34]), 42);
  assert.strictEqual(l.y()([42, 34]), 34);
  assert.strictEqual(l.defined()([42, 34]), true);
  assert.strictEqual(l.curve(), curveLinear);
  assert.strictEqual(l.context(), null);
  assertPathEqual(l([[0, 1], [2, 3], [4, 5]]), "M0,1L2,3L4,5");
});

it("line(x, y) sets x and y", () => {
  const x = function() {}, y = function() {};
  assert.strictEqual(line(x).x(), x);
  assert.strictEqual(line(x, y).y(), y);
  assert.strictEqual(line(3, 2).x()("aa"), 3);
  assert.strictEqual(line(3, 2).y()("aa"), 2);
});

it("line.x(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  line().x(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("line.y(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  line().y(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("line.defined(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"], actual = [];
  line().defined(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("line.x(x)(data) observes the specified function", () => {
  const l = line().x(function(d) { return d.x; });
  assertPathEqual(l([{x: 0, 1: 1}, {x: 2, 1: 3}, {x: 4, 1: 5}]), "M0,1L2,3L4,5");
});

it("line.x(x)(data) observes the specified constant", () => {
  const l = line().x(0);
  assertPathEqual(l([{1: 1}, {1: 3}, {1: 5}]), "M0,1L0,3L0,5");
});

it("line.y(y)(data) observes the specified function", () => {
  const l = line().y(function(d) { return d.y; });
  assertPathEqual(l([{0: 0, y: 1}, {0: 2, y: 3}, {0: 4, y: 5}]), "M0,1L2,3L4,5");
});

it("line.y(y)(data) observes the specified constant", () => {
  const l = line().y(0);
  assertPathEqual(l([{0: 0}, {0: 2}, {0: 4}]), "M0,0L2,0L4,0");
});

it("line.curve(curve) sets the curve method", () => {
  const l = line().curve(curveLinearClosed);
  assert.strictEqual(l([]), null);
  assertPathEqual(l([[0, 1], [2, 3]]), "M0,1L2,3Z");
});
import assert from "assert";
import {curveLinear, lineRadial} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("lineRadial() returns a default radial line shape", () => {
  const l = lineRadial();
  assert.strictEqual(l.angle()([42, 34]), 42);
  assert.strictEqual(l.radius()([42, 34]), 34);
  assert.strictEqual(l.defined()([42, 34]), true);
  assert.strictEqual(l.curve(), curveLinear);
  assert.strictEqual(l.context(), null);
  assertPathEqual(l([[0, 1], [2, 3], [4, 5]]), "M0,-1L2.727892,1.248441L-3.784012,3.268218");
});
import assert from "assert";
import {path} from "d3-path";
import {link, linkHorizontal, linkVertical} from "../src/index.js";
import {curveLinear, curveBumpX, curveBumpY} from "../src/index.js";
import {assertPathEqual} from "./asserts.js";

it("link(curve) returns a default link with the given curve", () => {
  const l = link(curveLinear);
  assert.strictEqual(l.source()({source: 42}), 42);
  assert.strictEqual(l.target()({target: 34}), 34);
  assert.strictEqual(l.x()([42, 34]), 42);
  assert.strictEqual(l.y()([42, 34]), 34);
  assert.strictEqual(l.context(), null);
  assertPathEqual(l({source: [0, 1], target: [2, 3]}), "M0,1L2,3");
});

it("link.source(source) sets source", () => {
  const l = link(curveLinear);
  const x = d => d.x;
  assert.strictEqual(l.source(x), l);
  assert.strictEqual(l.source(), x);
  assertPathEqual(l({x: [0, 1], target: [2, 3]}), "M0,1L2,3");
});

it("link.target(target) sets target", () => {
  const l = link(curveLinear);
  const x = d => d.x;
  assert.strictEqual(l.target(x), l);
  assert.strictEqual(l.target(), x);
  assertPathEqual(l({source: [0, 1], x: [2, 3]}), "M0,1L2,3");
});

it("link.source(f)(..args) passes arguments to the specified function f", () => {
  const source = {name: "source"};
  const target = {name: "target"};
  const data = {source, target};
  const extra = {name: "extra"};
  const actual = [];
  link(curveLinear).source(function(d) { actual.push([].slice.call(arguments)); return d; })(data, extra);
  assert.deepStrictEqual(actual, [[data, extra]]);
});

it("link.target(f)(..args) passes source and arguments to the specified function f", () => {
  const source = {name: "source"};
  const target = {name: "target"};
  const data = {source, target};
  const extra = {name: "extra"};
  const actual = [];
  link(curveLinear).target(function(d) { actual.push([].slice.call(arguments)); return d; })(data, extra);
  assert.deepStrictEqual(actual, [[data, extra]]);
});

it("link.x(x) sets x", () => {
  const l = link(curveLinear);
  const x = d => d.x;
  assert.strictEqual(l.x(x), l);
  assert.strictEqual(l.x(), x);
  assertPathEqual(l({source: {x: 0, 1: 1}, target: {x: 2, 1: 3}}), "M0,1L2,3");
});

it("link.y(y) sets y", () => {
  const l = link(curveLinear);
  const y = d => d.y;
  assert.strictEqual(l.y(y), l);
  assert.strictEqual(l.y(), y);
  assertPathEqual(l({source: {0: 0, y: 1}, target: {0: 2, y: 3}}), "M0,1L2,3");
});

it("link.x(f)(..args) passes source and arguments to the specified function f", () => {
  const source = {name: "source"};
  const target = {name: "target"};
  const data = {source, target};
  const extra = {name: "extra"};
  const actual = [];
  link(curveLinear).x(function() { actual.push([].slice.call(arguments)); })(data, extra);
  assert.deepStrictEqual(actual, [[source, extra], [target, extra]]);
});

it("link.y(f)(..args) passes source and arguments to the specified function f", () => {
  const source = {name: "source"};
  const target = {name: "target"};
  const data = {source, target};
  const extra = {name: "extra"};
  const actual = [];
  link(curveLinear).y(function() { actual.push([].slice.call(arguments)); })(data, extra);
  assert.deepStrictEqual(actual, [[source, extra], [target, extra]]);
});

it("linkHorizontal() is an alias for link(curveBumpX)", () => {
  const l = linkHorizontal(), l2 = link(curveBumpX);
  assert.strictEqual(l.source(), l2.source());
  assert.strictEqual(l.target(), l2.target());
  assert.strictEqual(l.x(), l2.x());
  assert.strictEqual(l.y(), l2.y());
  assert.strictEqual(l.context(), l2.context());
  assertPathEqual(l({source: [0, 1], target: [2, 3]}), l2({source: [0, 1], target: [2, 3]}));
});

it("linkVertical() is an alias for link(curveBumpY)", () => {
  const l = linkVertical(), l2 = link(curveBumpY);
  assert.strictEqual(l.source(), l2.source());
  assert.strictEqual(l.target(), l2.target());
  assert.strictEqual(l.x(), l2.x());
  assert.strictEqual(l.y(), l2.y());
  assert.strictEqual(l.context(), l2.context());
  assertPathEqual(l({source: [0, 1], target: [2, 3]}), l2({source: [0, 1], target: [2, 3]}));
});

it("link.context(context) sets the context", () => {
  const p = path();
  const l = link(curveLinear).context(p);
  assert.strictEqual(l({source: [0, 1], target: [2, 3]}), undefined);
  assertPathEqual(p, "M0,1L2,3");
});
/* eslint-disable no-loss-of-precision */
import assert from "assert";
import {pie} from "../src/index.js";

it("pie() returns a default pie shape", () => {
  const p = pie();
  assert.strictEqual(p.value()(42), 42);
  assert(p.sortValues()(1, 2) > 0);
  assert(p.sortValues()(2, 1) < 0);
  assert.strictEqual(p.sortValues()(1, 1), 0);
  assert.strictEqual(p.sort(), null);
  assert.strictEqual(p.startAngle()(), 0);
  assert.strictEqual(p.endAngle()(), 2 * Math.PI);
  assert.strictEqual(p.padAngle()(), 0);
});

it("pie(data) returns arcs in input order", () => {
  const p = pie();
  assert.deepStrictEqual(p([1, 3, 2]), [
    {data: 1, value: 1, index: 2, startAngle: 5.235987755982988, endAngle: 6.283185307179585, padAngle: 0},
    {data: 3, value: 3, index: 0, startAngle: 0.000000000000000, endAngle: 3.141592653589793, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 3.141592653589793, endAngle: 5.235987755982988, padAngle: 0}
  ]);
});

it("pie(data) accepts an iterable", () => {
  const p = pie();
  assert.deepStrictEqual(p(new Set([1, 3, 2])), [
    {data: 1, value: 1, index: 2, startAngle: 5.235987755982988, endAngle: 6.283185307179585, padAngle: 0},
    {data: 3, value: 3, index: 0, startAngle: 0.000000000000000, endAngle: 3.141592653589793, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 3.141592653589793, endAngle: 5.235987755982988, padAngle: 0}
  ]);
});

it("pie(data) coerces the specified value to a number", () => {
  const p = pie();
  const three = {valueOf: function() { return 3; }};
  assert.deepStrictEqual(p(["1", three, "2"]), [
    {data:   "1", value: 1, index: 2, startAngle: 5.235987755982988, endAngle: 6.283185307179585, padAngle: 0},
    {data: three, value: 3, index: 0, startAngle: 0.000000000000000, endAngle: 3.141592653589793, padAngle: 0},
    {data:   "2", value: 2, index: 1, startAngle: 3.141592653589793, endAngle: 5.235987755982988, padAngle: 0}
  ]);
});

it("pie(data) treats negative values as zero", () => {
  const p = pie();
  assert.deepStrictEqual(p([1, 0, -1]), [
    {data:  1, value:  1, index: 0, startAngle: 0.000000000000000, endAngle: 6.283185307179586, padAngle: 0},
    {data:  0, value:  0, index: 1, startAngle: 6.283185307179586, endAngle: 6.283185307179586, padAngle: 0},
    {data: -1, value: -1, index: 2, startAngle: 6.283185307179586, endAngle: 6.283185307179586, padAngle: 0}
  ]);
});

it("pie(data) treats NaN values as zero", () => {
  const p = pie();
  const actual = p([1, NaN, undefined]);
  const expected = [
    {data:         1, value:   1, index: 0, startAngle: 0.000000000000000, endAngle: 6.283185307179586, padAngle: 0},
    {data:       NaN, value: NaN, index: 1, startAngle: 6.283185307179586, endAngle: 6.283185307179586, padAngle: 0},
    {data: undefined, value: NaN, index: 2, startAngle: 6.283185307179586, endAngle: 6.283185307179586, padAngle: 0}
  ];
  assert(isNaN(actual[1].data));
  assert(isNaN(actual[1].value));
  assert(isNaN(actual[2].value));
  actual[1].data = actual[1].value = actual[2].value =
  expected[1].data = expected[1].value = expected[2].value = {}; // deepEqual NaN
  assert.deepStrictEqual(actual, expected);
});

it("pie(data) puts everything at the startAngle when the sum is zero", () => {
  const p = pie();
  assert.deepStrictEqual(p([0, 0]), [
    {data: 0, value: 0, index: 0, startAngle: 0, endAngle: 0, padAngle: 0},
    {data: 0, value: 0, index: 1, startAngle: 0, endAngle: 0, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.startAngle(1)([0, 0]), [
    {data: 0, value: 0, index: 0, startAngle: 1, endAngle: 1, padAngle: 0},
    {data: 0, value: 0, index: 1, startAngle: 1, endAngle: 1, padAngle: 0}
  ]);
});

it("pie(data) restricts |endAngle - startAngle| to τ", () => {
  const p = pie();
  assert.deepStrictEqual(p.startAngle(0).endAngle(7)([1, 2]), [
    {data: 1, value: 1, index: 1, startAngle: 4.1887902047863905, endAngle: 6.2831853071795860, padAngle: 0},
    {data: 2, value: 2, index: 0, startAngle: 0.0000000000000000, endAngle: 4.1887902047863905, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.startAngle(7).endAngle(0)([1, 2]), [
    {data: 1, value: 1, index: 1, startAngle: 2.8112097952136095, endAngle: 0.7168146928204142, padAngle: 0},
    {data: 2, value: 2, index: 0, startAngle: 7.0000000000000000, endAngle: 2.8112097952136095, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.startAngle(1).endAngle(8)([1, 2]), [
    {data: 1, value: 1, index: 1, startAngle: 5.1887902047863905, endAngle: 7.2831853071795860, padAngle: 0},
    {data: 2, value: 2, index: 0, startAngle: 1.0000000000000000, endAngle: 5.1887902047863905, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.startAngle(8).endAngle(1)([1, 2]), [
    {data: 1, value: 1, index: 1, startAngle: 3.8112097952136095, endAngle: 1.7168146928204142, padAngle: 0},
    {data: 2, value: 2, index: 0, startAngle: 8.0000000000000000, endAngle: 3.8112097952136095, padAngle: 0}
  ]);
});

it("pie.value(value)(data) observes the specified value function", () => {
  assert.deepStrictEqual(pie().value(function(d, i) { return i; })(new Array(3)), [
    {data: undefined, value: 0, index: 2, startAngle: 6.2831853071795860, endAngle: 6.2831853071795860, padAngle: 0},
    {data: undefined, value: 1, index: 1, startAngle: 4.1887902047863905, endAngle: 6.2831853071795860, padAngle: 0},
    {data: undefined, value: 2, index: 0, startAngle: 0.0000000000000000, endAngle: 4.1887902047863905, padAngle: 0}
  ]);
});

it("pie.value(f)(data) passes d, i and data to the specified function f", () => {
  const data = ["a", "b"];
  let actual = [];
  pie().value(function() { actual.push([].slice.call(arguments)); })(data);
  assert.deepStrictEqual(actual, [["a", 0, data], ["b", 1, data]]);
});

it("pie().startAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  pie().startAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("pie().startAngle(θ)(data) observes the specified start angle", () => {
  assert.deepStrictEqual(pie().startAngle(Math.PI)([1, 2, 3]), [
    {data: 1, value: 1, index: 2, startAngle: 5.759586531581287, endAngle: 6.283185307179586, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 4.712388980384690, endAngle: 5.759586531581287, padAngle: 0},
    {data: 3, value: 3, index: 0, startAngle: 3.141592653589793, endAngle: 4.712388980384690, padAngle: 0}
  ]);
});

it("pie().endAngle(θ)(data) observes the specified end angle", () => {
  assert.deepStrictEqual(pie().endAngle(Math.PI)([1, 2, 3]), [
    {data: 1, value: 1, index: 2, startAngle: 2.6179938779914940, endAngle: 3.1415926535897927, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 1.5707963267948966, endAngle: 2.6179938779914940, padAngle: 0},
    {data: 3, value: 3, index: 0, startAngle: 0.0000000000000000, endAngle: 1.5707963267948966, padAngle: 0}
  ]);
});

it("pie().padAngle(δ)(data) observes the specified pad angle", () => {
  assert.deepStrictEqual(pie().padAngle(0.1)([1, 2, 3]), [
    {data: 1, value: 1, index: 2, startAngle: 5.1859877559829880, endAngle: 6.2831853071795850, padAngle: 0.1},
    {data: 2, value: 2, index: 1, startAngle: 3.0915926535897933, endAngle: 5.1859877559829880, padAngle: 0.1},
    {data: 3, value: 3, index: 0, startAngle: 0.0000000000000000, endAngle: 3.0915926535897933, padAngle: 0.1}
  ]);
});

it("pie().endAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  pie().endAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("pie().padAngle(f)(…) propagates the context and arguments to the specified function f", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  pie().padAngle(function() { actual = {that: this, args: [].slice.call(arguments)}; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("pie().startAngle(θ₀).endAngle(θ₁).padAngle(δ)(data) restricts the pad angle to |θ₁ - θ₀| / data.length", () => {
  assert.deepStrictEqual(pie().startAngle(0).endAngle(Math.PI).padAngle(Infinity)([1, 2, 3]), [
    {data: 1, value: 1, index: 2, startAngle:  2.0943951023931953, endAngle:  3.1415926535897930, padAngle: 1.0471975511965976},
    {data: 2, value: 2, index: 1, startAngle:  1.0471975511965976, endAngle:  2.0943951023931953, padAngle: 1.0471975511965976},
    {data: 3, value: 3, index: 0, startAngle:  0.0000000000000000, endAngle:  1.0471975511965976, padAngle: 1.0471975511965976}
  ]);
  assert.deepStrictEqual(pie().startAngle(0).endAngle(-Math.PI).padAngle(Infinity)([1, 2, 3]), [
    {data: 1, value: 1, index: 2, startAngle: -2.0943951023931953, endAngle: -3.1415926535897930, padAngle: 1.0471975511965976},
    {data: 2, value: 2, index: 1, startAngle: -1.0471975511965976, endAngle: -2.0943951023931953, padAngle: 1.0471975511965976},
    {data: 3, value: 3, index: 0, startAngle:  0.0000000000000000, endAngle: -1.0471975511965976, padAngle: 1.0471975511965976}
  ]);
});

it("pie.sortValues(f) sorts arcs by value per the specified comparator function f", () => {
  const p = pie();
  assert.deepStrictEqual(p.sortValues(function(a, b) { return a - b; })([1, 3, 2]), [
    {data: 1, value: 1, index: 0, startAngle: 0.0000000000000000, endAngle: 1.0471975511965976, padAngle: 0},
    {data: 3, value: 3, index: 2, startAngle: 3.1415926535897930, endAngle: 6.2831853071795860, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 1.0471975511965976, endAngle: 3.1415926535897930, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.sortValues(function(a, b) { return b - a; })([1, 3, 2]), [
    {data: 1, value: 1, index: 2, startAngle: 5.2359877559829880, endAngle: 6.2831853071795850, padAngle: 0},
    {data: 3, value: 3, index: 0, startAngle: 0.0000000000000000, endAngle: 3.1415926535897930, padAngle: 0},
    {data: 2, value: 2, index: 1, startAngle: 3.1415926535897930, endAngle: 5.2359877559829880, padAngle: 0}
  ]);
  assert.strictEqual(p.sort(), null);
});

it("pie.sort(f) sorts arcs by data per the specified comparator function f", () => {
  const a = {valueOf: function() { return 1; }, name: "a"};
  const b = {valueOf: function() { return 2; }, name: "b"};
  const c = {valueOf: function() { return 3; }, name: "c"};
  const p = pie();
  assert.deepStrictEqual(p.sort(function(a, b) { return a.name.localeCompare(b.name); })([a, c, b]), [
    {data: a, value: 1, index: 0, startAngle: 0.0000000000000000, endAngle: 1.0471975511965976, padAngle: 0},
    {data: c, value: 3, index: 2, startAngle: 3.1415926535897930, endAngle: 6.2831853071795860, padAngle: 0},
    {data: b, value: 2, index: 1, startAngle: 1.0471975511965976, endAngle: 3.1415926535897930, padAngle: 0}
  ]);
  assert.deepStrictEqual(p.sort(function(a, b) { return b.name.localeCompare(a.name); })([a, c, b]), [
    {data: a, value: 1, index: 2, startAngle: 5.2359877559829880, endAngle: 6.2831853071795850, padAngle: 0},
    {data: c, value: 3, index: 0, startAngle: 0.0000000000000000, endAngle: 3.1415926535897930, padAngle: 0},
    {data: b, value: 2, index: 1, startAngle: 3.1415926535897930, endAngle: 5.2359877559829880, padAngle: 0}
  ]);
  assert.strictEqual(p.sortValues(), null);
});
import {polygonArea} from "d3-polygon";

export function polygonContext() {
  return {
    points: null,
    area() { return Math.abs(polygonArea(this.points)); },
    moveTo(x, y) { this.points = [[x, y]]; },
    lineTo(x, y) { this.points.push([x, y]); },
    rect(x, y, w, h) { this.points = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; },
    closePath() {}
  };
}
import assert from "assert";
import {stack, stackOffsetExpand, stackOffsetNone, stackOrderNone, stackOrderReverse} from "../src/index.js";

it("stack() has the expected defaults", () => {
  const s = stack();
  assert.deepStrictEqual(s.keys()(), []);
  assert.strictEqual(s.value()({foo: 42}, "foo"), 42);
  assert.strictEqual(s.order(), stackOrderNone);
  assert.strictEqual(s.offset(), stackOffsetNone);
});

it("stack(data) computes the stacked series for the given data", () => {
  const s = stack().keys([0, 1, 2, 3]);
  const data = [[1, 3, 5, 1], [2, 4, 2, 3], [1, 2, 4, 2]];
  assert.deepStrictEqual(s(data), [
    series([[0,  1], [0,  2], [0, 1]], data, 0, 0),
    series([[1,  4], [2,  6], [1, 3]], data, 1, 1),
    series([[4,  9], [6,  8], [3, 7]], data, 2, 2),
    series([[9, 10], [8, 11], [7, 9]], data, 3, 3)
  ]);
});

it("stack.keys(array) sets the array of constant keys", () => {
  const s = stack().keys(["0.0", "2.0", "4.0"]);
  assert.deepStrictEqual(s.keys()(), ["0.0", "2.0", "4.0"]);
});

it("stack.keys(function) sets the key accessor function", () => {
  const s = stack().keys(function() { return "abc".split(""); });
  assert.deepStrictEqual(s.keys()(), ["a", "b", "c"]);
});

it("stack(data, arguments…) passes the key accessor any additional arguments", () => {
  let A;
  let B;
  let k = function(data, a, b) { A = a, B = b; return Object.keys(data[0]); };
  let s = stack().keys(k);
  let data = [[1, 3, 5, 1], [2, 4, 2, 3], [1, 2, 4, 2]];
  assert.deepStrictEqual(s(data, "foo", "bar"), [
    series([[0,  1], [0,  2], [0, 1]], data, "0", 0),
    series([[1,  4], [2,  6], [1, 3]], data, "1", 1),
    series([[4,  9], [6,  8], [3, 7]], data, "2", 2),
    series([[9, 10], [8, 11], [7, 9]], data, "3", 3)
  ]);
  assert.strictEqual(A, "foo");
  assert.strictEqual(B, "bar");
});

it("stack.value(number) sets the constant value", () => {
  const s = stack().value("42.0");
  assert.strictEqual(s.value()(), 42);
});

it("stack.value(function) sets the value accessor function", () => {
  const v = function() { return 42; };
  const s = stack().value(v);
  assert.strictEqual(s.value(), v);
});

it("stack(data) passes the value accessor datum, key, index and data", () => {
  let actual;
  let v = function(d, k, i, data) { actual = {datum: d, key: k, index: i, data: data}; return 2; };
  let s = stack().keys(["foo"]).value(v);
  let data = [{foo: 1}];
  assert.deepStrictEqual(s(data), [series([[0, 2]], data, "foo", 0)]);
  assert.deepStrictEqual(actual, {datum: data[0], key: "foo", index: 0, data: data});
});

it("stack(data) coerces the return value of the value accessor to a number", () => {
  const v = function() { return "2.0"; };
  const s = stack().keys(["foo"]).value(v);
  const data = [{foo: 1}];
  assert.deepStrictEqual(s(data), [series([[0, 2]], data, "foo", 0)]);
});

it("stack.order(null) is equivalent to stack.order(stackOrderNone)", () => {
  const s = stack().order(null);
  assert.strictEqual(s.order(), stackOrderNone);
  assert.strictEqual(typeof s.order(), "function");
});

it("stack.order(function) sets the order function", () => {
  const s = stack().keys([0, 1, 2, 3]).order(stackOrderReverse);
  const data = [[1, 3, 5, 1], [2, 4, 2, 3], [1, 2, 4, 2]];
  assert.strictEqual(s.order(), stackOrderReverse);
  assert.deepStrictEqual(s(data), [
    series([[9, 10], [9, 11], [8, 9]], data, 0, 3),
    series([[6,  9], [5,  9], [6, 8]], data, 1, 2),
    series([[1,  6], [3,  5], [2, 6]], data, 2, 1),
    series([[0,  1], [0,  3], [0, 2]], data, 3, 0)
  ]);
});

it("stack.offset(null) is equivalent to stack.offset(stackOffsetNone)", () => {
  const s = stack().offset(null);
  assert.strictEqual(s.offset(), stackOffsetNone);
  assert.strictEqual(typeof s.offset(), "function");
});

it("stack.offset(function) sets the offset function", () => {
  const s = stack().keys([0, 1, 2, 3]).offset(stackOffsetExpand);
  const data = [[1, 3, 5, 1], [2, 4, 2, 3], [1, 2, 4, 2]];
  assert.strictEqual(s.offset(), stackOffsetExpand);
  assert.deepStrictEqual(s(data).map(roundSeries), [
    [[0 / 10,  1 / 10], [0 / 11,  2 / 11], [0 / 9, 1 / 9]],
    [[1 / 10,  4 / 10], [2 / 11,  6 / 11], [1 / 9, 3 / 9]],
    [[4 / 10,  9 / 10], [6 / 11,  8 / 11], [3 / 9, 7 / 9]],
    [[9 / 10, 10 / 10], [8 / 11, 11 / 11], [7 / 9, 9 / 9]]
  ].map(roundSeries));
});

function series(series, data, key, index) {
  data.forEach(function(d, i) { series[i].data = d; });
  series.key = key;
  series.index = index;
  return series;
}

function roundSeries(series) {
  return series.map(function(point) {
    return point.map(function(value) {
      return Math.round(value * 1e6) / 1e6;
    });
  });
}
import assert from "assert";
import {symbol, symbolAsterisk, symbolCircle, symbolCross, symbolDiamond, symbolDiamond2, symbolPlus, symbolSquare, symbolSquare2, symbolStar, symbolTriangle, symbolTriangle2, symbolWye, symbolX} from "../src/index.js";
import {assertInDelta, assertPathEqual} from "./asserts.js";
import {polygonContext} from "./polygonContext.js";

it("symbol() returns a default symbol shape", () => {
  const s = symbol();
  assert.strictEqual(s.type()(), symbolCircle);
  assert.strictEqual(s.size()(), 64);
  assert.strictEqual(s.context(), null);
  assertPathEqual(s(), "M4.513517,0A4.513517,4.513517,0,1,1,-4.513517,0A4.513517,4.513517,0,1,1,4.513517,0");
});

it("symbol().size(f)(…) propagates the context and arguments to the specified function", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  symbol().size(function() { actual = {that: this, args: [].slice.call(arguments)}; return 64; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("symbol().type(f)(…) propagates the context and arguments to the specified function", () => {
  const expected = {that: {}, args: [42]};
  let actual;
  symbol().type(function() { actual = {that: this, args: [].slice.call(arguments)}; return symbolCircle; }).apply(expected.that, expected.args);
  assert.deepStrictEqual(actual, expected);
});

it("symbol.size(size) observes the specified size function", () => {
  const size = function(d, i) { return d.z * 2 + i; },
      s = symbol().size(size);
  assert.strictEqual(s.size(), size);
  assertPathEqual(s({z: 0}, 0), "M0,0");
  assertPathEqual(s({z: Math.PI / 2}, 0), "M1,0A1,1,0,1,1,-1,0A1,1,0,1,1,1,0");
  assertPathEqual(s({z: 2 * Math.PI}, 0), "M2,0A2,2,0,1,1,-2,0A2,2,0,1,1,2,0");
  assertPathEqual(s({z: Math.PI}, 1), "M1.522600,0A1.522600,1.522600,0,1,1,-1.522600,0A1.522600,1.522600,0,1,1,1.522600,0");
  assertPathEqual(s({z: 4 * Math.PI}, 2), "M2.938813,0A2.938813,2.938813,0,1,1,-2.938813,0A2.938813,2.938813,0,1,1,2.938813,0");
});

it("symbol.size(size) observes the specified size constant", () => {
  const s = symbol();
  assert.strictEqual(s.size(42).size()(), 42);
  assertPathEqual(s.size(0)(), "M0,0");
  assertPathEqual(s.size(Math.PI)(), "M1,0A1,1,0,1,1,-1,0A1,1,0,1,1,1,0");
  assertPathEqual(s.size(4 * Math.PI)(), "M2,0A2,2,0,1,1,-2,0A2,2,0,1,1,2,0");
});

it("symbol.type(symbolAsterisk) generates the expected path", () => {
  const s = symbol().type(symbolAsterisk).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0M0,0L0,0M0,0L0,0");
  assertPathEqual(s(20), "M0,2.705108L0,-2.705108M-2.342692,-1.352554L2.342692,1.352554M-2.342692,1.352554L2.342692,-1.352554");
});

it("symbol.type(symbolCircle) generates the expected path", () => {
  const s = symbol().type(symbolCircle).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0");
  assertPathEqual(s(20), "M2.523133,0A2.523133,2.523133,0,1,1,-2.523133,0A2.523133,2.523133,0,1,1,2.523133,0");
});

it("symbol.type(symbolCross) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolCross).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolCross) generates the expected path", () => {
  const s = symbol().type(symbolCross).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(20), "M-3,-1L-1,-1L-1,-3L1,-3L1,-1L3,-1L3,1L1,1L1,3L-1,3L-1,1L-3,1Z");
});

it("symbol.type(symbolDiamond) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolDiamond).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolDiamond) generates the expected path", () => {
  const s = symbol().type(symbolDiamond).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(10), "M0,-2.942831L1.699044,0L0,2.942831L-1.699044,0Z");
});

it("symbol.type(symbolDiamond2) generates the expected path", () => {
  const s = symbol().type(symbolDiamond2).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(20), "M0,-2.800675L2.800675,0L0,2.800675L-2.800675,0Z");
});

it("symbol.type(symbolPlus) generates the expected path", () => {
  const s = symbol().type(symbolPlus).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0M0,0L0,0");
  assertPathEqual(s(20), "M-3.714814,0L3.714814,0M0,3.714814L0,-3.714814");
});

it("symbol.type(symbolStar) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolStar).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolStar) generates the expected path", () => {
  const s = symbol().type(symbolStar).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(10), "M0,-2.984649L0.670095,-0.922307L2.838570,-0.922307L1.084237,0.352290L1.754333,2.414632L0,1.140035L-1.754333,2.414632L-1.084237,0.352290L-2.838570,-0.922307L-0.670095,-0.922307Z");
});

it("symbol.type(symbolSquare) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolSquare).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolSquare) generates the expected path", () => {
  const s = symbol().type(symbolSquare).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0h0v0h0Z");
  assertPathEqual(s(4), "M-1,-1h2v2h-2Z");
  assertPathEqual(s(16), "M-2,-2h4v4h-4Z");
});

it("symbol.type(symbolSquare2) generates the expected path", () => {
  const s = symbol().type(symbolSquare2).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(20), "M1.981603,1.981603L1.981603,-1.981603L-1.981603,-1.981603L-1.981603,1.981603Z");
});

it("symbol.type(symbolTriangle) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolTriangle).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolTriangle) generates the expected path", () => {
  const s = symbol().type(symbolTriangle).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0Z");
  assertPathEqual(s(10), "M0,-2.774528L2.402811,1.387264L-2.402811,1.387264Z");
});

it("symbol.type(symbolTriangle2) generates the expected path", () => {
  const s = symbol().type(symbolTriangle2).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0Z");
  assertPathEqual(s(20), "M0,-3.051786L2.642924,1.525893L-2.642924,1.525893Z");
});

it("symbol.type(symbolWye) generates a polygon with the specified size", () => {
  const p = polygonContext(), s = symbol().type(symbolWye).context(p);
  s.size(1)(); assertInDelta(p.area(), 1);
  s.size(240)(); assertInDelta(p.area(), 240);
});

it("symbol.type(symbolWye) generates the expected path", () => {
  const s = symbol().type(symbolWye).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0L0,0Z");
  assertPathEqual(s(10), "M0.853360,0.492688L0.853360,2.199408L-0.853360,2.199408L-0.853360,0.492688L-2.331423,-0.360672L-1.478063,-1.838735L0,-0.985375L1.478063,-1.838735L2.331423,-0.360672Z");
});

it("symbol.type(symbolX) generates the expected path", () => {
  const s = symbol().type(symbolX).size(function(d) { return d; });
  assertPathEqual(s(0), "M0,0L0,0M0,0L0,0");
  assertPathEqual(s(20), "M-2.647561,-2.647561L2.647561,2.647561M-2.647561,2.647561L2.647561,-2.647561");
});

it("symbol(type, size) is equivalent to symbol().type(type).size(size)", () => {
  const s0 = symbol().type(symbolCross).size(16);
  const s1 = symbol(symbolCross, 16);
  assert.strictEqual(s0(), s1());
});
import assert from "assert";
import {symbols, symbolsFill, symbolsStroke, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle, symbolWye, symbolPlus, symbolX, symbolTriangle2, symbolAsterisk, symbolSquare2, symbolDiamond2} from "../src/index.js";

it("symbols is a deprecated alias for symbolsFill", () => {
  assert.strictEqual(symbols, symbolsFill);
});

it("symbolsFill is the array of symbol types", () => {
  assert.deepStrictEqual(symbolsFill, [
    symbolCircle,
    symbolCross,
    symbolDiamond,
    symbolSquare,
    symbolStar,
    symbolTriangle,
    symbolWye
  ]);
});

it("symbolsStroke is the array of symbol types", () => {
  assert.deepStrictEqual(symbolsStroke, [
    symbolCircle,
    symbolPlus,
    symbolX,
    symbolTriangle2,
    symbolAsterisk,
    symbolSquare2,
    symbolDiamond2
  ]);
});
