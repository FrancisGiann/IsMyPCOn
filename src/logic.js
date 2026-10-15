export function isPhoneLikeDevice(environment) {
  const mobileBrowser = Boolean(environment.mobileUserAgent)
    || /Android|iPhone|iPod|Mobile/i.test(environment.userAgent || "");
  const hasTouch = Boolean(environment.coarsePointer) || (environment.maxTouchPoints || 0) > 0;
  const smallestSide = Math.min(environment.viewportWidth || 0, environment.viewportHeight || 0);
  return mobileBrowser || (hasTouch && smallestSide > 0 && smallestSide <= 760);
}
