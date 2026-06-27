import { Platform } from "react-native";

/**
 * Convert any URI (file://, blob:, data:, https:) to a base64 string.
 * Works on both native React Native and web.
 */
async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    return uri.split(",")[1] ?? "";
  }
  // fetch works with file:// URIs on native RN and blob:/https: on web
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
 * Upload an image from a local URI to the backend.
 * Returns the public HTTPS URL.
 */
export async function uploadImage(
  uri: string,
  folder: "documents" | "photos" | "vehicles",
  token: string
): Promise<string> {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
  const baseUrl = domain ? `https://${domain}` : "";

  const filename = uri.split("/").pop() ?? "image.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const base64 = await uriToBase64(uri);

  const response = await fetch(`${baseUrl}/api/uploads/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ base64, mimeType, folder }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Upload failed");
    throw new Error(text || "Image upload failed");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}
