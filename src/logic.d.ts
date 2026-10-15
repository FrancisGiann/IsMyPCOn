export interface DeviceEnvironment {
  mobileUserAgent?: boolean;
  userAgent?: string;
  coarsePointer?: boolean;
  maxTouchPoints?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}
export function isPhoneLikeDevice(environment: DeviceEnvironment): boolean;
