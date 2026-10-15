import assert from "node:assert/strict";
import test from "node:test";
import {
  PHONE_MESSAGE, getDiagnosticOutcome, getMonthStamp,
  isFreeCheckMarkedForThisMonth, isPhoneLikeDevice,
} from "../src/logic.js";

test("a touch phone-sized viewport gets the playful phone result", () => {
  assert.equal(isPhoneLikeDevice({
    viewportWidth: 390, viewportHeight: 844, coarsePointer: true, maxTouchPoints: 5,
  }), true);
  assert.equal(getDiagnosticOutcome(true).lead, PHONE_MESSAGE);
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
test("monthly marker follows the local calendar month", () => {
  const january = new Date(2026, 0, 31, 23, 59);
  const february = new Date(2026, 1, 1, 0, 0);
  assert.equal(getMonthStamp(january), "2026-01");
  assert.equal(getMonthStamp(february), "2026-02");
  assert.equal(isFreeCheckMarkedForThisMonth("2026-01", january), true);
  assert.equal(isFreeCheckMarkedForThisMonth("2026-01", february), false);
});