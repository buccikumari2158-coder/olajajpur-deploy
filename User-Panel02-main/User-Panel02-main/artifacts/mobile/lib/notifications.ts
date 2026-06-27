import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission denied");
    return null;
  }

  try {
    // EAS project ID is injected into app config under extra.eas.projectId by
    // `eas init`/`eas build`. Fall back to an env override for flexibility.
    const projectId =
      (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
        ?.eas?.projectId ?? process.env["EXPO_PUBLIC_PROJECT_ID"];
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    console.log("[Push] Expo push token:", tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.error("[Push] Failed to get push token:", err);
    return null;
  }
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
