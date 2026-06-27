import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = `https://${process.env["EXPO_PUBLIC_DOMAIN"] ?? ""}`;

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  base64?: string | null;
};

/**
 * Open the device library and pick a single square-cropped image.
 * Returns null if the user cancels or denies permission.
 * Requests base64 data directly from the picker to avoid needing expo-file-system.
 */
export async function pickImage(): Promise<PickedImage | null> {
  if (Platform.OS !== "web") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
    fileName: asset.fileName ?? `image-${Date.now()}.jpg`,
    base64: asset.base64 ?? null,
  };
}

/**
 * Convert any URI (data:, blob:, https:) to a base64 string — web only fallback.
 */
async function uriToBase64Web(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    return uri.split(",")[1] ?? "";
  }
  const blob = await fetch(uri).then((r) => r.blob());
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = (reader.result as string) ?? "";
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a picked image to the backend and return the public HTTPS URL.
 */
export async function uploadImage(image: PickedImage, folder = "profile"): Promise<string> {
  const token = await AsyncStorage.getItem("auth_token");
  if (!token) throw new Error("Not authenticated — please log in again.");

  // Prefer base64 from picker; fall back to fetching URI on web
  let base64 = image.base64;

  if (!base64) {
    if (Platform.OS === "web") {
      base64 = await uriToBase64Web(image.uri);
    } else {
      // Native: fetch file:// URI as blob then convert via FileReader (built-in to RN)
      const blob = await fetch(image.uri).then((r) => r.blob());
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = (reader.result as string) ?? "";
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  }

  if (!base64) throw new Error("Could not read image data.");

  const res = await fetch(`${API_BASE}/api/uploads/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      base64,
      mimeType: image.mimeType,
      folder,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as { url: string };
  if (!json.url) throw new Error("Upload succeeded but no URL returned.");
  return json.url;
}
