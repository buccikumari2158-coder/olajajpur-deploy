import { OneSignal } from "react-native-onesignal";

let _initialized = false;

/** Initialize OneSignal once and ask for notification permission. */
export function initOneSignal(): void {
  const appId = process.env["EXPO_PUBLIC_ONESIGNAL_APP_ID"];
  if (!appId || _initialized) return;
  try {
    OneSignal.initialize(appId);
    OneSignal.Notifications.requestPermission(true);
    _initialized = true;
  } catch (e) {
    console.warn("[OneSignal] init failed", e);
  }
}

/** Link this device to the logged-in user so the backend can target them. */
export function oneSignalLogin(userId: string): void {
  if (!userId) return;
  try {
    OneSignal.login(userId);
  } catch (e) {
    console.warn("[OneSignal] login failed", e);
  }
}

/** Unlink on logout. */
export function oneSignalLogout(): void {
  try {
    OneSignal.logout();
  } catch {
    /* ignore */
  }
}
