import { logger } from "./logger";

const ONESIGNAL_API = "https://api.onesignal.com/notifications";

/**
 * Broadcast or target a push via OneSignal. Give `externalIds` to target
 * specific users (their app userId = OneSignal external_id) or omit for a
 * broadcast to a segment. No-ops if env vars aren't configured.
 */
export async function sendOneSignal(opts: {
  externalIds?: string[];
  segments?: string[];
  heading: string;
  content: string;
  imageUrl?: string | null;
  data?: Record<string, unknown>;
}): Promise<{ ok: boolean; recipients?: number; error?: string }> {
  const appId = process.env["ONESIGNAL_APP_ID"];
  const apiKey = process.env["ONESIGNAL_REST_API_KEY"];
  if (!appId || !apiKey) return { ok: false, error: "OneSignal not configured" };

  const ids = (opts.externalIds ?? []).filter(Boolean);
  const target =
    ids.length > 0
      ? { include_aliases: { external_id: ids }, target_channel: "push" as const }
      : { included_segments: opts.segments ?? ["Subscribed Users"] };

  try {
    const res = await fetch(ONESIGNAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        headings: { en: opts.heading },
        contents: { en: opts.content },
        ...(opts.imageUrl ? { big_picture: opts.imageUrl, ios_attachments: { id1: opts.imageUrl } } : {}),
        ...(opts.data ? { data: opts.data } : {}),
        ...target,
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      logger.warn({ status: res.status, body }, "OneSignal send failed");
      return { ok: false, error: body?.errors?.[0] ?? `HTTP ${res.status}` };
    }
    return { ok: true, recipients: body?.recipients ?? 0 };
  } catch (err) {
    logger.error({ err }, "OneSignal send error");
    return { ok: false, error: "network error" };
  }
}
