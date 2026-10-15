export const PHONE_MESSAGE = "Sir, this is a phone.";

export function isPhoneLikeDevice(environment) {
  const mobileBrowser = Boolean(environment.mobileUserAgent)
    || /Android|iPhone|iPod|Mobile/i.test(environment.userAgent || "");
  const hasTouch = Boolean(environment.coarsePointer) || (environment.maxTouchPoints || 0) > 0;
  const smallestSide = Math.min(environment.viewportWidth || 0, environment.viewportHeight || 0);
  return mobileBrowser || (hasTouch && smallestSide > 0 && smallestSide <= 760);
}

export function getDiagnosticOutcome(phoneLike) {
  return phoneLike
    ? {
        lead: PHONE_MESSAGE,
        detail: "Your PC is probably in another room. It is, for the purposes of this page, on.",
      }
    : {
        lead: "",
        detail: "We did not inspect your computer. We simply believe in it.",
      };
}

export function getMonthStamp(date) {
  return String(date.getFullYear()) + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

export function isFreeCheckMarkedForThisMonth(storedStamp, date) {
  return storedStamp === getMonthStamp(date);
}