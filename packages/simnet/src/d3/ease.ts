var overshoot = 1.70158;

export var backIn = (function custom(s) {
  s = +s;

  function backIn(t) {
    return (t = +t) * t * (s * (t - 1) + t);
  }

  backIn.overshoot = custom;

  return backIn;
})(overshoot);

export var backOut = (function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((t + 1) * s + t) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
})(overshoot);

export var backInOut = (function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
})(overshoot);
var b1 = 4 / 11,
    b2 = 6 / 11,
    b3 = 8 / 11,
    b4 = 3 / 4,
    b5 = 9 / 11,
    b6 = 10 / 11,
    b7 = 15 / 16,
    b8 = 21 / 22,
    b9 = 63 / 64,
    b0 = 1 / b1 / b1;

export function bounceIn(t) {
  return 1 - bounceOut(1 - t);
}

export function bounceOut(t) {
  return (t = +t) < b1 ? b0 * t * t : t < b3 ? b0 * (t -= b2) * t + b4 : t < b6 ? b0 * (t -= b5) * t + b7 : b0 * (t -= b8) * t + b9;
}

export function bounceInOut(t) {
  return ((t *= 2) <= 1 ? 1 - bounceOut(1 - t) : bounceOut(t - 1) + 1) / 2;
}
export function circleIn(t) {
  return 1 - Math.sqrt(1 - t * t);
}

export function circleOut(t) {
  return Math.sqrt(1 - --t * t);
}

export function circleInOut(t) {
  return ((t *= 2) <= 1 ? 1 - Math.sqrt(1 - t * t) : Math.sqrt(1 - (t -= 2) * t) + 1) / 2;
}
export function cubicIn(t) {
  return t * t * t;
}

export function cubicOut(t) {
  return --t * t * t + 1;
}

export function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
import {tpmt} from "./math.js";

var tau = 2 * Math.PI,
    amplitude = 1,
    period = 0.3;

export var elasticIn = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * tpmt(-(--t)) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function(a) { return custom(a, p * tau); };
  elasticIn.period = function(p) { return custom(a, p); };

  return elasticIn;
})(amplitude, period);

export var elasticOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * tpmt(t = +t) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticOut.period = function(p) { return custom(a, p); };

  return elasticOut;
})(amplitude, period);

export var elasticInOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0
        ? a * tpmt(-t) * Math.sin((s - t) / p)
        : 2 - a * tpmt(t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticInOut.period = function(p) { return custom(a, p); };

  return elasticInOut;
})(amplitude, period);
import {tpmt} from "./math.js";

export function expIn(t) {
  return tpmt(1 - +t);
}

export function expOut(t) {
  return 1 - tpmt(t);
}

export function expInOut(t) {
  return ((t *= 2) <= 1 ? tpmt(1 - t) : 2 - tpmt(t - 1)) / 2;
}
export {
  linear as easeLinear
} from "./linear.js";

export {
  quadInOut as easeQuad,
  quadIn as easeQuadIn,
  quadOut as easeQuadOut,
  quadInOut as easeQuadInOut
} from "./quad.js";

export {
  cubicInOut as easeCubic,
  cubicIn as easeCubicIn,
  cubicOut as easeCubicOut,
  cubicInOut as easeCubicInOut
} from "./cubic.js";

export {
  polyInOut as easePoly,
  polyIn as easePolyIn,
  polyOut as easePolyOut,
  polyInOut as easePolyInOut
} from "./poly.js";

export {
  sinInOut as easeSin,
  sinIn as easeSinIn,
  sinOut as easeSinOut,
  sinInOut as easeSinInOut
} from "./sin.js";

export {
  expInOut as easeExp,
  expIn as easeExpIn,
  expOut as easeExpOut,
  expInOut as easeExpInOut
} from "./exp.js";

export {
  circleInOut as easeCircle,
  circleIn as easeCircleIn,
  circleOut as easeCircleOut,
  circleInOut as easeCircleInOut
} from "./circle.js";

export {
  bounceOut as easeBounce,
  bounceIn as easeBounceIn,
  bounceOut as easeBounceOut,
  bounceInOut as easeBounceInOut
} from "./bounce.js";

export {
  backInOut as easeBack,
  backIn as easeBackIn,
  backOut as easeBackOut,
  backInOut as easeBackInOut
} from "./back.js";

export {
  elasticOut as easeElastic,
  elasticIn as easeElasticIn,
  elasticOut as easeElasticOut,
  elasticInOut as easeElasticInOut
} from "./elastic.js";
export const linear = t => +t;
// tpmt is two power minus ten times t scaled to [0,1]
export function tpmt(x) {
  return (Math.pow(2, -10 * x) - 0.0009765625) * 1.0009775171065494;
}
var exponent = 3;

export var polyIn = (function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
})(exponent);

export var polyOut = (function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
})(exponent);

export var polyInOut = (function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
})(exponent);
export function quadIn(t) {
  return t * t;
}

export function quadOut(t) {
  return t * (2 - t);
}

export function quadInOut(t) {
  return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}
var pi = Math.PI,
    halfPi = pi / 2;

export function sinIn(t) {
  return (+t === 1) ? 1 : 1 - Math.cos(t * halfPi);
}

export function sinOut(t) {
  return Math.sin(t * halfPi);
}

export function sinInOut(t) {
  return (1 - Math.cos(pi * t)) / 2;
}
