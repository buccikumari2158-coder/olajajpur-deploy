import { logger } from "./logger";

const ONESIGNAL_API = "https://api.onesignal.com/notifications";

/**
 * Send a push via OneSignal. Target specific users by their app userId
 * (registered as the OneSignal external_id on the device), or broadcast to a
 * segment when no ids are given. No-ops if env vars aren't configured.
 */
export async function sendOneSignal(opts: {
  externalIds?: string[];
  segments?: string[];
  heading: string;
  content: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const appId = process.env["ONESIGNAL_APP_ID"];
  const apiKey = process.env["ONESIGNAL_REST_API_KEY"];
  if (!appId || !apiKey) return;

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
        ...(opts.data ? { data: opts.data } : {}),
        ...target,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      logger.warn({ status: res.status, body: t.slice(0, 300) }, "OneSignal send failed");
    }
  } catch (err) {
    logger.error({ err }, "OneSignal send error");
  }
}
