export interface DeviceEnvironment {
  mobileUserAgent?: boolean;
  userAgent?: string;
  coarsePointer?: boolean;
  maxTouchPoints?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}
export interface DiagnosticOutcome { lead: string; detail: string; }
export const PHONE_MESSAGE: string;
export function isPhoneLikeDevice(environment: DeviceEnvironment): boolean;
export function getDiagnosticOutcome(phoneLike: boolean): DiagnosticOutcome;
export function getMonthStamp(date: Date): string;
export function isFreeCheckMarkedForThisMonth(storedStamp: string | null, date: Date): boolean;