import { useQuery } from "@tanstack/react-query";

interface PublicSettings {
  termsUrl: string;
  privacyUrl: string;
}

const BASE_URL = `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`;

async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await fetch(`${BASE_URL}/api/settings/public`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json() as Promise<PublicSettings>;
}

export function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: ["settings", "public"],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
