import assert from "node:assert/strict";
import test from "node:test";
import { isPhoneLikeDevice } from "../src/logic.js";

test("a touch phone-sized viewport is recognized as mobile", () => {
  assert.equal(isPhoneLikeDevice({
    viewportWidth: 390, viewportHeight: 844, coarsePointer: true, maxTouchPoints: 5,
  }), true);
});
test("a narrow desktop browser without a mobile signal is not called a phone", () => {
  assert.equal(isPhoneLikeDevice({
    viewportWidth: 390, viewportHeight: 844, coarsePointer: false,
    maxTouchPoints: 0, userAgent: "Desktop Chrome",
  }), false);
});
test("a mobile browser stays recognized when rotated to landscape", () => {
  assert.equal(isPhoneLikeDevice({
    viewportWidth: 844, viewportHeight: 390,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile",
  }), true);
});
test("large touch displays are not mistaken for phones", () => {
  assert.equal(isPhoneLikeDevice({
    viewportWidth: 1366, viewportHeight: 900, coarsePointer: true, maxTouchPoints: 10,
  }), false);
});
