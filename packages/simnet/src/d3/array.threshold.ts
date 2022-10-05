import count from "../count.js";
import quantile from "../quantile.js";

export default function thresholdFreedmanDiaconis(values, min, max) {
  return Math.ceil((max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(count(values), -1 / 3)));
}
import count from "../count.js";
import deviation from "../deviation.js";

export default function thresholdScott(values, min, max) {
  return Math.ceil((max - min) * Math.cbrt(count(values)) / (3.49 * deviation(values)));
}
import count from "../count.js";

export default function thresholdSturges(values) {
  return Math.ceil(Math.log(count(values)) / Math.LN2) + 1;
}
